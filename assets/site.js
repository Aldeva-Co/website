/* Aldeva Finance — small site behaviours (no libraries). */
(function () {
  // mobile menu
  const mb = document.querySelector('.menu-btn'), nav = document.querySelector('.nav');
  if (mb && nav) mb.addEventListener('click', () => nav.classList.toggle('open'));

  // sticky CTA after the hero leaves the screen
  const sticky = document.querySelector('.sticky-cta'), hero = document.querySelector('.hero, .page-hero');
  if (sticky && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting)).observe(hero);
  }

  // signature: 247 transactions -> 7 need you -> closed
  const dev = document.querySelector('[data-exceptions]');
  if (dev) {
    const chip = dev.querySelector('.chip'), rows = dev.querySelectorAll('.tx'), list = dev.querySelector('.tx-list'),
          exc = dev.querySelector('.exc-list'), foot = dev.querySelector('.screen-foot'), closed = dev.querySelector('.closed');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(n, cls, text) { chip.className = 'chip ' + cls; chip.textContent = text; }
    function run() {
      list.style.display = ''; exc.style.display = 'none'; closed.style.display = 'none'; foot.style.display = '';
      rows.forEach(r => r.classList.remove('ok', 'gone'));
      show(0, 'review', '247 to review');
      if (reduce) { finish(); return; }
      const start = performance.now(), dur = 2600;
      (function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const n = Math.round(247 - 240 * (1 - Math.pow(1 - p, 2)));
        chip.textContent = n + ' to review';
        rows.forEach((r, i) => {
          if (p > 0.08 + i * 0.13) r.classList.add('ok');
          if (p > 0.2 + i * 0.13) r.classList.add('gone');
        });
        if (p < 1) requestAnimationFrame(tick); else finish();
      })(start);
    }
    function finish() {
      list.style.display = 'none'; exc.style.display = '';
      show(0, 'approve', '7 to approve');
      foot.textContent = 'Everything else is already in your books.';
      setTimeout(() => { closed.style.display = 'block'; show(0, 'done', 'October closed'); foot.style.display = 'none'; }, reduce ? 0 : 2600);
      if (!reduce) setTimeout(run, 9000);
    }
    if ('IntersectionObserver' in window) {
      let started = false;
      new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; setTimeout(run, 500); } }).observe(dev);
    } else run();
  }

  // "Not sure? 2 questions" router
  const router = document.querySelector('[data-router]');
  if (router) {
    const ans = {};
    router.querySelectorAll('.chips').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      g.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on');
      ans[g.dataset.q] = b.dataset.v;
      if (ans.who && ans.rev) {
        const out = router.querySelector('.router-out');
        const growing = ans.who === 'team' || ans.rev === 'big' || (ans.who === 'pro' && ans.rev !== 'small');
        out.innerHTML = growing
          ? 'You\'re a <b>growing company</b>. <a class="link-arrow" href="growing-companies.html">See what we do for you</a>'
          : 'You\'re a <b>local business</b>. <a class="link-arrow" href="local-business.html">See what we do for you</a>';
        if (ans.who === 'pro') out.innerHTML += '<br><span class="small">Keeping your bookkeeper? <a href="keep-your-bookkeeper.html">Here\'s how that works</a>.</span>';
        out.style.display = 'block';
      }
    }));
  }

  // pricing tabs
  document.querySelectorAll('[data-tabs]').forEach(t => t.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    t.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('[data-panel]').forEach(p => p.style.display = p.dataset.panel === b.dataset.tab ? '' : 'none');
    history.replaceState(null, '', '#' + b.dataset.tab);
  }));
  const h = location.hash.slice(1), tb = document.querySelector('[data-tab="' + h + '"]');
  if (tb) tb.click();

  // 3-step free books review form (offline: nothing is sent anywhere yet)
  const form = document.querySelector('[data-review-form]');
  if (form) {
    const steps = form.querySelectorAll('.fstep'), bars = form.querySelectorAll('.progress i'), data = {};
    let cur = 0;
    const go = i => { cur = i; steps.forEach((s, k) => s.classList.toggle('on', k === i)); bars.forEach((b, k) => b.classList.toggle('on', k <= i)); };
    form.querySelectorAll('.chips').forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; e.preventDefault();
      g.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); data[g.dataset.q] = b.textContent;
    }));
    form.addEventListener('click', e => {
      const n = e.target.closest('[data-next]'), p = e.target.closest('[data-back]');
      if (p) { e.preventDefault(); go(cur - 1); }
      if (n) {
        e.preventDefault();
        const need = [...steps[cur].querySelectorAll('.chips')].filter(g => !g.querySelector('.on'));
        const err = steps[cur].querySelector('.err');
        if (need.length) { err.style.display = 'block'; return; }
        err.style.display = 'none'; go(cur + 1);
      }
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const req = [...form.querySelectorAll('[required]')].filter(i => !i.value.trim());
      const err = steps[cur].querySelector('.err');
      if (req.length) { err.style.display = 'block'; return; }
      // send the lead by email (FormSubmit; first submission asks the inbox owner to activate once)
      const v = id => (form.querySelector('#' + id) || {}).value || '';
      const payload = { _subject: 'New free books review request — ' + v('f-name'), _template: 'table', _captcha: 'false',
        name: v('f-name'), email: v('f-email'), phone: v('f-phone'), note: v('f-bug'),
        business_type: data.type || '', who_does_books: data.who || '', software: data.sw || '', revenue: data.rev || '',
        page: location.pathname };
      fetch('https://formsubmit.co/ajax/michael.pour11@gmail.com', { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, referrerPolicy: 'origin', body: JSON.stringify(payload) }).catch(() => {});
      form.querySelector('.form-body').style.display = 'none';
      form.querySelector('.form-done').style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    // preselect business type from ?type=
    const t = new URLSearchParams(location.search).get('type');
    if (t) form.querySelectorAll('[data-q="type"] button').forEach(b => { if (b.dataset.v === t) b.click(); });
  }
})();
