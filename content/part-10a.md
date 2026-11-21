===PART===
id: part-10
order: 10
title: 前后端交互与异步
range: 135–154
desc: 从原生 XHR 到 ajax 封装，再到 Promise 与 async/await 掌握前后端数据交互
===CH===
no: 106
title: 初识前后端交互
lessons: 135
summary: ajax 让前端不刷新页面单独取数据，后端只给数据、前端管渲染
points: 表单提交会整页刷新，页面由后端拼好返回 || 前后端分离后，后端只提供数据接口 || ajax 拿到的是数据，由前端自己局部渲染 || URL 由协议、域名、端口、路径组成 || XHR 必须在 http 环境运行，file 协议会被拦
===BODY===
### 客户端与服务端如何分工

打开一个页面，浏览器本地并没有要显示的数据，内容在另一台叫服务端的机器上，浏览器得先发请求去要。

早期靠表单：填完点提交，浏览器把整页交给服务端，服务端连数据带 HTML 一起吐回来。因为页面结构是后端拼的，前端只负责展示，改个样式都得动后端，两边分工搅在一起。

| 对比项 | 传统表单 | ajax |
|---|---|---|
| 是否刷新 | 整页刷新 | 局部更新 |
| 返回内容 | 完整 HTML | 数据文本 |
| 谁负责渲染 | 后端 | 前端 |
| 体验 | 白屏、上下文丢失 | 顺滑 |

ajax 把这条线切开：后端只给数据接口，前端拿到数据自己决定怎么画。这就是前后端分离，两边能各自独立演进。

表单的一切都写在标签属性里，提交即把输入交给 action 指向的地址：

```html
<form action="http://www.example.com">
  <input type="text" name="username">
  <input type="submit" value="登录">
</form>
```

浏览器会拼出 `?username=...` 并整页跳转，当前页被卸载，白屏和上下文丢失都由此而来。

### 请求与响应的结构

一次交互就是客户端发一段请求文本、服务端回一段响应文本。

因为双方讲的是纯文本协议，报文被拆成行、头、体几部分，机器才能各取所需。前端能改的只有请求行、请求头、请求体三处，其余由浏览器自动补全。

```text
GET /users/1 HTTP/1.1          <- 请求行：方法 + 路径
Host: localhost:3000           <- 请求头
                               <- 空行，GET 无请求体

HTTP/1.1 200 OK                <- 状态行
Content-Type: application/json
                               <- 空行
{"id":1,"name":"kerwin"}       <- 响应体
```

这三处正好对应后面 `open`、`setRequestHeader`、`send` 三个 API。响应体里的 JSON 是字符串，要解析成对象前端才能用。

> 💡 HTTP 是无状态的：每次请求都被当成全新的一次，后端不记得上次是谁，登录凭证得随请求自己带上。

### 接口与 URL

接口就是一个 URL 地址，浏览器靠它定位服务端上的某份数据。

因为一台机器上可能跑着多个服务，光有地址还不够，要靠端口区分；域名方便人记，实际会由 DNS 翻译成 IP 再连过去。

| 组成 | 作用 | 例子 |
|---|---|---|
| 协议 | 通信规则 | `http`、`https` |
| 域名 | 给人记的名字 | `localhost`、`baidu.com` |
| 端口 | 机器上的门牌号 | `5500`、`3000` |
| 路径 | 具体资源 | `/users/1` |
| 查询串 | 附加参数 | `?id=1` |

`localhost` 等价于 `127.0.0.1`，指本机。本地练习常见两个端口：页面服务 `5500`，数据接口 `3000`，别混用。

### 为什么需要异步

异步指请求发出后不必原地等，数据回来了再回头处理结果。

因为网络往返有延迟，若让代码卡在原地等，页面会冻住、按钮点不动。所以请求交给浏览器后台线程，主线程继续跑，完成后用回调通知前端。

```js
var xhr = new XMLHttpRequest()
xhr.open("GET", "/1.json", true)
xhr.onload = function () { console.log("数据回来了") }
xhr.send()
console.log("请求已发出")
// => 请求已发出      先打印
// => 数据回来了      后打印（回调）
```

> ⚠️ 请求必须在 http 环境运行。双击用 `file://` 打开时，`XMLHttpRequest` 会被浏览器按跨域安全策略拦下并直接报错。

这也是后面同步异步、回调乃至 Promise 的起点：结果来得晚，代码就不能顺着写。

===CH===
no: 107
title: ajax 基础
lessons: 136
summary: ajax 四步是建对象、open 配置、send 发送、onload 收结果，状态码才判成败
points: 四步是 new、open、send、onload，顺序固定 || open 只写配置不发请求，send 才真正发出 || readyState 为 4 只表示结束，不代表成功 || 成功判断用 2xx 区间，别只认 200 || responseText 是字符串，需 JSON.parse 转对象
===BODY===
### XMLHttpRequest 四步模板

ajax 靠浏览器内置的 `XMLHttpRequest` 对象发请求，流程固定四步。

因为这四步分别负责建通道、写配置、真正发送、接收结果，拆开才能把「发」和「收」交给不同时机处理。回调是注册而非立即执行，所以要先绑再发。

