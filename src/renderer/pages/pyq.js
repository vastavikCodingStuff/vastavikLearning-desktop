/** Page: Past Year Questions Archive */
window.Pages = window.Pages || {};

window.Pages.PYQ = {
  _pyqs: [],
  _filtered: [],

  render() {
    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <div class="b-page-head b-page-head--black">
        <div class="container">
          <h2>📄 PYQ Archive</h2>
          <p style="opacity:.85;margin-top:4px">Board exam questions with official solutions</p>
        </div>
      </div>

      <!-- Filters -->
      <div style="padding:16px 28px;background:var(--surface);border-bottom:3px solid var(--border);display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
        <div class="b-form-group" style="margin:0">
          <label class="b-label">Board</label>
          <select class="b-input" id="pyq-board" style="width:120px">
            <option value="">All</option>
            <option value="ICSE">ICSE</option>
            <option value="CBSE">CBSE</option>
          </select>
        </div>
        <div class="b-form-group" style="margin:0">
          <label class="b-label">Year</label>
          <select class="b-input" id="pyq-year" style="width:120px">
            <option value="">All</option>
            ${[2024,2023,2022,2021,2020,2019,2018].map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>
        </div>
        <div class="b-form-group" style="margin:0">
          <label class="b-label">Subject</label>
          <select class="b-input" id="pyq-subject" style="width:200px">
            <option value="">All</option>
            <option value="Computer Applications">Computer Applications</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>
        <button class="b-btn b-btn--primary b-btn--sm" id="pyq-search-btn">🔍 Search</button>
        <input class="b-input" type="search" id="pyq-text-search" placeholder="Search questions…" style="flex:1;min-width:200px;max-width:360px" />
      </div>

      <div class="page-body">
        <div id="pyq-count" class="muted mb-3" style="font-size:.85rem"></div>
        <div id="pyq-list"></div>
      </div>
    </div>`;
  },

  async mount() {
    await this._load();

    document.getElementById('pyq-search-btn')?.addEventListener('click', () => this._load());
    document.getElementById('pyq-text-search')?.addEventListener('input', (e) => this._textFilter(e.target.value));

    ['pyq-board','pyq-year','pyq-subject'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this._load());
    });
  },

  async _load() {
    const board   = document.getElementById('pyq-board')?.value   || '';
    const year    = document.getElementById('pyq-year')?.value    || '';
    const subject = document.getElementById('pyq-subject')?.value || '';

    const list = document.getElementById('pyq-list');
    list.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

    try {
      this._pyqs = await window.API.PYQ.list({ board, year, subject });
      this._filtered = [...this._pyqs];
      this._render();
    } catch (err) {
      list.innerHTML = `<div class="b-alert b-alert--warn">⚠️ ${err.message}</div>`;
    }
  },

  _textFilter(q) {
    const query = q.toLowerCase();
    this._filtered = query
      ? this._pyqs.filter(p => p.question.toLowerCase().includes(query) || p.solution.toLowerCase().includes(query))
      : [...this._pyqs];
    this._render();
  },

  _render() {
    const list  = document.getElementById('pyq-list');
    const count = document.getElementById('pyq-count');
    if (!list) return;

    if (count) count.textContent = `${this._filtered.length} question${this._filtered.length !== 1 ? 's' : ''} found`;

    if (!this._filtered.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><p>No questions found. Try different filters.</p></div>`;
      return;
    }

    list.innerHTML = this._filtered.map(p => `
      <div class="b-pyq" id="pyq-${p.id}" onclick="window.Pages.PYQ._toggle('${p.id}')">
        <div class="b-pyq__meta">
          <span class="b-tag b-tag--black">${p.board}</span>
          <span class="b-tag b-tag--ghost">${p.year}</span>
          <span class="b-tag b-tag--blue">${p.subject}</span>
          <span class="b-tag b-tag--orange">${p.marks} marks</span>
        </div>
        <div class="b-pyq__question">${this._esc(p.question)}</div>
        <div class="b-pyq__solution">
          <strong>💡 Solution:</strong><br>${this._esc(p.solution)}
          <div class="flex gap-2 mt-2">
            <button class="b-btn b-btn--ghost b-btn--sm"
              onclick="event.stopPropagation();window.Pages.PYQ._askAI('${p.question.replace(/'/g,"\\'")}')">
              🤖 Ask AI to explain
            </button>
            <button class="b-btn b-btn--ghost b-btn--sm"
              onclick="event.stopPropagation();window.Pages.PYQ._saveNote('${p.question.replace(/'/g,"\\'")}','${p.solution.replace(/'/g,"\\'")}')">
              📌 Save note
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  _toggle(id) {
    document.getElementById(`pyq-${id}`)?.classList.toggle('b-pyq--expanded');
  },

  _askAI(question) {
    AppStore.set('aiPrefill', `Explain this board exam question with a detailed solution:\n\n${question}`);
    Router.navigate('ai-chat');
  },

  async _saveNote(question, solution) {
    try {
      await window.API.Notes.create(
        `PYQ: ${question.slice(0, 60)}`,
        `**Question:**\n${question}\n\n**Solution:**\n${solution}`,
        'PYQ'
      );
      showToast('Note saved! 📌', 'ok');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  unmount() {},
};
