/* 第 5 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[25] = {
  deep: `### emits 选项不是「声明一下更好看」，它会改变运行时行为

不声明 \`emits\` 时，\`@some-event\` 这个监听器会落进 \`$attrs\`（因为没在 props 里声明），而 attrs 默认被**自动绑定到根元素**上：

\`\`\`vue
<!-- 子组件 -->
<template><button @click="$emit('some-event')">click</button></template>
\`\`\`

\`\`\`html
<!-- 父组件 -->
<MyButton @some-event="onEvent" />
\`\`\`

编译后父组件传下去的是 \`onSomeEvent\`。没声明 emits 时，它既被当作 attrs 绑到根元素（\`<button onSomeEvent="...">\` 等价的原生监听），又通过 \`$emit\` 派发了一次——**一次点击，回调执行两次**。

声明 \`emits: ['some-event']\` 后，Vue 在初始化时把 \`onSomeEvent\` 从 attrs 里摘出来，只保留「组件事件」这一条路径。所以：

| 是否声明 emits | 事件监听去哪 | 结果 |
| --- | --- | --- |
| 未声明 | attrs → 根元素原生监听 + emit | 可能触发两次 |
| 已声明 | 只作为组件事件 | 只触发一次 |

### 事件名的大小写匹配规则

编译时 \`v-on:some-event\` 会被转成 \`onSomeEvent\`（驼峰）。\`$emit('some-event')\` 与 \`$emit('someEvent')\` 都能匹配到它——Vue 内部会同时尝试「原样」与「转驼峰」两种形式。

但在 **DOM 内模板**（直接写在 HTML 里）中，HTML 属性不区分大小写，\`@someEvent\` 会被浏览器小写成 \`@someevent\`，匹配就失败了。所以：

- 组件内部 \`emit('someEvent')\`（驼峰）没问题；
- 父组件模板里统一写 \`@some-event\`（短横线）最安全。

### 为什么组件事件不冒泡

组件事件是「实例方法调用 + 监听器表」，不是 DOM 事件，没有冒泡的物理基础。\`<GrandChild>\` 里 emit 的事件，\`<GrandParent>\` 收不到，中间那层必须转发：

\`\`\`html
<!-- Parent.vue -->
<GrandChild @save="(x) => $emit('save', x)" />
\`\`\`

三层以上就该考虑 provide/inject 或状态管理——手写转发链是最容易在重构时断裂的代码。

### emit 是同步的，但它触发的更新是异步的

\`\`\`js
this.$emit('change', 1)
console.log('emit 之后的语句')
\`\`\`

父组件的监听函数会**同步执行**（在 emit 调用栈里）。但监听函数里改数据导致的重新渲染，仍然排进微任务。所以「emit 后立刻查子组件的 DOM」依旧要 \`nextTick\`。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <my-btn @some-event="onEvent"></my-btn>
  <my-btn2 @some-event="onEvent"></my-btn2>
  <p>执行次数：{{ n }}</p>
</div>
<script>
  Vue.createApp({
    data: () => ({ n: 0 }),
    methods: { onEvent() { this.n++; console.log('onEvent', this.n) } },
    components: {
      myBtn: { template: '<button @click="$emit(\\'some-event\\')">未声明 emits</button>' },
      myBtn2: { emits: ['some-event'], template: '<button @click="$emit(\\'some-event\\')">已声明 emits</button>' }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 点第一个按钮，\`n\` 直接变成 2（原生监听 + emit 各一次）；点第二个，\`n\` 只加 1。这一个差异就是「为什么必须写 emits」的全部理由。`,
  quiz: [
    { q: '组件没声明 emits 会发生什么？为什么可能触发两次？', a: '事件监听器会作为未声明属性落进 $attrs，被自动绑到根元素形成原生监听；同时 $emit 又派发一次组件事件，于是回调执行两次。声明 emits 后监听器会从 attrs 中剥离。' },
    { q: '为什么父组件模板里推荐写 @some-event 而不是 @someEvent？', a: 'DOM 内模板的 HTML 属性不区分大小写，@someEvent 会被小写成 @someevent 而匹配失败；短横线写法在任何场景都安全。' },
    { q: '组件事件会冒泡到祖先组件吗？三层传递怎么做？', a: '不会，它不是 DOM 事件。需要中间层显式转发 @event="$emit(...)"，或改用 provide/inject、状态管理。' }
  ]
};

window.VUE_DEEP[26] = {
  deep: `### ref 是什么时候被赋值的

\`\`\`html
<input ref="inp">
\`\`\`

渲染时，vnode 的 \`ref\` 会交给 \`setRef\` 处理，而它发生在 **patch 完成之后**（元素被插入 DOM 时）。所以：

- \`created\` 里 \`this.$refs.inp\` 是 \`undefined\`；
- \`mounted\` 里才是 DOM 元素；
- \`v-if\` 切换后，ref 会被设为 \`null\` 再重新赋值。

组合式 API 里同理：\`const inp = ref(null)\`，模板 \`ref="inp"\`，变量名必须与 ref 值一致才能自动绑定。

### v-for 上的 ref 是数组，但顺序不保证

\`\`\`html
<li v-for="item in list" :key="item.id" ref="items">
\`\`\`

\`this.$refs.items\` 是数组，但**不保证与 list 的顺序一致**。Vue 3 官方明确说明：ref 数组不保证顺序，不要依赖索引去对应数据。

需要「元素 ↔ 数据」对应时，用函数式 ref：

\`\`\`html
<li v-for="item in list" :key="item.id" :ref="(el) => setItemRef(el, item.id)">
\`\`\`

把 id 作为 key 存进 Map，既能乱序更新，也便于在卸载时清理。

### $parent / $root 为什么危险

\`\`\`js
this.$parent.$refs.layout.isShow = false
\`\`\`

这行代码隐含了三个假设：父组件有 \`layout\` 这个 ref、它的实例上有 \`isShow\`、而且这个字段可写。任何一个不成立就崩，且错误信息指向子组件——排查方向完全是错的。

更本质的问题：**它让子组件依赖了「自己被放在哪」**。这样一个组件无法在别处复用、无法单独测试。所以它只适合调试或遗留代码兜底。

### 为什么 ref 适合「命令式动作」

| 需求 | 适合 ref | 原因 |
| --- | --- | --- |
| 让输入框聚焦 | ✅ | 浏览器 API 只能操作真实 DOM |
| 调子组件 \`validate()\` | ✅ | 表单校验是「问一次答一次」的动作 |
| 读子组件内部状态 | ⚠️ | 应让子组件 emit 出来 |
| 改子组件内部状态 | ❌ | 破坏封装、数据流不可追 |

一条判据：**「这是一个动作，还是一个状态？」** 动作可以命令式（focus、scrollIntoView、play），状态必须声明式（props / store）。

### defineExpose 的必要性

\`\`\`vue
<script setup>
function reset() { /* ... */ }
defineExpose({ reset })
</script>
\`\`\`

\`script setup\` 默认**完全封闭**：父组件 ref 拿到的实例上没有任何内部变量。必须显式 expose。这是好事：它把「对外 API」变成一份显式清单，重构内部实现不会误伤调用方。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <button @click="focusIt">聚焦第二个输入框</button>
  <input v-for="i in 3" :key="i" :ref="el => setRef(el, i)" :placeholder="'输入框 ' + i">
</div>
<script>
  Vue.createApp({
    methods: {
      setRef(el, i) { (this.refs || (this.refs = {}))[i] = el },
      focusIt() { this.refs[2] && this.refs[2].focus() }
    },
    mounted() { console.log('mounted 时第一个输入框:', this.refs && this.refs[1]) }
  }).mount('#app')
</script>
\`\`\`

> 💡 \`mounted\` 里能拿到元素（说明 ref 在 patch 结束时已赋值），而 \`created\` 里拿不到。把 \`console.log\` 挪到 \`created\` 里再试一次，会打印 \`undefined\` —— 这就是「ref 的赋值时机」的实证。`,
  quiz: [
    { q: '为什么在 created 里访问 $refs 得到的是 undefined？', a: 'ref 在 patch 完成、元素插入 DOM 时才被赋值，created 阶段还没开始挂载，因此拿不到。' },
    { q: 'v-for 上的 ref 数组为什么不能依赖顺序对应数据？', a: 'Vue 3 明确不保证 ref 数组的顺序与列表一致。需要对应关系时用函数式 ref，按 id 存进 Map。' },
    { q: 'script setup 组件为什么必须 defineExpose 才能被父组件调用方法？', a: 'script setup 默认封闭，实例不暴露内部绑定；defineExpose 显式声明对外 API，避免父组件依赖内部实现。' }
  ]
};

