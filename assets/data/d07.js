/* 第 7 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[37] = {
  deep: `### setup 到底在什么时候执行

顺序是：\`beforeCreate → setup → created\`。也就是说 \`setup\` 里已经能访问 props，但组件的 \`data\`、\`methods\`、\`computed\` 还没初始化。

这带来两个直接结论：

1. \`setup\` 里不能用 \`this\`（实例还没装配完）。
2. \`setup\` 里注册的生命周期钩子，一定早于组件真正挂载，所以一定能被触发。

\`setup\` 只执行一次（每次组件实例创建时）。它的返回值会被挂到组件实例上（选项式可通过 \`this.xxx\` 访问），模板也能直接读。

### 四种复用方式的真实代价

| 方式 | 状态来源 | 冲突处理 | 可读性 |
| --- | --- | --- | --- |
| mixin | 全部塞进 this | 静默覆盖 | 差（不知道来自哪个 mixin） |
| 作用域插槽 | 父传入 | 无冲突 | 中（模板变复杂） |
| 高阶组件（HOC） | props 透传 | 无冲突 | 差（层级嵌套、命名冲突） |
| 组合式函数 | 显式返回值 | 可重命名 | 好（调用即声明） |

组合式函数的关键优势是「**依赖显式化**」：\`const { list, load } = useList(api)\`，你看得见它用了什么、返回了什么。而 mixin 的 \`this.list\` 是凭空出现的。

### 组合式函数的约定

\`\`\`js
export function useCounter(initial = 0) {
  const count = ref(initial)              // 状态
  const double = computed(() => count.value * 2)
  function inc() { count.value++ }        // 方法
  onUnmounted(() => { /* 清理 */ })       // 生命周期
  return { count, double, inc }
}
\`\`\`

三条约定：**名字以 \`use\` 开头**（表明是组合式函数）、**返回 ref 而不是解构后的值**（保持响应式）、**必须在 setup 同步阶段调用**（生命周期与 inject 依赖当前实例）。

### 为什么组合式函数不能用 this

\`\`\`js
// ❌ 在组合式函数里
export function useX() { this.foo = 1 }
\`\`\`

因为 \`this\` 只有在选项式的 \`methods\` 等方法里才被绑定到实例。组合式函数是普通函数，调用时没有组件上下文，拿不到实例。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <p>计数器 A：{{ a.count }}（双倍 {{ a.double }}）</p>
  <p>计数器 B：{{ b.count }}</p>
  <button @click="a.inc">A +1</button>
  <button @click="b.inc">B +1</button>
</div>
<script>
  const { ref, computed } = Vue
  function useCounter(initial = 0) {
    const count = ref(initial)
    const double = computed(() => count.value * 2)
    const inc = () => count.value++
    return { count, double, inc }
  }
  Vue.createApp({
    setup() {
      return { a: useCounter(0), b: useCounter(100) }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 两个计数器互不影响，因为每次调用 \`useCounter\` 都创建了**独立的 \`ref\`**。如果把 \`count\` 定义在模块顶层（函数外面），两个计数就会共享——这正是 mixin 时代「状态被意外共享」的经典 bug。`,
  quiz: [
    { q: 'setup 在哪个生命周期之间执行？为什么不能用 this？', a: '在 beforeCreate 与 created 之间执行；此时组件的 data/methods/computed 尚未装配，实例上的 this 不可用。' },
    { q: '组合式函数相比 mixin 的核心优势是什么？', a: '依赖与返回值显式化，不污染 this；可重命名避免冲突，来源清晰，且能把状态、计算、生命周期封装在一起复用。' },
    { q: '组合式函数为什么必须在 setup 同步阶段调用？', a: '它内部可能调用 onMounted、provide、inject 等依赖「当前组件实例」的 API，这些 API 依赖同步执行期间的全局实例上下文。' }
  ]
};

