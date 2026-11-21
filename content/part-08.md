===PART===
id: part-08
order: 8
title: ES6 新语法
range: 119–125
desc: 用 let/const、箭头函数、解构与模块化改写老写法
===CH===
no: 90
title: ES6 定义变量
lessons: 119
summary: let/const 把作用域收进花括号，并强制先声明后使用、禁止重复声明
points: var 会提升且只认函数作用域 || let/const 必须先声明后使用，重复声明报错 || const 锁的是绑定，对象内部属性仍可改 || 提前访问 let 会落入暂时性死区并报错 || 优先 const，确实要改值才换 let
===BODY===
### var 留下的三个历史问题

ES6 之前只有 `var` 能声明变量。因为它的提升与作用域规则太宽松，代码容易留下难以察觉的错误，`let` 与 `const` 正是为替换它而加入的。

#### 变量提升：声明被拉到最前

`var` 声明会被预解析提到当前作用域最前，赋值却留在原处。所以声明之前读取不会报错，只得到 `undefined`，容易让人误判变量已就绪。

下面这段演示声明前读取的结果：

```js
console.log(a)      // => undefined，没报错但也没值
var a = 100
```

引擎眼里它等价于先写 `var a`、再打印、最后才 `a = 100`，所以拿到的是 `undefined`。

#### 只有函数能限制作用域

`var` 只被函数边界限制，`if`、`for` 的花括号关不住它。因此块里声明的计数器，循环结束后在外层依然可见、依然可读。

#### 允许重复声明

同一个 `var` 名字可以反复声明，后者悄悄覆盖前者。写错变量名不会立刻报错，问题往往拖到运行结果异常时才暴露。

| 历史问题 | 典型现象 | 带来的后果 |
|---|---|---|
| 变量提升 | 声明前读取得 `undefined` | 误以为变量已有值 |
| 函数作用域 | `if` / `for` 块内变量外泄 | 循环计数器污染外层 |
| 重复声明 | 同名 `var` 互相覆盖 | 拼写错误被静默吞掉 |

这三点都源于同一件事：`var` 没有真正的块级边界。理解它，才能明白 `let` 每条新规则针对的是什么。

### let：先声明后使用，且不许重名

`let` 用来声明可以重新赋值的变量。它保留 `var` 的赋值能力，但补上三条约束，目的就是把上面那些隐蔽错误挡在更早的阶段。

必须先声明再使用。提前访问 `let` 变量不会得到 `undefined`，而是直接抛出 `ReferenceError`，这一点在讲暂时性死区时展开。

不允许同一作用域内重复声明。因为名字冲突本就是拼写错误，`let` 把它变成语法错误，能更早发现问题。

块级作用域是第三条。任何一对 `{}` 都能把 `let` 变量关在里面，块外访问即报错，这正是 `var` 做不到的部分。

```js
let count = 1
count = 2                 // 可以重新赋值
// let count = 3          // 取消注释会报重复声明
{
    let inner = 10
    console.log(inner)    // => 10
}
console.log(count)        // => 2
// console.log(inner)     // => 块外访问会报 ReferenceError
```

注意块级作用域对 `for` 尤其重要。`let` 让每轮循环各有一份独立的 `i`，批量绑定事件时不再需要额外存索引。

### const：声明即赋值，锁的是绑定

`const` 声明常量，声明时必须同时赋初值。因为它表示"这个名字以后不会再指向别处"，少了初值就无从锁定。

不能重新赋值。给 `const` 变量整体赋值会抛 `TypeError`，这样能保证引用稳定，避免中途被意外改写。

#### const 锁的是绑定，不是内容

最容易误解的一点：`const` 锁住的是变量与值之间的引用，而不是值本身。所以对象的属性照常可以增删改，`push` 数组也没问题。

```js
const obj = { name: "kerwin" }
obj.name = "xiaoming"        // 可以：改的是属性
obj.age = 18                 // 可以：加属性
// obj = {}                  // 报错：换了引用
console.log(obj)             // => { name: "xiaoming", age: 18 }
const arr = [1, 2]
arr.push(3)                  // 可以：改内容
console.log(arr)             // => [1, 2, 3]
```

想连内容一起冻结，可用 `Object.freeze()`。注意它是浅冻结，嵌套对象里的属性仍然可改。

另外，顶层 `let`、`const` 声明不会挂到 `window` 上。因为它们是全局作用域里的独立绑定，不再是全局对象的属性，这一点与 `var` 不同。

### 暂时性死区 TDZ

从进入作用域到执行到声明语句之间，变量已经存在却不允许访问，这段区间叫暂时性死区，简称 TDZ。

