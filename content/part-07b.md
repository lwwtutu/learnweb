===PART===
id: part-07
order: 7
title: DOM 进阶：节点与事件
range: 087–107
desc: 掌握节点操作与尺寸测量，理解事件流与事件委托
===CH===
no: 68
title: 事件解绑
lessons: 097
summary: DOM0 用 null 解绑，DOM2 用 removeEventListener 且必须传同一个具名函数
points: 解绑与绑定方式必须配对，混用一律无效 || 匿名函数是两个对象，removeEventListener 解不掉 || 类型写成 onclick 或第三参不一致都会解绑失败 || 一次性操作、拖拽结束、组件销毁都要主动解绑 || 定时器也是资源，用完要 clearTimeout 或 clearInterval
===BODY===
### 为什么事件必须能解绑

绑定是给元素挂上一个长期有效的监听，不会自动消失。一次性操作最需要它：抽奖按钮点过一次就该失效，若只写 `this.disabled = true`，按钮变灰但仍挂着事件，逻辑并没有真正关闭。

更干净的做法是处理函数执行完，把自己身上的监听摘掉。因为事件和定时器一样，都是占着内存的资源，用完不释放会一直留着，单页应用里还会积累成内存泄漏。

- 一次性操作：抽奖、领券、提交后防重复
- 交互收尾：拖拽松开时撤掉移动监听
- 组件销毁：离开页面清掉监听，避免残留
- 动画结束：定时器与事件一起清理

解绑写法必须与绑定方式配对，混用一律无效，下面三节分别说明。

### DOM0 级：把事件属性覆盖为 null

DOM0 事件就是元素对象上的一个属性，`el.onclick = fn` 是给属性赋值。既然是属性，重新赋成 `null` 就等于把值清空，监听随之消失，这是最直白的解绑。

因为同一时刻一个 DOM0 属性只能存一个函数，覆盖既用于解绑，也会顺带顶掉之前的处理函数，写的时候要留意别误伤。

```js
var btn = document.querySelector("#btn")
btn.onclick = function () {
    console.log("谢谢惠顾")
    this.onclick = null        // => 再点没反应，按钮外观不变
}
```

> ⚠️ 这里用 `this.onclick` 而非 `btn.onclick`，指向的是当前绑定事件的那个元素，效果一致但更通用。

### DOM2 级：removeEventListener 要传同一个函数

DOM2 允许一个元素同时挂多个监听，浏览器内部按「事件类型 + 函数引用 + 阶段」登记每一项。因此解绑时必须把这三项原样交回去，才能定位到要删的那一条。

为什么要强调「同一个函数」？因为登记用的是函数对象的引用，而不是函数体长得像不像，只有引用相等才认。类型也不能带 `on`，阶段参数也要一致。

| 绑定方式 | 解绑方式 | 关键点 |
|---|---|---|
| `el.onclick = fn` | `el.onclick = null` | 覆盖为空 |
| `el.addEventListener("click", fn)` | `el.removeEventListener("click", fn)` | 同一个 `fn`，类型不写 on |
| `el.attachEvent("onclick", fn)` | `el.detachEvent("onclick", fn)` | 老 IE 类型要写 on |

### 匿名函数为什么解不掉

绑定和解绑都写匿名函数时，看上去一模一样，实际是两次新建、互不相同的两个函数对象。它们的引用不相等，`removeEventListener` 找不到登记项，只能静默失败，事件依旧挂在元素上。

这也解释了前面选项卡、动态删除为什么一律用具名函数 `handler`：先留一个可复用的引用，绑和解才能指向同一个人。

```js
// 错误：两个匿名函数是两个对象
btn.addEventListener("click", function () { console.log("A") })
btn.removeEventListener("click", function () { console.log("A") })   // => 无效

// 正确：具名函数，两边同一个引用
function handler() {
    console.log("谢谢惠顾")
    btn.removeEventListener("click", handler)   // => 生效
}
btn.addEventListener("click", handler)
```

### 解绑失败的其它原因与释放时机

除了匿名函数，还有几种写法会静默失败：类型写成 `"onclick"`、第三参一个 `true` 一个 `false`、绑在父级却去解子级、用 `onclick` 绑却用 `removeEventListener` 解。

原因都一样：这几种情况都让「类型 + 引用 + 阶段」对不上号，浏览器找不到对应的登记项，只能当作没绑过。

定时器同理也是要释放的资源，用完要主动清掉，否则循环定时器会一直跑。

```js
var timer = setTimeout(function () { console.log("到点") }, 1000)
clearTimeout(timer)                 // => 清掉一次性定时器
var timer2 = setInterval(function () { console.log("tick") }, 1000)
clearInterval(timer2)               // => 循环的一定要清，否则永不停止
```

- 抽奖、拖拽收尾、组件销毁、动画结束，都是该主动解绑的典型场合
===CH===
no: 69
title: 事件类型
lessons: 098
summary: 事件分鼠标、键盘、表单、触摸、浏览器五类，常用的不到二十个
points: 移入移出优先 mouseenter/leave，不会冒泡反复触发 || 读输入框最终值用 keyup，keydown 时值未更新 || 实时监听用 input，失焦校验用 change 或 blur || submit 必须绑在 form 上，绑按钮无效 || 移动端 click 有延迟，滑动优先 touch 事件
===BODY===
### 四类事件一张表

事件按触发来源分成四类，真正常用的不到二十个，其余查手册即可。这样分类是为了按「谁发出的」记忆，而不是死背一串名字。