window.VUE_DEEP[38] = {
  deep: `### reactive 是「浅代理 + 惰性递归」

\`\`\`js
const state = reactive({ a: 1, nested: { b: 2 } })
\`\`\`

- \`state\` 本身是一个 Proxy，读写 \`a\`、\`nested\` 都被拦截。
- \`nested\` 只有在被**读取**时才被包成 Proxy（惰性）。没访问过就不会递归，节省初始化成本。
- 已经代理过的对象会缓存（\`WeakMap\`），同一个对象不会重复包装。

由此推出一个反直觉的行为：

\`\`\`js
const raw = { b: 2 }
const state = reactive({ nested: raw })
state.nested === raw          // false（读到的是代理）
markRaw(raw)                  // 可以用 markRaw 阻止代理
\`\`\`

### ref 的模板解包规则，有三个例外

| 场景 | 是否自动解包 |
| --- | --- |
| 模板里直接使用 \`count\` | ✅ |
| reactive 对象的属性 \`state.count\` | ✅（嵌套的 ref 会被解包） |
| 数组元素 \`list[0]\` | ❌ 需要 \`.value\` |
| Map/Set 里的值 | ❌ 需要 \`.value\` |
| 作为 prop 传给子组件 | ✅（父传值，子收 ref 本身） |

第三行是高频坑：\`ref\` 放进数组后，模板里 \`item.value\` 才有效。

### 整体替换：ref 安全，reactive 危险

\`\`\`js
const list = ref([])
list.value = newArray          // ✅ 安全，触发更新

let state = reactive({ list: [] })
state = { list: newArray }     // ❌ 变量指向了新对象，脱离代理；界面不更新
\`\`\`

\`reactive\` 的响应式绑在「那个对象」上，一旦变量指向新对象，代理就断了。所以数据需要整体替换（接口返回、重置表单）时，用 \`ref\` 更稳。

### 什么时候用 shallowRef / readonly

| API | 用途 |
| --- | --- |
| \`shallowRef\` | 存大对象但只关心整体替换（图表实例、大列表），避免深度代理开销 |
| \`shallowReactive\` | 只代理第一层 |
| \`readonly\` | 暴露给外部只读，防止子模块误改 |
| \`markRaw\` | 标记对象永不代理（第三方实例） |

\`markRaw\` 很实用：把 ECharts 实例放进 \`reactive\` 会触发深度代理，既慢又可能破坏库内部逻辑。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <p>count = {{ count }}</p>
  <p>list[0] = {{ list[0] }} / list[0].value = {{ list[0].value }}</p>
  <p>state.count = {{ state.count }}</p>
</div>
<script>
  const { ref, reactive } = Vue
  Vue.createApp({
    setup() {
      const count = ref(1)
      const list = ref([ref('a'), ref('b')])
      const state = reactive({ count })
      setTimeout(() => { count.value = 99 }, 1000)
      return { count, list, state }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 1 秒后，第一个和第三个都变成 99（模板解包 + 嵌套解包），但 \`list[0]\` 显示的是对象（需要 \`.value\` 才是 'a'）。这三个显示差异就是解包规则的完整样本。`,
  quiz: [
    { q: 'reactive 是深度代理还是浅代理？嵌套对象什么时候被代理？', a: '浅代理 + 惰性递归：只有嵌套对象被访问时才包装成 Proxy，并有 WeakMap 缓存，避免初始化时全量递归。' },
    { q: '为什么「整体替换数据」时推荐用 ref 而不是 reactive？', a: 'reactive 的响应式绑定在原对象上，变量被赋值为新对象后就脱离了代理；ref 通过 .value 整体替换仍然安全并触发更新。' },
    { q: 'ref 放在数组里，模板中要怎么写才能拿到值？', a: '数组与 Map/Set 不会自动解包，必须写 item.value（模板里也是）。只有顶层绑定与 reactive 属性会自动解包。' }
  ]
};

