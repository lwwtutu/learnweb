===PART===
id: part-06
order: 6
title: DOM 基础：查找与修改
range: 076–086
desc: 用 document 查找元素并修改属性、内容、样式与类名
===CH===
no: 47
title: 初识 DOM
lessons: 076
summary: DOM 把页面标签变成 JS 对象，入口是 document，改对象即同步改页面
points: document 挂在 window 上，打开页面即存在，无需声明 || 浏览器把每个标签解析成一个 JS 对象，按嵌套组成 DOM 树 || 这个对象就是页面本身，不是副本，改动实时同步 || DOM 能力分查、改、增删、绑四类，外加尺寸测量 || script 要写在元素之后或等 onload，否则取到 null
===BODY===
### document 是 DOM 的入口

`window` 既代表浏览器窗口，又充当全局对象，`document` 挂在它上面。分工上 `window` 管地址、历史、滚动与存储，`document` 管标签、文字、属性和样式。

因为它随页面一起创建，所以不用声明、不用引入，打开页面就能直接访问。在控制台逐层展开，能看到后面要用的查找与创建方法都在其中。

```js
console.log(window.document === document)   // => true
console.log(typeof document.body)           // => "object"
console.log(document.title)                 // => "Document"
```

`documentElement`、`head`、`body`、`title` 都是它的直接成员，分别指向根元素、head、body 和标题。取根元素只能用 `documentElement`，没有以标签名直接命名的简写。

### 标签会被解析成 DOM 树

浏览器从上往下读 HTML，会为每个标签创建一个对应的 JS 对象，再按嵌套关系连成一棵树，即 DOM 树。连标签之间的文字也会成为节点，这意味着树里不只有元素对象。

这样设计是为了让父子层级和页面结构一一对应，后面按后代选择器查找、遍历子节点才有依据。

- div、p 这类标签 → 元素节点
- 标签之间的文字 → 文本节点
- `id`、`class` 这类写法 → 属性节点

以 body 里套 div、div 里套 p 为例，层级是 `document → html → body → div → p → 文本` 逐层向下。每个标签对应一个对象，文字单独占一层。

### 为什么 JS 一改对象，页面就跟着变

关键在于这些 DOM 对象不是页面的复印件，它们就是页面本身，二者实时连着。给对象属性赋值，页面同步变化、不用刷新；反过来用户勾选复选框，对象的 `checked` 也会同步变成新值。

可以把 DOM 对象理解成带线的遥控器，而不是录好再回放的影像，因此「取元素 → 改属性」从来操作的都不是副本。

```js
document.body.innerHTML = "<h1>改过了</h1>"   // => 页面立即出现大标题
// 用户勾选复选框后
console.log(box.checked)                      // => true
```

正因为双向同步，购物车全选用 `checked` 判断状态、选项卡切换用类名判断谁亮，才都成立。

### DOM 能做的四件事

DOM 的能力可以归成查、改、增删、绑四类，外加尺寸与偏移这类测量工具。本篇只覆盖前两类：怎么找到元素，以及找到之后怎么改它。

这样划分是为了先建立整体地图，避免一上来就陷进某个具体 API。节点的增删改、事件绑定放到下一篇，尺寸测量也在后面展开。

| 方向 | 做什么 | 代表 API |
|---|---|---|
| 查 | 拿到页面上的标签 | `getElementById`、`querySelector` |
| 改 | 改属性、文字、样式、类名 | 点语法、`style`、`classList` |
| 增删 | 创建、插入、删除节点 | `createElement`、`remove` |
| 绑 | 对点击等操作作出反应 | `onclick`、`addEventListener` |

表里前两行就是本篇的路线：先用获取元素的方法拿到标签，再用后面几章的手段去改它。

### 脚本要写在元素之后

浏览器自上而下解析 HTML，解析到某个标签时才为它创建对象。所以脚本若写在目标元素之前，此刻对象还不存在，取到的只会是 `null`，这是「没报错却没效果」的常见原因。

两种稳妥做法可以按场景选择：

1. 把脚本放到 `</body>` 前，等标签都建好再执行，最简单也最常用。
2. 把取元素的逻辑放进 `window.onload` 回调，等页面资源加载完再取。

> ⚠️ 写在元素之前时 `document.getElementById("box")` 得到 `null`；放对位置或等加载后，得到的是对应的元素对象。

