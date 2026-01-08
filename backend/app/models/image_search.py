from pydantic import BaseModel
from app.models.artworks import ArtworkModel
from uuid import UUID
from typing import Optional, List


class ImageSearchRequest(BaseModel):
    exhibition_id: int
    query_embedding: List[float]

# 🔍 검색 결과용 (RPC 결과와 1:1 매칭)
class ArtworkSearchModel(BaseModel):
    id: UUID
    title: str                  
    artist: Optional[str] = None
    image_url: Optional[str] = None
    score: float


class ImageSearchResult(BaseModel):
    score: float
    artwork: ArtworkModel