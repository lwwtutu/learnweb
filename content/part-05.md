===PART===
id: part-05
order: 5
title: BOM：浏览器对象模型
range: 066–075
desc: 用 BOM 操作浏览器窗口、地址、历史与本地存储
===CH===
no: 37
title: 初识 BOM
lessons: 066
summary: BOM 是用 JS 操作浏览器的接口，入口 window 既是窗口也是全局对象，能力都挂在它下面
points: JS 分语法、DOM、BOM 三块，语法完全通用 || BOM 的操作对象是浏览器窗口本身 || window 既是浏览器窗口也是全局对象，二者同一 || 全局变量与函数都是 window 的属性，可省前缀 || BOM 长期没有统一标准，故常见兼容写法
===BODY===
### BOM：同一套语法，换个操作对象

BOM 是 Browser Object Model 的缩写，指用 JS 操作浏览器窗口的一整套方法，入口是 `window`。

一门 JavaScript 的能力可划成三块：语法核心 ECMAScript 管变量与运算，DOM 管页面标签，BOM 管浏览器本身。

三者用的是完全一样的语法。会写循环就能遍历历史记录，会写判断就能比较滚动距离。

所以 BOM 不是一门新语言，只是把已会的语法用在新的操作对象上——从数据换成了浏览器窗口。

> 🧠 换个操作对象，不等于换一门语言。

### window 既是窗口，也是全局对象

BOM 的入口 `window` 有两个身份：它代表浏览器窗口，同时也是 JS 的全局对象。

这两个身份指向同一个东西，而非两个对象。浏览器这样设计，是为了给脚本一个统一的入口，所有全局能力都挂在它下面。

- 全局作用域里的 `this` 等于 `window`。
- `window.window.window === window` 成立，所以这个名字无需声明就永远存在。

在控制台用 `console.dir(window)` 展开，能看到几百个属性，其中就包括后面要拆开讲的那些成员。

### 全局变量都是 window 的属性

在全局用 `var` 声明变量，等于给 `window` 加了一个同名属性，反过来给 `window` 挂属性也能当全局变量读。

这种双向等价是理解很多现象的关键。忘了写 `var` 的赋值，其实是往 `window` 上加属性，所以哪里都能访问到——这就是隐式全局变量的真相。

```js
var a = 1
console.log(window.a === a)   // => true
window.abc = 100
console.log(abc)              // => 100
```

> ⚠️ 依赖隐式全局会让变量来源变得难查，声明时一律写清 `var`。

### 为什么能省略 window 前缀

`alert`、`innerWidth`、`location` 都是 `window` 的属性，而全局作用域里的名字查找最终会落到 `window` 上。

因此直接写这些名字，和加上 `window.` 完全等价，这不是语法特例，而是全局对象在起作用。

```js
alert("hi")          // 等价于 window.alert("hi")
innerWidth           // 等价于 window.innerWidth
location.href        // 等价于 window.location.href
```

> 💡 只有在全局作用域才成立，函数内部的局部变量不挂到 `window`。

### BOM 与 DOM 各管什么

两者最容易混，界限其实很清楚：DOM 操作页面里的标签，BOM 操作承载页面的浏览器窗口。

取元素、改文字、加样式属于 DOM；量窗口、弹框、跳页面、读写地址与历史属于 BOM。判断归属时，问一句「动的是标签还是浏览器」即可。

| 分块 | 操作对象 | 能做什么 |
|---|---|---|
| ECMAScript | 数据 | 计算、判断、循环、存数据 |
| BOM | 浏览器 | 量窗口、弹框、跳页面、滚动、本地存储 |
| DOM | 页面标签 | 取元素、改内容、改样式 |

### 兼容写法从哪里来

ECMAScript 和 DOM 都有标准文档，BOM 却长期没有统一规范，各浏览器实现不一致。

后果就是 BOM 里到处是「两套写法取一个有效值」的套路。看到这种代码不必怀疑自己没学会，根源在浏览器没统一。

```js
var top = document.documentElement.scrollTop || document.body.scrollTop
```

`||` 在这里挑出有值的那一个，是后面读滚动距离时的经典兼容写法。
===CH===
no: 38
title: 浏览器可视窗口的尺寸
lessons: 067
summary: innerWidth 与 innerHeight 是视口宽高，含滚动条但不含工具栏，只读且只是此刻的快照
points: innerWidth 是视口宽，含滚动条不含工具栏 || clientWidth 不含滚动条，outerWidth 含浏览器边框 || 视口宽等于 clientWidth 加滚动条宽度 || 这两个值只读，赋新值既无效也不报错 || 窗口尺寸会变，需靠 onresize 重新读取
===BODY===
### innerWidth 量的是「能看到的那一块」