===CH===
no: 48
title: 获取元素的方式
lessons: 077
summary: 查找方法都挂在 document 上，结果只会是单个元素或一个伪数组集合
points: getElementById 与 querySelector 返回单个元素，找不到给 null || 名字带 Elements 复数的方法一定返回一组，须按索引取 || getElement(s)ByXxx 传名字，querySelector(All) 传 CSS 选择器 || 伪数组有 length 和索引却没有数组方法，可用 for 遍历 || getElementsByXxx 得动态集合，querySelectorAll 得静态快照
===BODY===
### 三个快捷属性与两类返回值

所有查找方法都挂在 `document` 上，结果只有两种：单个元素对象，或一组元素构成的伪数组。单个找不到返回 `null`，一组找不到是空集合，二者都不会报错。

另有三个不需要查找的快捷属性，浏览器直接给，因此算尺寸、算滚动时天天用到根元素。

- `document.documentElement` → 根元素 html
- `document.head` → head 标签
- `document.body` → body 标签

注意取根元素只能用 `documentElement`，没有以标签名直接命名的简写。

### 按 id 获取单个元素

`getElementById` 传的是 id 名、不带 `#`，返回唯一的元素对象或 `null`。因为 id 在页面里原则上唯一，浏览器内部按 id 建了索引，所以它是所有方法中最快的一个。

适合「页面上只有这一个」的场景，比如容器、输入框、按钮。

```js
var box = document.getElementById("box")
console.log(box)                 // => <div id="box"></div>
console.log(document.getElementById("nope"))   // => null
```

> ⚠️ 直接写 `box` 不声明也能用，是浏览器把 id 隐式变成全局变量的彩蛋；class 没有这待遇，还容易和已声明变量撞名，正式代码一律显式获取。

### 按类名、标签与 name 获取一组

名字带 `Elements` 复数的方法一定返回一组，哪怕只匹配到一个。类名传不带点的名字，标签名传 `li` 这类标签，`getElementsByName` 按 `name` 查，主要用于成组的表单场景。

拿到一组必须按索引取单个，写成 `items[0].innerHTML`。漏写索引得到 `undefined`，而且不报错，只会表现为「没效果」。

```js
var items = document.getElementsByClassName("item")
console.log(items.length)                 // => 7
console.log(document.getElementsByName("user")[0].value)
```

### 按 CSS 选择器获取

`querySelector` 与 `querySelectorAll` 传的是 CSS 选择器，写法与 CSS 完全一致：id 前加 `#`、类名前加 `.`、后代用空格、属性用方括号。前者只返回第一个匹配元素或 `null`，后者返回全部匹配。

因为选择器能力最强、语法又统一，现在实战基本只用这两个。

```js
console.log(document.querySelector("#box"))          // => 第一个匹配元素
console.log(document.querySelector("ul li.item"))    // => 后代选择器
console.log(document.querySelectorAll("li").length)  // => 全部 li 的数量
```

### 返回单个还是集合，静态还是动态

六种方法可按「返回单个还是一组」一次看清，同时标出集合是静态还是动态。区别在 `getElement(s)ByXxx` 传纯名字、`querySelector(All)` 传选择器，这是两套接口最根本的分界。

| 方法 | 传什么 | 返回 | 集合性质 |
|---|---|---|---|
| `getElementById("box")` | id 名 | 单个或 `null` | — |
| `getElementsByClassName("item")` | 类名 | `HTMLCollection` | 动态 |
| `getElementsByTagName("li")` | 标签名 | `HTMLCollection` | 动态 |
| `getElementsByName("user")` | name 值 | `NodeList` | 动态 |
| `querySelector(".item")` | 选择器 | 单个或 `null` | — |
| `querySelectorAll("li")` | 选择器 | `NodeList` | 静态 |

`querySelectorAll` 得到的是静态快照，拿到那一刻就定死，页面后来增删元素也不变。

`getElementsByClassName` 得到的是动态集合，会随页面增删自动变长。所以在循环里删除元素时最容易踩坑：动态集合一边遍历一边变，静态集合保持原样。

> ⚠️ 两组结果都带 `length` 和索引、能用 `for` 遍历，却没有 `forEach`、`filter` 等数组方法，要用得先 `Array.from(items)` 转成真数组。

===CH===
no: 49
title: 操作元素属性
lessons: 078
summary: 原生属性用点读写，自定义属性走 get/setAttribute，data-* 走 dataset
points: 元素自带属性用点直接读写，赋值页面立刻变化 || 自定义属性必须用 setAttribute 才真正写进标签 || getAttribute 与 dataset 取回的值永远是字符串或 null || data-user-name 在 dataset 里对应驼峰的 userName || checked、disabled 等布尔属性用布尔值读写
===BODY===
### 原生属性用点语法直接读写

