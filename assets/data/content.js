/* 内容装配：把各篇数据 + 深入讲解合并成统一结构，供 app.js 消费
   VUE_PARTS  → 篇 / 章 / 正文
   VUE_DEEP   → 按章号索引的「深入理解」与「自查题」 */
(function () {
  'use strict';
  var parts = (window.VUE_PARTS || []).slice().sort(function (a, b) { return a.order - b.order; });
  var deep = window.VUE_DEEP || {};
  var chapters = 0;
  var chars = 0;
  var quizTotal = 0;
  var missing = [];

  parts.forEach(function (p) {
    p.chapters.forEach(function (c) {
      var d = deep[c.no];
      if (d) {
        if (d.deep) c.deep = d.deep;
        if (d.quiz && d.quiz.length) c.quiz = d.quiz;
        if (!c.summary2 && d.summary) c.summary2 = d.summary;
      } else {
        missing.push(c.no);
      }
      chapters++;
      chars += String(c.body || '').replace(/\s+/g, '').length;
      chars += String(c.deep || '').replace(/\s+/g, '').length;
      quizTotal += (c.quiz || []).length;
    });
  });

  window.COURSE_DATA = {
    generatedAt: new Date().toISOString(),
    stats: { parts: parts.length, chapters: chapters, chars: chars, quiz: quizTotal, missingDeep: missing },
    parts: parts
  };
})();
