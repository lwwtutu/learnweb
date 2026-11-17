/* 轻量 Markdown 渲染器 —— 只支持内容规范约定的子集 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 只转义 & < >，保留引号以便代码高亮做词法切分
  function escapeCode(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const KEYWORDS = [
    'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
    'switch', 'case', 'break', 'continue', 'new', 'this', 'typeof', 'instanceof',
    'in', 'of', 'class', 'extends', 'super', 'import', 'export', 'from', 'default',
    'async', 'await', 'try', 'catch', 'finally', 'throw', 'delete', 'void',
    'null', 'undefined', 'true', 'false', 'NaN', 'Infinity',
  ];
  const KW_RE = new RegExp('\\b(?:' + KEYWORDS.join('|') + ')\\b');

  function highlight(code, lang) {
    const isJs = lang === 'js' || lang === 'javascript';
    const src = escapeCode(code);
    if (!isJs) return src;

    const tokenRe = new RegExp(
      '(' +
        '\\/\\/[^\\n]*' +                       // 行注释
        '|\\/\\*[\\s\\S]*?\\*\\/' +             // 块注释
        '|`(?:\\\\.|[^`\\\\])*`' +              // 模板字符串
        '|"(?:\\\\.|[^"\\\\])*"' +              // 双引号字符串
        '|\'(?:\\\\.|[^\'\\\\])*\'' +           // 单引号字符串
        '|\\b\\d+(?:\\.\\d+)?\\b' +            // 数字
        '|\\b(?:' + KEYWORDS.join('|') + ')\\b' + // 关键字
        '|\\b[A-Za-z_$][\\w$]*(?=\\s*\\()' +   // 函数调用
        ')',
      'g'
    );

    return src.replace(tokenRe, function (m) {
      let cls = '';
      if (m.indexOf('//') === 0 || m.indexOf('/*') === 0) cls = 'tok-com';
      else if (/^["'`]/.test(m)) cls = 'tok-str';
      else if (/^\d/.test(m)) cls = 'tok-num';
      else if (KW_RE.test(m)) cls = 'tok-kw';
      else cls = 'tok-fn';
      return '<span class="' + cls + '">' + m + '</span>';
    });
  }

  // 行内：行内代码 + 加粗
  function inline(text) {
    const stash = [];
    let s = String(text).replace(/`([^`]+)`/g, function (_, code) {
      stash.push('<code class="inline">' + escapeHtml(code) + '</code>');
      return '\u0000' + (stash.length - 1) + '\u0000';
    });
    s = escapeHtml(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return stash[Number(i)]; });
    return s;
  }

  function isTableSep(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
  }

  function splitRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) { return c.trim(); });
  }

  let uid = 0;
  function render(md) {
    const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 空行
      if (!line.trim()) { i++; continue; }

      // 代码块
      const fence = line.match(/^```\s*([\w-]*)\s*$/);
      if (fence) {
        const lang = (fence[1] || 'text').toLowerCase();
        const code = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
        i++; // 跳过闭合围栏
        const id = 'cb-' + (++uid);
        const canRun = lang === 'js' || lang === 'javascript';
        const isLong = code.length > 16;
        out.push(
          '<div class="code-block' + (isLong ? ' is-long' : '') + '" id="' + id + '">' +
            '<div class="code-toolbar">' +
              '<span class="code-lang">' + escapeHtml(lang) + (isLong ? ' · ' + code.length + ' 行' : '') + '</span>' +
              (isLong ? '<button class="code-btn" data-expand="' + id + '">展开全部</button>' : '') +
              (canRun ? '<button class="code-btn run" data-run="' + id + '"><svg viewBox="0 0 24 24" class="icon"><path d="M7 4l12 8-12 8z"/></svg>运行</button>' : '') +
              '<button class="code-btn" data-copy="' + id + '"><svg viewBox="0 0 24 24" class="icon"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>复制</button>' +
            '</div>' +
            '<pre><code>' + highlight(code.join('\n'), lang) + '</code></pre>' +
            '<div class="run-output" hidden><div class="out-head">Console 输出</div><div class="out-body"></div></div>' +
          '</div>'
        );
        continue;
      }

      // 标题
      const h = line.match(/^(#{3,4})\s+(.+)$/);
      if (h) {
        const level = h[1].length;
        out.push('<h' + level + ' id="h-' + (++uid) + '">' + inline(h[2]) + '</h' + level + '>');
        i++;
        continue;
      }

      // 分隔线
      if (/^\s*---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      // 表格
      if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i]) && lines[i].trim()) {
          rows.push(splitRow(lines[i])); i++;
        }
        let t = '<div class="table-wrap"><table><thead><tr>';
        head.forEach(function (c) { t += '<th>' + inline(c) + '</th>'; });
        t += '</tr></thead><tbody>';
        rows.forEach(function (r) {
          t += '<tr>';
          for (let c = 0; c < head.length; c++) t += '<td>' + inline(r[c] || '') + '</td>';
          t += '</tr>';
        });
        t += '</tbody></table></div>';
        out.push(t);
        continue;
      }

      // 引用 / 提示块
      if (/^>\s?/.test(line)) {
        const quotes = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quotes.push(lines[i].replace(/^>\s?/, '')); i++;
        }
        let type = 'note';
        let tag = '';
        const first = quotes[0] || '';
        if (/^\s*⚠️?/.test(first)) { type = 'warn'; tag = '易错'; quotes[0] = first.replace(/^\s*⚠️?\s*/, ''); }
        else if (/^\s*💡/.test(first)) { type = 'tip'; tag = '提示'; quotes[0] = first.replace(/^\s*💡\s*/, ''); }
        else if (/^\s*🧠/.test(first)) { type = 'note'; tag = '记住'; quotes[0] = first.replace(/^\s*🧠\s*/, ''); }
        let body = '';
        quotes.forEach(function (q) {
          if (q.trim()) body += '<p>' + (body === '' && tag ? '<span class="callout-tag">' + tag + '</span>' : '') + inline(q) + '</p>';
        });
        out.push('<div class="callout ' + type + '">' + body + '</div>');
        continue;
      }

      // 列表
      if (/^\s*(-|\d+\.)\s+/.test(line)) {
        const ordered = /^\s*\d+\.\s+/.test(line);
        const items = [];
        while (i < lines.length && /^\s*(-|\d+\.)\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*(?:-|\d+\.)\s+/, '')); i++;
        }
        const tag = ordered ? 'ol' : 'ul';
        out.push('<' + tag + '>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + tag + '>');
        continue;
      }

      // 普通段落
      const para = [];
      while (i < lines.length && lines[i].trim() &&
             !/^```/.test(lines[i]) && !/^#{3,4}\s/.test(lines[i]) &&
             !/^>\s?/.test(lines[i]) && !/^\s*(-|\d+\.)\s+/.test(lines[i]) &&
             !/^\s*---+\s*$/.test(lines[i]) && !/^\s*\|/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      if (para.length) out.push('<p>' + para.map(inline).join(' ') + '</p>');
      else { out.push('<p>' + inline(line) + '</p>'); i++; }
    }

    return out.join('\n');
  }

  global.MD = { render: render, inline: inline, escapeHtml: escapeHtml, highlight: highlight };
})(window);
