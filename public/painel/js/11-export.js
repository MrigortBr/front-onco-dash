// exportação dos gráficos e aviso
(function () {
  const A = window.AO;
  dash.draw('toast', {
    mount(el) {
      const root = el.closest('.ao') || document;
      let timer = null;
      A.say = (m) => { el.textContent = m; el.classList.add('ao-show'); clearTimeout(timer); timer = setTimeout(() => el.classList.remove('ao-show'), 3500); };
      const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const toCsv = (card) => {
        const table = card.querySelector('table');
        if (table) return [...table.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => A.csvCell(c.textContent.trim())).join(';')).join('\n');
        const chart = card.querySelector('.ao-chart'); const rows = chart && chart._aoCsv;
        if (!rows || !rows.length) return null;
        const cols = Object.keys(rows[0]);
        return [cols.map(A.csvCell).join(';'), ...rows.map((r) => cols.map((c) => A.csvCell(typeof r[c] === 'number' ? String(Math.round(r[c] * 1000) / 1000).replace('.', ',') : r[c])).join(';'))].join('\n');
      };
      const filtros = () => { const P = A.P(); const parts = []; if (P.dt_ini || P.dt_fim) parts.push('Período ' + A.dmyS(P.dt_ini) + ' a ' + A.dmyS(P.dt_fim)); A.FKEYS.forEach(([k, , , l]) => { if (P[k]) parts.push(l + ': ' + A.label(k, P[k])); }); return parts.length ? 'Filtros: ' + parts.join(' · ') : 'Sem filtros'; };
      const buildSvg = (card) => {
        const svg = card.querySelector('.ao-chart svg'); if (!svg) return null;
        const vb = svg.viewBox.baseVal; const W = vb.width, H = vb.height;
        const title = (card.querySelector('h3') || {}).textContent || 'Gráfico';
        const inner = [...svg.childNodes].map((n) => new XMLSerializer().serializeToString(n)).join('');
        return { W: W + 40, H: H + 104, str: `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 40}" height="${H + 104}" viewBox="0 0 ${W + 40} ${H + 104}" font-family="'Segoe UI', Arial, sans-serif"><rect width="100%" height="100%" fill="#FFFFFF"/><rect width="100%" height="4" fill="#1a7a4a"/><text x="20" y="32" font-size="16" font-weight="700" fill="#1f2937">${esc(title)}</text><text x="20" y="52" font-size="11" fill="#64748b">${esc(filtros().slice(0, 170))}</text><svg x="20" y="66" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg><text x="20" y="${H + 92}" font-size="10" fill="#94a3b8">Autoriza Onco · Painel de monitoramento · exportado em ${A.dmy(new Date())} · dados de amostra</text></svg>` };
      };
      const toPng = (s) => new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => { const k = 2; const c = document.createElement('canvas'); c.width = s.W * k; c.height = s.H * k; const ctx = c.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height); ctx.scale(k, k); ctx.drawImage(img, 0, 0); c.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'); };
        img.onerror = () => rej(new Error('img'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.str);
      });
      const handler = async (ev) => {
        const b = ev.target.closest && ev.target.closest('button[data-exp]'); if (!b || !root.contains(b)) return;
        const card = b.closest('.ao-card'); if (!card) return;
        const fmt = b.dataset.exp; const base = 'oncodash_' + (card.id || 'grafico') + '_' + new Date().toISOString().slice(0, 10);
        if (fmt === 'csv') { const c = toCsv(card); if (!c) { A.say('Nada para exportar neste recorte.'); return; } return A.save(base + '.csv', '\ufeff' + c); }
        const s = buildSvg(card); if (!s) { A.say('Nada para exportar neste recorte.'); return; }
        if (fmt === 'svg') return A.save(base + '.svg', s.str);
        try { A.save(base + '.png', await toPng(s)); } catch (e) { A.say('Não foi possível gerar o PNG.'); }
      };
      root.addEventListener('click', handler);
      return { root, handler };
    },
    update() {},
    unmount(el, m) { if (m && m.root) m.root.removeEventListener('click', m.handler); }
  });
})();
