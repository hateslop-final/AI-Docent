"""
Tavily 검색 서비스 - DB에 없는 정보를 Tavily API로 검색하여 답변 생성
RAG 우선 + 부족하면 Tavily로 보강하는 패턴
"""

import os
from typing import Optional, Dict, List, Tuple
from pathlib import Path
import openai
import requests
from app.core.config import settings

def should_use_tavily(question: str, artwork: Dict) -> Tuple[bool, str]:
    """
    LLM을 사용하여 Tavily 검색이 필요한지 판별하는 게이트 함수
    
    Returns:
        (should_search: bool, reason: str)
        - should_search: True면 Tavily 검색 허용, False면 금지
        - reason: 판별 이유
    """
    if not artwork:
        return False, "작품 정보가 없습니다."
    
    artist_name = artwork.get("artist", "").strip()
    artwork_title = artwork.get("title", "").strip()
    
    # 작품 정보 요약
    artwork_info = f"작품명: {artwork_title}\n작가: {artist_name}"
    if artwork.get("description"):
        artwork_info += f"\n설명: {artwork.get('description')[:200]}"
    
    api_key = settings.OPENAI_API_KEY
    model = settings.OPENAI_MODEL
    client = openai.OpenAI(api_key=api_key)
    
    prompt = f"""당신은 사용자의 질문이 현재 작품과 관련이 있는지 판별하는 시스템입니다.

현재 작품 정보:
{artwork_info}

사용자 질문:
{question}

[판별 규칙]
1. Tavily 검색 허용 조건:
   - 사용자가 현재 작품/작가와 직접 관련된 확장 질문을 한 경우
   - 예: "이 작가의 다른 대표작은?", "이 작가가 활동하던 시대는?", "이 작품이 속한 미술 운동은?"
   - 예: "이 작가의 생애는?", "이 작가의 스타일은?"
   - 질문에 "이 작가", "이 작품", "이것" 같은 표현이 있거나, 현재 작가명/작품명이 언급된 경우

2. Tavily 검색 금지 조건:
   - 현재 선택된 작품/작가와 무관한 완전 다른 대상에 대한 질문
   - 예: "앤디 워홀 알려줘" (현재 작가가 워홀이 아닌 경우)
   - 예: "피카소의 작품은?" (현재 작가가 피카소가 아닌 경우)
   - 현재 작품과 전혀 관련 없는 주제에 대한 질문

[응답 형식]
다음 형식으로만 답변해주세요:
- 검색 허용: "ALLOW: [이유]"
- 검색 금지: "DENY: [이유]"

답변:"""
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "당신은 질문의 관련성을 판별하는 시스템입니다. 정확하고 간결하게 판별하세요."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=150
    )
    
    answer = response.choices[0].message.content.strip()
    
    # 응답 파싱
    if answer.startswith("ALLOW:"):
        reason = answer.replace("ALLOW:", "").strip()
        print(f"[Tavily Gate] ✅ 검색 허용 - 이유: {reason}")
        return True, reason
    elif answer.startswith("DENY:"):
        reason = answer.replace("DENY:", "").strip()
        print(f"[Tavily Gate] ❌ 검색 금지 - 이유: {reason}")
        return False, reason
    else:
        # 형식이 맞지 않으면 기본적으로 거부
        return False, "질문 형식 판별 실패"
            



