===PART===
id: part-07
order: 7
title: DOM 进阶：节点与事件
range: 087–107
desc: 掌握节点操作与尺寸测量，理解事件流与事件委托
===CH===
no: 58
title: DOM 节点
lessons: 087
summary: 页面标签、文字、注释、属性都是带类型的节点，空白与换行也照样计入节点
points: 元素、属性、文本、注释四类节点各有固定 nodeType || 标签间换行与空格会被解析成文本节点 || childNodes 含全部节点，children 只含元素 || 缩进会让 firstChild 拿到空白文本而非元素 || JS 造的结构与手写结构节点数往往不同
===BODY===
### 页面上的一切都是节点

浏览器解析 HTML 时，会把标签、文字、注释、属性都建成一个个「节点」，再按嵌套关系连成一棵 DOM 树。

**节点是更宽的概念，元素节点只是其中一类**。因此文本、注释、属性同样是节点，只是类型不同，靠 `nodeType` 这个数字区分。

```js
var box = document.querySelector("div")
console.log(box.nodeType)   // => 1（元素节点只是节点的一种）
```

### 四类常见节点对照

`nodeType` 给数字类型，`nodeName` 给名字，`nodeValue` 给值；三者配合便于读出任意节点的身份与内容。

这套编号是固定的，遍历或过滤节点时全靠它判断，下面四类最常用。

| 节点 | 例子 | `nodeType` | `nodeName` | `nodeValue` |
|---|---|---|---|---|
| 元素节点 | `<div>`、`<li>` | 1 | 大写标签名 `DIV` | `null` |
| 属性节点 | `id="box"` | 2 | 属性名 `id` | 属性值 `box` |
| 文本节点 | 文字、换行、空格 | 3 | `#text` | 文本内容 |
| 注释节点 | `<!-- 注释 -->` | 8 | `#comment` | 注释内容 |

> ⚠️ 最容易记反：3 是文本、8 才是注释；`nodeName` 一律大写，写成 `"li"` 永远比较不上。

`document` 本身是编号 9 的节点，了解即可。这三个属性在后面「节点属性」一章会专门用来遍历和过滤节点。

### 空白与换行也是文本节点

标签之间的换行、缩进、空格不会被忽略，而是照样算成文本节点，这是最容易被忽略的一点。

下面这块 `div` 肉眼只有一行文字、一个 `p`、一条注释，实际 `childNodes` 却有 5 个节点。

```html
<div>
    kerwin
    <p>111111</p>
    <!-- 我是注释 -->
</div>
```

- 0：换行 + kerwin + 空格 → 文本节点
- 1：`<p>111111</p>` → 元素节点
- 2：p 之后的换行空格 → 文本节点
- 3：`<!-- 我是注释 -->` → 注释节点
- 4：收尾的换行 → 文本节点

因为空白占了位置，`firstChild` 常常取到空白文本，而不是想要的元素。

### 缩进换一下，节点数就变

节点数取决于 HTML 怎么写，而不是逻辑上有几个标签。把标签紧贴着写、中间不留空白，`childNodes.length` 就从 5 变成 2。

因此得到两条实用结论：

- 手写 HTML 带缩进空白，`createElement` 造的结构只有亲手加进去的节点，两者数量对不上。
- 因为空白捣乱，取首尾子节点不能用 `firstChild`，得改用只认标签的那一套。

### 节点之间的树形关系

节点按嵌套连成树：被包在内部的是子节点，同一父级下并列的是兄弟节点，向外一层是父节点。

因此浏览器提供了一整套查亲戚的属性，下一章会把它们分成「含文本」与「只认元素」两组来讲。

```js
console.log(box.childNodes.length)     // => 5（连空白一起数）
console.log(box.children.length)       // => 1（只有 p）
console.log(box.firstChild.nodeType)   // => 3（拿到的是空白文本）
```

> 💡 控制台里 `childNodes` 列出 `#text`、`p`、`#comment`，`children` 只列标签，差别一眼可见。
===CH===
no: 59
title: 获取节点的方式
lessons: 088
summary: 六对节点属性分成含文本版与只认元素版，实战一律用带 Element 的那一套
points: 带 Element 的属性只认标签，不带则文本注释都算 || children 才是子元素个数，childNodes 是节点个数 || 换行会算成兄弟节点，取相邻元素用 ElementSibling || parentElement 可能为 null，parentNode 更常用 || attributes 返回属性节点伪数组，getAttribute 更简单
===BODY===
### 六对属性，成对记忆

