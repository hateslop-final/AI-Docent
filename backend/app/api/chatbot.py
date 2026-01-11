from fastapi import APIRouter, HTTPException
from app.models.chatbot import ChatbotRequest, ChatbotResponse
from app.services.chat.rag_service import (
    fetch_artwork_by_id,
    build_artwork_context,
    generate_answer
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
        
        # 2. 작품 정보를 컨텍스트로 변환
        artwork_context = build_artwork_context(artwork)
    
    # 3. LLM으로 답변 생성
    answer = generate_answer(
        artwork_context=artwork_context,
        question=request.question,
        age_group_str=request.age_group,
        expertise_level_str=request.expertise_level
    )
    
    return ChatbotResponse(answer=answer)
        
    
