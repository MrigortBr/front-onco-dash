window.AO = window.AO || {};
(function () {
  const A = window.AO;
  const L = d3.formatLocale({ decimal: ',', thousands: '.', grouping: [3], currency: ['R$', ''] });
  A.n = L.format(',d'); A.p = L.format('.0%'); A.f1 = L.format(',.1f');
  A.C = { ink: '#1f2937', muted: '#64748b', line: '#e2e8f0', grid: '#eef2f6', pri: '#2563eb', pril: '#93c5fd', ok: '#16a34a', bad: '#ef4444', adm: '#f97316', warn: '#f59e0b', teal: '#0d9488', gray: '#9ca3af', purple: '#7c3aed', land: '#eef2f6', brand: '#1a7a4a' };
  A.FONT = "'Segoe UI', system-ui, Roboto, Arial, sans-serif";
  A.SLA = 5;
  A.MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  A.SIT = [['Autorizada', A.C.ok], ['Indeferida', A.C.bad], ['Indeferida (prazo)', A.C.adm], ['Devolvida', A.C.warn], ['Em análise', A.C.pri], ['Enviada', A.C.pril], ['Cancelada', A.C.gray], ['Rascunho', '#cbd5e1']];
  A.DIST = [[50, 'até 50 km', '#16a34a'], [150, '50 a 150 km', '#0d9488'], [300, '150 a 300 km', '#f59e0b'], [600, '300 a 600 km', '#f97316'], [Infinity, 'acima de 600 km', '#ef4444']];
  // OncoDash: + Gestor municipal (filtra pelo município do serviço; trava até a região de saúde)
  A.SCOPE = { estadual: 'uf', macro: 'macro_saude', regional: 'regiao_saude', municipal: 'mun_servico', local: 'cnes' };
  A.LEVEL = { federal: -1, estadual: 1, macro: 2, regional: 3, municipal: 3.5, local: 4 };
  A.SEG = [{ key: 'aut', label: 'Autorizadas', color: A.C.ok }, { key: 'ind', label: 'Indeferidas', color: A.C.bad }, { key: 'and', label: 'Em andamento / devolvidas', color: A.C.warn }, { key: 'can', label: 'Canceladas', color: A.C.gray }];
  // filtros: [parâmetro, coluna, nível territorial, rótulo]
  A.FKEYS = [['regiao', 'regiao', 0, 'Região'], ['uf', 'uf', 1, 'UF'], ['macro', 'macro_saude', 2, 'Macrorregião'], ['rs', 'regiao_saude', 3, 'Região de saúde'], ['cnes', 'cnes', 4, 'CNES'],
    ['tipo', 'tipo_servico', 9, 'Tipo'], ['ufres', 'uf_residencia', 9, 'Residência'], ['med', 'medicamento', 9, 'Medicamento'], ['apac', 'codigo_apac', 9, 'APAC'], ['linha', 'linha_tratamento', 9, 'Linha'],
    ['fin', 'finalidade', 9, 'Finalidade'], ['cbo', 'cbo_prescritor', 9, 'Profissional responsável'], ['cid', 'cid', 9, 'CID-10'], ['morf', 'morfologia', 9, 'Morfologia'], ['est', 'estadio_clinico', 9, 'Estádio'],
    ['her2', 'her2', 9, 'HER2'], ['recid', 'recidiva', 9, 'Recidiva'], ['tdiag', 'faixa_diag', 9, 'Diagnóstico'], ['sexo', 'sexo', 9, 'Sexo'], ['faixa', 'faixa_etaria', 9, 'Faixa etária'],
    ['sit', 'situacao', 9, 'Situação'], ['dev', 'com_devolucao', 9, 'Devolução'], ['dist', 'faixa_dist', 9, 'Distância']];
  A.TERR = ['regiao', 'uf', 'macro', 'rs', 'cnes'];
  A.ORDER = {
    est: ['Estádio I', 'Estádio II', 'Estádio III', 'Estádio IV', 'Fase crônica', 'Fase acelerada', 'Fase blástica'],
    faixa: ['até 29', '30–39', '40–49', '50–59', '60–69', '70+'],
    tdiag: ['até 30 dias', '31 a 60 dias', '61 a 90 dias', '91 a 180 dias', 'mais de 180 dias'],
    dist: ['até 50 km', '50 a 150 km', '150 a 300 km', '300 a 600 km', 'acima de 600 km'],
    sit: A.SIT.map((s) => s[0])
  };
  A.CID = { 'C50.1': 'Porção central da mama', 'C50.2': 'Quadrante superior interno da mama', 'C50.4': 'Quadrante superior externo da mama', 'C50.8': 'Lesão invasiva da mama', 'C50.9': 'Mama, não especificada', 'C92.1': 'Leucemia mieloide crônica', 'C83.3': 'Linfoma difuso de grandes células B', 'C82.9': 'Linfoma folicular, não especificado', 'C91.1': 'Leucemia linfocítica crônica de células B' };

  A.base = () => { const d = dash.data('base'); return d.status === 'ok' && Array.isArray(d.data) && d.data.length ? d.data : null; };
  A.ref = (all) => d3.max(all, (r) => r.data_solicitacao);
  A.P = () => { const p = dash.params() || {}; const o = { perfil: p.perfil || 'federal', escopo: p.escopo || '', dt_ini: p.dt_ini || '', dt_fim: p.dt_fim || '', mapa: p.mapa || 'sol' }; A.FKEYS.forEach(([k]) => { o[k] = p[k] || ''; }); return o; };
  A.scoped = (all, P) => { const k = A.SCOPE[P.perfil]; return k && P.escopo ? all.filter((r) => r[k] === P.escopo) : all; };
  A.rows = (skip) => {
    const all = A.base(); if (!all) return null;
    const P = A.P(); let r = A.scoped(all, P);
    if (P.dt_ini) r = r.filter((x) => x.data_solicitacao >= P.dt_ini);
    if (P.dt_fim) r = r.filter((x) => x.data_solicitacao <= P.dt_fim);
    for (const [p, c] of A.FKEYS) { if (skip && skip.includes(p)) continue; if (P[p]) { const vals = p === 'cbo' ? P[p].split('|').filter(Boolean) : [P[p]]; r = r.filter((x) => vals.includes(x[c])); } }
    return r;
  };
  A.setFilter = (key, v) => { const p = {}; p[key] = v; const i = A.TERR.indexOf(key); if (i >= 0 && v) A.TERR.slice(i + 1).forEach((k) => { p[k] = ''; }); dash.setParams(p); };
  A.env = (rows) => rows.filter((r) => r.situacao !== 'Rascunho');
  A.isInd = (r) => r.situacao === 'Indeferida' || r.situacao === 'Indeferida (prazo)';
  A.split = (rows) => {
    const o = { aut: 0, ind: 0, and: 0, can: 0, prazo: 0 };
    rows.forEach((r) => { const s = r.situacao; if (s === 'Autorizada') o.aut++; else if (A.isInd(r)) { o.ind++; if (s === 'Indeferida (prazo)') o.prazo++; } else if (s === 'Cancelada') o.can++; else if (s !== 'Rascunho') o.and++; });
    o.total = o.aut + o.ind + o.and + o.can; o.dec = o.aut + o.ind; o.taxa = o.dec ? o.aut / o.dec : null; o.tind = o.dec ? o.ind / o.dec : null; return o;
  };
  A.dash = (el) => { el.textContent = '—'; };
  A.fail = (el) => { const s = dash.data('base').status; el.replaceChildren(); const p = document.createElement('p'); p.className = 'ao-note'; p.textContent = s === 'loading' ? 'Carregando…' : s === 'error' ? 'Não foi possível carregar os dados.' : '—'; el.appendChild(p); };
  A.uniq = (rows, k) => new Set(rows.map((r) => r[k])).size;
  A.sexo = (v) => (v === 'F' ? 'Feminino' : v === 'M' ? 'Masculino' : v);
  A.dt = (s) => new Date(s + 'T00:00:00Z');
  A.dmy = (d) => String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear();
  A.dmyS = (s) => (s ? A.dmy(A.dt(s)) : '—');
  A.norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  A.pac = (rows) => { const m = new Map(); A.env(rows).forEach((r) => { if (!m.has(r.paciente)) m.set(r.paciente, r); }); return [...m.values()]; };
  A.label = (key, v, r) => {
    if (!v) return v;
    if (key === 'cnes') return r ? `${v} · ${r.no_estabelecimento || r.mun_servico} (${r.uf})` : 'CNES ' + v;
    if ((key === 'macro' || key === 'rs') && r) return `${v} (${r.uf})`;
    if (key === 'sexo') return A.sexo(v);
    if (key === 'cid') { const nome = A.CID[v] || (r && r.cid_nome); return nome ? `${v} · ${nome}` : v; }
    return v;
  };
  A.save = async (filename, data) => {
    let dl = null;
    try { dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch (e) { dl = null; }
    if (!dl) { if (A.say) A.say('Exportação indisponível nesta visualização.'); return; }
    try { await dl.save({ filename, data }); if (A.say) A.say('Arquivo pronto: ' + filename); }
    catch (e) { if (A.say) A.say(e && e.code === 'declined' ? 'Exportação cancelada.' : 'Não foi possível exportar.'); }
  };
  A.csvCell = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

  A.tip = (el) => {
    const t = document.createElement('div'); t.className = 'ao-tip'; t.style.display = 'none'; el.appendChild(t);
    return {
      show(ev, lines) {
        t.replaceChildren(...lines.map((l, i) => { const d = document.createElement('div'); d.textContent = l; if (i === 0) d.className = 'ao-tip-h'; return d; }));
        t.style.display = 'block';
        const b = el.getBoundingClientRect(); const w = t.offsetWidth, h = t.offsetHeight;
        let x = ev.clientX - b.left + 14, y = ev.clientY - b.top + 14;
        if (x + w > b.width) x = Math.max(0, ev.clientX - b.left - w - 14);
        if (y + h > b.height) y = Math.max(0, ev.clientY - b.top - h - 10);
        t.style.left = x + 'px'; t.style.top = y + 'px';
      },
      hide() { t.style.display = 'none'; }
    };
  };
  A.svg = (el, W, H, label) => d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', label).style('font-family', A.FONT).style('display', 'block');
  A.legend = (svg, items, y) => {
    let x = 0; const g = svg.append('g').attr('transform', `translate(0,${y || 4})`);
    items.forEach((s) => { const gg = g.append('g').attr('transform', `translate(${x},0)`); gg.append('rect').attr('width', 10).attr('height', 10).attr('rx', 3).attr('fill', s.color); const t = gg.append('text').attr('x', 15).attr('y', 9).attr('font-size', 11.5).attr('fill', A.C.muted).text(s.label); x += t.node().getComputedTextLength() + 30; });
  };
  A.textW = (svg, strs, size, weight) => { const g = svg.append('g'); let w = 0; strs.forEach((s) => { const t = g.append('text').attr('font-size', size).attr('font-weight', weight || 400).text(s); w = Math.max(w, t.node().getComputedTextLength()); }); g.remove(); return w; };
  A.empty = (el) => { el.replaceChildren(); const p = document.createElement('p'); p.className = 'ao-note'; p.textContent = 'Sem dados no recorte.'; el.appendChild(p); el._aoCsv = []; };

  A.hbar = (el, items, o) => {
    el.replaceChildren();
    if (!items.length) return A.empty(el);
    const W = Math.max(280, el.clientWidth || 400); const segs = o.segs; const rowH = o.rowH || 28; const leg = segs.length > 1 && o.legend !== false; const top = leg ? 28 : 4;
    const H = top + items.length * rowH + 4;
    const svg = A.svg(el, W, H, o.aria);
    if (leg) A.legend(svg, segs, 2);
    const fmt = o.fmt || A.n;
    const vtxt = (d) => fmt(d.total) + (d.note ? '  ·  ' + d.note : '');
    const lw = Math.min(A.textW(svg, items.map((d) => d.label), 12.5) + 12, W * 0.44);
    const vw = A.textW(svg, items.map(vtxt), 11.5, 500);
    const x = d3.scaleLinear().domain([0, o.max || d3.max(items, (d) => d.total) || 1]).range([0, Math.max(40, W - lw - vw - 14)]);
    const tip = A.tip(el);
    const g = svg.append('g').attr('transform', `translate(0,${top})`);
    items.forEach((d, i) => {
      const row = g.append('g').attr('transform', `translate(0,${i * rowH})`).style('cursor', o.onClick ? 'pointer' : 'default');
      const lab = row.append('text').attr('x', lw - 10).attr('y', rowH / 2 + 4).attr('text-anchor', 'end').attr('font-size', 12.5).attr('fill', d.sel ? A.C.pri : A.C.ink).attr('font-weight', d.sel ? 600 : 400).text(d.label);
      let s = d.label; while (lab.node().getComputedTextLength() > lw - 12 && s.length > 4) { s = s.slice(0, -2); lab.text(s + '…'); }
      row.append('rect').attr('x', lw).attr('y', 6).attr('width', Math.max(0, x.range()[1])).attr('height', rowH - 12).attr('rx', 4).attr('fill', '#eef2f6');
      let x0 = lw;
      segs.forEach((sg) => { const v = d.vals[sg.key] || 0; if (!v) return; const w = x(v); row.append('rect').attr('x', x0).attr('y', 6).attr('width', Math.max(1, w)).attr('height', rowH - 12).attr('rx', 3).attr('fill', d.color && segs.length === 1 ? d.color : sg.color); x0 += w; });
      row.append('text').attr('x', x0 + 7).attr('y', rowH / 2 + 4).attr('font-size', 11.5).attr('font-weight', 500).attr('fill', A.C.muted).text(vtxt(d));
      row.append('rect').attr('width', W).attr('height', rowH).attr('fill', 'transparent')
        .on('pointermove', (ev) => tip.show(ev, [d.label, ...segs.filter((sg) => d.vals[sg.key]).map((sg) => sg.label + ': ' + fmt(d.vals[sg.key])), ...(d.extra || [])]))
        .on('pointerleave', () => tip.hide())
        .on('click', () => { if (o.onClick) o.onClick(d); });
    });
    el._aoCsv = items.map((d) => { const r = { categoria: d.label }; segs.forEach((sg) => { r[sg.label] = d.vals[sg.key] || 0; }); r.total = d.total; if (d.note) r.observacao = d.note; return r; });
  };

  A.vbar = (el, items, o) => {
    el.replaceChildren();
    if (!items.length || !d3.sum(items, (d) => d.total)) return A.empty(el);
    const W = Math.max(260, el.clientWidth || 400), H = o.h || 240; const segs = o.segs; const leg = segs.length > 1; const top = leg ? 30 : 8, bot = 32;
    const svg = A.svg(el, W, H, o.aria);
    if (leg) A.legend(svg, segs, 2);
    const fmt = o.fmt || A.n;
    const x = d3.scaleBand().domain(items.map((d) => d.label)).range([4, W - 4]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(items, (d) => d.total) || 1]).range([H - bot, top + 20]);
    svg.append('line').attr('x1', 0).attr('x2', W).attr('y1', H - bot + 0.5).attr('y2', H - bot + 0.5).attr('stroke', A.C.line);
    const tip = A.tip(el);
    items.forEach((d) => {
      const g = svg.append('g'); let y0 = H - bot;
      segs.forEach((sg) => { const v = d.vals[sg.key] || 0; if (!v) return; const h = (H - bot) - y(v); g.append('rect').attr('x', x(d.label)).attr('y', y0 - h).attr('width', x.bandwidth()).attr('height', Math.max(1, h)).attr('rx', 4).attr('fill', d.color && segs.length === 1 ? d.color : sg.color); y0 -= h; });
      g.append('text').attr('x', x(d.label) + x.bandwidth() / 2).attr('y', y0 - 6).attr('text-anchor', 'middle').attr('font-size', 11.5).attr('font-weight', 600).attr('fill', A.C.ink).text(o.top ? o.top(d) : fmt(d.total));
      const lab = g.append('text').attr('x', x(d.label) + x.bandwidth() / 2).attr('y', H - bot + 18).attr('text-anchor', 'middle').attr('font-size', 11.5).attr('fill', A.C.muted).text(d.label);
      let s = d.label; while (lab.node().getComputedTextLength() > x.step() - 2 && s.length > 3) { s = s.slice(0, -2); lab.text(s + '…'); }
      g.append('rect').attr('x', x(d.label) - x.step() * x.paddingInner() / 2).attr('y', 0).attr('width', x.step()).attr('height', H).attr('fill', 'transparent').style('cursor', o.onClick ? 'pointer' : 'default')
        .on('pointermove', (ev) => tip.show(ev, [d.label, ...segs.filter((sg) => d.vals[sg.key]).map((sg) => sg.label + ': ' + fmt(d.vals[sg.key])), ...(d.extra || [])]))
        .on('pointerleave', () => tip.hide())
        .on('click', () => { if (o.onClick) o.onClick(d); });
    });
    if (o.refAfter) {
      const i = items.findIndex((d) => d.label === o.refAfter);
      if (i >= 0) { const xr = x(items[i].label) + x.bandwidth() + x.step() * x.paddingInner() / 2; svg.append('line').attr('x1', xr).attr('x2', xr).attr('y1', top + 8).attr('y2', H - bot).attr('stroke', A.C.bad).attr('stroke-dasharray', '4 3'); svg.append('text').attr('x', xr + 5).attr('y', top + 16).attr('font-size', 11.5).attr('font-weight', 500).attr('fill', A.C.bad).text(o.refText); }
    }
    el._aoCsv = items.map((d) => { const r = { categoria: d.label }; segs.forEach((sg) => { r[sg.label] = d.vals[sg.key] || 0; }); r.total = d.total; return r; });
  };

  A.lines = (el, xs, series, o) => {
    el.replaceChildren();
    if (xs.length < 2) { const p = document.createElement('p'); p.className = 'ao-note'; p.textContent = 'Poucos pontos no recorte para desenhar a série.'; el.appendChild(p); el._aoCsv = []; return; }
    const W = Math.max(280, el.clientWidth || 600), H = o.h || 250, top = 30, bot = 24;
    const svg = A.svg(el, W, H, o.aria);
    A.legend(svg, series, 2);
    const y = d3.scaleLinear().domain([0, d3.max(series, (s) => d3.max(s.vals)) || 1]).nice(4).range([H - bot, top + 10]);
    const ticks = y.ticks(4);
    const ml = A.textW(svg, ticks.map(A.n), 11.5) + 10;
    const x = d3.scaleUtc().domain(d3.extent(xs)).range([ml + 8, W - 12]);
    ticks.forEach((t) => { svg.append('line').attr('x1', ml).attr('x2', W).attr('y1', y(t)).attr('y2', y(t)).attr('stroke', A.C.grid); svg.append('text').attr('x', ml - 6).attr('y', y(t) + 4).attr('text-anchor', 'end').attr('font-size', 11.5).attr('fill', A.C.muted).text(A.n(t)); });
    let lastX = -1e9;
    d3.utcMonth.range(d3.utcMonth.ceil(xs[0]), new Date(+xs[xs.length - 1] + 1)).forEach((m) => { const px = x(m); if (px - lastX < 44) return; lastX = px; svg.append('text').attr('x', px).attr('y', H - 6).attr('text-anchor', 'middle').attr('font-size', 11.5).attr('fill', A.C.muted).text(A.MES[m.getUTCMonth()] + '/' + String(m.getUTCFullYear()).slice(2)); });
    series.forEach((s) => {
      svg.append('path').attr('d', d3.line().x((v, i) => x(xs[i])).y((v) => y(v))(s.vals)).attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 2.2).attr('stroke-linejoin', 'round');
      svg.append('g').selectAll('circle').data(s.vals).join('circle').attr('cx', (v, i) => x(xs[i])).attr('cy', (v) => y(v)).attr('r', 2.8).attr('fill', '#FFF').attr('stroke', s.color).attr('stroke-width', 1.6);
    });
    const rule = svg.append('line').attr('y1', top + 8).attr('y2', H - bot).attr('stroke', A.C.muted).attr('stroke-dasharray', '3 3').style('display', 'none');
    const tip = A.tip(el);
    const pointAt = (ev) => { const [mx] = d3.pointer(ev); return d3.bisector((d) => d).center(xs, x.invert(mx)); };
    svg.append('rect').attr('x', ml).attr('width', W - ml).attr('height', H).attr('fill', 'transparent').style('cursor', o.onClick ? 'pointer' : 'default')
      .on('pointermove', (ev) => { const i = pointAt(ev); rule.attr('x1', x(xs[i])).attr('x2', x(xs[i])).style('display', null); tip.show(ev, [o.xfmt(xs[i]), ...series.map((s) => s.label + ': ' + A.n(s.vals[i]))]); })
      .on('pointerleave', () => { rule.style('display', 'none'); tip.hide(); })
      .on('click', (ev) => { if (o.onClick) { const i = pointAt(ev); o.onClick({ index: i, date: xs[i] }); } });
    el._aoCsv = xs.map((d, i) => { const r = { periodo: o.xfmt(d) }; series.forEach((s) => { r[s.label] = s.vals[i]; }); return r; });
  };
})();

