/* 第 8 篇 · 深入理解与自查 */
window.VUE_DEEP = window.VUE_DEEP || {};

window.VUE_DEEP[44] = {
  deep: `### 路由表被编译成一个「匹配器」

\`\`\`js
createRouter({ routes: [
  { path: '/user/:id', component: User },
  { path: '/user/me', component: Me }
]})
\`\`\`

Vue Router 在初始化时把每条 path 编译成正则与打分规则，存进 matcher。匹配 \`/user/me\` 时，**两条都能匹配**（\`/user/:id\` 的 \`:id\` 也能是 "me"），于是按「静态段优先」的分数排序，\`/user/me\` 胜出。

这解释了两件事：

1. 路由顺序在某些情况下不影响结果（有打分机制），但**同名同分**时先定义的优先；
2. 动态段会「吃掉」任何值，所以静态路由最好写在前面，避免歧义。

### router-view 靠深度定位

\`<router-view>\` 渲染哪个组件，取决于它在组件树里的**层级深度**：

\`\`\`text
App.vue            <router-view>  → 深度 0 → 渲染第一层匹配的组件
  └ UserLayout.vue <router-view>  → 深度 1 → 渲染 children 里的组件
\`\`\`

Vue Router 用 provide 传递当前深度，每进一层 +1，然后取 \`matched[depth]\`。所以：

- 嵌套路由的父组件**必须**有 \`<router-view>\`，否则子路由无处渲染（页面空白）；
- 同一个页面里想渲染两个同级视图，用命名视图（\`name\`），而不是两个 router-view（它们会抢同一深度）。

### redirect 与 alias 的实现差异

| | redirect | alias |
| --- | --- | --- |
| 实现 | 导航时检测到 redirect，**发起一次新导航** | 给同一组件**注册多条 path 记录** |
| URL | 变成目标路径 | 保持用户输入的路径 |
| 导航守卫 | 会再走一遍（目标路由的守卫） | 只走一次 |
| 典型用途 | 默认页、旧地址迁移 | 多入口、兼容历史链接 |

所以 \`redirect\` 可能触发两次守卫（原路由 + 目标路由），写守卫时要避免「无限重定向」——判断 \`to.name !== 'Login'\` 就是这个原因。

### 命名路由为什么更可靠

\`\`\`js
router.push({ name: 'user', params: { id: 1 } })
\`\`\`

路径规则改动（\`/user/:id\` → \`/u/:id\`）时，只改路由表一处；用字符串路径就要全项目搜索替换，而且容易漏掉拼接字符串的地方（\`'/user/' + id\`）。

注意 \`params\` 必须配 \`name\`：写 \`{ path: '/user', params: {...} }\` 时 params 会被丢弃（path 已经是完整路径，没有占位符可填）。

### 动手验证（3 分钟）

\`\`\`js
// 在任意 Vue Router 项目里
const routes = [
  { path: '/user/:id', component: { template: '<p>动态 id</p>' } },
  { path: '/user/me', component: { template: '<p>我的主页</p>' } }
]
// 访问 /user/me，看渲染哪一个
\`\`\`

> 💡 会渲染「我的主页」——静态段得分更高。把两条顺序调换，结果不变；但把 \`/user/me\` 改成 \`/user/:name\`，两条同分，则先定义的生效。这说明匹配不是「从上到下第一个命中」，而是「按优先级排序后取最优」。`,
  quiz: [
    { q: '静态路由 /user/me 与动态路由 /user/:id 同时存在时，访问 /user/me 命中哪个？为什么？', a: '命中静态路由。matcher 会给路径段打分，静态段优先级高于动态段；同分时才由定义顺序决定。' },
    { q: '嵌套路由的父组件为什么必须有 <router-view>？', a: 'router-view 按组件树深度取 matched[depth]，父组件不提供出口，子路由组件就没有地方渲染，表现为页面空白。' },
    { q: 'redirect 与 alias 在「URL 是否改变」「守卫是否重走」上有何差别？', a: 'redirect 会真正跳转、URL 变化且目标路由守卫会再执行；alias 只是给同一组件注册多个路径，URL 不变、守卫只走一次。' }
  ]
};

