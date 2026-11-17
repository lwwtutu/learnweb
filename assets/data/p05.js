/* 第 5 篇 · 组件通信与插槽 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p5',
  order: 5,
  title: '组件通信与插槽',
  range: '044–054',
  desc: '六种通信方式各有适用边界，插槽决定了组件的表达力上限',
  chapters: [
    {
      no: 25,
      title: '自定义事件：子传父的唯一正解',
      lessons: '044',
      summary: '子组件用 $emit 派发事件，父组件用 @ 监听；事件名、参数、修饰符构成子组件的对外 API。',
      points: [
        '事件名建议 kebab-case，模板里 @some-event 监听',
        'emit 的第二个参数起是回调参数，可传多个',
        '事件监听支持 .once，只响应首次',
        '不要用事件回调直接修改子组件内部状态'
      ],
      body: `### 最基本的链路

\`\`\`vue
<!-- 子组件 MyButton.vue -->
<script>
export default {
  methods: {
    submit() {
      this.$emit('someEvent', 1, 'hello')
    }
  }
}
</script>
<template>
  <button @click="submit">click me</button>
</template>
\`\`\`

\`\`\`html
<!-- 父组件 -->
<MyButton @some-event="onEvent" />

<script>
export default {
  methods: {
    onEvent(index, text) { console.log(index, text) }   // 1 'hello'
  }
}
</script>
\`\`\`

注意两点：**子组件派发用驼峰 \`someEvent\`，父组件监听用 kebab-case \`@some-event\`**。Vue 3 会自动做名称匹配，但保持「声明驼峰、监听短横线」的惯例，避免在 DOM 内模板里失效。

### 事件名怎么起

| 起法 | 例子 | 评价 |
| --- | --- | --- |
| 动词过去式 | \`@saved\`、\`@deleted\` | 表达「已经发生」，最贴切 |
| 动词原形 | \`@submit\`、\`@change\` | 与原生事件同名时容易混淆 |
| 带数据语义 | \`@update:title\` | 用于 \`v-model\` 约定 |

事件名是子组件的**对外 API**，一旦有外部使用就不该随意改名。

### 常见错误：想用事件改子组件状态

\`\`\`html
<!-- ❌ 子组件派发事件，父组件再去改子组件内部数据 -->
<Child @close="childVisible = false" />
\`\`\`

这本质上是「父组件遥控子组件」，绕了一圈。正确做法是让控制权跟着数据走：\`visible\` 由父组件持有，通过 prop 传下去，子组件只 emit「请求关闭」，父组件同意后改 prop，子组件自然关闭。

\`\`\`vue
<!-- 父 -->
<Dialog :visible="show" @request-close="show = false" />
\`\`\`

### .once 修饰符

\`\`\`html
<MyButton @some-event.once="onPaid" />
\`\`\`

只响应第一次。适合「支付成功」「领取奖励」这类不应重复触发的动作。它不是节流的替代品——防重复点击要在按钮上加 \`disabled\` 或 \`loading\`。

### 与原生事件的对照

| 环节 | 原生 | 组件 |
| --- | --- | --- |
| 触发 | 浏览器派发 | \`$emit\` 手动派发 |
| 监听 | \`addEventListener\` | \`@事件名\` |
| 参数 | \`Event\` 对象 | 任意个参数 |
| 冒泡 | 默认冒泡 | 不冒泡，只到直接父组件 |

组件事件不会冒泡，所以「孙子组件的事件」要由中间组件转发，或者改用 \`provide / inject\` / 状态管理。

> ⚠️ 在 \`script setup\` 里必须用 \`defineEmits\` 声明事件，否则 \`$emit\` 拿不到（第 7.7 章）。选项式 API 则无需声明，但这意味着事件列表不显式，可读性差一些。`
    },
    {
      no: 26,
      title: '$refs、$parent、$root：能拿到，但少用',
      lessons: '045–046',
      summary: 'ref 绑在 DOM 上拿原生节点，绑在组件上拿组件实例；$parent / $root 属于应急通道。',
      points: [
        'ref 在 DOM 上是原生节点，在组件上是组件实例',
        '通过实例可调用子组件方法、读取其数据',
        '$parent 是最近一级父组件，$root 是根组件',
        '依赖 $parent 会让组件难以复用，优先用 props/emit'
      ],
      body: `### ref：父组件访问子组件的正规通道

\`\`\`html
<van-field label="用户名" ref="myusername" />
<van-field label="密码" type="password" ref="mypassword" />
<button @click="handleRegister">注册</button>
\`\`\`

\`\`\`js
export default {
  methods: {
    handleRegister() {
      console.log(this.$refs.myusername.value, this.$refs.mypassword.value)
    },
    handleReset() {
      this.$refs.myusername.value = ''
      this.$refs.mypassword.value = ''
    }
  }
}
\`\`\`

同一个 \`ref\` 名字，绑在不同东西上，拿到的也不同：

| 绑在 | 拿到 | 典型用途 |
| --- | --- | --- |
| 普通元素 | 原生 DOM 节点 | 聚焦、测尺寸、调用 \`play()\` |
| 组件 | 组件实例 | 调用子组件方法、读子组件状态 |
| \`v-for\` 元素 | 数组 | 批量操作列表项 |

重要限制：\`$refs\` 在 \`mounted\` 之后才有值。在 \`created\` 里访问得到的是空对象，因为 DOM 还没生成。

### $parent / $root：应急通道

\`\`\`js
// 子组件里
this.$parent.$refs.layout.isShow = false
\`\`\`

\`$parent\` 指向最近一级父组件，\`$root\` 指向根组件。它能「穿透」层级直接改别人状态，写起来快，问题也明显：

- 子组件的正确性依赖「父组件必须有 \`layout\` 这个 ref」，一旦换个父组件就崩。
- 数据流被双向打通，出问题时无法从 props 追到源头。
- 组件无法单独测试与复用。

所以它属于**应急手段**：调试时用、老代码里兜底用，新代码不要用它做通信。

### 什么时候 ref 是合理的

| 场景 | 合理性 |
| --- | --- |
| 聚焦输入框、滚动到指定位置 | ✅ 只有 DOM API 能做到 |
| 调用子组件的 \`validate()\` | ✅ 表单校验的常规做法 |
| 读取子组件的内部状态 | ⚠️ 优先让子组件 emit 出来 |
| 修改子组件的内部状态 | ❌ 破坏封装 |
| 隔代访问祖先 | ❌ 用 provide / inject |

判断标准：**「命令式动作」适合 ref，「状态同步」不适合**。让视频播放、让输入框聚焦是动作；同步一个开关是状态。

### 组合式 API 里的写法

\`\`\`vue
<script setup>
import { ref, onMounted } from 'vue'
const inputRef = ref(null)

onMounted(() => {
  inputRef.value.focus()
})
</script>

<template>
  <input ref="inputRef" />
</template>
\`\`\`

变量名与模板里的 \`ref\` 值同名即可自动绑定，比 \`this.$refs\` 更直观（细节见 7.2）。

> 💡 定义 \`expose\` 可以限制子组件对外暴露什么：\`defineExpose({ validate })\`。默认 \`script setup\` 的组件是封闭的，父组件拿不到内部变量——这是好事。`
    },
    {
      no: 27,
      title: 'provide / inject 与订阅发布',
      lessons: '047–048',
      summary: '跨层级传值用 provide/inject；完全解耦的多方通信，用订阅发布（mitt）。',
      points: [
        'provide 在祖先组件提供，inject 在后代任意深度注入',
        '直接 provide 一个普通值不是响应式的，要传 ref 或 reactive',
        'inject 可给默认值，避免组件单独使用时崩溃',
        'mitt 适合非父子、无共同祖先的通信，注意及时解绑'
      ],
      body: `### 解决什么问题

三层组件传一个值，用 props 要中转两次，中间那层完全不关心这个值，却被迫声明。这就是「prop drilling」。\`provide / inject\` 让祖先直接把值放进去，后代按需取。

\`\`\`js
// 祖先组件
export default {
  data() {
    return { message: 'hello kerwin' }
  },
  provide() {
    return { message: this.message }     // ❌ 不是响应式的
  }
}
\`\`\`

\`\`\`js
// 任意深度的后代
export default {
  inject: ['message'],
  mounted() {
    console.log(this.message)           // 'hello kerwin'
  }
}
\`\`\`

### 关键：响应式要自己保证

\`provide\` 返回的是一个普通对象，\`this.message\` 在 provide 执行的那一刻就被取值了，后续变化不会传下去。两种修法：

\`\`\`js
// 方式一：provide 整个响应式对象（推荐）
provide() {
  return { config: this.config }        // config 是 reactive/observable 对象
}

// 方式二：provide 一个 getter 函数
provide() {
  return { getMessage: () => this.message }
}
\`\`\`

组合式 API 里更简单，直接 \`provide('key', ref(null))\` 即可，因为 ref 本身是响应式的（7.5）。

### inject 的默认值

\`\`\`js
export default {
  inject: {
    theme: { from: 'theme', default: 'light' }
  }
}
\`\`\`

不给默认值时，如果祖先没 provide，\`this.theme\` 是 \`undefined\`，模板里访问属性就会报错。给默认值能让组件在「脱离上下文」时依然可用。

| 对比 | props | provide / inject |
| --- | --- | --- |
| 传递层级 | 直接父子 | 任意深度 |
| 声明位置 | 使用处 | 组件内部 |
| 可追踪性 | 好（模板上能看见） | 差（隐式依赖） |
| 适用 | 组件 API | 上下文、主题、表单容器 |

> ⚠️ 别把 provide/inject 当全局状态用。它适合「一个页面 / 一个组件树内的上下文」，跨页面共享请用 Pinia（第 9 篇）。

### 订阅发布：彻底解耦

\`\`\`js
// eventBus.js
import mitt from 'mitt'
export const bus = mitt()

// A 组件：订阅
bus.on('search', (keyword) => { /* ... */ })

