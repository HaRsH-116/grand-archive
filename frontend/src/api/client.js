import axios from "axios";

export const api = axios.create({
  baseURL: "https://grand-archive-production.up.railway.app/api",
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ga-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: clear stored token and notify the app — but DO NOT hard-reload.
// A hard reload during a login attempt would swallow the error and leave
// the user staring at a blank screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginAttempt =
        err.config?.url?.includes("/auth/login") ||
        err.config?.url?.includes("/auth/register");

      if (!isLoginAttempt) {
        // Only clear the token for non-login routes (expired session, etc.)
        localStorage.removeItem("ga-token");
        window.dispatchEvent(new Event("ga:unauthorized"));
      }
    }
    return Promise.reject(err);
  }
);

// ── Named API wrappers ────────────────────────────────────────────────────

export const authApi = {
  login:    (d) => api.post("/auth/login",    d),
  register: (d) => api.post("/auth/register", d),
  me:       ()  => api.get("/auth/me"),
  updateMe: (d) => api.put("/auth/me",        d),
};

export const booksApi = {
  list:         (p)    => api.get("/books",               { params: p }),
  featured:     ()     => api.get("/books/featured"),
  get:          (id)   => api.get(`/books/${id}`),
  create:       (d)    => api.post("/books",          d),
  update:       (id,d) => api.put(`/books/${id}`,     d),
  delete:       (id)   => api.delete(`/books/${id}`),
  toggleFeature:(id)   => api.put(`/books/${id}/feature`),
};

export const ratingsApi = {
  list:   (bookId)     => api.get(`/books/${bookId}/ratings`),
  create: (bookId, d)  => api.post(`/books/${bookId}/ratings`, d),
  update: (id,     d)  => api.put(`/ratings/${id}`,  d),
  delete: (id)         => api.delete(`/ratings/${id}`),
};

export const bookmarksApi = {
  list:   (bookId)     => api.get(`/books/${bookId}/bookmarks`),
  create: (bookId, d)  => api.post(`/books/${bookId}/bookmarks`, d),
  delete: (id)         => api.delete(`/bookmarks/${id}`),
};

export const progressApi = {
  get:    (bookId)     => api.get(`/books/${bookId}/progress`),
  update: (bookId, d)  => api.put(`/books/${bookId}/progress`, d),
};

export const notifsApi = {
  list:    ()    => api.get("/notifications"),
  readAll: ()    => api.put("/notifications/read-all"),
  delete:  (id)  => api.delete(`/notifications/${id}`),
};

export const statsApi = {
  get: () => api.get("/stats"),
};

export const usersApi = {
  list:   ()       => api.get("/users"),
  get:    (id)     => api.get(`/users/${id}`),
  update: (id, d)  => api.put(`/users/${id}`,   d),
  delete: (id)     => api.delete(`/users/${id}`),
};
