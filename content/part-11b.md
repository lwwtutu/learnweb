===PART===
id: part-11
order: 11
title: jQuery 与插件生态
range: 162–191
desc: 从选择器与 DOM 操作到动画、ajax 与插件，系统掌握 jQuery 生态
===CH===
no: 148
title: 节点操作
lessons: 177
summary: 创建靠 $("<标签>")，插入分内部外部与正反写法，删除替换克隆各有专用方法
points: $("<div>") 只创建不插入，插入要靠 append/before 系列 || append/prepend 放内部，before/after 放外部，反向写法能继续链式 || remove 连事件一起删，empty 只清子节点，detach 保留事件可插回 || replaceWith 与 replaceAll 主语相反，clone(true) 才连事件一起克隆
===BODY===
### 创建节点：传 HTML 字符串

`$()` 里传一段 HTML 字符串，jQuery 会把它解析成新的 DOM 节点。

因为解析结果还没挂到文档上，此时只存在于内存里，页面上并不会多出元素。

```js
var $div = $("<div>hello</div>")           // 带内容的节点
var $box = $("<div>")                       // 空节点，方便接着链式设置
    .html("<b>标题</b>")
    .addClass("box")
    .css("color", "red")
```

- 传 `$("<div>内容</div>")`：一步得到带内容的节点
- 传 `$("<div>")` 再链 `.html()` / `.addClass()`：先造空壳再填，更常用

> 💡 造出来之后要插入页面，得用下面几节的 append、before 系列方法。

### 内部插入：append 与 prepend

内部插入把新节点放进容器里面，区别只在放到开头还是末尾。

因为容器是主语、新节点是参数，读起来就是「容器收进来一个孩子」。

| 正向写法 | 反向写法 | 落点 |
|---|---|---|
| `$("#box").append($div)` | `$div.appendTo("#box")` | 内部末尾 |
| `$("#box").prepend($div)` | `$div.prependTo("#box")` | 内部开头 |

反向写法把新节点放主语位置，好处是能接着 `.addClass()` 一路链下去。

> 💡 `$("<div>").html("x").appendTo("#box")` 不必先存变量，创建加插入一气呵成。

### 外部插入：before 与 after

外部插入把新节点放在容器的前面或后面，两者是兄弟关系而非父子。

因为要控制的落点在容器之外，所以不能复用内部插入的语义，得换一组方法。

- `$("#box").before($div)`：放到容器前面
- `$("#box").after($div)`：放到容器后面
- `$div.insertBefore("#box")` / `$div.insertAfter("#box")`：对应的反向写法

> ⚠️ append 进容器内部，before 在容器外部，一个进框、一个贴边，别混。

### 删除：remove、empty 与 detach

三个删除方法的差别在于删谁、以及绑在节点上的事件保不保留。

因为事件和数据挂在元素对象上，删元素时是否连它们一起清，决定了能否插回复原。

| 方法 | 删什么 | 事件与数据 |
|---|---|---|
| `.remove()` | 自己连同所有子节点 | 一起清掉 |
| `.empty()` | 只清子节点，保留自己 | 子节点的清掉 |
| `.detach()` | 删自己 | 保留，可再插回 |

`remove()` 与 `detach()` 都返回被删节点，因此能 `appendTo` 回去；但只有 `detach` 回来后事件还在。

> ⚠️ 想临时移走再放回，用 `detach()`；用 `remove()` 会丢事件监听。

### 替换：replaceWith 与 replaceAll

替换用新节点顶掉旧节点，两个方法的主语正好相反。

因为「谁替换谁」由主语决定，方向写反就会得到完全相反的结果。

- `旧节点.replaceWith(新节点)`：主语是被换掉的，如 `$("span").replaceWith($div)`
- `新节点.replaceAll(旧节点)`：主语是新来的，如 `$div.replaceAll("p")`

> ⚠️ `replaceAll` 是「新的.replaceAll(旧的)」，与 replaceWith 方向相反，最容易记反。

### 克隆：clone 的两个参数

`clone()` 复制一份节点，两个布尔参数分别控制自己、子元素的事件要不要一起复制。

因为默认不复制事件，克隆出来的节点往往「长得一样却点不动」，需要显式打开。

| 写法 | 自己的事件 | 子元素的事件 |
|---|---|---|
| `.clone()` | 不复制 | 不复制 |
| `.clone(true)` | 复制 | 复制 |
| `.clone(true, false)` | 复制 | 不复制 |

常见组合是 `$("#box").clone(true).prop("id", "box2").insertAfter("#box")`。

> ⚠️ 只写 `.clone(true)` 时第二个参数默认跟着为 true，所以子元素事件也会一起带上。
===CH===
no: 149
title: 案例-节点操作
lessons: 178
summary: 模板字符串配 appendTo 批量插入，on 委托删除动态节点，只删 DOM 会让数据复活
points: 动态按钮必须用事件委托，直接绑定管不到后插的节点 || $(this).parent().remove() 一条链删掉整行，不必找索引 || 只删 DOM 不改数据源，重新渲染时被删项会复活 || 模板字符串在循环里当场求值，不会形成 var 闭包问题
===BODY===
### 需求与思路

把数组渲染成列表，每行带一个删除按钮；双击任意一行还能把它复制一份。

行和按钮都是运行时才插进去的，所以删除不能直接绑在按钮上——改用 `on("click", "button", fn)` 委托给 `ul`，之后新增的行自动生效。

渲染用 `$("<li>")` 造节点再 `appendTo` 插入；删除时 `parent().remove()` 一条链干掉整行。

只删 DOM 不动数组，重绘时那一行会复活，所以要顺手 `splice` 掉数据；复制用 `clone(true)`，把绑定过的事件一起带走。

### 完整案例代码

```js
// 依赖：引入 jQuery；页面有 <ul id="list"></ul>
var arr = ["111", "2222", "333"]

function render(list) {
  $("#list").empty()                                   // 重绘前先清空，否则新旧行会叠在一起
  list.forEach(function (text) {
    $("<li>" + text + "<button>del</button></li>").appendTo("#list")   // ← 关键点：$("<li>") 造节点，appendTo 一步插入
  })
}

$("#list").on("click", "button", function () {         // ← 关键点：委托给 ul，后插入的按钮也照样有事件
  var index = $(this).parent().index()                 // ← 关键点：父级 li 的下标就是数据下标，链式一句拿到
  arr.splice(index, 1)                                 // 先改数据源，再整体重绘，两边始终一致
  render(arr)
})

render(arr)                                            // 先渲染出 li，下一行的直接绑定才有对象可绑

$("#list li").on("dblclick", function () {
  $(this).clone(true).appendTo("#list")                // ← 关键点：clone(true) 连事件一起复制，clone() 只复制结构
})

console.log($("#list li").length)                      // => 3
console.log($("#list li").eq(1).text())                // => "2222del"
```

### 关键知识点