元素自带、规范里写死的属性用点语法读写，赋什么页面立刻变什么。因为它们是 DOM 对象上现成的属性，不需要任何额外接口。

`input.type = "password"` 让输入框变密码框，`img.src` 换图片，`box.innerHTML` 换内容，都是同一条规则。

```js
var input = document.querySelector("#user")
input.type = "password"        // => 输入框变成密码框
input.value = "kerwin"         // => 框内文字改变
input.title = "请输入用户名"
```

### 自定义属性走 get/setAttribute 三件套

规范里没有的属性用点读不到：`box.kerwin` 是 `undefined`。自定义属性必须用 `setAttribute` 才真正写进标签，用 `getAttribute` 读、`removeAttribute` 删。

直接写 `box.tiechui = "222"` 只改内存里的 JS 对象，标签上什么都没多，刷新就丢、别人也读不到，因此二者不是一回事。

```js
var box = document.querySelector("#box")
box.setAttribute("index", 1)
console.log(box.getAttribute("index"))   // => "1"（数字转成字符串）
console.log(box.getAttribute("nope"))    // => null
box.removeAttribute("index")
```

### data-* 与 dataset

H5 建议自定义属性以 `data-` 开头，好处是浏览器给了专用接口 `dataset` 直接读写，不必每次拼属性名。它取回的值依旧是字符串，比较数字前要留意。

命名转换规则是 `data-` 之后遇到连字符就转成驼峰，因为 JS 属性名不允许带连字符。

| 标签上 | dataset 里 |
|---|---|
| `data-index` | `dataset.index` |
| `data-user-name` | `dataset.userName` |
| `data-kerwin` | `dataset.kerwin` |

新增用赋值 `dataset.xiaoming = "x"`，删除用 `delete`。由于值恒为字符串，`li.dataset.index === 0` 是 `false`，要和 `"0"` 比才成立。

### 布尔属性用布尔值读写

`checked`、`disabled`、`selected` 这类是布尔属性。HTML 里只要写了就表示生效、与值无关，所以 JS 里一律用布尔值读写，不要写成字符串。

- `input.checked = true` → 勾上复选框
- `input.disabled = true` → 控件变灰不可用
- `option.selected` → 读取或设置下拉项是否选中

```js
var cb = document.querySelector("#remember")
cb.checked = false             // => 取消勾选
console.log(cb.disabled)       // => false
```

### 用 dataset 给元素打编号

最常见的用法是在循环里把序号存进元素，点击时再读回来，从而知道「我是第几个」。因为事件处理函数被一组元素共用，函数里必须靠元素自己身上的数据区分身份。

- 循环时写 `items[i].dataset.index = i`，把当时的序号存进每个元素
- 点击时读 `this.dataset.index`，即可找到对应的内容块

这是选项卡与轮播的通用传参方式，本质是「属性存数据 → 点击读回 → 一一对应」。注意 `querySelectorAll` 得到的编号是字符串，取下标时会自动转成数字，可以放心用。

> ⚠️ 取编号做数学运算时要先 `Number(index)`，否则 `"0" + 1` 会变成 `"01"`。

===CH===
no: 50
title: 案例：密码可视
lessons: 079
summary: 点击时读 input.type 判断当前状态，再写回相反值，形成双向开关
points: 事件处理函数三要素是元素、事件类型、处理函数 || 先读状态再判断再写回，是交互代码的通用套路 || type 是原生属性，可直接用点语法读写 || 判断依据只用 type 的当前值，不看图标或样式 || 只写一半会变成单向开关，点第二次回不去
===BODY===
### 需求与思路

密码框默认把字符显示成圆点，点一下眼睛按钮要能看到明文，再点一下恢复密文。本质是一个双向开关，状态只有 `type` 的 `"password"` 与 `"text"` 两个取值。

处理链路是先读当前 `type`、判断后写回相反值，同时让按钮图标跟着状态同步。判断依据只用 `type`，图标只负责显示、不参与决策，这样状态与显示不会脱节。

### 完整案例代码

