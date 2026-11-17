/* Vue 3 系统学习站点 —— 应用主逻辑
   与 js/ 站点同一套外壳：hash 路由 + 左目录 + 正文 + 右小节目录
   页面：首页 / 章节 / 学习路线 / 速查手册 / 风格设计 */
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
    view.innerHTML = '<div class="content"><h1 class="page-title">内容尚未构建</h1><p class="page-lead">请检查 <code class="inline">assets/data/</code> 下的内容文件是否完整。</p></div>';
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
        seq: p.order + '.' + (i + 1),   // 篇内序号，如 3.2
      }));
    });
  });
  const byNo = new Map(chapters.map((c) => [c.no, c]));
  const indexOfNo = new Map(chapters.map((c, i) => [c.no, i]));
  const firstOf = (p) => (p.chapters[0] ? p.chapters[0].no : 0);

  // ---------- 本地存储 ----------
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('vue3web.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('vue3web.' + k, JSON.stringify(v)); } catch (e) {} },
  };
  let done = new Set(LS.get('done', []));
  // 首次进入只展开第一篇，其余折叠，避免左侧一屏塞满目录
  let collapsed = new Set(LS.get('collapsed', null) || parts.slice(1).map((p) => p.id));
  const saveDone = () => LS.set('done', [...done]);
  const saveCollapsed = () => LS.set('collapsed', [...collapsed]);

  // ---------- 阅读外观 ----------
  const THEMES = {
    vue: { dark: false, label: '纸白绿' },
    warm: { dark: false, label: '暖纸橙' },
    slate: { dark: false, label: '石墨靛' },
    ocean: { dark: false, label: '海蓝' },
    rose: { dark: false, label: '玫瑰' },
    forest: { dark: false, label: '森绿' },
    midnight: { dark: true, label: '深夜' },
  };
  const DEFAULT_APPEARANCE = { theme: 'vue', ink: 'auto', codeBg: 'dark', codeInk: 'default', font: 'm', leading: 'normal', width: 'normal' };
  let appearance = Object.assign({}, DEFAULT_APPEARANCE, LS.get('appearance', {}));
  if (!THEMES[appearance.theme]) appearance.theme = 'vue';
  if (!/^(auto|black|gray|brown|navy)$/.test(appearance.ink)) appearance.ink = 'auto';
  if (!/^(dark|black|navy|light)$/.test(appearance.codeBg)) appearance.codeBg = 'dark';
  if (!/^(default|bright|soft|mono)$/.test(appearance.codeInk)) appearance.codeInk = 'default';
  if (!/^(s|m|l|xl)$/.test(appearance.font)) appearance.font = 'm';
  if (!/^(compact|normal|relaxed)$/.test(appearance.leading)) appearance.leading = 'normal';
  if (!/^(narrow|normal|wide)$/.test(appearance.width)) appearance.width = 'normal';
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
      appearance.theme = THEMES[LS.get('lastLightTheme', 'vue')] ? LS.get('lastLightTheme', 'vue') : 'vue';
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
  function esc(s) { return window.MD.escapeHtml(String(s == null ? '' : s)); }
  function icon(path) { return '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true">' + path + '</svg>'; }
  const ICON = {
    chev: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    arrowL: '<path d="M15 5l-7 7 7 7"/>',
    arrowR: '<path d="M9 5l7 7-7 7"/>',
    play: '<path d="M7 4l12 8-12 8z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  };

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
        '<a class="nav-ch' + (done.has(c.no) ? ' done' : '') + '" href="#/ch/' + c.no + '" data-no="' + c.no + '" title="课次 ' + esc(c.lessons) + '" data-search="' + esc((c.title + ' ' + c.summary + ' ' + c.points.join(' ')).toLowerCase()) + '">' +
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
      '<div class="idx">STEP ' + idx + '</div>' +
      '<h4>' + esc(title) + '</h4>' +
      '<p>' + esc(desc) + '</p>' +
      '<div class="chips">' + links + '</div>' +
    '</div>';
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
          '<div class="code-toolbar"><span class="code-lang">vue</span></div>' +
          '<pre><code><span class="tok-kw">&lt;script</span> <span class="tok-fn">setup</span><span class="tok-kw">&gt;</span>\n' +
'<span class="tok-com">// 一行插值背后，是一整套响应式系统</span>\n' +
'<span class="tok-kw">import</span> { <span class="tok-fn">ref</span>, <span class="tok-fn">computed</span> } <span class="tok-kw">from</span> <span class="tok-str">\'vue\'</span>\n\n' +
'<span class="tok-kw">const</span> lessons = <span class="tok-fn">ref</span>(<span class="tok-num">' + total + '</span>)\n' +
'<span class="tok-kw">const</span> label = <span class="tok-fn">computed</span>(() =&gt; <span class="tok-str">`${lessons.value} 章`</span>)\n' +
'<span class="tok-kw">&lt;/script&gt;</span>\n\n' +
'<span class="tok-kw">&lt;template&gt;</span>\n' +
'  <span class="tok-kw">&lt;p&gt;</span><span class="tok-num">{{ label }}</span>，按顺序学完即可<span class="tok-kw">&lt;/p&gt;</span>\n' +
'<span class="tok-kw">&lt;/template&gt;</span></code></pre>' +
        '</div>' +
      '</div>';

    view.innerHTML = '<div class="home">' +
      '<section class="hero">' +
        '<div class="hero-grid"></div>' +
        '<div class="hero-inner">' +
          '<div>' +
            '<div class="hero-badge"><i>V3</i> ' + parts.length + ' 篇 · ' + total + ' 章 · 课次 001–128</div>' +
            '<h1>把 Vue 3<br><span class="hl">学成一条线</span></h1>' +
            '<p class="sub">按课程原始课次重排：从模板语法的第一行插值，一路走到组件通信、组合式 API、路由、状态管理与工程化。每一章先讲清原理与取舍，再给一段能对照的最小代码。</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-primary" href="#/ch/' + cont.no + '">' + icon(ICON.play) + (lastNo !== null && byNo.get(lastNo) ? '继续第 ' + cont.seq + ' 章' : '从第 1.1 章开始') + '</a>' +
              '<a class="btn btn-ghost" href="#/roadmap">' + icon(ICON.arrowR) + '查看完整路线</a>' +
              '<span class="note">建议每天 2–3 章 · 共 ' + total + ' 章</span>' +
            '</div>' +
            '<div class="hero-stats">' +
              '<div><strong>' + parts.length + '</strong><span>学习篇章</span></div>' +
              '<div><strong>' + total + '</strong><span>精炼章节</span></div>' +
              '<div><strong>128</strong><span>覆盖课次</span></div>' +
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
        '<div class="section-head"><div><h2>四段式学习路径</h2><p>按能力递进拆成四段，每一段都有明确目标，学完再往下走。</p></div></div>' +
        '<div class="path">' +
          pathStep('01', '模板与渲染', '插值、指令、条件与列表。先把「数据怎么变成页面」这件事摸透，后面所有内容都建立在这层之上。', ['p1', 'p2']) +
          pathStep('02', '交互与组件', '事件、表单、计算属性、侦听器，再到组件拆分与六种通信方式——真正的应用从这里开始成形。', ['p3', 'p4', 'p5']) +
          pathStep('03', '组合式与路由状态', '组合式 API 重写业务逻辑，路由管理页面切换，Pinia / Vuex 管理跨组件状态。', ['p6', 'p7', 'p8']) +
          pathStep('04', '工程化与内功', '组件库、单元测试、TypeScript，最后回到响应式原理与 diff 算法，把「会用」升级成「能解释」。', ['p9', 'p10']) +
        '</div>' +
      '</section>' +

      '<section class="section-block" id="tips" style="margin-top:44px">' +
        '<div class="section-head"><div><h2>怎么用这个站点</h2><p>三条建议，能帮你少走一些弯路。</p></div></div>' +
        '<div class="tips-grid">' +
          '<div class="tip-card"><div class="ico">01</div><h4>两遍读法</h4><p>第一遍读正文，知道「有这么回事」；第二遍读每章下方的「深入理解」，把机制拆开、照着「动手验证」敲一遍。只看一遍等于没学。</p></div>' +
          '<div class="tip-card"><div class="ico">02</div><h4>先自己答，再看答案</h4><p>每章末尾有 3 道自查题。合上原文先讲一遍，讲不顺的地方就是没懂的地方，回去重读那一节，比再读十页新内容有效。</p></div>' +
          '<div class="tip-card"><div class="ico">03</div><h4>用复习页对抗遗忘</h4><p>「复习」把 ' + ((DATA.stats && DATA.stats.quiz) || 0) + ' 道问题抽成卡片，答得出标「记住了」，答不出标「还要再看」，系统只留待复习的——每天 10 题，三天仍答得出才算记住。</p></div>' +
        '</div>' +
      '</section>' +
    '</div>';

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
      '<p class="page-lead">顺序以课程课次 001–128 的先后为准，再按知识主题归并成 ' + parts.length + ' 篇。表格里的「课次」是原始课程编号，「章节」是本站的篇内序号，两者一一对应，方便你对照视频或课件。</p>' +
      '<div class="map-note"><strong>关于归并：</strong>课程里同一主题常被拆成多节（例如购物车分两节、轮播封装分三节），本站合并为一章，正文会按「问题 → 方案 → 边界」重新组织，不按录制顺序平铺。这样每一章都是一个完整的知识闭环。</div>';

    parts.forEach((p) => {
      html += '<h2 class="section-title">' + esc(p.title) + '</h2>' +
        '<p class="section-sub">课次 ' + esc(p.range) + ' · ' + p.chapters.length + ' 章 · ' + esc(p.desc) + '</p>' +
        '<div class="table-wrap"><table class="road-table"><thead><tr><th>章节</th><th>课次</th><th>标题</th><th>状态</th></tr></thead><tbody>';
      p.chapters.forEach((c, i) => {
        html += '<tr><td><code>' + esc(p.order + '.' + (i + 1)) + '</code></td>' +
          '<td><code>' + esc(c.lessons) + '</code></td>' +
          '<td><a href="#/ch/' + c.no + '">' + esc(c.title) + '</a></td>' +
          '<td>' + (done.has(c.no) ? '<span class="status-ok">已学完</span>' : '<span class="status-todo">未开始</span>') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    });
    html += '</div>';
    view.innerHTML = html;
    buildToc([]);
    window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
  }

  // 提取 h3 / h4 供右侧本页目录使用
  function collectHeadings(html) {
    const out = [];
    const re = /<h([34]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const text = m[3].replace(/<[^>]+>/g, '').trim();
      if (text) out.push({ id: m[2], text: text });
    }
    return out;
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

    const proseHtml = window.MD.render(c.body);
    const deepHtml = c.deep ? window.MD.render(c.deep) : '';
    const headings = collectHeadings(proseHtml).concat(collectHeadings(deepHtml));

    const chars = (String(c.body || '') + String(c.deep || '')).replace(/\s+/g, '').length;
    const minutes = Math.max(3, Math.round(chars / 380));

    const deepSection = deepHtml
      ? '<section class="deep-block">' +
          '<div class="deep-head">' + icon(ICON.bolt) + '<span>深入理解</span><small>知道结论之后，再把机制拆开看一遍</small></div>' +
          '<div class="prose">' + deepHtml + '</div>' +
        '</section>'
      : '';

    const quizList = c.quiz || [];
    const quizSection = quizList.length
      ? '<section class="quiz-block">' +
          '<div class="quiz-head">' + icon(ICON.check) + '<span>自查 · 主动回忆</span><small>先合上答案自己讲一遍，再点开对照</small></div>' +
          quizList.map((q, i) =>
            '<details class="quiz-item"><summary><i>' + String(i + 1).padStart(2, '0') + '</i><span>' + esc(q.q) + '</span></summary>' +
            '<div class="quiz-ans">' + window.MD.inline(q.a) + '</div></details>'
          ).join('') +
          '<div class="quiz-foot">答不上来的，回上面找对应小节重读；全部答得上来，再去「复习」页把它标记成「记住了」。</div>' +
        '</section>'
      : '';

    view.innerHTML = '<div class="content">' +
      '<article class="chapter">' +
        '<header class="chapter-head">' +
          '<span class="kicker">第 ' + String(c.partOrder).padStart(2, '0') + ' 篇 · ' + esc(c.partTitle) + '</span>' +
          '<h1><span class="chapter-seq">' + esc(c.seq) + '</span>' + esc(c.title) + '</h1>' +
          '<p class="lede">' + esc(c.summary) + '</p>' +
          '<div class="meta-row">' +
            '<span class="meta-chip">课次 <b>' + esc(c.lessons) + '</b></span>' +
            '<span class="meta-chip">约 <b>' + minutes + ' 分钟</b></span>' +
            '<span class="meta-chip"><b>' + c.points.length + '</b> 个要点</span>' +
            '<span class="meta-chip"><b>' + headings.length + '</b> 个小节</span>' +
            (quizList.length ? '<span class="meta-chip"><b>' + quizList.length + '</b> 道自查</span>' : '') +
          '</div>' +
        '</header>' +
        points +
        '<div class="prose">' + proseHtml + '</div>' +
        deepSection +
        quizSection +
        '<nav class="chapter-nav">' +
          (prev ? '<a class="cnav prev" href="#/ch/' + prev.no + '"><small>← 上一章 · ' + esc(prev.seq) + '</small><strong>' + esc(prev.title) + '</strong></a>' : '<div class="cnav empty"></div>') +
          (next ? '<a class="cnav next" href="#/ch/' + next.no + '"><small>下一章 · ' + esc(next.seq) + ' →</small><strong>' + esc(next.title) + '</strong></a>' : '<div class="cnav empty"></div>') +
        '</nav>' +
      '</article>' +
    '</div>';

    buildToc(headings);
    LS.set('last', no);
    expandPart(c.partId);
    markNav(no);
    window.scrollTo(0, 0);
    readProgress.hidden = false;
    readProgress.style.width = '0%';
  }

  // ---------- 速查手册 ----------
  function renderCheatsheet() {
    setNavActive('cheatsheet');
    doneBtn.hidden = true;

    const md = [
      '### 一、内置指令',
      '',
      '| 指令 | 作用 | 常见写法 | 备注 |',
      '| --- | --- | --- | --- |',
      '| `v-text` | 写入纯文本 | `v-text="msg"` | 等价于双大括号，会覆盖子节点 |',
      '| `v-html` | 写入 HTML | `v-html="raw"` | 有 XSS 风险，只用于可信内容 |',
      '| `v-bind` | 绑定属性 / props | `:id="dynamicId"` | 值为 `null` / `undefined` 时移除该属性 |',
      '| `v-on` | 绑定事件 | `@click="fn"` | 支持修饰符与按键别名 |',
      '| `v-model` | 双向绑定 | `v-model.trim="msg"` | 语法糖：`:value` + `@input` |',
      '| `v-if` / `v-else-if` / `v-else` | 条件渲染 | `<p v-if="ok">` | 真实销毁 / 重建，惰性 |',
      '| `v-show` | 条件显示 | `<p v-show="ok">` | 只切换 `display`，初始开销更高 |',
      '| `v-for` | 列表渲染 | `v-for="(item, i) in list" :key="item.id"` | 与 `v-if` 同级不推荐混用 |',
      '| `v-slot` | 插槽内容 | `<template #header>` | 简写 `#`，仅可用于组件或 `template` |',
      '| `v-once` | 只渲染一次 | `<span v-once>{{ t }}</span>` | 跳过后续更新，适合静态块 |',
      '| `v-memo` | 缓存子树 | `v-memo="[a, b]"` | 数组内值不变就复用旧 vnode |',
      '| `v-pre` | 跳过编译 | `<span v-pre>{{ raw }}</span>` | 原样输出双大括号 |',
      '',
      '### 二、选项式与组合式对照',
      '',
      '| 能力 | 选项式 API | 组合式 API |',
      '| --- | --- | --- |',
      '| 响应式状态 | `data() { return {} }` | `ref()` / `reactive()` |',
      '| 派生状态 | `computed: {}` | `computed(() => ...)` |',
      '| 副作用侦听 | `watch: {}` | `watch(src, cb)` / `watchEffect(fn)` |',
      '| 方法 | `methods: {}` | 直接声明函数 |',
      '| 接收 props | `props: [] / {}` | `defineProps()` |',
      '| 派发事件 | `this.$emit()` | `defineEmits()` |',
      '| 访问 DOM | `this.$refs.x` | `ref(null)` + 同名 `ref="x"` |',
      '| 跨级注入 | `provide / inject` | `provide()` / `inject()` |',
      '| 生命周期 | `mounted() {}` | `onMounted()` |',
      '| 逻辑复用 | mixin（命名冲突） | 组合式函数 `useXxx()` |',
      '',
      '### 三、生命周期对照',
      '',
      '| 阶段 | 选项式 | 组合式 | 典型用途 |',
      '| --- | --- | --- | --- |',
      '| 实例创建前 | `beforeCreate` | `setup()` 本身 | 极少使用 |',
      '| 实例创建后 | `created` | `setup()` 本身 | 发起初始请求（无 DOM） |',
      '| 挂载前 | `beforeMount` | `onBeforeMount` | 极少使用 |',
      '| 挂载后 | `mounted` | `onMounted` | 操作 DOM、初始化第三方库 |',
      '| 更新前 | `beforeUpdate` | `onBeforeUpdate` | 读取更新前的 DOM |',
      '| 更新后 | `updated` | `onUpdated` | 依赖 DOM 的副作用，配合 `nextTick` |',
      '| 卸载前 | `beforeUnmount` | `onBeforeUnmount` | 清除定时器、解绑事件 |',
      '| 卸载后 | `unmounted` | `onUnmounted` | 释放第三方实例 |',
      '| 被缓存激活 | `activated` | `onActivated` | `KeepAlive` 内刷新数据 |',
      '| 被缓存失活 | `deactivated` | `onDeactivated` | 暂停轮询 / 动画 |',
      '',
      '### 四、修饰符速查',
      '',
      '| 类别 | 修饰符 | 说明 |',
      '| --- | --- | --- |',
      '| 事件 | `.stop` `.prevent` `.self` `.capture` `.once` `.passive` | 阻止冒泡 / 默认行为 / 仅自身触发等 |',
      '| 按键 | `.enter` `.tab` `.delete` `.esc` `.space` `.up` `.down` `.left` `.right` | 也可写 `.` + `KeyboardEvent.key` 的短横线形式 |',
      '| 系统 | `.ctrl` `.alt` `.shift` `.meta` `.exact` | 组合键判断 |',
      '| 鼠标 | `.left` `.right` `.middle` | 仅鼠标按键 |',
      '| 表单 | `.lazy` `.number` `.trim` | 改为 change 同步 / 转数字 / 去首尾空格 |',
      '| `v-model` | `v-model:title` | 具名双向绑定，对应 `title` prop + `update:title` 事件 |',
      '',
      '### 五、内置组件',
      '',
      '| 组件 | 用途 | 关键 props |',
      '| --- | --- | --- |',
      '| `<Transition>` | 单元素进入 / 离开动画 | `name`、`mode`(`out-in`)、`appear` |',
      '| `<TransitionGroup>` | 列表增删与移动动画 | `tag`、`name`、`move-class` |',
      '| `<KeepAlive>` | 缓存组件实例 | `include`、`exclude`、`max` |',
      '| `<Teleport>` | 把内容传送到其他 DOM 节点 | `to`、`disabled` |',
      '| `<Suspense>` | 等待异步依赖 | `#default`、`#fallback` |',
      '| `<component :is>` | 动态组件 | `:is` 接组件名或组件对象 |',
      '',
      '> 💡 上表只列高频项。真正写业务时，先用「速查」定位 API，再回到对应章节看边界与坑。'
    ].join('\n');

    view.innerHTML = '<div class="content">' +
      '<div class="eyebrow">Cheatsheet</div>' +
      '<h1 class="page-title">速查手册</h1>' +
      '<p class="page-lead">把最常用的指令、生命周期、修饰符与内置组件压成几张表。写代码时当字典查，不必从头读。</p>' +
      '<div class="prose">' + window.MD.render(md) + '</div>' +
      '<h2 class="section-title" style="margin-top:38px">手写响应式小实验</h2>' +
      '<p class="section-sub">下面这段完全不依赖 Vue：用 <code>Proxy</code> 拦截读写，用 <code>effect</code> 做依赖收集，改一个数字，视图自己就变了。这正是第 10.4 章要讲的核心机制。</p>' +
      '<div class="lab">' +
        '<div class="lab-panel">' +
          '<h5>数据源</h5>' +
          '<div class="lab-field"><label>price · 单价（元）</label><input type="range" id="labPrice" min="0" max="500" step="10" value="120"></div>' +
          '<div class="lab-field"><label>count · 数量（件）</label><input type="range" id="labCount" min="0" max="10" value="2"></div>' +
          '<div class="lab-field"><label>discount · 折扣（%）</label><input type="range" id="labDiscount" min="0" max="90" step="5" value="20"></div>' +
          '<div class="lab-field"><label>note · 备注</label><input type="text" id="labNote" value="满减已生效"></div>' +
        '</div>' +
        '<div class="lab-panel">' +
          '<h5>被依赖收集驱动的视图</h5>' +
          '<div class="lab-out">' +
            '单价 × 数量 = <b id="labTotal">—</b> 元<br>' +
            '折扣后应付 = <b id="labPay">—</b> 元<br>' +
            '备注 = <b id="labNoteOut">—</b>' +
          '</div>' +
          '<div class="lab-log" id="labLog"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

    buildToc([]);
    window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
    mountLab();
  }

  // 30 行迷你响应式：track / trigger / effect
  function mountLab() {
    const logEl = $('#labLog');
    if (!logEl) return;
    let effectFn = null;
    const deps = new WeakMap();
    function track(target, key) {
      if (!effectFn) return;
      let map = deps.get(target);
      if (!map) deps.set(target, (map = new Map()));
      let set = map.get(key);
      if (!set) map.set(key, (set = new Set()));
      set.add(effectFn);
    }
    function trigger(target, key) {
      const map = deps.get(target);
      const set = map && map.get(key);
      if (!set) return;
      log('trigger', key);
      set.forEach((fn) => fn());
    }
    function reactive(obj) {
      return new Proxy(obj, {
        get(t, k) { track(t, k); return t[k]; },
        set(t, k, v) {
          if (t[k] === v) return true;
          t[k] = v;
          trigger(t, k);
          return true;
        },
      });
    }
    function effect(fn) { effectFn = fn; fn(); effectFn = null; }

    let lines = 0;
    function log(kind, key) {
      if (lines++ > 60) { logEl.innerHTML = ''; lines = 1; }
      const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      const div = document.createElement('div');
      div.innerHTML = '<span class="t">' + time + '</span> · ' + kind + ' → ' + esc(String(key));
      logEl.insertBefore(div, logEl.firstChild);
    }

    const state = reactive({
      price: Number($('#labPrice').value),
      count: Number($('#labCount').value),
      discount: Number($('#labDiscount').value),
      note: $('#labNote').value,
    });

    effect(() => {
      const total = state.price * state.count;
      const pay = Math.round(total * (1 - state.discount / 100));
      $('#labTotal').textContent = total;
      $('#labPay').textContent = pay;
      $('#labNoteOut').textContent = state.note || '（空）';
    });

    $('#labPrice').addEventListener('input', (e) => { state.price = Number(e.target.value); });
    $('#labCount').addEventListener('input', (e) => { state.count = Number(e.target.value); });
    $('#labDiscount').addEventListener('input', (e) => { state.discount = Number(e.target.value); });
    $('#labNote').addEventListener('input', (e) => { state.note = e.target.value; });
    log('effect', '首次执行，收集 4 个依赖');
  }

  // ---------- 复习：主动回忆 ----------
  let reviewFilter = 'todo';

  function quizBank() {
    const out = [];
    chapters.forEach((c) => {
      (c.quiz || []).forEach((q, i) => out.push({ key: c.no + ':' + i, ch: c, q: q.q, a: q.a }));
    });
    return out;
  }

  function renderReview(keepScroll) {
    setNavActive('review');
    doneBtn.hidden = true;

    const all = quizBank();
    const state = LS.get('quiz', {});
    const okCount = all.filter((x) => state[x.key] === 'ok').length;
    const redoCount = all.filter((x) => state[x.key] === 'redo').length;
    const freshCount = all.length - okCount - redoCount;
    const pct = all.length ? Math.round((okCount / all.length) * 100) : 0;

    let list = all.slice();
    if (reviewFilter === 'todo') list = list.filter((x) => state[x.key] !== 'ok');
    else if (reviewFilter === 'new') list = list.filter((x) => !state[x.key]);
    else if (reviewFilter === 'ok') list = list.filter((x) => state[x.key] === 'ok');

    const filterBtn = (val, label, count) =>
      '<button type="button" data-f="' + val + '" class="' + (reviewFilter === val ? 'active' : '') + '">' +
        label + '<b>' + count + '</b></button>';

    const cards = list.length
      ? list.map((x) => {
          const st = state[x.key] || '';
          return '<article class="rv-card' + (st === 'ok' ? ' is-ok' : '') + '" data-key="' + x.key + '">' +
            '<div class="rv-meta"><b>' + esc(x.ch.seq) + '</b><span>' + esc(x.ch.title) + '</span>' +
              '<em>' + (st === 'ok' ? '已记住' : st === 'redo' ? '待复习' : '未练习') + '</em></div>' +
            '<p class="rv-q">' + esc(x.q) + '</p>' +
            '<details class="rv-a"><summary>想好了？看答案</summary><div class="rv-ans">' + window.MD.inline(x.a) + '</div></details>' +
            '<div class="rv-actions">' +
              '<a class="rv-link" href="#/ch/' + x.ch.no + '">回原文 →</a>' +
              '<button type="button" class="rv-btn redo" data-mark="redo">还要再看</button>' +
              '<button type="button" class="rv-btn ok" data-mark="ok">记住了</button>' +
            '</div>' +
          '</article>';
        }).join('')
      : '<div class="rv-empty">这一栏已经清空了。切成「全部」继续刷，或者去学新章节。</div>';

    view.innerHTML = '<div class="content">' +
      '<div class="eyebrow">Review</div>' +
      '<h1 class="page-title">复习 · 用回忆对抗遗忘</h1>' +
      '<p class="page-lead">读完就忘，通常不是记性差，而是「以为自己看懂了」。这里把 65 章拆成 ' + all.length + ' 道问题：先合上原文答一遍，答得出来才算会。答对一次标「记住了」，答不出标「还要再看」，系统只留待复习的题。</p>' +
      '<div class="rv-stats">' +
        '<div><strong>' + all.length + '</strong><span>问题总数</span></div>' +
        '<div><strong class="ok-num">' + okCount + '</strong><span>已记住（' + pct + '%）</span></div>' +
        '<div><strong class="redo-num">' + redoCount + '</strong><span>标为待复习</span></div>' +
        '<div><strong>' + freshCount + '</strong><span>还没碰过</span></div>' +
      '</div>' +
      '<div class="rv-bar">' +
        '<div class="rv-filter">' +
          filterBtn('todo', '待掌握', redoCount + freshCount) +
          filterBtn('new', '没练过', freshCount) +
          filterBtn('ok', '已记住', okCount) +
          filterBtn('all', '全部', all.length) +
        '</div>' +
        '<span class="rv-hint">建议每天 10 题，连续 3 天仍答得出，才算真的记住。</span>' +
      '</div>' +
      '<div class="rv-list">' + cards + '</div>' +
    '</div>';

    $$('.rv-filter button', view).forEach((b) => {
      b.addEventListener('click', () => { reviewFilter = b.dataset.f; renderReview(); window.scrollTo(0, 0); });
    });

    $$('.rv-card[data-key]', view).forEach((card) => {
      const key = card.dataset.key;
      $$('[data-mark]', card).forEach((btn) => {
        btn.addEventListener('click', () => {
          const st = LS.get('quiz', {});
          const val = btn.dataset.mark;
          if (st[key] === val) delete st[key]; else st[key] = val;
          LS.set('quiz', st);
          const now = st[key] || '';
          const keepY = window.scrollY;
          const shouldDrop = reviewFilter === 'todo' && now === 'ok';
          if (shouldDrop || reviewFilter === 'ok' || reviewFilter === 'new' || reviewFilter === 'redo') {
            // 当前筛选下这张卡已不再属于结果集，重排列表但保持滚动位置
            renderReview(true);
            window.scrollTo(0, keepY);
            return;
          }
          card.classList.toggle('is-ok', now === 'ok');
          const em = $('.rv-meta em', card);
          if (em) em.textContent = now === 'ok' ? '已记住' : now === 'redo' ? '待复习' : '未练习';
          $$('[data-mark]', card).forEach((b) => b.classList.toggle('on', b.dataset.mark === now));
          updateReviewStats();
        });
      });
      const st = LS.get('quiz', {})[key];
      if (st) $$('[data-mark]', card).forEach((b) => b.classList.toggle('on', b.dataset.mark === st));
    });

    buildToc([]);
    if (!keepScroll) window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
  }

  function updateReviewStats() {
    const all = quizBank();
    const state = LS.get('quiz', {});
    const okCount = all.filter((x) => state[x.key] === 'ok').length;
    const redoCount = all.filter((x) => state[x.key] === 'redo').length;
    const okEl = $('.ok-num', view);
    const redoEl = $('.redo-num', view);
    if (okEl) okEl.textContent = okCount;
    if (redoEl) redoEl.textContent = redoCount;
    const stats = $('.rv-stats', view);
    if (stats) {
      const spans = $$('span', stats);
      if (spans[1]) spans[1].textContent = '已记住（' + (all.length ? Math.round((okCount / all.length) * 100) : 0) + '%）';
      const nums = $$('strong', stats);
      if (nums[3]) nums[3].textContent = all.length - okCount - redoCount;
    }
  }

  // ---------- 风格设计 ----------
  function renderStyle() {
    setNavActive('style');
    doneBtn.hidden = true;

    const swatches = [
      ['底色 bg', 'var(--bg)'], ['次级底 bg-soft', 'var(--bg-soft)'], ['卡片 panel', 'var(--panel)'],
      ['描边 border', 'var(--border)'], ['强调 accent', 'var(--accent)'], ['强调淡底 accent-soft', 'var(--accent-soft)'],
      ['正文 text', 'var(--text)'], ['次要文字 text-3', 'var(--text-3)'],
    ].map(([name, v]) =>
      '<div class="swatch"><div class="chip" style="background:' + v + '"></div>' +
      '<div class="info"><b>' + name + '</b><span>' + v.replace('var(', '').replace(')', '') + '</span></div></div>'
    ).join('');

    const themes = [
      ['vue', '纸白绿', '#2f8f61'], ['warm', '暖纸橙', '#e76f00'], ['slate', '石墨靛', '#4a5bd0'],
      ['ocean', '海蓝', '#2563c9'], ['rose', '玫瑰', '#c94b63'], ['forest', '森绿', '#2f855a'],
      ['midnight', '深夜', '#ff9d3d'],
    ].map(([k, name, hex], i) =>
      '<tr><td><code>' + k + '</code></td><td>' + name + (i === 0 ? ' · 默认' : '') + '</td>' +
      '<td><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:' + hex + ';vertical-align:-2px;margin-right:7px"></span><code>' + hex + '</code></td></tr>'
    ).join('');

    view.innerHTML = '<div class="content">' +
      '<div class="eyebrow">Design System</div>' +
      '<h1 class="page-title">风格设计</h1>' +
      '<p class="page-lead">本站与同目录下的 <code class="inline">java/</code>、<code class="inline">js/</code> 两个站点共用一套设计语言：纸感底色、1px 细描边、深色代码块、单一强调色。本站只把强调色换成 Vue 绿，其余结构完全对齐，三个站点放在一起看是同一套体系。</p>' +

      '<h2 class="section-title">四条基本原则</h2>' +
      '<div class="spec">' +
        '<div class="spec-row"><span class="k">01 低对比底</span><div class="v">底色不用纯白，用带一点灰绿的 <code>#f8f9f7</code>，长时间阅读不刺眼；卡片用纯白浮起 1 级，靠 1px 描边而不是重阴影划分层次。</div></div>' +
        '<div class="spec-row"><span class="k">02 单强调色</span><div class="v">全站只有一个强调色（Vue 绿），只出现在链接、当前项、进度、要点圆点上。颜色越少，层级越清楚。</div></div>' +
        '<div class="spec-row"><span class="k">03 内容优先</span><div class="v">正文 15.5px / 1.78 行高、800px 内容宽，代码块深色独立成块。阅读区不放大图、不放大色块，避免打断文本节奏。</div></div>' +
        '<div class="spec-row"><span class="k">04 克制的动效</span><div class="v">只有 hover 位移、面板淡入、进度条三类动效，时长 0.15–0.2s。动效用来提示状态，不用于装饰。</div></div>' +
      '</div>' +

      '<h2 class="section-title">色板（随主题联动）</h2>' +
      '<p class="section-sub">下面 8 个色值全部来自 CSS 变量，切换主题时整体一起变——这也是「六套浅色 + 一套深色」能保持一致观感的原因。</p>' +
      '<div class="swatches">' + swatches + '</div>' +

      '<h2 class="section-title">字体层级</h2>' +
      '<div class="spec">' +
        '<div class="spec-row"><span class="k">H1 · 页标题</span><div class="v"><span style="font-size:30px;font-weight:800;letter-spacing:-.03em">Vue 3 系统学习</span></div></div>' +
        '<div class="spec-row"><span class="k">H2 · 段落标题</span><div class="v"><span style="font-size:22px;font-weight:750;letter-spacing:-.02em">篇章目录</span></div></div>' +
        '<div class="spec-row"><span class="k">H3 · 小节标题</span><div class="v"><span style="font-size:16.5px;font-weight:700">2.3 class 与 style 绑定</span></div></div>' +
        '<div class="spec-row"><span class="k">正文</span><div class="v"><span style="font-size:15.5px;color:var(--text-2)">正文行高 1.78，段间距 16px，中文优先用系统级黑体栈。</span></div></div>' +
        '<div class="spec-row"><span class="k">代码</span><div class="v"><span style="font-family:var(--mono);font-size:13px">const count = ref(0)</span> <span style="color:var(--text-3);font-size:12px">· JetBrains Mono / Consolas</span></div></div>' +
      '</div>' +

      '<h2 class="section-title">组件标本</h2>' +
      '<div class="spec">' +
        '<div class="spec-row"><span class="k">按钮</span><div class="v"><div class="demo-row">' +
          '<a class="btn btn-primary" href="#/ch/1">主按钮</a>' +
          '<a class="btn btn-ghost" href="#/roadmap">次按钮</a>' +
          '<span class="chip-tag on">已学完</span><span class="chip-tag">未开始</span>' +
        '</div></div></div>' +
        '<div class="spec-row"><span class="k">提示块</span><div class="v"><div class="callout tip"><p><span class="callout-tag">提示</span>提示块用于补充边界条件，不用于强调结论。</p></div></div></div>' +
        '<div class="spec-row"><span class="k">风险块</span><div class="v"><div class="callout warn"><p><span class="callout-tag">易错</span>易错块只出现在真正踩过坑的地方，宁缺毋滥。</p></div></div></div>' +
        '<div class="spec-row"><span class="k">要点卡</span><div class="v"><div class="points-box" style="margin:0"><div class="points-label">本章速记</div><div class="points-grid"><div class="point"><span class="dot"></span><span>一条结论占一行，最多四条</span></div><div class="point"><span class="dot"></span><span>每条不超过 30 字</span></div></div></div></div></div>' +
      '</div>' +

      '<h2 class="section-title">主题一览</h2>' +
      '<div class="table-wrap"><table><thead><tr><th>标识</th><th>名称</th><th>强调色</th></tr></thead><tbody>' + themes + '</tbody></table></div>' +
      '<p class="section-sub">切换入口在顶栏右侧的调色盘里，也可以在地址后加 <code class="inline">?theme=forest</code> 直接指定；选择结果保存在本机浏览器。</p>' +

      '<h2 class="section-title">布局与间距</h2>' +
      '<div class="spec">' +
        '<div class="spec-row"><span class="k">三栏结构</span><div class="v">左侧目录 260px（可收起）→ 正文最大 800px → 右侧本页目录 210px（小节 ≥ 2 时出现）。正文永远居中，视线不左右横跳。</div></div>' +
        '<div class="spec-row"><span class="k">间距梯度</span><div class="v">4 / 8 / 12 / 16 / 24 / 32 / 44 px，全部为 4 的倍数；相邻段落的间隔永远大于段落内部行距。</div></div>' +
        '<div class="spec-row"><span class="k">圆角</span><div class="v">小元件 8px、卡片 12px、面板 18px，同一层级只用一种圆角。</div></div>' +
        '<div class="spec-row"><span class="k">响应式</span><div class="v">≤ 1080px 收起右侧目录，≤ 860px 左侧目录改为抽屉，正文单栏铺满，代码块横向滚动。</div></div>' +
      '</div>' +
    '</div>';

    buildToc([]);
    window.scrollTo(0, 0);
    $$('.nav-ch', sideNav).forEach((a) => a.classList.remove('active'));
  }

  // ---------- 代码块交互 ----------
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
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      const block = document.getElementById(copyBtn.dataset.copy);
      if (block) copyText($('pre code', block).textContent);
    }
  });

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
      if (key && any) p.classList.remove('collapsed');
      else if (!key) p.classList.toggle('collapsed', collapsed.has(p.dataset.part));
    });

    if (!key) { hideSearch(); return; }

    searchHits = chapters.filter((c) => {
      const hay = (c.title + ' ' + c.summary + ' ' + c.points.join(' ') + ' ' + c.body + ' ' + (c.deep || '') + ' ' + (c.quiz || []).map((q) => q.q + ' ' + q.a).join(' ')).toLowerCase();
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
        ? searchHits.map((c) => '<button class="search-hit" data-no="' + c.no + '"><b>' + hl(c.title) + '</b><span>' + esc(c.seq) + ' · ' + esc(c.partTitle) + ' · ' + esc(c.summary.slice(0, 42)) + '</span></button>').join('')
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
    else if (hash.indexOf('#/roadmap') === 0) renderRoadmap();
    else if (hash.indexOf('#/review') === 0) renderReview();
    else if (hash.indexOf('#/cheatsheet') === 0) renderCheatsheet();
    else if (hash.indexOf('#/style') === 0) renderStyle();
    else renderHome();
    hideSearch();
    closeSidebar();
  }
  window.addEventListener('hashchange', route);

  // 章节阅读进度
  window.addEventListener('scroll', () => {
    if (readProgress.hidden) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    readProgress.style.width = pct + '%';
  }, { passive: true });

  // ---------- 键盘快捷键 ----------
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
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
