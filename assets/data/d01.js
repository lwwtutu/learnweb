/* 第 1 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[1] = {
  deep: `### 「声明式」不是风格，而是一层翻译器

很多人把声明式理解成「写起来省事」，其实它有明确的实现前提。你在模板里写 \`{{ count }}\`，Vue 要做三件事才能把它变成会自己更新的界面：

1. **编译**：把模板字符串变成渲染函数 \`render()\`，\`{{ count }}\` 被编译成 \`_ctx.count\` 的读取。
2. **执行渲染**：调用 \`render()\`，它会去读 \`count\`。**读的这一瞬间**，Vue 把「当前正在渲染的组件」记进了 \`count\` 的依赖集合。
3. **派发更新**：\`count\` 被改时，Vue 从依赖集合里拿出那个组件，**重新执行它的渲染函数**，得到新的虚拟 DOM，再和旧的比对，只改差异部分。

所以「声明式」的代价是：每次渲染都要跑一遍 render、生成一次虚拟节点、做一次 diff。换来的是你不必知道「该改哪个 DOM」。这笔交易在页面复杂时才划算——一个只有一个计数器的页面，手写 \`innerHTML\` 反而更快。

> 🧠 记住这条因果链：**读 → 收集依赖 → 写 → 通知重渲染**。后面所有「为什么改了没更新」的问题，都是这条链断了某一环。

### 控制反转具体发生在哪

「库是你调用它，框架是它调用你」这句话要落到代码上才不空。你的代码只有一个入口：\`createApp(options).mount()\`。之后所有调用都是**框架在调你**：

| 谁在调 | 调什么 | 触发时机 |
| --- | --- | --- |
| 浏览器的点击事件 | 你的 \`@click\` 处理函数 | 用户点下去 |
| Vue 的调度器 | 你的组件的 \`render()\` | 依赖变化后的微任务 |
| Vue 的生命周期调度 | \`mounted\` / \`updated\` | 对应阶段完成 |
| Vue 的侦听器 | \`watch\` 回调 | 被侦听值变化 |

理解了这一点，就不会问「我明明没调 \`render\`，界面怎么变的」——因为从来不是你调它。

### 渐进式的三层，是同一份运行时的三种打包

- CDN 的 \`vue.global.js\`：运行时 + 模板编译器，模板在浏览器里现场编译。
- SFC + Vite：编译器在构建时跑，产物里只有运行时。
- Nuxt：运行时 + 服务端渲染，首屏在服务端生成 HTML。

API 完全一样，差别只在「编译器在哪跑、HTML 在哪生成」。所以从 CDN 学到的东西到工程里不会作废。

### 动手验证（3 分钟）

1. 新建一个 HTML，引入 \`vue.global.js\`，写 \`<div id="box">{{ 1 + 1 }}</div>\` 并挂载，页面显示 2。
2. 把引入换成一行的 \`vue.runtime.global.js\`，刷新。
3. 打开 Console。

> 💡 你会看到一条警告：模板无法编译，因为 runtime 版本没有编译器。这一次实验比读十遍文档更能记住「编译期 / 运行时」的分界——它不是概念，而是两个不同的文件。`,
  quiz: [
    { q: '「声明式」为什么必然带来运行时开销？这个开销具体花在哪三步上？', a: '因为界面要由框架从状态推出来：编译模板、执行渲染函数生成虚拟节点、比对差异并更新 DOM。这三步每次更新都要跑一遍，换来的是不用手动定位 DOM。' },
    { q: 'createApp 的返回值和 mount 的返回值，分别是什么、能做什么？', a: 'createApp 返回**应用实例**，用来注册全局组件/指令/插件（component、directive、use）；mount 返回**根组件实例**，能访问 $el、data 上的属性，也能 unmount。调错对象就会出现「$el 是 undefined」。' },
    { q: '为什么说 Vue 3 的响应式能监听「新增属性」，而 Vue 2 不能？', a: 'Vue 2 用 defineProperty 逐个属性定义 getter/setter，新加的键没有拦截器，所以必须 $set；Vue 3 用 Proxy 代理**整个对象**，任何键的读写都经过 handler，因此新增、删除、数组索引赋值都能捕获。' }
  ]
};

window.VUE_DEEP[2] = {
  deep: `### 两种构建产物的差别，决定你能写什么

| 文件 | 含编译器 | 首屏成本 | 能否写 template 字符串 |
| --- | --- | --- | --- |
| \`vue.global.js\` | 是 | 多约 40KB（gzip 后更小） | 能 |
| \`vue.runtime.global.js\` | 否 | 更小 | 只能传 render 函数 |
| SFC 构建产物 | 编译期已处理 | 最小 | 模板在打包时变成 render |

关键不是「哪个更好」，而是**编译器在什么时间点执行**：浏览器里执行（CDN）、构建时执行（Vite）、或者永远不执行（已经编译好了）。

### Vite 为什么开发时快，这不是营销

传统 webpack 的做法是：启动时把整个依赖图打包成 bundle，再给浏览器。项目越大，这一步越慢。

Vite 的做法是：**开发服务器只做「按需编译 + 原生 ESM」**。

1. 浏览器请求 \`/src/main.js\`，Vite 现场把它编译成浏览器能用的 ESM 返回。
2. \`import App from './App.vue'\` 触发浏览器再请求 \`App.vue\`，Vite 再单独编译这一个文件。
3. 改 \`App.vue\` 时，只让这一个模块失效，通过 WebSocket 通知浏览器替换该模块（HMR），**组件状态还能保留**。

所以冷启动时间几乎与项目规模无关——它压根没做全量打包。生产环境仍然用 Rollup 打包，因为浏览器逐模块请求在真实网络下太慢。

### \`npm create vue@latest\` 到底做了什么

它下载并执行 \`create-vue\` 这个脚手架。你勾选的选项会直接变成依赖与配置文件：

| 你选的 | 生成的东西 |
| --- | --- |
| TypeScript | \`tsconfig.*.json\`、\`env.d.ts\`、\`lang="ts"\` |
| Router | \`src/router/index.ts\`，并在 main 里 \`app.use(router)\` |
| Pinia | \`src/stores/\`，并注册 |
| Vitest | \`vitest.config\`、示例测试文件 |
| ESLint + Prettier | \`.eslintrc\` / \`eslint.config.js\` |

它不生成 \`webpack.config.js\`，因为底层是 Vite——这就是「官方推荐从 CLI 切到 Vite」的具体体现。

### 动手验证（5 分钟）

1. \`npm create vue@latest demo\`，只勾 Router，其余全否，安装依赖后 \`npm run dev\`。
2. 把 \`src/components/HelloWorld.vue\` 里的 \`<script setup>\` 改成 \`<script>\` + \`export default {}\`，观察是否仍能运行。
3. 打开 Network 面板，看第一次加载请求了多少个 \`.vue\` 文件。

> 💡 你会看到：每个组件都是一个独立请求。这就是「按需编译」的直观证据；生产构建后它们会被合并成少数几个 chunk。`,
  quiz: [
    { q: '为什么用 CDN 引入 Vue 就不能写 .vue 单文件组件？', a: '因为 .vue 需要被编译成 JS 模块，而浏览器不认识这个格式。CDN 只提供运行时（加可选的模板编译器），没有 SFC 编译环节；SFC 必须由 Vite/webpack 在构建或开发服务器里处理。' },
    { q: 'Vite 开发服务器「不打包」具体指什么？生产构建还打包吗？', a: '开发时按浏览器请求逐个编译模块并直接以 ESM 返回，不做全量 bundle，所以冷启动快；生产构建仍然用 Rollup 打包成优化后的静态文件。' },
    { q: '从 Vue CLI 迁到 Vite，最容易漏的三处配置是什么？', a: '\\index.html 移到根目录并改成 \\<script type=\"module\">；环境变量前缀从 VUE_APP_ 改为 VITE_ 并改用 import.meta.env；Node 内置模块/require 相关代码要换成 ESM 写法。' }
  ]
};

window.VUE_DEEP[3] = {
  deep: `### mount 的四步，顺序不能乱

\`\`\`js
app.mount('#box')
\`\`\`

这一行内部依次做：

1. **确定容器**：\`document.querySelector('#box')\`，拿不到就警告「Failed to mount」。
2. **编译模板**：读取容器的 \`innerHTML\` 作为模板，编译成 render 函数（仅 global 构建；SFC 直接用组件自带的 render）。
3. **建立响应式并首次渲染**：执行 \`data()\`，用 Proxy 包一层，然后跑一次 render → 生成 vnode → 转成真实 DOM。
4. **替换容器内容**：把容器原有的子节点清掉，插入新的 DOM。**容器元素本身保留**，所以 \`#box\` 这个 div 还在，只是里面换了。

第 4 步解释了一个常见困惑：为什么我在 HTML 里写的占位内容（比如「加载中…」）挂载后就消失了？因为整个 innerHTML 被替换掉了。

### 为什么 data 必须是函数：一次真实的踩坑路径

\`\`\`js
const counterDef = { data: { count: 0 }, template: '<button @click="count++">{{ count }}</button>' }
app.component('c1', counterDef)
app.component('c2', counterDef)
\`\`\`

页面上放两个计数器，点第一个加一，**两个都变成 1**。原因：\`data\` 是一个对象字面量，两个组件注册时引用的是**同一个对象**，Vue 直接把它变成响应式对象，于是共享同一份 \`count\`。

写成 \`data() { return { count: 0 } }\` 后，每次创建实例都会调用一次函数，返回全新对象，问题消失。Vue 2 允许根组件写对象，是因为根组件只有一份；Vue 3 干脆统一成函数，少一个例外。

### 应用实例和组件实例，能力完全不同

| 能力 | app（createApp 返回） | vm（mount 返回） |
| --- | --- | --- |
| 注册全局组件 | ✅ \`app.component()\` | ❌ |
| 注册全局指令 | ✅ \`app.directive()\` | ❌ |
| 装插件 | ✅ \`app.use()\` | ❌ |
| 全局配置 | ✅ \`app.config\` | ❌ |
| 访问组件数据 | ❌ | ✅ \`vm.count\` |
| 访问根 DOM | ❌ | ✅ \`vm.$el\` |
| 卸载 | ✅ \`app.unmount()\` | ❌ |

记法：**app 管「装配」，vm 管「这个组件自己」**。

### 动手验证（3 分钟）

\`\`\`html
<div id="box"><p>原始内容</p></div>
<script>
  const app = Vue.createApp({ data: () => ({ name: 'vue' }) })
  console.log('挂载前:', document.querySelector('#box').innerHTML)
  const vm = app.mount('#box')
  console.log('挂载后:', document.querySelector('#box').innerHTML)
  console.log('vm.$el === #box ?', vm.$el === document.querySelector('#box'))
</script>
\`\`\`

> 💡 你会看到：挂载前是「原始内容」，挂载后被替换成组件渲染结果；\`vm.$el === #box\` 为 **true**，说明容器就是根 DOM，Vue 只是换了它的内容。如果模板里有多个根节点，这个判断就会变成 false（Vue 3 支持 Fragment）。`,
  quiz: [
    { q: 'mount 之后，HTML 里原本写在容器内的内容去哪了？容器还在吗？', a: '被整体替换掉了（清空 innerHTML 后插入渲染结果）。容器元素本身保留，$el 通常就指向它；多根节点时 $el 指向的是一个 Fragment 占位。' },
    { q: '两个组件共用同一个 data 对象会发生什么？为什么？', a: '它们会共享同一份状态：改一个另一个也变。因为对象字面量是同一个引用，Vue 直接把它变成响应式对象；写成函数则每次创建实例返回新对象。' },
    { q: '为什么 app.use(router) 必须在 app.mount() 之前调用？', a: '因为首次渲染时组件里可能已经在用插件注入的能力（$router、全局组件）。插件在 mount 前注册，这些能力在渲染阶段才存在；顺序反了会在首次渲染时报「找不到 $router」。' }
  ]
};

window.VUE_DEEP[4] = {
  deep: `### Vue 2 的完整链路：getter → Dep → Watcher

Vue 2 的响应式不是「defineProperty 一句话」，而是一条链：

1. \`new Vue()\` 时，\`Observer\` 递归遍历 data 的每个属性，用 \`defineProperty\` 把它们改成 getter/setter。
2. 每个属性闭包里挂一个 \`Dep\` 实例（依赖收集器），里面存一个 Watcher 数组。
3. 组件渲染时，会创建一个 Watcher，并把「当前 Watcher」设为全局的 \`Dep.target\`。
4. 渲染过程中读到某个属性 → 触发 getter → 把 \`Dep.target\` 加进该属性的 Dep。
5. 属性被赋值 → 触发 setter → Dep 通知所有 Watcher → Watcher 调用 \`update()\` → 重新渲染。

所以「响应式」= 一次 getter 登记 + 一次 setter 通知。Vue 3 把 Watcher 换成了 effect，把 Dep 换成了「target → key → Set<effect>」的 WeakMap 结构，链路本质没变。

### Proxy 能拦到而 defineProperty 拦不到的，具体是哪些

| 操作 | defineProperty | Proxy 的 trap |
| --- | --- | --- |
| \`obj.a = 1\`（已有属性） | ✅ set | ✅ set |
| \`obj.b = 1\`（新增属性） | ❌ 没有 setter | ✅ set |
| \`delete obj.a\` | ❌ | ✅ deleteProperty |
| \`arr[0] = 1\` | ❌（Vue 2 靠重写数组方法） | ✅ set（索引是键） |
| \`arr.length = 0\` | ❌ | ✅ set（length 也是键） |
| \`'a' in obj\` | ❌ | ✅ has |
| \`Object.keys(obj)\` | ❌ | ✅ ownKeys |
| \`map.set('k', v)\` | ❌ 拦截不到内部操作 | ✅ 只在对 Map 做 Proxy 时有效（Vue 3 对集合类型有专门处理） |

注意最后一行：\`Proxy\` 拦的是「读写这个对象的属性」，所以对 \`Map\` 的拦截要特殊处理（Vue 3 的 \`collectionHandlers\` 把 \`get\`/\`set\` 等方法改成经过响应式包装的版本）。这也说明 Proxy 不是万能钥匙。

### 为什么 \`reactive(0)\` 一定失败

\`Proxy\` 的构造签名是 \`new Proxy(target, handler)\`，target **必须是对象**（包括函数、数组）。数字、字符串、布尔是原始值，没有「属性的读写」这回事，也就没有可拦截的行为。所以 Vue 只能用 \`ref\`：把它塞进一个 \`{ value: 0 }\` 的盒子里，再代理这个盒子。

\`\`\`js
ref(0)  ≈  reactive({ value: 0 })  +  模板自动解包
\`\`\`

理解这一句，就明白为什么「ref 要写 .value，模板里不用写」：脚本里你操作的是盒子，模板里 Vue 编译时自动帮你取 \`.value\`。

### 为什么解构会丢响应式（这是同一件事的另一面）

\`\`\`js
const state = reactive({ count: 0 })
const { count } = state      // 等价于 const count = state.count
count++                       // 改的是局部变量
\`\`\`

\`state.count\` 这个「读」操作只发生一次，Proxy 的 get 被触发一次，返回的是当时的数字 0。之后 \`count\` 就是一个普通变量，跟 state 没关系了。**响应式挂在「属性访问」上，一旦取值就成了快照。**

### 动手验证（5 分钟，20 行）

\`\`\`js
let active = null, deps = new WeakMap()
const track = (t, k) => {
  if (!active) return
  const m = deps.get(t) || deps.set(t, new Map()).get(t)
  const s = m.get(k) || m.set(k, new Set()).get(k)
  s.add(active)
}
const trigger = (t, k) => { const s = deps.get(t)?.get(k); s && s.forEach(f => f()) }
const reactive = (o) => new Proxy(o, {
  get(t, k) { track(t, k); return t[k] },
  set(t, k, v) { t[k] = v; trigger(t, k); return true }
})
const effect = (fn) => { active = fn; fn(); active = null }

const s = reactive({ a: 1, b: 2 })
effect(() => console.log('a =', s.a))
s.a = 10     // 打印 a = 10
s.b = 20     // 什么都不打印（b 没被读过，不在依赖里）
\`\`\`

> 💡 最后一行是关键：**没被读过的属性，改了也不会触发更新**。这解释了「为什么有些数据变了页面不动」——不是响应式失效，而是那次渲染根本没用到它（比如放在了 \`v-if\` 不成立的分支里）。`,
  quiz: [
    { q: '用一句话说清 defineProperty 与 Proxy 在「拦截粒度」上的差别。', a: 'defineProperty 拦截的是**某个对象的某个属性**（必须在初始化时逐个定义），Proxy 拦截的是**整个对象的读写行为**，因此新增、删除、数组下标都能捕获。' },
    { q: '为什么 reactive() 传数字会报错，而 ref() 不会？', a: 'Proxy 只能代理对象，原始值没有属性访问可拦截；ref 把值放进 { value: x } 的盒子里再代理这个盒子，所以能包装任意类型。' },
    { q: '「数据改了但页面没更新」在响应式层面常见的两种原因是什么？', a: '一是这次渲染根本没读过该属性（不在依赖集合里，例如被 v-if 提前短路）；二是把响应式对象解构/整体替换后丢掉了代理（拿到的是快照，或是新对象没被 reactive 包过）。' }
  ]
};
