/**
 * 内容质量核查：找出「密集长段落 / 只给结论 / 过于单薄」的章节。
 * 用法：node check-content.js  （只看报告，不阻断构建）
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'content');
const files = fs.readdirSync(DIR).filter((f) => /^part-.*\.md$/i.test(f)).sort();

const EXPLAIN = /因为|所以|这样|意味着|目的|原因|为什么|用于|便于|从而|因此|使得|是为了|可以理解为|原因在|区别在|代价|好处|适合|场景下|注意|导致|等价|相当于|背后|原理|之所|才能|避免|防止/;

function parse(file) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8').replace(/\r\n/g, '\n');
  const chunks = raw.split(/^===CH===\s*$/m).slice(1);
  return chunks.map((chunk) => {
    const m = chunk.match(/^([\s\S]*?)^===BODY===\s*$/m);
    if (!m) return null;
    const meta = {};
    m[1].split('\n').forEach((l) => {
      const x = l.match(/^(\w+):\s*(.*)$/);
      if (x) meta[x[1]] = x[2].trim();
    });
    return { no: Number(meta.no), title: meta.title || '', body: chunk.slice(m[0].length).trim(), meta };
  }).filter(Boolean);
}

// 只取「纯文字段落」：排除代码块内部、表格行、列表、引用、标题
function proseParagraphs(body) {
  const out = [];
  let inFence = false;
  let buf = [];
  const flush = () => { if (buf.length) { out.push(buf.join(' ').trim()); buf = []; } };
  for (const line of body.split('\n')) {
    if (/^```/.test(line)) { flush(); inFence = !inFence; continue; }
    if (inFence) continue;
    if (!line.trim()) { flush(); continue; }
    if (/^(#{3,4}\s|\||>\s?|- |\d+\.\s|---+\s*$)/.test(line.trim())) { flush(); continue; }
    buf.push(line.trim());
  }
  flush();
  return out;
}

const all = [];
for (const file of files) {
  for (const c of parse(file)) {
    const paras = proseParagraphs(c.body);
    const longest = paras.reduce((m, p) => Math.max(m, p.replace(/\s/g, '').length), 0);
    const longParas = paras.filter((p) => p.replace(/\s/g, '').length > 120).length;
    const headings = (c.body.match(/^### /gm) || []).length;
    const blocks = (c.body.match(/^```/gm) || []).length / 2 + (c.body.match(/^\s*\|[\s:|-]+\|\s*$/gm) || []).length;
    const chars = c.body.replace(/\s/g, '').length;
    const isCase = /案例|实战|大案例/.test(c.title);
    let explainHits = paras.filter((p) => EXPLAIN.test(p)).length;
    // 案例章的解释集中在「关键知识点」分点里，按该小节的条目数判定是否讲清
    if (isCase) {
      const sec = c.body.split(/^###\s*关键知识点\s*$/m)[1];
      if (sec) explainHits = (sec.split(/^###\s/m)[0].match(/^-\s+/gm) || []).length;
    }
    const issues = [];
    if (longParas) issues.push('长段落' + longParas);
    if (longest > 180) issues.push('最长段' + longest + '字');
    if (headings < (isCase ? 2 : 3)) issues.push('小节仅' + headings);
    if (chars < (isCase ? 400 : 600)) issues.push('偏短' + chars + '字');
    if (!isCase && blocks < 2) issues.push('示例/表格仅' + Math.round(blocks));
    if (explainHits < 2) issues.push('缺解释');

    // v3 案例章专项：必须有一段完整代码 + 至少 3 处行内关键点注解
    let caseCode = 0; let keyNotes = 0;
    if (isCase) {
      const fenceLines = [...c.body.matchAll(/^```(?:js|javascript|html|text)?\s*$/gm)].map((m) => m.index);
      for (let i = 0; i + 1 < fenceLines.length; i += 2) {
        const block = c.body.slice(fenceLines[i], fenceLines[i + 1]);
        caseCode = Math.max(caseCode, block.split('\n').length - 1);
      }
      keyNotes = (c.body.match(/\/\/ ← 关键点/g) || []).length;
      if (caseCode < 12) issues.push('缺完整案例代码(' + caseCode + '行)');
      if (keyNotes < 3) issues.push('关键点注解' + keyNotes);
    }
    all.push({ file, no: c.no, title: c.title, chars, headings, longParas, longest, blocks, explainHits, isCase, caseCode, keyNotes, issues });
  }
}

console.log('── 内容质量核查 ──────────────────────────────');
console.log('章节总数：' + all.length);
const byFile = {};
all.forEach((c) => {
  if (!byFile[c.file]) byFile[c.file] = { n: 0, bad: 0, long: 0, short: 0, few: 0, chars: 0 };
  const b = byFile[c.file];
  b.n++; b.chars += c.chars;
  if (c.issues.length) b.bad++;
  if (c.longParas) b.long++;
  if (c.chars < 600) b.short++;
  if (c.headings < 3) b.few++;
});
Object.keys(byFile).sort().forEach((f) => {
  const b = byFile[f];
  console.log(`  ${f.padEnd(16)} ${String(b.n).padStart(2)}章  ${String(b.chars).padStart(6)}字  有问题${String(b.bad).padStart(2)}章  (长段落${b.long} / 偏短${b.short} / 小节少${b.few})`);
});
const bad = all.filter((c) => c.issues.length);
console.log(`\n需整改章节：${bad.length} / ${all.length}`);
console.log('平均每章字数：' + Math.round(all.reduce((s, c) => s + c.chars, 0) / all.length));
console.log('平均每章小节：' + (all.reduce((s, c) => s + c.headings, 0) / all.length).toFixed(1));
console.log('\n问题示例（前 12 条）：');
bad.slice(0, 12).forEach((c) => console.log(`  第${String(c.no).padStart(3)}章 ${c.title}  → ${c.issues.join('、')}`));
