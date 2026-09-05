/** Page: Home / Landing */
window.Pages = window.Pages || {};

window.Pages.Home = {
  render() {
    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <!-- Hero -->
      <section style="background:var(--yellow);border-bottom:3px solid var(--border);padding:48px 40px 40px">
        <div style="max-width:680px">
          <span class="b-tag b-tag--blue mb-2" style="display:inline-flex">NEW • AI Tutor powered by Gemini</span>
          <h1 style="margin-top:12px;font-size:clamp(2rem,4vw,3.2rem)">
            Learn to <span style="background:var(--pink);color:var(--white);padding:0 8px;border:3px solid var(--border);display:inline-block;transform:rotate(-2deg);box-shadow:4px 4px 0 var(--border)">Code</span>.
            Study to <span style="background:var(--lime);padding:0 8px;border:3px solid var(--border);display:inline-block;transform:rotate(1deg);box-shadow:4px 4px 0 var(--border)">Win</span>.
          </h1>
          <p style="font-size:1.1rem;color:var(--text-2);margin:20px 0 28px;max-width:520px">
            Vastavik Learning Desktop brings live courses, AI tutoring, Graphify reading, code practice, and PYQs to your computer — optimised for ICSE &amp; CBSE students.
          </p>
          <div class="flex gap-2 wrap">
            <button class="b-btn b-btn--primary b-btn--lg" onclick="Router.navigate('signup')">Get Started Free →</button>
            <button class="b-btn b-btn--ghost b-btn--lg" onclick="Router.navigate('login')">Sign In</button>
          </div>
        </div>
      </section>

      <!-- Feature strip -->
      <section style="padding:40px 40px 0">
        <div class="grid grid-auto" style="gap:16px">
          ${[
            { icon:'📖', title:'Graphify Reader', desc:'Open any PDF or image. Zoom, annotate, ask the AI to explain anything on-screen.', color:'--blue', nav:'graphify' },
            { icon:'🤖', title:'AI Tutor', desc:'Mistral + Gemini powered tutoring. Ask doubts, debug code, get step-by-step answers.', color:'--purple', nav:'ai-chat' },
            { icon:'📚', title:'Courses', desc:'ICSE &amp; CBSE curriculum. 120+ lessons with video, notes, and a live code sandbox.', color:'--orange', nav:'courses' },
            { icon:'💻', title:'Code Practice', desc:'Java, Python, C++ editor with Judge0 execution. Write, run, and submit instantly.', color:'--pink', nav:'practice' },
            { icon:'📄', title:'PYQ Archive', desc:'Past year board exam questions with official solutions. Filtered by board, year &amp; subject.', color:'--lime', nav:'pyq' },
            { icon:'📝', title:'Smart Notes', desc:'Create and organise revision notes. Export as text or markdown. Sync with your account.', color:'--yellow', nav:'notes' },
          ].map(f => `
            <article class="b-card b-card--hover" style="cursor:pointer" onclick="Router.navigate('${f.nav}')">
              <div style="width:52px;height:52px;background:var(${f.color});border:3px solid var(--border);border-radius:12px;display:grid;place-items:center;font-size:1.5rem;box-shadow:var(--shadow-sm);margin-bottom:14px">${f.icon}</div>
              <h3 style="margin-bottom:8px">${f.title}</h3>
              <p style="font-size:.9rem">${f.desc}</p>
            </article>
          `).join('')}
        </div>
      </section>

      <!-- Stats -->
      <section style="padding:40px">
        <div class="dash-stats">
          ${[['25K+','Active Learners'],['120+','Lessons'],['500+','Quizzes'],['4.9★','App Rating']].map(([n,l],i) => `
            <div class="b-stat" style="background:${['var(--yellow)','var(--pink)','var(--lime)','var(--blue)'][i]};color:${i===3||i===1?'var(--white)':'var(--black)'}">
              <div class="b-stat__num" style="color:inherit">${n}</div>
              <div class="b-stat__lbl" style="color:inherit">${l}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>`;
  },
  mount() {},
  unmount() {},
};
