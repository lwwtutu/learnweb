/* 第 4 篇 · 组件化基础 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p4',
  order: 4,
  title: '组件化基础',
  range: '034–043',
  desc: '从全局组件到单文件组件，讲清拆分粒度、props 单向数据流与属性透传',
  chapters: [
    {
      no: 19,
      title: '组件与组件树',
      lessons: '034',
      summary: '组件的价值是「局部可推理」；拆得太碎会增加通信成本，拆得太粗会失去复用。',
      points: [
        '组件把 UI 拆成独立、可复用的部分，形成树状结构',
        '全局组件用 app.component 注册，作用域是全应用',
        'template 字符串写法没有高亮、没有 CSS 作用域',
        '拆分标准：是否复用、是否独立变化、是否有独立状态'
      ],
      body: `### 为什么要组件化

一个页面的复杂度不在「元素多」，而在「互相影响」。组件化把页面切成树，每个节点只关心自己的状态与样式，思考范围从「整个页面」缩到「一个组件」，这就是**局部可推理**。

三个具体收益：

- **结构清晰**：页面由几个区块组成，一眼能看出来。
- **可复用**：搜索框、分页、弹窗在多个页面共用。
- **封装性**：样式与状态不外泄，改一个组件不影响其他区域。

### 第一种写法：全局组件

\`\`\`js
const app = Vue.createApp({})

// 全局注册：任何组件模板里都能直接用
app.component('child', {
  template: '<div>child</div>'
})

app.component('tabbar', {
  template: \`
    <div style="color: blue">
      <ul>
        <li>首页</li>
        <li>列表</li>
      </ul>
      <child></child>
      <tabbarchild></tabbarchild>
    </div>
  \`,
  components: {
    // 局部注册：只在 tabbar 内部可用
    tabbarchild: { template: '<div>tabbarchild</div>' }
  }
})

app.mount('#box')
\`\`\`

全局注册的组件在任何地方都能用，但代价是**打进了最终包体**：即使某个组件从未被使用，也会被包含（构建工具难以摇树）。所以真实项目里，全局只注册极少数基础组件（图标、按钮），业务组件一律局部注册或按需引入。

### 字符串模板的四个硬伤

上面这种 \`template: '...'\` 的写法在演示里够用，实际开发很难受：

| 问题 | 表现 |
| --- | --- |
| 没有语法高亮 | 模板是字符串，编辑器不认识 |
| 没有代码提示 | 组件名、属性、指令全靠记忆 |
| CSS 只能行内 / 全局 | 无法写作用域样式，容易污染 |
| 多行要拼字符串 | 反引号里缩进错乱，改动成本高 |

这四条正是单文件组件（SFC）要解决的事，下一章展开。

### 拆分粒度：三条判断线

拆过头的典型症状是「父组件传十几个 props、子组件 emit 五六个事件」，通信成本超过复用收益。可以用三条线判断：

1. **会复用吗**：在多处出现 → 拆。
2. **会独立变化吗**：某块 UI 频繁改动、与其他部分无关 → 拆。
3. **有独立状态吗**：有自己的加载态、展开态、分页 → 拆。

反例：为了「每个标签都独立」把一个 \`<span>\` 包成组件，除了增加文件数和通信成本，没有收益。

### 组件的命名约定

- 文件名用 PascalCase：\`MovieItem.vue\`。
- 模板里用 PascalCase 或 kebab-case：\`<MovieItem />\` 或 \`<movie-item />\`。DOM 内模板（直接写在 HTML 里）只能用 kebab-case，因为 HTML 属性不区分大小写。
- 基础组件加前缀，如 \`BaseButton\`、\`AppHeader\`，与业务组件区分。

> 💡 组件的 \`data\` 必须是函数（第 1.3 章讲过原因），否则多个实例共享同一份状态——这是组件化里最经典的坑。`
    },
    {
      no: 20,
      title: '单文件组件：一个文件一个组件',
      lessons: '035',
      summary: 'SFC 把 template、script、style 放进同一个 .vue 文件，由构建工具负责编译。',
      points: [
        'SFC 是 HTML/CSS/JS 三种语言组合的自然延伸',
        'template 预编译成渲染函数，避免运行时编译开销',
        'style scoped 通过属性选择器实现样式隔离',
        'SFC 需要构建工具，浏览器不能直接运行 .vue'
      ],
      body: `### 三段式结构

\`\`\`vue
<script>
export default {
  data() {
    return { greeting: 'Hello World!' }
  }
}
</script>

<template>
  <p class="greeting">{{ greeting }}</p>
</template>

<style scoped>
.greeting {
  color: red;
  font-weight: bold;
}
</style>
\`\`\`

三个块各司其职，顺序不影响功能（惯例是 \`script\` → \`template\` → \`style\`，或者 \`template\` 在前）。\`.vue\` 文件本身浏览器不认识，必须由 \`@vitejs/plugin-vue\` 或 \`vue-loader\` 编译成 JS 模块。

### 相比字符串模板，多了什么

| 能力 | 字符串模板 | SFC |
| --- | --- | --- |
| 语法高亮 / 补全 | 无 | 完整支持（Volar） |
| 样式作用域 | 只能全局 | \`<style scoped>\` |
| 预编译 | 运行时编译 | 构建时编译 |
| 类型检查 | 无 | 模板表达式可被 TS 检查 |
| 热更新 | 整页刷新 | 组件级 HMR |

「预编译」这一条影响最直接：模板在构建阶段就变成渲染函数，运行时不需要编译器，包体更小、首屏更快。

### scoped 到底做了什么

\`\`\`html
<!-- 编译结果大致是：给元素加唯一属性，样式选择器也带上它 -->
<p class="greeting" data-v-7ba5bd90>Hello</p>
<style>
.greeting[data-v-7ba5bd90] { color: red }
</style>
\`\`\`

所以样式只在当前组件生效。注意它**不会隔离子组件**：父组件的 scoped 样式作用于子组件的根元素（这是刻意设计，方便布局）；要影响子组件内部，需要用 \`:deep()\`：

\`\`\`css
:deep(.van-cell__title) { font-weight: 600 }
\`\`\`

### 三种 style 写法

- \`<style>\`：全局样式，慎用，容易污染。
- \`<style scoped>\`：默认选择，组件级隔离。
- \`<style module>\`：CSS Modules，类名被编译成哈希，模板里用 \`:class="$style.greeting"\`。

### 常见误解

> ⚠️ 「SFC 必须配 Vite / webpack」——是的，浏览器不能直接跑 \`.vue\`。但也可以通过 CDN + \`vue3-sfc-loader\` 在运行时编译，只适合演示，不要用于生产。

另一个误解是「一个文件只能一个组件」。SFC 里确实一个文件对应一个默认导出组件，但可以在 \`script\` 里定义辅助子组件并局部注册，只是不利于复用。

> 💡 官方推荐 IDE 是 VS Code + Vue 官方扩展（原 Volar）。如果旧项目装过 Vetur，在 Vue 3 项目里要禁用它，两者会抢模板语言服务。`
    },
    {
      no: 21,
      title: '工程化：CLI、Vite 与启动流程',
      lessons: '036–040',
      summary: 'CLI 是 webpack 时代的方案，Vite 是当下的默认；两者入口结构相似，编译时机不同。',
      points: [
        'Vue CLI 基于 webpack，已进入维护模式',
        'Vite 开发期用原生 ESM 按需编译，生产用 Rollup 打包',
        '入口链路：index.html → main.js → createApp → App.vue',
        'vite.config.js 里配别名、代理、插件'
      ],
      body: `### 两个工具链的定位

Vue CLI 是「全家桶」：\`vue create\` 生成项目，webpack 配置藏在 \`@vue/cli-service\` 里，需要改配置就写 \`vue.config.js\`。它把生态标准化了，但也把构建速度锁在了 webpack 的模型上——启动要先把整个依赖图打包完。

Vite 换了个思路：开发阶段**不打包**。浏览器原生支持 ESM，请求到哪个模块就编译哪个模块；改一个文件只重新编译那一个模块并热替换。生产构建仍然打包（Rollup），保证产物兼容与体积。

| 对比 | Vue CLI | Vite |
| --- | --- | --- |
| 底层 | webpack | 开发 esbuild + 生产 Rollup |
| 冷启动 | 随项目增大变慢 | 基本恒定 |
| 配置 | \`vue.config.js\` | \`vite.config.js\` |
| 环境变量 | \`VUE_APP_\` 前缀 | \`VITE_\` 前缀 |
| 现状 | 维护模式 | 官方推荐 |

### 启动流程：从 index.html 到页面

\`\`\`html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
\`\`\`

\`\`\`js
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(router)          // 注册路由
app.use(createPinia())   // 注册状态管理
app.mount('#app')        // 挂载
\`\`\`

链路很清楚：**HTML 提供挂载点 → main.js 创建应用 → 注册插件 → 挂载根组件**。注意 \`use\` 必须在 \`mount\` 之前，否则插件注入的全局能力在首次渲染时还不存在。

### 常用配置

\`\`\`js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
})
\`\`\`

三个配置解决三类问题：\`alias\` 让导入路径变短（\`@/components/X.vue\`），\`server.proxy\` 解决开发跨域，\`plugins\` 提供 SFC 编译。

### 从 CLI 迁到 Vite 的检查清单

1. \`index.html\` 从 \`public/\` 移到根目录，脚本改成 \`<script type="module">\`。
2. 环境变量前缀 \`VUE_APP_\` 改 \`VITE_\`，读取方式从 \`process.env\` 改 \`import.meta.env\`。
3. \`require()\` 全部换成 \`import\`（ESM 不认 require）。
4. 静态资源引用改用 \`new URL('./x.png', import.meta.url)\` 或直接 \`import\`。
5. 检查依赖里有没有依赖 Node 内置模块的库（如 \`path\`），需要 polyfill。

> 💡 \`npm run dev\` 是开发服务器，\`npm run build\` 生成 \`dist/\`，\`npm run preview\` 本地预览产物。部署时把 \`dist/\` 丢给 Nginx 即可，别把 dev server 上线。`
    },
    {
      no: 22,
      title: 'props：单向数据流',
      lessons: '041',
      summary: 'props 只往下流，子组件不能改；需要改就让子组件 emit 事件，由父组件改。',
      points: [
        'props 是单向绑定，父更新会流下来，子不能反向写',
        '在子组件里直接赋值 prop 会警告，且父组件不受影响',
        '需要本地加工时，用 computed 或本地 data 承接',
        '对象 / 数组类型的 prop 传的是引用，改内部属性不会报错但很危险'
      ],
      body: `### 传值方式

\`\`\`html
<!-- 静态字符串 -->
<Navbar mytitle="我的电影" left="返回" right="首页" />

<!-- 动态值：加冒号，值当作表达式 -->
<Navbar :mytitle="pageTitle" :count="list.length" />

<!-- 对象批量透传 -->
<Navbar v-bind="{ mytitle: '我的电影', left: '返回', right: '首页' }" />
\`\`\`

\`\`\`js
export default {
  props: ['mytitle', 'left', 'right']
}
\`\`\`

一个容易忽略的细节：\`mytitle="我的电影"\` 传的是字符串；\`mytitle="1"\` 也是字符串 \`"1"\`，要数字必须写 \`:mytitle="1"\`。

### 为什么不能改 prop

\`\`\`js
export default {
  props: ['foo'],
  created() {
    this.foo = 'bar'      // ❌ 控制台警告：Set operation on key "foo" failed
  }
}
\`\`\`

原因是数据流方向：父组件的状态是唯一来源。如果子组件能改，同一个 prop 就可能被多个子组件以不同方式修改，父组件无从得知最终值——数据流变成一张网，而不是一条链。

Vue 的做法是**每次父组件更新，所有子组件的 prop 都被刷新为最新值**（所以子组件的修改会被覆盖），同时在开发环境给出警告。

### 需要「基于 prop 加工」怎么办

三种正确姿势：

\`\`\`js
// 1. 只读派生：用 computed
computed: {
  upperTitle() { return this.mytitle.toUpperCase() }
}

// 2. 需要本地可变副本：用 data 承接初始值（只承接一次）
data() {
  return { draft: this.mytitle }
}

// 3. 需要改源数据：emit 事件交给父组件
methods: {
  save() { this.$emit('update:title', this.draft) }
}
\`\`\`

第二种要小心：\`data\` 只在创建时取一次 prop 的值，父组件后续更新不会同步到 \`draft\`。如果确实需要跟随，用 \`watch\` 或直接改成 \`computed\` + 本地覆盖标记。

### 引用类型的陷阱

\`\`\`js
props: ['user']
// ❌ 不会报错，但直接改了父组件的数据
this.user.name = 'new name'
\`\`\`

对象与数组传的是引用，改内部属性不触发「修改 prop」的警告，但实质上破坏了单向数据流——父组件的数据被无声修改，排查时极难定位。规范做法：**子组件只读**，要改就 emit。

> ⚠️ 如果 prop 是对象且父组件用 \`v-for\` 渲染多个子组件，任何一个子组件改了对象内部属性，其他子组件也会跟着变，因为它们共享同一个引用。

### props 与 attrs 的边界

没在 \`props\` 里声明的属性会落到 \`attrs\`，默认自动挂到根元素上（第 4.6 章）。所以「属性没生效」时先检查两件事：名字有没有写进 \`props\`、是否有多个根节点导致透传失效。`
    },
    {
      no: 23,
      title: '属性校验与默认值',
      lessons: '042',
      summary: 'props 是组件的对外契约；类型、必填、默认值、自定义校验，都是把契约写进代码。',
      points: [
        'type 支持 String/Number/Boolean/Array/Object/Date/Function/Symbol',
        '对象与数组的默认值必须用工厂函数',
        'Boolean 类型的 prop 不传时默认为 false',
        'validator 用于自定义规则，开发环境才提示'
      ],
      body: `### 从数组写法升级到对象写法

\`\`\`js
props: {
  propA: Number,                       // 单一类型
  propB: [String, Number],             // 多种类型
  propC: { type: String, required: true },
  propD: { type: Number, default: 100 },
  propE: {
    type: Object,
    default(rawProps) { return { message: 'hello' } }   // 对象必须工厂函数
  },
  propF: {
    validator(value) {
      return ['success', 'warning', 'danger'].includes(value)
    }
  }
}
\`\`\`

校验失败不会阻断渲染，只在开发环境打印警告。它的价值是**把约定变成可执行的检查**：别人（或三个月后的你）传错类型时，控制台会直接指出来。

### 为什么对象默认值要用函数

\`\`\`js
// ❌ 所有实例共享同一个对象
default: { message: 'hello' }

// ✅ 每次创建实例都调用一次，返回新对象
default() { return { message: 'hello' } }
\`\`\`

与 \`data\` 必须是函数完全同一个原因：对象是引用类型，共享会导致一个实例的修改影响所有实例。

### Boolean 的特殊行为

\`\`\`html
<MyComp />              <!-- disabled: false -->
<MyComp disabled />     <!-- disabled: true -->
<MyComp :disabled="false" />
\`\`\`

布尔类型的 prop 只要出现（哪怕不带值）就是 \`true\`；完全不传则为 \`false\`。这与 HTML 布尔属性的行为一致。如果你希望「不传时是 undefined 而不是 false」，需要在 \`default\` 里显式写 \`undefined\`。

### 校验能做什么，不能做什么

| 能做 | 不能做 |
| --- | --- |
| 检查类型、必填 | 替代后端校验 |
| 枚举值白名单 | 阻止错误渲染（只警告） |
| 提示开发者用错 | 生产环境静默 |

\`validator\` 适合枚举与格式检查，但不要写复杂业务规则——它会在每次 prop 变化时执行，重逻辑拖慢渲染。

### 类型检查的边界

\`type: Number\` 在开发环境做运行时检查，但**不会转换**：父组件传字符串 \`"100"\` 依然报警告。要宽松兼容，用 \`[Number, String]\` 并在组件内自己 \`Number()\`。

> 💡 用了 TypeScript 后，\`defineProps<{ title: string; count?: number }>()\` 能在编译期检查，比运行时 validator 更早发现问题。两者的关系是「编译期兜类型 + 运行时兜外部数据」，第 10.6 章会讲。`
    },
    {
      no: 24,
      title: '属性透传：attrs 与 inheritAttrs',
      lessons: '043',
      summary: '没声明成 props 的属性会落进 attrs，默认自动挂到根元素；多根节点时必须手动绑定。',
      points: [
        'class 与 style 永远透传，且会与根元素原有的合并',
        '未声明为 props 的属性进入 attrs，可批量透传给内部元素',
        'inheritAttrs: false 关闭自动透传，适合包装第三方组件',
        '多根节点组件不会自动透传，需要 v-bind="$attrs"'
      ],
      body: `### 默认行为

\`\`\`html
<!-- 使用方 -->
<MyInput class="search" placeholder="搜索" data-test="kw" />
\`\`\`

\`\`\`vue
<!-- MyInput.vue：只声明了 modelValue -->
<template>
  <input :value="modelValue" />
</template>
\`\`\`

渲染结果：

\`\`\`html
<input class="search" placeholder="搜索" data-test="kw" />
\`\`\`

\`class\`、\`placeholder\`、\`data-test\` 都不在 \`props\` 里，但它们自动落到了根元素上——这就是**属性透传**（fallthrough attributes）。对「只是包一层样式」的场景非常方便。

### 什么时候需要关掉

包装第三方组件时，自动透传会让属性跑到错误的位置。例如你在 \`<van-field>\` 外面包了一层 \`div\`，外部传的 \`placeholder\` 会挂到这个 \`div\` 上，而不是真正的输入框。

\`\`\`vue
<script>
export default {
  inheritAttrs: false
}
</script>

<template>
  <div class="field-wrap">
    <!-- 手动决定 attrs 落在哪 -->
    <van-field v-bind="$attrs" />
  </div>
</template>
\`\`\`

\`inheritAttrs: false\` 只关掉「自动挂到根元素」，\`$attrs\` 依然可读，所以你能精确控制去向。这是二次封装组件时的标准写法。

### 多根节点的坑

\`\`\`vue
<template>
  <label>{{ label }}</label>
  <input v-bind="$attrs" />
</template>
\`\`\`

多根节点（Fragment）没有唯一的「根元素」，Vue 不知道往哪挂，于是**放弃自动透传**，并在开发环境警告。必须用 \`v-bind="$attrs"\` 显式指定。

### attrs 与 props 的区别

| | props | attrs |
| --- | --- | --- |
| 是否声明 | 必须声明 | 未声明的都算 |
| 响应式 | 是 | 是（对象随父更新） |
| 能否校验 | 能 | 不能 |
| 默认落点 | 组件内部变量 | 根元素 |
| 典型用途 | 组件 API | 透传 HTML 属性 |

在 \`script setup\` 里通过 \`useAttrs()\` 访问；选项式 API 里是 \`this.$attrs\`。

### 一个实战判断

- 这个属性**影响组件行为**（\`size\`、\`disabled\`、\`modelValue\`）→ 声明为 prop，写进契约。
- 这个属性**只是 HTML 原生能力**（\`id\`、\`title\`、\`data-*\`、\`aria-*\`）→ 用透传，不必声明。

按这条线划分，组件的 props 列表不会膨胀成一堆 \`id\`、\`class\`。

> 💡 \`$attrs\` 里还包含事件监听（\`onClick\` 等）。所以 \`v-bind="$attrs"\` 会连事件一起透传——这正好让「外层包一层」不丢点击行为。`
    }
  ]
});
