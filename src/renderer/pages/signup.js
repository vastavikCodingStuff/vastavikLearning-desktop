/** Page: Signup */
window.Pages = window.Pages || {};

window.Pages.Signup = {
  render() {
    return `
    <div class="auth-page fade-in">
      <div class="auth-card">
        <div class="auth-logo">🎓</div>
        <h2 class="auth-title">Create your account</h2>
        <p class="auth-sub">Free forever. No credit card needed.</p>

        <div id="signup-error" class="b-alert b-alert--danger mb-3" style="display:none" role="alert"></div>

        <form id="signup-form" novalidate>
          <div class="b-form-group">
            <label class="b-label" for="su-name">Full name</label>
            <input class="b-input" type="text" id="su-name" placeholder="Riya Sharma" required minlength="2" />
          </div>
          <div class="b-form-group">
            <label class="b-label" for="su-email">Email address</label>
            <input class="b-input" type="email" id="su-email" placeholder="you@example.com" required />
          </div>
          <div class="b-form-group">
            <label class="b-label" for="su-password">Password</label>
            <input class="b-input" type="password" id="su-password" placeholder="At least 6 characters" required minlength="6" />
          </div>
          <div class="flex gap-2 mb-3">
            <div class="b-form-group" style="flex:1;margin-bottom:0">
              <label class="b-label" for="su-board">Board</label>
              <select class="b-input" id="su-board">
                <option value="ICSE">ICSE</option>
                <option value="CBSE">CBSE</option>
              </select>
            </div>
            <div class="b-form-group" style="flex:1;margin-bottom:0">
              <label class="b-label" for="su-lang">Language</label>
              <select class="b-input" id="su-lang">
                <option value="Java">Java</option>
                <option value="Python">Python</option>
              </select>
            </div>
          </div>
          <button class="b-btn b-btn--primary b-btn--block b-btn--lg" type="submit" id="su-submit">
            Create Account →
          </button>
        </form>

        <div class="auth-foot">
          Already have an account?
          <button class="b-btn b-btn--ghost b-btn--sm mt-2" style="display:block;margin:8px auto 0"
            onclick="Router.navigate('login')">Sign in →</button>
        </div>
      </div>
    </div>`;
  },

  mount() {
    const form   = document.getElementById('signup-form');
    const errEl  = document.getElementById('signup-error');
    const submit = document.getElementById('su-submit');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.style.display = 'none';

      const name     = document.getElementById('su-name').value.trim();
      const email    = document.getElementById('su-email').value.trim();
      const password = document.getElementById('su-password').value;
      const board    = document.getElementById('su-board').value;
      const language = document.getElementById('su-lang').value;

      if (!name || !email || !password) {
        errEl.textContent = 'Please fill in all fields.';
        errEl.style.display = 'flex';
        return;
      }
      if (password.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters.';
        errEl.style.display = 'flex';
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Creating account…';

      try {
        await AuthManager.signup(name, email, password, board, language);
        showToast(`Welcome to Vastavik, ${name}! 🎉`, 'ok', 5000);
        Router.navigate('dashboard');
      } catch (err) {
        errEl.textContent = err.message || 'Signup failed. Please try again.';
        errEl.style.display = 'flex';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Create Account →';
      }
    });

    document.getElementById('su-name')?.focus();
  },

  unmount() {},
};