window.VUE_DEEP[39] = {
  deep: `### toRef 其实是一个「转发器」

\`\`\`js
const state = reactive({ count: 1 })
const count = toRef(state, 'count')
\`\`\`

\`count\` 不是复制值，而是一个 \`ObjectRefImpl\` 对象，它的 \`get value\` 和 \`set value\` 直接转发到 \`state.count\`：

\`\`\`js
// 概念实现
{
  get value() { return source[key] },      // 读 → 触发源对象的 get（收集依赖）
  set value(v) { source[key] = v }         // 写 → 触发源对象的 set（派发更新）
}
\`\`\`

所以 \`count.value++\` 等价于 \`state.count++\`，两边始终同步，且**不复制数据**。

### toRefs 只是批量调用 toRef

\`\`\`js
function toRefs(obj) {
  const ret = {}
  for (const key in obj) ret[key] = toRef(obj, key)
  return ret
}
\`\`\`

所以 \`...toRefs(state)\` 展开后，每个属性都是 ref，模板里自动解包，脚本里要 \`.value\`。

### 为什么直接解构会丢响应式（从机制再看一次）

\`\`\`js
const { count } = state
\`\`\`

这行做的是「读一次 \`state.count\`，把值赋给新变量」。读操作触发了一次 get（收集依赖），但**新变量与源属性之间没有任何连接**。之后 \`count++\` 改的是局部变量，永远不会触发 \`state\` 的 set。

\`toRefs\` 之所以能解决，是因为它返回的不是值，而是「带 getter/setter 的对象」——连接关系被保留了。

### props 的 toRefs

\`\`\`js
setup(props) {
  const { title } = toRefs(props)   // 保持跟随
  return { title }
}
\`\`\`

如果写 \`const { title } = props\`，拿到的只是首次渲染时的值，父组件后续更新不会反映。这一点在组合式 API 里比选项式更容易踩，因为解构太自然了。

### 什么时候确实需要 toRefs

| 场景 | 需要吗 |
| --- | --- |
| 返回给模板用（想直接写 \`{{ count }}\`） | ✅ |
| 解构 props 并保持响应式 | ✅ |
| 从 store 解构 state（Pinia 用 storeToRefs） | ✅ |
| 只是想在函数内读取值 | ❌ 直接 \`state.count\` |
| 想复制一份独立数据 | ❌ 用深拷贝 |

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <p>直接解构：{{ plain }}（改 state 不会变）</p>
  <p>toRefs：{{ count }}（会跟随）</p>
  <button @click="state.count++">state.count++</button>
</div>
<script>
  const { reactive, toRefs } = Vue
  let plain, count, state
  Vue.createApp({
    setup() {
      state = reactive({ count: 1 })
      plain = state.count            // 快照
      count = toRefs(state).count    // 转发器
      return { state, plain, count }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 点按钮：\`count\` 跟着变，\`plain\` 永远是 1。原因不是「Vue 没检测到」，而是 \`plain\` 根本不是响应式的——它只是第一次读取时的那个数字。`,
  quiz: [
    { q: 'toRef(state, "count") 返回的对象，读写时发生了什么？', a: '返回一个带 get/set 的 ref 包装器：读 .value 时读源属性（触发源的 get，收集依赖），写 .value 时写源属性（触发源的 set，派发更新）。不复制数据。' },
    { q: '为什么 const { count } = state 之后修改 count 不影响视图？', a: '解构是一次取值，得到的是普通变量，与源属性没有连接关系；后续修改不会触发源对象的 set，也就不会派发更新。' },
    { q: '把 props 解构给模板用，为什么必须用 toRefs？', a: '直接解构只取到首次渲染的值，父组件后续更新不会反映到解构出的变量。toRefs 保留到 props 的转发关系。' }
  ]
};

window.VUE_DEEP[40] = {
  deep: `### watchEffect 的依赖收集是「运行时」的

\`\`\`js
watchEffect(() => {
  if (flag.value) console.log(a.value)
  else console.log(b.value)
})
\`\`\`

它执行一次，把**实际读到的**那些 ref 记为依赖。所以：

- \`flag\` 为真时只依赖 \`flag\`、\`a\`；
- \`flag\` 变假后会重新执行，此时依赖变为 \`flag\`、\`b\`，旧依赖 \`a\` 会被清理。

这意味着**依赖集合是动态变化的**，每轮重跑前都会清空旧依赖再重新收集（与 Vue 2 的 Watcher 不同）。好处是不会因为旧依赖误触发；坏处是你无法从代码结构上直接看出它依赖什么——读代码时必须模拟执行路径。

### 副作用清理：onCleanup 的真实用途

\`\`\`js
watchEffect((onCleanup) => {
  const timer = setInterval(tick, 1000)
  onCleanup(() => clearInterval(timer))
})
\`\`\`

\`onCleanup\` 注册的函数会在**下一次重跑前**和**停止侦听时**各执行一次。这正好解决两类问题：

1. 定时器/监听器没清，越跑越多；
2. 异步请求的竞态：旧请求还没回来，新请求已发出。

\`\`\`js
watchEffect((onCleanup) => {
  const ctrl = new AbortController()
  fetch('/api/search?q=' + kw.value, { signal: ctrl.signal })
  onCleanup(() => ctrl.abort())
})
\`\`\`

### watch 的 flush 与 watchEffect 相同

两者都支持 \`{ flush: 'pre' | 'post' | 'sync' }\`，默认 \`pre\`（组件更新前）。区别只在「依赖怎么来」与「有没有旧值」。

### 什么时候 watchEffect 会变成陷阱

| 场景 | 问题 |
| --- | --- |
| 内部有条件分支 | 依赖随分支变化，行为难以预测 |
| 里面改了被侦听的数据 | 死循环 |
| 依赖了非响应式来源（Date.now） | 永远不会因它重跑 |
| 里面发请求但没 onCleanup | 竞态覆盖 |

**能用 watch 显式列出依赖时，就别用 watchEffect**。显式声明是可读性的保证，watchEffect 更适合「依赖多且天然整体重跑」的场景（例如把一组状态同步到第三方库）。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <input v-model="kw"><p>结果：{{ result }}</p>
</div>
<script>
  const { ref, watchEffect } = Vue
  Vue.createApp({
    setup() {
      const kw = ref('')
      const result = ref('')
      watchEffect((onCleanup) => {
        const q = kw.value
        console.log('开始请求：', q)
        const t = setTimeout(() => {
          result.value = '结果 for ' + q
          console.log('返回：', q)
        }, 800)
        onCleanup(() => { console.log('清理上一次：', q); clearTimeout(t) })
      })
      return { kw, result }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 快速连打三个字符，你会看到「清理上一次」紧跟在下一次「开始请求」之前，只有最后一次的结果真正落地。这就是 onCleanup 解决竞态的过程。`,
  quiz: [
    { q: 'watchEffect 的依赖集合是固定的吗？', a: '不是。每次重跑前会清空旧依赖，再按当次执行实际读到的数据重新收集，因此依赖随分支动态变化。' },
    { q: 'onCleanup 注册的函数什么时候执行？用它解决什么问题？', a: '在下一次重跑前和侦听停止时各执行一次。常用于清定时器/事件监听，以及中断上一次异步请求（AbortController）避免竞态覆盖。' },
    { q: '什么情况下应该优先用 watch 而不是 watchEffect？', a: '需要显式看出依赖、需要旧值、或依赖会随条件分支变化时。watchEffect 更适合「依赖多且天然整体重跑」的副作用。' }
  ]
};

