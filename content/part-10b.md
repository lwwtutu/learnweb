===PART===
id: part-10
order: 10
title: 前后端交互与异步
range: 135–154
desc: 从原生 XHR 到 ajax 封装，再到 Promise 与 async/await 掌握前后端数据交互
===CH===
no: 116
title: Promise 基础语法
lessons: 145
summary: Promise 是未来值的容器，三状态不可逆，then 链把异步排队、catch 统一兜错
points: 三状态从 pending 到 fulfilled 或 rejected，敲定后不可再变 || new Promise 的执行器同步跑，then 回调排进微任务 || then 返回新 Promise，return 一个 Promise 会自动拆包等待 || 链尾一个 catch 就能接住任意一步的失败 || Promise.all 并发且按数组顺序给结果，race 取最先结束的
===BODY===
### 三种状态与不可逆

Promise 是一个装「未来结果」的容器：创建时没有值，将来一定给出成功或失败。

它需要状态来记录进度，因为异步结果不会立刻到达，得有个地方标出「还在等」还是「已有结论」。

| 状态 | 含义 | 由谁触发 |
|---|---|---|
| pending | 待定，还没有结果 | new Promise 之后的初始态 |
| fulfilled | 已兑现，成功 | 调用 resolve(value) |
| rejected | 已拒绝，失败 | 调用 reject(reason) |

状态只能敲定一次。第一次 resolve 或 reject 后就固定，后面再调用会被静默忽略，不报错也不生效。

- resolve 不是 return，执行器里它后面的代码照样会跑
- 想在兑现后停掉逻辑，得自己补一句 return

> ⚠️ 因为状态不可逆，把 resolve 当成流程终止符是常见误用；要中断请显式 return。

### new Promise 与执行器

new Promise 接收一个执行器函数，参数是 resolve 与 reject，由你在异步完成时选用其一。

执行器本身是同步执行的，只有 then 里的回调被延后到微任务。这样设计让「发起异步」和「处理结果」分处两个时机。

```js
var p = new Promise((resolve, reject) => {
    setTimeout(() => resolve(["a", "b"]), 1000)
})
p.then(res => console.log(res))    // => ["a", "b"]
p.catch(err => console.log(err))
```

同步代码先跑完，才轮到微任务里的 then，所以 Promise 不是把同步变异步，而是把回调延后排队。

> ⚠️ 只有 resolve 或 reject 被调用，Promise 才会有结果；一直不调用就永远停在 pending。

把三处 `console.log` 放一起，能看清哪段同步、哪段延后：

```js
var q = new Promise(function (resolve, reject) {
    console.log("Promise 里的代码")     // ① 立刻执行
    resolve("ok")
})
console.log("外面")
q.then(res => console.log("then 里"))
// 输出顺序：Promise 里的代码 → 外面 → then 里
```

执行器在创建时立即跑完，`then` 被排到微任务，等外层同步代码结束后才执行。

### then 的返回值与链式

then 每次都返回一个新的 Promise，这正是能一路 .then 接下去的原因。

下一个 then 收到什么，取决于上一个 then 里 return 了什么，所以链式其实是一条「结果接力」。

- return 普通值：下一个 then 原样收到这个值
- return 一个 Promise：自动拆包，等它完成再把结果传下去
- 什么都不 return：下一个 then 收到 undefined
- 抛出 throw：跳过后续 then，交给最近的 catch

返回 Promise 会自动等待，这一点最省事：把下一步的异步请求直接 return 出去，链就会停在那里等它就绪。

也正因为如此，串行依赖不必再往回调里套，顺序被拉成一条直线，读代码时从上往下即可。

> ⚠️ 少写一个 return，后面所有 then 拿到的都是 undefined，这是 Promise 链最常见的 bug。

### catch 统一捕获错误

catch 接住 rejected，也接住 then 回调里抛出的异常，错误会顺着链冒泡到最近的一个 catch。

因为每一步都可能失败，把兜底集中到链尾，就不必像回调那样每层各写一份 error。

```js
pajax({ url: "/news" })
    .then(res => pajax({ url: "/comments", data: { newsId: res[0].id } }))
    .then(res => console.log(res))
    .catch(err => console.log("任意一步出错", err))
```

任意一步 reject 或抛错，后面的 then 全部跳过，直接落到末尾的 catch；finally 则无论成败都会执行。

> 💡 catch 只捕获它前面的失败；若 catch 之后还接了 then，那一段需要另配兜底。

### Promise.all 与 race 对照

静态方法用来管理多个 Promise，最常用的是并发与竞速两种组合。

因为请求之间未必有依赖，能同时发就不该排队，这正是 all 的用武之地。