`let`、`const` 都有 TDZ。提前触碰直接抛 `ReferenceError`，而 `var` 因为声明被提升，只会给出一个 `undefined`。

这样设计的意义是让"用了才发现没声明"在第一行就炸出来。因为返回 `undefined` 会让错误继续往下算，最后得到一个莫名其妙的结果，排查成本反而更高。

对比一下 `var` 与 `let` 在声明前的表现：

```js
console.log(a)      // var 版 => undefined
var a = 100

console.log(b)      // let 版 => ReferenceError
let b = 100
```

同样写在声明前，一个给出空值，一个直接抛错，这正是 TDZ 的意义。

> ⚠️ 报错类型和变量提升不同：`var` 提前访问是 `undefined`，`let` / `const` 是 `ReferenceError`，别把两者记混。

### 块级作用域与三者对照

块级作用域指由 `{}` 划定的一段范围。`if`、`for`、`while`、单独的 `{}` 乃至函数体都算块，只有对象字面量的 `{}` 不是作用域。

因为每个块都独立，`switch` 的 `case` 分支之间用 `let` 声明同名变量会冲突，解决办法是给每个 `case` 单独加一对 `{}`。

| 对比项 | `var` | `let` | `const` |
|---|---|---|---|
| 作用域 | 函数 | 块级 | 块级 |
| 提前访问 | `undefined` | TDZ 报错 | TDZ 报错 |
| 重复声明 | 允许 | 报错 | 报错 |
| 重新赋值 | 可以 | 可以 | 不可以 |
| 声明时赋值 | 不必 | 不必 | 必须 |
| 循环中 | 共用一份 | 每轮新绑定 | 每轮新绑定 |
| 挂到 `window` | 是 | 否 | 否 |

工程上默认写 `const`，确定要改才换 `let`，`var` 只在读老代码时认识即可。因为 `const` 明确宣告"这个值不变"，读的人少一层心智负担。

`let` 在 `for` 里每轮生成新绑定，这一点是下一章选项卡案例的基础。因此闭包捕获同一变量的麻烦，从语法层面就消失了。

===CH===
no: 91
title: 案例：块级作用域
lessons: 120
summary: let 让每个点击回调记住本轮索引，不必再存 dataset
points: var 在 for 里只有一份，六个回调共享它 || 循环结束 i 停在越界值，点谁都打印同一个 || let 每轮迭代生成新绑定，闭包各记各的 || 这样闭包问题从语法层面消失，不必包 IIFE || 循环外访问 let 的 i 会直接报错
===BODY===
### 需求与思路

一组选项卡，点第几个标签就显示第几个面板，逻辑是标准排他：先清掉全部 `active`，再给当前项加回来。难点在索引，回调要等点击才执行，那时循环早已结束。

`var` 在整个作用域只有一份，所有回调共享它，点谁拿到的都是最终值；`let` 在 `for` 里每轮迭代新复制一份绑定，各记各的，于是不必再往 `dataset` 里存索引。

### 完整案例代码

```js
// 案例：块级作用域。假设页面有 .header 下 6 个 li 与 .box 下 6 个 li，CSS 用 .active 控制高亮与显示
var tabs = document.querySelectorAll(".header li")
var panels = document.querySelectorAll(".box li")

for (let i = 0; i < tabs.length; i++) {          // ← 关键点：let 让每轮迭代都有自己独立的 i
  tabs[i].onclick = function () {
    for (let m = 0; m < tabs.length; m++) {
      tabs[m].classList.remove("active")
      panels[m].classList.remove("active")
    }
    tabs[i].classList.add("active")              // ← 关键点：回调里直接用 i，不必再存 dataset
    panels[i].classList.add("active")
  }
}

// 对照一：var，闭包共享同一个 k
for (var k = 0; k < 3; k++) {
  setTimeout(function () { console.log("var", k) }, 0)   // ← 关键点：回调在循环结束后才跑，读到的是终值
}
// => var 3  var 3  var 3

// 对照二：let，每轮新建绑定
for (let n = 0; n < 3; n++) {
  setTimeout(function () { console.log("let", n) }, 0)   // ← 关键点：let 每轮复制一份，各记各的值
}
// => let 0  let 1  let 2
```

### 关键知识点