| 类别 | 常见事件 | 要点 |
|---|---|---|
| 鼠标 | `click` `dblclick` `contextmenu` `mousedown` `mouseup` `mousemove` `mouseover` `mouseout` `mouseenter` `mouseleave` | 移入移出优先 `enter`/`leave` |
| 键盘 | `keydown` `keyup`（`keypress` 已废弃） | 判键用 `keydown`，读值用 `keyup` |
| 表单 | `focus` `blur` `input` `change` `submit` `reset` | 实时用 `input`，校验用 `blur`/`change` |
| 页面 | `load` `scroll` `resize`；触摸 `touchstart` `touchmove` `touchend` `touchcancel` | 浏览器与触摸由窗口或整体发出 |

浏览器事件和触摸事件都归到「页面」类，因为它们不是某个控件单独发出的，而是窗口或设备整体状态变化的结果。

### 鼠标事件：什么时候触发

`click` 是单击，`dblclick` 是双击，`contextmenu` 是右键，后者常用于做自定义菜单。`mousedown / mouseup` 是按下与抬起，正是拖拽的起止点；`mousemove` 触发极频繁，做跟随要留意性能。

```js
btn.onclick = function () { console.log("单击") }
document.oncontextmenu = function () { console.log("右键") }
box.onmouseenter = function () { console.log("移入") }
box.onmouseleave = function () { console.log("移出") }
```

`mouseover / mouseout` 会冒泡，鼠标从父盒子划进子元素时会反复触发，做「移入显示下拉菜单」会闪；改用不冒泡的 `mouseenter / mouseleave` 就稳。另外双击时 `click` 也会先触发两次。

### 键盘事件：为什么回车搜索用 keyup

`keydown` 在按下时触发、长按会重复，适合判断按键和拦截输入；`keypress` 只管可打印字符且已废弃，不要再用。

读输入框最终内容要用 `keyup`。因为 `keydown` 触发时，这一下按键还没写进 `value`，此时读到的仍是旧值，`keyup` 才是更新完的结果。

```js
username.onkeyup = function (e) {
    if (e.key === "Enter") {
        console.log("搜索：" + this.value)   // => 回车时读到最终输入
    }
}
```

### 表单事件：input 与 change 别用反

`input` 每敲一个字符就触发，适合实时搜索、字数统计；`change` 要等失焦且内容确实变了才触发，适合省市联动与格式校验。`focus / blur` 是获得与失去焦点，离焦校验就放 `blur`。

| | `input` | `change` |
|---|---|---|
| 触发频率 | 每敲一个字 | 失焦后且内容变了 |
| 实时性 | 实时 | 非实时 |
| 适合 | 字数限制、模糊查询 | 下拉联动、格式校验 |

> ⚠️ `submit` 必须绑在 `form` 上，绑到提交按钮无效；`focus / blur` 不冒泡，需要冒泡时改用 `focusin / focusout`。

### 页面类事件与移动端触摸

`load` 在资源加载完触发，`scroll` 与 `resize` 在滚动、窗口变化时触发，前面浏览器章节已经用过。触摸四个事件分别对应手指按下、滑动、抬起，以及被来电或弹窗打断时的 `touchcancel`。

移动端还有一条历史包袱：`click` 大约有 300ms 延迟，所以滑动类交互优先用 `touch` 这一组，别等迟到的 `click`。

- 浏览器：`load` / `scroll` / `resize`
- 触摸：`touchstart` / `touchmove` / `touchend` / `touchcancel`
- 移动端 `click` 有约 300ms 延迟，滑动优先 touch
===CH===
no: 70
title: 事件对象
lessons: 099
summary: 事件对象是浏览器传入处理函数的首个参数，装着这次事件的全部细节
points: 标准从形参取，老 IE 用 window.event，兼容时两者取其一 || target 是真正被点元素，currentTarget 等于 this || keyCode 已废弃，回车 13 仍需记，推荐用 e.key || 每次触发都是新对象，用完即弃别存全局 || 回车搜索靠 e 拿按键、this 拿元素、value 拿内容
===BODY===
### 事件对象从哪里来

事件触发时，浏览器会新建一个对象，把这次事件的全部细节塞进去，作为第一个实参传给处理函数。它叫事件对象。

为什么需要它？因为处理函数本身只收到「发生了」这个信号，按键是哪个、鼠标在哪、点的是谁，全得靠这个对象查，它是这次事件的详细记录。

```js
username.onkeyup = function (evt) {
    console.log(evt.type)        // => "keyup"
    console.log(evt)             // => 展开可见几十个属性
}
```

### 兼容写法 e = e || window.event

标准浏览器把事件对象走形参传入，老 IE 却放在全局 `window.event` 里。为了让一套代码两边都能跑，旧代码里常有 `e = e || window.event` 这一行：有形参就用形参，没有就退回全局。

现代浏览器形参一定有，这行可以省；但看到老代码里有别删。形参名自己起，叫 `evt`、`e`、`ev` 都行，别叫 `event`，以免和全局 `window.event` 打架。

> 💡 一行兼容写法：`e = e || window.event`，处理函数开头写一次即可。

### 常用属性一览

展开事件对象能看到几十个属性，常用的就这些。按用途记住它们，比逐个背字段更有用，也能顺带看清后面几章的分工。