- **`$("<li>")` 造节点，`appendTo` 负责落地**：传 HTML 字符串给 `$()` 会当场创建元素，比 `document.createElement` 再设文本省事。插入分两个方向，`$(新).appendTo(容器)` 与 `容器.append(新)` 效果相同，前者返回新节点、方便继续链式操作，后者适合插完不再动它。
- **删除走 `parent().remove()`**：`this` 是被点的按钮，`parent()` 拿到整行 `li`，`remove()` 把它从 DOM 摘掉，不用循环也不用找下标。`remove()` 会连同节点上绑的事件一起销毁，只想清空子内容保留容器时才用 `empty()`。
- **`clone(true)` 与 `clone()` 的差别**：不带参数只复制标签结构和文字，绑在上面的处理函数全部丢弃；传 `true` 才连事件一起复制。本例双击复制正是靠这一点，克隆出来的新行同样能再被双击。但 `render` 重绘会重建整批 `li`，直接绑定随之丢失——删除改用委托就是这个原因。
- **只删 DOM 不删数据，重绘就会复活**：数组里还留着被删的那条，下次调用 `render` 又把它画回来。规范次序是先 `splice` 数据、再重绘视图，让 DOM 始终只是数据的一份投影。
===CH===
no: 150
title: jQuery 的 ajax
lessons: 179
summary: $.ajax 是全能底层，配置对象控制请求，success/error 收结果，get/post 只是简写
points: $.ajax({...}) 用配置对象传 url、method、data 与各类回调 || dataType 指定期望响应类型，data 默认按表单格式发送 || 返回的 jqXHR 是 Promise 超集，then、await、success 都能用 || $.get/$.post 是常用简写，PUT/PATCH/DELETE 只能回到底层 || 相比 fetch 自动序列化表单数据，发 JSON 要改 contentType
===BODY===
### $.ajax 的参数对象

`$.ajax()` 只收一个配置对象，把地址、方法、数据和各阶段回调都塞进去。

因为请求的可变项很多，用一个对象统一传入，比一长串位置参数更好读也好扩展。

```js
$.ajax({
    url: "/api/users",
    method: "get",              // 老写法是 type
    data: { username: "kerwin" },
    dataType: "json",
    success: function (res) { console.log(res) },
    error: function (xhr) { console.log(xhr.status) },
    complete: function () { console.log("结束") }
})
```

- `url` 与 `method` 决定发给谁、用什么动作
- `data` 是查询参数或请求体，`dataType` 是期望的响应类型

> 💡 `async`、`timeout`、`headers`、`beforeSend` 也都在同一个对象里配。

### 常用配置项速查

配置项按「请求设置」和「回调」两类记，能避免把字段名张冠李戴。

因为字段名是固定约定，写错一个字母请求就发不出去或拿不到结果。

| 配置 | 作用 |
|---|---|
| `url` / `method` | 地址与请求方法 |
| `data` | 发给后端的数据 |
| `dataType` | 期望响应：json、text、html、jsonp |
| `headers` | 自定义请求头 |
| `timeout` | 超时毫秒数 |
| `success` / `error` / `complete` | 成功、失败、无论成败都执行 |

> ⚠️ `dataType` 的合法值里没有 `"string"`，写错会导致解析结果不对。

### success、error 与 jqXHR

三种写法都能拿结果：配置里的 `success/error`、`.then/.catch`、以及 `await`。

因为 `$.ajax` 返回的 `jqXHR` 是 Promise 的超集，所以既能挂回调也能被 `await` 接住。

- 回调风格：`success: fn`、`error: fn`，兼容老代码
- Promise 风格：`$.ajax(...).then(res => ...).catch(err => ...)`
- 同步风格：`var res = await $.ajax(...)`，需放在 async 函数里

Promise 风格写成代码，链式取值很直观：

```js
$.ajax({ url: "/users", data: { username: "kerwin" } })
    .then(res => console.log(res))
    .catch(err => console.log(err))
```

结果：成功进入 then 拿到数据，失败进 catch。因为 jqXHR 是 Promise 超集，这两个方法都能直接用。

> 💡 `jqXHR` 还多出 `.done/.fail/.always/.abort`，比原生 Promise 更方便。

### $.get 与 $.post 的关系

`$.get`、`$.post` 是 `$.ajax` 的简写，内部固定了 method，其余配置走默认值。

因为 GET、POST 占了绝大多数请求，简写能省掉重复的对象包裹。

| 简写 | 等价 |
|---|---|
| `$.get(url, data)` | `$.ajax({url, data, method:"get"})` |
| `$.post(url, data)` | `$.ajax({url, data, method:"post"})` |
| `$.getJSON(url, data)` | 上面再加 `dataType:"json"` |

> ⚠️ PUT、PATCH、DELETE 没有简写，只能回到底层 `$.ajax`，所以不少项目统一全用底层。

### 与原生 fetch 的对照

两者都能发异步请求，差别集中在「默认行为」上：jQuery 替你做了更多约定。

因为 `data` 默认按表单格式序列化，而 fetch 要自己拼 body 和请求头，迁移时最容易踩坑。

| 对比项 | $.ajax | fetch |
|---|---|---|
| 传对象数据 | 自动转查询串或表单 | 要自己 `JSON.stringify` |
| 默认 Content-Type | 表单格式 | 需手动设 |
| 结果解析 | `dataType` 自动转 | 要手动 `.json()` |
| 失败判定 | 走 `error` | HTTP 错误仍进 then，要自己判 |

> ⚠️ 想发 JSON，jQuery 要显式写 `contentType:"application/json"` 并手动字符串化。
===CH===
no: 151
title: 案例-ajax 卖座
lessons: 180
summary: 带自定义头调网关接口，success 里看清响应层级，map 加 join 交给 html 整体渲染
points: 第三方网关靠 X-Host 区分接口，headers 常从 Network 面板抄来 || 调接口第一步先 console.log(res) 看清层级 || map 之后必须 join("")，否则数组转字符串会带出逗号 || 换页用 html() 整体替换，无限滚动才用 append() || 补 error 与 complete，并自己判断业务状态码
===BODY===
### 需求与思路

对接第三方电影列表接口：发请求、拿数据、拼成 HTML 塞进列表。

这类接口是网关形式，一个地址承载几十个服务，必须靠 `X-Host` 等自定义请求头说明要哪个接口，否则返回的是错误信息而不是数据。

请求参数交给 `data` 对象，jQuery 会自动编码进查询串，不必手拼 URL。

`success` 里先看业务状态码，再一层层点到 `res.data.films`；`render` 里先判空，再用 `map` 加 `join("")` 一次性写入。

### 完整案例代码

```js
// 依赖：引入 jQuery；页面有 <ul id="list"></ul>，接口需允许跨域访问
function getFilms(page) {
  $.ajax({
    url: "https://m.maizuo.com/gateway",
    type: "GET",                                     // ← 关键点：不写默认也是 GET，显式写出才看得清请求语义
    data: { cityId: 110100, pageNum: page, pageSize: 10, type: 1 },   // ← 关键点：字段交给 data，jQuery 自动编码成查询串
    dataType: "json",
    headers: {
      "X-Host": "mall.film-ticket.film.list",        // ← 关键点：网关靠这个头分辨要哪个服务，缺了只回错误信息
      "X-Client-Info": '{"a":"3000","ch":"1002","v":"5.2.0","bc":"110100"}'
    },
    success: function (res) {
      if (res.status !== 0) return console.warn("业务失败", res.msg)   // ← 关键点：HTTP 200 也可能业务失败，先判状态码
      render(res.data.films)                         // ← 关键点：响应三层嵌套，少点一层 map 立刻报错
    },
    error: function (xhr, status) {
      console.warn("请求失败", status, xhr.status)
    }
  })
}

function render(list) {
  if (!list || !list.length) {                       // ← 关键点：渲染前先判空，否则空数组拼出来是一片空白
    $("#list").html("<li>暂无数据</li>")
    return
  }
  // html() 是整体替换：旧内容自动清掉，翻页不会越堆越多
  var html = list.map(function (item) {
    return `<li><img src="${item.poster}"/><h3>${item.name}</h3><p>评分 ${item.grade}</p></li>`
  }).join("")                                        // ← 关键点：map 得到的是数组，join("") 才变字符串且不带逗号
  $("#list").html(html)
  console.log($("#list li").length)                  // => 10
}

getFilms(1)
```

