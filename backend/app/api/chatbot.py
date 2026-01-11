from fastapi import APIRouter, HTTPException
from app.models.chatbot import ChatbotRequest, ChatbotResponse
from app.services.chat.rag_service import (
    fetch_artwork_by_id,
    build_artwork_context,
    generate_answer
)
import logging

logger = logging.getLogger(__name__)

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
    print("=" * 80)
    print("[Chatbot API] ========== 요청 수신 ==========")
    print(f"[Chatbot API] artwork_id: {request.artwork_id}")
    print(f"[Chatbot API] question: {request.question[:100]}...")
    print(f"[Chatbot API] age_group: {request.age_group}")
    print(f"[Chatbot API] expertise_level: {request.expertise_level}")
    print("=" * 80)
    
    logger.info(f"[Chatbot API] 요청 수신: artwork_id={request.artwork_id}, question={request.question[:50]}..., age_group={request.age_group}, expertise_level={request.expertise_level}")

    # 1. 작품 정보 조회 (artwork_id가 있는 경우만)
    artwork = None
    artwork_context = ""
    
    if request.artwork_id:
        logger.info(f"[Chatbot API] 작품 조회 시작: artwork_id={request.artwork_id}")
        print(f"[Chatbot API] 작품 조회 시작: artwork_id={request.artwork_id}")
        artwork = fetch_artwork_by_id(request.artwork_id)
        
        if not artwork:
            logger.warning(f"[Chatbot API] 작품을 찾을 수 없음: artwork_id={request.artwork_id}")
            print(f"[Chatbot API] 작품을 찾을 수 없음: artwork_id={request.artwork_id}")
            raise HTTPException(
                status_code=404,
                detail=f"작품을 찾을 수 없습니다. (ID: {request.artwork_id})"
            )
        
        # 2. 작품 정보를 컨텍스트로 변환
        artwork_context = build_artwork_context(artwork)
        logger.info(f"[Chatbot API] 작품 컨텍스트 생성 완료: 길이={len(artwork_context)}")
        print(f"[Chatbot API] 작품 컨텍스트 생성 완료: 길이={len(artwork_context)}")
    else:
        logger.info("[Chatbot API] 작품 ID 없음 - 일반 질문 처리")
        print("[Chatbot API] 작품 ID 없음 - 일반 질문 처리")
    
    # 3. LLM으로 답변 생성
    logger.info("[Chatbot API] LLM 답변 생성 시작")
    print("[Chatbot API] LLM 답변 생성 시작")
    print(f"[Chatbot API] artwork_context 길이: {len(artwork_context)}")
    print(f"[Chatbot API] question: {request.question[:100]}...")
    print(f"[Chatbot API] age_group: {request.age_group}, expertise_level: {request.expertise_level}")
    
    try:
        answer = generate_answer(
            artwork_context=artwork_context,
            question=request.question,
            age_group_str=request.age_group,
            expertise_level_str=request.expertise_level
        )
        logger.info(f"[Chatbot API] 답변 생성 완료: 길이={len(answer)}")
        print(f"[Chatbot API] 답변 생성 완료: 길이={len(answer)}")
    except ValueError as e:
        # 환경 변수 오류 등 설정 문제
        logger.error(f"[Chatbot API] 설정 오류: {str(e)}")
        print(f"[Chatbot API] 설정 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"설정 오류: {str(e)}")
    except Exception as e:
        logger.error(f"[Chatbot API] 답변 생성 실패: {str(e)}")
        print(f"[Chatbot API] 답변 생성 실패: {str(e)}")
        import traceback
        print(f"[Chatbot API] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"답변 생성 중 오류가 발생했습니다: {str(e)}")
    
    return ChatbotResponse(answer=answer)
        
    
