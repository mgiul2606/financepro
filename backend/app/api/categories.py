# app/api/categories.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.db.database import get_db
from app.models.category import Category

router = APIRouter()

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str | None
    color: str | None
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[CategoryResponse])
async def list_categories(db: Session = Depends(get_db)):
    """Lista tutte le categorie disponibili (pubblico, no auth)"""
    
    categories = db.query(Category)\
        .order_by(Category.name)\
        .all()
    
    return categories