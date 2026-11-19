===PART===
id: part-11
order: 11
title: jQuery 与插件生态
range: 162–191
desc: 从选择器与 DOM 操作到动画、ajax 与插件，系统掌握 jQuery 生态
===CH===
no: 133
title: 初识 jQuery
lessons: 162
summary: $ 与 jQuery 是同一函数，选元素得到可链式的 jQuery 对象，与原生 DOM 靠下标互转
points: $ 与 jQuery 指向同一个函数，冲突时改用 jQuery 或 noConflict || $(选择器) 得 jQuery 伪数组，$.ajax 是挂在其上的静态工具 || jQuery 对象与 DOM 靠 $(dom) 和 $obj[0] 互相转换 || 修改方法返回自身才能一路链式点下去 || 原生 DOM 没有 css 方法，混用两类对象是最常见报错
===BODY===
### $ 与 jQuery 是同一个函数

`$` 只是一个合法的变量名，标识符允许以 `$` 开头，jQuery 把整个库挂在这个短名字上。

引入库文件后 `$` 与 `jQuery` 指向同一个函数，所以两种写法完全等价，选哪个全看习惯。

```js
console.log($ === jQuery)             // => true
$("#box").addClass("active")
jQuery("#box").addClass("active")     // 完全等价
```

因为 Zepto、prototype 等库也会占用 `$`，多库并存时要改用 `jQuery` 或调用 `$.noConflict()` 让出名字。

> 💡 冲突的完整处理留到后面章节，这里只需记住两者是同一个函数。

### 引入后得到什么

引入库文件后，页面上多了一个函数 `$`：带括号传参用来选元素，点出来的当工具箱用。

因为一个名字要同时承担「查找」和「工具」两件事，jQuery 把静态方法也挂在这个函数对象上。

```js
$("#box")                  // 传字符串 → jQuery 对象，可链式
$("<div>hello</div>")      // 传标签 → 新建节点
$(document)                // 传 DOM → 包成 jQuery 对象
$.ajax({ url: "/list" })   // 点出静态方法 → 工具函数
```

- `$(选择器/节点/DOM)`：得到装着 DOM 的 jQuery 伪数组
- `$.xxx()`：jQuery 的静态工具函数

它换来的是选择器、隐式迭代、动画、ajax 与浏览器兼容，核心卖点是「短 + 兼容」。

新项目多用 Vue 或 React，但老后台与外包项目里 jQuery 仍大量存在，读懂它是必备技能。

### jQuery 对象与原生 DOM 的差别与互转

`$()` 拿到的是 jQuery 对象：一个带 `length` 和 `[0]` 的伪数组，不是真数组，自身也没有 `style`。

因为它是包装层，原生属性要从下标取出，jQuery 方法要包成对象才能调，两类对象不能混用。

- `$div[0]` 与 `$div.get(0)` 都取出第一个原生 DOM
- `$div.css` 是函数，`odiv.css` 是 `undefined`，两类方法不通用

| 形态 | 特征 | 转成另一种 |
|---|---|---|
| DOM 对象 | 有 `style`、`className` | `$(dom)` |
| jQuery 对象 | 有 `length`、`[0]`、`css()` | `$obj[0]` 或 `$obj.get(0)` |

> ⚠️ 把 jQuery 对象当数组 `forEach`，或把 DOM 对象直接 `.css()`，是最常见的两类报错。

### 链式调用靠返回自身

绝大多数 jQuery 方法执行完后返回调用它的那个 jQuery 对象，也就是内部 `return this`。

因为返回值仍是同一批元素的包装，下一个方法能立刻接着点，不必重新写选择器。

```js
$("#box")
    .addClass("active")
    .css("color", "red")
    .fadeIn(300)
```

- 返回 jQuery 对象：如 `addClass`、`css` 写，可以一直链下去
- 返回布尔或单个值：如 `hasClass`、`css("width")` 读，链到此为止

> ⚠️ 遇到读方法或判断方法就断链，别在它们后面再点别的 jQuery 方法。
===CH===
no: 134
title: jQuery 选择器
lessons: 163
summary: CSS 选择器原样可用，另有按位置筛选的伪类与二次筛选方法，方法比伪类更灵活
points: CSS 基本选择器原样可用，后代选择器会连嵌套孙子一起选中 || :odd 与 :even 看索引奇偶，:even 从第 1 个开始 || .eq(n) 能传变量且复用集合，比拼接 :eq(n) 更快 || find 取所有后代、children 只取直接子级、siblings 不含自己 || .index() 拿到兄弟中的位置，是选项卡联动的核心
===BODY===
### 基本选择器就是 CSS

jQuery 的选择器字符串沿用 CSS 写法，标签、类、id、后代都能直接传进 `$()`。

因为底层交给浏览器的选择器引擎解析，学过 CSS 的人不必另记一套语法。

```js
$("#box")              // id
$(".active")           // class
$("ul li")             // 后代，含嵌套的孙子
$("ul > li")           // 直接子元素
```

> ⚠️ `$("ul li")` 会把内层 `ul` 里的 `li` 也选上，这是后代语义；只要一层就写 `>` 或用 `.children()`。

### 层级与 jQuery 独有伪类

CSS 的结构伪类之外，jQuery 补了一套 `:first`、`:last`、`:eq(n)`、`:odd`、`:even` 按位置筛。

因为结果常常是一整个集合，而需求只是「第几个」，伪类能在选择器里就把范围收窄。

| 写法 | 拿到的第几个（从 1 数） |
|---|---|
| `:first` / `:last` | 第 1 个 / 最后一个 |
| `:eq(2)` | 索引 2，即第 3 个 |
| `:odd` | 第 2、4、6…（索引为奇数） |
| `:even` | 第 1、3、5…（索引为偶数） |

`odd` 与 `even` 看的是索引奇偶，不是「第几个」的奇偶，所以 `:even` 从第 1 个开始。

> ⚠️ 索引是变量时 `:eq(${index})` 要拼字符串，容易写错，下一节的 `.eq()` 更稳妥。

### 二次筛选方法才是主力

筛选方法是「先选一批，再在结果里筛」，这正是 jQuery 比 `querySelectorAll` 强的地方。

因为方法作用在已有集合上，能传变量、能复用，不必每次重新解析选择器字符串。

```js
var $li = $("ul li")
$li.eq(3)                     // 第 4 个，参数可以是变量
$li.first().next()            // 第一个的下一个兄弟
$("ul").find("li")            // 所有后代
$("ul").children()            // 只取直接子级
$("ul li.active").parent()    // 直接父级
$("ul li.active").siblings()  // 除自己外的兄弟
$("ul li.active").index()     // 在兄弟中的位置，从 0 起
```

