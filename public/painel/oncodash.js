/*
 * OncoDash: liga o painel (o mesmo do protótipo v2) à API.
 *  - confere a sessão (sem sessão → /login);
 *  - mostra o usuário, os links de administração do perfil e "Sair";
 *  - carrega as solicitações do APAC Onco já no recorte do usuário
 *    (GET /api/painel/solicitacoes) e o mapa das UFs;
 *  - fixa o perfil/escopo do painel pelo login (não há mais seletor de perfil);
 *  - registra as exportações na auditoria.
 */
(function () {
  const FP_KEY = 'oncodash_device_id';
  const NAO_INFORMADO = 'Não informado';
  // Colunas de categoria que o protótipo sempre tinha preenchidas: vazio vira "Não informado".
  const CATEGORIAS = ['regiao', 'uf', 'macro_saude', 'regiao_saude', 'mun_servico', 'tipo_servico', 'mun_residencia', 'uf_residencia',
    'regiao_saude_residencia', 'medicamento', 'cid', 'morfologia', 'sistema_estadiamento', 'estadio_clinico', 'her2', 'recidiva',
    'linha_tratamento', 'finalidade', 'codigo_apac', 'cbo_prescritor', 'sexo', 'faixa_etaria'];

  function fingerprint() {
    let id = null;
    try { id = localStorage.getItem(FP_KEY); } catch (e) { id = null; }
    if (id) return id;
    const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    try { localStorage.setItem(FP_KEY, id); } catch (e) { /* modo privado */ }
    return id;
  }

  function irParaLogin() {
    const volta = '/' + (location.hash || '');
    location.replace('/login' + (volta !== '/' ? '?next=' + encodeURIComponent(volta) : ''));
  }

  async function api(path, init) {
    const opts = init || {};
    const headers = { 'X-Device-Fingerprint': fingerprint() };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch('/api' + path, {
      method: opts.method || 'GET', headers, credentials: 'same-origin', cache: 'no-store',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 401) { irParaLogin(); throw new Error('Sessão encerrada.'); }
    if (res.status === 204) return null;
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error((body && body.message) || 'Não foi possível carregar os dados.');
    return body;
  }

  const abaAtual = () => {
    const t = document.querySelector('.ao-tab[aria-selected="true"]');
    return t ? t.textContent.trim() : 'Painel';
  };

  window.ODash = {
    registrarExportacao(arquivo, ext) {
      const formato = ['csv', 'xlsx', 'pdf', 'png', 'svg'].includes(ext) ? ext : 'csv';
      api('/audit/exports', { method: 'POST', body: { pagina: 'Painel · ' + abaAtual(), arquivo: String(arquivo).slice(0, 200), formato } })
        .catch(() => { /* a exportação já aconteceu; só não ficou registrada */ });
    },
  };

  const iniciais = (nome) => {
    const p = String(nome || '').trim().split(/\s+/).filter(Boolean);
    return ((p[0] ? p[0][0] : '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  };

  function preencherUsuario(me) {
    const user = document.getElementById('od-user');
    if (user) { user.textContent = me.nome; const s = document.createElement('span'); s.textContent = me.profile || 'Sem perfil'; user.appendChild(s); }
    const av = document.getElementById('od-avatar'); if (av) av.textContent = iniciais(me.nome);
    const links = document.getElementById('od-links');
    if (links) {
      const admin = me.profile === 'Desenvolvedor' || me.profile === 'Gestor federal';
      const itens = [];
      if (me.profile && me.profile !== 'Unidade') itens.push(['/admin/usuarios', 'Usuários']);
      if (admin) itens.push(['/admin/auditoria', 'Auditoria'], ['/admin/atualizacao', 'Atualização']);
      links.replaceChildren(...itens.map(([href, txt]) => { const a = document.createElement('a'); a.href = href; a.textContent = txt; a.setAttribute('role', 'menuitem'); return a; }));
    }
    const btn = document.getElementById('od-user-btn');
    const menu = document.getElementById('od-menu');
    if (btn && menu) {
      const abrir = (on) => { menu.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false'); };
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); abrir(menu.hidden); });
      document.addEventListener('click', (ev) => { if (!menu.hidden && !menu.contains(ev.target)) abrir(false); });
      document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') abrir(false); });
    }
    const sair = document.getElementById('od-sair');
    if (sair) sair.addEventListener('click', async () => {
      try { await api('/auth/logout', { method: 'POST' }); } catch (e) { /* segue para o login */ }
      location.replace('/login');
    });
  }

  function fonte(texto, tipo) {
    const el = document.getElementById('od-fonte'); if (!el) return;
    el.textContent = '● ' + texto;
    el.classList.toggle('od-ok', tipo === 'ok');
    el.classList.toggle('od-erro', tipo === 'erro');
  }

  const dataHora = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  async function carregarDados() {
    try {
      const d = await api('/painel/solicitacoes');
      const cid = window.AO && window.AO.CID;
      const linhas = d.linhas.map((l) => {
        const o = {};
        d.colunas.forEach((c, i) => { o[c] = l[i] === undefined ? null : l[i]; });
        CATEGORIAS.forEach((c) => { if (o[c] === null || o[c] === '') o[c] = NAO_INFORMADO; });
        if (cid && o.cid && o.cid_nome && !cid[o.cid]) cid[o.cid] = o.cid_nome;
        return o;
      });
      // Perfil e escopo vêm do login; os dados já chegam no recorte (a API filtra).
      const perfil = d.perfil && d.perfil.painel !== 'nenhum' ? d.perfil.painel : 'local';
      dash.setParams({ perfil, escopo: (d.perfil && d.perfil.escopo) || '' });
      dash.setSource('solicitacoes', { status: 'ok', data: linhas });

      if (!d.atualizadoEm) fonte('Dados do APAC Onco ainda não sincronizados', 'erro');
      else if (!linhas.length) fonte('Nenhuma solicitação no seu recorte · atualizado em ' + dataHora(d.atualizadoEm), 'ok');
      else fonte('Dados do APAC Onco · atualizados em ' + dataHora(d.atualizadoEm), 'ok');
    } catch (e) {
      dash.setSource('solicitacoes', { status: 'error', data: [] });
      fonte(e.message || 'Não foi possível carregar os dados.', 'erro');
    }
  }

  function carregarMapa() {
    fetch('/painel/malha-uf.json', { cache: 'force-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((geo) => dash.setSource('malha_uf', { status: 'ok', data: geo }))
      .catch(() => dash.setSource('malha_uf', { status: 'error', data: null }));
  }

  (async function iniciar() {
    let me;
    try { me = await api('/auth/me'); } catch (e) { return; }
    preencherUsuario(me);
    carregarMapa();
    await carregarDados();
  })();
})();
