from fastapi import APIRouter, HTTPException
from app.models.chatbot import ChatbotRequest, ChatbotResponse
from app.services.chat.rag_service import (
    fetch_artwork_by_id,
    build_artwork_context,
    generate_answer
)
from app.services.chat.tavily_service import (
    check_if_db_has_answer,
    should_use_tavily,
    search_with_tavily,
    build_tavily_context,
    generate_answer_with_tavily
)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/", response_model=ChatbotResponse)
async def chatbot(request: ChatbotRequest):
    """
    작품에 대한 질문에 답변을 생성합니다.
    
    - artwork_id: 작품 ID (선택적)
    - question: 사용자의 질문
    - age_group: 나이대 ("teen" or "adult")
    - expertise_level: 전문성 수준 ("light", "medium", "deep")
    """

    # 1. 작품 정보 조회 (artwork_id가 있는 경우만)
    artwork = None
    artwork_context = ""
    
    if request.artwork_id:
        artwork = fetch_artwork_by_id(request.artwork_id)
        if not artwork:
            raise HTTPException(
                status_code=404,
                detail=f"작품을 찾을 수 없습니다. (ID: {request.artwork_id})"
            )
        artwork_context = build_artwork_context(artwork)
        print(f"[Chatbot API] ✅ 작품 정보 조회 완료 - 작가: {artwork.get('artist', 'N/A')}, 작품: {artwork.get('title', 'N/A')}")
    
    # 2. DB 정보만으로 답변 가능한지 확인
    can_answer_with_db, db_check_reason = check_if_db_has_answer(
        question=request.question,
        artwork_context=artwork_context
    )
    print(f"[Chatbot API] 🔍 DB 답변 가능 여부: {can_answer_with_db} - 이유: {db_check_reason}")
    
    # 3. DB 정보로 답변 가능한 경우 → 일반 RAG 사용
    if can_answer_with_db:
        print(f"[Chatbot API] ✅ DB 정보만으로 답변 생성 (Tavily 미사용)")
        answer = generate_answer(
            artwork_context=artwork_context,
            question=request.question,
            age_group_str=request.age_group,
            expertise_level_str=request.expertise_level
        )
        return ChatbotResponse(answer=answer)
    
    # 4. DB 정보가 부족한 경우 → Tavily 검색 시도
    if not artwork:
        print(f"[Chatbot API] ⚠️ artwork_id 없음 - Tavily 검색 불가, 일반 RAG로 fallback")
    else:
        try:
            should_search, tavily_reason = should_use_tavily(
                question=request.question,
                artwork=artwork
            )
            print(f"[Chatbot API] 🔍 Tavily 검색 판별 결과: {should_search} - 이유: {tavily_reason}")
            
            if should_search:
                search_query = f"{artwork.get('artist', '')} {request.question}"
                print(f"[Chatbot API] 🔍 Tavily 검색 시작 - 쿼리: {search_query}")
                tavily_results = search_with_tavily(query=search_query, max_results=5)
                
                if tavily_results:
                    for i, result in enumerate(tavily_results, 1):
                        title = result.get("title", "제목 없음")
                        url = result.get("url", "URL 없음")
                        print(f"[Chatbot API]   {i}. {title[:60]}... | 출처: {url}")
                    
                    tavily_context = build_tavily_context(tavily_results)
                    answer = generate_answer_with_tavily(
                        artwork_context=artwork_context,
                        question=request.question,
                        tavily_context=tavily_context,
                        age_group_str=request.age_group,
                        expertise_level_str=request.expertise_level
                    )
                    return ChatbotResponse(answer=answer)
                else:
                    print(f"[Chatbot API] ⚠️ Tavily 검색 결과 없음, 일반 RAG로 fallback")
            else:
                print(f"[Chatbot API] ℹ️ Tavily 검색 불필요 - {tavily_reason}")
        except Exception as tavily_error:
            print(f"[Chatbot API] ❌ Tavily 검색 실패, 일반 RAG로 fallback: {tavily_error}")
    
    # 5. 일반 RAG로 답변 생성
    print(f"[Chatbot API] 📝 일반 RAG로 답변 생성 (Tavily 미사용)")
    answer = generate_answer(
        artwork_context=artwork_context,
        question=request.question,
        age_group_str=request.age_group,
        expertise_level_str=request.expertise_level
    )
    
    return ChatbotResponse(answer=answer)
        
    
