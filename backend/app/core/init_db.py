from app.core.database import SessionLocal, engine, Base
from app.db.models import *
from app.core.security import hash_password
from app.db.models.user import Users, UserRole

def init_database():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        user_count = db.query(Users).count()
        
        if user_count > 0:
            return

        admin = Users(
            username="admin",
            first_name="Админ",
            last_name="Админов",
            email="admin@example.com",
            hashed_password=hash_password("12345678"),
            role=UserRole.ADMIN
        )
        db.add(admin)
        db.commit()
        
    except Exception as e:
        db.rollback()
    finally:
        db.close()