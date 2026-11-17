===PART===
id: part-04
order: 4
title: 引用类型与内置对象
range: 042–064
desc: 掌握对象、数组、字符串及 Math、Date 等内置对象
===CH===
no: 26
title: 对象数据类型
lessons: 042–043
summary: 对象以键值对描述一个事物的多个属性，增删改查都通过属性访问完成
points: 对象把一组相关数据打包，每个数据配一个键名 || 键名符合标识符规则时才能省略引号 || 点语法跟字面量名，方括号里放变量或字符串 || 增删改是同一操作，delete 负责移除属性 || typeof 分辨不出对象、数组和日期
===BODY===
### 对象是什么：给一组数据打包

描述一个事物往往要写好几个字段。摊成一堆独立变量，字段之间看不出归属，数量一多也难维护。

对象把相关数据收进一个容器，每一项由「键」和「值」配成一对。键就是给值起的名字，三者分别也叫属性名、属性值、属性。

这样设计让一组数据有了归属，读代码时一眼能看出它们描述的是同一个东西。

```js
var person = { name: "kerwin", age: 100, sex: "男" }
console.log(person.name)   // => "kerwin"
```

#### 字面量的书写细节

用花括号包裹，键值对之间以逗号分隔，键与值用冒号连接。冒号不是赋值号，它只表示「键对应值」。

最后一项后面不要再加逗号，虽然现代浏览器允许，但保持一致更稳妥。

```js
var obj = { name: "kerwin", age: 100 }
```

#### 键名的引号规则

键名符合标识符规则时才能省略引号：字母、`$`、`_` 开头，且只含字母、数字、`$`、`_`。

因为含特殊字符、空格或数字开头的名字不是合法标识符，所以必须加引号，否则引擎无法解析。

| 键名写法 | 引号 | 原因 |
|---|---|---|
| `name` | 可省略 | 合法标识符 |
| `"name"` | 加也等价 | 合法标识符 |
| `"a+b"` | 必须加 | 含特殊字符 |
| `"my name"` | 必须加 | 含空格 |
| `"1abc"` | 必须加 | 数字开头 |

### 两种创建方式：字面量与 new Object()

创建空对象可以用字面量 `{}`，也可以用 `new Object()` 再逐个加属性，两者效果完全相同。

字面量更简洁，所以日常一律用它；`new Object()` 只在强调构造函数时才出现。

```js
var a = { name: "kerwin", age: 100 }
var b = new Object()
b.name = "kerwin"
b.age = 100
```

> 💡 `new` 这个关键字后面会反复见到，例如 `new Date()`、`new Array()`、`new String()`。

### 增删改查：属性的四种操作

给 `对象.键` 赋值时，键已存在就是修改，不存在就是新增——增和改其实是同一个动作。

删除用 `delete` 关键字，它不是方法，不能写成 `obj.delete(...)`。判断键是否存在用 `in`，键名要加引号。

```js
var obj = { name: "kerwin", age: 100 }
obj.age = 200               // 改：键已存在
obj.sex = "男"               // 增：键不存在
delete obj.sex              // 删：移除属性
console.log("name" in obj)  // => true
console.log(obj)            // => { name: "kerwin", age: 200 }
```

直接读不存在的键只得到 `undefined`，无法区分「没有这个键」和「值恰好是 undefined」，所以判断存在要用 `in`。

### 点语法与中括号语法的差别

读取属性有两条路：点语法后面跟字面的键名，方括号里放字符串或变量。

| 写法 | 括号里放什么 | 适用场合 |
|---|---|---|
| `obj.name` | 字面的键名 | 键名是合法标识符 |
| `obj["name"]` | 字符串 | 与点语法等价 |
| `obj["a+b"]` | 含特殊字符的键名 | 键名不符合标识符规则 |
| `obj[key]` | 变量，取它的值当键名 | 键名要到运行时才知道 |

最常见的错误是把 `obj.key` 当成取变量 `key` 的值。它找的是名叫 `key` 的属性，只有 `obj[key]` 才会用变量的值。

```js
var key = "name"
var obj = { name: "kerwin" }
console.log(obj.key)    // => undefined
console.log(obj[key])   // => "kerwin"
```

### 什么时候必须用中括号

当键名含特殊字符、空格或以数字开头时，点语法写不出来，只能用 `obj["a+b"]` 这种形式。

因为 `obj.a+b` 会被解析成 `obj.a` 加变量 `b`，而不是取一个叫 `a+b` 的键。

```js
var obj = { "a+b": 100 }
console.log(obj["a+b"])   // => 100
```

另一个必须用中括号的场合，是键名存在变量里、要到运行时才确定，这时点语法无能为力。

### 对象里能装什么，以及 typeof

任何类型都能作为值，包括数组、另一个对象和函数。值为函数时称为方法，方法里的 `this` 指向所属对象。

```js
var person = {
    name: "kerwin",
    hobbies: ["篮球", "代码"],
    address: { city: "北京" },
    sayHi: function () { return this.name }
}
console.log(person.address.city)   // => "北京"
console.log(person.hobbies[0])     // => "篮球"
console.log(person.sayHi())        // => "kerwin"
```

`typeof` 对普通对象、数组、`Date` 一律返回 `"object"`，分不清具体是哪一种。要精确判断数组，得改用 `Array.isArray()`。

```js
console.log(typeof person)                  // => "object"
console.log(typeof [])                      // => "object"
console.log(Array.isArray(person.hobbies))  // => true
```
===CH===
no: 27
title: 对象的遍历与存储
lessons: 044–045
summary: for...in 的键是字符串；复杂类型存的是地址，赋值与比较都按引用走
points: for...in 的键是字符串，取值用 obj[k] || 遍历顺序不可依赖，要顺序就用数组 || 基本类型存值在栈，复杂类型存地址在堆 || 两个对象相等比的是地址而非内容 || 改属性会影响原对象，换地址不会
===BODY===
### for...in 遍历对象

对象有多个属性时，用 `for...in` 逐个取出键，再配合方括号取值。

```js
var obj = { name: "kerwin", age: 100, sex: "男" }
for (var k in obj) {
    console.log(k, obj[k])   // => "name" "kerwin" / "age" 100 / "sex" "男"
}
```

#### 循环变量是字符串