```js
// 案例：密码可视。假设页面已有密码框 #password、按钮 #eyebtn、复选框 #toggle
var pass = document.querySelector("#password")
var eye = document.querySelector("#eyebtn")
var toggle = document.querySelector("#toggle")

// 写法一：点按钮，在 password / text 间来回切换（双向开关）
eye.onclick = function () {
  if (pass.type === "password") {                 // ← 关键点：判断只依据 type 的当前值
    pass.type = "text"                           // ← 关键点：type 是原生属性，用 property 点语法改
    eye.textContent = "隐藏"                      // ← 关键点：图标文字随状态同步，不拿来当判断依据
  } else {
    pass.type = "password"                       // ← 关键点：写回密文，否则点第二次回不去
    eye.textContent = "显示"
  }
  console.log(pass.type)                         // => "text"
}

// 写法二（对照）：改用复选框 checked 驱动，演示布尔属性该走 property
toggle.onchange = function () {
  pass.type = this.checked ? "text" : "password" // ← 关键点：checked 是实时布尔状态
  console.log(this.checked)                      // => true
  console.log(this.getAttribute("checked"))      // => null（attribute 停在初始标记，不同步）
}
```

### 关键知识点

- **type 切换是双向开关**：`type` 是原生属性，用点语法在 `"password"` 与 `"text"` 间来回赋值即可切明文/密文。只写一个分支会变成单向开关，点第二次回不去，所以两个分支都得写。
- **判断靠 type，图标只做同步**：状态的真值只有 `type` 一个来源，读它决定下一步；按钮文字随状态一起改，是「显示跟着状态走」。反过来用图标当判断依据，图标一旦没同步就会误判。
- **原生/布尔属性用 property 不用 attr**：`pass.type`、`toggle.checked` 用点语法读写的是实时状态；`getAttribute` 只返回 HTML 里的初始标记，不反映用户操作后的当前值。布尔属性尤其明显：`checked` 是真正的 true/false，而 `setAttribute("checked", "false")` 因属性存在仍会生效。
===CH===
no: 51
title: 案例：购物车全选
lessons: 080
summary: 全选是一个状态分发给所有子项，反选是所有子项投票得出全选框状态
points: 全选一控多，把全选框 checked 分发给每个子项 || 反选多控一，数已勾数量，勾满才点亮全选框 || 进入处理函数时 checked 已是用户操作后的新值 || 选择器要限定在列表范围，避免把全选框选进去 || 两个方向都要写，否则出现全选框不亮的假状态
===BODY===
### 需求与思路

购物车全选要处理两个方向：点全选框时把它的勾选状态复制给每个商品项，这是「一控多」；手动改某个商品时，再统计已勾选数量反过来决定全选框亮不亮，这是「多控一」。

两个方向都得写，否则取消一个商品后全选框仍亮着，出现与事实不符的假状态。复选框的状态变化用 `change` 事件监听，遍历集合则要自己写显式循环。

### 完整案例代码

```js
// 案例：购物车全选。假设页面已有全选框 #all 与若干商品复选框（都在 .shop 列表内）
var all = document.querySelector("#all")
var items = document.querySelectorAll(".shop input")   // 限定范围，别把全选框自己选进来

// ① 一控多：全选框状态分发给所有子项
all.onchange = function () {                          // ← 关键点：复选框用 change，状态一变就触发
  for (var i = 0; i < items.length; i++) {
    items[i].checked = all.checked                   // ← 关键点：把 checked 原样传给每个子项
  }
}

// ② 多控一：任一子项变化，统计后反向决定全选框
for (var j = 0; j < items.length; j++) {
  items[j].onchange = handler                        // ← 关键点：循环绑定，共用一个具名处理函数
}

function handler() {
  var count = 0
  for (var m = 0; m < items.length; m++) {           // ← 关键点：原生 DOM 要显式遍历，没有隐式迭代
    if (items[m].checked) count++
  }
  all.checked = (count === items.length)             // 勾满才点亮全选框
  console.log(count, all.checked)                    // => 4 true / 3 false
}
```

### 关键知识点

- **全选是状态分发**：进入处理函数时 `all.checked` 已是用户操作后的新值（浏览器先改状态再派发事件），把它原样赋给每个子项即可，不必自己取反。只写这一半，手动取消子项时全选框不会更新。
- **子项反向决定全选框**：循环统计勾选数量，只有 `count === items.length` 才把全选框点亮。若改成「有一个勾上就亮」，勾一个就误判成全选；两个方向合起来，状态才与事实一致。
- **change 比 click 更贴切**：复选框的语义是「选中状态改变」，`change` 正好在状态变化时触发，键盘空格键切换也能覆盖；`click` 只在鼠标点击时触发，用键盘操作就会漏掉。
- **遍历靠显式循环，不是隐式迭代**：`querySelectorAll` 返回静态 NodeList，绑事件和统计都得自己写 `for`。像 jQuery 那样「一个方法自动作用于集合每个元素」属于隐式迭代，原生 DOM 没有这层封装，漏写循环就只对第一个生效。
===CH===
no: 52
title: 操作元素文本内容
lessons: 081
summary: innerHTML 按 HTML 解析，innerText 只取可见文字，textContent 取原始文本
points: innerHTML 读出含标签的结构，写入会按 HTML 解析 || innerText 只给渲染后的可见文字，写入不解析标签 || textContent 取原始文本，不受隐藏与空白影响，性能更好 || 表单控件的值要用 value 读写，innerHTML 读到空串 || 大量渲染先拼完整字符串再一次性赋值
===BODY===
### 三兄弟对照