| 方法 | 成败规则 | 结果 | 典型用途 |
|---|---|---|---|
| Promise.all | 全成功才成功，一个失败整体失败 | 按传入顺序组成的数组 | 并发请求，等齐再渲染 |
| Promise.race | 第一个结束的决定结果 | 最先敲定的那个值 | 超时控制 |
| Promise.allSettled | 等全部结束，不管成败 | 每项带自身状态 | 批量任务汇总 |

all 的结果顺序由数组位置决定，不由谁先返回决定，别把 res[0] 当成「最快那个」。

> 💡 互相独立用 Promise.all 并发；存在先后依赖时才用 then 链串行，两者别混。

===CH===
no: 117
title: Promise 封装 ajax
lessons: 146
summary: 用 Promise 把回调式 ajax 包一层，success 与 error 分别对应 resolve 与 reject
points: pajax 把 success、error 分别接到 resolve、reject || ...options 先展开，后写的 success 与 error 会覆盖调用方的回调 || 封装后串行请求用 then 链，缩进恒定、错误统一进 catch || then 里忘 return 会拿到 undefined，底层缺 onerror 会永久 pending
===BODY===
### 为什么要把 ajax 包一层

pajax 是给回调式 ajax 套一层 Promise，让调用方从传回调改成挂 then。

因为前面封装的 ajax 仍靠 success、error 通知结果，而链式写法只认 Promise，中间就得有个转换器。

| 老 ajax（回调） | pajax（Promise） |
|---|---|
| success(res) | resolve(res) → then(res) |
| error(err) | reject(err) → catch(err) |
| 传入 success 函数 | 不传，改用 then |
| 传入 error 函数 | 不传，改用 catch |

本质是把「回调注入」换成「状态通知」：不再把两个函数交给别人调用，而是自己往结果上挂处理。

这样老 ajax 的实现一字不用改，就能被链式写法复用。调用方从「交出两个函数」变成「拿到对象自己挂处理」，主动权换了位置。

### 把 XHR 包进 Promise

实现只需 return 一个 new Promise，在执行器里发起原来那次 ajax。

因为 Promise 只有 resolve 或 reject 被调用才会有结果，把成功回调接到 resolve、失败回调接到 reject 就完成了桥接。

```js
function pajax(options) {
    return new Promise((resolve, reject) => {
        ajax({
            ...options,
            success: res => resolve(res),
            error: err => reject(err)
        })
    })
}
```

`...options` 先展开，后面再写自己的 success 与 error。对象字面量「后写覆盖先写」，调用方就算传了回调也会被盖掉。

> 💡 这层包装只在「上游是回调式 API」时才需要；若上游已是 Promise，直接返回即可，别多包一层。

用 `success(res){ resolve(res) }` 而不是直接写 `success: resolve`，是因为显式包一层便于日后先判断、加工数据再兑现。

### 调用方式从回调变成 then 链

封装后串行请求不再往里缩，而是用 then 一步步往下接。

因为每一步都能 return 下一个 pajax，后续 then 就自然排在后面，顺序一眼看穿，缩进也恒定。

```js
pajax({ url: "/news" })
    .then(res => pajax({ url: "/comments", data: { newsId: res[0].id } }))
    .then(res => console.log(res))
    .catch(err => console.log(err))
```

| 对比 | 回调 | Promise 链 |
|---|---|---|
| 缩进 | 每层加一格 | 恒定为 0 |
| 错误处理 | 每层写 error | 一个 catch |
| 加一步 | 往里插一层 | 末尾接一个 then |

一条链上任意一步失败都会跳到末尾的 catch，这是回调写法最难做到的统一兜底。

因为每一步只依赖前一步的返回值，想加一步只需在末尾接一个 then，不必回头改动已有的缩进结构。

### 两个必须留意的细节

then 里若忘记 return 下一个 pajax，后续 then 会立刻执行并拿到 undefined。

因为 then 只把 return 出去的 Promise 纳入等待，少写就断链，最常见的一字 bug 就在这里。

- 少写 return：后面的结果全是 undefined
- 底层 ajax 缺 onerror：断网或跨域时两个回调都不触发
- Promise 因此永远 pending，then 与 catch 都不执行

补法很直接：在底层 ajax 里给 onerror 与 ontimeout 各调一次 error，再设一个 timeout 上限，让网络层失败也能落进 reject。

> ⚠️ 永久 pending 是 Promise 唯一的「静默失败」形态，排查时先确认底层回调是否补齐 onerror 与 ontimeout。

补齐网络层回调，才能让失败也走到 reject：

```js
xhr.onerror = () => error("网络错误")
xhr.ontimeout = () => error("请求超时")
xhr.timeout = 10000
```

跨域被拦、断网或超过 10 秒时，`error` 被调用，Promise 转为 rejected，链尾的 `catch` 才有机会执行。