### 关键知识点

- **自定义请求头是网关的「路由」**：同一个 URL 服务几十个接口，`X-Host` 决定走哪一支，`X-Client-Info` 说明客户端版本与城市。这两个头通常从浏览器 Network 面板「复制为 cURL」里抄来，漏一个就会拿到 `status` 非 0 的错误体，看起来像接口挂了。
- **先看清层级再写取值**：响应是 `res` → `res.data` → `res.data.films` 三层，少一层拿到 `undefined`，`map` 直接抛错。调新接口第一步永远是 `console.log(res)`，确认数组在哪一层，顺手判一下空。
- **参数走 `data`、渲染走 `html`**：`data` 传对象，jQuery 自动做 URL 编码并拼到查询串，值里有中文或特殊符号也不会出错；`html()` 是整体替换，翻页换一批正合适，无限滚动要接着追加才用 `append()`。
- **`join("")` 不能省**：`map` 返回数组，直接交给 `html()` 会被隐式转成字符串，元素之间冒出逗号并当成文字显示。`join` 不传参同样用逗号连接，必须显式写空串。
===CH===
no: 152
title: jQuery 的 jsonp
lessons: 181
summary: jsonp 借 script 标签绕过同源策略，靠回调参数取数据，代价是只能 GET 且不安全
points: 同源策略拦 ajax 却不拦 script 标签，jsonp 由此而来 || dataType:jsonp 让 jQuery 动态插 script 并生成回调函数名 || jsonp 指定回调参数名默认 callback，jsonpCallback 可写死函数名 || 只能 GET、要后端配合、几乎没有错误处理 || 等于执行别的域的任意 JS，现代跨域应改用 CORS
===BODY===
### 同源策略与跨域问题

浏览器规定：ajax 只能向「同协议、同域名、同端口」的地址发请求。

因为这条限制拦的是 XMLHttpRequest，而页面里本来就要引外站的脚本，所以有些标签并不受限。

- 不同源会被浏览器拦下，控制台报 CORS 错误
- 需要对方返回允许跨源的响应头才能正常拿到数据
- jsonp 是早年绕开这条限制的取巧办法

> 💡 判断是不是同源，三个条件要同时满足，差一个就算跨源。

### jsonp 借 script 标签绕过

`<script src>` 不受同源策略约束，jsonp 就是利用这一点去别域「取」一段 JS 回来执行。

因为服务器返回的是「函数名(数据)」这种可执行的调用，只要页面上有那个函数，数据就到手了。

```js
// 页面准备：function cb(data){ console.log(data) }
// 动态插入：<script src="http://other.com/api?cb=cb"></script>
// 服务器返回：cb({"a": 1})   // => 自动执行，数据进入 cb
```

jQuery 会生成随机函数名挂到全局、插入 script、执行完再把标签删掉，这些都不用自己写。

> ⚠️ jsonp 本质不是 ajax，是「用 script 标签偷数据」，所以不走 ajax 那一套机制。

### dataType:jsonp 与 callback 参数

把 `dataType` 设为 `"jsonp"`，jQuery 就切换到上面的 script 模式。

因为后端约定的回调参数名各不相同，需要用 `jsonp` 告诉 jQuery 该往 URL 里拼哪个字段。

| 参数 | 作用 | 默认 |
|---|---|---|
| `dataType: "jsonp"` | 开启 jsonp 模式 | — |
| `jsonp` | 回调参数的名字 | `"callback"` |
| `jsonpCallback` | 回调函数的名字 | 自动生成 |

- 调用示例：`$.ajax({ url: "...", dataType: "jsonp", jsonp: "cb" })`
- 后面照常接 `.then(res => ...)`，用法与普通 ajax 一致

把开关和参数名配上，一段完整的调用是这样：

```js
$.ajax({
    url: "https://example.com/api/search",
    dataType: "jsonp",
    jsonp: "cb"          // 后端约定的回调参数名
}).then(res => console.log(res))
```

结果：jQuery 自动插 script、生成全局回调，数据最终流进 then。因为 dataType 切到 jsonp 模式后，其余用法和普通 ajax 一致。

> 💡 百度一类接口用 `cb`，参数名以对方文档为准，从 Network 面板看请求 URL 即可确认。

### jsonpCallback 写死函数名

`jsonpCallback` 可以手动指定函数名，但自己写死就得自己定义那个函数。

因为不是 jQuery 生成的函数，它不会再自动把数据送进 `.then`，Promise 语义就丢了。

```js
$.ajax({ url: "...", dataType: "jsonp", jsonpCallback: "aaa" })
function aaa(res) { console.log(res) }   // => 必须自己声明
```

- 写死容易和页面上其他函数重名冲突
- 自动生成的随机名不会冲突，也能正常进 `.then`

> ⚠️ 能用自动生成就别写死，否则 `.then` 里的回调不会执行。

### 只能 GET 与安全性局限

jsonp 的便利是有代价的：能力受限，且几乎没有可靠的错误处理。

因为它依赖加载外部脚本，等于把别的域返回的代码原样执行，风险也一并带进页面。

| 局限 | 说明 |
|---|---|
| 只能 GET | script 标签发不出 POST |
| 要后端配合 | 不返回「函数调用」就用不了 |
| 错误处理差 | 加载失败基本不触发 `.catch` |
| 有安全隐患 | 会执行外域的任意 JS |

现在跨域统一用 CORS：后端加一个响应头即可，支持全部方法且错误处理完整。

> ⚠️ jsonp 只适合维护老接口，新项目一律用 CORS 或反向代理。
===CH===
no: 153
title: ajax 钩子函数
lessons: 182
summary: 六个全局钩子挂在 document 上，Start/Stop 全局一次，Send/Complete 每请求一次
points: ajaxStart 与 ajaxStop 只触发一次，天生用来做全局 loading || ajaxSend/Success/Error/Complete 每个请求各触发一次 || 钩子是事件，必须先绑定再发请求，绑晚了这次不生效 || 用 ajaxError 统一处理 401、500，省去每处写 error || $.ajaxSetup 加统一头会污染全局，多人协作慎用
===BODY===
### 全局钩子与局部回调

jQuery 把 ajax 的生命周期做成六个全局事件，绑在 `document` 上就能统一监听所有请求。

因为它们是「事件」而非某个请求的参数，一处绑定对页面里每一次 ajax 都生效，省去逐个写回调。

| 钩子 | 触发时机 |
|---|---|
| `ajaxStart` | 第一个请求发出前 |
| `ajaxSend` | 每个请求发出前 |
| `ajaxSuccess` | 每个请求成功后 |
| `ajaxError` | 每个请求失败后 |
| `ajaxComplete` | 每个请求结束后 |
| `ajaxStop` | 最后一个请求结束后 |