`window.innerWidth` 与 `innerHeight` 返回页面可视区域（视口）的宽和高，单位是像素。

它包含滚动条占的位置，但不包含地址栏、书签栏这类浏览器工具栏。所以量的是「内容真正能显示的那块」，不是整个窗口。

写不写 `window.` 前缀结果完全一样，这正好印证了全局对象那一节的结论。

```js
console.log(window.innerWidth, innerWidth)   // => 1280 1280
```

### 几种「宽度」别混

页面上能读到的宽度不止一个，区别集中在是否算进滚动条和工具栏。

`inner` 是里面能显示的，`outer` 是连边框工具栏在内的整个窗口，`client` 则把滚动条排除在外。做布局一律以 `innerWidth` 为准。

| 属性 | 量到什么 | 含滚动条 | 含浏览器工具栏 |
|---|---|---|---|
| `window.innerWidth` | 视口宽 | 含 | 不含 |
| `document.documentElement.clientWidth` | 视口宽 | 不含 | 不含 |
| `window.outerWidth` | 整个浏览器窗口 | — | 含 |
| `screen.width` | 屏幕分辨率 | — | — |

核心关系是 `innerWidth = clientWidth + 滚动条宽度`。Windows 下 Chrome 的滚动条约 15px，前两个值不相等属于正常现象。

### 只读，而且只是「此刻」的快照

这组值是只读的，赋新值既不报错也不生效。它还是一次读取的快照，不是实时绑定。

把 `innerWidth` 存进变量后，用户拖动窗口，变量里仍是旧数字，必须重新读一次才能拿到新值。

```js
innerWidth = 100                // 只读，赋值无效也不报错
var w = innerWidth              // 此刻的快照
window.onresize = function () {
    console.log(innerWidth)     // => 拖动窗口后重新读到的新宽度
}
```

> ⚠️ 把尺寸存成常量再复用，是尺寸相关 bug 的常见来源。

### 什么时候用，尺寸变了怎么办

常见用途有三类，都围绕「按视口安排布局」：

- 全屏遮罩高度设成 `innerHeight + "px"`。
- 用 `if (innerWidth < 768)` 判断移动端。
- 用 `scrollHeight - innerHeight` 算最大可滚动距离。

窗口尺寸随时会变，想在变化时自动更新，就把重新计算的逻辑放进 `onresize` 回调里，每次触发都重新取值。

```js
window.onresize = function () {
    box.style.height = innerHeight + "px"   // 每次变化都取最新值
}
```

> 💡 它不含工具栏，用户收起地址栏时 `innerWidth` 会变大，页面代码却没改。
===CH===
no: 39
title: 浏览器的弹出层
lessons: 068
summary: alert、confirm、prompt 是 window 的三种弹窗，返回值各不相同，且弹出时会暂停主线程
points: alert 只有一个确定按钮，返回 undefined || confirm 返回布尔，必须接住返回值再用 || prompt 返回字符串或 null，点取消得到 null || 三种弹窗都会暂停 JS 主线程等待用户操作 || 样式不可改且体验差，实战多用自定义弹层
===BODY===
### 三个都是 window 的方法

浏览器内置三种弹出层：`alert`、`confirm`、`prompt`，都由 `window` 提供，外观由浏览器决定、样式一律改不了。

三者都能暂停脚本等待用户操作，差别主要在能拿回什么。越往下，能收集的用户输入越多。

| 方法 | 按钮 | 返回值 |
|---|---|---|
| `alert(内容)` | 只有确定 | `undefined` |
| `confirm(内容)` | 确定 + 取消 | `true` / `false` |
| `prompt(内容, 默认值)` | 确定 + 取消 | 字符串 / `null` |

### alert：只用来提示

`alert` 只有确定按钮，用于「操作成功」这类单纯告知，拿不回任何值。

它的参数会先转成字符串，传对象会弹出 `[object Object]`，因此不适合展示结构化内容。返回 `undefined` 就是它不收集输入的体现。

```js
alert("缓存清除成功")
console.log("这行要等用户点掉弹框才打印")
```