- **var 在 for 里只有一个变量**：`var` 会提升到函数或全局作用域，循环只是反复给它赋值，六次迭代共用同一份。所以所有回调闭包捕获的是同一个 `i`，谁被调用都读到它当前的值。
- **闭包与定时器读到的都是最终值**：回调不会立刻执行，要等用户点击或定时器到点，那时循环早已跑完，`i` 已经自增到越界的值（如 6）。因此 `var` 版打印出来全是同一个数，而不是 0 到 5。
- **let 每轮新建绑定，不是包了 IIFE**：规范规定 `for` 用 `let` 声明时每次迭代开始前复制一份新绑定，各轮互不干扰，这叫 per-iteration binding。所以闭包问题从语法层面消失；也正因为 `i` 被关在块里，循环外再 `console.log(i)` 会直接 `ReferenceError`。
- **IIFE 和 dataset 是老办法**：在 `let` 之前，只能写 `(function (i) { … })(i)` 用参数把当前值传进新作用域，或把索引写进元素属性再读回来。两者都能用，一个啰嗦、一个占 DOM 属性，而 `for (let i)` 一个字都不用多写。
===CH===
no: 92
title: ES6 的箭头函数
lessons: 121
summary: 箭头函数是函数表达式的简写，最大差别是没有自己的 this，直接继承外层
points: 箭头函数只能简写函数表达式，不是声明式函数 || 单个形参可省括号，单表达式可省 return || 返回对象字面量要用小括号包住 || this 取自定义时的外层，不看谁调用 || 不能 new、没有 arguments 与 prototype
===BODY===
### 语法简写：从函数表达式到箭头函数

箭头函数本质是函数表达式的简写。因为它只是换了一种写法，所以声明式的 `function fn(){}` 不能改写，赋值给变量或作为对象方法的函数表达式才可以。

写法是去掉 `function`，在参数与函数体之间加 `=>`。参数与函数体还能进一步省，规则一共四条。

```js
const add = (a, b) => { return a + b }   // 完整形态
const one = a => a * 2                    // 单参省 ()，单表达式省 {} 与 return
const none = () => 100                    // 无参必须写 ()
const obj = () => ({ name: "kerwin" })    // 返回对象要包 ()
console.log(one(10))      // => 20
console.log(obj())        // => { name: "kerwin" }
```

只有一个形参时可以省小括号，但无参或多个参数必须写。函数体只有一句返回值时可以省 `{}` 和 `return`，这叫隐式返回。

最容易踩的坑是返回对象。`() => { name: "kerwin" }` 里的 `{}` 会被当成函数体，结果返回 `undefined`，所以必须写成 `() => ({ ... })`。

注意一旦用了默认值或解构参数，就算只有一个参数也不能省括号，否则引擎无法区分 `=` 与 `=>`。

### 词法 this：写在哪就继承哪

普通函数的 `this` 由调用方式决定，谁调用就指向谁。箭头函数没有自己的 `this`，它直接取定义位置那一层作用域里的 `this`。

因此 `this` 与调用方式无关，只看"写在哪"。对象方法若写成箭头函数，里面的 `this` 并不会指向该对象，而是继续往外找。

```js
const obj = {
    getName: function () { return this === obj },
    getName2: () => this === obj
}
console.log(obj.getName())      // => true
console.log(obj.getName2())     // => false（this 不是 obj）
```

这正是定时器回调最需要它的地方。过去要写 `var that = this` 把外层的 `this` 存一份，因为 `setTimeout` 的普通回调里 `this` 已经变成全局对象。

换成箭头函数后，回调直接继承外层函数的 `this`，`that` 这种中转变量就不需要了。这也是数组方法回调、`Promise` 链里普遍用箭头的原因。

反过来，凡是需要 `this` 指向调用者的场合都不能用箭头函数，例如对象方法、DOM 事件处理和构造函数。

> ⚠️ 判断标准只有一条：要 `this` 指向调用者就用 `function`，要继承外层 `this` 才用箭头函数。

### 不能当构造函数，也没有 prototype

箭头函数没有可实例化的内部能力，对它用 `new` 会抛 `TypeError: ... is not a constructor`。

因为它是表达式而不是可实例化的函数，所以也没有 `prototype` 属性。后面讲构造函数与 `class` 时，方法一律不能写成箭头函数。

| 能力 | 普通函数 | 箭头函数 |
|---|---|---|
| `new` 实例化 | 可以 | 不可以 |
| `prototype` 属性 | 有 | 没有 |
| 自己的 `this` | 有 | 没有，继承外层 |
| `arguments` | 有 | 没有 |
| 被 `call` / `apply` 改 `this` | 可以 | 改不动 |
| 声明式提升 | 可以 | 不可以，必须先定义 |

因为箭头函数定位是轻量回调，凡需要左列任一能力时，都应改回普通函数。

### 没有 arguments，改用剩余参数

普通函数体内有 `arguments` 伪数组，装着所有实参。箭头函数没有自己的执行环境，因此取不到它，访问会直接报错。

下面这段把两种函数放在一起对比：