`k` 拿到的是字符串形式的键，所以取值只能写 `obj[k]`，写成 `obj.k` 会去找名叫 `k` 的属性。

也正因为它是字符串，直接对 `k` 做算术会变成拼接，`k + 1` 得到 `"11"`，要先转成数字。

```js
var scores = { "1": "a", "2": "b" }
for (var k in scores) {
    console.log(k + 1)         // => "11" "21"
    console.log(Number(k) + 1) // => 2 3
}
```

#### 遍历顺序与常用搭配

数字型键按升序先输出，其余键按定义顺序，但这个顺序不可依赖，需要稳定顺序就该用数组。

配合遍历常做三件事：累加所有值、统计属性个数、按条件筛出部分键组成新对象。

```js
var obj = { a: 1, b: 2, c: 3 }
var sum = 0
for (var k in obj) { sum += obj[k] }
console.log(sum)                     // => 6
console.log(Object.keys(obj).length) // => 3
```

### 基本类型与引用类型的存储差异

同样用 `=` 赋值，基本类型互不影响，对象却会跟着变，差别在于值存在哪里。

可以把内存想成两块区域：栈里放得下固定大小的值，堆里放大小不固定的对象数据。

| 类型 | 数据存放 | 变量里存的是 |
|---|---|---|
| 基本类型 | 栈 | 值本身 |
| 复杂类型（对象、数组、函数） | 堆 | 指向堆的地址 |

```js
var num1 = 100, num2 = num1
num2 = 200
console.log(num1)   // => 100
var obj1 = { name: "kerwin" }, obj2 = obj1
obj2.name = "tiechui"
console.log(obj1.name)   // => "tiechui"
```

`var obj2 = obj1` 复制的是地址而不是数据，两个名字指向堆里同一份对象，这叫引用传递。

### 赋值与比较：比的是地址不是内容

对象用 `==` 或 `===` 比较的是地址，内容相同的两个独立对象依然不相等。

因为它们是堆里两块不同的数据，只有指向同一地址才相等。

```js
var obj1 = { name: "kerwin" }
var obj2 = { name: "kerwin" }
console.log(obj1 === obj2)   // => false
var obj3 = obj1
console.log(obj1 === obj3)   // => true
```

> 🧠 对象比较的是「身份」（是不是同一个），不是「内容」；要比内容得逐个属性比。

### 克隆：逐个键拷出新对象

想让两个对象互不干扰，不能用赋值，得把每个键拷进一个新对象。

```js
var obj1 = { name: "kerwin", age: 100 }
var obj2 = {}
for (var k in obj1) { obj2[k] = obj1[k] }
obj2.name = "tiechui"
console.log(obj1.name)   // => "kerwin"
```

这样第一层属性确实独立了，改 `obj2.name` 不再影响 `obj1`。

### 浅拷贝的漏洞

上面这种只拷一层的做法叫浅拷贝。遇到嵌套对象，拷过去的仍是地址，改内层照样联动。

```js
var obj1 = { name: "kerwin", address: { city: "北京" } }
var obj2 = {}
for (var k in obj1) { obj2[k] = obj1[k] }
obj2.address.city = "上海"
console.log(obj1.address.city)   // => "上海"
```

| 拷贝方式 | 效果 |
|---|---|
| 直接赋值 `obj2 = obj1` | 起别名，不是拷贝 |
| `for...in` 循环 | 浅拷贝，嵌套仍共享 |
| `JSON.parse(JSON.stringify(obj))` | 深拷贝，有局限 |

要得到完全独立的一份，可用 `JSON.parse(JSON.stringify(obj))` 先拍平成字符串再重建，局限留到讲 JSON 时展开。

### 函数传参：改属性与换地址

函数传参时，改形参的属性会影响外部对象，因为形参拿到的是同一个地址。

而给形参整体重新赋值只是换了个指向，不会影响外面那份数据。

```js
function changeProp(o) { o.name = "改过了" }
function rebind(o) { o = { name: "新对象" } }
var a = { name: "原始" }
changeProp(a)
console.log(a.name)   // => "改过了"
var b = { name: "原始" }
rebind(b)
console.log(b.name)   // => "原始"
```

| 操作 | 影响外面吗 |
|---|---|
| `o.name = xxx`（改属性） | 影响 |
| `o = {...}`（换地址） | 不影响 |
===CH===
no: 28
title: 数组基础
lessons: 046–047
summary: 数组是有序集合，按从 0 开始的索引访问，length 可读可写
points: 数组用数字下标访问，索引从 0 开始 || new Array(10) 建的是空数组而非元素 || length 改小截断、改大补空位，字符串只读 || 越界访问返回 undefined，跳着赋值产生稀疏数组 || 数组赋值复制的是地址，需循环或 slice 真正复制
===BODY===
### 数组是什么，和对象有何不同

数组是有序的数据集合，靠从 0 开始的索引访问元素。

对象描述一个事物的多个属性，数组则存放一批同类数据，两者的定位不同。

| 对比 | 对象 | 数组 |
|---|---|---|
| 键 | 有意义的字符串 | 数字下标，从 0 起 |
| 顺序 | 不保证 | 保证 |
| 用途 | 一个事物的多个属性 | 多个同类数据 |

```js
var person = { name: "张三", age: 18 }
var names = ["张三", "李四", "王五"]
console.log(names[0])   // => "张三"
```

### 创建数组与 new Array() 的陷阱

创建推荐字面量 `[]`，元素类型可以混放，写起来也最直观。

`new Array()` 有个陷阱：只传一个数字时，它被理解成「要一个这么长的空数组」。

```js
var a = new Array(10)
console.log(a.length)   // => 10（10 个空位，不是元素 10）
var b = [10]
console.log(b.length)   // => 1（只有一个元素 10）
```

所以 `new Array(10)` 得到的是空数组，而 `[10]` 才是含元素 `10` 的数组，一律用字面量最稳妥。

### length 与索引

`length` 是元素个数，最后一项的索引是 `length - 1`，取末项的标准写法是 `arr[arr.length - 1]`。

与众不同的是它可读可写：改小会截断，改成 0 可清空，改大则在末尾补空位。

字符串的 `length` 是只读的，改了没用，这是两者最容易混的差别。

```js
var arr = [1, 2, 3, 4, 5]
console.log(arr.length)           // => 5
console.log(arr[arr.length - 1])  // => 5
arr.length = 3
console.log(arr)                  // => [1, 2, 3]
```