从一个节点出发找亲戚，浏览器给了成组的属性。每一对都分成「含文本与注释版」和「只认元素版」，记法很简单：名字里带 `Element` 的只认标签。

因此实战里几乎只用后者，因为它能挡掉缩进产生的空白文本节点。

| 想要 | 含文本/注释（少用） | 只要元素（推荐） |
|---|---|---|
| 所有子节点 | `childNodes` | `children` |
| 第一个子节点 | `firstChild` | `firstElementChild` |
| 最后一个子节点 | `lastChild` | `lastElementChild` |
| 上一个兄弟 | `previousSibling` | `previousElementSibling` |
| 下一个兄弟 | `nextSibling` | `nextElementSibling` |
| 父节点 | `parentNode` | `parentElement` |
| 所有属性 | `attributes` | —（无对应版本） |

### 子节点：个数完全不一样

`children.length` 才是「有几个子元素」，`childNodes.length` 是「有几个节点」。两者差别全在文本与注释算不算进去。

```js
console.log(box.childNodes.length)   // => 9（文本、注释、元素一起数）
console.log(box.children.length)     // => 2（只有两个 p，干净）
```

正因为 `children` 只返回元素节点，遍历子元素、取首尾时都用它，避免被空白干扰。

### 兄弟节点：换行会算进来

两个 `div` 之间隔着换行时，`previousSibling` 取到的是 `#text`，而不是上一个元素。

因此改相邻元素一律用带 `Element` 的那组，`previousElementSibling` 才会跳过空白、命中真正的兄弟元素。

```js
console.log(box.previousSibling)          // => #text（前面的文字与换行）
console.log(box.previousElementSibling)   // => <div>hello</div>
box.previousElementSibling.innerHTML = "world"   // => 改掉上一个 div 的文字
```

### 父节点与属性集合

父节点这一对平时等价，差别只在根节点：`documentElement.parentNode` 返回 `#document`，而 `parentElement` 因为 `document` 不是元素而返回 `null`。

因此删除节点、往上找父级时更常用 `parentNode`，它不会是 `null`。`attributes` 则返回由属性节点组成的伪数组，读属性用更直接的 `getAttribute` 即可。

```js
console.log(box.parentNode)                          // => <body>
console.log(document.documentElement.parentNode)    // => #document
console.log(document.documentElement.parentElement) // => null
console.log(box.attributes[1].nodeValue)            // => "1"
console.log(box.getAttribute("index"))              // => "1"（更常用）
```

### 怎么选

需求不同，用的属性也不同，认准「带 `Element` 只认标签」这一条就不会错。

- 遍历子元素：用 `children`
- 取首尾子元素：用 `firstElementChild` / `lastElementChild`
- 点谁、改旁边：用 `nextElementSibling` / `previousElementSibling`
- 往上找 `li` 的父级 `ul`：用 `parentNode`
- 读某个属性值：用 `getAttribute`
===CH===
no: 60
title: 节点操作（增删改）
lessons: 089
summary: 创建、插入、替换、删除、克隆五个动作覆盖动态页面的全部节点操作
points: createElement 只造出内存节点，必须插入才显示 || 一个节点只能在一处，重复 appendChild 是移动非复制 || removeChild 要父级调用，remove 让自己删自己 || cloneNode(true) 深克隆含后代，false 只克隆空壳 || 克隆会带 id 且不复制事件，需手动处理
===BODY===
### 五个动作一套 CRUD

动态页面归根到底是对节点做五件事：造一个、放进去、换掉或删掉、再复制一份。整套 API 都挂在节点或 `document` 上，按动作归类如下。

| 动作 | 方法 | 说明 |
|---|---|---|
| 创建元素 | `document.createElement("div")` | 只在内存里，不显示 |
| 创建文本 | `document.createTextNode("文字")` | 少用，`innerHTML` 更方便 |
| 追加 | `父.appendChild(新)` | 放到最后一个子之后 |
| 插入 | `父.insertBefore(新, 参照)` | 放到参照元素之前 |
| 替换 | `父.replaceChild(新, 旧)` | 新在前、旧在后 |
| 删除子 | `父.removeChild(子)` | 父级调用，兼容性好 |
| 删除自己 | `自己.remove()` | 最省事，老 IE 不支持 |
| 克隆 | `节点.cloneNode(true/false)` | `true` 深克隆含后代 |

