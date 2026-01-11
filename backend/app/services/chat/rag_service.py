"""
RAG 서비스 - 작품 정보를 기반으로 LLM으로 답변 생성
참고 파일의 프롬프트 로직을 사용하여 사용자 프로필에 맞춘 맞춤형 답변 제공
"""

import os
from typing import Optional
from enum import Enum
from pathlib import Path
from dotenv import load_dotenv
from app.db.supabase import supabase
import openai

# .env 파일 로드
load_dotenv(Path("/backend/app/.env.local"))


class AgeGroup(Enum):
    """나이대 분류"""
    TEEN = "teen"  # 청소년 (13-35세)
    ADULT = "adult"  # 성인 (36세 이상)


class ExpertiseLevel(Enum):
    """미술 전문성 수준"""
    LIGHT = "light"  # 초보(일반 관람객) - 미술 용어 거의 모름
    MEDIUM = "medium"  # 관심자(취미/전시 자주 감) - 기본 용어(구도, 설치, 모더니즘 정도)는 OK
    DEEP = "deep"  # 전문가(미대/관련 전공, 업계 종사) - 전문 용어 사용 가능


def fetch_artwork_by_id(artwork_id: str, table_name: str = "Artworks") -> Optional[dict]:
    """Supabase에서 작품 정보를 ID로 조회"""
    response = (
        supabase.table(table_name)
        .select("*")
        .eq("id", artwork_id)
        .execute()
    )
    
    return response.data[0] if response.data else None


def build_artwork_context(artwork: dict) -> str:
    """작품 정보를 컨텍스트 텍스트로 변환"""
    context_parts = []
    
    if artwork.get("title"):
        context_parts.append(f"작품명: {artwork['title']}")
    if artwork.get("artist"):
        context_parts.append(f"작가: {artwork['artist']}")
    if artwork.get("description"):
        context_parts.append(f"설명: {artwork['description']}")
    if artwork.get("production_year") or artwork.get("year"):
        year = artwork.get("production_year") or artwork.get("year")
        context_parts.append(f"연도: {year}")
    if artwork.get("ingredients"):
        context_parts.append(f"재료/기법: {artwork['ingredients']}")
    if artwork.get("size"):
        context_parts.append(f"작품 크기: {artwork['size']}")
        
    return "\n".join(context_parts)


def build_prompt(age_group: AgeGroup, expertise: ExpertiseLevel, question: str, artwork_context: str) -> str:
    """사용자 프로필에 맞춘 맞춤형 프롬프트 생성"""
    
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
    
    # 전문성 수준별 참고문헌 수준
    references_map = {
        ExpertiseLevel.LIGHT: "참고문헌 언급 없이 핵심 내용만 전달",
        ExpertiseLevel.MEDIUM: "주요 작가나 작품명 정도만 언급",
        ExpertiseLevel.DEEP: "구체적인 작가명, 작품명, 연도, 미술사적 맥락, 관련 이론이나 운동 언급"
    }
    
    tone = tone_map[age_group]
    terminology = terminology_map[expertise]
    length = length_map[expertise]
    references = references_map[expertise]
    
    prompt = f"""당신은 미술관 도슨트입니다. 다음 정보를 바탕으로 관람객의 질문에 답변해주세요.

    ## 관람객 프로필
    - 나이대: {age_group.value}
    - 미술 전문성: {expertise.value}

    ## 답변 스타일 가이드
    1. 톤: {tone}
    2. 용어 사용: {terminology}
    3. 답변 길이: {length}
    4. 참고문헌 수준: {references}

    ## 참고 문서 (작품 정보)
    {artwork_context}

    ## 관람객의 질문
    {question}

    위의 참고 문서를 바탕으로, 관람객 프로필에 맞는 스타일로 질문에 답변해주세요.
    답변은 자연스럽고 대화하듯이 작성하되, 제공된 참고 문서의 정보를 정확하게 반영해주세요.
    **중요: 사용자의 질문과 직접적으로 관련된 내용만 답변하고, 질문과 무관한 정보는 포함하지 마세요.**
    """
    
    return prompt


def generate_answer(
    artwork_context: str, 
    question: str, 
    age_group_str: str, 
    expertise_level_str: str
) -> str:
    """LLM을 사용하여 사용자 프로필에 맞춘 맞춤형 답변 생성"""
    age_group = AgeGroup(age_group_str)
    expertise = ExpertiseLevel(expertise_level_str)
    
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = openai.OpenAI(api_key=api_key)
    
    # 사용자 프로필에 맞춘 프롬프트 생성
    prompt = build_prompt(age_group, expertise, question, artwork_context)
    
    # LLM 호출
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "당신은 미술관 도슨트입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=1000
    )
    
    answer = response.choices[0].message.content.strip()
    return answer