```js
var xhr = new XMLHttpRequest()            // ① 建对象
xhr.open("GET", "/users/1", true)          // ② 配置，此刻还没发
xhr.onload = function () {                // ④ 先注册回调
    console.log(xhr.responseText)
}
xhr.send()                                // ③ 真正发送
```

`send()` 会立刻返回，结果回来时浏览器才调 `onload`。监听写在 `send()` 之前更稳妥，避免命中缓存时错过回调。

四步之所以拆开，是因为「配置」和「发送」之间还要插入请求头、监听等设置。若 `open` 直接就把请求发出去，这些设置便无处安放。

### readyState 与 onreadystatechange

`readyState` 记录请求走到哪一步，从 0 到 4 共五个值。

因为一次请求要经历建对象、open、收头、下载体、完成几个阶段，早期用 `onreadystatechange` 监听每次变化，再判断是不是走到最后一步。它触发多次，必须配合 `=== 4`。

| 值 | 状态 | 含义 |
|---|---|---|
| 0 | UNSENT | 刚创建，未 open |
| 1 | OPENED | 已调用 open |
| 2 | HEADERS_RECEIVED | 收到响应头 |
| 3 | LOADING | 响应体下载中 |
| 4 | DONE | 全部完成 |

`onload` 只在完成时触发一次，不用判状态，现代代码更常用它。注意「完成」不等于「成功」，还得看 `status`。

把同一对象的 `readyState` 打出来，能看清它随请求推进一路变化：

```js
var xhr = new XMLHttpRequest()
console.log(xhr.readyState)      // 0
xhr.open("GET", "1.json")
console.log(xhr.readyState)      // 1
xhr.send()
// 之后随着网络进度：2 → 3 → 4
```

只有走到 4 才叫请求结束，但结束不代表成功，仍要看状态码。

### status 状态码判断成败

`status` 是服务端回的三位数字，表示这次请求成功还是失败。

因为网络通了不代表业务成了，地址写错、没权限、后端报错都会给不同码。只认 200 会把 201、204 这些成功码误判为失败。

```js
xhr.onload = function () {
    if (/^2\d{2}$/.test(xhr.status)) {
        console.log("成功")
    } else {
        console.log("失败", xhr.status)   // => 失败 404
    }
}
```

- `2xx` 成功，取用响应数据
- `4xx` 请求方问题，提示用户或跳登录
- `5xx` 服务端出错，稍后重试

用 `/^2\d{2}$/` 覆盖 200–299 比 `=== 200` 稳。跨域被拦或断网时 `status` 是 0，且 `onload` 不触发。

### open 的三个参数

`open(method, url, async)` 只把方法、地址、是否异步写进配置。

因为方法决定语义、URL 决定找谁、第三参数决定阻塞与否，三者都要在发送前定好。第三个参数省略时默认 `true`，即异步。

- `method`：动作，如 `GET`、`POST`
- `url`：目标地址，如 `/users/1`
- `async`：是否异步，省略时默认 `true`

> ⚠️ `setRequestHeader` 必须写在 `open` 之后才生效；相对 URL 是相对当前页面地址，不是相对 js 文件。

### send 与响应文本

`send()` 真正把请求发出去，参数就是请求体。

因为 GET 没有请求体要空调用，POST 才把数据放进去。后端回的 `responseText` 永远是字符串，直接取属性会得到 `undefined`，必须先解析。

```js
var data = JSON.parse(xhr.responseText)
console.log(data.name)                     // => kerwin
console.log(xhr.responseText.name)         // => undefined
```

- `JSON.parse`：字符串转对象，收到响应后用
- `JSON.stringify`：对象转字符串，发请求体前用

`JSON.parse` 遇非法 JSON 会抛错，正式代码要包 `try...catch`，否则一个 HTML 错误页就能让流程中断。

JSON 只是约定格式，并非 XHR 的强制要求；后端若返回普通文本，`responseText` 同样能读，只是不能当对象用。解析前先确认接口约定更稳妥。

===CH===
no: 108
title: ajax 案例
lessons: 137
summary: 把点击、请求、解析、渲染串成一条线，就是一次完整的 ajax 业务
points: 一条链是点击、请求、解析、渲染 || 先看数据结构，再决定遍历哪一层 || map 生成的数组要 join 后再赋给 innerHTML || ajax 拿到的是字符串，必须先 JSON.parse || status 为 0 表示请求没发出去
===BODY===
### 需求与思路

点按钮后取回一组图片数据，渲染成列表。链路固定：创建 XHR、`open` 配置、注册状态回调、`send` 发出，回调里判状态、解析、写容器。

两个判断都不能省：`readyState` 为 4 只说明请求结束，`status` 为 200 才说明后端成功。断网或跨域被拦时不会走到成功分支，所以网络错误要单独处理，不能和「接口返回错误」混成一句提示。

### 完整案例代码

