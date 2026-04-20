"""
models.py — The Grand Archive ORM definitions.

Tables:
  users         — Accounts with RBAC roles
  books         — Volumes with JSONB-style pages column
  bookmarks     — Per-user page bookmarks within a book
  ratings       — Star ratings + review text per user per book
  reading_progress — Tracks current page per user per book
  notifications — System notifications per user
  book_tags     — Many-to-many tags on books (via JSON column)
"""

import json
import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    ForeignKey, Enum, Boolean, Float,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator, TEXT

from database import Base


# ── JSONB emulation for SQLite ─────────────────────────────────────────────

class JSONBColumn(TypeDecorator):
    """
    Stores Python lists/dicts as JSON text in SQLite.
    For PostgreSQL migration: swap impl=TEXT for postgresql.JSONB.
    """
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return json.dumps(value) if value is not None else "[]"

    def process_result_value(self, value, dialect):
        return json.loads(value) if value else []


class JSONBDict(TypeDecorator):
    """Same but defaults to empty dict (for metadata columns)."""
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return json.dumps(value) if value is not None else "{}"

    def process_result_value(self, value, dialect):
        return json.loads(value) if value else {}


# ── Enums ──────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin  = "admin"
    author = "author"
    reader = "reader"


class Visibility(str, enum.Enum):
    public  = "public"
    private = "private"


class NotificationType(str, enum.Enum):
    new_book   = "new_book"
    new_review = "new_review"
    system     = "system"
    follow     = "follow"


# ── User ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(50),  unique=True, index=True, nullable=False)
    email           = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(Enum(UserRole), default=UserRole.reader, nullable=False)
    bio             = Column(Text, nullable=True)
    avatar_color    = Column(String(7), default="#8B0000")
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    last_login      = Column(DateTime, nullable=True)

    books              = relationship("Book",           back_populates="author",  cascade="all, delete-orphan")
    bookmarks          = relationship("Bookmark",       back_populates="user",    cascade="all, delete-orphan")
    ratings            = relationship("Rating",         back_populates="user",    cascade="all, delete-orphan")
    reading_progress   = relationship("ReadingProgress",back_populates="user",    cascade="all, delete-orphan")
    notifications      = relationship("Notification",   back_populates="user",    cascade="all, delete-orphan")


# ── Book ───────────────────────────────────────────────────────────────────

class Book(Base):
    """
    Core content model.

    pages JSONB schema (list of page objects):
      {
        "id":         str   (uuid4),
        "text":       str,
        "media_url":  str | null,
        "media_type": "image" | "video" | null
      }

    tags: stored as JSON list of strings e.g. ["fantasy","history"]
    """
    __tablename__ = "books"

    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String(200), nullable=False, index=True)
    description  = Column(Text, nullable=True)
    cover_color  = Column(String(7),   default="#8B0000")
    cover_image  = Column(Text, nullable=True)       # optional cover image URL
    genre        = Column(String(100), nullable=True, index=True)
    tags         = Column(JSONBColumn, default=list)  # ["fantasy","adventure"]
    pages        = Column(JSONBColumn, default=list)  # list of page dicts
    visibility   = Column(Enum(Visibility), default=Visibility.public)
    is_featured  = Column(Boolean, default=False)
    view_count   = Column(Integer, default=0)
    author_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_opened  = Column(DateTime, nullable=True)

    author           = relationship("User",           back_populates="books")
    bookmarks        = relationship("Bookmark",        back_populates="book",   cascade="all, delete-orphan")
    ratings          = relationship("Rating",          back_populates="book",   cascade="all, delete-orphan")
    reading_progress = relationship("ReadingProgress", back_populates="book",   cascade="all, delete-orphan")


# ── Bookmark ───────────────────────────────────────────────────────────────

class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "book_id", "page_id"),)

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"),  nullable=False)
    book_id    = Column(Integer, ForeignKey("books.id"),  nullable=False)
    page_id    = Column(String(36), nullable=False)   # uuid of the page
    page_index = Column(Integer,    nullable=False)
    note       = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookmarks")
    book = relationship("Book", back_populates="bookmarks")


# ── Rating / Review ────────────────────────────────────────────────────────

class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("user_id", "book_id"),)

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"),  nullable=False)
    book_id    = Column(Integer, ForeignKey("books.id"),  nullable=False)
    stars      = Column(Integer, nullable=False)      # 1–5
    review     = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="ratings")
    book = relationship("Book", back_populates="ratings")


# ── Reading Progress ───────────────────────────────────────────────────────

class ReadingProgress(Base):
    __tablename__ = "reading_progress"
    __table_args__ = (UniqueConstraint("user_id", "book_id"),)

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"),  nullable=False)
    book_id      = Column(Integer, ForeignKey("books.id"),  nullable=False)
    current_page = Column(Integer, default=0)
    completed    = Column(Boolean, default=False)
    started_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reading_progress")
    book = relationship("Book", back_populates="reading_progress")


# ── Notification ───────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    type       = Column(Enum(NotificationType), default=NotificationType.system)
    title      = Column(String(200), nullable=False)
    body       = Column(Text, nullable=True)
    link_id    = Column(Integer, nullable=True)   # book_id or user_id depending on type
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
