from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Item(Base):
    __tablename__ = "items"
    
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="check_quantity_non_negative"),
        CheckConstraint("price >= 0", name="check_price_non_negative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    article = Column(String, unique=True, nullable=False)
    quantity = Column(Float, nullable=False, default=0)
    unit = Column(String, nullable=False)             
    shelf_life_days = Column(Integer, nullable=True)
    price = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    image_url = Column(String, nullable=False, default="/images/default.png")

    category = relationship("Category")
    warehouse = relationship("Warehouse")