> 💡 局部回调写在 `$.ajax` 配置里，全局钩子挂 `$(document)`，两者可以同时用。

### ajaxStart 与 ajaxStop 做全局 loading

`Start` 与 `Stop` 只关心「从无到有」和「全部结束」，天然适合控制整站遮罩。

因为并发多个请求时它们仍各只触发一次，遮罩不会因某个请求先结束就提前消失。

```js
$(document).ajaxStart(() => $("#loading").show())
$(document).ajaxStop(() => $("#loading").hide())
```

- 第一个请求发出 → 显示遮罩
- 最后一个请求结束 → 隐藏遮罩，成功失败都算结束

> ⚠️ 请求永远不返回时 `ajaxStop` 不会来，记得配 `timeout` 兜底。

### 执行顺序与触发次数

同时发两个请求时，六个钩子的次数并不一样，配对记最省事。

因为 `Send/Complete` 是「每个一次」，而 `Start/Stop` 是「全局一次」，混用会算错次数。

| 钩子 | 两个请求时的次数 |
|---|---|
| `ajaxStart` / `ajaxStop` | 各 1 次 |
| `ajaxSend` / `ajaxSuccess` / `ajaxComplete` | 各 2 次 |
| `ajaxError` | 失败几次就几次 |

顺序大致是：Start → Send → Success → Complete → 最后一个结束后 Stop。

> 💡 记住「Start/Stop 全局一次，Send/Complete 每请求一次」就不会乱。

### 使用要点

钩子必须先绑定再发请求，事件只对绑定之后发生的动作生效。

因为绑晚了这一次请求已经走完，钩子不会补触发，遮罩与错误提示都会漏掉。

- 绑定对象用 `$(document)` 最标准，`$(window)` 等价
- 用 `ajaxError` 统一处理 401 跳登录、500 提示，省去每处写 `error`
- `$.ajaxSetup` 可给所有请求加统一头，但会污染全局，多人协作慎用

全局错误处理是最常用的一个钩子，绑一次就管住整站：

```js
$(document).ajaxError(function (e, xhr, settings) {
    console.log(settings.url, xhr.status)   // 地址与状态码
    if (xhr.status === 401) location.href = "/login"
})
```

结果：任一请求失败都会打印失败地址，401 时统一跳登录。因为钩子从事件对象里拿到 xhr 与配置，能按状态码集中分流。

> ⚠️ 全局钩子管不到 jsonp，它走 script 标签，不经过 ajax 全局事件。
===CH===
no: 154
title: 案例-loading
lessons: 183
summary: ajaxStart 显示遮罩、ajaxStop 隐藏遮罩，两个钩子解决整站 loading 并厘清就绪时机
points: 遮罩用 fixed 铺满视口，四边 0 配 margin:auto 居中 || 钩子写在发请求的脚本之前，否则第一次请求不触发 || $(fn) 是 DOM 就绪且可多次绑定，onload 等资源且会覆盖 || jsonp 不经 ajax 全局事件，遮罩挡不住它 || 用 show/hide 更稳，并配 timeout 防止遮罩卡死
===BODY===
### 需求与思路

接口慢的时候页面要有反馈：盖一层半透明遮罩，请求发出时显示、全部结束再隐藏。

jQuery 有全局钩子 `ajaxStart` 与 `ajaxStop`，第一个请求开始时触发一次、最后一个请求结束时触发一次，几行就能服务整站。代价是它们对所有请求一视同仁。

只给某几个请求加遮罩，就用局部的 `beforeSend` / `complete`；这时并发请求必须配一个计数器，计数归零才关，否则先回来的那个会把还在加载的遮罩提前关掉。

### 完整案例代码

```js
// 依赖：引入 jQuery；页面有 <div id="loading"><div>加载中…</div></div>，默认 display:none
// 方案 A（整站通用，与下面的局部分案二选一）：
// $(window).ajaxStart(function () { $("#loading").show() })
// $(window).ajaxStop(function ()  { $("#loading").hide() })

var pending = 0                                   // 记录还没回来的请求数

function request(url, data, done) {
  $.ajax({
    url: url,
    data: data,
    timeout: 10000,                               // 兜底：请求挂起时也会结束，遮罩不会永远留在屏幕上
    beforeSend: function () {
      pending++                                   // ← 关键点：每发一个就加一，遮罩的显示是幂等的，重复调用不会闪
      $("#loading").show()
    },
    complete: function () {
      if (--pending === 0) $("#loading").hide()   // ← 关键点：计数归零才关，否则先回来的请求会提前关掉遮罩
    },
    success: done,
    error: function (xhr, status) { console.warn("请求失败", status) }   // 失败同样进 complete
  })
}

$(function () {                                   // ← 关键点：$(fn) 是 DOM 就绪，比 window.onload 早，还能绑多个
  console.log($("#loading").is(":visible"))       // => false，遮罩初始是隐藏的
  request("/api/banner", {}, renderBanner)
  request("/api/films", { pageNum: 1 }, renderList)   // 两个并发，遮罩要等两个都结束才消失
})
```

### 关键知识点

- **`ajaxStart` / `ajaxStop` 天然按整批请求计数**：前者在第一个请求发出时触发一次，后者在最后一个请求结束时触发一次，中间不会重复闪。这也是它适合整站遮罩的原因——写两行就够，不必自己维护状态。
- **全局钩子管的是「所有」请求**：第三方插件、其他模块发的请求都会一起触发遮罩，想只遮某一块就要退回局部钩子。另外钩子脚本必须排在发请求的脚本之前，否则第一次请求已经发出，钩子还没绑上。
- **并发时必须用计数器**：局部 `complete` 每个请求各触发一次，两个并发请求里先回来的那个就会执行 `hide()`，另一个还在加载却已经没有遮罩。用 `pending` 先加后减、归零才关，才能等到最后一批结束。
- **`$(fn)` 比 `window.onload` 更合适**：前者只等 DOM 结构就绪，图片还没下完就能跑，且可以绑多个回调；后者要等全部资源，且后写的会覆盖先写的。
===CH===
no: 155
title: 深浅复制（原生）
lessons: 184
summary: 赋值共享引用，浅复制只复制第一层，深复制递归每层，JSON 法省事却会丢值
points: 基本类型赋值复制值，引用类型赋值只复制地址 || for...in、展开运算符、Object.assign 都是浅复制 || 浅复制改第二层仍会影响原对象，这是最常见的 bug || 递归深复制要用 toString.call 判类型，先建空壳再填充 || JSON 法丢函数与 undefined、Date 变字符串、循环引用报错
===BODY===
### 赋值：基本类型传值、引用类型传地址

同样是 `=`，基本类型复制的是值本身，对象复制的是指向堆内存的地址。

因为对象变量里存的只是引用，两个变量指向同一块内存，改一个另一个必然跟着变。

```js
var a = "kerwin"
var b = a
b = "xiaoming"
console.log(a, b)              // => "kerwin" "xiaoming"

var o1 = { name: "kerwin" }
var o2 = o1                    // 只复制地址
o2.name = "xiaoming"
console.log(o1.name)           // => "xiaoming"
```