```js
const obj = {
  fn: function () { return arguments },   // 伪数组
  fun: () => arguments                     // ReferenceError
}
console.log(obj.fn(1, 2, 3))   // => Arguments(3) [1, 2, 3]
// obj.fun(1, 2, 3)            // 报错：箭头函数没有 arguments
```

`arguments` 只在普通函数里存在；箭头函数要收集实参，得换成下一章要讲的 `...args`。

替代方案是剩余参数 `...args`，它收到的是真数组，能直接用 `map`、`filter`，在箭头函数里也照样可用。

> ⚠️ `arguments` 是伪数组，想用数组方法得先 `Array.from()`；`...args` 没有这一步，这也是它更常被选用的原因。

这个 `...` 与展开运算符是同一个符号，写在形参位置表示"收集"，在第 95 章会专门讲清它的两种身份。

### 默认参数写在形参位置

ES6 允许直接在形参上写默认值，调用时没传或传 `undefined` 才生效。这样函数体里就不需要再写 `a = a || 10` 之类的兜底。

注意两者并不等价。`a || 10` 把所有假值都替换掉，`0`、`""`、`false` 都会被误改成 10，而默认参数只认 `undefined`。

用代码传几个假值就能看清差别：

```js
function old(a) { a = a || 10; return a }
function modern(a = 10) { return a }
console.log(old(0), modern(0))      // => 10 0
console.log(old(""), modern(""))    // => 10 ""
```

`0` 和空串本是有意义的值，却被 `||` 误伤；默认参数只在参数为 `undefined` 时才兜底，所以更可靠。

| 传入值 | `a = a \|\| 10` | `a = 10` |
|---|---|---|
| 不传 | 10 | 10 |
| `undefined` | 10 | 10 |
| `0` | 10（错） | 0 |
| `""` | 10（错） | `""` |
| `null` | 10 | `null` |
| `false` | 10（错） | `false` |

默认参数让"没传"与"传了假值"分开处理，符合直觉。箭头函数同样支持，但用了默认值就必须保留参数的小括号。

`const fn = (a = 10) => a` 合法，`const fn = a = 10 => a` 会语法错误，因为 `=` 与 `=>` 连写无法解析。

===CH===
no: 93
title: ES6 的解构赋值
lessons: 122
summary: 解构按结构一次取出成员：[] 认位置、{} 认名字，: 改名、= 兜底
points: 数组解构按位置对应，左边第几个取第几个 || 对象解构按属性名匹配，书写顺序无所谓 || 属性名: 新变量名 用来重命名 || 默认值只在值为 undefined 时生效 || 解构可用在交换变量和函数形参上
===BODY===
### 数组解构：按位置对应取值

解构就是按结构把一组值一次取进多个变量。因为以前要 `arr[0]`、`arr[1]` 一行行写，变量多时很啰嗦，解构让声明与取值合成一步。

数组解构用 `[]`，规则只有一条：左边第几个名字，对应右边第几个元素，与名字本身无关。

```js
var arr = ["xiaoming", "tiechui", "shanzhen"]
let [x, y, z] = arr
console.log(x, y, z)          // => xiaoming tiechui shanzhen
let [, second, , fourth] = [1, 2, 3, 4]   // 逗号留空即跳过
console.log(second, fourth)   // => 2 4
let [first, ...rest] = [1, 2, 3, 4]
console.log(rest)             // => [2, 3, 4]
```

不想要的位置用逗号留空即可跳过。末尾写 `...rest` 能把剩余元素收成一个真数组，这个 `...` 在第 95 章专门讲。

注意解构声明必须同时赋值，`let [a]` 这种没有右侧的写法会直接语法报错。

### 对象解构：按属性名对应取值

对象解构用 `{}`，靠属性名匹配而不是位置。因为对象本来就靠键名取值，所以顺序换了也照样生效。

```js
var obj = { name: "kerwin", age: 100, location: "dalian" }
let { name, age, location } = obj
console.log(name, age, location)   // => kerwin 100 dalian
```

左边写谁就取谁的属性，书写顺序换一换也照样取到，因为匹配靠的是键名而不是位置。

| 对比 | 数组解构 `[]` | 对象解构 `{}` |
|---|---|---|
| 匹配依据 | 位置下标 | 属性名 |
| 顺序 | 有影响 | 无所谓 |
| 跳过方式 | 逗号留空 | 不写该属性即可 |
| 改名 | 不需要 | 需要时写 `:` |

例如 `{ location, name } = obj` 与 `{ name, location } = obj` 完全等价，取到的值只由名字决定。

还要注意 `{}` 只能解对象、`[]` 只能解数组，不能互换。对 `null` 或 `undefined` 解构会抛 `TypeError`，接口数据要先兜底。

