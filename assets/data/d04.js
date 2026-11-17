/* 第 4 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[19] = {
  deep: `### 模板里的 <Child> 是怎么变成真实组件的

\`\`\`html
<template><Child :title="t" /></template>
\`\`\`

编译产物大致是：

\`\`\`js
_createVNode(_component_Child, { title: _ctx.t })
\`\`\`

\`_component_Child\` 来自 \`_resolveComponent("Child")\`，它的解析顺序是：

1. 组件自身的 \`components\` 选项（局部注册）；
2. 全局注册表 \`app._context.components\`；
3. 内置组件（\`Transition\`、\`KeepAlive\` 等）；
4. 找不到就警告「Failed to resolve component: Child」。

这也解释了两件事：为什么局部注册的组件只能在**声明它的那个组件**里用（解析发生在它的作用域）；为什么拼写错误（\`<Childs>\`）不会报「未知标签」，而是渲染成一个普通自定义元素 + 警告。

### 组件实例是什么时候创建的

vnode 只是描述，真正的「实例」在 **patch 阶段**被创建：

1. 遇到组件类型 vnode → \`mountComponent\`；
2. 创建 \`instance\`（包含 props、setupState、ctx、subTree、isMounted 等）；
3. 执行 \`setup()\`；
4. 执行 render，得到子树的 vnode；
5. 递归 patch 子树；
6. 挂载完成后触发 \`mounted\`。

所以「组件实例」不是 class，而是一个普通对象。你通过 \`this.$refs.child\` 拿到的就是它，能读它的 \`$data\`、调用它暴露的方法。

### 全局注册为什么影响摇树

\`\`\`js
import Chart from './Chart.vue'
app.component('Chart', Chart)
\`\`\`

静态 \`import\` 已经把 Chart 引入模块图，再加上「可能在任意模板里被用到」（运行时解析，构建工具无法静态判断），打包器只能保守地保留它。**全局注册 + 静态导入 = 无法摇树**。

局部注册（在 \`components\` 里声明或 \`script setup\` 里 import）能被静态分析：模板里没用到，就可以删。这也是「业务组件一律局部注册」的真正原因——不只是作用域清晰，还关乎包体积。

### 为什么要区分「容器组件」和「展示组件」

| 类型 | 职责 | 特征 |
| --- | --- | --- |
| 容器（smart） | 取数据、管状态、编排 | 依赖 store / api |
| 展示（dumb） | 只负责渲染 | 只有 props 与 emit，可单测 |

混在一起时，组件既难测试（要 mock 接口）又难复用（换个数据源就不能用）。拆开后，展示组件可以在 Storybook 里单独看，容器组件可以换 UI 不动逻辑。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <my-comp></my-comp>
  <my-comp2></my-comp2>
</div>
<script>
  const app = Vue.createApp({})
  app.component('MyComp', { template: '<p>全局注册，任何模板都能用</p>' })
  app.component('MyComp2', {
    template: '<div><p>局部注册只能在内部用</p><Inner /></div>',
    components: { Inner: { template: '<em>Inner</em>' } }
  })
  app.mount('#app')
</script>
\`\`\`

> 💡 把 \`<Inner />\` 挪到根模板（\`#app\` 里）会看到警告「Failed to resolve component: Inner」——因为根组件的 \`components\` 里没有它。这就是「解析在声明它的作用域里发生」的实证。`,
  quiz: [
    { q: '模板里的 <Child /> 在运行时是怎么被解析成组件的？顺序是什么？', a: '编译成 _resolveComponent("Child")，依次查：当前组件的 components、全局注册表、内置组件，都找不到则警告并渲染为普通元素。' },
    { q: '为什么「全局注册组件」会影响 tree-shaking？', a: '全局注册配合静态 import 让组件进入模块图，且运行时按名字解析，构建工具无法静态判断是否被用到，只能保留；局部注册/script setup 的 import 可被静态分析并摇掉。' },
    { q: '组件实例是 class 实例吗？它大概包含哪些东西？', a: '不是，是 patch 阶段创建出来的普通对象，包含 props、setupState、ctx、subTree、isMounted 等，$refs 拿到的就是它。' }
  ]
};

window.VUE_DEEP[20] = {
  deep: `### 一个 .vue 文件被编译成什么

\`\`\`vue
<script>export default { data: () => ({ msg: 'hi' }) }</script>
<template><p class="a">{{ msg }}</p></template>
<style scoped>.a { color: red }</style>
\`\`\`

编译后是一个 JS 模块：

\`\`\`js
import { defineComponent } from 'vue'
const _sfc_main = defineComponent({ data: () => ({ msg: 'hi' }) })
const _hoisted_1 = { class: 'a' }                    // 静态部分被提升，只创建一次

_sfc_main.render = function (_ctx) {
  return (_openBlock(), _createElementBlock("p", _hoisted_1, _toDisplayString(_ctx.msg)))
}

_sfc_main.__scopeId = "data-v-7ba5bd90"              // scoped 的标记
export default _sfc_main
\`\`\`

三个细节值得记住：

- **静态提升**：\`class="a"\` 这种不会变的东西只在模块加载时创建一次，不进渲染函数。
- **Block 与 PatchFlag**：\`_createElementBlock\` 会记录动态子节点，diff 时只走这些节点。
- **\`__scopeId\`**：样式文件被编译成 \`.a[data-v-7ba5bd90]\`，同时运行时给该组件的元素加上 \`data-v-7ba5bd90\` 属性。

### scoped 的边界：为什么影响不到子组件内部

scoped 的本质是「属性选择器 + 哈希」，而哈希只加在**当前组件模板里的元素**上。子组件的根元素会同时带上父组件的 scopeId（方便父组件布局），但子组件内部元素没有父哈希，所以父样式进不去。

要穿透，三种方式：

\`\`\`css
:deep(.child-inner) { color: red }       /* 编译成 [data-v-x] .child-inner */
:slotted(.slot-content) { ... }          /* 作用于插槽内容 */
:global(.global-class) { ... }           /* 跳过 scoped */
\`\`\`

### HMR 为什么能保住状态

改 \`.vue\` 时，Vite 只重新编译这一个文件，然后通过 WebSocket 通知运行时「替换这个组件的定义」。运行时做的事是：**重新执行脚本得到新组件对象，再让现有实例用新 render 重渲染**，实例上的 \`data\` 不会被重新创建。

所以：

- 改 template / style：立刻生效，状态保留。
- 改 \`data\` 的初始值：通常不会重置已有状态（因为实例已存在），容易误以为「改了没生效」，刷新才看到。
- 改 \`<script setup>\` 里新增的顶层变量：HMR 有时会整组件刷新，状态丢失。

### 常见误解：scoped 能替代 BEM

不能。scoped 只保证「样式不外泄」，不解决「选择器太多层、复用困难」。而且它会给每条选择器加属性，选择器越深，匹配成本越高。命名规范（BEM、组件前缀）依然是必要的。

### 动手验证（4 分钟）

1. 在组件里写 \`<style scoped>.box { color: red }</style>\`，再在父组件写 \`.box { color: blue }\`。
2. 打开 Elements，看元素上的 \`data-v-xxx\` 属性有几个。
3. 把子组件的根元素换成两个并列元素（多根），再看父组件的 scoped 样式是否还能作用到「根」。

> 💡 单根时，子组件根元素会有**两个** \`data-v\`（父与子各一个），所以父样式能改它的颜色；换成多根后不再有唯一的根，父组件的 scoped 样式就完全进不来——这是 Fragment 与 scoped 的交互细节，光看文档很难注意到。`,
  quiz: [
    { q: 'SFC 的 <style scoped> 在编译后，选择器与元素上分别多了什么？', a: '选择器被加上属性选择器 [data-v-xxx]，元素上被加上同名属性 data-v-xxx，两边匹配才生效。' },
    { q: '为什么父组件的 scoped 样式能改子组件根元素，却改不了子组件内部元素？', a: 'scopeId 会同时加在子组件根元素上（便于父组件做布局），但子组件内部元素只带子自己的 scopeId，父选择器匹配不到，需要用 :deep()。' },
    { q: '改了 data 的初始值但页面没变化，可能是什么原因？', a: 'HMR 只替换组件定义并复用现有实例，已存在的 data 不会被重新初始化。刷新页面（或强制重载组件）才能看到新的初始值。' }
  ]
};