```js
// 依赖：页面有 <button id="btn"> 与 <ul id="mylist">；接口可换成同结构的本地 json
var btn = document.getElementById("btn")
var mylist = document.getElementById("mylist")

btn.onclick = function () {
  var xhr = new XMLHttpRequest()                       // ① 创建
  xhr.open("GET", "https://jsonplaceholder.typicode.com/photos?_limit=4")  // ② 配置
  xhr.onreadystatechange = function () {               // ← 关键点：状态一变就触发，会跑好几次
    if (xhr.readyState !== 4) return                   // ← 关键点：4 才是请求结束，其余状态直接返回
    if (xhr.status === 200) {                          // ← 关键点：200 才算成功，与 readyState 是两件事
      var list = JSON.parse(xhr.responseText)          // 拿到的是字符串，先解析成数组
      console.log(list.length)                         // => 4
      mylist.innerHTML = list.map(item =>
        `<li><img src="${item.thumbnailUrl}" width="60">${item.title}</li>`
      ).join("")                                       // ← 关键点：join 成串后一次赋值，别在循环里累加
    } else {
      mylist.innerHTML = "请求失败：" + xhr.status
    }
  }
  xhr.onerror = function () {                          // ← 关键点：断网、跨域被拦只走这里
    mylist.innerHTML = "网络异常，请稍后再试"
  }
  xhr.send()                                           // ④ 发送
}
```

### 关键知识点

- **四步顺序不能乱**：`new` 建对象、`open` 定方法和地址、`send` 才真正发出、回调负责收结果。回调要在 `send` 之前注册好，否则响应回来时还没有处理函数，数据就白丢了。
- **`readyState === 4` 与 `status === 200` 是两层判断**：前者描述请求的生命周期，4 只代表「结束了」，404、500 同样是 4；后者才是后端给的结果码。只判 `readyState` 就把错误页也当数据去 `JSON.parse`，会直接抛语法错误。
- **用 `innerHTML` 一次写入**：`map` 得到的是片段数组，直接赋值会被转成逗号分隔的文本，必须 `join("")`。拼好整串再赋一次值只触发一次重排，比循环 `appendChild` 或反复 `+=` 快得多。
- **网络错误必须单独接**：断网、跨域被拦时请求根本没发出去，`status` 为 0，不能靠 `status` 分支给出准确提示。挂 `onerror` 单独提示，用户才知道该查网络而不是重试接口。
===CH===
no: 109
title: ajax 同步异步
lessons: 138
summary: open 第三参数 true 为异步，false 会冻结页面，结果只能在回调里用
points: 第三参数 true 异步、false 同步，默认 true || 同步请求占住主线程，页面冻结、动画出不来 || 异步下 send 立刻返回，后面同步代码先执行 || 用到数据的代码必须放进 onload 回调 || 回调层层嵌套，正是回调地狱的病根
===BODY===
### 同步与异步的差别

`open` 第三个参数 `async` 决定请求发出后要不要原地等。

因为 JS 是单线程，同一时刻只能做一件事。`true` 把请求交给浏览器的网络线程，主线程继续往下跑；`false` 则让主线程卡在 `send()` 直到数据回来。

| 对比 | 异步 true | 同步 false |
|---|---|---|
| 主线程 | 不等待，继续跑 | 卡住直到返回 |
| 页面 | 可正常交互 | 冻结 |
| 结果获取 | 在回调里 | send 之后直接读 |

两者拿数据的位置不同，但都不改变「请求有延迟」这个事实，只是等待方式不一样。

异步并非让请求变快，而是让等待期间主线程不空耗。所以界面照常响应，结果到了再补处理，这是浏览器处理网络任务的通用思路。

同一段请求只改第三参数，打印顺序会反过来：

```javascript
var xhr = new XMLHttpRequest()
xhr.open("GET", "1.json", true)      // true 表示异步请求
//false 表示同步请求
xhr.onload = function () {
    if (xhr.status === 200) {
        console.log(xhr.responseText)
    }
}
xhr.send()

console.log("11111111111111111111")
```

异步时先打印 `1111…` 再打印数据；改成 `false` 后顺序颠倒，因为主线程卡在 `send()` 等结果。

### 第三个参数 false 的后果

传入 `false` 后请求变成同步，代码能顺着写，代价是页面失去响应。

因为主线程被占住，点击、滚动、渲染全部停摆，连「加载中」的 DOM 都画不出来。网络一慢，用户看到的就是网页卡死，浏览器还会给出弃用警告。

```js
xhr.open("GET", "/1.json", false)
xhr.send()
console.log(xhr.responseText)   // 能直接读到，但页面已卡住
```

唯一的便利是顺序书写，而 `async/await` 用更好的方式做到了同样的事且不卡页面，所以永远别用 `false`。

### 回调为何必须写在事件里

异步结果只在 `onload` 触发那一刻才存在，用到数据的代码必须放进去。

因为 `send()` 立刻返回，紧跟其后的赋值语句执行时数据还没回来，读到的只能是空字符串。把后续逻辑搬进回调，才能保证它在数据就绪之后运行。

```js
// 错误：send 后立刻读，数据还没回来
xhr.send()
var data = xhr.responseText      // => ""

// 正确：把使用数据的代码放进回调
xhr.onload = function () {
    doSomething(JSON.parse(xhr.responseText))
}
```

