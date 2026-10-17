// Funções comuns das páginas de conta e painel.
window.BOOM = (function () {
  'use strict';
  var cfg = window.BOOM_CONFIG;
  var db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  var raiz = new URL(document.documentElement.getAttribute('data-raiz') || './', location.href);
  function url(caminho) { return new URL(caminho || '', raiz).href; }
  function login(provedor, destino) {
    return db.auth.signInWithOAuth({ provider: provedor, options: { redirectTo: url(destino) } });
  }
  async function sessao() { var r = await db.auth.getSession(); return r.data.session; }
  async function sair(destino) { await db.auth.signOut(); location.href = url(destino || ''); }
  function $(id) { return document.getElementById(id); }
  function mostrar(id) { document.querySelectorAll('[data-tela]').forEach(function (el) { el.hidden = el.getAttribute('data-tela') !== id; }); }
  function idade(iso) {
    if (!iso) return null;
    var n = new Date(iso + 'T12:00:00'), h = new Date();
    var a = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--;
    return a;
  }
  return { db: db, url: url, login: login, sessao: sessao, sair: sair, $: $, mostrar: mostrar, idade: idade };
})();