访问越界不报错，只返回 `undefined`；也可以直接跳到某个索引赋值，中间会自动留出空位。

这类中间有空位的数组叫稀疏数组，遍历时容易踩坑，实际开发应始终按顺序追加，不要跳着赋值。

### 遍历数组

遍历用 `for` 配 `arr.length`，条件写 `<` 才不会多跑一次、多打一个 `undefined`。

```js
var arr = ["a", "b", "c"]
for (var i = 0; i < arr.length; i++) {
    console.log(i, arr[i])   // => 0 "a" / 1 "b" / 2 "c"
}
```

倒序从 `length - 1` 递减到 0 即可，适合需要从后往前处理的场景。

```js
for (var i = arr.length - 1; i >= 0; i--) {
    console.log(arr[i])   // => "c" "b" "a"
}
```

### 复制仍是引用问题

和对象一样，`var arr2 = arr1` 只是给同一份数据起别名，改 `arr2[0]` 原数组也变。

```js
var arr1 = [1, 2, 3]
var arr2 = arr1
arr2[0] = 999
console.log(arr1[0])   // => 999
```

要得到独立副本，可以循环逐项赋值，或用 `concat()`、`slice()` 不带参数调用。

```js
var arr3 = arr1.slice()
arr3[0] = 111
console.log(arr1[0])   // => 999（原数组没变）
```
===CH===
no: 29
title: 排序算法：冒泡与选择
lessons: 048–049
summary: 冒泡边比边换、选择每轮只换一次，两者双层循环的边界写法不同
points: 外层都跑 length-1 轮，最后一个自然归位 || 冒泡内层 length-1-m 跳过已归位部分 || 选择内层从 m+1 起，只在剩余元素里找最小值索引 || 交换必须借临时变量，否则原值被覆盖 || 选择每轮最多换一次，冒泡可能每次比较都换
===BODY===
### 为什么手写排序

实际开发直接用 `arr.sort()`，手写冒泡与选择是为了训练双层循环如何配合完成一件事。

重点不是背代码，而是看懂两层循环各自控制什么、边界为什么那样写。

### 冒泡排序：相邻比较、边比边换

冒泡是相邻两项比大小，大的往后交换，一轮下来最大值沉到末尾。

因此下一轮只需处理前面的部分，末尾已经归位的元素不必再比。

```js
var arr = [44, 3, 2, 1, 11, 33]
for (var m = 0; m < arr.length - 1; m++) {
    for (var i = 0; i < arr.length - 1 - m; i++) {
        if (arr[i] > arr[i + 1]) {
            var t = arr[i]
            arr[i] = arr[i + 1]
            arr[i + 1] = t
        }
    }
}
console.log(arr)   // => [1, 2, 3, 11, 33, 44]
```

内层写成 `i < arr.length - 1 - m`：减 1 是因为要访问 `i+1`，减 `m` 是跳过末尾已归位的部分。

交换必须借一个临时变量，否则先赋值会把原值冲掉，两杯水互换得靠第三只杯子。

### 选择排序：每轮找最小、只换一次

选择排序每轮在剩余元素里找出最小值的索引，再和本轮开头交换。

记索引而不是记值，是因为只知道最小值、不知道它在哪，就没法完成交换。

```js
var arr = [44, 3, 2, 1, 5, 8, 111]
for (var m = 0; m < arr.length - 1; m++) {
    var min = m
    for (var i = m + 1; i < arr.length; i++) {
        if (arr[i] < arr[min]) min = i
    }
    var t = arr[m]
    arr[m] = arr[min]
    arr[min] = t
}
console.log(arr)   // => [1, 2, 3, 5, 8, 44, 111]
```

内层从 `m + 1` 起，因为 `arr[m]` 已作为假设的最小值，不必和自己比。

它一轮最多交换一次，比冒泡「边比边换」省得多，本轮开头就是最小时可以跳过交换。

### 双重循环的边界差异

两种算法的外层一致，都跑 `length - 1` 轮，因为每轮归位一个、最后一个自然就位。

| 边界 | 冒泡 | 选择 | 原因 |
|---|---|---|---|
| 外层 | `m < length - 1` | `m < length - 1` | 每轮归位一个 |
| 内层起点 | `i = 0` | `i = m + 1` | 冒泡从头比相邻对，选择只在剩余区找最小 |
| 内层终点 | `i < length - 1 - m` | `i < length` | 冒泡要访问 `i+1`，且跳过末尾 `m` 个 |
| 比较对象 | `arr[i]` 与 `arr[i+1]` | `arr[i]` 与 `arr[min]` | 前者相邻交换，后者只更新最小索引 |

冒泡内层的 `- m` 属于效率优化，不写结果也正确；选择内层从 `m+1` 开始则是逻辑需要。

### 交换次数与比较次数对比

两者比较次数都是 `n(n-1)/2`，差别集中在交换次数与内层方向上。

| 对比 | 冒泡排序 | 选择排序 |
|---|---|---|
| 交换次数 | 多，可能每比一次就换 | 少，每轮最多换一次 |
| 每轮确定 | 最大值的最终位置 | 最小值的最终位置 |
| 稳定性 | 稳定 | 不稳定 |

> 🧠 需要顺序稳定、交换开销小的场合选择排序更划算；理解「轮数」与「每轮比较范围」的配合，比记住整段代码更有用。
===CH===
no: 30
title: 数组常用方法
lessons: 050–053
summary: 先按是否改变原数组分类，再分增删、截取查找与高阶方法记忆
points: 会改原数组的是增删、反转、排序与 splice || concat、join、slice 不改原数组 || push 返回新长度，pop 返回被删元素 || sort 默认按字符串排，要传比较函数 || 高阶方法都不改原数组，reduce 记得给初始值
===BODY===
### 先分清：会不会改变原数组

数组方法混用最容易出 bug，第一步是记住哪个会动原数组。

名字带增删、反转、排序、`splice` 的会改原数组；带拼接、截取、查找的返回新值，原数组保持不动。

| 分类 | 特点 | 代表方法 |
|---|---|---|
| 改变原数组 | 调用后 `arr` 本身变了 | `push` `pop` `unshift` `shift` `splice` `reverse` `sort` |
| 不改变原数组 | 返回新数组或新值 | `concat` `join` `slice` `indexOf` `lastIndexOf` |