- `.find(sel)`：所有后代
- `.children()`：直接子级
- `.parent()`：直接父级；`.closest(sel)`：含自身向上第一个匹配

> 💡 `.index()` 返回被点标题的序号，再用 `.eq(index)` 找对应内容，选项卡全靠这一对。

### 与原生 querySelector 的对照

原生一次拿到的是静态集合，jQuery 拿到的是可以继续筛选、可以链式的对象。

因为查找与后续操作被合成一条链，遍历和筛选都不用自己写循环。

| 需求 | 原生 | jQuery |
|---|---|---|
| 查一批 | `document.querySelectorAll("ul li")` | `$("ul li")` |
| 取第 n 个 | `list[2]` | `$("ul li").eq(2)` |
| 找后代 | `el.querySelectorAll("li")` | `$(el).find("li")` |
| 遍历设置 | 配 `forEach` 自己循环 | 写操作自动隐式迭代 |

> ⚠️ 原生返回的是 NodeList，没有 `css`、`addClass` 这些方法，要操作得先用 `$(...)` 包一层。
===CH===
no: 135
title: 操作样式 css()
lessons: 164
summary: css() 一个方法通吃读写，传对象批量设置，写遍历全部而读只取第一个元素
points: css(名) 读第一个元素的计算样式，返回带单位字符串 || css(名,值) 与 css(对象) 是写，数字会自动补 px || 隐式迭代让写操作遍历全部匹配元素，不必自己写循环 || 读操作只取第一个，因为一个方法只能返回一个值 || css() 走 getComputedStyle，能读到样式表里的样式
===BODY===
### css() 读与写

`css()` 一个方法通吃读写：只传属性名是读，再传一个值就是写。

因为读写共用同一个入口，靠参数个数区分，记忆成本比记两套 API 低。

```js
$("#box").css("width")             // => "100px"，读
$("#box").css("width", "200px")    // 写
$("#box").css("height", 200)       // 写，数字自动补 px
$("#box").css("background-color")  // => "rgb(255, 255, 0)"
```

读回的是计算后样式：宽高带单位字符串，颜色是 `rgb()`，没设过则是空串或 `auto`。

> 💡 想要纯数字做算术，用后面章节的 `.width()`，它是 `100` 而不是 `"100px"`。

### 传对象一次设置多个

要改的样式一多，逐条 `css(名, 值)` 会写得很长，传一个对象能一次搞定。

因为对象把「属性 → 值」打包传入，jQuery 内部循环这个对象逐个应用，代码更紧凑。

```js
$("ul li:eq(3)").css({
    width: 200,
    height: 300,
    backgroundColor: "yellow"
})
```

- 连字符写法如 `"background-color"` 必须加引号
- 驼峰写法如 `backgroundColor` 可以不加引号

> ⚠️ 数字只对需要单位的属性补 `px`，`opacity`、`zIndex` 这类无单位属性不会被硬塞单位。

### 隐式迭代：写遍历全部，读只取第一个

对一批元素做写操作时，jQuery 自动循环整组，这个机制叫隐式迭代。

因为 `$()` 拿到的往往是多个元素，逐个设置是最高频需求，库就把循环藏进了方法里。

| 操作 | 是否遍历全部 |
|---|---|
| `.css(名, 值)` 写 | 是，整组生效 |
| `.css(名)` 读 | 否，只取第一个 |
| `.html(值)` / `.text(值)` 写 | 是 |
| `.html()` / `.val()` / `.attr()` 读 | 否，只取第一个 |

读操作反过来只取第一个，原因很直接：一个方法只能返回一个值，无法替整组元素给出答案。

> ⚠️ 这条「写全、读首」的规律贯穿整个 jQuery，后面所有读写方法都按它理解。

### css() 与原生 style 的差别

`el.style` 只能读写行内样式，而 `css()` 读取时走 `getComputedStyle`。

因为样式可能写在 `<style>` 或外部样式表里，只读行内会漏掉，jQuery 帮你取最终计算值。

```js
// 样式表里写了 #box{height:100px}
document.getElementById("box").style.height   // => ""
$("#box").css("height")                        // => "100px"
```

- 读样式表里的样式：`el.style` 不能，`css()` 能
- 写：`el.style` 必须带单位，`css()` 数字自动补 `px`
- 一次改多个元素：原生要自己循环，`css()` 自动隐式迭代

> 💡 代价是 `css()` 每次读都要计算样式，比直接取行内稍慢；频繁读写时优先把值缓存起来。
===CH===
no: 136
title: 操作 class
lessons: 165
summary: 四个 class 方法配 siblings 就是选项卡三件套，比手改 className 安全得多
points: addClass、removeClass、toggleClass 都返回 jQuery 对象，可继续链式 || hasClass 返回布尔值，是链式的终点 || 从 $(this) 出发用 siblings 做局部排他，不误伤别处 || className.includes 会误匹配 inactive，hasClass 按单词判断 || toggleClass 适合点一次开再点关，不用自己写 if...else
===BODY===
### 四个方法清单

操作 class 只用四个方法：加、删、切换、判断，参数都是 class 名字符串。

因为 class 是最常用的状态开关，把它们收敛成一组方法，比手改 `className` 安全得多。

| 方法 | 作用 | 返回值 |
|---|---|---|
| `.addClass(str)` | 加，已存在不重复 | jQuery 对象 |
| `.removeClass(str)` | 删，不传参清空全部 | jQuery 对象 |
| `.toggleClass(str)` | 有则删、无则加 | jQuery 对象 |
| `.hasClass(str)` | 判断是否含有 | 布尔值 |

> 💡 `addClass("a b c")` 可一次加多个，`removeClass()` 不传参会清空全部，这两点常被忽略。

### 返回值决定能否继续链式

四个方法里只有 `hasClass` 返回布尔，其余三个都返回 jQuery 对象。

因为链式靠「方法返回自身」延续，一旦中途返回布尔，后面就再没有 `.css()`、`.addClass()` 可调。

```js
$("#box").addClass("active").css("color", "red")   // 能链
$("#box").hasClass("active").css("color", "red")   // 报错，布尔没有 css
```

- 三个改状态的方法：可继续链式
- `hasClass`：返回布尔，链到此为止

> ⚠️ 想判断后再操作，用 `if ($el.hasClass("x"))` 包起来，别把判断接在链尾。