dash.calc('base', {
  inputs: ['solicitacoes'],
  title: 'Solicitações tipadas',
  description: 'Amostra com números convertidos e faixas derivadas para os filtros.',
  fn: (solicitacoes) => solicitacoes.map((r) => {
    const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
    const dias = (a, b) => (a && b ? Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5) : null);
    const dd = dias(r.data_diagnostico, r.data_solicitacao);
    const km = num(r.distancia_km);
    return {
      ...r, n_devolucoes: num(r.n_devolucoes) || 0, dias_ate_parecer: num(r.dias_ate_parecer), dias_aguardando: num(r.dias_aguardando), idade: num(r.idade), distancia_km: km,
      lat_res: num(r.lat_res), lon_res: num(r.lon_res), lat_srv: num(r.lat_srv), lon_srv: num(r.lon_srv),
      dias_diag: dd,
      faixa_diag: dd === null ? null : dd <= 30 ? 'até 30 dias' : dd <= 60 ? '31 a 60 dias' : dd <= 90 ? '61 a 90 dias' : dd <= 180 ? '91 a 180 dias' : 'mais de 180 dias',
      faixa_dist: km === null ? null : km <= 50 ? 'até 50 km' : km <= 150 ? '50 a 150 km' : km <= 300 ? '150 a 300 km' : km <= 600 ? '300 a 600 km' : 'acima de 600 km',
      com_devolucao: (num(r.n_devolucoes) || 0) > 0 ? 'Sim' : 'Não'
    };
  })
});
