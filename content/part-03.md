===PART===
id: part-03
order: 3
title: 函数与作用域
range: 032–041
desc: 把逻辑打包成函数，讲清参数、返回值、提升与作用域规则
===CH===
no: 20
title: 初识函数
lessons: 032
summary: 函数把一段逻辑封装成可反复调用的盒子，声明式与赋值式只在调用时机上有差别
points: 函数为消除重复代码而生，逻辑只写一份 || 定义函数时函数体不执行，调用才执行 || 声明式可先调用后定义，赋值式必须先定义 || 函数内 var 的变量在函数外访问不到 || typeof 对函数返回 function 而非 object
===BODY===
### 为什么需要函数

函数为消除重复代码而生。同一段逻辑要在多处使用时，复制粘贴会付出三个代价。

- 想优化算法得同时改好几处，漏改一处就埋下 bug
- 代码越堆越长，可读性下降
- 需求一变，每份副本都得跟着改

把逻辑装进带名字的盒子，用时以名字调用，逻辑就只留一份。判断不同区间的质数，只需改动循环的边界。

```js
function isPrime(n) {
    for (var j = 2; j < n; j++) {
        if (n % j === 0) return false
    }
    return true
}
for (var i = 300; i < 500; i++) {
    if (isPrime(i)) console.log(i)
}
```

这样循环体不必出现第二次，判断范围也能随意替换。这就是函数最直接的价值。

### 声明式与赋值式两种定义

定义函数有两种写法，区别在于 `function` 后面带不带名字。

```js
function test1() {              // 声明式
    console.log("套餐A")
}
var test3 = function () {       // 赋值式，函数匿名
    console.log("套餐C")
}
```

声明式用 `function` 直接起名；赋值式把匿名函数存进变量，靠变量名调用。两者功能一致，区别只在调用时机。

各部分的含义是固定的，理解它们才不会写错形式：

- `function`：声明关键字，告诉 JS 要定义函数
- 函数名：自己起，遵守变量命名规则
- `()`：参数位置，即使为空也不能省
- `{}`：函数体，存放待执行的代码

赋值式的函数没有自己的名字，所以 `function` 后留空，名字由变量补上。

### 函数名与调用时机

函数名遵守变量命名规则，调用时靠名字加一对圆括号定位到函数体。只写定义，盒里的代码并不会运行。

写出 `function test2(){...}` 后控制台没有输出，加上 `test2()` 才真正执行。可以理解为「定义是写菜谱，调用才下厨」：菜谱写再多不下厨，照样没有菜。

两种写法在能否「先调用后定义」上表现不同，原因是预解析的处理范围不一样：

| 写法 | 形式 | 能否先调用后定义 | 提前调用的结果 |
|---|---|---|---|
| 声明式 | `function 名() {}` | 能 | 正常执行 |
| 赋值式 | `var 名 = function () {}` | 不能 | `TypeError: ... is not a function` |

声明式整体被提升，故先调用后定义没问题；赋值式只提升了变量、初值 `undefined`，提前调用便报错。稳妥做法是两种都先定义后调用，提升机制在第 24 章展开。

### 函数是封闭的盒子

函数内部 `var` 的变量只在盒内有效，外部访问会报 `is not defined`。原因是函数形成了一个独立范围，盒里的变量出不来。

```js
function test() {
    var drink = "可乐"
    console.log(drink)     // => 可乐
}
test()
// console.log(drink)     // => ReferenceError: drink is not defined
console.log(typeof test)  // => "function"
```

要分清两种「空」：`is not defined` 是从未声明过该变量，`undefined` 是声明了却没赋值。函数属于复杂数据类型，但 `typeof` 对它返回独有的 `"function"`，而不是数组、对象那样的 `"object"`。
===CH===
no: 21
title: 函数实战：九九乘法表
lessons: 033
summary: 把重复的九九乘法表循环封装成函数，调用几次输出几张，并引出参数化改造
points: 同样的循环写三遍就该抽成函数 || 函数让代码只写一份却能执行任意多次 || 只差行数的两个函数仍是重复代码 || 把行数做成参数才是最终解法
===BODY===
### 需求与思路

