/* 第 3 篇 · 交互与数据 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p3',
  order: 3,
  title: '交互与数据',
  range: '018–033',
  desc: '事件、表单、计算属性、侦听器与数据请求，把静态模板变成能用的应用',
  chapters: [
    {
      no: 12,
      title: '事件处理：内联与方法',
      lessons: '018–019',
      summary: '内联写法适合一句话逻辑，方法写法适合复用；修饰符把常见的事件处理变成声明。',
      points: [
        '内联：@click="count++" 直接在模板里执行表达式',
        '方法：@click="fn" 传函数引用，@click="fn()" 立即执行',
        '修饰符 .stop/.prevent/.self/.once/.passive 声明式替代手写',
        '.enter 等按键修饰符省去判断 e.key'
      ],
      body: `### 两种写法，区别在「传什么」

\`\`\`html
<!-- 内联：值是一个表达式，运行时求值 -->
<button @click="count++">加一</button>
<button @click="test('hello')">test hello</button>

<!-- 方法：值是一个函数引用，事件对象自动作为参数 -->
<button @click="test">test</button>
\`\`\`

关键差别：\`@click="test"\`（无括号）传的是函数本身，Vue 调用它时把 \`$event\` 作为第一个参数；\`@click="test()"\` 带括号时会**立即求值**，得到函数返回值，就没有「延迟执行」了。要既传参又拿到事件对象，用 \`$event\`：

\`\`\`html
<button @click="del(item.id, $event)">删除</button>
\`\`\`

### 内联 vs 方法怎么选

| 场景 | 写法 |
| --- | --- |
| 自增、取反、赋一个常量 | 内联 |
| 需要三行以上逻辑 | 方法 |
| 多个元素复用同一段逻辑 | 方法 |
| 需要单测的逻辑 | 方法（或组合式函数） |

判断标准是**这段逻辑会不会被复用或被测试**，不是「代码长短」。

### 修饰符：把 if 变成声明

原生写法里，阻止冒泡要写 \`e.stopPropagation()\`，阻止默认行为要写 \`e.preventDefault()\`。Vue 提供修饰符，直接挂在事件名后面：

\`\`\`html
<a @click.prevent="onSubmit" href="/api">提交</a>
<div @click.self="close">点空白关闭</div>
<button @click.once="pay">支付</button>
<ul @scroll.passive="onScroll">...</ul>
\`\`\`

| 修饰符 | 等价于 | 典型场景 |
| --- | --- | --- |
| \`.stop\` | \`e.stopPropagation()\` | 弹窗内部点击不关闭 |
| \`.prevent\` | \`e.preventDefault()\` | 阻止表单提交、链接跳转 |
| \`.self\` | 判断 \`e.target === e.currentTarget\` | 只在点自身时触发 |
| \`.capture\` | 捕获阶段监听 | 需要在冒泡前处理 |
| \`.once\` | 只触发一次 | 支付、领取、初始化 |
| \`.passive\` | \`{ passive: true }\` | 滚动性能优化，不能与 \`.prevent\` 同用 |

修饰符可以串联：\`@click.stop.prevent\` 表示两者都要。顺序会影响结果，因为会依次执行。

### 按键与系统修饰符

\`\`\`html
<input @keyup.enter="submit" />
<input @keyup.esc="clear" />
<button @click.ctrl="multiSelect">按住 Ctrl 点击</button>
<button @click.ctrl.exact="onlyCtrl">只按 Ctrl 才触发</button>
\`\`\`

\`.delete\` 同时捕获 Delete 与 Backspace 两个键；\`.exact\` 用于要求「只有这些修饰键」，否则 \`@click.ctrl\` 在 Ctrl+Shift 时也会触发。

> ⚠️ 表单提交用的是 \`@submit.prevent\`，不是 \`@click.prevent\`。按钮点击后表单仍会走原生提交，页面刷新导致状态全丢——这是新手最常遇到的「数据怎么没了」。

### 事件回调里的 this

选项式 API 中，methods 里写普通函数，\`this\` 指向组件实例；写成箭头函数就丢了：

\`\`\`js
methods: {
  handleClick() { this.count++ },        // ✅
  handleClick2: () => { this.count++ }   // ❌ this 不是组件实例
}
\`\`\`

组合式 API 没有这个问题，因为 \`setup\` 里根本不用 \`this\`，直接引用变量即可（第 7 篇）。`
    },
    {
      no: 13,
      title: '表单输入绑定：v-model 的真身',
      lessons: '021、024',
      summary: 'v-model 是语法糖：文本框绑 value + input，复选框绑 checked + change，选择器绑 value。',
      points: [
        '文本用 value，复选框用 checked，单选与下拉用 value',
        '复选框绑数组表示多选，绑布尔表示单个开关',
        '.lazy 改成 change 后同步，.number 转数字，.trim 去空格',
        '自定义组件的 v-model 约定是 modelValue + update:modelValue'
      ],
      body: `### 四种控件，四种绑定目标

| 控件 | 绑定属性 | 绑定事件 | 值类型 |
| --- | --- | --- | --- |
| \`<input type="text">\` | \`value\` | \`input\` | 字符串 |
| \`<input type="checkbox">\` | \`checked\` | \`change\` | 布尔 / 数组 |
| \`<input type="radio">\` | \`checked\` | \`change\` | 与 \`value\` 相同的值 |
| \`<select>\` | \`value\` | \`change\` | 选中项的 \`value\` |

\`\`\`html
<input v-model="message" placeholder="edit me" />
<input type="checkbox" v-model="checked" />
<input type="radio" value="One" v-model="picked" />
<select v-model="selected">
  <option disabled value="">请选择</option>
  <option>A</option>
  <option>B</option>
</select>
\`\`\`

单选与多选的差别只看一个地方：**复选框绑数组就是多选，绑布尔就是单个开关**。

\`\`\`html
<!-- 多选：勾选后数组里出现对应的 value -->
<input type="checkbox" value="apple" v-model="fruits" />
<input type="checkbox" value="pear" v-model="fruits" />
\`\`\`

### v-model 等价于什么

\`\`\`html
<input v-model="msg" />
<!-- 编译后大致等价于 -->
<input :value="msg" @input="msg = $event.target.value" />
\`\`\`

理解这个等价关系后，两件事就顺理成章：为什么 \`v-model\` 只能用在表单控件或组件上（普通 div 没有 value 与 input），以及为什么自定义组件要约定 \`modelValue\` 与 \`update:modelValue\`（第 5.5 章）。

### 三个修饰符解决三个小麻烦

\`\`\`html
<input v-model.lazy="msg" />     <!-- 失去焦点或回车才同步 -->
<input v-model.number="age" />   <!-- 自动转数字 -->
<input v-model.trim="msg" />     <!-- 去掉首尾空格 -->
\`\`\`

- \`.lazy\`：把 \`input\` 事件换成 \`change\`。适合搜索框之外、需要「确认后才生效」的字段，能减少无谓的校验。
- \`.number\`：输入 \`"12"\` 自动变 \`12\`。注意 \`type="number"\` 时会自动启用；如果转换失败会原样返回字符串，不要假设一定是数字。
- \`.trim\`：适合用户名、邮箱这类字段，避免「看起来一样但登录失败」。

> ⚠️ \`.number\` 不是万能的：输入框里打 \`12abc\` 得到的是字符串 \`'12abc'\`，不是 \`12\`。真正需要数值时在业务层再转一次，别依赖修饰符兜底。

### 值绑定的特殊写法

\`\`\`html
<!-- 复选框：真 / 假值可以自定义 -->
<input type="checkbox" v-model="agree" true-value="yes" false-value="no" />

<!-- 下拉：选项是对象时，用 :value 绑整个对象 -->
<select v-model="current">
  <option :value="{ id: 1, name: '商品一' }">商品一</option>
</select>
\`\`\`

后者在真实项目里很常见：\`v-model\` 直接存对象，省掉「用 id 再查一次」的循环。

### 一个设计上的提醒

\`v-model\` 让「输入」和「状态」贴合得很紧，方便但也容易滥用：把整个表单都塞进一个 \`reactive\` 对象，提交时才发现分不清「用户改过的」与「默认值」。表单建议单独维护一份 \`form\` 对象 + 一份初始值快照，重置就是恢复快照，而不是逐字段清空。`
    },
    {
      no: 14,
      title: '购物车案例：把派生状态算出来',
      lessons: '022–023',
      summary: '全选状态不该单独存，它由勾选列表推导而来；只存「源头状态」，其余交给计算属性。',
      points: [
        '勾选列表 checkList 是源状态，全选是派生状态',
        '可写计算属性可以让「全选」双向联动',
        '金额用 reduce 求和，避免在模板里堆表达式',
        '删除商品时要同步清理勾选列表，否则金额算错'
      ],
      body: `### 先设计状态，再写模板

购物车的功能看着多，其实只有三份数据：

| 状态 | 类型 | 说明 |
| --- | --- | --- |
| \`datalist\` | 数组 | 商品列表（含 \`id\`、\`price\`、\`number\`、\`limit\`） |
| \`checkList\` | 数组 | 已勾选的商品对象 |
| \`isAllChecked\` | 布尔 | 全选框状态 |

第三项其实是前两项的**派生结果**：\`isAllChecked === (checkList.length === datalist.length)\`。所以它可以不存，用计算属性推出来。但「全选」还需要**能写**（点一下要反向影响 \`checkList\`），于是需要一个可写计算属性：

\`\`\`js
computed: {
  isAllChecked: {
    get() {
      return this.datalist.length > 0 && this.datalist.length === this.checkList.length
    },
    set(checked) {
      this.checkList = checked ? [...this.datalist] : []
    }
  }
}
\`\`\`

这样模板里只写 \`v-model="isAllChecked"\`，全选与反选都不用额外的 \`change\` 处理函数。

### 金额与数量边界

\`\`\`js
computed: {
  total() {
    return this.checkList.reduce((sum, item) => sum + item.price * item.number, 0)
  }
}
\`\`\`

数量的上下限用 \`:disabled\` 约束，而不是在方法里 \`if\` 掉：

\`\`\`html
<button @click="item.number--" :disabled="item.number === 1">-</button>
<span>{{ item.number }}</span>
<button @click="item.number++" :disabled="item.number === item.limit">+</button>
\`\`\`

声明式的好处是「不可能状态」不会出现：按钮灰了，用户点不动，方法里就不必再防御。

### 删除时必须同步勾选

\`\`\`js
handleDel(index, id) {
  this.datalist.splice(index, 1)
  // 商品没了，勾选列表里的引用也要清掉
  this.checkList = this.checkList.filter((item) => item.id !== id)
}
\`\`\`

漏掉这行的后果很隐蔽：总金额把已删除的商品也算进去，因为 \`checkList\` 里还留着它。凡是**两份数据存在引用关系**，删除就要成对处理。

### 案例复盘：三个可以复用的结论

1. **能推出来的不要存**：全选、合计、筛选结果、按钮禁用态，全部用 \`computed\`。
2. **源状态越少越好**：状态越多，需要维护的一致性关系越多（N 个状态最多 N×(N-1) 条关系）。
3. **边界用声明式约束**：\`:disabled\`、\`:max\`、\`v-if\` 比方法里的 \`if\` 更难写错。

> 💡 购物车这种「列表 + 选中集合」的结构在后台系统里反复出现（批量删除、批量导出）。把「选中集合存 id 还是存对象」想清楚：**存 id 更稳**，因为对象被替换后引用就失效了。`
    },
    {
      no: 15,
      title: '计算属性：缓存从哪里来',
      lessons: '025–026',
      summary: '计算属性按依赖缓存，依赖不变就不重算；方法每次重新执行，这就是两者的分水岭。',
      points: [
        'computed 的 getter 里不要有副作用，不要发请求、改 DOM',
        '依赖不变时读缓存，模板多次引用也只算一次',
        '返回值是派生状态，只读；要可写就用 get/set 对象写法',
        '复杂表达式一律搬进 computed，模板只做展示'
      ],
      body: `### 先看它解决什么问题

\`\`\`html
<!-- ❌ 模板里塞逻辑：难读、难测、重复执行 -->
<p>{{ author.books.length > 0 ? 'Yes' : 'No' }}</p>
<p>{{ author.books.length > 0 ? 'Yes' : 'No' }}</p>
\`\`\`

\`\`\`js
computed: {
  publishedBooksMessage() {
    return this.author.books.length > 0 ? 'Yes' : 'No'
  }
}
\`\`\`

模板变成 \`{{ publishedBooksMessage }}\`。写一次，用多处，逻辑有名字。

### 缓存这件事

把同样的逻辑写成 method：

\`\`\`js
methods: {
  getMessage() { return this.author.books.length > 0 ? 'Yes' : 'No' }
}
\`\`\`

结果一样，差别在**执行次数**：

| | computed | method |
| --- | --- | --- |
| 模板中引用 3 次 | 计算 1 次，之后读缓存 | 执行 3 次 |
| 组件重渲染 | 依赖没变就复用 | 每次重新执行 |
| 依赖变化 | 标记为脏，下次读取时重算 | 立即重新执行 |

计算属性的缓存失效条件是「**响应式依赖发生变化**」。依赖没变，即使组件因为别的原因重渲染，它也直接返回上次的值。

### 两条硬性约束

1. **getter 里不要有副作用**。不要发请求、不要改 DOM、不要修改其他状态。getter 的职责是「算出一个值」，一旦带副作用，缓存就会让它只在特定时机执行一次，行为变得不可预测。
2. **不要直接修改计算属性的值**。它返回的是派生状态，相当于一份「临时快照」，改它没有意义——要改的是源状态：

\`\`\`js
// ❌ 改快照，源状态没变，下次重算又变回去
this.publishedBooksMessage = 'No'

// ✅ 改源状态，让它重新计算
this.author.books = []
\`\`\`

### 需要可写怎么办

少数场景需要「读是一个值，写是另一套逻辑」，用对象写法：

\`\`\`js
computed: {
  isAllChecked: {
    get() { return this.datalist.length === this.checkList.length },
    set(checked) { this.checkList = checked ? [...this.datalist] : [] }
  }
}
\`\`\`

这不是在改快照，而是**把写操作翻译成对源状态的修改**——本质仍是单向数据流。

### 什么时候不该用

- 需要发请求或改 DOM：用 \`watch\`（第 3.5 章）或事件处理函数。
- 依赖 \`Date.now()\`、随机数这类非响应式来源：缓存会让你拿到旧值。
- 单纯是「值太长换行」这类格式化：写个方法或过滤器替代品更直白。

> 🧠 一句话总结：**computed 描述「是什么」，watch 描述「变化时做什么」**。判断该用哪个，先问自己输出的是一个值，还是一个动作。`
    },
    {
      no: 16,
      title: 'watch 与 computed 的分工',
      lessons: '027',
      summary: 'computed 产出值，watch 执行动作；有异步、有副作用、要新旧值，才轮到 watch。',
      points: [
        'watch 回调接收新值与旧值，computed 只有结果',
        'deep 深度监听对象内部变化，immediate 立即执行一次',
        '监听对象内部变更时，新旧值是同一个引用',
        'watch 支持异步，computed 不支持'
      ],
      body: `### 用一个判断标准区分

| 需求 | 用什么 |
| --- | --- |
| 从已有状态算出新值（合计、过滤、格式化） | computed |
| 状态变化后发请求、存本地、改另一个状态 | watch |
| 需要拿到「改之前的值」 | watch |
| 需要在变化时做防抖 / 节流 | watch |

\`\`\`js
computed: {
  fullName() {
    return this.first + ' ' + this.last        // 输出一个值
  }
},
watch: {
  keyword(newVal, oldVal) {
    if (newVal.length >= 3) this.search(newVal)  // 执行一个动作
  }
}
\`\`\`

### 三种 watch 写法

\`\`\`js
watch: {
  // 1. 方法名：最简单
  a(val, oldVal) { console.log(val, oldVal) },

  // 2. 字符串：复用 methods 里的方法
  b: 'someMethod',

  // 3. 对象：带配置项
  c: {
    handler(val) { console.log('c changed') },
    deep: true,
    immediate: true
  }
}
\`\`\`

配置项的作用：

- \`deep: true\`：监听对象内部任意层级的属性变化。默认只监听引用变化，也就是「整个对象被替换」才触发。
- \`immediate: true\`：创建时立即执行一次回调，适合「进页面就拉一次数据」。
- \`flush\`：默认 \`'pre'\`（DOM 更新前），可改 \`'post'\`（DOM 更新后）。

### 一个必须知道的细节

\`\`\`js
watch: {
  someObject: {
    handler(newVal, oldVal) {
      // 深浅监听的对象，newVal 与 oldVal 是同一个引用
      console.log(newVal === oldVal)   // true
    },
    deep: true
  }
}
\`\`\`

因为对象没有被替换，只是内部属性变了。需要拿到差异时，自己存一份快照对比，别指望 \`oldVal\`。

### 字符串路径与计算属性依赖

\`\`\`js
watch: {
  'user.profile.name'(val) { /* 只监听这一个字段 */ }
}
\`\`\`

字符串路径可以精确监听嵌套字段，比 \`deep: true\` 更省性能——两者差别在大对象上非常明显。

### watch 与 computed 的常见误用

- **用 watch 同步派生值**：\`watch: { price() { this.total = this.price * this.count } }\`，这应该写成 \`computed\`。用 watch 会出现「一帧不同步」的中间态。
- **用 computed 发请求**：getter 有副作用，缓存会让请求次数不可控。
- **deep 监听大数组**：每次变更都全量深度遍历，能拆成精确路径就拆。

> 💡 组合式 API 里 \`watch\` 的第一个参数可以是一个 getter（\`() => state.count\`），写法更灵活，第 7.4 章展开。`
    },
    {
      no: 17,
      title: '数据请求：fetch 与 axios',
      lessons: '028–032',
      summary: 'fetch 是浏览器原生，axios 是封装后的实用工具；项目里几乎都会封一层拦截器。',
      points: [
        'fetch 只有网络错误才 reject，4xx / 5xx 需要自己判断',
        'fetch 要手动 res.json()，且不带 cookie 需显式配置',
        'axios 自动解析 JSON、自动带 cookie、支持拦截器',
        '请求封装要考虑：baseURL、超时、 token、统一错误提示'
      ],
      body: `### fetch 的四个固定动作

\`\`\`js
// GET
fetch('http://localhost:3000/users')
  .then((res) => res.json())
  .then((data) => console.log(data))

// POST
fetch('http://localhost:3000/users', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: 'kerwin', password: '123' })
}).then((res) => res.json())
\`\`\`

| 方法 | 关键点 |
| --- | --- |
| GET | 参数拼在 URL 上，或后端支持 query |
| POST | 必须写 \`content-type\`，body 必须 \`JSON.stringify\` |
| PUT | 与 POST 类似，语义是「整体替换」 |
| DELETE | 通常不带 body，id 放路径里 |

### fetch 的两个坑

**坑一：它不把 4xx / 5xx 当失败。**

\`\`\`js
fetch('/api/not-exist').then((res) => {
  console.log(res.ok)     // false
  console.log(res.status) // 404 —— 但这里不会进入 catch
})
\`\`\`

只有网络中断、跨域被拦这类情况才 reject。业务错误必须自己判断 \`res.ok\`：

\`\`\`js
if (!res.ok) throw new Error('HTTP ' + res.status)
\`\`\`

**坑二：默认不带 cookie。** 跨域请求需要显式设置 \`credentials: 'include'\`，否则后端拿不到会话，登录接口永远「未授权」。

### axios 省掉的麻烦

\`\`\`js
axios.get('http://localhost:3000/users', { params: { name: 'kerwin' } })
  .then((res) => console.log(res.data))

axios.post('http://localhost:3000/users', { name: 'kerwin', age: 100 })
  .then((res) => console.log(res.data))
\`\`\`

| 对比 | fetch | axios |
| --- | --- | --- |
| JSON 解析 | 手动 \`res.json()\` | 自动，\`res.data\` |
| 非 2xx 状态 | 需自己判断 | 直接进 catch |
| cookie | 需配置 | 同源默认带上 |
| 拦截器 | 无 | 请求 / 响应双向 |
| 取消请求 | AbortController | CancelToken / signal |
| 体积 | 0（内置） | 约 15KB |

### 项目里怎么封装

\`\`\`js
const http = axios.create({
  baseURL: '/api',
  timeout: 10000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

http.interceptors.response.use(
  (res) => res.data,                       // 直接返回业务数据
  (err) => {
    if (err.response && err.response.status === 401) {
      location.href = '/login'             // 统一处理登录失效
    }
    return Promise.reject(err)
  }
)
\`\`\`

封装的价值不在「少写几行」，而在**把横切逻辑集中到一处**：token、错误码、loading、重试。否则每个页面都要重复一遍。

### 把请求结果交给 Vue

\`\`\`js
export default {
  data() {
    return { list: [], loading: false }
  },
  async mounted() {
    this.loading = true
    try {
      const data = await http.get('/movies')
      this.list = data.list || []
    } catch (e) {
      this.list = []
    } finally {
      this.loading = false
    }
  }
}
\`\`\`

三个状态缺一不可：\`list\`（数据）、\`loading\`（加载中）、异常时的空数组兜底。模板里分别对应「骨架屏 / 空状态 / 列表」三种 UI，这也是后面组件库章节里 \`List\` 组件的内部逻辑。

> ⚠️ 开发环境跨域别急着改后端，Vite 配个代理最快：\`server.proxy\` 里把 \`/api\` 转发到 \`http://localhost:3000\`，前端代码里始终写相对路径。`
    },
    {
      no: 18,
      title: '过滤器为什么被移除',
      lessons: '033',
      summary: '过滤器引入了一套只属于模板的语法；Vue 3 认为「模板里只写 JS」更重要，用方法和计算属性替代。',
      points: [
        'Vue 2 的 {{ msg | filter }} 是自定义语法，不是 JS',
        '移出的理由：学习成本与实现成本，收益不足',
        '替代方案：方法调用、计算属性、全局工具函数',
        '格式化逻辑集中到 utils，比分散在模板里更好维护'
      ],
      body: `### 它在 Vue 2 里长什么样

\`\`\`html
<p>{{ accountBalance | currencyUSD }}</p>
\`\`\`

\`\`\`js
filters: {
  currencyUSD(value) {
    return '$' + value
  }
}
\`\`\`

用起来确实方便，但它打破了模板的一条基本假设：**双大括号里应该是标准 JavaScript**。\`|\` 在 JS 里是位或运算，在模板里却是「管道」，同一个符号两种含义，需要额外学习；对编译器来说，还要为它单独写解析规则。

Vue 3 的取舍很直接：**移除过滤器，建议改用方法调用或计算属性**。少一套私有语法，模板的心智负担更低。

### 三种替代写法

**方法调用**（最接近原写法）：

\`\`\`html
<p>{{ formatUSD(accountBalance) }}</p>
\`\`\`

\`\`\`js
methods: {
  formatUSD(value) {
    return '$' + Number(value).toFixed(2)
  }
}
\`\`\`

**计算属性**（结果被多处使用时更划算，且有缓存）：

\`\`\`js
computed: {
  balanceText() {
    return '$' + this.accountBalance.toFixed(2)
  }
}
\`\`\`

**全局工具函数**（跨组件复用）：

\`\`\`js
// utils/format.js
export const currency = (v, unit = '¥') => unit + Number(v || 0).toFixed(2)
export const dateText = (d) => new Date(d).toLocaleDateString('zh-CN')
\`\`\`

\`\`\`js
import { currency } from '@/utils/format'

export default {
  methods: { currency }        // 挂到实例上，模板里直接 {{ currency(price) }}
}
\`\`\`

### 跨项目迁移时的对照

| Vue 2 写法 | Vue 3 等价写法 |
| --- | --- |
| 插值里接过滤器，如 \`{{ msg }}\` 后跟管道符 | \`{{ capitalize(msg) }}\` |
| \`v-bind:id\` 后跟管道符 | \`:id="formatId(rawId)"\` |
| 全局 \`Vue.filter\` | 全局工具函数 + 局部引入 |
| 过滤器带参数（如截取前 10 位） | \`slice(text, 0, 10)\` |

### 这个变化真正的启示

过滤器的消失不是「少个便利工具」，而是 Vue 3 的整体取向：**模板保持极薄，逻辑回到 JS**。同一个逻辑，写在 JS 里可以被单测、可以在多个模板里复用、可以被 IDE 跳转——这些是模板私有语法做不到的。

> 💡 迁移老项目时，机械替换 \`| f\` 为 \`f(...)\` 只解决了语法；更值得做的是把这类格式化函数抽到 \`utils\`，顺手消掉各组件里重复的模板判断。`
    }
  ]
});
