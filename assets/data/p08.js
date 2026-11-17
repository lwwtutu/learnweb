/* 第 8 篇 · 路由 */
(window.VUE_PARTS = window.VUE_PARTS || []).push({
  id: 'p8',
  order: 8,
  title: '路由',
  range: '078–088',
  desc: '从 createRouter 到守卫与懒加载，把单页应用拆成可导航的页面',
  chapters: [
    {
      no: 44,
      title: '路由的基本结构',
      lessons: '078–079',
      summary: '一份路由表 + 一个 router-view 出口；重定向与别名的区别是「URL 变不变」。',
      points: [
        'createRouter 接收 history 与 routes 两部分配置',
        'router-view 是渲染出口，router-link 是导航入口',
        'redirect 会改 URL，alias 保留 URL 显示多个地址',
        '路由记录支持 meta 存自定义信息（标题、权限）'
      ],
      body: `### 安装与最小配置

\`\`\`bash
npm install vue-router@4
\`\`\`

\`\`\`js
// router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: () => import('@/views/About.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
\`\`\`

\`\`\`js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
\`\`\`

\`\`\`vue
<!-- App.vue -->
<template>
  <nav>
    <router-link to="/">首页</router-link>
    <router-link to="/about">关于</router-link>
  </nav>
  <router-view />
</template>
\`\`\`

两个组件是整套路由的地基：\`<router-view>\` 决定「渲染在哪」，\`<router-link>\` 决定「怎么去」。

### 路由记录的常用字段

| 字段 | 作用 | 例子 |
| --- | --- | --- |
| \`path\` | 路径 | \`'/user/:id'\` |
| \`name\` | 命名路由，跳转更稳 | \`name: 'user'\` |
| \`component\` | 对应组件 | \`Home\` 或 \`() => import(...)\` |
| \`redirect\` | 重定向 | \`'/home'\` 或 \`{ name: 'home' }\` |
| \`alias\` | 别名 | \`['/index', '/main']\` |
| \`children\` | 子路由 | 嵌套路由 |
| \`meta\` | 自定义信息 | \`{ title: '首页', auth: true }\` |

### 重定向与别名的区别

\`\`\`js
{ path: '/', redirect: '/home' }          // 访问 / 时 URL 变成 /home
{ path: '/home', component: Home, alias: '/index' }   // /index 与 /home 都显示这个页面
\`\`\`

| | redirect | alias |
| --- | --- | --- |
| URL 是否变化 | 变 | 不变 |
| 地址栏显示 | 目标路径 | 用户输入的路径 |
| 典型用途 | 默认页、旧地址迁移 | 多入口、兼容历史链接 |

重定向可以是函数，用于按条件跳转：

\`\`\`js
{ path: '/dashboard', redirect: () => ({ name: 'login' }) }
\`\`\`

也可以落到命名路由或带参数的对象上，比字符串更不容易写错。

### 命名路由的好处

\`\`\`js
router.push({ name: 'user', params: { id: 1 } })   // /user/1
router.push('/user/1')
\`\`\`

后者在路径规则改动后（比如 \`/user/:id\` 变成 \`/u/:id\`）要全项目搜索替换；前者只改路由表一处。**只要涉及参数，就优先用命名路由**。

> ⚠️ \`path\` 与 \`params\` 不能同时用。\`router.push({ path: '/user', params: { id: 1 } })\` 里 \`params\` 会被丢弃，必须用 \`name\`。
`
    },
    {
      no: 45,
      title: '声明式与编程式导航',
      lessons: '080、082',
      summary: 'router-link 负责模板里的跳转，router.push 负责逻辑里的跳转；两者都写入历史记录。',
      points: [
        'router-link 默认渲染成 a 标签，active 类自动添加',
        'router.push 追加历史，router.replace 替换当前记录',
        'router.go / back 对应浏览器前进后退',
        '命名路由配 params，path 配 query'
      ],
      body: `### 声明式：router-link

\`\`\`html
<router-link to="/home">首页</router-link>
<router-link :to="{ name: 'user', params: { id: 1 } }">用户</router-link>
<router-link :to="{ path: '/list', query: { page: 2 } }">第二页</router-link>
\`\`\`

它会被渲染成 \`<a href="...">\`，并自动处理：

- 点击时阻止默认跳转，改用 history API，避免整页刷新。
- 当前路由匹配时，自动加 \`router-link-active\`；精确匹配时加 \`router-link-exact-active\`。
- \`<a>\` 的语义与键盘可访问性。

### 编程式：push / replace / go

\`\`\`js
// 追加一条历史记录
router.push('/home')
router.push({ name: 'user', params: { id: 1 } })
router.push({ path: '/list', query: { page: 2 } })

// 替换当前记录（用户点后退不会回到这里）
router.replace('/login')

// 前进 / 后退
router.go(-1)
router.back()
router.forward()
\`\`\`

选择依据：**用户「后退」应不应该回到当前页**。登录成功后跳首页用 \`replace\`（不该退回到登录页）；普通导航用 \`push\`。

### params 与 query 的差别

| | params | query |
| --- | --- | --- |
| 位置 | 路径的一部分 | \`?\` 后面的键值 |
| 例子 | \`/user/1\` | \`/list?page=2\` |
| 是否必填 | 是（路由定义的占位） | 否 |
| 刷新后是否保留 | 是 | 是 |
| 取法 | \`route.params.id\` | \`route.query.page\` |
| 跳转写法 | 必须用 \`name\` | 用 \`path\` 或 \`name\` 都行 |

一张记住的表：**params 是「哪一页」，query 是「这一页的参数」**。

### \`$router\` 与 \`$route\` 别搞混

| | \`$router\` | \`$route\` |
| --- | --- | --- |
| 是什么 | 路由器实例 | 当前路由信息对象 |
| 内容 | \`push\`、\`replace\`、\`go\`、守卫 | \`path\`、\`name\`、\`params\`、\`query\`、\`meta\` |
| 用途 | 操作跳转 | 读取信息 |

前缀差一个字母，含义完全不同。组合式 API 里对应 \`useRouter()\` 与 \`useRoute()\`。

### 自定义 router-link 的渲染

需要把导航套在 \`<li>\` 上、或加自定义 class 时，用 \`custom\` + \`v-slot\`：

\`\`\`html
<router-link to="/foo" custom v-slot="{ href, navigate, isActive }">
  <li :class="{ active: isActive }">
    <a :href="href" @click="navigate">Go to Foo</a>
  </li>
</router-link>
\`\`\`

\`navigate\` 是处理函数，\`href\` 保证「新标签页打开」也能用。这是 UI 库封装导航时的标准写法。

> 💡 同一个路由重复 \`push\` 会抛 NavigationDuplicated 错误（旧版本），Vue Router 4 里直接静默忽略，但如果你的代码里有 \`catch\`，注意别把真实错误一起吞掉。`
    },
    {
      no: 46,
      title: '嵌套路由与动态匹配',
      lessons: '081、083',
      summary: '嵌套路由靠 children + 内层 router-view；动态段用 :id 占位，组件复用时靠 watch 响应变化。',
      points: [
        'children 里的路径不带前导斜杠（相对父路径）',
        '父组件模板里需要自己的 router-view 作为子出口',
        '空路径子路由用于「父布局 + 默认子页」',
        ':id 动态段通过 route.params 读取',
        '同一组件复用时不触发 created，要 watch 参数'
      ],
      body: `### 嵌套结构

\`\`\`js
const routes = [
  {
    path: '/user',
    component: UserLayout,
    children: [
      { path: '', component: UserHome },          // /user
      { path: 'profile', component: UserProfile }, // /user/profile
      { path: 'posts', component: UserPosts }      // /user/posts
    ]
  }
]
\`\`\`

\`\`\`vue
<!-- UserLayout.vue -->
<template>
  <div class="user-layout">
    <aside>侧边菜单</aside>
    <main>
      <router-view />     <!-- 子路由的出口 -->
    </main>
  </div>
</template>
\`\`\`

两个要点：

1. \`children\` 的 \`path\` **不要写前导斜杠**。写 \`/profile\` 会被当成根路径，脱离嵌套关系。
2. 父组件必须有 \`<router-view>\`，否则子路由无处渲染——这是嵌套路由最常见的「页面空白」原因。

### 动态路由匹配

\`\`\`js
{ path: '/user/:id', component: UserDetail }
\`\`\`

\`\`\`js
// 读取
const route = useRoute()
console.log(route.params.id)        // 字符串，注意类型
\`\`\`

多个参数、可选参数：

\`\`\`js
{ path: '/post/:category/:id' }        // /post/tech/12
{ path: '/post/:id?' }                 // id 可选
{ path: '/files/:path(.*)' }           // 匹配剩余全部（含斜杠）
\`\`\`

### 组件复用带来的陷阱

从 \`/user/1\` 跳到 \`/user/2\`：路由变了，但**组件是同一个**，Vue 会复用它而不是销毁重建。于是 \`created\` / \`mounted\` 都不再执行，页面还是 1 号用户的数据。

两种解法：

\`\`\`js
// 方案一：watch 参数
watch(() => route.params.id, (id) => { loadUser(id) }, { immediate: true })

// 方案二：给 router-view 加 key，强制重建
<router-view :key="route.fullPath" />
\`\`\`

方案一更省性能，方案二更省心（整棵子树重建）。列表页跳详情页推荐方案一；表单页推荐方案二，避免脏状态带到下一条记录。

### 通配与 404

\`\`\`js
{ path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
\`\`\`

放在路由表**最后**。Vue Router 4 用 \`:pathMatch(.*)*\` 代替了旧的 \`*\`，因为它要区分「匹配到但参数为空」与「完全没匹配」。

### 多个路径共用一个组件

\`\`\`js
const routes = [
  { path: '/', component: Home },
  { path: '/home', component: Home }
]
\`\`\`

想让「一个路径渲染多个组件」，则用命名视图：

\`\`\`js
{
  path: '/',
  components: { default: Home, LeftSidebar, RightSidebar }
}
\`\`\`

\`\`\`html
<router-view name="LeftSidebar" />
<router-view />
<router-view name="RightSidebar" />
\`\`\`

> ⚠️ \`params\` 的值永远是字符串。\`route.params.id === 1\` 恒为 false，要比就 \`Number(route.params.id) === 1\`。`
    },
    {
      no: 47,
      title: '路由模式：hash 与 history',
      lessons: '084',
      summary: 'hash 用 # 后片段，不需要服务端配合；history 更干净，但必须配置回退路由。',
      points: [
        'createWebHashHistory 用 #，刷新永远命中 index.html',
        'createWebHistory 用真实路径，需服务端回退到 index.html',
        'history 模式部署 Nginx 要加 try_files',
        '子目录部署要设置 base',
        'hash 不会带给服务端，无法做服务端路由'
      ],
      body: `### 两种模式的技术差异

\`\`\`js
import { createWebHashHistory, createWebHistory } from 'vue-router'

createRouter({ history: createWebHashHistory(), routes })   // /#/user/1
createRouter({ history: createWebHistory(), routes })       // /user/1
\`\`\`

| | hash | history |
| --- | --- | --- |
| URL 形态 | \`/#/user/1\` | \`/user/1\` |
| 实现 | 监听 \`hashchange\` | \`pushState\` + \`popstate\` |
| 刷新 404 | 不会 | 会（未配置时） |
| 服务端配置 | 不需要 | 需要回退 |
| SEO | 较差 | 较好 |

hash 的原理很朴素：\`#\` 之后的内容不会被发送到服务端，所以刷新时服务器始终返回同一个 HTML，前端再根据 hash 决定渲染什么。

### history 模式为什么需要服务端配合

用户直接访问 \`https://example.com/user/1\`，浏览器会向服务器请求 \`/user/1\`。服务器上没有这个文件，返回 404——这就是「刷新就白屏」的原因。

解决办法是**回退路由**：任何不匹配静态资源的请求，都返回 \`index.html\`，让前端路由接管。

\`\`\`nginx
location / {
  try_files $uri $uri/ /index.html;
}
\`\`\`

Node（Express）里：

\`\`\`js
const history = require('connect-history-api-fallback')
app.use(history({ index: '/index.html' }))   // 注意：放在所有接口之后
\`\`\`

顺序很关键：写在接口之前，会把 API 请求也返回成 HTML，前端拿到一堆 \`<!DOCTYPE html>\` 而不是 JSON。

### 部署在子目录

\`\`\`js
createRouter({
  history: createWebHistory('/admin/'),
  routes
})
\`\`\`

同时 \`vite.config.js\` 里设置 \`base: '/admin/'\`，Nginx 的 \`try_files\` 指向 \`/admin/index.html\`。三处都要改，漏一处就白屏。

### 怎么选

| 场景 | 建议 |
| --- | --- |
| 内部系统、无 SEO 需求 | hash 最省事 |
| 官网、需要被收录 | history + 服务端回退 |
| 无法改服务端配置 | 只能用 hash |
| 需要分享带路径的链接 | history 更友好 |

> 💡 有些团队用 history 模式但部署到静态托管（如 GitHub Pages），这时可以用 404.html 复制 index.html 的技巧兜底。原理相同：任何路径都返回同一个入口页。`
    },
    {
      no: 48,
      title: '导航守卫：拦截与放行',
      lessons: '085–086',
      summary: '守卫是路由跳转过程中的钩子；返回值决定放行、重定向还是取消，别再依赖 next()。',
      points: [
        '全局前置 beforeEach 最常用，登录校验放这里',
        '返回 false 取消，返回路由地址则重定向',
        'beforeEach 里用 return 替代 next()，更不易漏写',
        '组件内守卫 beforeRouteEnter 拿不到 this，可用回调'
      ],
      body: `### 三类守卫

| 类型 | 钩子 | 注册位置 |
| --- | --- | --- |
| 全局 | \`beforeEach\`、\`beforeResolve\`、\`afterEach\` | router 实例 |
| 路由独享 | \`beforeEnter\` | 单条路由记录 |
| 组件内 | \`beforeRouteEnter\`、\`beforeRouteUpdate\`、\`beforeRouteLeave\` | 组件 |

### 全局前置守卫：登录拦截

\`\`\`js
router.beforeEach((to, from) => {
  const isAuthenticated = !!localStorage.getItem('token')

  if (!isAuthenticated && to.name !== 'Login') {
    return { name: 'Login', query: { redirect: to.fullPath } }   // 重定向并记住来源
  }
  // 什么都不返回 = 放行
})
\`\`\`

三个参数的角色：

- \`to\`：即将进入的路由对象。
- \`from\`：即将离开的路由对象。
- 返回值：\`false\` 取消、路由地址重定向、\`true\`/\`undefined\` 放行。

Vue Router 4 支持返回值写法，也兼容旧的 \`next()\`。**推荐返回值**，因为 \`next\` 漏调用会导致跳转卡死，而且「调用两次 next」是常见 bug。

### 一个完整的权限流程

\`\`\`js
router.beforeEach(async (to) => {
  // 1. 公开页面直接放行
  if (to.meta.public) return true

  // 2. 未登录 → 去登录页
  if (!store.token) return { name: 'Login', query: { redirect: to.fullPath } }

  // 3. 已登录但还没有用户信息 → 拉一次
  if (!store.user) await store.fetchUser()

  // 4. 角色不匹配 → 403
  if (to.meta.role && !store.user.roles.includes(to.meta.role)) {
    return { name: 'Forbidden' }
  }

  return true
})
\`\`\`

把「公开」「需要角色」写进 \`meta\`，守卫逻辑与具体页面解耦。

### 组件内守卫

\`\`\`js
export default {
  beforeRouteEnter(to, from, next) {
    // 此时组件还没创建，this 是 undefined
    next((vm) => { vm.init() })
  },
  beforeRouteUpdate(to, from) {
    // 同一组件、参数变化（如 /user/1 → /user/2）
  },
  beforeRouteLeave(to, from, next) {
    if (this.hasUnsaved) {
      const ok = confirm('有未保存的修改，确定离开？')
      if (!ok) return next(false)
    }
    next()
  }
}
\`\`\`

\`beforeRouteLeave\` 是唯一「真正有用」的组件守卫：防止用户误关填了一半的表单。\`beforeRouteEnter\` 因为拿不到 \`this\`，通常不如直接在 \`created\` 里写逻辑。

### 常见坑

| 坑 | 现象 | 解法 |
| --- | --- | --- |
| 登录页也被拦截 | 无限重定向 | 判断 \`to.name !== 'Login'\` |
| 守卫里发请求没有 await | 用旧数据判断 | 改成 \`async\` 并 await |
| \`next()\` 调用两次 | 控制台报错 | 用 \`return\` 写法 |
| \`afterEach\` 里改路由 | 循环 | \`afterEach\` 只做埋点、改标题 |

> 💡 \`afterEach\` 适合改 \`document.title\`、上报页面浏览。它不能阻止导航，也没有 \`next\`。`
    },
    {
      no: 49,
      title: '路由懒加载与组合式路由',
      lessons: '087–088',
      summary: '把 import 变成函数，路由就按页面切包；组合式里用 useRoute / useRouter 取代 this。',
      points: [
        '静态 import 会把所有页面打进主包',
        '动态 import 返回 Promise，路由切换时才加载',
        '按路由分包是最自然的代码分割粒度',
        'useRoute 读信息，useRouter 做跳转，都是组合式函数'
      ],
      body: `### 从静态导入到动态导入

\`\`\`js
// ❌ 所有页面进主包，首屏体积大
import UserDetails from './views/UserDetails.vue'
const routes = [{ path: '/users/:id', component: UserDetails }]

// ✅ 切到这个路由才下载
const routes = [
  { path: '/users/:id', component: () => import('./views/UserDetails.vue') }
]
\`\`\`

\`import()\` 返回 Promise，Vue Router 会自动等待它 resolve。构建工具看到这种写法就会拆成独立 chunk。

### 打包结果长什么样

\`\`\`text
dist/assets/
├── index-xxxx.js          # 主包：vue、router、公共组件
├── Home-yyyy.js           # 首页 chunk
├── UserDetail-zzzz.js     # 详情页 chunk
└── ...
\`\`\`

首屏只需要主包 + 当前路由的 chunk。用户点进详情页时才请求对应文件——这就是「按路由分包」的价值。

| 方式 | 首屏体积 | 切换体验 |
| --- | --- | --- |
| 静态导入 | 大 | 切换快（已加载） |
| 动态导入 | 小 | 首次切换有等待 |
| 动态导入 + 预取 | 小 | 快（空闲时预加载） |

### 分组与预加载

\`\`\`js
// 同一组的 chunk 打在一起
const UserList = () => import(/* webpackChunkName: "user" */ './views/UserList.vue')
const UserDetail = () => import(/* webpackChunkName: "user" */ './views/UserDetail.vue')
\`\`\`

Vite 里用 \`build.rollupOptions.output.manualChunks\` 控制分组。预加载则可以在空闲时手动触发：

\`\`\`js
router.isReady().then(() => {
  import('./views/HeavyChart.vue')     // 空闲时偷偷下载
})
\`\`\`

### 组合式 API 中使用路由

\`\`\`vue
<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, watch } from 'vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id)
const keyword = computed(() => route.query.q || '')

watch(() => route.params.id, (val) => {
  if (val) loadDetail(val)
}, { immediate: true })

function goList() {
  router.push({ name: 'list', query: { page: 1 } })
}
</script>
\`\`\`

与选项式的对应：

| 选项式 | 组合式 |
| --- | --- |
| \`this.$route\` | \`useRoute()\` |
| \`this.$router\` | \`useRouter()\` |
| \`beforeRouteUpdate\` | \`watch(() => route.params)\` |
| \`beforeRouteLeave\` | 仍需组件内守卫（或 \`onBeforeUnmount\`） |

### 路由级数据获取的两种时机

\`\`\`js
// 1. 组件内（推荐）：进入组件后请求，配 loading 状态
onMounted(fetchData)

// 2. 守卫内：进入前请求，跳转前数据就绪
beforeRouteEnter(to, from, next) {
  fetchData(to.params.id).then(() => next())
}
\`\`\`

方式 1 交互更自然（能看到骨架屏），方式 2 适合「数据不存在就跳 404」的场景。不要两种混用，会造成重复请求。

> ⚠️ 懒加载的组件如果加载失败（网络、版本更新后旧 chunk 被删），表现为白屏。上线后更新频繁的项目要监听 \`router.onError\`，提示用户刷新。`
    }
  ]
});
