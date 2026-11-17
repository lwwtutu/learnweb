/* 第 6 篇 · 生命周期与可复用能力 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p6',
  order: 6,
  title: '生命周期与可复用能力',
  range: '055–065',
  desc: '组件从创建到卸载的每个阶段、封装一个轮播组件的完整过程、指令与过渡',
  chapters: [
    {
      no: 32,
      title: '生命周期：八个阶段与两个陷阱',
      lessons: '055–057',
      summary: '生命周期是「框架在什么时机调用你」；放错阶段，代码看似正常却拿不到数据或泄漏资源。',
      points: [
        '创建阶段 data / computed / methods 就绪，但还没有 $el',
        'mounted 之后才能访问 DOM，第三方库在这里初始化',
        'updated 里改状态可能死循环，需要条件判断或 nextTick',
        'beforeUnmount 必须清理定时器、监听器与实例'
      ],
      body: `### 一张表看清八个钩子

| 钩子 | 此时已就绪 | 典型用途 |
| --- | --- | --- |
| \`beforeCreate\` | 什么都没有 | 极少用 |
| \`created\` | 响应式数据、计算属性、方法、侦听器 | 发起初始请求（无 DOM） |
| \`beforeMount\` | 模板已编译，未挂载 | 极少用 |
| \`mounted\` | 真实 DOM 已渲染 | 操作 DOM、初始化 Swiper / ECharts |
| \`beforeUpdate\` | 数据已新、DOM 还旧 | 读取更新前的 DOM 状态 |
| \`updated\` | DOM 已更新 | 依赖 DOM 的收尾动作 |
| \`beforeUnmount\` | 实例功能完整 | 清定时器、解绑事件、销毁实例 |
| \`unmounted\` | 已卸载 | 释放内存引用 |

### 创建阶段：数据有了，DOM 没有

\`created\` 执行时，\`data\`、\`computed\`、\`methods\`、\`watch\` 都已就绪，但 \`$el\` 不存在。所以「进页面拉数据」可以放这里，而「拿 DOM 高度」不行。

\`\`\`js
export default {
  created() {
    this.fetchList()          // ✅ 不依赖 DOM
  },
  mounted() {
    console.log(this.$el)     // ✅ 此时才有
  }
}
\`\`\`

### 挂载阶段：第三方库的唯一正确位置

\`\`\`js
mounted() {
  this.mySwiper = new Swiper('.swiper', {
    loop: this.loop,
    pagination: { el: '.swiper-pagination' },
    on: {
      slideChange: () => this.$emit('slideChange', this.mySwiper.activeIndex)
    }
  })
}
\`\`\`

Swiper、ECharts、地图 SDK 都需要真实 DOM 容器，只能在 \`mounted\` 初始化。同时要记得在 \`beforeUnmount\` 销毁：

\`\`\`js
beforeUnmount() {
  this.mySwiper && this.mySwiper.destroy()
}
\`\`\`

不销毁的后果是：组件切走后实例还在监听 resize，内存持续增长。

### 更新阶段：两个陷阱

**陷阱一：在 \`updated\` 里改状态。**

\`\`\`js
updated() {
  this.count++      // ❌ 触发新一轮更新 → 无限循环
}
\`\`\`

如果确实需要，用条件卡住：

\`\`\`js
updated() {
  if (this.count < 5) this.count++
}
\`\`\`

**陷阱二：想在「某个状态改完后」拿 DOM。**

\`updated\` 是所有更新共用的，无法区分是哪次状态变化引起的。正确工具是 \`nextTick\`：

\`\`\`js
methods: {
  async add() {
    this.list.push('new')
    await this.$nextTick()
    // 此时新 DOM 已经渲染，可以滚动到底部
  }
}
\`\`\`

### 卸载阶段：清干净

\`\`\`js
beforeUnmount() {
  clearInterval(this.timer)
  window.removeEventListener('resize', this.onResize)
  this.chart && this.chart.dispose()
}
\`\`\`

三类资源必须手动清理：定时器、全局事件监听、第三方实例。Vue 自己绑定的模板事件会自动解绑，不需要操心。

### 父子组件的执行顺序

挂载：父 \`beforeMount\` → 子 \`beforeMount\` → 子 \`mounted\` → 父 \`mounted\`。
卸载：父 \`beforeUnmount\` → 子 \`beforeUnmount\` → 子 \`unmounted\` → 父 \`unmounted\`。

所以父组件的 \`mounted\` 里访问子组件 ref 是安全的（子已挂载完），但子组件 \`mounted\` 里访问父组件的数据要小心：父可能还没挂载完。

> 💡 \`KeepAlive\` 内的组件多两个钩子：\`activated\` / \`deactivated\`。缓存场景下，「进入页面刷新」要写在 \`activated\` 而不是 \`mounted\`。`
    },
    {
      no: 33,
      title: '实战：封装一个轮播组件',
      lessons: '058–060',
      summary: '把 Swiper 包成组件要解决三件事：容器时机、参数透传、事件回传；再用插槽把结构交出去。',
      points: [
        '第三方库只能在 mounted 初始化，卸载前 destroy',
        '父组件传数据可能晚于子组件挂载，用 v-if 等数据就绪',
        '内部事件通过 $emit 转成组件事件',
        '子组件组合（Swiper + SwiperItem）比单组件暴露更多 API 更清晰'
      ],
      body: `### 需求拆解

一个可用的轮播要满足：

1. 使用方只管传数据，不用碰 Swiper 的 API。
2. 支持 \`loop\`、分页器等常用配置。
3. 切换时能通知外部（拿到当前索引）。
4. 数据还没到时不要初始化（否则容器宽度为 0，Swiper 计算错乱）。

### 先看单组件版本

\`\`\`vue
<!-- MySwiper.vue -->
<script>
import Swiper from 'swiper/bundle'
import 'swiper/css/bundle'

export default {
  props: ['loop'],
  mounted() {
    this.mySwiper = new Swiper('.swiper', {
      loop: this.loop,
      pagination: { el: '.swiper-pagination' },
      on: {
        slideChange: () => {
          this.$emit('slideChange', this.mySwiper.activeIndex)
        }
      }
    })
  },
  beforeUnmount() {
    this.mySwiper && this.mySwiper.destroy()
  }
}
</script>

<template>
  <div class="swiper">
    <div class="swiper-wrapper">
      <slot></slot>
    </div>
    <div class="swiper-pagination"></div>
  </div>
</template>
\`\`\`

\`\`\`vue
<!-- 使用方 -->
<MySwiper v-if="datalist.length" :loop="false" @slideChange="onSlideChange">
  <div class="swiper-slide" v-for="item in datalist" :key="item.id">{{ item }}</div>
</MySwiper>
\`\`\`

三个要点：

- \`v-if="datalist.length"\`：数据为空时不渲染，避免在宽度 0 的容器上初始化。
- \`slot\` 让使用方自己决定每一屏的内容。
- \`@slideChange\` 把 Swiper 的回调翻译成组件事件。

### 为什么还要拆出 SwiperItem

\`\`\`vue
<!-- MySwiperItem.vue -->
<template>
  <div class="swiper-slide">
    <slot></slot>
  </div>
</template>
\`\`\`

不拆也能用（直接写 \`div.swiper-slide\`），但拆出来有两个好处：使用方不必记 class 名；后续要给每屏加统一包裹层（如懒加载占位）时，只改一处。

这也是组件库的常见模式：**容器组件 + 子项组件**，通过约定的父子关系协作（如 \`<select>\` 与 \`<option>\`）。

### 参数与事件的设计

| 对外暴露 | 类型 | 说明 |
| --- | --- | --- |
| \`loop\` | prop | 是否循环 |
| \`autoplay\` | prop | 自动播放间隔，0 表示不播 |
| \`slideChange\` | 事件 | 参数为当前索引 |
| \`prev\` / \`next\` | 方法（暴露） | 外部遥控 |

不要把 Swiper 的整个 options 对象透传出去——那等于把第三方 API 变成自己的 API，将来换库就要改所有调用方。

### 数据晚到的两种处理

\`\`\`js
mounted() {
  setTimeout(() => {
    this.datalist = [11, 22, 33, 44]
  }, 2000)
}
\`\`\`

父组件异步拿到数据是最常见的场景。除了 \`v-if\`，还可以用 \`watch\` 监听数据变化后再初始化：

\`\`\`js
watch: {
  datalist() {
    this.$nextTick(() => this.initSwiper())
  }
}
\`\`\`

\`$nextTick\` 不能少：数据变化到 DOM 渲染完成之间有一个微任务间隔，直接初始化拿到的还是旧 DOM。

> ⚠️ 轮播组件最容易出的 bug 是「容器宽度为 0」。排查顺序：外层是否 \`display: none\`、父容器是否未设宽、是否在 \`mounted\` 前初始化。`
    },
    {
      no: 34,
      title: '自定义指令：复用 DOM 操作',
      lessons: '061–062',
      summary: '指令用于「底层 DOM 行为复用」；能用组件解决的别用指令，指令的优势是贴在元素上。',
      points: [
        '全局 app.directive，局部 directives 选项',
        '钩子：created / beforeMount / mounted / beforeUpdate / updated / beforeUnmount / unmounted',
        'mounted 与 updated 行为相同时可简写为函数',
        '常用场景：自动聚焦、复制、权限控制、图片懒加载'
      ],
      body: `### 什么时候需要指令

组件复用「结构 + 逻辑」，指令复用「对元素的底层操作」。典型需求：输入框自动聚焦、按钮级权限、点击外部关闭、图片懒加载——它们都是「给某个元素附加一个行为」，不需要额外结构。

\`\`\`js
// 全局注册
const app = createApp({})
app.directive('focus', {
  mounted(el) { el.focus() }
})
\`\`\`

\`\`\`js
// 局部注册
const focus = { mounted: (el) => el.focus() }

export default {
  directives: { focus }
}
\`\`\`

\`\`\`html
<input v-focus />
\`\`\`

### 七个钩子与四个参数

\`\`\`js
const myDirective = {
  created(el, binding, vnode, prevVnode) {},        // 属性应用前
  beforeMount(el, binding) {},                      // 插入 DOM 前
  mounted(el, binding) {},                          // 挂载完成
  beforeUpdate(el, binding) {},                     // 父组件更新前
  updated(el, binding) {},                          // 更新完成
  beforeUnmount(el, binding) {},
  unmounted(el, binding) {}
}
\`\`\`

\`binding\` 对象里最常用的四个字段：

| 字段 | 含义 | 例子（\`v-color="'red'"\`） |
| --- | --- | --- |
| \`value\` | 指令的值 | \`'red'\` |
| \`arg\` | 冒号后的参数 | \`v-color:bg\` → \`'bg'\` |
| \`modifiers\` | 点修饰符 | \`v-color.dark\` → \`{ dark: true }\` |
| \`oldValue\` | 上一次的值 | 仅 update 类钩子有 |

### 简写形式

只关心 \`mounted\` 与 \`updated\`，且行为一致时，可以直接写函数：

\`\`\`js
app.directive('color', (el, binding) => {
  el.style.color = binding.value
})
\`\`\`

这个简写是官方推荐的默认形态，绝大多数指令都用它。

### 三个实战指令

**权限控制（隐藏无权限按钮）：**

\`\`\`js
app.directive('auth', {
  mounted(el, binding) {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]')
    if (!roles.includes(binding.value)) el.parentNode && el.parentNode.removeChild(el)
  }
})
\`\`\`

\`\`\`html
<button v-auth="'admin'">删除</button>
\`\`\`

> ⚠️ 前端隐藏只是体验优化，接口必须做权限校验。改 DOM 隐藏不了数据。

**点击外部关闭：**

\`\`\`js
app.directive('click-outside', {
  mounted(el, binding) {
    el.__handler = (e) => {
      if (!el.contains(e.target)) binding.value(e)
    }
    document.addEventListener('click', el.__handler)
  },
  unmounted(el) {
    document.removeEventListener('click', el.__handler)
  }
})
\`\`\`

**图片懒加载：**

\`\`\`js
app.directive('lazy', {
  mounted(el, binding) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.src = binding.value
        io.disconnect()
      }
    })
    io.observe(el)
  }
})
\`\`\`

### 指令 vs 组件

| | 指令 | 组件 |
| --- | --- | --- |
| 复用内容 | 元素上的行为 | 结构 + 逻辑 + 样式 |
| 使用方式 | \`v-xxx\` | \`<Xxx />\` |
| 适合 | 聚焦、权限、复制、懒加载 | 有 UI 的内容块 |
| 不适合 | 需要渲染结构的场景 | 只为一个元素加行为 |

判断标准：**需求里有没有新的 DOM 结构**。有就写组件，没有才考虑指令。`
    },
    {
      no: 35,
      title: '过渡：Transition 的六个类名',
      lessons: '063',
      summary: '进入与离开各三个阶段，共六个类名；理解时序就能写出任意动画。',
      points: [
        'v-enter-from / v-enter-active / v-enter-to 控制进入',
        'v-leave-from / v-leave-active / v-leave-to 控制离开',
        'mode="out-in" 让旧元素先走、新元素再来',
        'JS 钩子可接第三方动画库，需调用 done 回调'
      ],
      body: `### 最小可用示例

\`\`\`vue
<Transition name="fade">
  <p v-if="show">hello</p>
</Transition>
\`\`\`

\`\`\`css
.fade-enter-active, .fade-leave-active { transition: opacity .3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
\`\`\`

\`name="fade"\` 决定了类名前缀；不写则用 \`v-\`。

### 六个类名的时序

进入时：

1. 加上 \`fade-enter-from\` 与 \`fade-enter-active\`（一帧）
2. 移除 \`enter-from\`，加上 \`fade-enter-to\`
3. 过渡结束，移除 \`enter-active\` 与 \`enter-to\`

离开时同理，把 \`enter\` 换成 \`leave\`。

| 类名 | 作用 | 写什么 |
| --- | --- | --- |
| \`*-enter-from\` | 进入起点 | 初始状态（透明、位移） |
| \`*-enter-active\` | 进入过程 | transition / animation |
| \`*-enter-to\` | 进入终点 | 通常不用写 |
| \`*-leave-from\` | 离开起点 | 通常不用写 |
| \`*-leave-active\` | 离开过程 | transition / animation |
| \`*-leave-to\` | 离开终点 | 结束状态 |

记住一句话：**active 管时长与缓动，from / to 管首尾状态**。

### 过渡模式

默认情况下，进入与离开**同时发生**，两个元素会重叠。切换路由或 tab 时视觉会糊：

\`\`\`vue
<Transition name="slide" mode="out-in">
  <component :is="current" />
</Transition>
\`\`\`

| 模式 | 行为 | 适用 |
| --- | --- | --- |
| \`out-in\` | 先离开再进入 | 内容互斥的切换（最常用） |
| \`in-out\` | 先进入再离开 | 少见，容易视觉拥挤 |
| 不写 | 同时进行 | 两个元素需要交叉淡入淡出 |

### JS 钩子

需要接 GSAP、anime.js 时用钩子：

\`\`\`vue
<Transition
  @before-enter="onBeforeEnter"
  @enter="onEnter"
  @after-enter="onAfterEnter"
  @before-leave="onBeforeLeave"
  @leave="onLeave"
  @after-leave="onAfterLeave"
>
  <div v-if="show">content</div>
</Transition>
\`\`\`

\`\`\`js
methods: {
  onEnter(el, done) {
    gsap.to(el, { opacity: 1, duration: 0.4, onComplete: done })
  }
}
\`\`\`

\`done\` 必须调用，否则 Vue 不知道动画何时结束，元素会一直停留在过渡状态。用 \`:css="false"\` 可以显式关闭 CSS 过渡检测。

### 首次渲染也要动画

\`\`\`vue
<Transition appear>
  <p>首次出现也有动画</p>
</Transition>
\`\`\`

默认 \`Transition\` 只在「插入 / 移除」时生效，页面初次加载不触发；加 \`appear\` 才生效。

> 💡 多个元素要动画时，每个分支必须有**唯一的 key**，否则 Vue 会当作同一个元素做内容更新，不会触发过渡。`
    },
    {
      no: 36,
      title: '列表过渡与可复用过渡组件',
      lessons: '064–065',
      summary: 'TransitionGroup 处理增删与移动；FLIP 让剩余元素平滑位移，包装成组件即可全站复用。',
      points: [
        'TransitionGroup 默认不渲染容器，用 tag 指定',
        '每项必须有唯一 key，否则移动动画失效',
        '*-move 类配合 position: absolute 实现平滑位移',
        '过渡逻辑可包装成组件，插槽向内传递内容'
      ],
      body: `### 从 Transition 到 TransitionGroup

\`Transition\` 只管单个元素的进出；列表的增删、排序要 \`TransitionGroup\`：

\`\`\`vue
<TransitionGroup name="list" tag="ul">
  <li v-for="item in items" :key="item">{{ item }}</li>
</TransitionGroup>
\`\`\`

与 \`Transition\` 的三点差别：

| 差异 | Transition | TransitionGroup |
| --- | --- | --- |
| 容器 | 无（直接包元素） | 默认无，用 \`tag\` 指定 |
| 子节点 | 单个 | 多个，必须唯一 key |
| 移动动画 | 不支持 | 支持（FLIP） |
| \`mode\` | 支持 | 不支持（元素共存） |

### FLIP 与移动动画

当某一项被删除，其余项会「跳」到新位置——因为浏览器直接重排了。要让它们滑过去，需要：

\`\`\`css
.list-move {
  transition: transform .5s ease;
}

/* 离开的元素脱离文档流，否则占位导致计算错误 */
.list-leave-active {
  position: absolute;
}
\`\`\`

原理是 FLIP（First, Last, Invert, Play）：先记录旧位置，再记录新位置，用 transform 反向偏移回旧位置，最后过渡到 0。Vue 内部算好了 transform，你只需要给 \`.list-move\` 写 transition。

### 完整示例

\`\`\`vue
<script>
export default {
  data() {
    return { items: [1, 2, 3, 4, 5], next: 6 }
  },
  methods: {
    add() { this.items.push(this.next++) },
    remove(i) { this.items.splice(i, 1) }
  }
}
</script>

<template>
  <button @click="add">添加</button>
  <TransitionGroup name="list" tag="ul">
    <li v-for="(item, i) in items" :key="item" @click="remove(i)">{{ item }}</li>
  </TransitionGroup>
</template>
\`\`\`

### 封装成可复用组件

全站都要一套「淡入 + 上移」的效果，逐处写 CSS 太啰嗦，包一层：

\`\`\`vue
<!-- MyTransition.vue -->
<script>
export default {
  methods: {
    onEnter(el, done) { /* 自定义逻辑 */ done() }
  }
}
</script>

<template>
  <Transition name="my-transition" @enter="onEnter">
    <slot></slot>
  </Transition>
</template>

<style>
/* 注意：不要用 scoped，否则样式作用不到插槽内容 */
.my-transition-enter-active, .my-transition-leave-active { transition: all .3s ease; }
.my-transition-enter-from, .my-transition-leave-to { opacity: 0; transform: translateY(12px); }
</style>
\`\`\`

\`\`\`html
<MyTransition>
  <div v-if="show">Hello</div>
</MyTransition>
\`\`\`

**最关键的细节**：\`<style scoped>\` 会给选择器加属性，而插槽内容的元素属于父组件，匹配不上，动画直接失效。这是自定义过渡组件最常见的坑。

> 💡 列表项有内部状态（输入框、勾选）时，\`key\` 一定要用稳定 id。用 index 做 key 会让「删除中间项」变成整列内容重排，动画与状态都会错乱。`
    }
  ]
});