第 19 章打印乘法表时，同样的双层循环写了三遍；因为重复逻辑一改就得改多处，所以把整段循环收进一个函数，代码只保留一份。

这样想输出几张表就调用几次，函数让「写一遍、执行任意多次」成为可能，调用顺序也就是页面上的输出顺序。

只固定 9 行的函数仍不够：要打 6 行就得再复制一个函数，本质还是重复。因为差异只在行数，所以把行数做成参数 row，由实参决定规模才是最终解法。

### 完整案例代码

```js
// 函数实战：把乘法表的打印逻辑封装成函数，用参数控制行数
function printTable(row) {                  // ← 关键点：函数封装，双层循环收进一个名字
  for (var m = 1; m <= row; m++) {          // ← 关键点：参数控制规模，row 是几就打几行
    var line = ""
    for (var n = 1; n <= m; n++) {          // ← 关键点：内层上限仍取行号 m，随外层变化
      line += m + "*" + n + "=" + (m * n) + " "
    }
    console.log(line)                       // ← 关键点：换行放在外层，一行拼完再输出
  }
}

printTable(3)          // 想打几行就传几，代码只写一份
// => 1*1=1
// => 2*1=2 2*2=4
// => 3*1=3 3*2=6 3*3=9
printTable(2)
// => 1*1=1
// => 2*1=2 2*2=4
printTable(9)          // => 输出完整的 9 行乘法表
```

### 关键知识点

- **把打印逻辑收进函数**：把双层循环整体装进 `printTable`，代码只写一份。因为重复逻辑一改就得改多处，封装后改格式只需动函数内一处，复用也只是再调用一次。
- **用参数控制规模**：只固定 9 行时，要打 6 行就得再复制一个函数，本质仍是重复；把行数做成形参 `row`，由实参决定，同一份逻辑就能应对任意行数。
- **调用顺序即输出顺序**：`console.log` 按执行顺序追加内容，所以先调用的表格在上、后调用的在下；想输出几张就调用几次，不必再动循环体。
===CH===
no: 22
title: 函数的参数
lessons: 034–035
summary: 形参是函数内部的局部变量，由实参按顺序赋值，多传少传都不报错且可用默认值兜底
points: 形参在定义时写，实参在调用时传，按位置对应 || 同一函数传入不同实参就有不同结果 || 多传实参被忽略，少传形参值为 undefined || 形参只在函数内有效，基本类型按值传递 || 漏传参数可用默认值或报错加 return 兜底
===BODY===
### 形参与实参

参数是函数的输入口。定义时 `()` 里写的叫形参，本质是函数内部的局部变量；调用时传的叫实参，是具体的值。

二者按位置一一对应：第一个实参给第一个形参，第二个给第二个，与名字无关。形参的值完全由实参决定，因此同一个函数传不同值就有不同结果。

```js
function fn(num) {
    console.log(num)
}
fn(100)    // => 100
fn(200)    // => 200
```

- 形参：写在定义处，是变量名，函数内当变量用
- 实参：写在调用处，是实际的值，用来给形参赋值

### 参数个数不匹配

JS 不强制实参与形参个数相等，多传、少传都不报错。这一点常被忽略，却直接影响运行结果。

以 `test(a, b)` 为例，三种调用的结果如下：

| 调用 | `a` | `b` | 结果 |
|---|---|---|---|
| `test(1, 2)` | 1 | 2 | 正常匹配 |
| `test(2, 1, 3)` | 2 | 1 | 多出的 `3` 被忽略 |
| `test()` | `undefined` | `undefined` | 走非预期分支 |

规则有三条，理解它们才知道为什么不报错：

