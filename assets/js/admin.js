
(async function () {
  var $ = BOOM.$, db = BOOM.db;
  document.querySelectorAll('[data-sair]').forEach(function (b) { b.addEventListener('click', function () { BOOM.sair('admin/'); }); });
  document.querySelectorAll('[data-provedor]').forEach(function (b) { b.addEventListener('click', function () { BOOM.login(b.dataset.provedor, 'admin/'); }); });

  var C = CAMP, camps = [], editando = null;

  function aba(nome) {
    document.querySelectorAll('[data-aba]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.aba === nome ? 'true' : 'false'); });
    document.querySelectorAll('[data-painel]').forEach(function (p) { p.hidden = p.dataset.painel !== nome; });
    if (nome === 'inscricoes') carregarInscricoes();
  }
  document.querySelectorAll('[data-aba]').forEach(function (b) { b.addEventListener('click', function () { aba(b.dataset.aba); }); });

  async function abrirPainel() {
    BOOM.mostrar('painel');
    carregarLoja(); carregarMarcas(); await carregarCamps();
  }

  // ================= DADOS DA LOJA
  async function carregarLoja() {
    var c = (await db.from('loja_config').select('*').eq('id', 1).maybeSingle()).data || {};
    $('l-zap').value = c.whatsapp || ''; $('l-insta').value = c.instagram || ''; $('l-discord').value = c.discord || '';
    $('l-maps').value = c.maps_url || ''; $('l-end').value = c.endereco || ''; $('l-ref').value = c.referencia || '';
    $('l-marcas').checked = c.mostrar_marcas !== false;
    $('l-pt').value = c.pix_tipo || 'cnpj'; $('l-pc').value = c.pix_chave || ''; $('l-pn').value = c.pix_nome || '';
    $('l-pci').value = c.pix_cidade || 'Fortaleza'; $('l-rm').value = c.reserva_minutos || 30;
  }
  $('form-loja').addEventListener('submit', async function (e) {
    e.preventDefault();
    var dados = { whatsapp: $('l-zap').value.replace(/\D/g, '') || null, instagram: $('l-insta').value.replace(/^@/, '').trim() || null,
      discord: $('l-discord').value.trim() || null, maps_url: $('l-maps').value.trim() || null, endereco: $('l-end').value.trim() || null,
      referencia: $('l-ref').value.trim() || null, mostrar_marcas: $('l-marcas').checked,
      pix_tipo: $('l-pt').value, pix_chave: $('l-pc').value.trim() || null, pix_nome: $('l-pn').value.trim() || null,
      pix_cidade: $('l-pci').value.trim() || null, reserva_minutos: Math.max(5, parseInt($('l-rm').value, 10) || 30) };
    var u = await db.from('loja_config').update(dados).eq('id', 1).select();
    var m = $('msg-loja');
    if (u.error || !u.data || !u.data.length) { m.className = 'erro'; m.textContent = 'Não foi possível salvar' + (u.error ? ': ' + u.error.message : '.'); return; }
    m.className = 'ok'; m.textContent = '✓ Salvo. O site já usa os dados novos.';
  });

  // ================= CAMPEONATOS
  async function carregarCamps() {
    camps = (await db.from('campeonatos').select('*').order('criado_em', { ascending: false })).data || [];
    var vag = {};
    await Promise.all(camps.map(async function (c) { vag[c.id] = (await db.rpc('vagas_ocupadas', { camp: c.id })).data || 0; }));
    $('lista-camp').innerHTML = camps.length ? '<table class="tabela"><thead><tr><th>CAMPEONATO</th><th>DATA</th><th>VAGAS</th><th>SITUAÇÃO</th><th><span class="sr">Ações</span></th></tr></thead><tbody>' +
      camps.map(function (c) { return '<tr><td><b>' + C.esc(c.nome) + '</b>' + (c.edicao ? '<br><small class="ajuda">' + C.esc(c.edicao) + '</small>' : '') + '</td><td>' + C.data(c.data_evento) + '</td><td>' + vag[c.id] + ' / ' + c.vagas + '</td><td>' + C.selo(C.STATUS, c.status) + '</td>' +
        '<td style="white-space:nowrap;text-align:right"><button type="button" class="btn sec" style="min-height:38px" data-editar="' + c.id + '">Editar</button> <button type="button" class="btn sec" style="min-height:38px" data-insc="' + c.id + '">Inscrições</button> ' +
        (c.status !== 'rascunho' ? '<a class="btn sec" style="min-height:38px" href="../campeonatos/ver/?c=' + encodeURIComponent(c.slug) + '" target="_blank">Ver ↗</a>' : '') + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<div class="vazio">Nenhum campeonato ainda. Clique em "+ Novo campeonato".</div>';
    $('lista-camp').querySelectorAll('[data-editar]').forEach(function (b) { b.onclick = function () { abrirForm(camps.filter(function (c) { return c.id == b.dataset.editar; })[0]); }; });
    $('lista-camp').querySelectorAll('[data-insc]').forEach(function (b) { b.onclick = function () { $('insc-camp').dataset.sel = b.dataset.insc; aba('inscricoes'); }; });
  }
  function local(dt) { if (!dt) return ''; var d = new Date(dt); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function prevNome() { $('c-nome-prev').textContent = 'Copa Boom ' + ($('c-jogo').value.trim() || '…') + ($('c-edicao').value.trim() ? ' · ' + $('c-edicao').value.trim() : ''); }
  $('c-jogo').addEventListener('input', prevNome); $('c-edicao').addEventListener('input', prevNome);
  function abrirForm(c) {
    editando = c || null; c = c || {};
    $('form-camp-t').textContent = editando ? 'Editar ' + editando.nome : 'Novo campeonato';
    $('c-jogo').value = c.jogo || ''; $('c-edicao').value = c.edicao || ''; $('c-plat').value = c.plataforma || 'PC'; $('c-mod').value = c.modalidade || 'Equipes 5v5';
    $('c-formato').value = c.formato || 'grupos_mata'; $('c-elenco').value = c.tamanho_elenco || 5; $('c-res').value = c.max_reservas != null ? c.max_reservas : 1;
    $('c-vagas').value = c.vagas || 16; $('c-valor').value = c.valor_inscricao != null ? c.valor_inscricao : 0; $('c-data').value = c.data_evento || '';
    $('c-ini').value = local(c.inscricoes_inicio); $('c-fim').value = local(c.inscricoes_fim);
    $('c-p1').value = c.premio_1 || ''; $('c-p2').value = c.premio_2 || ''; $('c-p3').value = c.premio_3 || ''; $('c-reg').value = c.regulamento || '';
    $('c-tp').value = c.transmissao_plataforma || ''; $('c-tu').value = c.transmissao_url || ''; $('c-status').value = c.status || 'rascunho'; $('c-capa').value = '';
    $('msg-camp').hidden = true; $('ok-camp').textContent = ''; prevNome();
    $('form-camp').hidden = false; $('form-camp').scrollIntoView({ behavior: 'smooth' });
  }
  $('novo-camp').onclick = function () { abrirForm(null); };
  $('fechar-camp').onclick = function () { $('form-camp').hidden = true; };
  $('form-camp').addEventListener('submit', async function (e) {
    e.preventDefault();
    var m = $('msg-camp'); m.hidden = true;
    function falha(t) { m.textContent = t; m.hidden = false; }
    var jogo = $('c-jogo').value.trim(); if (!jogo) return falha('Informe o jogo.');
    var dados = { jogo: jogo, edicao: $('c-edicao').value.trim() || null, plataforma: $('c-plat').value, modalidade: $('c-mod').value, formato: $('c-formato').value,
      tamanho_elenco: Math.max(1, parseInt($('c-elenco').value, 10) || 1), max_reservas: Math.max(0, parseInt($('c-res').value, 10) || 0),
      vagas: Math.max(2, parseInt($('c-vagas').value, 10) || 2), valor_inscricao: Math.max(0, parseFloat($('c-valor').value) || 0),
      data_evento: $('c-data').value || null, inscricoes_inicio: $('c-ini').value ? new Date($('c-ini').value).toISOString() : null,
      inscricoes_fim: $('c-fim').value ? new Date($('c-fim').value).toISOString() : null,
      premio_1: $('c-p1').value.trim() || null, premio_2: $('c-p2').value.trim() || null, premio_3: $('c-p3').value.trim() || null,
      regulamento: $('c-reg').value.trim() || null, transmissao_plataforma: $('c-tp').value || null, transmissao_url: $('c-tu').value.trim() || null, status: $('c-status').value };
    var f = $('c-capa').files[0];
    if (f) {
      if (f.size > 3 * 1024 * 1024) return falha('A arte precisa ter menos de 3 MB.');
      var cam = 'capas/' + Date.now() + '-' + f.name.replace(/[^\w.\-]/g, '_');
      var up = await db.storage.from('imagens').upload(cam, f, { contentType: f.type });
      if (up.error) return falha('Erro ao enviar a arte: ' + up.error.message);
      dados.capa_url = db.storage.from('imagens').getPublicUrl(cam).data.publicUrl;
    }
    var r;
    if (editando) r = await db.from('campeonatos').update(dados).eq('id', editando.id).select().single();
    else { dados.slug = C.slug('copa-boom-' + jogo + (dados.edicao ? '-' + dados.edicao : '')) + '-' + Date.now().toString(36).slice(-4); r = await db.from('campeonatos').insert(dados).select().single(); }
    if (r.error) return falha('Não foi possível salvar: ' + r.error.message);
    editando = r.data; $('ok-camp').textContent = '✓ Salvo.' + (r.data.status === 'rascunho' ? ' Está como rascunho: não aparece no site.' : ' Já aparece no site.');
    $('form-camp-t').textContent = 'Editar ' + r.data.nome;
    carregarCamps();
  });

  // ================= INSCRIÇÕES
  async function carregarInscricoes() {
    var sel = $('insc-camp');
    var atual = sel.dataset.sel || sel.value || (camps[0] && camps[0].id);
    sel.innerHTML = camps.map(function (c) { return '<option value="' + c.id + '"' + (String(c.id) === String(atual) ? ' selected' : '') + '>' + C.esc(c.nome + (c.edicao ? ' · ' + c.edicao : '')) + '</option>'; }).join('');
    sel.dataset.sel = '';
    sel.onchange = carregarInscricoes;
    var cid = sel.value; var alvo = $('lista-insc');
    if (!cid) { alvo.innerHTML = '<div class="vazio">Crie um campeonato primeiro.</div>'; return; }
    alvo.innerHTML = '<div class="carregando">Carregando…</div>';
    var ins = (await db.from('inscricoes').select('*').eq('campeonato_id', cid).order('criado_em')).data || [];
    if (!ins.length) { alvo.innerHTML = '<div class="vazio">Nenhuma inscrição neste campeonato ainda.</div>'; return; }
    var eids = ins.map(function (i) { return i.equipe_id; });
    var eqs = (await db.from('equipes').select('*').in('id', eids)).data || [];
    var mem = (await db.from('equipe_membros').select('*').in('equipe_id', eids)).data || [];
    var pids = mem.map(function (m) { return m.jogador_id; });
    var pers = pids.length ? ((await db.from('perfis').select('id, nick, nome, whatsapp').in('id', pids)).data || []) : [];
    var pags = (await db.from('pagamentos').select('*').in('inscricao_id', ins.map(function (i) { return i.id; })).order('enviado_em', { ascending: false })).data || [];
    var E = {}, P = {}; eqs.forEach(function (e) { E[e.id] = e; }); pers.forEach(function (p) { P[p.id] = p; });
    alvo.innerHTML = ins.map(function (i) {
      var e = E[i.equipe_id] || {}, cap = P[e.capitao_id] || {}, st = C.statusInsc(i);
      var pg = pags.filter(function (p) { return p.inscricao_id === i.id; })[0];
      var jog = mem.filter(function (m) { return m.equipe_id === i.equipe_id && m.status === 'aceito'; }).map(function (m) { return '<span class="selo lin">@' + C.esc((P[m.jogador_id] || {}).nick || '?') + (m.papel === 'reserva' ? ' · reserva' : '') + '</span>'; }).join(' ');
      var acoes = '';
      if (pg && pg.status === 'enviado') acoes += '<button type="button" class="btn sec" style="min-height:40px" data-ver="' + C.esc(pg.comprovante_path) + '">Ver comprovante</button><button type="button" class="btn" style="min-height:40px" data-conf="' + pg.id + '">Confirmar pagamento</button><button type="button" class="btn sec" style="min-height:40px" data-recpag="' + pg.id + '">Recusar pagamento</button>';
      else if (st === 'aguardando_pagamento' || st === 'expirada') acoes += '<button type="button" class="btn" style="min-height:40px" data-pago="' + i.id + '">Marcar como pago</button>';
      if (st === 'lista_espera') acoes += '<button type="button" class="btn" style="min-height:40px" data-liberar="' + i.id + '">Liberar vaga (24h para pagar)</button>';
      if (st !== 'recusada') acoes += '<button type="button" class="btn sec" style="min-height:40px" data-recins="' + i.id + '">Recusar inscrição</button>';
      var zap = cap.whatsapp ? 'https://wa.me/' + (cap.whatsapp.replace(/\D/g, '').length <= 11 ? '55' : '') + cap.whatsapp.replace(/\D/g, '') : null;
      return '<article class="cartao cut" style="gap:12px"><div class="linha entre"><div class="linha"><span class="membro" style="padding:0;border:0;background:none"><span class="av on">' + C.esc(e.sigla || '?') + '</span></span><div class="pilha" style="gap:2px"><b class="titulo" style="font-size:20px">' + C.esc(e.nome || '') + '</b><small class="ajuda">Código ' + C.esc(i.codigo) + ' · ' + C.dataHora(i.criado_em) + '</small></div></div>' + C.selo(C.INSC, st) + '</div>' +
        '<div class="ajuda">Capitão: <b style="color:#fff">' + C.esc(cap.nome || '') + '</b> (@' + C.esc(cap.nick || '') + ')' + (zap ? ' · <a href="' + zap + '" target="_blank" rel="noopener">WhatsApp ' + C.esc(cap.whatsapp) + '</a>' : '') + '</div>' +
        '<div class="linha" style="gap:6px">' + jog + '</div>' + (i.motivo ? '<div class="aviso">Motivo: ' + C.esc(i.motivo) + '</div>' : '') +
        '<div class="linha" style="gap:8px;justify-content:flex-end">' + acoes + '</div></article>';
    }).join('');
    function feito(r) { if (r && r.error) alert(r.error.message); carregarInscricoes(); }
    alvo.querySelectorAll('[data-ver]').forEach(function (b) { b.onclick = async function () { var u = await db.storage.from('comprovantes').createSignedUrl(b.dataset.ver, 300); if (u.error) return alert(u.error.message); window.open(u.data.signedUrl, '_blank'); }; });
    alvo.querySelectorAll('[data-conf]').forEach(function (b) { b.onclick = async function () { if (!confirm('Confirmar o pagamento e a vaga desta equipe?')) return; feito(await db.from('pagamentos').update({ status: 'confirmado' }).eq('id', b.dataset.conf)); }; });
    alvo.querySelectorAll('[data-recpag]').forEach(function (b) { b.onclick = async function () { var mo = prompt('Motivo (a equipe vai ver):', 'Não encontramos o pagamento com esse valor.'); if (mo === null) return; feito(await db.from('pagamentos').update({ status: 'recusado', motivo: mo }).eq('id', b.dataset.recpag)); }; });
    alvo.querySelectorAll('[data-pago]').forEach(function (b) { b.onclick = async function () { if (!confirm('Registrar que esta equipe pagou (na loja ou por fora) e confirmar a vaga?')) return; feito(await db.from('inscricoes').update({ status: 'confirmada', motivo: null }).eq('id', b.dataset.pago)); }; });
    alvo.querySelectorAll('[data-liberar]').forEach(function (b) { b.onclick = async function () { feito(await db.from('inscricoes').update({ status: 'aguardando_pagamento', reservado_ate: new Date(Date.now() + 864e5).toISOString() }).eq('id', b.dataset.liberar)); }; });
    alvo.querySelectorAll('[data-recins]').forEach(function (b) { b.onclick = async function () { var mo = prompt('Motivo da recusa (a equipe vai ver):'); if (mo === null) return; feito(await db.from('inscricoes').update({ status: 'recusada', motivo: mo || null }).eq('id', b.dataset.recins)); }; });
  }

  var marcas = [];
  async function carregarMarcas() {
    var r = await db.from('marcas').select('*').order('ordem');
    marcas = r.data || []; desenharMarcas();
  }
  function aviso(t, erro) { var m = $('msg-marcas'); m.className = erro ? 'erro' : 'ok'; m.textContent = t; }
  function desenharMarcas() {
    var ul = $('marcas'); ul.innerHTML = '';
    marcas.forEach(function (m, i) {
      var li = document.createElement('li');
      var pos = document.createElement('span'); pos.textContent = i + 1; pos.style.cssText = "font-family:'Chakra Petch',sans-serif;color:#A6A6AE;text-align:center";
      var slot = document.createElement('label'); slot.className = 'logo-slot'; slot.title = 'Enviar logo';
      if (m.logo_url) { var img = document.createElement('img'); img.src = m.logo_url; img.alt = ''; slot.appendChild(img); } else slot.textContent = 'ENVIAR LOGO';
      var file = document.createElement('input'); file.type = 'file'; file.accept = 'image/png,image/svg+xml,image/webp'; file.className = 'sr';
      file.id = 'logo-' + m.id; slot.htmlFor = file.id;
      file.addEventListener('change', async function () {
        var f = file.files[0]; if (!f) return;
        if (f.size > 1024 * 1024) return aviso('O logo precisa ter menos de 1 MB.', true);
        var caminho = 'marcas/' + Date.now() + '-' + f.name.replace(/[^\w.\-]/g, '_');
        var up = await db.storage.from('imagens').upload(caminho, f, { upsert: false, contentType: f.type });
        if (up.error) return aviso('Erro ao enviar o logo: ' + up.error.message, true);
        var pub = db.storage.from('imagens').getPublicUrl(caminho).data.publicUrl;
        var u = await db.from('marcas').update({ logo_url: pub }).eq('id', m.id);
        if (u.error) return aviso('Erro ao salvar o logo: ' + u.error.message, true);
        m.logo_url = pub; desenharMarcas(); aviso('✓ Logo de ' + m.nome + ' atualizado.');
      });
      var nome = document.createElement('input'); nome.type = 'text'; nome.value = m.nome; nome.setAttribute('aria-label', 'Nome da marca ' + (i + 1));
      nome.addEventListener('change', async function () {
        var v = nome.value.trim(); if (!v) { nome.value = m.nome; return; }
        var u = await db.from('marcas').update({ nome: v }).eq('id', m.id);
        if (u.error) return aviso('Erro: ' + u.error.message, true); m.nome = v; aviso('✓ Nome salvo.');
      });
      var acoes = document.createElement('div'); acoes.className = 'linha acoes'; acoes.style.gap = '4px';
      function bt(txt, rotulo, fn, off) { var b = document.createElement('button'); b.type = 'button'; b.className = 'mini'; b.textContent = txt; b.setAttribute('aria-label', rotulo); b.disabled = !!off; b.addEventListener('click', fn); acoes.appendChild(b); }
      bt('↑', 'Subir ' + m.nome, function () { trocar(i, i - 1); }, i === 0);
      bt('↓', 'Descer ' + m.nome, function () { trocar(i, i + 1); }, i === marcas.length - 1);
      bt('✕', 'Remover ' + m.nome, async function () {
        if (!confirm('Remover ' + m.nome + ' das marcas parceiras?')) return;
        var d = await db.from('marcas').delete().eq('id', m.id);
        if (d.error) return aviso('Erro: ' + d.error.message, true); marcas.splice(i, 1); desenharMarcas(); aviso('✓ Marca removida.');
      });
      li.append(pos, slot, file, nome, acoes); ul.appendChild(li);
    });
  }
  async function trocar(a, b) {
    var t = marcas[a]; marcas[a] = marcas[b]; marcas[b] = t;
    desenharMarcas();
    var r = await Promise.all(marcas.map(function (m, i) { return db.from('marcas').update({ ordem: i + 1 }).eq('id', m.id); }));
    if (r.some(function (x) { return x.error; })) aviso('Erro ao salvar a ordem.', true); else aviso('✓ Ordem salva.');
  }
  $('add-marca').addEventListener('click', async function () {
    var nome = prompt('Nome da nova marca:'); if (!nome || !nome.trim()) return;
    var r = await db.from('marcas').insert({ nome: nome.trim(), ordem: marcas.length + 1 }).select().single();
    if (r.error) return aviso('Erro: ' + r.error.message, true);
    marcas.push(r.data); desenharMarcas(); aviso('✓ ' + r.data.nome + ' adicionada. Agora envie o logo.');
  });

  // ================= ACESSO (login + verificação em duas etapas)
  var s = await BOOM.sessao();
  if (!s) { BOOM.mostrar('login'); return; }
  var p = await db.from('perfis').select('papel, bloqueado').eq('id', s.user.id).maybeSingle();
  if (!p.data || p.data.papel !== 'admin' || p.data.bloqueado) { $('negado-email').textContent = 'Conta usada: ' + (s.user.email || ''); BOOM.mostrar('negado'); return; }

  var aal = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data && aal.data.currentLevel === 'aal2') return abrirPainel();
  var fs = await db.auth.mfa.listFactors();
  var totp = (fs.data && fs.data.totp || []).filter(function (f) { return f.status === 'verified'; })[0];
  if (totp) {
    BOOM.mostrar('mfa');
    $('verificar').addEventListener('click', async function () {
      var r = await db.auth.mfa.challengeAndVerify({ factorId: totp.id, code: $('cod').value.trim() });
      if (r.error) { $('msg-mfa').textContent = 'Código inválido ou expirado. Tente o código atual do aplicativo.'; $('msg-mfa').hidden = false; return; }
      abrirPainel();
    });
    $('cod').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('verificar').click(); });
  } else {
    var pend = (fs.data && fs.data.all || []).filter(function (f) { return f.factor_type === 'totp' && f.status !== 'verified'; });
    for (var i = 0; i < pend.length; i++) await db.auth.mfa.unenroll({ factorId: pend[i].id });
    var en = await db.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Painel Boom Games' });
    if (en.error) { alert('Não foi possível iniciar a verificação: ' + en.error.message); return; }
    $('qr').src = en.data.totp.qr_code; $('segredo').textContent = en.data.totp.secret;
    BOOM.mostrar('mfa-novo');
    $('ativar').addEventListener('click', async function () {
      var r = await db.auth.mfa.challengeAndVerify({ factorId: en.data.id, code: $('cod-novo').value.trim() });
      if (r.error) { $('msg-novo').textContent = 'Código inválido. Confira se o relógio do celular está certo e use o código atual.'; $('msg-novo').hidden = false; return; }
      abrirPainel();
    });
  }


})();