> 💡 配合定时器做「两秒后提示成功」，是它最常见的使用场景。

### confirm：问一句，要个答案

`confirm` 用于让用户在两个动作间做选择，返回布尔值，所以「必须接住返回值」才有意义。

返回值本就是布尔，判断写 `if (ok)` 即可，不必再写严格相等。删除、退出登录、放弃未保存的编辑都适合用它。

```js
var ok = confirm("确定删除吗？")
console.log(ok)              // => true（点确定）/ false（点取消）
if (ok) { /* 真删 */ }
```

### prompt：让用户输入

`prompt` 多一个输入框，能拿回用户输入的字符串，第二个参数是输入框的预填默认值。

三种结果必须分清，否则「取消」会被误当成「输入了空」：

- 输入后点确定 → 字符串。
- 什么都没输点确定 → 空字符串 `""`。
- 点取消 → `null`。

```js
var name = prompt("请输入用户名", "kerwin")
if (name === null) console.log("用户取消了")
else if (name === "") console.log("什么都没输")
else console.log("输入了：" + name)
```

### 阻塞与为什么少用

弹窗会挂起 JS 主线程：弹出后代码停住，等用户点完按钮才继续往下执行。

上一节 `alert` 后面那行日志不是没执行，而是在排队等待。理解这一点，是因为后面学异步时也会遇到同样的「等待」模型。

实战里基本不用这三种弹窗，原因集中在体验：

- 样式改不了，字体、颜色、按钮文字都动不了。
- 用户不点，整个页面就卡住。
- 浏览器可能被设成「禁止此页面再弹出」，之后直接不显示。
- 移动端各系统外观不统一。

实际项目会等学了 DOM 后用 `div` 配 CSS 自己画弹层，`confirm` 尤其该换成自定义确认框。
===CH===
no: 40
title: 浏览器的地址栏
lessons: 069
summary: location 读可拿到 URL 的每一段，写可跳转页面，assign 与 replace 的区别在历史记录
points: href 读得到完整地址，赋值即跳转并新增历史 || protocol 带冒号、search 带问号、hash 带井号 || assign 新增一条记录，replace 替换当前记录 || reload 刷新，写进全局会造成无限刷新 || 解析参数可先切 search 再按与号等号拆分
===BODY===
### location 既能读地址，也能写跳转

`location` 同时挂在 `window` 和 `document` 上，且指向同一个对象，平时直接写 `location.xxx` 即可。

读它能拿到当前 URL 的每一段；给它赋值，则等于让页面跳到新地址。`href` 读是完整地址，写就是跳转。

```js
console.log(location.href)                 // => "http://127.0.0.1:5500/index.html"
location.href = "http://www.baidu.com"     // 赋值即跳转，并新增一条历史记录
```

> 💡 中文路径在 `href` 里会变成百分号编码，这是正常转义，不是乱码。

### 一个 URL 由哪几段组成

要读懂 `location` 的属性，先看清一条完整地址的结构。一条 URL 会被切成若干段，每段各司其职。

- `http:` 是协议，`www.kerwin.com` 是域名，`8080` 是端口。
- `/a/b/index.html` 是路径，`?id=1` 是查询参数，`#top` 是片段标识。

`host` 把域名和端口合在一起，`origin` 再往前包含协议。分段的意义在于可以只取需要的那一段，而不必自己切整串。

### location 属性对照表

每个属性对应上节的一段，返回值全是字符串，`port` 拿到的 `"8080"` 也是字符串。

| 属性 | 示例值 | 注意 |
|---|---|---|
| `href` | 完整 URL | 读全部，写即跳转 |
| `protocol` | `"http:"` | 带冒号 |
| `host` | `"www.kerwin.com:8080"` | 域名 + 端口 |
| `hostname` | `"www.kerwin.com"` | 只有域名 |
| `port` | `"8080"` | 默认端口时为空串 |
| `pathname` | `"/a/b/index.html"` | 以 `/` 开头 |
| `search` | `"?id=1&name=abc"` | 带问号，无参数时为空串 |
| `hash` | `"#top"` | 带井号 |
| `origin` | `"http://www.kerwin.com:8080"` | 协议 + 域名 + 端口 |

> ⚠️ `protocol` 带冒号、`search` 带问号、`hash` 带井号，用之前先 `slice(1)` 去掉前缀。

### assign、replace、reload 的差异

