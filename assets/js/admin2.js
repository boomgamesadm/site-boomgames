// Painel · Chaveamento, Partidas, Artes, Histórico e uso
window.ADMIN2 = (function () {
  'use strict';
  var db = BOOM.db, C = CAMP, $ = BOOM.$;
  var camps = [];
  async function lerCamps() { camps = (await db.from('campeonatos').select('*').order('criado_em', { ascending: false })).data || []; return camps; }
  function opcoes(sel, filtro) {
    var atual = sel.value, l = camps.filter(filtro || function () { return true; });
    sel.innerHTML = l.length ? l.map(function (c) { return '<option value="' + c.id + '"' + (String(c.id) === atual ? ' selected' : '') + '>' + C.esc(c.nome + (c.edicao ? ' · ' + c.edicao : '')) + '</option>'; }).join('') : '<option value="">Nenhum campeonato</option>';
    return camps.filter(function (c) { return String(c.id) === sel.value; })[0];
  }
  function embaralhar(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pot2(n) { var p = 2; while (p < n) p *= 2; return p; }
  var FASE_POR_QTD = { 1: 'final', 2: 'semifinal', 4: 'quartas', 8: 'oitavas', 16: '16avos' };
  var COD = { final: 'FINAL', semifinal: 'SF', quartas: 'QF', oitavas: 'OF', '16avos': 'R32-' };
  var LETRAS = 'ABCDEFGHIJKLMNOP';
  async function ins(obj) { var r = await db.from('partidas').insert(obj).select('id').single(); if (r.error) throw r.error; return r.data.id; }
  // distribui itens em vagas (com folgas espalhadas pelo chaveamento)
  function vagas(itens) {
    var n = itens.length, size = pot2(n), m = size / 2, byes = size - n, idx = {}, k, out = [], p = 0;
    for (k = 0; k < byes; k++) idx[Math.floor(k * m / byes)] = true;
    for (var j = 0; j < m; j++) { if (idx[j]) out.push(itens[p++], null); else out.push(itens[p++], itens[p++]); }
    return out;
  }
  async function mataMata(c, slots, ordem) {
    var size = slots.length, rodadas = [], m, idsR = {}, terceiro = null;
    for (m = 1; m <= size / 2; m *= 2) rodadas.push(m);
    for (var r = 0; r < rodadas.length; r++) {
      m = rodadas[r]; var fase = FASE_POR_QTD[m] || ('r' + m * 2); idsR[m] = [];
      for (var j = 0; j < m; j++) {
        var o = { campeonato_id: c.id, fase: fase, codigo: m === 1 ? 'FINAL' : (COD[fase] || 'J') + (j + 1), ordem: ordem++, serie: m === 1 ? (c.serie_final || null) : (c.serie_mata || null), status: 'agendada' };
        if (m > 1) { o.proxima_partida_id = idsR[m / 2][Math.floor(j / 2)]; o.proxima_vaga = j % 2 === 0 ? 'a' : 'b'; }
        if (m === 2 && terceiro) { o.perdedor_partida_id = terceiro; o.perdedor_vaga = j % 2 === 0 ? 'a' : 'b'; }
        if (m === size / 2) {
          var a = slots[2 * j], b = slots[2 * j + 1];
          if (a) { if (a.eq) o.equipe_a = a.eq; if (a.rot) o.rotulo_a = a.rot; }
          if (b) { if (b.eq) o.equipe_b = b.eq; if (b.rot) o.rotulo_b = b.rot; } else if (a) o.rotulo_b = 'Folga';
        }
        idsR[m].push(await ins(o));
      }
      if (m === 1 && c.disputa_terceiro && size >= 4) terceiro = await ins({ campeonato_id: c.id, fase: 'terceiro', codigo: '3º', ordem: ordem++, serie: c.serie_mata || null, status: 'agendada' });
    }
    return ordem;
  }
  function rodadasRR(lst) {
    var a = lst.slice(); if (a.length % 2) a.push(null);
    var n = a.length, out = [];
    for (var k = 0; k < n - 1; k++) { for (var i = 0; i < n / 2; i++) { var x = a[i], y = a[n - 1 - i]; if (x && y) out.push([x, y, k + 1]); } a.splice(1, 0, a.pop()); }
    return out;
  }
  async function publicarFolgas(cid) {
    var ps = (await db.from('partidas').select('*').eq('campeonato_id', cid).neq('fase', 'grupos').neq('status', 'publicada')).data || [];
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if ((p.equipe_a && !p.equipe_b && p.rotulo_b === 'Folga') || (p.equipe_b && !p.equipe_a && p.rotulo_a === 'Folga')) await db.from('partidas').update({ status: 'publicada' }).eq('id', p.id);
    }
  }
  async function gerar(c, eqIds, opt) {
    await db.from('partidas').delete().eq('campeonato_id', c.id);
    await db.from('grupos').delete().eq('campeonato_id', c.id);
    var t = embaralhar(eqIds), ordem = 1;
    if (c.formato === 'pontos_corridos' || c.formato === 'grupos_mata') {
      var G = c.formato === 'pontos_corridos' ? 1 : Math.max(1, Math.min(opt.grupos, Math.floor(t.length / 2)));
      var gs = [];
      for (var g = 0; g < G; g++) {
        var nome = c.formato === 'pontos_corridos' ? 'Classificação geral' : 'Grupo ' + LETRAS[g];
        var gr = await db.from('grupos').insert({ campeonato_id: c.id, nome: nome }).select().single(); if (gr.error) throw gr.error;
        gs.push({ id: gr.data.id, nome: nome, letra: LETRAS[g], eqs: [] });
      }
      t.forEach(function (e, i) { gs[i % G].eqs.push(e); });
      for (g = 0; g < G; g++) {
        var ge = await db.from('grupo_equipes').insert(gs[g].eqs.map(function (e) { return { grupo_id: gs[g].id, equipe_id: e }; })); if (ge.error) throw ge.error;
        var jogos = rodadasRR(gs[g].eqs);
        for (var k = 0; k < jogos.length; k++) await ins({ campeonato_id: c.id, grupo_id: gs[g].id, fase: 'grupos', codigo: (G > 1 ? gs[g].letra : 'R') + (k + 1), rodada: jogos[k][2], ordem: ordem++, serie: c.serie_grupos || null, equipe_a: jogos[k][0], equipe_b: jogos[k][1], status: 'agendada' });
      }
      if (c.formato === 'grupos_mata' && G >= 1) {
        var kq = Math.max(1, opt.classificados), rot = [];
        if (kq === 2 && G >= 2) { for (g = 0; g < G; g++) rot.push({ rot: '1º Grupo ' + LETRAS[g] }, { rot: '2º Grupo ' + LETRAS[(g + 1) % G] }); }
        else { var lab = []; for (var p = 1; p <= kq; p++) for (g = 0; g < G; g++) lab.push({ rot: p + 'º Grupo ' + LETRAS[g] }); var Q = lab.length; for (var i2 = 0; i2 < Q / 2; i2++) rot.push(lab[i2], lab[Q - 1 - i2]); if (Q % 2) rot.push(lab[Math.floor(Q / 2)]); }
        var sl = (rot.length & (rot.length - 1)) === 0 && rot.length >= 2 ? rot : vagas(rot);
        ordem = await mataMata(c, sl, ordem);
      }
    } else {
      ordem = await mataMata(c, vagas(t.map(function (e) { return { eq: e }; })), ordem);
      await publicarFolgas(c.id);
    }
  }
  // ================= CHAVEAMENTO
  async function chave() {
    await lerCamps();
    var sel = $('ch-camp'), c = opcoes(sel, function (x) { return x.status !== 'rascunho'; });
    sel.onchange = chave;
    var alvo = $('ch-conteudo');
    if (!c) { alvo.innerHTML = '<div class="vazio">Publique um campeonato primeiro.</div>'; return; }
    var conf = (await db.from('inscricoes').select('equipe_id').eq('campeonato_id', c.id).eq('status', 'confirmada')).data || [];
    var ids = conf.map(function (x) { return x.equipe_id; });
    var ps = (await db.from('partidas').select('*').eq('campeonato_id', c.id).order('ordem')).data || [];
    var gr = (await db.from('grupos').select('*').eq('campeonato_id', c.id).order('nome')).data || [];
    var ge = gr.length ? ((await db.from('grupo_equipes').select('*').in('grupo_id', gr.map(function (g) { return g.id; }))).data || []) : [];
    var todos = ids.slice(); ps.forEach(function (p) { [p.equipe_a, p.equipe_b].forEach(function (x) { if (x && todos.indexOf(x) < 0) todos.push(x); }); });
    var E = {}; ((todos.length ? (await db.from('equipes').select('id, nome, sigla').in('id', todos)).data : []) || []).forEach(function (e) { E[e.id] = e; });
    var h = '<div class="aviso">' + C.esc(c.nome) + ' · ' + C.esc(C.FORMATO[c.formato]) + ' · <b>' + ids.length + ' equipes confirmadas</b> · ' + C.selo(C.STATUS, c.status) + (c.chaveamento_publicado ? ' <span class="selo lar">CHAVEAMENTO PUBLICADO</span>' : '') + '</div>';
    if (c.formato === 'eliminacao_dupla') { alvo.innerHTML = h + '<div class="vazio">O sorteio automático ainda não monta eliminação dupla. Edite o campeonato para "Eliminação simples" ou "Grupos + mata-mata".</div>'; return; }
    if (!ps.length) {
      var sugG = Math.max(1, Math.round(ids.length / 4));
      h += '<section class="cartao cut"><h2>Sortear</h2><p class="sub">As equipes confirmadas serão distribuídas aleatoriamente. Você revisa antes de publicar.</p>' +
        (c.formato === 'grupos_mata' ? '<div class="grade"><div class="campo"><label for="ch-g">Número de grupos</label><input id="ch-g" type="number" min="1" value="' + (c.num_grupos || sugG) + '"></div><div class="campo"><label for="ch-k">Classificados por grupo</label><input id="ch-k" type="number" min="1" value="' + (c.classificados_por_grupo || 2) + '"></div></div>' : '') +
        '<div class="linha">' + ids.map(function (i) { return '<span class="selo lin">' + C.esc((E[i] || {}).nome || '') + '</span>'; }).join(' ') + '</div>' +
        (ids.length < 2 ? '<p class="erro">É preciso ter pelo menos 2 equipes confirmadas.</p>' : '<button type="button" class="btn" id="ch-sortear" style="align-self:flex-start">SORTEAR E MONTAR</button>') + '<p class="erro" id="ch-msg" hidden></p></section>';
      alvo.innerHTML = h;
      if ($('ch-sortear')) $('ch-sortear').onclick = async function () {
        var b = $('ch-sortear'); b.disabled = true; b.textContent = 'Montando…';
        try { await gerar(c, ids, { grupos: $('ch-g') ? parseInt($('ch-g').value, 10) || 1 : 1, classificados: $('ch-k') ? parseInt($('ch-k').value, 10) || 2 : 2 }); chave(); }
        catch (e) { $('ch-msg').textContent = 'Erro: ' + (e.message || e); $('ch-msg').hidden = false; b.disabled = false; b.textContent = 'SORTEAR E MONTAR'; }
      };
      return;
    }
    // prévia / situação
    if (gr.length) h += '<div class="grade">' + gr.map(function (g) { return '<div class="cartao cut" style="gap:6px;padding:16px"><b class="titulo">' + C.esc(g.nome) + '</b>' + ge.filter(function (x) { return x.grupo_id === g.id; }).map(function (x) { return '<span>' + C.esc((E[x.equipe_id] || {}).nome || '') + '</span>'; }).join('') + '</div>'; }).join('') + '</div>';
    var mm = ps.filter(function (p) { return p.fase !== 'grupos'; });
    if (mm.length) {
      var fases = C.ORDEM_FASE.filter(function (f) { return f !== 'grupos' && mm.some(function (p) { return p.fase === f; }); });
      h += '<div class="chave">' + fases.map(function (f) { return '<div class="col"><h3>' + C.esc((C.FASES[f] || f).toUpperCase()) + '</h3>' + mm.filter(function (p) { return p.fase === f; }).map(function (p) { return C.cartaoJogo(p, E, '../campeonatos/partida/'); }).join('') + '</div>'; }).join('') + '</div>';
    }
    var gruposAbertos = ps.filter(function (p) { return p.fase === 'grupos' && p.status !== 'publicada'; }).length;
    var precisaFechar = c.formato === 'grupos_mata' && mm.some(function (p) { return (p.rotulo_a && /Grupo/.test(p.rotulo_a) && !p.equipe_a) || (p.rotulo_b && /Grupo/.test(p.rotulo_b) && !p.equipe_b); });
    h += '<section class="cartao cut destaque"><div class="linha">' +
      (!c.chaveamento_publicado ? '<button type="button" class="btn sec" id="ch-resortear">Sortear de novo</button><button type="button" class="btn" id="ch-publicar">PUBLICAR CHAVEAMENTO</button>' : '') +
      (c.chaveamento_publicado && precisaFechar ? '<button type="button" class="btn" id="ch-fechar">Fechar fase de grupos' + (gruposAbertos ? ' (' + gruposAbertos + ' jogos sem resultado)' : '') + '</button>' : '') +
      (c.chaveamento_publicado && c.formato === 'pontos_corridos' && c.status !== 'finalizado' ? '<button type="button" class="btn" id="ch-final">Finalizar campeonato (1º colocado é o campeão)</button>' : '') +
      (c.chaveamento_publicado ? '<a class="btn sec" href="../campeonatos/ver/?c=' + encodeURIComponent(c.slug) + '#chaveamento" target="_blank">Ver no site ↗</a><button type="button" class="btn sec" id="ch-desfazer">Desfazer chaveamento</button>' : '') +
      '</div><p class="ajuda">' + (c.chaveamento_publicado ? 'Publicado: o público vê o chaveamento e os resultados em tempo real.' : 'Prévia: só administradores veem. Depois de publicar, o sorteio fica travado.') + '</p><p class="erro" id="ch-msg" hidden></p></section>';
    alvo.innerHTML = h;
    function erro(e) { $('ch-msg').textContent = 'Erro: ' + (e.message || e); $('ch-msg').hidden = false; }
    if ($('ch-resortear')) $('ch-resortear').onclick = async function () { if (!confirm('Apagar este sorteio e montar outro?')) return; try { await gerar(c, ids, { grupos: gr.length || 1, classificados: c.classificados_por_grupo || 2 }); chave(); } catch (e) { erro(e); } };
    if ($('ch-publicar')) $('ch-publicar').onclick = async function () { if (!confirm('Publicar o chaveamento? Ele fica visível para todos e o sorteio trava.')) return; var r = await db.from('campeonatos').update({ chaveamento_publicado: true, status: 'em_andamento' }).eq('id', c.id); if (r.error) return erro(r.error); chave(); };
    if ($('ch-desfazer')) $('ch-desfazer').onclick = async function () { if (!confirm('ATENÇÃO: isso apaga todas as partidas e resultados deste campeonato. Continuar?')) return; await db.from('partidas').delete().eq('campeonato_id', c.id); await db.from('grupos').delete().eq('campeonato_id', c.id); await db.from('campeonatos').update({ chaveamento_publicado: false, status: 'inscricoes_encerradas', campeao_id: null }).eq('id', c.id); chave(); };
    if ($('ch-fechar')) $('ch-fechar').onclick = async function () {
      if (gruposAbertos && !confirm('Ainda há ' + gruposAbertos + ' jogos de grupo sem resultado. Fechar mesmo assim?')) return;
      var cl = (await db.from('classificacao').select('*').eq('campeonato_id', c.id)).data || [], pos = {};
      gr.forEach(function (g) { var l = cl.filter(function (x) { return x.grupo_id === g.id; }).sort(function (a, b) { return b.pontos - a.pontos || b.saldo - a.saldo || b.pro - a.pro; }); l.forEach(function (x, i) { pos[(i + 1) + 'º ' + g.nome] = x.equipe_id; }); });
      for (var i = 0; i < mm.length; i++) { var p = mm[i], up = {}; if (p.rotulo_a && pos[p.rotulo_a] && !p.equipe_a) up.equipe_a = pos[p.rotulo_a]; if (p.rotulo_b && pos[p.rotulo_b] && !p.equipe_b) up.equipe_b = pos[p.rotulo_b]; if (Object.keys(up).length) { var r = await db.from('partidas').update(up).eq('id', p.id); if (r.error) return erro(r.error); } }
      await publicarFolgas(c.id); chave();
    };
    if ($('ch-final')) $('ch-final').onclick = async function () {
      var cl = (await db.from('classificacao').select('*').eq('campeonato_id', c.id)).data || [];
      cl.sort(function (a, b) { return b.pontos - a.pontos || b.saldo - a.saldo || b.pro - a.pro; });
      if (!cl.length) return erro('Sem classificação.');
      if (!confirm('Finalizar e declarar ' + ((E[cl[0].equipe_id] || {}).nome || '') + ' campeã?')) return;
      var r = await db.from('campeonatos').update({ status: 'finalizado', campeao_id: cl[0].equipe_id }).eq('id', c.id); if (r.error) return erro(r.error); chave();
    };
  }
  // ================= PARTIDAS
  async function partidas() {
    await lerCamps();
    var sel = $('pt-camp'), c = opcoes(sel, function (x) { return x.chaveamento_publicado || x.status === 'em_andamento'; });
    sel.onchange = partidas;
    var alvo = $('pt-conteudo');
    if (!c) { alvo.innerHTML = '<div class="vazio">Publique o chaveamento de um campeonato na aba "Chaveamento".</div>'; return; }
    var ps = (await db.from('partidas').select('*').eq('campeonato_id', c.id).order('ordem')).data || [];
    var ids = []; ps.forEach(function (p) { [p.equipe_a, p.equipe_b].forEach(function (x) { if (x && ids.indexOf(x) < 0) ids.push(x); }); });
    var eqs = ids.length ? ((await db.from('equipes').select('*').in('id', ids)).data || []) : [];
    var E = {}; eqs.forEach(function (e) { E[e.id] = e; });
    var capIds = eqs.map(function (e) { return e.capitao_id; });
    var P = {}; ((capIds.length ? (await db.from('perfis').select('id, nick, whatsapp').in('id', capIds)).data : []) || []).forEach(function (x) { P[x.id] = x; });
    var mapas = ps.length ? ((await db.from('mapas').select('*').in('partida_id', ps.map(function (p) { return p.id; })).order('numero')).data || []) : [];
    function local(dt) { if (!dt) return ''; var d = new Date(dt); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
    function zap(eqId, p) { var e = E[eqId], cap = e && P[e.capitao_id]; if (!cap || !cap.whatsapp) return ''; var n = cap.whatsapp.replace(/\D/g, ''); if (n.length <= 11) n = '55' + n;
      var adv = E[eqId === p.equipe_a ? p.equipe_b : p.equipe_a]; var msg = 'Olá, @' + cap.nick + '! Boom Games aqui. ' + c.nome + ': ' + e.nome + ' x ' + (adv ? adv.nome : 'a definir') + (p.inicio ? ' em ' + C.dataHora(p.inicio) : '') + '. Check-in 30 minutos antes na loja. Até lá!';
      return '<a class="btn sec" style="min-height:38px" target="_blank" rel="noopener" href="https://wa.me/' + n + '?text=' + encodeURIComponent(msg) + '">Avisar ' + C.esc(e.sigla) + '</a>'; }
    var fases = C.ORDEM_FASE.filter(function (f) { return ps.some(function (p) { return p.fase === f; }); });
    alvo.innerHTML = fases.map(function (f) {
      return '<h3 class="olho" style="margin-top:8px">' + C.esc((C.FASES[f] || f).toUpperCase()) + '</h3>' + ps.filter(function (p) { return p.fase === f; }).map(function (p) {
        var A = E[p.equipe_a], B = E[p.equipe_b], pronta = A && B, mp = mapas.filter(function (m) { return m.partida_id === p.id; });
        var folga = (p.equipe_a && !p.equipe_b) || (!p.equipe_a && p.equipe_b);
        return '<article class="cartao cut" style="gap:12px;padding:18px" data-p="' + p.id + '"><div class="linha entre"><b class="titulo" style="font-size:18px">' + C.esc(p.codigo || '') + ' · ' + C.esc(A ? A.nome : (p.rotulo_a || 'A definir')) + ' x ' + C.esc(B ? B.nome : (p.rotulo_b || 'A definir')) + '</b>' + C.selo(C.STATUS_JOGO, p.status) + '</div>' +
          (p.status === 'publicada' ? '<div class="linha entre"><span class="titulo" style="font-size:22px">' + (folga ? 'Folga · avançou direto' : (p.placar_a + ' x ' + p.placar_b) + (p.vencedor_id ? ' · venceu ' + C.esc((E[p.vencedor_id] || {}).nome || '') : ' · empate')) + '</span>' + (folga ? '' : '<button type="button" class="btn sec" style="min-height:38px" data-corrigir="' + p.id + '">Corrigir resultado</button>') + '</div>' :
          !pronta ? '<span class="ajuda">Aguardando as equipes desta partida serem definidas.</span>' :
          '<div class="grade" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))"><div class="campo"><label>Horário</label><input type="datetime-local" data-inicio="' + p.id + '" value="' + local(p.inicio) + '"></div>' +
          '<div class="campo"><label>Placar ' + C.esc(A.sigla) + '</label><input type="number" min="0" data-pa="' + p.id + '" value="' + (p.placar_a == null ? '' : p.placar_a) + '"></div>' +
          '<div class="campo"><label>Placar ' + C.esc(B.sigla) + '</label><input type="number" min="0" data-pb="' + p.id + '" value="' + (p.placar_b == null ? '' : p.placar_b) + '"></div></div>' +
          '<details' + (mp.length ? ' open' : '') + '><summary style="cursor:pointer;font-weight:700">Placar por mapa (opcional)</summary><div class="pilha" style="gap:6px;margin-top:8px" data-mapas="' + p.id + '">' +
          [1, 2, 3, 4, 5].map(function (n) { var m = mp.filter(function (x) { return x.numero === n; })[0] || {}; return '<div class="grade" style="grid-template-columns:90px minmax(0,1fr) 90px 90px;gap:8px;align-items:center"><span class="ajuda">Mapa ' + n + '</span><input type="text" placeholder="Nome do mapa" data-mn="' + n + '" value="' + C.esc(m.nome || '') + '"><input type="number" min="0" placeholder="' + C.esc(A.sigla) + '" data-ma="' + n + '" value="' + (m.pontos_a == null ? '' : m.pontos_a) + '"><input type="number" min="0" placeholder="' + C.esc(B.sigla) + '" data-mb="' + n + '" value="' + (m.pontos_b == null ? '' : m.pontos_b) + '"></div>'; }).join('') +
          '<span class="ajuda">Se preencher os mapas e deixar o placar em branco, o placar da série é calculado sozinho.</span></div></details>' +
          '<div class="linha" style="justify-content:flex-end">' + zap(p.equipe_a, p) + zap(p.equipe_b, p) + (p.status === 'agendada' ? '<button type="button" class="btn sec" style="min-height:40px" data-andamento="' + p.id + '">Marcar em andamento</button>' : '') + '<button type="button" class="btn" style="min-height:40px" data-publicar="' + p.id + '">PUBLICAR RESULTADO</button></div>') + '</article>';
      }).join('');
    }).join('') || '<div class="vazio">Sem partidas.</div>';
    function erro(e) { alert('Erro: ' + (e.message || e)); }
    alvo.querySelectorAll('[data-inicio]').forEach(function (i) { i.onchange = async function () { var r = await db.from('partidas').update({ inicio: i.value ? new Date(i.value).toISOString() : null }).eq('id', i.dataset.inicio); if (r.error) erro(r.error); }; });
    alvo.querySelectorAll('[data-andamento]').forEach(function (b) { b.onclick = async function () { var r = await db.from('partidas').update({ status: 'em_andamento' }).eq('id', b.dataset.andamento); if (r.error) return erro(r.error); partidas(); }; });
    alvo.querySelectorAll('[data-corrigir]').forEach(function (b) { b.onclick = async function () { if (!confirm('Reabrir esta partida para corrigir o resultado? Depois publique de novo: o vencedor correto será levado para a próxima fase.')) return; var r = await db.from('partidas').update({ status: 'aguardando_resultado' }).eq('id', b.dataset.corrigir); if (r.error) return erro(r.error); partidas(); }; });
    alvo.querySelectorAll('[data-publicar]').forEach(function (b) { b.onclick = async function () {
      var id = b.dataset.publicar, card = alvo.querySelector('[data-p="' + id + '"]');
      var linhas = []; card.querySelectorAll('[data-mn]').forEach(function (inp) { var n = +inp.dataset.mn, a = card.querySelector('[data-ma="' + n + '"]').value, bb = card.querySelector('[data-mb="' + n + '"]').value; if (a !== '' && bb !== '') linhas.push({ partida_id: +id, numero: n, nome: inp.value.trim() || null, pontos_a: +a, pontos_b: +bb }); });
      var pa = card.querySelector('[data-pa]').value, pb = card.querySelector('[data-pb]').value;
      if ((pa === '' || pb === '') && linhas.length) { pa = linhas.filter(function (m) { return m.pontos_a > m.pontos_b; }).length; pb = linhas.filter(function (m) { return m.pontos_b > m.pontos_a; }).length; }
      if (pa === '' || pb === '') return alert('Preencha o placar (ou o placar por mapa).');
      var p = ps.filter(function (x) { return String(x.id) === id; })[0];
      if (+pa === +pb && p.fase !== 'grupos') return alert('No mata-mata não pode haver empate: confira o placar.');
      if (!confirm('Publicar ' + (E[p.equipe_a] || {}).nome + ' ' + pa + ' x ' + pb + ' ' + (E[p.equipe_b] || {}).nome + '?')) return;
      await db.from('mapas').delete().eq('partida_id', id);
      if (linhas.length) { var rm = await db.from('mapas').insert(linhas); if (rm.error) return erro(rm.error); }
      var r = await db.from('partidas').update({ placar_a: +pa, placar_b: +pb, status: 'publicada' }).eq('id', id);
      if (r.error) return erro(r.error); partidas();
    }; });
  }
  // ================= ARTES
  var logo = new Image(); logo.src = '../assets/img/logo-boom-games.png';
  async function artes() {
    await lerCamps();
    var sc = $('ar-camp'); opcoes(sc, function (x) { return x.status !== 'rascunho'; });
    async function partidasDoCamp() {
      var ps = sc.value ? ((await db.from('partidas').select('*').eq('campeonato_id', sc.value).eq('status', 'publicada').not('equipe_b', 'is', null).not('equipe_a', 'is', null).order('ordem')).data || []) : [];
      var ids = []; ps.forEach(function (p) { ids.push(p.equipe_a, p.equipe_b); });
      var E = {}; ((ids.length ? (await db.from('equipes').select('id, nome, sigla').in('id', ids)).data : []) || []).forEach(function (e) { E[e.id] = e; });
      $('ar-partida').innerHTML = ps.length ? ps.map(function (p) { return '<option value="' + p.id + '">' + C.esc((p.codigo || '') + ' · ' + E[p.equipe_a].nome + ' ' + p.placar_a + ' x ' + p.placar_b + ' ' + E[p.equipe_b].nome) + '</option>'; }).join('') : '<option value="">Sem resultados publicados</option>';
      $('ar-partida')._dados = { ps: ps, E: E };
    }
    function vis() { $('ar-partida-box').hidden = $('ar-modelo').value !== 'resultado'; }
    sc.onchange = partidasDoCamp; $('ar-modelo').onchange = vis; vis(); await partidasDoCamp();
    $('ar-gerar').onclick = gerarArte;
  }
  async function gerarArte() {
    var btn = $('ar-gerar'); btn.disabled = true; btn.textContent = 'Gerando…';
    try {
      try { await Promise.all([document.fonts.load('italic 700 120px "Chakra Petch"'), document.fonts.load('700 80px "Chakra Petch"'), document.fonts.load('800 30px Manrope')]); } catch (e) {}
      if (!logo.complete) await new Promise(function (ok) { logo.onload = ok; logo.onerror = ok; });
      var modelo = $('ar-modelo').value, c = camps.filter(function (k) { return String(k.id) === $('ar-camp').value; })[0];
      if (!c) throw new Error('Escolha um campeonato.');
      var d = { logo: logo, site: BOOM.url('').replace(/^https?:\/\//, '').replace(/\/$/, ''), campeonato: c.nome, edicao: c.edicao };
      if (modelo === 'campeao') {
        if (!c.campeao_id) throw new Error('Este campeonato ainda não tem campeã. Publique o resultado da final.');
        var e = (await db.from('equipes').select('nome, sigla').eq('id', c.campeao_id).single()).data;
        var fin = (await db.from('partidas').select('*').eq('campeonato_id', c.id).eq('fase', 'final').maybeSingle()).data;
        var mem = (await db.from('equipe_membros').select('jogador_id').eq('equipe_id', c.campeao_id).eq('status', 'aceito')).data || [];
        var nk = mem.length ? ((await db.from('jogadores_publicos').select('nick').in('id', mem.map(function (m) { return m.jogador_id; }))).data || []) : [];
        d.equipe = e.nome; d.sigla = e.sigla; d.elenco = nk.map(function (x) { return x.nick; });
        if (fin && fin.placar_a != null) {
          var aVenceu = fin.vencedor_id === fin.equipe_a, viceId = aVenceu ? fin.equipe_b : fin.equipe_a;
          var vice = viceId ? (await db.from('equipes').select('nome').eq('id', viceId).single()).data : null;
          d.placar = aVenceu ? fin.placar_a + ' x ' + fin.placar_b : fin.placar_b + ' x ' + fin.placar_a; d.vice = vice ? vice.nome : '';
        }
      } else if (modelo === 'resultado') {
        var dd = $('ar-partida')._dados || {}, p = (dd.ps || []).filter(function (k) { return String(k.id) === $('ar-partida').value; })[0];
        if (!p) throw new Error('Escolha uma partida com resultado publicado.');
        var A = dd.E[p.equipe_a], B = dd.E[p.equipe_b];
        d.fase = C.FASES[p.fase] || p.fase; d.serie = p.serie; d.siglaA = A.sigla; d.siglaB = B.sigla; d.equipeA = A.nome; d.equipeB = B.nome;
        d.placarA = p.placar_a; d.placarB = p.placar_b; d.vencedor = p.vencedor_id === A.id ? 'a' : p.vencedor_id === B.id ? 'b' : null;
        d.mapas = (await db.from('mapas').select('*').eq('partida_id', p.id).order('numero')).data || [];
      } else if (modelo === 'inscricoes') {
        d.jogo = c.jogo; d.data = c.data_evento ? C.data(c.data_evento) : null; d.vagas = c.vagas; d.elenco = c.tamanho_elenco;
        d.valor = Number(c.valor_inscricao) > 0 ? C.dinheiro(c.valor_inscricao) : 'GRATUITA'; d.premio = c.premio_1;
      } else {
        var hoje = new Date(); hoje.setHours(0, 0, 0, 0); var am = new Date(hoje.getTime() + 864e5);
        var ps = (await db.from('partidas').select('*').eq('campeonato_id', c.id).gte('inicio', hoje.toISOString()).lt('inicio', am.toISOString()).order('inicio')).data || [];
        var ids = []; ps.forEach(function (q) { if (q.equipe_a) ids.push(q.equipe_a); if (q.equipe_b) ids.push(q.equipe_b); });
        var E2 = {}; ((ids.length ? (await db.from('equipes').select('id, nome').in('id', ids)).data : []) || []).forEach(function (k) { E2[k.id] = k; });
        d.dia = hoje.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '').toUpperCase();
        d.aoVivo = c.transmissao_url ? (c.transmissao_plataforma || 'transmissão') : null;
        d.jogos = ps.map(function (q) { return { hora: new Date(q.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), fase: (C.FASES[q.fase] || q.fase) + (q.codigo ? ' · ' + q.codigo : ''), a: (E2[q.equipe_a] || {}).nome || q.rotulo_a || 'A definir', b: (E2[q.equipe_b] || {}).nome || q.rotulo_b || 'A definir', aoVivo: q.status === 'em_andamento' }; });
      }
      var cv = $('ar-canvas'); ARTES.desenhar(cv, modelo, d);
      cv.style.width = modelo === 'agenda' ? 'min(100%, 300px)' : 'min(100%, 460px)';
      cv.toBlob(function (bl) { var a = $('ar-baixar'); if (a.href && a.href.indexOf('blob:') === 0) URL.revokeObjectURL(a.href); a.href = URL.createObjectURL(bl); a.download = 'boom-games-' + modelo + '.png'; a.hidden = false; }, 'image/png');
    } catch (err) { alert(err.message || err); }
    btn.disabled = false; btn.textContent = 'Gerar arte';
  }
  // ================= HISTÓRICO E USO
  async function historico() {
    async function conta(t, f) { var q = db.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); var r = await q; return r.count || 0; }
    var n = await Promise.all([conta('perfis'), conta('equipes'), conta('campeonatos'), conta('inscricoes'), conta('pagamentos', function (q) { return q.not('comprovante_path', 'is', null); })]);
    $('uso').innerHTML = [['CONTAS DE JOGADOR', n[0]], ['EQUIPES', n[1]], ['CAMPEONATOS', n[2]], ['INSCRIÇÕES', n[3]], ['COMPROVANTES', n[4]]].map(function (x) { return '<div class="cartao cut" style="gap:4px;padding:16px"><span class="olho" style="color:var(--apagado)">' + x[0] + '</span><span class="titulo" style="font-size:30px">' + x[1] + '</span></div>'; }).join('');
    var h = (await db.from('historico').select('*').order('quando', { ascending: false }).limit(150)).data || [];
    var uids = []; h.forEach(function (x) { if (x.usuario_id && uids.indexOf(x.usuario_id) < 0) uids.push(x.usuario_id); });
    var U = {}; ((uids.length ? (await db.from('perfis').select('id, nick, nome').in('id', uids)).data : []) || []).forEach(function (u) { U[u.id] = u; });
    $('hist').innerHTML = h.length ? '<table class="tabela"><thead><tr><th>QUANDO</th><th>QUEM</th><th>AÇÃO</th><th>DETALHES</th></tr></thead><tbody>' + h.map(function (x) {
      var d = x.detalhes || {}, det = Object.keys(d).filter(function (k) { return d[k]; }).map(function (k) { return k + ': ' + d[k]; }).join(' · ');
      return '<tr><td style="white-space:nowrap">' + C.dataHora(x.quando) + '</td><td>' + C.esc(x.usuario_id ? ('@' + ((U[x.usuario_id] || {}).nick || '?')) : 'Sistema') + '</td><td><b>' + C.esc(x.acao) + '</b></td><td class="ajuda">' + C.esc(det) + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="vazio">Nada registrado ainda.</div>';
  }
  return { chave: chave, partidas: partidas, artes: artes, historico: historico };
})();
