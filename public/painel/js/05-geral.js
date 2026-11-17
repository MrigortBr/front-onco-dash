// visão geral
(function () {
  const A = window.AO;
  const K = (name, fn) => dash.draw(name, (el) => { const rows = A.rows(); if (!rows) return A.dash(el); const v = fn(rows); el.textContent = v === null || v === undefined ? '—' : v; });
  const RASC_LIM = 7;
  const diasAberto = (r) => { const ref = A.dt(A.ref(A.base())); return r.filter((x) => x.situacao === 'Rascunho').map((x) => (ref - A.dt(x.data_solicitacao)) / 864e5); };
  K('k_env', (r) => A.n(A.env(r).length));
  K('k_env_s', (r) => { const e = A.env(r); return A.n(A.uniq(e, 'cnes')) + ' unidades · ' + A.n(A.uniq(e, 'uf')) + ' UF'; });
  K('k_aut', (r) => A.n(A.split(r).aut));
  K('k_aut_s', (r) => { const s = A.split(r); return s.taxa === null ? '—' : A.p(s.taxa); });
  K('k_ind', (r) => A.n(A.split(r).ind));
  K('k_ind_rate', (r) => { const s = A.split(r); return s.tind === null ? '—' : A.p(s.tind); });
  K('k_ind_s', (r) => A.n(A.split(r).prazo));
  K('k_dev', (r) => A.n(A.env(r).filter((x) => x.n_devolucoes > 0).length));
  K('k_dev_rate', (r) => { const e = A.env(r); return e.length ? A.p(e.filter((x) => x.n_devolucoes > 0).length / e.length) : null; });
  K('k_dev_s', (r) => A.n(r.filter((x) => x.situacao === 'Devolvida').length));
  K('k_fila', (r) => A.n(r.filter((x) => x.situacao === 'Enviada' || x.situacao === 'Em análise').length));
  K('k_tempo', (r) => { const v = r.map((x) => x.dias_ate_parecer).filter((v) => v !== null).sort(d3.ascending); return v.length ? A.f1(d3.median(v)) : null; });
  K('k_tempo_s', (r) => { const v = r.map((x) => x.dias_ate_parecer).filter((v) => v !== null).sort(d3.ascending); return v.length ? A.f1(d3.quantileSorted(v, 0.9)) + ' dias' : null; });
  K('k_rasc', (r) => A.n(r.filter((x) => x.situacao === 'Rascunho').length));
  K('k_rasc_s', (r) => A.n(diasAberto(r).filter((d) => d > RASC_LIM).length));
  K('k_rasc_t', (r) => { const d = diasAberto(r); return d.length ? A.f1(d3.mean(d)) : null; });
  K('k_preench', (r) => { const d = A.env(r).filter((x) => x.data_envio).map((x) => (A.dt(x.data_envio) - A.dt(x.data_solicitacao)) / 864e5); return d.length ? A.f1(d3.mean(d)) + ' dias' : null; });
  K('k_dist', (r) => { const v = A.env(r).map((x) => x.distancia_km).filter((x) => x !== null); return v.length ? A.n(Math.round(d3.mean(v))) : null; });
  K('k_dist_s', (r) => { const v = A.env(r).map((x) => x.distancia_km).filter((x) => x !== null).sort(d3.ascending); return v.length ? A.n(Math.round(d3.quantileSorted(v, .9))) + ' km' : null; });
  K('t_env', (r) => A.n(A.env(r).length));
  K('t_taxa', (r) => { const s = A.split(r); return s.taxa === null ? '—' : A.p(s.taxa); });
  K('t_motivo', (r) => { const g = d3.rollups(r.filter((x) => x.motivo_indeferimento), (v) => v.length, (x) => x.motivo_indeferimento).sort((a, b) => b[1] - a[1]); return g.length ? '“' + g[0][0] + '” (' + A.n(g[0][1]) + ')' : 'nenhum no recorte'; });

  dash.draw('c_situacao', (el) => {
    const r = A.rows(); if (!r) return A.fail(el);
    const tot = r.length;
    const items = A.SIT.map(([s, c]) => { const rows = r.filter((x) => x.situacao === s); const n = rows.length; return { label: s, rows, vals: { n }, total: n, color: c, note: tot ? A.p(n / tot) : '' }; }).filter((d) => d.total > 0);
    A.hbar(el, items, { segs: [{ key: 'n', label: 'Solicitações', color: A.C.pri }], aria: 'Solicitações por situação', onClick: (d) => A.openDetail('geral', 'Situação: ' + d.label, d.rows) });
  });
  dash.draw('c_tempo', (el) => {
    const r = A.rows(); if (!r) return A.fail(el);
    const bins = [[0, 1, 'até 1'], [1, 2, '1 a 2'], [2, 3, '2 a 3'], [3, 5, '3 a 5'], [5, 7, '5 a 7'], [7, 10, '7 a 10'], [10, Infinity, '10 ou +']];
    const items = bins.map(([a, b, l]) => { const rows = r.filter((x) => x.dias_ate_parecer !== null && x.dias_ate_parecer >= a && x.dias_ate_parecer < b); return { label: l, rows, vals: { n: rows.length }, total: rows.length, color: a >= A.SLA ? A.C.adm : A.C.teal }; });
    A.vbar(el, items, { segs: [{ key: 'n', label: 'Decididas', color: A.C.teal }], aria: 'Distribuição do tempo até o parecer em dias', refAfter: '3 a 5', refText: 'referência: ' + A.SLA + ' dias', onClick: (d) => A.openDetail('geral', 'Tempo até o parecer: ' + d.label + ' dias', d.rows) });
  });
  dash.draw('c_serie', (el) => {
    const r = A.rows(); if (!r) return A.fail(el);
    const wk = (s) => d3.utcMonday.floor(A.dt(s));
    const e = A.env(r).filter((x) => x.data_envio);
    if (!e.length) return A.empty(el);
    const ext = d3.extent(e, (x) => wk(x.data_envio));
    const xs = d3.utcMonday.range(ext[0], new Date(+ext[1] + 1));
    const cnt = (arr, key) => { const m = d3.rollup(arr, (v) => v.length, (x) => +wk(x[key])); return xs.map((d) => m.get(+d) || 0); };
    const dec = r.filter((x) => x.data_decisao);
    A.lines(el, xs, [
      { label: 'Enviadas', color: A.C.pri, vals: cnt(e, 'data_envio') },
      { label: 'Autorizadas', color: A.C.ok, vals: cnt(dec.filter((x) => x.situacao === 'Autorizada'), 'data_decisao') },
      { label: 'Indeferidas', color: A.C.bad, vals: cnt(dec.filter(A.isInd), 'data_decisao') }
    ], { aria: 'Série semanal de solicitações enviadas, autorizadas e indeferidas', xfmt: (d) => 'Semana de ' + A.dmy(d), onClick: (d) => { const end = new Date(+d.date + 7 * 864e5); const rows = r.filter((x) => [x.data_envio, x.data_decisao].some((v) => v && A.dt(v) >= d.date && A.dt(v) < end)); A.openDetail('geral', 'Série semanal: semana de ' + A.dmy(d.date), rows); } });
  });
})();