### 创建：元素先停在内存里

`createElement` 造出的元素还不在页面上，因此必须先设好属性和内容，再插入文档才看得见。这就是「创建不等于显示」。

```js
var odiv = document.createElement("div")
odiv.className = "aaaa"
odiv.innerHTML = "新节点"
console.log(odiv)   // => <div class="aaaa">新节点</div>（仍在内存里）
```

### 插入：appendChild 与 insertBefore

`appendChild` 追加到末尾，`insertBefore` 放到参照元素之前。参照元素必须是同一父级下已存在的元素，否则会报错。

要特别注意：一个节点同时只能待在一个位置。对已存在的节点再 `appendChild`，效果是「移动」而不是「复制」，因为浏览器不会凭空多造一份。

```js
box.appendChild(odiv)          // => 放到 box 内部最后
box.insertBefore(odiv, child)  // => 改放 child 之前（移动，仍是同一个节点）
```

### 替换：replaceChild

`replaceChild(新, 旧)` 用新节点换掉旧节点，参数顺序是「新的在前、旧的在后」，写反就换错了对象。

因此它适合整块内容改版，而只是改文字时用 `innerHTML` 更省事。

> ⚠️ 被替换掉的旧节点并没有立刻销毁，只是脱离了文档；若还留着引用，仍可再插回别处。

### 删除：removeChild 与 remove

删除有两条路：`父.removeChild(子)` 要同时拿到父子两个节点，兼容性好；`自己.remove()` 只要自己，最省事，但老 IE 不支持。

因此删除动态创建的整行时，常用 `this.parentNode.remove()` 这种顺着 `this` 往上找的写法。

- `removeChild`：父级调用，需要「父 + 子」
- `remove`：自己调用，只要「自己」

### 克隆：cloneNode 与三个坑

`cloneNode(true)` 连同后代与文字一起复制，`cloneNode(false)` 只复制自己的标签和属性、里面是空的。因此 `true` 适合整块复制，`false` 只用于造一个空壳。

```js
var c = box.cloneNode(true)   // => 连同后代与文字一起复制
c.id = "box2"                 // => 必须改 id，避免重复
document.body.appendChild(c)  // => 克隆体进入页面
```

> ⚠️ 克隆有三个坑：`id` 会一起复制导致重复；`onclick` 或 `addEventListener` 绑的事件不会被克隆，因为它们是 JS 属性、不在 HTML 结构里；表单当前值也不一定跟着走。
===CH===
no: 61
title: 案例：动态删除
lessons: 090
summary: 动态元素在创建时就绑定事件，点击后借 this.parentNode.remove() 删掉整行
points: 谁创建谁绑事件，按钮还没进页面就已绑好处理函数 || this 是被点按钮，取 parentNode 即整行 li || 不能在循环外提前取按钮，那时结果是 null || onclick 存函数名，写成 handler() 会立刻执行 || 事后新增元素须重绑，这一痛点由事件委托解决
===BODY===
### 需求与思路

列表内容来自数据，每行末尾跟一个 delete 按钮，点按钮删掉整行。难点在按钮是循环里才创建的：循环外 `querySelector` 取到 `null`，逐个绑事件又要在每次新增时重绑。

所以改成把点击绑在父级 `ul` 上，靠冒泡统一处理，再用 `e.target` 判断点中的是不是按钮。删除时从按钮往上取 `li` 摘掉，最后检查列表是否已空，空了补一条提示。

### 完整案例代码

```js
// 案例：动态删除。假设页面已有空的 <ul id="list">，用来承载动态生成的行
var list = document.querySelector("#list")
var arr = ["111", "2222", "333"]

// ① 先造后填：每行文字加一个删除按钮，按钮不单独绑事件
arr.forEach(function (text) {
  var li = document.createElement("li")
  li.innerHTML = text + ' <button>delete</button>'   // ← 关键点：按钮随行一起生成，不必逐个绑定
  list.appendChild(li)
})

// ② 事件委托：整段列表只在父级 ul 上绑一次
list.onclick = function (e) {
  if (e.target.nodeName !== "BUTTON") return          // ← 关键点：点到文字不算删除，用 e.target 判断
  var li = e.target.parentNode                        // ← 关键点：this 是 ul，得从按钮往上找整行
  list.removeChild(li)                                // 等价于 li.parentNode.removeChild(li)
  if (list.children.length === 0) {                   // ← 关键点：删空后兜一句提示，避免整页空白
    list.innerHTML = "<li>暂无数据</li>"
  }
}
console.log(list.children.length)                     // => 3
```