window.VUE_DEEP[45] = {
  deep: `### router-link 渲染成了什么

\`\`\`html
<router-link to="/home">首页</router-link>
\`\`\`

渲染成：

\`\`\`html
<a href="/home" class="router-link-active router-link-exact-active">首页</a>
\`\`\`

三个细节：

- \`href\` 是真实路径，所以「右键新标签打开」「复制链接」都正常；
- 点击被拦截（\`preventDefault\`）后调用 \`router.push\`，不刷新页面；
- 激活类名由「当前路径是否以该链接路径为前缀」决定，\`exact-active\` 要求完全相等。

所以 \`/user\` 的链接在 \`/user/1\` 时会有 \`router-link-active\`，但不会有 \`exact-active\`。做侧边栏高亮时通常用 active，做 tab 高亮时用 exact-active。

### push 返回 Promise，会「失败」

\`\`\`js
router.push('/a').catch((err) => { /* 导航被取消 */ })
\`\`\`

导航可能因为三种原因被中止：

| 原因 | 表现 |
| --- | --- |
| 重复导航（已在当前路由） | 旧版本抛 NavigationDuplicated，Vue Router 4 静默 |
| 守卫返回 false | Promise 被 reject（\`Navigation aborted\`） |
| 守卫重定向到别处 | reject（\`Redirected\`） |

**不要在 \`catch\` 里无脑弹「跳转失败」**——守卫拦截是正常业务行为（未登录被踢到登录页），不是错误。

### 历史记录里存了什么

\`\`\`js
history.pushState({ back: '/list', current: '/detail', forward: null, position: 3 }, '', '/detail')
\`\`\`

Vue Router 往 state 里写了自己的元信息（back/current/forward/position），用于实现「返回时恢复滚动位置」与「判断前进/后退」。所以：

- 直接改 URL（地址栏回车）走的是全新导航，state 里的 forward/back 会重算；
- \`router.back()\` 依赖浏览器的历史栈，而不是它自己的记录。

### 声明式与编程式怎么选

| 场景 | 用 |
| --- | --- |
| 导航菜单、面包屑 | \`<router-link>\`（语义、可访问、可右键新开） |
| 表单提交成功后跳转 | \`router.replace\`（不该退回表单） |
| 登录成功回跳 | \`router.replace(redirect)\` |
| 关闭弹窗返回列表 | \`router.back()\` |
| 条件跳转（权限不足） | 守卫里 return 目标路由 |

### 动手验证（3 分钟）

\`\`\`js
// 在控制台执行（有 router 实例的项目里）
const r = document.querySelector('#app').__vue_app__.config.globalProperties.$router
r.push('/not-exist').then(() => console.log('成功')).catch(e => console.log('失败:', e.type || e.message))
\`\`\`

> 💡 若没有配通配路由，会打印「失败」并带 \`NavigationFailureType\` 信息。这提醒我们：**导航是异步、可失败的**，业务代码里「push 之后就当已经跳过去了」的假设并不总成立。`,
  quiz: [
    { q: 'router-link 渲染出的 a 标签上，active 与 exact-active 的区别是什么？', a: 'active 表示当前路径以链接路径为前缀（父级也会亮）；exact-active 要求路径完全相等。侧边栏常用 active，tab 常用 exact-active。' },
    { q: 'router.push 返回的 Promise 被 reject，一定是出错了吗？', a: '不一定。守卫返回 false 或重定向、重复导航都会导致导航被中止并 reject，这些属于正常业务行为，不应一律当错误提示。' },
    { q: '登录成功后跳首页，为什么用 replace 而不是 push？', a: 'replace 会替换当前历史记录，用户点后退不会回到登录页；push 会保留，导致「登录成功后还能退回到登录页」的尴尬。' }
  ]
};