window.VUE_DEEP[21] = {
  deep: `### 入口链路：三行代码串起整个应用

\`\`\`text
index.html
  └─ <script type="module" src="/src/main.ts">
       └─ main.ts: createApp(App) → app.use(router) → app.use(pinia) → app.mount('#app')
            └─ App.vue: <RouterView /> → 命中路由 → 渲染页面组件
\`\`\`

排错时可以沿着这条链定位：

| 症状 | 先看哪一环 |
| --- | --- |
| 页面全白、无报错 | index.html 的 script 路径、main 是否执行 |
| 页面渲染但路由不生效 | main 是否 \`app.use(router)\`、App 里是否有 \`<RouterView>\` |
| 组件报「找不到 $store」 | pinia 是否在 mount 之前 use |
| 静态资源 404 | \`base\` 配置、部署子目录路径 |

### import.meta.env 是「编译时替换」，不是运行时对象

\`\`\`js
console.log(import.meta.env.VITE_API_BASE)
\`\`\`

构建时，Vite 会把这段**静态文本替换**成字符串字面量，例如 \`"https://api.example.com"\`。所以：

- 不能 \`import.meta.env[key]\` 动态取值（替换发生在编译期，拿不到动态 key）。
- 只有 \`VITE_\` 前缀的变量会暴露给客户端（其他变量可能含密钥，不能进前端）。
- 想按环境切换，用 \`.env.development\` / \`.env.production\` 文件，而不是运行时判断。

### Vite 的依赖预构建在做什么

启动时，Vite 会把 \`node_modules\` 里的 CommonJS/UMD 依赖（如 \`lodash\`）用 esbuild 预打包成 ESM，缓存到 \`node_modules/.vite\`。原因有两个：

1. 浏览器只认 ESM，CJS 必须转换；
2. 一个库内部可能有几百个小模块，逐个请求会产生瀑布（\`lodash-es\` 的经典问题），预打包把它们合成一个文件。

所以「改了 node_modules 里的东西没生效」，删掉 \`.vite\` 缓存目录即可。

### 生产构建的关键配置

\`\`\`js
build: {
  target: 'es2018',              // 决定语法降级程度
  sourcemap: false,              // 生产一般关掉，或上传到监控平台
  chunkSizeWarningLimit: 800,    // 超过就警告
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['vue', 'vue-router', 'pinia'],   // 稳定依赖单独成包，利于缓存
      }
    }
  }
}
\`\`\`

\`manualChunks\` 的意义：把不常变的库单独打包，业务代码更新时用户不用重新下载这些库。

### 动手验证（3 分钟）

1. 在 \`.env.development\` 写 \`VITE_APP_NAME=demo-dev\`，\`.env.production\` 写 \`VITE_APP_NAME=demo-prod\`。
2. 在组件里 \`console.log(import.meta.env.VITE_APP_NAME)\`。
3. 分别跑 \`npm run dev\` 与 \`npm run build && npm run preview\`。

> 💡 两个环境打印出不同值，但代码里没有 \`if (isDev)\`——因为这段文本在构建时就被替换成了常量。再试着写 \`import.meta.env['VITE_APP_' + 'NAME']\`，会发现拿不到值，这就是「静态替换」的直接证据。`,
  quiz: [
    { q: 'import.meta.env.VITE_X 在打包后变成了什么？为什么不能动态取 key？', a: '被替换成字符串字面量（编译期静态替换）。因此 import.meta.env[key] 这种动态访问无法被替换，拿不到值。' },
    { q: 'Vite 预构建（.vite 缓存）解决的两个问题是什么？', a: '把 CJS/UMD 依赖转成 ESM；把「一个库拆成几百个小模块」合并成单文件，避免浏览器产生请求瀑布。' },
    { q: '为什么要用 manualChunks 把 vue/vue-router/pinia 单独打包？', a: '这些库版本稳定、体积大；单独成 chunk 后业务代码更新时它们的 hash 不变，用户可命中浏览器缓存。' }
  ]
};