### 关键知识点

- **事件委托只在父级绑一次**：按钮是循环里造出来的，绑在按钮上就得「谁创建谁绑」，事后 `appendChild` 进来的新行还得再绑一遍，漏一处就失效。绑在 `ul` 上靠冒泡收消息，一次绑定覆盖所有现有和未来的行。
- **用 e.target 判断点的是什么**：点击会冒泡到 `ul`，但点 `li` 上的文字也会进来，不先判 `e.target.nodeName === "BUTTON"` 就 `return`，点文字也会把整行删掉。注意 `nodeName` 返回大写，写成 `"button"` 永远不成立。
- **顺着 parentNode 才删得到整行**：委托里 `this` 是绑定事件的 `ul`，删的不是行。必须 `e.target.parentNode` 取到 `li` 再 `removeChild`；若写 `e.target.remove()`，只删掉按钮，文字还留在页面上。
- **删空要兜底**：删到 `children.length === 0` 时列表一片空白，用户会以为页面出错，补一条「暂无数据」提示，体验才完整。
===CH===
no: 62
title: 节点属性
lessons: 091
summary: nodeType 看类型、nodeName 看名字、nodeValue 看值，三者配合可遍历并过滤节点
points: 1 元素、2 属性、3 文本、8 注释，编号固定 || 元素节点 nodeValue 为 null，nodeName 是大写标签名 || 属性节点从 attributes 取，nodeValue 是属性值 || 遍历时用 nodeType === 1 过滤，等价于 children || 判断标签用大写 nodeName，别写成小写
===BODY===
### 三个属性各管一件事

`nodeType` 给数字类型，`nodeName` 给名字，`nodeValue` 给值。三者配合，便于遍历任意一堆混杂节点并挑出想要的部分。

| 属性 | 返回内容 | 值类型 | 主要用途 |
|---|---|---|---|
| `nodeType` | 节点类型编号 | `number` | 遍历时过滤 |
| `nodeName` | 节点名字（大写） | `string` | 判断是什么标签 |
| `nodeValue` | 文本、注释或属性值 | `string` / `null` | 读取节点内容 |

> ⚠️ 常见记反：`nodeType === 3` 是文本节点、8 才是注释节点；`nodeName` 一律大写，比较时写 `"li"` 永远不成立。

### 遍历时用 nodeType 过滤

遍历 `childNodes` 时打印 `nodeValue`，文本与注释会给出各自的文字，元素节点则是 `null`。

因此想跳过空白和注释只处理元素，判断 `nodeType === 1` 即可，效果等价于直接读 `children`，只是后者更省事。

```js
var obox = document.querySelector(".box")
for (var m = 0; m < obox.childNodes.length; m++) {
    if (obox.childNodes[m].nodeType === 1) {
        console.log(obox.childNodes[m].nodeName)   // => "DIV"
    }
}
console.log(obox.children)   // => 等价结果，只列元素
```

### 属性节点与 getAttribute

`attributes[0]` 是 `class="box"` 这个属性节点，它的 `nodeValue` 才是 `"box"`。

因此读属性更简单、更常用的写法仍是 `getAttribute`，不必绕到属性节点上。

```js
console.log(obox.attributes[0].nodeValue)   // => "box"
console.log(obox.getAttribute("class"))     // => "box"（更简单）
```

### 节点属性与元素属性不是一回事

`nodeType` / `nodeName` / `nodeValue` 是节点固有的、只读的描述信息，反映的是「这个节点是什么」。

而 `id`、`class`、`style` 这类是元素属性，可读可写，用 `getAttribute` 或点语法操作，反映的是「标签上写了什么」。因此两者不要混用。

| 对比 | 节点属性 | 元素属性 |
|---|---|---|
| 例子 | `nodeType`、`nodeName`、`nodeValue` | `id`、`class`、`title` |
| 读写 | 只读 | 可读可写 |
| 取值 | 由节点类型决定 | 由 HTML 写法决定 |
| 常用 API | 遍历过滤、`children` | `getAttribute` / `setAttribute` |

### nodeName 的实战用途