window.VUE_DEEP[46] = {
  deep: `### children 的路径是「相对父路径」拼接的

\`\`\`js
{ path: '/user', component: Layout, children: [
  { path: '', component: Home },          // → /user
  { path: 'profile', component: Profile },// → /user/profile
  { path: '/profile', component: X }      // → /profile（绝对路径，脱离嵌套）
]}
\`\`\`

- 不带 \`/\` 开头 → 相对父路径拼接；
- 带 \`/\` 开头 → 当作根路径，**仍然是 Layout 的子组件**（渲染位置仍在父的 router-view），但 URL 不在 /user 下了。这个「层级与路径不一致」的行为很容易造成困惑，实际项目里应避免。

### 空路径子路由是「默认子页」

\`{ path: '', component: Home }\` 让 \`/user\` 能渲染内容。没有它时访问 \`/user\` 会匹配到父路由但子出口为空 → 页面只剩布局，内容区空白。

如果希望 \`/user\` 自动跳到 \`/user/profile\`，用 \`{ path: '', redirect: 'profile' }\`（相对重定向）。

### 动态段的三种写法

\`\`\`js
{ path: '/user/:id' }             // 必填，匹配一段
{ path: '/user/:id?' }            // 可选
{ path: '/files/:path(.*)' }      // 自定义正则，匹配剩余全部（含 /）
{ path: '/num/:n(\\d+)' }         // 只匹配数字
\`\`\`

最后一种能「提前过滤」掉不合法的 URL：\`/num/abc\` 直接不匹配，走 404，而不是进入组件再 manual 校验。

### 参数变化时不重建组件（最坑的一处）

从 \`/user/1\` 跳到 \`/user/2\`，路由变了但组件类型相同 → **复用实例**，\`created\`/\`mounted\` 都不再执行，页面还显示 1 号用户的数据。

两种解法：

\`\`\`js
// 1. 监听参数（推荐，性能好）
watch(() => route.params.id, (id) => load(id), { immediate: true })

// 2. 强制重建（简单粗暴）
<router-view :key="route.fullPath" />
\`\`\`

方案 2 的代价是「整个子树重建」：滚动位置、内部状态、动画全部重来。列表跳详情用方案 1，表单页用方案 2 更安全（避免脏状态带到下一条记录）。

### 参数永远是字符串

\`\`\`js
route.params.id === 1        // false
Number(route.params.id) === 1 // true
\`\`\`

而且可能是数组（多个同名参数 \`/a/:id/b/:id\`）。严谨写法：

\`\`\`js
const raw = route.params.id
const id = Number(Array.isArray(raw) ? raw[0] : raw)
\`\`\`

### 动手验证（4 分钟）

\`\`\`js
// routes
{ path: '/u/:id', component: { 
    template: '<p>id = {{ $route.params.id }} <button @click="$router.push(\\'/u/\\' + (Number($route.params.id)+1))">下一条</button></p>',
    mounted() { console.log('mounted', this.$route.params.id) }
  } }
\`\`\`

> 💡 点「下一条」，URL 变了、页面数字变了，但 \`mounted\` 只打印了一次——组件被复用了。把 \`<router-view :key="$route.fullPath">\` 加上，再点，就会每次都打印 mounted。`,
  quiz: [
    { q: 'children 里 path 带不带前导斜杠有什么区别？', a: '不带斜杠是相对父路径拼接；带斜杠按绝对路径处理。后者虽然仍在父组件出口渲染，但 URL 脱离父路径，容易造成层级与路径不一致。' },
    { q: '从 /user/1 跳到 /user/2，为什么页面数据没变？', a: '同一组件类型被复用，实例不会重建，created/mounted 不再执行。需 watch route.params 或用 :key="route.fullPath" 强制重建。' },
    { q: 'route.params.id 与数字 1 比较为什么恒为 false？', a: 'params 的值永远是字符串（还可能是数组）。必须先 Number() 转换并处理数组情况再比较。' }
  ]
};

window.VUE_DEEP[47] = {
  deep: `### 两种模式，两套 API

| | hash | history |
| --- | --- | --- |
| URL | \`/#/user/1\` | \`/user/1\` |
| 核心 API | \`location.hash\` + \`hashchange\` | \`history.pushState\` + \`popstate\` |
| 请求是否发到服务端 | \`#\` 之后不发送 | 整条路径都会发送 |
| 刷新 404 | 不会 | 会（未配置回退时） |

history 模式的「刷新 404」不是 bug：浏览器真的向服务器请求 \`/user/1\`，服务器上没有这个文件。修法是让服务器把所有未匹配静态资源的请求都返回 \`index.html\`：

\`\`\`nginx
location / { try_files $uri $uri/ /index.html; }
\`\`\`

### 为什么 pushState 不会刷新页面

\`history.pushState(state, title, url)\` 只做两件事：把新条目压入历史栈、更新地址栏。**不会发起请求，也不会触发页面加载**。之后用户点后退，浏览器触发 \`popstate\`，Vue Router 监听它并重新匹配路由。

所以「单页应用不刷新」不是 Vue 的能力，而是 History API 的定义。

### base 会影响三处

部署在 \`/admin/\` 子目录时：

| 位置 | 配置 |
| --- | --- |
| 路由 | \`createWebHistory('/admin/')\` |
| 构建 | \`vite.config.js\` 里 \`base: '/admin/'\` |
| 服务器 | \`try_files ... /admin/index.html\` |

漏掉任一处，表现分别是：路由跳转到根目录 / 静态资源 404 / 刷新白屏。

### 服务端渲染时只能用 history

hash 部分不会发给服务端，服务端无法知道用户要哪个页面，因此 SSR 必须用 history 模式——这是 Nuxt 等框架的默认选择。

### 动手验证（3 分钟）

在任意页面控制台执行：

\`\`\`js
history.pushState({ n: 1 }, '', '/fake-path')
location.pathname        // "/fake-path"
// 此时页面没有任何变化、没有网络请求
history.back()           // 地址栏回到原路径，触发 popstate
\`\`\`

> 💡 地址栏变成了 /fake-path，但页面内容一点没变，Network 面板也没有新请求——这就是「前端路由」的全部秘密。Vue Router 只是在这之上加了「匹配表 + 组件渲染」。`,
  quiz: [
    { q: 'history 模式刷新出现 404 的根本原因是什么？怎么解决？', a: '浏览器会向服务器请求该路径，服务器没有对应文件。需要配置回退（如 Nginx try_files $uri $uri/ /index.html），把未匹配请求返回 index.html。' },
    { q: 'pushState 为什么不会刷新页面？', a: '它只修改历史栈与地址栏，不发起请求、不触发页面加载。路由变化由前端监听 popstate / 调用匹配逻辑处理。' },
    { q: '部署到子目录 /admin/ 时，需要改哪三处？', a: '路由的 createWebHistory("/admin/")、构建的 base: "/admin/"、服务器 try_files 指向 /admin/index.html。' }
  ]
};