window.VUE_DEEP[22] = {
  deep: `### props 更新的完整路径

父组件里 \`t\` 变了之后：

1. 父的渲染 effect 被触发 → 重新执行 render → 生成新的 vnode。
2. patch 阶段发现是同一个组件类型 → **复用实例**，调用 \`updateComponent\`。
3. \`updateProps\` 把新 props 写进 \`instance.props\`（浅比较，只改变化的键）。
4. 子组件的渲染 effect 被触发（因为渲染时读过 props）→ 重新渲染。

所以「父更新会让子更新」不是主动通知，而是**子组件渲染时读过 prop，形成了依赖**。如果子组件模板里根本没用某个 prop，那个 prop 变化不会让子重新渲染——这点在性能分析时很有用。

### 为什么改 prop 会被拦截

\`instance.props\` 是一个 **shallowReactive + readonly** 的对象（开发环境）。读没问题，写在开发环境会警告：

\`\`\`text
Set operation on key "foo" failed: target is readonly.
\`\`\`

生产环境为了性能不加 readonly 包装，所以「改 prop」在线上可能**静默成功**——这正是最危险的地方：开发时看到警告改了代码，线上却因为没警告而出问题。规范做法只有一条：**子组件永不写 prop**。

### 「本地副本」的正确姿势

\`\`\`js
props: ['initial'],
data() { return { draft: this.initial } },
watch: { initial(v) { this.draft = v } }
\`\`\`

三个要点：

- 用 \`data\` 承接初始值，只取一次（首次创建）。
- 如果希望父更新时同步，需要 \`watch\`；不同步就是「用户编辑后不覆盖」的语义。
- 更清晰的方案是「受控 + 事件」：子组件永远显示 prop 的值，用户输入时 emit，由父决定是否更新。

\`\`\`js
// 受控写法
props: ['modelValue'],
methods: { onInput(e) { this.$emit('update:modelValue', e.target.value) } }
\`\`\`

### 引用类型 prop 的真实风险

\`\`\`js
props: ['user']
this.user.name = 'x'    // 没有警告，但改的是父的数据
\`\`\`

因为 prop 的「只读」是浅层的：它保护的是 \`props.user\` 这个绑定不被替换，不保护 \`user.name\`。Vue 无法深度代理每个 prop（成本太高），所以这条只能靠约定。

判断一个组件是否「守规矩」的方法：**把它单独挂在一个静态数据上，看是否能正常渲染**。依赖修改 prop 的组件，这样一测就露馅。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <child :count="count"></child>
  <button @click="count++">父 +1</button>
</div>
<script>
  const app = Vue.createApp({
    data: () => ({ count: 0 }),
    components: {
      child: {
        props: ['count'],
        template: '<p>子收到 {{ count }} <button @click="count = 99">子改 prop</button></p>'
      }
    }
  })
  app.mount('#app')
</script>
\`\`\`

1. 点子组件的按钮，看控制台警告，以及父的值是否变化。
2. 点父组件按钮，观察子的显示。

> 💡 子组件按钮点了之后：控制台出现 readonly 警告，界面短暂变成 99，但**父的 count 没变**；一旦父再 +1，子又被覆盖回父的值。这就是「单向数据流」在运行时的样子：子可以一时改掉自己的副本，但数据源在父那里。`,
  quiz: [
    { q: '父组件更新后，子组件为什么会被重新渲染？', a: '子组件渲染时读过 props，props 是响应式的，形成了依赖；props 更新触发子的渲染 effect。没用到的 prop 变化不会引起子渲染。' },
    { q: '为什么说「改 prop 在生产环境更危险」？', a: '开发环境 props 是 readonly，写入会警告；生产环境为性能省略了 readonly 包装，写入可能静默生效，导致父数据被意外修改且无提示。' },
    { q: '想把 prop 当表单初始值，正确写法是什么？', a: '用 data 承接一次（只取初始值），需要跟随父更新时加 watch；更好的方式是受控组件：显示 prop，输入时 emit update 事件。' }
  ]
};