改内容前先选对属性，三者的分界在于「认不认标签」和「按不按渲染结果取文字」。

| 属性 | 读出 | 写入 | 解析 HTML |
|---|---|---|---|
| `innerHTML` | 内部结构，含标签与缩进 | 按 HTML 解析生成节点 | 是 |
| `innerText` | 渲染后可见的纯文字 | 当纯文本，标签原样显示 | 否 |
| `textContent` | 原始文本，含隐藏部分 | 当纯文本 | 否 |

`innerText` 只给看得见的文字，会合并多余空白、还拿不到 `display:none` 的内容；`textContent` 不解析、不渲染、保留原始空白，性能也更好。区别在是否触发渲染计算。

### innerHTML 按 HTML 解析

写入的字符串会被当成 HTML 执行，因此 `box.innerHTML = "<h1>标题</h1>"` 真的生成大标题，而不是显示这串字符。

读出来会连缩进和换行一起带着，所以显得脏。赋值还会重建整个内部结构，在循环里用 `+=` 反复重绘会明显卡。

```js
var box = document.querySelector("#box")
box.innerHTML = "<h1>标题</h1>"   // => 生成一个真正的大标题
console.log(box.innerHTML)        // => "<h1>标题</h1>"
```

> ⚠️ 赋值内容会被当 HTML 执行，用户输入或接口数据直接塞进去有脚本注入风险；大量渲染应先拼好完整字符串，最后一次性赋值。

### innerText 与 textContent 的空白差别

两者写入都不解析标签，会把 `<h1>` 原样显示成文字。差别在取值：`innerText` 依赖渲染结果，`textContent` 直接读原始文本。

想拿未加工、连隐藏部分在内的内容，用 `textContent` 更准也更省，因为它不触发布局计算。

```js
box.innerText = "<h1>标题</h1>"       // => 页面原样显示这串字符
console.log(box.innerText)            // => "标题"（合并空白）
console.log(box.textContent)          // => 含隐藏部分的原始文本
```

### 表单内容用 value

输入框、文本域、下拉框里用户填的内容要用 `value` 读写，普通元素没有这个属性，读出来是 `undefined`。因为 `input` 是自闭合标签、内部没有内容，用 `innerHTML` 去读只会得到空串。

`select.value` 取的是选中 `option` 的 `value` 属性，不是显示出来的文字，给它赋值也能让下拉框自动切到对应项。

```js
var user = document.querySelector("#username")
console.log(user.innerHTML)       // => ""（空串）
user.value = "kerwin"             // => 框内文字改变
var sel = document.querySelector("#select")
console.log(sel.value)            // => "2"（选中项的 value）
```

===CH===
no: 53
title: 案例：渲染页面
lessons: 082
summary: 数组经模板字符串拼成 HTML，join 后一次性写入 innerHTML
points: 数据驱动渲染的最小形态是数组映射成 HTML 字符串 || map 把每条数据换成一段模板，变量用 ${} 占位 || join 必须传空字符串，否则片段之间多出逗号 || innerHTML 一次性赋值会覆盖容器原有内容 || 页面出现 undefined 多半是数据字段名拼错
===BODY===
### 需求与思路

「渲染页面」不是靠事件触发，而是把一份数据变成页面：数组里每个对象经模板字符串映射成一段 HTML 片段，再拼成完整字符串写进容器。这是数据驱动渲染的最小形态。

关键在「先拼好、再一次性写入」：用数组收集片段、`join` 成串，最后只给 `innerHTML` 赋一次值。动手前想清楚模板里哪部分固定、哪部分来自数据，把变量放进 `${}` 占位即可。

### 完整案例代码

