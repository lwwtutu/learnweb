/* 第 1 篇 · 起步：Vue 3 与响应式 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p1',
  order: 1,
  title: '起步：Vue 3 与响应式',
  range: '001–005',
  desc: '先建立「声明式 + 组件化」的心智模型，再弄清 Vue 3 为什么换掉 defineProperty',
  chapters: [
    {
      no: 1,
      title: 'Vue 3 是什么：三个关键词',
      lessons: '001–002',
      summary: '把 Vue 理解成「描述状态与视图对应关系的运行时」，比背 API 更重要。',
      points: [
        '声明式：你描述结果，框架负责把结果落到 DOM 上',
        '组件化：界面拆成树，每棵树节点可以单独思考与复用',
        '渐进式：一个 script 标签能用，整套工程脚手架也能用',
        'Vue 3 的分界：Proxy 响应式 + 组合式 API + 多根节点'
      ],
      body: `### 从「怎么改」到「改什么」

写原生 JavaScript 时，我们关心的是**过程**：找到元素、改 innerHTML、绑事件、再手动同步其他位置。页面一复杂，这些「手动同步」就会互相冲突——这就是命令式编程的成本。

Vue 换了一种描述方式：只声明「状态长什么样」和「状态变化后视图应该长什么样」，至于什么时候重新渲染、渲染哪一块，交给框架调度。这种写法叫**声明式**。

| 维度 | 命令式（原生 DOM） | 声明式（Vue） |
| --- | --- | --- |
| 你写什么 | 每一步操作 | 状态与模板的对应关系 |
| 数据变了怎么办 | 手动找到节点重写 | 不用管，框架重渲染 |
| 出错点 | 漏同步、重复绑定 | 状态设计是否合理 |
| 调试方式 | 断点跟 DOM 操作 | 看状态快照与组件树 |

同一段计数器，两种写法的差别非常直观：

\`\`\`js
// 命令式：三个地方要手动保持一致
let count = 0
const btn = document.querySelector('#add')
const out = document.querySelector('#out')
btn.addEventListener('click', () => {
  count++
  out.textContent = count          // 忘了这行，界面就与数据脱节
})
\`\`\`

\`\`\`vue
<!-- 声明式：只需描述映射关系 -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <button @click="count++">加一</button>
  <span>{{ count }}</span>
</template>
\`\`\`

第二段没有一行「查找元素」的代码，因为查找、更新、销毁都由框架接管。**框架与库的区别就在这里**：库是你调用它，框架是它在合适的时机调用你（控制反转）。

### 组件化：把界面拆成一棵树

任何页面都可以拆成树：根组件包着导航、内容、页脚，内容里又有列表，列表里是卡片。Vue 要求每个节点自己管自己的状态与样式，父子之间通过 props（向下）和事件（向上）通信。

这样拆的好处是**局部可推理**：改一个卡片不用读完整页代码；坏处是**通信成本**，所以后面会专门用一整篇（第 4、5 篇）讲组件之间怎么传数据。这不是 Vue 特有的问题，而是组件化本身的代价。

### 渐进式：三种使用粒度

- **一个标签**：\`<script src="vue.global.js">\`，直接给静态页加交互，不引入构建工具。
- **单页应用**：Vite + 单文件组件（SFC），路由与状态管理齐全，适合做完整产品。
- **服务端渲染 / 静态生成**：Nuxt 生态，首屏与 SEO 友好。

同一套 API 覆盖三种粒度，你可以只取需要的那一层，这是「渐进式」的实际含义。

### Vue 3 相对 Vue 2 的关键变化

| 变化点 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 响应式实现 | \`Object.defineProperty\` | \`Proxy\`（可监听增删、数组索引、Map/Set） |
| 逻辑组织 | 选项式（data/methods 分块） | 组合式（按功能聚拢） |
| 模板根节点 | 只能一个 | 支持多根（Fragment） |
| 过滤器 | \`filters\` | 已移除，改用方法或计算属性 |
| 新内置能力 | 无 | \`Teleport\`、\`Suspense\`、\`<Transition>\` 增强 |
| 构建工具 | Vue CLI（webpack） | Vite（原生 ESM + Rollup） |

> 🧠 记住这张表里只有两件事真正影响你写代码：**响应式换成 Proxy**（所以能监听数组和对象增删）、**逻辑可以按功能组织**（所以不再被 data / methods 割裂）。其余都是顺带的好处。

### 该用哪种写法开始学

初学阶段建议**先选项式、再组合式**。原因很实际：选项式把「状态、方法、计算属性、侦听器」放在固定位置，你不需要理解调用顺序就能跑起来；等你能感到「一个功能的代码被拆到四个选项里很难读」时，再切到组合式，那时你才知道它要解决什么问题。本站的章节顺序也是这样安排的。`
    },
    {
      no: 2,
      title: '四种上手方式：CDN / 演练场 / CLI / Vite',
      lessons: '003',
      summary: '工具选型只看两件事：要不要单文件组件，要不要构建优化。',
      points: [
        'CDN 引入不涉及构建步骤，但用不了 SFC 语法',
        'Vue CLI 基于 webpack，官方已转入维护模式',
        'Vite 是当前官方推荐，冷启动快、热更新按需编译',
        'Node 版本不够时，\`npm create\` 会直接报错，先升级再排查'
      ],
      body: `### 四种方式，对应四种场景

| 方式 | 命令 / 地址 | 适用场景 | 限制 |
| --- | --- | --- | --- |
| 在线演练场 | play.vuejs.org | 验证语法、复现问题 | 不能装依赖、不能放项目 |
| CDN 全局构建 | \`vue.global.js\` | 给静态页加交互、老项目渐进改造 | 无 SFC、无按需编译 |
| Vue CLI | \`vue create my-app\` | 维护旧项目 | webpack 启动慢，已维护模式 |
| Vite | \`npm create vue@latest\` | 新项目首选 | 需要 Node 14.18+ / 16+ |

### CDN：最快看到效果，也最容易踩坑

\`\`\`html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<div id="app">{{ 10 + 20 }}</div>
<script>
  Vue.createApp({ data: () => ({}) }).mount('#app')
</script>
\`\`\`

这里加载的是 **global 构建**（运行时 + 编译器），模板在浏览器里现场编译，所以能直接写 \`{{ }}\`。代价是体积更大、无法预编译，也**不能使用单文件组件**——也就是你没法写 \`.vue\` 文件，样式只能写行内或 \`<style>\` 标签。

> ⚠️ 引入 \`vue.runtime.global.js\` 后模板不生效，是新手最常见的错误。runtime 版本只认 \`render\` 函数，不含编译器。快速判断：控制台报「Component provided template option but runtime compilation is not supported」就是它。

### Vite：新项目的默认答案

\`\`\`bash
# 官方脚手架（含路由、Pinia、TS 等可选项）
npm create vue@latest

# 或最简的 Vite 模板
npm create vite@latest my-app -- --template vue

cd my-app
npm install
npm run dev
\`\`\`

Vite 快在开发阶段**不打包**：浏览器请求哪个模块就编译哪个模块，所以冷启动只处理入口依赖。生产构建仍然用 Rollup 打包，产物与传统方案差别不大。

两者创建出来的项目差别也不小：\`create-vue\` 会问你需不需要 Router、Pinia、Vitest、ESLint，并按选择生成配置；\`create vite\` 只给最小骨架，其余自己装。

### 生成出来的目录长什么样

\`\`\`text
my-app/
├── index.html          # 唯一入口 HTML，Vite 以它为根
├── vite.config.js      # 构建配置（插件、别名、代理）
├── package.json
└── src/
    ├── main.js         # 应用入口：createApp + use + mount
    ├── App.vue         # 根组件
    ├── components/     # 可复用组件
    ├── views/          # 路由级页面（配了 Router 才有）
    ├── router/
    ├── stores/         # Pinia
    └── assets/
\`\`\`

\`public/\` 目录下的文件会被原样复制到产物根目录，不打哈希；\`src/assets/\` 里的资源会走构建管线，小图会被内联成 base64。

### 装依赖卡住时的常规排查

1. 先看 Node 版本：\`node -v\`，低于 16 直接升级。
2. 换镜像源：\`npm config set registry https://registry.npmmirror.com\`。
3. 删掉 \`node_modules\` 和 \`package-lock.json\` 重装，比逐个排查依赖冲突快。
4. 公司网络有代理时，记得同时配置 \`npm config set proxy\`。

> 💡 学习阶段完全可以从 CDN 开始：语法、指令、响应式这些核心内容不依赖构建工具。等到第 4 篇讲单文件组件时，再切到 Vite 项目，那时你才会真正需要它。`
    },
    {
      no: 3,
      title: '第一个应用：createApp 与 mount',
      lessons: '004',
      summary: 'createApp 只是创建应用实例，mount 才建立响应式与渲染；两步之间有明确的职责分工。',
      points: [
        'createApp 返回应用实例，可注册全局组件、指令、插件',
        'mount 返回根组件实例，此时才完成首次渲染',
        'data 必须是函数，保证每个实例拿到独立状态',
        '应用实例与根组件实例不是同一个东西，能力也不同'
      ],
      body: `### 三步走：引入、创建、挂载

\`\`\`html
<div id="box">
  <p>{{ 10 + 20 }}</p>
  <p>{{ name }}</p>
</div>

<script src="vue.js"></script>
<script>
  const app = Vue.createApp({
    data() {
      return { name: 'kerwin' }
    }
  })
  app.mount('#box')
</script>
\`\`\`

模板里的 \`{{ }}\` 会被替换成对应属性的值，且属性变化时同步更新。这里有两个不同阶段：

- \`createApp(options)\` 创建**应用实例**（app）：全局配置的入口，\`component\`、\`directive\`、\`use\` 都在它上面。
- \`app.mount('#box')\` 把应用挂到容器上，返回**根组件实例**（vm）：此时才建立响应式、执行首次渲染、触发 \`mounted\`。

很多人把两者混为一谈，结果在 app 上调 \`$el\` 拿不到东西——那是组件实例才有的属性。

### mount 到底做了什么

按顺序有四件事：

1. **编译模板**：把容器内的 HTML 编译成渲染函数（用 global 构建时）。
2. **建立响应式**：把 \`data()\` 的返回值转换成响应式对象。
3. **创建渲染副作用**：执行一次渲染函数，生成虚拟 DOM 并转成真实 DOM，替换容器内容。
4. **触发钩子**：依次执行 \`beforeMount\`、\`mounted\`。

\`\`\`js
const vm = app.mount('#box')
console.log(vm.$el)        // 根 DOM 节点
console.log(vm.name)       // 可以直接读到 data 上的属性
app.unmount()              // 卸载：销毁 DOM、清理副作用与事件
\`\`\`

注意 mount 之后，**容器原本的内容被完全替换**，容器本身保留。所以别把「挂载点」当成模板的一部分来理解。

### data 为什么必须是函数

如果写成对象，所有组件实例会共享同一个引用：

\`\`\`js
// ❌ 对象写法：多个实例共用一个 data
const shared = { count: 0 }
const A = { data: shared }
const B = { data: shared }
// A 改 count，B 的 count 跟着变

// ✅ 函数写法：每次调用返回新对象
const C = { data() { return { count: 0 } } }
\`\`\`

根组件因为只有一个实例，Vue 2 允许写对象；**Vue 3 统一要求函数**，少一个例外，少一类 bug。

### 两种构建产物怎么选

| 产物 | 含编译器 | 体积 | 模板写在哪 |
| --- | --- | --- | --- |
| \`vue.global.js\` | 是 | 大 | HTML 里直接写 \`{{ }}\` |
| \`vue.runtime.global.js\` | 否 | 小 | 只能传 \`render()\` |
| 配合 SFC + Vite | 否（编译期处理） | 最小 | \`.vue\` 文件，构建时预编译 |

实际项目几乎都是第三种：模板在构建阶段就被编译成渲染函数，运行时不需要编译器。

> 💡 \`#box\` 用 CSS 选择器就行，不一定要 id。但一个应用只能挂载一次，重复 mount 会警告。

### 和 Vue 2 的写法对照

| 环节 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 创建 | \`new Vue(options)\` | \`createApp(options)\` |
| 挂载 | \`.$mount('#box')\` | \`.mount('#box')\` |
| 全局组件 | \`Vue.component(...)\` | \`app.component(...)\` |
| 全局配置 | 直接改 \`Vue.prototype\` | \`app.config.globalProperties\` |

拆成应用实例的直接好处：同一页面可以挂载多个互不干扰的 Vue 应用，各自的全局组件互不污染。`
    },
    {
      no: 4,
      title: '响应式的真相：从 defineProperty 到 Proxy',
      lessons: '005',
      summary: 'Vue 2 的短板不是性能，而是「拦不到」；Proxy 能拦住整个对象的所有操作。',
      points: [
        'defineProperty 逐个属性定义 getter/setter，只能在初始化时递归',
        '拦不到数组索引赋值、新增/删除属性、Map 与 Set',
        'Proxy 代理整个对象，get/set 时才惰性递归，天然支持新增属性',
        'Vue 3 用 Proxy + effect 副作用，替代了 Watcher'
      ],
      body: `### 先把「响应式」说清楚

响应式的本质只有两句话：**读数据时记住谁在用，写数据时通知用过的那些人**。前者叫依赖收集，后者叫派发更新。Vue 2 与 Vue 3 的区别，只在于用什么手段完成这两步。

### Vue 2：给每个属性装一对 getter/setter

\`\`\`js
const obj = {}
const obox = document.getElementById('box')

Object.defineProperty(obj, 'myname', {
  get() {
    console.log('有人访问了')      // 收集依赖的时机
    return obox.innerHTML
  },
  set(value) {
    console.log('有人改变我了', value)  // 派发更新的时机
    obox.innerHTML = value
  }
})
\`\`\`

这个例子把「读写拦截 → 更新视图」演示得很清楚。但把它用到真实对象上，问题就来了：\`defineProperty\` 是**针对单个属性**的，所以必须在一开始就遍历对象的所有属性，逐个改写。

于是四个缺陷无法回避：

| 操作 | 结果 | 原因 |
| --- | --- | --- |
| \`arr[0] = 'x'\` | 不更新 | 没为数组索引定义 getter |
| \`arr.length = 0\` | 不更新 | length 是特殊属性 |
| \`obj.newKey = 1\` | 不更新 | 新属性没有 getter |
| \`map.set('a', 1)\` | 不更新 | Map / Set 内部操作不经过 getter |

Vue 2 的补救办法是 \`$set\` / \`$delete\` 和重写七个数组方法（\`push\`、\`pop\`、\`shift\`、\`unshift\`、\`splice\`、\`sort\`、\`reverse\`）。能用，但要求开发者记住「哪些写法要换 API」，这是认知负担。

### Vue 3：代理整个对象

\`\`\`js
const obj = {}
const obox = document.getElementById('box')

const vm = new Proxy(obj, {
  get(target, key) {
    console.log('get', key)
    return target[key]
  },
  set(target, key, value) {
    console.log('set', key, value)
    target[key] = value
    obox.innerHTML = value      // 真实场景这里是触发渲染
    return true
  }
})
\`\`\`

关键差别：拦截发生在**对象层级**，任何属性（包括后新增的）读写都会经过这里，所以不再需要 \`$set\`。数组索引赋值、\`Map\`/\`Set\` 的操作同样能被捕获。

| 能力 | defineProperty | Proxy |
| --- | --- | --- |
| 新增 / 删除属性 | 需 \`$set\` / \`$delete\` | 自动拦截 |
| 数组索引赋值 | 不拦截 | 拦截 |
| Map / Set | 不拦截 | 拦截 |
| 递归时机 | 初始化时全量遍历 | 访问到才递归（惰性） |
| 浏览器支持 | IE9+ | 不支持 IE，需 polyfill |

### 惰性递归带来的实际收益

Vue 2 在初始化时递归整个 data，深层大对象会拖慢首屏；Vue 3 只代理第一层，某个嵌套对象真的被读到时才转成响应式。数据越大、用得越少，差距越明显。

\`\`\`js
// 概念示意：访问到嵌套对象时才递归代理
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      const value = target[key]
      return typeof value === 'object' && value !== null ? reactive(value) : value
    },
    set(target, key, value) { target[key] = value; return true }
  })
}
\`\`\`

真实的 Vue 实现多了依赖收集、缓存（\`WeakMap\`）、只读与浅层变体，但主干就是这几行。「速查手册」页有一个可交互的小实验，用的正是这段逻辑。

> ⚠️ 两个高频坑：一是解构 \`reactive\` 对象会丢失响应式（\`const { count } = state\` 拿到的是普通值，用 \`toRefs\` 解决，见 7.3）；二是 \`reactive(0)\` 这种传基础类型会警告，数字、字符串要用 \`ref\`。

### 为什么现在不再讲 Watcher

Vue 2 的响应式链路是 \`getter → Dep → Watcher\`，每个组件一个 Watcher。Vue 3 换成了 \`Proxy → 依赖集合 → effect\`，渲染本身就是一个 effect，\`computed\` 与 \`watch\` 也是。统一之后，逻辑更少，组合式 API 才能自然长出来——这也是第 7 篇的起点。`
    }
  ]
});
