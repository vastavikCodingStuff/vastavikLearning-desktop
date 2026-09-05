# Vastavik Learning — Desktop App

> Study smarter with Graphify, AI Tutor, Courses, Code Practice & PYQs — all in one native desktop app.

Built with **ElectronJS** and the same Neo-Brutalist design system as the Vastavik web platform.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📖 **Graphify Reader** | Open PDF & image study materials. Zoom, annotate with sticky notes, bookmark views, and ask the AI to explain anything on screen. |
| 🤖 **AI Tutor** | Mistral + Gemini powered chat. Step-by-step answers, code explanations, exam tips. Full conversation history. |
| 📚 **Courses** | Browse ICSE & CBSE curriculum. Video lessons, whiteboard notes, code sandbox with Judge0 execution. |
| 💻 **Code Practice** | In-app code editor for Java, Python, C++, JavaScript. Run via Judge0 backend. Built-in challenges. |
| 📄 **PYQ Archive** | Past year board exam questions filtered by board, year, and subject. Ask AI to explain any question. |
| 📝 **My Notes** | Create, edit, and export revision notes. Notes saved from lessons & PYQs automatically tagged. |
| 🏆 **Leaderboard** | Track streaks and compete with other learners. |
| ⚙️ **Settings** | Dark/light theme, font size, custom backend URL, Graphify preferences. |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# Install dependencies
npm install

# Start in development mode (DevTools auto-opens)
npm run dev

# Start in production mode
npm start
```

### Build distributables

```bash
npm run build:win    # Windows NSIS installer
npm run build:mac    # macOS DMG
npm run build:linux  # Linux AppImage
```

---

## 🔧 Configuration

### Backend URL
By default, the app connects to `https://api.vastaviklearning.com`.

To use a **local backend** during development:
1. Start the backend: `uvicorn app.main:socket_app --reload` (in `vastavikLearning-backend-app/`)
2. Open Settings → Backend Connection → set URL to `http://localhost:8000`
3. Click **Save** then **Test**

### Environment
No `.env` needed for the desktop app — all config is in the UI Settings page, persisted via `electron-store`.

---

## 🗂️ Project Structure

```
vastavikLearning-desktop/
├── src/
│   ├── main/
│   │   ├── main.js          # Electron main process, IPC handlers
│   │   └── preload.js       # Context bridge — secure renderer API
│   ├── renderer/
│   │   ├── app.js           # Bootstrap, router registration, auth init
│   │   └── pages/           # One JS module per page
│   │       ├── home.js
│   │       ├── login.js
│   │       ├── signup.js
│   │       ├── dashboard.js
│   │       ├── courses.js
│   │       ├── lesson.js
│   │       ├── graphify.js  # ← Core Graphify reader
│   │       ├── ai-chat.js
│   │       ├── practice.js
│   │       ├── pyq.js
│   │       ├── notes.js
│   │       ├── leaderboard.js
│   │       └── settings.js
│   └── shared/
│       ├── api.js           # All backend API calls (Auth, Catalog, AI, Notes, PYQ, Code)
│       ├── auth.js          # Auth state manager
│       ├── router.js        # Hash-based SPA router with auth guards
│       └── store.js         # In-memory reactive state store
├── renderer/
│   └── index.html           # App shell (sidebar, titlebar, content area)
├── assets/
│   ├── css/
│   │   ├── design-system.css  # Neo-Brutalist tokens, cards, buttons, inputs
│   │   └── app.css            # Shell layout, sidebar, titlebar, page components
│   └── icons/                 # icon.png / icon.ico / icon.icns for builds
└── package.json
```

---

## 🛡️ Security

- `nodeIntegration: false` — no direct Node access in renderer
- `contextIsolation: true` — full context bridge isolation
- `webSecurity: true` — no mixed content
- All HTTP requests proxied through main process to avoid CORS
- JWT tokens stored in `electron-store` (encrypted on macOS Keychain / Windows DPAPI)
- External URLs always opened in the system browser, never in the Electron window

---

## 🎨 Design System

Mirrors `vastavikLearning-web` exactly:
- **Font:** Space Grotesk (display) + JetBrains Mono (code)
- **Colors:** `--yellow`, `--pink`, `--blue`, `--lime`, `--orange`, `--purple`
- **Shadows:** Hard pixel shadows (Neo-Brutalist)
- **Dark mode:** `data-theme="dark"` on `<html>`

---

## 📡 API Reference

All calls go to `/api/v1/` on the configured backend.

| Module | Endpoints used |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/signup`, `GET /user/profile` |
| Catalog | `GET /catalog/home`, `GET /courses/{id}/curriculum`, `GET /lessons/{id}` |
| AI | `POST /ai/chat`, `GET /ai/chat/stream` |
| Notes | `GET /notes`, `POST /notes`, `DELETE /notes/{id}` |
| PYQ | `GET /pyqs?board&year&subject` |
| Code | `POST /code/execute` |
| Progress | `POST /progress/visited` |
| System | `GET /health` |

---

*Built for Vastavik Learning — helping kids study smarter. 🚀*
