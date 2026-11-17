// pacientes e unidades
(function () {
  const A = window.AO;
  dash.draw('c_med', (el) => {
    const r = A.rows(['med']); if (!r) return A.fail(el);
    const P = A.P();
    const items = d3.groups(A.env(r), (x) => x.medicamento).map(([k, v]) => { const s = A.split(v); return { label: k, key: k, sel: P.med === k, vals: { aut: s.aut, ind: s.ind, and: s.and, can: s.can }, total: s.total, note: s.taxa === null ? '' : A.p(s.taxa) + ' aut.' }; }).sort((a, b) => b.total - a.total);
    A.hbar(el, items, { segs: A.SEG, aria: 'Solicitações por medicamento', onClick: (d) => A.setFilter('med', P.med === d.key ? '' : d.key) });
  });
  dash.draw('c_fin', (el) => {
    const r = A.rows(['fin']); if (!r) return A.fail(el);
    const items = d3.groups(A.env(r), (x) => x.finalidade).map(([k, v]) => { const s = A.split(v); return { label: k, vals: { aut: s.aut, ind: s.ind, and: s.and, can: s.can }, total: s.total, note: s.taxa === null ? '' : A.p(s.taxa) + ' aut.' }; }).sort((a, b) => b.total - a.total);
    A.hbar(el, items, { segs: A.SEG, aria: 'Solicitações por finalidade' });
  });
  dash.draw('c_faixa', (el) => {
    const r = A.rows(['faixa']); if (!r) return A.fail(el);
    const p = A.pac(r);
    const items = A.ORDER.faixa.map((f) => { const n = p.filter((x) => x.faixa_etaria === f).length; return { label: f, vals: { n }, total: n }; });
    A.vbar(el, items, { segs: [{ key: 'n', label: 'Pacientes', color: A.C.pri }], aria: 'Pacientes por faixa etária', top: (d) => (p.length ? A.p(d.total / p.length) : '') });
  });
  dash.draw('c_sexo', (el) => {
    const r = A.rows(['sexo']); if (!r) return A.fail(el);
    const p = A.pac(r);
    const items = [['F', '#7c3aed'], ['M', '#c4b5fd']].map(([s, c]) => { const n = p.filter((x) => x.sexo === s).length; return { label: A.sexo(s), vals: { n }, total: n, color: c }; });
    A.vbar(el, items, { segs: [{ key: 'n', label: 'Pacientes', color: A.C.pri }], aria: 'Pacientes por sexo', top: (d) => A.n(d.total) + (p.length ? ' (' + A.p(d.total / p.length) + ')' : '') });
  });
  dash.draw('t_unid', (tb) => {
    const r = A.rows(); tb.replaceChildren(); if (!r) return;
    const rows = d3.groups(r, (x) => x.cnes).map(([k, all]) => { const v = A.env(all); const s = A.split(v); const dp = v.map((x) => x.dias_ate_parecer).filter((x) => x !== null); return [k, all[0].mun_servico + ' (' + all[0].uf + ')', all[0].tipo_servico, s.total, s.aut, s.ind, v.filter((x) => x.n_devolucoes > 0).length, s.taxa === null ? '—' : A.p(s.taxa), dp.length ? A.f1(d3.mean(dp)) : '—', all.filter((x) => x.situacao === 'Rascunho').length]; })
      .sort((a, b) => b[3] - a[3]).slice(0, 15);
    A.fillTable(tb, rows, 3);
  });
})();
