// análise de indeferimentos
(function () {
  const A = window.AO;
  const K = (name, fn) => dash.draw(name, (el) => { const rows = A.rows(); if (!rows) return A.dash(el); const v = fn(rows); el.textContent = v === null || v === undefined ? '—' : v; });
  K('k_i_tot', (r) => A.n(A.split(r).ind));
  K('k_i_taxa', (r) => { const s = A.split(r); return s.tind === null ? '—' : A.p(s.tind); });
  K('k_i_merito', (r) => A.n(r.filter((x) => x.situacao === 'Indeferida').length));
  K('k_i_prazo', (r) => A.n(r.filter((x) => x.situacao === 'Indeferida (prazo)').length));
  K('k_i_dev', (r) => { const i = r.filter(A.isInd); return i.length ? A.p(i.filter((x) => x.n_devolucoes > 0).length / i.length) : null; });
  K('k_i_reinc', (r) => A.n(new Set(A.KPI.i_reinc(r).map((x) => x.paciente)).size));
  const IS = [{ key: 'mer', label: 'Por mérito', color: A.C.bad }, { key: 'pra', label: 'Por prazo', color: A.C.adm }];
  const byGroup = (r, col, n) => d3.groups(A.env(r), (x) => x[col]).map(([k, v]) => { const s = A.split(v); return { label: k, rows: v.filter(A.isInd), vals: { mer: s.ind - s.prazo, pra: s.prazo }, total: s.ind, note: s.tind === null ? '' : A.p(s.tind) + ' indef.', extra: ['Decididas: ' + A.n(s.dec)] }; }).filter((d) => d.total > 0).sort((a, b) => b.total - a.total).slice(0, n);
  dash.draw('c_ind_med', (el) => { const r = A.rows(['med']); if (!r) return A.fail(el); A.hbar(el, byGroup(r, 'medicamento', 10), { segs: IS, aria: 'Indeferimentos por medicamento', onClick: (d) => A.openDetail('indeferimentos', 'Indeferimentos — medicamento: ' + d.label, d.rows) }); });
  dash.draw('c_ind_uf', (el) => { const r = A.rows(['uf', 'macro', 'rs', 'cnes']); if (!r) return A.fail(el); A.hbar(el, byGroup(r, 'uf', 27), { segs: IS, aria: 'Indeferimentos por UF', onClick: (d) => A.openDetail('indeferimentos', 'Indeferimentos — UF: ' + d.label, d.rows) }); });
  const motivo = (el, col, color, aria) => { const r = A.rows(); if (!r) return A.fail(el); const g = d3.groups(r.filter((x) => x[col]), (x) => x[col]).map(([k, rows]) => ({ label: k, rows, vals: { n: rows.length }, total: rows.length })).sort((a, b) => b.total - a.total); const tot = d3.sum(g, (d) => d.total); g.forEach((d) => { d.note = A.p(d.total / tot); }); A.hbar(el, g, { segs: [{ key: 'n', label: 'Solicitações', color }], aria, onClick: (d) => A.openDetail('indeferimentos', (col === 'motivo_indeferimento' ? 'Motivo de indeferimento: ' : 'Motivo de devolução: ') + d.label, d.rows) }); };
  dash.draw('c_motivo_ind', (el) => motivo(el, 'motivo_indeferimento', A.C.bad, 'Motivos de indeferimento'));
  dash.draw('c_motivo_dev', (el) => motivo(el, 'motivo_devolucao', A.C.warn, 'Motivos de devolução'));
  dash.draw('c_ind_mes', (el) => {
    const r = A.rows(); if (!r) return A.fail(el);
    const mo = (s) => d3.utcMonth.floor(A.dt(s));
    const ds = r.filter((x) => x.data_decisao).map((x) => mo(x.data_decisao));
    if (!ds.length) return A.empty(el);
    const xs = d3.utcMonth.range(d3.min(ds), new Date(+d3.max(ds) + 1));
    const cnt = (arr) => { const m = d3.rollup(arr, (v) => v.length, (x) => +mo(x.data_decisao)); return xs.map((d) => m.get(+d) || 0); };
    const dec = r.filter((x) => x.data_decisao);
    A.lines(el, xs, [
      { label: 'Indeferidas por mérito', color: A.C.bad, vals: cnt(dec.filter((x) => x.situacao === 'Indeferida')) },
      { label: 'Indeferidas por prazo', color: A.C.adm, vals: cnt(dec.filter((x) => x.situacao === 'Indeferida (prazo)')) }
    ], { aria: 'Indeferimentos por mês', xfmt: (d) => A.MES[d.getUTCMonth()] + '/' + d.getUTCFullYear(), h: 240 });
  });
  dash.draw('t_ind_unid', (tb) => {
    const r = A.rows(); tb.replaceChildren(); if (!r) return;
    const rows = d3.groups(A.env(r), (x) => x.cnes).map(([k, v]) => { const s = A.split(v); const mot = d3.rollups(v.filter((x) => x.motivo_indeferimento), (a) => a.length, (x) => x.motivo_indeferimento).sort((a, b) => b[1] - a[1]); return { k, v, s, mot: mot.length ? mot[0][0] : '—' }; })
      .filter((d) => d.s.dec >= 5).sort((a, b) => b.s.tind - a.s.tind).slice(0, 15)
      .map((d) => [d.k, d.v[0].mun_servico + ' (' + d.v[0].uf + ')', d.v[0].tipo_servico, d.s.dec, d.s.ind, A.p(d.s.tind), d.s.prazo, d.mot]);
    rows.forEach((row) => { const tr = document.createElement('tr'); row.forEach((c, i) => { const td = document.createElement('td'); td.textContent = typeof c === 'number' ? A.n(c) : c; if (i >= 3 && i <= 6) td.className = 'ao-num'; tr.appendChild(td); }); tb.appendChild(tr); });
  });
})();
