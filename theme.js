/**
 * Tesla Coffee — shared theme behavior: scroll reveal + star-rating rendering.
 */
(function () {
  function initReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(r => io.observe(r));
  }

  // بيرجع HTML لتقييم بالنجوم (يدعم أنصاف النجوم زي 4.5) عن طريق تراكب طبقتين:
  // نجوم رمادية في الخلفية، ونجوم داكنة فوقها بعرض = النسبة المئوية للتقييم.
  function starsHTML(rating, size) {
    const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
    const sizeAttr = size ? ` style="font-size:${size}"` : '';
    return (
      `<span class="stars"${sizeAttr}>` +
      `<span class="stars-bg">★★★★★</span>` +
      `<span class="stars-fg" style="width:${pct}%">★★★★★</span>` +
      `</span>`
    );
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // بيرندر مراجعات المنتج بصفحات (5 في كل صفحة) مع أزرار تنقل، من غير أي باكند —
  // كل البيانات جاهزة مسبقاً وبنعرضها على المتصفح فقط.
  function renderReviewsPaged(containerId, pagerId, reviews, perPage) {
    perPage = perPage || 5;
    const container = document.getElementById(containerId);
    const pager = document.getElementById(pagerId);
    if (!container) return;
    const totalPages = Math.max(1, Math.ceil(reviews.length / perPage));
    let page = 1;

    function initials(name) {
      return (name || '؟').trim().charAt(0);
    }

    function renderPage() {
      const start = (page - 1) * perPage;
      const pageItems = reviews.slice(start, start + perPage);
      container.innerHTML = pageItems.map(r => `
        <div class="review-card">
          ${starsHTML(r.rating)}
          <div class="review-title">${escapeHTML(r.title)}</div>
          <p class="review-body">${escapeHTML(r.body)}</p>
          <div class="review-meta">
            <div class="review-avatar">${escapeHTML(initials(r.name))}</div>
            <div>
              <div class="review-name">${escapeHTML(r.name)}</div>
              <div class="review-date">${escapeHTML(r.date)}</div>
            </div>
          </div>
        </div>
      `).join('');
      renderPager();
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function pageButton(n, label) {
      const active = n === page ? ' active' : '';
      return `<button type="button" class="${active.trim()}" data-page="${n}">${label != null ? label : n}</button>`;
    }

    function renderPager() {
      if (!pager) return;
      if (totalPages <= 1) { pager.innerHTML = ''; return; }
      const nums = new Set([1, totalPages, page - 1, page, page + 1]);
      let html = `<button type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹</button>`;
      let lastShown = 0;
      for (let n = 1; n <= totalPages; n++) {
        if (!nums.has(n)) continue;
        if (n - lastShown > 1) html += `<span>…</span>`;
        html += pageButton(n);
        lastShown = n;
      }
      html += `<button type="button" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>›</button>`;
      pager.innerHTML = html;
      pager.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          const n = parseInt(btn.getAttribute('data-page'));
          if (n >= 1 && n <= totalPages && n !== page) { page = n; renderPage(); }
        });
      });
    }

    if (reviews.length === 0) {
      container.innerHTML = '<p class="no-reviews">لسه مفيش تقييمات على المنتج ده — كن أول من يقيّم بعد ما تجربه!</p>';
      return;
    }
    renderPage();
  }

  window.TeslaTheme = { starsHTML, renderReviewsPaged };
  document.addEventListener('DOMContentLoaded', initReveal);
})();