- 基本类型：互不影响
- 引用类型：共享同一个对象

> ⚠️ 想让两个对象彼此独立，必须复制而不是赋值。

### 浅复制：三种做法都只复制第一层

浅复制把第一层属性逐个搬到新对象，遇到嵌套的对象或数组就仍复制地址。

因为只走一层，写法有三种，但局限完全一致：第二层往下还是共享的。

```js
var src = { name: "kerwin", loc: { city: "dalian" } }
var byFor = {}
for (var k in src) { byFor[k] = src[k] }
var bySpread = { ...src }
var byAssign = Object.assign({}, src)

bySpread.name = "xiaoming"
console.log(src.name)          // => "kerwin"，第一层独立
bySpread.loc.city = "shenyang"
console.log(src.loc.city)      // => "shenyang"，第二层被改
```

- `for...in` 逐个赋值、`{...src}`、`Object.assign({}, src)` 都是浅复制
- 改第一层互不影响，改第二层原对象跟着变

> ⚠️ 「浅复制后改嵌套字段，原对象也变了」是这一章最常见的 bug。

### 深复制：递归复制每一层

深复制的思路是：遇到基本类型直接拷，遇到对象或数组就新建空壳，再往里递归。

因为每一层都新建了容器，最终得到的每一层都与原对象无关，才算真正独立。

```js
function deepCopy(target, origin) {
    for (var k in origin) {
        var t = Object.prototype.toString.call(origin[k])
        if (t === "[object Object]" || t === "[object Array]") {
            target[k] = t === "[object Array]" ? [] : {}
            deepCopy(target[k], origin[k])   // 递归填进子容器
        } else {
            target[k] = origin[k]
        }
    }
}
```

#### 判类型用 toString.call

`typeof` 分不清数组、null 与对象，用 `Object.prototype.toString.call` 最稳。

```js
console.log(Object.prototype.toString.call({}))    // => "[object Object]"
console.log(Object.prototype.toString.call([]))    // => "[object Array]"
console.log(Object.prototype.toString.call(null))  // => "[object Null]"
```

结果：三种值得到不同标签，`typeof` 却会把前两者都报成 `object`。因为标签来自对象内部的 class 信息，能精确区分。

#### 先建空壳再递归

必须先给 `target[k]` 一个 `{}` 或 `[]`，再把子层填进去；直接赋原值就退化成浅复制。

#### 递归传的是新目标

递归调用要传 `target[k]`，把数据填进子容器；传错成外层对象会全堆到第一层。

> 💡 递归天然处理任意深度，但遇到循环引用会栈溢出，需要额外记录已拷贝对象。

判完类型后，递归的收尾步骤就是「建空壳 + 填子层 + 归还」：

```js
deepCopy(myobj2, myobj1)   // 把 myobj1 深拷贝进 myobj2
console.log(myobj2.location.city)          // => "dalian"
myobj2.location.a.b.c = 999
console.log(myobj1.location.a.b.c)         // => 1，深层也互不影响
```

结果：改副本的第三层，原对象仍是旧值。因为每层对象都新建了容器，没有任何一层共享引用。

### JSON 转换法与它的缺陷

`JSON.parse(JSON.stringify(obj))` 一行就能深拷贝，原理是中间的字符串与原件彻底断开。

因为字符串是基本类型，序列化再反序列化得到的是全新对象，纯数据场景最省事。

| 原值类型 | 转换后 |
|---|---|
| `function` / `undefined` / `Symbol` | 整个键消失 |
| `Date` | 变成 ISO 字符串 |
| `NaN` / `Infinity` | 变成 `null` |
| `RegExp` | 变成空对象 `{}` |
| 循环引用 | 直接抛错 |

- 例：`{ d: new Date(), fn(){}, un: undefined }` 转完只剩 `d` 的字符串
- 只适合接口返回的纯数据，含函数的对象要另想办法

> 💡 含函数、Date 或循环引用时，改用递归或较新的 `structuredClone`。
===CH===
no: 156
title: jQuery 的深浅复制 $.extend
lessons: 185
summary: $.extend 第一个参数传 true 才是深复制，目标对象会被修改，深复制另有两处坑
points: 第一个参数是布尔 true 时开启深复制，否则是浅复制 || 目标对象是第一个非布尔参数，会被直接修改并返回 || 多个源依次覆盖，后面覆盖前面，不污染源就传 {} 当靶子 || 值为 undefined 的键深浅复制都会被跳过 || 深合并数组是按索引覆盖而非整体替换，容易得到意外结果
===BODY===
### 第一个布尔参数决定深浅

`$.extend` 把源对象的属性合并到目标上，第一个参数是不是 `true` 决定浅复制还是深复制。

因为布尔值只是个开关，放错位置就会被当成「目标对象」，合并结果完全不对。

```js
var src = { name: "kerwin", loc: { city: "dalian" } }
$.extend({}, src)              // 浅复制，loc 仍共享
$.extend(true, {}, src)        // 深复制，loc 是独立新对象
```

- `$.extend(target, src1, src2)`：浅复制
- `$.extend(true, target, src1, src2)`：深复制
- `$.extend(src)`：只传一个对象时，把属性挂到 `$` 上

> ⚠️ `true` 必须在最前面，写成 `$.extend({}, true, src)` 会被当成普通源对象。

### 目标会被修改，多个源依次覆盖

第一个非布尔参数是「目标」，它会被直接改动并作为返回值。

因为合并是「往目标里写」，想保留默认配置就得用空对象当靶子，别把默认值传进去。

| 位置 | 角色 |
|---|---|
| 第一个非布尔参数 | 目标，被修改并返回 |
| 后面的每个参数 | 源，后面的覆盖前面的 |

- 规范写法：`$.extend(true, {}, defaults, options)`
- 失误写法：`$.extend(true, defaults, options)` 会把 `defaults` 改掉
- 结果里同名键以最后出现的源为准

多源覆盖的结果可以直接看出来：

```js
var obj = $.extend({}, { name: "kerwin", age: 18 }, { age: 20 })
console.log(obj)   // => {name: "kerwin", age: 20}
```

结果：同名 age 被后一个源覆盖成 20。因为合并按参数顺序执行，后写的源总是覆盖先写的。

> 💡 用 `{}` 当靶子，是为了让默认配置在多次调用之间保持干净。

### 值为 undefined 的键会被跳过

值为 `undefined` 的键不会被合并进目标对象，深复制和浅复制都一样。

因为 jQuery 内部赋值前统一判了 `copy !== undefined`，这个判断在深浅两条分支之外，不是深复制独有的行为。

| 模式 | `undefined` 的键 |
|---|---|
| 浅复制 `$.extend({}, src)` | 被丢弃 |
| 深复制 `$.extend(true, {}, src)` | 被丢弃 |

- `$.extend(true, {}, { a: 1, b: undefined })` 得到 `{ a: 1 }`
- `$.extend({}, { a: 1, b: undefined })` 同样只剩 `a`

> ⚠️ 用 `undefined` 表示「字段不存在」时，合并后这个键会真的查不到，`"b" in obj` 为 `false`。

### 数组是按索引合并而非替换

深复制合并两个含同名数组的源时，是按索引逐个覆盖，不是整体换掉。

因为目标数组先按第一个源建好，第二个源只覆盖它自己有的那些下标，剩下的保留。