| 属性 | 含义 | 对应章节 |
|---|---|---|
| `type` | 事件类型，如 `"keyup"` | — |
| `target` | 真正触发事件的最深层元素 | 74、78 章 |
| `currentTarget` | 绑事件的元素，等于 `this` | 74 章 |
| `key` / `keyCode` | 按下的键 | 本章 |
| `clientX/Y`、`pageX/Y`、`offsetX/Y` | 三套鼠标坐标 | 71 章 |
| `preventDefault()` | 阻止默认行为 | 76 章 |
| `stopPropagation()` | 阻止传播 | 75 章 |

### target 与 currentTarget 谁是谁

两者差别要到事件流里才真正显出来：`target` 是「点的人」，永远指向最深处被点的元素；`currentTarget` 是「绑的人」，永远指向监听挂着的那个元素。

平时处理函数里的 `this` 就等于 `currentTarget`。委托那章正是靠 `target` 在父级里认出真正被点的子元素，这一组概念是后面的地基。

```js
outer.onclick = function (e) {
    console.log(this === outer)              // => true（绑事件的是 outer）
    console.log(e.currentTarget === outer)   // => true
    console.log(e.target === inner)          // => true（真正被点的是 inner）
}
```

### 键盘码、一次性对象与回车搜索

`keyCode` 已废弃，现代写法用语义化的 `e.key`；但老代码和面试题里 `keyCode` 极常见，回车 `13` 必须记住，另外 Esc 是 27、空格 32、方向键 37–40。

事件对象每次触发都是全新的一个，点第一次和点第二次拿到的是两个对象，所以别存进全局变量反复用，用完即弃。

```js
box.onkeydown = function (e) {
    console.log(e.keyCode)   // => 13（回车，旧写法）
    console.log(e.key)       // => "Enter"（推荐）
}
```

回车搜索是把三样东西凑齐的典型：`e` 判是否回车，`this` 拿事件源，`this.value` 拿内容，三者一起用最顺。
===CH===
no: 71
title: 事件对象：鼠标坐标
lessons: 100
summary: client 相对视口、page 相对文档、offset 相对事件源，三套坐标参考点不同
points: clientX/Y 不受滚动影响，pageX/Y 已含滚动距离 || pageY 等于 clientY 加页面纵向滚动距离 || offsetX/Y 相对事件源而非真正被点的子元素 || screenX/Y 相对显示器，几乎用不到 || 拖拽用 clientX，鼠标跟随用 offsetX，跨浏览器优先配 getBoundingClientRect
===BODY===
### 四组坐标，差别只在参照系

鼠标事件对象带好几组坐标，分不清就会在拖拽、跟随里错位。它们的区别只有一个：拿谁当原点。

| 属性 | 参照点 | 受滚动影响 | 用途 |
|---|---|---|---|
| `clientX` / `clientY` | 浏览器可视窗口左上角 | 否 | 拖拽、居中弹窗 |
| `pageX` / `pageY` | 页面文档左上角 | 是，已含滚动距离 | 页面内精确定位 |
| `offsetX` / `offsetY` | 事件源左上角（padding 内） | 否 | 鼠标跟随、画板 |
| `screenX` / `screenY` | 显示器左上角 | 否 | 极少用 |

之所以要分这么多套，是因为同一个鼠标位置，相对窗口、相对整篇文档、相对某个盒子，答案都不一样，浏览器干脆都给出来，用时按需求挑。

### 参照系一层层往里收

可以把四组坐标想成一层套一层，越往里，原点越贴近被操作的元素。这种由外到内的层次，比死记四个名字更好记。

- `screen`：整个显示器，最外层
- `client`：浏览器可视窗口，滚动不影响
- `page`：整篇文档，滚动会影响
- `offset`：绑事件的那个元素自己，最里层

### page 与 client 的换算关系

`page` 与 `client` 只差一个滚动距离：`pageY` 等于 `clientY` 加页面纵向滚动距离，`pageX` 同理加横向的。因为 `client` 是相对视口量的，视口滚走多少，`page` 就得补回多少。

页面没滚动时两者相等；往下滚 500px 后点同一点，`pageY` 就比 `clientY` 大 500，这条换算能用来自检有没有选错坐标。

```js
box.onclick = function (e) {
    console.log(e.clientX, e.clientY)   // => 相对视口
    console.log(e.pageX, e.pageY)       // => 相对文档
    console.log(e.offsetX, e.offsetY)   // => 相对 box
}
// pageY === clientY + 页面纵向滚动距离
```

### offsetX 的坑：相对事件源而非被点元素

`offsetX / offsetY` 相对的是「绑事件的那个元素」，不是鼠标实际点到的子元素。即便点在 `box` 内部的 `p` 上，值仍按 `box` 左上角算，这与直觉相反，用错就会偏一截。

想相对真正被点的元素算，得配合 `e.target.getBoundingClientRect()` 自己减。老浏览器对 `offsetX` 的实现也有偏差，跨浏览器取坐标时优先 `clientX` 配 `getBoundingClientRect`。

```js
box.onclick = function (e) {
    var rect = e.target.getBoundingClientRect()
    console.log(e.clientX - rect.left)   // => 相对真正被点元素的 x
}
```

### 按需求选坐标

选哪组由「定位相对谁」决定，而不是哪个名字更熟。下面这张对照把后面三个案例会用到的选择一次列清。