`nodeName` 最常见的用途是事件委托里判断点中了什么标签，例如 `e.target.nodeName === "LI"`。

因为它返回大写标签名，比较时务必写大写，写成小写会静默失败、很难排查。

> 💡 `nodeType` 多用于理解原理、处理富文本节点或调试；日常做页面有 `children` 加 `nodeName` 就够了。
===CH===
no: 63
title: 获取元素尺寸
lessons: 092
summary: offset 含边框、client 不含边框、scroll 是内容真实尺寸，三者都是无单位数字
points: offsetWidth 含 padding 与 border，clientWidth 不含 border || scrollHeight 大于 clientHeight 即内容溢出出现滚动 || 三值都是 number，getComputedStyle 带 px 是字符串 || display:none 时尺寸全为 0，visibility:hidden 仍能取到 || margin 不计入任何 offset/client，量间距另用其他办法
===BODY===
### 三组尺寸的包含关系

量元素尺寸有三组属性，分界在于「含不含边框」和「算不算溢出内容」。三者返回的都是数字，不带单位，因此可以直接参与运算。

| 属性 | 包含 | 不含 | 典型用途 |
|---|---|---|---|
| `offsetWidth` / `offsetHeight` | content + padding + border + 滚动条 | margin | 元素占地多少 |
| `clientWidth` / `clientHeight` | content + padding | border、margin、滚动条 | 可视区多大 |
| `scrollWidth` / `scrollHeight` | content（含溢出部分） | — | 内容真实多高 |
| `getComputedStyle(el).width` | CSS 写定的宽度 | — | 看样式值 |

`scrollHeight > clientHeight` 就是内容溢出的可靠信号，常用于判断该不该出现滚动条。

### 盒子模型示意

为什么 `offsetWidth` 比 `clientWidth` 大？因为前者多算了左右边框。下面按 `box-sizing: border-box` 拆开看。

```text
元素总宽 100px（border-box）
┌─ border 5 ─┬─ padding 10 ─┬─ content 70 ─┬─ padding 10 ─┬─ border 5 ─┐
offsetWidth  = 100   （含两侧 border）
clientWidth  = 100 - 5 - 5 = 90   （扣掉 border）
scrollWidth  随内容变化，溢出时大于 90
```

- `offset`：量的是元素整体占地，含边框
- `client`：量的是内边距以内的可视区，不含边框
- `scroll`：量的是内容真实尺寸，含被滚动条藏起来的部分

### 用 box-sizing 算一遍

给元素设 `box-sizing: border-box; width: 100px; padding: 10px; border: 5px`，总宽被压在 100 里，于是 `offsetWidth` 是 100、`clientWidth` 是 90。

去掉 `border-box` 后两者分别变成 130 和 120，因为这时 padding 与 border 都往外加。

```js
console.log(box.offsetWidth)                      // => 100
console.log(box.clientWidth)                      // => 90
console.log(box.scrollHeight > box.clientHeight)  // => true 表示内容溢出
```

### 三条注意事项

这三组值是 `number`，而 `getComputedStyle` 返回带 `px` 的字符串，要 `parseInt` 才能算，因此前者可直接参与运算。

元素的隐藏方式会决定尺寸能不能取到：

- `display: none`：不再占位，浏览器干脆不算，所有尺寸都是 0。
- `visibility: hidden`：仍占位，尺寸照常可取。
- `opacity: 0`：仍占位，尺寸照常可取。

因此要给隐藏元素量尺寸，得先临时显示、量完再藏回去。

```js
console.log(typeof box.offsetWidth)          // => "number"
console.log(getComputedStyle(box).width)     // => "100px"（字符串）
box.style.display = "none"
console.log(box.offsetWidth)                 // => 0
box.style.visibility = "hidden"
console.log(box.offsetWidth)                 // => 100（仍占位，能取到）
```

### margin 与元素间距

`margin` 是元素与外部的距离，不属于元素自身尺寸，因此不计入任何 `offset` / `client` 组。

要算两个元素之间的真实距离，得手动把 `margin` 加上，或改用 `getBoundingClientRect()`，它返回的盒模型会反映外部间距。
===CH===
no: 64
title: 获取元素偏移量
lessons: 093
summary: offsetLeft/Top 相对最近的定位父级，祖先都没定位时才相对 body 累加
points: offsetParent 是最近的有定位祖先，都没定位则是 body || 给中间层加 position:relative，offsetLeft 立刻改基准 || clientLeft/clientTop 是边框厚度，名字反直觉 || getBoundingClientRect 相对视口且受滚动影响 || 判断进视口、吸顶、拖拽边界都要用到偏移量
===BODY===
### 参考点是定位父级

