/* 第 9 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[50] = {
  deep: `### Vuex 的 store 就是一个响应式对象 + 一套约定

\`\`\`js
const store = createStore({ state: { count: 0 } })
\`\`\`

Vuex 4 内部用 \`reactive()\` 包装 state，所以 \`store.state.count\` 在组件里读的时候会自动收集依赖——和你自己写 \`reactive({})\` 没有本质区别。

区别在「约定」：

| 约定 | 目的 |
| --- | --- |
| 只能通过 \`commit\` 改 state | 让每次变更都有名字、可被记录 |
| mutation 必须同步 | 保证 Devtools 能在变更瞬间拍快照 |
| 异步逻辑放 action | 让「何时改」与「怎么改」分离 |

### 为什么 mutation 必须同步（从 Devtools 角度）

Devtools 的「时间旅行」依赖一件事：每执行完一个 mutation，立刻记录当前 state 的快照。如果 mutation 里有 \`await\`：

\`\`\`js
async MUTATE(state) {
  state.a = 1
  await sleep(100)
  state.b = 2       // 这一步发生在快照之后
}
\`\`\`

那么快照里 \`a=1, b=旧值\`，而实际运行时 \`b\` 已被改成 2。回放时状态对不上，时间旅行就坏了。所以 Vuex 直接禁止（开发环境警告）。

### 严格模式：能开，但别在生产开

\`\`\`js
createStore({ strict: true })
\`\`\`

它用 \`deep watch\` 监听 state，任何不经过 mutation 的修改都会抛错。代价是**每次变更都做一次深度比对**，大 state 下开销明显。所以：

\`\`\`js
createStore({ strict: import.meta.env.DEV })
\`\`\`

### 为什么组件里要读 computed 而不是直接读 state

\`\`\`js
// ❌ data 只取一次快照
data() { return { count: this.$store.state.count } }

// ✅ computed 保持响应
computed: { count() { return this.$store.state.count } }
\`\`\`

这一点和「解构丢响应式」是同一个原理：取值一次 = 快照。

### 动手验证（3 分钟）

\`\`\`js
import { createStore } from 'vuex'
const store = createStore({
  state: { n: 0 },
  mutations: { ADD(s, v) { s.n += v } },
  strict: true
})

store.state.n = 100            // 控制台抛错：do not mutate vuex store state outside mutation handlers
store.commit('ADD', 1)         // 正常
console.log(store.state.n)     // 1
\`\`\`

> 💡 第一行直接赋值会**报错**（不是警告），因为 strict 模式下 Vuex 用深度 watcher 检测到了非法修改。把 strict 去掉，这行就会静默生效——这正是「约定靠工具检查」的意义。`,
  quiz: [
    { q: 'Vuex 为什么要求 mutation 必须同步？', a: '为了 Devtools 能在每次变更后立即拍快照、支持时间旅行。异步 mutation 会导致快照与实际状态不一致，回放失效。' },
    { q: 'strict 模式为什么不适合生产环境？', a: '它用 deep watch 监听 state，每次变更都做深度比对，state 大时开销明显。通常只在开发环境开启。' },
    { q: '组件里读 store.state 为什么必须放在 computed 里？', a: 'data 只取一次值形成快照；computed 每次读取都会重新访问 state，保持响应式跟随。' }
  ]
};

window.VUE_DEEP[51] = {
  deep: `### action 的 context 里有五个东西

\`\`\`js
actions: {
  async load({ commit, dispatch, state, getters, rootState }, payload) {}
}
\`\`\`

| 成员 | 用途 |
| --- | --- |
| \`commit\` | 提交本模块（或全局）mutation |
| \`dispatch\` | 调用其他 action（可跨模块，加 \`{ root: true }\`） |
| \`state\` | 本模块 state |
| \`getters\` | 本模块 getter |
| \`rootState\` / \`rootGetters\` | 全局 state / getter |

注意 \`state\` 是**实时引用**（不是快照），所以 \`state.list\` 永远是最新值——但这也意味着你不能靠它「拿到调用前的值」。

### action 返回 Promise，可以串起来

\`\`\`js
async submit({ dispatch }) {
  await dispatch('validate')
  await dispatch('save')
  return { ok: true }
}
\`\`\`

组件里 \`await store.dispatch('submit')\` 能拿到返回值。这是 Vuex 里做「多步流程」的标准方式：**每一步都是一个 action，编排在 action 里，而不是组件里**。

### getter 本质是 computed

\`\`\`js
getters: {
  done(state) { return state.todos.filter(t => t.done) }
}
\`\`\`

Vuex 内部把 getters 定义成 \`computed\`，所以：

- 依赖不变时读缓存；
- 依赖变了才重算；
- getter 之间可以互相当依赖（第二个参数是 getters）。

### 返回函数的 getter 会失去缓存

\`\`\`js
getTodoById: (state) => (id) => state.todos.find(t => t.id === id)
\`\`\`

外层 getter 返回一个函数，内层函数每次调用都重新查找。所以它「可以用参数」，但「没有缓存」。适合「按 id 取一条」这种低频操作，不适合在模板里对每行都调用（N 次 N 次遍历 = O(n²)）。

替代方案：先用 getter 建 Map：

\`\`\`js
todoMap(state) { return new Map(state.todos.map(t => [t.id, t])) }
\`\`\`

模板里 \`todoMap.get(id)\`，查找 O(1)，且 Map 本身有缓存。

### 动手验证（3 分钟）

\`\`\`js
const store = createStore({
  state: { list: [1, 2, 3] },
  getters: {
    doubled(state) { console.log('getter 执行'); return state.list.map(n => n * 2) },
    doubleOf: (state) => (n) => { console.log('函数 getter 执行'); return n * 2 }
  }
})
// 在组件模板里连续写两次 {{ doubled }}，控制台只打印一次
// 连续写两次 {{ doubleOf(3) }}，打印两次
\`\`\`

> 💡 这个对比就是「getter 有缓存、函数 getter 没有」的实证。也解释了为什么「按 id 查询的 getter 不要放在大列表的每一行里」。`,
  quiz: [
    { q: 'action 的 context 里 state 是快照还是实时引用？', a: '是实时引用（响应式对象本身），所以读到的永远是最新值；也因此拿不到「调用前的旧值」。' },
    { q: '返回函数的 getter 为什么没有缓存？', a: '外层 getter 返回的是一个新函数，内层函数每次调用都重新执行查找；缓存只作用于外层 getter 的返回值。' },
    { q: '多步业务流程（校验 → 保存 → 跳转）应该写在哪？为什么？', a: '写在 action 里，用 await dispatch 串起来，返回结果给组件。这样流程可复用、可测试，组件只负责触发与展示。' }
  ]
};

window.VUE_DEEP[52] = {
  deep: `### mapState 生成的就是 computed

\`\`\`js
computed: {
  ...mapState(['count', 'user'])
}
\`\`\`

展开后每个键都是一个函数：

\`\`\`js
count() { return this.$store.state.count }
\`\`\`

所以它天然保持响应式。而 \`mapMutations\` / \`mapActions\` 生成的是方法：

\`\`\`js
add(payload) { return this.$store.commit('add', payload) }
\`\`\`

理解这一点，就不会把它们放错位置（比如把 mapState 放进 methods，结果拿到的是函数而不是值）。

### module 注册时的三件事

\`\`\`js
createStore({ modules: { cart, user } })
\`\`\`

1. **state 必须是函数**：\`state: () => ({...})\`，避免多实例共享（SSR 时尤其致命）。
2. **mutation / action / getter 默认注册到全局**：所以两个模块有同名 mutation 会**同时执行**。
3. **namespaced: true** 后，调用变成 \`'cart/ADD'\` 字符串拼接。

### namespaced 的实现就是拼字符串

\`\`\`js
// 内部大致如此
const type = namespace ? namespace + '/' + key : key
\`\`\`

所以：

- \`commit('cart/ADD')\` 里的 \`cart/\` 不是语法，是**字符串前缀**；
- 拼错（\`'cart/add'\` 大小写不符）不会有编译错误，只会在运行时警告「unknown mutation type」；
- 用常量文件统一导出 type，可以避免手写字符串。

\`\`\`js
// types.js
export const CART_ADD = 'cart/ADD'
\`\`\`

### rootState 的使用边界

\`\`\`js
actions: {
  checkout({ state, rootState, dispatch }) {
    if (!rootState.user.token) return
    dispatch('clear', null, { root: true })
  }
}
\`\`\`

跨模块访问越多，说明模块划分越不合理。一个判断标准：**如果 A 模块频繁需要 B 模块的数据，它俩可能该合成一个模块，或者那份数据该提到根 state**。

### 拆分粒度的实用建议

| 规模 | 方案 |
| --- | --- |
| < 50 行 state | 单文件 store，不要拆 |
| 按业务 3+ 块 | 一模块一文件，全开 namespaced |
| 模块间大量互访 | 重新划分边界，或考虑 Pinia（天然分模块） |

### 动手验证（3 分钟）

\`\`\`js
const a = { namespaced: false, mutations: { ADD(s) { console.log('a 的 ADD') } } }
const b = { namespaced: false, mutations: { ADD(s) { console.log('b 的 ADD') } } }
const store = createStore({ modules: { a, b } })
store.commit('ADD')
// 控制台打印两行！
\`\`\`

> 💡 同名的未命名空间 mutation 会被**两个模块同时处理**——这是最难查的一类 bug（改了 A 模块的数据，B 模块也变了）。开启 namespaced 后，\`commit('ADD')\` 会变成「找不到该 mutation」的警告，反而安全。`,
  quiz: [
    { q: 'mapState 生成的到底是什么？为什么必须放在 computed 里？', a: '生成的是返回 store.state 某字段的函数，等价于手写 computed；放 methods 里就变成「调用才取值」，模板里拿到的是函数而不是值。' },
    { q: '两个 module 都有未加命名空间的同名 mutation 会怎样？', a: '它们都注册在全局，commit 该名字时两个都会执行，导致意外的跨模块修改。应开启 namespaced 隔离。' },
    { q: 'namespaced 的 "cart/ADD" 是语法还是字符串？拼错会怎样？', a: '是字符串前缀拼接。拼错不会有编译错误，只在运行时警告 unknown mutation type，难以察觉，建议用常量统一管理。' }
  ]
};

window.VUE_DEEP[53] = {
  deep: `### useStore 与解构的两个坑

\`\`\`js
const store = useStore()
const { state } = store        // ❌ 丢失响应式
const { count } = toRefs(store.state)   // ✅
\`\`\`

第一行解构拿到的是 state 对象的引用（响应式还在），但 \`const { count } = store.state\` 就不行了——那是取值快照。所以正确姿势是「不解构 state 的字段」或「用 toRefs/toRefs 包装」。

方法可以直接解构：\`const { commit, dispatch } = store\`，它们是普通函数。

### 持久化插件的两个钩子

\`\`\`js
function persist(store) {
  // 1. 启动时恢复
  const saved = localStorage.getItem('vuex')
  if (saved) store.replaceState(merge(store.state, JSON.parse(saved)))

  // 2. 每次 mutation 后写入
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex', JSON.stringify(pick(state, ['user', 'cart'])))
  })
}
\`\`\`

\`store.subscribe\` 的回调在**每个 mutation 之后**同步执行，参数是 \`{ type, payload }\` 与最新 state。适合持久化，也适合埋点（记录用户操作序列）。

### 为什么不建议全量持久化

| 问题 | 说明 |
| --- | --- |
| 体积 | 列表数据动辄几百 KB，localStorage 上限约 5MB |
| 性能 | 同步写入，频繁 mutation 会阻塞主线程 |
| 陈旧 | 用户看到三天前的数据，还以为是最新 |
| 安全 | token、手机号等敏感信息明文存储 |

所以用白名单（\`paths\`）+ 版本号：

\`\`\`js
{ key: 'app', version: 1, paths: ['user.token', 'cart.items'] }
\`\`\`

版本号变化时清空旧数据，避免「结构升级后读到旧格式导致白屏」。

### 组合式里的持久化写法

\`\`\`js
export default {
  setup() {
    const store = useStore()
    const count = computed(() => store.state.count)
    const add = () => store.commit('ADD', 1)

    onMounted(() => {          // 恢复
      const saved = localStorage.getItem('count')
      if (saved) store.commit('SET_COUNT', Number(saved))
    })
    watch(count, (v) => localStorage.setItem('count', String(v)))   // 写入

    return { count, add }
  }
}
\`\`\`

比插件更直白，适合只有一两个字段要存的场景。字段多了再上插件。

### 动手验证（3 分钟）

\`\`\`js
// 在任意 Vuex 项目控制台
localStorage.setItem('vuex-debug', JSON.stringify(store.state))
location.reload()
// 刷新后执行：
JSON.parse(localStorage.getItem('vuex-debug'))
\`\`\`

> 💡 对比刷新前后的 state：没持久化的话，刷新后 \`count\` 回到 0；有持久化则保持。这个「刷新即失忆」的体感，正是为什么登录态、购物车必须持久化。`,
  quiz: [
    { q: 'store.subscribe 的回调在什么时候执行？适合做什么？', a: '在每个 mutation 执行后同步触发，参数是 {type, payload} 与最新 state。适合持久化、操作埋点、日志记录。' },
    { q: '为什么持久化要用白名单而不是全量存储？', a: '全量会把列表等大体积数据写入（超 5MB、同步阻塞）、把临时状态与敏感信息一起存下，还会让用户看到陈旧数据。白名单 + 版本号更可控。' },
    { q: 'useStore() 之后直接解构 { state } 与解构 store.state.count 有什么区别？', a: '解构 store 拿到的 state 仍是响应式对象引用；解构 store.state 的字段则是取值快照，会丢响应式（需 toRefs）。' }
  ]
};

window.VUE_DEEP[54] = {
  deep: `### Pinia 的 store 是一个 reactive 对象

\`\`\`js
const store = useCartStore()
store.items.push(x)      // 直接改，没有 mutation
\`\`\`

createPinia 之后，store 本质是 \`reactive({ ...state, ...getters, ...actions })\` 的包装：

- state 是 reactive 数据；
- getters 被转成 computed；
- actions 是普通函数，但 \`this\` 被绑定到 store。

所以 \`this.items\` 能直接改、能触发更新——因为它就是那个响应式对象上的属性。

### 没有 mutation，为什么还能追踪变更

Pinia 通过 \`$subscribe\` 监听整个 store 的变更（基于 Vue 的 watch），Devtools 也能记录每次修改的来源。区别只是**不再要求你写一个具名 mutation**：

| | Vuex | Pinia |
| --- | --- | --- |
| 变更记录 | 每个 mutation 一个名字 | 按 action / 直接赋值记录 |
| 时间旅行 | 支持 | 支持 |
| 约束 | 强制走 mutation | 靠团队约定「只调 action」 |

约束的削弱换来的是代码量下降。团队里补一条约定即可：**组件里只调 action，不直接改 state**。

### $patch 与 $reset

\`\`\`js
store.$patch({ count: 1, name: 'x' })            // 批量改，只触发一次更新
store.$patch((state) => { state.list.push(1) })  // 函数式，适合数组
store.$reset()                                    // 回到初始 state（option store 才有）
\`\`\`

\`$patch\` 的价值在「批量」：连续改 5 个字段，直接赋值会触发 5 次更新，\`$patch\` 合并成一次。

注意 \`$reset\` 只对 option store 有效；setup store 需要自己实现（把初始值存一份，重置时赋回去）。

### storeToRefs 的必要性

\`\`\`js
const { items, total } = storeToRefs(store)   // state + getter → ref
const { add } = store                        // 方法直接解构
\`\`\`

它与 \`toRefs\` 的区别是**只处理 state 与 getter**，跳过 action（action 本来就是函数，不需要包装）。这也是「解构丢响应式」在 Pinia 里的标准解法。

### 一个常见误用：在 store 里用路由/DOM

\`\`\`js
// ❌ store 里跳转
actions: { async login() { await api.login(); router.push('/') } }
\`\`\`

store 依赖了路由实例，导致：单测要 mock 路由、SSR 时路由上下文不对、复用困难。正确做法是 action 只返回结果，由组件负责跳转：

\`\`\`js
await store.login()
router.push('/')
\`\`\`

### 动手验证（3 分钟）

\`\`\`js
const useCounter = defineStore('c', {
  state: () => ({ n: 0, list: [] }),
  getters: { double: (s) => s.n * 2 },
  actions: { inc() { this.n++ } }
})

const a = useCounter()
const b = useCounter()
a.inc()
console.log(a.n, b.n, a === b)     // 1 1 true
\`\`\`

> 💡 两个变量指向**同一个 store 实例**（不像 ref 那样每次新建）。这就是为什么 Pinia 的 store 天然是「全局单例」，也是为什么它在 SSR 里需要「每个请求一份 pinia 实例」——否则会串数据。`,
  quiz: [
    { q: 'Pinia 没有 mutation，为什么仍能记录状态变更？', a: 'store 本身是 reactive 对象，Pinia 通过 $subscribe（内部基于 watch）监听整个 store 的变化，Devtools 也能记录；约束从「强制 mutation」变成团队约定。' },
    { q: '$patch 相比连续赋值的好处是什么？', a: '批量修改合并为一次更新通知，避免连续赋值触发多次重渲染；函数式写法还能安全地操作数组。' },
    { q: '为什么 store 里不应直接调用 router 跳转？', a: '会让 store 依赖路由实例，单测需要 mock、SSR 上下文易出错、复用性下降。应让 action 返回结果，由组件负责导航。' }
  ]
};

window.VUE_DEEP[55] = {
  deep: `### setup store 的返回值被包成了什么

\`\`\`js
defineStore('cart', () => {
  const items = ref([])
  const total = computed(() => items.value.length)
  function add() { items.value.push(1) }
  return { items, total, add }
})
\`\`\`

Pinia 拿到返回值后：

- \`items\`（ref）→ 转成 store 上的响应式属性，访问时自动解包（\`store.items\` 直接是数组）；
- \`total\`（computed）→ 保留为 getter；
- \`add\`（函数）→ 变成 action，\`this\` 绑定到 store。

所以 setup store 与 option store 在运行时是**同一种东西**，只是写法不同。这也解释了为什么两者可以互相引用。

### 解构后类型与响应式一起丢

\`\`\`js
const { items } = store            // ❌ 拿到的是当时的数组引用，push 后不更新视图
const { items } = storeToRefs(store)  // ✅
\`\`\`

注意第一行拿到的是数组引用，\`items.push()\` 会改动数据（因为数组是同一个），但**视图不会更新**——因为这个变量与 store 的响应式连接断了。这种「数据变了但页面不动」最难查，因为打印出来是对的。

### 为什么 setup store 更受 TS 项目欢迎

| 维度 | option store | setup store |
| --- | --- | --- |
| 类型来源 | state 返回值 + 手动断言 | 完全来自实现 |
| 复用逻辑 | 只能靠 getter/action | 可直接调用组合式函数 |
| 与组件一致 | 否（this 风格） | 是（ref 风格） |
| 空数组 | 需要 \`as Item[]\` | \`ref<Item[]>([])\` 一样要写 |

关键在第 2 行：setup store 里可以直接 \`const { data, loading } = useRequest(api)\`，把请求逻辑复用进来；option store 里做不到（不能用组合式函数）。

### $reset 的缺失与补法

\`\`\`js
defineStore('cart', () => {
  const initial = { items: [], total: 0 }
  const items = ref(initial.items)
  function reset() { items.value = [] }
  return { items, reset }
})
\`\`\`

自己实现一个 \`reset\` action 即可。省略它会让「退出登录要清空状态」这类需求变得别扭。

### 插件：给所有 store 加统一能力

\`\`\`js
pinia.use(({ store }) => {
  store.$log = () => console.log(store.$id, store.$state)
})
\`\`\`

插件常用于：持久化、统一埋点、注入当前用户。注意插件里不能直接解构 state（会丢响应式）。

### 动手验证（3 分钟）

\`\`\`js
const useA = defineStore('a', () => {
  const n = ref(0)
  const inc = () => n.value++
  return { n, inc }
})
const s = useA()
const { n } = s
s.inc()
console.log('解构出的 n:', n, '实际 store.n:', s.n)   // 0 1
\`\`\`

> 💡 解构出的 \`n\` 是 \`ref(0)\` 的**值**（setup store 的属性访问会自动解包），所以永远是 0；而 \`s.n\` 是 1。用 \`storeToRefs\` 才能拿到跟随的 ref。`,
  quiz: [
    { q: 'setup store 返回的 ref / computed / 函数，在 store 上分别变成什么？', a: 'ref → 响应式 state 属性（访问自动解包）；computed → getter；普通函数 → action（this 绑定到 store）。' },
    { q: '直接解构 setup store 的 state 会出现什么现象？', a: '拿到的是解包后的值（快照），后续改动不会反映；数据本身可能被改（数组引用），但视图不更新，最难排查。应使用 storeToRefs。' },
    { q: 'setup store 相比 option store 的最大优势是什么？', a: '可以直接复用组合式函数（如 useRequest），逻辑可组合、类型自然推导；option store 只能靠 getter/action，无法调用组合式 API。' }
  ]
};
