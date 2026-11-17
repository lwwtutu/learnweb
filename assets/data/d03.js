/* 第 3 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[12] = {
  deep: `### @click 的三种写法，编译成三种不同的东西

| 模板写法 | 编译结果（简化） | 含义 |
| --- | --- | --- |
| \`@click="fn"\` | \`onClick: _ctx.fn\` | 直接挂函数引用 |
| \`@click="fn()"\` | \`onClick: $event => _ctx.fn()\` | 包一层，传入时才调用 |
| \`@click="count++"\` | \`onClick: $event => (_ctx.count++) \` | 包一层，执行表达式 |
| \`@click="fn($event, 1)"\` | \`onClick: $event => _ctx.fn($event, 1)\` | \`$event\` 是编译器注入的变量 |

关键结论：**带括号不是「立即执行」，而是「被包装成一个新函数」**。Vue 编译器看到不是简单标识符时，会自动帮你包成 \`$event => ...\`。所以 \`@click="fn()"\` 在点击时才执行，不会在渲染时执行。

唯一的例外是「把函数调用的返回值当监听器」：\`@click="makeHandler()"\` 里的 \`makeHandler()\` 会在**渲染时**执行，把返回的函数挂上去。这不是 Vue 的行为问题，而是你把表达式写成了调用——判断依据是：括号外面还套了一层「函数工厂」。

### 修饰符是「包装函数」，顺序决定结果

\`\`\`html
<a @click.stop.prevent="go">
\`\`\`

编译成 \`withModifiers(go, ['stop', 'prevent'])\`，运行时按数组顺序依次执行：先 \`e.stopPropagation()\`，再 \`e.preventDefault()\`。

所以 \`@click.prevent.self\` 与 \`@click.self.prevent\` 行为不同：前者对**所有点击**都 prevent，再判断是否 self；后者先判断 self，只有点在自身时才 prevent。这类差异只在「嵌套元素」时才暴露出来。

### 表单的默认行为，为什么必须 prevent

\`\`\`html
<form @submit="onSubmit">
\`\`\`

不写 \`.prevent\` 时，浏览器会执行表单的原生提交：把页面导航到 action 指向的地址（没写 action 就是当前地址），**整页刷新**。表现就是「点提交后数据消失、控制台清空、URL 多了个 ?」。

\`\`\`html
<form @submit.prevent="onSubmit">
\`\`\`

\`\`\`html
<button type="button" @click="onSubmit">
\`\`\`

第二种写法其实绕开了表单提交，把按钮变成普通按钮（\`type="button"\` 才不是 submit）。两种都行，但**回车提交**只有表单方案支持——所以推荐 \`@submit.prevent\`。

### target 与 currentTarget 的区别

\`\`\`html
<ul @click="onClick">
  <li><span>文字</span></li>
</ul>
\`\`\`

- \`e.target\`：真正被点的元素（这里的 \`span\`）。
- \`e.currentTarget\`：绑定监听器的元素（\`ul\`）。

\`.self\` 修饰符的判断就是 \`e.target === e.currentTarget\`。这也解释了「点弹窗内容却把弹窗关了」的常见 bug：监听在遮罩上，点到内部子元素时 target 是子元素，但事件冒泡到了遮罩——用 \`.self\` 而不是 \`@click\` 判断坐标，才是正解。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <button @click="log('无修饰符', $event)">无修饰符</button>
  <button @click.stop="log('stop', $event)">stop</button>
  <div @click="log('外层 div 收到冒泡')">
    <button @click="log('内层按钮')">点我，看冒泡</button>
    <button @click.stop="log('内层按钮 stop')">点我，看冒泡</button>
  </div>
</div>
<script>
  Vue.createApp({
    methods: { log(tag, e) { console.log(tag, e ? (e.target.tagName + ' → ' + e.currentTarget.tagName) : '') } }
  }).mount('#app')
</script>
\`\`\`

> 💡 点第一个「内层按钮」，控制台先打印「内层按钮」，再打印「外层 div 收到冒泡」；点带 \`.stop\` 的那个，只打印一行。同时能看到 target 恒为 BUTTON，而 currentTarget 分别是 BUttON 与 DIV。`,
  quiz: [
    { q: '@click="fn()" 会在渲染时立即执行吗？为什么？', a: '不会。编译器发现值不是简单标识符时，会把它包成 $event => fn() 再挂到 onClick，只有点击时才调用。' },
    { q: '表单用 @submit 不加 .prevent 会发生什么？', a: '触发浏览器原生提交：页面导航/刷新，状态全丢。应写 @submit.prevent，或把按钮改成 type="button" 用 @click（但会失去回车提交）。' },
    { q: 'e.target 与 e.currentTarget 有什么区别？.self 用的是哪个判断？', a: 'target 是实际触发的元素（可能被冒泡带上来），currentTarget 是绑定监听器的元素。.self 判断 target === currentTarget。' }
  ]
};

window.VUE_DEEP[13] = {
  deep: `### 同是 v-model，编译产物完全不同

\`\`\`html
<input v-model="msg">                    <!-- value + input -->
<input type="checkbox" v-model="ok">     <!-- checked + change -->
<input type="radio" value="A" v-model="picked">  <!-- checked + change -->
<select v-model="sel">                   <!-- value + change -->
\`\`\`

编译器会根据 \`type\` 选择不同的指令实现（\`vModelText\` / \`vModelCheckbox\` / \`vModelRadio\` / \`vModelSelect\`）。所以：

- 文本框绑的是 \`value\`（property），不是 attribute。
- 复选框绑的是 \`checked\`，并且值为数组时会做 \`push / splice\`，不做替换。
- 下拉框绑 \`value\`，多选时值是数组。

这也说明「v-model 是统一语法糖」只是表面：**底层每个控件各有各的实现**，所以遇到诡异行为（比如复选框绑数组时的顺序）时，去查对应控件的实现，比套用「双向绑定」的笼统理解更有效。

### 修饰符的编译产物

\`\`\`html
<input v-model.trim.number.lazy="age">
\`\`\`

编译后的事件处理大致是：

\`\`\`js
onUpdate:modelValue: $event => {
  if ($event.target.composing) return          // 中文输入法保护
  _ctx.age = $event.target.value.trim()        // trim
  // number 走的是 loosingToNumber：能转就转，不能转保留原字符串
}
\`\`\`

注意 \`composing\` 这个判断：\`v-model\` 内置了输入法保护，拼音组合期间不写数据。你自己用 \`:value + @input\` 手写时没有这层保护，中文输入会「把拼音写进数据再逐字删除」，非常难受。

### .number 到底怎么转

它用的不是 \`Number()\`，而是更宽松的 \`parseFloat\` 语义：\`'12abc'\` → \`12\`；\`'abc'\` → 保持字符串 \`'abc'\`；\`''\` → 保持 \`''\`（不是 0）。

所以 **\`.number\` 不保证类型是数字**。要做数值运算前，仍需 \`Number(x) || 0\` 兜底，或者在后端字段上要求 number 且前端提交时显式转换。

### 一个真实的一致性 bug

\`\`\`js
data() { return { form: { age: '' } } }
\`\`\`

输入框里删空后，\`form.age\` 是空字符串。提交时 \`JSON.stringify\` 发出 \`{"age": ""}\`，后端强类型字段直接 400。这类问题不是 Vue 的，而是「\`<input>\` 永远产出字符串」这一事实在数据层的延伸。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <p><input v-model.number="a" placeholder="试试输 12abc"> a = {{ a }}（{{ typeof a }}）</p>
  <p><input v-model.lazy="b" placeholder="输入后按回车/失焦才更新"> b = {{ b }}</p>
  <p><input type="checkbox" v-model="arr" value="x">x
     <input type="checkbox" v-model="arr" value="y">y
     arr = {{ arr }}</p>
</div>
<script>Vue.createApp({ data: () => ({ a: '', b: '', arr: [] }) }).mount('#app')</script>
\`\`\`

> 💡 输入 \`12abc\` 后 \`a\` 显示 12（number）；只输 \`abc\` 时 \`a\` 仍是字符串 \`abc\`（{{ typeof a }} 显示 string）。.lazy 那个在输入时不动，失焦才更新。复选框绑数组时，勾选顺序决定数组顺序。`,
  quiz: [
    { q: 'v-model 在文本框和复选框上，分别绑定了什么属性、什么事件？', a: '文本框绑 value + input；复选框绑 checked + change，并且当值为数组时用 push/splice 修改原数组。' },
    { q: 'v-model.number 输入 "12abc" 和 "abc"，分别得到什么？', a: '得到数字 12（parseFloat 语义）和字符串 "abc"（转换失败保留原值）。所以 .number 不保证类型一定是数字。' },
    { q: '自己用 :value + @input 封装输入框，中文输入会出什么问题？为什么 v-model 没这问题？', a: '拼音组合过程中 input 事件也会触发，把未成形的拼音写进数据。v-model 内部读 e.target.composing，组合期间直接 return，所以不会写入。' }
  ]
};

window.VUE_DEEP[14] = {
  deep: `### 为什么「全选」不该是一个独立状态

如果你存了 \`isAllChecked\`，那它就有三个更新点：

1. 用户点全选框 → 更新 \`isAllChecked\` + \`checkList\`
2. 用户勾某一项 → 可能要更新 \`isAllChecked\`
3. 用户删除一项 → 可能要更新 \`isAllChecked\`

三个地方只要有一个忘了，界面就自相矛盾：全选框是勾上的，但列表里只选了两个。**每多一个状态，就多 N 个必须同步的地方**。

用可写计算属性后，只有两个来源：\`datalist\` 与 \`checkList\`。全选框变成「读的时候算出来的」，而写入被翻译成对 \`checkList\` 的操作：

\`\`\`js
set(checked) { this.checkList = checked ? [...this.datalist] : [] }
\`\`\`

注意 \`[...this.datalist]\` 是浅拷贝：如果直接 \`this.checkList = this.datalist\`，两个变量指向同一个数组，后续 \`checkList.push\` 会污染 \`datalist\`。这是「派生状态」实现里最常见的坑。

### reduce 的求值时机

\`\`\`js
total() {
  return this.checkList.reduce((sum, i) => sum + i.price * i.number, 0)
}
\`\`\`

它在 \`checkList\`、以及每一项的 \`price\`/\`number\` 变化时重算。注意是「依赖到字段级」：只改 \`number\` 也会重算，因为 getter 读了它。

反过来，如果你写成 \`total() { return this.datalist.reduce(...) }\`（用全部商品而不是勾选项），那勾选变化**不会**触发重算——因为 getter 没读 \`checkList\`。依赖收集是「读到什么就记什么」，不是「大致相关就记」。

### 存对象还是存 id

\`\`\`js
checkList: []        // 存商品对象
\`\`\`

问题：商品对象如果被整体替换（比如重新拉了一次列表），\`checkList\` 里还是旧引用，\`includes\` 比较失败、金额算出来是旧的。

\`\`\`js
checkIds: []         // 存 id
\`\`\`

勾选状态与对象解耦：渲染时 \`checkIds.includes(item.id)\`，算金额时 \`datalist.filter(i => checkIds.includes(i.id))\`。代价是多一次查找，收益是「数据刷新后勾选状态依然有效」。列表超过几千条时，把 \`checkIds\` 换成 \`Set\` 提升查找性能。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <label><input type="checkbox" v-model="all"> 全选</label>
  <div v-for="item in list" :key="item.id">
    <label><input type="checkbox" :value="item.id" v-model="ids"> {{ item.name }}（{{ item.price }}）</label>
    <button @click="remove(item.id)">删</button>
  </div>
  <p>合计：{{ total }}，已选：{{ ids.length }}</p>
</div>
<script>
  Vue.createApp({
    data: () => ({
      list: [{ id: 1, name: 'A', price: 10 }, { id: 2, name: 'B', price: 20 }],
      ids: []
    }),
    computed: {
      all: {
        get() { return this.list.length > 0 && this.ids.length === this.list.length },
        set(v) { this.ids = v ? this.list.map(i => i.id) : [] }
      },
      total() { return this.list.filter(i => this.ids.includes(i.id)).reduce((s, i) => s + i.price, 0) }
    },
    methods: { remove(id) { this.list = this.list.filter(i => i.id !== id); this.ids = this.ids.filter(x => x !== id) } }
  }).mount('#app')
</script>
\`\`\`

> 💡 先点全选，再删掉一个商品：\`all\` 自动变回未选中（因为 getter 重算了），不需要任何额外代码。这就是「派生状态」的价值：**你不需要维护一致性，一致性是算出来的**。`,
  quiz: [
    { q: '为什么「全选」存成独立状态容易出现界面自相矛盾？', a: '它有三个更新点（点全选、勾单项、删项），漏掉任一个就与 checkList 不一致。改成可写计算属性后，值由两个源状态算出来，不存在第三方状态。' },
    { q: 'set(checked) { this.checkList = checked ? this.datalist : [] } 有什么隐患？', a: '直接赋值让两个变量指向同一个数组，之后对 checkList 的操作会反过来改动 datalist。应浅拷贝：[...this.datalist]。' },
    { q: '勾选列表存对象和存 id，各有什么问题与好处？', a: '存对象：列表刷新/替换后旧引用失效，includes 与金额计算会出错；存 id：与对象解耦、刷新后仍有效，代价是多一次查找（可用 Set 优化）。' }
  ]
};

window.VUE_DEEP[15] = {
  deep: `### computed 与渲染函数共用一套 effect 机制

渲染函数本身是一个 effect；computed 的 getter 也是一个 effect，只是带 \`lazy\` 与 \`scheduler\`：

\`\`\`js
// 概念示意
function computed(getter) {
  let value, dirty = true
  const runner = effect(getter, {
    lazy: true,                          // 不立即执行
    scheduler: () => { dirty = true }    // 依赖变化只置脏
  })
  return {
    get value() {
      if (dirty) { value = runner(); dirty = false }
      return value
    }
  }
}
\`\`\`

由此可以推出三件事：

1. **不读就不会算**：没人访问 \`.value\`（模板没用到它），getter 永远不会执行。这在调试「computed 没执行」时很关键。
2. **读的时候才收集依赖**：如果 getter 里有条件分支，只走了一条分支，那另一条分支里的数据就不会成为依赖。
3. **scheduler 只置脏**：依赖变化不会立刻重算，而是等下一次读取。所以连续改三个依赖，只重算一次。

### 「不要在 getter 里做副作用」的机制原因

\`\`\`js
computed: {
  warning() {
    if (this.count > 10) console.log('太多了')   // ❌ 副作用
    return this.count > 10
  }
}
\`\`\`

因为缓存，这个 \`console.log\` 只在「dirty 为 true 且被读取」时执行，而不是「count 每次变化」时执行。于是日志次数取决于「有没有人读它」——这让副作用变得不可预测，也让排查变得极其困难。

**getter 的职责是「给定输入，返回输出」，任何依赖外部世界的操作都不该放进来**（请求、DOM、localStorage、时间）。

### computed 依赖 computed 的链路

\`\`\`js
computed: {
  a() { return this.count * 2 },
  b() { return this.a + 1 }
}
\`\`\`

链条是：\`count\` → \`a\` → \`b\`。改 \`count\` 时，\`a\` 的 dirty 置 true；\`b\` 依赖 \`a\`，但 \`b\` 只有在被读取时才会去读 \`a\`，于是 \`a\` 才重算。整条链是**惰性传播**的，不会一次改数据就全量重算。

### 只读是怎么限制的

Vue 返回的 computed ref 上没有 setter，直接赋值会触发开发环境警告「Write operation failed: computed value is readonly」。要可写，必须显式给 \`get/set\`（第 3.3 章的全选例子）——这是刻意的设计：**让你在写之前先想清楚「写入该落到哪个源状态」**。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <p>{{ a }} / {{ b }}</p>
  <button @click="count++">count++</button>
</div>
<script>
  Vue.createApp({
    data: () => ({ count: 0 }),
    computed: {
      a() { console.log('a 计算'); return this.count * 2 },
      b() { console.log('b 计算'); return this.a + 1 }
    }
  }).mount('#app')
</script>
\`\`\`

1. 页面加载：打印一次「a 计算」「b 计算」。
2. 点 count++：仍只各打印一次（一次渲染内两个都读了，但只重算一次）。
3. 把 \`<p>{{ a }} / {{ b }}</p>\` 改成 \`<p>{{ count }}</p>\`（没人读 a、b），再点按钮。

> 💡 第三步之后再也不打印——没人读，getter 就不执行。这就是「惰性求值」的直接证据，也解释了为什么「computed 没触发」往往只是「模板里没用它」。`,
  quiz: [
    { q: 'computed 的 getter 什么时候才执行？', a: '在被读取且 dirty 为 true 时执行。没人读就永远不执行；依赖变化只是把 dirty 置 true，不主动重算。' },
    { q: '为什么在 computed 里打印日志/发请求，行为会「时有时无」？', a: '因为执行时机绑定在「被读取」而不是「依赖变化」上，还受缓存影响。日志次数取决于模板是否读它，所以不可预测。' },
    { q: 'computed 链（b 依赖 a）在 count 变化时是全部重算吗？', a: '不是。count 变化只把 a 置脏；b 被读取时才去读 a，触发 a 重算并拿到新值，属于惰性传播。' }
  ]
};

window.VUE_DEEP[16] = {
  deep: `### flush 决定回调在 DOM 更新的哪一侧

\`\`\`js
watch: {
  msg() { console.log(this.$refs.p.textContent) },
  msg2: { handler() {}, flush: 'post' }
}
\`\`\`

| flush | 时机 | 读 DOM 时看到 |
| --- | --- | --- |
| \`'pre'\`（默认） | 组件更新**之前** | 旧 DOM |
| \`'post'\` | 组件更新**之后** | 新 DOM |
| \`'sync'\` | 数据一变立刻同步执行 | 旧 DOM（且会阻塞渲染） |

默认 \`pre\` 是有理由的：大多数副作用（校验、请求、写另一个状态）不需要 DOM，提前执行能避免「一帧的中间态被用户看到」。需要读新 DOM 时才用 \`post\`，或者 \`await nextTick()\`。

### deep 是怎么实现的

\`\`\`js
watch(obj, cb, { deep: true })
\`\`\`

Vue 会做一次 **traverse**：递归读取对象的所有属性（只读，不修改），目的是让每个嵌套属性都把当前 watcher 收集进依赖。所以：

- \`deep: true\` 的成本与对象的属性数量成正比，对象越大越慢。
- 数组长度变化、对象新增键（在 Vue 3 里）也能被侦听到，因为有 Proxy。

如果只关心某一层，用字符串路径或 getter 精确监听，比 \`deep\` 便宜得多：

\`\`\`js
watch: { 'user.profile.name'(v) {} }        // 只监听这一个字段
watch(() => state.user.profile.name, cb)     // 组合式写法
\`\`\`

### 为什么 deep 时新旧值相同

\`\`\`js
watch: { obj: { handler(n, o) { console.log(n === o) }, deep: true } }
\`\`\`

对象没有被替换，只是内部属性变了，所以 \`n\` 与 \`o\` 指向同一个引用。要比较差异，只能自己存快照：

\`\`\`js
watch: { obj: { handler(n, o) { diff(this.snapshot, n); this.snapshot = JSON.parse(JSON.stringify(n)) }, deep: true } }
\`\`\`

### 异步副作用必须处理竞态

\`\`\`js
watch: {
  keyword: async function (kw) {
    const res = await api.search(kw)
    this.list = res.data        // 可能已被更晚的请求覆盖
  }
}
\`\`\`

快速输入「vue」时，请求 \`v\`、\`vu\`、\`vue\` 三个，返回顺序不保证。晚发的可能先到，于是界面显示的是 \`v\` 的结果。三种解法：

1. 给每次请求打序号，只接受最新序号的响应。
2. 用 \`AbortController\` 取消旧请求（组合式 API 里 \`onCleanup\` 正好做这个）。
3. 防抖：等用户停 300ms 再发（最常用，也最省流量）。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <input v-model="msg"><p ref="p">{{ msg }}</p>
</div>
<script>
  Vue.createApp({
    data: () => ({ msg: '' }),
    watch: {
      msg() { console.log('pre:', this.$refs.p.textContent) },
      msg2: { handler() {}, flush: 'post' }
    },
    updated() { console.log('updated 里:', this.$refs.p.textContent) }
  }).mount('#app')
</script>
\`\`\`

把 \`msg()\` 改成带 \`flush: 'post'\` 的对象写法各试一次。

> 💡 默认 \`pre\` 打印的是**上一次**的文本（旧 DOM），\`post\` 与 \`updated\` 打印的是新文本。这一个实验就能记住 flush 的意义，比背「pre 是更新前」有用。`,
  quiz: [
    { q: 'watch 默认 flush 是 pre，这时代码里读 DOM 会读到什么？', a: '读到更新前的旧 DOM。需要读新 DOM 时用 flush: post，或 await nextTick()。' },
    { q: 'deep: true 的实现成本体现在哪里？什么时候不该用它？', a: 'Vue 会递归 traverse 对象的所有属性来收集依赖，成本与属性数量成正比。大对象、高频更新场景应改用 getter 或字符串路径精确监听。' },
    { q: 'deep 监听对象时，为什么 newVal === oldVal？怎么拿到差异？', a: '对象引用没有变化，只是内部属性变了。要比较差异必须自己保存一份快照（深拷贝），再与新值对比。' }
  ]
};

window.VUE_DEEP[17] = {
  deep: `### fetch 的 Response 只能读一次

\`\`\`js
const res = await fetch('/api/user')
await res.json()      // 读掉 body 流
await res.text()      // ❌ TypeError: body already read
\`\`\`

\`Response.body\` 是一个 **ReadableStream**，读过就没了。要复用，先 \`res.clone()\`。这也是「拦截器里打印响应体、结果业务代码拿不到数据」的原因——axios 帮你把数据读完存进了 \`res.data\`，所以不存在这个问题。

### 错误分三层，处理方式不同

| 层 | 例子 | fetch 行为 | 该怎么处理 |
| --- | --- | --- | --- |
| 网络层 | 断网、DNS 失败、CORS 被拦 | reject（TypeError） | 提示「网络异常，请重试」 |
| HTTP 层 | 404、500、401 | **resolve**，\`res.ok === false\` | 手动判断 \`res.ok\` 或统一封装 |
| 业务层 | 200 但 \`{code: 1001, msg: '无权限'}\` | resolve | 读业务 code，走对应分支 |

fetch 只把第一层当失败，所以「写了 catch 却抓不到 404」是必然的，不是 bug。

### 跨域时 credentials 的三个取值

\`\`\`js
fetch(url, { credentials: 'include' })   // 带 cookie
fetch(url, { credentials: 'same-origin' }) // 默认，仅同源带 cookie
fetch(url, { credentials: 'omit' })      // 从不带
\`\`\`

跨域带 cookie 时，服务端还必须返回 \`Access-Control-Allow-Credentials: true\`，且 \`Access-Control-Allow-Origin\` **不能是 \`*\`**（必须是具体域名）。这三条缺一条，浏览器就会拦下响应，且控制台只报一句笼统的 CORS 错误。

### axios 拦截器的执行顺序

\`\`\`js
axios.interceptors.request.use(A)   // 先注册
axios.interceptors.request.use(B)   // 后注册
axios.interceptors.response.use(C)
axios.interceptors.response.use(D)
\`\`\`

实际顺序是：**请求 A → B → 发请求 → 响应 D → C**。

- 请求拦截器：按注册顺序执行（像洋葱由外向内）。
- 响应拦截器：**逆序**执行（由内向外）。

这条规则在「多个拦截器都改 config / 都改 data」时非常关键，也是「为什么我的 token 没带上去」的常见原因（被后注册的拦截器覆盖了 headers）。

### 动手验证（3 分钟）

\`\`\`js
// 控制台里直接跑
fetch('https://httpbin.org/status/404')
  .then(r => { console.log('resolved?', true, 'ok =', r.ok, 'status =', r.status); return r.text() })
  .catch(e => console.log('rejected:', e.message))

fetch('https://httpbin.org/status/404').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status) }).catch(e => console.log('手动抛出后 catch 到:', e.message))
\`\`\`

> 💡 第一段打印 \`resolved? true ok = false\`，说明 404 走的是 then 不是 catch；第二段手动抛错后才进 catch。把这段和封装好的 axios 对比，就明白「统一错误处理」到底在补什么。`,
  quiz: [
    { q: 'fetch 请求返回 404，会进入 then 还是 catch？为什么？', a: '进入 then。fetch 只在网络层失败（断网、CORS 被拦）时 reject；HTTP 错误状态码仍算「成功收到响应」，需要自己判断 res.ok。' },
    { q: '为什么 res.json() 之后再调 res.text() 会报错？', a: 'Response.body 是可读流，只能消费一次。需要多次读取时先 res.clone()。' },
    { q: '请求拦截器与响应拦截器的执行顺序分别是怎样的？', a: '请求拦截器按注册顺序执行；响应拦截器逆序执行（后注册的先跑），像洋葱模型由内向外。' }
  ]
};

window.VUE_DEEP[18] = {
  deep: `### 移除过滤器的真正理由

\`\`\`html
<p>{{ price | currency }}</p>
\`\`\`

在 JS 里 \`|\` 是**按位或**。模板里同一个符号表示「管道」，意味着：

- 编辑器无法用 JS 语法解析这段模板，语法高亮与类型检查都要为它写特例。
- 编译器要在表达式解析器里额外处理优先级（\`a | b + c\` 该先算谁？）。
- 一个过滤器写错，报错信息指向的是「模板解析失败」，而不是业务逻辑。

Vue 3 的选择是把模板语法收敛到「表达式 + 指令」，任何格式化都走函数调用。这对工具链是巨大简化：模板里的表达式现在就是标准 JS，可以被 TS 检查、被 IDE 跳转。

### 函数调用与方法调用的差别

\`\`\`html
<p>{{ currency(price) }}</p>
\`\`\`

这是「每次渲染都调用一次」。相对于过滤器，性能没有任何退步（过滤器同样是每次渲染执行），但有个新问题：**它不会被缓存**。

所以：

| 场景 | 建议 |
| --- | --- |
| 简单格式化（加符号、截断） | 方法调用即可 |
| 重计算（排序、过滤、聚合） | computed |
| 多处复用、纯函数 | 抽到 \`utils/\` 里 import |

### 全局过滤器消失后，全局注册怎么办

Vue 2 里 \`Vue.filter('currency', fn)\` 能在任何模板直接用。Vue 3 的等价物是 \`app.config.globalProperties\`：

\`\`\`js
app.config.globalProperties.$currency = (v) => '¥' + Number(v).toFixed(2)
\`\`\`

\`\`\`html
<p>{{ $currency(price) }}</p>
\`\`\`

但要清楚代价：**它把依赖藏进了全局**。组件不再能只靠 props 与 import 看懂自己依赖什么，测试时也得手动挂全局属性。团队项目里更推荐显式 import：

\`\`\`js
import { currency } from '@/utils/format'
\`\`\`

### 一个典型的迁移事故

Vue 2 代码：

\`\`\`html
<span>{{ user.name | capitalize }}</span>
\`\`\`

机械替换成 \`{{ capitalize(user.name) }}\` 后报错 \`capitalize is not defined\`——因为 Vue 2 的过滤器注册在 \`filters\` 选项里，Vue 3 里那个选项直接被忽略了，函数根本没被注册。

正确做法不是全局替换，而是：把 \`filters\` 里的函数搬到 \`methods\` 或 \`utils\`，再改调用处。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <p>{{ money(price) }}</p>
  <p>{{ count() }} 次调用</p>
</div>
<script>
  let n = 0
  Vue.createApp({
    data: () => ({ price: 1234.5 }),
    methods: {
      money(v) { n++; return '¥' + Number(v).toFixed(2) },
      count() { return n }
    }
  }).mount('#app')
</script>
\`\`\`

点几次触发重渲染（比如加个按钮改 price），看 \`count\`。

> 💡 每次渲染 \`money\` 都会重新执行（\`n\` 递增），说明模板里的函数调用没有缓存。把 \`money\` 改成 \`computed\` 后，只有 price 变化才会重算。`,
  quiz: [
    { q: 'Vue 3 移除过滤器，除了「学习成本」，还有一个和工具链相关的原因是什么？', a: '管道符不是 JS 语法，模板表达式无法被标准 JS 解析器/类型检查处理，IDE 与编译器都要为它写特例。移除后模板表达式就是标准 JS。' },
    { q: '模板里 {{ fn(x) }} 会被缓存吗？该怎么优化？', a: '不会，每次渲染都调用一次。若计算较重，应改成 computed（按依赖缓存）；纯格式化的小函数则无需优化。' },
    { q: '把 Vue 2 的 filters 机械替换成方法调用，为什么会报「函数未定义」？', a: 'filters 选项在 Vue 3 被忽略，函数没有被注册到实例上。需要把函数搬到 methods 或 utils 并显式 import，而不是只改调用处。' }
  ]
};
