// Artes para redes sociais · Boom Games
window.ARTES = (function () {
  'use strict';
  var L = '#FF7A1A', L2 = '#FFB066', ESC = '#B84500', FUNDO = '#070708';
  var DISP = '"Chakra Petch", "Arial Black", sans-serif', TXT = 'Manrope, "Segoe UI", Arial, sans-serif';
  function rnd(seed) { var s = seed || 7; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function fonte(x, peso, px, fam, italico) { x.font = (italico ? 'italic ' : '') + peso + ' ' + px + 'px ' + (fam || DISP); }
  function caber(x, t, max, peso, px, fam, it) { fonte(x, peso, px, fam, it); while (px > 20 && x.measureText(t).width > max) { px -= 4; fonte(x, peso, px, fam, it); } return px; }
  function espacado(x, t, cx, y, esp) { var w = 0, i; for (i = 0; i < t.length; i++) w += x.measureText(t[i]).width + esp; w -= esp; var px = cx - w / 2; x.textAlign = 'left'; for (i = 0; i < t.length; i++) { x.fillText(t[i], px, y); px += x.measureText(t[i]).width + esp; } x.textAlign = 'center'; }
  function hex(x, cx, cy, r) { x.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; x.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } x.closePath(); }
  function corte(x, X, Y, w, h, c) { x.beginPath(); x.moveTo(X + c, Y); x.lineTo(X + w, Y); x.lineTo(X + w, Y + h - c); x.lineTo(X + w - c, Y + h); x.lineTo(X, Y + h); x.lineTo(X, Y + c); x.closePath(); }
  function brilho(x, cx, cy, r, a) { var g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,122,26,' + a + ')'); g.addColorStop(1, 'rgba(255,122,26,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }

  function fundo(x, W, H, seed) {
    var r = rnd(seed);
    x.fillStyle = FUNDO; x.fillRect(0, 0, W, H);
    brilho(x, W * .82, H * .1, W * .75, .32); brilho(x, W * .1, H * .95, W * .6, .16);
    // piso em perspectiva
    var hz = H * .62; x.save(); x.beginPath(); x.rect(0, hz, W, H - hz); x.clip();
    var gl = x.createLinearGradient(0, hz, 0, H); gl.addColorStop(0, 'rgba(255,122,26,0)'); gl.addColorStop(.35, 'rgba(255,122,26,.16)'); gl.addColorStop(1, 'rgba(255,122,26,.34)');
    x.strokeStyle = gl; x.lineWidth = 1.5;
    for (var i = -14; i <= 14; i++) { x.beginPath(); x.moveTo(W / 2, hz); x.lineTo(W / 2 + i * W * .16, H); x.stroke(); }
    for (var k = 1; k < 12; k++) { var y = hz + Math.pow(k / 11, 2.1) * (H - hz); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
    x.restore();
    // grade fina
    x.strokeStyle = 'rgba(255,255,255,.035)'; x.lineWidth = 1;
    for (i = 0; i < W; i += 54) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, hz); x.stroke(); }
    for (i = 0; i < hz; i += 54) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }
    // feixes diagonais
    for (i = 0; i < 5; i++) { var x0 = r() * W; var g = x.createLinearGradient(x0, 0, x0 - H * .5, H); g.addColorStop(0, 'rgba(255,122,26,0)'); g.addColorStop(.5, 'rgba(255,140,60,' + (.08 + r() * .14) + ')'); g.addColorStop(1, 'rgba(255,122,26,0)'); x.strokeStyle = g; x.lineWidth = 1 + r() * 3; x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 - H * .5, H); x.stroke(); }
    // partículas
    for (i = 0; i < 70; i++) { x.fillStyle = r() > .5 ? 'rgba(255,122,26,' + (.2 + r() * .5) + ')' : 'rgba(255,255,255,' + (.08 + r() * .25) + ')'; var s = 2 + r() * 4; x.fillRect(r() * W, r() * H, s, s); }
    // vinheta
    var v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.65)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  function moldura(x, W, H) {
    var m = 34, t = 70; x.strokeStyle = L; x.lineWidth = 5;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(function (c) { x.beginPath(); x.moveTo(c[0], c[1] + c[3] * t); x.lineTo(c[0], c[1]); x.lineTo(c[0] + c[2] * t, c[1]); x.stroke(); });
    x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; x.strokeRect(m + 14, m + 14, W - 2 * m - 28, H - 2 * m - 28);
  }
  function topo(x, W, logo, etiqueta) {
    if (logo && logo.naturalWidth) { var h = 96, w = h * logo.naturalWidth / logo.naturalHeight; x.drawImage(logo, 70, 66, w, h); }
    if (etiqueta) { fonte(x, '800', 22, TXT); var tw = x.measureText(etiqueta).width + 48, X = W - 70 - tw;
      corte(x, X, 84, tw, 56, 12); x.fillStyle = 'rgba(255,122,26,.12)'; x.fill(); x.strokeStyle = L; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(etiqueta, X + tw / 2, 120); }
  }
  function rodape(x, W, H, site) {
    var y = H - 118; var g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,122,26,0)'); g.addColorStop(.5, L); g.addColorStop(1, 'rgba(255,122,26,0)');
    x.fillStyle = g; x.fillRect(70, y, W - 140, 3);
    fonte(x, '800', 24, TXT); x.fillStyle = '#E4E4E7'; x.textAlign = 'left'; x.fillText('@boomgames_ofc', 74, y + 50);
    x.textAlign = 'right'; x.fillStyle = 'rgba(255,255,255,.6)'; x.fillText(site || '', W - 74, y + 50); x.textAlign = 'center';
  }
  function contorno(x, t, cx, cy, px, alfa) { fonte(x, '700', px, DISP, true); x.textAlign = 'center'; x.strokeStyle = 'rgba(255,122,26,' + alfa + ')'; x.lineWidth = 3; x.strokeText(t, cx, cy); }
  function emblema(x, cx, cy, r, sigla, ativo) {
    x.save(); x.shadowColor = ativo ? 'rgba(255,122,26,.9)' : 'rgba(0,0,0,0)'; x.shadowBlur = ativo ? 60 : 0;
    hex(x, cx, cy, r); var g = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    if (ativo) { g.addColorStop(0, L2); g.addColorStop(.45, L); g.addColorStop(1, ESC); } else { g.addColorStop(0, '#4A4A52'); g.addColorStop(1, '#1C1C20'); }
    x.fillStyle = g; x.fill(); x.restore();
    hex(x, cx, cy, r * .84); x.fillStyle = '#0B0B0D'; x.fill(); x.strokeStyle = ativo ? 'rgba(255,176,102,.9)' : 'rgba(255,255,255,.25)'; x.lineWidth = 3; x.stroke();
    var px = caber(x, sigla, r * 1.25, '700', r * .62, DISP, true); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(sigla, cx, cy + 4); x.textBaseline = 'alphabetic';
  }
  function trofeu(x, cx, cy, s) {
    var g = x.createLinearGradient(cx, cy - s, cx, cy + s); g.addColorStop(0, '#FFE2BF'); g.addColorStop(.5, L); g.addColorStop(1, ESC);
    x.save(); x.fillStyle = g; x.shadowColor = 'rgba(255,122,26,.8)'; x.shadowBlur = 40;
    x.beginPath(); x.moveTo(cx - s * .62, cy - s * .8); x.lineTo(cx + s * .62, cy - s * .8); x.lineTo(cx + s * .55, cy - s * .15);
    x.quadraticCurveTo(cx + s * .45, cy + s * .25, cx + s * .12, cy + s * .32); x.lineTo(cx + s * .12, cy + s * .55); x.lineTo(cx + s * .38, cy + s * .62); x.lineTo(cx + s * .38, cy + s * .8);
    x.lineTo(cx - s * .38, cy + s * .8); x.lineTo(cx - s * .38, cy + s * .62); x.lineTo(cx - s * .12, cy + s * .55); x.lineTo(cx - s * .12, cy + s * .32);
    x.quadraticCurveTo(cx - s * .45, cy + s * .25, cx - s * .55, cy - s * .15); x.closePath(); x.fill();
    x.lineWidth = s * .1; x.strokeStyle = g; x.beginPath(); x.arc(cx - s * .62, cy - s * .38, s * .26, Math.PI * .5, Math.PI * 1.5); x.stroke(); x.beginPath(); x.arc(cx + s * .62, cy - s * .38, s * .26, -Math.PI * .5, Math.PI * .5); x.stroke();
    x.restore(); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(cx - s * .3, cy - s * .66, s * .12, s * .5);
  }
  function raios(x, cx, cy, r, n) { x.save(); x.translate(cx, cy); for (var i = 0; i < n; i++) { x.rotate(Math.PI * 2 / n); var g = x.createLinearGradient(0, 0, 0, -r); g.addColorStop(0, 'rgba(255,122,26,.35)'); g.addColorStop(1, 'rgba(255,122,26,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(-18, 0); x.lineTo(-60, -r); x.lineTo(60, -r); x.lineTo(18, 0); x.closePath(); x.fill(); } x.restore(); }
  function confete(x, W, H, seed) { var r = rnd(seed); for (var i = 0; i < 55; i++) { x.save(); x.translate(r() * W, r() * H * .6); x.rotate(r() * Math.PI); x.fillStyle = ['#FF7A1A', '#FFB066', '#FFFFFF', '#B84500'][Math.floor(r() * 4)]; x.globalAlpha = .35 + r() * .4; x.fillRect(-6, -12, 12, 24 * (.5 + r())); x.restore(); } }
  function textoGrad(x, t, cx, y) { var w = x.measureText(t).width, g = x.createLinearGradient(cx - w / 2, y - 80, cx + w / 2, y); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.6, '#FFE7D1'); g.addColorStop(1, L2); x.fillStyle = g; x.fillText(t, cx, y); }
  function chip(x, t, cx, y, cor) { fonte(x, '800', 24, TXT); var w = x.measureText(t).width + 50; corte(x, cx - w / 2, y - 36, w, 52, 10); x.fillStyle = cor || L; x.fill(); x.fillStyle = cor === '#FFFFFF' || !cor ? '#0A0A0B' : '#fff'; x.textAlign = 'center'; x.fillText(t, cx, y - 2); }

  // ---------- CAMPEÃO
  function campeao(x, W, H, d) {
    fundo(x, W, H, 11); contorno(x, 'CAMPEÃO', W / 2, H * .5, 300, .09); raios(x, W / 2, 410, 560, 18); brilho(x, W / 2, 410, 380, .45);
    confete(x, W, H, 5); moldura(x, W, H); topo(x, W, d.logo, (d.edicao || 'COPA BOOM').toUpperCase());
    trofeu(x, W / 2, 268, 92); emblema(x, W / 2, 470, 112, d.sigla, true);
    fonte(x, '800', 26, TXT); x.fillStyle = L; x.textAlign = 'center'; espacado(x, 'CAMPEÃ DA ' + d.campeonato.toUpperCase(), W / 2, 650, 6);
    var px = caber(x, d.equipe.toUpperCase(), W - 200, '700', 118, DISP, true); x.save(); x.shadowColor = 'rgba(255,122,26,.6)'; x.shadowBlur = 30; textoGrad(x, d.equipe.toUpperCase(), W / 2, 770); x.restore();
    if (d.placar) { fonte(x, '700', 34, DISP); var t = 'FINAL  ' + d.placar + '  ' + d.vice.toUpperCase(); var w = Math.min(W - 220, x.measureText(t).width + 80); corte(x, W / 2 - w / 2, 810, w, 70, 14); x.fillStyle = 'rgba(11,11,13,.85)'; x.fill(); x.strokeStyle = 'rgba(255,122,26,.7)'; x.lineWidth = 2; x.stroke(); caber(x, t, w - 50, '700', 34, DISP); x.fillStyle = '#fff'; x.fillText(t, W / 2, 857); }
    if (d.elenco && d.elenco.length) { fonte(x, '700', 24, TXT); x.fillStyle = 'rgba(255,255,255,.7)'; var e = d.elenco.map(function (n) { return '@' + n; }).join('   '); caber(x, e, W - 200, '700', 24, TXT); x.fillText(e, W / 2, 920); }
    rodape(x, W, H, d.site);
  }
  // ---------- RESULTADO
  function resultado(x, W, H, d) {
    fundo(x, W, H, 23); contorno(x, 'VS', W / 2, H * .62, 520, .07); moldura(x, W, H); topo(x, W, d.logo, d.campeonato.toUpperCase());
    chip(x, (d.fase || 'RESULTADO').toUpperCase(), W / 2, 245, L);
    var ga = d.vencedor === 'a', gb = d.vencedor === 'b';
    brilho(x, ga ? W * .2 : W * .8, 440, 300, .35);
    emblema(x, W * .2, 440, 118, d.siglaA, ga); emblema(x, W * .8, 440, 118, d.siglaB, gb);
    fonte(x, '700', 176, DISP, true); x.textAlign = 'center'; x.save(); x.shadowColor = 'rgba(255,122,26,.85)'; x.shadowBlur = 50;
    var sa = String(d.placarA), sb = String(d.placarB), wa = x.measureText(sa).width, wc = x.measureText(':').width;
    x.fillStyle = ga ? L : '#fff'; x.textAlign = 'right'; x.fillText(sa, W / 2 - wc / 2 - 6, 505); x.fillStyle = 'rgba(255,255,255,.35)'; x.textAlign = 'center'; x.fillText(':', W / 2, 497);
    x.fillStyle = gb ? L : '#fff'; x.textAlign = 'left'; x.fillText(sb, W / 2 + wc / 2 + 6, 505); x.restore(); x.textAlign = 'center';
    [['a', W * .2, d.equipeA], ['b', W * .8, d.equipeB]].forEach(function (q) { var v = d.vencedor === q[0]; caber(x, q[2].toUpperCase(), 330, '700', 44, DISP, true); x.fillStyle = v ? '#fff' : 'rgba(255,255,255,.55)'; x.fillText(q[2].toUpperCase(), q[1], 640); if (v) chip(x, 'VENCEU', q[1], 715, '#FFFFFF'); });
    if (d.mapas && d.mapas.length) { var n = d.mapas.length, bw = Math.min(250, (W - 200) / n - 16), tot = n * bw + (n - 1) * 16, x0 = W / 2 - tot / 2;
      d.mapas.forEach(function (m, i) { var X = x0 + i * (bw + 16); corte(x, X, 790, bw, 100, 12); x.fillStyle = 'rgba(11,11,13,.85)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2; x.stroke();
        fonte(x, '800', 18, TXT); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillText(((m.nome || ('MAPA ' + m.numero)) + '').toUpperCase(), X + bw / 2, 822);
        fonte(x, '700', 40, DISP); x.fillStyle = '#fff'; x.fillText(m.pontos_a + ' - ' + m.pontos_b, X + bw / 2, 870); }); }
    else if (d.serie) { fonte(x, '800', 26, TXT); x.fillStyle = 'rgba(255,255,255,.6)'; espacado(x, d.serie.toUpperCase(), W / 2, 850, 8); }
    rodape(x, W, H, d.site);
  }
  // ---------- INSCRIÇÕES ABERTAS
  function inscricoes(x, W, H, d) {
    fundo(x, W, H, 37); moldura(x, W, H); topo(x, W, d.logo, d.edicao ? d.edicao.toUpperCase() : 'NOVO CAMPEONATO');
    fonte(x, '800', 30, TXT); x.fillStyle = L; espacado(x, 'COPA BOOM', W / 2, 270, 18);
    var j = d.jogo.toUpperCase(), px = caber(x, j, W - 160, '700', 190, DISP, true);
    x.fillStyle = 'rgba(255,122,26,.35)'; x.fillText(j, W / 2 + 8, 432); x.save(); x.shadowColor = 'rgba(255,122,26,.7)'; x.shadowBlur = 40; textoGrad(x, j, W / 2, 424); x.restore();
    chip(x, 'INSCRIÇÕES ABERTAS', W / 2, 515, '#FFFFFF');
    var info = [['DATA', d.data || 'EM BREVE'], ['VAGAS', d.vagas + ' ' + (d.elenco > 1 ? 'EQUIPES' : 'JOGADORES')], ['INSCRIÇÃO', d.valor], ['PREMIAÇÃO', d.premio || 'EM BREVE']];
    info.forEach(function (it, i) { var bw = (W - 200) / 2 - 10, bh = 128, X = 100 + (i % 2) * (bw + 20), Y = 570 + Math.floor(i / 2) * (bh + 20);
      corte(x, X, Y, bw, bh, 16); x.fillStyle = 'rgba(11,11,13,.85)'; x.fill(); x.strokeStyle = i === 3 ? L : 'rgba(255,255,255,.2)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = L; x.fillRect(X, Y + 18, 5, bh - 36);
      fonte(x, '800', 20, TXT); x.fillStyle = 'rgba(255,255,255,.6)'; x.textAlign = 'left'; x.fillText(it[0], X + 30, Y + 46);
      caber(x, it[1], bw - 60, '700', 44, DISP); x.fillStyle = '#fff'; x.fillText(it[1], X + 30, Y + 100); x.textAlign = 'center'; });
    rodape(x, W, H, d.site);
  }
  // ---------- AGENDA (STORY)
  function agenda(x, W, H, d) {
    fundo(x, W, H, 51); moldura(x, W, H); topo(x, W, d.logo, d.dia);
    fonte(x, '800', 32, TXT); x.fillStyle = L; espacado(x, 'HOJE NA ARENA', W / 2, 330, 14);
    caber(x, d.campeonato.toUpperCase(), W - 160, '700', 96, DISP, true); x.save(); x.shadowColor = 'rgba(255,122,26,.6)'; x.shadowBlur = 30; textoGrad(x, d.campeonato.toUpperCase(), W / 2, 440); x.restore();
    var lista = d.jogos.slice(0, 7);
    if (!lista.length) { fonte(x, '700', 36, TXT); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillText('Sem partidas com horário para hoje', W / 2, 700); }
    lista.forEach(function (g, i) { var Y = 520 + i * 170, X = 90, w = W - 180, h = 140;
      corte(x, X, Y, w, h, 18); x.fillStyle = 'rgba(11,11,13,.88)'; x.fill(); x.strokeStyle = g.aoVivo ? L : 'rgba(255,255,255,.18)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = L; x.fillRect(X, Y, 200, h); fonte(x, '700', 52, DISP); x.fillStyle = '#0A0A0B'; x.textAlign = 'center'; x.fillText(g.hora, X + 100, Y + 88);
      x.textAlign = 'left'; fonte(x, '800', 20, TXT); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText((g.fase || '').toUpperCase(), X + 230, Y + 46);
      caber(x, g.a + '  x  ' + g.b, w - 260, '700', 42, DISP); x.fillStyle = '#fff'; x.fillText(g.a + '  x  ' + g.b, X + 230, Y + 102); x.textAlign = 'center'; });
    var yb = H - 330; corte(x, 90, yb, W - 180, 120, 18); x.fillStyle = L; x.fill(); fonte(x, '700', 44, DISP); x.fillStyle = '#0A0A0B'; x.fillText(d.aoVivo ? 'AO VIVO NA ' + d.aoVivo.toUpperCase() : 'RESULTADOS AO VIVO NO SITE', W / 2, yb + 76);
    rodape(x, W, H, d.site);
  }
  function desenhar(cv, modelo, d) {
    var story = modelo === 'agenda'; cv.width = 1080; cv.height = story ? 1920 : 1080;
    var x = cv.getContext('2d'); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    ({ campeao: campeao, resultado: resultado, inscricoes: inscricoes, agenda: agenda })[modelo](x, cv.width, cv.height, d);
  }
  return { desenhar: desenhar };
})();