这正是「回调」的由来，也是后面嵌套的起点：下一步依赖上一步的结果，就只能往里层写。

换句话说，回调不是可选的组织方式，而是异步结果唯一可靠的入口。想让某段代码在数据之后运行，就只有把它登记进回调这一条路。

### 异步执行顺序演示

异步不是同时执行，而是先跑完同步代码，回调再排队等通知。

因为回调要等浏览器通知才进队列，所以 `send()` 后面的 `console.log` 一定先打印。定时器和图片加载走的也是同一套机制。

```js
var xhr = new XMLHttpRequest()
xhr.open("GET", "/1.json", true)
xhr.onload = function () { console.log(xhr.responseText) }
xhr.send()
console.log("1111")
// => 1111                 先打印
// => {"name":"kerwin"}    后打印（onload）
```

记住「注册时不执行、条件满足才执行」，就能理解为什么回调里的代码总是最后才跑。

===CH===
no: 110
title: 请求方式-1
lessons: 139
summary: 五种方法用语义区分动作，URL 表资源，GET 参数拼在地址上
points: GET 查、POST 增、PUT 全改、PATCH 局部改、DELETE 删 || RESTful 里 URL 是名词，动作交给 method || PUT 整条替换会丢字段，PATCH 只改传了的字段 || GET 参数拼在 URL 查询串，没有请求体 || 地址栏只能测 GET，GET 还可能被浏览器缓存
===BODY===
### 五种请求方法的分工

请求方法 `method` 表达「我要对这份数据做什么」。

因为同一个地址可以查、可以改、可以删，光靠 URL 分不清意图，才需要用方法名补上动作。语义统一之后，前后端对接口的理解才一致。

| 方法 | 语义 | 请求体 |
|---|---|---|
| GET | 查询 | 无 |
| POST | 新建 | 有 |
| PUT | 全量更新 | 有 |
| PATCH | 局部更新 | 有 |
| DELETE | 删除 | 一般无 |

GET 与 DELETE 通常不带请求体，其余三种要把数据放进请求体，配置时先按这一列区分。

语义只是约定，不是浏览器强制：技术上给 GET 带体也能发出，只是多数后端会忽略。按约定写，接口才容易被别人看懂和复用。

### RESTful：URL 说资源，方法说动作

RESTful 是一种约定：URL 用名词表示资源，方法用动词表示动作。

因为把动作写进 URL（如 `/addUser`）会让接口越堆越多，改一个资源要记一堆地址。改成同一 URL 配不同方法，接口数量立刻收敛，也更好记。

```js
xhr.open("GET",    "/users/1")   // 查
xhr.open("PUT",    "/users/1")   // 整条换
xhr.open("PATCH",  "/users/1")   // 改一点
xhr.open("DELETE", "/users/1")   // 删
```

`/users` 是资源集合，`/users/1` 是其中一条。本地的 json-server 正是按这套约定自动生成接口的。

### PUT 与 PATCH 的区别

两者都更新，但 PUT 整条替换，PATCH 只覆盖传了的字段。

因为 PUT 的语义是「用新对象整个换掉旧的」，没传的字段会被清掉；PATCH 是「打补丁」，只动提到的键，其余原样保留。改数据前先想清楚要哪一种。

```js
// 原：{ id:1, name:"kerwin", pwd:"123" }
// PUT   /users/1 传 { name:"ximen" }
// => { id:1, name:"ximen" }                  pwd 没了
// PATCH /users/1 传 { name:"ximen" }
// => { id:1, name:"ximen", pwd:"123" }       只改 name
```

只改一个字段时务必用 PATCH，误用 PUT 会静默丢数据，排查起来相当隐蔽。

判断标准很简单：需要整条对象被新值覆盖时用 PUT，只想动其中几个键就用 PATCH。json-server 对两者的处理，正好演示了这一差别。

### GET 的传参与缓存

GET 没有请求体，参数只能拼在 URL 的 `?` 后面。

因为地址栏、`<a>`、`<img>` 都只能发 GET，参数就得跟着地址走，格式是 `key=value&key2=value2`。也正因为参数在地址上，GET 结果容易被浏览器缓存。

```js
xhr.open("GET", "/users?username=kerwin&page=3")
xhr.send()                       // 空调用，GET 无请求体
```

> ⚠️ 浏览器会缓存相同 URL 的 GET；要拿最新数据可加一个变化参数，或改用 POST。POST 不缓存，也不会被重复折叠。

参数含中文或 `&` 时要先编码，否则会被当成分隔符，后端解析就会出错。

这也是为什么敏感信息不放在 GET 参数里：地址会被浏览器历史、服务器日志记录下来，而请求体不会。

查询串里除了自己拼的字段，数据服务还常用下划线开头的保留参数：

```text
GET /users?username=gangdaner
GET /goods?_page=3&_limit=5
```

第一行按条件过滤，第二行取第 3 页、每页 5 条，`_page` 从 1 开始。参数名由接口约定，前端只负责拼对。

