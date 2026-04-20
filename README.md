# 📚 The Grand Archive — A Luxury Digital Study

> *A high-fidelity, full-stack multimedia book creator built with a skeuomorphic aesthetic. Mahogany shelves, candlelight, gold leaf, and parchment — designed to feel like a luxury private library.*

---

## ✨ Features

### Core Application
| Feature | Description |
|---|---|
| **3D Bookshelf** | CSS `perspective-1000` shelves with lip, depth edges, and spotlight cursor effect |
| **Dual Themes** | *Midnight Study* (dark mahogany) and *Scholar's Morning* (light oak) with one-click toggle |
| **Dynamic Spotlight** | Cursor-tracking `radial-gradient` that simulates candlelight on the wood grain |
| **Aged Book System** | Books unopened for 7+ days apply a desaturation/sepia `filter` — hover partially restores them |
| **Page-Flip Animation** | Framer Motion `rotateY` transitions between pages with directional awareness |
| **Ornate Gold Frame** | Animated shimmer CSS `linear-gradient` wraps all images and videos |
| **Brass Input** | Custom `brass-input` class styles all form fields in polished metal |
| **Wax Seal Modal** | Animated delete confirmation with a `radial-gradient` wax seal SVG and spin-in animation |

### Reading Experience
| Feature | Description |
|---|---|
| **Page Navigation** | Arrow buttons, dot indicators, and direct dot-click jump |
| **Reading Progress** | Auto-saved per user per book; restored on re-open |
| **Bookmarks** | Bookmark any page; sidebar shows all bookmarks with jump-to links |
| **Star Reviews** | 5-star ratings with free-text reviews; per-book aggregated average |
| **Book Details Sidebar** | Tags, synopsis, view count, reading progress bar, average rating |

### Content Management
| Feature | Description |
|---|---|
| **Studio Mode Editor** | Parchment-styled editor with live spine preview and cover colour picker |
| **Multi-page Authoring** | Add, remove, and reorder pages; per-page text + media URL |
| **Tag System** | Comma-separated tags with pill UI; filterable on the shelf |
| **Visibility Control** | Public / Private toggle per book |
| **Cover Customisation** | 12 leather presets + custom colour picker; live spine preview |
| **Genre + Search** | Real-time search across title / genre / description; genre filter pills |

### User Management
| Feature | Description |
|---|---|
| **JWT Authentication** | Access tokens stored in `localStorage`; auto-refresh on route |
| **Three RBAC Roles** | Admin · Author · Reader (see table below) |
| **Profile Panel** | Edit bio, avatar colour; view own volumes |
| **Notifications** | In-app notification drawer with unread badge; mark-all-read; delete |
| **Admin Ledger** | Full user and book management table with role cycling and feature toggle |

### Role Permissions
| Action | Reader | Author | Admin |
|---|:---:|:---:|:---:|
| Browse & search public books | ✅ | ✅ | ✅ |
| Read books | ✅ | ✅ | ✅ |
| Leave reviews & bookmarks | ✅ | ✅ | ✅ |
| Create books | ❌ | ✅ | ✅ |
| Edit own books | ❌ | ✅ | ✅ |
| Delete own books | ❌ | ✅ | ✅ |
| Edit / delete any book | ❌ | ❌ | ✅ |
| View / manage all users | ❌ | ❌ | ✅ |
| Toggle featured books | ❌ | ❌ | ✅ |

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and npm

### Windows
```bat
run.bat
```

### macOS / Linux
```bash
chmod +x run.sh && ./run.sh
```

Both scripts will:
1. Create a Python virtual environment
2. Install all Python dependencies
3. Seed the database with demo data
4. Install Node.js dependencies
5. Start both servers
6. Open your browser

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### Demo Accounts
| Username | Password | Role |
|---|---|---|
| `admin` | `password` | Admin — full access |
| `tolkien_j` | `password` | Author — can write books |
| `edgar_a_poe` | `password` | Author — can write books |
| `reader_demo` | `password` | Reader — browse only |

---

## 📁 Project Structure

```
grand-archive/
├── run.bat                      ← Windows launcher
├── run.sh                       ← macOS/Linux launcher
│
├── backend/
│   ├── requirements.txt
│   ├── database.py              ← SQLAlchemy engine + session
│   ├── models.py                ← ORM: User, Book, Bookmark, Rating, Progress, Notification
│   ├── schemas.py               ← Pydantic request/response models
│   ├── auth.py                  ← JWT + RBAC role guards
│   ├── main.py                  ← FastAPI app + all routes
│   └── seed.py                  ← Database seeder
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               ← Root shell + view router
        ├── index.css             ← Theme tokens, wood grain, gold frame, etc.
        │
        ├── api/
        │   └── client.js         ← Axios instance + API wrappers
        │
        ├── context/
        │   ├── ThemeContext.jsx  ← Dark/Light theme provider
        │   └── AuthContext.jsx   ← Auth state + JWT management
        │
        ├── hooks/
        │   └── useSpotlight.js   ← Cursor-tracking spotlight
        │
        └── components/
            ├── ThemeToggle.jsx
            ├── SearchBar.jsx      ← Brass-accented search
            ├── OrnateFrame.jsx    ← Gold frame for media
            ├── StarRating.jsx     ← Interactive star rating
            ├── WaxSealModal.jsx   ← Animated delete confirmation
            ├── StatsBar.jsx       ← Archive-wide stats banner
            ├── NotifPanel.jsx     ← Slide-in notification drawer
            ├── AuthModal.jsx      ← Login / Register modal
            ├── Bookshelf.jsx      ← 3D shelves with aged books
            ├── BookViewer.jsx     ← Page reader + bookmarks + reviews
            ├── BookEditor.jsx     ← Studio mode page editor
            ├── ProfilePanel.jsx   ← User profile + my volumes
            └── AdminPanel.jsx     ← Admin users + books tables
```