```js
var arr = [1, 2, 3]
arr.push(4)
console.log(arr)   // => [1, 2, 3, 4]（原数组变了）
```

### 改变原数组：增删与 splice

`push`、`unshift` 往末尾或开头加元素，`pop`、`shift` 从末尾或开头删元素。

| 方法 | 位置 | 作用 | 返回值 |
|---|---|---|---|
| `push(x)` | 末尾 | 添加 | 新长度 |
| `pop()` | 末尾 | 删除 | 被删的元素 |
| `unshift(x)` | 开头 | 添加 | 新长度 |
| `shift()` | 开头 | 删除 | 被删的元素 |

`push` 返回的是新长度而不是数组，想拿数组本身别接返回值，这是最常见的误用。

```js
var arr = [1, 2, 3]
var r = arr.push(4)
console.log(r)      // => 4（长度，不是数组）
console.log(arr)    // => [1, 2, 3, 4]
```

`splice(i, n, ...)` 从 `i` 起删 `n` 个并可插入新元素，返回值永远是被删元素组成的数组。

它增删改都能做：第二参数给 0 就是纯插入，给正数就是删除，后面再跟值就是替换。

```js
var arr = ["a", "b", "c", "d", "e"]
console.log(arr.splice(1, 1))       // => ["b"]
console.log(arr.splice(1, 0, "x"))  // => []
```

删某个元素的标准做法是先 `indexOf` 找到位置，再 `splice(index, 1)`；用 `delete` 会留下空位且长度不变。

### 改变原数组：reverse 与 sort 的坑

`reverse()` 反转原数组，`sort()` 排序原数组，两者返回的都是同一个数组。

`sort()` 不带参数时把元素转成字符串按编码比，所以 `[11, 21, 3]` 会排成 `[11, 21, 3]`。

```js
var arr = [11, 21, 56, 7, 3]
arr.sort()
console.log(arr)   // => [11, 21, 3, 56, 7]（不是按数值）
```

按数值大小要传比较函数：返回负数就把前一个排前面，所以 `x - y` 升序、`y - x` 降序。

```js
arr.sort(function (x, y) { return x - y })
console.log(arr)   // => [3, 7, 11, 21, 56]
```

### 不改变原数组：转换与拼接

这一组方法都返回新值，`concat` 拼接、`join` 连成字符串、`slice` 截取一段。

| 方法 | 作用 | 返回值 | 要点 |
|---|---|---|---|
| `concat(x)` | 拼接 | 新数组 | 数组参数会被拆开 |
| `join(sep)` | 用分隔符连成串 | 字符串 | 默认逗号 |
| `slice(a, b)` | 取 `[a, b)` 一段 | 新数组 | 不含结束位 |

`slice(a, b)` 包含开始、不包含结束，`slice(2, -1)` 里的负数表示从末尾数。

`concat()`、`slice()` 不带参数就是复制数组，因为返回的是全新一份，改它不影响原数组。

```js
var arr = ["a", "b", "c", "d"]
console.log(arr.slice(1, 3))   // => ["b", "c"]（不含索引 3）
console.log(arr.join("-"))     // => "a-b-c-d"
console.log(arr)               // => ["a", "b", "c", "d"]（没变）
```

> ⚠️ `splice` 与 `slice` 只差一个字母：前者改原数组、第二参数是删除个数；后者不改、第二参数是结束索引且不含它。

### 查找与判断：indexOf 到 find

查找类方法找不到一律返回 `-1`，判断存在写 `!== -1`，这个约定在字符串上也成立。

| 方法 | 作用 | 返回值 |
|---|---|---|
| `indexOf(x)` | 首次出现位置 | 索引或 `-1` |
| `lastIndexOf(x)` | 末次出现位置 | 索引或 `-1` |
| `includes(x)` | 是否包含 | 布尔 |
| `find(fn)` | 首个满足的元素 | 元素或 `undefined` |
| `every(fn)` | 是否全部满足 | 布尔 |
| `some(fn)` | 是否至少一个满足 | 布尔 |

```js
var arr = ["a", "b", "c", "a"]
console.log(arr.indexOf("a"))        // => 0
console.log(arr.indexOf("z"))        // => -1
console.log(arr.indexOf("a") !== -1) // => true
```

`every` 一假即假，`some` 一真即真，`find` 返回元素本身而不是数组。

> 💡 数组去重可写 `Array.from(new Set(arr))`；老思路是准备空数组逐项检查「有没有见过」，没见过才 `push`。

### 高阶方法：forEach / map / filter / reduce

高阶方法接收函数作参数，且都不改原数组，返回值类型各不相同。

| 方法 | 返回值 | 用途 |
|---|---|---|
| `forEach(fn)` | `undefined` | 只执行，不产出 |
| `map(fn)` | 等长新数组 | 逐项改造 |
| `filter(fn)` | 新数组 | 留下返回 true 的项 |
| `reduce(fn, init)` | 累计结果 | 求和、计数、分组 |

```js
var arr = [1, 2, 3, 4, 5]
console.log(arr.map(function (n) { return n * 2 }))     // => [2, 4, 6, 8, 10]
console.log(arr.filter(function (n) { return n > 2 }))  // => [3, 4, 5]
```

`reduce` 务必给初始值：传 `""` 时 `prev + item` 走字符串拼接得到 `"12345"`，传 `0` 才是求和 `15`。

```js
console.log(arr.reduce(function (p, n) { return p + n }, 0))  // => 15
console.log([].reduce(function (p, n) { return p + n }, 0))   // => 0（不给初始值会报错）
```

> 💡 四个方法返回值类型不同：`map` 变形、`filter` 筛、`find` 找一、`reduce` 累计，别混用。
===CH===
no: 31
title: 字符串基础与统计案例
lessons: 054–055
summary: 字符串有类数组的索引与 length，但不可变，统计字符用对象当计数器
points: 字符串能按索引读、有 length，但只读不可变 || new String() 得到的是对象，一律用字面量 || 所谓修改其实都返回新字符串，原串不变 || 统计次数用对象做计数器，键用方括号访问 || 初值非 0 才能用真假判断，否则判 undefined
===BODY===
### 需求与思路