===CH===
no: 111
title: 请求方式-2
lessons: 140
summary: 五种方法在代码上只差三处，Content-Type 要与请求体格式一致
points: 五种方法只差 open 方法名、请求头、send 内容 || POST 必须设 Content-Type 说明请求体格式 || 请求头与请求体格式要一致，否则解析失败 || 成功判断用 /^2\d{2}$/，别只认 200 || POST 不幂等，重复提交会新增多条数据
===BODY===
### GET：参数在 URL，send 空调用

GET 把参数留在地址里，`send()` 不带任何内容。

因为 GET 语义是查询，没有要提交的数据体，浏览器会忽略带上的 body。参数用 `?` 拼在 URL 后、多个用 `&` 连接，需要在发送前就拼好。

```js
var xhr = new XMLHttpRequest()
xhr.open("GET", "/users?username=kerwin&password=123")
xhr.onload = function () {
    if (xhr.status === 200) console.log(JSON.parse(xhr.responseText))
}
xhr.send()                       // 空调用
```

查询集合时返回的是数组，因为 `/users` 对应的是一整组资源而不是单条记录。

若地址带了 id，如 `/users/1`，返回的则是单个对象。判断返回形态前，先看 URL 指向集合还是单条，能少写很多无谓的兼容分支。

### POST：请求体与 Content-Type

POST 要提交数据，必须用 `setRequestHeader` 告诉后端「请求体是什么格式」。

因为后端靠 `Content-Type` 决定怎么解析请求体，头说表单却发 JSON，字段就取不出来。设置顺序固定为 `open` → `setRequestHeader` → `send`，写在 `open` 之前会报状态错误。

| 对比 | 表单格式 | JSON 格式 |
|---|---|---|
| Content-Type | `application/x-www-form-urlencoded` | `application/json` |
| 请求体 | `username=ximen&password=789` | `{"username":"ximen"}` |
| 生成方式 | 手动拼串 | `JSON.stringify` |

头与体必须匹配。直接 `send(对象)` 会被转成 `[object Object]`，必须先 `stringify`，这是本章最常见的错。

`setRequestHeader` 一次只能设一个键值对，多个头要连写多行。它必须在 `open` 之后调用，位置错了浏览器会抛状态错误。

以 JSON 格式提交时，顺序固定为「配置 → 声明格式 → 发送字符串」：

```javascript
var xhr = new XMLHttpRequest()
xhr.open("POST", "http://localhost:3000/users")
xhr.setRequestHeader("Content-Type", "application/json")
xhr.send(JSON.stringify({ username: "ximen", password: "789" }))
```

后端按声明的 `application/json` 解析请求体，就能取出两个字段；省略请求头或直接 `send(对象)`，解析都会失败。

### 成功判断用 2xx 区间

`/^2\d{2}$/` 用来匹配 200 到 299 的所有成功状态码。

因为新建成功时后端常返回 201，删除可能返回 204 且没有内容，死守 `=== 200` 会把它们误判成失败。统一判区间才稳。

```js
xhr.onload = function () {
    if (!/^2\d{2}$/.test(xhr.status)) return
    var text = xhr.responseText
    console.log(text ? JSON.parse(text) : "成功但无返回内容")
}
```

对空响应体也做了保护，避免 `JSON.parse("")` 直接抛错，这是删除接口尤其需要的一步。

用正则判区间还有个好处：后端换成 202、206 这类成功码时前端不用跟着改。把「成功」定义成一段范围，比钉死某个数字更经得起接口演进。

### 五种方法横向对照

把五种方法的差异摊在一张表里，配置时按行照做即可。

因为方法名、参数位置、要不要请求头、成功码各不相同，逐条记容易漏，横向对照最省心。注意 POST 不幂等：点几次提交就多几条数据。

| 方法 | 参数位置 | 请求头 | send | 成功码 |
|---|---|---|---|---|
| GET | URL | 不用 | 空 | 200 |
| POST | body | 必须 | 字符串 | 201 |
| PUT | body | 必须 | 字符串 | 200 |
| PATCH | body | 必须 | 字符串 | 200 |
| DELETE | URL | 一般不用 | 空 | 200/204 |

PUT、PATCH、DELETE 的 URL 要带 id 才能定位到具体一条；POST 的 id 由后端生成，地址不带。

幂等也值得留意：PUT、DELETE 执行一次和十次结果相同，POST 每点一次就多一条。所以提交按钮要做禁用或防抖，避免重复写入。

===CH===
no: 112
title: ajax 封装-1
lessons: 141
summary: 把四步样板收进 ajax(options)，内部统一序列化参数与分流回调
points: 封装把重复四步收敛成传一个配置对象 || 默认配置配展开合并，用户只传要改的字段 || queryStringify 把对象转成 a=1&b=2 查询串 || 按 Content-Type 决定 stringify 还是拼查询串 || onload 里统一判 2xx、解析、分流 success 与 error
===BODY===
### 为什么要封装

封装是把每次都写的四步样板收进一个函数，调用方只传配置。