window.VUE_DEEP[41] = {
  deep: `### props 是 shallowReactive 的

\`\`\`js
setup(props) {
  console.log(props.title)        // ✅ 响应式
  props.title = 'x'               // ⚠️ 开发环境警告
}
\`\`\`

- 它只代理第一层（所以 \`props.user.name\` 的深层变化不会触发 props 级依赖，但 \`user\` 对象本身若是 reactive，子组件读了 \`user.name\` 依然会追踪）。
- 开发环境是 readonly，写入警告；生产环境可能静默。

### emit 的三种声明方式

\`\`\`js
// 1. 数组：只声明名字，不校验参数
emits: ['change']

// 2. 对象：可写校验函数（返回 false 会警告）
emits: { change: (payload) => payload > 0 }

// 3. TS 调用签名（script setup）
const emit = defineEmits<{ (e: 'change', id: number): void }>()
\`\`\`

对象写法常被忽略：它能捕获「传错参数类型」的问题，适合团队协作的公共组件。

### provide 的三种写法与更新语义

\`\`\`js
provide('a', 1)                          // 普通值：永不更新
provide('b', ref(1))                     // ref：后代改 .value 全链生效
provide('c', reactive({ x: 1 }))         // reactive：属性级响应

provide('d', () => count.value)           // getter：每次读都现取
\`\`\`

选择依据：**后代只需读 → ref/reactive；后代需要写 → 提供「改的方法」而不是直接给可变对象**（便于加校验与埋点）。

\`\`\`js
provide('visible', readonly(visible))
provide('setVisible', (v) => { visible.value = v })
\`\`\`

### inject 的调用时机限制

\`\`\`js
setup() {
  const theme = inject('theme')     // ✅
  setTimeout(() => { inject('x') }, 0)  // ❌ 拿不到（没有当前实例）
}
\`\`\`

与生命周期注册函数同理：\`inject\` 依赖「当前正在 initial 的组件实例」，异步回调里这个上下文已经没了。

### 对象默认值要用工厂

\`\`\`js
const cfg = inject('cfg', () => ({ size: 'm' }))   // 每次调用生成新对象
const bad = inject('cfg', { size: 'm' })            // 所有组件共享同一对象
\`\`\`

与 props 的 default 完全同理。

### 动手验证（3 分钟）

\`\`\`html
<div id="app"><parent-c></parent-c></div>
<script>
  const { ref } = Vue
  Vue.createApp({
    components: {
      parentC: {
        setup() {
          const n = ref(0)
          Vue.provide('n', n)
          Vue.provide('plain', 0)
          return { n }
        },
        template: '<div><button @click="n++">祖先 n={{ n }}</button><child-c /></div>'
      },
      childC: {
        setup() {
          return { n: Vue.inject('n'), plain: Vue.inject('plain') }
        },
        template: '<p>inject ref: {{ n }} / inject 普通值: {{ plain }}</p>'
      }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 点按钮：\`inject ref\` 跟着变，\`inject 普通值\` 永远是 0。这一段就是「provide 传引用才有响应式」的最小证明。`,
  quiz: [
    { q: 'setup(props) 里能直接修改 props 吗？为什么？', a: '不能。props 在开发环境是 shallowReactive + readonly，写入会警告；生产环境虽可能静默，但会破坏单向数据流，应 emit 让父改。' },
    { q: 'provide 普通值、ref、reactive 三种写法，更新行为分别如何？', a: '普通值是初始化快照永不更新；ref 通过 .value 全链响应；reactive 属性级响应。需要后代写操作时，建议提供修改方法而不是可变对象。' },
    { q: '为什么 inject 的对象默认值要写成工厂函数？', a: '直接给对象会让所有组件共享同一引用，一个组件修改会影响其他；工厂函数每次返回新对象。' }
  ]
};

