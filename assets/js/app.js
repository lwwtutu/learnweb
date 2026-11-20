/* JavaScript 系统学习站点 —— 应用主逻辑 */
(function () {
  'use strict';

  const DATA = window.COURSE_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const view = $('#view');
  const docWrap = $('#docWrap');
  const pageToc = $('#pageToc');
  const sideNav = $('#sideNav');
  const doneBtn = $('#doneBtn');
  const toastEl = $('#toast');
  const readProgress = $('#readProgress');

  if (!DATA || !DATA.parts || !DATA.parts.length) {
    view.innerHTML = '<div class="content"><h1 class="page-title">内容尚未构建</h1><p class="page-lead">请在项目目录执行 <code class="inline">node build.js</code> 生成内容数据后刷新页面。</p></div>';
    return;
  }

  // ---------- 数据索引 ----------
  const parts = DATA.parts;
  const chapters = [];
  parts.forEach((p) => {
    p.chapters.forEach((c, i) => {
      chapters.push(Object.assign({}, c, {
        partId: p.id,
        partTitle: p.title,
        partRange: p.range,
        partOrder: p.order,
        partDesc: p.desc,
        seq: p.order + '.' + (i + 1),   // 篇内序号，如 1.8
      }));
    });
  });
  const byNo = new Map(chapters.map((c) => [c.no, c]));
  const indexOfNo = new Map(chapters.map((c, i) => [c.no, i]));
  const firstOf = (p) => (p.chapters[0] ? p.chapters[0].no : 0);

  // ---------- 本地存储 ----------
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('jsweb.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('jsweb.' + k, JSON.stringify(v)); } catch (e) {} },
  };
  let done = new Set(LS.get('done', []));
  // 首次进入默认只展开第一篇，其余折叠，避免左侧一屏塞满目录
  let collapsed = new Set(LS.get('collapsed', null) || parts.slice(1).map((p) => p.id));
  const saveDone = () => LS.set('done', [...done]);
  const saveCollapsed = () => LS.set('collapsed', [...collapsed]);

  // ---------- 阅读外观（主题风格 / 字号 / 行距 / 宽度） ----------
  const THEMES = {
    warm: { dark: false, label: '暖纸橙' },
    slate: { dark: false, label: '石墨靛' },
    forest: { dark: false, label: '森绿' },
    ocean: { dark: false, label: '海蓝' },
    rose: { dark: false, label: '玫瑰' },
    midnight: { dark: true, label: '深夜' },
  };
  const DEFAULT_APPEARANCE = { theme: 'warm', ink: 'auto', codeBg: 'dark', codeInk: 'default', font: 'm', leading: 'normal', width: 'normal' };
  let appearance = Object.assign({}, DEFAULT_APPEARANCE, LS.get('appearance', {}));
  // 旧版设置迁移：把「背景色 / 字色 / 主题色」三组旧字段折算成一套主题
  if (!THEMES[appearance.theme]) {
    const legacyBg = { dark: 'midnight', paper: 'warm', mint: 'forest', sky: 'ocean', gray: 'slate', white: 'warm' };
    appearance.theme = legacyBg[appearance.bg] || 'warm';
  }
  delete appearance.bg;
  delete appearance.tone;
  delete appearance.dark;
  delete appearance.scheme;
  // 注意：ink 必须保留，旧版本里非法的取值由下面这行校验纠正，不能在这里删掉
  if (!/^(auto|black|gray|brown|navy)$/.test(appearance.ink)) appearance.ink = 'auto';
  if (!/^(dark|black|navy|light)$/.test(appearance.codeBg)) appearance.codeBg = 'dark';
  if (!/^(default|bright|soft|mono)$/.test(appearance.codeInk)) appearance.codeInk = 'default';
  if (!/^(s|m|l|xl)$/.test(appearance.font)) appearance.font = 'm';
  if (!/^(compact|normal|relaxed)$/.test(appearance.leading)) appearance.leading = 'normal';
  if (!/^(narrow|normal|wide)$/.test(appearance.width)) appearance.width = 'normal';
  // 支持用 ?theme=forest 这类链接直接指定主题（分享 / 预览用）
  const urlTheme = new URLSearchParams(location.search).get('theme');
  if (urlTheme && THEMES[urlTheme]) appearance.theme = urlTheme;
  const settingsPanel = $('#settingsPanel');

  function applyAppearance() {
    const root = document.documentElement;
    root.setAttribute('data-theme', appearance.theme);
    root.setAttribute('data-dark', THEMES[appearance.theme].dark ? 'true' : 'false');
    if (appearance.ink === 'auto') root.removeAttribute('data-ink');
    else root.setAttribute('data-ink', appearance.ink);
    root.setAttribute('data-code-bg', appearance.codeBg);
    root.setAttribute('data-code-ink', appearance.codeInk);
    root.setAttribute('data-font', appearance.font);
    root.setAttribute('data-leading', appearance.leading);
    root.setAttribute('data-width', appearance.width);
    LS.set('appearance', appearance);
    $$('[data-group]', settingsPanel).forEach((group) => {
      $$('button[data-val]', group).forEach((b) => {
        b.classList.toggle('active', b.dataset.val === appearance[group.dataset.group]);
      });
    });
  }
  applyAppearance();

  const settingsBody = $('.settings-body', settingsPanel);
  function updatePanelScrollHint() {
    if (!settingsBody || settingsPanel.hidden) return;
    settingsBody.classList.toggle('can-scroll', settingsBody.scrollHeight - settingsBody.clientHeight > 2);
  }
  $('#settingsBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.hidden = !settingsPanel.hidden;
    if (!settingsPanel.hidden && settingsBody) settingsBody.scrollTop = 0;
    updatePanelScrollHint();
  });
  window.addEventListener('resize', updatePanelScrollHint);
  settingsPanel.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-val]');
    if (!btn) return;
    appearance[btn.closest('[data-group]').dataset.group] = btn.dataset.val;
    applyAppearance();
    updatePanelScrollHint();
  });
  $('#settingsReset').addEventListener('click', () => {
    appearance = Object.assign({}, DEFAULT_APPEARANCE);
    applyAppearance();
    toast('已恢复默认外观');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#settingsPanel') && !e.target.closest('#settingsBtn')) settingsPanel.hidden = true;
  });
  $('#themeBtn').addEventListener('click', () => {
    if (THEMES[appearance.theme].dark) {
      appearance.theme = THEMES[LS.get('lastLightTheme', 'warm')] ? LS.get('lastLightTheme', 'warm') : 'warm';
    } else {
      LS.set('lastLightTheme', appearance.theme);
      appearance.theme = 'midnight';
    }
    applyAppearance();
    toast('已切换到「' + THEMES[appearance.theme].label + '」主题');
  });

  // ---------- 侧边栏收起 ----------
  function applySidebarCollapsed(v) {
    document.body.classList.toggle('sidebar-collapsed', v);
    LS.set('sidebarCollapsed', v);
    var exp = $('#sideExpandBtn');
    if (exp) exp.setAttribute('aria-label', v ? '展开目录' : '收起目录');
  }
  applySidebarCollapsed(LS.get('sidebarCollapsed', false));
  const expandBtn = $('#sideExpandBtn');
  if (expandBtn) expandBtn.addEventListener('click', () => applySidebarCollapsed(false));
  $('#sideCollapseBtn').addEventListener('click', () => applySidebarCollapsed(true));

  // ---------- 工具 ----------
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }
  window.toast = toast;   // 供笔记模块复用同一个轻提示
  function esc(s) { return window.MD.escapeHtml(String(s == null ? '' : s)); }
  function icon(path) { return '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true">' + path + '</svg>'; }
  const ICON = {
    chev: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    arrowL: '<path d="M15 5l-7 7 7 7"/>',
    arrowR: '<path d="M9 5l7 7-7 7"/>',
    play: '<path d="M7 4l12 8-12 8z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    download: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
    upload: '<path d="M12 20V10M8 14l4-4 4 4M5 5h14"/>',
  };

  // 顶栏与侧栏底部的导航高亮
  function setNavActive(kind) {
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === kind));
  }

  function markNav(no) {
    $$('.nav-ch', sideNav).forEach((a) => {
      const n = Number(a.dataset.no);
      a.classList.toggle('active', n === no);
      a.classList.toggle('done', done.has(n));
    });
    const active = $('.nav-ch.active', sideNav);
    if (active && active.scrollIntoView) {
      const box = active.getBoundingClientRect();
      const navBox = sideNav.getBoundingClientRect();
      if (box.top < navBox.top || box.bottom > navBox.bottom) active.scrollIntoView({ block: 'center' });
    }
    updateProgress();
  }

  function updateProgress() {
    const total = chapters.length;
    const n = chapters.filter((c) => done.has(c.no)).length;
    $('#progressText').textContent = n + ' / ' + total;
    $('#progressFill').style.width = (total ? (n / total) * 100 : 0) + '%';
    updatePartCounts();
  }

  // 每篇的完成度：3/11 这种形式，整篇学完时高亮
  function updatePartCounts() {
    parts.forEach((p) => {
      const el = $('.part-count[data-count="' + p.id + '"]', sideNav);
      if (!el) return;
      const n = p.chapters.filter((c) => done.has(c.no)).length;
      el.textContent = n + '/' + p.chapters.length;
      const wrap = el.closest('.nav-part');
      if (wrap) wrap.classList.toggle('part-done', p.chapters.length > 0 && n === p.chapters.length);
    });
    const nAll = chapters.filter((c) => done.has(c.no)).length;
    $$('[data-done-total]').forEach((el) => { el.textContent = nAll; });
    $$('.part-card').forEach((card) => {
      const id = card.dataset.part;
      const p = parts.find((x) => x.id === id);
      if (!p) return;
      const n = p.chapters.filter((c) => done.has(c.no)).length;
      card.classList.toggle('is-done', p.chapters.length > 0 && n === p.chapters.length);
      const foot = $('.pc-foot [data-count-of]', card);
      if (foot) foot.textContent = '已完成 ' + n + '/' + p.chapters.length;
    });
  }

  function toggleDone(no) {
    if (done.has(no)) { done.delete(no); toast('已取消「已学」标记'); }
    else { done.add(no); toast('已标记为学完 ✓'); }
    saveDone();
    updateProgress();
    const link = $('.nav-ch[data-no="' + no + '"]', sideNav);
    if (link) link.classList.toggle('done', done.has(no));
    syncDoneBtn(no);
  }

  function syncDoneBtn(no) {
    if (!doneBtn.hidden && Number(doneBtn.dataset.no) === no) {
      const isDone = done.has(no);
      doneBtn.classList.toggle('is-done', isDone);
      $('span', doneBtn).textContent = isDone ? '已学完' : '标记已学';
    }
  }

  // ---------- 侧边栏 ----------
  function renderSidebar() {
    sideNav.innerHTML = parts.map((p) => {
      const isCollapsed = collapsed.has(p.id);
      const chs = p.chapters.map((c, i) =>
        '<a class="nav-ch' + (done.has(c.no) ? ' done' : '') + '" href="#/ch/' + c.no + '" data-no="' + c.no + '" title="原笔记第 ' + c.no + ' 章" data-search="' + esc((c.title + ' ' + c.summary + ' ' + c.points.join(' ')).toLowerCase()) + '">' +
          '<span class="ch-no">' + esc(p.order + '.' + (i + 1)) + '</span>' +
          '<span class="ch-title">' + esc(c.title) + '</span>' +
          '<svg viewBox="0 0 24 24" class="icon ch-check" aria-hidden="true">' + ICON.check + '</svg>' +
        '</a>'
      ).join('');
      return '<div class="nav-part' + (isCollapsed ? ' collapsed' : '') + '" data-part="' + p.id + '">' +
        '<button class="nav-part-head" aria-expanded="' + !isCollapsed + '">' +
          '<span class="part-no">' + String(p.order).padStart(2, '0') + '</span>' +
          '<span class="part-title">' + esc(p.title) + '</span>' +
          '<span class="part-count" data-count="' + p.id + '">0/' + p.chapters.length + '</span>' +
          '<svg viewBox="0 0 24 24" class="icon chev" aria-hidden="true">' + ICON.chev + '</svg>' +
        '</button>' +
        '<div class="nav-chapters">' + chs + '</div>' +
      '</div>';
    }).join('');
    updateProgress();
  }

  sideNav.addEventListener('click', (e) => {
    const head = e.target.closest('.nav-part-head');
    if (!head) return;
    const wrap = head.closest('.nav-part');
    const id = wrap.dataset.part;
    wrap.classList.toggle('collapsed');
    head.setAttribute('aria-expanded', String(!wrap.classList.contains('collapsed')));
    if (wrap.classList.contains('collapsed')) collapsed.add(id); else collapsed.delete(id);
    saveCollapsed();
  });

  function expandPart(partId) {
    const wrap = $('.nav-part[data-part="' + partId + '"]', sideNav);
    if (!wrap) return;
    if (wrap.classList.contains('collapsed')) {
      wrap.classList.remove('collapsed');
      $('.nav-part-head', wrap).setAttribute('aria-expanded', 'true');
      collapsed.delete(partId);
      saveCollapsed();
    }
  }

  function setAllCollapsed(v) {
    collapsed = v ? new Set(parts.map((p) => p.id)) : new Set();
    saveCollapsed();
    $$('.nav-part', sideNav).forEach((w) => {
      w.classList.toggle('collapsed', v);
      $('.nav-part-head', w).setAttribute('aria-expanded', String(!v));
    });
  }
  $('#expandAll').addEventListener('click', () => setAllCollapsed(false));
  $('#collapseAll').addEventListener('click', () => setAllCollapsed(true));

  // ---------- 移动端侧栏 ----------
  function closeSidebar() { document.body.classList.remove('sidebar-open'); }
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
  $('#sidebarMask').addEventListener('click', closeSidebar);
  sideNav.addEventListener('click', (e) => { if (e.target.closest('.nav-ch')) closeSidebar(); });
  $$('.foot-link').forEach((a) => a.addEventListener('click', closeSidebar));
  $('.brand').addEventListener('click', closeSidebar);

  // ---------- 右侧本页目录 ----------
  let tocScrollHandler = null;
  function buildToc(headings) {
    if (tocScrollHandler) { window.removeEventListener('scroll', tocScrollHandler); tocScrollHandler = null; }
    if (headings.length < 2) {
      pageToc.hidden = true;
      pageToc.innerHTML = '';
      docWrap.classList.remove('has-toc');
      return;
    }
    docWrap.classList.add('has-toc');
    pageToc.hidden = false;
    pageToc.innerHTML = '<div class="toc-title">本页目录 · ' + headings.length + '</div>' +
      headings.map((h) => '<button class="toc-item" data-toc="' + h.id + '">' + esc(h.text) + '</button>').join('');

    const links = $$('.toc-item', pageToc);
    const items = headings.map((h) => ({ id: h.id, el: document.getElementById(h.id) })).filter((x) => x.el);

    // 滚动高亮：取「已经滚过顶栏的那一节」为当前节，比 IntersectionObserver 更稳
    tocScrollHandler = () => {
      const line = window.scrollY + 120;
      let active = items.length ? items[0].id : null;
      items.forEach((it) => {
        const top = it.el.getBoundingClientRect().top + window.scrollY;
        if (top <= line) active = it.id;
      });
      links.forEach((a) => a.classList.toggle('on', a.dataset.toc === active));
    };
    window.addEventListener('scroll', tocScrollHandler, { passive: true });
    tocScrollHandler();
  }

  // ---------- 公共片段 ----------
  function gapHtml(after) {
    return (DATA.gaps || []).filter((g) => g.after === after).map((g) =>
      '<div class="road-gap">' +
        '<span class="gap-range">' + esc(g.range) + '</span>' +
        '<div class="gap-body"><strong>' + esc(g.title) + '</strong><small>笔记未覆盖 · ' + esc(g.note) + '（不设学习页）</small></div>' +
      '</div>'
    ).join('');
  }

  function partCard(p) {
    const nDone = p.chapters.filter((c) => done.has(c.no)).length;
    const isAll = p.chapters.length > 0 && nDone === p.chapters.length;
    const chips = p.chapters.slice(0, 5).map((c, i) =>
      '<a class="pc-chip' + (done.has(c.no) ? ' done' : '') + '" href="#/ch/' + c.no + '" title="' + esc(c.summary) + '">' +
        '<b>' + esc(p.order + '.' + (i + 1)) + '</b>' + esc(c.title) +
      '</a>'
    ).join('');
    const more = p.chapters.length > 5
      ? '<a class="pc-chip more" href="#/roadmap" title="还有 ' + (p.chapters.length - 5) + ' 章，去学习路线看全部">+' + (p.chapters.length - 5) + '</a>'
      : '';
    return '<article class="part-card' + (isAll ? ' is-done' : '') + '" data-part="' + p.id + '">' +
      '<div class="pc-top">' +
        '<span class="pc-num">' + String(p.order).padStart(2, '0') + '</span>' +
        '<span class="pc-range">课次 ' + esc(p.range) + '</span>' +
        '<svg class="pc-done" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON.check + '</svg>' +
      '</div>' +
      '<h3><a href="#/ch/' + firstOf(p) + '">' + esc(p.title) + '</a></h3>' +
      '<p>' + esc(p.desc) + '</p>' +
      '<div class="pc-chips">' + chips + more + '</div>' +
      '<div class="pc-foot">' +
        '<span>' + p.chapters.length + ' 章</span>' +
        '<span data-count-of>已完成 ' + nDone + '/' + p.chapters.length + '</span>' +
        '<a class="go" href="#/ch/' + firstOf(p) + '">进入 →</a>' +
      '</div>' +
    '</article>';
  }

  function pathStep(idx, title, desc, ids) {
    const links = ids.map((id) => parts.find((p) => p.id === id)).filter(Boolean)
      .map((p) => '<a href="#/ch/' + firstOf(p) + '">' + esc(p.title) + '</a>').join('');
    return '<div class="path-step">' +
      '<div class="idx">PART ' + idx + '</div>' +
      '<h4>' + esc(title) + '</h4>' +
      '<p>' + esc(desc) + '</p>' +
      '<div class="chips">' + links + '</div>' +
    '</div>';
  }

  // ---------- 笔记 ----------
  function mountNotes(page, title) {
    if (!window.Notes) return;
    const host = $('.notes-host[data-page="' + page + '"]', view);
    if (host) window.Notes.mount(host, page, title);
  }

  // ---------- 首页 ----------
  function renderHome() {
    const total = chapters.length;
    const nDone = chapters.filter((c) => done.has(c.no)).length;
    const pct = total ? Math.round((nDone / total) * 100) : 0;
    const lastNo = LS.get('last', null);
    const cont = lastNo !== null && byNo.get(lastNo) ? byNo.get(lastNo) : chapters[0];

    setNavActive('home');
    doneBtn.hidden = true;

    const heroCode =
      '<div class="hero-code">' +
        '<div class="code-block">' +
          '<div class="code-toolbar"><span class="code-lang">js</span></div>' +
          '<pre><code><span class="tok-com">// 从第一行控制台代码，走到组件封装</span>\n' +
'<span class="tok-kw">const</span> stages = [<span class="tok-str">\'语法\'</span>, <span class="tok-str">\'DOM\'</span>, <span class="tok-str">\'ES6\'</span>, <span class="tok-str">\'异步\'</span>];\n\n' +
'stages.<span class="tok-fn">forEach</span>((stage, i) =&gt; {\n' +
'  console.<span class="tok-fn">log</span>(<span class="tok-str">`${i + 1}. ${stage}`</span>);\n' +
'});</code></pre>' +
        '</div>' +
      '</div>';

    view.innerHTML = '<div class="home">' +
      '<section class="hero">' +
        '<div class="hero-grid"></div>' +
        '<div class="hero-inner">' +
          '<div>' +
            '<div class="hero-badge"><i>JS</i> ' + parts.length + ' 篇 · ' + total + ' 章 · 课次 001–199</div>' +
            '<h1>把 JavaScript<br><span class="hl">学成一条线</span></h1>' +
            '<p class="sub">按课程素材的原始顺序重排，从第一行控制台代码一路走到异步请求与组件封装。每一章只保留结论、规则与最小示例，按顺序读完即可建立完整知识结构。</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-primary" href="#/ch/' + cont.no + '">' + icon(ICON.play) + (lastNo !== null && byNo.get(lastNo) ? '继续第 ' + cont.no + ' 章' : '从第 0 章开始') + '</a>' +
              '<a class="btn btn-ghost" href="#/roadmap">' + icon(ICON.arrowR) + '查看完整路线</a>' +
              '<span class="note">建议每天 2–3 章 · 共 ' + total + ' 章</span>' +
            '</div>' +
            '<div class="hero-stats">' +
              '<div><strong>' + parts.length + '</strong><span>学习篇章</span></div>' +
              '<div><strong>' + total + '</strong><span>精炼章节</span></div>' +
              '<div><strong>001–199</strong><span>课次范围</span></div>' +
              '<div><strong data-done-total>' + nDone + '</strong><span>已学完（' + pct + '%）</span></div>' +
            '</div>' +
          '</div>' +
          heroCode +
        '</div>' +
      '</section>' +

      '<section class="section-block" id="parts">' +
        '<div class="section-head">' +
          '<div><h2>篇章目录</h2><p>共 ' + parts.length + ' 篇、' + total + ' 章。点标题进入本篇第一章，点下面任意章节名可直接跳到那一章。</p></div>' +
          '<div class="aside">已学完 <b data-done-total>' + nDone + '</b> / ' + total + ' 章</div>' +
        '</div>' +
        '<div class="part-grid">' + parts.map(partCard).join('') + '</div>' +
      '</section>' +

      '<section class="section-block" id="path" style="margin-top:44px">' +
        '<div class="section-head"><div><h2>四段式学习路径</h2><p>按能力递进拆成四段，每一段都有明确的目标，学完再往下走。</p></div></div>' +
        '<div class="path">' +
          pathStep('01', '语法与流程', '变量、类型、运算符、分支与循环——所有后续内容的地基，务必亲手敲一遍。', ['p1', 'p2']) +
          pathStep('02', '浏览器三件套', '函数与作用域、引用类型、BOM、DOM 与事件，从这里开始能操作真实页面。', ['p3', 'p4', 'p5', 'p6', 'p7']) +
          pathStep('03', 'ES6 与面向对象', '解构、模板字符串、class、继承与原型，把代码组织成可维护的结构。', ['p8', 'p9']) +
          pathStep('04', '异步与工具库', 'Promise、async/await、前后端交互，最后用 jQuery 收尾看清封装思路。', ['p10', 'p11']) +
        '</div>' +
      '</section>' +

      '<section class="section-block" id="tips" style="margin-top:44px">' +
        '<div class="section-head"><div><h2>怎么用这个站点</h2><p>三条建议，能帮你少走一些弯路。</p></div></div>' +
        '<div class="tips-grid">' +
          '<div class="tip-card"><div class="ico">01</div><h4>按顺序读</h4><p>左侧目录即学习顺序。每章开头是「本章速记」，正文按概念引入的先后展开，右侧目录可跳到任意小节。</p></div>' +
          '<div class="tip-card"><div class="ico">02</div><h4>亲手跑一遍</h4><p>每个代码块都能点「运行」，直接在隔离沙箱里看到 console 输出；也可以去练习场自由试。</p></div>' +
          '<div class="tip-card"><div class="ico">03</div><h4>留下进度与笔记</h4><p>学完一章点右上角「标记已学」；每个页面底部都能写笔记，进度与笔记都保存在本机。</p></div>' +
        '</div>' +
      '</section>' +

      '<section class="section-block" id="my-notes" style="margin-top:44px">' +
        '<div class="section-head">' +
          '<div><h2>我的笔记</h2><p>首页与每一章都有各自的笔记区，学完随手记，比回头翻正文快。全部笔记可在「我的笔记」页统一查看。</p></div>' +
          '<div class="aside"><a href="#/notes">查看全部笔记 →</a></div>' +
        '</div>' +
        '<div class="notes-host" data-page="home"></div>' +
      '</section>' +
    '</div>';

    mountNotes('home', '首页 · 我的笔记');

    buildToc([]);
    window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
    updatePartCounts();
  }

  // ---------- 路线图 ----------
  function renderRoadmap() {
    setNavActive('roadmap');
    doneBtn.hidden = true;
    let html = '<div class="content">' +
      '<div class="eyebrow">Course Map</div>' +
      '<h1 class="page-title">完整学习路线</h1>' +
      '<p class="page-lead">学习顺序以素材目录 001–199 的先后为准，再按笔记的大章节归并成 ' + parts.length + ' 篇。章号沿用笔记原始编号，因此会出现跳号——这些位置对应笔记中尚未编写的章节。</p>' +
      '<div class="map-note"><strong>关于跳号：</strong>第 79–89 章（正则表达式、this 指向）、第 126–132 章（cookie、jsonp、闭包）以及 Bootstrap / Sass 相关课次，笔记中标注为占位或未覆盖，本站不生成空页面，而是在下方按课次位置如实标出，保证 001 → 199 的顺序不断线。</div>';

    parts.forEach((p) => {
      html += '<h2 class="section-title">' + esc(p.title) + '</h2>' +
        '<p class="section-sub">课次 ' + esc(p.range) + ' · ' + p.chapters.length + ' 章 · 第 ' + p.chapters[0].no + '–' + p.chapters[p.chapters.length - 1].no + ' 章</p>' +
        '<div class="table-wrap"><table class="road-table"><thead><tr><th>序号</th><th>原章号</th><th>标题</th><th>课次</th><th>状态</th></tr></thead><tbody>';
      p.chapters.forEach((c, i) => {
        html += '<tr><td><code>' + esc(p.order + '.' + (i + 1)) + '</code></td><td>' + String(c.no).padStart(2, '0') + '</td>' +
          '<td><a href="#/ch/' + c.no + '">' + esc(c.title) + '</a></td>' +
          '<td><code>' + esc(c.lessons) + '</code></td>' +
          '<td>' + (done.has(c.no) ? '<span class="status-ok">已学完</span>' : '<span class="status-todo">未开始</span>') + '</td></tr>';
      });
      html += '</tbody></table></div>' + gapHtml(p.order);
    });
    html += '<div class="notes-host" data-page="roadmap"></div>' + '</div>';
    view.innerHTML = html;
    mountNotes('roadmap', '学习路线');
    buildToc([]);
    window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
  }

  // ---------- 章节页 ----------
  function renderChapter(no) {
    const c = byNo.get(no);
    if (!c) {
      setNavActive('');
      doneBtn.hidden = true;
      view.innerHTML = '<div class="content"><h1 class="page-title">没有找到这一章</h1><p class="page-lead"><a class="btn btn-ghost" href="#/home">返回首页</a></p></div>';
      buildToc([]);
      return;
    }

    const idx = indexOfNo.get(no);
    const prev = idx > 0 ? chapters[idx - 1] : null;
    const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;

    doneBtn.hidden = false;
    doneBtn.dataset.no = String(no);
    syncDoneBtn(no);
    setNavActive('');

    const points = c.points.length
      ? '<div class="points-box"><div class="points-label">' + icon(ICON.bolt) + '本章速记</div>' +
        '<div class="points-grid">' + c.points.map((p) => '<div class="point"><span class="dot"></span><span>' + esc(p) + '</span></div>').join('') + '</div></div>'
      : '';

    // 正文渲染 + 提取小节标题（供右侧目录使用）
    const proseHtml = window.MD.render(c.body);
    const headings = [];
    const hRe = /<h([34]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
    let hm;
    while ((hm = hRe.exec(proseHtml)) !== null) {
      const text = hm[3].replace(/<[^>]+>/g, '').trim();
      if (text) headings.push({ id: hm[2], text: text });
    }

    const chars = String(c.body || '').replace(/\s+/g, '').length;
    const minutes = Math.max(3, Math.round(chars / 350));

    view.innerHTML = '<div class="content">' +
      '<article class="chapter">' +
        '<header class="chapter-head">' +
          '<span class="kicker">第 ' + String(c.partOrder).padStart(2, '0') + ' 篇 · ' + esc(c.partTitle) + '</span>' +
          '<h1><span class="chapter-seq">' + esc(c.seq) + '</span>' + esc(c.title) + '</h1>' +
          '<p class="lede">' + esc(c.summary) + '</p>' +
          '<div class="meta-row">' +
            '<span class="meta-chip">原章号 <b>' + String(c.no).padStart(2, '0') + '</b></span>' +
            '<span class="meta-chip">课次 <b>' + esc(c.lessons) + '</b></span>' +
            '<span class="meta-chip">约 <b>' + minutes + ' 分钟</b></span>' +
            '<span class="meta-chip"><b>' + c.points.length + '</b> 个要点</span>' +
            '<span class="meta-chip"><b>' + headings.length + '</b> 个小节</span>' +
          '</div>' +
        '</header>' +
        points +
        '<div class="prose">' + proseHtml + '</div>' +
        '<nav class="chapter-nav">' +
          (prev ? '<a class="cnav prev" href="#/ch/' + prev.no + '"><small>← 上一章 · 第 ' + prev.no + ' 章</small><strong>' + esc(prev.title) + '</strong></a>' : '<div class="cnav empty"></div>') +
          (next ? '<a class="cnav next" href="#/ch/' + next.no + '"><small>下一章 · 第 ' + next.no + ' 章 →</small><strong>' + esc(next.title) + '</strong></a>' : '<div class="cnav empty"></div>') +
        '</nav>' +
      '</article>' +
      '<div class="notes-host" data-page="ch/' + no + '"></div>' +
    '</div>';

    mountNotes('ch/' + no, '第 ' + no + ' 章 · ' + c.title);
    buildToc(headings);
    LS.set('last', no);
    expandPart(c.partId);
    markNav(no);
    window.scrollTo(0, 0);
    readProgress.hidden = false;
    readProgress.style.width = '0%';
  }

  // ---------- 练习场 ----------
  const DEMO = [
    '// 在这里自由写 JavaScript，点「运行」查看输出',
    'const user = { name: "kerwin", age: 18 }',
    'const { name, age } = user',
    'console.log(name, age)',
    '',
    'const nums = [3, 1, 4, 1, 5]',
    'console.log([...new Set(nums)].sort())',
    'console.log("平方:", nums.map(n => n * n).join(", "))',
  ].join('\n');

  function renderPlayground() {
    setNavActive('playground');
    doneBtn.hidden = true;
    view.innerHTML = '<div class="content">' +
      '<div class="eyebrow">Playground</div>' +
      '<h1 class="page-title">代码练习场</h1>' +
      '<p class="page-lead">代码在独立沙箱中执行，不会影响这个页面。用 <code class="inline">console.log()</code> 查看结果；涉及页面元素或网络请求的示例需要放到真实 HTML 里运行。</p>' +
      '<div class="play-grid">' +
        '<textarea class="play-editor" id="playEditor" spellcheck="false" aria-label="代码编辑器"></textarea>' +
        '<div class="play-bar">' +
          '<button class="btn btn-primary" id="playRun">' + icon(ICON.play) + '运行</button>' +
          '<button class="btn btn-ghost" id="playReset">恢复示例</button>' +
          '<button class="btn btn-ghost" id="playClear">清空</button>' +
          '<span class="play-hint">Ctrl / ⌘ + Enter 运行</span>' +
        '</div>' +
        '<div class="play-out" id="playOut"><div class="out-head">Console 输出</div><div class="out-body"><div class="run-line sys">点击「运行」查看结果</div></div></div>' +
      '</div>' +
      '<div class="notes-host" data-page="playground"></div>' +
    '</div>';
    mountNotes('playground', '代码练习场');
    buildToc([]);
    $('#playEditor').value = DEMO;
    const editor = $('#playEditor');
    const out = $('#playOut');
    const doRun = () => window.Runner.run(editor.value, out);
    $('#playRun').addEventListener('click', doRun);
    $('#playReset').addEventListener('click', () => { editor.value = DEMO; editor.focus(); });
    $('#playClear').addEventListener('click', () => { editor.value = ''; editor.focus(); });
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doRun(); }
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart;
        editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = s + 2;
      }
    });
    window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
  }

  // ---------- 我的笔记（汇总页） ----------
  function renderNotesPage() {
    setNavActive('notes');
    doneBtn.hidden = true;

    const all = window.Notes ? window.Notes.all() : [];
    const groups = [];
    const seen = new Map();
    all.slice()
      .sort((a, b) => (b.updated || b.created) - (a.updated || a.created))
      .forEach((n) => {
        if (!seen.has(n.page)) {
          const g = { page: n.page, title: n.pageTitle || n.page, items: [] };
          seen.set(n.page, g);
          groups.push(g);
        }
        seen.get(n.page).items.push(n);
      });

    // 分组顺序跟学习顺序（章号）走，非章节页面排在最后；与导出文件的顺序保持一致
    if (window.Notes && window.Notes.pageMeta) {
      groups.forEach((g) => {
        const meta = window.Notes.pageMeta(g.page, g.title);
        g.meta = meta;
        if (meta.title) g.title = meta.title;
      });
      groups.sort((a, b) => (a.meta.order - b.meta.order) || a.title.localeCompare(b.title, 'zh'));
    }
    groups.forEach((g) => g.items.sort((a, b) => (b.updated || b.created) - (a.updated || a.created)));

    const href = (page) => '#/' + page;
    const body = all.length
      ? groups.map((g) => (
          '<section class="notes-group">' +
            '<div class="ng-head">' +
              '<a class="ng-title" href="' + href(g.page) + '">' + esc(g.title) + '</a>' +
              '<span class="ng-count">' + g.items.length + ' 篇</span>' +
              '<a class="ng-go" href="' + href(g.page) + '">去这一页 →</a>' +
            '</div>' +
            '<div class="notes-list">' +
              g.items.map((n) => (
                '<article class="note-item" data-id="' + n.id + '">' +
                  '<span class="note-avatar" aria-hidden="true">我</span>' +
                  '<div class="note-main">' +
                    '<div class="note-body">' + (window.Notes ? window.Notes.renderText(n.text) : esc(n.text)) + '</div>' +
                    '<div class="note-foot"><time>' + esc(window.Notes.fmtTime(n.updated || n.created)) + '</time>' +
                      '<span class="note-ops"><button type="button" data-del="' + n.id + '">删除</button></span>' +
                    '</div>' +
                  '</div>' +
                '</article>'
              )).join('') +
            '</div>' +
          '</section>'
        )).join('')
      : '<div class="notes-empty big">还没有任何笔记。进入任意一章，页面底部就有「写笔记」入口；如果之前导出过备份，点上面的「导入笔记」就能一次恢复。</div>';

    view.innerHTML = '<div class="content">' +
      '<div class="eyebrow">My Notes</div>' +
      '<h1 class="page-title">我的笔记</h1>' +
      '<p class="page-lead">共 <b>' + all.length + '</b> 篇，分散在 ' + groups.length + ' 个页面。笔记只保存在本机浏览器，换设备或清除站点数据都会丢失，重要的内容建议导出备份，或换设备后用导入恢复。</p>' +
      '<div class="notes-toolbar">' +
        '<span>导出的 Markdown 会带上章号、所属篇与课次；导入同一份文件不会产生重复笔记</span>' +
        '<span class="nt-actions">' +
          '<button type="button" class="btn btn-ghost" id="notesImport">' + icon(ICON.upload) + '导入笔记</button>' +
          (all.length ? '<button type="button" class="btn btn-primary" id="notesExportAll">' + icon(ICON.download) + '导出全部笔记</button>' : '') +
        '</span>' +
      '</div>' +
      '<input type="file" id="notesFile" accept=".md,.markdown,.txt,.json" hidden />' +
      body +
      (all.length ? '<div class="notes-foot-bar"><span>笔记数：' + all.length + '</span><button type="button" class="btn btn-ghost" id="notesClearAll">清空全部笔记</button></div>' : '') +
    '</div>';

    const fileInput = $('#notesFile');
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file || !window.Notes) return;
        window.Notes.importFile(file).then((res) => {
          fileInput.value = '';
          if (res.error) { toast(res.error); return; }
          toast('导入完成：新增 ' + res.added + ' 篇' + (res.skipped ? '，跳过重复 ' + res.skipped + ' 篇' : ''));
          renderNotesPage();
        });
      });
    }

    buildToc([]);
    window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
  }

  view.addEventListener('click', (e) => {
    if (e.target.closest('#notesExportAll') && window.Notes) {
      window.Notes.exportNotes();
      return;
    }
    if (e.target.closest('#notesImport')) {
      const input = $('#notesFile');
      if (input) input.click();
      return;
    }
    const del = e.target.closest('[data-del]');
    if (del && window.Notes) {
      if (!window.confirm('删除这条笔记？删除后不可恢复。')) return;
      window.Notes.remove(del.dataset.del);
      renderNotesPage();
      toast('已删除');
      return;
    }
    if (e.target.id === 'notesClearAll' && window.Notes) {
      if (!window.confirm('清空全部笔记？此操作不可恢复。')) return;
      window.Notes.clear();
      renderNotesPage();
      toast('已清空全部笔记');
    }
  });

  // ---------- 代码块交互（事件委托） ----------
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('代码已复制')).catch(() => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('代码已复制'); } catch (e) { toast('复制失败，请手动选择'); }
      document.body.removeChild(ta);
    }
  }

  view.addEventListener('click', (e) => {
    const tocBtn = e.target.closest('[data-toc]');
    if (tocBtn) {
      const target = document.getElementById(tocBtn.dataset.toc);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const expandBtn = e.target.closest('[data-expand]');
    if (expandBtn) {
      const block = document.getElementById(expandBtn.dataset.expand);
      if (block) {
        const open = block.classList.toggle('expanded');
        expandBtn.textContent = open ? '收起' : '展开全部';
      }
      return;
    }
    const runBtn = e.target.closest('[data-run]');
    if (runBtn) {
      const block = document.getElementById(runBtn.dataset.run);
      if (!block) return;
      const code = $('pre code', block).textContent;
      const out = $('.run-output', block);
      window.Runner.run(code, out);
      return;
    }
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      const block = document.getElementById(copyBtn.dataset.copy);
      if (block) copyText($('pre code', block).textContent);
    }
  });

  // 右侧目录点击
  pageToc.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toc]');
    if (!btn) return;
    const target = document.getElementById(btn.dataset.toc);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ---------- 搜索 ----------
  const searchInput = $('#searchInput');
  const searchPanel = $('#searchPanel');
  let searchHits = [];

  function hideSearch() { searchPanel.hidden = true; }

  function doSearch(q) {
    const key = q.trim().toLowerCase();
    $$('.nav-ch', sideNav).forEach((a) => {
      const show = !key || (a.dataset.search || '').indexOf(key) !== -1;
      a.classList.toggle('nav-hidden', !show);
    });
    $$('.nav-part', sideNav).forEach((p) => {
      const any = $$('.nav-ch:not(.nav-hidden)', p).length > 0;
      p.classList.toggle('nav-hidden', !any);
      // 搜索时临时展开命中篇；清空搜索后恢复用户设定的折叠状态
      if (key && any) p.classList.remove('collapsed');
      else if (!key) p.classList.toggle('collapsed', collapsed.has(p.dataset.part));
    });

    if (!key) { hideSearch(); return; }

    searchHits = chapters.filter((c) => {
      const hay = (c.title + ' ' + c.summary + ' ' + c.points.join(' ') + ' ' + c.body).toLowerCase();
      return hay.indexOf(key) !== -1;
    }).slice(0, 14);

    const hl = (s) => {
      const safe = esc(s);
      const i = safe.toLowerCase().indexOf(key);
      if (i < 0) return safe;
      return safe.slice(0, i) + '<mark>' + safe.slice(i, i + key.length) + '</mark>' + safe.slice(i + key.length);
    };
    searchPanel.innerHTML =
      '<div class="search-count">找到 ' + searchHits.length + ' 章' + (searchHits.length === 14 ? '（仅显示前 14 条）' : '') + '</div>' +
      (searchHits.length
        ? searchHits.map((c) => '<button class="search-hit" data-no="' + c.no + '"><b>' + hl(c.title) + '</b><span>第 ' + c.no + ' 章 · ' + esc(c.partTitle) + ' · ' + esc(c.summary.slice(0, 42)) + '</span></button>').join('')
        : '<div class="search-empty">没有匹配的知识点</div>');
    searchPanel.hidden = false;
  }

  searchInput.addEventListener('input', () => doSearch(searchInput.value));
  searchInput.addEventListener('focus', () => { if (searchInput.value.trim()) doSearch(searchInput.value); });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchInput.value = ''; doSearch(''); searchInput.blur(); }
    if (e.key === 'Enter' && searchHits.length) {
      location.hash = '#/ch/' + searchHits[0].no;
      searchInput.value = ''; doSearch(''); searchInput.blur(); closeSidebar();
    }
  });
  searchPanel.addEventListener('click', (e) => {
    const hit = e.target.closest('.search-hit');
    if (!hit) return;
    location.hash = '#/ch/' + hit.dataset.no;
    searchInput.value = ''; doSearch(''); hideSearch(); closeSidebar();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.side-search') && !e.target.closest('.search-panel')) hideSearch();
  });

  // ---------- 标记已学 ----------
  doneBtn.addEventListener('click', () => {
    const no = Number(doneBtn.dataset.no);
    if (!Number.isNaN(no)) toggleDone(no);
  });

  // ---------- 路由 ----------
  function route() {
    const hash = location.hash || '#/home';
    const m = hash.match(/^#\/ch\/(\d+)$/);
    docWrap.classList.toggle('is-reader', !!m);
    readProgress.hidden = !m;
    if (!m) readProgress.style.width = '0%';
    if (m) renderChapter(Number(m[1]));
    else if (hash.indexOf('#/playground') === 0) renderPlayground();
    else if (hash.indexOf('#/roadmap') === 0) renderRoadmap();
    else if (hash.indexOf('#/notes') === 0) renderNotesPage();
    else renderHome();
    hideSearch();
    closeSidebar();
  }
  window.addEventListener('hashchange', route);

  // 章节阅读进度（整页滚动）
  window.addEventListener('scroll', () => {
    if (readProgress.hidden) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    readProgress.style.width = pct + '%';
  }, { passive: true });

  // ---------- 键盘快捷键 ----------
  document.addEventListener('keydown', (e) => {
    const el = document.activeElement;
    const typing = !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
    if (e.key === '/' && !typing) { e.preventDefault(); searchInput.focus(); return; }
    if (e.key === 'Escape') { closeSidebar(); hideSearch(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const m = (location.hash || '').match(/^#\/ch\/(\d+)$/);
    if (!m) return;
    const idx = indexOfNo.get(Number(m[1]));
    if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); location.hash = '#/ch/' + chapters[idx - 1].no; }
    if (e.key === 'ArrowRight' && idx < chapters.length - 1) { e.preventDefault(); location.hash = '#/ch/' + chapters[idx + 1].no; }
  });

  // ---------- 启动 ----------
  renderSidebar();
  route();
})();