### 用 siblings 做局部排他

切换高亮时，要给自己加 class、给同组其他元素去掉 class，`siblings()` 正是为此准备的。

因为 `$("ul li")` 会选中页面上所有 `li`，从 `$(this)` 出发只影响兄弟才不会误伤别处。

```js
$(this).addClass("active").siblings().removeClass("active")
$("ul li").removeClass("active").eq(0).addClass("active")   // 先全清再点亮
```

- 从 `$(this)` + `siblings()`：只作用于同组兄弟，精确
- 直接 `$("ul li").removeClass()`：会清掉所有 `ul li`，易误伤

> 💡 `toggleClass` 适合「点一次开、再点关」，展开收起类交互不必自己写判断。

### 与原生 className 的对照

原生删一个 class 得先 `split` 成数组再 `join` 回去，jQuery 一行就够。

因为 class 是以空格分隔的整体字符串，字符串操作容易误判，jQuery 按「单词」精确匹配更安全。

| 需求 | 原生 | jQuery |
|---|---|---|
| 加 | `el.className += " active"` | `.addClass("active")` |
| 删 | `split` + `splice` + `join` | `.removeClass("active")` |
| 判断 | `className.includes("active")` | `.hasClass("active")` |

> ⚠️ `includes("active")` 会把 `inactive`、`active-item` 也算匹配，只有 `hasClass` 按完整单词判断。
===CH===
no: 137
title: 操作内容
lessons: 166
summary: html、text、val 三个方法读写同名，html 解析标签、text 转义、val 专管表单值
points: html() 等价 innerHTML 会解析标签，text() 等价 textContent 当纯文本 || 用户填的内容一律用 text，只有自己拼的 HTML 才用 html || map 之后必须 join，否则数组转字符串会多出逗号 || val 读只取第一个，复选框要配 prop(checked) || 读只取第一个、写遍历全部，与前面 css 的规律一致
===BODY===
### 三个方法清单

`html()`、`text()`、`val()` 分别对应 `innerHTML`、`textContent` 与表单的 `value`。

因为读写同名、靠是否传参区分，三个方法组成一组，覆盖了元素内容与表单值。

| 方法 | 等价原生 | 传参 | 特点 |
|---|---|---|---|
| `.html()` / `.html(str)` | `innerHTML` | 写 | 解析成元素 |
| `.text()` / `.text(str)` | `textContent` | 写 | 当成纯文本 |
| `.val()` / `.val(str)` | `value` | 写 | 表单专用 |

> 💡 jQuery 的 `text()` 内部读的是 `textContent` 而不是 `innerText`：前者取原始文本（含隐藏元素），不去触发浏览器排版计算，因此更快；需要「只看可见文字」时才用 `innerText`。

> 💡 不传参是读、传参是写，这一点和 `css()` 完全一致，可以对照着记。

### html 与 text 的读写差别

`html()` 把字符串当标签解析，`text()` 把字符串原样当文字显示，两者对标签的处理相反。

因为用户填的内容可能夹带脚本，区分这两者直接关系到页面安全。

```js
$("#box").html("<b>粗</b>")     // 显示加粗的「粗」
$("#box").text("<b>粗</b>")     // 显示字面量 "<b>粗</b>"

var arr = ["aaa", "bbb", "ccc"]
var listr = arr.map(item => `<li>${item}</li>`).join("")
$("ul.list").html(listr)        // 渲染列表的固定搭配
```

- 自己拼的 HTML 用 `html()`，用户输入一律用 `text()`
- `map` 之后必须 `join("")`，否则数组隐式转字符串会带出逗号

> ⚠️ 忘写 `join("")` 是本篇出现频率最高的坑，逗号会被当成文字插进列表。

### val 与表单取值

`val()` 读第一个匹配表单元素的值，写则遍历全部，取值形态随元素类型变化。

因为复选框、多选下拉这类元素没有「单一文本值」，直接读 `val()` 往往不是想要的答案。

```js
$("input").val()                             // => "默认值"，只取第一个
$("input").val("新值")                       // 所有 input 全变
$("input[type=checkbox]").val()             // => "on"，没什么用
$("input[type=checkbox]").prop("checked")   // => true / false
```

- 文本框、文本域：输入的内容
- 复选框：`"on"`，不是布尔
- 单选下拉：选中项的 `value`；多选下拉：数组

> ⚠️ 判断复选框是否勾选用 `prop("checked")`，`val()` 拿到的 `"on"` 不能当布尔用。

### 与原生写法及读写规律

原生要分清 `innerHTML`、`textContent`、`value` 三个属性，jQuery 用同名方法统一了入口。

因为读写共用方法名，规律仍与 `css()` 一致：写遍历全部，读只返回第一个。

```js
$(sel).html()          // 读 → 字符串，只取第一个
$(sel).val()           // 读 → 字符串 / 数组，只取第一个
$(sel).val("x")        // 写 → 全部匹配元素生效
$(sel).html(function (i, old) { return old + "<hr>" })  // 按索引算值
```

- 读：一个方法只能给一个结果，故只认第一个
- 写：需求是整组生效，故自动隐式迭代

> 💡 三个方法都支持函数写法，参数是 `(index, oldValue)`，返回值作为该元素的新内容。
===CH===
no: 138
title: 操作属性
lessons: 167
summary: attr 管 HTML 属性、prop 管 DOM 属性，布尔属性 disabled 等必须用 prop 开关
points: attr 读写 HTML 属性，自定义属性 index 与 data-* 一律用它 || prop 读写 DOM 属性，自定义属性取不到会是 undefined || disabled、checked、selected 是布尔属性，只能用 prop 开关 || attr(名,false) 关不掉布尔属性，因为属性出现即生效 || attr(value) 拿初始值，val() 才拿当前输入值
===BODY===
### attr 与 prop 的分工

属性分两类：W3C 规定的原生属性，以及自己编的自定义属性，两者要用不同方法操作。

因为自定义属性不会变成 DOM 对象的 property，用错方法就会读到 `undefined`。

| 分类 | 例子 | 用哪个 |
|---|---|---|
| 原生属性 | `id`、`class`、`title`、`href`、`src` | 都行，`attr` 更直观 |
| 自定义属性 | `index`、`data-xxx` | 必须用 `attr` |
| 布尔属性 | `disabled`、`checked`、`selected` | 必须用 `prop` |

> 💡 推荐分工是：`attr` 管 HTML 标签上写的，`prop` 管 DOM 对象上的状态。

### attr 读写 HTML 属性