字符串是「类数组」：能读 `length`、用 `charAt(i)` 取字符、用 `for` 遍历，所以统计字符可以像遍历数组一样挨个处理。

但它属于基本类型、不可变：给 `str[1]` 赋值、改 `length` 都不会生效，因为所谓「修改」其实都是生成一个新字符串，原串永远不变。

案例统计每个字符出现的次数：用空对象当计数器，键字符、值次数，这样不必预先知道会出现哪些字符；首次见到初始化为 1，再见到累加。

### 完整案例代码

```js
// 统计每个字符出现的次数
var str = "abcabcab"
var counter = {}                              // ← 关键点：用对象做计数器，键字符值次数
for (var i = 0; i < str.length; i++) {        // ← 关键点：遍历字符串，length 作边界
  var ch = str.charAt(i)                     // ← 关键点：charAt(i) 取当前字符
  if (counter[ch] === undefined) {           // ← 关键点：判定条件，判 undefined 更稳妥
    counter[ch] = 1                          // 第一次出现，初始化为 1
  } else {
    counter[ch]++                            // 再出现，计数加 1
  }
}
console.log(counter)                         // => { a: 3, b: 3, c: 2 }
console.log(str.charAt(0))                   // => "a"
console.log(str.length)                      // => 8
// str[1] = "z" 不生效：字符串不可变
```

### 关键知识点

- **用对象做计数器**：键是字符、值是次数，所以不必预先知道会出现哪些字符；换成给每个字母开变量根本写不出来，因为字符集合运行时才知道。
- **判断用 `=== undefined` 而不是真假**：首次访问得到 `undefined`，据此初始化为 1。若写成 `if (counter[ch])` 且初值改成 0，0 是假值会反复初始化，永远加不上去。`(counter[ch] || 0) + 1` 是一行等价写法。
- **字符串不可变，遍历只读**：`charAt(i)` 只能取值，给 `str[1]` 赋值不会生效，因为字符串是基本类型；想换内容只能整体重新赋值，统计过程不改动原串。
===CH===
no: 32
title: 字符串常用方法与模糊查询
lessons: 056–057
summary: 按取字符、截取、查找替换、分割转换分组记方法，模糊查询靠 filter 加 indexOf
points: 截取优先用 slice，substring 遇负数交换 || substr 第二参数是长度，已不推荐 || charAt 越界得空串，索引得 undefined || replace 只换第一个，全替换靠 split || 模糊查询用 filter 保留包含关键词的项
===BODY===
### 字符串不可变，方法都返回新值

字符串的所有方法都不会改动原串，而是返回一个新的字符串或值。

因为原串不可变，所以 `toUpperCase()`、`replace()` 这类操作必须接住返回值才有意义。

```js
var s = "kerwin"
var upper = s.toUpperCase()
console.log(s)       // => "kerwin"（原串不变）
console.log(upper)   // => "KERWIN"（新串）
```

### 查：indexOf 与包含判断

`indexOf` 返回子串首次出现的位置，`lastIndexOf` 从后往前找，规则与数组完全一致。

找不到一律返回 `-1`，所以判断是否包含要写 `!== -1`，不能当布尔直接用。

| 方法 | 作用 | 找不到时 |
|---|---|---|
| `indexOf(x)` | 首次出现位置 | `-1` |
| `lastIndexOf(x)` | 末次出现位置 | `-1` |
| `includes(x)` | 是否包含 | `false` |

```js
var s = "abcda"
console.log(s.indexOf("a"))         // => 0
console.log(s.indexOf("z"))         // => -1
console.log(s.indexOf("z") !== -1)  // => false
```

### 取：字符、编码与截取

取字符有 `charAt(i)` 和更简短的 `str[i]` 两种，越界时返回值不同。

| 方法 | 越界返回 | 说明 |
|---|---|---|
| `charAt(i)` | `""` 空串 | 取第 i 个字符 |
| `str[i]` | `undefined` | 更简短 |
| `charCodeAt(i)` | `NaN` | 返回字符编码 |
| `String.fromCharCode(n)` | — | 编码转字符 |

```js
console.log("kerwin".charAt(1))        // => "e"
console.log("kerwin"[100])             // => undefined
console.log("A".charCodeAt(0))         // => 65
console.log(String.fromCharCode(101))  // => "e"
```

三个截取方法功能类似，但第二参数含义完全不同，最容易混。

| 方法 | 第二参数 | 负数 | 要点 |
|---|---|---|---|
| `substr(a, len)` | 截取长度 | 起点支持 | 已不推荐 |
| `substring(a, b)` | 结束索引（不含） | 当作 0 | 起点大于终点会自动交换 |
| `slice(a, b)` | 结束索引（不含） | 表示倒数 | 行为最一致，优先使用 |

`substring(1, -1)` 最反直觉：负数变 0，再自动交换大小，相当于 `substring(0, 1)`。

统一用 `slice` 能避开这些坑，它支持负数、不会自动交换。

```js
var s = "kerwin"
console.log(s.substr(1, 2))     // => "er"
console.log(s.slice(1, -1))     // => "erwi"
console.log(s.substring(3, 1))  // => "er"（自动交换）
```

### 转：大小写、分割、拼接、去空格

这一组负责形态转换，同样都返回新串，不改原串。

| 方法 | 作用 |
|---|---|
| `toUpperCase()` / `toLowerCase()` | 大小写转换，返回新串 |
| `split(sep)` | 字符串转数组，空串按字符切 |
| `concat(s)` | 拼接，实际多用 `+` |
| `trim()` / `trimStart()` / `trimEnd()` | 去两头 / 开头 / 结尾空白 |

```js
console.log("Kerwin".toLowerCase())                 // => "kerwin"
console.log("abc".split(""))                        // => ["a", "b", "c"]
console.log("  a   b  ".trim())                     // => "a   b"（中间空格不动）
console.log("hello".split("").reverse().join(""))  // => "olleh"
```

忽略大小写比较时，把两边都 `toLowerCase()` 再用 `===` 即可。

`split("").reverse().join("")` 是字符串与数组互转的经典链，可用来反转字符串。

### 替换：replace 只换第一个

`replace` 默认只替换首个匹配，链式调用再 replace 一次也只是再换一个。

要全替换可用正则加 `g`，或 `split("-").join("*")` 这个不用正则的土办法。