===CH===
no: 118
title: Promise 版 ajax 案例
lessons: 147
summary: 同一个案例只换取数据方式，getList 返回 Promise，独立请求交给 Promise.all 并发
points: 换请求库只动数据层，render 与类骨架不用改 || getList 返回 Promise 而非自己处理，职责更单一 || 两个独立请求用 Promise.all 并发，结果按数组顺序 || loading 要在 finally 里关，否则失败时一直转圈
===BODY===
### 需求与思路

同一份「先列表、后详情」的业务，把上一章的回调式请求包成 Promise。封装只管一件事：请求成功就 `resolve` 解析后的数据，失败就 `reject` 一个错误。

调用方于是可以链式书写：`.then` 里拿列表并渲染，顺手 `return` 详情请求，下一个 `.then` 接住详情继续画，整条链末尾挂一个 `.catch` 统一兜底。

### 完整案例代码

```js
// 依赖：页面有 <ul id="list"> 与 <p id="detail">；用公开测试接口，可换成自己的地址
function pajax(url) {
  return new Promise(function (resolve, reject) {   // ← 关键点：回调式请求包进 Promise 才能链式使用
    var xhr = new XMLHttpRequest()
    xhr.open("GET", url)
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText))        // ← 关键点：成功 resolve，值传给下一个 then
      } else {
        reject(new Error("请求失败 " + xhr.status))   // ← 关键点：失败 reject，链子直接跳到 catch
      }
    }
    xhr.onerror = function () { reject(new Error("网络异常")) }
    xhr.send()
  })
}

var API = "https://jsonplaceholder.typicode.com/photos"
function getList() { return pajax(API + "?_limit=5") }   // 只负责取，不碰 DOM
function getDetail(id) { return pajax(API + "/" + id) }

getList()
  .then(function (list) {
    console.log(list.length)                             // => 5
    document.getElementById("list").innerHTML =
      list.map(item => `<li data-id="${item.id}">${item.title}</li>`).join("")
    return getDetail(list[0].id)    // ← 关键点：then 里返回新 Promise，链子会等它兑现再往下走
  })
  .then(function (photo) {
    document.getElementById("detail").textContent = photo.title
  })
  .catch(function (err) {           // ← 关键点：一个 catch 兜住链上任意一步的失败
    document.getElementById("list").textContent = "加载失败：" + err.message
  })
```

### 关键知识点

- **包一层 Promise，结果才能被传递**：XHR 只能靠回调把结果交出去，函数没法 `return` 数据。包成 Promise 后，取数函数只负责「给一个将来会有值的对象」，怎么用交给调用方，职责自然分开。
- **成功 `resolve`、失败 `reject` 缺一不可**：只在 200 时 `resolve`、其余状态和 `onerror` 都 `reject`，状态机才完整。少了 `reject`，请求失败时 Promise 永远挂起，`then` 不执行、`catch` 也不触发，页面空白而且没有报错可查。
- **`then` 里要 `return` 新 Promise 才能串起来**：不 `return` 直接调用，下一个 `then` 立刻拿到 `undefined`，详情数据接不上。`return` 之后链子自动等待它兑现并拆包，这正是「先 A 后 B」的写法来源。
- **`catch` 写在链尾统一兜底**：任意一步 `reject` 都会跳过后面的 `then` 直达末尾的 `catch`，省掉每步一个错误分支。`reject` 里传 `Error` 对象而不是字符串，能保留调用栈，排查时好定位。
===CH===
no: 119
title: async 和 await 语法
lessons: 148
summary: async 让函数返回 Promise，await 把等待写成同步赋值，try 与 catch 统一兜底
points: async 把返回值包装成 Promise，throw 变成 rejected || await 等 Promise 兑现并把值赋给变量，写法像同步 || await 只挂起当前函数，主线程同步代码照常先跑 || try 里任一步失败都跳 catch，与链尾 catch 等价
===BODY===
### async 让函数返回 Promise

async 加在函数前，作用只有一个：把返回值自动包装成 Promise。

因为调用方要能用 then 接结果，函数不必自己 new Promise，写 return 就够了。

```js
async function f() { return 100 }
f().then(v => console.log(v))      // => 100
async function g() {}               // => Promise {<fulfilled>: undefined}
```

不写 return 得到 undefined 的 Promise，函数里 throw 则得到 rejected 的 Promise，规则与普通 return 一一对应。

> ⚠️ async 只是「返回 Promise 的普通函数」，它不会把同步代码变成异步。

因为返回值已被包装，调用方一律用 `.then` 或 `await` 去接；函数内部照常写同步语句，不必自己 new Promise。

### await 把结果赋给变量

await 放在 Promise 前，等它兑现后把值赋给左边的变量。

因为它让异步结果长得像同步返回值，串行步骤就能顺着写，不必再往回调里钻。

| 写法 | 心智模型 |
|---|---|
| 回调 success(res) | 结果被送进函数 |
| then(res => ...) | 结果流到下一步 |
| var res = await ... | 结果赋值给变量 |