| 期望 | 实际 |
|---|---|
| `{ arr: [4] }` | `{ arr: [4, 2, 3] }` |

- 例：`$.extend(true, {}, { arr: [1,2,3] }, { arr: [4] })`
- 第一个源建出 `[1,2,3]`，第二个源把下标 0 改成 4
- 想整体替换，改用浅复制，或合并后手动 `cfg.arr = opts.arr`

> ⚠️ 这是 `$.extend(true)` 最著名的坑，配置里带数组时尤其要小心。
===CH===
no: 157
title: 多库并存 noConflict
lessons: 186
summary: $ 被别的库占用时，noConflict 交还控制权并返回 jQuery 引用，IIFE 更推荐
points: jQuery 加载时先存档旧的 $ 与 jQuery，再覆盖这两个名字 || $.noConflict() 只交还 $，jQuery 全名仍可用 || $.noConflict(true) 连 jQuery 一起交还，只能用返回值 || 返回值就是 jQuery 函数，换个变量即可继续使用 || IIFE 传 jQuery 当形参，从设计上避免 $ 冲突更干净
===BODY===
### 冲突从哪来

Zepto、prototype 之类的库也会用 `$` 当入口，后加载的 jQuery 会把这个名字覆盖掉。

因为全局变量只有一个，谁最后赋值谁生效，先引入的库就「丢」了它的 `$`。

```js
// 先引入的工具库
var $ = { ajax: function () { console.log("mine") } }
var jQuery = { b: 1 }

// 后引入 jQuery：先记住旧值，再占用这两个名字
var _jQuery = window.jQuery, _$ = window.$
window.jQuery = window.$ = jQuery
```

> 💡 「先存档、再覆盖」是理解 noConflict 的关键：它其实就是「读档」。

### noConflict 交还控制权

调用 `$.noConflict()` 会把 `$` 还原成 jQuery 加载之前那个值。

因为存档里留着旧引用，调用时把它写回去即可，同时把 jQuery 函数本身作为返回值交给你。

| 写法 | 交还 | 返回 |
|---|---|---|
| `$.noConflict()` | 只 `$` | jQuery 函数 |
| `$.noConflict(true)` | `$` 和 `jQuery` | jQuery 函数 |

```js
var jq = $.noConflict()
jQuery("div").html(1)     // 全名仍可用
jq("div").html(1)         // 用返回值也行
```

> ⚠️ 深交还后 `jQuery` 也不再是 jQuery，此时只能用返回值 `jq`。

### 三种用法的选择

冲突程度不同，处理方式也不同，核心是「还能用哪个名字」。

因为交还得越多，可依赖的全局名越少，所以按实际冲突情况选最轻的一种。

- 不冲突：照常写 `$("div")`，什么都不用做
- 只和 `$` 冲突：`var jq = $.noConflict()`，之后用 `jQuery` 或 `jq`
- 两个名字都冲突：`var jq = $.noConflict(true)`，只能用 `jq`

交还后验证一下返回值，就知道手里还剩什么：

```js
var jq = $.noConflict()
console.log(jq === jQuery)   // => true，返回值就是 jQuery 函数
console.log($)               // => 旧库那个 $，已经交还回去
```

结果：jq 与 jQuery 全名指向同一个函数，`$` 则变回旧库的值。因为 noConflict 返回值就是 jQuery 本体。

> 💡 noConflict 必须在 jQuery 引入之后、第一次使用之前调用，早了晚了都不对。

### 更推荐 IIFE 传局部 $

比起运行时交还，把 jQuery 当参数传进立即执行函数，是更干净的做法。

因为形参 `$` 是局部变量，外部全局怎么变都不影响函数体，从设计上就避开了冲突。

```js
(function ($) {
    $("div").html(1)      // 这里的 $ 永远是传进来的 jQuery
})(jQuery)
```

- 不污染全局，变量都关在 IIFE 里
- 形参可任意命名，压缩工具能把它压成单字母
- jQuery 插件普遍采用这个骨架

> 💡 noConflict 是运行时救火，IIFE 是从结构上避免冲突，优先用后者。
===CH===
no: 158
title: jQuery 扩展机制
lessons: 187
summary: $.extend 加静态工具方法，$.fn.extend 加实例方法，插件返回 this 才能链式
points: $.extend({...}) 只传一个对象时把方法挂到 $ 上，成为 $.xxx || $.fn 就是 $.prototype，扩展它等于给所有 jQuery 对象加方法 || 静态方法里 this 是 $，实例方法里 this 是被选中的 jQuery 集合 || 插件必须 return this，否则链式在插件处断掉 || 规范骨架用 return this.each(fn)，兼顾遍历每个元素与链式
===BODY===
### $.extend 扩展静态工具方法

`$.extend({...})` 只传一个对象时，含义变成「把这些属性挂到 `$` 上」。

因为 `$` 本身是个函数对象，给它加属性就得到 `$.xxx` 这样的全局工具，任何地方都能调。

```js
$.extend({
    kerwin: function () { console.log("kerwin") },
    deepCopy: function (o2, o1) { /* 前面章节的递归拷贝 */ }
})

$.kerwin()                 // => "kerwin"
$.deepCopy({}, src)        // 自定义工具
$.ajax(...)                // 库自带的工具
```

- 静态方法不依赖选中元素，直接 `$.方法名()` 调用
- 与 `$.ajax`、`$.each` 属于同一层，适合放通用函数

> 💡 这正是 `$.extend` 的「只传一个对象」那种签名，别和合并对象混为一谈。

### $.fn.extend 扩展实例方法

想让 `$(selector).方法名()` 也能调，必须把方法加到 `$.fn` 上。

因为 `$.fn === $.prototype`，所有 jQuery 对象都来自这个原型，加一次就全体可用。

```js
$.fn.extend({
    allChecked: function (flag) {
        this.prop("checked", flag)
        return this
    }
})

$("input[type=checkbox]").allChecked(true).css({ width: 100 })
```

- `$.fn.extend({...})`：最常见
- `$.extend($.fn, {...})`：同义写法
- `$.fn.allChecked = function(){}`：最原始的写法

> ⚠️ 静态扩展用 `$.extend`，实例扩展用 `$.fn.extend`，挂错地方就调不到。

### 插件里的 this 是什么

两类扩展方法里的 `this` 指向不同，取决于方法是谁调用的。

因为静态方法由 `$` 调用、实例方法由选中的集合调用，弄清指向才能用对 API。

| 位置 | `this` |
|---|---|
| `$.extend({ fn(){} })` 里 | `$` 本身 |
| `$.fn.extend({ fn(){} })` 里 | 调用它的 jQuery 对象，可能是集合 |

- 静态方法里能写 `this.deepCopy(...)` 递归调用自己
- 实例方法里 `this.prop(...)` 会隐式迭代整组元素

静态方法里靠 this 递归调用自己的写法：

```js
$.extend({
    deepCopy(o2, o1) {
        // ...判类型、建空壳后递归
        this.deepCopy(o2[i], o1[i])   // this 就是 $
    }
})
$.deepCopy({}, src)                   // => 从 $ 上直接调
```

结果：方法内部能用 `this` 调回自己。因为静态方法由 `$` 调用，函数里的 `this` 指向 `$` 本身。