window.VUE_DEEP[48] = {
  deep: `### 一次导航里守卫的执行顺序

\`\`\`text
1. 失活组件的 beforeRouteLeave
2. 全局 beforeEach
3. 复用组件的 beforeRouteUpdate（仅参数变化时）
4. 路由配置的 beforeEnter
5. 解析异步组件（懒加载在这里发生）
6. 全局 beforeResolve
7. 导航确认，DOM 更新
8. 全局 afterEach
9. 组件的 beforeRouteEnter 的回调（此时实例已创建）
\`\`\`

记住两个要点：**离开守卫最先，进入守卫最后**；**afterEach 不可取消导航**（没有返回值语义）。

### next 与 return 的取舍

\`\`\`js
// 旧写法
router.beforeEach((to, from, next) => {
  if (!auth) next('/login')
  else next()
})
\`\`\`

\`\`\`js
// 新写法（推荐）
router.beforeEach((to, from) => {
  if (!auth) return { name: 'Login' }
  return true
})
\`\`\`

旧写法的两个经典 bug：忘记调 \`next()\`（导航永久挂起、页面像卡死）、调了两次（警告 + 行为不确定）。return 写法没有这两个风险。

### 守卫里发请求会「卡住渲染」

\`\`\`js
router.beforeEach(async (to) => {
  await store.fetchUser()      // 期间页面停在旧页面
  return true
})
\`\`\`

导航在守卫返回前不会完成，所以用户看到的是「点了链接没反应」。这适合「必须拿到数据才能进入」的场景（权限、必须存在的资源），不适合普通的列表数据——那应该在组件里请求 + loading。

### 无限重定向的成因

\`\`\`js
router.beforeEach((to) => {
  if (!auth) return { name: 'Login' }     // ❌ 没有排除 Login 自己
})
\`\`\`

访问 \`/login\` → 未登录 → 重定向到 \`/login\` → 又是未登录 → …… 浏览器最终报 \`Maximum call stack\` 或直接白屏。修法是判断 \`to.name !== 'Login'\`，或用 \`meta.public = true\` 标记公开页。

### 组件内守卫的适用边界

| 守卫 | 是否有用 |
| --- | --- |
| \`beforeRouteLeave\` | ✅ 防误关未保存表单，真实有用 |
| \`beforeRouteUpdate\` | ⚠️ 可用 \`watch(() => route.params)\` 替代 |
| \`beforeRouteEnter\` | ⚠️ 拿不到 \`this\`，逻辑放 \`created\` 更直观 |

\`beforeRouteEnter\` 的唯一特殊性是「在实例创建前执行」，可以用来「判断是否有权进入」。但绝大多数时候，全局守卫 + meta 更集中、更好维护。

### 动手验证（4 分钟）

\`\`\`js
router.beforeEach((to, from) => {
  console.log('beforeEach', from.path, '→', to.path)
})
router.afterEach((to) => {
  console.log('afterEach', to.path)
  document.title = to.meta.title || 'Demo'
})
\`\`\`

点几个链接，观察顺序；然后在某个 beforeEach 里加 \`return false\`，看 URL 不动、控制台只有 beforeEach 没有 afterEach。

> 💡 \`return false\` 时 URL 保持原样——这说明守卫是在**地址变更之前**执行的，是真正的「拦截」，而不是「跳过去再拉回来」。`,
  quiz: [
    { q: '一次导航里，离开守卫与全局 beforeEach 谁先执行？afterEach 能否取消导航？', a: '失活组件的 beforeRouteLeave 最先执行，然后才是全局 beforeEach。afterEach 在导航确认后执行，不能取消导航。' },
    { q: '守卫写成 async 并 await 请求，用户会看到什么？', a: '导航在守卫 resolve 前不会完成，页面停在旧路由，用户感觉「点了没反应」。适合必须预取数据的场景，普通列表数据应在组件内请求配 loading。' },
    { q: '为什么登录拦截守卫必须排除 Login 路由？', a: '否则访问 /login 时也被判定未登录并重定向到 /login，形成无限重定向，最终报错或白屏。' }
  ]
};