window.VUE_DEEP[23] = {
  deep: `### 校验什么时候执行

\`\`\`js
props: {
  age: { type: Number, required: true, validator: (v) => v >= 0 }
}
\`\`\`

校验发生在两个时刻：

1. **创建实例时**（\`initProps\`）：检查类型、required、validator。
2. **每次 props 更新时**：再次检查（所以 validator 会在每次父更新时执行）。

这意味着 validator 不能写重逻辑——它可能被调用很多次，而且失败只是警告，不阻断渲染。

### type 是怎么判断的

\`\`\`js
// 简化实现
if (type === String) ok = typeof value === 'string'
else if (type === Number) ok = typeof value === 'number'
else if (type === Boolean) ok = typeof value === 'boolean'
else if (type === Array) ok = Array.isArray(value)
else if (type === Object) ok = isObject(value)
else ok = value instanceof type      // Date / Function / 自定义类
\`\`\`

所以：

- \`type: Array\` 必须写 \`Array\`，不能写 \`[]\`（会走 instanceof 分支直接报错）。
- 自定义类（如 \`type: MyModel\`）走 \`instanceof\`，跨 iframe / 多包实例时会失效。
- \`null\` 与 \`undefined\` **跳过所有类型检查**（否则可选 prop 没法写）。

### 默认值的三个细节

| 情况 | 结果 |
| --- | --- |
| 没传且没写 default | \`undefined\` |
| 没传且 default 是原始值 | 用该值 |
| 没传且 default 是函数（对象/数组） | 调用函数，用返回值 |
| 传了 \`undefined\` | 用 default |
| 传了 \`null\` | 用 null（不触发 default） |

最后一行常被忽略：\`null\` 是「明确传了空值」，不会回落默认值。如果后端可能返回 null，组件内部仍要判空。

### Boolean 的「存在即为真」

\`\`\`html
<Comp />                  <!-- disabled = false -->
<Comp disabled />         <!-- disabled = true -->
<Comp :disabled="false" /> <!-- disabled = false -->
<Comp disabled="false" />  <!-- disabled = true（字符串 "false" 是 truthy 的字符串） -->
\`\`\`

最后一行是经典陷阱：不带冒号时传的是字符串 \`"false"\`，Vue 的布尔转换规则会把它当成「存在」→ true。

### 校验是开发期契约，不是安全边界

| 它能做 | 它不能做 |
| --- | --- |
| 提醒开发者传错类型 | 阻止渲染 |
| 约束枚举与格式 | 替代后端参数校验 |
| 把 API 写在明面上 | 防止恶意数据（前端代码可被绕过） |

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <my-item :list="'not-array'" :mode="'xxx'"></my-item>
</div>
<script>
  Vue.createApp({
    components: {
      myItem: {
        props: {
          list: { type: Array, required: true },
          mode: { type: String, validator: v => ['grid', 'list'].includes(v) },
          tags: { type: Array, default: () => ['默认'] }
        },
        template: '<p>{{ list }} / {{ mode }} / {{ tags }}</p>'
      }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 组件**照常渲染**（页面显示 not-array / xxx / 默认），控制台出现两条警告：类型不符、validator 未通过。这证明校验只报警不拦截——所以不要在组件里假设「类型一定对」。`,
  quiz: [
    { q: 'prop 的 validator 会在什么时候执行？为什么不能写重逻辑？', a: '创建实例时与每次 props 更新时都会执行。它只是开发期警告，且可能被高频调用，写重逻辑会拖慢渲染。' },
    { q: '对象类型的 default 为什么必须是函数？传 null 会怎样？', a: '函数保证每个实例拿到独立对象，避免共享引用；传 null 属于「明确传值」，不会触发 default，只有 undefined/未传才回落默认值。' },
    { q: '<Comp disabled="false" /> 的 disabled 是 true 还是 false？为什么？', a: 'true。没有冒号时传的是字符串 "false"，布尔 prop 的规则是「属性存在即为真」，字符串 "false" 非空所以视为 true。' }
  ]
};

