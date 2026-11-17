/*
 * Runtime do painel (o mesmo do protótipo v2): parâmetros dos filtros,
 * fontes de dados, cálculos derivados e o ciclo de desenho dos gráficos.
 * Diferença: as fontes não vêm mais embutidas — começam "carregando" e são
 * preenchidas pela API (ver oncodash.js, dash.setSource).
 */
(function () {
  const sources = { solicitacoes: { status: 'loading', data: [] }, malha_uf: { status: 'loading', data: null } };
  const DEF = { perfil: 'federal', escopo: '', dt_ini: '', dt_fim: '', mapa: 'sol' };
  ['regiao','uf','macro','rs','cnes','tipo','ufres','med','apac','linha','fin','cbo','cid','morf','est','her2','recid','tdiag','sexo','faixa','sit','dev','dist'].forEach((k) => { DEF[k] = ''; });
  let params = Object.assign({}, DEF);
  const calcs = {}, cache = {}, draws = [], onDatas = [], mounted = new WeakMap();
  let pending = false;
  function render() {
    pending = false;
    onDatas.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    draws.forEach(([name, f]) => {
      document.querySelectorAll('[data-draw="' + name + '"]').forEach((el) => {
        if (el.closest('[hidden]')) return;
        try {
          if (typeof f === 'function') f(el);
          else { if (!mounted.has(el)) mounted.set(el, f.mount ? f.mount(el) : null); if (f.update) f.update(el, mounted.get(el)); }
        } catch (e) { console.error('desenho ' + name, e); }
      });
    });
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(render); } }
  window.dash = {
    data(id) {
      if (sources[id]) return sources[id];
      if (calcs[id]) {
        if (!cache[id]) {
          const ins = calcs[id].inputs.map((i) => window.dash.data(i));
          const pend = ins.find((x) => x.status !== 'ok');
          if (pend) return { status: pend.status, data: [] };
          cache[id] = { status: 'ok', data: calcs[id].fn(...ins.map((x) => x.data)) };
        }
        return cache[id];
      }
      return { status: 'missing', data: [] };
    },
    calc(id, o) { calcs[id] = o; }, loader() {},
    draw(name, f) { draws.push([name, f]); }, onData(f) { onDatas.push(f); },
    params() { return Object.assign({}, params); },
    setParams(p) { Object.assign(params, p); schedule(); },
    resetParams() { params = Object.assign({}, DEF); schedule(); },
    setLink(n) { try { history.replaceState(null, '', '#' + n); } catch (e) {} },
    refresh() {}, colors: [],
    /** Troca uma fonte de dados (carregada da API) e redesenha tudo. */
    setSource(id, src) { sources[id] = src; Object.keys(cache).forEach((k) => { delete cache[k]; }); schedule(); }
  };
  window.claude = { use: async (n) => n !== 'downloads' ? null : {
    save: async ({ filename, data }) => {
      const ext = filename.split('.').pop();
      const mime = { csv: 'text/csv;charset=utf-8', svg: 'image/svg+xml', png: 'image/png' }[ext] || 'application/octet-stream';
      const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      if (window.ODash && window.ODash.registrarExportacao) window.ODash.registrarExportacao(filename, ext);
      return { status: 'saved' };
    } } };
  window.addEventListener('DOMContentLoaded', () => {
    render();
    const mo = new MutationObserver((recs) => { if (recs.some((r) => r.target.matches && r.target.matches('section[data-sec]'))) schedule(); });
    document.querySelectorAll('section[data-sec]').forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ['hidden'] }));
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(schedule, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  });
})();