`offsetLeft` / `offsetTop` 量的是元素边框到 `offsetParent` 内边距区域的距离，不是到页面左上角的距离。

`offsetParent` 就是「绝对定位时会以谁为基准」的那个祖先，规则与 CSS 定位完全一致。

| 属性 | 含义 / 参考点 |
|---|---|
| `offsetLeft` / `offsetTop` | 到 `offsetParent` 的横向 / 纵向距离 |
| `offsetParent` | 最近的 `relative` / `absolute` / `fixed` 祖先；都没有则为 `body` |
| `clientLeft` / `clientTop` | 左边框 / 上边框的厚度，名字反直觉 |
| `getBoundingClientRect()` | 相对视口，返回 `left/top/width/height`，受滚动影响 |

### 定位参照物会改变结果

三层 `div` 各带 `margin: 50px` 且都没定位时，三层的偏移分别是 50、100、150，因为都以 `body` 为参考，外层的 margin 被层层累加进来。

因此给中间那层加上 `position: relative` 后，最内层的 `offsetLeft` 立刻变成 50，只相对于新的定位父级，不再叠加外层的 margin。

```js
console.log(child.offsetLeft, child.offsetTop)   // => 150 150（都没定位）
console.log(myparent.offsetLeft)                  // => 100
console.log(child.offsetParent)                   // => <body>
myparent.style.position = "relative"
console.log(child.offsetLeft)                     // => 50（改以 myparent 为基准）
```

### 与 style.left 不是一回事

`offsetLeft` 是只读数字，浏览器根据布局算出来；`style.left` 是字符串，读的只是内联样式里写的值，还带着 `px`。

因此两者常对不上：没写内联 `left` 时 `style.left` 是空字符串，而 `offsetLeft` 照样有值。改位置要用 `style.left`，读位置该用 `offsetLeft`。

```js
console.log(box.offsetLeft)      // => 50（number，只读）
console.log(box.style.left)      // => ""（没写内联样式）
box.style.left = "80px"          // => 用 style 改位置，要带单位
```

> ⚠️ `style.left` 只对定位元素生效；普通流里的元素设了也不动。

### clientLeft 与 clientTop

`clientLeft` / `clientTop` 量的是左边框、上边框的厚度，名字很像坐标，其实和「客户端」毫无关系。

因此看到它们别当成距离，只有当元素有边框、需要扣掉边框厚度时才用得上。

### 三种距离别混

`offsetLeft` 相对定位父级，是数字，跨层级要自己累加；`getBoundingClientRect()` 相对视口，一次拿到 `left`、`top`、`width`、`height`，滚动后值会变。

因此要把它换算成相对页面，得加上 `scrollTop`；鼠标事件的 `clientX` 一类坐标属于另一套体系，放到鼠标坐标那章讲。

```js
var rect = box.getBoundingClientRect()
console.log(rect.left, rect.top)        // => 距离视口左边 / 上边
console.log(rect.width, rect.height)   // => 含变换后的尺寸
```
===CH===
no: 65
title: 获取可视窗口的尺寸
lessons: 094
summary: innerWidth 含滚动条，documentElement.clientWidth 不含，且尺寸是此刻值需重取
points: window.innerWidth 含滚动条，documentElement.clientWidth 不含 || 两者差值约等于滚动条宽度，Windows 上约 17px || 判断滚到底要用 clientHeight 而非 innerHeight || 窗口缩放或横竖屏切换后必须重新读取 || 移动端 rem 适配靠 clientWidth 动态算根字号
===BODY===
### 两套读法，分界在滚动条

视口宽度有两套读法。`window.innerWidth` / `innerHeight` 把滚动条算进去，`document.documentElement.clientWidth` / `clientHeight` 量的是不含滚动条的干净内容区。

页面没有滚动条时两者相等，差值通常就是滚动条宽度（Windows 上约 15–17px）。

| 写法 | 含滚动条 | 何时用 |
|---|---|---|
| `window.innerWidth` / `innerHeight` | 含 | 一般情况 |
| `document.documentElement.clientWidth` | 不含 | 精确知道内容区多大 |
| `document.documentElement.clientHeight` | 不含 | 判断滚动到底、算懒加载 |

