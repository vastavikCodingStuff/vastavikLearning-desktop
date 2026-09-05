/** Page: My Notes */
window.Pages = window.Pages || {};

window.Pages.Notes = {
  _notes: [],
  _editingId: null,

  render() {
    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <div class="b-page-head b-page-head--lime">
        <div class="container" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h2>📝 My Notes</h2>
            <p style="margin-top:4px">Revision notes, saved from lessons &amp; PYQs</p>
          </div>
          <button class="b-btn b-btn--dark b-btn--sm" id="notes-new-btn">+ New Note</button>
        </div>
      </div>

      <div class="page-body">
        <!-- Create / Edit form -->
        <div id="note-form" class="b-card mb-4" style="display:none">
          <h4 class="mb-3" id="note-form-title">New Note</h4>
          <div class="b-form-group">
            <label class="b-label" for="note-title-input">Title</label>
            <input class="b-input" type="text" id="note-title-input" placeholder="Note title…" />
          </div>
          <div class="b-form-group">
            <label class="b-label" for="note-tag-input">Tag</label>
            <input class="b-input" type="text" id="note-tag-input" placeholder="e.g. OOP, Recursion, PYQ" />
          </div>
          <div class="b-form-group">
            <label class="b-label" for="note-content-input">Content</label>
            <textarea class="b-input" id="note-content-input" rows="6" placeholder="Write your note…"></textarea>
          </div>
          <div class="flex gap-2">
            <button class="b-btn b-btn--primary" id="note-save-btn">💾 Save Note</button>
            <button class="b-btn b-btn--ghost" id="note-cancel-btn">Cancel</button>
          </div>
        </div>

        <!-- Search -->
        <div class="flex gap-2 mb-3">
          <input class="b-input" type="search" id="notes-search" placeholder="🔍 Search notes…" style="max-width:360px" />
          <button class="b-btn b-btn--ghost b-btn--sm" id="notes-export-all-btn">📥 Export All</button>
        </div>

        <!-- Notes grid -->
        <div id="notes-list" class="grid grid-3" style="gap:16px">
          <div class="page-loader" style="grid-column:1/-1"><div class="spinner"></div></div>
        </div>
      </div>
    </div>`;
  },

  async mount() {
    await this._loadNotes();

    document.getElementById('notes-new-btn')?.addEventListener('click', () => this._showForm());
    document.getElementById('note-cancel-btn')?.addEventListener('click', () => this._hideForm());
    document.getElementById('note-save-btn')?.addEventListener('click', () => this._saveNote());
    document.getElementById('notes-export-all-btn')?.addEventListener('click', () => this._exportAll());
    document.getElementById('notes-search')?.addEventListener('input', (e) => this._filterNotes(e.target.value));
  },

  async _loadNotes() {
    const list = document.getElementById('notes-list');
    try {
      this._notes = await window.API.Notes.list();
      this._renderNotes(this._notes);
    } catch (err) {
      list.innerHTML = `<div class="b-alert b-alert--warn" style="grid-column:1/-1">⚠️ ${err.message}</div>`;
    }
  },

  _filterNotes(query) {
    const q = query.toLowerCase();
    const filtered = q
      ? this._notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tag.toLowerCase().includes(q))
      : this._notes;
    this._renderNotes(filtered);
  },

  _renderNotes(notes) {
    const list = document.getElementById('notes-list');
    if (!list) return;

    if (!notes.length) {
      list.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📝</div><h3>No notes yet</h3><p>Create your first note or save one from a lesson.</p></div>`;
      return;
    }

    const tagColors = { OOP:'--purple', Recursion:'--blue', PYQ:'--black', General:'--orange', Python:'--lime', Java:'--blue' };

    list.innerHTML = notes.map(note => `
      <div class="b-note">
        <div class="b-note__header">
          <div>
            <div class="b-note__title">${this._esc(note.title)}</div>
            <div style="margin-top:4px">
              <span class="b-tag b-tag--ghost" style="font-size:.65rem">${note.tag || 'General'}</span>
              <span style="font-size:.75rem;color:var(--text-muted);margin-left:6px">${new Date(note.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="flex gap-1">
            <button class="b-btn b-btn--ghost b-btn--sm b-btn--icon" title="Edit"
              onclick="window.Pages.Notes._editNote('${note.id}')">✏️</button>
            <button class="b-btn b-btn--ghost b-btn--sm b-btn--icon" title="Delete"
              onclick="window.Pages.Notes._deleteNote('${note.id}')">🗑️</button>
          </div>
        </div>
        <div class="b-note__content">${this._esc(note.content.slice(0, 200))}${note.content.length > 200 ? '…' : ''}</div>
        <div class="flex gap-1 mt-2">
          <button class="b-btn b-btn--ghost b-btn--sm" onclick="window.Pages.Notes._exportNote('${note.id}')">💾 Export</button>
          <button class="b-btn b-btn--ghost b-btn--sm" onclick="window.Pages.Notes._askAI('${note.id}')">🤖 Ask AI</button>
        </div>
      </div>
    `).join('');
  },

  _showForm(note) {
    const form = document.getElementById('note-form');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('note-form-title').textContent = note ? 'Edit Note' : 'New Note';
    document.getElementById('note-title-input').value   = note?.title   || '';
    document.getElementById('note-content-input').value = note?.content || '';
    document.getElementById('note-tag-input').value     = note?.tag     || '';
    this._editingId = note?.id || null;
    document.getElementById('note-title-input').focus();
  },

  _hideForm() {
    document.getElementById('note-form').style.display = 'none';
    this._editingId = null;
  },

  async _saveNote() {
    const title   = document.getElementById('note-title-input').value.trim();
    const content = document.getElementById('note-content-input').value.trim();
    const tag     = document.getElementById('note-tag-input').value.trim() || 'General';

    if (!title || !content) { showToast('Title and content are required', 'warn'); return; }

    const saveBtn = document.getElementById('note-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    try {
      if (this._editingId) {
        // Backend doesn't have a PUT — delete + recreate
        await window.API.Notes.delete(this._editingId);
      }
      await window.API.Notes.create(title, content, tag);
      this._hideForm();
      await this._loadNotes();
      showToast('Note saved! ✅', 'ok');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save Note';
    }
  },

  _editNote(id) {
    const note = this._notes.find(n => n.id === id);
    if (note) this._showForm(note);
  },

  async _deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    try {
      await window.API.Notes.delete(id);
      await this._loadNotes();
      showToast('Note deleted', 'ok');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async _exportNote(id) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    const result = await window.vastavik.file.save({
      content: `# ${note.title}\nTag: ${note.tag}\n\n${note.content}`,
      defaultName: `${note.title.replace(/\s+/g,'-').slice(0,40)}.md`,
    });
    if (result.saved) showToast('Exported! ✅', 'ok');
  },

  async _exportAll() {
    if (!this._notes.length) { showToast('No notes to export', 'warn'); return; }
    const content = this._notes
      .map(n => `# ${n.title}\n_Tag: ${n.tag} | ${n.created_at}_\n\n${n.content}`)
      .join('\n\n---\n\n');
    const result = await window.vastavik.file.save({
      content: `# My Vastavik Notes\n\n${content}`,
      defaultName: 'vastavik-all-notes.md',
    });
    if (result.saved) showToast('All notes exported! ✅', 'ok');
  },

  _askAI(id) {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;
    AppStore.set('aiPrefill', `Please explain and elaborate on this note:\n\n**${note.title}**\n\n${note.content}`);
    Router.navigate('ai-chat');
  },

  _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  unmount() {},
};