def search_with_tavily(query: str, max_results: int = 5) -> Optional[List[Dict]]:
    """
    Tavily API를 사용하여 검색 수행
    
    Args:
        query: 검색 쿼리
        max_results: 최대 결과 수
    
    Returns:
        검색 결과 리스트 또는 None
    """
    api_key = settings.TAVILY_API_KEY
    print(f"[Tavily Search] ✅ TAVILY_API_KEY 확인됨")
    
    url = "https://api.tavily.com/search"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "api_key": api_key,
        "query": query,
        "max_results": max_results,
        "search_depth": "advanced"
    }
    

    response = requests.post(url, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    data = response.json()
    
    # Tavily 응답에서 결과 추출
    results = data.get("results", [])
    if results:
        for i, result in enumerate(results[:3], 1):  # 처음 3개만 로그
            title = result.get("title", "제목 없음")
            print(f"[Tavily Search]   결과 {i}: {title[:60]}...")
    return results



def build_tavily_context(search_results: List[Dict]) -> str:
    """
    Tavily 검색 결과를 컨텍스트 텍스트로 변환
    """
    if not search_results:
        return ""
    
    context_parts = []
    for i, result in enumerate(search_results, 1):
        title = result.get("title", "")
        content = result.get("content", "")
        url = result.get("url", "")
        
        context_parts.append(f"[검색 결과 {i}]")
        if title:
            context_parts.append(f"제목: {title}")
        if content:
            context_parts.append(f"내용: {content}")
        if url:
            context_parts.append(f"출처: {url}")
        context_parts.append("")  # 빈 줄
    
    return "\n".join(context_parts)


def generate_answer_with_tavily(
    artwork_context: str,
    question: str,
    tavily_context: str,
    age_group_str: str,
    expertise_level_str: str
) -> str:
    """
    Tavily 검색 결과를 포함하여 LLM으로 답변 생성
    """
    from app.services.chat.rag_service import AgeGroup, ExpertiseLevel
    
    age_group = AgeGroup(age_group_str)
    expertise = ExpertiseLevel(expertise_level_str)
    
    api_key = settings.OPENAI_API_KEY
    model = settings.OPENAI_MODEL
    client = openai.OpenAI(api_key=api_key)
    
    # 나이대별 톤 설정
    tone_map = {
        AgeGroup.TEEN: "현대적이고 흥미롭게, 친근하면서도 정중하게",
        AgeGroup.ADULT: "정중하고 전문적으로, 깊이 있게"
    }
    
    # 전문성 수준별 용어 난이도
    terminology_map = {
        ExpertiseLevel.LIGHT: "일상적인 용어를 사용하고, 미술 전문 용어는 거의 사용하지 않으며 사용할 경우 쉬운 말로 설명",
        ExpertiseLevel.MEDIUM: "기본 미술 용어(구도, 설치, 모더니즘 등)는 사용 가능하며, 필요시 간단히 설명",
        ExpertiseLevel.DEEP: "정확한 전문 용어와 미술사적 맥락을 포함하며, 미대/업계에서 사용하는 전문 용어 사용 가능"
    }
    
    # 전문성 수준별 답변 길이
    length_map = {
        ExpertiseLevel.LIGHT: "간결하게 (2-3문단, 약 150-200자)",
        ExpertiseLevel.MEDIUM: "적당한 길이로 (3-4문단, 약 250-350자)",
        ExpertiseLevel.DEEP: "상세하게 (4-6문단, 약 400-600자)"
    }
    
    tone = tone_map[age_group]
    terminology = terminology_map[expertise]
    length = length_map[expertise]
    
    prompt = f"""당신은 미술관 도슨트입니다. 다음 정보를 바탕으로 관람객의 질문에 답변해주세요.

## 관람객 프로필
- 나이대: {age_group.value}
- 미술 전문성: {expertise.value}

## 답변 스타일 가이드
1. 톤: {tone}
2. 용어 사용: {terminology}
3. 답변 길이: {length}

## 참고 문서 1: 작품 정보 (로컬 DB)
{artwork_context}

## 참고 문서 2: 외부 검색 결과 (Tavily)
{tavily_context if tavily_context else "검색 결과가 없습니다."}

## 관람객의 질문
{question}

[답변 규칙]
1. 먼저 작품 정보(로컬 DB)를 우선적으로 사용하되, 부족한 정보는 외부 검색 결과(Tavily)로 보완합니다.
2. 검색 결과를 인용할 때는 출처를 명시합니다 (출처 제목 표시).
3. 작품 정보와 검색 결과가 충돌하는 경우, 작품 정보를 우선합니다.
4. 검색 결과의 신뢰성을 판단하여 정확한 정보만 사용합니다.
5. 관람객 프로필에 맞춰 톤, 용어 난이도, 길이를 조절합니다.
6. 사용자의 질문에 직접적으로 관련된 내용만 답변하고, 불필요한 정보는 포함하지 않습니다.
"""
    
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "당신은 미술관 도슨트입니다. 작품 정보와 외부 검색 결과를 활용하여 정확하고 유용한 답변을 제공합니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=1000
    )
    
    answer = response.choices[0].message.content.strip()
    return answer


def check_if_db_has_answer(question: str, artwork_context: str) -> Tuple[bool, str]:
    """
    LLM을 사용하여 DB 컨텍스트만으로 질문에 답할 수 있는지 판별
    
    Returns:
        (can_answer: bool, reason: str)
    """
    api_key = settings.OPENAI_API_KEY
    model = settings.OPENAI_MODEL
    client = openai.OpenAI(api_key=api_key)
    
    prompt = f"""다음 작품 정보만으로 사용자의 질문에 답할 수 있는지 판단해주세요.

작품 정보:
{artwork_context}

사용자 질문:
{question}

다음 형식으로만 답변해주세요:
- 답변 가능: "YES"
- 답변 불가능 (추가 정보 필요): "NO"

답변:"""
    

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "당신은 정보 충족도를 판단하는 시스템입니다. 제공된 정보만으로 질문에 답할 수 있는지 판단하세요."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=10
    )
    
    answer = response.choices[0].message.content.strip().upper()
    can_answer = "YES" in answer
    
    if can_answer:
        print(f"[Tavily DB Check] ✅ DB 정보만으로 답변 가능")
    else:
        print(f"[Tavily DB Check] ❌ DB 정보 부족 - 외부 검색 필요")
    
    return can_answer, "DB 정보로 답변 가능" if can_answer else "DB 정보 부족, 외부 검색 필요"

