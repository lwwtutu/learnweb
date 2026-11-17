/* ============================================================
   Java 学习手册 · 站点脚本
   - Java 语法高亮（零依赖）
   - 侧边导航 / 目录 / 滚动高亮
   - 学习进度（localStorage）
   - 全局搜索（Ctrl / ⌘ + K）
   - 代码复制、回到顶部、移动端抽屉
   ============================================================ */
(function () {
  "use strict";

  var COURSE = window.COURSE || { chapters: [] };
  var CH = COURSE.chapters;
  var ROOT = document.body.getAttribute("data-root") || "./";
  var PAGE = document.body.getAttribute("data-page") || "";
  var STORE_KEY = "java-course-progress-v1";

  /* ---------------- 工具 ---------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function chapterById(id) {
    for (var i = 0; i < CH.length; i++) if (CH[i].id === id) return CH[i];
    return null;
  }

  /* ---------------- 进度 ---------------- */
  function readProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function isDone(id) { return !!readProgress()[id]; }
  function doneCount() {
    var p = readProgress(), n = 0;
    CH.forEach(function (c) { if (p[c.id]) n++; });
    return n;
  }
  function setDone(id, val) {
    var p = readProgress();
    if (val) p[id] = true; else delete p[id];
    saveProgress(p);
    refreshProgressUI();
  }

  function ringSVG(pct, size, stroke) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    var off = c * (1 - pct);
    return '<svg class="ring" viewBox="0 0 ' + size + " " + size + '" width="' + size + '" height="' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#f0e7db" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#e76f00" stroke-width="' + stroke + '"' +
      ' stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"' +
      ' transform="rotate(-90 ' + size / 2 + " " + size / 2 + ')"/></svg>';
  }

  function refreshProgressUI() {
    var n = doneCount(), total = CH.length, pct = total ? n / total : 0;

    // 顶栏进度胶囊
    $$("[data-progress-pill]").forEach(function (pill) {
      pill.innerHTML = ringSVG(pct, 22, 3) + "<span><b>" + n + "</b>/" + total + " 章</span>";
    });
    // 侧边进度条
    $$("[data-side-progress]").forEach(function (box) {
      box.innerHTML =
        '<div class="label"><span>学习进度</span><b>' + Math.round(pct * 100) + '%</b></div>' +
        '<div class="mini-bar"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>';
    });
    // 侧边章节状态
    $$(".side-link[data-ch]").forEach(function (a) {
      var id = a.getAttribute("data-ch");
      a.classList.toggle("done", isDone(id));
    });
    // 首页卡片状态
    $$(".chapter-card[data-ch]").forEach(function (c) {
      c.classList.toggle("is-done", isDone(c.getAttribute("data-ch")));
    });
    // 首页统计
    $$("[data-done-count]").forEach(function (n2) { n2.textContent = n; });
    // 完成按钮
    var btn = $("#markDone");
    if (btn) {
      var done = isDone(PAGE);
      btn.classList.toggle("done", done);
      btn.innerHTML = done
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> 已学完，取消标记'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-4.9"/></svg> 标记本章为已学完';
    }
  }

  /* ---------------- 语法高亮 ---------------- */
  var KEYWORDS = ("abstract assert boolean break byte case catch char class const continue default do double else enum " +
    "extends final finally float for goto if implements import instanceof int interface long native new package private " +
    "protected public return short static strictfp super switch synchronized this throw throws transient try void " +
    "volatile while var yield record sealed permits non-sealed true false null").split(" ");
  var KW = {}; KEYWORDS.forEach(function (k) { KW[k] = 1; });
  var TYPES = ("String Integer Long Double Float Boolean Byte Short Character Number Object System Math Arrays Collections " +
    "ArrayList LinkedList HashMap HashSet List Map Set Scanner Random StringBuilder StringBuffer Thread Exception " +
    "RuntimeException NumberFormatException NullPointerException IllegalStateException JFrame JPanel JButton JLabel " +
    "JTextField JMenuBar JMenu JMenuItem JOptionPane Timer TimerTask BorderLayout FlowLayout GridLayout BoxLayout " +
    "Pattern Matcher Optional LocalDate LocalDateTime Duration Instant File Path IOException Comparator Runnable " +
    "ActionListener MouseAdapter ActionEvent ImageIcon Graphics Color Font Dimension").split(" ");
  var TY = {}; TYPES.forEach(function (k) { TY[k] = 1; });

  var TOK_RE = new RegExp(
    "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" +          // 1 注释
    "|(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*')" + // 2 字符串/字符
    "|(@[A-Za-z_$][\\w$]*)" +                            // 3 注解
    "|\\b(0[xX][0-9a-fA-F]+|\\d+\\.?\\d*(?:[eE][-+]?\\d+)?[fFdDlL]?)\\b", // 4 数字
    "g");

  function highlightJava(code) {
    var out = esc(code);
    // 先标记注释 / 字符串 / 注解 / 数字，避免二次替换
    out = out.replace(TOK_RE, function (m, com, str, ann, num) {
      if (com) return '<span class="tok-com">' + com + "</span>";
      if (str) return '<span class="tok-str">' + str + "</span>";
      if (ann) return '<span class="tok-ann">' + ann + "</span>";
      if (num) return '<span class="tok-num">' + num + "</span>";
      return m;
    });
    // 再处理标识符（跳过已插入的 span 标签，避免破坏高亮）
    out = out.replace(/(<span class="tok-[a-z]+">[\s\S]*?<\/span>)|([A-Za-z_$][\w$]*)/g,
      function (m, tagged, word, offset, str) {
        if (tagged) return tagged;
        if (KW[word]) return '<span class="tok-kw">' + word + "</span>";
        if (TY[word]) return '<span class="tok-type">' + word + "</span>";
        if (str.charAt(offset + word.length) === "(") {
          return '<span class="tok-fn">' + word + "</span>";
        }
        return word;
      });
    return out;
  }

  function initCode() {
    $$(".code-card").forEach(function (card) {
      var codeEl = $("code", card);
      if (!codeEl) return;
      var raw = codeEl.textContent;
      var langEl = $(".code-lang", card);
      var lang = langEl ? langEl.textContent.trim().toLowerCase() : "java";
      // 只对 Java 代码着色，shell / text 等保持原样
      if (lang === "java") codeEl.innerHTML = highlightJava(raw);
      if (!$(".code-copy", card) && !card.hasAttribute("data-no-copy")) {
        var btn = el("button", "code-copy");
        btn.type = "button";
        btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>复制';
        btn.addEventListener("click", function () {
          copyText(raw).then(function () {
            btn.classList.add("copied");
            btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>已复制';
            setTimeout(function () {
              btn.classList.remove("copied");
              btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>复制';
            }, 1600);
          });
        });
        $(".code-head", card).appendChild(btn);
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------------- 侧边栏 ---------------- */
  var GROUPS = [
    { title: "第一部分 · 语法地基", ids: ["ch01", "ch02", "ch03", "ch04"] },
    { title: "第二部分 · 数据容器", ids: ["ch05", "ch06", "ch07"] },
    { title: "第三部分 · 面向对象", ids: ["ch08", "ch09", "ch10"] },
    { title: "第四部分 · 进阶实战", ids: ["ch11", "ch12"] }
  ];
  var tick = '<svg class="side-tick" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  function buildSidebar() {
    var host = $("[data-sidebar]");
    if (!host) return;
    var html = '<div class="side-progress-card" data-side-progress></div>';

    GROUPS.forEach(function (g) {
      var items = g.ids.map(chapterById).filter(Boolean);
      if (!items.length) return;
      html += '<div class="side-group"><div class="side-group-title">' + g.title + "</div>";
      items.forEach(function (c) {
        var active = c.id === PAGE;
        html += '<a class="side-link' + (active ? " active" : "") + (isDone(c.id) ? " done" : "") +
          '" data-ch="' + c.id + '" href="' + ROOT + 'chapters/' + c.id + '.html">' +
          '<span class="side-num">' + c.num + "</span>" +
          '<span class="side-label">' + c.title + '<span class="side-sub">' + c.sub + "</span></span>" +
          tick + "</a>";
        if (active && c.sections) {
          html += '<div class="side-sections">' + c.sections.map(function (s) {
            return '<a href="#' + s.id + '" data-sec="' + s.id + '">' + s.title + "</a>";
          }).join("") + "</div>";
        }
      });
      html += "</div>";
    });

    host.innerHTML = html;
    refreshProgressUI();

    // 滚动高亮章节内小节
    var secLinks = $$(".side-sections a");
    if (secLinks.length) {
      var map = {};
      secLinks.forEach(function (a) { map[a.getAttribute("data-sec")] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            secLinks.forEach(function (a) { a.classList.remove("on"); });
            var link = map[e.target.id];
            if (link) link.classList.add("on");
          }
        });
      }, { rootMargin: "-72px 0px -72% 0px", threshold: 0 });
      $$(".doc h2[id]").forEach(function (h) { io.observe(h); });
    }
  }

  /* ---------------- 目录 TOC ---------------- */
  function buildTOC() {
    var host = $("[data-toc]");
    if (!host) return;
    var heads = $$(".doc h2[id]");
    if (!heads.length) { host.style.display = "none"; return; }
    host.innerHTML = '<div class="toc-title">本章目录</div>' + heads.map(function (h) {
      var clone = h.cloneNode(true);
      var n = $(".h2-num", clone);
      if (n) n.remove();
      return '<a href="#' + h.id + '" data-toc-link="' + h.id + '">' + clone.textContent.trim() + "</a>";
    }).join("");

    var links = $$("a[data-toc-link]", host);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-toc-link") === e.target.id); });
      });
    }, { rootMargin: "-80px 0px -70% 0px", threshold: 0 });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------------- 搜索 ---------------- */
  var searchIndex = [];
  CH.forEach(function (c) {
    (c.sections || []).forEach(function (s) {
      searchIndex.push({
        ch: c.id, num: c.num, chTitle: c.title, id: s.id, title: s.title, sub: c.title,
        key: (c.title + " " + c.sub + " " + s.title + " " + (c.desc || "")).toLowerCase()
      });
    });
    searchIndex.push({
      ch: c.id, num: c.num, chTitle: c.title, id: "", title: c.title + " · 章节概览", sub: c.sub || "",
      key: (c.title + " " + c.sub + " " + (c.desc || "") + " " + (c.tag || "")).toLowerCase()
    });
  });

  function buildSearch() {
    if ($("#searchOverlay")) return;
    var ov = el("div", "overlay");
    ov.id = "searchOverlay";
    ov.innerHTML =
      '<div class="search-panel">' +
        '<div class="search-input-wrap">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>' +
          '<input class="search-input" id="searchInput" type="text" placeholder="搜索知识点，例如：多态、二分查找、Integer 缓存" autocomplete="off" spellcheck="false">' +
          '<span class="search-esc">ESC</span>' +
        "</div>" +
        '<div class="search-results" id="searchResults"></div>' +
        '<div class="sr-hint"><span><kbd>↑</kbd> <kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 跳转</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> 唤起</span></div>' +
      "</div>";
    document.body.appendChild(ov);

    var input = $("#searchInput"), results = $("#searchResults");
    var cursor = 0, current = [];

    function render(q) {
      q = (q || "").trim().toLowerCase();
      var list;
      if (!q) {
        list = CH.slice(0, 6).map(function (c) {
          return { ch: c.id, num: c.num, chTitle: c.title, id: "", title: c.title + " · 章节概览", sub: c.sub || "", key: "" };
        });
        results.innerHTML = '<div class="sr-group-label">开始学习</div>' + list.map(itemHTML).join("");
      } else {
        var terms = q.split(/\s+/);
        list = searchIndex.filter(function (it) {
          return terms.every(function (t) { return it.key.indexOf(t) > -1; });
        }).slice(0, 12);
        results.innerHTML = list.length
          ? '<div class="sr-group-label">找到 ' + list.length + " 个结果</div>" + list.map(itemHTML).join("")
          : '<div class="sr-empty">没有匹配的知识点，试试「数组」「接口」「Lambda」</div>';
      }
      current = list; cursor = 0;
      var first = $(".sr-item", results);
      if (first) first.classList.add("on");
    }
    function itemHTML(it) {
      return '<a class="sr-item" href="' + ROOT + "chapters/" + it.ch + ".html" + (it.id ? "#" + it.id : "") + '">' +
        '<span class="sr-ch">' + it.num + "</span>" +
        '<span class="sr-body"><span class="sr-title">' + it.title + "</span>" +
        '<span class="sr-sub">' + (it.sub || it.chTitle) + "</span></span></a>";
    }
    function move(d) {
      var items = $$(".sr-item", results);
      if (!items.length) return;
      items[cursor] && items[cursor].classList.remove("on");
      cursor = (cursor + d + items.length) % items.length;
      items[cursor].classList.add("on");
      items[cursor].scrollIntoView({ block: "nearest" });
    }
    function open() {
      ov.classList.add("open");
      document.body.style.overflow = "hidden";
      input.value = "";
      render("");
      setTimeout(function () { input.focus(); }, 20);
    }
    function close() {
      ov.classList.remove("open");
      document.body.style.overflow = "";
    }

    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        var on = $(".sr-item.on", results);
        if (on) { e.preventDefault(); window.location.href = on.getAttribute("href"); }
      }
    });
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
      else if (e.key === "Escape" && ov.classList.contains("open")) close();
    });
    $$("[data-search-open]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); open(); });
    });
    window.__openSearch = open;
  }

  /* ---------------- 首页渲染 ---------------- */
  function buildHome() {
    var grid = $("[data-mount=chapters]");
    if (grid) {
      grid.innerHTML = CH.map(function (c) {
        return '<article class="chapter-card' + (isDone(c.id) ? " is-done" : "") + '" data-ch="' + c.id + '">' +
          '<div class="cc-top"><span class="cc-num">' + c.num + "</span>" +
          '<span class="cc-tag">' + c.tag + "</span>" +
          '<svg class="cc-done" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
          "</div>" +
          "<h3><a href=\"" + ROOT + "chapters/" + c.id + '.html">' + c.title + "</a></h3>" +
          "<p>" + c.desc + "</p>" +
          '<div class="cc-foot"><span>' + c.sections.length + " 个知识点</span><span>约 " + c.time + ' 分钟</span>' +
          '<span class="go">开始 →</span></div></article>';
      }).join("");
    }

    var stats = $("[data-mount=stats]");
    if (stats) {
      var secs = CH.reduce(function (a, c) { return a + c.sections.length; }, 0);
      var mins = CH.reduce(function (a, c) { return a + c.time; }, 0);
      stats.innerHTML =
        "<div><strong>" + CH.length + "</strong><span>章节</span></div>" +
        "<div><strong>" + secs + "</strong><span>知识点</span></div>" +
        "<div><strong>" + Math.round(mins / 60) + "h</strong><span>总时长</span></div>" +
        '<div><strong><span data-done-count>0</span></strong><span>已学完</span></div>';
    }

    $$("[data-mount=path]").forEach(function (host) {
      host.innerHTML = GROUPS.map(function (g, i) {
        var titles = { 0: "语法地基", 1: "数据容器", 2: "面向对象", 3: "进阶实战" };
        var lens = { 0: "把变量、运算符、流程控制这些积木彻底吃透，动手写 30+ 个小程序。", 1: "数组、字符串、包装类——面试与实战中出现频率最高的三件工具。", 2: "从类与对象到继承多态、接口内部类，建立真正的面向对象思维。", 3: "集合与 Lambda 打开新世界，最后用一个完整项目把知识串起来。" };
        return '<div class="path-step"><div class="idx">PART 0' + (i + 1) + "</div>" +
          "<h4>" + titles[i] + "</h4><p>" + lens[i] + "</p>" +
          '<div class="chips">' + g.ids.map(chapterById).filter(Boolean).map(function (c) {
            return '<a href="' + ROOT + "chapters/" + c.id + '.html">' + c.title + "</a>";
          }).join("") + "</div></div>";
      }).join("");
    });
  }

  /* ---------------- 其它交互 ---------------- */
  function initMisc() {
    var bar = $(".readbar");
    var toTop = $(".to-top");
    function onScroll() {
      var h = document.documentElement;
      var top = h.scrollTop || document.body.scrollTop;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      if (bar) bar.style.width = Math.min(100, (top / max) * 100) + "%";
      if (toTop) toTop.classList.toggle("show", top > 700);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    var menuBtn = $("[data-menu]");
    if (menuBtn) menuBtn.addEventListener("click", function () { document.body.classList.toggle("nav-open"); });
    document.addEventListener("click", function (e) {
      if (!document.body.classList.contains("nav-open")) return;
      if (e.target.closest(".sidebar") || e.target.closest("[data-menu]")) return;
      document.body.classList.remove("nav-open");
    });
    $$(".side-link").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("nav-open"); });
    });

    var markBtn = $("#markDone");
    if (markBtn) {      markBtn.addEventListener("click", function () {
        var now = !isDone(PAGE);
        setDone(PAGE, now);
        if (now) markBtn.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
          { duration: 320, easing: "ease-out" }
        );
      });
    }

    // 支持 #search 深链直达搜索面板
    if (location.hash === "#search" && window.__openSearch) {
      setTimeout(window.__openSearch, 60);
    }
  }

  /* ---------------- 外观设置（主题 / 字色 / 代码框 / 字号） ---------------- */
  var APPEARANCE_KEY = "java-appearance";
  var AP_DEFAULT = { theme: "warm", ink: "auto", codeBg: "dark", codeInk: "default", font: "m", leading: "normal", width: "normal" };
  var AP_LISTS = {
    theme: [["warm", "暖纸橙"], ["slate", "石墨靛"], ["forest", "森绿"], ["ocean", "海蓝"], ["rose", "玫瑰"], ["midnight", "深夜"]],
    ink: [["auto", "自动"], ["black", "纯黑"], ["gray", "深灰"], ["brown", "暖褐"], ["navy", "藏青"]],
    codeBg: [["dark", "深墨"], ["black", "纯黑"], ["navy", "深蓝"], ["light", "浅色"]],
    codeInk: [["default", "彩色"], ["bright", "高亮"], ["soft", "柔和"], ["mono", "单色"]],
    font: [["s", "小"], ["m", "标准"], ["l", "大"], ["xl", "特大"]],
    leading: [["compact", "紧凑"], ["normal", "标准"], ["relaxed", "宽松"]],
    width: [["narrow", "窄"], ["normal", "标准"], ["wide", "宽"]]
  };
  var AP_ATTR = { theme: "data-theme", ink: "data-ink", codeBg: "data-code-bg", codeInk: "data-code-ink", font: "data-font", leading: "data-leading", width: "data-width" };
  var AP_ICON = {
    ink: { auto: "ink-auto", black: "ink-black", gray: "ink-gray", brown: "ink-brown", navy: "ink-navy" },
    codeBg: { dark: "cb-dark", black: "cb-black", navy: "cb-navy", light: "cb-light" },
    codeInk: { default: "ci-default", bright: "ci-bright", soft: "ci-soft", mono: "ci-mono" }
  };

  function initAppearance() {
    var topbar = $(".topbar");
    if (!topbar) return;

    var state = (function () {
      var saved = {};
      try { saved = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || "{}") || {}; } catch (e) {}
      var s = {};
      Object.keys(AP_DEFAULT).forEach(function (k) {
        var v = saved[k] || AP_DEFAULT[k];
        var ok = AP_LISTS[k].some(function (pair) { return pair[0] === v; });
        s[k] = ok ? v : AP_DEFAULT[k];
      });
      return s;
    })();

    // 主题卡片
    var themeHtml = AP_LISTS.theme.map(function (pair) {
      return '<button type="button" data-val="' + pair[0] + '"><span class="theme-prev prev-' + pair[0] + '"></span><span class="theme-name">' + pair[1] + "</span></button>";
    }).join("");
    // 色板按钮
    function optHtml(group) {
      return AP_LISTS[group].map(function (pair) {
        return '<button type="button" class="opt" data-val="' + pair[0] + '"><i class="' + AP_ICON[group][pair[0]] + '"></i>' + pair[1] + "</button>";
      }).join("");
    }
    // 分段按钮
    function segHtml(group) {
      return AP_LISTS[group].map(function (pair) {
        return '<button type="button" data-val="' + pair[0] + '">' + pair[1] + "</button>";
      }).join("");
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-btn settings-btn";
    btn.id = "settingsBtn";
    btn.setAttribute("aria-label", "阅读外观设置");
    btn.setAttribute("title", "阅读外观设置");
    btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.11A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v0a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1z"/></svg>';

    var panel = document.createElement("div");
    panel.className = "settings-panel";
    panel.id = "settingsPanel";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="settings-head"><strong>阅读外观</strong><button type="button" data-reset>重置</button></div>' +
      '<div class="settings-body">' +
        '<div class="settings-group"><label>主题风格 <span class="label-note">· 整套配色</span></label><div class="theme-grid" data-group="theme">' + themeHtml + "</div></div>" +
        '<div class="settings-group"><label>正文文字颜色</label><div class="opt-grid" data-group="ink">' + optHtml("ink") + "</div></div>" +
        '<div class="settings-group"><label>代码块背景</label><div class="opt-grid" data-group="codeBg">' + optHtml("codeBg") + "</div></div>" +
        '<div class="settings-group"><label>代码字体颜色</label><div class="opt-grid" data-group="codeInk">' + optHtml("codeInk") + "</div></div>" +
        '<div class="settings-group"><label>排版</label><div class="two-col">' +
          '<div class="mini"><label>正文字号</label><div class="seg" data-group="font">' + segHtml("font") + "</div></div>" +
          '<div class="mini"><label>行间距</label><div class="seg" data-group="leading">' + segHtml("leading") + "</div></div>" +
          '<div class="mini"><label>内容宽度</label><div class="seg" data-group="width">' + segHtml("width") + "</div></div>" +
        "</div></div>" +
      "</div>" +
      '<div class="settings-tip">设置保存在本机浏览器，对全部章节生效。</div>';

    var searchBtn = $(".search-trigger", topbar);
    if (searchBtn) topbar.insertBefore(btn, searchBtn); else topbar.appendChild(btn);
    // 面板挂到 body：顶栏有 backdrop-filter，会拦截 fixed 定位的包含块
    document.body.appendChild(panel);

    var panelBody = $(".settings-body", panel);

    // 面板高度不够时，底部露出渐隐 + 细滚动条，提示还有内容
    function updateScrollHint() {
      if (!panelBody || panel.hidden) return;
      panelBody.classList.toggle("can-scroll", panelBody.scrollHeight - panelBody.clientHeight > 2);
    }

    function apply() {
      var root = document.documentElement;
      Object.keys(AP_ATTR).forEach(function (k) {
        if (k === "ink" && state.ink === "auto") root.removeAttribute(AP_ATTR[k]);
        else root.setAttribute(AP_ATTR[k], state[k]);
      });
      try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(state)); } catch (e) {}
      $$("[data-group]", panel).forEach(function (group) {
        var key = group.getAttribute("data-group");
        $$("button[data-val]", group).forEach(function (b) {
          b.classList.toggle("active", b.getAttribute("data-val") === state[key]);
        });
      });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      if (!panel.hidden && panelBody) panelBody.scrollTop = 0;
      updateScrollHint();
    });
    panel.addEventListener("click", function (e) {
      var reset = e.target.closest("[data-reset]");
      if (reset) {
        state = Object.assign({}, AP_DEFAULT);
        apply();
        return;
      }
      var b = e.target.closest("button[data-val]");
      if (!b) return;
      var key = b.closest("[data-group]").getAttribute("data-group");
      state[key] = b.getAttribute("data-val");
      apply();
      updateScrollHint();
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#settingsPanel") && !e.target.closest("#settingsBtn")) panel.hidden = true;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") panel.hidden = true;
    });
    window.addEventListener("resize", updateScrollHint);
    panelBody && panelBody.addEventListener("scroll", function () {
      if (panelBody.scrollTop + panelBody.clientHeight >= panelBody.scrollHeight - 4) {
        panelBody.classList.remove("can-scroll");
      } else {
        updateScrollHint();
      }
    }, { passive: true });

    apply();
  }

  // 整张章节卡片可点击
  function initCardLinks() {
    $$(".chapter-card").forEach(function (card) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        var a = card.querySelector("a[href]");
        if (a) window.location.href = a.getAttribute("href");
      });
    });
  }

  /* ---------------- 启动 ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildSidebar();
    buildHome();
    initCode();
    buildTOC();
    buildSearch();
    initMisc();
    initAppearance();
    initCardLinks();
    refreshProgressUI();
  });
})();
