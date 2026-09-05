/** Page: AI Tutor Chat */
window.Pages = window.Pages || {};

window.Pages.AIChat = {
  _history: [],
  _isStreaming: false,

  render() {
    return `
    <div class="fade-in" style="height:100%;display:flex;flex-direction:column">
      <div class="b-page-head b-page-head--purple">
        <div class="container" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h2>🤖 AI Tutor</h2>
            <p style="opacity:.85;margin-top:4px;font-size:.9rem">Mistral + Gemini — ask anything, get step-by-step answers</p>
          </div>
          <button class="b-btn b-btn--ghost b-btn--sm" id="ai-clear-btn"
            style="color:var(--white);border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.15)">
            🗑 Clear chat
          </button>
        </div>
      </div>

      <!-- Quick prompts -->
      <div style="padding:12px 24px;border-bottom:2px solid var(--border);background:var(--surface);display:flex;gap:8px;flex-wrap:wrap">
        ${[
          'Explain recursion with an example',
          'What is OOP in Java?',
          'How does bubble sort work?',
          'Difference between ArrayList and LinkedList',
          'What is polymorphism?',
        ].map(q => `
          <button class="b-btn b-btn--ghost b-btn--sm" onclick="window.Pages.AIChat._sendPrompt('${q.replace(/'/g, "\\'")}')">
            ${q}
          </button>
        `).join('')}
      </div>

      <!-- Chat messages -->
      <div id="ai-messages" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px;background:var(--surface2)">
        <div class="b-msg b-msg--ai md-body">
          <strong>👋 Hi! I'm your Vastavik AI Tutor.</strong><br>
          Ask me anything about computer science, programming, ICSE/CBSE syllabus, or have me explain code. I'm powered by Mistral + Gemini.
        </div>
      </div>

      <!-- Input -->
      <div style="padding:14px 20px;border-top:3px solid var(--border);background:var(--surface);display:flex;gap:10px;align-items:flex-end">
        <textarea class="b-input" id="ai-input" placeholder="Ask a question…"
          style="flex:1;min-height:50px;max-height:160px;resize:none;padding:10px 14px"
          rows="2"></textarea>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="b-btn b-btn--primary" id="ai-send-btn" style="align-self:flex-end">Send →</button>
          <button class="b-btn b-btn--ghost b-btn--sm" id="ai-save-btn" style="align-self:flex-end">📌 Save</button>
        </div>
      </div>
    </div>`;
  },

  mount() {
    // Restore history
    this._history = AppStore.get('aiHistory') || [];
    this._restoreHistory();

    // Pre-filled prompt (e.g. from lesson page "Ask AI")
    const prefill = AppStore.get('aiPrefill');
    if (prefill) {
      const el = document.getElementById('ai-input');
      if (el) el.value = prefill;
      AppStore.set('aiPrefill', null);
    }

    // Event listeners
    document.getElementById('ai-send-btn')?.addEventListener('click', () => this._sendFromInput());
    document.getElementById('ai-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._sendFromInput(); }
    });
    document.getElementById('ai-clear-btn')?.addEventListener('click', () => this._clearChat());
    document.getElementById('ai-save-btn')?.addEventListener('click', () => this._saveConversation());

    // Auto-resize textarea
    const textarea = document.getElementById('ai-input');
    textarea?.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    });

    textarea?.focus();
  },

  _restoreHistory() {
    if (!this._history.length) return;
    const container = document.getElementById('ai-messages');
    if (!container) return;
    this._history.forEach(h => {
      const el = document.createElement('div');
      el.className = `b-msg b-msg--${h.role === 'user' ? 'user' : 'ai'} md-body`;
      el.innerHTML = h.role === 'user' ? this._escapeHtml(h.content) : this._renderMarkdown(h.content);
      container.appendChild(el);
    });
    container.scrollTop = container.scrollHeight;
  },

  _sendFromInput() {
    const input = document.getElementById('ai-input');
    const prompt = input?.value.trim();
    if (!prompt || this._isStreaming) return;
    input.value = '';
    input.style.height = 'auto';
    this._sendPrompt(prompt);
  },

  async _sendPrompt(prompt) {
    if (this._isStreaming) return;
    this._isStreaming = true;

    const sendBtn = document.getElementById('ai-send-btn');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '…'; }

    this._appendMessage('user', this._escapeHtml(prompt));

    const thinkingEl = this._appendMessage('ai', '<span class="b-msg--typing">✦ Thinking…</span>', true);

    try {
      const historyItems = this._history.slice(-6).map(h => ({ role: h.role, content: h.content }));
      const resp = await window.API.AI.chat(prompt, historyItems);

      thinkingEl.innerHTML = this._renderMarkdown(resp.reply);

      // Persist to history
      this._history.push({ role: 'user', content: prompt });
      this._history.push({ role: 'assistant', content: resp.reply });
      if (this._history.length > 40) this._history = this._history.slice(-40);
      AppStore.set('aiHistory', this._history);

    } catch (err) {
      thinkingEl.innerHTML = `<span style="color:var(--pink)">⚠️ ${this._escapeHtml(err.message)}</span>`;
    } finally {
      this._isStreaming = false;
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send →'; }
    }
  },

  _appendMessage(role, html, returnEl = false) {
    const container = document.getElementById('ai-messages');
    if (!container) return null;
    const el = document.createElement('div');
    el.className = `b-msg b-msg--${role} md-body`;
    el.innerHTML = html;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return returnEl ? el : undefined;
  },

  _clearChat() {
    this._history = [];
    AppStore.set('aiHistory', []);
    const container = document.getElementById('ai-messages');
    if (container) {
      container.innerHTML = `
        <div class="b-msg b-msg--ai md-body">
          <strong>Chat cleared.</strong> Ask me anything!
        </div>`;
    }
    showToast('Chat cleared', 'ok');
  },

  async _saveConversation() {
    if (!this._history.length) { showToast('Nothing to save', 'warn'); return; }
    const content = this._history
      .map(h => `**${h.role === 'user' ? 'You' : 'AI Tutor'}:** ${h.content}`)
      .join('\n\n---\n\n');
    const result = await window.vastavik.file.save({
      content: `# AI Tutor Conversation\n\n${content}`,
      defaultName: 'ai-tutor-chat.md',
    });
    if (result.saved) showToast('Saved! ✅', 'ok');
  },

  _renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;overflow-x:auto;margin:8px 0"><code>${code}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4 style="margin:.5rem 0 .25rem">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="margin:.75rem 0 .25rem">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="margin:.75rem 0 .25rem">$1</h2>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  },

  _escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  unmount() {
    this._isStreaming = false;
  },
};