> ⚠️ 整行以 `{` 开头的解构会被当成代码块，已声明变量再解构时要写成 `({ a, b } = obj)` 才是表达式。

### 嵌套解构与重命名

属性值还是对象或数组时，可以在对应位置继续写解构模式，一层层"穿透"进去取值。

```js
var obj = {
    name: "kerwin",
    age: 100,
    location: { province: "liaoning", city: "dalian" },
    hobby: [111, 222, 333]
}
var {
    name,
    age: myage,                    // 重命名：取 age 存进 myage
    location: { province, city },  // 继续按对象解构
    hobby: [m, n, k]               // 换成按数组解构
} = obj
console.log(name, myage, province, city, m)  // => kerwin 100 liaoning dalian 111
```

语法是 `属性名: 新变量名`。冒号左边仍是与对象匹配的键，右边才是真正生成的变量。

因此重命名后原属性名就不能当变量用了，`age` 不会成为变量，只有 `myage` 有效。

`location: { ... }` 里的 `location` 只是"取出这个属性再往里解"的通道，它本身不会变成变量。这是嵌套解构最容易被误读的一点。

### 默认值：只在 undefined 时兜底

解构时可以在变量后写 `= 值`，属性取不到时用它兜底。因为判断标准是"值严格等于 `undefined`"，所以传 `null`、`0`、`""` 都不会触发。

`{ name = "匿名", age = 18 }` 表示两个字段各自兜底；`{ gender: g = "男" }` 则是重命名与默认值一起用，取不到时 `g` 为 `"男"`。

默认值只在 `undefined` 时生效，这一点与函数默认参数一致。`{ a = 1 } = { a: null }` 得到的仍是 `null`，不会被替换。

> ⚠️ 接口字段可能为 `null`，若希望它也走默认值，得自己判空，不能只依赖解构默认值。

### 交换变量与函数参数解构

交换两个变量不必再借中间变量，右边先算出数组、左边再按位置赋回即可。

```js
var a = 10
var b = 20
;[b, a] = [a, b]        // 行首的分号不能省
console.log(a, b)       // => 20 10
```

右侧先按旧值组成 `[10, 20]`，左侧再按位置赋回，于是 `b` 拿到旧 `a`、`a` 拿到旧 `b`。

1. 右侧 `[a, b]` 先求值，此时用的还是旧值。
2. 左侧 `[b, a]` 再按位置接收，于是 `b` 得旧 `a`、`a` 得旧 `b`。

注意行首是 `[` 时上一行末尾要有分号，否则会被解析成下标访问，写成 `;[b, a] = [a, b]` 最稳妥。已有变量也别再写 `let`，会重复声明。

函数形参同样能解构，`function render({ name, age })` 让调用方一眼看出传了哪些字段，且不受参数顺序影响。

若允许整个参数都不传，要写成 `{ name = "匿名" } = {}`。最后的 `= {}` 不能省，否则不传参时会对 `undefined` 解构而报错。

> 💡 解构出的是值的拷贝，改基本类型变量不影响原对象；但若取到的是对象或数组，拿到的仍是同一个引用。

===CH===
no: 94
title: ES6 的对象简写
lessons: 123
summary: 变量名与属性名相同时可只写一次，方法可省 function，键名还能用 [] 动态生成
points: 变量名和属性名相同时，只写一个即可 || 名字不一致时必须写全 属性名: 变量 || 方法简写省掉 function，仍是普通函数 || 计算属性名用 [表达式] 动态生成键 || 简写与解构是方向相反的一对操作
===BODY===
### 属性简写：变量名就是属性名

往对象里装变量时，老写法要写 `username: username` 这样重复两遍。因为键名常常就直接沿用变量名，ES6 允许这种情况只写一次。

```js
let username = "kerwin"
let age = 100
var obj = { username, age }        // 等价于 { username: username, age: age }
console.log(obj)                   // => { username: "kerwin", age: 100 }
```

触发条件是变量名与属性名完全相同，缺一不可。只要两者不一致，就得老实写全 `属性名: 变量`。

例如变量叫 `u` 却想生成 `username` 字段，写成 `{ u }` 只会得到键 `"u"`。所以收集表单时先把变量名对齐，简写才安全。

这常见于把输入框的值打包发给后端。因为字段名与后端约定一致，对齐变量名后整个对象一次成型，不用逐个赋值。

### 方法简写：省掉 function 关键字

对象里的函数属性也能简写，去掉 `: function`，直接写 `方法名() {}`。

```js
var obj = {
    a: 1,
    getName() { return this.a }
}
console.log(obj.getName())      // => 1
```

