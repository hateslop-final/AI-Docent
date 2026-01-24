from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
from app.services.artworks.embedding_image import image_to_embedding, get_model_status, is_model_loaded
from app.services.artworks.image_search import search_similar_artworks_in_exhibition
from app.models.image_search import ImageSearchResult
import traceback

router = APIRouter(prefix="/image-search", tags=["image-search"])

@router.post("/", response_model=List[ImageSearchResult])
async def image_search(
    exhibition_id: int = Form(...),
    image: UploadFile = File(...)
):
    try:
        # 1. 이미지 읽기
        image_bytes = await image.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="이미지 파일이 비어있습니다.")

        # 2. 모델 상태 확인
        if not is_model_loaded():
            model_status = get_model_status()
            if model_status.get("error"):
                raise HTTPException(
                    status_code=503,
                    detail=f"이미지 검색 모델을 로드할 수 없습니다: {model_status.get('error')}"
                )
            # 모델이 아직 로드되지 않았지만 에러도 없음 (로딩 중일 수 있음)
            print("[Image Search] 모델 로딩 중...")

        # 3. 이미지 → embedding
        try:
            query_embedding = image_to_embedding(image_bytes)
        except RuntimeError as e:
            error_msg = str(e)
            if "메모리" in error_msg or "memory" in error_msg.lower():
                raise HTTPException(
                    status_code=503,
                    detail="서버 메모리 부족으로 이미지 검색을 수행할 수 없습니다. 잠시 후 다시 시도해주세요."
                )
            elif "모델" in error_msg or "model" in error_msg.lower():
                raise HTTPException(
                    status_code=503,
                    detail=f"이미지 검색 모델을 사용할 수 없습니다: {error_msg}"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"이미지 임베딩 생성 실패: {error_msg}"
                )
        except Exception as e:
            print(f"[Image Search] 임베딩 생성 중 예외 발생: {e}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"이미지 처리 중 오류가 발생했습니다: {str(e)}"
            )

        # 4. 전시 한정 유사도 검색
        try:
            results = search_similar_artworks_in_exhibition(
                exhibition_id=exhibition_id,
                query_embedding=query_embedding,
                top_k=3
            )
        except Exception as e:
            print(f"[Image Search] 작품 검색 중 예외 발생: {e}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"작품 검색 중 오류가 발생했습니다: {str(e)}"
            )

        return results
        
    except HTTPException:
        # HTTPException은 그대로 전달
        raise
    except Exception as e:
        # 예상치 못한 에러
        print(f"[Image Search] 예상치 못한 오류: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류가 발생했습니다: {str(e)}"
        )