window.VUE_DEEP[27] = {
  deep: `### provide/inject 的查找链

\`\`\`js
provide('theme', 'dark')     // 祖先
inject('theme')              // 任意后代
\`\`\`

运行时，每个组件实例的 \`provides\` 对象都以**父组件的 provides 为原型**（\`Object.create(parentProvides)\`）。所以 \`inject\` 就是一次原型链查找：先在自身 provides 找，找不到沿原型往上，直到根组件。

由此推出两个行为：

1. **就近覆盖**：中间层再 provide 同名 key，会遮住祖先的值（原型链上更近）。
2. **不能跨兄弟**：兄弟组件之间没有原型关系，互相 inject 不到。

### 为什么 provide 普通值不会更新

\`\`\`js
provide() { return { message: this.message } }   // ❌
\`\`\`

\`provide()\` 只在组件初始化时执行一次，返回的是一个普通对象。\`this.message\` 在那一刻被取值，之后 message 变化不会再写进那个对象。

两种修法：

\`\`\`js
// 1. 提供响应式对象本身（推荐）
provide() { return { config: this.config } }     // config 是 reactive 的

// 2. 提供 getter 函数，读取时现取
provide() { return { getMessage: () => this.message } }
\`\`\`

组合式里 \`provide('x', ref(0))\` 天然可行：传的是 ref 引用，后代改 \`.value\` 改的是同一个盒子。

### 用 Symbol 作 key

\`\`\`js
// keys.js
export const ThemeKey = Symbol('theme')
\`\`\`

字符串 key 容易撞名（尤其多人协作、多个库），Symbol 保证唯一，且 IDE 能跳转定义。代价是不能在模板里直接用 \`inject\`（模板只能访问实例属性），需要在 setup 里注入后返回。

### mitt：什么时候它比 provide 更合适

| 场景 | provide/inject | mitt |
| --- | --- | --- |
| 有明确祖先关系 | ✅ | 可用但绕 |
| 兄弟组件、无共同祖先 | ❌ | ✅ |
| 一次性的「通知」 | 略重 | ✅ |
| 需要追踪数据来源 | ✅（有链） | ❌（黑箱） |

mitt 的本质是一个 \`Map<事件名, Set<handler>>\`，跟 DOM 事件模型一样。它的问题也正是 DOM 事件的问题：**谁在监听、监听了几次、什么时候解绑，全都靠自觉**。

\`\`\`js
onMounted(() => bus.on('search', handler))
onUnmounted(() => bus.off('search', handler))   // 忘了这行 = 内存泄漏 + 幽灵回调
\`\`\`

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <provider-comp></provider-comp>
</div>
<script>
  Vue.createApp({
    components: {
      providerComp: {
        data: () => ({ msg: 'hello' }),
        provide() { return { plain: this.msg, box: this.$data } },
        template: '<div><button @click="msg = \\'changed\\'">祖先改 msg</button><child-comp /></div>'
      },
      childComp: {
        inject: ['plain', 'box'],
        template: '<p>plain = {{ plain }} / box.msg = {{ box.msg }}</p>'
      }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 点按钮后：\`plain\` 永远是 hello（初始化时的快照），\`box.msg\` 会跟着变（因为提供的是响应式数据对象）。这一行对比就把「值传递 vs 引用传递」讲清楚了。`,
  quiz: [
    { q: 'inject 的查找是怎么实现的？为什么中间层可以覆盖祖先的值？', a: '每个实例的 provides 以父组件的 provides 为原型，inject 是沿原型链向上查找；中间层再 provide 同名 key 时离自己更近，因此覆盖祖先值。' },
    { q: 'provide 一个普通字符串，后代为什么收不到更新？怎么改？', a: 'provide() 只在初始化执行一次，普通值是当时的快照。应提供 ref/reactive 对象（传引用），或提供 getter 函数在读取时现取。' },
    { q: 'mitt 相比 provide/inject，主要代价是什么？', a: '事件名是字符串、调用链隐式难以追踪，且必须在卸载时手动 off，否则会内存泄漏或重复触发；provide/inject 至少有明确的祖先链。' }
  ]
};