因为简写只省了关键字，函数本质没变，所以 `this` 规则与老写法完全一致，依旧由调用方式决定。

因此别把它和箭头函数混为一谈。`getName: () => this.a` 里的 `this` 取外层，拿不到 `obj`，而方法简写能正常打印 `1`。

> ⚠️ 把方法单独赋给变量再调用，`this` 就不再指向原对象，这和老写法 `getName: function(){}` 的表现完全一致。

### 计算属性名：用 [] 动态生成键

属性名要运行时才确定时，用方括号把表达式括起来写在键的位置，这叫计算属性名。

```js
let key = "userName"
let value = "kerwin"
var obj = { [key]: value }
console.log(obj)              // => { userName: "kerwin" }
```

方括号里的表达式会先求值，结果转成字符串当键名。这样按字段名批量赋值时不用先建空对象再逐个 `obj[k]` 赋值。

注意不加 `[]` 写成 `{ key: value }`，属性名就是字面量 `"key"`，与变量里的值毫无关系。

下面这段就是"只改一个字段"的通用写法：

```js
function setField(obj, field, val) {
  return { ...obj, [field]: val }
}
console.log(setField({ name: "kerwin" }, "age", 100))
// => { name: "kerwin", age: 100 }
```

`[field]` 先求值成键名，展开负责保留其余字段，两者合起来就能定点覆盖。

它常与展开运算符合用，写成 `{ ...obj, [field]: val }` 来只覆盖某一个字段，第 95 章会看到完整案例。

### 两种简写合用：表单收集

属性简写与方法简写可以同时出现在一个对象里，这是它们最常见的组合。

1. 先把各输入框的值读进与字段同名的变量。
2. `return { username, password, age }` 直接成型。
3. 需要附带方法时再写一个 `getInfo() {}`。

因为方法里能用 `this` 访问同对象的属性，简写后的对象依然自带行为，不必另外挂函数。

相比过去逐个 `setAttribute` 或先拼字符串再解析，这种写法把"收集"和"成型"合成一步，代码短且字段一目了然。

```js
function collectForm() {
  let username = "kerwin"
  let age = 100
  return {
    username,
    age,
    getInfo() { return `${this.username} / ${this.age}` }
  }
}
console.log(collectForm().getInfo())   // => kerwin / 100
```

属性简写负责成型，`getInfo()` 方法简写让对象自带行为，`this` 仍能读到同对象的字段。

### 与解构互为反向操作

同一个 `{ a, b }` 出现在等号右边是把变量装进对象，出现在等号左边是从对象取出变量。两者方向正好相反。

| 位置 | 操作 | 方向 |
|---|---|---|
| `let { a, b } = obj` | 解构 | 对象 → 变量 |
| `let obj = { a, b }` | 简写 | 变量 → 对象 |

因为都用花括号、都靠同名对应，所以容易混。判断方法只看等号方向：左边取、右边装。

把第 93 章的解构与本章简写对着记，能少背一半规则。名字对得上就敢省，对不上就写全名。

===CH===
no: 95
title: ES6 展开运算符
lessons: 124
summary: ... 写在实参或字面量里是展开，写在形参或解构里是收集，两者方向相反
points: ...arr 把数组拆成散值，可传参、合并、求最值 || 对象展开合并时，同名属性后面的覆盖前面 || 剩余参数必须写在最后，收到的是真数组 || 看位置判断身份：实参展开，形参收集 || 展开是浅拷贝，嵌套对象仍共享引用
===BODY===
### 展开数组：把元素拆成散值

`...` 写在数组字面量或实参位置，会把数组拆成一个个独立的值。因为 `console.log(...arr)` 等价于把元素逐个传入，所以打印出来不再带方括号。

```js
var a = [1, 2, 3]
var b = [4, 5, 6]
var c = [...a, ...b]
console.log(c)                 // => [1, 2, 3, 4, 5, 6]
console.log(Math.max(...a))    // => 3
```

合并数组时写成 `[...a, ...b]`，元素按出现顺序排列，也能在任意位置插入，例如 `[0, ...a, 4]`。

当函数实参最典型。老写法要靠 `fn.apply(null, arr)` 借 `apply` 拆数组，现在直接 `fn(...arr)`；求最大值也从 `Math.max.apply(null, arr)` 变成 `Math.max(...arr)`。

注意只有可迭代对象才能展开进数组，普通对象写成 `[...{ a: 1 }]` 会抛 `TypeError`。

### 展开对象：合并与覆盖

`...` 也能用在对象字面量里，把另一个对象的可枚举属性逐个铺开。因为结果是新对象，所以常用于合并配置或拷贝数据。