await 后面也可以接普通值，此时直接拿到值本身；接 Promise 才真正等待。

> 💡 await 只能写在 async 函数里，普通函数中使用会直接语法报错。

拆开看是四步：先执行表达式拿到 Promise，再挂起函数让出控制权，等它兑现后把值赋给变量，最后从挂起处继续往下跑。

两个高频误用：漏写 await 会拿到 Promise 对象而非数据；forEach 不会等待 async 回调，要串行得改用 for...of。

`forEach` 不会等回调里的 `await`，后面的日志会抢先打印：

```js
async function loadAll(items) {
    items.forEach(async item => {
        await pajax({ url: `/detail/${item.id}` })
    })
    console.log("全都发完了？没有")

    // 用 for...of 才能真的一个等一个
    for (const item of items) {
        await pajax({ url: `/detail/${item.id}` })
    }
}
```

`forEach` 只是把 async 回调挨个调一遍，不收集它们返回的 Promise；`for...of` 里的 `await` 才会逐个挂起等待。

### await 暂停的是函数，不是线程

await 挂起的是当前 async 函数，主线程并不停下来。

因为 JS 单线程不能冻结页面，函数让出控制权后，外面的同步代码照常先跑完。

```js
async function f() {
    console.log("1")
    await pajax({ url: "/news" })
    console.log("2")
}
f()
console.log("3")
// => 1 → 3 → 2
```

输出顺序里 3 在 2 前面，正说明 await 只是「我在这儿等，你先忙」，不是「全世界停下等我」。

因为它让出的只是当前函数的执行权，页面不会冻结，点击与渲染照常进行；若真停住线程，体验会和同步 XHR 一样糟。

也正因为函数被挂起，await 之后的语句全被排到兑现之后执行；数据没回来前，它们一行都不会跑。

### try...catch 与 then 写法的对照

await 版本用 try...catch 兜错，与 then 链末尾的 catch 是同一件事。

因为 try 块里任何一步 await 失败都会跳到 catch，且后面的 await 不再执行，等于统一截断。

| then 写法 | await 写法 |
|---|---|
| pajax(a).then(res => ...) | var res = await pajax(a) |
| 链尾 .catch(err => ...) | try { } catch (err) { } |
| .finally(() => ...) | try { } finally { } |
| Promise.all([...]).then(...) | await Promise.all([...]) |

回调、then 链、async/await 三种写法语义完全等价，底层都是 Promise；区别只在读起来是嵌套、流式还是顺序赋值。

catch 只是接住错误，不会终止函数，后面的代码仍会继续；想中断要自己 return。

===CH===
no: 120
title: async 和 await 案例
lessons: 149
summary: 把 then 链换成 await，数据流不变，构造函数不能 async 就用 init 接住
points: 把 then 换成 await，请求与渲染的数据流不变 || 单请求 await 不比 then 短，多步串行才显优势 || 构造函数不能 async，init 里仍用 then 接结果 || 独立请求交给 Promise.all，收尾放到 finally
===BODY===
### 需求与思路

首页要同时展示列表、轮播图和第一条的详情。列表与轮播互不依赖，适合一起发出；详情需要列表第一条的 id，只能等列表回来再发。

用 `async` 包住整段流程，`await` 把「等结果」写成顺序赋值；两条独立请求用 `Promise.all` 并行，`try...catch` 统一接收任意一步的失败。

### 完整案例代码

```js
// 依赖：上一章的 pajax(url)（成功 resolve 数据、失败 reject）；页面有 #list、#banner、#detail
var API = "https://jsonplaceholder.typicode.com/photos"

async function loadHome() {                    // ← 关键点：async 函数一定返回 Promise
  try {
    var tasks = [pajax(API + "?_limit=5"), pajax(API + "/1")]   // 两个请求立刻发出
    var [list, banner] = await Promise.all(tasks)               // ← 关键点：并行等齐，别写两个顺序 await
    document.getElementById("list").innerHTML =
      list.map(item => `<li data-id="${item.id}">${item.title}</li>`).join("")
    document.getElementById("banner").src = banner.thumbnailUrl

    var detail = await pajax(API + "/" + list[0].id)   // ← 关键点：依赖列表结果，只能串在后面
    document.getElementById("detail").textContent = detail.title
  } catch (err) {                              // ← 关键点：任一 await 失败都跳到这里，后续步骤跳过
    document.getElementById("list").textContent = "加载失败：" + err.message
  }
}

var task = loadHome()
console.log(task instanceof Promise)           // => true
task.then(function () { console.log("渲染完成") })
```

### 关键知识点