```js
// 案例：渲染页面。假设页面已有一个空 <ul> 容器
var filmList = [
  { title: "长津湖", grade: 8.8 },
  { title: "出拳吧", grade: 7.6 },
  { title: "小美人鱼", grade: 7.7 }
]

// ① map：把每条数据映射成一段 HTML 字符串
var parts = filmList.map(function (item) {           // ← 关键点：数组映射成片段数组，数据驱动
  return `<li><h3>${item.title}</h3><p>评分 ${item.grade}</p></li>`  // ← 关键点：模板字符串用 ${} 嵌字段
})

// ② join 后一次性写入，只触发一次重排
var html = parts.join("")                            // ← 关键点：join("") 传空串，否则片段间多逗号
document.querySelector("ul").innerHTML = html       // ← 关键点：一次性赋值，别在循环里反复重排
// 反例：循环里反复 oul.innerHTML += 片段，会让浏览器每轮重建内容、反复重排
console.log(parts.length)                            // => 3
console.log(typeof html)                             // => "string"
```

### 关键知识点

- **模板字符串把数据嵌进骨架**：反引号字符串里用 `${item.title}` 占位，字段值直接插进 HTML，比用 `+` 拼接清爽得多。字段名写错不会报错，只会渲染出 `undefined`，所以页面冒出 `undefined` 先查字段名是否拼错。
- **数组拼串、一次性 innerHTML**：`map` 得到片段数组，`join("")` 拼成整串，最后只赋一次 `innerHTML`。`join` 不传参会用逗号连接，片段之间平白多出逗号，必须显式传空串。
- **避免循环里反复重排**：`innerHTML` 每次赋值都会重建容器内部结构、触发重排。若在循环里 `+=` 累加，N 条数据就重排 N 次，条数一多明显卡顿；先拼好再一次性写入把重排降为一次，代价是容器原有内容会被整体覆盖。
===CH===
no: 54
title: 操作元素样式
lessons: 083
summary: style 只读写行内样式，getComputedStyle 只读最终值，批量写用 cssText
points: style.xxx 只能读写标签上 style 属性里的行内样式 || CSS 短横线属性名在 JS 里要写成驼峰 || 样式值必须是带单位的字符串，opacity 等少数例外 || cssText 可一次写入多条样式，等价于覆盖整个行内样式 || getComputedStyle 汇总各来源的最终结果，返回字符串且只读
===BODY===
### style 只读写行内样式

`元素.style.xxx` 读写的是标签 `style` 属性里那几条行内样式，写在 CSS 文件里的规则读不到，会返回空串。这是因为 `style` 只反映元素自带的那一份声明。

```js
var box = document.querySelector("#box")
console.log(box.style.width)        // => "100px"（行内写了才有值）
console.log(box.style.height)       // => ""（CSS 里的读不到）
box.style.width = "200px"           // => 需带单位
```

### 复合属性与驼峰命名

CSS 里的短横线属性名在 JS 里要改成驼峰，因为连字符在 JS 点语法里不合法。`style["background-color"]` 也能用，但驼峰是标准写法，点语法更好看、能自动补全。

| CSS | JS |
|---|---|
| `background-color` | `style.backgroundColor` |
| `font-size` | `style.fontSize` |
| `margin-left` | `style.marginLeft` |
| `z-index` | `style.zIndex` |

### 值带单位，批量写用 cssText

样式值必须是字符串，数字要带单位：`width = 200` 无效，`"200px"` 才有效，`opacity`、`zIndex` 这类无单位属性是少数例外。一次只改一个属性。

想批量写可以用 `cssText` 覆盖整条行内样式，等价于把 `style` 属性整体换掉。

```js
box.style.backgroundColor = "red"   // => 驼峰写法
box.style.opacity = 0.5             // => 无单位，直接写数字有效
box.style.cssText = "width:200px;height:200px;background:red;"
```

### 为什么读不到外部样式表

`style` 只能看到行内那几条，外链、内嵌、继承来的样式都不在它的视野里，所以单靠它无法判断元素最终长什么样。

要读「最终生效」的值得换 `getComputedStyle`，原因是它汇总了行内、内嵌、外链与继承后的计算结果。

- `style` 是「我亲手写的那几条」
- `getComputedStyle` 是「浏览器算完的最终结果」

### getComputedStyle 读最终值

它返回带单位的字符串，颜色是 `rgb()` 形式，而且只读：给它赋值会静默失败、不报错也没效果，因此改样式只有 `style` 与切类名两条路。

真要拿尺寸参与运算，别用它那带单位的字符串，用返回数字的 `offsetWidth` 一类属性更直接。

