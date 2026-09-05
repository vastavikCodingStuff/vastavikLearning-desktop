/** Page: Lesson Viewer */
window.Pages = window.Pages || {};

window.Pages.Lesson = {
  _lesson: null,
  _code: '',
  _output: '// Output will appear here',

  async render(params) {
    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <div class="b-page-head b-page-head--blue">
        <div class="container">
          <div style="margin-bottom:8px">
            <button class="b-btn b-btn--ghost b-btn--sm" onclick="Router.back()"
              style="color:var(--white);border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.15)">
              ← Back to course
            </button>
          </div>
          <h2 id="lesson-title">Loading lesson…</h2>
          <p id="lesson-meta" style="opacity:.85;margin-top:4px"></p>
        </div>
      </div>

      <div id="lesson-body" class="container" style="padding-top:24px;padding-bottom:40px">
        <div class="page-loader"><div class="spinner"></div></div>
      </div>
    </div>`;
  },

  async mount(params) {
    if (!params?.lessonId) {
      document.getElementById('lesson-body').innerHTML =
        `<div class="b-alert b-alert--warn">No lesson selected.</div>`;
      return;
    }

    try {
      const lesson = await window.API.Catalog.getLesson(params.lessonId);
      this._lesson = lesson;
      this._code = lesson.code_sample || '';

      document.getElementById('lesson-title').textContent = lesson.title;
      document.getElementById('lesson-meta').textContent =
        `${params.courseTitle || ''} · ${Math.round(lesson.duration_sec / 60)} min`;

      document.getElementById('lesson-body').innerHTML = `
        <div class="lesson-layout">
          <!-- Main content -->
          <article>
            <!-- Video -->
            <div class="lesson-video mb-3" id="lesson-video">
              ${lesson.youtube_video_id
                ? `<iframe
                    width="100%" height="100%" style="border:none;position:absolute;inset:0"
                    src="https://www.youtube.com/embed/${lesson.youtube_video_id}?rel=0"
                    title="${lesson.title}" allowfullscreen
                    sandbox="allow-scripts allow-same-origin"></iframe>`
                : `<div class="lesson-play-btn" onclick="window.vastavik.shell.openExternal('${lesson.youtube_url}')">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                   </div>
                   <span style="position:absolute;bottom:12px;right:14px;font-size:.8rem;opacity:.7">Click to open in browser</span>`
              }
            </div>
            ${lesson.youtube_video_id ? '' : ''}

            <!-- Notes / description -->
            <h3 class="mt-3 mb-2">About this lesson</h3>
            <p>${lesson.description}</p>

            ${lesson.whiteboard_image_url ? `
            <div class="mt-3 mb-3">
              <h3 class="mb-2">Whiteboard Notes</h3>
              <img src="${lesson.whiteboard_image_url}" alt="Whiteboard notes" style="border:3px solid var(--border);border-radius:12px;box-shadow:var(--shadow-md);width:100%" />
            </div>` : ''}

            ${lesson.notes ? `
            <div class="b-card mb-3 mt-3">
              <h4 class="mb-2">📋 Lesson Notes</h4>
              <p style="white-space:pre-wrap;font-size:.9rem">${lesson.notes}</p>
            </div>` : ''}

            <!-- Code sandbox -->
            ${lesson.code_sample ? `
            <h3 class="mt-3 mb-2">💻 Try it yourself</h3>
            <div class="b-code">
              <div class="b-code__bar">
                <span class="b-code__dot b-code__dot--r"></span>
                <span class="b-code__dot b-code__dot--y"></span>
                <span class="b-code__dot b-code__dot--g"></span>
                <span style="margin-left:8px">sandbox</span>
              </div>
              <textarea class="b-code__editor" id="lesson-code" spellcheck="false">${lesson.code_sample}</textarea>
              <div class="b-code__output" id="lesson-output">${this._output}</div>
            </div>
            <div class="flex gap-2 mt-2 wrap">
              <button class="b-btn b-btn--primary b-btn--sm" id="run-code-btn">▶ Run</button>
              <button class="b-btn b-btn--ghost b-btn--sm" id="reset-code-btn">↺ Reset</button>
              <button class="b-btn b-btn--ghost b-btn--sm" id="ask-ai-btn">🤖 Ask AI</button>
              <button class="b-btn b-btn--ghost b-btn--sm" id="save-note-btn">📌 Save Note</button>
            </div>` : ''}

            <hr class="b-divider" />
            <div class="flex justify-between wrap" style="gap:8px">
              <button class="b-btn b-btn--ghost" onclick="Router.back()">← Previous</button>
              <button class="b-btn b-btn--primary" onclick="showToast('Great work! 🎉','ok')">Mark Complete ✓</button>
            </div>
          </article>

          <!-- Sidebar -->
          <aside>
            <div class="b-card mb-3">
              <h4 class="mb-2">📎 Resources</h4>
              <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:8px">
                ${lesson.youtube_url ? `<li>🎥 <a href="#" onclick="window.vastavik.shell.openExternal('${lesson.youtube_url}');return false">Watch on YouTube</a></li>` : ''}
                <li>📝 <a href="#" id="export-notes-link">Export notes</a></li>
              </ul>
            </div>
            <div class="b-card b-card--lime">
              <h4 class="mb-2">💬 Need help?</h4>
              <p style="font-size:.875rem">Ask the AI Tutor — instant, free, 24/7.</p>
              <button class="b-btn b-btn--dark b-btn--block b-btn--sm mt-2" onclick="Router.navigate('ai-chat')">Ask AI Tutor →</button>
            </div>
          </aside>
        </div>`;

      // Wire up code runner
      this._attachCodeRunner(lesson);

    } catch (err) {
      const isPremium = err.status === 403;
      document.getElementById('lesson-body').innerHTML = isPremium
        ? `<div class="b-alert b-alert--warn">
            <span>🔒</span>
            <div>
              <strong>Premium lesson</strong>
              <p style="margin-top:4px">Upgrade to Vastavik Pro to unlock this lesson.</p>
            </div>
           </div>`
        : `<div class="b-alert b-alert--danger">⚠️ ${err.message}</div>`;
    }
  },

  _attachCodeRunner(lesson) {
    const codeEl   = document.getElementById('lesson-code');
    const outputEl = document.getElementById('lesson-output');
    const runBtn   = document.getElementById('run-code-btn');
    const resetBtn = document.getElementById('reset-code-btn');
    const askAIBtn = document.getElementById('ask-ai-btn');
    const saveBtn  = document.getElementById('save-note-btn');
    const expLink  = document.getElementById('export-notes-link');

    if (!runBtn) return;

    runBtn.addEventListener('click', async () => {
      const code = codeEl.value;
      outputEl.textContent = '⟳ Running…';
      runBtn.disabled = true;
      try {
        const lang = lesson.code_sample?.includes('public class') ? 'java' : 'python';
        const result = await window.API.Code.execute(lang, code);
        outputEl.textContent = result.stdout || result.stderr || result.status_description;
        outputEl.className = 'b-code__output' + (result.stderr ? ' error-output' : '');
      } catch (err) {
        outputEl.textContent = `Error: ${err.message}`;
        outputEl.className = 'b-code__output error-output';
      } finally {
        runBtn.disabled = false;
      }
    });

    resetBtn?.addEventListener('click', () => {
      codeEl.value = lesson.code_sample || '';
      outputEl.textContent = '// Output will appear here';
      outputEl.className = 'b-code__output';
    });

    askAIBtn?.addEventListener('click', () => {
      AppStore.set('aiPrefill', `Explain this code:\n\n${codeEl.value}`);
      Router.navigate('ai-chat');
    });

    saveBtn?.addEventListener('click', async () => {
      try {
        await window.API.Notes.create(
          `Notes: ${lesson.title}`,
          `${lesson.notes || lesson.description}\n\n--- Code ---\n${codeEl.value}`,
          lesson.title
        );
        showToast('Note saved! 📌', 'ok');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    expLink?.addEventListener('click', async (e) => {
      e.preventDefault();
      const result = await window.vastavik.file.save({
        content: `# ${lesson.title}\n\n${lesson.notes || lesson.description}\n\n## Code\n\`\`\`\n${lesson.code_sample || ''}\n\`\`\``,
        defaultName: `${lesson.title.replace(/\s+/g, '-')}.md`,
        filters: [{ name: 'Markdown', extensions: ['md', 'txt'] }],
      });
      if (result.saved) showToast('Notes exported! ✅', 'ok');
    });
  },

  unmount() {
    this._lesson = null;
  },
};