window.VUE_DEEP[28] = {
  deep: `### component :is 背后做了什么

\`\`\`html
<component :is="activeComponent" />
\`\`\`

编译成 \`_resolveDynamicComponent(_ctx.activeComponent)\`：

- 传字符串（如 \`'Home'\`）→ 按名字解析已注册组件；
- 传组件对象 → 直接使用；
- 传 \`null\` / 假值 → 渲染注释节点。

切换时，旧的 vnode 类型与新类型不同 → 走「卸载 + 挂载」：旧实例 \`beforeUnmount / unmounted\`，新实例 \`setup → mounted\`。所以状态全部重置。

### KeepAlive 缓存的到底是什么

它缓存的是**组件实例 + 它的子树 vnode**，以组件的 \`type\`（组件对象）为 key 存在内部 Map 里。切走时不是卸载，而是：

1. 把子树 DOM 移到一个隐藏容器（\`storageContainer\`）；
2. 实例标记为 \`isDeactivated\`，触发 \`deactivated\`；
3. 切回来时把 DOM 移回原位，触发 \`activated\`。

所以「DOM 一直存在、状态一直保留、只是不在文档流里」。这也解释了为什么被缓存的组件在 Devtools 里仍占内存。

### 四个钩子的调用顺序

| 时机 | 钩子 |
| --- | --- |
| 第一次进入 | \`setup → mounted → activated\` |
| 切走 | \`deactivated\` |
| 再切回来 | \`activated\`（不触发 mounted） |
| 缓存被清除 / 组件销毁 | \`unmounted\` |

所以「每次进入要刷新数据」必须写在 \`activated\`。写在 \`mounted\` 里只会执行一次——这是 KeepAlive 最经典的坑。

### include 匹配的是组件 name

\`\`\`html
<KeepAlive include="List,Detail">
\`\`\`

匹配 \`$options.name\`。\`script setup\` 的组件默认按**文件名**推断 name，如果文件名与你想写的不一致，就匹配不上。要用 \`defineOptions({ name: 'List' })\` 显式声明。

另外 \`include\` 写字符串时是逗号分隔，写数组/正则必须加 \`v-bind\`（否则得到的是字符串而不是数组）。

### max 的 LRU 行为

\`\`\`html
<KeepAlive :max="3">
\`\`\`

超过 3 个时，淘汰**最久未被访问**的那个。实现是一个数组记录访问顺序，每次激活时把 key 移到末尾，插入超限时删掉头部。所以：

- 缓存不是「越多越好」，用户来回切 10 个 tab 会持续占内存；
- 被淘汰的组件下次进入会重新 \`mounted\`，如果依赖 \`mounted\` 初始化，行为会不一致。

### 为什么 KeepAlive 只能有一个直接子节点

它的实现依赖「拿到唯一的子树 vnode 去缓存/搬移」。多个子节点时无法确定缓存哪一个，会给出警告并且只处理第一个。需要缓存多个，就包一层容器组件或改成路由级别的 KeepAlive。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <button @click="cur = cur === 'a' ? 'b' : 'a'">切换</button>
  <keep-alive>
    <component :is="cur"></component>
  </keep-alive>
</div>
<script>
  const mk = (name) => ({
    name,
    data: () => ({ n: 0 }),
    template: '<p>' + name + '：{{ n }} <button @click="n++">+1</button></p>',
    mounted() { console.log(name, 'mounted') },
    activated() { console.log(name, 'activated') },
    deactivated() { console.log(name, 'deactivated') },
    unmounted() { console.log(name, 'unmounted') }
  })
  Vue.createApp({
    data: () => ({ cur: 'a' }),
    components: { a: mk('a'), b: mk('b') }
  }).mount('#app')
</script>
\`\`\`

> 💡 第一次进入打印 \`a mounted / a activated\`；切到 b 打印 \`a deactivated / b mounted / b activated\`；再切回 a 只打印 \`b deactivated / a activated\`——没有 mounted。计数值也保留着。`,
  quiz: [
    { q: 'KeepAlive 切走组件时，DOM 被销毁了吗？', a: '没有。子树 DOM 被移到一个隐藏容器里保存，实例标记为 deactivated；切回来时再移回原位，因此状态与 DOM 都保留，只是不在文档流中。' },
    { q: '被 KeepAlive 缓存的组件，为什么「进入页面刷新数据」必须写在 activated？', a: 'mounted 只在第一次创建时执行，之后切回只触发 activated。写在 mounted 里第二次进入就不会刷新。' },
    { q: 'include 匹配的是什么？script setup 下要注意什么？', a: '匹配组件的 name 选项。script setup 默认用文件名推断 name，需用 defineOptions({ name }) 显式声明；数组/正则必须用 v-bind 绑定。' }
  ]
};