| 需求 | 用哪组 |
|---|---|
| 拖拽：盒子跟着鼠标走 | `clientX/clientY` 配 `offsetWidth` |
| 页面内的自定义提示框 | `pageX/pageY` |
| 盒内鼠标跟随、画板 | `offsetX/offsetY` |
| 判断点在图片哪个区域 | `offsetX/offsetY` 配比例 |
===CH===
no: 72
title: 案例：鼠标跟随
lessons: 101
summary: mousemove 里把 offsetX/Y 赋给提示框的 left/top，配 pointer-events:none 防抖
points: 父级 relative 子级 absolute，两套坐标参考点一致可直接赋值 || pointer-events:none 让鼠标穿透提示框，避免反复闪烁 || 显示隐藏放 mouseover/out 做一次，位置更新才放 mousemove || 取第一个子元素用 firstElementChild 而非 firstChild || 换 clientX 跟随整页时提示框要 fixed 并处理边缘溢出
===BODY===
### 需求与思路

鼠标在盒子里移动时，一张提示框跟着光标走：进入盒子显示，离开隐藏，移动时更新位置。这靠 `mousemove` 事件，处理函数收到的参数就是事件对象，里面带着光标坐标。

坐标要选对：`offsetX/offsetY` 相对事件源左上角，提示框的 `left/top` 相对最近的定位祖先，原点一致才能直接赋值。再减去提示框自身一半宽高，光标才落在框中心。

### 完整案例代码

```js
// 案例：鼠标跟随。假设页面有 #box，首个子元素是提示框；CSS 已设 #box 为 relative，提示框为 absolute + display:none + pointer-events:none
var box = document.querySelector("#box")
var tip = box.firstElementChild    // ← 关键点：用 firstElementChild，firstChild 会拿到换行产生的文本节点

box.onmouseover = function () {
  tip.style.display = "block"      // ← 关键点：显示隐藏只在进出时做一次，不放进 mousemove
}
box.onmouseout = function () {
  tip.style.display = "none"
}

box.onmousemove = function (e) {
  // offsetX/offsetY 是光标相对 box 左上角的距离，与提示框 left/top 的原点相同
  var x = e.offsetX - tip.offsetWidth / 2      // ← 关键点：减去自身一半宽，光标才落在提示框中心
  var y = e.offsetY - tip.offsetHeight / 2     // ← 关键点：同理减一半高，否则左上角贴着光标
  tip.style.left = x + "px"
  tip.style.top = y + "px"
}

console.log(typeof tip.offsetWidth)   // => "number"，可直接参与运算
```

### 关键知识点

- **mousemove 与事件对象坐标**：`mousemove` 只在光标移动时触发，一次移动可能触发几次，事件对象上的 `offsetX/offsetY` 就是相对事件源内边距左上角的距离。因此监听必须绑在 `box` 上，坐标才相对 `box`；若绑到 `document`，`offsetX` 就变成相对 `body`，位置全错。
- **两套坐标的原点必须一致**：提示框的 `left/top` 相对最近的定位祖先，所以父级要 `position: relative`、提示框要 `position: absolute`。少了这层，`left/top` 会相对页面算，赋值后提示框直接跑到左上角或整体偏移。
- **减一半宽高才是居中跟随**：`offsetX` 指的是光标那一个点，直接赋给 `left` 会让提示框左上角贴在光标上，看着像被拖在手下。减去 `offsetWidth / 2` 与 `offsetHeight / 2`，光标落在框中心，视觉才自然。
- **pointer-events: none 是防抖动关键**：不加时提示框会挡住鼠标，触发 `mouseout` 隐藏，鼠标又落回 `box` 触发 `mouseover` 显示，来回反复闪烁。加了之后提示框对鼠标透明，鼠标始终认为自己还在 `box` 上，状态就稳定了。
===CH===
no: 73
title: 案例：鼠标拖拽
lessons: 102
summary: 按下开始监听移动、抬起停止，位置取鼠标坐标减盒子一半再夹进视口边界
points: mousemove 绑 document，绑盒子会在鼠标移出后卡住 || 减 offsetWidth/2 让鼠标落在盒子中心 || Math.min(Math.max(v,0),max) 把位置夹在视口内 || mouseup 也要绑 document，否则盒外松手会粘住鼠标 || 标志位写法只绑一次、只多一个 if，比反复绑解更轻
===BODY===
### 需求与思路

按住盒子拖动，松手停下，整套逻辑分三段：`mousedown` 记下光标在盒子内的偏移并挂上监听，`mousemove` 用新光标位置减偏移算出新坐标，`mouseup` 解绑收尾。

偏移量必须在按下那一刻算，否则盒子会瞬移到光标下。改 `left/top` 要求盒子已定位；移动和抬起都绑在 `document` 上，鼠标移出盒子才不丢事件。

### 完整案例代码

```js
// 案例：鼠标拖拽。假设页面已有 <div id="box">，CSS 中 #box 已设 position: absolute
var box = document.querySelector("#box")
var startX = 0                                // 按下时记录：光标距盒子左边缘多远
var startY = 0

box.onmousedown = function (e) {
  startX = e.clientX - box.offsetLeft         // ← 关键点：按下时记偏移，移动时盒子才不会跳
  startY = e.clientY - box.offsetTop
  document.onmousemove = move                 // ← 关键点：按下才开始听 mousemove
  document.onmouseup = stop                   // ← 关键点：抬起也绑 document，盒外松手才收得到
  e.preventDefault()                          // 顺手阻止拖拽时选中文字
}

function move(e) {
  var maxX = document.documentElement.clientWidth - box.offsetWidth
  var maxY = document.documentElement.clientHeight - box.offsetHeight
  var x = Math.min(Math.max(e.clientX - startX, 0), maxX)   // ← 关键点：夹进视口，否则能拖出屏幕
  var y = Math.min(Math.max(e.clientY - startY, 0), maxY)
  box.style.left = x + "px"      // 前提是盒子已定位，static 元素不认 left/top
  box.style.top = y + "px"
}

function stop() {
  document.onmousemove = null     // ← 关键点：松开必须解绑，否则盒子一直粘着鼠标跑
  document.onmouseup = null
}

console.log(typeof box.style.left)   // => "string"，带 px 单位
```

