/* 在隔离 iframe 中执行 JS 代码，收集 console 输出 */
(function (global) {
  'use strict';

  let seq = 0;

  function line(text, kind) {
    const d = document.createElement('div');
    d.className = 'run-line' + (kind ? ' ' + kind : '');
    d.textContent = text;
    return d;
  }

  function makeSrcDoc(code, runId) {
    const safe = JSON.stringify(code).replace(/</g, '\\u003c');
    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>',
      '(function(){',
      '  var ID = ' + JSON.stringify(runId) + ';',
      '  function post(kind, text){ parent.postMessage({ __jsweb: ID, kind: kind, text: text }, "*"); }',
      '  function fmt(v){',
      '    if (typeof v === "string") return v;',
      '    if (v === undefined) return "undefined";',
      '    if (v === null) return "null";',
      '    if (typeof v === "number" || typeof v === "boolean") return String(v);',
      '    if (typeof v === "function") return "[Function " + (v.name || "anonymous") + "]";',
      '    if (v instanceof Error) return v.name + ": " + v.message;',
      '    if (typeof Element !== "undefined" && v instanceof Element) return "<" + v.tagName.toLowerCase() + ">";',
      '    try { return JSON.stringify(v); } catch(e){ return String(v); }',
      '  }',
      '  function emit(kind, args){',
      '    var parts = []; for (var i=0;i<args.length;i++) parts.push(fmt(args[i]));',
      '    post(kind, parts.join(" "));',
      '  }',
      '  ["log","info","debug","warn","error"].forEach(function(k){',
      '    console[k] = function(){ emit(k === "error" || k === "warn" ? "err" : "log", arguments); };',
      '  });',
      '  console.table = function(){ emit("log", arguments); };',
      '  window.alert = function(v){ emit("log", ["[alert] " + fmt(v)]); };',
      '  window.prompt = function(){ return null; };',
      '  window.onerror = function(msg){ post("err", String(msg)); return true; };',
      '  window.addEventListener("unhandledrejection", function(e){ post("err", "Unhandled: " + fmt(e.reason)); });',
      '  var code = ' + safe + ';',
      '  try { new Function(code)(); } catch (e) {',
      '    var msg = (e && e.name ? e.name + ": " : "") + (e && e.message ? e.message : String(e));',
      '    post("err", msg);',
      '    if (/null|undefined|not defined/i.test(msg) && /document|window|localStorage|location|navigator|alert/.test(code)) {',
      '      post("sys", "该示例依赖真实页面元素或浏览器环境，放到 HTML 文件中运行更合适。");',
      '    }',
      '  }',
      '  post("done", "");',
      '})();',
      '<\/script></body></html>',
    ].join('\n');
  }

  /**
   * 执行代码并把输出写进 outEl（内含 .out-body 的元素）
   */
  function run(code, outEl) {
    if (!outEl) return;
    const body = outEl.querySelector('.out-body') || outEl;
    body.innerHTML = '';
    outEl.hidden = false;

    const runId = 'run-' + Date.now() + '-' + (++seq);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', 'code-runner');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    iframe.srcdoc = makeSrcDoc(code, runId);

    let finished = false;
    let gotOutput = false;

    function cleanup() {
      if (finished) return;
      finished = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    function onMessage(e) {
      const d = e.data;
      if (!d || d.__jsweb !== runId) return;
      if (d.kind === 'done') {
        if (!gotOutput) body.appendChild(line('（代码已执行，没有 console 输出）', 'sys'));
        cleanup();
      } else if (d.kind === 'log' || d.kind === 'err' || d.kind === 'sys') {
        gotOutput = true;
        const cls = d.kind === 'err' ? 'err' : d.kind === 'sys' ? 'sys' : '';
        body.appendChild(line(d.text, cls));
      }
    }

    window.addEventListener('message', onMessage);
    const timer = setTimeout(function () {
      if (!finished) {
        body.appendChild(line('执行超时，请检查是否存在死循环或等待中的异步操作。', 'err'));
        cleanup();
      }
    }, 4000);

    document.body.appendChild(iframe);
  }

  global.Runner = { run: run, line: line };
})(window);