window.VUE_DEEP[29] = {
  deep: `### 一个 v-model 编译成两个绑定

\`\`\`html
<MyInput v-model="search" />
<!-- 等价于 -->
<MyInput :model-value="search" @update:model-value="search = $event" />
\`\`\`

所以子组件要做两件事：接住 \`modelValue\`，在合适的时机 \`emit('update:modelValue', 新值)\`。它**没有**修改 prop 的权力——赋值语句在父组件里。

### 多个 v-model 的编译

\`\`\`html
<UserForm v-model:name="form.name" v-model:age="form.age" />
\`\`\`

\`\`\`html
<UserForm :name="form.name" @update:name="form.name = $event"
          :age="form.age"  @update:age="form.age = $event" />
\`\`\`

子组件声明 \`props: ['name', 'age']\`、\`emits: ['update:name', 'update:age']\`。这就是 Vue 2 \`.sync\` 的升级版：可以同时有多个双向流，且名字可读。

### 修饰符怎么传进来

\`\`\`html
<MyInput v-model.trim="kw" />
\`\`\`

子组件会收到一个额外的 prop \`modelModifiers: { trim: true }\`（具名 v-model 时是 \`kwModifiers\` 这种「名字 + Modifiers」）。子组件自己去实现语义：

\`\`\`js
props: { modelValue: String, modelModifiers: { default: () => ({}) } },
methods: {
  onInput(e) {
    let v = e.target.value
    if (this.modelModifiers.trim) v = v.trim()
    this.$emit('update:modelValue', v)
  }
}
\`\`\`

注意修饰符**不会自动生效**：Vue 只负责把它传进来，具体行为要子组件实现。原生 \`<input v-model.trim>\` 之所以能用，是内置的 vModelText 指令实现了 trim。

### 常见设计错误与后果

| 错误 | 后果 |
| --- | --- |
| 子组件直接写 \`this.modelValue = x\` | 开发警告；父值不变，界面与数据脱节 |
| 事件名写成 \`update:modelvalue\`（小写 v） | 父组件收不到，v-model 失效 |
| 忘记声明 emits | 事件监听落进 attrs，可能双触发 |
| 传对象并原地修改 | 父组件的对象被隐式改写，绕过单向数据流 |

### 什么时候该用 v-model，什么时候用 emit

- **一组「输入值」**：用 v-model，语义清晰（这个组件是个输入控件）。
- **一个「动作通知」**：用普通事件（\`@save\`、\`@delete\`），因为不存在「值的回写」。

把所有事件都做成 \`update:xxx\` 会让组件 API 变成一堆双向绑定，反而看不出哪些是真正需要同步的状态。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <my-input v-model.trim="kw"></my-input>
  <p>父拿到的值：[{{ kw }}]，长度 {{ kw.length }}</p>
</div>
<script>
  Vue.createApp({
    data: () => ({ kw: '' }),
    components: {
      myInput: {
        props: { modelValue: String, modelModifiers: { default: () => ({}) } },
        emits: ['update:modelValue'],
        template: '<input :value="modelValue" @input="onInput" placeholder="输入带空格试试">',
        methods: {
          onInput(e) {
            let v = e.target.value
            if (this.modelModifiers.trim) v = v.trim()
            this.$emit('update:modelValue', v)
            console.log('emit 的值:', JSON.stringify(v))
          }
        }
      }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 输入「 abc 」，父组件的值里没有首尾空格（trim 生效）；把 \`v-model.trim\` 改成 \`v-model\`，空格就保留。这说明修饰符是子组件实现的行为，而不是 v-model 自带的魔法。`,
  quiz: [
    { q: '一个 v-model="x" 在编译后等价于哪两段？', a: ':model-value="x" 与 @update:model-value="x = $event"。所以子组件必须声明 modelValue 并 emit update:modelValue。' },
    { q: 'v-model.trim 的 trim 是谁实现的？', a: '子组件（或内置 vModelText 指令）通过收到的 modelModifiers 自行实现。Vue 只负责传入修饰符标记，不会自动生效。' },
    { q: '什么情况下不该用 v-model，而该用普通事件？', a: '当它只是「动作通知」而非「值回写」时（如 @save、@delete）。滥用 update:xxx 会让组件 API 全是双向流，反而混乱。' }
  ]
};