---

## 🎨 Design System

### CSS Theme Tokens
```css
/* Dark (Midnight Study) */
--wood-base:  #3d1f0a   /* Mahogany shelf body        */
--wood-mid:   #2a1505   /* Deep shadow grain           */
--gold:       #d4af37   /* True gold leaf              */
--gold-dim:   #b8960c   /* Aged/tarnished gold         */
--leather:    #6B1A1A   /* Burgundy book leather       */
--text-hi:    #f5e6c8   /* Cream parchment text        */

/* Light (Scholar's Morning) */
--wood-base:  #c8a882   /* Light oak                   */
--leather:    #2C4A6E   /* Slate-blue binding          */
--gold:       #c4892a   /* Warm amber gold             */
```

### Typography
| Font | Usage |
|---|---|
| **Playfair Display** | Headings, titles, UI chrome, book spines |
| **Crimson Text** | Body copy, parchment pages, form labels |
| **Courier Prime** | Media URLs, monospace elements, page numbers |

### Key CSS Classes
| Class | Effect |
|---|---|
| `.wood-grain` | Repeating-gradient wood texture background |
| `.spotlight-overlay` | `radial-gradient` tracking cursor via CSS vars |
| `.parchment-page` | Warm cream background with subtle noise + vignette |
| `.ornate-frame` | Animated shimmer gold border for media |
| `.brass-input` | Dark metal gradient input with gold focus ring |
| `.wax-seal` | Red radial-gradient button with highlight and shadow |
| `.book-spine` | 3D `perspective(600px)` + hover `rotateY(-12deg)` |
| `.book-aged` | `saturate(.35) sepia(.3) brightness(.8)` filter |
| `.gold-text` | `color: var(--gold)` with text-shadow glow |
| `.tag-pill` | Small gold-bordered rounded tag |

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/register    Create account
POST /api/auth/login       Get JWT token
GET  /api/auth/me          Get current user
PUT  /api/auth/me          Update own profile
```

### Books
```
GET    /api/books              List (search, genre, sort, author_id, visibility filters)
POST   /api/books              Create (author|admin)
GET    /api/books/featured     Featured books
GET    /api/books/{id}         Get + increment view count + stamp last_opened
PUT    /api/books/{id}         Update (owner|admin)
DELETE /api/books/{id}         Delete (owner|admin)
PUT    /api/books/{id}/feature Toggle featured (admin)
```

### Social
```
GET    /api/books/{id}/ratings    List reviews
POST   /api/books/{id}/ratings    Submit review
PUT    /api/ratings/{id}          Edit own review
DELETE /api/ratings/{id}          Delete review

GET    /api/books/{id}/bookmarks  List own bookmarks for book
POST   /api/books/{id}/bookmarks  Bookmark a page
DELETE /api/bookmarks/{id}        Remove bookmark

GET    /api/books/{id}/progress   Reading progress
PUT    /api/books/{id}/progress   Update progress
```

### Admin & Notifications
```
GET    /api/users              List all users (admin)
PUT    /api/users/{id}         Update user (admin)
DELETE /api/users/{id}         Delete user (admin)

GET    /api/notifications         Own notifications
PUT    /api/notifications/read-all  Mark all read
DELETE /api/notifications/{id}    Delete notification

GET    /api/stats              Archive-wide statistics
```

---

## 🗄️ Database Schema

The `Book.pages` column uses a custom `JSONBColumn` TypeDecorator that stores a JSON list in SQLite. When migrating to PostgreSQL, swap the `impl` from `TEXT` to `postgresql.JSONB` — the application layer changes nothing.

**Page object schema:**
```json
{
  "id":         "uuid4-string",
  "text":       "Page content text",
  "media_url":  "https://example.com/image.jpg",
  "media_type": "image | video | null"
}
```

---

## 🔧 Development

### Backend only
```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

### Frontend only
```bash
cd frontend
npm run dev
```

### Re-seed database
```bash
cd backend
source venv/bin/activate
python seed.py
```

### Migrate to PostgreSQL
1. `pip install psycopg2-binary`
2. Change `SQLALCHEMY_DATABASE_URL` in `database.py`
3. In `models.py`, replace `JSONBColumn` impl from `TEXT` to `postgresql.JSONB`

---

## 📦 Dependencies

### Backend
| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `sqlalchemy` | ORM |
| `python-jose` | JWT encoding/decoding |
| `passlib[bcrypt]` | Password hashing |
| `pydantic[email]` | Schema validation |

### Frontend
| Package | Purpose |
|---|---|
| `react` | UI framework |
| `framer-motion` | Page flip, modal, and layout animations |
| `lucide-react` | Icon library |
| `axios` | HTTP client with interceptors |
| `tailwindcss` | Utility CSS framework |
| `uuid` | Page ID generation |

---

*Built with care — The Grand Archive is a luxury digital study designed to make reading and writing feel like a ritual.*
