window.Pages = window.Pages || {};
window.Pages.Share = {
  async mount() {
    const root = document.getElementById('app-content');
    root.innerHTML = `<div class="page"><h1>Share App</h1><p class="muted">Loading...</p></div>`;
    try {
      const s = await window.API.Growth.shareStatus();
      if (!s.eligible) {
        root.innerHTML = `<div class="page"><h1>Share App — ₹10 × 2</h1><div class="card"><p>Locked — unlocks after first payment.</p></div></div>`;
        return;
      }
      root.innerHTML = `
        <div class="page">
          <h1>Share App — ₹10 × 2</h1>
          <div class="card"><p>${s.rewarded_count} / ${s.cap} shares rewarded</p><p class="muted">Share links are created on Android/web. This view is read-only.</p></div>
          <div class="card"><h3>Your share links</h3>${(s.shares||[]).length===0 ? '<p class="muted">No links yet. Create one on mobile/web.</p>' : '<ul>' + s.shares.map(x=>`<li class="mono">${x.share_url} — ${x.status} (${x.clicks} clicks)</li>`).join('') + '</ul>'}</div>
          <div class="card"><h3>Pricing</h3><p class="muted">Base ₹149 + 18% GST. Credits apply before GST.</p><div id="quote-box">Loading quote...</div></div>
        </div>`;
      try {
        const q = await window.API.Growth.pricingQuote();
        document.getElementById('quote-box').innerHTML = `Base ₹${q.base_amount} — discount ₹${q.discount_amount} + GST ₹${q.gst_amount} = <strong>₹${q.total_amount}</strong> (balance ₹${q.credit_balance_inr})`;
      } catch {}
    } catch (e) {
      root.innerHTML = `<div class="page"><h1>Share App</h1><p class="error">${e.message}</p></div>`;
    }
  },
  unmount() {}
};
