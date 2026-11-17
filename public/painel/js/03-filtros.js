// filtros: escopo, período, combos pesquisáveis, chips
(function () {
  const A = window.AO;
  const CARET = '<svg class="ao-cb-car" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="#62728A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  dash.draw('f_escopo', (sel) => {
    const all = A.base(); const P = A.P(); const k = A.SCOPE[P.perfil];
    sel.disabled = !k;
    if (!all || !k) { sel.replaceChildren(new Option(P.perfil === 'federal' ? 'Brasil (todas as UFs)' : '—', '')); sel.value = ''; return; }
    const m = new Map(); all.forEach((r) => { if (!m.has(r[k])) m.set(r[k], r); });
    const lab = (v, r) => (k === 'uf' ? v : k === 'cnes' ? `CNES ${v} · ${r.mun_servico} (${r.uf})` : `${v} (${r.uf})`);
    const opts = [...m.entries()].sort((a, b) => (a[1].uf + lab(a[0], a[1])).localeCompare(b[1].uf + lab(b[0], b[1]), 'pt-BR'));
    sel.replaceChildren(...opts.map(([v, r]) => new Option(lab(v, r), v)));
    sel.value = P.escopo;
    sel.onchange = () => { const p = { escopo: sel.value }; A.TERR.forEach((t) => { p[t] = ''; }); dash.setParams(p); };
  });

  const popPosition = (m) => {
    if (!m.st.open || !m.pop) return;
    const r = m.btn.getBoundingClientRect(), w = Math.min(Math.max(r.width, 280), window.innerWidth - 16);
    const below = window.innerHeight - r.bottom - 14;
    m.pop.style.width = w + 'px'; m.pop.style.left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8) + 'px';
    m.pop.style.top = (below >= 190 || r.top < 220 ? r.bottom + 6 : Math.max(8, r.top - Math.min(300, r.top - 8))) + 'px';
  };
  const popOpen = (m) => { m.st.open = true; m.el.classList.add('ao-open'); m.pop.classList.add('ao-pop-portal'); document.body.appendChild(m.pop); popPosition(m); };
  const popClose = (m) => { m.st.open = false; m.el.classList.remove('ao-open'); if (m.pop && m.pop.classList.contains('ao-pop-portal')) { m.pop.classList.remove('ao-pop-portal'); m.el.appendChild(m.pop); } };

  // combo pesquisável genérico
  dash.draw('fx', {
    mount(el) {
      const key = el.dataset.key;
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ao-cb-btn'; btn.setAttribute('aria-haspopup', 'listbox');
      const val = document.createElement('span'); val.className = 'ao-cb-val'; btn.appendChild(val); btn.insertAdjacentHTML('beforeend', CARET);
      const pop = document.createElement('div'); pop.className = 'ao-pop';
      const inp = document.createElement('input'); inp.type = 'search'; inp.className = 'ao-pop-q'; inp.placeholder = 'Pesquisar…'; inp.setAttribute('aria-label', 'Pesquisar opções');
      const list = document.createElement('div'); list.className = 'ao-pop-list'; list.setAttribute('role', 'listbox');
      const none = document.createElement('div'); none.className = 'ao-pop-empty'; none.textContent = 'Nenhuma opção encontrada.'; none.style.display = 'none';
      pop.append(inp, list, none); el.append(btn, pop);
      const m = { el, key, btn, val, inp, list, none, pop, st: { open: false } };
      m.filt = () => { const q = A.norm(inp.value); let n = 0; list.querySelectorAll('.ao-opt').forEach((o) => { const ok = !q || A.norm(o.dataset.txt).includes(q); o.style.display = ok ? '' : 'none'; if (ok) n++; }); none.style.display = n ? 'none' : ''; };
      btn.addEventListener('click', () => { if (btn.disabled) return; if (m.st.open) popClose(m); else { popOpen(m); inp.value = ''; m.filt(); setTimeout(() => inp.focus(), 0); } });
      inp.addEventListener('input', m.filt);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') { popClose(m); btn.focus(); } if (e.key === 'Enter') { const f = [...list.querySelectorAll('.ao-opt')].find((o) => o.style.display !== 'none'); if (f) f.click(); } });
      list.addEventListener('click', (e) => {
        const o = e.target.closest('.ao-opt'); if (!o) return;
        if (key !== 'cbo') { popClose(m); A.setFilter(key, o.dataset.v); return; }
        const selected = new Set((A.P().cbo || '').split('|').filter(Boolean));
        if (!o.dataset.v) selected.clear(); else if (selected.has(o.dataset.v)) selected.delete(o.dataset.v); else selected.add(o.dataset.v);
        dash.setParams({ cbo: [...selected].join('|') });
      });
      m.outside = (e) => { if (m.st.open && !el.contains(e.target) && !pop.contains(e.target)) popClose(m); };
      m.reposition = () => popPosition(m);
      document.addEventListener('pointerdown', m.outside);
      document.addEventListener('scroll', m.reposition, true); window.addEventListener('resize', m.reposition);
      return m;
    },
    update(el, m) {
      const P = A.P(); const f = A.FKEYS.find((x) => x[0] === m.key); if (!f) return;
      const col = f[1], lvl = f[2];
      const rows = A.rows([m.key]);
      if (!rows) { m.val.textContent = '—'; return; }
      const locked = lvl <= A.LEVEL[P.perfil];
      const counts = d3.rollup(rows, (v) => v.length, (r) => r[col]);
      const first = new Map(); rows.forEach((r) => { if (!first.has(r[col])) first.set(r[col], r); });
      let vals = [...counts.keys()].filter((v) => v !== null && v !== '');
      const ord = A.ORDER[m.key];
      if (ord) vals.sort((a, b) => ord.indexOf(a) - ord.indexOf(b));
      else if (['uf', 'ufres', 'regiao', 'apac', 'cid'].includes(m.key)) vals.sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { numeric: true }));
      else vals.sort((a, b) => counts.get(b) - counts.get(a));
      const cur = P[m.key], selected = new Set((m.key === 'cbo' ? cur.split('|') : [cur]).filter(Boolean));
      const mk = (v, label, n) => { const on = v ? selected.has(v) : !selected.size; const o = document.createElement('div'); o.className = 'ao-opt' + (on ? ' ao-on' : ''); o.dataset.v = v; o.dataset.txt = label; o.setAttribute('role', 'option'); o.setAttribute('aria-selected', on ? 'true' : 'false'); const a = document.createElement('span'); a.textContent = label; const b = document.createElement('span'); b.textContent = n === null ? '' : A.n(n); o.append(a, b); return o; };
      const opts = [mk('', 'Todas as opções', null), ...vals.map((v) => mk(v, A.label(m.key, v, first.get(v)), counts.get(v)))];
      [...selected].filter((v) => !vals.includes(v)).reverse().forEach((v) => opts.splice(1, 0, mk(v, A.label(m.key, v), 0)));
      m.list.replaceChildren(...opts);
      if (locked) { m.btn.disabled = true; const v = vals.length === 1 ? vals[0] : ''; m.val.textContent = v ? A.label(m.key, v, first.get(v)) : 'Definido pelo perfil'; m.val.classList.remove('ao-set'); }
      else { m.btn.disabled = false; m.val.textContent = !selected.size ? 'Todas' : (m.key === 'cbo' && selected.size > 1 ? selected.size + ' profissionais' : A.label(m.key, [...selected][0], first.get([...selected][0]))); m.val.classList.toggle('ao-set', !!selected.size); }
      if (m.st.open) m.filt();
    },
    unmount(el, m) { if (m && m.outside) { popClose(m); document.removeEventListener('pointerdown', m.outside); document.removeEventListener('scroll', m.reposition, true); window.removeEventListener('resize', m.reposition); } }
  });

  // período
  dash.draw('fperiodo', {
    mount(el) {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ao-cb-btn';
      const val = document.createElement('span'); val.className = 'ao-cb-val'; btn.appendChild(val); btn.insertAdjacentHTML('beforeend', CARET);
      const pop = document.createElement('div'); pop.className = 'ao-pop'; pop.style.width = 'max(100%,320px)';
      const h1 = document.createElement('h4'); h1.textContent = 'Atalhos';
      const pres = document.createElement('div'); pres.className = 'ao-presets';
      [['tudo', 'Todo o período'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 3 meses'], ['180', 'Últimos 6 meses'], ['mes', 'Mês atual'], ['ano', 'Ano atual']].forEach(([k, t]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ao-pre'; b.dataset.pre = k; b.textContent = t; pres.appendChild(b); });
      const h2 = document.createElement('h4'); h2.textContent = 'Competência (mês)';
      const comp = document.createElement('select'); comp.setAttribute('aria-label', 'Competência');
      const h3 = document.createElement('h4'); h3.textContent = 'Intervalo de datas';
      const rg = document.createElement('div'); rg.className = 'ao-range';
      const mkd = (t) => { const w = document.createElement('div'); const l = document.createElement('label'); l.textContent = t; const i = document.createElement('input'); i.type = 'date'; w.append(l, i); return [w, i]; };
      const [w1, d1] = mkd('De'); const [w2, d2] = mkd('Até');
      const ap = document.createElement('button'); ap.type = 'button'; ap.className = 'ao-fbtn'; ap.style.height = '34px'; ap.textContent = 'Aplicar';
      rg.append(w1, w2, ap);
      pop.append(h1, pres, h2, comp, h3, rg); el.append(btn, pop);
      const m = { el, btn, val, pres, comp, d1, d2, pop, st: { open: false } };
      const iso = (d) => d.toISOString().slice(0, 10);
      btn.addEventListener('click', () => { if (m.st.open) popClose(m); else popOpen(m); });
      pres.addEventListener('click', (e) => {
        const b = e.target.closest('.ao-pre'); if (!b) return; const all = A.base(); if (!all) return;
        const ref = A.dt(A.ref(all)); let ini = '', fim = '';
        if (b.dataset.pre === 'mes') { ini = iso(d3.utcMonth.floor(ref)); fim = iso(ref); }
        else if (b.dataset.pre === 'ano') { ini = iso(d3.utcYear.floor(ref)); fim = iso(ref); }
        else if (b.dataset.pre !== 'tudo') { ini = iso(new Date(ref - (Number(b.dataset.pre) - 1) * 864e5)); fim = iso(ref); }
        popClose(m); dash.setParams({ dt_ini: ini, dt_fim: fim });
      });
      comp.addEventListener('change', () => { if (!comp.value) return; const s = A.dt(comp.value + '-01'); popClose(m); dash.setParams({ dt_ini: iso(s), dt_fim: iso(new Date(d3.utcMonth.offset(s, 1) - 864e5)) }); });
      ap.addEventListener('click', () => { const a = d1.value && d1.validity.valid ? d1.value : ''; const b = d2.value && d2.validity.valid ? d2.value : ''; if (a && b && a > b) return; popClose(m); dash.setParams({ dt_ini: a, dt_fim: b }); });
      m.outside = (e) => { if (m.st.open && !el.contains(e.target) && !pop.contains(e.target)) popClose(m); };
      m.reposition = () => popPosition(m);
      document.addEventListener('pointerdown', m.outside);
      document.addEventListener('scroll', m.reposition, true); window.addEventListener('resize', m.reposition);
      return m;
    },
    update(el, m) {
      const all = A.base(); const P = A.P();
      if (!all) { m.val.textContent = '—'; return; }
      const min = d3.min(all, (r) => r.data_solicitacao), max = A.ref(all);
      m.d1.min = min; m.d1.max = max; m.d2.min = min; m.d2.max = max;
      m.d1.value = P.dt_ini; m.d2.value = P.dt_fim;
      const months = [...new Set(all.map((r) => r.data_solicitacao.slice(0, 7)))].sort().reverse();
      const mm = (k) => { const [y, mo] = k.split('-'); return A.MES[Number(mo) - 1] + '/' + y; };
      m.comp.replaceChildren(new Option('Escolha um mês…', ''), ...months.map((k) => new Option(mm(k), k)));
      const isMonth = P.dt_ini && P.dt_ini.endsWith('-01') && P.dt_fim && P.dt_fim.slice(0, 7) === P.dt_ini.slice(0, 7);
      m.comp.value = isMonth ? P.dt_ini.slice(0, 7) : '';
      m.pres.querySelectorAll('.ao-pre').forEach((b) => b.classList.toggle('ao-on', b.dataset.pre === 'tudo' && !P.dt_ini && !P.dt_fim));
      const set = P.dt_ini || P.dt_fim;
      m.val.textContent = set ? A.dmyS(P.dt_ini || min) + ' – ' + A.dmyS(P.dt_fim || max) : 'Todo o período'; m.btn.title = A.dmyS(P.dt_ini || min) + ' a ' + A.dmyS(P.dt_fim || max);
      m.val.classList.toggle('ao-set', !!set);
    },
    unmount(el, m) { if (m && m.outside) { popClose(m); document.removeEventListener('pointerdown', m.outside); document.removeEventListener('scroll', m.reposition, true); window.removeEventListener('resize', m.reposition); } }
  });

  dash.draw('f_count', (el) => { const P = A.P(); const n = A.FKEYS.filter(([k, , lvl]) => P[k] && !(lvl <= A.LEVEL[P.perfil])).length; el.textContent = String(n); el.classList.toggle('ao-zero', n === 0); });

  dash.draw('f_ativos', (el) => {
    const P = A.P(); const all = A.base() || [];
    el.replaceChildren();
    const chip = (label, value, onClear) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ao-chip'; const t = document.createElement('span'); t.textContent = label + ': '; const v = document.createElement('b'); v.textContent = value; const x = document.createElement('i'); x.textContent = '×'; b.append(t, v, x); b.title = 'Remover filtro'; b.addEventListener('click', onClear); el.appendChild(b); };
    if (P.dt_ini || P.dt_fim) chip('Período', A.dmyS(P.dt_ini || (all.length ? d3.min(all, (r) => r.data_solicitacao) : '')) + ' a ' + A.dmyS(P.dt_fim || (all.length ? A.ref(all) : '')), () => dash.setParams({ dt_ini: '', dt_fim: '' }));
    A.FKEYS.forEach(([k, col, lvl, lab]) => { if (!P[k] || lvl <= A.LEVEL[P.perfil]) return; const vals = k === 'cbo' ? P[k].split('|').filter(Boolean) : [P[k]]; const txt = k === 'cbo' && vals.length > 1 ? vals.length + ' profissionais' : A.label(k, vals[0], all.find((x) => x[col] === vals[0])); chip(lab, txt, () => A.setFilter(k, '')); });
    if (!el.children.length) { const s = document.createElement('span'); s.className = 'ao-chip-none'; s.textContent = 'Nenhum filtro aplicado.'; el.appendChild(s); }
  });

  dash.draw('upd', (el) => { const all = A.base(); if (!all) return A.dash(el); el.textContent = A.dmyS(A.ref(all)); });
})();