```js
var obj1 = { name: "kerwin", age: 100 }
var obj2 = { name: "tiechui", location: "dalian" }
var obj = { ...obj1, ...obj2 }
console.log(obj)
// => { name: "tiechui", age: 100, location: "dalian" }
```

同名属性由后面的覆盖前面的，所以顺序会改变结果。想只改一个字段，就写 `{ ...obj, name: "新值" }` 让新值排在最后。

这就是"不可变更新"的套路：不改动原对象，而是先整体拷过来再覆盖。因为新旧数据各自独立，回滚与对比都更容易。

```js
var obj = { name: "kerwin", age: 100, id: "001" }
var updated = { ...obj, name: "tiechui" }
console.log(updated)   // => { name: "tiechui", age: 100, id: "001" }
console.log(obj.name)  // => kerwin，原对象没被碰
```

`...obj` 先把所有字段铺进新对象，`name: "tiechui"` 放在最后完成覆盖，旧数据因此保持干净。

注意对象展开进的是对象字面量，把数组展开进 `{}` 会得到以索引为键的对象，并不是数组。

### 剩余参数：把散值收成数组

同一个 `...` 写在函数形参位置，方向反过来，把多出来的实参收成一个数组。

```js
function test(a, b, ...rest) {
    console.log(a, b)      // => 1 2
    console.log(rest)      // => [3, 4, 5]
}
test(1, 2, 3, 4, 5)
const sum = (...nums) => nums.reduce((s, n) => s + n, 0)
console.log(sum(1, 2, 3))  // => 6
```

剩余参数必须写在形参最后，否则引擎无法判断哪里截止。收到的是真数组，能直接 `map`、`filter`，比 `arguments` 好用。

因为它在箭头函数里同样可用，所以正好补上箭头函数没有 `arguments` 的缺口，第 92 章提到的替代方案就是它。

`...arguments`、`...nodeList` 还能把伪数组转成真数组，前提是这些对象可迭代。

### 同一个 ... 的两种身份

最容易混的地方是同一个符号两种含义。判断标准只有一条：看它写在哪，不看符号本身。

| 出现位置 | 名字 | 方向 | 例子 |
|---|---|---|---|
| 实参、数组/对象字面量、等号右侧 | 展开 spread | 一 → 多 | `fn(...arr)` |
| 形参、解构内、等号左侧 | 剩余 rest | 多 → 一 | `function f(...args)` |

写在等号右边或实参里是"拆开"，写在形参或解构里是"收起来"。两者方向相反，却共用同一个 `...`。

例如 `[first, ...others] = arr` 是收集，而 `[...a, ...b]` 是展开，靠位置一眼可辨。

### 浅拷贝与局限

`[...a]` 与 `{ ...a }` 都能生成一份新容器，改第一层不会影响原数据，因此常用来代替 `slice()` 复制。

但展开是浅拷贝。因为只复制了最外层，里面装的对象或数组仍是同一个引用，改内层照样联动。

```js
var arr = [{ name: "a" }]
var copy = [...arr]
copy[0].name = "b"
console.log(arr[0].name)   // => b，内层对象被改了
```

外层数组确实是新的一份，但里面那个对象没被复制，所以改 `copy[0]` 会连带改到 `arr[0]`。

> ⚠️ `var b = { ...a }` 后执行 `b.list.push(3)`，原对象的 `a.list` 也会变，嵌套越深越容易踩这个坑。

要完全独立就得深拷贝，例如 `structuredClone(obj)` 或自己递归，不能只靠 `...`。

另外 `{ ...obj }` 只拷自身可枚举属性，原型上的方法不会带过来。因为展开按属性逐个复制，原型链并不在这一步的范围内。

===CH===
no: 96
title: ES6 模块化语法
lessons: 125
summary: 一个文件就是一个模块，内部默认私有，只有 export 出去的才能被 import 引入
points: 模块有独立作用域，顶级变量不再污染全局 || export 出去的才是 API，其余都是私有 || 命名导出可多个，默认导出只能有一个 || 导入默认导出可随意起名，命名导出要对上 || type=module 自动严格模式，必须经 http 打开
===BODY===
### 为什么需要模块化

传统做法是用多个 `script` 标签依次加载文件。因为它们全都塞进同一个全局作用域，文件之间会互相影响，项目一大就难以维护。

1. 私密不漏做不到：内部工具函数也暴露在全局，谁都能调用或覆盖。
2. 重名不怕做不到：两个文件同名函数，后加载的悄悄盖掉前面的。
3. 依赖不乱做不到：用了别处的函数却没声明，标签顺序一换就失效。

