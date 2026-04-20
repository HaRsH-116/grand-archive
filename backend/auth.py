"""
auth.py — JWT token management and role-based access control.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models
from database import get_db

SECRET_KEY               = "grand-archive-super-secret-change-in-production"
ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_MINS = 60 * 24  # 24 h

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Password ───────────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


# ── Tokens ─────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire  = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINS))
    payload["exp"] = expire
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── Dependencies ───────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db:    Session = Depends(get_db),
) -> models.User:
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise creds_exc
    except JWTError:
        raise creds_exc

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not user.is_active:
        raise creds_exc
    return user


def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> Optional[models.User]:
    """Returns user if authenticated, None otherwise (for public routes)."""
    try:
        return get_current_user(token=token, db=db)
    except Exception:
        return None


def require_role(*roles: models.UserRole):
    """
    Factory that returns a FastAPI dependency enforcing the given roles.
    Usage:
        Depends(require_role(UserRole.admin))
        Depends(require_role(UserRole.admin, UserRole.author))
    """
    def _guard(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {[r.value for r in roles]}",
            )
        return current_user
    return _guard


require_admin           = require_role(models.UserRole.admin)
require_author_or_admin = require_role(models.UserRole.admin, models.UserRole.author)


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