```js
var s = "a-b-c-d"
console.log(s.replace("-", "*"))     // => "a*b-c-d"（只换第一个）
console.log(s.split("-").join("*"))  // => "a*b*c*d"（全部替换）
```

| 写法 | 结果 |
|---|---|
| `s.replace("-", "*")` | `a*b-c-d` |
| `s.replace(/-/g, "*")` | `a*b*c*d` |
| `s.split("-").join("*")` | `a*b*c*d` |

### 案例：模糊查询

给定列表和关键词，用 `filter` 保留 `item.indexOf(keyword) > -1` 的项。

因为找不到时 `indexOf` 返回 `-1`，其余值都表示「包含」，这比手写循环加 `push` 干净得多。

```js
var arr = ["abc", "bcc", "bcd", "aab"]
var res = arr.filter(function (item) {
    return item.indexOf("bc") > -1
})
console.log(res)   // => ["abc", "bcc", "bcd"]
```

| 元素 | `indexOf("bc")` | 保留？ |
|---|---|---|
| `"abc"` | 1 | 是 |
| `"bcc"` | 0 | 是 |
| `"bcd"` | 0 | 是 |
| `"aab"` | -1 | 否 |

> ⚠️ 容易漏的一步是大小写：比较前把关键词和每项都统一 `toLowerCase()`，否则输入 `BC` 搜不到 `abc`。
===CH===
no: 33
title: JSON 与模板字符串
lessons: 058–059
summary: JSON 是双引号字符串用于传输，模板字符串用反引号与 ${} 拼接
points: JSON 本质是字符串，键必须双引号、不能有函数 || 对象与字符串互转靠序列化和解析 || 解析失败会抛异常，要用 try...catch || 模板字符串的 ${} 内可放任意表达式并直接换行 || JSON 序列化可深拷贝，但会丢函数
===BODY===
### JSON 是什么，为什么需要它

前后端之间只能传文本，对象没法直接过网络，于是约定一种长得像 JS 对象、本质是字符串的格式：JSON。

关键认知是 JSON 是字符串，不是对象，`typeof` 一看便知。

```js
var obj = { name: "kerwin", age: 100 }
var jsonStr = '{"name":"kerwin","age":100}'
console.log(typeof obj)       // => "object"
console.log(typeof jsonStr)   // => "string"
```

### JSON 的语法规则

JSON 标准只认双引号：键必须加双引号，字符串值也只能用双引号。

单引号、不加引号的键、末尾多余逗号都不合法，函数与 `undefined` 也不允许出现。

| 规则 | 合法 | 不合法 |
|---|---|---|
| 键 | `"name"` | `name`、`'name'` |
| 字符串值 | `"kerwin"` | `'kerwin'` |
| 结尾 | 无多余逗号 | 多一个逗号 |
| 值类型 | 字符串、数字、布尔、数组、对象、`null` | 函数、`undefined` |

```js
JSON.parse('{"name":"kerwin"}')   // => { name: "kerwin" }
JSON.parse("{'name':'kerwin'}")   // => 抛 SyntaxError
```

### JSON.parse 与 stringify

发出去用 `JSON.stringify()` 把对象转成字符串，收回来用 `JSON.parse()` 解析回对象。

解析后就能正常用点语法、遍历和访问属性，`stringify` 会自动给键加上双引号。

```js
var obj = { name: "kerwin", age: 100 }
var str = JSON.stringify(obj)
console.log(str)          // => '{"name":"kerwin","age":100}'
var back = JSON.parse(str)
console.log(back.name)    // => "kerwin"
```

`stringify` 会丢掉值为 `undefined` 和函数的属性，`Date` 会变成字符串，`NaN`、`Infinity` 变成 `null`。

| 数据类型 | stringify 后 |
|---|---|
| `undefined`、函数 | 属性直接丢失 |
| `Date` | 变成字符串 |
| `NaN`、`Infinity` | 变成 `null` |
| 循环引用 | 直接报错 |

### 与 JS 对象的差别及解析坑

JS 对象键可不加引号、可用单引号、能放函数，JSON 三条都不行，这就是两者的核心差别。

`parse` 传入的不是字符串、或格式不合法，都会抛语法错误，而不是返回空值。

因为解析失败会抛异常，稳妥做法是用 `try...catch` 包住，避免整段程序崩掉。

```js
try {
    var obj = JSON.parse(str)
} catch (e) {
    console.log("JSON 格式有误")
}
```

第 27 章的深拷贝土办法 `JSON.parse(JSON.stringify(obj))`，就是先把整棵对象树拍平成字符串再重建。

由上表可知它只适合纯数据，遇到函数、`Date`、循环引用就会失真或报错。

### 模板字符串：${} 插值

ES6 之前拼字符串靠 `+`，变量一多，加号和引号看得人眼花，还容易漏引号。

反引号配 `${}` 可以直接把值嵌进去，`${}` 里能放任意表达式。

```js
var name = "kerwin", age = 100
console.log(`我叫${name}，今年${age}岁`)      // => "我叫kerwin，今年100岁"
console.log(`和是 ${10 + 20}`)                // => "和是 30"
console.log(`转大写 ${"abc".toUpperCase()}`)  // => "转大写 ABC"
```

这是普通拼接做不到的：`+` 只能拼值，`${}` 里可以写运算、三目和函数调用。

### 模板字符串：多行与引号

反引号内可以直接换行，缩进原样保留，特别适合拼多行的 HTML 片段。

内部的引号无需转义，但忘了反引号时 `${}` 会被原样输出。

```js
var html = `
    <ul>
        <li>${name}</li>
        <li>${age}</li>
    </ul>
`
console.log(`他说："你好"`)   // => 他说："你好"
```

> ⚠️ 用了 `${}` 却写成普通引号，会原样打印 `我叫${name}`，务必确认外层是反引号。
===CH===
no: 34
title: 数字与 Math
lessons: 060–061
summary: toFixed 返回字符串，取整要分清三个方法，随机数配合取整才得到整数
points: toFixed 返回字符串且四舍五入，浮点精度会误导结果 || ceil 往大取整、floor 往小取整 || Math.random 生成左闭右开的随机数 || 随机整数公式末尾的 +1 决定是否含最大值 || Math 是对象，方法必须带 Math. 前缀调用
===BODY===
### Math 是静态工具对象