因为五个按钮就要抄五遍同样的 `new`、`open`、`send`，参数拼接、状态判断、`try...catch` 也各写各的。改一处得改五处，还容易漏 `?`、漏编码。

| 重复点 | 后果 |
|---|---|
| new + open + send | 样板代码满屏 |
| 参数拼 URL / body | 易漏 `?`、`&`、编码 |
| 每处 try...catch | 解析逻辑重复 |
| 状态判断不统一 | 有的认 200，有的认 2xx |

把复杂度吃进函数内部，调用方就只关心「要什么」，不必关心「怎么发」。

### 把参数收进配置对象

目标调用形态是 `ajax({ url, method, data, success, error })`。

因为参数一多，按位置传容易记错顺序，写成对象就能只看键名。内部先用一份默认配置兜底，再用展开运算符合并用户传入的项，后者覆盖前者。

```js
function ajax(options = {}) {
    var cfg = {
        url: "", method: "GET", async: true,
        data: {}, headers: {}, success() {}, error() {},
        ...options
    }
    var { url, method, data, headers, success, error } = cfg
}
```

默认 `success`、`error` 是空函数，调用方不传也不会报「不是函数」，这是最体贴的一处。

### 统一处理参数格式

`data` 是对象，发送前必须转成字符串，格式由 `Content-Type` 决定。

因为请求体只能是文本，对象无法直接发送。含 `json` 时用 `JSON.stringify`，否则用 `queryStringify` 拼成 `a=1&b=2`；判断要用可选链 `?.`，不传 `headers` 时才不会崩。

| data 类型 | Content-Type | 结果 |
|---|---|---|
| 对象 + 含 json | `application/json` | `{"a":1}` |
| 对象 + 无 json | 表单格式 | `a=1&b=2` |
| GET 有参数 | 不参与 | 拼到 URL 的 `?` 后 |

`queryStringify` 逐键拼接再去掉末尾多出的 `&`；GET 额外把结果接到 URL 上，`data` 为空时不加 `?`。

它本身很短，核心就是遍历键、拼上 `&`、最后削掉多余尾巴：

```js
function queryStringify(obj) {
  let str = ''
  for (let k in obj) str += `${k}=${obj[k]}&`
  return str.slice(0, -1)
}
```

`queryStringify({ username: "kerwin", password: "789" })` 得到 `username=kerwin&password=789`。注意简化版没做编码，值里有 `&` 或中文时会出错。

### 解析响应并分流回调

`onload` 里统一判状态、解析文本，再决定调 `success` 还是 `error`。

因为解析和错误处理的时机只有请求结束才知道，放在回调里集中做，调用方就不必各写一遍。非法 JSON 会抛错，必须用 `try...catch` 兜住。

```js
xhr.onload = function () {
    if (!/^2\d{2}$/.test(xhr.status)) return error("状态码:" + xhr.status)
    try {
        success(JSON.parse(xhr.responseText))   // 传出去的是对象
    } catch (e) {
        error("解析失败：返回的不是 JSON")
    }
}
```

成功回调拿到已解析的对象，失败回调拿到错误说明。断网或跨域时 `onload` 不触发，需另补 `onerror`。

### 五种方法分支与发送

请求头逐个设置，发送时按方法决定 `send()` 带不带请求体。

因为请求头只能一个键一个值地设，要循环 `headers`；而 GET 不允许带请求体，其余方法才把序列化后的 `data` 放进去。顺序必须是 `open` → 设头 → `send`。

- `open` 之后循环 `headers`，逐个 `setRequestHeader(k, v)`
- 用 `/^get$/i.test(method)` 判断方法，带 `i` 忽略大小写
- GET 走 `send()` 空调用，其余方法走 `send(data)`
- 补 `xhr.onerror`，让断网、跨域也能进 `error`

至此调用方从二十行四步变成一个对象，改需求只需动封装内部一处。

===CH===
no: 113
title: ajax 封装-2
lessons: 142
summary: 把默认请求头改成表单格式，让不传 headers 的 POST 也能正确工作
points: 默认值应服务最常用的用法 || 旧版不传 headers 的 POST 会因头缺失写入空数据 || 同一封装能跑通五种请求方法 || method 大小写不敏感，但建议统一大写 || 回调封装解决了重复，没解决嵌套
===BODY===
### 一行改动：默认 Content-Type

这一版只把默认的 `headers` 从空对象换成表单格式。

因为上一版默认没有任何请求头，而多数传统接口按表单格式解析，把最常见的用法设成默认值，调用方就能少传一个参数。其余逻辑一字未动。

```js
// 旧版
headers: {}
// 新版
headers: { "content-type": "application/x-www-form-urlencoded" }
```

原则很朴素：默认值应该服务最常用的场景，而不是让每个人每次都显式写一遍。

### 为什么不传 headers 的 POST 会失败

旧版里不传 `headers` 的 POST，请求头会缺失，后端解析不到字段。

因为空 `headers` 使 `content-type` 为 `undefined`，可选链判断为假，于是 `data` 走 `queryStringify` 变成表单串；但浏览器没收到对应请求头，会按纯文本发出，后端便还原不出字段。

