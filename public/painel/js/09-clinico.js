// perfil clínico
(function () {
  const A = window.AO;
  const K = (name, fn) => dash.draw(name, (el) => { const rows = A.rows(); if (!rows) return A.dash(el); const v = fn(rows); el.textContent = v === null || v === undefined ? '—' : v; });
  K('k_c_diag', (r) => { const v = A.env(r).map((x) => x.dias_diag).filter((x) => x !== null).sort(d3.ascending); return v.length ? A.n(Math.round(d3.median(v))) : null; });
  K('k_c_diag60', (r) => A.n(A.KPI.c_diag60(r).length));
  K('k_c_diag60_s', (r) => { const e = A.env(r); return e.length ? A.p(A.KPI.c_diag60(r).length / e.length) : null; });
  K('k_c_cbo', (r) => A.n(A.KPI.c_cbo(r).length));
  K('k_c_her2', (r) => A.n(A.KPI.c_her2(r).length));
  K('k_c_recid', (r) => A.n(A.KPI.c_recid(r).length));
  K('k_c_recid_s', (r) => { const e = A.env(r); return e.length ? A.p(A.KPI.c_recid(r).length / e.length) : null; });
  const grp = (r, col, order, labelFn) => {
    let g = d3.groups(A.env(r), (x) => x[col]).filter(([k]) => k);
    if (order) g.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])); else g.sort((a, b) => b[1].length - a[1].length);
    return g.map(([k, v]) => { const s = A.split(v); return { label: labelFn ? labelFn(k) : k, key: k, vals: { aut: s.aut, ind: s.ind, and: s.and, can: s.can }, total: s.total, note: s.taxa === null ? '' : A.p(s.taxa) + ' aut.' }; });
  };
  const click = (key) => (d) => { const P = A.P(); A.setFilter(key, P[key] === d.key ? '' : d.key); };
  dash.draw('c_estadio', (el) => { const r = A.rows(['est']); if (!r) return A.fail(el); A.hbar(el, grp(r, 'estadio_clinico', A.ORDER.est), { segs: A.SEG, aria: 'Solicitações por estádio clínico', onClick: click('est') }); });
  dash.draw('c_linha', (el) => { const r = A.rows(['linha']); if (!r) return A.fail(el); A.hbar(el, grp(r, 'linha_tratamento'), { segs: A.SEG, aria: 'Solicitações por linha de tratamento', onClick: click('linha') }); });
  dash.draw('c_cid', (el) => { const r = A.rows(['cid']); if (!r) return A.fail(el); A.hbar(el, grp(r, 'cid', null, (k) => A.label('cid', k)), { segs: A.SEG, aria: 'Solicitações por CID-10', onClick: click('cid') }); });
  dash.draw('c_apac', (el) => { const r = A.rows(['apac']); if (!r) return A.fail(el); A.hbar(el, grp(r, 'codigo_apac'), { segs: A.SEG, aria: 'Solicitações por código APAC', onClick: click('apac') }); });
  dash.draw('c_diag', (el) => {
    const r = A.rows(['tdiag']); if (!r) return A.fail(el);
    const e = A.env(r).filter((x) => x.faixa_diag);
    const items = A.ORDER.tdiag.map((l, i) => { const n = e.filter((x) => x.faixa_diag === l).length; return { label: l, vals: { n }, total: n, color: i >= 2 ? A.C.adm : A.C.teal }; });
    A.vbar(el, items, { segs: [{ key: 'n', label: 'Solicitações', color: A.C.teal }], aria: 'Tempo do diagnóstico à solicitação', refAfter: '31 a 60 dias', refText: '60 dias', top: (d) => A.n(d.total) + (e.length ? ' (' + A.p(d.total / e.length) + ')' : '') });
  });
  dash.draw('c_her2', (el) => {
    const r = A.rows(['her2']); if (!r) return A.fail(el);
    const e = A.env(r).filter((x) => /Trastuzumabe|Pertuzumabe/.test(x.medicamento));
    const cols = { '3+': A.C.pri, '2+ (FISH positivo)': A.C.pril, '2+ (sem FISH)': A.C.bad };
    const items = Object.keys(cols).map((h) => { const n = e.filter((x) => x.her2 === h).length; return { label: h, vals: { n }, total: n, color: cols[h] }; });
    A.vbar(el, items, { segs: [{ key: 'n', label: 'Solicitações', color: A.C.pri }], aria: 'HER2 nos medicamentos anti-HER2', top: (d) => A.n(d.total) + (e.length ? ' (' + A.p(d.total / e.length) + ')' : '') });
  });
})();