window.VUE_DEEP[49] = {
  deep: `### 动态 import 到底做了什么

\`\`\`js
const UserDetail = () => import('./views/UserDetail.vue')
\`\`\`

- 构建时：Rollup 看到 \`import()\`，把该模块及其独有依赖抽成一个独立 chunk，文件名带 hash。
- 运行时：调用这个函数才发起 \`<script type="module">\` 请求加载 chunk，返回 Promise，resolve 出模块对象。

所以「按路由分包」不是配置项，而是 \`import()\` 这个语法的天然结果。Vue Router 只是接受「返回 Promise 的函数」作为 component。

### 三种加载策略的取舍

| 策略 | 首屏 | 切换体验 | 实现 |
| --- | --- | --- | --- |
| 全静态导入 | 大 | 最快（已加载） | \`import X from ...\` |
| 全动态导入 | 小 | 首次切换有等待 | \`() => import(...)\` |
| 动态 + 预取 | 小 | 快 | 空闲时手动 \`import()\` 预热 |

预取的实现很简单，因为模块有缓存：

\`\`\`js
router.isReady().then(() => {
  // 空闲时把「下一步可能去」的页面提前拉下来
  requestIdleCallback(() => import('./views/Detail.vue'))
})
\`\`\`

用户真点进去时，\`import()\` 直接命中模块缓存，几乎瞬间完成。

### chunk 加载失败：线上最常见的白屏

发版后，用户还停留在旧页面，旧 chunk 已被新版本覆盖 → 点链接时请求 404 → 白屏。

\`\`\`js
router.onError((err, to) => {
  if (/Failed to fetch dynamically imported module/.test(err.message)) {
    window.location.href = to.fullPath        // 整页重新加载，拿到新版本
  }
})
\`\`\`

配套策略：保留上一版静态资源一段时间（不要发版即删），或用「检测到新版本提示刷新」。

### route 是响应式对象

\`\`\`js
const route = useRoute()
watch(() => route.params.id, ...)     // 可以侦听
\`\`\`

\`route\` 是 reactive 的，所以路径、参数、query 变化都能被 \`watch\`、\`computed\` 追踪。这也是「用 computed 读 query 比在模板里反复写 $route.query 更好」的原因——后者虽然能用，但不利于复用与测试。

### 组合式下「路由级数据获取」的两种写法

\`\`\`js
// A. 组件内请求（推荐）
onMounted(fetchData)
watch(() => route.params.id, fetchData)

// B. 守卫内请求（进入前必须就绪）
beforeRouteEnter: (to, from, next) => { fetch(to.params.id).then(() => next()) }
\`\`\`

A 交互自然（骨架屏 → 内容），B 适合「数据不存在就跳 404」。**不要两个都写**，否则会重复请求。

### 动手验证（3 分钟）

\`\`\`bash
npm run build
# 看 dist/assets 下是否出现多个带 hash 的 js 文件
\`\`\`

\`\`\`js
// 再把某条路由从 () => import(...) 改成静态 import，重新构建对比
\`\`\`

> 💡 静态导入后，那个 chunk 会消失、主包变大——「懒加载」在构建产物上是肉眼可见的文件增删，而不是看不见的优化。`,
  quiz: [
    { q: '路由懒加载在构建产物上体现为什么？', a: '该页面及其独有依赖被抽成独立 chunk（带 hash 的 js 文件），主包变小；运行时调用 import() 才请求它。' },
    { q: '发版后旧页面点链接白屏，原因与解法是什么？', a: '旧 chunk 已被新版本覆盖，请求 404 导致动态导入失败。可监听 router.onError 检测该错误并整页跳转刷新；同时保留上一版静态资源一段时间。' },
    { q: '为什么「预取」不需要额外机制？', a: 'ESM 模块有缓存，提前调用 import() 下载后，真正加载时直接命中缓存，无需重复请求。' }
  ]
};