`attr()` 读写的都是标签上那个字符串，一次一个或传对象批量设置都可以。

因为它直接对应 HTML 源码里的属性，自定义属性也能照常读写，`removeAttr` 负责移除。

```js
$("#box").attr("id")                     // => "box"
$("#box").attr("index")                  // => "1"，自定义也能读
$("#box").attr("index", "2")             // 设置
$("#box").attr({ id: "box2", title: "hello" })   // 一次多个
$("#box").removeAttr("index")            // 移除
```

> ⚠️ `prop("index")` 读自定义属性会得到 `undefined`，因为自定义属性不会挂到 DOM 对象上。

### prop 与布尔属性的坑

`disabled`、`checked`、`selected` 是布尔属性：HTML 里只要属性出现就生效，与值无关。

因为 `attr(名, false)` 只是把值改成字符串 `"false"`，属性仍在，元素依旧被禁用。

```js
$("#mybtn").attr("disabled", false)   // 仍然禁用，变成 disabled="false"
$("#mybtn").prop("disabled", false)   // => 可用，正确写法
$("#mybtn").removeAttr("disabled")    // 移除属性也能解除
```

- `.attr("disabled", true)`：禁用
- `.attr("disabled", false)`：仍然禁用
- `.prop("disabled", false)`：可用

> ⚠️ `checked`、`selected`、`readonly`、`multiple` 同理，一律用 `prop` 开关，别用 `attr`。

### attr 与 prop 对照及原生写法

原生对应的是 `getAttribute` / `setAttribute` 与直接取对象属性，jQuery 把两者拆成两个方法。

因为 `attr` 拿的是「写的是什么」，`prop` 拿的是「解析后的当前状态」，用途本就不同。

| 需求 | 用哪个 | 原因 |
|---|---|---|
| 读写 `href`、`src` 原文 | `attr` | 要标签上写的字符串 |
| 读写 `id`、`class`、`title` | 都行 | 两者都能读 |
| 读写自定义属性 | `attr` | `prop` 读不到 |
| 读实时输入值 | `.val()` | `attr("value")` 是初始值 |

> ⚠️ `attr("value")` 拿到的是 HTML 上写的初始值，不会跟输入变；取当前内容要用 `.val()`。
===CH===
no: 139
title: 操作偏移量
lessons: 168
summary: offset 相对文档且可读可写，position 相对定位父级且只读，隐藏元素测不出位置
points: offset 以文档左上角为参照，返回无单位的 {top,left} || offset 可传 {left,top} 设置，jQuery 会自动换算成 left/top || position 以最近定位祖先为参照，只能读不能写 || offset 不受页面滚动影响，position 就是自身的 left/top || display:none 的元素没有布局盒子，offset 会全是 0
===BODY===
### 两个方法清单

`offset()` 和 `position()` 都返回 `{top, left}`，区别只在参照物与能否设置。

因为一个是相对整篇文档、一个是相对父容器，混用会直接把元素放错位置。

| 方法 | 参照 | 读写 | 典型用途 |
|---|---|---|---|
| `.offset()` | 文档左上角 | 读写都行 | 拖拽、定位弹层 |
| `.position()` | 最近定位祖先 | 只读 | 读元素在容器内的位置 |

> 💡 没有定位祖先时 `position()` 退化为相对文档，此时结果与 `offset()` 接近。

### offset 相对文档，可读可写

`offset()` 读的是元素外框相对文档的位置，页面滚动不会改变这个值。

因为坐标是绝对的文档坐标，拖拽与浮层定位要的正是这种不受滚动影响的参照。

```js
$("div").offset()                       // => {top: 50, left: 50}
$("div").offset({ left: 100, top: 100 })   // 设置到文档 (100,100)
$("p").offset({ left: 100, top: 100 })     // 自动换算成 p 自己的 left/top
```

> ⚠️ 设置的是文档坐标，jQuery 会把它换算成元素自身的 `left/top`，别以为直接写了样式值。

### position 只读

`position()` 返回元素相对最近定位祖先的偏移，等价于自身的 `left/top`。

因为它只是读取布局结果，jQuery 不提供设置入口，传参进去也不会生效。

```js
$("p").position()                        // => {top: 10, left: 10}
$("p").position({ left: 100 })           // 无效，不支持设置
$("p").css("left", 100)                  // 想改位置用 css 或 offset
```

- 参照物是 `position` 不为 `static` 的最近祖先
- 想改位置请改用 `css("left")` 或 `offset({left, top})`

> 💡 选项卡滑块用 `position().left` 比「索引 × 宽度」更稳，宽度变化时不会算错。

### 与原生属性的对照及隐藏坑

原生没有直接对应的方法，要自己用 `getBoundingClientRect` 加滚动距离拼出文档坐标。

因为 `display:none` 的元素没有布局盒子，测位置前必须先让它显示出来。

| jQuery | 原生 |
|---|---|
| `$(el).offset().left` | `el.getBoundingClientRect().left + scrollX` |
| `$(el).position().left` | `el.offsetLeft`（相对 offsetParent） |

> ⚠️ `hide()` 之后 `offset()` 会返回全是 0 的无效值，需先显示再测，或改用 `visibility:hidden`。
===CH===
no: 140
title: 获取元素尺寸
lessons: 169
summary: 四个尺寸方法从内到外逐层加，width 返回数字可直接运算，隐藏元素仍能测
points: width 是内容、innerWidth 加 padding、outerWidth 加 border || outerWidth(true) 再把 margin 算进去，true 就是含外边距 || width() 返回数字，css(width) 返回带单位字符串 || 设置 width 改的是内容宽，设置 outerWidth 改的是外框总宽 || jQuery 3 在 display:none 时仍能测尺寸，原生 offsetWidth 为 0
===BODY===
### 四个方法逐层相加

四个尺寸方法从内到外一层层加：内容、内边距、边框、外边距。

因为盒模型每一层都可能影响占位，把它们拆成四个方法就不用自己加减。

| 方法 | 内容 | padding | border | margin |
|---|---|---|---|---|
| `.width()` | 是 | 否 | 否 | 否 |
| `.innerWidth()` | 是 | 是 | 否 | 否 |
| `.outerWidth()` | 是 | 是 | 是 | 否 |
| `.outerWidth(true)` | 是 | 是 | 是 | 是 |

> 💡 记忆看名字：`inner` 多算内边距，`outer` 多算边框，参数 `true` 再补上 margin。

### 与原生属性的对照

原生只有 `clientWidth`、`offsetWidth` 两个粗粒度值，内容宽得自己减掉 padding。

