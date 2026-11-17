/**
 * 把 content/cases/<章号>.md 里的纯 BODY 文本合并回对应的 content/part-*.md 章节。
 * 案例章由内容生成者单独产出补丁，避免整文件重写时误改其他章节。
 * 用法：node apply-cases.js
 */
const fs = require('fs');
const path = require('path');

const CONTENT = path.join(__dirname, 'content');
const CASES = path.join(CONTENT, 'cases');

if (!fs.existsSync(CASES)) {
  console.log('没有 content/cases 目录，无需合并');
  process.exit(0);
}

const patches = new Map();
for (const f of fs.readdirSync(CASES)) {
  const m = f.match(/^(\d+)\.md$/);
  if (!m) continue;
  const text = fs.readFileSync(path.join(CASES, f), 'utf8').replace(/\r\n/g, '\n').trim();
  if (!text) { console.log('跳过空补丁：' + f); continue; }
  patches.set(Number(m[1]), text);
}
console.log('读取到 ' + patches.size + ' 个案例章补丁：' + [...patches.keys()].sort((a, b) => a - b).join(', '));

const files = fs.readdirSync(CONTENT).filter((x) => /^part-.*\.md$/i.test(x)).sort();
const applied = [];
for (const f of files) {
  const p = path.join(CONTENT, f);
  const raw = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  const segs = raw.split(/(?=^===CH===\s*$)/m);
  let changed = false;
  const out = segs.map((seg) => {
    const noMatch = seg.match(/^===CH===\s*\nno:\s*(\d+)\s*$/m);
    if (!noMatch) return seg;
    const no = Number(noMatch[1]);
    if (!patches.has(no)) return seg;
    const head = seg.match(/^([\s\S]*?^===BODY===\s*$)/m);
    if (!head) { console.log('  ✗ 第 ' + no + ' 章缺少 ===BODY===，跳过'); return seg; }
    changed = true;
    applied.push(no);
    return head[1] + '\n' + patches.get(no) + '\n';
  }).join('');
  if (changed) { fs.writeFileSync(p, out, 'utf8'); console.log('  已更新 ' + f); }
}

const missing = [...patches.keys()].filter((n) => !applied.includes(n));
console.log('\n合并完成：' + applied.length + ' / ' + patches.size + ' 章');
if (missing.length) {
  console.log('未匹配到源章节的补丁：' + missing.join(', '));
  process.exitCode = 1;
}