window.VUE_DEEP[42] = {
  deep: `### 为什么生命周期注册函数必须在同步阶段

\`\`\`js
onMounted(() => {})
\`\`\`

它的实现依赖一个模块级变量 \`currentInstance\`（当前正在 setup 的组件实例）。\`setup\` 执行期间它指向该实例，执行结束后被置空。\`onMounted\` 就是「把回调挂到 \`currentInstance.mounted\` 上」。

所以：

- 在 \`setup\` 同步代码里调用 → \`currentInstance\` 有效 → 注册成功；
- 在 \`setTimeout\` / \`await\` 之后调用 → \`currentInstance\` 已被清空 → 警告「no active component instance」并**静默失效**。

\`inject\`、\`provide\`、\`onUnmounted\`、\`useRoute\` 全都遵循这条规则。

### 为什么「await 之后注册」也失效

\`\`\`js
setup() {
  await fetchData()          // 中断了同步执行
  onMounted(() => {})        // ❌
}
\`\`\`

\`await\` 会把后续代码放进微任务，此时 setup 的同步阶段已结束，上下文已恢复。所以组合式函数里如果内部有 \`await\`，要在 \`await\` **之前**注册钩子。

### VCA 版购物车：把一致性交给 ref + computed

\`\`\`js
export function useCart(initial = []) {
  const items = ref(initial)
  const ids = ref([])

  const allChecked = computed({
    get: () => items.value.length > 0 && ids.value.length === items.value.length,
    set: (v) => { ids.value = v ? items.value.map((i) => i.id) : [] }
  })

  const total = computed(() =>
    items.value.filter((i) => ids.value.includes(i.id))
      .reduce((s, i) => s + i.price * i.count, 0)
  )

  function remove(id) {
    items.value = items.value.filter((i) => i.id !== id)
    ids.value = ids.value.filter((x) => x !== id)
  }

  return { items, ids, allChecked, total, remove }
}
\`\`\`

注意 \`remove\` 里对 \`ids\` 的清理：即使 \`total\` 用 \`filter\` 过滤了不存在的 id，\`allChecked\` 也会因为 \`ids\` 里残留而算错。**派生状态能兜住一部分问题，但源状态之间的关系仍要自己维护**。

### 组合式函数里的清理时机

\`\`\`js
export function usePolling(fn, ms) {
  let timer
  onMounted(() => { timer = setInterval(fn, ms) })
  onUnmounted(() => clearInterval(timer))
  return { stop: () => clearInterval(timer) }
}
\`\`\`

把「启动 + 清理」放在同一个函数里，是组合式函数比 mixin 更安全的地方：mixin 的 mounted 与 beforeUnmount 分散在不同文件里，容易漏。

### 动手验证（2 分钟）

\`\`\`html
<div id="app">{{ msg }}</div>
<script>
  const { ref, onMounted } = Vue
  Vue.createApp({
    setup() {
      const msg = ref('看控制台')
      setTimeout(() => {
        onMounted(() => console.log('这个永远不会执行'))
      }, 0)
      return { msg }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 控制台出现警告「onMounted is called when there is no active component instance」，且回调从未执行。把 \`onMounted\` 挪到 \`setTimeout\` 外面，就正常了——原因就在 \`currentInstance\` 已被清空。`,
  quiz: [
    { q: 'onMounted 等注册函数为什么不能在 setTimeout 里调用？', a: '它们依赖全局的 currentInstance（setup 执行期间才有值）。异步回调执行时上下文已被清空，注册会警告并失效。' },
    { q: '组合式函数内部有 await 时，钩子该注册在哪里？', a: '必须在 await 之前注册，因为 await 之后的代码已在微任务里，setup 的同步阶段结束，实例上下文不复存在。' },
    { q: '购物车删除商品时，为什么除了 items 还要清理 ids？', a: 'ids 里残留已删除商品的 id 会让 allChecked 等派生状态算错（长度比较失效），源状态之间的一致性仍需手动维护。' }
  ]
};

