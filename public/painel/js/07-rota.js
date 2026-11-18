// rota do paciente
(function () {
  const A = window.AO;
  const K = (name, fn) => dash.draw(name, (el) => { const rows = A.rows(); if (!rows) return A.dash(el); const v = fn(A.pac(rows)); el.textContent = v === null || v === undefined ? '—' : v; });
  K('k_r_pac', (p) => A.n(p.length));
  K('k_r_mun', (p) => A.n(A.uniq(p, 'mun_residencia')));
  // OncoDash: fora da UF conta sempre como fora da região. Sem a região de saúde de um dos lados, o
  // paciente entra no total mas não como "fora" — o número vira um mínimo, e o subtítulo avisa.
  dash.draw('k_r_rs', (el) => {
    const rows = A.rows(); if (!rows) return A.dash(el);
    const p = A.pac(rows); const f = p.map(A.foraRS);
    const sub = el.closest('.ao-kpi')?.querySelector('.ao-kpi-s');
    el.textContent = p.length ? A.p(f.filter((v) => v === true).length / p.length) : '—';
    const sem = f.filter((v) => v === null).length;
    if (sub) sub.textContent = sem && p.length ? 'no mínimo · sem região de saúde para ' + A.p(sem / p.length) : 'dos pacientes atendidos';
  });
  K('k_r_uf', (p) => (p.length ? A.p(p.filter((x) => x.uf !== x.uf_residencia).length / p.length) : null));
  const kms = (p) => p.map((x) => x.distancia_km).filter((x) => x !== null);
  K('k_r_dist', (p) => { const v = kms(p); return v.length ? A.n(Math.round(d3.mean(v))) : null; });
  K('k_r_p90', (p) => { const v = kms(p).sort(d3.ascending); if (!v.length) return null; return A.n(Math.round(d3.quantileSorted(v, 0.9))) + ' km'; });
  const band = (km) => A.DIST.find((b) => km <= b[0]);
  dash.draw('c_dist', (el) => {
    const r = A.rows(); if (!r) return A.fail(el);
    const p = A.pac(r); let prev = -1;
    const items = A.DIST.map(([lim, lab, c]) => { const rows = p.filter((x) => x.distancia_km > prev && x.distancia_km <= lim); prev = lim; return { label: lab, rows, vals: { n: rows.length }, total: rows.length, color: c }; });
    A.vbar(el, items, { segs: [{ key: 'n', label: 'Pacientes', color: A.C.pri }], aria: 'Pacientes por faixa de distância', top: (d) => A.n(d.total) + (p.length ? ' (' + A.p(d.total / p.length) + ')' : ''), onClick: (d) => A.openDetail('territorio', 'Pacientes — distância: ' + d.label, d.rows) });
  });
  const rotas = (rows) => d3.groups(A.pac(rows), (x) => x.mun_residencia + '|' + x.uf_residencia + '→' + x.mun_servico + '|' + x.uf).map(([k, v]) => ({ o: v[0].mun_residencia, ouf: v[0].uf_residencia, d: v[0].mun_servico, duf: v[0].uf, n: v.length, km: v[0].distancia_km, foraRS: A.foraRS(v[0]), lr: v[0].lat_res, lo: v[0].lon_res, ls: v[0].lat_srv, ln: v[0].lon_srv }))
    // OncoDash: sem coordenadas (ainda não há tabela de território) não dá para desenhar a rota.
    .filter((x) => x.lr !== null && x.ls !== null);
  dash.draw('t_rotas', (tb) => {
    const r = A.rows(); tb.replaceChildren(); if (!r) return;
    rotas(r).filter((x) => x.o !== x.d || x.ouf !== x.duf).sort((a, b) => b.n - a.n || b.km - a.km).slice(0, 15).forEach((x) => {
      const tr = document.createElement('tr');
      [[x.o + ' (' + x.ouf + ')'], [x.d + ' (' + x.duf + ')'], [A.n(x.n), 1], [A.n(x.km), 1], [x.foraRS === null ? '—' : x.foraRS ? 'Sim' : 'Não']].forEach(([t, num]) => { const td = document.createElement('td'); td.textContent = t; if (num) td.className = 'ao-num'; tr.appendChild(td); });
      tb.appendChild(tr);
    });
  });
  dash.draw('c_rota', (el) => {
    const geo = dash.data('malha_uf'); const r = A.rows();
    if (!r || geo.status !== 'ok' || !geo.data || !geo.data.features) return A.fail(el);
    el.replaceChildren();
    const rs = rotas(r);
    const W = Math.max(280, el.clientWidth || 700), H = Math.round(Math.min(600, Math.max(340, W * 0.62)));
    const svg = A.svg(el, W, H, 'Mapa de rotas do município de residência até o serviço');
    const ufs = new Set(); rs.forEach((x) => { ufs.add(x.ouf); ufs.add(x.duf); });
    const focus = geo.data.features.filter((f) => ufs.has(f.properties.sigla));
    const fitTo = focus.length && focus.length <= 8 ? { type: 'FeatureCollection', features: focus } : geo.data;
    const legH = 26;
    const proj = d3.geoMercator().fitExtent([[10, legH + 10], [W - 10, H - 10]], fitTo);
    const path = d3.geoPath(proj);
    const clipId = 'ao-clip-' + Math.random().toString(36).slice(2, 7);
    svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('x', 0).attr('y', legH).attr('width', W).attr('height', H - legH);
    const g = svg.append('g').attr('clip-path', `url(#${clipId})`);
    g.append('g').selectAll('path').data(geo.data.features).join('path').attr('d', path).attr('fill', (f) => (ufs.has(f.properties.sigla) ? '#e8f3ec' : A.C.land)).attr('stroke', '#FFFFFF').attr('stroke-width', 1);
    if (focus.length && focus.length <= 8) g.append('g').selectAll('text').data(focus).join('text').attr('x', (f) => path.centroid(f)[0]).attr('y', (f) => path.centroid(f)[1]).attr('text-anchor', 'middle').attr('font-size', 22).attr('font-weight', 700).attr('fill', '#b7d7c3').attr('pointer-events', 'none').text((f) => f.properties.sigla);
    let lx = 0; const lg = svg.append('g').attr('transform', 'translate(0,6)');
    A.DIST.forEach(([, lab, c]) => { const gg = lg.append('g').attr('transform', `translate(${lx},0)`); gg.append('rect').attr('y', 3).attr('width', 16).attr('height', 4).attr('rx', 2).attr('fill', c); const t = gg.append('text').attr('x', 20).attr('y', 9).attr('font-size', 11.5).attr('fill', A.C.muted).text(lab); lx += t.node().getComputedTextLength() + 34; });
    const gs = lg.append('g').attr('transform', `translate(${lx},0)`); gs.append('circle').attr('cx', 5).attr('cy', 5).attr('r', 5).attr('fill', A.C.pri); gs.append('text').attr('x', 14).attr('y', 9).attr('font-size', 11.5).attr('fill', A.C.muted).text('serviço (CACON/UNACON)');
    if (!rs.length) return;
    const wS = d3.scaleSqrt().domain([1, d3.max(rs, (x) => x.n) || 1]).range([1.2, 8]);
    const tip = A.tip(el);
    const lines = rs.filter((x) => x.o !== x.d || x.ouf !== x.duf).sort((a, b) => a.n - b.n);
    g.append('g').selectAll('path').data(lines).join('path')
      .attr('d', (x) => { const [x1, y1] = proj([x.lo, x.lr]); const [x2, y2] = proj([x.ln, x.ls]); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const dx = x2 - x1, dy = y2 - y1; const k = 0.2; return `M${x1},${y1} Q${mx - dy * k},${my + dx * k} ${x2},${y2}`; })
      .attr('fill', 'none').attr('stroke', (x) => band(x.km)[2]).attr('stroke-width', (x) => wS(x.n)).attr('stroke-linecap', 'round').attr('opacity', 0.72)
      .on('pointermove', (ev, x) => tip.show(ev, [x.o + ' (' + x.ouf + ') → ' + x.d + ' (' + x.duf + ')', A.n(x.n) + (x.n === 1 ? ' paciente' : ' pacientes') + ' · ' + A.n(x.km) + ' km em linha reta', x.foraRS === null ? 'Região de saúde não informada' : x.foraRS ? 'Atendidos fora da região de saúde de residência' : 'Dentro da região de saúde de residência']))
      .on('pointerleave', () => tip.hide());
    const res = d3.groups(rs, (x) => x.o + '|' + x.ouf).map(([, v]) => ({ name: v[0].o, uf: v[0].ouf, lat: v[0].lr, lon: v[0].lo, n: d3.sum(v, (y) => y.n), km: d3.max(v, (y) => y.km) }));
    g.append('g').selectAll('circle').data(res).join('circle').attr('cx', (x) => proj([x.lon, x.lat])[0]).attr('cy', (x) => proj([x.lon, x.lat])[1]).attr('r', 2.8).attr('fill', '#FFFFFF').attr('stroke', (x) => band(x.km)[2]).attr('stroke-width', 1.5)
      .on('pointermove', (ev, x) => tip.show(ev, [x.name + ' (' + x.uf + ')', 'Residência de ' + A.n(x.n) + (x.n === 1 ? ' paciente' : ' pacientes')])).on('pointerleave', () => tip.hide());
    const srv = d3.groups(rs, (x) => x.d + '|' + x.duf).map(([, v]) => ({ name: v[0].d, uf: v[0].duf, lat: v[0].ls, lon: v[0].ln, n: d3.sum(v, (y) => y.n), loc: d3.sum(v.filter((y) => y.o === y.d), (y) => y.n) })).sort((a, b) => b.n - a.n);
    const rS = d3.scaleSqrt().domain([1, d3.max(srv, (x) => x.n) || 1]).range([4, 13]);
    g.append('g').selectAll('circle').data(srv).join('circle').attr('cx', (x) => proj([x.lon, x.lat])[0]).attr('cy', (x) => proj([x.lon, x.lat])[1]).attr('r', (x) => rS(x.n)).attr('fill', A.C.pri).attr('fill-opacity', 0.9).attr('stroke', '#FFFFFF').attr('stroke-width', 1.5)
      .on('pointermove', (ev, x) => tip.show(ev, [x.name + ' (' + x.uf + ')', A.n(x.n) + ' pacientes atendidos', A.n(x.loc) + ' moram no próprio município'])).on('pointerleave', () => tip.hide());
    g.append('g').selectAll('text').data(srv.slice(0, W < 520 ? 5 : 10)).join('text').attr('x', (x) => proj([x.lon, x.lat])[0] + rS(x.n) + 3).attr('y', (x) => proj([x.lon, x.lat])[1] + 4)
      .attr('font-size', 11.5).attr('font-weight', 600).attr('fill', A.C.ink).attr('stroke', '#FFFFFF').attr('stroke-width', 3).attr('paint-order', 'stroke').attr('pointer-events', 'none').text((x) => x.name);
    el._aoCsv = rs.sort((a, b) => b.n - a.n).map((x) => ({ residencia: x.o, uf_residencia: x.ouf, servico: x.d, uf_servico: x.duf, pacientes: x.n, km_linha_reta: x.km, fora_da_regiao_de_saude: x.foraRS === null ? 'Sem informação' : x.foraRS ? 'Sim' : 'Não' }));
  });
})();
