// Funções dos campeonatos (rótulos, capa, Pix).
window.CAMP = (function () {
  'use strict';
  var STATUS = {
    rascunho: ['RASCUNHO', 'po'], inscricoes_abertas: ['INSCRIÇÕES ABERTAS', 'lar'], inscricoes_encerradas: ['INSCRIÇÕES ENCERRADAS', 'lin'],
    em_andamento: ['EM ANDAMENTO', 'br'], finalizado: ['FINALIZADO', 'cz']
  };
  var INSC = {
    aguardando_pagamento: ['AGUARDANDO PAGAMENTO', 'po'], pagamento_em_analise: ['PAGAMENTO EM ANÁLISE', 'po'], confirmada: ['CONFIRMADA', 'lar'],
    recusada: ['RECUSADA', 'cz'], lista_espera: ['LISTA DE ESPERA', 'lin'], expirada: ['RESERVA EXPIRADA', 'cz']
  };
  var FORMATO = { grupos_mata: 'Grupos + mata-mata', eliminacao_simples: 'Eliminação simples', eliminacao_dupla: 'Eliminação dupla', pontos_corridos: 'Pontos corridos' };
  function esc(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
  function selo(map, k) { var s = map[k] || [k, 'lin']; return '<span class="selo ' + s[1] + '">' + esc(s[0]) + '</span>'; }
  function statusInsc(i) { return (i.status === 'aguardando_pagamento' && i.reservado_ate && new Date(i.reservado_ate) < new Date()) ? 'expirada' : i.status; }
  function capa(c, comSelo) {
    return '<div class="capa">' + (c.capa_url ? '<img class="foto" src="' + esc(c.capa_url) + '" alt="">' : '') +
      (comSelo ? '<span class="st">' + selo(STATUS, c.status) + '</span>' : '') +
      '<span class="p">' + esc((c.plataforma || '').toUpperCase()) + '</span><span class="k">COPA BOOM</span><span class="j">' + esc(c.jogo) + '</span></div>';
  }
  function dinheiro(v) { return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function data(d) { if (!d) return '—'; var x = new Date(String(d).length === 10 ? d + 'T12:00:00' : d); return x.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  function dataHora(d) { if (!d) return '—'; return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function slug(t) { return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function param(n) { return new URLSearchParams(location.search).get(n); }

  // ---- Pix "copia e cola" (padrão do Banco Central)
  function campo(id, v) { v = String(v); return id + String(v.length).padStart(2, '0') + v; }
  function crc16(s) {
    var crc = 0xFFFF;
    for (var i = 0; i < s.length; i++) { crc ^= s.charCodeAt(i) << 8; for (var j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF; }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  function limpar(t, max) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, max).trim(); }
  function chavePix(tipo, chave) {
    chave = String(chave || '').trim();
    if (tipo === 'telefone') { var d = chave.replace(/\D/g, ''); if (d.length <= 11) d = '55' + d; return '+' + d; }
    if (tipo === 'cpf' || tipo === 'cnpj') return chave.replace(/\D/g, '');
    if (tipo === 'email') return chave.toLowerCase();
    return chave;
  }
  function pix(loja, valor, txid) {
    var conta = campo('00', 'br.gov.bcb.pix') + campo('01', chavePix(loja.pix_tipo, loja.pix_chave));
    var p = campo('00', '01') + campo('26', conta) + campo('52', '0000') + campo('53', '986') +
      (valor > 0 ? campo('54', Number(valor).toFixed(2)) : '') + campo('58', 'BR') +
      campo('59', limpar(loja.pix_nome || 'BOOM GAMES', 25) || 'BOOM GAMES') + campo('60', limpar(loja.pix_cidade || 'FORTALEZA', 15) || 'FORTALEZA') +
      campo('62', campo('05', (limpar(txid, 25).replace(/ /g, '') || '***'))) + '6304';
    return p + crc16(p);
  }
  return { STATUS: STATUS, INSC: INSC, FORMATO: FORMATO, esc: esc, selo: selo, statusInsc: statusInsc, capa: capa, dinheiro: dinheiro, data: data, dataHora: dataHora, slug: slug, param: param, pix: pix };
})();