window.VUE_DEEP[24] = {
  deep: `### attrs 是怎么被收集的

组件 vnode 的 \`props\` 里既有声明的 props，也有没声明的属性。渲染组件时：

1. Vue 把 \`propsOptions\`（你声明的 props 名字）与 vnode.props 做比对；
2. 命中的写进 \`instance.props\`；
3. 没命中的写进 \`instance.attrs\`。

所以 \`$attrs\` 是「减去 props 之后剩下的全部」，包括 \`class\`、\`style\`、\`id\`、\`data-*\`、\`aria-*\`，以及事件监听（\`onClick\` 等）。

### class 与 style 为什么「永远」透传

即使你声明了 \`props: ['class']\`（不推荐），class/style 也会被特殊处理：它们在 patch 时走 \`patchClass\` / \`patchStyle\` 合并逻辑，而不是覆盖。

\`\`\`html
<Child class="a" />   <!-- Child 根元素本来有 class="b" -->
<!-- 结果：class="b a" -->
\`\`\`

这就是「给组件加 class 能改它根元素样式」的机制，也是很多 UI 库「组件根元素可被外部控制布局」的基础。

### inheritAttrs: false 到底关掉了什么

它只关掉「自动把 attrs 绑到根元素」这一步，**不影响 \`$attrs\` 的内容**。所以：

\`\`\`vue
<script>export default { inheritAttrs: false }</script>
<template>
  <div class="wrap">
    <input v-bind="$attrs" />
  </div>
</template>
\`\`\`

外部传的 \`placeholder\`、\`maxlength\` 会精确落在 \`input\` 上，而不是被糊到 \`div\` 上。这是二次封装表单控件的标准套路。

### 为什么多根节点无法自动透传

自动透传的前提是「有唯一的根元素可以写属性」。多根（Fragment）没有唯一根，Vue 无法决定 \`placeholder\` 该给谁，于是放弃并给出警告：

\`\`\`text
Extraneous non-props attributes (placeholder) were passed to component but
could not be automatically inherited because component renders fragment or text root nodes.
\`\`\`

解决只有一条：显式 \`v-bind="$attrs"\` 到你希望的那个元素上。

### 一个容易忽略的顺序问题

\`\`\`html
<input v-bind="$attrs" placeholder="默认" />
\`\`\`

后写的 \`placeholder\` 会覆盖 \`$attrs\` 里的同名项吗？在模板编译后，两者的属性会被合并成一个 props 对象，**后者覆盖前者**。想「外部优先」，就把 \`v-bind="$attrs"\` 放在后面：

\`\`\`html
<input placeholder="默认" v-bind="$attrs" />
\`\`\`

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <my-input placeholder="外部 placeholder" data-test="kw" class="custom"></my-input>
</div>
<script>
  Vue.createApp({
    components: {
      myInput: {
        inheritAttrs: false,
        props: ['modelValue'],
        template: '<div class="wrap"><input v-bind="$attrs" /><span>{{ JSON.stringify($attrs) }}</span></div>'
      }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 \`$attrs\` 里能看到 \`placeholder\`、\`data-test\`、\`class\`，但 \`input\` 上只有前两个真正生效（class 在 div 上合并了）。把 \`inheritAttrs\` 去掉再看：class 与 placeholder 也会同时出现在外层 div 上，导致「样式加错地方」。`,
  quiz: [
    { q: '$attrs 里到底包含什么？为什么不包含已声明的 props？', a: '包含 vnode.props 中未在 propsOptions 里声明的全部属性与事件监听（class、style、data-*、onClick 等）。声明过的被写进 instance.props，因此不在 attrs 里。' },
    { q: 'inheritAttrs: false 会影响 $attrs 的内容吗？', a: '不会。它只关闭「自动绑定到根元素」的行为，$attrs 仍然包含全部未声明属性，需要你手动 v-bind。' },
    { q: '多根节点组件为什么收不到自动透传？怎么解决？', a: '没有唯一根元素可写属性，Vue 放弃自动继承并警告。需要在模板里显式 v-bind="$attrs" 到指定元素。' }
  ]
};
