"""
schemas.py — Pydantic v2 request / response models.

Fix notes vs v1:
  - Token now has model_config from_attributes=True so FastAPI can serialize
    it whether we return a dict or a Pydantic instance.
  - All response models that contain nested ORM-derived objects have
    from_attributes=True at every nesting level.
  - model_config does NOT set frozen=True on any model, which allows
    post-validation field assignment (needed for avg_rating injection in main.py).
"""
from __future__ import annotations
from typing import Optional, List, Any
from datetime import datetime

from pydantic import BaseModel, field_validator, ConfigDict
from models import UserRole, Visibility, NotificationType


# ── Page ───────────────────────────────────────────────────────────────────

class PageSchema(BaseModel):
    id:         str
    text:       str = ""
    media_url:  Optional[str] = None
    media_type: Optional[str] = None   # "image" | "video" | None


# ── User ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email:    str
    password: str
    role:     UserRole = UserRole.reader

    @field_validator("email")
    @classmethod
    def email_basic_check(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or len(v) < 5:
            raise ValueError("Enter a valid email address")
        return v

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username: letters, numbers, hyphens and underscores only")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserUpdate(BaseModel):
    username:     Optional[str]      = None
    email:        Optional[str]      = None
    bio:          Optional[str]      = None
    avatar_color: Optional[str]      = None
    role:         Optional[UserRole] = None
    is_active:    Optional[bool]     = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:           int
    username:     str
    email:        str
    role:         UserRole
    bio:          Optional[str]   = None
    avatar_color: str             = "#8B0000"
    is_active:    bool            = True
    created_at:   datetime
    last_login:   Optional[datetime] = None


class UserOutPublic(BaseModel):
    """Safe public profile — no email exposed."""
    model_config = ConfigDict(from_attributes=True)

    id:           int
    username:     str
    role:         UserRole
    bio:          Optional[str] = None
    avatar_color: str           = "#8B0000"
    created_at:   datetime


# ── Book ───────────────────────────────────────────────────────────────────

class BookCreate(BaseModel):
    title:       str
    description: Optional[str]     = None
    cover_color: Optional[str]     = "#8B0000"
    cover_image: Optional[str]     = None
    genre:       Optional[str]     = None
    tags:        List[str]         = []
    pages:       List[PageSchema]  = []
    visibility:  Visibility        = Visibility.public


class BookUpdate(BaseModel):
    title:       Optional[str]               = None
    description: Optional[str]              = None
    cover_color: Optional[str]              = None
    cover_image: Optional[str]              = None
    genre:       Optional[str]              = None
    tags:        Optional[List[str]]        = None
    pages:       Optional[List[PageSchema]] = None
    visibility:  Optional[Visibility]       = None
    is_featured: Optional[bool]             = None


class BookOut(BaseModel):
    # from_attributes=True lets model_validate(orm_object) use attribute access.
    # NOT frozen — so main.py can set avg_rating/rating_count after validation.
    model_config = ConfigDict(from_attributes=True, frozen=False)

    id:           int
    title:        str
    description:  Optional[str]     = None
    cover_color:  str               = "#8B0000"
    cover_image:  Optional[str]     = None
    genre:        Optional[str]     = None
    tags:         List[Any]         = []
    pages:        List[Any]         = []
    visibility:   Visibility        = Visibility.public
    is_featured:  bool              = False
    view_count:   int               = 0
    author_id:    int
    author:       UserOutPublic
    created_at:   datetime
    updated_at:   datetime
    last_opened:  Optional[datetime] = None
    # Computed fields — injected by _book_out() in main.py
    avg_rating:   Optional[float]   = None
    rating_count: Optional[int]     = None


# ── Bookmark ───────────────────────────────────────────────────────────────

class BookmarkCreate(BaseModel):
    page_id:    str
    page_index: int
    note:       Optional[str] = None


class BookmarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         int
    book_id:    int
    page_id:    str
    page_index: int
    note:       Optional[str] = None
    created_at: datetime


# ── Rating / Review ────────────────────────────────────────────────────────

class RatingCreate(BaseModel):
    stars:  int
    review: Optional[str] = None

    @field_validator("stars")
    @classmethod
    def stars_in_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Stars must be 1–5")
        return v


class RatingOut(BaseModel):
    # from_attributes needed because `user` is a nested ORM relationship
    model_config = ConfigDict(from_attributes=True)

    id:         int
    book_id:    int
    user:       UserOutPublic
    stars:      int
    review:     Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Reading Progress ───────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    current_page: int
    completed:    bool = False


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    book_id:      int
    current_page: int
    completed:    bool
    started_at:   datetime
    updated_at:   datetime


# ── Notification ───────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         int
    type:       NotificationType
    title:      str
    body:       Optional[str]  = None
    link_id:    Optional[int]  = None
    is_read:    bool
    created_at: datetime


# ── Auth ───────────────────────────────────────────────────────────────────

class Token(BaseModel):
    # from_attributes=True here means FastAPI can serialize this whether we
    # return a dict (with a pre-validated UserOut value) or a Token instance.
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    token_type:   str
    user:         UserOut


class LoginRequest(BaseModel):
    username: str
    password: str


# ── Stats ──────────────────────────────────────────────────────────────────

class ArchiveStats(BaseModel):
    total_books:    int
    total_users:    int
    total_pages:    int
    total_reviews:  int
    featured_count: int