- 实参多传：函数只认声明过的形参，多出的没有形参接收，不报错
- 实参少传：缺位的形参值为 `undefined`，`undefined === 1` 为 `false`，会走进非预期分支
- 形参与外部变量重名：是两个不同变量，基本类型按值传递，函数内改形参不影响外部

### arguments：多传的实参去哪了

多传的实参并非真正被丢弃，只是没有形参接住它。JS 在每个函数内提供一个类数组对象 `arguments`，按顺序存下所有实参。

```js
function fn(a, b) {
    console.log(a, b)               // => 1 2
    console.log(arguments.length)   // => 3
    console.log(arguments[2])       // => 3（多传的还在）
}
fn(1, 2, 3)
```

所以「多传被忽略」是针对形参而言；借助 `arguments` 仍能取到它们，这也是早期实现不定参数函数的办法。

> ⚠️ `arguments` 是类数组对象，不是真正的数组，不能直接用 `push`、`forEach` 等数组方法。

### 参数默认值的思路

漏传参数时，最稳妥的是给默认值：先判断是否为 `undefined`，再赋一个兜底值，让函数照常工作。这是 ES6 之前的通用写法。

```js
function test(target) {
    if (target === undefined) target = 9
    console.log("行数", target)    // => 行数 9
}
test()
```

若这个参数必传，则改为打印错误并 `return` 提前结束，不往下执行。

- 给默认值：少传也能正常工作，更常用
- 报错 + `return`：参数必传，不传即调用方写错

> 💡 ES6 起可简写成 `function test(target = 9) {}`，认识 `undefined` 判断这套老写法，才读得懂旧代码。

另外，把加法结果只用 `console.log` 打印，调用方拿不到、也没法继续运算。想让结果流出函数必须用 `return`，这是下一章的内容。
===CH===
no: 23
title: 函数的返回值 return
lessons: 036–037
summary: return 交出结果并结束函数，是结果能被外部继续使用的关键，区别于只打印的 console.log
points: return 交出结果并立刻结束整个函数 || 没写 return 的函数调用值恒为 undefined || return 后面的代码永不执行，可用来提前退出 || 一次只能返回一个值，多个用数组或对象打包 || 打印用 console.log，交付结果必须用 return
===BODY===
### return 交出结果并结束函数

`return` 做两件事：把结果交给调用者，并立刻结束函数。函数调用本身是表达式，一定有值。

```js
function add(x, y, z) {
    return x + y + z
}
var res = add(1, 2, 3)
console.log(res)          // => 6
console.log(res * 10)     // => 60（结果能继续参与运算）
```

`res` 接住返回值后还能再参与运算，这是「交出去」的意义。打印与交付的分工要分清：

- `console.log`：把值显示给人看，外部接不到，函数继续往下跑
- `return`：把值交给代码用，外部能接收，函数立刻结束

> 🧠 只是查看中间值用 `console.log`，结果还要被别处使用就必须 `return`。

### 没有 return 时返回 undefined

没写 `return` 的函数，调用值恒为 `undefined`。因为 `fn()` 是表达式，表达式就该有值，`1 + 2` 得 `3`，没有 `return` 的调用便得 `undefined`。

```js
function noReturn() {}
console.log(noReturn())          // => undefined

function sum(arr) {
    var total = 0
    for (var i = 0; i < arr.length; i++) total += arr[i]
    // 忘了 return total
}
console.log(sum([1, 2, 3]))      // => undefined
console.log(sum([1, 2, 3]) + 10) // => NaN
```

忘写 `return` 是经典 bug：结果变成 `undefined`，后续计算连锁得到 `NaN`。写完函数要自问一句「要不要交结果出去」。

### return 立刻终止函数

`return` 之后的代码是死代码，永不执行。这一点和 `break` 相似，但 `break` 只结束当前循环，`return` 结束整个函数。