```js
var cs = getComputedStyle(box)
console.log(cs.height)              // => "100px"（CSS 里的也能读到）
console.log(cs.backgroundColor)    // => "rgb(255, 0, 0)"
cs.width = "10px"                  // 只读，赋值无效也不报错
```

===CH===
no: 55
title: 操作元素类名
lessons: 084
summary: className 整体覆盖原类名，classList 提供 add、remove、toggle 等精确操作
points: className 是整串字符串，赋值会覆盖掉所有原有类名 || classList 的 add、remove、toggle、contains 精确操作单个类 || toggle 有则删无则加，可带第二个布尔参数强制指定 || 做排他要先 remove 掉别人，add 只会叠加不会覆盖 || 类名不带点，className 与 classList 操作同一份数据
===BODY===
### className 是整串覆盖

`className` 取到的是一个由空格分隔的长字符串，给它赋值等于整体替换，原有类名一个不留，相关样式随之全丢。

想追加只能自己拼 `className += " item3"`，既笨拙又容易多出空格，因此精细操作要改用 `classList`。

```js
var box = document.querySelector("#box")
console.log(box.className)                     // => "item item1 item2"
box.className = "item"                         // => 其余类名全被覆盖
```

### classList 精确增删改查

`classList` 把一个类名当独立单元来操作，它是 `DOMTokenList`，带 `length` 也能按索引遍历。因为每个方法只动一个类，不会牵连其他类名。

| 方法 | 作用 |
|---|---|
| `add("x")` | 添加一个类，已存在则不重复 |
| `remove("x")` | 删除一个类 |
| `contains("x")` | 判断是否含某类，返回布尔值 |
| `replace("a", "b")` | 替换类名 |

### toggle 与第二参数

`toggle` 有则删、无则加，是开关型交互最常用的方法，点一下加、再点一下删。它还能带第二个布尔参数，按条件强制指定加或删。

`toggle("active", i === index)` 判断为真就加、为假就删，适合按条件批量点亮，与选项卡的排他思路是同一回事。

```js
box.classList.toggle("active")                 // => 点一次加、再点一次删
box.classList.toggle("active", i === index)    // 按条件强制
console.log(box.classList.contains("item"))    // => true
```

### 切类名优于改 style，以及三个坑

一次改一套样式时，切类名只需 `add` 一个类，样式全留在 CSS，改样式不必动 JS，还能用上 `transition` 和 `:hover`。规范做法是 JS 只决定「加不加这个类」。

| 对比 | 改 style | 切 classList |
|---|---|---|
| 样式位置 | JS 里 | CSS 里 |
| 改 5 条 | 写 5 行 | 加 1 个类名 |
| 动画伪类 | 不支持 | 支持 |

三个坑要记住：`add` 只会叠加、不会覆盖，做排他时必须先 `remove` 掉别人；类名不带点，`add(".item")` 会加出无效类名；`className` 与 `classList` 是同一份数据的两个窗口，改哪个另一个都同步。

===CH===
no: 56
title: 案例：简易选项卡
lessons: 085
summary: 给每个 tab 写死一段处理函数，点谁给谁加 active，其余全部移除，即排他思想
points: 排他分两步，先清空所有项的 active 再给当前项加 || 顺序不能颠倒，先加后清等于白加 || 写死写法每多一个 tab 就多一段代码，无法维护 || 用 classList.add 与 remove 搬运 active 类名 || 样式交给 CSS 的 .active，JS 只决定谁带这个类
===BODY===
### 需求与思路

一组 tab 里只允许一个高亮，点谁点亮谁、熄灭其他，这叫排他思想。拆成两步：先把所有项的 `active` 清掉，再单独给当前项加回来，顺序不能颠倒。

这一版是「写死」写法：给每个 tab 各绑一段处理函数，借 `this` 拿到被点的那个元素。样式由 CSS 的 `.active` 定义，JS 只搬类名；它笨在每多一个 tab 就要多写一段，为下一章循环版埋下动机。

### 完整案例代码

```js
// 案例：简易选项卡。假设页面已有两个 tab（#item1 默认高亮、#item2 无），CSS 中 .active 为高亮
var item1 = document.querySelector("#item1")
var item2 = document.querySelector("#item2")

function clearAll() {                                // ← 关键点：排他第一步，先把全部 active 清空
  item1.classList.remove("active")
  item2.classList.remove("active")
}

item1.onclick = function () {                        // ← 关键点：写死一段处理函数，多一个 tab 就多一段
  clearAll()
  this.classList.add("active")                     // ← 关键点：this 指向被点击的那个 li
  console.log(item1.className)                     // => "active"
}
item2.onclick = function () {
  clearAll()
  this.classList.add("active")                     // ← 关键点：先清后加，顺序反了自己也会被清掉
  console.log(item2.className)                     // => "active"
}
```

