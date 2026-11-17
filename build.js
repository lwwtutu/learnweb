/**
 * 内容构建器：把 content/part-*.md 打包成前端可直接加载的 JS 数据。
 * 用法：node build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_DIR = path.join(ROOT, 'assets', 'data');
const OUT_FILE = path.join(OUT_DIR, 'content.js');

// material 文件夹顺序中、笔记未覆盖的区间（只在路线图里提示，不生成学习页）
const GAPS = [
  {
    after: 4,
    range: '065',
    title: '案例：倒计时',
    note: '属第 36 章定时器的延伸练习，笔记未单列章节',
  },
  {
    after: 7,
    range: '108–118',
    title: '正则表达式 与 this 指向（第 79–89 章）',
    note: '笔记中标注为编号占位、暂未编写',
  },
  {
    after: 10,
    range: '155–161',
    title: 'cookie / jsonp / 闭包（第 126–132 章）',
    note: '笔记目录列出但正文未覆盖',
  },
  {
    after: 11,
    range: '192–199',
    title: 'Bootstrap / Sass / 课程收尾',
    note: '超出笔记知识范围',
  },
];

// 期望的完整章节清单，用于校验是否漏章 / 重复 / 乱序
const EXPECTED = {
  'part-01': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  'part-02': [11, 12, 13, 14, 15, 16, 17, 18, 19],
  'part-03': [20, 21, 22, 23, 24, 25],
  'part-04': [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  'part-05': [37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
  'part-06': [47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57],
  'part-07': [58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78],
  'part-08': [90, 91, 92, 93, 94, 95, 96],
  'part-09': [97, 98, 99, 100, 101, 102, 103, 104, 105],
  'part-10': [106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125],
  'part-11': [133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162],
};

const VALID_LANGS = new Set(['js', 'javascript', 'html', 'text']);
const problems = [];
const warnings = [];

function parseMeta(block, label) {
  const meta = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return meta;
}

function validateBody(body, tag) {
  if (!body || body.trim().length < 120) problems.push(`${tag}: 正文过短或为空`);
  if (/^===/m.test(body)) problems.push(`${tag}: 正文含 === 开头行（会破坏解析）`);
  // 只匹配真正的课程文件引用；URL 示例里的 index.html、九九乘法表的「第 1 行」不算
  if (/material\/|对应代码|第\s*\d+\s*行(?:的)?代码|第\s*\d+-\d+\s*行/.test(body)) {
    warnings.push(`${tag}: 疑似残留课程文件引用`);
  }
  if (/^##?\s/m.test(body)) warnings.push(`${tag}: 正文使用了 H1/H2 标题`);

  const fences = body.match(/^```/gm) || [];
  if (fences.length % 2 !== 0) problems.push(`${tag}: 代码围栏未闭合`);
  for (const m of body.matchAll(/^```(\w*)\s*$/gm)) {
    if (m[1] && !VALID_LANGS.has(m[1])) problems.push(`${tag}: 非法代码语言 "${m[1]}"`);
  }

  // 表格分隔行校验
  const lines = body.split('\n');
  for (let i = 1; i < lines.length; i++) {
    if (/^\s*\|/.test(lines[i - 1]) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) {
      if (!/^\s*\|(?:\s*:?-{3,}:?\s*\|)+/.test(lines[i])) {
        problems.push(`${tag}: 第 ${i} 行表格分隔行格式错误`);
      }
    }
  }
}

// ---------- 读取并解析 ----------
const files = fs
  .readdirSync(CONTENT_DIR)
  .filter((f) => /^part-[a-z0-9-]+\.md$/i.test(f))
  .sort();

const partMap = new Map();
let fileCount = 0;

for (const file of files) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8').replace(/\r\n/g, '\n');
  const chunks = raw.split(/^===CH===\s*$/m);
  const partBlock = chunks.shift().replace(/^===PART===\s*$/m, '').trim();
  const pm = parseMeta(partBlock);
  for (const key of ['id', 'order', 'title', 'range', 'desc']) {
    if (!pm[key]) problems.push(`${file}: 篇元信息缺少 ${key}`);
  }
  if (!pm.id) continue;
  fileCount++;

  if (!partMap.has(pm.id)) {
    partMap.set(pm.id, {
      id: pm.id,
      order: Number(pm.order) || 99,
      title: pm.title || '',
      range: pm.range || '',
      desc: pm.desc || '',
      chapters: [],
      _files: [],
    });
  }
  const part = partMap.get(pm.id);
  part._files.push(file);

  chunks.forEach((chunk, idx) => {
    const marker = chunk.match(/^([\s\S]*?)^===BODY===\s*$/m);
    if (!marker) {
      problems.push(`${file}: 第 ${idx + 1} 个章节缺少 ===BODY=== 分隔符`);
      return;
    }
    const cm = parseMeta(marker[1]);
    const body = chunk.slice(marker[0].length).trim();
    const tag = `${file} 第${cm.no || idx}章`;

    for (const key of ['no', 'title', 'lessons', 'summary', 'points']) {
      if (!cm[key]) problems.push(`${tag}: 缺少字段 ${key}`);
    }
    validateBody(body, tag);

    const points = (cm.points || '')
      .split(/\s*\|\|\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    part.chapters.push({
      no: Number(cm.no),
      title: cm.title || '',
      lessons: cm.lessons || '',
      summary: cm.summary || '',
      points,
      body,
    });
  });
}

// ---------- 合并、排序、校验 ----------
const parts = [...partMap.values()].sort((a, b) => a.order - b.order);
for (const p of parts) {
  p.chapters.sort((a, b) => a.no - b.no);
  p.sources = p._files;
  delete p._files;

  const dup = p.chapters.map((c) => c.no).filter((n, i, arr) => arr.indexOf(n) !== i);
  if (dup.length) problems.push(`${p.id}: 章号重复 ${[...new Set(dup)].join(',')}`);

  const expected = EXPECTED[p.id] || [];
  const actual = p.chapters.map((c) => c.no);
  const missing = expected.filter((n) => !actual.includes(n));
  if (missing.length) warnings.push(`${p.id}: 尚未生成章节 ${missing.join(', ')}（共 ${missing.length} 章）`);
  const extra = actual.filter((n) => !expected.includes(n));
  if (extra.length) problems.push(`${p.id}: 出现清单外章号 ${extra.join(',')}`);
}

const totalChapters = parts.reduce((s, p) => s + p.chapters.length, 0);
const totalChars = parts.reduce(
  (s, p) => s + p.chapters.reduce((n, c) => n + c.body.length, 0),
  0
);

// ---------- 输出 ----------
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const payload = {
  generatedAt: new Date().toISOString(),
  gaps: GAPS,
  stats: {
    parts: parts.length,
    chapters: totalChapters,
    chars: totalChars,
    expectedChapters: Object.values(EXPECTED).reduce((s, a) => s + a.length, 0),
  },
  parts,
};
fs.writeFileSync(OUT_FILE, 'window.COURSE_DATA = ' + JSON.stringify(payload, null, 2) + ';\n', 'utf8');

console.log('── 内容构建报告 ─────────────────────────');
console.log(`内容文件   : ${fileCount} 个`);
console.log(`篇 / 章节  : ${parts.length} 篇 / ${totalChapters} 章（目标 ${payload.stats.expectedChapters} 章）`);
console.log(`正文字数   : ${totalChars.toLocaleString()} 字符`);
console.log(`输出文件   : ${path.relative(ROOT, OUT_FILE)}`);
parts.forEach((p) => console.log(`  ${String(p.order).padStart(2, '0')} ${p.title.padEnd(22, ' ')} ${String(p.chapters.length).padStart(2)} 章  ${p.range}`));
if (problems.length) {
  console.log(`\n错误 ${problems.length} 条：`);
  problems.forEach((x) => console.log('  ✗ ' + x));
}
if (warnings.length) {
  console.log(`\n提示 ${warnings.length} 条：`);
  warnings.forEach((x) => console.log('  ! ' + x));
}
console.log(`\n结果：${problems.length ? '存在错误，请修正' : '校验通过'}`);
process.exitCode = problems.length ? 1 : 0;
