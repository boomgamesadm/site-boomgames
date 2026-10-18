(function () {
  'use strict';
  var cfg = window.BOOM_CONFIG || {};
  var db = null;
  try { db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey); } catch (e) { console.warn('Supabase indisponível', e); }

  var loja = { whatsapp: '', instagram: 'boomgames_ofc', mostrar_marcas: true };
  var MARCAS_PADRAO = ['PlayStation', 'Sony', 'Microsoft', 'Xbox', 'Meta', 'Riot Games'].map(function (n) { return { nome: n }; });

  // ---------- aviso de cookies
  var banner = document.getElementById('cookie-banner');
  try { if (banner && !localStorage.getItem('bg-cookies')) banner.hidden = false; } catch (e) { if (banner) banner.hidden = false; }
  document.querySelectorAll('[data-acao="cookies"]').forEach(function (b) {
    b.addEventListener('click', function () { try { localStorage.setItem('bg-cookies', 'ok'); } catch (e) {} banner.hidden = true; });
  });

  // ---------- marcas parceiras
  function desenharMarcas(lista) {
    var ul = document.getElementById('marcas-lista');
    if (!ul) return;
    var n = lista.length;
    var tam = n <= 8 ? [176, 132, 17] : n <= 16 ? [150, 112, 15] : n <= 24 ? [132, 100, 14] : [116, 88, 12];
    ul.style.gap = (n <= 16 ? 16 : 12) + 'px';
    ul.innerHTML = '';
    lista.forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'brand cut-sm sd-card';
      li.style.cssText = 'width: min(' + tam[0] + 'px, calc(50% - 8px)); height: ' + tam[1] + 'px; box-sizing: border-box; padding: 18px 14px; display: flex; align-items: center; justify-content: center; text-align: center; background: linear-gradient(160deg, #141416, #0D0D0F); border: 1px solid #26262B;';
      ['tl', 'tr', 'bl', 'br'].forEach(function (c) { var s = document.createElement('span'); s.className = 'bk ' + c; s.setAttribute('aria-hidden', 'true'); li.appendChild(s); });
      var sc = document.createElement('span'); sc.className = 'scan'; sc.setAttribute('aria-hidden', 'true'); li.appendChild(sc);
      var alvo = li;
      if (m.link) { var a = document.createElement('a'); a.href = m.link; a.target = '_blank'; a.rel = 'noopener'; a.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: inherit'; li.appendChild(a); alvo = a; }
      if (m.logo_url) {
        var img = document.createElement('img'); img.src = m.logo_url; img.alt = m.nome; img.loading = 'lazy';
        img.style.cssText = 'max-width: 100%; max-height: ' + Math.round(tam[1] * 0.45) + 'px; object-fit: contain';
        alvo.appendChild(img);
      } else {
        var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = m.nome;
        nm.style.cssText = "font-family: 'Chakra Petch', sans-serif; font-weight: 700; font-size: " + tam[2] + 'px; letter-spacing: 2px; text-transform: uppercase; line-height: 1.2;';
        alvo.appendChild(nm);
      }
      ul.appendChild(li);
    });
  }
  desenharMarcas(MARCAS_PADRAO);

  // ---------- formulário de reserva pelo WhatsApp
  var estado = { motivo: 'corujao', pacote: 'Full Pass' };
  var $ = function (id) { return document.getElementById(id); };
  var campoNome = $('rnome'), campoData = $('rdata'), campoPes = $('rpes'), campoPac = $('rpac'), campoMsg = $('rmsg');
  var btnZap = $('btn-whatsapp'), previa = $('previa');

  function textoMensagem() {
    var nm = (campoNome && campoNome.value.trim()) || '[seu nome]';
    var dt = campoData && campoData.value ? campoData.value.split('-').reverse().join('/') : '[data]';
    var ps = (campoPes && campoPes.value) || '[quantidade]';
    var t;
    if (estado.motivo === 'corujao') t = 'Olá, Boom Games! Quero reservar o Corujão ' + estado.pacote + ' para ' + ps + ' pessoa(s) na noite de ' + dt + '. Meu nome é ' + nm + '.';
    else if (estado.motivo === 'aniversario') t = 'Olá, Boom Games! Quero saber mais sobre fazer um aniversário na loja. Data pretendida: ' + dt + ', cerca de ' + ps + ' convidados. Meu nome é ' + nm + '.';
    else t = 'Olá, Boom Games! Meu nome é ' + nm + '.';
    var extra = campoMsg && campoMsg.value.trim();
    if (extra) t += '\n' + extra;
    return t;
  }
  function atualizar() {
    document.querySelectorAll('.motivo').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.motivo === estado.motivo ? 'true' : 'false'); });
    document.querySelectorAll('.so-data').forEach(function (el) { el.hidden = estado.motivo === 'duvida'; });
    document.querySelectorAll('.so-corujao').forEach(function (el) { el.hidden = estado.motivo !== 'corujao'; });
    var ld = $('lbl-data'), lp = $('lbl-pes');
    if (ld) ld.textContent = estado.motivo === 'corujao' ? 'Noite do Corujão' : 'Data da festa';
    if (lp) lp.textContent = estado.motivo === 'corujao' ? 'Pessoas' : 'Convidados (aprox.)';
    if (campoPac) campoPac.value = estado.pacote;
    var txt = textoMensagem();
    if (previa) previa.textContent = txt;
    if (btnZap) {
      var num = (loja.whatsapp || '').replace(/\D/g, '');
      if (num) { btnZap.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(txt); btnZap.removeAttribute('aria-disabled'); btnZap.style.opacity = ''; }
      else { btnZap.href = '#reserva'; btnZap.setAttribute('aria-disabled', 'true'); btnZap.style.opacity = '.55'; }
    }
  }
  document.querySelectorAll('.motivo').forEach(function (b) { b.addEventListener('click', function () { estado.motivo = b.dataset.motivo; atualizar(); }); });
  document.querySelectorAll('[data-motivo-atalho]').forEach(function (a) {
    a.addEventListener('click', function () { estado.motivo = a.dataset.motivoAtalho; if (a.dataset.pacote) estado.pacote = a.dataset.pacote; atualizar(); });
  });
  [campoNome, campoData, campoPes, campoMsg].forEach(function (c) { if (c) c.addEventListener('input', atualizar); });
  if (campoPac) campoPac.addEventListener('change', function () { estado.pacote = campoPac.value; atualizar(); });
  if (btnZap) btnZap.addEventListener('click', function (e) {
    if (btnZap.getAttribute('aria-disabled') === 'true') { e.preventDefault(); alert('O WhatsApp da loja ainda não foi cadastrado. Fale com a gente pelo Instagram @' + loja.instagram + '.'); }
  });
  atualizar();

  // ---------- dados vindos do painel (Supabase)
  if (!db) return;
  db.from('loja_config').select('whatsapp, instagram, mostrar_marcas, endereco, referencia, maps_url').eq('id', 1).maybeSingle().then(function (r) {
    if (r.error) { console.warn(r.error.message); return; }
    if (r.data) {
      loja = Object.assign(loja, r.data);
      var sec = document.querySelector('[data-secao-marcas]');
      if (sec) sec.hidden = !loja.mostrar_marcas;
      var d = r.data;
      if (d.referencia && document.getElementById('loja-ref')) document.getElementById('loja-ref').textContent = d.referencia;
      if (d.endereco && document.getElementById('loja-end')) document.getElementById('loja-end').textContent = d.endereco;
      if (d.maps_url) document.querySelectorAll('[data-loja-maps]').forEach(function (a) { a.href = d.maps_url; });
      atualizar();
    }
  });
  db.from('marcas').select('nome, logo_url, link, ordem').eq('ativo', true).order('ordem').then(function (r) {
    if (r.error) { console.warn(r.error.message); return; }
    if (r.data && r.data.length) desenharMarcas(r.data);
  });
})();
