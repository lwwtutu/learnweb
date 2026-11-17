/* 第 9 篇 · 状态管理 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p9',
  order: 9,
  title: '状态管理',
  range: '089–101',
  desc: 'Vuex 的五个概念与 Pinia 的三种写法，以及跨组件状态该放在哪里',
  chapters: [
    {
      no: 50,
      title: 'Vuex：为什么要一个中心仓库',
      lessons: '089–090',
      summary: 'Vuex 把共享状态集中到 store，用 mutation 保证「改状态」有唯一入口、可被追踪。',
      points: [
        '状态提升到 store，任何组件都能读，不必层层传 props',
        'mutation 是唯一修改状态的方式，且必须同步',
        '通过 commit 提交 mutation，Devtools 可记录每次变更',
        '组件里用 computed 读 state，不要直接绑到模板表达式里做计算'
      ],
      body: `### 问题从哪来

兄弟组件共享数据、跨页面保留筛选条件、登录信息到处要用——这些场景用 props 会变成「层层中转」。把状态提到一个公共对象里，谁需要谁来取，是更自然的解法。

\`\`\`js
// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    count: 0,
    user: null
  },
  mutations: {
    ADD(state, payload) {
      state.count += payload || 1
    }
  },
  actions: {
    addAsync({ commit }, payload) {
      setTimeout(() => commit('ADD', payload), 500)
    }
  },
  getters: {
    doubleCount(state) {
      return state.count * 2
    }
  }
})
\`\`\`

\`\`\`js
// main.js
import store from './store'
createApp(App).use(store).mount('#app')
\`\`\`

### mutation：唯一的状态修改入口

\`\`\`js
// 组件里
this.$store.commit('ADD', 2)
\`\`\`

为什么不让组件直接 \`store.state.count++\`？三个理由：

1. **可追踪**：Devtools 记录每次 mutation 的名字与载荷，能回放、能时间旅行。
2. **可控**：所有修改集中在一处，加日志、加校验只改一次。
3. **可预测**：不允许异步，状态变化与调用同步发生，因果关系清晰。

| 维度 | 直接改 state | 通过 mutation |
| --- | --- | --- |
| Devtools 记录 | 无 | 有 |
| 异步 | 任意 | 禁止 |
| 多人协作 | 改法各不同 | 统一入口 |

> ⚠️ mutation 必须是**同步函数**。放 \`setTimeout\` 或 \`await\` 之后，Devtools 就无法确定状态是在哪一刻变的，时间旅行会错乱。异步逻辑放 action。

### 组件里怎么读

\`\`\`js
export default {
  computed: {
    count() { return this.$store.state.count },
    doubleCount() { return this.$store.getters.doubleCount }
  }
}
\`\`\`

用 \`computed\` 而不是 \`data\`，因为 \`data\` 只取一次快照。也不要在模板里写 \`$store.state.count * 2\` 这种运算，派生值应交给 getter。

### Vuex 的五个概念

| 概念 | 作用 | 是否同步 |
| --- | --- | --- |
| \`state\` | 状态数据 | — |
| \`getters\` | 派生状态（带缓存） | — |
| \`mutations\` | 修改状态的唯一方式 | 必须同步 |
| \`actions\` | 业务逻辑，可异步，提交 mutation | 可以异步 |
| \`modules\` | 拆分大 store | — |

这五个概念在 Pinia 里被压缩成三个（state / getter / action），这是后者更受欢迎的原因之一（第 9.5 章）。

### 什么时候不该用

状态管理不是越大越好。以下场景直接用组件内状态或 provide/inject：

- 只有一个组件用：放组件里。
- 父子两层：props / emit。
- 一个页面内的多个组件：provide/inject 或页面级 store。

判断标准：**这份数据是否跨页面、跨路由、被多方同时读**。是才进 store。`
    },
    {
      no: 51,
      title: 'action 与 getter',
      lessons: '091–092',
      summary: 'action 承载异步与业务编排，getter 承载派生状态；两者都不直接改数据（action 通过 commit）。',
      points: [
        'action 可以异步，最终仍要 commit mutation',
        'getter 类似 computed，按依赖缓存',
        'getter 可以返回函数，实现「传参查询」',
        '组件里 dispatch 派发 action，不要直接 commit 复杂逻辑'
      ],
      body: `### action：编排而不是修改

\`\`\`js
actions: {
  async fetchUser({ commit, state }, id) {
    if (state.user && state.user.id === id) return state.user   // 命中缓存

    const res = await api.getUser(id)
    commit('SET_USER', res.data)                                // 真正改状态
    return res.data
  }
}
\`\`\`

action 收到的第一个参数是 \`context\`，常用的是 \`commit\`、\`dispatch\`、\`state\`、\`getters\`。写起来常常直接解构。

\`\`\`js
// 组件
await this.$store.dispatch('fetchUser', 1)
\`\`\`

**dispatch 返回 Promise**，因为 action 通常是 async 函数。所以可以 \`await\` 它来做后续动作（关闭 loading、跳转页面）。

### action 与 mutation 的分工

| | mutation | action |
| --- | --- | --- |
| 能否异步 | 否 | 是 |
| 能否改 state | 是 | 否（只能 commit） |
| 谁调用 | 组件 / action | 组件 |
| 职责 | 单一赋值 | 请求、校验、多步提交 |

一个实用判断：**如果这段逻辑只有一行赋值，写在 mutation 里；如果有多步或异步，写在 action 里。**

### getter：带缓存的派生状态

\`\`\`js
getters: {
  doneTodos(state) {
    return state.todos.filter((t) => t.done)
  },
  doneCount(state, getters) {
    return getters.doneTodos.length        // 可以复用其他 getter
  },
  getTodoById: (state) => (id) => {
    return state.todos.find((t) => t.id === id)   // 返回函数，支持传参
  }
}
\`\`\`

返回函数的写法会**失去缓存**（每次调用都重新执行），但换来「传参查询」的能力，适合按 id 取单条。

### mapGetters 与 mapActions

\`\`\`js
import { mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapGetters(['doneTodos', 'doneCount'])
  },
  methods: {
    ...mapActions(['fetchUser'])
  }
}
\`\`\`

用辅助函数能省样板，但也会让「数据从哪来」变得不明显。团队里常见约定是：**state / getter 用辅助函数，action 显式 dispatch**，因为 action 往往需要处理返回值与错误。

### 三个实践建议

1. **action 里不要 try/catch 后静默**：错误要么抛出给调用方，要么统一在拦截器里提示。
2. **getter 不要有副作用**：与 computed 同一条规则。
3. **不要在 action 里读 DOM**：store 是数据层，涉及 UI 的动作交给组件。

> 💡 需要「等待某个 action 完成再继续」时，用 \`await dispatch(...)\` 而不是监听 state 变化——后者容易漏掉中间态。`
    },
    {
      no: 52,
      title: '辅助函数与 module 拆分',
      lessons: '093–094',
      summary: '辅助函数减少样板；module 把大 store 按业务切开，namespaced 避免命名冲突。',
      points: [
        'mapState / mapGetters 映射到 computed，mapMutations / mapActions 映射到 methods',
        'module 的 state 是局部的，mutation / action 默认全局注册',
        'namespaced: true 后调用要带模块前缀',
        'rootState / rootGetters 可访问全局状态'
      ],
      body: `### 四个辅助函数

\`\`\`js
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  computed: {
    // 数组写法：名字必须与 state 一致
    ...mapState(['count', 'user']),
    // 对象写法：可以重命名
    ...mapState({ userCount: (state) => state.count }),
    ...mapGetters(['doubleCount'])
  },
  methods: {
    ...mapMutations(['ADD']),
    ...mapActions(['fetchUser'])
  }
}
\`\`\`

映射后，模板里直接 \`{{ count }}\`、\`@click="ADD(1)"\`。代价是「看不出来源」，新人读代码时要反查 store。

### module：按业务拆分

\`\`\`js
// store/modules/cart.js
export default {
  namespaced: true,
  state: () => ({ items: [] }),
  mutations: {
    ADD_ITEM(state, item) { state.items.push(item) }
  },
  getters: {
    total: (state) => state.items.reduce((s, i) => s + i.price * i.count, 0)
  },
  actions: {
    addAsync({ commit }, item) { commit('ADD_ITEM', item) }
  }
}
\`\`\`

\`\`\`js
// store/index.js
import cart from './modules/cart'

export default createStore({
  modules: { cart }
})
\`\`\`

**关键点：module 的 state 必须是函数**，与组件 data 同理，避免多个 store 实例共享引用（服务端渲染时尤其重要）。

### namespaced 前后的调用差异

| 操作 | 未开启 namespaced | 开启后 |
| --- | --- | --- |
| commit | \`commit('ADD_ITEM')\` | \`commit('cart/ADD_ITEM')\` |
| dispatch | \`dispatch('addAsync')\` | \`dispatch('cart/addAsync')\` |
| 读 state | \`state.cart.items\` | 同 |
| 读 getter | \`getters.total\` | \`getters['cart/total']\` |

不开 namespaced 时，所有 module 的 mutation 都注册在全局，两个模块出现同名 mutation 会**同时被触发**——这是很难查的 bug。所以只要拆分，就开启 namespaced。

### 跨模块访问

\`\`\`js
actions: {
  checkout({ commit, rootState, rootGetters, dispatch }) {
    if (!rootState.user) return
    dispatch('user/clearCartFlag', null, { root: true })
  }
}
\`\`\`

\`rootState\` / \`rootGetters\` 读全局；dispatch 时加 \`{ root: true }\` 才能调用其他模块的 action。

### 拆分的粒度

| 规模 | 建议 |
| --- | --- |
| 3 个状态以内 | 单文件 store |
| 按业务有 3+ 块 | 一模块一文件 |
| 模块超过 300 行 | 考虑拆成 Pinia（天然分模块） |

> 💡 拆分后 store 会变成「一个 index + N 个 module」，记得给每个 module 写清 state 的类型（TS 项目里用 \`Module<S, R>\` 或直接用 Pinia）。`
    },
    {
      no: 53,
      title: '组合式 API 与持久化',
      lessons: '095–096',
      summary: 'useStore 拿到 store 实例；持久化插件把选中的状态写进 localStorage，刷新不丢。',
      points: [
        'useStore() 必须在 setup 同步阶段调用',
        '解构 store 会丢响应式，用 computed 或 storeToRefs',
        '持久化思路：订阅 mutation 或配置插件，写入 storage',
        '只持久化必要字段，避免把临时状态一起存'
      ],
      body: `### 在 setup 里用 store

\`\`\`js
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  setup() {
    const store = useStore()

    const count = computed(() => store.state.count)
    const double = computed(() => store.getters.doubleCount)
    const add = () => store.commit('ADD', 1)

    return { count, double, add }
  }
}
\`\`\`

三个注意点：

1. \`useStore()\` 依赖当前组件实例，必须在 setup 同步执行阶段调用。
2. **不要直接解构 store**：\`const { state } = store\` 会失去响应式；要解构用 \`toRefs\` 或 \`computed\` 包一层。
3. \`store.state.count\` 在脚本里要写全，模板里可以简化（因为返回的是 ref）。

### 持久化：为什么需要

store 在内存里，刷新页面就重置。登录 token、购物车、主题偏好这些要留下来，就得写进 \`localStorage\`。

最直接的方案是插件：

\`\`\`js
// 简化版持久化插件
function persist({ store }) {
  const KEY = 'vuex-state'
  const saved = localStorage.getItem(KEY)
  if (saved) store.replaceState(Object.assign(store.state, JSON.parse(saved)))

  store.subscribe((mutation, state) => {
    localStorage.setItem(KEY, JSON.stringify(state))
  })
}

createStore({ /* ... */ plugins: [persist] })
\`\`\`

\`store.subscribe\` 在每次 mutation 后执行，正好是持久化的时机。但**默认全量存**会把临时状态（loading、弹窗开关）也写进去，所以生产项目一般用 \`vuex-persistedstate\` 并配置 paths：

\`\`\`js
createPersistedState({
  key: 'app',
  paths: ['user', 'cart.items']      // 只存这两块
})
\`\`\`

### 持久化的三个坑

| 坑 | 现象 | 解法 |
| --- | --- | --- |
| 全量存储 | storage 快速膨胀、存入敏感信息 | 用 \`paths\` 白名单 |
| 版本升级结构变了 | 读到旧结构，页面报错 | 存一个 \`version\`，不匹配就清空 |
| SSR 环境 | \`localStorage\` 未定义 | 判断 \`typeof window !== 'undefined'\` |

### 该不该持久化

\`\`\`text
必须：token、用户偏好、草稿、购物车
不必：列表数据、loading、弹窗状态、当前页码
危险：密码、明文手机号、完整用户资料
\`\`\`

列表数据持久化看似「秒开」，实际会遇到「用户看到的是三天前的数据」。这类数据更适合缓存 + 后台刷新。

> ⚠️ \`localStorage\` 同步写入会阻塞主线程。如果状态很大（几百 KB），每次 mutation 都写会明显卡顿，改成防抖或用 \`indexedDB\`。`
    },
    {
      no: 54,
      title: 'Pinia：更轻的状态管理',
      lessons: '097–100',
      summary: 'Pinia 去掉 mutation，action 直接改 state；一个 useXxxStore 就是一个模块。',
      points: [
        'createPinia 挂到 app，useXxxStore 获取实例',
        '三个概念：state、getter、action（无 mutation）',
        'action 可直接改 state，同步异步都行',
        'getter 用 computed 语义，可互相引用'
      ],
      body: `### 最小示例

\`\`\`js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, name: 'kerwin' }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment(payload = 1) {
      this.count += payload          // 直接改，不需要 mutation
    },
    async fetchCount() {
      const res = await api.getCount()
      this.count = res.data
    }
  }
})
\`\`\`

\`\`\`js
// main.js
import { createPinia } from 'pinia'
createApp(App).use(createPinia()).mount('#app')
\`\`\`

\`\`\`js
// 组件里
import { useCounterStore } from '@/stores/counter'
const store = useCounterStore()

store.count          // 读
store.double         // getter
store.increment(2)   // 调 action
\`\`\`

### 与 Vuex 的结构对比

| | Vuex | Pinia |
| --- | --- | --- |
| 修改状态 | \`commit('MUTATION')\` | 直接赋值 |
| 异步 | action + commit | action 内直接改 |
| 模块 | \`modules\` + namespaced | 一个 store 一个模块 |
| TypeScript | 需要额外类型体操 | 推导友好 |
| 代码量 | 多（五个概念） | 少（三个概念） |
| Devtools | 支持 | 支持（含时间旅行） |

去掉 mutation 不是「少了约束」，而是**承认 action 本身就是唯一入口**：只要团队约定「组件不直接改 state，统一调 action」，追踪能力并不丢失。

### getter 的两种写法

\`\`\`js
getters: {
  // 1. 依赖 state
  double: (state) => state.count * 2,

  // 2. 依赖其他 getter（必须标注 this 类型或用普通函数）
  quadruple() {
    return this.double * 2
  },

  // 3. 返回函数：支持传参（不缓存）
  byId: (state) => (id) => state.list.find((it) => it.id === id)
}
\`\`\`

### action 里的 this

\`\`\`js
actions: {
  async load() {
    this.loading = true
    try {
      this.list = await api.list()
    } finally {
      this.loading = false
    }
  }
}
\`\`\`

\`this\` 指向 store 实例，所以能直接读写 state、调用其他 action（\`this.otherAction()\`）。**不要用箭头函数定义 action**，否则拿不到 \`this\`。

### 什么时候选 Pinia

| 情况 | 建议 |
| --- | --- |
| 新项目 | Pinia |
| 老项目已用 Vuex 4 | 可以保留，迁移不急 |
| 需要 TS 友好 | Pinia |
| 团队熟悉 mutation 那套 | 都可，Pinia 的学习成本更低 |

> 💡 Pinia 的 store 是**惰性创建**的：第一次 \`useXxxStore()\` 时才实例化。所以不要在模块顶层直接调用，放在组件 setup 或函数里。`
    },
    {
      no: 55,
      title: 'setup store 与选型建议',
      lessons: '101',
      summary: 'setup store 用组合式写法定义 store，ref 就是 state，函数就是 action，写法与组件完全一致。',
      points: [
        'setup store：defineStore(id, () => { ... })',
        'ref / reactive 自动成为 state，函数成为 action',
        'computed 成为 getter',
        '返回的必须是全部要暴露的成员'
      ],
      body: `### 两种定义方式

\`\`\`js
// 方式一：option store（上一章）
defineStore('cart', {
  state: () => ({ items: [] }),
  getters: { total: (s) => s.items.length },
  actions: { add(item) { this.items.push(item) } }
})
\`\`\`

\`\`\`js
// 方式二：setup store
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // state
  const items = ref([])

  // getter
  const total = computed(() => items.value.reduce((s, i) => s + i.price * i.count, 0))

  // action
  function add(item) {
    items.value.push(item)
  }
  async function load() {
    items.value = await api.getCart()
  }

  return { items, total, add, load }
})
\`\`\`

对应关系非常直接：

| option store | setup store |
| --- | --- |
| \`state\` | \`ref\` / \`reactive\` |
| \`getters\` | \`computed\` |
| \`actions\` | 普通函数 |
| \`this.xxx\` | 直接引用变量 |

### 选哪个

| 维度 | option store | setup store |
| --- | --- | --- |
| 上手成本 | 低（结构固定） | 需要理解 ref |
| 与组件写法一致 | 否 | 是 |
| 逻辑复用 | 较弱 | 可直接抽组合式函数 |
| 调试可读性 | 结构清晰 | 依赖排版 |
| 适合 | 状态简单、团队新手多 | 逻辑复杂、要复用 |

一条实用建议：**store 里只有「数据 + 赋值」就用 option store；有请求、有流程编排、要抽函数就用 setup store。**

### 解构要小心

\`\`\`js
// ❌ 失去响应式
const { items, total } = useCartStore()

// ✅ 用 storeToRefs 保住响应式
import { storeToRefs } from 'pinia'
const store = useCartStore()
const { items, total } = storeToRefs(store)
const { add, load } = store          // 方法可以直接解构
\`\`\`

\`storeToRefs\` 只处理 state 与 getter，方法不需要它——这与 \`toRefs\` 的行为刻意做了区分。

### 一个状态放在哪的判断表

\`\`\`text
只有一个组件用             → 组件内 ref
父子两层                   → props / emit
一个页面内多个组件         → provide/inject 或页面级 store
跨页面、跨路由共享         → Pinia
需要持久化                 → Pinia + 插件
服务端数据缓存             → 请求库（如 Vue Query）或 Pinia
\`\`\`

> ⚠️ 不要在 store 里直接操作路由或 DOM，那会让 store 依赖运行环境，测试与 SSR 都会变麻烦。让组件负责「调 store + 做跳转」。`
    }
  ]
});
