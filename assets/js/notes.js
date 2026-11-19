/* 页面笔记：每个界面一块独立笔记区，支持查看、编写、编辑、删除，数据存本机 */
(function (global) {
  'use strict';

  const KEY = 'jsweb.notes';
  const DRAFT = 'jsweb.notes.draft.';
  const MAX_LEN = 20000;
  const $ = (s, r) => (r || document).querySelector(s);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function toast(msg) {
    if (typeof global.toast === 'function') global.toast(msg);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function fmtTime(ts) {
    const d = new Date(ts || Date.now());
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  // ---------- 存储 ----------
  function readAll() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw.filter((n) => n && n.id && typeof n.text === 'string') : [];
    } catch (e) { return []; }
  }

  function writeAll(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { toast('保存失败：本机存储已满，可先删除几条旧笔记'); return false; }
  }

  function forPage(page) {
    return readAll().filter((n) => n.page === page).sort((a, b) => (b.updated || b.created) - (a.updated || a.created));
  }

  function countOf(page) {
    return readAll().filter((n) => n.page === page).length;
  }

  function add(page, pageTitle, text) {
    const list = readAll();
    const now = Date.now();
    list.push({ id: uid(), page: page, pageTitle: pageTitle, text: text, created: now, updated: now });
    return writeAll(list);
  }

  function update(id, text) {
    const list = readAll();
    const hit = list.find((n) => n.id === id);
    if (!hit) return false;
    hit.text = text;
    hit.updated = Date.now();
    return writeAll(list);
  }

  function remove(id) {
    return writeAll(readAll().filter((n) => n.id !== id));
  }

  function clear() {
    return writeAll([]);
  }

  // ---------- 笔记内容渲染（只支持少量安全语法） ----------
  const SAFE_IMG = /^(https?:\/\/|data:image\/)/i;

  function inlineNote(text) {
    const stash = [];
    let s = String(text).replace(/`([^`]+)`/g, function (_, code) {
      stash.push('<code>' + esc(code) + '</code>');
      return '\u0001' + (stash.length - 1) + '\u0001';
    });
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
      if (!SAFE_IMG.test(url)) return m;
      stash.push('<img class="note-img" src="' + esc(url).replace(/"/g, '&quot;') + '" alt="' + esc(alt) + '" loading="lazy">');
      return '\u0001' + (stash.length - 1) + '\u0001';
    });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\u0001(\d+)\u0001/g, function (_, i) { return stash[Number(i)]; });
    return s;
  }

  function renderText(text) {
    const src = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!src) return '';
    const out = [];
    const lines = src.split('\n');
    let i = 0;
    let para = [];
    const flush = function () {
      if (!para.length) return;
      out.push('<p>' + para.map(inlineNote).join('<br>') + '</p>');
      para = [];
    };
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        flush();
        const code = [];
        i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push('<pre class="note-code"><code>' + esc(code.join('\n')) + '</code></pre>');
        continue;
      }
      if (!line.trim()) { flush(); i++; continue; }
      if (/^\s*[-*]\s+/.test(line)) {
        flush();
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        out.push('<ul>' + items.map((x) => '<li>' + inlineNote(x) + '</li>').join('') + '</ul>');
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        flush();
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        out.push('<ol>' + items.map((x) => '<li>' + inlineNote(x) + '</li>').join('') + '</ol>');
        continue;
      }
      para.push(line);
      i++;
    }
    flush();
    return out.join('');
  }

  // ---------- 视图 ----------
  const ICON = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    pen: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
    bold: '<path d="M7 4h6a4 4 0 0 1 0 8H7zm0 8h7a4 4 0 0 1 0 8H7z"/>',
    code: '<path d="M9 6l-4 6 4 6M15 6l4 6-4 6"/>',
    ul: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>',
    ol: '<path d="M9 6h11M9 12h11M9 18h11M4 5l1.4-.8V8"/><path d="M4 15.2c0-.7.9-1.1 1.5-.7.8.5.4 1.6-.6 2.5H5.2"/>',
    img: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 17l5-4 4 3 3-2 4 4"/>',
  };

  function svg(path, cls) {
    return '<svg viewBox="0 0 24 24" class="icon ' + (cls || '') + '" aria-hidden="true">' + path + '</svg>';
  }

  function listHtml(notes) {
    if (!notes.length) {
      return '<div class="notes-empty">还没有笔记。把这一页的易错点、自己的理解记下来，复习时比翻正文快。</div>';
    }
    return notes.map((n) => (
      '<article class="note-item" data-id="' + n.id + '">' +
        '<span class="note-avatar" aria-hidden="true">我</span>' +
        '<div class="note-main">' +
          '<div class="note-body">' + renderText(n.text) + '</div>' +
          '<div class="note-foot">' +
            '<time datetime="' + new Date(n.updated || n.created).toISOString() + '">' + fmtTime(n.updated || n.created) + '</time>' +
            '<span class="note-ops">' +
              '<button type="button" data-act="edit">编辑</button>' +
              '<button type="button" data-act="del">删除</button>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</article>'
    )).join('');
  }

  /**
   * 在 host 内渲染一块笔记区
   * @param {Element} host 容器
   * @param {string} page 页面标识，如 ch/12、home
   * @param {string} pageTitle 页面标题，存进笔记，便于「我的笔记」页展示
   */
  function mount(host, page, pageTitle) {
    if (!host) return;
    const notes = forPage(page);

    host.classList.add('notes-block');
    host.dataset.page = page;
    host.innerHTML =
      '<div class="notes-bar">' +
        '<button type="button" class="notes-plus" data-act="toggle" aria-label="展开或收起笔记" title="展开 / 收起笔记">' + svg(ICON.plus) + '</button>' +
        '<button type="button" class="notes-count" data-act="toggle">' + notes.length + ' 篇笔记</button>' +
        '<span class="notes-hint">仅保存在本机浏览器</span>' +
        '<button type="button" class="notes-write" data-act="write">' + svg(ICON.pen) + '写笔记</button>' +
      '</div>' +
      '<div class="notes-list" hidden>' + listHtml(notes) + '</div>' +
      '<div class="note-editor" hidden>' +
        '<div class="ne-tools">' +
          '<button type="button" data-md="bold" title="加粗">' + svg(ICON.bold) + '</button>' +
          '<button type="button" data-md="code" title="代码">' + svg(ICON.code) + '</button>' +
          '<button type="button" data-md="ul" title="无序列表">' + svg(ICON.ul) + '</button>' +
          '<button type="button" data-md="ol" title="有序列表">' + svg(ICON.ol) + '</button>' +
          '<button type="button" data-md="img" title="插入图片链接">' + svg(ICON.img) + '</button>' +
          '<span class="ne-tip">支持 **加粗**、`代码`、- 列表、图片链接</span>' +
        '</div>' +
        '<textarea class="ne-input" placeholder="写笔记…" aria-label="笔记内容" maxlength="' + MAX_LEN + '"></textarea>' +
        '<div class="ne-foot">' +
          '<span class="ne-hint">Ctrl / ⌘ + Enter 保存</span>' +
          '<button type="button" class="ne-save" data-act="save">' + svg(ICON.pen) + '保存笔记</button>' +
        '</div>' +
      '</div>';

    const listEl = $('.notes-list', host);
    const editorEl = $('.note-editor', host);
    const input = $('.ne-input', host);
    const countBtn = $('.notes-count', host);
    let editingId = null;

    function refreshList() {
      const arr = forPage(page);
      listEl.innerHTML = listHtml(arr);
      countBtn.textContent = arr.length + ' 篇笔记';
      return arr;
    }

    function openList(open) {
      listEl.hidden = !open;
    }

    function openEditor(text) {
      editorEl.hidden = false;
      openList(false);
      input.value = text || '';
      input.focus();
      input.scrollTop = 0;
    }

    function closeEditor() {
      editorEl.hidden = true;
      editingId = null;
      input.value = '';
    }

    function insert(before, after, placeholder) {
      const s = input.selectionStart;
      const e = input.selectionEnd;
      const val = input.value;
      const sel = val.slice(s, e) || placeholder || '';
      const next = val.slice(0, s) + before + sel + after + val.slice(e);
      input.value = next;
      input.focus();
      input.selectionStart = s + before.length;
      input.selectionEnd = s + before.length + sel.length;
    }

    host.addEventListener('click', function (ev) {
      const btn = ev.target.closest('button');
      if (!btn) return;

      // 工具栏
      if (btn.dataset.md) {
        const kind = btn.dataset.md;
        if (kind === 'bold') insert('**', '**', '加粗文字');
        else if (kind === 'code') insert('`', '`', '代码');
        else if (kind === 'ul') insert('- ', '', '');
        else if (kind === 'ol') insert('1. ', '', '');
        else if (kind === 'img') {
          const url = window.prompt('图片地址（http/https 链接，或 data:image 开头的内联图）');
          if (url && SAFE_IMG.test(url.trim())) {
            const alt = window.prompt('图片说明（可留空）') || '';
            insert('![' + alt + '](' + url.trim() + ')', '', '');
          } else if (url) {
            toast('只支持 http/https 图片地址');
          }
        }
        return;
      }

      const act = btn.dataset.act;
      if (act === 'toggle') {
        if (!forPage(page).length) { editingId = null; openEditor(''); return; }
        openList(listEl.hidden);
        if (!listEl.hidden) editorEl.hidden = true;
        return;
      }
      if (act === 'write') {
        editingId = null;
        let draft = '';
        try { draft = localStorage.getItem(DRAFT + page) || ''; } catch (e) {}
        openEditor(draft);
        return;
      }
      if (act === 'save') {
        const text = input.value.trim();
        if (text.length < 2) { toast('笔记内容太短，再写两句吧'); input.focus(); return; }
        const ok = editingId ? update(editingId, text) : add(page, pageTitle, text);
        if (!ok) return;
        try { localStorage.removeItem(DRAFT + page); } catch (e) {}
        editingId = null;
        input.value = '';
        editorEl.hidden = true;
        refreshList();
        openList(true);
        toast('笔记已保存');
        return;
      }
      if (act === 'edit') {
        const item = btn.closest('.note-item');
        const note = forPage(page).find((n) => n.id === (item && item.dataset.id));
        if (!note) return;
        editingId = note.id;
        openEditor(note.text);
        return;
      }
      if (act === 'del') {
        const item = btn.closest('.note-item');
        if (!item) return;
        if (!window.confirm('删除这条笔记？删除后不可恢复。')) return;
        remove(item.dataset.id);
        refreshList();
        toast('已删除');
        if (!forPage(page).length) openList(false);
      }
    });

    // 草稿：边写边存，避免误刷新丢失
    input.addEventListener('input', function () {
      if (editingId) return;
      try { localStorage.setItem(DRAFT + page, input.value); } catch (e) {}
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        const save = $('.ne-save', host);
        if (save) save.click();
      }
      if (ev.key === 'Escape') { ev.stopPropagation(); }
    });

    if (notes.length) openList(true);
  }

  global.Notes = {
    mount: mount,
    all: readAll,
    countOf: countOf,
    remove: remove,
    clear: clear,
    renderText: renderText,
    fmtTime: fmtTime,
    pageTitleOf: function (page) {
      const hit = readAll().find((n) => n.page === page);
      return hit ? hit.pageTitle : page;
    },
  };
})(window);