因为原生不含 margin，算「真实占位」还得另加，jQuery 用一组方法把这些换算都包了。

| jQuery | 原生 |
|---|---|
| `.width()` | `clientWidth - padding`，要自己减 |
| `.innerWidth()` | `clientWidth` |
| `.outerWidth()` | `offsetWidth` |
| `.outerWidth(true)` | `offsetWidth + margin` |

> 💡 只设了 `margin-left` 时，`outerWidth(true)` 会变而 `outerHeight(true)` 不变，别以为是算错。

### 读与写的差别

`width()` 读回的是数字，而 `css("width")` 读回的是带单位字符串，做算术时优先用前者。

因为数字能直接参与计算，省去 `parseInt` 一步；写操作时它同样接受数字。

```js
$("div").css("width")      // => "100px"，字符串
$("div").width()           // => 100，数字
$("div").width(200)        // 内容宽变 200，实际占位更大
$("div").outerWidth(200)   // 外框总宽变 200，内容被压缩
```

> ⚠️ `width(200)` 改的是内容宽，不是看到的外框宽；要控制整体占位得用 `outerWidth`。

### 三个易错点

隐藏元素、小数宽度、设置语义是这一组方法最常踩的三个坑。

因为 jQuery 会临时调整元素来测量，行为与原生并不完全一致。

```js
$("div").hide()
$("div").width()           // => 100，jQuery 3 仍能测到
$("div").css("width")      // => "100.7px"
$("div").width()           // => 101，被四舍五入成整数
```

- 隐藏元素：jQuery 会临时显示测量，原生 `offsetWidth` 此时是 0
- 小数宽度：`width()` 返回四舍五入后的整数，精确值看 `css()`
- 设置语义：`width` 改内容、`outerWidth` 改外框，别混用

> ⚠️ 需要小数精度时别用 `width()` 做累加，取整误差会一点点积累。
===CH===
no: 141
title: jQuery 事件
lessons: 170
summary: on 覆盖绑定与委托，off 精确解绑，one 只触发一次，return false 同时阻止默认与冒泡
points: on(事件,选择器,数据,处理函数) 的参数顺序要记牢 || 委托把事件挂在父级，后插入的元素也能响应 || off 不传参解绑全部，传函数名才能只解绑一个 || one 触发一次后自动解绑，trigger 是代码主动触发 || return false 等于 preventDefault 加 stopPropagation
===BODY===
### on 绑定事件

`on` 是统一的绑定入口，一个方法覆盖普通绑定、多事件与传参。

因为它内部兼容了各浏览器的差异，不必再像原生那样为旧版 IE 写分支。

```js
$("ul").on("click", function () { console.log("click") })
$("ul li").on("click mouseover", fn)      // 空格分隔，一次绑多个
$("#btn").click(fn)                        // 等价于 on("click", fn)
```

- 绑定：原生 `addEventListener("click", fn)`，jQuery `.on("click", fn)`
- 解绑：原生 `removeEventListener`，jQuery `.off`
- 多事件：原生要写两次，jQuery 一次传多个名字

> ⚠️ 快捷方法 `click()` 不传参是「主动触发」而非「绑定」，这点极易看错。

### off 精确解绑

`off` 按事件名、函数名、委托选择器逐级缩小解绑范围。

因为匿名函数没有引用可比对，想精确解绑就必须给处理函数起名字。

```js
$("div").off()                    // 解绑所有事件
$("div").off("click")             // 只解绑所有 click
$("div").off("click", A)          // 只解绑 A 这一个函数
$("div").off("click", "button")   // 解绑委托在 button 上的
```

- 拖拽结束时要 `off("mousemove")`，否则事件会一直挂在 document 上
- 同一事件绑了多个函数，解绑按名字精确定位，其余保留

> ⚠️ 绑在 document 上的临时事件一定要在结束时解绑，否则鼠标松开后仍在触发。

### 事件委托写法

委托是把事件挂在父级，靠第二个参数指定真正要响应的子元素。

因为事件会冒泡到父级，后插入的子元素无需重新绑定也能被命中。

```js
// on(事件, 选择器, 数据, 处理函数)
$("ul").on("click", "button", function () {
    this.parentNode.remove()     // this 指向被点的 button
})
```

- `$("ul li button").click(fn)`：后插入的 button 没有事件
- `$("ul").on("click", "button", fn)`：后插入的也能响应

> 💡 委托回调里的 `this` 是实际被点的子元素，不是挂事件的父级。

### one 与 trigger

`one` 只触发一次便自动解绑，`trigger` 则用代码主动触发一次事件。

因为有些交互只需首次生效、有些要复用已有处理逻辑，两者都是省代码的工具。

| 方法 | 作用 |
|---|---|
| `.one("click", fn)` | 只触发第一次，之后自动解绑 |
| `.trigger("click")` | 触发并执行默认行为 |
| `.triggerHandler("click")` | 触发但不执行默认行为 |
| `.click()` | `trigger("click")` 的简写 |

> 💡 抽奖按钮、只弹一次的引导提示用 `one`；初始化时主动点一下用 `trigger`。

### return false 的含义

在 jQuery 事件处理函数里 `return false` 同时做两件事。

因为它是库提供的便利写法，等价于原生两个方法的合体，嵌套点击时特别有用。

- 等价于 `e.preventDefault()` 加上 `e.stopPropagation()`
- 既阻止默认行为，又阻止事件继续冒泡
- 想只挡冒泡可用 `e.stopPropagation()`，语义更明确

> ⚠️ 这是 jQuery 特有的行为，原生 `addEventListener` 里 `return false` 什么都不做。
===CH===
no: 142
title: 案例-选项卡
lessons: 171
summary: 用 index 拿序号、$(this) 管自己、siblings 排他、eq 对内容，三行取代原生双层循环
points: $(this) 是事件主角，index() 返回它在兄弟中的序号 || siblings 天然完成排他，不用写内层循环 || 内容区用 eq(index) 与标题序号一一对上 || 初始 active 写死在 HTML，JS 可以用 trigger 补初始化 || trigger 会执行默认行为，triggerHandler 不会
===BODY===
### 需求与思路

点哪个标题就让哪个标题高亮，并显示同序号的内容块，其余全部复原。原生写法要双层循环：外层绑事件、内层清兄弟，还得用闭包保住下标。

jQuery 把这三件事拆成了三个现成方法：`$(this)` 指事件主角，`index()` 现算它是第几个，`siblings()` 一次拿到所有兄弟。

