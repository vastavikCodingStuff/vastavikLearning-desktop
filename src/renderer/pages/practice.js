/** Page: Code Practice — in-browser code editor + Judge0 execution */
window.Pages = window.Pages || {};

window.Pages.Practice = {
  _lang: 'python',
  _running: false,

  _starters: {
    python: `# Python practice\nname = "Vastavik"\nprint(f"Hello, {name}!")`,
    java:   `// Java practice\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Vastavik!");\n    }\n}`,
    cpp:    `// C++ practice\n#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, Vastavik!" << endl;\n    return 0;\n}`,
    javascript: `// JavaScript practice\nconst name = "Vastavik";\nconsole.log(\`Hello, \${name}!\`);`,
  },

  render() {
    return `
    <div class="fade-in" style="height:100%;display:flex;flex-direction:column">
      <!-- Toolbar -->
      <div class="practice-toolbar">
        <span style="font-weight:800;font-size:.95rem">💻 Code Practice</span>

        <select class="b-input" id="lang-select" style="width:auto;padding:6px 10px;font-size:.85rem">
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="javascript">JavaScript</option>
        </select>

        <button class="b-btn b-btn--primary b-btn--sm" id="run-btn">▶ Run</button>
        <button class="b-btn b-btn--ghost b-btn--sm" id="reset-btn">↺ Reset</button>
        <button class="b-btn b-btn--ghost b-btn--sm" id="ask-ai-practice-btn">🤖 Ask AI</button>
        <button class="b-btn b-btn--ghost b-btn--sm" id="save-practice-btn">💾 Save</button>

        <div style="flex:1"></div>
        <span class="b-tag" id="run-status" style="display:none"></span>
      </div>

      <!-- Editor + Output split -->
      <div class="practice-layout" style="flex:1;overflow:hidden">
        <!-- Editor pane -->
        <div class="practice-editor-pane">
          <div style="padding:6px 14px;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;background:#2d2d2d;color:#aaa;border-bottom:2px solid var(--border)">
            editor.${this._lang}
          </div>
          <div class="editor-wrap">
            <textarea id="code-editor" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"
              style="width:100%;height:100%">${this._starters[this._lang]}</textarea>
          </div>
          <div style="padding:6px 14px;display:flex;gap:8px;background:#1e1e1e;border-top:2px solid var(--border)">
            <span style="font-size:.75rem;color:#888">Tab = 4 spaces · Ctrl+Enter to run</span>
          </div>
        </div>

        <!-- Output pane -->
        <div class="practice-output-pane">
          <div class="output-head">▶ Output</div>
          <div class="output-body" id="output-body" aria-live="polite" aria-label="Code output">
// Click Run to execute your code
          </div>

          <!-- stdin -->
          <div style="border-top:2px solid var(--border);padding:8px 14px;background:var(--surface)">
            <label class="b-label" style="font-size:.7rem">STDIN (optional)</label>
            <textarea class="b-input" id="stdin-input" placeholder="Enter program input…"
              style="min-height:50px;font-family:var(--font-mono);font-size:.85rem;resize:none" rows="2"></textarea>
          </div>

          <!-- AI suggestions -->
          <div style="border-top:2px solid var(--border);padding:12px 14px;background:var(--surface);flex-shrink:0">
            <div style="font-weight:800;font-size:.8rem;text-transform:uppercase;margin-bottom:8px">💡 Practice Challenges</div>
            <div style="display:flex;flex-direction:column;gap:6px" id="challenges-list">
              ${[
                { label:'Fibonacci series', code:'def fibonacci(n):\n    # Write your solution\n    pass\nprint(fibonacci(10))' },
                { label:'Reverse a string',  code:'s = "Hello Vastavik"\n# Reverse the string\nprint(s[::-1])' },
                { label:'Check palindrome',  code:'def is_palindrome(s):\n    # Return True if palindrome\n    pass\nprint(is_palindrome("racecar"))' },
                { label:'Bubble sort',        code:'arr = [64, 34, 25, 12, 22, 11, 90]\n# Sort using bubble sort\nprint(arr)' },
              ].map(c => `
                <button class="b-btn b-btn--ghost b-btn--sm" style="justify-content:flex-start"
                  onclick="window.Pages.Practice._loadChallenge('${c.label}', \`${c.code.replace(/`/g,'\\`')}\`)">
                  📌 ${c.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  },

  mount() {
    const editor   = document.getElementById('code-editor');
    const langSel  = document.getElementById('lang-select');
    const runBtn   = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-btn');

    langSel?.addEventListener('change', (e) => {
      this._lang = e.target.value;
      editor.value = this._starters[this._lang];
      document.querySelector('.practice-editor-pane > div')?.textContent && null;
    });

    runBtn?.addEventListener('click', () => this._runCode());
    resetBtn?.addEventListener('click', () => {
      editor.value = this._starters[this._lang];
      document.getElementById('output-body').textContent = '// Resetted. Click Run to execute.';
      document.getElementById('output-body').className = 'output-body';
    });

    // Ctrl+Enter to run
    editor?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this._runCode(); }
      // Tab → 4 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end   = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
      }
    });

    document.getElementById('ask-ai-practice-btn')?.addEventListener('click', () => {
      AppStore.set('aiPrefill', `Explain and debug this code:\n\n${editor?.value}`);
      Router.navigate('ai-chat');
    });

    document.getElementById('save-practice-btn')?.addEventListener('click', async () => {
      const result = await window.vastavik.file.save({
        content: editor?.value || '',
        defaultName: `practice.${this._lang === 'javascript' ? 'js' : this._lang === 'cpp' ? 'cpp' : this._lang}`,
        filters: [{ name: 'Source Code', extensions: [this._lang === 'javascript' ? 'js' : this._lang === 'cpp' ? 'cpp' : this._lang] }],
      });
      if (result.saved) showToast('Saved! ✅', 'ok');
    });
  },

  async _runCode() {
    if (this._running) return;
    const editor = document.getElementById('code-editor');
    const output = document.getElementById('output-body');
    const status = document.getElementById('run-status');
    const code   = editor?.value?.trim();
    const stdin  = document.getElementById('stdin-input')?.value || '';

    if (!code) { showToast('Write some code first!', 'warn'); return; }

    this._running = true;
    const runBtn = document.getElementById('run-btn');
    if (runBtn) { runBtn.disabled = true; runBtn.textContent = '⟳ Running…'; }
    output.textContent = '⟳ Executing on Judge0…';
    output.className = 'output-body';
    status && (status.style.display = 'none');

    try {
      const result = await window.API.Code.execute(this._lang, code, stdin);
      const hasError = !result.success || result.stderr;

      output.className = 'output-body' + (hasError ? ' error-output' : '');
      output.textContent = [
        result.stdout && `📤 Output:\n${result.stdout}`,
        result.stderr && `⚠️ Errors:\n${result.stderr}`,
        result.execution_time && `\n⏱ Time: ${result.execution_time}ms`,
        result.memory_kb && `💾 Memory: ${result.memory_kb}KB`,
        !result.stdout && !result.stderr && `Status: ${result.status_description}`,
      ].filter(Boolean).join('\n') || result.status_description;

      if (status) {
        status.style.display = 'inline-flex';
        status.className = `b-tag ${hasError ? 'b-tag--orange' : 'b-tag--lime'}`;
        status.textContent = hasError ? '⚠ Errors' : '✓ Success';
      }
    } catch (err) {
      output.textContent = `Network error: ${err.message}\n\nTip: Make sure the backend is running.`;
      output.className = 'output-body error-output';
    } finally {
      this._running = false;
      if (runBtn) { runBtn.disabled = false; runBtn.textContent = '▶ Run'; }
    }
  },

  _loadChallenge(label, code) {
    const editor = document.getElementById('code-editor');
    if (editor) editor.value = code;
    this._lang = 'python';
    document.getElementById('lang-select').value = 'python';
    showToast(`Loaded: ${label}`, 'info');
  },

  unmount() {
    this._running = false;
  },
};