- **`async` 把返回值包成 Promise**：函数里写不写 `return`，调用后拿到的都是 Promise，`return` 的值只是它的兑现结果。所以 `loadHome()` 不能直接当数据读，要继续 `await` 或接 `.then`，否则只能得到 Promise 对象。
- **`await` 只挂起当前函数**：它等的是 Promise 兑现后的值，别的同步代码照常先执行，页面不会卡住，这一点和同步 XHR 完全不同。等待的对象不是 Promise 时会被原样返回，不会报错。
- **`try...catch` 一处兜底**：任一 `await` 的对象 `reject`，异常会就地抛出，后面的渲染语句全部跳过，直接被 `catch` 接住。相比每步都写 `.catch`，它还能防止「请求失败了却继续画半截页面」。
- **独立请求用 `Promise.all` 才并行**：两个 `await` 顺序写是串行，总耗时相加；先各自发出、再用 `all` 一起等，耗时只取最长那个，结果按传入顺序返回。依赖上一步结果的请求必须串行，塞进 `all` 就取不到 id 了。
===CH===
no: 121
title: fetch
lessons: 150
summary: fetch 是浏览器原生的 Promise 版 ajax，404 不进 catch，取数据要两步解析
points: fetch 原生返回 Promise，URL 加第二个配置对象 || 404、500 不进 catch，必须自己判 res.ok || res.json() 本身是异步的，所以取数据要两步 || body 不会自动序列化，传 JSON 要配 content-type || fetch 不支持上传进度，这类需求仍要用 XHR
===BODY===
### fetch 的基本用法

fetch 是浏览器内置的 Promise 版 ajax，传 URL 返回一个 Promise，不再需要自己封装 XHR。

因为它是原生 API，调用形态更短；配合 await 时，取一次数据要分两步写。

```js
async function get(url) {
    var res = await fetch(url)        // 第一次：拿到 Response
    if (!res.ok) throw new Error(res.status)
    return res.json()                  // 第二次：解析 body
}
```

参数形式是「URL 加第二个配置对象」，GET 的查询串要自己拼在地址上，没有 data 自动序列化。

和自己封装的 ajax 相比，fetch 是浏览器内置、返回 Promise、解析要手动调 res.json()；GET 参数也不再帮忙自动拼。

### catch 不会捕获 4xx 的坑

fetch 的 Promise 只在网络层失败时 reject，HTTP 的 404、500 都被当成「请求成功完成」。

因为它把「连上了服务器」和「业务成功」当成两件事，状态码必须自己看 res.ok 判断。

| 情况 | XHR | fetch |
|---|---|---|
| 200 | onload + status 200 | then + res.ok 为 true |
| 404 / 500 | onload + status 404 | then + res.ok 为 false |
| 断网 / 跨域被拦 | status 0 | catch（Failed to fetch） |

> ⚠️ 忘记判 res.ok，404 时会去解析一个 HTML 错误页，报出 Unexpected token 之类的解析错。

### Response 对象与 json()

第一次 await 拿到的是 Response：响应头已就绪，响应体还是一段没读完的流。

因为读流并解析也是异步，res.json() 本身返回 Promise，所以需要第二次 await。

- res.json()：按 JSON 解析成对象
- res.text()：取纯文本或 HTML 字符串
- res.blob()：取图片、文件等二进制
- res.arrayBuffer()：取原始二进制缓冲

> ⚠️ 响应体是流，res.json() 只能调用一次；再调会报 body stream already read，要复用就先存成文本。

也就是说，第一次 await 只等到了响应头，body 仍是流；res.json() 负责读流加解析，本身又是一次异步，才凑成「两次」。

### 第二个参数配置请求

非 GET 请求靠第二个对象配置方法、请求头与请求体。

因为 fetch 不会自动序列化，传 JSON 时必须手动 stringify 并配好 content-type，否则后端解析不出字段。

```js
await fetch("/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "kerwin" })
})
```

- body 只能收字符串，直接传对象会变成 [object Object]
- GET 与 HEAD 不允许带 body，写了会抛类型错误
- PUT 整条替换、PATCH 只改传了的字段，语义与前面一致

### 与 XHR 的差异表

fetch 更简洁，但并非处处替代 XHR，两者的能力边界并不相同。

因为进度、超时这类能力在 fetch 里要么没有、要么要另配，选型时得按需求权衡。

| 维度 | XMLHttpRequest | fetch |
|---|---|---|
| 语法 | 四步加事件 | 一行返回 Promise |
| 404 处理 | 手动查 status | 手动查 res.ok |
| 上传进度 | 支持 | 不支持 |
| 超时 | xhr.timeout 原生 | 需 AbortController |
| IE 兼容 | IE9 起 | 完全不支持 |

真实项目通常先封一个 request：内部统一判 res.ok、统一 json()，业务里只传 URL 与配置，省去每处重复这两步。

这层封装很短，把两件琐事收在一处：