`Math` 是内置的数学工具对象，里面的方法都是静态的，必须写成 `Math.xxx()`。

直接写 `floor(4.5)` 会报未定义，因为方法挂在对象上、不是全局函数。

```js
console.log(Math.abs(-10.2))       // => 10.2
console.log(Math.max(10, 50, 20))  // => 50
console.log(Math.PI)               // => 3.141592653589793
```

| 方法 | 作用 |
|---|---|
| `abs(x)` | 绝对值 |
| `sqrt(x)` | 平方根 |
| `pow(x, n)` | x 的 n 次方 |
| `max(...)` / `min(...)` | 最大 / 最小值 |

`Math.max()` 空参数返回 `-Infinity`，求数组最大值用循环或展开写法更稳妥。

### toFixed：返回字符串且会四舍五入

`toFixed(n)` 保留 n 位小数，但它返回的是字符串，想继续运算要先转回数字。

它做四舍五入，而浮点精度会让 `(1.005).toFixed(2)` 得到 `"1.00"`，涉及金额不要依赖它。

```js
console.log((123.456).toFixed(2))      // => "123.46"（字符串）
console.log((1.005).toFixed(2))        // => "1.00"（精度误差）
console.log((123.456).toFixed(2) - 0)  // => 123.46（转回数字）
```

数字字面量后直接跟点会被当成小数点，写成 `(123).toFixed(2)` 最稳妥。

金额计算应换成以「分」为单位的整数运算，避免浮点误差。

### 取整三兄弟：round / ceil / floor

三者都是取整，但方向不同，负数结果尤其要注意。

| 方法 | 规则 | `4.5` | `-4.5` |
|---|---|---|---|
| `Math.round` | 四舍五入 | `5` | `-4` |
| `Math.ceil` | 向上，往大走 | `5` | `-4` |
| `Math.floor` | 向下，往小走 | `4` | `-5` |

`ceil` 是天花板、`floor` 是地板，按数轴方向记就不会混。

```js
console.log(Math.ceil(4.06))    // => 5
console.log(Math.floor(-4.1))   // => -5
```

分页总页数要用 `Math.ceil(总数 / 每页条数)`，用 `floor` 会少算一页。

### Math.random 与随机整数公式

`Math.random()` 返回 `[0, 1)`，含 0 但永远到不了 1。

生成区间整数要三步：乘上跨度得到 `[0, 跨度)`，用 `floor` 取整，再加起点平移。

| 公式 | 范围 | 记忆点 |
|---|---|---|
| `floor(random() * (max - min)) + min` | 含 min，不含 max | 跨度不 `+1` |
| `floor(random() * (max - min + 1)) + min` | 两头都含 | `+1` 把终点算进来 |

```js
function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
console.log(rnd(10, 12))   // => 10、11、12 之一
```

忘写 `floor` 会得到小数，用它当数组下标只会取到 `undefined`。

以 10~12 为例，跨度是 `12 - 10 + 1 = 3`，取整得 0、1、2，加 10 就是 10、11、12。

### 常见易错与实用场景

想要 1~10 却写成 `random() * 10`，只能得到 0~9，正确写法是 `floor(random() * 10) + 1`。

随机取数组项、随机颜色都是这套区间公式的直接应用。

```js
var arr = ["石头", "剪刀", "布"]
console.log(arr[Math.floor(Math.random() * arr.length)])  // => 随机一项
console.log(Math.floor(Math.random() * 256))             // => 0 ~ 255，RGB 通道
```

> 🧠 案例的关键在于推导跨度与是否含终点，而不是背整段代码。
===CH===
no: 35
title: 时间对象 Date
lessons: 062–063
summary: Date 必须用 new 创建，get/set 成套读改时间，时间戳让日期计算变减法
points: 不加 new 的 Date() 返回字符串而非对象 || 传多个数字时月份从 0 开始，日期从 1 开始 || 月份要加一，getDay 得到星期几 || set 系列会自动进位，日期加减直接 setDate || 时间差先转时间戳相减，再按毫秒换算
===BODY===
### 创建 Date 的四种方式

`Date` 是对象，必须 `new Date()` 创建，生成的一刻就是当前时间。

漏写 `new` 的 `Date()` 只返回字符串，没有那些 get、set 方法。

| 传参 | 含义 | 注意 |
|---|---|---|
| 无 | 当前时间 | 必须带 `new` |
| 一个数字 | 距 1970-01-01 UTC 的毫秒数 | 东八区显示会 +8 小时 |
| 多个数字 | 年、月、日、时、分、秒 | 月从 0 起、日从 1 起 |
| 字符串 | 按格式解析 | 斜杠格式最兼容 |

```js
var d = new Date(2023, 0, 3, 10, 10, 10)
console.log(d.getFullYear())   // => 2023
console.log(Date())            // => 字符串，不是对象
```

注意传多个数字时最大的坑：月份从 0 开始，日期却从 1 开始，两者规则不一致。

超出范围不报错而是自动进位，`new Date(2023, 12, 3)` 得到 2024 年 1 月。

横杠格式在老浏览器里可能解析成 `Invalid Date`，斜杠格式最保险，用 `getTime()` 返回 `NaN` 可判断日期是否合法。

### get 系列：读出各部分

读用 get 系列，写用 set 系列，一一对应，这样把时间拆成可读字段。

```js
var d = new Date(2023, 0, 3)
console.log(d.getMonth() + 1)   // => 1
console.log(d.getDate())        // => 3
console.log(d.getDay())         // => 2（周二）
```

| 部分 | 读 get | 写 set | 范围 / 注意 |
|---|---|---|---|
| 年 | `getFullYear()` | `setFullYear()` | 四位年份 |
| 月 | `getMonth()` | `setMonth()` | 0~11，显示要 `+1` |
| 日 | `getDate()` | `setDate()` | 1~31 |
| 星期 | `getDay()` | 无 | 0~6，0 是周日 |
| 时 | `getHours()` | `setHours()` | 0~23 |
| 分 | `getMinutes()` | `setMinutes()` | 0~59 |
| 秒 | `getSeconds()` | `setSeconds()` | 0~59 |
| 毫秒 | `getMilliseconds()` | `setMilliseconds()` | 0~999 |
| 时间戳 | `getTime()` | `setTime()` | 毫秒数 |