```js
function getRnd(min, max) {
    if (min > max) {
        console.error("参数有误")
        return                  // 参数不合法，提前退出
    }
    return Math.floor(Math.random() * (max - min)) + min
}
```

利用「立刻结束」可在参数不合法时提前退出，这种写法叫卫语句，能避免主逻辑被包进层层 `if`。

> 💡 第 18 章用标志位判断质数，改用 `return` 后找到约数直接返回 `false`，逻辑更短且能任意复用。

### 一次只能返回一个值

`return` 一次只能带出一个值。写 `return 1, 2` 并不会返回两个，逗号运算符只取最后一个 `2`。

```js
function wrong() { return 1, 2 }
console.log(wrong())               // => 2

function pair() { return [1, 2] }          // 用数组打包
function obj()  { return { a: 1, b: 2 } }  // 用对象打包
```

想返回多个值，就用数组或对象把它们包成一个值。返回值可以是数字、字符串、布尔、对象、数组乃至函数，但出口始终只有一个。
===CH===
no: 24
title: 预解析与重名问题
lessons: 038–039
summary: 预解析把 var 与函数声明提到作用域顶部，由此决定提升行为与重名时的覆盖结果
points: 执行分预解析与执行两阶段，声明先被处理 || var 只提升声明不赋值，初值为 undefined || 声明式函数整体提升，可先调用后定义 || 函数重名时后定义的覆盖先定义的 || var 与 function 重名函数先占位，赋值再覆盖
===BODY===
### 预解析：先把声明提到顶部

JS 不是读一行执行一行，而是先通读全文做预解析，再从上到下执行。预解析只处理声明，把 `var` 和 `function` 提到所在作用域最前面，赋值一律留在原地。

```js
console.log(myname)        // => undefined
var myname = "kerwin"
console.log(myname)        // => "kerwin"

// 预解析后等价于：
// var myname
// console.log(myname)     // => undefined
// myname = "kerwin"
// console.log(myname)     // => "kerwin"
```

首次打印不是变量不存在，而是声明提前了、赋值还没执行。这样理解，就不会误以为代码跳过了 `var` 那一行。

### var 与函数声明提升的差异

两种声明提升的内容不同，由此决定了先调用后定义是否可行。这也是赋值式函数会报错的根本原因。

| 代码 | 提升什么 | 提升后初值 |
|---|---|---|
| `var a = 1` | 只提升 `a` | `undefined` |
| `function fn() {}` | 整个函数 | 函数本身 |
| `var fn = function () {}` | 只提升 `fn` | `undefined` |
| 同名 `var` 与 `function` | 函数优先 | 函数本身 |

声明式函数整体被提升，故可先调用后定义；赋值式只提升了变量，初值 `undefined`，提前调用得到 `TypeError`。两类报错要分清：

- `ReferenceError: x is not defined`：压根没声明过该变量
- `TypeError: x is not a function`：变量存在，但不是函数

### 重名覆盖规则

预解析遇到同名声明时，后出现的覆盖先出现的。函数重名，后面的定义会把前面的替换掉。

```js
function test() { console.log("test1") }
function test() { console.log("test2") }
test()      // => "test2"
```

所以函数重名等于前一个白写。真实项目里应保证函数名唯一，避免依赖覆盖顺序去猜结果。

### 同名变量与函数谁生效

`var` 与 `function` 同名时，预解析的优先级是「函数声明先于 `var` 声明」。函数先占位，`var` 声明因名字已存在被忽略。

进入执行阶段后，谁在后面赋值谁就覆盖谁。分步看这段：

```js
age()                      // => "age is 100"
var age = 100
function age() { console.log("age is 100") }
console.log(age)           // => 100
```

- 预解析阶段：`function age` 先占位，`var age` 被忽略
- 执行到 `age()`：此刻 `age` 是函数，正常调用
- 执行到 `var age = 100`：赋值生效，`age` 变成数字
- 最后 `console.log(age)`：得到 `100`

