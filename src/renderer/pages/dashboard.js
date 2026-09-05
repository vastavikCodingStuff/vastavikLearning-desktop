/** Page: Dashboard */
window.Pages = window.Pages || {};

window.Pages.Dashboard = {
  _catalog: null,

  async render() {
    const user = AuthManager.getUser();
    const name = user?.name || 'Student';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <div class="page-header">
        <div>
          <p class="muted" style="font-size:.85rem;margin-bottom:2px">${greeting}!</p>
          <h2>${name} 👋</h2>
        </div>
        <div class="flex gap-2 items-center">
          <div class="b-tag b-tag--orange">🔥 <span id="dash-streak">–</span> day streak</div>
          <button class="b-btn b-btn--primary b-btn--sm" onclick="Router.navigate('graphify')">
            📖 Open Graphify
          </button>
        </div>
      </div>

      <div class="page-body">
        <!-- Quick stats -->
        <div class="dash-stats" id="dash-stats">
          ${['📚', '💻', '📝', '🏆'].map(ic => `
            <div class="b-stat"><div class="b-stat__num"><div class="spinner" style="width:24px;height:24px;margin:0 auto"></div></div><div class="b-stat__lbl">${ic}</div></div>
          `).join('')}
        </div>

        <!-- Quick actions -->
        <div class="dash-section-title mt-3">Quick Actions</div>
        <div class="grid grid-4 mb-4" style="gap:12px">
          ${[
            { icon:'📖', label:'Graphify Reader', nav:'graphify', color:'var(--blue)', tc:'var(--white)' },
            { icon:'🤖', label:'Ask AI Tutor',    nav:'ai-chat',  color:'var(--purple)', tc:'var(--white)' },
            { icon:'💻', label:'Code Practice',   nav:'practice', color:'var(--lime)',   tc:'var(--black)' },
            { icon:'📄', label:'PYQ Archive',     nav:'pyq',      color:'var(--yellow)', tc:'var(--black)' },
          ].map(a => `
            <button class="b-card" style="background:${a.color};color:${a.tc};cursor:pointer;text-align:center;gap:8px;display:flex;flex-direction:column;align-items:center;padding:18px;border:3px solid var(--border)"
              onclick="Router.navigate('${a.nav}')">
              <span style="font-size:1.8rem">${a.icon}</span>
              <span style="font-weight:800;font-size:.9rem">${a.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Featured courses -->
        <div class="flex justify-between items-center mb-3">
          <div class="dash-section-title" style="margin:0">Featured Courses</div>
          <button class="b-btn b-btn--ghost b-btn--sm" onclick="Router.navigate('courses')">All courses →</button>
        </div>
        <div class="grid grid-3" id="dash-courses">
          ${[1,2,3].map(() => `
            <div class="b-card" style="height:160px;background:var(--surface2)">
              <div class="spinner" style="margin:40px auto"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
  },

  async mount() {
    // Load catalog
    try {
      const catalog = await window.API.Catalog.getHome();
      this._catalog = catalog;
      this._renderCourses(catalog.courses || []);
    } catch {
      document.getElementById('dash-courses').innerHTML =
        `<div class="b-alert b-alert--warn" style="grid-column:1/-1">Could not load courses. Check your connection.</div>`;
    }

    // Load profile stats
    try {
      const profile = await window.API.Auth.getProfile();
      document.getElementById('dash-streak').textContent = profile.streak_count || 0;

      document.getElementById('dash-stats').innerHTML = `
        <div class="b-stat"><div class="b-stat__num">${profile.streak_count || 0}🔥</div><div class="b-stat__lbl">Day Streak</div></div>
        <div class="b-stat"><div class="b-stat__num">${profile.lessons_completed || 0}</div><div class="b-stat__lbl">Lessons Done</div></div>
        <div class="b-stat" style="background:${profile.is_premium ? 'var(--yellow)' : 'var(--surface)'}">
          <div class="b-stat__num">${profile.is_premium ? '⭐' : '🆓'}</div>
          <div class="b-stat__lbl">${profile.is_premium ? 'Pro Member' : 'Free Plan'}</div>
        </div>
        <div class="b-stat"><div class="b-stat__num">${profile.board || 'ICSE'}</div><div class="b-stat__lbl">Board</div></div>
      `;
    } catch { /* non-critical */ }
  },

  _renderCourses(courses) {
    const colors = ['--blue', '--lime', '--purple', '--orange', '--pink'];
    const icons  = ['</>', '{ }', '🤖', '🗄️', '📱'];
    const el = document.getElementById('dash-courses');
    if (!el) return;

    if (!courses.length) {
      el.innerHTML = `<p class="muted" style="grid-column:1/-1">No courses available yet.</p>`;
      return;
    }

    el.innerHTML = courses.slice(0, 3).map((c, i) => `
      <div class="b-course" onclick="Router.navigate('courses', {courseId:'${c.id}'})">
        <div class="b-course__cover" style="background:var(${colors[i % colors.length]});color:${i === 1 ? 'var(--black)' : 'var(--white)'}">
          ${icons[i % icons.length]}
          ${c.is_premium ? `<span class="b-tag b-tag--purple b-course__badge">PRO</span>` : ''}
        </div>
        <div class="b-course__body">
          <div class="b-course__title">${c.title}</div>
          <div class="b-course__meta">
            <span>📚 Lessons</span>
          </div>
          <div class="b-course__progress mt-2">
            <div class="b-course__progress-row"><span>Progress</span><strong>0%</strong></div>
            <div class="b-progress"><div class="b-progress__fill" style="width:0%"></div></div>
          </div>
        </div>
      </div>
    `).join('');
  },

  unmount() {},
};