window.VUE_DEEP[43] = {
  deep: `### script setup 编译成了什么

\`\`\`vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>
<template>{{ count }}</template>
\`\`\`

编译后大致是：

\`\`\`js
export default {
  setup() {
    const count = ref(0)
    return { count }              // 顶层绑定被自动收集并返回
  }
}
\`\`\`

也就是说「不用写 return」不是运行时的魔法，而是**编译器帮你生成了 return**。它收集的是「顶层声明」，所以：

- 写在函数内部、\`if\` 块内的变量不会被暴露；
- \`import\` 进来的组件与函数会被一并暴露（所以模板里能直接用）。

### 四个宏的编译产物

| 写法 | 编译成 |
| --- | --- |
| \`defineProps({...})\` | \`props: {...}\` 选项 |
| \`defineEmits([...])\` | \`emits: [...]\` 选项 |
| \`defineExpose({ a })\` | \`expose: ['a']\`（限制父组件可见） |
| \`defineOptions({ name })\` | 直接合并到组件选项 |

它们不需要 import，因为编译器在编译阶段就把它们「抹掉」了——如果写成 \`import { defineProps } from 'vue'\`，虽然不报错，但那个导入是多余的。

### 顶层 await 的代价

\`\`\`js
const res = await fetch('/api/me')
const user = await res.json()
\`\`\`

编译成 \`async setup()\`。异步 setup 的组件必须被 \`<Suspense>\` 包裹，否则 Vue 会警告，且渲染流程会变成「等待 → 完成」。副作用：

- 首屏会等待该组件就绪（或 fallback）；
- 出错时要靠 \`onErrorCaptured\` 或 Suspense 的错误处理；
- 不适合放在公共布局组件里，容易把整页变成异步。

### 组件名是怎么来的

\`script setup\` 组件默认用**文件名**推断 name（\`UserCard.vue\` → \`UserCard\`）。影响两处：

1. \`<KeepAlive include="UserCard">\` 的匹配；
2. Devtools 里的显示名。

文件名与业务名不一致时（\`index.vue\`），显式写 \`defineOptions({ name: 'UserCard' })\`。

### 与普通 script 混用的场景

\`\`\`vue
<script>
export default { inheritAttrs: false }
</script>
<script setup>
// 主体逻辑
</script>
\`\`\`

两个块会被合并。需要「选项式才有的能力」时（如 \`inheritAttrs\`、\`name\`），要么用这个组合，要么用 \`defineOptions\`。注意两个块的 \`import\` 是各自独立的。

### 动手验证（3 分钟）

把下面这段放进 [Vue SFC Playground](https://play.vuejs.org) 的 \`Comp.vue\`，点右上角「输出」看 JS：

\`\`\`vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
function inc() { count.value++ }
</script>
<template><button @click="inc">{{ count }}</button></template>
\`\`\`

> 💡 你会看到输出里有 \`return { count, inc }\`（或等价的 \`__returned__\` 对象）——这就是「自动暴露」的真身。再试着把 \`count\` 声明在 \`if (true) { ... }\` 块里，模板就访问不到了。`,
  quiz: [
    { q: 'script setup 里「顶层变量自动可用于模板」是运行时行为吗？', a: '不是。编译器收集顶层绑定并自动生成 return（等价于 setup 返回这些绑定），所以只有顶层声明才会被暴露。' },
    { q: 'defineProps / defineEmits 为什么不需要 import？', a: '它们是编译器宏，在编译阶段被直接转换成组件的 props / emits 选项并被抹除，运行时不存在的函数，import 也无效。' },
    { q: '顶层 await 会带来什么渲染影响？', a: '组件变成 async setup，必须由 Suspense 包裹；首屏会等待其就绪或显示 fallback，错误处理也变得更复杂。' }
  ]
};
