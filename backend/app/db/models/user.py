from enum import Enum
from sqlalchemy import Column, Integer, String, Enum as SqlEnum

from app.core.database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    WAREHOUSE_KEEPER = "warehouse_keeper"
    CUSTOMER = "customer"
    MANAGEMENT = "management"
    PURCHASE_MANAGER = "purchase_manager"
    SALES_MANAGER = "sales_manager"
    ACCOUNTANT = "accountant"

class Users(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(20), nullable=False, unique=True)
    first_name = Column(String(20), nullable=False)
    last_name = Column(String(20), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(72), nullable=False)
    role = Column(SqlEnum(UserRole), default=UserRole.CUSTOMER)