模块化的目标正是解决这三点。因为每个文件自成作用域，外面看不见内部名字，同名也不冲突，依赖则靠文件开头的声明写清楚。

因此一个文件就是一个模块，内部默认私有，只有显式导出的成员才成为对外的 API。

### export：把名字暴露出去

`export` 决定模块对外提供什么。因为它写在顶层，导出清单一眼就能看出这个模块的公开接口。

```js
// 声明时直接导出
export const version = "1.0"
export function A1() { return "A1" }

// 先定义，末尾统一列出
function A2() { return "A2" }
function test() { return "test" }
export { A2, test }
export { A2 as a2 }            // 导出时重命名

// 默认导出，一个模块只能有一个
export default function request() {}
```

常见写法有四种：声明时直接加 `export`、末尾用 `export {}` 统一列出、导出时 `as` 重命名、以及 `export default`。

没出现在导出清单里的名字就是模块私有。因为外部只能拿到导出的成员，内部工具函数不会泄漏，这正是"私密不漏"。

`export default` 一个模块只能写一次，命名导出则可以有任意多个，二者也能混用。

### import：按名字或默认引入

`import` 用来把别的模块的导出接进来。因为依赖写在文件开头，读代码时不用再翻 `script` 标签顺序就知道用了谁。

```js
import request from './util.js'                     // 接默认导出，名字随便起
import { A1, A2 } from './A.js'                     // 接命名导出，名字要对上
import { test as A_test } from './A.js'             // as 重命名，避开同名冲突
import request2, { version } from './util.js'       // 默认与命名一起接
```

接命名导出必须加花括号且名字一致，接默认导出则不加花括号、名字任意。`as` 能给导入改名，用来解决两个模块都叫 `test` 的冲突。

`import` 会被引擎提升到模块最前，且只能写在顶层，不能放进 `if` 或函数里。需要按需加载要改用动态 `import()`，它返回 Promise。

```js
// 需在模块环境（type="module"）中运行
const { A1 } = await import('./A.js')
console.log(A1)
```

静态 `import` 写在顶层、加载时即确定；动态 `import()` 可以在运行时才决定加载谁，并返回 Promise 供 `await` 使用。

导入的是只读视图，不能给导入的名字重新赋值；浏览器环境里路径还要写全 `.js` 后缀，打包工具才会自动补。

### type="module" 与运行条件

要让浏览器按模块解析，脚本标签必须带 `type="module"`。因为默认脚本不认识 `export` / `import`，少了它会直接报语法错误。

加上它之后会自动获得几条保证，行为与普通脚本明显不同。

| 特性 | 说明 |
|---|---|
| 严格模式 | 模块内自动启用，不用手写 `"use strict"` |
| 独立作用域 | 顶级变量不再是全局，`window.a` 读不到 |
| 顶层 `this` | 是 `undefined`，不是 `window` |
| 只执行一次 | 多处引入同一模块也只运行一遍，结果被缓存 |
| 自动延迟 | 相当于自带 `defer`，等 HTML 解析完再执行 |
| 必须 http 环境 | `file://` 直接打开会触发 CORS 错误 |

最后一条最容易卡住新手。因为模块通过 HTTP 加载，双击本地文件会以 `file://` 打开而被浏览器拦截，所以必须起本地服务器。

用编辑器的 Live Server、`npx serve` 或 `python -m http.server` 都可以，这也是后面 ajax 课程的前置条件。

### 默认导出与命名导出对照

两种导出方式的选择，取决于一个模块对外提供几样东西。

| 对比 | 命名导出 `export {}` | 默认导出 `export default` |
|---|---|---|
| 数量 | 多个 | 只能一个 |
| 导入写法 | `import { A1 } from './A.js'` | `import 任意名 from './C.js'` |
| 名字 | 必须对上，或 `as` 改名 | 随便起 |
| 花括号 | 必须加 | 不能加 |
| 适合 | 工具库、多个接口 | 只对外给一个类或组件 |

因为默认导出的名字由导入方决定，所以同一个模块在不同文件里可以叫不同名字；命名导出则强制一致，改动会立刻报错，更易维护。

两种导出还能在同一个模块里混用：

```js
// util.js，需在模块环境（type="module"）中运行
export default function request() {}
export const baseURL = "/api"

// main.js
import request, { baseURL } from './util.js'
console.log(baseURL)
```

`request` 接默认导出、名字随意，`baseURL` 接命名导出、名字必须对齐，一行 import 就能同时拿到两类成员。

工程上的经验是：一个模块只给一样东西就用默认导出，给一组工具就用命名导出。

> 🧠 模块化三个目标：私密不漏、重名不怕、依赖不乱；`export` 出去的才是 API，剩下的都是私有。