三种改变地址的方式，区别在于对历史记录做什么，而不在跳转本身。

`assign` 是「多记一笔」，`replace` 是「改写这一笔」，所以 `replace` 跳过去后按后退回不来，适合登录成功后跳首页。

| 写法 | 对历史记录的影响 | 典型场景 |
|---|---|---|
| `location.href = url` | 新增一条 | 普通跳转，能后退 |
| `location.assign(url)` | 新增一条 | 与上者等价，少用 |
| `location.replace(url)` | 替换当前这条 | 登录后跳首页，回不去 |
| `location.reload()` | 不变 | 刷新，相当于按 F5 |

`reload()` 必须放在事件或条件里。若写在全局作用域，页面会「加载→刷新→再加载」陷入无限循环。它那个强制从服务器取的参数已废弃，无参调用即可。

### 顺手取出查询参数

把 `search` 去掉问号，按 `&` 拆成键值对，再按 `=` 拆出键与值，逐项比对即可。

全程用的都是前面学过的字符串与数组方法，这也是 BOM 的特点：给旧知识找一个新舞台。

```js
function getQuery(key) {
    var arr = location.search.slice(1).split("&")   // => ["id=10", "name=abc"]
    for (var i = 0; i < arr.length; i++) {
        var item = arr[i].split("=")
        if (item[0] === key) return item[1]
    }
    return null
}
console.log(getQuery("id"))   // => "10"
```
===CH===
no: 41
title: 浏览器的常见事件
lessons: 070
summary: window 上的 onload、onresize、onscroll 分别对应加载完成、尺寸变化与页面滚动
points: onload 等所有资源加载完，只触发一次 || onresize 在窗口尺寸变化时高频触发 || onscroll 要求页面高度超过视口才会触发 || onxxx 赋值只能绑一个，后者覆盖前者 || 高频回调里只做轻量计算，重活交给节流
===BODY===
### window 上的三个高频事件

给 `window` 的属性赋一个函数，就能在相应时机被调用，写法和按钮的 `onclick` 一样，只是对象换成了窗口。

三者关键差别在触发时机：一个只在加载完成时来一次，另两个会随用户操作反复触发。

| 事件 | 触发时机 | 次数 | 常见用途 |
|---|---|---|---|
| `onload` | 页面所有资源加载完 | 一次 | 初始化、安全地取元素 |
| `onresize` | 窗口尺寸变化 | 多次 | 重新计算布局 |
| `onscroll` | 页面滚动 | 多次 | 吸顶、回到顶部 |

```js
window.onload = function () { console.log("资源全部就绪") }
window.onresize = function () { console.log(innerWidth) }
window.onscroll = function () { console.log("滚动中") }
```

### onload：等所有资源加载完

`onload` 要等 HTML、CSS、JS、图片、视频、字体全部就绪才触发，一张大图没下完它就不来，页面看起来像卡住。

正因为等得全，它的价值是「安全地取元素」：脚本写在页面头部时，把取元素的代码放进 `onload` 回调，一定拿得到；直接写在外面只会得到 `null`。

- 脚本在 head、不加 `onload`：取元素得到 `null`。
- 脚本在 head、`window.onload` 里取：能拿到，结构清晰，推荐。
- 脚本放到 body 末尾：也能拿到，是另一种选择。

> 💡 只等 DOM 结构、不想等图片，可用更早触发的 `DOMContentLoaded`。

### onresize：窗口尺寸一变就触发

`onresize` 在拖动边框、全屏、手机横竖屏切换、开关开发者工具时触发。

要留意它非常高频：一次拖动会因每变化一像素而触发几十次，所以回调里别放重活。

> ⚠️ 尺寸类计算要放在这里重新取值，因为 `innerWidth` 只是快照，不会自动更新。

### onscroll：页面真的滚动了

`onscroll` 在页面滚动时触发，前提很关键：页面高度必须超过视口，否则根本滚不动、事件永不触发。

给页面设一个远超视口的高度，就是为了让它生效。吸顶导航、回到顶部按钮都依赖它。

> ⚠️ 若页面内容不足一屏，写了 `onscroll` 也看不到任何反应，这不是代码写错。

### 赋值只能绑一个，高频别干重活

`onload = 函数` 是赋值而非追加，写两次后者会覆盖前者，最终只剩最后一个执行。要绑多个回调得改用 `addEventListener`。

