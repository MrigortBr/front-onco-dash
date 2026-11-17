// layout: abas no cabeçalho, sidebar de filtros (padrão SIMDASH), perfil
(function () {
  const A = window.AO;
  const root = document.getElementById('painel');
  const perfilSel = document.getElementById('ao-perfil-sel');
  const mapaSel = document.getElementById('ao-mapa-sel');
  const sideToggle = document.getElementById('ao-side-toggle');
  const fab = document.getElementById('ao-side-fab');
  const scrim = document.getElementById('ao-side-scrim');
  const mobile = () => window.matchMedia('(max-width:900px)').matches;
  const clearAll = () => { const p = { dt_ini: '', dt_fim: '' }; A.FKEYS.forEach(([k]) => { p[k] = ''; }); return p; };
  const firstEscopo = (perfil) => {
    const all = A.base(); const k = A.SCOPE[perfil]; if (!all || !k) return '';
    const counts = d3.rollups(all, (v) => v.length, (r) => r[k]).sort((a, b) => b[1] - a[1]);
    return counts.length ? counts[0][0] : '';
  };
  if (perfilSel) perfilSel.addEventListener('change', () => { const v = perfilSel.value; dash.setParams(Object.assign(clearAll(), { perfil: v, escopo: firstEscopo(v) })); });
  if (mapaSel) mapaSel.addEventListener('change', () => dash.setParams({ mapa: mapaSel.value }));
  // recolher/expandir (desktop) e gaveta (celular), como o GlobalFilterPanel do SIMDASH
  const setSide = (open) => {
    if (mobile()) { root.classList.toggle('ao-side-open', open); root.classList.remove('ao-collapsed'); }
    else root.classList.toggle('ao-collapsed', !open);
    const label = open ? 'Recolher painel de filtros' : 'Mostrar painel de filtros';
    sideToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    sideToggle.setAttribute('aria-label', label); sideToggle.title = label;
    sideToggle.textContent = open ? '◀' : '▶';
    window.dispatchEvent(new Event('resize'));
  };
  const isOpen = () => (mobile() ? root.classList.contains('ao-side-open') : !root.classList.contains('ao-collapsed'));
  sideToggle.addEventListener('click', () => setSide(!isOpen()));
  if (fab) fab.addEventListener('click', () => setSide(true));
  if (scrim) scrim.addEventListener('click', () => setSide(false));
  const closeMap = (card) => { if (!card) return; card.classList.remove('ao-map-focus'); document.body.style.overflow = ''; window.dispatchEvent(new Event('resize')); };
  root.addEventListener('click', (ev) => {
    const open = ev.target.closest('[data-map-expand]');
    const close = ev.target.closest('[data-map-close]');
    if (open) { const card = open.closest('.ao-card'); if (card) { card.classList.add('ao-map-focus'); document.body.style.overflow = 'hidden'; window.dispatchEvent(new Event('resize')); } }
    if (close) closeMap(close.closest('.ao-card'));
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { closeMap(root.querySelector('.ao-map-focus')); if (mobile() && isOpen()) setSide(false); } });
  const lim = document.getElementById('ao-limpar');
  if (lim) lim.addEventListener('click', () => dash.setParams(clearAll()));
  // abas do cabeçalho (com setas do teclado)
  const tabs = [...root.querySelectorAll('.ao-tab')];
  const show = (id, link = true) => {
    let found = false;
    root.querySelectorAll('section[data-sec]').forEach((s) => { const on = s.id === id; s.hidden = !on; if (on) found = true; });
    if (!found) return false;
    tabs.forEach((t) => { const on = t.dataset.tab === id; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
    if (link) { dash.setLink(id); window.scrollTo({ top: 0 }); } return true;
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(t.dataset.tab));
    t.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      ev.preventDefault(); const n = tabs[(i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); show(n.dataset.tab);
    });
  });
  const h = (location.hash || '').replace('#', '');
  if (!(h && show(h, false))) show('geral', false);
  if (h) window.addEventListener('load', () => setTimeout(() => window.scrollTo(0, 0), 0));
  const ativo = (P, k, lvl) => P[k] && !(lvl <= A.LEVEL[P.perfil]);
  // contagem de filtros por grupo da sidebar e "bolinhas" com a sidebar recolhida
  const groupCount = (keys) => {
    const P = A.P();
    // OncoDash: o perfil vem do login (não é filtro); só o período conta.
    if (keys.length === 1 && keys[0] === 'perfil') return (P.dt_ini || P.dt_fim) ? 1 : 0;
    return A.FKEYS.filter(([k, , lvl]) => keys.includes(k) && ativo(P, k, lvl)).length;
  };
  dash.draw('f_gcount', (el) => { const n = groupCount(el.dataset.keys.split(',')); el.textContent = String(n); el.classList.toggle('ao-zero', n === 0); });
  dash.draw('f_dot', (el) => { el.classList.toggle('on', groupCount(el.dataset.keys.split(',')) > 0); });
  const NOMES = { federal: ['Gestão federal', 'Brasil'], estadual: ['Gestão estadual', ''], macro: ['Macrorregião de saúde', ''], regional: ['Região de saúde', ''], municipal: ['Gestão municipal', ''], local: ['Unidade solicitante', ''] };
  dash.draw('perfil_nome', (el) => {
    const P = A.P(); const [a, b] = NOMES[P.perfil] || NOMES.federal; const s = el.querySelector('span') || document.createElement('span');
    el.textContent = a; s.textContent = P.perfil === 'federal' ? b : (P.perfil === 'local' ? 'CNES ' + P.escopo : P.escopo); el.appendChild(s);
  });
  dash.onData(() => {
    const P = A.P();
    if (perfilSel && document.activeElement !== perfilSel) perfilSel.value = P.perfil;
    if (mapaSel && document.activeElement !== mapaSel) mapaSel.value = P.mapa;
    root.querySelectorAll('[data-perfil-msg]').forEach((p) => { p.hidden = p.dataset.perfilMsg !== P.perfil; });
  });
})();