若把 `var age = 100` 挪到 `age()` 之前，`age` 会先被赋值成数字，再调用就报 `TypeError`。多个 `<script>` 各自独立预解析一次，但全局变量在标签间共享。

> 🧠 声明放在使用之前、函数名与变量名不撞车，是避开提升与重名问题最省事的做法。
===CH===
no: 25
title: 作用域
lessons: 040–041
summary: 作用域决定变量可见范围，由内向外构成作用域链，赋值时有无 var 决定新建局部还是改外层
points: 函数外是全局变量，函数内 var 是局部变量 || var 没有块级作用域，只有函数能关住它 || 内层能访问外层，外层访问不到内层 || 找变量由内向外逐层，到全局仍无则报错 || 赋值无 var 时沿链往外找，找不到建隐式全局
===BODY===
### 全局与局部作用域

作用域是变量的活动范围，出了范围就访问不到。函数外声明的是全局变量，整个脚本可见；函数内 `var` 的是局部变量，只在函数内有效。

```js
var g = "全局"
function test() {
    var inner = "局部"
    console.log(g)         // => 全局（内部能读外部）
}
test()
// console.log(inner)      // => ReferenceError: inner is not defined
```

只有函数能形成边界，这是 ES5 最关键的一条规则。局部变量被外部访问会报 `is not defined`，并使当前 `<script>` 中断。

> 💡 每个 `<script>` 是独立执行单元，一个标签报错不影响后面标签继续运行，排查时红色报错要往上翻。

### 作用域链查找规则

嵌套函数访问变量时，由内向外逐层查找，这条路径就是作用域链。方向是单向的：里面能看到外面，外面看不到里面。

```js
var a = "全局a"
function outer() {
    var b = "outer的b"
    function inner() {
        var c = "inner的c"
        console.log(a, b, c)   // => 三个都能拿到
    }
    inner()
    // console.log(c)         // => ReferenceError
}
outer()
```

查找步骤固定，理解它才能预判变量来自哪一层：

1. 先在当前函数作用域找
2. 没有则沿外层逐级向上
3. 直到全局作用域
4. 全局也没有则抛 `ReferenceError`

### 赋值与取值的不对称

取值和赋值走的是不同规则，这是最容易被忽略的一点。取值沿作用域链向外找；赋值则先看有没有 `var`。

```js
var result
function test2(a, b) {
    var result = a + b      // 有 var：新建局部，外面不变
    return result
}
console.log(test2(1, 2))    // => 3
console.log(result)         // => undefined

function child() {
    num = 400               // 无 var：链上找不到，新建隐式全局
}
child()
console.log(num)            // => 400
```

- 有 `var`：在当前作用域新建局部变量，与外层同名变量互不相干
- 无 `var`：沿作用域链往外找并修改，一路到全局仍没有，才自动创建隐式全局变量

隐式全局很危险：一旦变量名打错，不会报错而是悄悄多出一个全局变量，排查困难。开启严格模式 `"use strict"` 后它会直接报错，所以变量一律先声明。

### 块级作用域缺席带来的问题

`var` 没有块级作用域，`if`、`for`、`{}` 都关不住它，里面声明的变量会泄漏到外层。

```js
if (true) { var a = 1 }
for (var i = 0; i < 3; i++) {}
console.log(a, i)          // => 1 3（都泄漏到外层）
```

循环变量 `i` 本想只在循环内用，循环结束后却仍能访问，容易在异步或嵌套循环里被意外改写。这正是后面引入 `let` 的原因。

- `var`：函数级作用域，块内声明会泄漏到外层
- `let`（ES6）：块级作用域，`if`/`for` 能关住，循环变量不外泄

> 💡 用 `let` 后 `for (let i = 0; ...)` 的 `i` 不会外泄，块级作用域的具体用法在 ES6 章节展开。
