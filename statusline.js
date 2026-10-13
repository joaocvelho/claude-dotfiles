var ALERTA = 420000;
var LIMPEZA = 450000;

function g(o, path) {
  var p = path.split('.');
  for (var i = 0; i < p.length; i++) {
    if (o === null || o === undefined) return undefined;
    o = o[p[i]];
  }
  return o;
}

function num(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function kTok(n) {
  return n >= 1000 ? Math.round(n / 1000) + 'K' : String(n);
}

function dur(ms) {
  if (!(ms > 0)) return '0m';
  var m = Math.floor(ms / 60000);
  var h = Math.floor(m / 60);
  return h > 0 ? h + 'h' + ('0' + (m % 60)).slice(-2) : m + 'm';
}

function barra(pct) {
  var n = Math.max(0, Math.min(10, Math.round(pct / 10)));
  return new Array(n + 1).join('█') + new Array(11 - n).join('░');
}

function cor(c, t) {
  return '\x1b[' + c + 'm' + t + '\x1b[0m';
}

function render(d) {
  var partes = [];

  var agente = g(d, 'agent.name') || 'principal';
  partes.push(cor('36', '🤖 ' + agente));

  var modelo = g(d, 'model.display_name') || g(d, 'model.id') || '?';
  partes.push(cor('35', '🧠 ' + modelo));

  var janela = g(d, 'context_window.context_window_size') || 200000;
  var u = g(d, 'context_window.current_usage') || {};
  var usados = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  var pct = g(d, 'context_window.used_percentage');
  if (pct === undefined || pct === null) pct = janela ? usados * 100 / janela : 0;
  if (!usados && pct) usados = Math.round(janela * pct / 100);
  var corCtx = usados >= ALERTA ? '31' : pct >= 70 ? '33' : '32';
  var ctx = 'ctx ' + barra(pct) + ' ' + Math.round(pct) + '% ' + kTok(usados) + '/' + kTok(janela);
  if (usados >= ALERTA) ctx += ' ⚠ /compact (limpa em ' + kTok(LIMPEZA) + ')';
  partes.push(cor(corCtx, ctx));

  var tin = g(d, 'context_window.total_input_tokens') || 0;
  var tout = g(d, 'context_window.total_output_tokens') || 0;
  if (tin || tout) partes.push('⚡ ' + num(tin + tout) + ' tok');

  var lim = g(d, 'rate_limits.five_hour.used_percentage');
  var reset = g(d, 'rate_limits.five_hour.resets_at');
  if (lim !== undefined && lim !== null) {
    var txt = '5h ' + Math.round(lim) + '%';
    if (reset) {
      var alvo = typeof reset === 'number' ? (reset < 1e12 ? reset * 1000 : reset) : Date.parse(reset);
      if (alvo) txt += ' ⏳ ' + dur(alvo - Date.now());
    }
    partes.push(cor(lim >= 80 ? '31' : lim >= 50 ? '33' : '32', txt));
  }
  var sem = g(d, 'rate_limits.seven_day.used_percentage');
  if (sem !== undefined && sem !== null) partes.push('7d ' + Math.round(sem) + '%');

  partes.push('⏱ ' + dur(g(d, 'cost.total_duration_ms')));

  var custo = g(d, 'cost.total_cost_usd');
  if (custo) partes.push('$' + custo.toFixed(2));

  var estilo = g(d, 'output_style.name');
  if (estilo && estilo !== 'default') partes.push(estilo);

  return partes.join(' │ ');
}

var buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (c) { buf += c; });
process.stdin.on('end', function () {
  var d = {};
  try { d = JSON.parse(buf.replace(/^﻿/, '') || '{}'); } catch (e) {}
  process.stdout.write(render(d) + '\n');
});
