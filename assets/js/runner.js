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
      '  function fmt(v, depth){',
      '    depth = depth || 0;',
      '    if (typeof v === "string") return depth ? JSON.stringify(v) : v;',
      '    if (v === undefined) return "undefined";',
      '    if (v === null) return "null";',
      '    if (typeof v === "number") return Object.is(v, -0) ? "-0" : String(v);',
      '    if (typeof v === "boolean" || typeof v === "bigint") return String(v);',
      '    if (typeof v === "symbol") return v.toString();',
      '    if (typeof v === "function") return "ƒ " + (v.name || "anonymous") + "()";',
      '    if (v instanceof Error) return v.name + ": " + v.message;',
      '    if (typeof Element !== "undefined" && v instanceof Element) return "<" + v.tagName.toLowerCase() + ">";',
      '    if (Array.isArray(v)) {',
      '      if (depth > 3) return "[…]";',
      '      return "[" + v.map(function(x){ return fmt(x, depth + 1); }).join(", ") + "]";',
      '    }',
      '    if (typeof v === "object") {',
      '      if (depth > 3) return "{…}";',
      '      var name = "";',
      '      try { var cn = v.constructor && v.constructor.name; if (cn && cn !== "Object") name = cn + " "; } catch (e) {}',
      '      var ks = Object.keys(v);',
      '      if (!ks.length) return name + "{}";',
      '      return name + "{ " + ks.map(function(k){',
      '        return (/^[A-Za-z_$][\\w$]*$/.test(k) ? k : JSON.stringify(k)) + ": " + fmt(v[k], depth + 1);',
      '      }).join(", ") + " }";',
      '    }',
      '    try { return String(v); } catch (e) { return "[object]"; }',
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
      '    if (e && e.name === "SyntaxError") {',
      '      if (/\\b(?:import|export)\\b/.test(code)) post("sys", "这是 ES 模块语法，需要放在 type=\\"module\\" 的脚本或 .mjs 文件里运行，直接运行会报语法错误。");',
      '      else if (/\\bawait\\b/.test(code)) post("sys", "顶层 await 只允许出现在模块或 async 函数中，这段代码需要放进模块环境才能运行。");',
      '      else post("sys", "这段代码是摘录片段（缺少外层上下文），单独运行不完整，读懂思路即可。");',
      '    } else if (/insecure|SecurityError|sandbox/i.test(msg)) {',
      '      post("sys", "沙箱环境禁用了本地存储、跨域请求等能力，把这段示例放到真实页面里运行即可。");',
      '    } else if (/null|undefined|not defined/i.test(msg) && /document|window|localStorage|location|navigator|alert/.test(code)) {',
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
    let doneSeen = false;
    let idleTimer = null;
    let hardTimer = null;
    // 含定时器 / Promise 的示例，输出本来就会晚到，得等久一点
    const isAsync = /setTimeout|setInterval|requestAnimationFrame|Promise|async\s|await\s|\.then\s*\(|fetch\s*\(|XMLHttpRequest/.test(code);

    function cleanup() {
      if (finished) return;
      finished = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(idleTimer);
      clearTimeout(hardTimer);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    function finish() {
      if (!gotOutput) body.appendChild(line('（代码已执行，没有 console 输出）', 'sys'));
      cleanup();
    }

    // 代码跑完后再等一小段空闲：Promise、setTimeout 这类异步输出往往晚于同步代码
    function scheduleFinish(delay) {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(finish, delay);
    }

    function onMessage(e) {
      const d = e.data;
      if (!d || d.__jsweb !== runId) return;
      if (d.kind === 'done') {
        doneSeen = true;
        // 同步代码立刻收尾；异步代码多等一会儿，等定时器 / Promise 的输出
        scheduleFinish(isAsync ? 6000 : 250);
      } else if (d.kind === 'log' || d.kind === 'err' || d.kind === 'sys') {
        gotOutput = true;
        const cls = d.kind === 'err' ? 'err' : d.kind === 'sys' ? 'sys' : '';
        body.appendChild(line(d.text, cls));
        // 有输出进来就重新计时，等输出停下来再收尾
        if (doneSeen) scheduleFinish(isAsync ? 900 : 300);
      }
    }

    window.addEventListener('message', onMessage);
    hardTimer = setTimeout(function () {
      if (!finished) {
        body.appendChild(line('执行超时：可能存在死循环，或异步操作迟迟没有回调。', 'err'));
        cleanup();
      }
    }, isAsync ? 9000 : 6000);

    document.body.appendChild(iframe);
  }

  global.Runner = { run: run, line: line };
})(window);
