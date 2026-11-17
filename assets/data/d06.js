/* 第 6 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[32] = {
  deep: `### 一次挂载的真实调用顺序

组件首次渲染时，Vue 内部依次做：

\`\`\`text
setup()
  ↓  （初始化 props / 响应式，执行 setup 里的同步代码）
beforeMount
  ↓  （执行 render，得到子树 vnode）
  ↓  （递归 patch 子树：子组件在这里走完自己的 setup → mounted）
mounted
\`\`\`

父子组件的完整顺序是：

\`\`\`text
父 setup → 父 beforeMount → 子 setup → 子 beforeMount → 子 mounted → 父 mounted
\`\`\`

子组件的 \`mounted\` 先执行，因为**父的 DOM 要等子节点插入完成才算挂载完整**。这解释了一个常见问题：父组件在 \`mounted\` 里能访问子组件的 DOM，但子组件在 \`mounted\` 里读父组件的数据要小心——父可能还没完成挂载。

### created 阶段发请求为什么不会「卡住」

\`\`\`js
created() { this.fetchList() }
\`\`\`

\`fetchList\` 是 async 函数，第一次执行到 \`await\` 就返回了 Promise，控制权回到 Vue，Vue 继续编译与渲染。数据回来时，赋值触发重新渲染。所以：

- 首屏先呈现「空列表 + loading」，再补充数据；
- 如果你想「数据就绪再渲染」，需要用路由守卫或 \`Suspense\`（这也是它们的价值）。

### updated 为什么无法区分「哪次变化」

组件的 render 是一个 effect，它读了哪些数据，就依赖哪些数据。**任何**一个依赖变化都会重新执行整个 render，然后统一触发一次 \`updated\`。所以：

\`\`\`js
updated() {
  // 你不知道是 a 变了还是 b 变了
}
\`\`\`

需要「某个特定状态变化后做某事」时，用 \`watch\`（能拿到新旧值）或 \`nextTick\`（等 DOM 更新完），而不是在 \`updated\` 里判断。

### 卸载阶段：什么必须清

| 资源 | 不清理的后果 | 清理位置 |
| --- | --- | --- |
| \`setInterval\` | 定时器继续跑，报错/内存增长 | \`beforeUnmount\` |
| \`window.addEventListener\` | 回调持有旧实例，内存泄漏 | \`beforeUnmount\` |
| 第三方实例（图表、地图、轮播） | 内部监听与 canvas 不释放 | \`beforeUnmount\` |
| \`watch\` / \`computed\` / 模板事件 | Vue 自动清理 | 不需要手动 |

模板上的 \`@click\`、\`watch\`、\`computed\` 都挂在组件实例的 effect scope 上，卸载时会自动停止。而 \`window.addEventListener\` 是浏览器 API，Vue 不知道你加过。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <child v-if="show"></child>
  <button @click="show = !show">toggle</button>
</div>
<script>
  Vue.createApp({
    data: () => ({ show: true }),
    components: {
      child: {
        setup() { console.log('1 子 setup') },
        beforeMount() { console.log('2 子 beforeMount') },
        mounted() { console.log('3 子 mounted') },
        beforeUnmount() { console.log('4 子 beforeUnmount') },
        unmounted() { console.log('5 子 unmounted') },
        template: '<p>child</p>'
      }
    },
    beforeMount() { console.log('0 父 beforeMount') },
    mounted() { console.log('6 父 mounted') }
  }).mount('#app')
</script>
\`\`\`

> 💡 顺序是 \`0 → 1 → 2 → 3 → 6\`：父的 beforeMount 最先，子的 mounted 早于父的 mounted。点 toggle 卸载时是 \`4 → 5\`。把这个顺序记成「父开始、子完成、父收尾」，就不会再弄错在哪个钩子里拿 DOM。`,
  quiz: [
    { q: '父组件和子组件的 mounted，哪个先执行？为什么？', a: '子组件先。父的 DOM 要等子节点插入完成才算挂载完整，所以子的 mounted 早于父的 mounted。' },
    { q: '为什么 updated 里无法判断是哪个状态变化触发的？', a: '整个组件的 render 是一个 effect，任一依赖变化都会整体重渲染并只触发一次 updated，没有区分来源的信息。要区分就用 watch 或 nextTick。' },
    { q: '哪些资源必须手动清理，哪些 Vue 会自动清理？', a: '手动：setInterval、window/document 事件监听、第三方实例（图表/地图/轮播）。自动：模板事件、watch、computed（挂在组件 effect scope 上，随卸载停止）。' }
  ]
};

window.VUE_DEEP[33] = {
  deep: `### 为什么必须等数据到了再初始化

Swiper 初始化时会读取容器的 \`offsetWidth\` 来计算每个 slide 的位置。如果此时：

- 容器是 \`display: none\`（父级 v-show 或 tab 未激活）→ 宽度为 0；
- 容器还没有子元素（数据未到）→ 高度为 0，slide 数量为 0。

结果就是「轮播图空白、或只有一张、或拖动错位」。所以标准做法是 \`v-if="list.length"\`，让容器在有数据之后才创建，\`mounted\` 里再 \`new Swiper\`。

如果一定要用 \`v-show\`（比如想提前加载），就要在显示后手动 \`swiper.update()\`。

### 第三方实例的生命周期要对齐组件

\`\`\`js
mounted() { this.swiper = new Swiper(el, opts) },
beforeUnmount() { this.swiper && this.swiper.destroy(true, true) }
\`\`\`

\`destroy\` 会移除 DOM 上的事件监听、清理定时器、释放内部引用。不调用的话：

- 组件卸载了，Swiper 的 \`resize\` 监听还在，回调里访问已销毁的 DOM；
- 反复进出页面时，实例越积越多，滚动越来越卡。

判断标准：**凡是「new 出来、内部有事件监听或定时器」的东西，都要在 beforeUnmount 里 destroy**。

### loop 模式下索引的陷阱

\`\`\`js
this.$emit('slideChange', this.swiper.activeIndex)
\`\`\`

\`activeIndex\` 是**渲染顺序里的索引**（loop 模式会克隆首尾 slide），不等于数据数组的下标。要拿数据下标，用 \`realIndex\`：

\`\`\`js
this.$emit('slideChange', this.swiper.realIndex)
\`\`\`

这类「第三方库的索引语义」问题，是封装组件时最容易漏的一环：你以为传出去的是「第几个数据」，其实是「第几个 DOM」。

### 容器 + 子项的约定优于一个巨型组件

\`\`\`html
<MySwiper>
  <MySwiperItem v-for="..." />
</MySwiper>
\`\`\`

好处：

- 每一屏的结构由使用方决定（插槽天然支持）；
- 子项组件统一承担「必须有的 class」（如 \`swiper-slide\`），使用方不用记；
- 将来给每屏加统一包装（懒加载占位、点击埋点）只改一处。

代价是「两个组件必须配对使用」，需要用文档或警告提示（可以在 MySwiper 的 mounted 里检查子项数量）。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <button @click="show = !show">切换</button>
  <div v-show="show" ref="box" style="width: 300px; height: 100px; background: #eee">
    现在宽度：{{ width }}
  </div>
</div>
<script>
  Vue.createApp({
    data: () => ({ show: false, width: 0 }),
    mounted() { this.width = this.$refs.box.offsetWidth },
    methods: {}
  }).mount('#app')
</script>
\`\`\`

> 💡 初始 \`show = false\` 时，\`mounted\` 里读到的 \`offsetWidth\` 是 **0**（display:none 的元素没有布局）。把 \`v-show\` 换成 \`v-if\` 并把初始值改 true，再读一次，就是 300。这就是「为什么不能在隐藏容器里初始化轮播」。`,
  quiz: [
    { q: '在 display:none 的容器里初始化 Swiper 会发生什么？为什么？', a: 'offsetWidth 为 0，Swiper 算不出 slide 尺寸，表现为空白/错位/只有一张。必须在容器可见且有子元素后再初始化，或显示后调 swiper.update()。' },
    { q: '封装第三方组件时，为什么 beforeUnmount 里必须 destroy？', a: '第三方实例内部有事件监听、定时器与 DOM 引用，不销毁会在组件卸载后继续运行，造成内存泄漏与报错，反复进出页面会累积实例。' },
    { q: 'loop 模式下 activeIndex 与 realIndex 有什么区别？该传哪个出去？', a: 'activeIndex 是渲染顺序（含克隆 slide）的索引，realIndex 才对应数据数组下标。对外应传 realIndex，否则使用方拿到的「第几个」是错的。' }
  ]
};

window.VUE_DEEP[34] = {
  deep: `### 指令钩子与 patch 的关系

自定义指令的钩子不是「元素事件」，而是 patch 流程里的固定插入点：

| 钩子 | 在 patch 中的位置 |
| --- | --- |
| \`created\` | 元素属性应用到 DOM 之前（此时 el 还没插入文档） |
| \`beforeMount\` | 元素即将插入父节点前 |
| \`mounted\` | 元素已插入文档 |
| \`beforeUpdate\` | 所在组件更新前 |
| \`updated\` | 所在组件与其子节点更新后 |
| \`beforeUnmount\` / \`unmounted\` | 移除前后 |

所以 \`mounted\` 里能安全操作 DOM（有布局、可 focus），\`created\` 里不能。而 \`beforeUpdate\` 拿到的是**旧 DOM**（组件还没重新渲染）。

### binding 对象里有什么

\`\`\`html
<div v-color:bg.dark="'red'">
\`\`\`

\`\`\`js
{
  value: 'red',        // 等号右边表达式的值
  oldValue: undefined, // 上一次的值（仅 update 类钩子有）
  arg: 'bg',           // 冒号后的参数
  modifiers: { dark: true },  // 点后面的修饰符
  instance: 组件实例,   // 可访问组件上下文
}
\`\`\`

注意 \`value\` 可以是任意类型（对象、函数），不是字符串。这让指令能表达复杂配置：

\`\`\`html
<div v-intersect="{ handler: onVisible, threshold: 0.3 }">
\`\`\`

### 指令没有「自己的状态」，这是它与组件的根本区别

\`\`\`js
// 想在多次调用间保存状态，只能挂在 el 上
el.__timer = setInterval(...)
\`\`\`

因为指令只是一个对象 + 元素，没有独立实例。把状态挂到 \`el.__xxx\` 上是官方示例的做法，但要注意：

- 卸载时自己清理（\`unmounted\` 里 \`clearInterval(el.__timer)\`）；
- 命名加前缀，避免与别的库冲突；
- 不要依赖它在多次渲染间的稳定性（元素可能被重建）。

需要状态与复用逻辑时，组合式函数（\`useIntersect\`）通常比指令更合适——指令只适合「一次性贴到元素上的行为」。

### 权限指令不是安全措施

\`\`\`js
app.directive('auth', {
  mounted(el, binding) {
    if (!hasRole(binding.value)) el.remove()
  }
})
\`\`\`

它只是「隐藏按钮」，接口依然会对所有人开放。任何安全边界都必须在服务端。前端做的是体验优化（不给用户点无权限的按钮）。

### 动手验证（3 分钟）

\`\`\`html
<div id="app">
  <input v-focus placeholder="应该自动聚焦">
  <input placeholder="普通输入框">
</div>
<script>
  Vue.createApp({
    directives: {
      focus: {
        created(el) { console.log('created: 在文档里吗？', document.body.contains(el)) },
        mounted(el) { console.log('mounted: 在文档里吗？', document.body.contains(el)); el.focus() }
      }
    }
  }).mount('#app')
</script>
\`\`\`

> 💡 \`created\` 打印 false，\`mounted\` 打印 true。原生 \`autofocus\` 在动态插入的元素上经常失效（浏览器只在页面加载时处理一次），而指令在 \`mounted\` 里显式调用 \`focus()\`，所以可靠——这就是「指令比 HTML 属性更可控」的具体例子。`,
  quiz: [
    { q: '自定义指令的 mounted 与 created 钩子，此时元素在文档里吗？', a: 'created 时元素已创建但尚未插入文档（不能 focus、无布局）；mounted 时已插入文档，可安全操作 DOM。' },
    { q: '为什么自定义指令不适合保存跨调用的状态？', a: '指令只是配置对象 + 元素，没有独立实例作用域，状态只能挂在 el 上，且元素可能重建。需要状态与复用逻辑时用组合式函数更合适。' },
    { q: '用 v-auth 指令隐藏无权限按钮，能否作为安全措施？', a: '不能。它只是隐藏 DOM，接口仍然可被直接调用。权限校验必须在服务端，前端隐藏只用于体验。' }
  ]
};

window.VUE_DEEP[35] = {
  deep: `### 六个类名的添加时序，为什么要「等一帧」

进入过渡的实际步骤：

1. 元素插入 DOM，加上 \`v-enter-from\` + \`v-enter-active\`；
2. **强制一次样式计算**（读取 \`offsetHeight\` 或 \`getComputedStyle\`），让浏览器确认起始状态；
3. 下一帧移除 \`v-enter-from\`，加上 \`v-enter-to\`；
4. 过渡结束（\`transitionend\` 或 \`animationend\`），移除 active 与 to。

第 2 步是关键：如果起始状态和结束状态在同一帧内被设置，浏览器会认为「没有变化」，过渡不会触发。所以 Vue 必须插入一次样式读取来「卡住」起始状态——这也是为什么你在纯 CSS 里写 JS 动画时需要 \`requestAnimationFrame\`。

### 过渡什么时候算「结束」

Vue 会读取元素的 \`transition-duration\` / \`animation-duration\`（含 delay）来判断结束时间，并监听 \`transitionend\`。两个常见坑：

| 情况 | 表现 | 处理 |
| --- | --- | --- |
| \`transition: all\` + 多个属性 | 每个属性各触发一次 \`transitionend\`，Vue 可能提前判定 | 明确写属性名 |
| 只写了 \`animation\` 但没写时长 | Vue 拿不到时长，立即结束 | 在 CSS 里写清 duration |
| 元素被 \`display:none\` | 无过渡事件 | 改用 \`opacity/visibility\` |

### mode="out-in" 的实现

默认 enter 与 leave 同时进行。\`out-in\` 时 Vue 会：

1. 先执行 leave，等它的过渡结束；
2. 再插入新元素执行 enter。

代价是总时长变长（leave + enter），收益是避免两个元素重叠造成的「糊在一起」。切换路由、tab 内容时几乎都该用 \`out-in\`。

### 为什么 Transition 只能有一个子节点

它需要在「进入」与「离开」时精确控制那一个元素的类名与移除时机。多个子节点时无法确定给谁加类、等谁结束，会直接警告 \`<Transition> expects exactly one child element\`。

需要多个元素都动，用 \`TransitionGroup\`；需要条件切换，用 \`v-if / v-else\`（此时两个分支各自是单根，且要有不同 key）。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <button @click="show = !show">toggle</button>
  <transition name="fade">
    <p v-if="show" class="box">内容</p>
  </transition>
</div>
<style>
  .box { background: #eef; padding: 8px; }
  .fade-enter-active, .fade-leave-active { transition: opacity .4s ease; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
<script>
  const app = Vue.createApp({ data: () => ({ show: true }) }).mount('#app')
  const box = document.querySelector('.box') || document.querySelector('#app')
  new MutationObserver((ms) => {
    ms.forEach(m => { if (m.target.className) console.log(Date.now() % 100000, m.target.className) })
  }).observe(document.querySelector('#app'), { attributes: true, subtree: true, attributeFilter: ['class'] })
</script>
\`\`\`

> 💡 点 toggle，控制台会依次出现 \`fade-leave-from fade-leave-active\` → \`fade-leave-active fade-leave-to\` → 类名被移除。你能亲眼看到「先 from+active，再 to」这两步，而不是一次到位。`,
  quiz: [
    { q: '进入过渡时，为什么要「等一帧」再移除 enter-from？', a: '起始与结束状态若在同一帧设置，浏览器认为没有变化，不会触发过渡。必须强制一次样式计算，让起始状态生效后再切到结束状态。' },
    { q: 'transition: all 为什么可能导致过渡提前结束？', a: '每个属性变化都会触发 transitionend，Vue 读到第一个事件就可能判定结束。应明确写过渡属性名，避免 all。' },
    { q: 'mode="out-in" 的作用与代价是什么？', a: '先等离开动画结束再执行进入动画，避免两个元素重叠；代价是总时长变长（leave + enter 相加）。' }
  ]
};

window.VUE_DEEP[36] = {
  deep: `### FLIP 的四步，解释了 move 类为什么有效

列表项位置变化时，浏览器直接重排，元素会「瞬间跳过去」。要做成滑动，Vue 用 FLIP：

1. **First**：在变更前记录每个元素的旧位置（\`getBoundingClientRect\`）。
2. **Last**：变更后立刻读新位置。
3. **Invert**：给元素设置 \`transform: translate(旧 - 新)\`，让它视觉上还在旧位置。
4. **Play**：下一帧把 transform 设为 0，配合 transition 就是「滑过去」。

Vue 在内部完成 1–3 步，把最终的 \`transform\` 写在元素上，然后加上 \`*-move\` 类。**你只需要给这个类写 transition**：

\`\`\`css
.list-move { transition: transform .5s ease; }
\`\`\`

如果没有这条 CSS，第 4 步的 transform 变化会在同一帧内完成，看不到动画。

### 为什么 leave-active 要 position: absolute

离开的元素默认还占着文档流位置。于是在它淡出的过程中，其他元素「以为它还在」，不会移动；等它彻底移除，其他元素才瞬间跳位——FLIP 计算的位移就是 0，动画失效。

设成 \`position: absolute\` 后，离开的元素脱离文档流，其余元素立刻占位，FLIP 才有位移可做。

\`\`\`css
.list-leave-active { position: absolute; }
\`\`\`

代价是：绝对定位的元素会脱离容器宽度约束，需要给容器 \`position: relative\`，否则可能飞出容器。

### 为什么每项必须有唯一 key

移动动画靠「同一个 key 的元素从哪来到哪去」计算。key 不唯一或每次变化时：

- 重复 key：FLIP 找不到唯一对应，动画错乱或警告；
- 索引作 key：删除中间项时，后续元素被视为「内容变化」而非「位置变化」，不触发 move。

所以 \`TransitionGroup\` 对 key 的要求比普通 \`v-for\` 更严格。

### TransitionGroup 与 Transition 的差异清单

| 能力 | Transition | TransitionGroup |
| --- | --- | --- |
| 子节点数量 | 必须一个 | 多个 |
| 容器 | 无 | 默认无，可 \`tag\` |
| 移动动画 | 不支持 | 支持（FLIP） |
| mode | 支持 | **不支持** |
| 类名作用对象 | 子元素 | 子元素（不是容器） |

\`mode\` 不支持的原因很直接：列表里元素是共存的，不存在「互斥切换」。

### 动手验证（4 分钟）

\`\`\`html
<div id="app">
  <button @click="shuffle">打乱顺序</button>
  <transition-group name="list" tag="ul">
    <li v-for="n in items" :key="n" class="item">{{ n }}</li>
  </transition-group>
</div>
<style>
  .item { padding: 6px 10px; margin: 4px; background: #eef; display: inline-block; }
  .list-move { transition: transform .6s ease; }
</style>
<script>
  Vue.createApp({
    data: () => ({ items: [1, 2, 3, 4, 5, 6] }),
    methods: { shuffle() { this.items.sort(() => Math.random() - 0.5) } }
  }).mount('#app')
</script>
\`\`\`

> 💡 点「打乱顺序」，方块会平滑滑到新位置（move 类生效）。把 \`.list-move\` 的 transition 删掉再点，位置会瞬间跳变——说明 FLIP 只是把 transform 写上去，动画时长完全由你的 CSS 决定。`,
  quiz: [
    { q: 'FLIP 的四步分别是什么？Vue 替你做了哪几步？', a: 'First 记录旧位置、Last 读新位置、Invert 用 transform 反向偏移、Play 过渡回 0。Vue 做了前三步并加上 *-move 类，你只需写 transition。' },
    { q: '为什么列表离开动画要给 *-leave-active 加 position: absolute？', a: '不脱离文档流时，离开元素仍占位，其他元素不会移动，FLIP 位移为 0，移动动画失效。绝对定位让它立刻让出位置。' },
    { q: 'TransitionGroup 为什么不支持 mode="out-in"？', a: 'mode 用于互斥元素的切换（一个走一个来），而列表中的元素是共存关系，不存在互斥切换的语义。' }
  ]
};