window.VUE_DEEP[30] = {
  deep: `### defineAsyncComponent 返回的是什么

它返回的不是原组件，而是**一个包装组件**。这个包装组件内部维护一个状态机：

\`\`\`text
pending  →  resolved（渲染真组件）
         ↘  rejected（渲染 errorComponent）
\`\`\`

包装组件首次渲染时：

1. 调用 \`loader()\`，得到 Promise；
2. 启动一个 \`delay\` 定时器（默认 200ms），到点仍 pending 就渲染 \`loadingComponent\`；
3. 启动 \`timeout\` 定时器（默认 Infinity），超时转 rejected；
4. Promise resolve → 拿到组件对象，缓存，切到 resolved 并重渲染。

所以「延迟 200ms 才显示 loading」是刻意的：网络快时直接出内容，避免 loading 一闪而过造成的闪烁感。

### 为什么要在 v-if 分支外小心

\`\`\`html
<div v-if="open">
  <HeavyChart />
</div>
\`\`\`

\`open\` 为 false 时，包装组件根本没渲染，\`loader\` 不会执行——这正是「懒」的意义。但如果有人为了「提前加载」把它放到 \`<div v-show="open">\` 里，元素始终渲染，代码就会立刻被下载，懒加载失效。

### 与路由懒加载的区别

| | defineAsyncComponent | 路由懒加载 |
| --- | --- | --- |
| 触发 | 组件被渲染时 | 路由切换时 |
| 包装 | 包一层状态机（loading/error） | 无包装，由路由处理 |
| 适合 | 弹窗内的大组件、低频模块 | 页面级代码分割 |

两者底层都是动态 \`import()\`，区别在「谁负责等待」与「等待期间显示什么」。

### 异步组件的代价

- 多一个网络请求：慢网下首次渲染有延迟；
- 竞态：加载完成前组件被卸载，回调仍会执行（需在 \`loader\` 里做可取消处理）；
- SSR 时需要在服务端预取，否则首屏缺内容。

### 一个实用模式：预加载而不渲染

\`\`\`js
const Heavy = defineAsyncComponent(() => import('./Heavy.vue'))
// 用户 hover 菜单时提前触发下载
function prefetch() { import('./Heavy.vue') }
\`\`\`

\`import()\` 有模块缓存：预加载过的模块，异步组件再加载时直接命中缓存，用户点开就是瞬间出现。

### 动手验证（3 分钟）

用 CDN 建一个页面，把组件放在一个按钮后面：

\`\`\`html
<div id="app">
  <button @click="show = !show">显示/隐藏</button>
  <async-demo v-if="show"></async-demo>
</div>
<script>
  const AsyncDemo = Vue.defineAsyncComponent({
    loader: () => new Promise((r) => setTimeout(() => r({
      template: '<p>我是异步加载的组件</p>'
    }), 1500)),
    loadingComponent: { template: '<p>加载中…</p>' },
    delay: 200
  })
  Vue.createApp({ data: () => ({ show: false }), components: { AsyncDemo } }).mount('#app')
</script>
\`\`\`

> 💡 点按钮后：先空白约 200ms，然后出现「加载中…」，1.5 秒后出现真组件。把 \`delay\` 改成 0，"加载中" 会立刻出现——你能直观看到 delay 就是「防闪烁阈值」。`,
  quiz: [
    { q: 'defineAsyncComponent 的 delay 默认 200ms，这个值解决什么问题？', a: '防 loading 闪烁：网络很快时（<200ms）不显示 loading，直接出内容；超过 200ms 才显示占位。' },
    { q: '如果异步组件放在 v-show 为 false 的容器里，懒加载会生效吗？', a: '不会。v-show 只是改 display，元素始终渲染，包装组件会立刻执行 loader 下载代码，懒加载失效。要用 v-if。' },
    { q: '异步组件与路由懒加载的本质区别是什么？', a: '都基于动态 import，但触发时机与等待方式不同：异步组件在被渲染时触发、自带 loading/error 状态机；路由懒加载在路由切换时触发、由路由层等待。' }
  ]
};

