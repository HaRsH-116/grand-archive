"""
main.py — The Grand Archive API  (v2.1 — login fix)

Root-cause fixes:
  1. login() explicitly wraps the ORM User in schemas.UserOut.model_validate()
     before embedding it in the response dict.
     Pydantic v2 will NOT auto-apply from_attributes to a nested ORM object
     when the parent value is a plain dict → silent 500 → "unable to login".
  2. _book_out() uses BookOut.model_validate(book) against the ORM object
     directly (from_attributes=True is respected) rather than building a
     half-ORM dict.
  3. CORS allow_origins set to ["*"] for local development.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import auth, models, schemas
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="The Grand Archive API",
    description="Luxury Digital Study — Full REST API",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)	


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_book_or_404(book_id: int, db: Session) -> models.Book:
    book = db.get(models.Book, book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    return book


def _assert_can_modify(user: models.User, book: models.Book) -> None:
    if user.role != models.UserRole.admin and book.author_id != user.id:
        raise HTTPException(403, "You may only modify your own books")


def _book_out(book: models.Book) -> schemas.BookOut:
    """
    ORM Book  →  BookOut Pydantic instance.

    model_validate(orm_object) uses attribute access (from_attributes=True),
    so it correctly resolves the `author` relationship and all columns.
    avg_rating and rating_count are computed separately and injected.
    """
    ratings = book.ratings or []
    avg     = round(sum(r.stars for r in ratings) / len(ratings), 2) if ratings else None

    out              = schemas.BookOut.model_validate(book)
    out.avg_rating   = avg
    out.rating_count = len(ratings)
    return out


def _notify(db: Session, user_id: int, ntype: models.NotificationType,
            title: str, body: str = None, link_id: int = None):
    db.add(models.Notification(
        user_id=user_id, type=ntype,
        title=title, body=body, link_id=link_id,
    ))


# ═══════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(400, "Username already taken")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")

    user = models.User(
        username        = payload.username,
        email           = payload.email,
        hashed_password = auth.hash_password(payload.password),
        role            = payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _notify(db, user.id, models.NotificationType.system,
            "Welcome to The Grand Archive!",
            "Your study is ready. Start by exploring the shelves.")
    db.commit()
    return user  # ORM object — UserOut has from_attributes: True


@app.post("/api/auth/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(
        {"sub": user.username, "role": user.role.value}
    )

    # KEY FIX: convert ORM object to Pydantic model BEFORE putting it in the
    # dict.  Pydantic v2 in dict-validation mode will NOT call model_validate
    # on a nested raw ORM object — it will raise a ValidationError instead.
    user_out = schemas.UserOut.model_validate(user)
    return {"access_token": token, "token_type": "bearer", "user": user_out}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.put("/api/auth/me", response_model=schemas.UserOut)
def update_me(
    payload:      schemas.UserUpdate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    safe = payload.model_dump(exclude_unset=True, exclude={"role", "is_active"})
    for k, v in safe.items():
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user


# ═══════════════════════════════════════════════════════════════════════════
# USERS  (admin)
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session     = Depends(get_db),
    _:  models.User = Depends(auth.require_admin),
):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@app.get("/api/users/{user_id}", response_model=schemas.UserOutPublic)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


@app.put("/api/users/{user_id}", response_model=schemas.UserOut)
def admin_update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db:      Session     = Depends(get_db),
    _:       models.User = Depends(auth.require_admin),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/api/users/{user_id}", status_code=204)
def admin_delete_user(
    user_id: int,
    db:      Session     = Depends(get_db),
    _:       models.User = Depends(auth.require_admin),
):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════
# BOOKS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/books/featured", response_model=List[schemas.BookOut])
def get_featured(
    db: Session     = Depends(get_db),
    _:  models.User = Depends(auth.get_current_user),
):
    books = (
        db.query(models.Book)
        .filter(
            models.Book.is_featured == True,
            models.Book.visibility  == models.Visibility.public,
        )
        .order_by(models.Book.updated_at.desc())
        .limit(10)
        .all()
    )
    return [_book_out(b) for b in books]


@app.get("/api/books", response_model=List[schemas.BookOut])
def list_books(
    search:       Optional[str] = Query(None),
    genre:        Optional[str] = Query(None),
    author_id:    Optional[int] = Query(None),
    visibility:   Optional[str] = Query(None),
    sort:         Optional[str] = Query("updated"),
    db:           Session       = Depends(get_db),
    current_user: models.User   = Depends(auth.get_current_user),
):
    q = db.query(models.Book)

    if current_user.role == models.UserRole.reader:
        q = q.filter(models.Book.visibility == models.Visibility.public)
    elif current_user.role == models.UserRole.author:
        q = q.filter(
            (models.Book.visibility == models.Visibility.public) |
            (models.Book.author_id  == current_user.id)
        )
    elif visibility and visibility != "all":
        q = q.filter(models.Book.visibility == visibility)

    if search:
        like = f"%{search}%"
        q = q.filter(
            models.Book.title.ilike(like)       |
            models.Book.description.ilike(like) |
            models.Book.genre.ilike(like)
        )
    if genre:
        q = q.filter(models.Book.genre.ilike(f"%{genre}%"))
    if author_id:
        q = q.filter(models.Book.author_id == author_id)

    order = {
        "updated": models.Book.updated_at.desc(),
        "created": models.Book.created_at.desc(),
        "title":   models.Book.title.asc(),
        "views":   models.Book.view_count.desc(),
    }.get(sort, models.Book.updated_at.desc())

    return [_book_out(b) for b in q.order_by(order).all()]


@app.post("/api/books", response_model=schemas.BookOut, status_code=201)
def create_book(
    payload:      schemas.BookCreate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.require_author_or_admin),
):
    book = models.Book(
        title       = payload.title,
        description = payload.description,
        cover_color = payload.cover_color or "#8B0000",
        cover_image = payload.cover_image,
        genre       = payload.genre,
        tags        = payload.tags,
        pages       = [p.model_dump() for p in payload.pages],
        visibility  = payload.visibility,
        author_id   = current_user.id,
    )
    db.add(book)
    db.commit()
    db.refresh(book)

    for admin in db.query(models.User).filter(
        models.User.role != models.UserRole.reader,
        models.User.id   != current_user.id,
    ).all():
        _notify(db, admin.id, models.NotificationType.new_book,
                f"New volume: {book.title}",
                f"{current_user.username} added a new book.",
                link_id=book.id)
    db.commit()
    return _book_out(book)


@app.get("/api/books/{book_id}", response_model=schemas.BookOut)
def get_book(
    book_id:      int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    book = _get_book_or_404(book_id, db)
    if book.visibility == models.Visibility.private:
        if current_user.role != models.UserRole.admin and book.author_id != current_user.id:
            raise HTTPException(403, "This volume is private")

    book.last_opened = datetime.utcnow()
    book.view_count  = (book.view_count or 0) + 1
    db.commit()
    db.refresh(book)
    return _book_out(book)


@app.put("/api/books/{book_id}", response_model=schemas.BookOut)
def update_book(
    book_id:      int,
    payload:      schemas.BookUpdate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    book = _get_book_or_404(book_id, db)
    _assert_can_modify(current_user, book)

    update = payload.model_dump(exclude_unset=True)
    if "pages" in update and update["pages"] is not None:
        update["pages"] = [
            p.model_dump() if hasattr(p, "model_dump") else p
            for p in update["pages"]
        ]
    if "is_featured" in update and current_user.role != models.UserRole.admin:
        del update["is_featured"]

    for k, v in update.items():
        setattr(book, k, v)
    book.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(book)
    return _book_out(book)


@app.delete("/api/books/{book_id}", status_code=204)
def delete_book(
    book_id:      int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    book = _get_book_or_404(book_id, db)
    _assert_can_modify(current_user, book)
    db.delete(book)
    db.commit()


@app.put("/api/books/{book_id}/feature", response_model=schemas.BookOut)
def toggle_featured(
    book_id: int,
    db:      Session     = Depends(get_db),
    _:       models.User = Depends(auth.require_admin),
):
    book = _get_book_or_404(book_id, db)
    book.is_featured = not book.is_featured
    db.commit()
    db.refresh(book)
    return _book_out(book)


# ═══════════════════════════════════════════════════════════════════════════
# BOOKMARKS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/books/{book_id}/bookmarks",
         response_model=List[schemas.BookmarkOut])
def get_bookmarks(
    book_id:      int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Bookmark).filter(
        models.Bookmark.book_id == book_id,
        models.Bookmark.user_id == current_user.id,
    ).all()


@app.post("/api/books/{book_id}/bookmarks",
          response_model=schemas.BookmarkOut, status_code=201)
def add_bookmark(
    book_id:      int,
    payload:      schemas.BookmarkCreate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_book_or_404(book_id, db)
    if db.query(models.Bookmark).filter(
        models.Bookmark.user_id == current_user.id,
        models.Bookmark.book_id == book_id,
        models.Bookmark.page_id == payload.page_id,
    ).first():
        raise HTTPException(409, "Page already bookmarked")

    bm = models.Bookmark(
        user_id    = current_user.id,
        book_id    = book_id,
        page_id    = payload.page_id,
        page_index = payload.page_index,
        note       = payload.note,
    )
    db.add(bm)
    db.commit()
    db.refresh(bm)
    return bm


@app.delete("/api/bookmarks/{bookmark_id}", status_code=204)
def remove_bookmark(
    bookmark_id:  int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    bm = db.get(models.Bookmark, bookmark_id)
    if not bm or bm.user_id != current_user.id:
        raise HTTPException(404, "Bookmark not found")
    db.delete(bm)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════
# RATINGS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/books/{book_id}/ratings",
         response_model=List[schemas.RatingOut])
def get_ratings(
    book_id: int,
    db:      Session     = Depends(get_db),
    _:       models.User = Depends(auth.get_current_user),
):
    _get_book_or_404(book_id, db)
    return (
        db.query(models.Rating)
        .filter(models.Rating.book_id == book_id)
        .order_by(models.Rating.created_at.desc())
        .all()
    )


@app.post("/api/books/{book_id}/ratings",
          response_model=schemas.RatingOut, status_code=201)
def rate_book(
    book_id:      int,
    payload:      schemas.RatingCreate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    book = _get_book_or_404(book_id, db)
    if db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id,
        models.Rating.book_id == book_id,
    ).first():
        raise HTTPException(409, "Already rated — use PUT /api/ratings/{id}")

    rating = models.Rating(
        user_id = current_user.id,
        book_id = book_id,
        stars   = payload.stars,
        review  = payload.review,
    )
    db.add(rating)

    if book.author_id != current_user.id:
        _notify(db, book.author_id, models.NotificationType.new_review,
                f"{current_user.username} reviewed your book",
                f"Rated {payload.stars}★  {(payload.review or '')[:80]}",
                link_id=book_id)

    db.commit()
    db.refresh(rating)
    return rating


@app.put("/api/ratings/{rating_id}", response_model=schemas.RatingOut)
def update_rating(
    rating_id:    int,
    payload:      schemas.RatingCreate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    rating = db.get(models.Rating, rating_id)
    if not rating or rating.user_id != current_user.id:
        raise HTTPException(404, "Rating not found")
    rating.stars  = payload.stars
    rating.review = payload.review
    db.commit()
    db.refresh(rating)
    return rating


@app.delete("/api/ratings/{rating_id}", status_code=204)
def delete_rating(
    rating_id:    int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    rating = db.get(models.Rating, rating_id)
    if not rating or (
        rating.user_id != current_user.id and
        current_user.role != models.UserRole.admin
    ):
        raise HTTPException(404, "Rating not found")
    db.delete(rating)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════
# READING PROGRESS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/books/{book_id}/progress", response_model=schemas.ProgressOut)
def get_progress(
    book_id:      int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    prog = db.query(models.ReadingProgress).filter(
        models.ReadingProgress.user_id == current_user.id,
        models.ReadingProgress.book_id == book_id,
    ).first()
    if not prog:
        raise HTTPException(404, "No progress record yet")
    return prog


@app.put("/api/books/{book_id}/progress", response_model=schemas.ProgressOut)
def update_progress(
    book_id:      int,
    payload:      schemas.ProgressUpdate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    _get_book_or_404(book_id, db)
    prog = db.query(models.ReadingProgress).filter(
        models.ReadingProgress.user_id == current_user.id,
        models.ReadingProgress.book_id == book_id,
    ).first()
    if prog:
        prog.current_page = payload.current_page
        prog.completed    = payload.completed
        prog.updated_at   = datetime.utcnow()
    else:
        prog = models.ReadingProgress(
            user_id      = current_user.id,
            book_id      = book_id,
            current_page = payload.current_page,
            completed    = payload.completed,
        )
        db.add(prog)
    db.commit()
    db.refresh(prog)
    return prog


# ═══════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(50)
        .all()
    )


@app.put("/api/notifications/read-all", status_code=204)
def mark_all_read(
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()


@app.delete("/api/notifications/{notif_id}", status_code=204)
def delete_notification(
    notif_id:     int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    n = db.get(models.Notification, notif_id)
    if not n or n.user_id != current_user.id:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════
# STATS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/stats", response_model=schemas.ArchiveStats)
def get_stats(
    db: Session     = Depends(get_db),
    _:  models.User = Depends(auth.get_current_user),
):
    books = db.query(models.Book).all()
    return {
        "total_books":    db.query(models.Book).count(),
        "total_users":    db.query(models.User).count(),
        "total_pages":    sum(len(b.pages or []) for b in books),
        "total_reviews":  db.query(models.Rating).count(),
        "featured_count": db.query(models.Book).filter(
                              models.Book.is_featured == True
                          ).count(),
    }
