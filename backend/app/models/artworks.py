from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class ArtworkModel(BaseModel):
    id: UUID
    exhibition_id: int

    title: str
    artist: str

    description: Optional[str] = None
    image_url: Optional[str] = None

    production_year: Optional[str] = None
    ingredients: Optional[str] = None
    size: Optional[str] = None

    embedding: Optional[List[float]] = None
    management_number: Optional[int] = None
    is_now: Optional[bool] = None