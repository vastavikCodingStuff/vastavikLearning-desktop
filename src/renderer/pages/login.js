/** Page: Login */
window.Pages = window.Pages || {};

window.Pages.Login = {
  render() {
    return `
    <div class="auth-page fade-in">
      <div class="auth-card">
        <div class="auth-logo">🔐</div>
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-sub">Sign in to continue learning</p>

        <div id="login-error" class="b-alert b-alert--danger mb-3" style="display:none" role="alert"></div>

        <form id="login-form" novalidate>
          <div class="b-form-group">
            <label class="b-label" for="login-email">Email address</label>
            <input class="b-input" type="email" id="login-email" name="email" placeholder="you@example.com"
              autocomplete="email" required />
          </div>
          <div class="b-form-group">
            <label class="b-label" for="login-password">Password</label>
            <input class="b-input" type="password" id="login-password" name="password" placeholder="••••••••"
              autocomplete="current-password" required minlength="6" />
          </div>
          <button class="b-btn b-btn--primary b-btn--block b-btn--lg" type="submit" id="login-submit">
            Sign In
          </button>
        </form>

        <div class="auth-foot">
          <span>Don't have an account?</span>
          <button class="b-btn b-btn--ghost b-btn--sm mt-2" style="display:block;margin:8px auto 0"
            onclick="Router.navigate('signup')">Create free account →</button>
        </div>
      </div>
    </div>`;
  },

  mount() {
    const form   = document.getElementById('login-form');
    const errEl  = document.getElementById('login-error');
    const submit = document.getElementById('login-submit');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.style.display = 'none';

      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        errEl.textContent = 'Please fill in all fields.';
        errEl.style.display = 'flex';
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Signing in…';

      try {
        await AuthManager.login(email, password);
        showToast('Welcome back! 👋', 'ok');
        Router.navigate('dashboard');
      } catch (err) {
        errEl.textContent = err.message || 'Login failed. Please try again.';
        errEl.style.display = 'flex';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Sign In';
      }
    });

    document.getElementById('login-email')?.focus();
  },

  unmount() {},
};