window.VUE_DEEP[31] = {
  deep: `### 插槽内容的编译结果：一个函数

父组件里的插槽内容会被编译成一个 **slot 函数**，并且用 \`withCtx\` 绑定到**父组件实例**：

\`\`\`js
// 父组件渲染时，把子节点包成 slots 传给子组件
_createVNode(Child, null, {
  default: _withCtx(() => [ _createElementVNode("p", null, _toDisplayString(_ctx.parentMsg)) ])
})
\`\`\`

子组件里 \`<slot />\` 编译成 \`_renderSlot(_ctx.$slots, "default")\`，也就是「调用那个函数」。

于是作用域规则立刻清楚了：**函数是在父组件的上下文里定义的，所以它读的是父组件的数据**。这也解释了为什么插槽内容无法访问子组件的 data——它压根不在子组件的渲染上下文里执行。

### 作用域插槽：给函数传参

\`\`\`html
<slot :list="datalist" :loading="loading"></slot>
\`\`\`

\`_renderSlot\` 会把 \`:list\` 收集成一个 props 对象，作为参数传给父组件的 slot 函数。父组件用 \`v-slot="{ list }"\` 解构。

所以作用域插槽的本质是：**子组件调用父组件定义的函数，并把数据作为参数传进去**。这跟回调函数完全同构。

### 具名插槽在 $slots 里长什么样

\`\`\`js
this.$slots = {
  header: fn,
  default: fn,
  footer: fn
}
\`\`\`

判断某个插槽是否被传入，用 \`this.$slots.header\`（函数存在与否），而不是看长度。这也是「条件渲染插槽占位」的常用写法：

\`\`\`html
<div v-if="$slots.footer" class="footer"><slot name="footer" /></div>
\`\`\`

### 动态插槽名

\`\`\`html
<template #[slotName]>内容</template>
\`\`\`

编译成 \`{ [slotName]: fn }\`。注意 \`#\` 后面只能用表达式，不能写字符串拼接的静态名 + 动态名混用。

### 插槽更新的时机

父组件更新时，slot 函数会被重新创建（因为它在父的 render 里）。子组件是否重渲染？取决于子组件是否「读」了 \`$slots\`。实际效果是：插槽内容会随父组件更新而更新，即使子组件本身的数据没变——这是「父驱动子」的另一条通道。

如果性能敏感（大量插槽内容），可以用 \`v-memo\` 或把静态部分提到父组件的 computed 里，减少每次重建。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <card>
    <p>父的数据：{{ parentMsg }}</p>
  </card>
  <card v-slot="{ childMsg }">
    <p>父：{{ parentMsg }} / 子：{{ childMsg }}</p>
  </card>
</div>
<script>
  Vue.createApp({
    data: () => ({ parentMsg: 'parent' }),
    components: {
      card: {
        data: () => ({ childMsg: 'child' }),
        template: '<div class="card"><slot :childMsg="childMsg"></slot></div>'
      }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 第一个 \`<card>\` 里直接写 \`{{ childMsg }}\` 会是空白（父作用域没有这个变量，控制台提示 Property "childMsg" was accessed during render but is not defined）。第二个用 \`v-slot\` 解构后就有值了——插槽作用域只能用「显式传参」的方式跨过去。`,
  quiz: [
    { q: '插槽内容为什么能访问父组件的数据、却访问不到子组件的数据？', a: '插槽内容在编译时被包成 slot 函数，并用 withCtx 绑定到父组件实例；子组件调用该函数时，函数体读的是父的上下文。要拿子数据必须通过作用域插槽传参。' },
    { q: '作用域插槽在机制上等价于什么？', a: '等价于「子组件调用父组件传进来的回调函数，并把数据作为参数传入」，跟普通回调同构。' },
    { q: '如何判断父组件有没有传某个具名插槽？', a: '检查 this.$slots.footer 是否存在（函数是否存在），而不是看长度或子节点数，常用于条件渲染插槽的外层容器。' }
  ]
};