所以整段逻辑就变成三行：自己加 `active`、兄弟去掉 `active`、内容区用 `eq(index)` 点亮对应那一块。一次 `.on()` 调用就给所有标题都绑上了，不需要自己遍历。

### 完整案例代码

```js
// 依赖：引入 jQuery；.header 里 5 个 li，.box 里是序号对应的 5 个 li
var $titles = $(".header li")
var $panels = $(".box li")

if ($titles.length !== $panels.length) {      // 数量对不上时 eq() 会取到空集合
  console.warn("标题与内容数量不一致")
}

$titles.on("click", function () {             // ← 关键点：on 绑一次，集合里每个 li 都绑上（隐式迭代）
  var index = $(this).index()                 // ← 关键点：点谁现算谁，不必用循环变量保存下标
  $(this).addClass("active").siblings().removeClass("active")   // ← 关键点：siblings 一次去掉兄弟的 active
  $panels.removeClass("active").eq(index).addClass("active")    // ← 关键点：eq 取第几个，与标题序号对齐
})

$titles.eq(0).trigger("click")                // 想让 JS 决定首屏状态，就主动触发第一个

console.log($titles.length)                   // => 5
console.log($titles.eq(2).index())            // => 2
console.log($panels.filter(".active").length) // => 1
```

### 关键知识点

- **用 `on` 绑定，集合整体一次搞定**：`$(".header li").on("click", fn)` 会给每个匹配元素都绑上监听，这叫隐式迭代。改用 `for` 逐个绑也不算错，但拿不到「点的是第几个」。
- **`siblings()` 天然排他**：它返回除自己以外的所有同级元素，一条链就完成「我亮、别人灭」。换成 `$("li").removeClass()` 会把页面上其他列表的 `li` 一起清掉，作用范围失控。
- **`eq(index)` 按下标取元素**：`eq` 返回 jQuery 对象，能继续链式调用；`[index]` 拿到原生 DOM，后面就点不出 `addClass`。下标越界得到空集合，不报错。
- **首屏状态别指望 JS**：HTML 里写死的 `class="active"` 才是初始画面，绑定只处理点击。想让 JS 接管，就在绑定后用 `trigger("click")` 主动跑一次回调。
===CH===
no: 143
title: 案例-鼠标跟随
lessons: 172
summary: mousemove 取 pageX/pageY 配 offset 定位浮层，再加 pointer-events none 防抖动
points: pageX/pageY 是文档坐标，配 offset() 两边参照一致 || offsetX 相对事件目标，鼠标划到浮层上会瞬间跳变 || 跟随浮层必加 pointer-events:none，否则 mouseout 与 mouseover 来回闪烁 || hover 是 mouseenter 与 mouseleave 的简写，不冒泡更稳 || 浮层要绝对定位，才能用 offset 把它钉在文档坐标上
===BODY===
### 需求与思路

鼠标在头像上移动时，一个介绍浮层跟着光标走；移进显示，移出隐藏。核心只有一件事：每移动一次，把浮层的坐标改成光标坐标。

坐标从 `mousemove` 的事件对象里读，用 `pageX`、`pageY`——它们以文档左上角为原点，和 `css()` 写的 `left/top` 处在同一套坐标系里，不用再减容器的位置。

浮层必须绝对定位才能脱离文档流，还要加 `pointer-events:none` 让鼠标穿透。`mousemove` 一秒能触发几十次，用 `requestAnimationFrame` 把改写压到每帧一次。

### 完整案例代码

```js
// 依赖：引入 jQuery；#box 的直接子元素 p 作浮层，CSS 为 position:absolute / display:none / pointer-events:none
var $tip = $("#box").children("p")        // ← 关键点：children 只取直接子级，find 会把深层节点也选进来
var ticking = false

$("#box").on("mouseenter", function () {
  $tip.css("display", "block")
}).on("mouseleave", function () {
  $tip.css("display", "none")
})

$("#box").on("mousemove", function (e) {
  if (ticking) return                     // ← 关键点：一帧只排一次，几十次 mousemove 合并成一次改写
  ticking = true
  requestAnimationFrame(function () {
    // ← 关键点：浮层须 absolute 且父级不定位，left/top 才和 pageX 同为文档坐标
    $tip.css({ left: e.pageX, top: e.pageY })   // ← 关键点：pageX/pageY 读光标位置，css 直接改定位
    ticking = false
  })
})

console.log($tip.length)                  // => 1
```

### 关键知识点

- **`pageX/pageY` 配 `left/top`，参照物要一致**：`pageX` 相对文档左上角，所以浮层要 `position:absolute` 且父级不定位。父级若写了 `relative`，要先减去它的偏移量。
- **用 `css()` 直接改坐标**：每帧写一次 `left/top`，配合绝对定位只重绘不重排。改 `margin` 会触发重排；改 `transform` 能上合成层，但要自己拼 `px` 字符串。
- **不加 `pointer-events:none` 一定抖**：浮层压在光标下，鼠标就被判成「在浮层上」，触发 `mouseleave` 隐藏；隐藏后鼠标落回盒子又显示，往复闪烁。
- **用 rAF 降频**：`mousemove` 的触发频率跟着鼠标回报率走，一秒可能上百次，每次都写样式会白算很多帧。用 `ticking` 标记把同一帧内的多次事件合并成一次，画面一样顺滑，开销却降一个数量级。
===CH===
no: 144
title: 动画函数
lessons: 173
summary: 三组基础动画共用时长缓动回调签名，animate 做自定义，stop 防队列堆积
points: show 改宽高透明度、slide 改 height、fade 改 opacity || 统一签名是时长、缓动、回调，默认 swing 要匀速得写 linear || animate 只认有数值的属性，颜色与 transform 都不支持 || stop 停在半路、finish 直接跳到终点，动画前必加 stop || 每个动画自动进队列，回调里的 this 是原生 DOM
===BODY===
### show hide toggle

`show`、`hide`、`toggle` 同时改宽高与透明度，结束后把 `display` 置为 `block` 或 `none`。

因为它们连显示状态一起接管，适合需要真正移出或放回文档流的场景。

```js
$(el).方法(时长, 缓动, 回调)          // 400、"linear"、()=>{}
$("#box").hide(1000, "linear", () => console.log("完成"))
$("#box").toggle(1000)
```

- 时长可用毫秒，或 `"slow"`（600）、`"fast"`（200）
- 缓动默认 `"swing"` 是慢快慢，要匀速必须写 `"linear"`