| 场景 | 旧版 | 新版 |
|---|---|---|
| GET + data | 正常拼 URL | 正常 |
| POST + json 头 | 正常 | 正常 |
| POST 不传 headers | 头缺失、写入空数据 | 默认表单，正常 |

结果最坑的是「看起来成功」，数据库里却多了一条只有 id 的空记录，问题相当隐蔽。

排查这类问题要看网络面板里的请求头，而不是只看状态码。头缺失时状态码照样是 201，从状态上完全看不出数据其实没写进去。

出问题的调用往往就是看着正常的这一版，`headers` 整个省略：

```js
ajax({
    url: "http://localhost:3000/users",
    method: "POST",
    data: { username: "xiaoming", password: "456" }
    // 没有 headers
})
```

默认 `headers` 为空对象，`content-type` 取不到，可选链判断为假，数据被拼成表单串却没带对应请求头，后端还原不出字段。

### 五种方法都能用同一封装跑

封装稳定后，五种方法只是同一函数调用时的配置不同。

因为方法名、数据、请求头都收进了配置对象，增删改查不必各写一套四步。判断方法用了带 `i` 的正则，小写 `delete` 也能跑，但统一大写更好读。

```js
ajax({ url: "/users", data: { name: "kerwin" }, success: fn })        // GET
ajax({ url: "/users", method: "POST", data: { name: "a" }, success: fn })
ajax({ url: "/users/1", method: "PATCH",
       headers: { "content-type": "application/json" },
       data: { name: "b" }, success: fn })
ajax({ url: "/users/1", method: "DELETE", success: fn })
```

PUT 是整条替换，只传一个字段会丢掉其余字段；PATCH 才保留未传的部分，别混用。

格式与方法各管一件事：Content-Type 决定后端怎么解析请求体，method 决定怎么改动数据。两者互不替代，配置时要分别确认。

### 封装的收益与遗留问题

封装消灭了重复，但并没有消灭嵌套。

因为底层仍是 `success` 回调，业务一复杂就会出现「回调里再调 ajax」的套娃；此外网络层错误、全局函数污染也还没处理，这几条正是后续章节的起点。

| 指标 | 封装前 | 封装后 |
|---|---|---|
| 样板代码 | 每处十几行 | 全项目一份 |
| 参数序列化 | 手写 | 自动 |
| 改需求 | 改多处 | 改一处 |
| 异步写法 | 回调 | 仍是回调 |

重复问题解决了，嵌套问题留给了 Promise，这就是回调地狱要接着讲的因果。

===CH===
no: 114
title: ajax 前后端交互案例
lessons: 143
summary: 用 TodoList 类串起查、增、删，每个动作都先问后端再改视图
points: 类是数据、视图、方法三件套的最小模型 || success 用箭头函数才能拿到实例的 this || 把 id 存进 data-index，删除时才知道删哪条 || 增删要用后端返回的记录，别自己造 id || 视图永远从数据算出来，render 只读 listdata
===BODY===
### 需求与思路

列表接口返回 `{ data: { list: [...] } }`，详情接口按 id 返回单条记录。动手前先打印一次响应，确认要遍历的数组在第几层、字段叫什么，再动手写渲染。

列表带搜索框，关键词和页码要拼成查询串；点击某一条时从 DOM 上取回 id，再按 id 请求详情。取数据抽成同一个 `request` 函数，列表和详情只换地址和回调，避免两份重复的 XHR 代码。

### 完整案例代码

```js
// 依赖：页面有 <input id="kw">、<ul id="list">、<div id="detail">；接口地址换成自己的
var listEle = document.getElementById("list")
var detailEle = document.getElementById("detail")
// 接口一 GET /films?kw=xx&page=1 → { data: { list: [{ id, title, poster }] } }
// 接口二 GET /films/:id          → { data: { id, title, desc } }
function request(url, done) {
  var xhr = new XMLHttpRequest()
  xhr.open("GET", url)
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return
    if (xhr.status !== 200) return done(null)
    done(JSON.parse(xhr.responseText))
  }
  xhr.send()
}

function getList(kw, page) {
  var params = "kw=" + encodeURIComponent(kw) + "&page=" + page  // ← 关键点：参数拼查询串，值要编码
  request("/films?" + params, function (res) {
    var list = res.data.list          // ← 关键点：按接口层级取，写成 res.list 只会得到 undefined
    listEle.innerHTML = list.map(item =>
      `<li data-id="${item.id}"><img src="${item.poster}" width="60">${item.title}</li>`
    ).join("")                        // ← 关键点：map 得到数组，join("") 才拼成一整段 HTML
  })
}

function getDetail(id) {
  request("/films/" + id, function (res) {   // ← 关键点：路径带上 id，后端才知道查哪一条
    var film = res.data
    detailEle.innerHTML = `<h3>${film.title}</h3><p>${film.desc}</p>`
  })
}

listEle.onclick = function (evt) {
  var li = evt.target.closest("li")
  if (li) getDetail(li.dataset.id)    // 委托到容器，从 data-id 取回这条的 id
}
document.getElementById("kw").oninput = function (evt) {
  getList(evt.target.value, 1)
}
```

