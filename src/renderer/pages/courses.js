/** Page: Courses Browser */
window.Pages = window.Pages || {};

window.Pages.Courses = {
  _courses: [],
  _selectedCourse: null,

  async render(params) {
    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <div class="b-page-head b-page-head--purple">
        <div class="container">
          <h2>📚 Courses</h2>
          <p style="opacity:.85;margin-top:6px">ICSE &amp; CBSE curriculum — 120+ lessons</p>
        </div>
      </div>

      <div class="page-body">
        <div id="courses-search" class="mb-3">
          <input class="b-input" type="search" id="course-search-input" placeholder="🔍 Search courses…" style="max-width:400px" />
        </div>

        <div id="courses-list" class="grid grid-3" style="gap:18px">
          ${[1,2,3].map(() => `<div class="b-card" style="height:200px;background:var(--surface2)"><div class="spinner" style="margin:60px auto"></div></div>`).join('')}
        </div>

        <!-- Curriculum panel -->
        <div id="curriculum-panel" style="display:none;margin-top:32px">
          <div class="flex items-center gap-2 mb-3">
            <button class="b-btn b-btn--ghost b-btn--sm" id="back-to-courses">← Back</button>
            <h3 id="curriculum-title">Course Curriculum</h3>
          </div>
          <div id="curriculum-content"></div>
        </div>
      </div>
    </div>`;
  },

  async mount(params) {
    // Search filter
    document.getElementById('course-search-input')?.addEventListener('input', (e) => {
      this._filterCourses(e.target.value);
    });

    document.getElementById('back-to-courses')?.addEventListener('click', () => {
      document.getElementById('curriculum-panel').style.display = 'none';
      document.getElementById('courses-list').style.display = 'grid';
      document.getElementById('courses-search').style.display = 'block';
    });

    try {
      const catalog = await window.API.Catalog.getHome();
      this._courses = catalog.courses || [];
      this._renderCourseGrid(this._courses);

      // If a courseId was passed, auto-open curriculum
      if (params?.courseId) {
        const course = this._courses.find(c => c.id === params.courseId);
        if (course) this._openCurriculum(course);
      }
    } catch (err) {
      document.getElementById('courses-list').innerHTML =
        `<div class="b-alert b-alert--warn" style="grid-column:1/-1">⚠️ ${err.message}</div>`;
    }
  },

  _filterCourses(query) {
    const q = query.toLowerCase();
    const filtered = q ? this._courses.filter(c =>
      c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    ) : this._courses;
    this._renderCourseGrid(filtered);
  },

  _renderCourseGrid(courses) {
    const el = document.getElementById('courses-list');
    if (!el) return;
    const colors = ['--blue','--lime','--purple','--orange','--pink','--yellow'];
    const icons  = ['</>','{ }','🤖','🗄️','📱','🔒'];
    const txtColor = (c) => ['--lime','--yellow'].includes(c) ? 'var(--black)' : 'var(--white)';

    if (!courses.length) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📭</div><p>No courses found.</p></div>`;
      return;
    }

    el.innerHTML = courses.map((c, i) => {
      const col = colors[i % colors.length];
      return `
      <div class="b-course" onclick="window.Pages.Courses._openCurriculum(${JSON.stringify(c).replace(/"/g, '&quot;')})">
        <div class="b-course__cover b-course__cover--code"
          style="background:var(${col});color:${txtColor(col)}">
          <span>${icons[i % icons.length]}</span>
          ${c.is_published === false ? `<span class="b-tag b-course__badge">Coming Soon</span>` : ''}
        </div>
        <div class="b-course__body">
          <div class="b-course__title">${c.title}</div>
          <div class="b-course__meta"><span>📖</span><span>${c.description?.slice(0,60)}…</span></div>
        </div>
      </div>`;
    }).join('');
  },

  async _openCurriculum(course) {
    this._selectedCourse = course;
    document.getElementById('courses-list').style.display = 'none';
    document.getElementById('courses-search').style.display = 'none';
    const panel = document.getElementById('curriculum-panel');
    panel.style.display = 'block';
    document.getElementById('curriculum-title').textContent = course.title;

    const content = document.getElementById('curriculum-content');
    content.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

    try {
      const data = await window.API.Catalog.getCurriculum(course.id);
      const parts = data.parts || [];

      if (!parts.length) {
        content.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📂</div><p>Curriculum coming soon.</p></div>`;
        return;
      }

      content.innerHTML = parts.map((part) => `
        <div class="b-card mb-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="b-tag b-tag--blue">Part ${part.order || ''}</span>
            <h4 style="margin:0">${part.title}</h4>
          </div>
          <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px">
            ${(part.subparts || []).map(sp => `
              <li class="flex items-center gap-2" style="padding:10px 12px;background:var(--surface2);border:2px solid var(--border);border-radius:10px;cursor:pointer;transition:background .12s"
                onmouseover="this.style.background='var(--yellow)'" onmouseout="this.style.background='var(--surface2)'"
                onclick="Router.navigate('lesson',{lessonId:'${sp.lesson_id}',partTitle:'${sp.title.replace(/'/g,"\\'")}',courseTitle:'${course.title.replace(/'/g,"\\'")}'})" >
                <span class="b-tag b-tag--lime b-tag--sm">▶</span>
                <span style="font-weight:600;font-size:.9rem">${sp.title}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');
    } catch (err) {
      content.innerHTML = `<div class="b-alert b-alert--warn">⚠️ ${err.message}</div>`;
    }
  },

  unmount() {
    this._selectedCourse = null;
  },
};