### 关键知识点

- **三段式各管一段**：`mousedown` 只负责「开始」——记录偏移、挂上监听；`mousemove` 负责算位置；`mouseup` 负责「结束」——解绑。若把位置计算写进 `mousedown`，拖动过程中位置不会更新，盒子只会跳一下。
- **按下时记录偏移量**：`e.clientX - box.offsetLeft` 记的是光标离盒子左上角多远，移动时用 `clientX - startX` 反推 `left`，盒子始终保持按下那一刻的相对位置，不会跳。若省掉这步直接把 `clientX` 赋给 `left`，盒子左上角会瞬间吸到光标上。
- **改 left/top 前必须有定位**：`left/top` 只对 `position` 不为 `static` 的元素生效，盒子若是默认值，写了也一动不动。`absolute` 还会让它脱离文档流，正好符合自由摆放的需求。
- **mouseup 不解绑就一直在拖**：不置 `null` 的话，松手后移动鼠标盒子仍跟着走，这是最典型的拖拽 bug。抬起也绑 `document`，是因为用户常在盒子外松手，绑在盒子上收不到事件，盒子就永远粘住。
===CH===
no: 74
title: DOM 事件流
lessons: 103
summary: 事件从 window 捕获下行到目标再冒泡上行，默认只注册冒泡阶段
points: 三阶段依次是捕获、目标、冒泡，方向外到内再到外 || addEventListener 第三参 true 走捕获，false 或省略走冒泡 || 明明只点最内层，外层祖先也都会收到事件 || 同一祖先上捕获回调先于冒泡，目标元素按注册顺序 || this 是绑事件的元素，e.target 是真正被点的元素
===BODY===
### 事件会走完整条传播路径

事件不是「只在你点的那个元素上发生」。点三层嵌套里最内层的 `inner`，从 `window` 到它的每一层祖先都会收到这次事件，最后由内向外再走一遍。

之所以这样设计，是为了让父级也有机会处理子级的交互，这是后面事件委托的前提。先看一条典型的传播链：

- 下行：`window → document → html → body → outer → center → inner`
- 上行：`inner → center → outer → body → html → document → window`
- 三层结构 `outer > center > inner` 都绑了 `click`，点 `inner` 时全部会响

### 捕获阶段：从外向内下行

捕获是事件流的第一段，从 `window` 出发，逐层深入，直到抵达真正被点的元素。它像一个「从上往下打洞」的过程，越外层越先遇到事件。

想让监听在捕获阶段执行，要给 `addEventListener` 第三参传 `true`。此时点 `inner`，输出顺序与默认完全相反，变成从外到里。

```js
outer.addEventListener("click", function () { console.log("outer-捕获") }, true)
center.addEventListener("click", function () { console.log("center-捕获") }, true)
inner.addEventListener("click", function () { console.log("inner-捕获") }, true)
// 点 inner => outer-捕获、center-捕获、inner-捕获（从外到里）
```

### 目标阶段：到达真正被点的元素

事件抵达 `inner` 这一层就是目标阶段，它是捕获与冒泡之间的分界点。目标元素自身比较特殊：绑在它上面的监听，不论第三参是 `true` 还是 `false`，都算在目标阶段，按注册顺序执行。

因此「捕获回调一定先于冒泡回调」这条规律，只对祖先元素成立，对目标元素本身不成立。判断谁先谁后时，要先分清是不是绑在被点的那一层。

> 💡 同一祖先上，捕获回调在下行时命中一次，冒泡回调在回来时再命中一次，所以捕获总在冒泡之前。

### 冒泡阶段：从内向外上行，也是默认

冒泡是最后一段，从目标逐层回到 `window`。默认注册的监听都落在这一段，于是点 `inner` 的输出顺序是 `inner → center → outer → body → html → window`，从里往外。

之所以把默认设成冒泡，是历史兼容的结果：早期 IE 的 `attachEvent` 没有第三参、只支持冒泡，DOM0 的 `onclick` 也只在冒泡阶段触发，W3C 便把默认阶段定为冒泡，让老代码行为不变。

| 阶段 | 方向 | 对应注册方式 |
|---|---|---|
| 捕获 capturing | 外 → 内 | 第三参 `true` |
| 目标 target | 抵达被点元素 | 自身监听按注册顺序 |
| 冒泡 bubbling | 内 → 外 | 第三参 `false` 或省略（默认） |

### addEventListener 第三参数是阶段开关

第三参数叫 `useCapture`，是切换阶段的开关：省略或传 `false` 注册到冒泡，传 `true` 注册到捕获。它决定的只是「监听在去程还是回程被触发」。

它还有一处关联：解绑时第三参必须和绑定时一致，否则按「类型 + 函数 + 阶段」对不上号，`removeEventListener` 会静默失败，这正是解绑那章强调过的。

```js
el.addEventListener("click", fn)          // => 冒泡阶段（默认）
el.addEventListener("click", fn, true)    // => 捕获阶段
```

### this、e.target 与一条因果链