> 💡 实例方法里的 `this` 已是 jQuery 对象，不要再包一层 `$(this)`。

### 为什么必须 return this

链式调用靠「方法返回自身」延续，插件不返回 jQuery 对象，链条就在此断掉。

因为 jQuery 内置方法几乎都 `return this`，插件要守同一条规矩，才能接 `.css()` 之类。

```js
// 正确
$.fn.extend({ allChecked: function (v) { this.prop("checked", v); return this } })
$("input").allChecked(true).css({ width: 100 })

// 漏了 return，返回 undefined
$.fn.extend({ bad: function (v) { this.prop("checked", v) } })
$("input").bad(true).css({ width: 100 })   // => TypeError
```

> 💡 规范骨架是 `return this.each(fn)`：既遍历每个元素，又保住链式。
===CH===
no: 159
title: 自定义插件-选项卡
lessons: 188
summary: 把选项卡逻辑搬进 $.fn.extend，选择器改用 this.find，index 参数控制初始项
points: 插件内部一律用 this.find()，不用全局 $() 才不误伤别的容器 || find 兼容外层多包一层，children 只找直接子级会失效 || index 参数决定默认选中项，记得给默认值 0 || 补 return this 才能继续链式调用 || 先渲染 DOM 再调插件初始化，顺序反了事件绑不上
===BODY===
### 把选项卡逻辑插件化

把前面选项卡案例的绑定逻辑搬进 `$.fn.extend`，就得到一个可复用的 `tabs()` 方法。

因为插件要能被任意容器调用，内部不能再写死某个具体 id，得从 `this` 出发找元素。

```js
$.fn.extend({
    tabs: function (index) {
        var $li = this.find(".header li")
        var $box = this.find(".box li")
        $li.eq(index).addClass("active")
        $box.eq(index).addClass("active")
        $li.click(function () {
            $(this).addClass("active").siblings().removeClass("active")
            $box.removeClass("active").eq($(this).index()).addClass("active")
        })
    }
})
```

> 💡 结构约定是容器里有 `.header` 与 `.box` 两个列表，插件靠 class 名当接口。

### 选择器从全局改为局部

插件里必须用 `this.find()`，不能用 `$(".header li")` 这种全局选择器。

因为全局写法会把页面上所有同类容器一起改掉，一个页面放两组选项卡就全乱了。

| 写法 | 后果 |
|---|---|
| `$(".header li")` | 影响页面上所有 `.header` |
| `this.find(".header li")` | 只影响当前这个容器 |

`find` 取所有后代，容器外面多包一层也能命中；`children` 只认直接子级，结构一变就失效。

> ⚠️ 插件化的第一步，就是把「全局选择器」换成「基于 this 的查找」。

### 两处必要的改进

初版有两个瑕疵：`index` 不传时 `eq(undefined)` 什么都不选，且没返回对象导致链式断开。

因为参数与返回值都属于插件对外契约，补上默认值与 `return this` 才算完整。

```js
tabs: function (index = 0) {
    var $li = this.find(".header li")
    var $box = this.find(".box li")
    $li.eq(index).addClass("active")
    $box.eq(index).addClass("active")
    $li.click(function () {
        $(this).addClass("active").siblings().removeClass("active")
        $box.removeClass("active").eq($(this).index()).addClass("active")
    })
    return this
}
```

> 💡 调用时 `$("#a").tabs(0)`、`$("#b").tabs(2)`，两组容器互不干扰。

### 使用约定与顺序

用数据动态生成标题和内容时，必须先渲染 DOM，再调插件初始化。

因为 `.html()` 会整体替换旧节点、连同绑在上面的事件一起清掉，先初始化等于白绑。

- 顺序：拼字符串 → `.html()` 插入 → `.tabs(0)` 绑定
- 反序：先 `.tabs()` 再 `.html()`，旧节点被换掉，事件全丢
- 一个页面用两次时，靠 `this.find()` 限定范围，两组互不串台

> ⚠️ 标题与内容的 `li` 数量要一致，否则 `eq(index)` 会取到空集合。
===CH===
no: 160
title: 插件-轮播 owl
lessons: 189
summary: owlCarousel 靠固定 class 与配置对象工作，三件套按顺序引入，动态内容要 refresh
points: 结构 css、主题 css、插件 js 三件套，jquery.js 要在插件前 || 容器必须有 owl-carousel 类，每个子 div 是一项 || owlCarousel({items, loop, autoplay}) 一行完成初始化 || 事件带 .owl.carousel 命名空间，changed 最常用 || 动态插入内容后必须触发 refresh.owl.carousel 重算宽度
===BODY===
### 引入三件套与顺序

owlCarousel 依赖一个结构样式、一个主题样式和插件脚本，且必须在 jQuery 之后引入。

因为插件本体要挂在 `$` 上，而结构 css 负责把子项排成一行，缺一样都会「竖着排」。

| 文件 | 作用 |
|---|---|
| `owl.carousel.min.css` | 结构样式，必须，不引就全乱 |
| `owl.theme.default.css` | 主题样式，圆点与箭头的样子 |
| `owl.carousel.min.js` | 插件本体 |

- 顺序：先 `jquery.js`，再 `owl.carousel.min.js`
- 两个 css 放在头部，主题可按需替换

> ⚠️ 把 jQuery 放在插件后面会报 `owlCarousel is not a function`。

### HTML 约定

插件靠一个固定 class 找容器，每一项就是一个直接子 `div`。

因为它初始化时会去数这些子元素并测量宽度，结构不对就算不出正确的滚动距离。

- 容器写 `class="owl-carousel owl-theme"`
- 每个子 `div` 是一项，里面放 `img` 即可
- 不要在子项外面再套一层 wrapper，否则层数对不上

> 💡 主题类 `owl-theme` 配合主题 css 才有圆点和箭头，结构类才是必需的。

### 初始化与常用配置

选中容器后调用 `owlCarousel(配置对象)`，一行就能跑起来。

因为所有行为都收敛进配置对象，改效果只需改字段，不必碰 HTML 结构。

```js
var $owl = $(".owl-carousel").owlCarousel({
    items: 1,          // 一屏显示几个
    loop: true,        // 循环
    autoplay: true,    // 自动播放
    margin: 10,
    responsive: { 0: { items: 1 }, 600: { items: 3 }, 1000: { items: 5 } }
})
```

| 配置 | 说明 |
|---|---|
| `items` | 每屏显示几个 |
| `loop` / `autoplay` | 循环、自动播放 |
| `nav` / `dots` | 左右箭头、圆点 |
| `responsive` | 按断点给不同 items |

> 💡 `responsive` 用视口宽度当键，移动端少放、宽屏多放很实用。

### 事件、API 与动态内容

owl 的事件名带 `.owl.carousel` 命名空间，用起来和 jQuery 的 `on` 一致。

因为动态插入图片后插件不知道内容变了，宽度还是旧的，必须主动刷新一次。

| 事件 / API | 用途 |
|---|---|
| `changed.owl.carousel` | 切换完成，最常用 |
| `data("owl.carousel")` | 取出实例 |
| `next()` / `prev()` / `to(n)` | 手动切换 |
| `trigger("refresh.owl.carousel")` | 内容变了重算 |