### 关键知识点

- **先分析字段，再写渲染**：接口常把真正的数组包在 `data.list` 这类层级里，凭感觉写 `res.list` 会拿到 `undefined`，`map` 立刻报错。先打印一次看清路径和字段名，比对着猜测改十遍快。
- **参数要拼成查询串并编码**：`?kw=xx&page=1` 是 GET 传参的唯一途径，值必须过 `encodeURIComponent`，否则中文、`&`、空格会把 URL 截断，后端收到的是半个关键词。参数再多几个就改用 `URLSearchParams`，省得手写拼接。
- **列表用 `join("")` 拼串渲染**：`map` 的产物是数组，直接赋给 `innerHTML` 会按逗号连接成文本；`join("")` 拼好整串再一次性写入，既正确又只触发一次重排。
- **点击时带 id 请求详情**：把 id 写进 `data-id`，点击后从 `dataset` 取回，比用循环下标稳：列表一旦筛选或重排，下标就全错位了，而 id 永远指向同一条记录。
===CH===
no: 115
title: 回调地狱问题
lessons: 144
summary: 请求串行依赖时回调只能往里套，Promise 把嵌套改成链式排队
points: 下一请求依赖上一请求结果时，只能写进回调里 || 层层嵌套形成金字塔，代码向右塌陷 || 每层各写一遍 error，没法统一捕获 || Promise 用 then 链把嵌套拉成线性 || 无依赖的请求应并发，不该嵌套
===BODY===
### 嵌套回调如何产生

当第二个请求的参数来自第一个请求的结果，就只能写进前者的回调里。

因为异步结果只在回调那一刻存在，而下一步又必须等它，两个请求没法并行发起。这种「串行依赖」是嵌套最正当、也最无奈的来源。

```js
ajax({ url: "/news", data: { author: "kerwin" }, success: function (res) {
    ajax({ url: "/comments", data: { newsId: res[0].id },
           success: function (comments) { console.log(comments) } })
}})
```

再加一层「用评论里的用户 id 查头像」，缩进就又深一格，形状开始往右塌陷。

依赖链越长，最内层的结果离外层的起点越远。每层都得等上一层回调触发，请求只能一个接一个发，总耗时是各段延迟之和。

### 可读性变差：末日金字塔

依赖一多，代码层层向右缩进，形成俗称的回调地狱或末日金字塔。

因为业务逻辑本是一条直线「拿新闻 → 拿评论 → 拿用户 → 渲染」，嵌套却把它切成阶梯，读代码要在缩进里来回跳，越深越难对齐、越难 review。

```text
ajax
  success -> ajax
               success -> ajax
                            success -> ajax
                                        success -> 结果
```

问题不在语法，而在于「顺序」被结构藏起来了，改一处往往牵动整片缩进。

回调里还常夹着每层各自的临时变量与分支，缩进一深，很难一眼看清哪段属于哪一步。可读性下降，比单纯的代码变长更影响维护。

### 错误处理分散

每个 `ajax` 都得自带一份 `error`，没法统一兜底。

因为每层回调是独立的作用域，外层捕获不到内层抛出的失败，只能一层一层各写一遍。想「不管哪步出错都提示一次」在回调写法里做不到。

```js
ajax({ url: "/a",
    success(a) { ajax({ url: "/b",
        success(b) { ajax({ url: "/c", error: handle }) },
        error: handle
    })},
    error: handle          // 只管得住第一层
})
```

同一个 `handle` 被重复写了三遍，漏写一层，那一步的错误就石沉大海。

### 引出 Promise：把嵌套改成排队

Promise 用 `.then` 把异步步骤串成链，用一个 `.catch` 兜住所有错误。

因为每一步都可以 `return` 下一个 Promise，后续 `.then` 就自然接在后面，不必再往里套。形状从「向右下嵌套」变成「向下线性延伸」，顺序一眼看穿。

```js
getNews()
    .then(news => getComments(news[0].id))
    .then(comments => getUsers(comments[0].userId))
    .then(user => render(user))
    .catch(err => console.log("任何一步出错都到这里"))
```

> 💡 若两个请求之间没有依赖，就不该嵌套，用 `Promise.all` 并发更快；回调地狱只属于真正串行的场景。

链式的另一层价值是错误能冒泡：任意一步失败都会跳到末尾的 `.catch`，不必每层各写一份，正好补上回调写法的短板。

`async/await` 会进一步把这条链写成看似同步的顺序语句，这是后面章节的主线。

还要分清串行依赖和互不依赖：后一种若硬套回调，只会白白慢一倍。

```js
// 错误：没有依赖却嵌套，白白慢一倍
ajax({ url: "/list1", success: a => {
    ajax({ url: "/list2", success: b => { render(a, b) } })
}})

// 正确：并发，快一倍
Promise.all([pajax({url:"/list1"}), pajax({url:"/list2"})])
    .then(([a, b]) => render(a, b))
```

两段请求没有数据往来就同时发出，用 `Promise.all` 等齐再渲染，耗时只取较慢的那个。