// B 组件：发布
bus.emit('search', 'vue')

// 组件卸载前一定要解绑，否则内存泄漏 + 重复执行
onUnmounted(() => bus.off('search'))
\`\`\`

它适合「搜索框通知多个区域刷新」这类**没有共同祖先**的场景。但缺点明显：事件名是字符串，IDE 无法跳转，调用链难追踪，事件多了就变成「谁在监听什么」的黑箱。

### 四种方案怎么选

| 场景 | 推荐 |
| --- | --- |
| 父传子 | props |
| 子传父 | emit |
| 隔代、上下文 | provide / inject |
| 无关系组件 / 全局事件 | mitt 或状态管理 |
| 跨页面共享状态 | Pinia |

一句话：**有明确父子关系的用 prop / emit，有明确祖先关系的用 provide/inject，其余用状态管理。** mitt 只在「一次性的跨区域通知」时才划算。`
    },
    {
      no: 28,
      title: '动态组件与 KeepAlive',
      lessons: '049',
      summary: 'component :is 切换组件；KeepAlive 让切换不销毁实例，代价是内存与状态陈旧。',
      points: [
        ':is 接组件名或组件对象，切换时默认销毁重建',
        'KeepAlive 缓存实例，激活时触发 activated',
        'include / exclude / max 控制缓存范围与数量',
        '缓存组件的 mounted 只执行一次，数据刷新要放 activated'
      ],
      body: `### 动态组件的写法

\`\`\`vue
<component :is="activeComponent" />
\`\`\`

\`activeComponent\` 可以是注册名（字符串）或组件对象。常用于 tab 切换、多步骤表单、按权限渲染不同视图。

默认行为是**切换即销毁**：组件实例、内部数据、滚动位置全部丢失。有时这正是我们想要的（不同业务互不干扰），但 tab 场景通常不希望如此。

### 用 KeepAlive 保住状态

\`\`\`vue
<KeepAlive>
  <component :is="activeComponent" />
</KeepAlive>
\`\`\`

被缓存的组件被切走时不销毁，只失活；切回来直接复用。生命周期也变了：

| 钩子 | 触发时机 |
| --- | --- |
| \`mounted\` | 只有第一次进入 |
| \`activated\` | 每次被激活（包括第一次） |
| \`deactivated\` | 每次被切走 |
| \`unmounted\` | 缓存被清除或组件销毁 |

**这是最容易出错的地方**：把「进入页面拉数据」写在 \`mounted\` 里，第二次进 tab 就不会刷新。应改写在 \`activated\`。

### 控制缓存范围

\`\`\`html
<!-- 逗号分隔的组件名 -->
<KeepAlive include="list,detail">
  <component :is="view" />
</KeepAlive>

<!-- 正则（需 v-bind） -->
<KeepAlive :include="/list|detail/">
  <component :is="view" />
</KeepAlive>

<!-- 数组（需 v-bind） -->
<KeepAlive :include="['list', 'detail']">
  <component :is="view" />
</KeepAlive>

<!-- 最多缓存 3 个，超出按 LRU 淘汰 -->
<KeepAlive :max="3">
  <component :is="view" />
</KeepAlive>
\`\`\`

\`include\` / \`exclude\` 匹配的是**组件的 name**，不是变量名也不是文件名。用 \`script setup\` 时组件名默认取文件名，需要显式声明就用 \`defineOptions({ name: 'List' })\`。

### 与路由配合

\`\`\`vue
<router-view v-slot="{ Component }">
  <KeepAlive :include="['List']">
    <component :is="Component" />
  </KeepAlive>
</router-view>
\`\`\`

这是后台系统「列表页返回后保留筛选条件」的标准做法。

### 缓存的代价

- **内存**：每个缓存实例都留着 DOM 与数据，\`max\` 是必要的护栏。
- **状态陈旧**：用户改了数据，缓存页还是旧列表，需要靠 \`activated\` 重新请求。
- **副作用未清理**：定时器、滚动监听在 \`deactivated\` 时要暂停，否则多个缓存页同时跑。

> 💡 判断要不要缓存：**「离开再回来，用户期望看到什么」**。期望原样保留 → 缓存；期望看到最新数据 → 不缓存，或者缓存 + \`activated\` 刷新。`
    },
    {
      no: 29,
      title: '组件上的 v-model',
      lessons: '050',
      summary: '组件 v-model 的约定是 modelValue + update:modelValue；它就是 :prop 加 @update:prop 的语法糖。',
      points: [
        'modelValue 是默认 prop，update:modelValue 是默认事件',
        'v-model:title 可以绑定多个具名双向流',
        '子组件不能直接改 prop，必须 emit 请求更新',
        '修饰符通过 modelModifiers 传入，可自定义行为'
      ],
      body: `### 从语法糖说起

\`\`\`html
<MyInput v-model="search" />
\`\`\`

等价于：

\`\`\`html
<MyInput :model-value="search" @update:model-value="search = $event" />
\`\`\`

所以子组件只要接住 \`modelValue\` 这个 prop，并在需要时 emit \`update:modelValue\`，就实现了双向绑定：

\`\`\`vue
<!-- MyInput.vue -->
<script>
export default {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  methods: {
    onInput(e) {
      this.$emit('update:modelValue', e.target.value)
    }
  }
}
</script>

<template>
  <input :value="modelValue" @input="onInput" />
</template>
\`\`\`

注意子组件**没有直接写 \`modelValue = ...\`**，而是发事件请父组件改。这就是「双向绑定仍然是单向数据流」的含义。

### 多个具名 v-model

\`\`\`html
<UserForm v-model:name="form.name" v-model:age="form.age" />
\`\`\`

\`\`\`js
export default {
  props: ['name', 'age'],
  emits: ['update:name', 'update:age']
}
\`\`\`

这解决了「一个组件有多组输入」的问题，比传一堆 \`@change\` 回调干净得多。也是 Vue 3 相对 Vue 2 的改进：Vue 2 的 \`.sync\` 修饰符被 \`v-model:xxx\` 取代。

### 修饰符

\`\`\`html
<MyInput v-model.trim="keyword" />
\`\`\`

子组件通过 \`modelModifiers\` 拿到修饰符对象：

\`\`\`js
props: {
  modelValue: String,
  modelModifiers: { default: () => ({}) }
},
methods: {
  onInput(e) {
    let val = e.target.value
    if (this.modelModifiers.trim) val = val.trim()
    this.$emit('update:modelValue', val)
  }
}
\`\`\`

具名 v-model 的修饰符 prop 名是 \`titleModifiers\`（即 \`xxxModifiers\`）。修饰符让组件能复用原生的 \`.trim\`、\`.number\` 语义，而不是每个使用方自己处理。

### 常见设计错误

| 错误 | 后果 |
| --- | --- |
| 子组件直接改 \`modelValue\` | 警告 + 父值被覆盖 |
| 忘记声明 \`emits\` | 事件落到 attrs，可能出现重复触发 |
| 事件名写成 \`update:modelvalue\` | 大小写不匹配，父组件收不到 |
| 用 \`v-model\` 传对象又原地修改 | 引用共享，父组件状态被隐式改写 |

> 💡 组件 \`v-model\` 的本质是「把 prop + 事件包装成赋值语法」。理解了这一层，\`v-model:xxx\`、修饰符、以及为什么不能双向改 prop，全都能推出来，不必再背。`
    },
    {
      no: 30,
      title: '异步组件：把代码切开',
      lessons: '051',
      summary: 'defineAsyncComponent 让组件在需要时才加载；配合 loading / error / timeout 才有完整体验。',
      points: [
        '异步组件把「加载」推迟到首次渲染',
        '需要 loader、loadingComponent、errorComponent、delay 配合',
        '常用于弹窗内的大组件、低频页面、图表库',
        '不是越多越好，切得太碎会增加请求数'
      ],
      body: `### 基本用法

\`\`\`js
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    AdminPage: defineAsyncComponent(() => import('./components/AdminPage.vue'))
  }
}
\`\`\`

组件在首次被渲染时才发起请求下载对应代码块。构建工具会自动把它拆成独立的 chunk。

### 带状态的写法

\`\`\`js
const AsyncComp = defineAsyncComponent({
  loader: () => import('./Foo.vue'),
  loadingComponent: LoadingComponent,   // 加载中显示
  delay: 200,                            // 200ms 后才显示 loading，避免闪烁
  errorComponent: ErrorComponent,        // 加载失败显示
  timeout: 3000                          // 超时按失败处理
})
\`\`\`

| 配置 | 作用 | 建议 |
| --- | --- | --- |
| \`delay\` | 延迟显示 loading | 200ms，太快会闪 |
| \`timeout\` | 超时阈值 | 与网络环境匹配，默认 Infinity 不推荐 |
| \`loadingComponent\` | 占位 | 用骨架屏比转圈体感好 |
| \`errorComponent\` | 失败兜底 | 提供「重试」按钮 |

### 什么时候值得异步

| 场景 | 是否值得 |
| --- | --- |
| 弹窗里的富文本编辑器 | ✅ 点开才加载 |
| 后台报表 / 图表库（体积大） | ✅ |
| 低频访问的二级页面 | ✅ |
| 首页首屏的导航、列表 | ❌ 反而增加等待 |
| 十几个小组件全部异步 | ❌ 请求数爆炸 |

判断依据：**这个组件是不是「首屏不需要、但体积不小」**。两个条件同时满足才划算。

### 与路由懒加载的关系

路由懒加载本质也是异步组件：

\`\`\`js
const routes = [{ path: '/about', component: () => import('./views/About.vue') }]
\`\`\`

区别在于「谁来触发加载」：路由是切换路由时触发，\`defineAsyncComponent\` 是渲染到该组件时触发。

### Suspense 的配合（实验性）

\`\`\`vue
<Suspense>
  <template #default><AsyncComp /></template>
  <template #fallback><Skeleton /></template>
</Suspense>
\`\`\`

可以统一等待多个异步依赖，但目前仍是实验特性，生产环境建议先用 \`loadingComponent\` 方案。

> ⚠️ 异步组件在「加载中」状态下，如果同时被卸载，可能出现竞态。需要在父层用 \`v-if\` 控制，或者确保 loader 里的逻辑可取消。`
    },
    {
      no: 31,
      title: '插槽：默认、具名与作用域',
      lessons: '052–054',
      summary: '插槽是组件的「内容占位」；具名插槽分配位置，作用域插槽把子组件数据反向交给父组件渲染。',
      points: [
        '默认插槽 <slot>，内容在父组件作用域中编译',
        '具名插槽用 name 分配位置，使用方用 #name',
        '作用域插槽用 <slot :data="x"> 把数据传出去',
        '插槽内容访问不到子组件内部数据，除非通过作用域',
        '插槽可以给默认内容作为兜底'
      ],
      body: `### 默认插槽：留一个位置

\`\`\`vue
<!-- FancyButton.vue -->
<template>
  <button class="fancy-btn">
    <slot>默认文案</slot>
  </button>
</template>
\`\`\`

\`\`\`html
<FancyButton>Click me!</FancyButton>
\`\`\`

\`<slot>\` 是出口，使用方写在标签内的内容会被放到这个位置。没写内容时显示 \`<slot>\` 内部的兜底内容。

### 作用域规则：这条最容易被忽略

\`\`\`html
<!-- 父组件模板 -->
<FancyButton>{{ parentMsg }}</FancyButton>
\`\`\`

这里的 \`parentMsg\` 属于**父组件**作用域——即使它最终渲染在子组件的 \`<button>\` 里。因为插槽内容是在父组件模板中编译的，遵循词法作用域：

> 父组件模板中的表达式只能访问父组件的作用域；子组件模板中的表达式只能访问子组件的作用域。

所以「在插槽里直接用子组件的 data」是做不到的，必须用作用域插槽。

### 具名插槽：分配位置

\`\`\`vue
<!-- BaseLayout.vue -->
<template>
  <div class="container">
    <header><slot name="header"></slot></header>
    <main><slot></slot></main>
    <footer><slot name="footer"></slot></footer>
  </div>
</template>
\`\`\`

\`\`\`html
<BaseLayout>
  <template #header>
    <h1>页面标题</h1>
  </template>

  <template #default>
    <p>主内容</p>
  </template>

  <template #footer>
    <p>联系信息</p>
  </template>
</BaseLayout>
\`\`\`

没有 \`name\` 的 \`<slot>\` 就是默认插槽，使用方用 \`#default\` 或直接写内容。所有未指定插槽的内容都进默认插槽。

### 作用域插槽：把子组件数据交出去

场景：列表组件负责取数据，但每行长什么样由使用方决定。

\`\`\`vue
<!-- Nowplaying.vue -->
<template>
  <slot :list="datalist" :loading="loading">
    <ul>
      <li v-for="item in datalist" :key="item.id">{{ item.nm }}</li>
    </ul>
  </slot>
</template>
\`\`\`

\`\`\`html
<!-- 使用方：拿到 list 自己渲染 -->
<Nowplaying v-slot="{ list, loading }">
  <ul v-if="!loading">
    <li v-for="item in list" :key="item.id">
      <div v-if="item.nm.includes(text)" style="font-size: 30px">{{ item.nm }}</div>
      <div v-else>{{ item.nm }}</div>
    </li>
  </ul>
</Nowplaying>
\`\`\`

这就是「逻辑在子组件、结构在父组件」的分工，也是表格、下拉选择器、树控件这类组件的标准设计。

| 插槽类型 | 子组件 | 使用方 | 用途 |
| --- | --- | --- | --- |
| 默认 | \`<slot>\` | 直接写内容 | 单一内容区 |
| 具名 | \`<slot name="x">\` | \`#x\` | 多区域布局 |
| 作用域 | \`<slot :data="d">\` | \`v-slot="{ data }"\` | 结构自定义 |

> 💡 \`v-slot\` 只能用在组件或 \`<template>\` 上。想给「多个插槽」都传作用域数据，用多个 \`<template #name="props">\`，各自声明。`
    }
  ]
});
