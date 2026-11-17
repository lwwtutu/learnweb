/* 第 10 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[56] = {
  deep: `### 「按需引入」到底省了什么

\`\`\`js
// 整包
import Vant from 'vant'
app.use(Vant)               // 所有组件的 JS 都进包

// 手动按需
import { Button, Field } from 'vant'
app.use(Button).use(Field)  // 只进这两个
\`\`\`

要注意两个成本：

1. **JS 体积**：组的组件越多，省得越多。
2. **CSS 体积**：Vant 4 的样式是整包 \`index.css\`，即使只用一个按钮也会引入全部样式（几十 KB）。要极致优化，需要按组件引入样式或使用 \`unplugin-vue-components\` 自动导入。

\`\`\`js
// vite.config.js
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [vue(), Components({ resolvers: [VantResolver()] })]
})
\`\`\`

配置后，模板里写 \`<van-button>\` 会自动 import 组件与样式，不用手写注册。

### 为什么不要改组件库源码

- 升级时改动会被覆盖；
- 团队其他人不知道你改过；
- 出问题无法判断是库的 bug 还是你的改动。

正确姿势按优先级排序：

| 方式 | 适用 |
| --- | --- |
| 覆盖 CSS 变量 | 颜色、圆角、间距 |
| \`:deep()\` 覆盖内部类名 | 库没有暴露变量的样式 |
| 包一层业务组件 | 需要改结构或交互 |
| fork 源码 | 几乎不要用 |

### 移动端适配：组件库默认按 375px 设计

Vant 用 \`px\` 写样式，在不同屏幕上靠**视口缩放**或 **rem/vw 转换**适配。两种常见方案：

- \`postcss-px-to-viewport\`：把 px 转成 vw，随屏幕宽度线性缩放；
- \`amfe-flexible\` + \`postcss-pxtorem\`：按 375 基准换算 rem。

不配置的话，在大屏手机上组件会显得偏小——这不是组件库的问题，而是缺少适配层。

### 动手验证（3 分钟）

\`\`\`bash
npm create vite@latest vant-demo -- --template vue
cd vant-demo && npm i vant
\`\`\`

在 \`main.js\` 里先整包引入并 \`app.use(Vant)\`，构建后看 \`dist/assets/*.js\` 的体积；再改成只引入 \`Button\`，重新构建对比。

> 💡 体积差异通常在几百 KB 级别。这个实验能让你对「按需引入」有具体数值概念，而不是记住一句口号。`,
  quiz: [
    { q: '手动按需引入组件后，样式体积也会变小吗？', a: '不一定。Vant 4 默认样式是整包 index.css，即使只注册一个组件也会引入全部样式；要连样式一起按需，需用 unplugin-vue-components 自动导入或按组件引样式。' },
    { q: '想改组件库某个按钮的主色，最稳妥的做法是什么？', a: '覆盖 CSS 变量（如 --van-primary-color），而不是改源码或用高权重选择器硬覆盖；升级时不会失效。' },
    { q: '移动端为什么需要 postcss 适配层？', a: '组件库按 375px 设计、用 px 写样式，不同屏宽下需要按比例缩放。用 px-to-viewport 或 pxtorem 把 px 转为 vw/rem 才能等比适配。' }
  ]
};

window.VUE_DEEP[57] = {
  deep: `### 触底加载的判定条件

\`\`\`js
scrollTop + clientHeight >= scrollHeight - offset
\`\`\`

- \`scrollTop\`：已滚动的距离；
- \`clientHeight\`：可视区高度；
- \`scrollHeight\`：内容总高度；
- \`offset\`：提前触发的阈值（比如 50px，滚动到距底 50px 就加载）。

Vant 的 \`van-list\` 内部就是监听滚动容器并做这个判断，然后触发 \`load\`。所以「为什么不触发」的排查方向很明确：**滚动容器不是它以为的那个**（常见于中间多包了一层 \`overflow: auto\` 的 div）。

### 三个状态必须成对维护

| 状态 | 谁置 true | 谁置 false |
| --- | --- | --- |
| \`loading\` | 组件在触发 load 时 | **你的请求结束后** |
| \`finished\` | 你（没有更多数据） | 你（切换筛选条件时） |
| \`error\` | 你（请求失败） | 你（重试前） |

90% 的「列表卡在加载中」都是忘了把 \`loading\` 置回 false。注意它必须放在 \`finally\` 里，而不是 \`then\` 里——请求失败时也要复位。

### 竞态：为什么快速切 tab 会串数据

\`\`\`text
点 A 分类 → 发请求 A（慢）
点 B 分类 → 发请求 B（快）
B 返回 → 列表显示 B
A 返回 → 列表被覆盖成 A ❌
\`\`\`

三种解法：

1. **请求序号**：每次请求自增 \`reqId\`，回调里判断 \`if (id !== this.reqId) return\`。
2. **AbortController**：切分类时 abort 上一个请求。
3. **拆分数据源**：每个 tab 一份 list 缓存，互不干扰（体验最好，内存占用高）。

### IndexBar 的定位原理

\`\`\`text
点击索引 'B'
  → 找到 index 为 'B' 的 anchor 元素
  → 计算它相对滚动容器的偏移
  → 设置容器 scrollTop（或对内容做 translateY）
\`\`\`

如果用 \`scrollIntoView\`，要小心它会**滚动最近的滚动祖先**，可能把外层页面也带着滚。更稳的做法是手动算 \`offsetTop\` 并设置容器 \`scrollTop\`。

### 长列表的终局方案：虚拟滚动

上拉加载解决的是「一次取多少」，虚拟滚动解决的是「一次渲染多少」。当已加载 2000 条时，即使分页加载，DOM 节点也会让滚动变卡。

| 方案 | 解决 | 代价 |
| --- | --- | --- |
| 分页/上拉加载 | 请求量 | 渲染量仍会累积 |
| 虚拟滚动 | 渲染量 | 高度计算复杂、搜索定位受限 |
| 分页器（点击翻页） | 两者 | 交互不如无限滚动流畅 |

### 动手验证（4 分钟）

\`\`\`html
<div id="scroll" style="height: 200px; overflow: auto; border: 1px solid #ccc">
  <div v-for="n in 50" :key="n" style="height: 40px">{{ n }}</div>
</div>
<script>
  const el = document.querySelector('#scroll')
  el.addEventListener('scroll', () => {
    console.log(el.scrollTop, el.clientHeight, el.scrollHeight,
      el.scrollTop + el.clientHeight >= el.scrollHeight - 10)
  })
</script>
\`\`\`

> 💡 滚到底时最后一项打印 true——这就是上拉加载的唯一判据。滚不到底却「不触发」，通常是 \`scrollHeight\` 等于 \`clientHeight\`（内容不足一屏），需要首次请求后再判断。`,
  quiz: [
    { q: '上拉加载的触底判定公式是什么？常见「不触发」的原因是什么？', a: 'scrollTop + clientHeight >= scrollHeight - offset。不触发常见于内容不足一屏，或滚动容器不是组件监听的元素（中间多包了一层 overflow 容器）。' },
    { q: 'loading 状态忘记复位会发生什么？应该写在哪个分支？', a: '列表永久停在「加载中」，不再触发新的 load。必须放在 finally 里，保证请求失败时也复位。' },
    { q: '快速切换分类导致列表串数据，机制是什么？怎么解？', a: '先发的请求后返回，把新分类的数据覆盖了。用请求序号校验、AbortController 取消，或每个分类独立数据源。' }
  ]
};

window.VUE_DEEP[58] = {
  deep: `### el-form 的校验是怎么跑的

\`\`\`js
<el-form :model="form" :rules="rules" ref="formRef">
<el-form-item prop="username">
\`\`\`

1. \`el-form-item\` 在挂载时向上找到 \`el-form\`，把自己注册进表单的字段列表。
2. 校验时，表单遍历字段，按 \`prop\` 从 \`model\` 取值，用 \`rules\` 里对应的规则交给 async-validator 执行。
3. 结果（错误信息）通过 provide/inject 回写到对应 form-item 上显示。

所以 \`prop\` 是**连接 model 与 rules 的唯一线索**：漏写 prop，规则写了也不会生效；prop 写错（\`userName\` vs \`username\`）则取不到值，规则可能永远通过。

### validate 的两种用法

\`\`\`js
// Promise 风格：失败会 reject，必须 try/catch
await formRef.value.validate()

// 回调风格：不抛异常，适合不想处理 catch 的场景
formRef.value.validate((valid, fields) => {
  if (!valid) console.log('未通过的字段:', fields)
})
\`\`\`

注意 Promise 风格下 \`validate()\` reject 的是 \`fields\` 对象，不是 Error。直接 \`await\` 而不 catch 会产生未捕获的 Promise 拒绝（控制台红字）。

### 表格为什么要「后端分页」

| 方案 | 数据量上限 | 交互 |
| --- | --- | --- |
| 前端分页 | 几千条（受内存与渲染限制） | 切换秒开 |
| 后端分页 | 无上限 | 每次切页请求 |

判断线：**超过 200 条就走后端**。同时排序、筛选也交给后端——前端排序只能排当前页，用户会以为「排序错了」。

### 排序字段的三方约定

\`\`\`js
@sort-change="({ prop, order }) => {
  query.sort = prop
  query.order = order === 'ascending' ? 'asc' : 'desc'   // 后端常用 asc/desc
  load()
}
\`\`\`

Element 的 \`order\` 是 \`ascending/descending/null\`，后端一般要 \`asc/desc\`，中间必须做映射。这个映射漏了，表现为「点了排序没反应」（后端收到未知值直接忽略）。

### 表格卡顿的三个来源

1. **列太多**：每行 20 列 × 100 行 = 2000 个单元格，diff 成本高。
2. **单元格里有组件**（按钮、开关、下拉）：每个都是组件实例。
3. **formatter 里做重计算**：每行每列都调用。

对策：固定列宽（减少重排）、用 \`v-if\` 控制操作列渲染、把格式化结果提前算好放进数据里。

### 动手验证（3 分钟）

\`\`\`js
// 故意漏写 prop
<el-form-item label="用户名">
  <el-input v-model="form.username" />
</el-form-item>
// rules 里仍有 username 规则
await formRef.value.validate()   // 通过！规则完全没执行
\`\`\`

> 💡 校验「看似生效但永远通过」，第一反应就该去检查 \`prop\`。这是 Element 表单最高频的配置错误，且没有任何报错提示。`,
  quiz: [
    { q: 'el-form-item 的 prop 漏写会导致什么？', a: '规则不会被执行（表单不知道该字段对应 model 里的哪个路径），校验永远通过，且没有任何报错。' },
    { q: 'validate() 的 Promise 风格有什么坑？', a: '校验失败时 reject 的是字段对象而非 Error，不 catch 会产生未捕获的 Promise 拒绝；需要 try/catch 或改用回调风格。' },
    { q: '为什么排序要交给后端？', a: '前端排序只能排当前页数据，跨页顺序会错乱，用户会认为排序失效；筛选同理。' }
  ]
};

window.VUE_DEEP[59] = {
  deep: `### 测试跑在什么环境里

Vitest 默认跑在 Node 环境，没有 DOM。组件测试需要 DOM，所以要在配置里指定：

\`\`\`js
// vitest.config.js
export default defineConfig({
  test: {
    environment: 'jsdom',        // 或 happy-dom（更快，覆盖略少）
    globals: true                // 允许直接用 describe/it/expect
  }
})
\`\`\`

jsdom 是「用 JS 模拟出来的 DOM」，没有真实布局：\`offsetHeight\` 恒为 0、\`getBoundingClientRect\` 全是 0。所以**依赖尺寸的逻辑在单测里测不了**（比如虚拟滚动、拖拽），要靠端到端测试。

### mount 之后为什么必须 await

\`\`\`js
await wrapper.find('button').trigger('click')
expect(wrapper.text()).toContain('1')
\`\`\`

\`trigger\` 派发事件 → 数据变化 → 渲染 effect 被排进微任务。不 await 就直接断言，读到的是旧 DOM。

同一个原因，\`setProps\`、\`setValue\` 之后也要 await。

### mock 的三种层次

| 层次 | 方式 | 适用 |
| --- | --- | --- |
| 模块 | \`vi.mock('./api')\` | 隔离网络，最常用 |
| 全局函数 | \`vi.spyOn(window, 'fetch')\` | 临时替换 |
| 依赖注入 | 组件接受 fetcher 作为 prop/参数 | 最干净，但需要设计 |

\`\`\`js
vi.mock('@/api', () => ({ getList: vi.fn().mockResolvedValue({ data: [1, 2] }) }))
\`\`\`

注意 \`vi.mock\` 会被提升到文件顶部执行，不能引用外部变量（除非用 \`vi.hoisted\`）。

### 覆盖率该怎么看

| 指标 | 含义 | 是否该追求 |
| --- | --- | --- |
| 行覆盖 | 每行是否执行过 | 参考 |
| 分支覆盖 | if/else 两个分支是否都走过 | 更有意义 |
| 100% | 全部执行过 | **不等于没错** |

覆盖率能说明「哪些代码完全没测」，不能说明「测得好不好」。一个只断言「组件能渲染」的测试也能拉高覆盖率，但抓不到任何 bug。

### 该写什么测试

| 优先 | 例子 |
| --- | --- |
| 高 | 金额/日期计算、权限判断、格式转换、表单校验规则 |
| 中 | 组件在给定 props 下的渲染结果、emit 是否按约定派发 |
| 低 | 第三方组件内部行为、样式细节、私有方法调用顺序 |

判断标准：**这段代码改了，测试会不会告诉我「出问题了」**。

### 动手验证（4 分钟）

\`\`\`js
it('不 await 会读到旧 DOM', async () => {
  const wrapper = mount(Counter)
  wrapper.find('button').trigger('click')        // 没有 await
  expect(wrapper.text()).toContain('0')          // 能通过（！）
  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('1')
})
\`\`\`

> 💡 第一处断言能通过，正是因为它读到了**旧** DOM——这种「假通过」比失败更危险。养成 trigger/setProps 之后一律 await 的习惯。`,
  quiz: [
    { q: '为什么组件测试必须用 jsdom/happy-dom 环境？它们有什么局限？', a: 'Vitest 默认 Node 环境没有 DOM，无法 mount。jsdom 模拟的 DOM 没有真实布局（offsetHeight 为 0），依赖尺寸的逻辑无法测。' },
    { q: 'trigger 之后不 await 会发生什么？', a: '数据变化触发的重渲染在微任务里，尚未执行完；断言会读到旧 DOM，出现「假通过」。' },
    { q: '覆盖率 100% 能说明测试写得好吗？', a: '不能。覆盖率只说明代码被执行过，不能说明断言是否有效；只断言「能渲染」的测试也能刷满覆盖率却抓不到 bug。' }
  ]
};

window.VUE_DEEP[60] = {
  deep: `### TS 是「结构化类型」，不看名字看形状

\`\`\`ts
interface Point { x: number; y: number }
const p = { x: 1, y: 2, z: 3 }
const q: Point = p        // ✅ 结构兼容，多余的 z 不报错（变量赋值时）
const r: Point = { x: 1, y: 2, z: 3 }   // ❌ 对象字面量会做多余属性检查
\`\`\`

这解释了为什么「明明类型不匹配却能用」以及「明明是子集却报错」：TS 比较的是「形状是否够用」，不是「是否同名」。对象字面量赋值时的多余属性检查（excess property check）是唯一的例外。

### 联合类型 + 判别字段 = 最实用的模式

\`\`\`ts
type State =
  | { status: 'loading' }
  | { status: 'success'; data: Item[] }
  | { status: 'error'; message: string }

function render(s: State) {
  if (s.status === 'success') return s.data     // 收窄后能访问 data
  if (s.status === 'error') return s.message
}
\`\`\`

它把「不可能同时存在的状态」编码进类型里。相比 \`{ loading: boolean; error?: string; data?: Item[] }\`（可以出现 loading=true 且有 data 的非法组合），这种写法让非法状态**无法表示**。

### 泛型约束：让泛型「有底线」

\`\`\`ts
function pluck<T, K extends keyof T>(list: T[], key: K): T[K][] {
  return list.map((item) => item[key])
}

pluck([{ id: 1, name: 'a' }], 'name')   // string[]
pluck([{ id: 1 }], 'age')                // ❌ 编译报错
\`\`\`

\`K extends keyof T\` 保证「只能传对象上真实存在的键」，返回值类型也跟着精确。这是「一次定义、处处正确」的典型收益。

### 断言（as）为什么危险

\`\`\`ts
const el = document.querySelector('.x') as HTMLElement
el.focus()      // 运行时 el 可能是 null → 崩
\`\`\`

\`as\` 是「我保证它是这个类型」，编译器不再检查。用它的三个前提：你比编译器知道得更多、你验证过、且没有更好的办法（类型守卫、可选链、判空）。

### 类型收窄的四把工具

| 工具 | 例子 |
| --- | --- |
| \`typeof\` | \`typeof v === 'string'\` |
| \`in\` | \`'data' in res\` |
| \`instanceof\` | \`e instanceof Error\` |
| 判别字段 / 字面量 | \`s.status === 'success'\` |

自定义类型守卫再补一层：

\`\`\`ts
function isItem(v: unknown): v is Item {
  return typeof v === 'object' && v !== null && 'id' in v
}
\`\`\`

### 动手验证（3 分钟）

\`\`\`ts
type A = { a: number }
const obj = { a: 1, b: 2 }
const x: A = obj              // ✅
const y: A = { a: 1, b: 2 }   // ❌ 多余属性检查
\`\`\`

> 💡 同一个值，经变量中转就能赋值，直接写字面量就报错。这不是 bug，而是 TS 的「多余属性检查」只在字面量场景生效——理解它能省掉很多「为什么这里行那里不行」的困惑。`,
  quiz: [
    { q: 'TS 是名义类型还是结构化类型？为什么对象字面量赋值会额外报错？', a: '结构化类型（看形状是否兼容，不看名字）。对象字面量赋值时有「多余属性检查」，防止拼写错误被静默接受。' },
    { q: '用「联合 + 判别字段」描述请求状态，相比三个布尔/可选字段好在哪？', a: '非法状态无法表示（不可能同时 loading 且有 data），收窄后能安全访问对应字段，编译器会强制处理每个分支。' },
    { q: 'as 断言的风险是什么？什么情况下可以用？', a: '它跳过类型检查，运行时可能不是该类型导致崩溃。只在「你确实比编译器知道更多且已验证」时使用，优先用类型守卫/判空替代。' }
  ]
};

window.VUE_DEEP[61] = {
  deep: `### 选项式里 defineComponent 解决的是「this 从哪来」

\`\`\`ts
export default defineComponent({
  props: { list: { type: Array as PropType<Item[]>, required: true } },
  computed: {
    total(): number { return this.list.length }   // this.list 有类型
  }
})
\`\`\`

不加 \`defineComponent\` 直接导出对象，\`this\` 是 \`any\`，等于放弃类型检查。它的作用是「把选项对象包一层泛型函数」，让 TS 能推导出 \`this\` 的成员。

\`PropType\` 用于运行时类型表达不了的场景：

| 场景 | 写法 |
| --- | --- |
| 对象数组 | \`Array as PropType<Item[]>\` |
| 字面量联合 | \`String as PropType<'grid' \\| 'list'>\` |
| 函数签名 | \`Function as PropType<(id: number) => void>\` |

### 组合式里泛型直接吃接口

\`\`\`ts
interface Props { list: Item[]; mode?: 'grid' | 'list' }

const props = withDefaults(defineProps<Props>(), { mode: 'grid' })
const emit = defineEmits<{ (e: 'select', id: number): void }>()
\`\`\`

\`withDefaults\` 的关键点：**默认值会让该 prop 在类型上变成非可选**。\`props.mode\` 的类型是 \`'grid' | 'list'\`，不再是 \`undefined\`，所以不用到处判空。

\`defineEmits\` 用调用签名声明后，emit 时参数不匹配会编译报错，编辑器也能提示。这比运行时 emits 数组强得多。

### ref 的类型标注三件套

\`\`\`ts
const count = ref(0)                       // Ref<number>
const list = ref<Item[]>([])               // 必须显式，否则 never[]
const el = ref<HTMLInputElement | null>(null)  // DOM 引用必须含 null
\`\`\`

第二行是最常见的报错来源：\`ref([])\` 推断为 \`never[]\`，\`push\` 时报「不能把 Item 赋给 never」。

### 类型标注的收益边界

| 有收益 | 收益有限 |
| --- | --- |
| props / emits 契约 | 组件内部临时变量 |
| 接口返回 DTO | 简单的事件对象 |
| store 的 state 与 action | 一次性的配置对象 |
| 工具函数入参出参 | 模板里的简单表达式 |

原则：**跨文件边界的都要类型，函数内部的靠推断**。到处写类型会让代码变吵，反而不易读。

### 动手验证（3 分钟）

\`\`\`ts
const list = ref([])
list.value.push(1)      // ❌ Argument of type 'number' is not assignable to type 'never'
const ok = ref<number[]>([])
ok.value.push(1)        // ✅
\`\`\`

> 💡 看到 \`never\` 报错，第一反应就是「空数组没标类型」。这是 Vue + TS 项目里出现频率最高的编译错误之一。`,
  quiz: [
    { q: '选项式 API 里为什么需要 defineComponent？', a: '它把选项对象包一层泛型函数，让 TS 能推导 this 的成员类型；不加则 this 为 any，失去类型检查。' },
    { q: 'withDefaults(defineProps<Props>(), { mode: "grid" }) 对 props.mode 的类型有什么影响？', a: '使该 prop 在类型上变为非可选（不再是 undefined），使用时无需判空。' },
    { q: 'ref([]) 为什么会报 never 类型错误？', a: '空数组无法推断元素类型，被推断为 never[]；push 任何值都不合法。必须显式写 ref<Item[]>([])。' }
  ]
};

window.VUE_DEEP[62] = {
  deep: `### 路由 meta 的类型增强

\`\`\`ts
// types/router.d.ts
import 'vue-router'
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    role?: 'admin' | 'user'
  }
}
\`\`\`

这是「模块声明合并」：往 \`vue-router\` 的类型里追加字段。声明之后：

- \`to.meta.requiresAhtu\` 拼错会立刻报错；
- 守卫里写 \`to.meta.role === 'admin'\` 有字面量提示。

没有它，\`meta\` 是 \`Record<string | number | symbol, unknown>\`，读出来还得断言。

### params 是 string，且可能是数组

\`\`\`ts
const raw = route.params.id            // string | string[]
const id = Number(Array.isArray(raw) ? raw[0] : raw)
\`\`\`

更好的方案是用 \`createRouter\` 的类型参数或「类型化路由」（社区有 \`unplugin-vue-router\`），把路径参数映射成具体类型。但手写转换是最稳的底线。

### Pinia 的类型来自实现

\`\`\`ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() => items.value.reduce((s, i) => s + i.price, 0))
  function add(item: CartItem) { items.value.push(item) }
  return { items, total, add }
})
\`\`\`

- \`store.items\` 类型是 \`CartItem[]\`（ref 自动解包）；
- \`store.total\` 是 \`number\`；
- \`store.add\` 是 \`(item: CartItem) => void\`。

option store 里则要注意：\`state: () => ({ items: [] as CartItem[] })\`——不写断言就是 \`never[]\`。

### storeToRefs 保留类型

\`\`\`ts
const { items, total } = storeToRefs(store)   // Ref<CartItem[]>、ComputedRef<number>
\`\`\`

直接解构 \`const { items } = store\` 拿到的是 \`CartItem[]\`（值），既丢响应式也丢「这是一个引用」的类型信息。

### 类型出问题时的排查顺序

| 症状 | 先查 |
| --- | --- |
| \`never\` 相关 | 空数组/空对象是否标了类型 |
| 属性不存在 | 接口字段拼写、DTO 是否同步 |
| 不能赋给某类型 | 是否漏了可选 \`?\`、是否用了字面量联合 |
| 类型被推断成 \`any\` | 是否漏写返回类型、第三方库是否缺 d.ts |

### 动手验证（3 分钟）

\`\`\`ts
// 不声明 RouteMeta 时
router.beforeEach((to) => {
  if (to.meta.title.length > 0) {}   // ❌ 'title' 可能不存在 / unknown
})

// 声明后
router.beforeEach((to) => {
  if (to.meta.title?.length) {}      // ✅ 有 string | undefined
})
\`\`\`

> 💡 类型增强要放在被 \`tsconfig\` 包含的 \`.d.ts\` 里，且必须写 \`import 'vue-router'\` 让它成为模块（否则变成全局脚本，合并失效）。这是「声明不生效」最常见的原因。`,
  quiz: [
    { q: '如何给 route.meta 加类型？为什么必须 import "vue-router"？', a: '用 declare module "vue-router" 做接口合并声明 RouteMeta 字段；必须先 import 使其成为模块，否则声明不会与库的类型合并。' },
    { q: 'route.params.id 的静态类型是什么？该怎么处理？', a: 'string | string[]（可能多值）。要判断数组并转换数字，或用类型化路由插件生成精确类型。' },
    { q: 'Pinia 的 setup store 与 option store，哪个类型更省事？为什么？', a: 'setup store：类型直接从实现（ref/computed/函数的返回）推导，无需额外声明；option store 的 state 空数组要手动 as 断言。' }
  ]
};

window.VUE_DEEP[63] = {
  deep: `### 依赖收集的完整时序（含调度）

\`\`\`text
1. 组件首次渲染：effect(fn) 执行，activeEffect = 当前渲染 effect
2. fn 内部读 state.count → Proxy get → track(target, 'count')
3. track 把 activeEffect 塞进 WeakMap<target, Map<key, Set<effect>>>
4. fn 执行完，activeEffect = null
5. 某处 state.count = 1 → Proxy set → trigger(target, 'count')
6. trigger 取出 Set，把每个 effect 塞进「微任务队列」（不是立即执行）
7. 本轮同步代码结束 → 微任务 flush → 重新执行渲染 effect
\`\`\`

第 6 步的「进队列」是关键：它让同一轮里多次修改只触发一次渲染（批量更新）。这也是「改了三次数据，却只渲染一次」的原因。

### 为什么用 WeakMap + Set

| 结构 | 作用 |
| --- | --- |
| \`WeakMap<target, ...>\` | 键是对象，对象被回收时依赖表自动释放，避免内存泄漏 |
| \`Map<key, Set>\` | 按属性分桶，改 a 不影响依赖 b 的 effect |
| \`Set<effect>\` | 去重：同一 effect 读同一个属性多次，只记录一次 |

### 递归代理与缓存

\`\`\`js
const seen = new WeakMap()
function reactive(obj) {
  if (seen.has(obj)) return seen.get(obj)   // 同一对象只代理一次
  const proxy = new Proxy(obj, handlers)
  seen.set(obj, proxy)
  seen.set(proxy, proxy)
  return proxy
}
\`\`\`

没有这层缓存，\`state.nested.nested\` 每次访问都会创建新 Proxy，导致「同一个对象，两次读到的代理不同」，依赖收集与比较全部出错。

### 集合类型为什么要单独处理

\`\`\`js
const m = reactive(new Map())
m.set('a', 1)     // 这行内部是 Map.prototype.set，Proxy 的 set trap 拦不到
\`\`\`

Proxy 拦的是「对象属性读写」，而 \`Map.prototype.set\` 是方法调用，内部操作不经过属性访问。Vue 3 的做法是：对集合类型换一套 handler，把 \`get\`/\`set\`/\`add\`/\`delete\` 等方法替换成「先收集依赖再调用原方法」的包装版本。

### 调度器：批量与去重

\`\`\`js
// 概念示意
const queue = new Set()
function queueJob(job) {
  queue.add(job)
  if (!flushing) Promise.resolve().then(flushJobs)
}
function flushJobs() {
  queue.forEach(job => job())
  queue.clear()
}
\`\`\`

\`Set\` 保证同一 job 只排队一次，微任务保证「一次事件循环内只渲染一次」。这就是 Vue 的批量更新策略，比 \`setTimeout\` 更快（微任务先于渲染）。

### 动手验证（4 分钟）

\`\`\`js
const { reactive, effect } = (() => {
  let active = null, deps = new WeakMap(), queue = new Set()
  const track = (t, k) => { if (!active) return; const m = deps.get(t) || deps.set(t, new Map()).get(t); const s = m.get(k) || m.set(k, new Set()).get(k); s.add(active) }
  const job = (fn) => { queue.add(fn); Promise.resolve().then(() => { queue.forEach(f => f()); queue.clear() }) }
  const trigger = (t, k) => { const s = deps.get(t)?.get(k); s && s.forEach(job) }
  return {
    reactive: (o) => new Proxy(o, {
      get(t, k) { track(t, k); return t[k] },
      set(t, k, v) { t[k] = v; trigger(t, k); return true }
    }),
    effect: (fn) => { active = fn; fn(); active = null }
  }
})()

const s = reactive({ a: 0 })
effect(() => console.log('渲染，a =', s.a))
s.a++; s.a++; s.a++
console.log('同步代码结束')
\`\`\`

> 💡 输出顺序是「渲染 0」→「同步代码结束」→「渲染 3」（只一次）。三次修改合并成一次渲染，正是微任务队列的功劳。`,
  quiz: [
    { q: '一次同步代码里连续改三次数据，为什么只渲染一次？', a: 'trigger 只是把渲染 effect 放进微任务队列（Set 去重），本轮同步代码结束后统一 flush，所以合并成一次渲染。' },
    { q: '响应式实现里为什么必须缓存「原对象 → 代理」的映射？', a: '否则每次访问嵌套对象都创建新 Proxy，同一对象会得到不同代理，依赖收集与比较都会出错。' },
    { q: '为什么 Map/Set 需要单独的 handler？', a: 'Proxy 拦截的是属性读写，而 Map.prototype.set 等方法内部不经过属性访问，必须把方法本身换成带依赖收集的包装版本。' }
  ]
};

window.VUE_DEEP[64] = {
  deep: `### Vue 3 的 keyed diff 五个步骤

\`\`\`text
1. 从头部同步：新旧开头相同则 patch 并后移，直到不同
2. 从尾部同步：新旧结尾相同则 patch 并前移，直到不同
3. 旧序列已遍历完 → 新序列剩下的全部「新增」
4. 新序列已遍历完 → 旧序列剩下的全部「删除」
5. 中间乱序段：用 key 建索引表，再求「最长递增子序列」（LIS），
   不在 LIS 中的节点需要移动，其余保持不动
\`\`\`

第 5 步是 Vue 3 相对 Vue 2 的重要改进：Vue 2 的双端比较会把「头尾对不上」的节点逐个移动，Vue 3 用 LIS 求出「最少的移动次数」——只移动真正需要动的节点。

### 为什么 LIS 能减少移动

假设旧 \`[a,b,c,d]\`，新 \`[d,a,b,c]\`。可以把 \`a,b,c\` 看作「相对顺序未变」的子序列，只把 \`d\` 移到最前面即可（1 次移动），而不是把四个都挪一遍。LIS 就是求「最长的、顺序不变的那一段」。

### PatchFlag 与 Block：编译期的优化

\`\`\`js
_createElementVNode("p", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)
\`\`\`

末尾的 \`1\` 表示「只有文本是动态的」。渲染时，Vue 把这个节点收进「动态子节点数组」（block），diff 时**只遍历这些动态节点**，静态节点直接跳过。

对比 React：没有编译期信息，运行时需要遍历整棵新树做 diff（用 Fiber 优化调度）。这不是「谁更快」的问题，而是「优化发生在编译期还是运行期」。

### 常见误解：虚拟 DOM 一定比原生快

不成立。虚拟 DOM 的价值是：

1. **可预测的最小更新**：你不用手写「改哪个节点」；
2. **跨平台**：同一份 vnode 可以渲染到 DOM、Canvas、Native；
3. **可测试**：vnode 是纯数据。

单次小改动，手写 \`textContent = x\` 必然更快。虚拟 DOM 赢在「复杂界面的可维护性」。

### 为什么 key 影响正确性而不只是性能

diff 的假设是「key 相同 = 同一个节点」。用 index 作 key 时，删除中间项会让后续 key 平移，于是：

- 节点被判定为「同一个」，只更新文本 → 内部状态（输入框、勾选、动画）停留原位 → 数据串行；
- 本该删除的节点被复用，本该保留的被删掉。

这是「正确性」问题，不是「快慢」问题。

### 动手验证（3 分钟）

打开 Devtools → Elements，选中一个有 \`v-for\` 的列表，在 Console 执行：

\`\`\`js
const ul = document.querySelector('ul')
const first = ul.children[0]
// 触发一次「插入新项到头部」的操作
ul.children[0] === first        // true  → 原节点被复用（有 key 时应该如此）
\`\`\`

> 💡 如果列表用了 index 作 key，插入到头部后 \`ul.children[0]\` 会是**新建的节点**（因为 key 0 如今对应新数据），原来那个节点被挪到后面并改了内容。用 id 作 key，则是原节点被移动——DOM 身份保留，动画与状态才不会乱。`,
  quiz: [
    { q: 'Vue 3 的 keyed diff 第 5 步用最长递增子序列做什么？', a: '在乱序段中找出「相对顺序不变」的最长子序列，这些节点保持不动，只移动其余节点，从而把移动次数降到最少。' },
    { q: 'PatchFlag 的作用是什么？它与 React 的运行时 diff 有什么不同？', a: '编译期标记节点哪些部分是动态的，运行时只遍历动态节点（block），跳过静态子树；React 没有这层编译信息，靠运行时遍历整棵树。' },
    { q: '为什么「虚拟 DOM 一定比原生快」是错的？', a: '单次简单改动手写 DOM 更快。虚拟 DOM 的价值是可预测的最小更新、跨平台与可测试性，而非绝对性能。' }
  ]
};

window.VUE_DEEP[65] = {
  deep: `### 从「会用」到「能解释」的三层检验

| 层次 | 表现 | 检验方式 |
| --- | --- | --- |
| 会用 | 能照着文档写出功能 | 抄一遍能跑 |
| 懂边界 | 知道什么情况会失效 | 能说出三个「不生效」的场景 |
| 能解释 | 能说清内部为什么这样 | 能画出时序/数据结构 |

绝大多数「学了就忘」停在第 1 层：只是把文档抄进了短期记忆。要往上走，必须做「输出」——解释给别人听、写下来、或者用代码验证。

### 一个可执行的复习节奏

\`\`\`text
当天：读完一章 + 答 3 道自查题 + 动手验证 1 个小实验
第 2 天：只做自查题（不看正文），答不出的回读对应小节
第 4 天：再答一次
第 7 天：再把这一章的关键机制讲一遍（录音/写笔记）
\`\`\`

间隔重复的关键不是「重复阅读」，而是「**在快忘记时主动回忆**」。阅读带来的熟悉感是错觉，回忆时的卡顿才是真实掌握度。

### 性能排查的标准顺序

| 步骤 | 工具 | 看什么 |
| --- | --- | --- |
| 1. 定位慢在哪 | Performance 面板 | 长任务（>50ms）在渲染还是脚本 |
| 2. 看渲染次数 | Vue Devtools 的 Highlight updates | 是否出现「改一个值，整页闪」 |
| 3. 看包体积 | \`rollup-plugin-visualizer\` | 哪个 chunk 最大、是否重复打包 |
| 4. 看内存 | Memory 快照 | 组件卸载后是否还有引用 |

**先测量再改**，是最容易被跳过也最值钱的一条。凭感觉优化十有八九改错地方。

### 目录结构的判断标准

\`\`\`text
按业务域分：
  features/order/{api,components,store,views}

按类型分（不推荐）：
  components/、views/、stores/  ← 文件一多就找不到业务关系
\`\`\`

小项目按类型分没问题；超过 30 个组件后，按业务域分能显著降低「改一个需求要翻五个目录」的成本。

### 三个「看起来高级但没必要」的东西

| 做法 | 什么时候才需要 |
| --- | --- |
| 自己封装一套请求库 | 团队有统一鉴权/重试/埋点规范时 |
| 上微前端 | 多团队独立发布、技术栈不同 |
| 全面 SSR | SEO 是核心流量来源 |

过早引入这些，维护成本远大于收益。**先用最简单能跑通的方案，遇到真问题再升级**。

### 最后：把知识挂到一条主线上

整站的骨架其实只有一条链：

\`\`\`text
状态（ref/reactive）
  → 读取时收集依赖
  → 推导（computed）
  → 渲染（模板 → vnode → diff → DOM）
  → 交互（事件/表单/v-model）
  → 跨组件传递（props/emit/provide/store/router）
  → 变化后回到第一步
\`\`\`

每一个 API 都能挂到这条链的某个位置。想不起来某个 API 时，先问「它作用在链的哪一环」，比死记语法有效得多。

> 🧠 学完这一站，你不必记住所有 API——但应该能回答：数据为什么更新了、为什么没更新、组件为什么复用了、路由为什么没生效。这四个问题覆盖了 80% 的真实 bug。`,
  quiz: [
    { q: '「学了就忘」的主要原因是什么？怎么破？', a: '大多停留在「会用」层：只是抄过文档，缺少输出与主动回忆。破法是合上原文自测、动手验证、把机制讲给别人听，并按间隔重复安排复习。' },
    { q: '性能排查的正确顺序是什么？', a: '先用 Performance 定位长任务，再用 Devtools 看渲染次数，然后看构建产物体积，最后看内存快照。先测量再优化，避免凭感觉改错地方。' },
    { q: '把整站知识串成一条主线，这条链是什么？', a: '状态 → 读取收集依赖 → 派生计算 → 渲染（vnode/diff/DOM）→ 交互 → 跨组件传递 → 回到状态变化。任何 API 都能定位到链上某一环。' }
  ]
};
