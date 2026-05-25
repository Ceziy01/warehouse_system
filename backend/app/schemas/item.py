from pydantic import BaseModel, Field
from typing import Optional, Annotated

NonNegativeInt = Annotated[int, Field(ge=0,description="Не может быть отрицательным")]
NonNegativeFloat = Annotated[float, Field(ge=0,description="Не может быть отрицательным")]

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    article: str
    quantity: NonNegativeFloat
    unit: str
    shelf_life_days: Optional[int] = None
    price: NonNegativeFloat
    category_id: int
    warehouse_id: int
    image_url: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    article: Optional[str] = None
    quantity: Optional[NonNegativeFloat] = None
    unit: Optional[str] = None
    shelf_life_days: Optional[int] = None
    price: Optional[NonNegativeFloat] = None
    category_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    image_url: Optional[str] = None

class ItemResponse(ItemBase):
    id: int
    category_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True