> 💡 三组动画共用同一套签名，学会一个就等于学会九个方法。

### slide 系列

`slideDown`、`slideUp`、`slideToggle` 只改 `height`，做出展开与收起的效果。

因为只动高度，内容不会被横向拉伸，下拉菜单与树状菜单都用它。

- `slideDown(ms)`：向下展开，结束 `display:block`
- `slideUp(ms)`：向上收起，结束 `display:none`
- `slideToggle(ms)`：按当前状态切换

> ⚠️ 元素要先有明确高度，收起动画才不会因高度自适应而抖动。

### fade 系列

`fadeIn`、`fadeOut`、`fadeToggle` 只改 `opacity`，`fadeTo` 则淡到指定透明度。

因为 `fadeTo` 要多给一个目标值，它的参数顺序和其余三个不一样。

```js
$("#box").fadeIn(1000)
$("#box").fadeOut(1000, "linear", fn)
$("#box").fadeTo(1000, 0.2, "linear", fn)   // 时长, 目标透明度, 缓动, 回调
```

- `fadeIn` / `fadeOut` 结束会改 `display`
- `fadeTo` 只改透明度，元素始终保持 `block`

> ⚠️ 把 `fadeTo` 当成 `fadeIn` 写会漏掉透明度参数，动画直接不生效。

### animate 自定义动画

`animate` 传一个属性对象，对这些数值属性做补间，能动的只有带数值的样式。

因为颜色、`transform` 没有可插值的中间数值，jQuery 核心默认不支持。

| 能动的 | 不能动的 |
|---|---|
| `width` `height` `left` `top` | `background`、`color` 颜色 |
| `margin` `padding` `opacity` | `transform` 的旋转缩放 |
| `fontSize` `borderRadius` | `display` |

- 动 `left/top` 前元素必须有定位，如 `position:relative`
- 想做颜色或 transform 动画，改用 CSS `transition` 或引入 jQuery UI

> ⚠️ 写 `animate({background:"red"})` 不报错却没效果，这是最容易被忽略的限制。

### stop 为什么必须加

jQuery 默认不打断正在跑的动画，而是把新的排进队列，快速连点就会攒一长串。

因为队列是顺序执行的，不加处理时元素会像慢动作回放一样逐个补跑。

| 方法 | 效果 |
|---|---|
| `stop()` | 停当前，停在半路 |
| `stop(true)` | 再清空队列 |
| `stop(true, true)` | 清队列并跳到当前动画终点 |
| `finish()` | 清队列并跳到所有动画终点 |

> ⚠️ 手风琴、下拉菜单、滑动选项卡都要在动画前加 `stop()`，否则一定堆积。

### 回调与队列

每个动画自动进队列，`delay(ms)` 就是往队列里塞一段等待。

因为回调在动画结束后才执行，适合放收尾逻辑，但要注意它的 `this` 是 DOM。

- `queue()` 查看队列，`clearQueue()` 清空排队动画
- `dequeue()` 手动出队一个，`delay(1000)` 插入等待
- 回调里的 `this` 是原生 DOM，用 `$(this)` 才能调 jQuery 方法

> 💡 例：`slideUp(500).delay(1000).slideDown(500)` 会按顺序自动串起来执行。
===CH===
no: 145
title: 案例-树状菜单
lessons: 174
summary: toggleClass 换图标配 slideToggle 展开，siblings 收起别人，return false 挡冒泡
points: ::before 的 content 配合 toggleClass 可做纯 CSS 图标切换 || children(ol) 只收直接子级，find 会把孙子菜单一起卷进来 || siblings 去掉别人的 active 并 slideUp，保证只展开一个 || 选择器 ul li 命中内外两层，return false 必须挡住冒泡 || return false 等于 preventDefault 加 stopPropagation
===BODY===
### 需求与思路

一级标题点开后展开自己的子菜单，再点收起；同一时刻只允许一个展开，所以还要把兄弟的菜单收起来。

展开收起用 `slideToggle`，只改高度，内容不会被横向拉伸。图标交给 CSS：`li::before` 显示 `+`，`li.active::before` 显示 `-`，JS 只切 `active` 类名，不用改结构。

难点在嵌套：`ul li` 会同时命中内外两层，点内层会连带外层一起切换，所以必须拦住冒泡，并用 `children("ol")` 只动直接子级。

### 完整案例代码

```js
// 依赖：引入 jQuery；结构 ul > li > ol > li，CSS 里 li::before 显示 +、li.active::before 显示 -
$("ul").on("click", "li", function (e) {
  e.stopPropagation()                    // ← 关键点：嵌套 li 会层层冒泡，不拦就内外一起开关
  var $li = $(e.target).closest("li")    // ← 关键点：closest 从真正点击的节点往上找最近的 li
  var $sub = $li.children("ol")          // ← 关键点：children 只展开直接子级，find 会把孙子菜单也卷进来

  $li.toggleClass("active")
  $sub.stop(true, true).slideToggle(300) // ← 关键点：先 stop 清队列，否则快速点击会排队慢慢播

  $li.siblings("li")
    .removeClass("active")
    .children("ol").stop(true, true).slideUp(300)
})

$("ul > li > ol").hide()                 // 首屏统一收起，不完全依赖 CSS

console.log($("ul > li").length)         // => 3
console.log($("ul > li > ol:visible").length)   // => 0
```

### 关键知识点

- **`children("ol")` 而不是 `find("ol")`**：`children` 只看直接子级，正好是这一项自己的菜单；`find` 会连孙级 `ol` 也选中，点开 111 会把下级菜单一并展开。
- **`stop()` 必须写在动画前**：jQuery 默认不打断正在跑的动画，而是排进队列。快速连点时队列越积越长，界面像慢动作回放。`stop(true, true)` 清空队列并跳到当前动画终点，从头开始新动画。
- **嵌套必须拦住冒泡**：委托选择器 `li` 命中内层后，事件继续冒泡到外层 `li`，又会执行一次开关，刚展开立刻收起。`e.stopPropagation()`（或 `return false`）只处理最内层那个。
- **用 `closest` 定位当前项**：点击目标可能是文字节点旁的任意元素，`closest("li")` 从它往上收敛到所属的那一项，比依赖 `this` 更稳，也方便以后给标题套 `span` 或图标。
===CH===
no: 146
title: 案例-手风琴
lessons: 175
summary: mouseover 时自己变宽兄弟变窄都用 stop().animate，mouseleave 绑在 ul 上统一复位
points: 宽度分配要守恒，当前 520 加其余 40×3 正好等于容器 640 || stop 要写在每个 animate 前，链式里一个 stop 管不了两批元素 || 不加 stop 时动画排队，快速扫过会像慢动作逐个回放 || mouseleave 不冒泡且绑在 ul 上，从 li1 移到 li2 不触发 || overflow:hidden 让变窄时图片被裁切而非溢出压到隔壁
===BODY===
### 需求与思路

