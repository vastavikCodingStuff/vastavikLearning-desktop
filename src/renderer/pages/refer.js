window.Pages = window.Pages || {};
window.Pages.Refer = {
  async mount() {
    const root = document.getElementById('app-content');
    root.innerHTML = `<div class="page"><h1>Refer & Earn</h1><p class="muted">Loading...</p></div>`;
    try {
      const s = await window.API.Growth.referralStatus();
      const code = s.code || '—';
      const eligible = s.eligible;
      root.innerHTML = `
        <div class="page">
          <h1>Refer & Earn — ₹25 × 3</h1>
          ${!eligible ? `<div class="card"><p>Locked — unlocks after first payment or offline coupon.</p><p class="muted">Complete a payment on Android/web to generate your code.</p></div>` : `
          <div class="card" style="text-align:center;padding:24px">
            <p class="muted">Your referral code</p>
            <div style="font-size:42px;font-weight:900;letter-spacing:6px">${code}</div>
            <p class="muted">${s.rewarded_count} / ${s.cap} rewarded · Balance ₹${(s.credit_balance_inr||0).toFixed(2)}</p>
            <button class="btn btn--primary" onclick="navigator.clipboard.writeText('${code}'); window.showToast('Copied','ok')">Copy Code</button>
            <button class="btn" style="margin-left:8px" onclick="navigator.clipboard.writeText('Join Vastavik Pro! Code ${code} — https://vastavikcomputers.firebaseapp.com/r/${code}'); window.showToast('Share text copied','ok')">Share</button>
          </div>
          <div class="card"><h3>History</h3>${(s.history||[]).length===0 ? '<p class="muted">No referrals yet.</p>' : '<ul>' + s.history.map(h=>`<li>${h.referee_email||h.referee_uid} — ${h.status} ${h.status==='rewarded' ? '+₹'+h.reward_amount : ''}</li>`).join('') + '</ul>'}</div>
          `}
        </div>`;
    } catch (e) {
      root.innerHTML = `<div class="page"><h1>Refer & Earn</h1><p class="error">${e.message}</p></div>`;
    }
  },
  unmount() {}
};