### 关键知识点

- **排他要「先全清、后加自己」**：`classList.add` 只在当前项叠加类，若先 `add` 自己再清空，循环清理时又会把自己清掉，等于白加。必须先清空全部，再只给当前项加回来，最终才只剩一个高亮。
- **this 指向事件源**：`onclick` 处理函数里的 `this` 就是被点击、且绑定了该事件的那个元素，因此 `this.classList.add("active")` 天然点到谁亮谁。若换成箭头函数，`this` 会跑到外层，反而拿不到当前元素。
- **className 与 classList 的分工**：`className` 是空格分隔的整串类名，给它赋值会整体替换、抹掉元素原有全部类名，所以「清空/加单个类」不适合用它；`classList.remove/add` 精确操作单个类、不牵连其他类名，本例才选它。二者改的是同一份数据，读 `className` 仍是那串字符串。
===CH===
no: 57
title: 案例：选项卡（循环版）
lessons: 086
summary: 循环绑定共用函数，用 dataset 编号、this 定位当前项，全清后按索引对应加类
points: 循环绑定让所有 tab 共用一个处理函数，新增 tab 无需改代码 || dataset.index 把循环时的序号存进元素，供点击时读回 || 处理函数里的 this 指向被点击的那个元素 || 先清空全部再给当前项加类，是循环版排他的关键 || 用同一索引同时点亮 tab 与对应内容块，实现一一对应
===BODY===
### 需求与思路

上一章给每个 tab 写死一段处理函数，数量一多就没法维护。循环版把逻辑收成一份：循环给所有 tab 绑同一个 `handler`，新增 tab 不必改代码。

难点是函数被共用，怎么知道点的是第几个。做法是循环时把序号存进 `dataset.index`，点击时借 `this` 读回来，再用它同时点亮对应 tab 与内容块。切换仍按「先全清、再加自己」。

### 完整案例代码

```js
// 案例：选项卡循环版。假设页面已有 .header 下若干 tab li、.box 下等量内容 li，.active 为显示
var tabs = document.querySelectorAll(".header li")
var panels = document.querySelectorAll(".box li")

for (var i = 0; i < tabs.length; i++) {             // ← 关键点：循环绑定，所有 tab 共用一个 handler
  tabs[i].dataset.index = i                         // ← 关键点：把序号存进元素，供点击时读回
  tabs[i].onclick = handler
}

function handler() {
  var index = this.dataset.index                    // ← 关键点：this 是被点的 tab，读回自己的编号
  for (var m = 0; m < tabs.length; m++) {           // ← 关键点：先全清，移除两组元素的 active
    tabs[m].classList.remove("active")
    panels[m].classList.remove("active")
  }
  tabs[index].classList.add("active")              // ← 关键点：用同一索引点亮 tab 与对应内容
  panels[index].classList.add("active")            // ← 关键点：按索引一一对应，配对显示
  console.log(index, panels.length)                 // => "2" 6（点第 3 个 tab 时）
}
```

### 关键知识点

- **循环绑定，一份函数通用**：`for` 里给每个 tab 绑同一个 `handler`，增删 tab 都不用动这份逻辑。相对 56 章每多一个 tab 多写一段、还容易漏写，循环版把「谁」从写死改成按编号定位，可维护性完全不同。
- **dataset.index 建立索引对应**：事件在循环跑完后才触发，那时 `i` 已是最终值，不能拿来定位；循环时把序号存进 `dataset.index`，点击读回便知「我是第几个」。取回的是字符串，当数组下标会自动转数字，做数学运算要先 `Number()`。
- **this 读回编号，成对点亮**：处理函数里的 `this` 指向被点击的 tab，`this.dataset.index` 拿到编号后，用同一个 `index` 给 `tabs[index]` 和 `panels[index]` 一起加 `active`，实现一一对应；两组元素数量必须相等，否则取到 `undefined` 再操作 `classList` 会报错。
- **先全清再加类**：和 56 章一致，只是把逐条 `remove` 换成循环清空两组所有项，再单独给当前项及对应内容加回。顺序反了，刚加的类会被随后的清空一起抹掉，最终一个都不亮。