无论监听挂在哪一层，`this`（或 `e.currentTarget`）永远指向「绑事件的那个人」，`e.target` 永远指向「真正被点的那个人」。

也就是说，点 `inner` 时，外层函数里的 `this` 是外层元素，而 `e.target` 仍是 `inner`。

```js
outer.onclick = function (e) {
    console.log(this === outer)             // => true
    console.log(e.currentTarget === outer)  // => true
    console.log(e.target === inner)         // => true
}
```

理解这条传播链是后四章的前提，因果一环扣一环：

- 事件会往外冒，才需要 75 章「阻止传播」来截断
- 浏览器附带默认动作，才需要 76 章「阻止默认」来拦下
- 两者合起来，能做出 77 章的自定义右键菜单
- 冒泡配上 `e.target`，最终撑起 78 章的事件委托
===CH===
no: 75
title: 阻止事件传播
lessons: 104
summary: stopPropagation 让事件到此为止不再冒泡，用来切断子元素对父级的连带触发
points: 点删除却触发整行跳转，根源是事件冒泡到父级 || stopPropagation 只挡外层，不挡同元素其它监听器 || 要连同元素后续一起停用 stopImmediatePropagation || onclick 里 return false 阻止不了冒泡，那是 jQuery 约定 || 别滥用，否则全局点击、弹窗关闭都会失效
===BODY===
### 先看一个冒泡引发的 bug

承接上一章：事件默认会冒泡。列表每行绑了「点整行跳转」，行内的删除按钮绑了「删除这一行」，实际点删除时，行确实删了，页面却紧接着跳走。

原因顺着传播链一看就清楚：删除是想要的，跳转是被连累的。

- 点 `button` → 按钮处理函数删掉 `li`
- 事件继续冒泡到 `li`
- `li` 的 `onclick` 执行 → 触发整行跳转

### 一行修复：stopPropagation

在处理函数里调用 `stopPropagation()`，事件就到此为止，不再往上交给 `li`。这样按钮的删除照常执行完，外层的跳转监听收不到消息，连带触发被切断。

```js
var li = document.querySelector("li")
var btn = li.querySelector("button")
li.onclick = function () { console.log("跳转") }
function handler(e) {
    e.stopPropagation()                 // => 不再冒泡到 li，跳转不执行
    this.parentNode.remove()            // => 只删这一行
}
btn.onclick = handler
```

### 兼容写法：cancelBubble 与 DOM0

标准用 `stopPropagation()`，老 IE 没有这个方法，改用 `cancelBubble = true`。写法随绑定方式而变，但作用都是「别再往外传」。

| 绑定方式 | 阻止传播写法 |
|---|---|
| `addEventListener` | `e.stopPropagation()` |
| DOM0 `onclick` | `e.stopPropagation()` 或 `window.event.cancelBubble = true` |
| IE `attachEvent` | `e.cancelBubble = true` |

> ⚠️ DOM0 里的 `return false` 阻止不了冒泡；「return false 既阻止冒泡又阻止默认」是 jQuery 的约定，不是原生 JS 的规则。

### stopPropagation 与 stopImmediatePropagation

`stopPropagation` 只切断「传给别的元素」，同一个元素上后续注册的监听照样执行；要连它们一起拦住，才用 `stopImmediatePropagation`。两者差别就在管不管同元素的后续监听。

| 方法 | 阻止外层 | 阻止同元素后续监听 |
|---|---|---|
| `stopPropagation()` | 是 | 否 |
| `stopImmediatePropagation()` | 是 | 是 |
| `cancelBubble = true`（IE） | 是 | 否 |

```js
btn.addEventListener("click", function (e) { e.stopPropagation() })
btn.addEventListener("click", function () { console.log("第二个仍执行") })  // => 会打印
```

### 别滥用，以及与阻止默认的分工

别到处写 `stopPropagation`：页面里若处处截断，挂在 `document` 上的全局点击就收不到消息，很多「下拉框关不掉」「弹窗关不掉」都源于此。有更轻的替代就优先用替代。

- 子元素有独立交互、父级有跳转或关闭逻辑：适合阻止
- 能用 `e.target.nodeName === "BUTTON"` 提前 `return`：优先用替代，不误伤别人
- 全局点击、弹窗关闭依赖冒泡：不要轻易截断

一句话，本章管的是「事件传不传」；浏览器自带的动作做不做，是下一章 `preventDefault` 的事，两者不是一回事。
===CH===
no: 76
title: 阻止默认行为
lessons: 105
summary: preventDefault 阻止浏览器自带动作，DOM2 里必须用它，return false 只认 DOM0
points: 右键菜单、a 跳转、form 提交、勾选、选中都可被阻止 || addEventListener 里 return false 完全无效 || 事件 cancelable 为 true 时才能阻止默认行为 || passive 的 touchmove/wheel 里 preventDefault 会失效 || preventDefault 管浏览器，stopPropagation 管传播，两者正交
===BODY===
### 默认行为是什么，为什么要拦

右键点页面弹系统菜单、点 `<a>` 跳转、表单提交刷新页面，这些都是浏览器自带的动作，叫默认行为。想换成自己的逻辑，第一步就得先把默认动作拦下来。

承接上一章：`stopPropagation` 管的是事件传不传，跟浏览器做不做自带动作无关，所以这里需要另一套方法。

- 右键 → 弹系统菜单
- `<a href>` → 跳转
- `<form>` → 提交并刷新
- 复选框、输入框、图片拖拽、文字选中 → 各自的默认响应