```javascript
async function request(url, options = {}) {
    const res = await fetch(url, {
        headers: { "content-type": "application/json" },
        ...options
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return res.json()
}
```

非 2xx 直接抛错，交给调用方的 `catch`；成功则返回解析后的对象。这和前面封装 `ajax`、`pajax` 是同一个思路，只是底层换成 fetch。

> 💡 要上传进度条就用 XHR；日常请求可先封一层统一处理 res.ok 与 json()，再在业务里调用。

===CH===
no: 122
title: fetch 案例
lessons: 151
summary: 把 pajax 换成 fetch 只多一步 json 解析，并发前先把数据解析挂上
points: pajax 换 fetch 只多一步 res.json 解析 || await 与 then 混用别超过一层，否则可读性下降 || Promise.all 只等齐不解析，并发前先挂 then(json) || 没判 res.ok 时 404 也会提示成功，是假成功
===BODY===
### 需求与思路

用原生 `fetch` 完成一次「加载留言 + 提交留言」。GET 请求只传地址；提交要走 POST，第二个参数里写清方法、请求头和请求体。

`fetch` 兑现的是 Response 而不是数据，所以每次都要多一步 `await res.json()`；它只在断网时 reject，404、500 照样算「成功收到响应」，必须自己判 `res.ok`。

### 完整案例代码

```js
// 依赖：页面有 <input id="text">、<button id="send">、<ul id="list">；用公开测试接口，可换自己的地址
var API = "https://jsonplaceholder.typicode.com/comments"

async function getList() {
  var res = await fetch(API + "?_limit=3")     // ← 关键点：兑现的是 Response，不是数据
  if (!res.ok) throw new Error("列表加载失败 " + res.status)  // ← 关键点：4xx/5xx 不进 catch，要自己判
  var list = await res.json()                  // ← 关键点：再 await 一次才得到对象
  document.getElementById("list").innerHTML =
    list.map(item => `<li>${item.name}</li>`).join("")
  console.log(list.length)                     // => 3
}

async function addItem(text) {
  var res = await fetch(API, {                 // ← 关键点：第二个参数传请求配置
    method: "POST",
    headers: { "Content-Type": "application/json" },  // 不声明，后端会按表单解析
    body: JSON.stringify({ name: text })       // body 只能是字符串
  })
  if (!res.ok) throw new Error("提交失败 " + res.status)
  var created = await res.json()
  document.getElementById("list").innerHTML += `<li>${created.name}</li>`
  return created
}

document.getElementById("send").onclick = function () {
  var input = document.getElementById("text")
  addItem(input.value || "默认内容").catch(function (err) {
    alert(err.message)                         // async 函数里的异常，外面用 catch 接
  })
  input.value = ""
}

getList().catch(function (err) {
  document.getElementById("list").textContent = err.message
})
```

### 关键知识点

- **`fetch` 只在网络层失败时 reject**：断网、地址不可达才进 `catch`；404、500 是「服务器正常回了话」，走 `then`。所以必须自己 `if (!res.ok) throw`，把状态码错误转成异常，否则错误页会被当数据解析，甚至出现「删除成功」的假成功。
- **取数据要两次 `await`**：第一次兑现得到 Response，响应体是流，`res.json()` 又返回 Promise，再 `await` 才拿到对象。只 `await` 一次就取字段，结果是 `undefined`；另外 `json()` 只能读一次，读第二遍会报错。
- **请求配置全在第二个参数**：`method` 默认是 GET，POST 必须显式写；带 JSON 要设 `Content-Type: application/json`，并用 `JSON.stringify` 把对象转成字符串。漏了请求头，后端按表单解析，收到的是空对象。
- **`res.ok` 等价于状态码 200–299**：它是个只读布尔值，比手写 `status >= 200 && status < 300` 更省事，用来区分「业务成功」与「响应到达」这两件事。
===CH===
no: 123
title: 大案例-接口分析
lessons: 152
summary: 动手前先看清 goods 字段、分页参数与响应头总数，再决定渲染方式
points: 写代码前先打开接口，看清 body 与响应头的形状 || goods 八个字段里，列表只用 id、title、poster || poster 是相对路径要补域名，desc 是绝对地址直接用 || 总数在响应头 X-Total-Count，读出来是字符串要转数字
===BODY===
### 需求与思路

案例是「无限滚动的商品列表 + 详情页」。动手前先打开接口看清数据：`goods` 集合 16 条、每页 5 条，正好四页，末页还不满。

列表只需要 `id`、`title`、`poster`；详情要用 `feature`、`price`、`desc`。两类接口返回的形状不同——分页列表是数组、总数藏在响应头，详情是单个对象。

既然地址拼接和错误判断完全一样，就把请求收拢到一个函数里，各自只负责拼路径和渲染；换环境时只改一处 `BASE_URL`。

### 完整案例代码

