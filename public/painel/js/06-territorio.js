// território
(function () {
  const A = window.AO;
  const sit = (rows) => { const s = A.split(rows); return { vals: { aut: s.aut, ind: s.ind, and: s.and, can: s.can }, total: s.total, taxa: s.taxa }; };
  dash.draw('c_regiao', (el) => {
    const r = A.rows(['regiao', 'uf', 'macro', 'rs', 'cnes']); if (!r) return A.fail(el);
    const items = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].map((g) => { const rows = A.env(r.filter((x) => x.regiao === g)); const s = sit(rows); return { label: g, rows, ...s, extra: s.taxa === null ? [] : ['Taxa de autorização: ' + A.p(s.taxa)] }; });
    A.vbar(el, items, { segs: A.SEG, aria: 'Solicitações por região do país', h: 260, onClick: (d) => A.openDetail('territorio', 'Região do país: ' + d.label, d.rows) });
  });
  const topBy = (el, col, param, aria) => {
    const r = A.rows([param]); if (!r) return A.fail(el);
    const g = d3.groups(A.env(r), (x) => x[col]).map(([k, rows]) => { const s = sit(rows); return { label: k + ' (' + rows[0].uf + ')', key: k, rows, ...s, note: s.taxa === null ? '' : A.p(s.taxa) + ' aut.' }; }).sort((a, b) => b.total - a.total).slice(0, 15);
    A.hbar(el, g, { segs: A.SEG, aria, onClick: (d) => A.openDetail('territorio', (param === 'macro' ? 'Macrorregião de saúde: ' : 'Região de saúde: ') + d.key, d.rows) });
  };
  dash.draw('c_macro', (el) => topBy(el, 'macro_saude', 'macro', 'Solicitações por macrorregião de saúde'));
  dash.draw('c_rs', (el) => topBy(el, 'regiao_saude', 'rs', 'Solicitações por região de saúde'));
  const fillTable = (tb, rows, numFrom) => rows.forEach((row) => { const tr = document.createElement('tr'); row.forEach((c, i) => { const td = document.createElement('td'); td.textContent = typeof c === 'number' ? A.n(c) : c; if (i >= numFrom) td.className = 'ao-num'; tr.appendChild(td); }); tb.appendChild(tr); });
  A.fillTable = fillTable;
  dash.draw('t_rs', (tb) => {
    const r = A.rows(); tb.replaceChildren(); if (!r) return;
    const g = d3.groups(r, (x) => x.regiao_saude).map(([k, all]) => {
      const v = A.env(all); const s = A.split(v); const dp = v.map((x) => x.dias_ate_parecer).filter((x) => x !== null);
      return [k, all[0].macro_saude, all[0].uf, s.total, s.aut, s.taxa === null ? '—' : A.p(s.taxa), s.ind, s.tind === null ? '—' : A.p(s.tind), v.filter((x) => x.n_devolucoes > 0).length, dp.length ? A.f1(d3.mean(dp)) : '—', all.filter((x) => x.situacao === 'Rascunho').length];
    }).sort((a, b) => b[3] - a[3]);
    fillTable(tb, g, 3);
  });
  dash.draw('c_mapa', (el) => {
    const geo = dash.data('malha_uf'); const r = A.rows(['uf', 'macro', 'rs', 'cnes']);
    if (!r || geo.status !== 'ok' || !geo.data || !geo.data.features) return A.fail(el);
    el.replaceChildren();
    const P = A.P(); const e = A.env(r);
    const by = d3.group(e, (x) => x.uf);
    const MET = {
      sol: { f: (v) => v.length, fmt: A.n, c: A.C.brand, nome: 'Solicitações enviadas' },
      taxa: { f: (v) => A.split(v).taxa, fmt: A.p, c: A.C.ok, nome: 'Taxa de autorização' },
      ind: { f: (v) => A.split(v).tind, fmt: A.p, c: A.C.bad, nome: 'Taxa de indeferimento' },
      dev: { f: (v) => v.filter((x) => x.n_devolucoes > 0).length / v.length, fmt: A.p, c: A.C.warn, nome: '% com devolução' },
      tempo: { f: (v) => { const d = v.map((x) => x.dias_ate_parecer).filter((x) => x !== null); return d.length ? d3.mean(d) : null; }, fmt: (x) => A.f1(x) + ' dias', c: A.C.teal, nome: 'Dias até o parecer' },
      dist: { f: (v) => d3.mean(v, (x) => x.distancia_km), fmt: (x) => A.n(Math.round(x)) + ' km', c: A.C.adm, nome: 'Distância média' }
    };
    const M = MET[P.mapa] || MET.sol;
    const vals = new Map([...by].map(([k, v]) => [k, M.f(v)]));
    const nums = [...vals.values()].filter((v) => v !== null && !isNaN(v));
    const lo = d3.min(nums) ?? 0, hi = d3.max(nums) ?? 1;
    const col = d3.scaleLinear().domain([lo, hi === lo ? lo + 1 : hi]).range(['#eef2f6', M.c]).interpolate(d3.interpolateRgb);
    const W = Math.max(280, el.clientWidth || 500), H = Math.round(Math.min(560, Math.max(340, W * 0.98)));
    const svg = A.svg(el, W, H, 'Mapa do Brasil por UF: ' + M.nome);
    const proj = d3.geoMercator().fitExtent([[8, 26], [W - 8, H - 8]], geo.data);
    const path = d3.geoPath(proj);
    const gid = 'ao-grad-' + Math.random().toString(36).slice(2, 7);
    const lg = svg.append('defs').append('linearGradient').attr('id', gid);
    lg.append('stop').attr('offset', '0%').attr('stop-color', col(lo)); lg.append('stop').attr('offset', '100%').attr('stop-color', col(hi === lo ? lo + 1 : hi));
    const lgw = Math.min(140, W * 0.35);
    svg.append('text').attr('x', W - lgw - 42).attr('y', 11).attr('font-size', 10.5).attr('fill', A.C.muted).text('Menor');
    svg.append('rect').attr('x', W - lgw).attr('y', 4).attr('width', lgw).attr('height', 8).attr('rx', 4).attr('fill', `url(#${gid})`);
    svg.append('text').attr('x', W - lgw).attr('y', 23).attr('font-size', 10.5).attr('fill', A.C.muted).text(nums.length ? M.fmt(lo) : '');
    svg.append('text').attr('x', W).attr('y', 23).attr('text-anchor', 'end').attr('font-size', 10.5).attr('fill', A.C.muted).text(nums.length ? M.fmt(hi) : '');
    const tip = A.tip(el);
    const locked = false;
    svg.append('g').selectAll('path').data(geo.data.features).join('path')
      .attr('d', path)
      .attr('fill', (f) => { const v = vals.get(f.properties.sigla); return v === undefined || v === null || isNaN(v) ? '#f8fafc' : col(v); })
      .attr('stroke', (f) => (P.uf === f.properties.sigla ? A.C.warn : '#FFFFFF'))
      .attr('stroke-width', (f) => (P.uf === f.properties.sigla ? 2.5 : 1))
      .style('cursor', locked ? 'default' : 'pointer')
      .on('pointermove', (ev, f) => { const s = f.properties.sigla; const v = by.get(s) || []; const sp = A.split(v); tip.show(ev, [f.properties.name + ' (' + s + ')', M.nome + ': ' + (vals.has(s) && vals.get(s) !== null ? M.fmt(vals.get(s)) : 'sem solicitações'), 'Enviadas: ' + A.n(v.length), 'Taxa de autorização: ' + (sp.taxa === null ? '—' : A.p(sp.taxa)), 'Indeferidas: ' + A.n(sp.ind)]); })
      .on('pointerleave', () => tip.hide())
      .on('click', (ev, f) => { const s = f.properties.sigla; if (A.openMapDetail) A.openMapDetail(s); });
    const semRotulo = new Set(['AL', 'DF', 'ES', 'PB', 'RJ', 'SE']);
    svg.append('g').selectAll('text').data(geo.data.features.filter((f) => vals.has(f.properties.sigla) && !semRotulo.has(f.properties.sigla))).join('text')
      .attr('x', (f) => path.centroid(f)[0]).attr('y', (f) => path.centroid(f)[1] + 3).attr('text-anchor', 'middle')
      .attr('font-size', 10).attr('font-weight', 600).attr('fill', A.C.ink).attr('pointer-events', 'none')
      .attr('stroke', '#FFFFFF').attr('stroke-width', 2.5).attr('paint-order', 'stroke').text((f) => f.properties.sigla);
    el._aoCsv = [...by.keys()].sort().map((k) => ({ uf: k, [M.nome]: vals.get(k), enviadas: by.get(k).length }));
  });

  // Drill-down por UF, inspirado no fluxo do Simdash: mapa nacional → rotas do estado.
  const drill = { uf: '', scope: 'all' };
  const board = document.getElementById('ao-territory-board');
  const drillEl = document.getElementById('ao-map-drill');
  const drillMap = document.getElementById('ao-drill-map');
  const drillList = document.getElementById('ao-drill-list');
  const drillTitle = document.getElementById('ao-drill-title');
  const drillSub = document.getElementById('ao-drill-sub');
  const drillCount = document.getElementById('ao-drill-count');
  const scopeRows = (rows) => rows.filter((x) => {
    const inUf = x.uf === drill.uf, outUf = x.uf_residencia === drill.uf;
    if (drill.scope === 'inside') return inUf && outUf;
    if (drill.scope === 'inbound') return inUf && !outUf;
    if (drill.scope === 'outbound') return outUf && !inUf;
    return inUf || outUf;
  });
  const drawDrill = () => {
    if (!drill.uf || !drillMap) return;
    const rows = A.pac(A.rows() || []);
    const picked = scopeRows(rows);
    const routes = d3.groups(picked, (x) => x.mun_residencia + '|' + x.uf_residencia + '|' + x.mun_servico + '|' + x.uf).map(([, v]) => ({ o: v[0].mun_residencia, ouf: v[0].uf_residencia, d: v[0].mun_servico, duf: v[0].uf, n: v.length, km: v[0].distancia_km, lo: v[0].lon_res, la: v[0].lat_res, ln: v[0].lon_srv, ls: v[0].lat_srv })).sort((a, b) => b.n - a.n).filter((x) => x.la !== null && x.ls !== null);
    const feat = dash.data('malha_uf'); if (feat.status !== 'ok' || !feat.data) return;
    drillMap.replaceChildren();
    const W = Math.max(320, drillMap.clientWidth || 620), H = Math.max(360, Math.round(W * .66));
    const svg = A.svg(drillMap, W, H, 'Rotas de pacientes relacionadas à UF selecionada');
    const involved = new Set([drill.uf]); routes.forEach((x) => { involved.add(x.ouf); involved.add(x.duf); });
    const subset = feat.data.features.filter((f) => involved.has(f.properties.sigla));
    const proj = d3.geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], subset.length ? { type: 'FeatureCollection', features: subset } : feat.data);
    const path = d3.geoPath(proj);
    svg.append('g').selectAll('path').data(feat.data.features).join('path').attr('d', path).attr('fill', (f) => f.properties.sigla === drill.uf ? '#bfe3cf' : involved.has(f.properties.sigla) ? '#e8f3ec' : '#f1f5f9').attr('stroke', '#FFF').attr('stroke-width', 1);
    const width = d3.scaleSqrt().domain([1, d3.max(routes, (x) => x.n) || 1]).range([1.2, 7]);
    svg.append('g').selectAll('path.route').data(routes).join('path').attr('d', (x) => { const [a,b] = [proj([x.lo,x.la]), proj([x.ln,x.ls])]; const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2, dx=b[0]-a[0], dy=b[1]-a[1]; return `M${a[0]},${a[1]} Q${mx-dy*.16},${my+dx*.16} ${b[0]},${b[1]}`; }).attr('fill','none').attr('stroke','#2563eb').attr('stroke-width',(x)=>width(x.n)).attr('stroke-linecap','round').attr('opacity','.58');
    const services = d3.groups(routes, (x) => x.d + '|' + x.duf).map(([,v]) => ({ name:v[0].d, uf:v[0].duf, lon:v[0].ln, lat:v[0].ls, n:d3.sum(v,(x)=>x.n) }));
    svg.append('g').selectAll('circle').data(services).join('circle').attr('cx',(x)=>proj([x.lon,x.lat])[0]).attr('cy',(x)=>proj([x.lon,x.lat])[1]).attr('r',(x)=>Math.max(4, width(x.n)+2)).attr('fill','#1a7a4a').attr('stroke','#FFF').attr('stroke-width',1.5);
    if (drillList) { drillList.replaceChildren(); if (!routes.length) { drillList.innerHTML = '<div class="ao-route-empty">Nenhuma rota no recorte selecionado.</div>'; } else routes.slice(0, 18).forEach((x) => { const row=document.createElement('div'); row.className='ao-route-row'; row.innerHTML=`<div><b>${x.o} (${x.ouf}) → ${x.d} (${x.duf})</b><br><span>${A.n(x.km)} km em linha reta</span></div><strong>${A.n(x.n)}</strong>`; drillList.appendChild(row); }); }
    if (drillCount) drillCount.textContent = A.n(routes.length) + (routes.length === 1 ? ' rota no recorte' : ' rotas no recorte');
  };
  A.openMapDetail = (uf) => { drill.uf = uf; drill.scope = 'all'; const f = dash.data('malha_uf'); const state = f.data && f.data.features.find((x) => x.properties.sigla === uf); if (drillTitle) drillTitle.textContent = 'Rotas de pacientes — ' + (state ? state.properties.name : uf) + ' (' + uf + ')'; if (drillSub) drillSub.textContent = 'Clique nas opções para comparar os fluxos de residência e serviço.'; board.hidden = true; drillEl.hidden = false; drillEl.querySelectorAll('[data-route-scope]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.routeScope === 'all' ? 'true' : 'false')); drawDrill(); };
  document.getElementById('ao-drill-back')?.addEventListener('click', () => { board.hidden = false; drillEl.hidden = true; drill.uf = ''; });
  drillEl?.querySelectorAll('[data-route-scope]').forEach((b) => b.addEventListener('click', () => { drill.scope = b.dataset.routeScope; drillEl.querySelectorAll('[data-route-scope]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); drawDrill(); }));
})();