### preventDefault：DOM2 里唯一有效写法

标准做法是在事件对象上调 `preventDefault()`，它告诉浏览器「这次别执行自带动作」。右键拦系统菜单是最直观的例子，也是自定义菜单的起点。

```js
document.addEventListener("contextmenu", function (e) {
    e.preventDefault()          // => 系统菜单被拦住
})
```

### return false 只认 DOM0

拦默认行为的写法随绑定方式而变。`addEventListener` 里写 `return false` 完全无效，必须调 `preventDefault()`；从 jQuery 转过来的人最容易踩这个坑。

| 绑定方式 | 阻止默认行为 |
|---|---|
| DOM0 `onclick` 等 | `return false` |
| `addEventListener`（DOM2 标准） | `e.preventDefault()` |
| `attachEvent`（IE） | `e.returnValue = false` |

因为 jQuery 的 `return false` 等价于「阻止传播 + 阻止默认」两件事，原生并不认这套约定。`oncontextmenu` 这类 DOM0 属性里 `return false` 才有效。

### 能阻止什么，什么时候阻止不了

右键菜单、`<a>` 跳转、表单提交、复选框勾选、输入框输入、图片原生拖拽、文字选中，这些都能被阻止。典型用法是提交前校验：用户名为空就 `preventDefault()`，页面既不刷新也不提交。

```js
myform.addEventListener("submit", function (e) {
    console.log(e.cancelable)          // => true（可取消才能阻止）
    if (username.value === "") {
        e.preventDefault()             // => 拦住提交
    }
})
```

反过来，有几类情况拦不住：事件本身不可取消（`e.cancelable` 为 `false`）、浏览器原生 UI，以及 `addEventListener` 里误写 `return false`。这几种写法都不该指望生效。

还有个隐蔽点：浏览器为滚动流畅，默认把 `touchmove / wheel` 当被动监听，里面调 `preventDefault()` 会报警告且无效。要生效，注册时得显式传 `{ passive: false }`。

### 与阻止传播正交，两者合起来

`preventDefault` 与上一章的 `stopPropagation` 是正交的两件事：一个管浏览器做不做，一个管事件传不传，互不影响。两个一起写，才等于 jQuery 那一句 `return false`。

| | `stopPropagation()` | `preventDefault()` |
|---|---|---|
| 阻止什么 | 事件继续传播 | 浏览器的默认行为 |
| 影响 | 外层或内层元素的监听 | 跳转、提交、右键菜单等自带动作 |
| 例子 | 点按钮不再触发整行跳转 | 点右键不弹系统菜单 |

把这两个方法合起来，就够搭出下一章的自定义右键菜单；再往后，冒泡与 `e.target` 还会撑起事件委托。
===CH===
no: 77
title: 案例：自定义右键菜单
lessons: 106
summary: 拦住系统菜单、用鼠标坐标把菜单定位到光标、点空白关闭，并处理冒泡误关
points: contextmenu 里先 preventDefault 再 display:block 显示 || offsetWidth 必须在显示之后读，隐藏时尺寸为 0 || 左/上坐标要夹在视口减菜单宽高的范围内 || 点菜单项冒泡到 document 会误关，用 stopPropagation 修 || 悬停高亮交给 CSS 的 :hover，不必用 JS
===BODY===
### 需求与思路

右击页面弹出一个自己画的菜单：拦掉系统菜单、把菜单移到光标处、点别处自动收起。拦截靠 `contextmenu` 事件里调 `preventDefault`，否则系统菜单会和自定义菜单叠在一起。

定位用 `clientX/clientY`，它们相对视口，与 `absolute` 的 `left/top` 原点一致，可直接赋值。但要先用视口宽高减菜单宽高夹一下，否则在窗口右下角右击时菜单会跑到屏幕外。

### 完整案例代码

```js
// 案例：自定义右键菜单。假设页面已有 <ul id="menu">（CSS 设 absolute + display:none），菜单项为 li
var menu = document.querySelector("#menu")

document.addEventListener("contextmenu", function (e) {
  e.preventDefault()                    // ← 关键点：不调它，浏览器自带菜单会一起弹出来
  menu.style.display = "block"          // ← 关键点：先显示再量尺寸，隐藏时 offsetWidth 是 0

  var maxX = document.documentElement.clientWidth - menu.offsetWidth
  var maxY = document.documentElement.clientHeight - menu.offsetHeight
  var x = Math.min(e.clientX, maxX)     // ← 关键点：clientX/Y 相对视口，夹一下防超出屏幕
  var y = Math.min(e.clientY, maxY)

  menu.style.left = x + "px"
  menu.style.top = y + "px"
})

document.addEventListener("click", function () {
  menu.style.display = "none"           // ← 关键点：点页面任何地方（除菜单内）都收起
})

menu.addEventListener("click", function (e) {
  e.stopPropagation()                   // ← 关键点：挡住冒泡，否则点菜单项立刻被上面的 click 关掉
  if (e.target.nodeName === "LI") {
    console.log("点了：" + e.target.textContent)   // => 点了：删除
    menu.style.display = "none"         // 何时关由菜单自己决定
  }
})
```

### 关键知识点

