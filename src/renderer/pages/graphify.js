/**
 * Page: Graphify Reader
 * Core feature — open PDF / image files, zoom, annotate, bookmark, and ask AI to explain content.
 */
window.Pages = window.Pages || {};

window.Pages.Graphify = {
  _zoom: 1.0,
  _file: null,
  _annotations: [],
  _bookmarks: [],
  _activeTab: 'ai',
  _annotating: false,

  render() {
    return `
    <div class="graphify-layout fade-in">
      <!-- Toolbar -->
      <div class="graphify-toolbar">
        <button class="b-btn b-btn--primary b-btn--sm" id="gfy-open">📂 Open File</button>
        <div class="graphify-toolbar__title" id="gfy-filename">No file open — click Open File or drag &amp; drop</div>

        <!-- Zoom controls -->
        <div class="flex items-center gap-1">
          <button class="b-btn b-btn--ghost b-btn--sm b-btn--icon" id="gfy-zoom-out" title="Zoom out" aria-label="Zoom out">−</button>
          <span id="gfy-zoom-label" style="font-weight:700;font-size:.85rem;min-width:44px;text-align:center">100%</span>
          <button class="b-btn b-btn--ghost b-btn--sm b-btn--icon" id="gfy-zoom-in" title="Zoom in" aria-label="Zoom in">+</button>
          <button class="b-btn b-btn--ghost b-btn--sm" id="gfy-zoom-fit" title="Fit to window">Fit</button>
        </div>

        <button class="b-btn b-btn--sm" id="gfy-annotate" title="Add annotation" style="background:var(--yellow)">
          ✏️ Annotate
        </button>
        <button class="b-btn b-btn--ghost b-btn--sm" id="gfy-bookmark" title="Bookmark">🔖 Bookmark</button>
        <button class="b-btn b-btn--ghost b-btn--sm" id="gfy-export" title="Export annotations">💾 Export</button>
      </div>

      <!-- Main reading area + sidebar -->
      <div class="graphify-main">
        <!-- Viewer -->
        <div class="graphify-viewer" id="gfy-viewer" ondragover="event.preventDefault();event.dataTransfer.dropEffect='copy'" ondrop="window.Pages.Graphify._handleDrop(event)">
          <!-- Empty state / drop zone -->
          <div class="graphify-empty" id="gfy-empty">
            <div class="graphify-dropzone" id="gfy-dropzone" onclick="document.getElementById('gfy-open').click()">
              <div style="font-size:4rem;margin-bottom:16px">📖</div>
              <h3>Open a study material</h3>
              <p class="muted mt-2">Supports PDF &amp; images (PNG, JPG, WEBP)</p>
              <p class="muted" style="font-size:.8rem;margin-top:8px">Click here or drag &amp; drop a file</p>
              <button class="b-btn b-btn--primary b-btn--lg mt-3">📂 Browse Files</button>
            </div>
            <div class="flex gap-2 mt-4 wrap" style="justify-content:center">
              ${[
                { label:'Java Cheatsheet',   prompt:'Explain Java OOP concepts with examples' },
                { label:'Recursion Guide',   prompt:'Explain recursion with a stack trace example' },
                { label:'Python Basics',     prompt:'Summarise Python data types and syntax' },
                { label:'Sorting Algorithms',prompt:'Compare bubble sort, merge sort, and quick sort' },
              ].map(q => `
                <button class="b-btn b-btn--ghost b-btn--sm" onclick="window.Pages.Graphify._askAI('${q.prompt}')">
                  🤖 ${q.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- File content area -->
          <div id="gfy-content-area" style="display:none;width:100%;max-width:960px">
            <!-- image or PDF embed rendered here -->
          </div>
        </div>

        <!-- Right sidebar: AI / Annotations / Bookmarks -->
        <aside class="graphify-sidebar">
          <div class="graphify-sidebar-tabs">
            <button class="graphify-tab active" id="tab-ai" onclick="window.Pages.Graphify._switchTab('ai')">🤖 AI</button>
            <button class="graphify-tab" id="tab-ann" onclick="window.Pages.Graphify._switchTab('annotations')">✏️ Notes</button>
            <button class="graphify-tab" id="tab-bkm" onclick="window.Pages.Graphify._switchTab('bookmarks')">🔖 Marks</button>
          </div>

          <!-- AI chat panel -->
          <div class="graphify-panel" id="panel-ai">
            <div id="gfy-chat-messages" style="display:flex;flex-direction:column;gap:10px;margin-bottom:10px"></div>
            <div style="background:var(--surface2);border:2px solid var(--border);border-radius:10px;padding:8px">
              <textarea class="b-input" id="gfy-ask-input" placeholder="Ask anything about this document…"
                style="border:none;box-shadow:none;padding:6px 8px;min-height:70px;resize:none;background:transparent"
                rows="3"></textarea>
              <div class="flex justify-between items-center mt-1">
                <span style="font-size:.75rem;color:var(--text-muted)">Powered by Mistral + Gemini</span>
                <button class="b-btn b-btn--primary b-btn--sm" id="gfy-ask-btn">Ask →</button>
              </div>
            </div>
          </div>

          <!-- Annotations panel -->
          <div class="graphify-panel" id="panel-annotations" style="display:none">
            <p class="muted" style="font-size:.8rem;margin-bottom:10px">
              Click "Annotate" then click on the document to add a sticky note.
            </p>
            <div id="gfy-annotations-list"></div>
            <button class="b-btn b-btn--danger b-btn--sm b-btn--block mt-2" id="gfy-clear-ann">🗑 Clear All</button>
          </div>

          <!-- Bookmarks panel -->
          <div class="graphify-panel" id="panel-bookmarks" style="display:none">
            <div id="gfy-bookmarks-list">
              <p class="muted" style="font-size:.8rem">No bookmarks yet. Click 🔖 to bookmark the current view.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>`;
  },

  async mount() {
    this._zoom = (await window.vastavik.store.get('graphifyZoom', 1.0)) || 1.0;
    this._annotations = (await window.vastavik.store.get('graphifyAnnotations', [])) || [];
    this._bookmarks   = (await window.vastavik.store.get('graphifyBookmarks', []))   || [];
    this._renderAnnotationsList();
    this._renderBookmarksList();

    // Open file
    document.getElementById('gfy-open')?.addEventListener('click', () => this._openFile());

    // Zoom
    document.getElementById('gfy-zoom-in')?.addEventListener('click', () => this._setZoom(this._zoom + 0.15));
    document.getElementById('gfy-zoom-out')?.addEventListener('click', () => this._setZoom(this._zoom - 0.15));
    document.getElementById('gfy-zoom-fit')?.addEventListener('click', () => this._fitZoom());

    // Annotate toggle
    document.getElementById('gfy-annotate')?.addEventListener('click', () => {
      this._annotating = !this._annotating;
      const btn = document.getElementById('gfy-annotate');
      btn.style.background = this._annotating ? 'var(--pink)' : 'var(--yellow)';
      btn.style.color       = this._annotating ? 'var(--white)' : 'var(--black)';
      btn.textContent       = this._annotating ? '✖ Stop Annotating' : '✏️ Annotate';
      document.getElementById('gfy-content-area').style.cursor = this._annotating ? 'crosshair' : 'default';
    });

    // Click-to-annotate on content area
    document.getElementById('gfy-content-area')?.addEventListener('click', (e) => {
      if (!this._annotating) return;
      const text = prompt('Annotation text:');
      if (!text) return;
      const wrap = document.getElementById('gfy-content-area');
      const rect = wrap.getBoundingClientRect();
      const ann = { id: Date.now(), text, x: e.clientX - rect.left, y: e.clientY - rect.top };
      this._annotations.push(ann);
      this._saveAnnotations();
      this._renderAnnotationDot(ann);
      this._renderAnnotationsList();
    });

    // Bookmark
    document.getElementById('gfy-bookmark')?.addEventListener('click', () => {
      if (!this._file) { showToast('Open a file first', 'warn'); return; }
      const bk = { id: Date.now(), title: this._file.name, zoom: this._zoom, ts: new Date().toLocaleTimeString() };
      this._bookmarks.push(bk);
      this._saveBookmarks();
      this._renderBookmarksList();
      showToast('Bookmarked! 🔖', 'ok');
    });

    // Export annotations
    document.getElementById('gfy-export')?.addEventListener('click', async () => {
      if (!this._annotations.length) { showToast('No annotations to export', 'warn'); return; }
      const content = this._annotations.map(a => `[${a.text}]`).join('\n');
      const result = await window.vastavik.file.save({
        content: `# Graphify Annotations\nFile: ${this._file?.name || 'unknown'}\n\n${content}`,
        defaultName: 'graphify-annotations.md',
      });
      if (result.saved) showToast('Exported! ✅', 'ok');
    });

    // Clear annotations
    document.getElementById('gfy-clear-ann')?.addEventListener('click', () => {
      this._annotations = [];
      this._saveAnnotations();
      document.querySelectorAll('.graphify-annotation').forEach(el => el.remove());
      this._renderAnnotationsList();
      showToast('Annotations cleared', 'ok');
    });

    // AI ask
    document.getElementById('gfy-ask-btn')?.addEventListener('click', () => this._doAsk());
    document.getElementById('gfy-ask-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._doAsk(); }
    });

    // Pre-filled prompt from lesson page
    const prefill = AppStore.get('aiPrefill');
    if (prefill) {
      const el = document.getElementById('gfy-ask-input');
      if (el) el.value = prefill;
      AppStore.set('aiPrefill', null);
    }
  },

  async _openFile() {
    const result = await window.vastavik.file.openDialog();
    if (result.canceled || !result.filePaths?.length) return;

    const fileData = await window.vastavik.file.read(result.filePaths[0]);
    if (fileData.error) { showToast(fileData.error, 'error'); return; }

    this._file = fileData;
    this._displayFile(fileData);
  },

  async _handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const fileData = await window.vastavik.file.read(file.path);
    if (fileData.error) { showToast(fileData.error, 'error'); return; }
    this._file = fileData;
    this._displayFile(fileData);
  },

  _displayFile(fileData) {
    document.getElementById('gfy-empty').style.display        = 'none';
    document.getElementById('gfy-content-area').style.display = 'block';
    document.getElementById('gfy-filename').textContent       = fileData.name;

    const area = document.getElementById('gfy-content-area');
    // Clear previous annotations
    document.querySelectorAll('.graphify-annotation').forEach(el => el.remove());

    if (fileData.type === 'image') {
      area.innerHTML = `
        <div class="graphify-image-wrap" id="gfy-img-wrap" style="position:relative">
          <img id="gfy-img" src="${fileData.dataUrl}" alt="${fileData.name}"
            style="display:block;max-width:100%;transform:scale(${this._zoom});transform-origin:top left" />
        </div>`;
      this._updateZoomLabel();
      // Restore annotations
      this._annotations.forEach(a => this._renderAnnotationDot(a));
    } else if (fileData.type === 'pdf') {
      area.innerHTML = `
        <div style="width:100%;height:calc(100vh - 200px)">
          <object data="${fileData.dataUrl}" type="application/pdf"
            style="width:100%;height:100%;border:3px solid var(--border);border-radius:8px">
            <div class="b-alert b-alert--warn">
              PDF preview not available. <a href="#" onclick="window.vastavik.shell.openExternal('${fileData.dataUrl}');return false">Open externally</a>
            </div>
          </object>
        </div>`;
    } else {
      // Text
      area.innerHTML = `
        <div class="b-card" style="width:100%;white-space:pre-wrap;font-family:var(--font-mono);font-size:.875rem;line-height:1.7;max-height:calc(100vh - 180px);overflow-y:auto">
          ${fileData.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>`;
    }
  },

  _setZoom(z) {
    this._zoom = Math.max(0.25, Math.min(3.0, z));
    const img = document.getElementById('gfy-img');
    if (img) img.style.transform = `scale(${this._zoom})`;
    this._updateZoomLabel();
    window.vastavik.store.set('graphifyZoom', this._zoom);
  },

  _fitZoom() {
    const viewer = document.getElementById('gfy-viewer');
    const img    = document.getElementById('gfy-img');
    if (!viewer || !img) return;
    const fitZ = viewer.clientWidth / img.naturalWidth * 0.9;
    this._setZoom(fitZ);
  },

  _updateZoomLabel() {
    const el = document.getElementById('gfy-zoom-label');
    if (el) el.textContent = `${Math.round(this._zoom * 100)}%`;
  },

  _renderAnnotationDot(ann) {
    const wrap = document.getElementById('gfy-img-wrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'graphify-annotation';
    el.style.left = `${ann.x}px`;
    el.style.top  = `${ann.y}px`;
    el.title = ann.text;
    el.textContent = '📌';
    el.addEventListener('dblclick', () => {
      this._annotations = this._annotations.filter(a => a.id !== ann.id);
      this._saveAnnotations();
      el.remove();
      this._renderAnnotationsList();
    });
    wrap.appendChild(el);
  },

  _renderAnnotationsList() {
    const el = document.getElementById('gfy-annotations-list');
    if (!el) return;
    if (!this._annotations.length) {
      el.innerHTML = `<p class="muted" style="font-size:.8rem">No annotations yet.</p>`;
      return;
    }
    el.innerHTML = this._annotations.map((a, i) => `
      <div class="b-card b-card--sm mb-2" style="display:flex;gap:8px;align-items:flex-start">
        <span style="font-size:1rem;flex-shrink:0">📌</span>
        <span style="font-size:.85rem;flex:1">${a.text}</span>
        <button style="color:var(--pink);font-size:1rem;cursor:pointer;border:none;background:none"
          onclick="window.Pages.Graphify._deleteAnnotation(${a.id})">✕</button>
      </div>
    `).join('');
  },

  _deleteAnnotation(id) {
    this._annotations = this._annotations.filter(a => a.id !== id);
    this._saveAnnotations();
    this._renderAnnotationsList();
    // Re-render dots
    document.querySelectorAll('.graphify-annotation').forEach(el => el.remove());
    this._annotations.forEach(a => this._renderAnnotationDot(a));
  },

  _renderBookmarksList() {
    const el = document.getElementById('gfy-bookmarks-list');
    if (!el) return;
    if (!this._bookmarks.length) {
      el.innerHTML = `<p class="muted" style="font-size:.8rem">No bookmarks yet. Click 🔖 to bookmark the current view.</p>`;
      return;
    }
    el.innerHTML = this._bookmarks.map(b => `
      <div class="b-card b-card--sm mb-2" style="display:flex;gap:8px;align-items:center">
        <span>🔖</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b.title}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${b.ts} · ${Math.round(b.zoom * 100)}% zoom</div>
        </div>
        <button style="color:var(--pink);font-size:1rem;cursor:pointer;border:none;background:none"
          onclick="window.Pages.Graphify._deleteBookmark(${b.id})">✕</button>
      </div>
    `).join('');
  },

  _deleteBookmark(id) {
    this._bookmarks = this._bookmarks.filter(b => b.id !== id);
    this._saveBookmarks();
    this._renderBookmarksList();
  },

  async _saveAnnotations() {
    await window.vastavik.store.set('graphifyAnnotations', this._annotations);
  },
  async _saveBookmarks() {
    await window.vastavik.store.set('graphifyBookmarks', this._bookmarks);
  },

  _switchTab(tab) {
    this._activeTab = tab;
    ['ai','annotations','bookmarks'].forEach(t => {
      document.getElementById(`tab-${t === 'annotations' ? 'ann' : t === 'bookmarks' ? 'bkm' : t}`)?.classList.toggle('active', t === tab);
      document.getElementById(`panel-${t}`)?.style && (document.getElementById(`panel-${t}`).style.display = t === tab ? 'flex' : 'none');
    });
    // AI panel uses flex-direction column
    if (tab === 'ai') document.getElementById('panel-ai').style.flexDirection = 'column';
  },

  async _doAsk() {
    const input = document.getElementById('gfy-ask-input');
    const prompt = input?.value.trim();
    if (!prompt) return;

    input.value = '';
    this._appendMessage('user', prompt);
    this._appendMessage('ai', '<span class="b-msg--typing">Thinking…</span>', 'thinking');

    try {
      // Add file context hint to prompt
      const context = this._file ? `[Studying file: ${this._file.name}]\n\n` : '';
      const resp = await window.API.AI.chat(context + prompt);
      this._removeThinking();
      this._appendMessage('ai', this._renderMarkdown(resp.reply));
    } catch (err) {
      this._removeThinking();
      this._appendMessage('ai', `⚠️ ${err.message}`);
    }
  },

  async _askAI(prompt) {
    this._switchTab('ai');
    const input = document.getElementById('gfy-ask-input');
    if (input) input.value = prompt;
    await this._doAsk();
  },

  _appendMessage(role, html, id) {
    const container = document.getElementById('gfy-chat-messages');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `b-msg b-msg--${role} md-body`;
    if (id) el.id = `msg-${id}`;
    el.innerHTML = html;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  },

  _removeThinking() {
    document.getElementById('msg-thinking')?.remove();
  },

  _renderMarkdown(text) {
    // Simple markdown rendering (bold, code, headers)
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\n/g, '<br>');
  },

  unmount() {
    this._annotating = false;
  },
};