三个易混点：`getDate()` 是几号、`getDay()` 是星期几、`getMonth()` 必须 `+1`。

星期几常用数组 `["周日", "周一", ...]` 按 `getDay()` 下标映射，比一串 `if...else` 干净。

### set 系列：自动进位做加减

set 系列会自动进位，做日期加减直接写 `setDate(getDate() + 7)` 求一周后。

因为跨月、跨年、闰年都由引擎处理，所以不要自己算天数。

```js
var d = new Date(2023, 0, 31)
d.setMonth(1)
console.log(d.getDate())   // => 3（2 月没 31 号，进到 3 月 3 日）
d.setDate(d.getDate() + 7)
```

> ⚠️ `setMonth()` 的取值同样是 0~11，别把 1 当成 1 月。

### 时间戳与对象互转

时间戳是距 1970-01-01 UTC 的毫秒数，让日期计算变成简单的减法。

可用 `getTime()`、`+new Date()` 或 `Date.now()` 取得，也能 `new Date(毫秒数)` 转回对象。

```js
console.log(new Date(1653280060490).getTime())   // => 1653280060490
console.log(Date.now())                          // => 当前时间戳
```

| 获取方式 | 写法 |
|---|---|
| 标准 | `new Date().getTime()` |
| 加号转换 | `+new Date()` |
| 最简洁 | `Date.now()` |

### 格式化与时间差（倒计时）

格式化时间的目的是把各 get 值取出、对小于 10 的补零，再拼成 `年/月/日 时:分:秒`。

```js
function p(n) { return n < 10 ? "0" + n : n }
var d = new Date()
var text = d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate())
console.log(text)   // => "2026/11/01"
```

倒计时则是两个时间都转成时间戳相减得毫秒差，再按 1000、60、60、24 逐级整除。

配合 `% 24`、`% 60` 去掉高位得到天时分秒，重点是「先相减再换算」这条思路。

| 单位 | 换算 |
|---|---|
| 1 秒 | `1000` 毫秒 |
| 1 分 | `1000 * 60` 毫秒 |
| 1 小时 | `1000 * 60 * 60` 毫秒 |
| 1 天 | `1000 * 60 * 60 * 24` 毫秒 |
===CH===
no: 36
title: 定时器
lessons: 064
summary: setTimeout 延迟一次、setInterval 反复执行，回调异步排队且必须清理
points: 延迟定时器一次，循环定时器反复执行 || 单位是毫秒，set 方法返回用于取消的数字 ID || setTimeout(fn,0) 排到同步代码之后 || 重复点击会开多个定时器，要先清再建 || 组件销毁不清理定时器会造成内存泄漏
===BODY===
### setTimeout：延迟执行一次

定时器让一段代码「等一会儿」执行，`setTimeout` 只执行一次。

两个方法都接收一个函数和毫秒数，`1000` 才是 1 秒，别把单位当成秒。

```js
setTimeout(function () {
    console.log("3 秒后执行")
}, 3000)
```

| 参数 | 说明 |
|---|---|
| 第一个 | 要执行的函数 |
| 第二个 | 毫秒数，1000 = 1 秒 |

```js
console.log("先执行")
setTimeout(function () { console.log("延迟执行") }, 1000)
```

### setInterval：反复执行

`setInterval` 每隔指定毫秒就执行一次，会一直跑到被取消为止。

它适合时钟、轮播这类需要持续刷新的场景，而一次性任务用 `setTimeout` 更合适。

```js
var timer = setInterval(function () {
    console.log("每 1 秒执行一次")
}, 1000)
```

### 返回值与 clear 清理

`set` 方法返回一个数字 ID，用对应的 `clear` 就能取消定时器。

两者底层共用同一个 ID 池，clear 其实可以混用，但配套写更可读。

| 方法 | 执行次数 | 取消 |
|---|---|---|
| `setTimeout(fn, ms)` | 1 次 | `clearTimeout(id)` |
| `setInterval(fn, ms)` | 直到取消 | `clearInterval(id)` |

```js
var t = setInterval(function () {}, 1000)
clearInterval(t)
```

重复点击「开始」会开出多个定时器同时跑，速度成倍增长，正确做法是先清再建。

```js
var timer = null
function start() {
    clearInterval(timer)          // 先清掉旧的
    timer = setInterval(function () { console.log("tick") }, 1000)
}
```

`clearInterval(undefined)` 不会报错，所以先清再建可以放心写。

### 异步排队：事件循环

JS 单线程，先跑完所有同步代码，主线程空了才从任务队列取回调。

所以 `setTimeout(fn, 0)` 不是立刻执行，而是排到当前代码最后，这叫事件循环。

```js
console.log("1")
setTimeout(function () { console.log("2") }, 0)
console.log("3")
// => 实际顺序：1 → 3 → 2
```

> 💡 这个特性常用来「等页面更新完再执行」，把收尾逻辑放进 0 毫秒的回调里。

### 不精确与任务堆积

定时器也不精确：浏览器有最小间隔限制、页面在后台会被降频、主线程忙时回调要排队。

因此精确计时要用时间戳差值，而不是累计定时器次数。

`clearInterval` 还有任务堆积问题：若某次执行耗时超过间隔，回调会在队列里越积越多。

| 对比 | `setInterval` | `setTimeout` 递归 |
|---|---|---|
| 间隔起算 | 上一次开始 | 上一次结束 |
| 任务堆积 | 会 | 不会 |
| 取消方式 | `clearInterval` | `clearTimeout` |

需要严格不重叠的循环，改用 `setTimeout` 递归，做完再安排下一次。

```js
function loop() {
    setTimeout(loop, 100)   // 做完才排下一次
}
loop()
```

### 实战：时钟、倒计时与清理

会走的时钟把格式化函数配 `setInterval`，并且要先手动调一次。

否则第一次执行要等满一个间隔、页面会有空白。

```js
function showTime() { console.log(new Date().toLocaleTimeString()) }
showTime()                   // 先立刻显示一次
var timer = setInterval(showTime, 1000)
```

倒计时每次循环都重新 `new Date()` 取当前时间，与目标时间戳相减。

差值 `<= 0` 时必须 `clearInterval` 停下，否则会一直输出负数。

组件销毁前记得清理定时器，单页应用里漏清是典型的内存泄漏来源。