`onscroll`、`onresize` 一秒能触发几十上百次，回调里只宜做读值、判断这类轻量计算，耗时操作应交给后面会学的节流与防抖。

```js
window.onload = function () { console.log(1) }
window.onload = function () { console.log(2) }   // 只输出 2，前一个被覆盖
window.addEventListener("load", function () { console.log("可共存") })
```
===CH===
no: 42
title: 浏览器滚动距离
lessons: 071
summary: 滚动的是页面内容，故距离挂在 document 根元素上，标准模式与怪异模式的取值位置不同
points: 滚动距离属于 document 而非 window || 有 DOCTYPE 时读 documentElement.scrollTop || 无 DOCTYPE 时读 body.scrollTop，两者用逻辑或兼容 || pageYOffset 只读且没有兼容问题 || scrollTop 可读可写，写值即滚到该位置
===BODY===
### 滚的是页面，不是窗口

滚动条长在浏览器上，移动的却是页面内容：窗口固定不动，内容整体往上走。

因此这个距离不属于 `window`，而属于文档根元素。`document.documentElement` 指 `<html>` 根元素，`document.body` 指 body 元素，取值时要从这两者之一读。

> 💡 `documentElement` 这个名字要习惯，它就是「文档的根元素」，也就是 `<html>` 标签。

### 标准模式、怪异模式与兼容写法

同样读 `scrollTop`，不同页面模式把值放在不同元素上，这是 BOM 里最典型的兼容问题。

有 `DOCTYPE` 时浏览器走标准模式，值在 `documentElement` 上；没有 `DOCTYPE` 的老页面走怪异模式，值在 `body` 上。

| 情形 | 该读哪个 | 说明 |
|---|---|---|
| 有 DOCTYPE（标准模式） | `document.documentElement.scrollTop` | 现代页面走这条 |
| 无 DOCTYPE（怪异模式） | `document.body.scrollTop` | 老页面走这条 |
| 兼容写法 | 两者用逻辑或相连 | 一个为 0 时取另一个 |
| 标准只读版 | `window.pageYOffset` | 无兼容问题，等价于 scrollTop |

```js
var top = document.documentElement.scrollTop || document.body.scrollTop
console.log(top)   // => 0（停在顶部时）
```

用 `||` 而不是相加，是因为两者同一时刻只有一个有值、另一个是 `0`，短路正好挑出有效的那个。

### 只读标准版与横向滚动

`window.pageYOffset` 等价于 `scrollTop`，只读、没有兼容问题，现代浏览器全都支持，是最省心的取值方式。

横向的 `scrollLeft` 规则完全相同，兼容写法一致，标准版对应 `window.pageXOffset`。

> ⚠️ `pageYOffset` 只读，想主动改变位置得用可写的 `scrollTop` 或滚动方法。

### 滚动距离与窗口尺寸的关系

最多还能往下滚多少，由文档总高减去视口高得到，正好把前面学的窗口尺寸串了起来。

把它和当前 `scrollTop` 比较，就能判断是否「到底了」，这是上拉加载的基础。

```js
var maxTop = document.documentElement.scrollHeight - window.innerHeight
if (document.documentElement.scrollTop >= maxTop) {
    console.log("到底了")
}
```

- `scrollHeight` 是整个文档的总高度。
- `innerHeight` 是视口高度。
- 两者相减就是最大可滚动距离。

### 主动滚动：scrollTo、scrollBy 与直接赋值

`scrollTop` 可读也可写，直接赋 `0` 就是瞬间回到顶部。此外还有两个方法控制滚动。

`scrollTo` 滚到某个绝对位置（`To` 是「到哪里」），`scrollBy` 相对当前位置再偏移（`By` 是「再加多少」），都支持传对象设 `behavior: "smooth"` 实现平滑滚动。

```js
document.documentElement.scrollTop = 0        // 瞬间回顶
window.scrollTo(0, 0)                         // 滚到绝对位置
window.scrollBy(0, 100)                       // 相对当前再往下滚 100
window.scrollTo({ left: 0, top: 0, behavior: "smooth" })
```

把这些拼起来就是「回到顶部」按钮：在 `onscroll` 里读兼容后的 `top`，超过阈值就显示按钮，点击时用对象写法平滑滚回 0。
===CH===
no: 43
title: 浏览器打开标签页
lessons: 072
summary: window.open 开新标签或窗口，close 只能关由脚本打开的窗口，且受用户操作时机限制
points: open 依次接收地址、目标和窗口特性三个参数 || 带 features 开新窗口，不带则开新标签 || open 返回新窗口引用，被拦截时返回 null || close 只能关闭脚本自己打开的窗口 || 非用户操作里调用 open 会被浏览器拦截
===BODY===
### open 的三个参数

