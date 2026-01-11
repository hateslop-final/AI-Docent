from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class ChatbotRequest(BaseModel):
    artwork_id: Optional[str] = None
    question: str
    age_group: str  
    expertise_level: str

class ChatbotResponse(BaseModel):
    answer: str