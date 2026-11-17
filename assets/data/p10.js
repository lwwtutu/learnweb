/* 第 10 篇 · 组件库、测试、TypeScript 与内功心法 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p10',
  order: 10,
  title: '组件库 · 测试 · TS · 内功',
  range: '102–128',
  desc: '移动端与桌面端组件库、单元测试、TypeScript 接入，以及响应式与 diff 的底层原理',
  chapters: [
    {
      no: 56,
      title: 'Vant：移动端组件库',
      lessons: '102–103',
      summary: '组件库的价值是省掉重复的样式与交互；接入时优先按需加载，别整包引入。',
      points: [
        'Vant 面向移动端，组件以「点击、滑动、弹层」为主',
        '整包引入体积大，按需引入只打包用到的组件',
        '组件库提供的是「交互规范」，不是「业务页面」',
        '样式变量可用 CSS 变量覆盖，不必改源码'
      ],
      body: `### 安装与两种引入

\`\`\`bash
npm install vant
\`\`\`

\`\`\`js
// 整包引入：简单，但体积大
import Vant from 'vant'
import 'vant/lib/index.css'
createApp(App).use(Vant).mount('#app')
\`\`\`

\`\`\`js
// 按需引入：只打包用到的组件（推荐）
import { Button, Field, CellGroup } from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)
app.use(Button).use(Field).use(CellGroup)
\`\`\`

Vant 4 的组件都支持 \`app.use()\` 单独注册。配合构建工具的摇树，未使用的组件不会进包。

| 引入方式 | 包体积 | 上手成本 | 适用 |
| --- | --- | --- | --- |
| 整包 | 大（几百 KB） | 低 | 快速原型 |
| 按需 | 小（数十 KB） | 中 | 生产项目 |
| 自动按需（插件） | 最小 | 需配置 | 组件用得多的项目 |

### 常用基础组件

| 组件 | 用途 | 关键属性 |
| --- | --- | --- |
| \`van-button\` | 按钮 | \`type\`、\`size\`、\`loading\`、\`disabled\` |
| \`van-field\` | 输入框 | \`v-model\`、\`label\`、\`type\`、\`rules\` |
| \`van-cell\` / \`van-cell-group\` | 列表项与分组 | \`title\`、\`value\`、\`is-link\` |
| \`van-popup\` | 弹层 | \`v-model:show\`、\`position\` |
| \`van-toast\` | 轻提示 | 函数式调用 \`showToast()\` |
| \`van-dialog\` | 对话框 | \`showCancelButton\`、\`beforeClose\` |

\`\`\`vue
<van-cell-group inset>
  <van-field v-model="username" label="用户名" placeholder="请输入" />
  <van-field v-model="password" type="password" label="密码" placeholder="请输入" />
</van-cell-group>
<van-button type="primary" block :loading="loading" @click="submit">登录</van-button>
\`\`\`

### 样式定制：先改变量，别改源码

\`\`\`css
:root {
  --van-primary-color: #2f8f61;
  --van-border-radius-md: 10px;
}
\`\`\`

组件库普遍用 CSS 变量做主题，覆盖变量比写 \`:deep()\` 覆盖内部类名稳得多——后者在库升级时容易失效。

### 用组件库的三条纪律

1. **先看文档的交互约定**：移动端的点击区域、滚动行为、键盘遮挡都有处理，自己重写往往更差。
2. **不要为了一个小需求引入整个库**：一个按钮、一个弹窗自己做更轻。
3. **业务组件包一层**：\`<MyField>\` 内部用 \`van-field\`，将来换库只改一处。

> ⚠️ 移动端项目记得加 \`<meta name="viewport" content="width=device-width, initial-scale=1.0">\`，否则 Vant 的 1px 边框与适配都会错位。`
    },
    {
      no: 57,
      title: '移动端实战：List 与 IndexBar',
      lessons: '104–108',
      summary: '列表页的两个经典问题——上拉加载更多与字母索引导航，组件库给了标准解法。',
      points: [
        'van-list 通过 loading 与 finished 两个状态驱动',
        '触底触发 load 事件，请求完必须复位 loading',
        'IndexBar 需要给每项挂索引，靠 scrollIntoView 定位',
        '长列表要考虑「请求中滚动」的竞态'
      ],
      body: `### 上拉加载的核心是两个状态

\`\`\`vue
<van-list
  v-model:loading="loading"
  :finished="finished"
  finished-text="没有更多了"
  @load="onLoad"
>
  <van-cell v-for="item in list" :key="item.id" :title="item.title" />
</van-list>
\`\`\`

\`\`\`js
export default {
  data() {
    return { list: [], loading: false, finished: false, page: 0 }
  },
  methods: {
    async onLoad() {
      const res = await api.getList({ page: ++this.page, size: 10 })
      this.list.push(...res.data)
      this.loading = false                 // 必须复位，否则不再触发
      if (res.data.length < 10) this.finished = true
    }
  }
}
\`\`\`

三个状态构成一个小状态机：

| 状态 | 含义 | 谁改 |
| --- | --- | --- |
| \`loading\` | 正在加载 | 组件置 true，请求完手动置 false |
| \`finished\` | 没有更多 | 业务判断（返回条数 < 页大小） |
| \`error\` | 加载失败 | 请求 catch 里置 true，显示重试 |

**最容易忘的是 \`loading = false\`**：忘了它，列表就永久停在「加载中」。

### 触底加载的三个坑

| 坑 | 原因 | 解法 |
| --- | --- | --- |
| 首屏立即触发多次 | 内容高度不足一屏 | 首次请求后判断高度，或 \`immediate-check="false"\` |
| 重复请求同一页 | 滚动中多次触发 | 用 \`loading\` 守卫，或请求锁 |
| 数据串页 | 快速切换 tab | 每次请求带一个 \`requestId\`，返回时比对 |

第三个坑最隐蔽：用户在 A 分类快速滑到底又切到 B 分类，A 的响应晚到，把 B 的列表覆盖了。解法是给每次请求打标记，只接受当前分类的结果。

### IndexBar：字母索引导航

\`\`\`vue
<van-index-bar :index-list="indexList">
  <template v-for="group in groups" :key="group.letter">
    <van-index-anchor :index="group.letter" />
    <van-cell v-for="item in group.items" :key="item.id" :title="item.name" />
  </template>
</van-index-bar>
\`\`\`

数据结构要先按首字母分组：

\`\`\`js
const groups = [
  { letter: 'A', items: [{ id: 1, name: 'Apple' }] },
  { letter: 'B', items: [{ id: 2, name: 'Banana' }] }
]
const indexList = groups.map((g) => g.letter)
\`\`\`

中文场景常用 pinyin 库取首字母。注意 \`van-index-anchor\` 必须按顺序出现，且 \`index\` 与 \`index-list\` 对应。

### 两个组件的共同前提

它们都依赖「已知容器高度」。如果父级是 \`height: 100%\` 链但某一层没设高度，会出现「列表不滚动、一直加载」。

\`\`\`css
html, body, #app { height: 100%; }
.page { display: flex; flex-direction: column; height: 100%; }
.page__body { flex: 1; overflow-y: auto; }
\`\`\`

> 💡 移动端列表建议加 \`-webkit-overflow-scrolling: touch\`（多数现代浏览器已默认），并给 \`van-list\` 外层留出安全区 \`env(safe-area-inset-bottom)\`。`
    },
    {
      no: 58,
      title: 'Element Plus：桌面端表单与表格',
      lessons: '109–112',
      summary: '桌面后台的两块基石：带校验的表单、带分页的表格；两者都靠「数据驱动 + 插槽定制」。',
      points: [
        'el-form 配 rules 声明校验规则，ref 调 validate',
        'el-table 用 :data 驱动，列用 el-table-column 声明',
        '作用域插槽可自定义单元格内容',
        '分页与排序建议交给后端，前端只管发参数'
      ],
      body: `### 表单：规则声明 + 统一校验

\`\`\`vue
<el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="form.username" />
  </el-form-item>
  <el-form-item label="手机号" prop="phone">
    <el-input v-model="form.phone" />
  </el-form-item>
  <el-button type="primary" @click="submit">提交</el-button>
</el-form>
\`\`\`

\`\`\`js
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 12, message: '长度 3 到 12 位', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

async function submit() {
  await formRef.value.validate()      // 校验失败会 reject
  // 通过后再提交
}
\`\`\`

| 属性 | 作用 |
| --- | --- |
| \`prop\` | 必须写，校验规则按它匹配 |
| \`rules\` | 规则数组，可含多条 |
| \`trigger\` | \`blur\` / \`change\`，决定何时校验 |
| \`validate\` | 返回 Promise，失败时 reject |

**\`prop\` 漏写是最高频错误**：规则明明写了却不生效，就是因为表单项不知道对应哪个字段。

### 表格：列是声明出来的

\`\`\`vue
<el-table :data="list" border stripe @sort-change="onSort">
  <el-table-column prop="id" label="ID" width="80" />
  <el-table-column prop="title" label="标题" show-overflow-tooltip />
  <el-table-column label="状态" width="120">
    <template #default="{ row }">
      <el-tag :type="row.state === 1 ? 'success' : 'info'">
        {{ row.state === 1 ? '已发布' : '草稿' }}
      </el-tag>
    </template>
  </el-table-column>
  <el-table-column label="操作" width="160">
    <template #default="{ row }">
      <el-button link type="primary" @click="edit(row)">编辑</el-button>
      <el-button link type="danger" @click="remove(row)">删除</el-button>
    </template>
  </el-table-column>
</el-table>
\`\`\`

三点经验：

1. \`prop\` 用于简单展示与排序，复杂内容用 \`#default\` 插槽。
2. \`show-overflow-tooltip\` 解决长文本撑破布局。
3. 操作列固定 \`width\`，否则按钮多了会挤压其他列。

### 分页：前后端的分工

\`\`\`vue
<el-pagination
  v-model:current-page="query.page"
  v-model:page-size="query.size"
  :total="total"
  layout="total, sizes, prev, pager, next"
  @current-change="load"
/>
\`\`\`

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| 前端分页 | 切换快 | 数据量大时内存与首屏都吃不消 |
| 后端分页 | 数据量无上限 | 每次切换都要请求 |

后台系统里超过 200 条的列表，一律后端分页；排序同理，让服务端排，前端只传 \`sort\`、\`order\`。

### 一个常被忽略的细节

\`\`\`js
async function load() {
  loading.value = true
  try {
    const res = await api.list(query)
    list.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}
\`\`\`

表格的 \`v-loading\` 要绑在「包裹表格的容器」上，绑在 \`el-table\` 上会出现遮罩被表头挡住的视觉问题。

> 💡 Element Plus 与 Vant 都支持按需引入，桌面端推荐用 \`unplugin-vue-components\` 自动导入，省掉手动注册。`
    },
    {
      no: 59,
      title: '测试：从 Vitest 到组件测试',
      lessons: '113–115',
      summary: '单元测试测函数、组件测试测交互；测试的价值在「敢改」，不在覆盖率数字。',
      points: [
        'Vitest 与 Vite 共用配置，启动快、API 兼容 Jest',
        'describe / it / expect 是最小结构',
        '组件测试用 @vue/test-utils 挂载并查询 DOM',
        '优先测「行为」而不是「实现细节」'
      ],
      body: `### 三类测试的分工

| 类型 | 测什么 | 工具 | 速度 |
| --- | --- | --- | --- |
| 单元测试 | 纯函数、组合式函数 | Vitest | 极快 |
| 组件测试 | 渲染结果、交互 | Vitest + test-utils | 快 |
| 端到端 | 真实浏览器流程 | Playwright / Cypress | 慢 |

金字塔原则：单元测试最多，端到端最少。组件测试处在中间，性价比最高。

### 最小单元测试

\`\`\`js
// utils/format.spec.js
import { describe, it, expect } from 'vitest'
import { currency } from './format'

describe('currency', () => {
  it('默认用人民币符号并保留两位', () => {
    expect(currency(12)).toBe('¥12.00')
  })

  it('空值按 0 处理', () => {
    expect(currency(null)).toBe('¥0.00')
  })
})
\`\`\`

\`\`\`bash
npx vitest          # 监听模式
npx vitest run      # 跑一次（CI 用）
\`\`\`

### 组件测试：mount 之后查 DOM

\`\`\`js
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

it('点击后数字增加', async () => {
  const wrapper = mount(Counter)
  expect(wrapper.text()).toContain('0')

  await wrapper.find('button').trigger('click')
  expect(wrapper.text()).toContain('1')
})
\`\`\`

三个关键 API：

| API | 作用 |
| --- | --- |
| \`mount\` | 挂载组件（\`shallowMount\` 只渲染一层） |
| \`find\` / \`findAll\` | 查询元素 |
| \`trigger\` | 触发事件（要 \`await\`） |

\`trigger\` 之后必须 \`await\`，因为 DOM 更新是异步的（下一个微任务）。忘了 await，断言就会读到旧 DOM——这是组件测试最常见的失败原因。

### 测 props 与 emit

\`\`\`js
it('接收 props 并派发事件', async () => {
  const wrapper = mount(MyButton, { props: { label: '确定' } })
  expect(wrapper.text()).toBe('确定')

  await wrapper.trigger('click')
  expect(wrapper.emitted('confirm')).toHaveLength(1)
})
\`\`\`

\`emitted()\` 返回每个事件被触发的参数数组，可以直接断言调用次数与载荷。

### 该测什么，不该测什么

| 建议测 | 不必测 |
| --- | --- |
| 金额计算、格式化、校验规则 | 第三方组件内部实现 |
| 条件渲染的分支 | 样式细节（除非是回归 bug） |
| 事件是否按约定派发 | 私有方法调用顺序 |
| 边界与异常分支 | 「覆盖率 100%」本身 |

判断标准：**「这段代码改了，测试会不会告诉我出问题了」**。断言实现细节的测试，重构时会一片红，反而拖慢开发。

> ⚠️ 异步组件、\`nextTick\`、\`setTimeout\` 要用 \`vi.useFakeTimers()\` 控制时间，否则测试会不稳定（flaky）。`
    },
    {
      no: 60,
      title: 'TypeScript 基础与类型收窄',
      lessons: '116–117',
      summary: 'TS 的价值在「改代码时立刻报错」；接口、泛型、联合类型是最常用的三件工具。',
      points: [
        'interface 描述对象结构，type 可以描述联合与工具类型',
        '可选属性 ?、只读 readonly、索引签名 [key: string]',
        '泛型让函数与组件保持类型关联',
        '类型收窄靠 typeof、in、instanceof 与字面量判断'
      ],
      body: `### 为什么前端项目要 TS

一个真实场景：接口返回的字段从 \`list\` 改名为 \`items\`，如果没有类型，只有用户点到那个页面才会发现白屏；有类型，编辑器立刻标红所有引用处。**TS 把运行时错误提前到编辑时**。

### 三个最常用的类型工具

\`\`\`ts
// 1. interface：描述对象结构，可继承、可合并
interface User {
  id: number
  name: string
  age?: number            // 可选
  readonly createdAt: string   // 只读
}

// 2. type：描述联合、交叉、工具类型
type Status = 'draft' | 'published' | 'archived'   // 字面量联合
type UserWithStatus = User & { status: Status }    // 交叉

// 3. 泛型：类型参数化
function first<T>(list: T[]): T | undefined {
  return list[0]
}
\`\`\`

\`interface\` 与 \`type\` 的选择：**描述对象用 interface，描述联合 / 映射 / 条件类型用 type**。两者在多数场景可互换，团队统一即可。

### 类型收窄：让联合类型变具体

\`\`\`ts
type Result =
  | { ok: true; data: string }
  | { ok: false; error: Error }

function handle(res: Result) {
  if (res.ok) {
    console.log(res.data)      // 这里 TS 知道是成功分支
  } else {
    console.log(res.error.message)
  }
}
\`\`\`

四个常用收窄手段：

| 手段 | 用法 |
| --- | --- |
| \`typeof\` | 区分 \`string\` / \`number\` / \`function\` |
| \`in\` | 判断对象是否有某属性 |
| \`instanceof\` | 区分类实例 |
| 字面量 / 判别字段 | 联合类型 + 共同字段（如上例的 \`ok\`） |

### 数组与对象类型

\`\`\`ts
const ids: number[] = [1, 2, 3]
const map: Record<string, User> = {}
const tuple: [string, number] = ['a', 1]

// 只读数组
const readonlyIds: readonly number[] = [1, 2]
\`\`\`

### 常见写法对照

| JS 习惯 | TS 写法 |
| --- | --- |
| 不写类型，靠推断 | 局部变量可以不写，函数参数必须写 |
| \`any\` 一把梭 | 用 \`unknown\` + 收窄，或定义真实类型 |
| \`obj && obj.x\` | 可选链 \`obj?.x\` + 空值合并 \`??\` |
| 到处 \`as\` 断言 | 先收窄，实在不行才断言 |

> ⚠️ \`any\` 会让类型检查在这一层失效，并且会「传染」给调用方。真的不知道类型时用 \`unknown\`，强制自己先收窄再用。`
    },
    {
      no: 61,
      title: 'TS 与两种 API 写法',
      lessons: '118–121',
      summary: '选项式靠 defineComponent + PropType，组合式靠泛型参数；后者推导更自然。',
      points: [
        '选项式用 defineComponent 获得 this 的类型推导',
        '复杂 prop 类型用 PropType 断言',
        '组合式用 defineProps<{ ... }>() 声明类型',
        'withDefaults 设置默认值，emit 用类型化写法'
      ],
      body: `### 选项式：defineComponent 包一层

\`\`\`ts
import { defineComponent, PropType } from 'vue'

interface Item {
  id: number
  title: string
}

export default defineComponent({
  props: {
    list: {
      type: Array as PropType<Item[]>,
      required: true
    },
    mode: {
      type: String as PropType<'grid' | 'list'>,
      default: 'grid'
    }
  },
  data() {
    return { active: 0 }
  },
  computed: {
    total(): number {
      return this.list.length       // this.list 被推导为 Item[]
    }
  }
})
\`\`\`

\`defineComponent\` 的作用是让 \`this\` 有类型：不加它，\`this.list\` 是 \`any\`。\`PropType\` 用于「运行时类型表达不了的复杂类型」，比如对象数组、字面量联合。

### 组合式：泛型声明

\`\`\`vue
<script setup lang="ts">
interface Props {
  list: Item[]
  mode?: 'grid' | 'list'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid'
})

const emit = defineEmits<{
  (e: 'select', id: number): void
  (e: 'update:mode', mode: 'grid' | 'list'): void
}>()
</script>
\`\`\`

三个要点：

1. \`defineProps<Props>()\` 直接吃接口，运行时会自动生成对应的类型校验。
2. \`withDefaults\` 提供默认值（Vue 3.5+ 也可以用响应式 props 解构默认值）。
3. \`defineEmits\` 用调用签名声明每个事件的参数类型，emit 时参数不匹配会报错。

### 两种写法在类型上的差别

| | 选项式 | 组合式 |
| --- | --- | --- |
| 组件类型 | 需 \`defineComponent\` | 自动推导 |
| props 类型 | \`PropType\` 断言 | 泛型接口 |
| \`this\` 类型 | 由 defineComponent 推导 | 无 this |
| 事件类型 | 较弱 | 强（调用签名） |
| ref 类型 | \`ref<Item[]>([])\` | 同 |

### ref 的类型标注

\`\`\`ts
import { ref } from 'vue'

const count = ref(0)                  // Ref<number>
const list = ref<Item[]>([])          // 需要显式，否则推断为 never[]
const el = ref<HTMLInputElement | null>(null)   // DOM 引用必须含 null

onMounted(() => {
  el.value?.focus()                   // 空值判断后才能用
})
\`\`\`

\`ref([])\` 推断出的是 \`never[]\`，这是 TS 项目里最常见的类型报错来源，务必显式标注。

### 类型写在模板里也会生效

\`\`\`vue
<template>
  <p>{{ item.title.toUpperCase() }}</p>
  <!-- 若 item 类型里没有 title，编辑器直接标红 -->
</template>
\`\`\`

这是 SFC + TS 相比「字符串模板」最大的收益：模板表达式也能被检查。

> 💡 别忘了 \`vue-tsc --noEmit\`，它专门检查 \`.vue\` 文件里的类型；普通 \`tsc\` 不认识 SFC，会漏掉模板与 script setup 里的错误。`
    },
    {
      no: 62,
      title: 'TS 与路由、Pinia',
      lessons: '122–123',
      summary: '给路由 meta 与参数加类型，给 store 加类型，才能在跨文件调用时不丢信息。',
      points: [
        'RouteMeta 扩展 meta 字段类型',
        'useRoute 的参数是 string，需要显式转换',
        'Pinia 的 option store 自动推导，setup store 靠返回值',
        'storeToRefs 保留类型，解构方法不必转换'
      ],
      body: `### 扩展路由 meta 的类型

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

声明之后，\`route.meta.role\` 就有类型了，守卫里写错字段名会立刻报错。

### 路由参数是字符串

\`\`\`ts
const route = useRoute()
const id = Number(route.params.id)     // params 类型是 string | string[]
\`\`\`

\`route.params\` 的值可能是数组（多个同名参数），所以 TS 推导为 \`string | string[]\`。安全写法：

\`\`\`ts
const raw = route.params.id
const id = Array.isArray(raw) ? raw[0] : raw
\`\`\`

更严谨的做法是用 \`vue-router\` 的 \`RouteParamsGeneric\` 增强，或直接用 \`useRoute('detail')\` 这类命名路由推断（需要配置类型生成）。

### Pinia：option store 的类型

\`\`\`ts
interface CartItem {
  id: number
  price: number
  count: number
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    loading: false
  }),
  getters: {
    total: (state) => state.items.reduce((s, i) => s + i.price * i.count, 0)
  },
  actions: {
    add(item: CartItem) {
      this.items.push(item)
    }
  }
})
\`\`\`

state 的返回值类型就是 store 的类型，getter 的返回类型自动推导，action 参数需要显式标注。

注意 \`items: [] as CartItem[]\`：不写断言会被推断成 \`never[]\`，后续 push 报错。

### setup store 的类型

\`\`\`ts
export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const total = computed(() => items.value.reduce((s, i) => s + i.price * i.count, 0))

  function add(item: CartItem) {
    items.value.push(item)
  }

  return { items, total, add }
})
\`\`\`

返回什么就暴露什么，类型完全来自实现，不需要额外声明。这也是 setup store 在 TS 项目里更受欢迎的原因。

### 解构时的类型

\`\`\`ts
const store = useCartStore()
const { items, total } = storeToRefs(store)    // Ref<CartItem[]>、ComputedRef<number>
const { add } = store                           // (item: CartItem) => void
\`\`\`

\`storeToRefs\` 会保留类型，不需要手动断言。直接解构 state 会丢类型与响应式，两个问题一起犯。

### 一份清单

| 位置 | 必须做 |
| --- | --- |
| 路由 meta | 模块增强声明 |
| 路由参数 | 显式转换 + 判空 |
| store state | 空数组要断言类型 |
| 接口数据 | 定义 DTO 接口，不要 \`any\` |
| 组件 props | 接口 + withDefaults |

> 💡 接口返回值建议单独定义 DTO 类型并放在 \`types/api.ts\`，页面与 store 共用一份。改字段时编译器会指出所有受影响的位置。`
    },
    {
      no: 63,
      title: '响应式原理：依赖收集与触发',
      lessons: '124',
      summary: 'track 记录「谁读了我」，trigger 通知「用我的人该更新了」；effect 是这两步的载体。',
      points: [
        'effect 执行时把当前函数存为 activeEffect',
        'get 时 track：按 target → key 建立依赖集合',
        'set 时 trigger：取出集合并执行',
        'computed 是带缓存的 effect，dirty 标记决定是否重算'
      ],
      body: `### 三个角色

\`\`\`text
reactive  →  Proxy 拦截读写
effect    →  一段「需要跟着数据变」的函数（渲染、computed、watch 都算）
dep       →  记录「哪些 effect 用了这个 key」
\`\`\`

核心只有两句：**读的时候登记，写的时候通知**。

### 一个能跑的最小实现

\`\`\`js
let activeEffect = null
const deps = new WeakMap()          // target → Map<key, Set<effect>>

function track(target, key) {
  if (!activeEffect) return
  let map = deps.get(target)
  if (!map) deps.set(target, (map = new Map()))
  let set = map.get(key)
  if (!set) map.set(key, (set = new Set()))
  set.add(activeEffect)
}

function trigger(target, key) {
  const map = deps.get(target)
  const set = map && map.get(key)
  if (set) set.forEach((fn) => fn())
}

function reactive(obj) {
  return new Proxy(obj, {
    get(t, k) { track(t, k); return t[k] },
    set(t, k, v) { t[k] = v; trigger(t, k); return true }
  })
}

function effect(fn) {
  activeEffect = fn
  fn()                     // 执行时触发 get → 收集依赖
  activeEffect = null
}
\`\`\`

用法：

\`\`\`js
const state = reactive({ count: 0 })
effect(() => console.log(state.count))   // 打印 0，并收集依赖

state.count++                            // 自动再打印 1
\`\`\`

这两段加起来不到 40 行，就是 Vue 响应式的主干。真实的 Vue 多了嵌套 effect 栈、调度器、清理旧依赖、递归代理缓存等细节。

### 关键细节：为什么用 WeakMap

\`WeakMap\` 的键是弱引用：当响应式对象被丢弃，对应的依赖表会被垃圾回收，不会造成内存泄漏。如果是 \`Map\`，对象即使不再使用也无法回收。

### 依赖为什么要「清理」

\`\`\`js
effect(() => {
  console.log(flag ? a : b)     // 第一次用 a，第二次用 b
})
\`\`\`

如果不清掉旧依赖，改 \`a\` 也会触发重跑，即使当前分支根本不用它。Vue 在 effect 重跑前会清空该 effect 的旧依赖集合，再重新收集。

### computed 的本质

\`\`\`js
function computed(getter) {
  let value
  let dirty = true
  const runner = effect(getter, {
    lazy: true,
    scheduler: () => { dirty = true }   // 依赖变了只置脏，不立即重算
  })

  return {
    get value() {
      if (dirty) { value = runner(); dirty = false }
      return value
    }
  }
}
\`\`\`

所以「计算属性有缓存」并不是什么特殊机制，就是「脏标记 + 惰性求值」：依赖不变就不重算。

> 💡 「速查手册」页里有一个可交互的小实验，就是上面这段代码的完整版，改动滑块可以观察 trigger 的触发顺序。`
    },
    {
      no: 64,
      title: '虚拟 DOM 与 diff',
      lessons: '125',
      summary: '虚拟 DOM 是「用 JS 对象描述界面」；diff 是同层比较 + key 复用，把 O(n³) 降到 O(n)。',
      points: [
        'vnode 是普通对象：type、props、children',
        'diff 只做同层比较，不跨层级',
        '首尾双指针 + key 映射表是核心优化',
        'key 让「移动」变成「复用 + 移动」，而不是重建'
      ],
      body: `### 为什么需要虚拟 DOM

直接操作真实 DOM 有两个问题：一是慢（每次改动都可能触发样式计算与重排），二是难以描述「从状态到界面的整体映射」。虚拟 DOM 把界面变成普通 JS 对象，先在内存里算出「最小改动」，再一次性提交给真实 DOM。

\`\`\`js
// 一个 vnode 大致长这样
{
  type: 'div',
  props: { id: 'container' },
  children: [
    { type: 'span', props: { class: 'text1' }, children: 'hello ' },
    { type: 'span', props: { class: 'text2' }, children: 'kerwin' }
  ]
}
\`\`\`

对应真实 DOM：

\`\`\`html
<div id="container">
  <span class="text1">hello </span>
  <span class="text2">kerwin</span>
</div>
\`\`\`

### diff 的两条基本原则

1. **只做同层比较**，不跨层级。跨层移动的节点会被当作「删除 + 新建」，这是有意的取舍——完整树比较是 O(n³)，同层是 O(n)。
2. **从两端向中间收拢**。用四个指针（旧头、旧尾、新头、新尾）做交叉比对。

### 四个比对分支

| 情况 | 处理 |
| --- | --- |
| 旧头 = 新头 | \`patchVnode\`，两指针后移 |
| 旧尾 = 新尾 | \`patchVnode\`，两指针前移 |
| 旧头 = 新尾 | 复用节点并**移动到旧尾之后** |
| 旧尾 = 新头 | 复用节点并**移动到旧头之前** |

四者都不匹配时，用 key 建映射表查找：

\`\`\`js
// 简化示意
const keyToIndex = new Map()
for (let i = oldStart; i <= oldEnd; i++) keyToIndex.set(oldCh[i].key, i)

const idx = keyToIndex.get(newCh[newStart].key)
if (idx !== undefined) {
  // 找到可复用节点：移动它
} else {
  // 新建并插入
}
\`\`\`

映射表把「遍历查找」的 O(n) 降成 O(1)，这是 key 带来的性能收益。

### Vue 与 React 的一个差别

| | Vue 3 | React |
| --- | --- | --- |
| 列表比对 | 首尾双指针 | 从左到右 + 最长递增子序列 |
| 节点类型不同 | 直接替换 | 直接替换 |
| 编译优化 | 有（静态提升、PatchFlag） | 靠运行时（Fiber） |

Vue 3 的编译器会标记「动态节点」（PatchFlag），diff 时只处理可能变化的节点，跳过静态子树。这是「模板 + 编译」相对「JSX」的结构性优势。

### 常见误解

> ⚠️ 「虚拟 DOM 比原生快」——不准确。**虚拟 DOM 的价值是「可预测的最小更新」，不是绝对快**。单次小改动，手写原生一定更快；但界面复杂、状态多时，手写的最优更新几乎不可能维护。

另一个误解是「key 越唯一越好」。key 的作用是「身份标识」，用随机数反而导致每次都不匹配、全量重建。

> 💡 面试常问「为什么不能用 index 当 key」：删除中间项后，后续所有项的 index 前移，key 全变，diff 认为「每个节点都变了」，于是逐个 patch 内容，导致输入框、勾选状态错位。`
    },
    {
      no: 65,
      title: '通信全景与工程收尾',
      lessons: '126–128',
      summary: '把所有通信方式排成一张表，再给出目录结构、性能清单与后续学习路线。',
      points: [
        '六种通信方式按「关系」选，不按「习惯」选',
        '性能优化先定位瓶颈：渲染次数、包体积、长列表',
        '目录结构按业务域划分，不要按文件类型平铺',
        '学完语法只是开始，下一步是工程实践与源码阅读'
      ],
      body: `### 通信方式全景

| 方式 | 方向 | 适用关系 | 代价 |
| --- | --- | --- | --- |
| props | 父 → 子 | 直接父子 | 层级深时需中转 |
| emit | 子 → 父 | 直接父子 | 事件多了难追踪 |
| v-model | 双向（受控） | 父子 | 需遵守约定 |
| ref | 父 → 子（命令式） | 父子 | 破坏封装 |
| provide / inject | 祖先 → 后代 | 跨层级 | 来源隐式 |
| Pinia | 任意 | 跨页面、跨路由 | 需要设计状态结构 |
| mitt | 任意 | 无共同祖先 | 事件链难追踪 |

一条选择顺序：**能 props 就 props，不能就 provide/inject，再不能就 Pinia；mitt 尽量不用。**

### 目录结构建议

\`\`\`text
src/
├── api/           # 接口定义，按模块分文件
├── assets/        # 需要构建的静态资源
├── components/    # 通用组件（Base 前缀）
├── composables/   # 组合式函数（useXxx）
├── layouts/       # 布局（含侧边栏、顶栏）
├── router/        # 路由表与守卫
├── stores/        # Pinia
├── styles/        # 全局样式、变量
├── types/         # 类型定义
├── utils/         # 纯函数工具
├── views/         # 路由级页面
├── App.vue
└── main.js
\`\`\`

三条原则：**按业务分目录，不按文件类型平铺**；**通用组件与业务组件分开**；**页面只做组装，逻辑放 composables**。

### 性能清单

| 症状 | 先查什么 |
| --- | --- |
| 首屏慢 | 包体积（构建分析）、路由是否懒加载、是否整包引入组件库 |
| 输入卡顿 | 是否在 input 上同步做重计算（用防抖或 \`v-model.lazy\`） |
| 长列表卡 | 是否一次性渲染上千项（用虚拟滚动） |
| 切页面卡 | 是否有大组件未拆分、是否有未清理的定时器 |
| 内存持续增长 | 事件监听、定时器、第三方实例是否在卸载时清理 |

优化顺序永远是：**先测量，再改**。用 Performance 面板看长任务，用构建分析看包体积，别凭感觉改代码。

### 三个容易忽略的工程细节

1. **环境变量要区分**：\`import.meta.env.MODE\` 判断 dev / prod，别把测试地址打进生产包。
2. **错误要有兜底**：\`app.config.errorHandler\` 统一上报，路由 \`onError\` 处理 chunk 加载失败。
3. **构建产物要能回滚**：文件名带 hash，旧版本 chunk 被删会导致白屏，保留上一版可回滚。

### 接下来的路

| 方向 | 建议 |
| --- | --- |
| 深入原理 | 读 Vue 3 源码的 \`reactivity\` 与 \`runtime-core\` |
| 服务端渲染 | Nuxt 3，理解同构与 hydration |
| 工程化 | 组件库搭建、Monorepo、CI/CD |
| 业务能力 | 中后台权限模型、可视化、低代码 |

> 🧠 最后一句话：Vue 的 API 会随版本变化，但「数据驱动视图」「单向数据流」「组件边界」这三件事不会变。把这三件事想清楚，换任何框架都能快速上手。`
    }
  ]
});
