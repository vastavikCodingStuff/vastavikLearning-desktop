/** Page: Leaderboard */
window.Pages = window.Pages || {};

window.Pages.Leaderboard = {
  render() {
    // Leaderboard is not a backend endpoint yet — show a motivational placeholder + local stats
    const user = AuthManager.getUser();
    return `
    <div class="fade-in" style="overflow-y:auto;height:100%">
      <div class="b-page-head b-page-head--orange">
        <div class="container">
          <h2>🏆 Leaderboard</h2>
          <p style="opacity:.85;margin-top:4px">Top learners this week</p>
        </div>
      </div>

      <div class="page-body">
        <!-- Your rank card -->
        <div class="b-card b-card--yellow mb-4 flex items-center gap-3">
          <div class="b-avatar b-avatar--lg" style="background:var(--purple)">${(user?.name || 'U')[0]}</div>
          <div>
            <div style="font-weight:900;font-size:1.2rem">${user?.name || 'You'}</div>
            <div class="muted" style="font-size:.85rem">Keep your streak going to climb the ranks! 🔥</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-family:var(--font-display);font-weight:900;font-size:1.8rem;color:var(--black)">–</div>
            <div style="font-size:.75rem;font-weight:700;text-transform:uppercase">Your Rank</div>
          </div>
        </div>

        <!-- Top learners (mock data - backend endpoint coming soon) -->
        <div class="b-alert b-alert--info mb-3">
          <span>ℹ️</span>
          <span>Live leaderboard data will load once the platform has active users. Here's a preview of the format.</span>
        </div>

        ${[
          { rank:1, name:'Arjun Patel',   board:'ICSE', streak:42, lessons:87, color:'--yellow', tc:'--black' },
          { rank:2, name:'Riya Sharma',   board:'CBSE', streak:38, lessons:74, color:null, tc:null },
          { rank:3, name:'Sneha Verma',   board:'ICSE', streak:35, lessons:69, color:null, tc:null },
          { rank:4, name:'Dev Kumar',     board:'CBSE', streak:28, lessons:61, color:null, tc:null },
          { rank:5, name:'Priya Nair',    board:'ICSE', streak:24, lessons:55, color:null, tc:null },
          { rank:6, name:'Rahul Singh',   board:'CBSE', streak:21, lessons:49, color:null, tc:null },
          { rank:7, name:'Ananya Joshi',  board:'ICSE', streak:18, lessons:44, color:null, tc:null },
          { rank:8, name:'Vikram Mehta',  board:'CBSE', streak:15, lessons:38, color:null, tc:null },
        ].map(p => `
          <div class="lb-row ${p.color ? `b-card--${p.color.replace('--','')}` : ''}">
            <div class="lb-rank lb-rank--${p.rank}">${p.rank}</div>
            <div class="b-avatar b-avatar--sm" style="background:${['var(--blue)','var(--pink)','var(--purple)','var(--orange)','var(--lime)'][p.rank % 5]};color:${p.rank % 2 === 0 ? 'var(--white)' : 'var(--black)'}">
              ${p.name[0]}
            </div>
            <div class="lb-info">
              <div class="lb-name">${p.name}</div>
              <div class="lb-score">${p.board} · ${p.lessons} lessons completed</div>
            </div>
            <div class="lb-streak">🔥 ${p.streak} days</div>
            <span class="b-tag ${p.rank <= 3 ? 'b-tag--lime' : 'b-tag--ghost'}">${p.rank <= 3 ? '🏅 Top 3' : `#${p.rank}`}</span>
          </div>
        `).join('')}

        <div class="b-card b-card--purple mt-4 text-center">
          <h3 style="color:var(--white)">Want to be on this list? 🚀</h3>
          <p style="color:rgba(255,255,255,.85);margin-top:8px">Complete lessons, maintain your streak, and ace quizzes to climb the ranks!</p>
          <button class="b-btn b-btn--yellow b-btn--lg mt-3" onclick="Router.navigate('courses')">Start Learning →</button>
        </div>
      </div>
    </div>`;
  },
  mount() {},
  unmount() {},
};
