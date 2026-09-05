/**
 * Vastavik Learning Desktop — App Bootstrap
 * Initialises auth, router, registers pages, and boots the SPA.
 */

// ── Toast system ─────────────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  const icons = { ok: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };
  el.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}
window.showToast = showToast;

// ── Window controls ───────────────────────────────────────────────────────────
document.getElementById('btn-minimize')?.addEventListener('click', () => window.vastavik.window.minimize());
document.getElementById('btn-maximize')?.addEventListener('click', () => window.vastavik.window.maximize());
document.getElementById('btn-close')?.addEventListener('click', () => window.vastavik.window.close());

// ── Sidebar toggle ─────────────────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
  sidebar?.classList.toggle('collapsed');
  window.vastavik.store.set('sidebarCollapsed', sidebar?.classList.contains('collapsed'));
});

// ── Zoom via keyboard shortcuts ───────────────────────────────────────────────
window.vastavik.nav.onZoomIn(() => {
  const z = Math.min(2.0, (AppStore.get('graphifyZoom') || 1.0) + 0.1);
  AppStore.set('graphifyZoom', z);
});
window.vastavik.nav.onZoomOut(() => {
  const z = Math.max(0.3, (AppStore.get('graphifyZoom') || 1.0) - 0.1);
  AppStore.set('graphifyZoom', z);
});

// ── Menu-driven navigation ────────────────────────────────────────────────────
['home', 'courses', 'ai-chat', 'graphify', 'pyq', 'notes'].forEach(page => {
  window.vastavik.nav[`on${page.charAt(0).toUpperCase() + page.slice(1).replace('-', '')}`]?.((p) => Router.navigate(p));
});

// ── Register all routes ───────────────────────────────────────────────────────
Router.register('home',        window.Pages.Home);
Router.register('login',       window.Pages.Login);
Router.register('signup',      window.Pages.Signup);
Router.register('dashboard',   window.Pages.Dashboard);
Router.register('courses',     window.Pages.Courses);
Router.register('lesson',      window.Pages.Lesson);
Router.register('graphify',    window.Pages.Graphify);
Router.register('ai-chat',     window.Pages.AIChat);
Router.register('practice',    window.Pages.Practice);
Router.register('pyq',         window.Pages.PYQ);
Router.register('notes',       window.Pages.Notes);
Router.register('leaderboard', window.Pages.Leaderboard);
Router.register('settings',    window.Pages.Settings);

// ── Auth state → sidebar user widget ─────────────────────────────────────────
function updateSidebarUser(user) {
  const userEl    = document.getElementById('sidebar-user');
  const avatarEl  = document.getElementById('sidebar-avatar');
  const nameEl    = document.getElementById('sidebar-user-name');
  const roleEl    = document.getElementById('sidebar-user-role');

  if (user) {
    userEl.style.display = 'flex';
    avatarEl.textContent = (user.name || 'U')[0].toUpperCase();
    nameEl.textContent   = user.name || 'Student';
    roleEl.textContent   = user.is_premium ? '⭐ Pro' : 'Free';
  } else {
    userEl.style.display = 'none';
  }
}

// ── Theme application ─────────────────────────────────────────────────────────
async function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  await window.vastavik.theme.set(theme);
}
window.applyTheme = applyTheme;

// ── Boot sequence ─────────────────────────────────────────────────────────────
async function boot() {
  // Restore persisted theme
  const savedTheme = await window.vastavik.theme.get();
  document.documentElement.setAttribute('data-theme', savedTheme || 'light');

  // Restore sidebar state
  const collapsed = await window.vastavik.store.get('sidebarCollapsed', false);
  if (collapsed) sidebar?.classList.add('collapsed');

  // Init auth
  await AuthManager.init();
  AuthManager.onChange(updateSidebarUser);
  updateSidebarUser(AuthManager.getUser());

  // Determine start page
  const hash = window.location.hash.replace('#', '');
  const startPage = AuthManager.isLoggedIn()
    ? (hash && hash !== '' ? hash : 'dashboard')
    : 'home';

  // Hide sidebar on public pages
  function toggleSidebarVisibility(page) {
    const publicPages = ['home', 'login', 'signup'];
    const shell = document.getElementById('app-shell');
    shell?.classList.toggle('no-sidebar', publicPages.includes(page));
  }

  const originalNavigate = Router.navigate.bind(Router);
  Router.navigate = async function(name, params, push) {
    toggleSidebarVisibility(name);
    return originalNavigate(name, params, push);
  };

  toggleSidebarVisibility(startPage);
  await Router.navigate(startPage, {}, false);
}

boot().catch(console.error);
