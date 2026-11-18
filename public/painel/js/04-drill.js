// lista que abre ao clicar no cartão
(function () {
  const A = window.AO;
  const days = (a, b) => Math.round((A.dt(b) - A.dt(a)) / 864e5);
  // OncoDash: medicamento anti-HER2, sem depender de maiúsculas/acentos/apresentação.
  const ANTI_HER2 = /trastuzum|pertuzum|lapatin|tucatin|neratin|t-?dm1/;
  // OncoDash: duração em dias → "35 min", "2,1 h" ou "3,2 dias".
  A.duracao = (d) => (d === null || d === undefined ? '—' : d < 1 / 24 ? A.n(Math.max(1, Math.round(d * 1440))) + ' min' : d < 1 ? A.f1(d * 24) + ' h' : A.f1(d) + ' dias');
  A.antiHer2 = (x) => ANTI_HER2.test(A.norm(x.medicamento || ''));
  A.KPI = {
    env: (r) => A.env(r),
    aut: (r) => r.filter((x) => x.situacao === 'Autorizada'),
    ind: (r) => r.filter(A.isInd),
    dev: (r) => A.env(r).filter((x) => x.n_devolucoes > 0),
    fila: (r) => r.filter((x) => x.situacao === 'Enviada' || x.situacao === 'Em análise'),
    tempo: (r) => r.filter((x) => x.dias_ate_parecer !== null).sort((a, b) => b.dias_ate_parecer - a.dias_ate_parecer),
    rasc: (r) => r.filter((x) => x.situacao === 'Rascunho'),
    rasc_t: (r) => r.filter((x) => x.situacao === 'Rascunho').sort((a, b) => a.data_solicitacao.localeCompare(b.data_solicitacao)),
    dist: (r) => A.env(r).sort((a, b) => b.distancia_km - a.distancia_km),
    r_pac: (r) => A.pac(r),
    r_rs: (r) => A.pac(r).filter((x) => x.regiao_saude !== x.regiao_saude_residencia),
    r_uf: (r) => A.pac(r).filter((x) => x.uf !== x.uf_residencia),
    r_dist: (r) => A.pac(r).sort((a, b) => b.distancia_km - a.distancia_km),
    i_merito: (r) => r.filter((x) => x.situacao === 'Indeferida'),
    i_prazo: (r) => r.filter((x) => x.situacao === 'Indeferida (prazo)'),
    i_dev: (r) => r.filter((x) => A.isInd(x) && x.n_devolucoes > 0),
    i_reinc: (r) => { const ids = new Set(d3.groups(A.env(r), (x) => x.paciente).filter(([, v]) => { v.sort((a, b) => a.data_solicitacao.localeCompare(b.data_solicitacao)); const i = v.findIndex(A.isInd); return i >= 0 && i < v.length - 1; }).map(([k]) => k)); return A.env(r).filter((x) => ids.has(x.paciente)).sort((a, b) => a.paciente.localeCompare(b.paciente) || a.data_solicitacao.localeCompare(b.data_solicitacao)); },
    c_diag: (r) => A.env(r).filter((x) => x.dias_diag !== null).sort((a, b) => b.dias_diag - a.dias_diag),
    c_diag60: (r) => A.env(r).filter((x) => x.dias_diag > 60).sort((a, b) => b.dias_diag - a.dias_diag),
    c_cbo: (r) => A.env(r).filter((x) => !/^2251(21|85)/.test(x.cbo_prescritor || '')),
    // OncoDash: só medicamentos anti-HER2 (nome em qualquer grafia: "TRASTUZUMABE 150 MG...", "Pertuzumabe"...).
    c_her2: (r) => A.env(r).filter((x) => x.her2 === '2+ (sem FISH)' && A.antiHer2(x)),
    c_recid: (r) => A.env(r).filter((x) => x.recidiva === 'Sim')
  };
  A.openDetail = (section, title, rows) => document.dispatchEvent(new CustomEvent('ao:detail', { detail: { section, title, rows } }));
  const pill = (s) => { const c = s === 'Autorizada' ? 'ok' : s === 'Indeferida' ? 'bad' : s === 'Indeferida (prazo)' ? 'adm' : s === 'Devolvida' ? 'warn' : s === 'Em análise' || s === 'Enviada' ? 'pri' : ''; const e = document.createElement('span'); e.className = 'ao-pill ' + c; e.textContent = s; return e; };
  const COLS = [
    ['Solicitação', (x) => x.id], ['Paciente', (x) => x.paciente, 'local'], ['Data', (x) => A.dmyS(x.data_solicitacao)], ['Situação', (x) => x.situacao, null, pill],
    ['Medicamento', (x) => x.medicamento],
    // OncoDash: o CBO aparece na lista do cartão "Prescritor fora de oncologia/hematologia" (6º item = cartões onde aparece).
    ['CBO do prescritor', (x) => x.cbo_prescritor || '—', null, null, 0, ['c_cbo']],
    ['CID-10', (x) => x.cid], ['Estádio', (x) => x.estadio_clinico], ['Serviço', (x) => `${x.cnes} · ${x.mun_servico} (${x.uf})`],
    ['Residência', (x) => `${x.mun_residencia} (${x.uf_residencia})`], ['Km', (x) => A.n(x.distancia_km), null, null, 1], ['Tempo até parecer', (x) => A.duracao(x.dias_ate_parecer), null, null, 1],
    ['Devoluções', (x) => String(x.n_devolucoes), null, null, 1], ['Diagnóstico → solicitação', (x) => (x.dias_diag === null ? '—' : x.dias_diag + ' d'), null, null, 1], ['Motivo', (x) => x.motivo_indeferimento || x.motivo_devolucao || '—']
  ];
  const LIM = 300;
  dash.draw('detail', {
    mount(el) {
      const sec = el.closest('section') || document;
      const st = { key: null, title: '', q: '', rows: null };
      const modal = document.createElement('div'); modal.className = 'ao-dmodal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
      const head = document.createElement('div'); head.className = 'ao-dhead';
      const left = document.createElement('div'); const h = document.createElement('h3'); const nn = document.createElement('div'); nn.className = 'ao-dn'; left.append(h);
      const tools = document.createElement('div'); tools.className = 'ao-dtools';
      const q = document.createElement('input'); q.type = 'search'; q.className = 'ao-dq'; q.placeholder = 'Pesquisar na lista…'; q.setAttribute('aria-label', 'Pesquisar na lista');
      const csv = document.createElement('button'); csv.type = 'button'; csv.className = 'ao-btn'; csv.textContent = '↓ Exportar CSV';
      const close = document.createElement('button'); close.type = 'button'; close.className = 'ao-detail-close'; close.textContent = '×'; close.setAttribute('aria-label', 'Fechar detalhamento');
      tools.append(close); head.append(left, tools);
      const meta = document.createElement('div'); meta.className = 'ao-dmeta'; meta.append(nn, q, csv);
      const scroll = document.createElement('div'); scroll.className = 'ao-dscroll';
      const table = document.createElement('table'); table.className = 'ao-table'; const thead = document.createElement('thead'); const tbody = document.createElement('tbody'); table.append(thead, tbody); scroll.appendChild(table);
      const foot = document.createElement('div'); foot.className = 'ao-note';
      modal.append(head, meta, scroll, foot); el.append(modal);
      const m = { el, sec, st, h, nn, q, tbody, thead, foot, csv, close, modal };
      m.cols = () => COLS.filter((c) => (c[2] !== 'local' || A.P().perfil === 'local') && (!c[5] || c[5].includes(st.key)));
      m.all = () => { if (st.rows) return st.rows; const r = A.rows(); return r && st.key && A.KPI[st.key] ? A.KPI[st.key](r) : []; };
      m.filtered = () => { const cols = m.cols(); const t = A.norm(st.q); const rows = m.all(); return t ? rows.filter((x) => cols.some((c) => A.norm(c[1](x)).includes(t))) : rows; };
      m.body = () => {
        const cols = m.cols(); const rows = m.filtered();
        tbody.replaceChildren(...rows.slice(0, LIM).map((x) => { const tr = document.createElement('tr'); cols.forEach((c) => { const td = document.createElement('td'); if (c[3]) td.appendChild(c[3](c[1](x))); else td.textContent = c[1](x); if (c[4]) td.className = 'ao-num'; tr.appendChild(td); }); return tr; }));
        foot.textContent = rows.length > LIM ? `Mostrando ${A.n(LIM)} de ${A.n(rows.length)}; exporte o CSV para ver todas.` : rows.length ? '' : 'Nenhuma solicitação encontrada.';
        nn.textContent = A.n(rows.length) + (rows.length === 1 ? ' solicitação' : ' solicitações') + (st.q ? ' na busca' : '');
      };
      m.render = () => {
        sec.querySelectorAll('[data-kpi]').forEach((c) => {
          const on = c.dataset.kpi === st.key;
          c.classList.toggle('ao-sel', on);
          c.setAttribute('role', 'button');
          c.setAttribute('aria-expanded', on ? 'true' : 'false');
          c.setAttribute('aria-label', ((c.querySelector('.ao-kpi-l') || {}).textContent || 'Indicador') + ': abrir tabela detalhada');
        });
        el.classList.toggle('ao-open', !!st.key);
        document.body.style.overflow = document.querySelector('.ao-detail.ao-open') ? 'hidden' : '';
        if (!st.key) return;
        h.textContent = st.title + ' — detalhamento';
        const tr = document.createElement('tr'); m.cols().forEach((c) => { const th = document.createElement('th'); th.textContent = c[0]; if (c[4]) th.className = 'ao-num'; tr.appendChild(th); }); thead.replaceChildren(tr);
        m.body();
      };
      m.open = (card) => { const k = card.dataset.kpi; if (st.key === k) { st.key = null; st.rows = null; m.render(); return; } st.key = k; st.rows = null; st.title = (card.querySelector('.ao-kpi-l') || {}).textContent || 'Lista'; st.q = ''; q.value = ''; m.render(); close.focus(); };
      m.openRows = (title, rows) => { st.key = 'drill'; st.rows = rows; st.title = title; st.q = ''; q.value = ''; m.render(); close.focus(); };
      m.onClick = (ev) => { const c = ev.target.closest('[data-kpi]'); if (c && sec.contains(c)) m.open(c); };
      m.onKey = (ev) => { const c = ev.target.closest('[data-kpi]'); if (c && sec.contains(c) && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); m.open(c); } };
      sec.addEventListener('click', m.onClick); sec.addEventListener('keydown', m.onKey);
      q.addEventListener('input', () => { st.q = q.value; m.body(); });
      m.close = () => { st.key = null; st.rows = null; m.render(); };
      close.addEventListener('click', m.close);
      m.onBackdrop = (ev) => { if (ev.target === el) m.close(); };
      el.addEventListener('click', m.onBackdrop);
      m.onEscape = (ev) => { if (ev.key === 'Escape' && st.key) m.close(); };
      document.addEventListener('keydown', m.onEscape);
      m.onDrill = (ev) => { const d = ev.detail || {}; if (d.section === sec.id) m.openRows(d.title, d.rows || []); };
      document.addEventListener('ao:detail', m.onDrill);
      csv.addEventListener('click', () => {
        const cols = m.cols(); const rows = m.filtered();
        const txt = [cols.map((c) => A.csvCell(c[0])).join(';'), ...rows.map((x) => cols.map((c) => A.csvCell(c[1](x))).join(';'))].join('\n');
        A.save('oncodash_lista_' + st.key + '_' + new Date().toISOString().slice(0, 10) + '.csv', '\ufeff' + txt);
      });
      return m;
    },
    update(el, m) { m.render(); },
    unmount(el, m) { if (m) { m.sec.removeEventListener('click', m.onClick); m.sec.removeEventListener('keydown', m.onKey); el.removeEventListener('click', m.onBackdrop); document.removeEventListener('keydown', m.onEscape); document.removeEventListener('ao:detail', m.onDrill); document.body.style.overflow = ''; } }
  });
})();