`window.open()` 用来打开新标签页或新窗口，依次接收地址、目标和窗口特性三个参数。

第三个参数 `features` 是关键分界：不带它开的是新标签页，带了就开成独立的小窗口，这是最容易搞混的一点。

| 参数 | 作用 | 常见取值 |
|---|---|---|
| `url` | 要打开的地址 | 绝对地址、`"./detail"`、留空为空白页 |
| `target` | 在哪打开 | `"_blank"` 新标签、`"_self"` 当前 |
| `features` | 窗口特性 | `"width=400,height=300,left=100,top=100"` |

```js
window.open(url, "_blank")                          // 新标签页
window.open(url, "_self")                           // 当前页，等价于给 location.href 赋值
window.open(url, "_blank", "width=400,height=300") // 独立小窗口
```

### 返回值：新窗口的引用

`open` 返回新窗口的 `window` 引用，可以借它往新窗口写内容；若被浏览器拦截则返回 `null`，使用前应先判空。

拿到引用是 `open` 相比普通链接的核心优势：能继续操作刚打开的窗口，而不只是跳过去。

```js
var win = window.open("about:blank", "_blank")
if (win) {
    win.document.write("hello")   // => 新窗口里出现 hello
} else {
    console.log("被拦截了")
}
```

### close 只能关脚本自己打开的窗口

`window.close()` 用来关闭窗口，但只对「由脚本 `open` 打开的窗口」有效。

用户自己从地址栏或书签打开的标签，点了没反应也不报错，控制台只会提示只能关闭脚本打开的窗口。

```js
var win = window.open("about:blank", "_blank")
win.close()          // 脚本打开的窗口才能这样关
```

> ⚠️ 用变量接住 `open` 的返回值再 `close`，是唯一稳妥的关闭方式。

### 和跳转、链接的区别，以及三个坑

与 `location.href = url` 相比，`open` 保留原页面、原页面历史不变，关掉新标签即可回来；`href` 会替换当前页并新增一条历史记录。

和链接的 `target="_blank"` 相比，`open` 能控制窗口尺寸、能拿返回值，普通链接则支持右键「在新标签打开」。所以普通跳转用链接，只有需要控制尺寸或写内容时才用 `open`。

还要注意三个易错点：

- `open` 必须放在点击等用户操作里，挪进定时器等非用户触发时机会被弹窗拦截、返回 `null`。
- 新页面可通过 `window.opener` 反向操作原页面，外链应声明 `noopener noreferrer` 断开关联。
- 多数移动端浏览器把 `features` 当普通跳转忽略，`close()` 也常无效。
===CH===
no: 44
title: 浏览器的历史记录
lessons: 073
summary: history 管当前标签页的访问记录，back、forward、go 就是浏览器前进后退按钮的脚本版
points: history.length 只统计当前标签页的记录 || back 后退 forward 前进，可用 go 正负参数替代 || go(0) 刷新当前页，无记录时不报错也不动 || back 回退不新增记录，href 跳转会新增 || replace 替换当前记录，用户按后退回不去
===BODY===
### history 管的是当前标签页

`history` 保存当前标签页的访问记录，`back`、`forward`、`go` 就是浏览器工具栏前进后退按钮的脚本版。

`history.length` 读到的是目前有几条记录，含当前页、最少为 1。出于隐私保护，拿不到具体 URL，只能导航、不能读取。

```js
console.log(history.length)   // => 3（当前标签页的记录条数）
history.go(1)                 // 前进一页
history.go(-1)                // 后退一页
history.go(-2)                // 一次退回两页
history.go(0)                 // 刷新当前页，等价 location.reload()
```

- 只统计当前标签页，不是整个浏览器的历史。
- 新开一个标签页时，`length` 就是 1。
- 没有对应记录时，这些调用原地不动，既不报错也不跳到空白页。

### back、forward、go 三个方法

三者本质是同一件事：`back` 与 `forward` 是 `go` 的固定特例，用 `go(n)` 的正负参数即可替代。

`go` 的正数表示前进 n 页、负数表示后退 n 页，`0` 则表示刷新当前页，这也是它能一个方法覆盖全部方向的原因。

