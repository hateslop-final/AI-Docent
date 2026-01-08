from fastapi import APIRouter, UploadFile, File, Form
from typing import List
from app.services.artworks.embedding_image import image_to_embedding
from app.services.artworks.image_search import search_similar_artworks_in_exhibition
from app.models.image_search import ImageSearchResult

router = APIRouter(prefix="/image-search", tags=["image-search"])

@router.post("/", response_model=List[ImageSearchResult])
async def image_search(
    exhibition_id: int = Form(...),
    image: UploadFile = File(...)
):
    # 1. 이미지 읽기
    image_bytes = await image.read()

    # 2. 이미지 → embedding
    query_embedding = image_to_embedding(image_bytes)

    # 3. 전시 한정 유사도 검색
    results = search_similar_artworks_in_exhibition(
        exhibition_id=exhibition_id,
        query_embedding=query_embedding,
        top_k=3
    )

    return results