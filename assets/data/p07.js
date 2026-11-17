/* 第 7 篇 · 组合式 API */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p7',
  order: 7,
  title: '组合式 API',
  range: '066–077',
  desc: '按功能而不是按选项组织代码：ref / reactive、侦听、生命周期与 script setup',
  chapters: [
    {
      no: 37,
      title: '为什么需要组合式 API',
      lessons: '066',
      summary: '选项式按「代码类型」分块，组合式按「业务功能」分块；页面一大，后者才可读。',
      points: [
        '选项式的痛点：一个功能被拆到 data / methods / computed / watch 四处',
        'mixin 复用有命名冲突与来源不明的问题',
        '组合式把同一功能的代码写在一起，且能抽成函数',
        '不是替代关系：两种写法可以在同一组件共存'
      ],
      body: `### 选项式的结构性问题

一个搜索页有三个功能：搜索、分页、收藏。用选项式写：

\`\`\`js
export default {
  data() {
    return { keyword: '', list: [], page: 1, total: 0, favorites: [] }
  },
  computed: {
    hasMore() { /* 分页相关 */ },
    favCount() { /* 收藏相关 */ }
  },
  watch: {
    keyword() { /* 搜索相关 */ },
    page() { /* 分页相关 */ }
  },
  methods: {
    search() {}, loadMore() {}, toggleFav() {}, reset() {}
  }
}
\`\`\`

想改「分页」，得在四个选项之间来回跳。**同一件事的代码被物理拆开了**，这是选项式的固有代价。

### 组合式怎么解决

\`\`\`js
export default {
  setup() {
    // 搜索
    const keyword = ref('')
    const list = ref([])
    watch(keyword, doSearch)

    // 分页
    const page = ref(1)
    const hasMore = computed(() => list.value.length < total.value)

    // 收藏
    const favorites = ref([])
    function toggleFav(id) { /* ... */ }

    return { keyword, list, page, hasMore, favorites, toggleFav }
  }
}
\`\`\`

同一功能相邻，改哪块只动一片区域。更进一步，可以把整套逻辑抽成函数：

\`\`\`js
// composables/usePagination.js
import { ref, computed } from 'vue'

export function usePagination(fetcher) {
  const page = ref(1)
  const list = ref([])
  const hasMore = computed(() => /* ... */)

  async function loadMore() {
    page.value++
    list.value.push(...(await fetcher(page.value)))
  }

  return { page, list, hasMore, loadMore }
}
\`\`\`

组件里 \`const { list, hasMore, loadMore } = usePagination(api)\`，跨组件复用，且**来源清晰**（不像 mixin 那样不知道属性从哪来）。

### mixin 的三个问题

| 问题 | mixin | 组合式函数 |
| --- | --- | --- |
| 属性来源 | 不知道来自哪个 mixin | 显式解构 |
| 命名冲突 | 静默覆盖 | 可重命名 |
| 逻辑关系 | 隐式（都混进 this） | 显式（函数调用、参数、返回值） |

### 组合式的心智负担

要诚实说清代价：组合式要求你理解**响应式引用**（\`ref\` 的 \`.value\`）、**作用域**（\`setup\` 里没有 \`this\`）、**生命周期注册时机**（必须在 setup 同步阶段调用）。这些在选项式里被框架隐藏了。

所以学习顺序建议仍是「先选项式跑通，再组合式重构」。本站前六篇用选项式讲原理，这一篇开始切换，你会明显感到「代码更集中，但需要更清楚 \`ref\` 是什么」。

### 两种写法可以共存

\`\`\`js
export default {
  data() { return { legacy: 1 } },       // 选项式
  setup() {
    const modern = ref(0)
    return { modern }                     // 组合式
  },
  mounted() { console.log(this.legacy, this.modern) }
}
\`\`\`

渐进迁移老项目时这点很重要：不必一次改完，一个组件一个组件地换。

> 💡 官方名称是 Composition API（组合式 API），早期叫 Vue Function API，社区讨论后改名——「组合」强调的是「组合逻辑」，不是「写函数」。`
    },
    {
      no: 38,
      title: 'reactive 与 ref：两个入口',
      lessons: '067–068',
      summary: 'reactive 代理对象，ref 包装任意值；模板里 ref 自动解包，脚本里必须写 .value。',
      points: [
        'reactive 只接受对象，传基础类型会警告',
        'ref 可包装任意类型，通过 .value 读写',
        '模板中 ref 自动解包，不用写 .value',
        '解构 reactive 会丢失响应式，ref 解构后仍是 ref'
      ],
      body: `### reactive：给对象套一层代理

\`\`\`vue
<script>
import { reactive } from 'vue'

export default {
  setup() {
    const countobj = reactive({ count: 0 })
    const add = () => { countobj.count++ }

    return { countobj, add }
  }
}
</script>

<template>
  <div>{{ countobj.count }} - <button @click="add">add</button></div>
</template>
\`\`\`

特点：**没有包装层**，读写就是 \`countobj.count\`。但它只对对象有效：

\`\`\`js
reactive(0)          // ⚠️ 警告：value cannot be made reactive
reactive('hello')    // ⚠️ 同上
\`\`\`

原因很直接：\`Proxy\` 只能代理对象，数字与字符串没法拦截。

### ref：给任意值套一个盒子

\`\`\`vue
<script>
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const add = () => { count.value++ }

    return { count, add }
  }
}
</script>

<template>
  <div>{{ count }} - <button @click="add">add</button></div>
</template>
\`\`\`

差别只有一处：脚本里要写 \`.value\`，模板里不写（Vue 会自动解包）。\`ref\` 能包装数字、字符串、布尔、数组、对象、甚至组件实例。

| | reactive | ref |
| --- | --- | --- |
| 接受类型 | 只能是对象 | 任意 |
| 访问方式 | 直接访问 | \`.value\`（模板中省略） |
| 整体替换 | 会丢响应式 | 安全 |
| 解构 | 丢响应式 | 保持响应式 |
| 适合 | 一组相关字段 | 单个值、需要替换的值 |

### ref 嵌套进 reactive

\`\`\`js
const count = ref(0)
const state = reactive({ count })

const add = () => {
  state.count++        // 与 count.value++ 等价，两者会同步
}
\`\`\`

reactive 对象里的 ref 会自动解包，所以 \`state.count\` 是数字而不是 ref。这条规则让「混用」不至于太难受。

### 为什么模板里不用 .value

模板编译时，Vue 知道哪些变量是 ref（来自 setup 的返回值），会自动加 \`.value\`。所以：

\`\`\`html
<!-- 正确 -->
<p>{{ count }}</p>
<button @click="count++">加一</button>

<!-- 错误：模板里写 .value 反而拿到 undefined -->
<p>{{ count.value }}</p>
\`\`\`

例外：\`ref\` 放在数组或 Map 里时不会自动解包，\`list[0].value\` 才有效。

### 怎么选

| 场景 | 选择 |
| --- | --- |
| 一个数字 / 字符串 / 布尔 | ref |
| 表单对象（多个字段） | reactive |
| 需要整体替换的数据（接口返回） | ref |
| 需要解构给模板 | ref 或 toRefs(reactive) |
| 组件实例 / DOM 引用 | ref（必须） |

一条经验：**默认用 ref，需要「一组字段整体管理」时用 reactive**。ref 的 \`.value\` 看着啰嗦，但换来的是「永远不会丢响应式」。

> ⚠️ 最常见的事故是 \`const { count } = reactive({ count: 0 })\`，解构出来的是普通数字，改了不触发更新。要么不解构，要么用 \`toRefs\`（下一章）。`
    },
    {
      no: 39,
      title: 'toRefs 与 toRef：解构不丢响应式',
      lessons: '069',
      summary: '解构 reactive 会拿到普通值；toRefs 把每个属性转成 ref，解构后仍然响应式。',
      points: [
        '直接解构 reactive 得到的是快照，不是引用',
        'toRefs 返回「属性名 → ref」的对象，可安全解构',
        'toRef 针对单个属性，且支持不存在的键',
        '模板里要的是「同名变量」，toRefs 正好满足'
      ],
      body: `### 问题复现

\`\`\`js
const state = reactive({ count: 1 })
const { count } = state        // count 是数字 1

count++                        // 只改了局部变量
console.log(state.count)       // 仍然是 1
\`\`\`

解构本质是「取值」，取到的是那一刻的值。reactive 的响应式挂在属性访问上，一旦取出来变成普通变量，拦截就断了。

\`setup\` 里想把状态交给模板，又希望保持代码整洁（不写 \`state.xxx\`），就会遇到这个问题。

### toRefs：批量转成 ref

\`\`\`js
import { reactive, toRefs } from 'vue'

export default {
  setup() {
    const state = reactive({ count: 1 })
    const add = () => { state.count++ }

    return {
      ...toRefs(state),     // 得到 { count: ref }
      add
    }
  }
}
\`\`\`

\`\`\`html
<template>
  <div>{{ count }} - <button @click="add">click</button></div>
</template>
\`\`\`

\`toRefs(state)\` 返回一个普通对象，每个键对应一个指向原属性的 ref。解构后 \`count\` 仍是 ref，与 \`state.count\` 双向同步。

### toRef：单个属性

\`\`\`js
const state = reactive({ count: 1 })
const count = toRef(state, 'count')   // 只取一个

count.value++                          // state.count 同步变成 2
\`\`\`

与 \`toRefs\` 的差别：

| | toRefs | toRef |
| --- | --- | --- |
| 范围 | 全部属性 | 指定一个 |
| 键不存在 | 不处理 | 可创建（默认值 undefined） |
| 用途 | 解构整个对象 | 只关心某个字段 |

### 一个实用场景：props

\`\`\`js
import { toRefs } from 'vue'

export default {
  props: ['user'],
  setup(props) {
    const { user } = toRefs(props)     // 保持响应式
    return { user }
  }
}
\`\`\`

直接 \`const { user } = props\` 会拿到当时的值，父组件后续更新不会反映；\`toRefs\` 则保持跟随。组合式 API 里对 props 做解构，几乎都必须加 \`toRefs\`（或者干脆不解构）。

### 三个概念的关系

\`\`\`text
reactive(obj)       → 返回代理对象，属性访问被拦截
toRef(obj, 'key')   → 返回 ref，.value 代理到 obj.key
toRefs(obj)         → 返回 { key: toRef(obj, 'key') }
\`\`\`

三者都**不复制数据**，只是换了个访问入口。这也是为什么它们不消耗额外内存，也不会出现「两份状态」。

> 💡 \`storeToRefs\` 是 Pinia 里的同名工具，作用完全一致：解构 store 时保住响应式（第 9 篇）。`
    },
    {
      no: 40,
      title: 'computed、watch 与 watchEffect',
      lessons: '070–073',
      summary: 'computed 产出值并缓存，watch 精准侦听并给新旧值，watchEffect 自动收集依赖且立即执行。',
      points: [
        'computed 返回 ref，脚本里用 .value 读',
        'watch 第一个参数可以是 ref、reactive、getter 或数组',
        'watchEffect 立即执行一次，自动追踪内部依赖',
        'watchEffect 拿不到旧值，需要旧值时用 watch'
      ],
      body: `### computed

\`\`\`js
import { ref, computed } from 'vue'

const mytext = ref('')
const computedSum = computed(() => {
  return mytext.value.substring(0, 1).toUpperCase() + mytext.value.substring(1)
})
\`\`\`

返回的是一个 **ref**，所以脚本里要 \`computedSum.value\`，模板里直接 \`{{ computedSum }}\`。缓存规则与选项式一致：依赖不变就不重算。

### watch 的四种侦听源

\`\`\`js
const count = ref(0)
const state = reactive({ count: 0 })

// 1. ref
watch(count, (val, oldVal) => console.log(val, oldVal))

// 2. 返回值的 getter（用于 reactive 的某个属性）
watch(() => state.count, (val) => console.log(val))

// 3. reactive 对象本身：自动深度侦听
watch(state, (val) => console.log(val))

// 4. 数组：同时侦听多个源
watch([count, () => state.count], ([a, b]) => console.log(a, b))
\`\`\`

注意第 2 种：**直接写 \`state.count\` 会立即求值成数字**，失去侦听能力，必须包成箭头函数。

### 配置项

\`\`\`js
watch(source, (newVal, oldVal) => {}, {
  immediate: true,      // 立即执行一次
  deep: true,           // 深度侦听
  flush: 'post'         // DOM 更新后执行（默认 pre）
})
\`\`\`

### watchEffect：自动收集依赖

\`\`\`js
const todoId = ref(1)
const data = ref(null)

watchEffect(async () => {
  const res = await fetch('/api/todos/' + todoId.value)
  data.value = await res.json()
})
\`\`\`

不需要声明侦听谁，函数里用到了 \`todoId.value\`，就会追踪它。**立即执行一次**，所以不用写 \`immediate\`。

对比：

| | watch | watchEffect |
| --- | --- | --- |
| 是否立即执行 | 默认否 | 是 |
| 依赖声明 | 显式 | 自动 |
| 能否拿到旧值 | 能 | 不能 |
| 适合 | 需要判断新旧差异、精准控制 | 依赖多、只要「重跑一遍」 |

### 两个都要注意的事

**异步竞态。** 快速切换 \`todoId\`，后发的请求可能先返回，把新数据覆盖成旧的。解决方式是 \`onCleanup\`：

\`\`\`js
watchEffect((onCleanup) => {
  const controller = new AbortController()
  fetch('/api/todos/' + todoId.value, { signal: controller.signal })
  onCleanup(() => controller.abort())
})
\`\`\`

**不要在里面改被侦听的源。** \`watch(count, () => count.value++)\` 会无限循环。

### 该用哪个

\`\`\`text
需要「一个值」     → computed
需要「新旧值对比」 → watch
需要「变化后做副作用」 → watch 或 watchEffect
依赖多且不想逐个声明 → watchEffect
\`\`\`

> 💡 \`watch\` 返回停止函数：\`const stop = watch(...)\`，调用 \`stop()\` 取消侦听。组件卸载时会自动停止，手动创建的（如在异步回调里）需要自己停。`
    },
    {
      no: 41,
      title: 'props、emit 与 provide/inject',
      lessons: '074–075',
      summary: 'setup 接收 props 与 context；emit、attrs、slots 都在 context 里，解构要小心响应式。',
      points: [
        'setup(props, { emit, attrs, slots, expose })',
        'props 是响应式的，不要直接解构（会失去跟随）',
        'emit 派发事件，需在 emits 选项中声明',
        'provide 的值要响应式就用 ref，inject 可给默认值'
      ],
      body: `### setup 的两个参数

\`\`\`js
export default {
  props: ['mytitle'],
  setup(props, context) {
    // context 里有 attrs / slots / emit / expose
    console.log(props.mytitle)

    const handleClick = () => {
      context.emit('kerwinevent', 'payload')
    }

    return { handleClick }
  }
}
\`\`\`

四个成员的作用：

| 成员 | 说明 |
| --- | --- |
| \`attrs\` | 未声明为 props 的属性（非响应式对象，但会更新） |
| \`slots\` | 插槽函数集合 |
| \`emit\` | 派发事件 |
| \`expose\` | 控制父组件通过 ref 能访问什么 |

### props 不要直接解构

\`\`\`js
// ❌ 解构后失去响应式跟随
setup({ title }) {
  return { title }
}

// ✅ 保留 props 对象，或用 toRefs
setup(props) {
  const { title } = toRefs(props)
  return { title }
}
\`\`\`

这在第 7.3 章讲过原理：解构是取值，取值后就是普通变量。

### 声明事件

\`\`\`js
export default {
  emits: ['change', 'update:modelValue'],
  setup(props, { emit }) {
    const onClick = () => emit('change', 1)
    return { onClick }
  }
}
\`\`\`

声明 \`emits\` 有两个好处：一是避免事件监听被当成 attrs 挂到根元素上（会导致触发两次）；二是把组件 API 写在明面上。

### provide / inject

\`\`\`js
import { provide, inject, ref } from 'vue'

// 祖先
const kerwinshow = ref(true)
provide('kerwinshow', kerwinshow)

// 后代（任意深度）
const kerwinshow = inject('kerwinshow')
kerwinshow.value = false        // 直接改，因为传的是同一个 ref
\`\`\`

与选项式最大的区别：**组合式里 provide 一个 ref 就是响应式的**，不必再绕「provide 响应式对象」。这是因为 ref 本身是引用，被修改的是 \`.value\`，而所有持有者共享同一个 ref。

给默认值：

\`\`\`js
const theme = inject('theme', 'light')
const config = inject('config', () => ({ size: 'm' }))   // 工厂函数，避免共享
\`\`\`

对象默认值要用工厂函数，理由与 props 默认值一致：避免多个组件共享同一个对象。

### 该不该让后代直接改

\`\`\`js
// 方案 A：直接给 ref，后代可写（简单但难追踪）
provide('visible', visible)

// 方案 B：给 ref + 修改方法，后代只能调方法
provide('visible', readonly(visible))
provide('toggleVisible', () => { visible.value = !visible.value })
\`\`\`

B 更啰嗦但可维护：所有修改都经过一个入口，将来加日志、加校验只改一处。团队项目里推荐 B。

> 💡 \`expose\` 决定父组件 ref 能拿到什么。默认 \`script setup\` 组件完全封闭，父组件只能访问 \`defineExpose\` 出来的成员——这比选项式「全暴露」更安全。`
    },
    {
      no: 42,
      title: '生命周期与购物车改写',
      lessons: '072、076',
      summary: '组合式的生命周期是「注册函数」，必须在 setup 同步阶段调用；用 VCA 重写购物车，代码按功能聚合。',
      points: [
        'onMounted 等必须在 setup 同步执行，不能在 setTimeout 里',
        'onUnmounted 与 onMounted 成对出现，负责清理',
        '组合式版购物车把「列表、勾选、合计」三块相邻摆放',
        'useXxx 组合式函数可把整套逻辑抽出复用'
      ],
      body: `### 生命周期变成注册函数

\`\`\`js
import { onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    let timer = null

    onMounted(() => {
      timer = setInterval(() => console.log('tick'), 1000)
    })

    onUnmounted(() => {
      clearInterval(timer)
    })
  }
}
\`\`\`

对应关系：

| 选项式 | 组合式 |
| --- | --- |
| \`created\` | setup 函数体本身 |
| \`mounted\` | \`onMounted\` |
| \`updated\` | \`onUpdated\` |
| \`beforeUnmount\` | \`onBeforeUnmount\` |
| \`unmounted\` | \`onUnmounted\` |
| \`activated\` | \`onActivated\` |

**关键限制**：这些注册函数依赖「当前组件实例」这个全局变量，必须在 setup 的同步执行阶段调用。写在 \`setTimeout\`、\`await\` 之后、事件回调里，都会失效。

\`\`\`js
// ❌ 拿不到当前实例，警告「no active component instance」
setTimeout(() => { onMounted(() => {}) }, 0)
\`\`\`

### 用 VCA 重写购物车

选项式版本的问题是把「列表操作」和「勾选逻辑」拆在 data 与 methods 里。组合式版本可以按功能排：

\`\`\`js
import { ref, computed } from 'vue'

export default {
  setup() {
    // —— 商品列表 ——
    const datalist = ref([
      { id: 1, title: '商品1', price: 10, number: 1, limit: 5 }
    ])
    const removeItem = (id) => {
      datalist.value = datalist.value.filter((it) => it.id !== id)
      checkList.value = checkList.value.filter((it) => it.id !== id)
    }

    // —— 勾选 ——
    const checkList = ref([])
    const isAllChecked = computed({
      get: () => datalist.value.length > 0 && datalist.value.length === checkList.value.length,
      set: (checked) => { checkList.value = checked ? [...datalist.value] : [] }
    })

    // —— 合计 ——
    const total = computed(() =>
      checkList.value.reduce((sum, it) => sum + it.price * it.number, 0)
    )

    return { datalist, checkList, isAllChecked, total, removeItem }
  }
}
\`\`\`

三块逻辑各自成段，改合计只往下看，改勾选只看中间。模板与之前完全一致，说明**组合式只是重组了代码，没有改变数据流**。

### 抽成组合式函数

\`\`\`js
// composables/useCart.js
export function useCart(initial = []) {
  const datalist = ref(initial)
  const checkList = ref([])
  const isAllChecked = computed({ /* 同上 */ })
  const total = computed(() => /* 同上 */)
  function removeItem(id) { /* 同上 */ }
  return { datalist, checkList, isAllChecked, total, removeItem }
}
\`\`\`

组件里 \`const cart = useCart()\`，逻辑可测、可复用、可换实现。这是组合式 API 真正的收益点——**逻辑可以像函数一样被搬走**。

> ⚠️ 组合式函数里如果用生命周期或 \`provide\`，必须在组件 setup 期间调用 \`useCart()\`，不能延迟到异步回调。`
    },
    {
      no: 43,
      title: 'script setup：更少的样板',
      lessons: '077',
      summary: 'script setup 是编译时语法糖：顶层变量自动暴露，defineProps / defineEmits 免导入。',
      points: [
        '顶层声明的变量与函数自动可用于模板',
        'defineProps / defineEmits / defineExpose 是编译器宏，不用导入',
        'defineExpose 显式暴露给父组件的成员',
        'await 可以直接用在顶层（配合 Suspense）'
      ],
      body: `### 对比一下样板量

\`\`\`vue
<!-- 普通 setup -->
<script>
import { ref } from 'vue'
export default {
  setup() {
    const count = ref(0)
    const add = () => count.value++
    return { count, add }
  }
}
</script>
\`\`\`

\`\`\`vue
<!-- script setup -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
const add = () => count.value++
</script>
\`\`\`

省掉了 \`export default\`、\`setup()\`、\`return\`。编译器会把这些顶层绑定自动映射到模板，效果与手写 \`return\` 一致。

### 四个编译器宏

\`\`\`vue
<script setup>
const props = defineProps({
  title: { type: String, required: true }
})

const emit = defineEmits(['change'])

defineExpose({ reset })          // 暴露给父组件 ref
defineOptions({ name: 'MyComp' }) // 设置组件名等选项
</script>
\`\`\`

它们**不需要 import**，因为由编译器直接处理。写成 \`import { defineProps } from 'vue'\` 虽然不报错，但没有意义。

### 组件自动注册

\`\`\`vue
<script setup>
import MyButton from './MyButton.vue'
</script>

<template>
  <MyButton />
</template>
\`\`\`

导入即注册。不再需要 \`components: { MyButton }\`，同时保留了「没用到就不打包」的摇树友好性。

### 与选项式混用的限制

\`<script setup>\` 里没有 \`this\`，也不能声明 \`data\` / \`methods\`。需要少量选项式能力时，用第二个普通 \`<script>\`：

\`\`\`vue
<script>
export default { inheritAttrs: false }
</script>

<script setup>
// 主体逻辑
</script>
\`\`\`

两个 script 块会合并，普通块负责选项，setup 块负责逻辑。

### 顶层 await

\`\`\`vue
<script setup>
const res = await fetch('/api/user')
const user = await res.json()
</script>
\`\`\`

组件会变成异步组件，需要 \`<Suspense>\` 包裹才能渲染。方便，但会改变组件的加载语义，公共组件慎用。

### 一些实践约定

| 约定 | 原因 |
| --- | --- |
| 变量名与模板用的名字一致 | 自动暴露，改名要同步 |
| props 用类型声明（TS） | 编译期校验，替代运行时 type |
| 需要父组件调用的方法显式 \`defineExpose\` | 默认封闭，安全 |
| 逻辑按功能分段，空行分隔 | 组合式的可读性靠排版 |

> 💡 超过 200 行的 \`script setup\` 就该抽组合式函数了。判断依据是「有没有一组变量总是一起动」，有就搬走。`
    }
  ]
});
