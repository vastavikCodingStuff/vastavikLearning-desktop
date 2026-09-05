/**
 * Vastavik Learning Desktop — API Client
 * Wraps all backend calls. Uses the main-process HTTP proxy to avoid CORS.
 */

const DEFAULT_BASE = 'https://api.vastaviklearning.com';

// ── Resolve base URL (user may configure their own backend) ──────────────────
async function getBaseUrl() {
  try {
    const url = await window.vastavik.store.get('backendUrl', DEFAULT_BASE);
    return url || DEFAULT_BASE;
  } catch {
    return DEFAULT_BASE;
  }
}

// ── Get stored auth token ────────────────────────────────────────────────────
async function getToken() {
  try {
    return await window.vastavik.store.get('auth_access_token', null);
  } catch {
    return null;
  }
}

// ── Core request helper ───────────────────────────────────────────────────────
async function request(method, path, body = null, requireAuth = false) {
  const base = await getBaseUrl();
  const url = `${base}${path}`;
  const headers = {};

  if (requireAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const result = await window.vastavik.api.request({
    method,
    url,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!result.ok) {
    // Surface a structured error
    const msg = result.data?.detail || result.data?.message || result.error || `HTTP ${result.status}`;
    throw new ApiError(msg, result.status, result.data);
  }

  return result.data;
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

const Auth = {
  async login(email, password) {
    return request('POST', '/api/v1/auth/login', { email, password });
  },
  async signup(name, email, password, board = 'ICSE', language = 'Java') {
    return request('POST', '/api/v1/auth/signup', { name, email, password, board, language });
  },
  async refresh(refreshToken) {
    return request('POST', '/api/v1/auth/refresh', { refresh_token: refreshToken });
  },
  async getProfile() {
    return request('GET', '/api/v1/user/profile', null, true);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CATALOG
// ═══════════════════════════════════════════════════════════════════════════════

const Catalog = {
  async getHome() {
    return request('GET', '/api/v1/catalog/home');
  },
  async getCurriculum(courseId) {
    return request('GET', `/api/v1/courses/${encodeURIComponent(courseId)}/curriculum`);
  },
  async getLesson(lessonId) {
    return request('GET', `/api/v1/lessons/${encodeURIComponent(lessonId)}`, null, true);
  },
  async markVisited(courseId, partId) {
    return request('POST', '/api/v1/progress/visited', { course_id: courseId, part_id: partId }, true);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI TUTOR
// ═══════════════════════════════════════════════════════════════════════════════

const AI = {
  async chat(prompt, history = [], model = 'mistral-god') {
    return request('POST', '/api/v1/ai/chat', { prompt, history, model }, true);
  },
  // SSE streaming via EventSource — must be called in renderer directly
  streamUrl(prompt) {
    return getBaseUrl().then((base) => `${base}/api/v1/ai/chat/stream?prompt=${encodeURIComponent(prompt)}`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════════════════════════

const Notes = {
  async list() {
    return request('GET', '/api/v1/notes', null, true);
  },
  async create(title, content, tag = 'General') {
    return request('POST', '/api/v1/notes', { title, content, tag }, true);
  },
  async delete(noteId) {
    return request('DELETE', `/api/v1/notes/${encodeURIComponent(noteId)}`, null, true);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PYQ
// ═══════════════════════════════════════════════════════════════════════════════

const PYQ = {
  async list({ board, year, subject } = {}) {
    const params = new URLSearchParams();
    if (board) params.set('board', board);
    if (year) params.set('year', year);
    if (subject) params.set('subject', subject);
    const qs = params.toString();
    return request('GET', `/api/v1/pyqs${qs ? '?' + qs : ''}`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CODE EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

const Code = {
  async execute(language, source_code, stdin = '') {
    return request('POST', '/api/v1/code/execute', { language, source_code, stdin }, true);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

const Search = {
  async query(q) {
    return request('GET', `/api/v1/search?q=${encodeURIComponent(q)}`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

const System = {
  async health() {
    return request('GET', '/api/v1/health');
  },
};

// Export
window.API = { Auth, Catalog, AI, Notes, PYQ, Code, Search, System, ApiError };