| 方法 | 等价写法 | 作用 |
|---|---|---|
| `history.back()` | `history.go(-1)` | 后退一页 |
| `history.forward()` | `history.go(1)` | 前进一页 |
| `history.go(n)` | — | 正数前进、负数后退、`0` 刷新 |

### 回退、跳转、替换不是一回事

本质区别在于对历史记录做什么：`back()` 往回走、不新增记录，`location.href = url` 往前记一笔、新增一条。

若始终用 `href` 在几页间来回跳，历史会越堆越长，用户想回首页得连按十几次后退，而 `back()` 一步到位。

想在跳转时不留后退入口，用 `location.replace(url)`：它不新增记录，而是把当前这条改掉。

典型场景是登录成功后跳首页，避免用户按后退又回到还带着登录态的登录页。

```js
history.back()                  // 往回走，不新增
location.href = "/home"         // 往前记一笔，新增
location.replace("index.html")  // 改写当前这条，回不去
```

### pushState 的思路

HTML5 新增的 `pushState` 与 `replaceState` 能只改地址栏、新增或替换记录而不刷新页面。

这是前端路由的底层原理：地址变了却不发请求，页面由脚本自己切换内容。但手动改出的路径服务器未必存在，一按 F5 就可能 404，需要后端配合。

```js
history.pushState({ page: 1 }, "", "/page1")      // 改地址栏，新增记录，不刷新
history.replaceState({ page: 2 }, "", "/page2")   // 改地址栏，替换记录，不刷新
```

> ⚠️ 它们只改历史与地址，不会触发 `onload`，页面内容要自己更新。
===CH===
no: 45
title: 浏览器本地存储
lessons: 074
summary: localStorage 永久保存、sessionStorage 关标签即清，两者 API 相同且只能存字符串
points: localStorage 永久保存，同源标签页之间共享 || sessionStorage 仅当前标签页，关掉即清空 || 五个 API 是增删取清空与按索引取键 || 值一律转成字符串，对象要 JSON 序列化 || 取不存在的键得 null，读取后常要转回数字
===BODY===
### 为什么需要本地存储

变量只活在页面打开到关闭这段时间，刷新一次就全部重置。

可有些数据要跨刷新甚至跨会话保留：用户名、暗色主题、购物车、表单草稿。Web Storage 就是把这类数据写进浏览器本地，让它们活得更久。

`localStorage` 与 `sessionStorage` 是它的两个实例，API 完全相同，区别只在存活时间和作用范围。

| 对比 | `localStorage` | `sessionStorage` |
|---|---|---|
| 生命周期 | 永久，除非手动删 | 关闭标签页即清空 |
| 作用范围 | 同源的所有标签页共享 | 仅当前标签页 |
| 容量 | 约 5MB | 约 5MB |
| 用法 | 与右侧完全一致 | 与左侧完全一致 |

> 🧠 `local` 存硬盘（长期），`session` 存内存（这次会话）。

### 五个 API

两套存储的操作方法完全一样，按「增取删清空、按索引取键」记最省事。

`setItem` 同名会覆盖，`getItem` 按键取值，`clear` 一次清空当前域名下全部数据，别拿它当「删一个」用。

| 方法 | 作用 | 返回 |
|---|---|---|
| `setItem(key, value)` | 增或改，同名覆盖 | 无 |
| `getItem(key)` | 按键取值 | 字符串，取不到为 `null` |
| `removeItem(key)` | 删掉一个键 | 无 |
| `clear()` | 清空当前域名下全部 | 无 |
| `key(i)` | 取第 i 个键名 | 配合 `length` 可遍历 |

```js
localStorage.setItem("name", "kerwin")
console.log(localStorage.getItem("name"))   // => "kerwin"
localStorage.removeItem("name")
```

> ⚠️ 取不存在的键得到 `null` 而非 `undefined`，判断时别写错。

### 只能存字符串，所以要 JSON 转换

无论存进去的是数字、布尔还是对象，读出来一律是字符串，这是 Web Storage 最大的坑。

直接存对象只会得到无意义的 `[object Object]`，数字不转回就参与运算会变成字符串拼接。正确做法是用 JSON：存时 `stringify`，取时 `parse`。

