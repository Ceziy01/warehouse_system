from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime, timedelta
import os, subprocess, shutil

from app.core.dependencies import require_admin, get_db
from app.schemas.auth import CreateUserRequest, UpdateUserRequest
from app.services.auth_service import create_user
from app.db.models.user import Users
from app.core.security import create_access_token, hash_password
from app.config import settings
from app.schemas.auth import ResetPasswordRequest
from app.db.models.activity_log import ActionType
from app.services.activity_log import log_action

router = APIRouter(prefix="/auth/admin", tags=["admin"])

BACKUP_DIR = Path("/app/backups")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

@router.get("")
def admin_panel(admin: Annotated[Users, Depends(require_admin)]):
    return {"message": "Welcome admin"}

@router.post("/create-user", status_code=201)
def admin_create_user(
    request: CreateUserRequest,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Users, Depends(require_admin)],
    req: Request = None
):
    user = create_user(request.username, request.first_name, request.last_name, request.email, request.password, request.role, db)
    log_action(
        db, admin, ActionType.USER_CREATED,
        entity_type="user", entity_id=user.id,
        entity_name=f"{request.first_name} {request.last_name} ({request.username})",
        ip_address=req.client.host if req else None
    )
    return {"message": "User created"}


@router.get("/users")
def all_users(
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Users, Depends(require_admin)]
):
    users = db.query(Users).all()
    return [
        {"id": u.id, "username": u.username, "first_name": u.first_name, "last_name": u.last_name, "email": u.email, "role": u.role.value}
        for u in users
    ]

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Users, Depends(require_admin)],
    req: Request = None
):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")

    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log_action(
        db, admin, ActionType.USER_DELETED,
        entity_type="user", entity_id=user.id,
        entity_name=f"{user.first_name} {user.last_name} ({user.username})",
        ip_address=req.client.host if req else None
    )

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.patch("/users/{user_id}")
def admin_update_user(
    user_id: int,
    request: UpdateUserRequest,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Users, Depends(require_admin)],
    req: Request = None
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = {}

    if request.username is not None:
        existing = db.query(Users).filter(Users.username == request.username, Users.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        if user.username != request.username:
            changes["username"] = {"old": user.username, "new": request.username}
        user.username = request.username

    if request.first_name is not None:
        if user.first_name != request.first_name:
            changes["first_name"] = {"old": user.first_name, "new": request.first_name}
        user.first_name = request.first_name

    if request.last_name is not None:
        if user.last_name != request.last_name:
            changes["last_name"] = {"old": user.last_name, "new": request.last_name}
        user.last_name = request.last_name

    if request.email is not None:
        existing = db.query(Users).filter(Users.email == request.email, Users.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        if user.email != request.email:
            changes["email"] = {"old": user.email, "new": request.email}
        user.email = request.email

    if request.role is not None:
        if user.role.value != request.role:
            changes["role"] = {"old": user.role.value, "new": request.role}
        user.role = request.role

    db.commit()
    db.refresh(user)

    log_action(
        db, admin, ActionType.USER_UPDATED,
        entity_type="user", entity_id=user.id,
        entity_name=f"{user.first_name} {user.last_name} ({user.username})",
        ip_address=req.client.host if req else None
    )

    return {"message": "User updated"}


@router.post("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    request: ResetPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Users, Depends(require_admin)],
    req: Request = None
):
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password too short (min 8 characters)")

    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(request.new_password)
    db.commit()

    log_action(
        db, admin, ActionType.USER_PASSWORD_RESET,
        entity_type="user", entity_id=user.id,
        entity_name=f"{user.first_name} {user.last_name} ({user.username})",
        ip_address=req.client.host if req else None
    )

    return {"message": "Password reset successfully"}


@router.post("/impersonate/{user_id}")
def impersonate_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Users, Depends(require_admin)],
    req: Request = None
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_access_token(
        username=user.username,
        id=user.id,
        exps=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    log_action(
        db, admin, ActionType.USER_IMPERSONATED,
        entity_type="user", entity_id=user.id,
        entity_name=f"{user.first_name} {user.last_name} ({user.username})",
        ip_address=req.client.host if req else None
    )

    return {"access_token": token, "token_type": "bearer"}

def _get_db_connection_params():
    db_url = settings.DATABASE_URL
    try:
        url = db_url.replace("postgresql://", "")
        user_pass, host_db = url.split("@")
        user, password = user_pass.split(":")
        host_port, dbname = host_db.split("/")
        if ":" in host_port:
            host, port = host_port.split(":")
        else:
            host = host_port
            port = "5432"
        return {
            "host": host,
            "port": port,
            "user": user,
            "password": password,
            "dbname": dbname
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Некорректный DATABASE_URL: {str(e)}")

@router.post("/backup", status_code=201)
def create_backup(admin: Users = Depends(require_admin), req: Request = None):
    conn = _get_db_connection_params()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{timestamp}.sql"
    filepath = BACKUP_DIR / filename

    env = os.environ.copy()
    env["PGPASSWORD"] = conn["password"]

    cmd = [
        "pg_dump",
        "-h", conn["host"],
        "-p", conn["port"],
        "-U", conn["user"],
        "-d", conn["dbname"],
        "-f", str(filepath),
        "--no-owner",
        "--no-acl",
        "--clean",
        "--if-exists"
    ]
    try:
        subprocess.run(cmd, env=env, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Ошибка pg_dump: {e.stderr}")

    return {"message": "Бэкап успешно создан", "file": filename}

@router.get("/backup/list", response_model=List[dict])
def list_backups(admin: Users = Depends(require_admin)):
    backups = []
    for f in BACKUP_DIR.glob("backup_*.sql"):
        stat = f.stat()
        backups.append({
            "filename": f.name,
            "size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat()
        })
    backups.sort(key=lambda x: x["created_at"], reverse=True)
    return backups

@router.delete("/backup/{filename}")
def delete_backup(filename: str, admin: Users = Depends(require_admin)):
    filepath = BACKUP_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    os.remove(filepath)
    return {"message": "Бэкап удалён"}

@router.get("/backup/download/{filename}")
def download_backup(filename: str, admin: Users = Depends(require_admin)):
    filepath = BACKUP_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(filepath, media_type="application/sql", filename=filename)

@router.post("/backup/restore/upload")
async def restore_backup_from_upload(
    admin: Users = Depends(require_admin),
    req: Request = None,
    file: UploadFile = File(...)
):
    if not file.filename.endswith('.sql'):
        raise HTTPException(status_code=400, detail="Неверный формат файла (требуется .sql)")
    
    temp_dir = BACKUP_DIR / "temp"
    temp_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    temp_file_path = temp_dir / f"uploaded_{timestamp}_{file.filename}"
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        result = _restore_database(temp_file_path, file.filename)
        return result
    finally:
        if temp_file_path.exists():
            try:
                os.remove(temp_file_path)
            except:
                pass
        file.file.close()

@router.post("/backup/restore/{filename}")
def restore_backup_from_server(
    filename: str,
    admin: Users = Depends(require_admin),
    req: Request = None
):
    filepath = BACKUP_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Файл бэкапа не найден")
    
    if not filename.endswith('.sql'):
        raise HTTPException(status_code=400, detail="Неверный формат файла (требуется .sql)")
    
    return _restore_database(filepath, filename)

def _restore_database(filepath: Path, filename: str):
    conn = _get_db_connection_params()
    
    env = os.environ.copy()
    env["PGPASSWORD"] = conn["password"]
    
    try:
        terminate_cmd = [
            "psql",
            "-h", conn["host"],
            "-p", conn["port"],
            "-U", conn["user"],
            "-d", conn["dbname"],
            "-c", """
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = current_database()
            AND pid <> pg_backend_pid();
            """
        ]
        subprocess.run(terminate_cmd, env=env, capture_output=True, text=True, check=False)

        drop_cmd = [
            "psql",
            "-h", conn["host"],
            "-p", conn["port"],
            "-U", conn["user"],
            "-d", conn["dbname"],
            "-c", """
            DO $$ DECLARE
                r RECORD;
            BEGIN
                -- Удаляем все таблицы
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
                
                -- Удаляем все последовательности
                FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
                    EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
                END LOOP;
                
                -- Удаляем пользовательские типы (enum)
                FOR r IN (SELECT t.typname FROM pg_type t 
                         JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
                         WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
                    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
                END LOOP;
            END $$;
            """
        ]
        subprocess.run(drop_cmd, env=env, capture_output=True, text=True, check=True)

        restore_cmd = [
            "psql",
            "-h", conn["host"],
            "-p", conn["port"],
            "-U", conn["user"],
            "-d", conn["dbname"],
            "-f", str(filepath),
            "-v", "ON_ERROR_STOP=0"
        ]
        
        result = subprocess.run(restore_cmd, env=env, capture_output=True, text=True)

        if result.returncode != 0:
            stderr = result.stderr.strip() if result.stderr else ""
            critical_errors = ['fatal:', 'connection refused', 'no such file']
            if any(err in stderr.lower() for err in critical_errors):
                raise HTTPException(
                    status_code=500,
                    detail=f"Критическая ошибка восстановления: {stderr[-500:]}"
                )
        
        return {
            "message": "База данных успешно восстановлена",
            "file": filename,
            "warnings": result.stderr[-500:] if result.stderr else None
        }
        
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr[-500:] if e.stderr else str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка восстановления базы данных: {error_msg}"
        )