- **contextmenu 与 preventDefault 配套**：右键触发的是 `contextmenu` 事件，浏览器默认动作就是弹系统菜单。不调 `preventDefault`，两套菜单会同时出现、互相干扰。监听挂在 `document` 上，页面任何位置右击都能接管。
- **用 clientX/clientY 定位**：这两个值相对视口左上角，菜单设 `absolute` 且父级未定位时相对文档，页面不滚动时两者相等，所以能直接赋值。若页面可能滚动，应改用 `pageX/pageY`，否则菜单会偏一个滚动距离。
- **先显示再读 offsetWidth**：`display: none` 的元素不参与布局，尺寸全是 0，此时算出的上限等于视口宽，等于没有限制。顺序必须是先 `display: block` 再量宽高，这也是元素尺寸那章的直接应用。
- **点别处隐藏，点菜单项别误关**：`document` 上的 `click` 收所有点击，菜单项上的点击也会冒泡上去，刚弹出来就被关掉。菜单自己先 `stopPropagation` 拦住，再 `e.target.nodeName === "LI"` 判断点的是哪一项，由它决定何时关闭。
===CH===
no: 78
title: 事件委托
lessons: 107
summary: 把事件绑在父级靠冒泡统一处理，新增子元素自动生效，这就是事件委托
points: 委托靠冒泡，e.target 指出真正被点的元素 || this 永远是绑事件的元素，e.target 永远是被点的 || 只绑父级一次，动态新增元素无需重新绑定 || focus/blur、mouseenter/leave 不冒泡，无法委托 || 点到后代判断失败用 closest，就近委托别都扔给 document
===BODY===
### 为什么需要委托

给长列表的每个子元素都绑一次监听，是最直白也最笨的做法。1000 行就要绑 1000 次，元素一多既费内存又难管理。

更麻烦的是动态新增：循环绑定只对当时存在的元素有效，事后 `createElement` 加进来的行没有监听，必须记得再绑一次，漏一次就是 bug。于是自然想到——能不能只绑父级一次，让所有子元素共享。

- 绑定次数多，元素越多越明显
- 新增元素要手动重绑，容易漏
- 想解绑时，得逐个清理

### 事件冒泡如何支撑委托

能这么做，靠的正是前面事件流那章的冒泡：点子元素，事件会一层层冒到父级，父级上的监听自然收得到。这是冒泡最实用的一个用途。

收到之后怎么知道点的是谁？靠 `e.target`，它永远指向真正被点的那个元素。父级不必关心有多少子级，只需读它即可。

```js
list.onclick = function (e) {
    console.log(e.target)        // => 真正被点的元素，如 BUTTON
}
```

### e.target 与 this 的差别

这是委托里最容易混的一组概念，必须分清：`this` 永远是「绑事件的那个人」，`e.target` 永远是「真正被点的那个人」。无论点文字还是点按钮，前者都不变。

| 点的位置 | `e.target` | `this` |
|---|---|---|
| 点到文字 | `li` | `ul#list` |
| 点到按钮 | `button` | `ul#list` |

> 💡 兼容老 IE 时写 `var target = e.target || e.srcElement`，因为旧版把目标放在 `srcElement` 上。

### 一次绑定管住所有行

对比动态删除那章：那里循环三次绑三次，事后新增还得再绑；委托只在父级绑一次，后来加进多少行都自动生效。因为冒泡不依赖「绑定那一刻谁存在」，只要事件能冒到父级就会被处理。

```js
list.onclick = function (e) {
    if (e.target.nodeName === "BUTTON") {
        e.target.parentNode.remove()     // => 删整行，新增行同样生效
    }
}
```

省监听器、动态元素免重绑、只需解绑父级一个，三个好处都由此而来。判断菜单里点了哪一项，还可以用 `e.target.className` 或 `dataset.index` 区分，不必给每项单绑。

### 适合委托与不适合的场景

判断标准只有一条：事件会不会冒泡。会冒泡，才能从子级冒到父级被统一处理，所以列表、表格、菜单、长列表、动态元素都适合委托。

不适合的是不冒泡或需要精确区分的场合，硬套只会让判断越写越复杂。

| 情况 | 能否委托 | 说明 |
|---|---|---|
| 列表、表格、菜单 | 适合 | 冒泡且子元素多 |
| 动态新增元素 | 适合 | 自动生效，无需重绑 |
| `focus` / `blur` | 不适合 | 不冒泡，改用 `focusin` / `focusout` |
| `mouseenter` / `mouseleave` | 不适合 | 不冒泡，改用 `mouseover` / `mouseout` |
| `load` / `unload` | 不适合 | 不冒泡 |
| 子元素层级很深 | 慎用 | 判断逻辑会变复杂 |

### 三个坑与因果链闭合

第一个坑是点到更深层后代：`e.target` 是 `span` 而非 `li`，`nodeName === "LI"` 判定失败，用 `e.target.closest("li")` 往上找最近的 `li` 即可。

第二个坑是父级自己也有行为（如点空白关闭菜单），与子项冲突时配合阻止传播处理。第三个坑是委托层级别抬太高，都扔给 `document` 会让判断越写越杂、还容易框住不该管的东西，就近委托到列表父级最稳。

> 💡 一行就近定位：`var li = e.target.closest("li")`，点到 `span` 也能找到最近的 `li`。

走到这里，整条因果链就闭合了：

- 捕获、目标、冒泡三阶段，构成事件传播机制
- 有了传播，才需要「阻止传播」与「阻止默认」
- 冒泡让事件抵达父级，`e.target` 指出真正目标
- 两者合起来，才把监听收敛到父级，实现事件委托

Vue、React 的合成事件与 jQuery 的 `on("click", "li", fn)` 都是这套思路，理解了委托，框架的事件机制就不再是黑盒。