```js
localStorage.setItem("age", 200)
console.log(typeof localStorage.getItem("age"))   // => "string"

localStorage.setItem("obj", JSON.stringify({ name: "kerwin" }))
var obj = JSON.parse(localStorage.getItem("obj"))
console.log(obj.name)                              // => "kerwin"

var n = localStorage.getItem("age") - 0           // => 200（转回数字）
```

> ⚠️ 取出来不 `parse` 就直接用，`obj.name` 会是 `undefined`——因为它其实还是字符串。

### 同源与容量限制

数据只在协议、域名、端口三者完全一致（同源）时共享，换端口就相当于另一份独立存储。

本地开发时数据「突然消失」多半是这个原因：换了端口打开，读的自然是空的那份。容量约 5MB，远超每次请求都会自动携带、容量仅约 4KB 的 cookie，所以前端存数据优先用它。

> 💡 cookie 如今主要用于后端识别身份，不再承担前端大数据存储。

### 安全边界

存储内容在开发者工具里明文可见，用户清缓存即失，因此不能当数据库用。

- 绝不存密码、银行卡号、身份证号等敏感信息。
- 需要免登录时，存后端签发且带过期时间的 token，而不是账号密码。
- 重要数据仍应放在服务端，本地只做缓存与偏好设置。
===CH===
no: 46
title: 案例：记住用户名
lessons: 075
summary: 记住用户名按读取、回填、变更时写入三步组织，三步的先后顺序不能颠倒
points: 页面打开时 getItem 读取并回填输入框 || 变更时 setItem 写入，不能在加载时写 || input 框用 value 读写内容 || getItem 首次返回 null，回填用逻辑或兜底 || 密码等敏感信息不要存进本地存储
===BODY===
### 需求与思路

「记住用户名」要让上次填的名字在下次打开页面时自动回到输入框。做法是页面加载时从 localStorage 读出来回填，勾选状态改变时再写回，读取与写入分开在各自的时机，顺序上先读后写不能颠倒。

localStorage 只能存字符串，取不到的键返回 `null`；配套一个「记住我」复选框，勾选才写、取消就删，把选择权交给用户。输入框内容用 `value` 读写，勾选用布尔属性 `checked`。

### 完整案例代码

```js
// 案例：记住用户名。假设页面已有输入框 #username 与「记住我」复选框 #remember
var username = document.querySelector("#username")   // 显式取元素，不依赖 id 隐式全局
var remember = document.querySelector("#remember")
var KEY = "username"

// ① 打开页面：有记录就回填并勾上（getItem 取不到返回 null）
if (localStorage.getItem(KEY)) {
  username.value = localStorage.getItem(KEY)        // ← 关键点：输入框内容只能用 value 读写
  remember.checked = true                          // ← 关键点：checked 是布尔属性，不是 value
}

// ② 勾选状态一变化就同步写入，不必等提交
remember.onchange = function () {                   // ← 关键点：change 在状态改变时立即触发
  if (remember.checked) {
    localStorage.setItem(KEY, username.value)      // ← 关键点：setItem 的值一律按字符串存
  } else {
    localStorage.removeItem(KEY)                   // ← 关键点：取消勾选要 removeItem 清旧记录
  }
}

// 观察：存储只认字符串，数字也会被转成 "18"
localStorage.setItem("age", 18)
console.log(localStorage.getItem("age"))           // => "18"
console.log(typeof localStorage.getItem("age"))    // => "string"
```

### 关键知识点

- **localStorage 只存字符串**：无论存进去的是数字还是布尔，读出来都是字符串。本例 `username.value` 本就是字符串，无需转换；若存对象得先 `JSON.stringify`。取不到的键返回 `null`，回填时用 `|| ""` 兜底，别依赖它被隐式转成空串。
- **状态变化时同步写入**：给复选框绑 `onchange`，在 `checked` 改变的当下就 `setItem`，而不是等提交按钮。因为用户可能不点登录就关页面，那时写入根本不会发生；换成 `oninput` 只盯输入框则拿不到勾选变化。
- **取消勾选要 removeItem**：只写 `setItem` 不写 `removeItem`，取消勾选后旧记录仍在，下次打开照样回填，等于「记住」关不掉。`removeItem` 按键精确删除，比 `clear()` 安全，后者会清空整个域名下的数据。
- **value 与 checked 各管各的**：输入框内容用 `value` 读写，勾选用布尔属性 `checked`。写成用 `value` 读勾选只会得到字符串 `"on"`，没法直接当判断条件用。