```js
// 依赖：json-server 托管 db.json（goods 16 条），页面在别的端口，属于跨域请求
var BASE_URL = "http://localhost:3000"        // ← 关键点：数据服务地址抽成常量，换环境只改这一行
var PAGE_SIZE = 5

// 接口文档里的字段：id / title / feature / price / poster / desc
function pick(item) {
  return { id: item.id, title: item.title, poster: BASE_URL + item.poster }  // ← 关键点：poster 是相对路径，必须补域名
}

async function request(path) {                 // ← 关键点：地址拼接与错误判断只写一次，两类接口共用
  var res = await fetch(BASE_URL + path)
  if (!res.ok) throw new Error(path + " 请求失败：" + res.status)
  return res
}

async function getPage(page) {
  var res = await request(`/goods?_page=${page}&_limit=${PAGE_SIZE}`)   // ← 关键点：列表接口，返回数组
  var total = Number(res.headers.get("X-Total-Count"))   // 总数只在响应头，且是字符串
  var list = await res.json()
  return { list: list.map(pick), total }       // => { list: [5 条], total: 16 }
}

async function getDetail(id) {
  var res = await request("/goods/" + id)      // ← 关键点：详情接口返回单个对象，不能当数组遍历
  return res.json()
}

async function run() {
  var first = await getPage(1)
  console.log(first.list.length, first.total)  // => 5 16
  var info = await getDetail(first.list[0].id)
  console.log(info.title)                      // => "荣耀9X"
}
run()
```

### 关键知识点

- **先读接口再写渲染**：字段名、类型、是不是数组，直接决定取值写法。`poster` 是相对路径要拼域名、`desc` 是绝对地址数组要 `map`，不看接口就写，页面只出空白和 `undefined`。
- **列表接口与详情接口形状不同**：分页列表返回数组，总数在响应头 `X-Total-Count`；详情返回单个对象。把详情结果当数组用，`length` 拿到 `undefined`，循环一次都不执行。
- **公共请求逻辑要抽出来**：拼地址、判 `res.ok`、抛错误集中在一个 `request` 里。散落到每个函数中，一处漏判就会把 404 的 HTML 当 JSON 解析，报 `Unexpected token '<'`。
- **跨域与 baseURL**：页面与数据不同源，写 `/images/1/poster.jpg` 会解析到页面所在源而 404，必须补全 `http://localhost:3000`。地址集中成常量，换环境只改一行。
===CH===
no: 124
title: 大案例-列表
lessons: 153
summary: 无限滚动靠页码、锁、总数三个状态，滚到底预加载下一页并追加渲染
points: 三个状态 current、isLoading、total 撑起整个列表 || 每页结果追加渲染，不能用 innerHTML 覆盖 || 列表底部减视口底部小于 50 像素就预加载下一页 || 加载完毕判断与 isLoading 锁拦住多余请求，finally 解锁
===BODY===
### 需求与思路

一进页面加载第一页，滚到接近底部自动加载下一页，全部加载完就不再加，点某一项跳到详情页。

整个过程由三个状态控制：当前页 `current`、是否在请求 `isLoading`、总条数 `total`。接口每页 5 条、总数从响应头拿，所以「页码自增 → 请求 → 读总数 → 拼 HTML 追加」就是一次加载的全部。

渲染用 `map` 拼成一整串再一次性插入，既避免循环里反复重排，也不会像 `innerHTML +=` 那样把旧节点上的点击事件整个清掉。

### 完整案例代码

```js
// 依赖：json-server 提供 /goods 分页接口；页面已有 <ul id="list">
var BASE_URL = "http://localhost:3000"
var current = 0                       // ← 关键点：页码、锁、总数三个状态撑起整个加载流程
var isLoading = false
var total = 0
var list = document.querySelector("#list")

function render(arr) {
  var html = arr.map(function (item) {
    // ← 关键点：data-id 把这一条的 id 写进 DOM，点击时才拿得到
    return `<li data-id="${item.id}">
      <img src="${BASE_URL}${item.poster}" loading="lazy" onerror="this.src='./img/none.png'">
      <h3>${item.title}</h3>
    </li>`
  }).join("")
  list.insertAdjacentHTML("beforeend", html)   // ← 关键点：一次性追加，旧节点的点击事件不会被清掉
}

async function getList() {
  current++
  var res = await fetch(`${BASE_URL}/goods?_page=${current}&_limit=5`)
  if (!res.ok) throw new Error("列表加载失败 " + res.status)
  total = Number(res.headers.get("X-Total-Count"))
  var arr = await res.json()
  if (!arr || arr.length === 0) return   // ← 关键点：先判空，空数组直接跳出，别渲染空 li
  render(arr)
}

window.onscroll = function () {
  if (list.children.length >= total || isLoading) return
  var bottom = list.offsetHeight + list.offsetTop
  var viewBottom = window.innerHeight + window.pageYOffset
  if (bottom - viewBottom < 50) {
    isLoading = true
    getList().catch(function () { current-- }).finally(function () { isLoading = false })
  }
}

getList().then(function () { console.log(list.children.length) })   // => 5
```