> ⚠️ `.html(newItems)` 之后一定要 `refresh`，否则只显示第一张。
===CH===
no: 161
title: 轮播库 swiper
lessons: 190
summary: Swiper 不依赖 jQuery，靠三层固定结构与 new Swiper 工作，异步渲染需开 observer
points: Swiper 是独立库，用 new Swiper(选择器, 配置) 初始化 || 必须有 swiper、swiper-wrapper、swiper-slide 三层结构 || 容器要设明确宽高，否则高度为 0 整块看不见 || 配置集中在 loop、pagination、autoplay、effect 等项 || 内容是后插的时开 observer，或手动调 update() 重算
===BODY===
### 引入与三层容器结构

Swiper 不依赖 jQuery，是独立库，引入一个 css 和一个 js 即可。

因为它靠固定的三层 class 找到要平移的那一层，结构写错就不报错也不滚动。

```html
<div class="swiper kerwin">
    <div class="swiper-wrapper">
        <div class="swiper-slide">Slide 1</div>
        <div class="swiper-slide">Slide 2</div>
    </div>
    <div class="swiper-pagination"></div>
</div>
```

- `swiper`：容器，必须设明确宽高
- `swiper-wrapper`：被整体平移的包裹层
- `swiper-slide`：每一项，分页器与箭头是可选元素

> ⚠️ 不设宽高时容器高度为 0，整个轮播会「消失」；少了 wrapper 则不会滚动。

### 初始化参数

Swiper 用 `new Swiper(选择器, 配置)` 创建实例，配置里还能挂事件回调。

因为实例化时它就去测量 DOM，所以这一步必须在节点已经存在之后执行。

```js
new Swiper(".kerwin", {
    loop: true,
    pagination: { el: ".swiper-pagination", clickable: true },
    autoplay: { delay: 2500, disableOnInteraction: false },
    on: {
        slideChange: function () { console.log(this.activeIndex) }
    }
})
```

- 第一个参数是容器选择器，第二个是配置对象
- `on` 里写 `init`、`slideChange`、`reachEnd` 等回调
- 也可先存实例再 `swiper.on("slideChange", fn)`

> 💡 `bundle` 版本自带分页、导航、3D 等全部模块，一般直接用它。

### 常用配置项速查

配置项很多，但常用的集中在循环、方向、分页与切换效果几类。

因为每个字段都有默认值，只写要改的那几项即可，不必把整张表填满。

| 配置 | 说明 |
|---|---|
| `loop` / `direction` | 循环、水平或垂直 |
| `speed` / `slidesPerView` | 动画毫秒、一屏几个 |
| `pagination.el` / `clickable` | 分页器与圆点可点 |
| `autoplay` / `navigation` | 自动播放、左右箭头 |
| `effect` | slide、fade、cube、flip |
| `observer` | DOM 变化后自动更新 |

> ⚠️ `loop: true` 时 `activeIndex` 是含克隆块的真实索引，可能大于实际条数。

### 异步渲染后需要 observer

内容由 ajax 后插进来时，Swiper 初始化时量的还是空容器，需要让它重新测量。

因为 `observer` 会监听 DOM 变化自动更新，等于给「先渲染后初始化」上了一道双保险。

```js
var swiper = new Swiper(".kerwin", { observer: true, observeParents: true })
// 内容变化后也可手动
$(".swiper-wrapper").html(newSlides)
swiper.update()
```

- `observer: true` 监听自身变化，`observeParents` 连父级一起监听
- `update()` 手动重算，`slideNext/slideTo/destroy` 是常用实例方法

> ⚠️ 纯前端「异步渲染 + 轮播」的组合，几乎都要开 `observer` 或补 `update()`。
===CH===
no: 162
title: 案例-swiper
lessons: 191
summary: $.get 拿数据先渲染 slide 再 new Swiper，异步内容必开 observer，可用 $.extend 包装
points: 顺序是取数据、render 插 slide、最后初始化 Swiper || 初始化会测量 DOM，先初始化后渲染会导致轮播不动 || observer:true 让 Swiper 监听 DOM 变化自动重新测量 || $.extend 把 new Swiper 包成 $.swiper，统一风格并加默认配置 || imgUrl 是绝对地址直接用，图片设 width:100% 防撑破容器
===BODY===
### 需求与思路

banner 图来自接口，取回后拼成轮播：先把每张图渲染成 `<div class="swiper-slide">`，再 `new Swiper` 初始化。

Swiper 初始化时会测量容器和 slide 的尺寸，容器里空着就量不出结果，轮播会一动不动，所以顺序一定是取数据、渲染、再初始化。

内容是异步插进去的，还要开 `observer: true` 让 Swiper 监听 DOM 变化自动重算，这是第二道保险。

配置集中在 `loop`、`pagination`、`navigation`、`autoplay`；图片给 `width:100%`，否则原图会把容器撑破。

### 完整案例代码

```js
// 依赖：引入 jQuery 与 swiper 的 css、js；页面有 .swiper.kerwin 容器，内含 wrapper、pagination、左右箭头
$(function () {
  $.get("http://localhost:3000/banner")
    .then(function (list) {
      render(list)                                 // ← 关键点：先插好 slide 再初始化，顺序反了 Swiper 量到的是空容器
      initSwiper()
    })
    .catch(function (err) { console.warn("banner 加载失败", err) })
})

function render(list) {
  if (!list || !list.length) return
  var slides = list.map(function (item) {          // ← 关键点：三层 class 结构照抄，类名写错不报错但不会滚动
    return `<div class="swiper-slide"><img src="${item.imgUrl}"/></div>`
  })
  $(".swiper-wrapper").html(slides.join(""))       // ← 关键点：join("") 去掉逗号，一次性替换 wrapper 内容
  console.log($(".swiper-slide").length)           // => 3
}

function initSwiper() {
  return new Swiper(".kerwin", {
    loop: true,                                    // ← 关键点：loop 要克隆首尾，少于 3 张时边界会闪
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    autoplay: { delay: 2500, disableOnInteraction: false },
    observer: true,                                // ← 关键点：监听 DOM 变化自动重新测量，等价于手动 update()
    observeParents: true
  })
}
```

### 关键知识点

- **顺序决定了轮播能不能动**：`new Swiper` 在构造时就把 slide 的数量、宽度读进实例，之后再插内容它并不知道。所以要么先渲染再初始化，要么初始化时开 `observer` 让它监听变化；两者都做才算稳。
- **`observer` 与 `update()` 是一回事的两种触发方式**：`observer: true` 由 DOM 变动自动触发重算，`observeParents` 连父级一起看；也可以在插完内容后手动 `swiper.update()`。只写 `observer` 不加父级监听时，容器本身尺寸不变、只是内部被替换的情况仍可能漏掉。
- **`loop` 会克隆首尾 slide**：为了实现无缝循环，Swiper 会复制末尾几张插到开头，所以真实 DOM 里的 slide 数量比数据多。数据只有一两张时克隆比例过高，快速滑动容易出现空白，实际项目一般备足 3 张以上。
- **容器和图片的尺寸都要交代清楚**：容器不设宽高时高度为 0，整块轮播「消失」；图片不设 `width:100%` 就按原图尺寸铺开，会把容器撑变形。数据里的 `imgUrl` 是绝对地址可直接用，若是 `/images/x.jpg` 这类相对路径，得自己拼上后端域名。