### 兼容写法与差值

老式怪异模式下 `documentElement` 可能取不到值，因此稳妥的写法会一路回退到 `body.clientWidth`、再到 `window.innerWidth`。

两者相减就能验证滚动条宽度；判断「滚到底」要用 `clientHeight`，因为它对应真正能显示内容的区域。

```js
var w = document.documentElement.clientWidth
      || document.body.clientWidth
      || window.innerWidth
console.log(window.innerWidth - w)   // => 17（约等于滚动条宽度）
```

### 与 38 章 BOM 的对照

`window.innerWidth` 属于 BOM，面向浏览器窗口；`documentElement.clientWidth` 属于 DOM，面向文档内容。

因此这其实是把 BOM 侧讲过的视口尺寸从 DOM 侧再量一遍，面试常问两者区别，答案就是滚动条。

> 💡 记忆结论：`inner` 含滚动条，`client` 不含。

### 尺寸是此刻的，不是固定的

把尺寸读进变量就定死了，而窗口缩放、手机横竖屏切换都会让它变化。

因此凡是「算一次存起来到处用」的写法都有风险，正确做法是在 `resize` 回调里重新取。移动端做 `rem` 适配同样依赖这个即时值。

```js
window.onresize = function () {
    console.log(document.documentElement.clientWidth)   // => 变化后的新宽度
}
var html = document.documentElement
html.style.fontSize = html.clientWidth / 10 + "px"
console.log(html.style.fontSize)   // => "192px"（屏宽 1920 时）
```
===CH===
no: 66
title: 案例：上拉加载
lessons: 095
summary: 列表底部与可视区底部接近时加载下一页，用开关变量防止重复请求
points: 渲染用 appendChild 追加，innerHTML 覆盖会冲掉第一页 || 列表底相对页面顶与视口底相差小于阈值即到底 || onscroll 高频触发，isLoading 上锁避免疯狂请求 || scrollTop 可能是小数，Math.round 取整防判断失败 || 这是追加新数据，与图片懒加载不是一回事
===BODY===
### 需求与思路

列表数据分页返回，首屏渲染第一页，用户滚到接近底部时自动追加下一页。判断到底不必去算列表高度，直接看已滚距离加可视高度有没有追平文档总高。

滚动事件一秒触发几十次，而请求是耗时的，所以要用开关锁住，保证同一时间只有一页在请求；页数用尽后解绑事件，省掉后续的无效判断。

### 完整案例代码

```js
// 案例：上拉加载。假设页面已有 <ul id="list">，列表是页面主体内容，首屏数据足以撑出滚动条
var list = document.querySelector("#list")
var pages = [["1", "2", "3"], ["4", "5", "6"]]   // 模拟后端按页返回的数据
var page = 0
var totalPage = 2
var isLoading = false
var hasMore = true

function renderHTML(arr) {
  arr.forEach(function (text) {
    var li = document.createElement("li")
    li.textContent = text
    list.appendChild(li)          // ← 关键点：追加而不是 innerHTML 覆盖，否则上一页被冲掉
  })
}
renderHTML(pages[page++])         // 首屏渲染，page 随之变成 1

window.onscroll = function () {
  if (isLoading || !hasMore) return    // ← 关键点：上锁加没更多，保证同一时间只发一个请求
  var doc = document.documentElement
  var scrollTop = doc.scrollTop || document.body.scrollTop
  if (scrollTop + doc.clientHeight < doc.scrollHeight - 50) return   // ← 关键点：视口底没追平文档底就不请求
  isLoading = true
  setTimeout(function () {             // 用定时器模拟 ajax 的耗时
    renderHTML(pages[page++])
    isLoading = false                  // ← 关键点：请求回来才解锁，否则会重复追加同一页
    if (page >= totalPage) {
      hasMore = false
      window.onscroll = null           // ← 关键点：没有更多就解绑，省掉后续每次滚动的判断
      var tip = document.createElement("li")
      tip.textContent = "没有更多了"
      list.appendChild(tip)
    }
  }, 800)
}
```

### 关键知识点