### 关键知识点

- **请求回来先判空**：末页可能只剩 1 条，出错时还可能拿到空数组。不判空就照常渲染，会插入一批空的 `li`，`children.length` 也随之虚高，加载完成判断从此永远不成立。
- **map 拼串再一次性插入**：`map` 得到片段数组、`join("")` 拼成整串，只写一次 DOM。用 `innerHTML +=` 会重建整个 `ul`，前面几十个 `li` 的点击事件全丢，无限滚动里是致命的。
- **给每项挂 `data-id`**：跳详情时用 `this.dataset.id` 就能拼出 `detail.html?id=3`。靠下标推算也可以，但中途过滤或排序后下标就和数据对不上了。
- **图片懒加载与错误兜底**：`loading="lazy"` 让屏幕外的图先不请求；`onerror` 换成占位图，某张路径错时不会留下一个破图标撑着布局。
===CH===
no: 125
title: 大案例-详情
lessons: 154
summary: 详情页从 URL 取 id，请求单条数据，再用类把取数与渲染拆成两步
points: 列表项跳转把 id 拼进查询串，循环变量要用 let || 取参用 new URL 的 searchParams，别手写 split 截取 || 类里把取数与渲染拆成两个方法，构造只发起初始化 || desc 数组要 map 再 join 拼成标签，绝对地址不用拼域名
===BODY===
### 需求与思路

详情页不知道用户点了哪一件商品，所以列表跳转时要把 id 拼进查询串：`detail.html?id=3`。

进来后第一件事是从地址栏取 id。用内置的 `URL` 配 `searchParams.get("id")`，它按名字取值、自动处理 `&` 与编码；手写 `split("=")` 一旦 URL 里有第二个等号就会取错。

拿到 id 再请求 `/goods/:id`，返回的是单个对象。渲染前先把容器清空，字段一个个给上默认值，图片数组再 `map` 成 `li` 一次性写入。

### 完整案例代码

```js
// 依赖：json-server 提供 /goods/:id；详情页有 h1、.feature、.price、ul.list
var BASE_URL = "http://localhost:3000"
var id = new URL(location.href).searchParams.get("id")   // ← 关键点：按参数名取值，别手写 split 截取
if (!id) location.replace("list.html")                  // 没带 id 就回列表，避免请求 /goods/null

class Detail {
  constructor(id) {
    this.id = id
    this.init()                  // ← 关键点：构造里只「发起」初始化，不依赖它的返回值
  }

  async init() {
    var info = await this.getInfo()
    this.render(info)
  }

  async getInfo() {
    var res = await fetch(`${BASE_URL}/goods/${this.id}`)  // ← 关键点：按 id 请求详情，返回对象不是数组
    if (!res.ok) throw new Error("详情加载失败 " + res.status)
    return res.json()
  }

  render(info) {
    var desc = Array.isArray(info.desc) ? info.desc : []   // ← 关键点：字段可能缺失，先给默认值兜底
    var price = info.price == null ? "--" : info.price
    document.querySelector("h1").textContent = info.title || "未命名商品"
    document.querySelector(".feature").textContent = info.feature || "暂无卖点"
    document.querySelector(".price").textContent = "价格：￥" + price

    var list = document.querySelector("ul.list")
    list.innerHTML = ""                                    // ← 关键点：渲染前清空容器，重复调用不会叠加旧图
    list.innerHTML = desc.map(function (url) {
      return `<li><img src="${url}" alt=""></li>`          // desc 是绝对地址，不用拼域名
    }).join("")
  }
}

new Detail(id)
console.log("id 类型：" + typeof id)   // => "id 类型：string"
```

### 关键知识点

- **从地址栏拿 id**：`searchParams.get` 永远返回字符串或 `null`，要参与运算必须先 `Number` 转换。值是 `null` 说明没带参数，应回列表，否则会发出 `/goods/null`。
- **按 id 请求详情，别再拿列表接口**：`/goods/:id` 返回一个对象，比拉整页列表再前端查找少传几十条数据。等着请求回来再渲染，页面自然会白一下，可以在容器里先放一句「加载中」。
- **渲染前先清空容器**：分多次写入或重复调用 `init` 时，不清空会越叠越多。整体赋一次 `innerHTML` 本身就是覆盖，但如果先追加后补写，就必须显式清空。
- **字段缺失给默认值**：`desc` 不是数组时 `map` 会抛错，`title` 为空时页面出现「null」。用 `||` 和 `Array.isArray` 兜一层，接口少个字段也不会让整页白屏。