鼠标移到某张图上，它变宽、其余三张被挤压变窄，移出整组后四张一起复位。

容器宽 640，四张初始各 160；悬停时当前 520、其余各 40，`520 + 40×3` 仍等于 640，所以动画途中布局不会被撑破。

`li` 上监听 `mouseover`，自己变宽、`siblings()` 取到其余三项一起变窄；复位绑在 `ul` 的 `mouseleave` 上，只在移出整个容器时触发。动画用 `animate` 自定义宽度。

### 完整案例代码

```js
// 依赖：引入 jQuery；ul 宽 640 用 flex 排四个 li（各 160），li 内图片固定宽度并设 overflow:hidden
var W_ACTIVE = 520
var W_IDLE = 40
var W_BASE = 160

$("ul li").on("mouseover", function () {
  $(this).stop(true)                       // ← 关键点：先清掉自己身上的旧动画，否则快速扫过会排队慢放
    .animate({ width: W_ACTIVE }, 300)
    .siblings()                            // ← 关键点：siblings 一次拿到另外三项，同一时刻只留自己展开
    .stop(true)                            // ← 关键点：换了新集合要再 stop 一次，链式前面的 stop 管不到它
    .animate({ width: W_IDLE }, 300)
})

$("ul").on("mouseleave", function () {
  $("ul li").stop(true).animate({ width: W_BASE }, 300)   // ← 关键点：复位绑在 ul 上，移出整组才触发一次
})

// 竖向手风琴把 width 换成 height，或直接用 slideToggle()，stop + siblings 的骨架不变

console.log($("ul li").length)              // => 4
console.log(W_ACTIVE + W_IDLE * 3)          // => 640
```

### 关键知识点

- **同一时刻只展开一项，靠 `siblings()`**：自己变宽的同时把兄弟压到 40px，所以任何时刻只有一张是展开态。若只改自己不动兄弟，四张宽度之和会超过 640，最后一张被挤出容器或被 flex 强行压缩，出现变形。
- **宽度守恒是前提**：520 加三个 40 刚好等于容器宽，动画每一帧的总和都不变，其他项只是被匀出去的空间。随手把目标值写成 500 或 600，总和就和容器对不上，动画途中会看到空白或回弹。
- **`stop(true)` 要写在每个 `animate` 之前，且两批元素各写一次**：jQuery 默认不打断动画而是排队，鼠标扫过四张就会排出四个动画轮流播放。`siblings()` 返回的是新集合，前面那次 `stop` 只作用于原来的自己，兄弟还得再停一次。
- **复位绑在 `ul` 而不是 `li`**：`mouseleave` 不冒泡，绑在父级时从一张图移到另一张仍算在容器内部，不会触发归零。若绑在 `li` 上，每次跨过一张都复位一次，画面会不停抖。变窄时图片超出部分靠 `overflow:hidden` 裁掉，不然会压到隔壁。
===CH===
no: 147
title: 案例-滑动选项卡
lessons: 176
summary: 用绝对定位的色块当滑块，鼠标移到第几个 li 就 animate 它的 left 到序号乘宽度
points: 滑块位置等于 index() 乘单元宽，索引和像素直接换算 || 更稳的写法是 position().left，flex 均分时不依赖固定宽度 || 滑块 z-index 要低于 li，否则会盖住文字挡鼠标事件 || stop 必加，快速划过才能打断上一个立刻朝新目标去 || 这类跟随鼠标的动画与手风琴同理，都靠 stop 防堆积
===BODY===
### 需求与思路

一行标题上放一条色块当滑块，鼠标移到第几个标题，色块就滑到它下面。

`ul` 设 `position:relative` 当定位父级，色块绝对定位、`left` 从 0 起，所以它的水平位置就等于「第几格 × 单项宽」。

序号用 `index()` 现算，换算成像素后交给 `animate`，200ms 滑过去。动画前先 `stop(true)`，让新目标打断上一次滑动；色块的 `z-index` 必须低于 `li`，否则会盖住标题、让鼠标事件落空。

### 完整案例代码

```js
// 依赖：引入 jQuery；ul 相对定位装 6 个 li（各 100px），ul 里再放一个空 div 当滑块
var UNIT = 100                            // 单项宽度，必须和 CSS 里 li 的宽一致

$("ul li").on("mouseover", function () {
  var index = $(this).index()             // ← 关键点：index 现算序号，滑块位置 = 序号 × 单项宽
  $("ul div")
    .stop(true)                           // ← 关键点：先打断上一次滑动，再 animate，快速划过才不会一顿顿追
    .animate({ left: index * UNIT }, 200) // ← 关键点：left 相对 ul 计算，第 2 格就是 200px
})

$("ul div").css("left", 0)                // 首屏滑块停在第 0 格，与默认高亮项对齐

// 宽度由 flex 均分、不是整数时，改用真实偏移（写在 mouseover 回调里）：
// left: $(this).position().left

console.log($("ul li").length)            // => 6
console.log($("ul li").eq(2).index())     // => 2
console.log($("ul li").eq(2).index() * UNIT)   // => 200
```

### 关键知识点

- **滑块位置就是索引乘单项宽**：`index()` 返回 0 起的下标，乘上 `li` 的实际宽度即目标 `left`，中间不做任何累加。若用循环累加每个 `li` 的宽度，一旦某一项宽度不同就会越算越偏。
- **`index() * 100` 依赖固定宽度**：写法最短，但宽度交给 flex 均分或加了间距时，乘出来的值就和真实位置对不上。改用 `$(this).position().left` 直接读真实偏移更稳，代价是要求元素已经渲染完成。
- **先 `stop` 再 `animate` 才不会抖**：滑块的动画目标是唯一的，快速从第一格划到第六格时，不加 `stop` 会排出一串中间位置逐个补跑，滑块明显滞后；加了 `stop(true)` 每次都打断旧动画、直接朝新目标去。
- **滑块必须压在文字下面**：`li` 给 `z-index:100`、滑块不给，鼠标事件永远落在标题上。若把滑块放上层，它滑过去就盖住标题，鼠标此刻「站在滑块上」，`mouseover` 不再触发，页面看起来像卡住。