- **到底判定就是三个值相加比较**：`scrollTop + clientHeight` 是视口底部到文档顶部的距离，`scrollHeight` 是文档总高，前者追平后者即为到底。减 50 是提前量，让用户在真正滚到底之前就看到新数据。若列表只占页面一部分，这个公式会误判，要换成 `list.offsetTop + list.offsetHeight` 与视口底部比。
- **isLoading 上锁是节流的核心**：滚动过程中 `onscroll` 触发几十上百次，而请求还没回来时页面高度没变，条件一直成立，不加锁就会同时发几十个请求、把同一页追加几十遍。因此进函数先 `return`，请求结束才解锁。
- **一次只请求一页**：页码在 `renderHTML` 之后才自增，若在发请求前就 `++`，请求失败会白白跳过一页；同一时刻只允许一个请求在飞，顺序才可控。渲染也必须 `appendChild` 追加，用 `innerHTML =` 会把前面的数据整体冲掉。
- **没有更多就解绑**：`page` 追平 `totalPage` 后置 `hasMore = false` 并把 `window.onscroll` 置为 `null`，否则每次滚动仍要读一遍 `scrollHeight`、跑一次判断，纯属浪费。
===CH===
no: 67
title: 初识事件
lessons: 096
summary: 事件三要素是源、类型、处理函数，绑定推荐可绑多个的 addEventListener
points: 事件由用户或浏览器触发，不是代码自己调用的 || DOM0 的 onclick 后赋覆盖先赋，只能绑一个 || addEventListener 可绑多个、类型不写 on、按序执行 || 第三参控制捕获，默认 false 走冒泡 || 处理函数里 this 指向绑定事件的那个元素
===BODY===
### 什么是事件

事件是用户操作或浏览器行为发出的信号，比如点击、滚动、页面加载完成。

它**不是代码自己调用的**，处理函数只是提前登记好，等信号到来时被自动叫醒。因此 `oDiv.onclick = fn` 里的 `fn` 何时执行，由用户决定，而不是由赋值语句决定。

> ⚠️ 把处理函数当成「存起来等叫醒」，就不会误以为 `onclick = fn()` 也能绑定。

### 事件三要素

一个事件由三样东西组成：事件源（谁）、事件类型（什么动作）、处理函数（触发后干什么）。

写成 `oDiv.onclick = function () { … }` 时三者一一对应，缺一个都无法完成绑定，所以绑定前先认清这三样分别是什么。

| 要素 | 对应 | 说明 |
|---|---|---|
| 事件源 | `oDiv` | 谁触发 |
| 事件类型 | `click` | 什么动作 |
| 处理函数 | `function () {}` | 触发后做什么 |

### 三种绑定方式对照

绑事件有三种写法，差别集中在「能绑几个」「类型带不带 on」和 `this` 指向。

| 对比项 | DOM0 `onxxx` | DOM2 `addEventListener` | IE `attachEvent` |
|---|---|---|---|
| 事件类型 | 作属性写 `onclick` | `"click"`，不带 on | `"onclick"`，要带 on |
| 绑定多个 | 否，后者覆盖前者 | 是，按注册顺序执行 | 是，倒序执行 |
| 参数 | 无第三参 | 第三参控制捕获，默认 `false` | 无第三参 |
| `this` 指向 | 事件源 | 事件源 | `window` |
| 浏览器 | 全部 | 标准浏览器 | IE 6-8 |

> ⚠️ `addEventListener` 写成 `"onclick"` 不报错，但永远不触发，是最常见的低级错误。

### 为什么推荐 addEventListener

DOM0 只能挂一个处理函数，后赋值的把先赋值的覆盖掉，解绑就是置 `null`。

因此要绑多个互不覆盖的回调、或控制捕获阶段时，用 `addEventListener`，这也是现代项目的推荐做法。`attachEvent` 是老 IE 的私有方案，现在浏览器里根本不存在，认识即可。

```js
box2.addEventListener("click", function () { console.log("1") })
box2.addEventListener("click", function () { console.log("2") })
// => 点击依次输出 1、2（按注册顺序）
```

### this 与手动触发

处理函数里的 `this` 指向绑定事件的那个元素，前面选项卡、动态删除都在靠它定位当前项。

要手动触发一次点击用 `box.click()`；而 `box.onclick()` 只是把存着的那个函数执行了一遍，不产生事件对象，因此页面没有真正的点击效果。

```js
box.onclick = function (e) {
    console.log(this === box)   // => true
    console.log(e)              // => 点击时为事件对象
}
box.onclick()   // => undefined（没有事件对象）
box.click()     // => 打印事件对象
```
