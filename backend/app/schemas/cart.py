from pydantic import BaseModel, Field
from typing import Optional, Annotated

NonNegativeInt = Annotated[int, Field(ge=0,description="Не может быть отрицательным")]

class CartItemCreate(BaseModel):
    item_id: int
    quantity: NonNegativeInt = 1

class CartItemUpdate(BaseModel):
    quantity: NonNegativeInt

class CartItemResponse(BaseModel):
    id: int
    item_id: int
    name: str
    article: str
    quantity: int
    price: float
    image_url: Optional[str] = None
    total_price: float

    class Config:
        from_attributes = True