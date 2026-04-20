"""
seed.py — Populates the Grand Archive database with:
  1 admin user
  2 demo author accounts
  4 sample books with pages

Run once before first launch. Safe to re-run (skips existing records).
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, Base, engine
from models import User, Book, UserRole, Visibility, Notification, NotificationType
from auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def upsert_user(username, email, password, role, bio="", avatar_color="#8B0000"):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        return existing
    u = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        bio=bio,
        avatar_color=avatar_color,
    )
    db.add(u)
    db.flush()
    return u

def upsert_book(title, author, **kwargs):
    existing = db.query(Book).filter(Book.title == title).first()
    if existing:
        return existing
    b = Book(title=title, author_id=author.id, **kwargs)
    db.add(b)
    db.flush()
    return b

# ── Users ──────────────────────────────────────────────────────────────────

admin = upsert_user(
    "admin", "admin@archive.local", "password", UserRole.admin,
    bio="Keeper of the Grand Archive. Oversees all volumes and scholars.",
    avatar_color="#8B0000",
)
tolkien = upsert_user(
    "tolkien_j", "tolkien@archive.local", "password", UserRole.author,
    bio="Philologist and author of mythopoeic high fantasy. Languages are my true passion.",
    avatar_color="#2C4A6E",
)
poe = upsert_user(
    "edgar_a_poe", "poe@archive.local", "password", UserRole.author,
    bio="Poet, critic, and master of the macabre. The nevermore awaits.",
    avatar_color="#1B4332",
)
reader = upsert_user(
    "reader_demo", "reader@archive.local", "password", UserRole.reader,
    bio="A humble scholar browsing the Archive's shelves.",
    avatar_color="#4A2C6B",
)

db.commit()

# ── Books ──────────────────────────────────────────────────────────────────

book1 = upsert_book(
    "The Shadow of Mordor",
    tolkien,
    description="A tale of rings, shadows, and the enduring power of fellowship across Middle-earth.",
    cover_color="#1B4332",
    genre="High Fantasy",
    tags=["fantasy", "adventure", "epic", "mythology"],
    visibility=Visibility.public,
    is_featured=True,
    pages=[
        {
            "id": "p1-1",
            "text": "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.\n\nIt had a perfectly round door like a porthole, painted green, with a shiny yellow brass knob in the exact middle.",
            "media_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Tolkien_1916.jpg/440px-Tolkien_1916.jpg",
            "media_type": "image"
        },
        {
            "id": "p1-2",
            "text": "The road goes ever on and on\nDown from the door where it began.\nNow far ahead the Road has gone,\nAnd I must follow, if I can,\nPursuing it with eager feet,\nUntil it joins some larger way\nWhere many paths and errands meet.\nAnd whither then? I cannot say.",
            "media_url": None,
            "media_type": None
        },
        {
            "id": "p1-3",
            "text": "All that is gold does not glitter,\nNot all those who wander are lost;\nThe old that is strong does not wither,\nDeep roots are not reached by the frost.\n\nFrom the ashes a fire shall be woken,\nA light from the shadows shall spring;\nRenewed shall be blade that was broken,\nThe crownless again shall be king.",
            "media_url": None,
            "media_type": None
        },
    ]
)

book2 = upsert_book(
    "The Raven and Other Shadows",
    poe,
    description="A collection of macabre verse and dark prose from the master of the Gothic imagination.",
    cover_color="#8B0000",
    genre="Gothic Poetry",
    tags=["poetry", "gothic", "horror", "classic"],
    visibility=Visibility.public,
    is_featured=True,
    pages=[
        {
            "id": "p2-1",
            "text": "Once upon a midnight dreary, while I pondered, weak and weary,\nOver many a quaint and curious volume of forgotten lore—\nWhile I nodded, nearly napping, suddenly there came a tapping,\nAs of some one gently rapping, rapping at my chamber door.\n\"'Tis some visitor,\" I muttered, \"tapping at my chamber door—\nOnly this and nothing more.\"",
            "media_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Edgar_Allan_Poe_2.jpg/440px-Edgar_Allan_Poe_2.jpg",
            "media_type": "image"
        },
        {
            "id": "p2-2",
            "text": "Deep into that darkness peering, long I stood there wondering, fearing,\nDoubting, dreaming dreams no mortal ever dared to dream before;\nBut the silence was unbroken, and the stillness gave no token,\nAnd the only word there spoken was the whispered word, \"Lenore?\"\nThis I whispered, and an echo murmured back the word, \"Lenore!\"—\nMerely this and nothing more.",
            "media_url": None,
            "media_type": None
        },
    ]
)

book3 = upsert_book(
    "Lingua Arcana: A Grammar of the Elder Tongue",
    tolkien,
    description="A scholarly examination of constructed languages and their role in world-building and mythology.",
    cover_color="#2C4A6E",
    genre="Linguistics",
    tags=["linguistics", "languages", "academic", "world-building"],
    visibility=Visibility.public,
    is_featured=False,
    pages=[
        {
            "id": "p3-1",
            "text": "Languages are not merely tools of communication — they are windows into the soul of a culture, repositories of history, and living art forms in their own right. To construct a language is to construct a civilization.\n\nThe phonology of any tongue must first emerge from the mouths that speak it, shaped by climate, culture, and the very geography of a people's homeland.",
            "media_url": None,
            "media_type": None
        },
    ]
)

book4 = upsert_book(
    "The Private Archive (Draft)",
    poe,
    description="Unpublished manuscripts and private correspondence — not yet ready for mortal eyes.",
    cover_color="#4A2C6B",
    genre="Correspondence",
    tags=["private", "draft"],
    visibility=Visibility.private,
    is_featured=False,
    pages=[
        {
            "id": "p4-1",
            "text": "These pages are for my eyes alone. The Archive is vast and the eyes that peer within are many. But this corner belongs to shadow and secrecy...",
            "media_url": None,
            "media_type": None
        },
    ]
)

db.commit()

# ── Welcome notifications ──────────────────────────────────────────────────
for u in [tolkien, poe, reader]:
    if not db.query(Notification).filter(Notification.user_id == u.id).first():
        db.add(Notification(
            user_id=u.id,
            type=NotificationType.system,
            title="Welcome to The Grand Archive!",
            body="Your study awaits. Explore the shelves, write your own volumes, and leave your mark on the Archive.",
        ))

db.commit()
db.close()
print("[seed.py] Database seeded successfully.")
print("  Users: admin, tolkien_j, edgar_a_poe, reader_demo")
print("  Password for all: password")
