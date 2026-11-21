===PART===
id: part-09
order: 9
title: 面向对象
range: 126–134
desc: 从造对象到 class 与继承，把过程式代码封装成可复用模具
===CH===
no: 97
title: 初识面向对象
lessons: 126
summary: 面向对象把关注点从步骤转向职责，靠封装、继承、多态组织代码
points: 面向过程问怎么做，面向对象问谁来做 || 对象是属性与方法的集合，数据行为绑一起 || 封装打包、继承复用、多态同名不同实现 || 类只有一份模具，实例可有多个各自存数据 || 属性各实例一份，方法挂原型全体共用
===BODY===
### 面向过程与面向对象的分工

两种写法的差别在关注点：面向过程盯着"先做什么、再做什么"，面向对象先找"谁有能力做这件事"。

因为步骤一多，函数和变量就散落在全局，改一处容易牵连别处。把职责收进对象后，对外只留一个方法名，调用方不必知道内部顺序。

| 对比 | 面向过程 | 面向对象 |
|---|---|---|
| 关注点 | 步骤、顺序、细节 | 对象、职责、谁来做 |
| 代码组织 | 一堆函数加全局变量 | 对象自带属性和方法 |
| 复用方式 | 复制粘贴、抽函数 | 继承、组合 |
| 排错 | 顺着流程从头查 | 定位到某个对象 |
| 适合 | 简单一次性脚本 | 复杂、长期维护 |

注意对象方法内部依旧按步骤执行。面向对象并没有丢掉过程，只是把过程装进对象里。

### 对象是属性与方法的集合

对象就是把一组数据和操作这些数据的函数放进同一个容器，数据叫属性，函数叫方法。

因为 `name` 和 `say` 本来就只对这个对象有意义，拆成全局变量和全局函数就丢了归属，谁都能改。放在一起后，方法用 `this` 就能读到自己的属性。

```js
var obj = {
    name: "kerwin",
    say() { console.log(this.name) }
}
obj.say()   // => kerwin
```

先看拆开写会怎样：

```js
var name = "kerwin"
function say() { console.log(name) }
say()   // => kerwin，但 name 和 say 谁都能在别处改
```

`name` 变成全局变量、`say` 变成全局函数，两者丢了归属；下面把它们装进同一个对象，方法靠 `this` 读自己的数据。

这就是封装的第一层：数据与操作它的代码绑在一起管理，外部只能经由方法触碰数据。

### 封装、继承、多态各解决什么

三条特征层层递进，各解决一类重复与耦合问题。

因为先要把数据封装成对象，才谈得上对象之间复用能力；复用之后，又需要同一句调用在不同对象上产生不同行为。

| 特征 | 解决什么 | 本篇落点 |
|---|---|---|
| 封装 | 把属性和方法打包，对外只暴露必要接口 | 构造函数、`class` |
| 继承 | 子类自动拥有父类能力，只写增量 | 组合继承、`extends` |
| 多态 | 同名方法在不同对象上有不同实现 | 方法覆盖、`super` |

这三条不是 JS 独有，Java、C++、Python 都一样。JS 只是用原型链把它们实现出来。

### 类与实例：图纸与房子

类是造对象的模具，只有一份；实例是 `new` 出来的具体对象，可以有任意多个。

因为图纸不直接住人，实例才各自持有数据。所以属性写在构造函数里每份独立，方法挂到原型上全体共用，这个分工是第 100 章的主线。

```js
function Person(name) { this.name = name }
Person.prototype.say = function () { console.log(this.name) }
var p1 = new Person("张三")
var p2 = new Person("李四")
console.log(p1.name, p2.name)   // => 张三 李四
console.log(p1.say === p2.say)  // => true
```

结果是数据互不影响、方法却是同一个函数。理解这份分工，才算真正入门面向对象。

===CH===
no: 98
title: 创建对象的方式
lessons: 127
summary: 四种造对象方式层层递进，构造函数靠 new 接管创建与返回并可识别类型
points: 字面量与 new Object 只能一个个造，无法批量 || 工厂函数能批量，但 instanceof 认不出类型 || 构造函数让 new 自动建对象、自动返回 || 构造函数首字母大写是约定，不是语法要求 || 方法写在构造函数里会每个实例各存一份
===BODY===
### 字面量：直观，但只适合造一个

用 `{}` 直接写出属性和方法，是最短的造对象写法。

因为它一眼能看清结构，配置项、单例、接口返回的数据这类本来就只有一份的东西最适合。但要造第二个同结构对象，只能整段复制。

```js
var obj1 = { name: "蒸羊羔", material: [], cook() {} }
var obj2 = { name: "烧花鸭", material: [], cook() {} }
```

两者除 `name` 外代码全同。加一个字段要在每个对象里都改一遍，也没法根据数据批量生成，所以需要把造对象的过程抽成可复用的东西。

### new Object：换了写法，局限没变

`Object` 是 JS 内置的构造函数，`new Object()` 得到一个空对象，再逐个挂属性。

因为它和 `{}` 产出的是同一种对象，只是写法更长，`new Object() === {}` 为 false，每次都新建一块内存。造两个对象仍要写两遍。

```js
var o = new Object()
o.name = "蒸羊羔"
console.log(new Object() === {})   // => false
```

> ⚠️ 日常用 `{}` 即可；`new String("abc")` 得到的是对象而非字符串，`typeof` 是 `"object"`，别用包装类型造值。

一个 `new Object()` 仍只能造一个对象，批量生产的问题还在，于是要把"造"这一步收进函数。

`new` 包装类型和直接写字面量的差别可以直接测出来：

```js
var s1 = "abc"
var s2 = new String("abc")
console.log(typeof s1, typeof s2)   // => "string" "object"
console.log(s1 === s2)              // => false
```

字面量得到原始值，`new String` 得到的是对象，两者类型不同，自然也不全等。

### 工厂函数：能批量，却认不出类型

把造对象的过程包进普通函数，调用一次产出一个。

因为建对象、挂属性、返回这三步被收进函数，传不同数据就能得到结构一致的对象，重复代码随之消失。这也是它比前两种方式更通用的原因。

```js
function createObj(name) {
    var obj = {}
    obj.name = name
    obj.material = []
    return obj
}
var a = createObj("蒸羊羔")
console.log(a instanceof createObj)   // => false
```

`instanceof` 只认得出 `Object`。因为 `obj` 的原型指向 `Object.prototype`，和 `createObj` 没有关系，拿到的对象分不出"菜谱"还是"用户"。

### 自定义构造函数：new 接管创建与返回

配合 `new` 调用的函数，首字母按约定大写，函数体里用 `this` 挂属性。

因为 `new` 会自动建空对象、自动返回，函数体里只剩"挂成员"这一步。`this` 指向正在构建的实例，属性就落到新对象上，类型也能被 `instanceof` 认出。

```js
function CreateObj(name) {
    this.name = name
    this.cook = function () {}
}
var a = new CreateObj("蒸羊羔")
var b = new CreateObj("烧花鸭")
console.log(a instanceof CreateObj)   // => true
console.log(a.cook === b.cook)        // => false
```

最后一行暴露了遗留问题：每 `new` 一次函数体就重跑，`cook` 会新建一块内存，N 个实例存 N 份相同方法。

把 `new` 的四步写成代码，就能看清它替我们做了什么：

```js
function myNew(Ctor, ...args) {
  var obj = {}
  obj.__proto__ = Ctor.prototype
  var res = Ctor.apply(obj, args)
  return (typeof res === "object" && res !== null) ? res : obj
}
```

它依次建空对象、接原型、用 `apply` 把 `this` 指向新对象执行函数体，最后返回该对象。

### 四种方式对照与下一步

四种写法越往下越通用，因为每一步都在解决上一步的局限。

| 方式 | 写法 | 批量 | `instanceof` | 适用 |
|---|---|---|---|---|
| 字面量 | `{ ... }` | 否 | — | 单个配置、数据 |
| `new Object()` | `new Object()` | 否 | `Object` | 原理演示 |
| 工厂函数 | `createObj(x)` | 是 | 否 | 老代码、简单场景 |
| 自定义构造函数 | `new CreateObj(x)` | 是 | 是 | 本篇主线 |

构造函数是 `class` 的前身，底层仍是"构造函数加 `new`"，所以 `new` 的四步必须懂。

把方法从构造函数搬到一处共享，就是第 100 章原型的全部动机。

===CH===
no: 99
title: 构造函数注意问题
lessons: 128
summary: 构造函数的三条纪律：大写、不写 return、必须 new，忘写会污染全局
points: 首字母大写只是约定，语法并不检查 || new 的四步是建对象、接原型、跑函数体、返回 || 忘写 new 时 this 落到 window，全局被污染 || return 基本类型被忽略，引用类型顶替实例 || 严格模式或 new.target 能让漏写 new 尽早暴露
===BODY===
### 首字母大写只是约定

构造函数名首字母大写是行业默契，用来提醒调用方必须配 `new`。

因为语法并不检查大小写，小写函数照样能 `new` 成功。大写是给人看的信号，不是给引擎看的规定；`class` 沿用了同样的风格。

```js
function createObj(name) { this.name = name }
var o = new createObj("kerwin")
console.log(o.name)   // => kerwin
```

能跑，但读代码的人会以为它是普通函数，容易漏写 `new`。所以约定虽不强制，仍应遵守。

### new 调用时内部发生的四步

`new Fn()` 不只是调用函数，引擎会按固定四步造出实例。

因为要同时完成造对象、接原型、跑函数体、返回，构造函数里就不必自己 `return`，也不必自己建 `{}`。理解这四步，才能解释后面的 `return` 规则。

```js
function myNew(Ctor, ...args) {
    var obj = {}
    obj.__proto__ = Ctor.prototype
    var res = Ctor.apply(obj, args)
    return (typeof res === "object" && res !== null) ? res : obj
}
```

1. 创建空对象 `obj = {}`。
2. 把 `obj.__proto__` 指向 `Ctor.prototype`。
3. 执行构造函数体，函数里的 `this` 就是 `obj`。
4. 若函数没返回引用类型，就返回 `obj`。

第 2 步已经把原型接好，实例才能用原型上的方法，这是第 100 章的入口。

### 忘写 new：this 落到全局

把构造函数当普通函数调用时，`new` 的四步不发生，`this` 按默认绑定指向全局对象。

因为非严格模式下普通调用的 `this` 是 `window`，`this.name = ...` 就变成往全局挂属性；函数又没有返回值，拿到的变量是 `undefined`。这是最隐蔽的坑：不报错，对象却没造出来。

```js
function CreateObj(name) { this.name = name }
var o = CreateObj("kerwin")
console.log(o)              // => undefined
console.log(window.name)    // => "kerwin"
```

| 调用方式 | `this` | 返回值 |
|---|---|---|
| `new CreateObj("x")` | 新实例 | 该实例 |
| `CreateObj("x")` | `window` | `undefined` |
| `obj.method("x")` | `obj` | `undefined` |

> ⚠️ 全局被悄悄污染，排查时往往看不出源头；严格模式下 `this` 是 `undefined`，赋值会立刻报错。

防漏写还有 `instanceof` 自检和 `new.target` 两条路，最省心的其实是 `class`，引擎强制要求 `new`。

先看 `new.target` 怎么把漏写挡住：

```js
function CreateObj(name) {
  if (!new.target) throw new Error("必须用 new 调用")
  this.name = name
}
CreateObj("kerwin")        // => Error: 必须用 new 调用
console.log(new CreateObj("kerwin").name)   // => kerwin
```

普通调用时 `new.target` 为空，直接抛错；用 `new` 调用才正常，比悄悄污染全局安全得多。

`instanceof` 自检则是另一种思路：

```js
function CreateObj(name) {
  if (!(this instanceof CreateObj)) return new CreateObj(name)
  this.name = name
}
console.log(CreateObj("kerwin").name)   // => kerwin，忘写 new 也补上了
```

它检测不到 `new` 就自己补一次 `new`，属于容错式防护，老库里很常见。

### return 的覆盖规则

构造函数里 `return` 基本类型会被忽略，返回引用类型则会顶替掉实例。

原因就在 `new` 的第 4 步：引擎只在返回值是引用类型时才采用它，否则一律返回构建好的 `this`。所以写 `return` 几乎没有正当理由，写了反而让结果不可预期。

```js
function A(name) { this.name = name; return 100 }
function B(name) { this.name = name; return { a: 1 } }
console.log(new A("kerwin"))   // => A { name: "kerwin" }
console.log(new B("kerwin"))   // => { a: 1 }
```

| `return` 的值 | `new` 的结果 |
|---|---|
| 不写或基本类型、`null` | 返回 `this` |
| 对象、数组、函数 | 返回该值，`this` 被丢弃 |

> ⚠️ 返回引用类型时实例上挂好的属性一并作废，别在构造函数里 `return` 对象。

===CH===
no: 100
title: 面向对象的原型
lessons: 129
summary: prototype 是函数的公共仓库，__proto__ 指向它，方法放原型供实例共用
points: prototype 在函数上，__proto__ 在实例上 || 实例.__proto__ 与构造函数.prototype 是同一仓库 || constructor 指回构造函数，整体换原型会丢失 || 读属性顺原型链往上，写只落在对象自己 || 属性放构造函数各一份，方法放原型共用一份
===BODY===
### 为什么需要 prototype：方法重复的代价

把方法写进构造函数，每个实例都会得到一份独立的函数副本。

因为 `new` 一次函数体就执行一次，`function(){}` 会重新创建一块内存。N 个实例就存 N 份代码完全一样的方法，既浪费内存，也没法统一升级。

```js
function CreateObj(name) {
    this.name = name
    this.cook = function () {}
}
var a = new CreateObj("蒸羊羔")
var b = new CreateObj("烧花鸭")
console.log(a.cook === b.cook)   // => false
```

原型要做的，就是把这些无状态的方法搬到一处，让所有实例共用一份。

### prototype 与 __proto__：同一仓库的两个入口

`prototype` 是函数天生自带的一个对象，充当公共仓库；`__proto__` 是实例指向该仓库的指针。

因为 `new` 的第 2 步已把 `obj.__proto__` 接到 `Ctor.prototype`，两者指的是同一块仓库。注意仓库里的东西不是给构造函数自己用的，函数本身访问不到，只有实例能用。

```js
function Person() {}
Person.prototype.sayHi = function () { console.log("hello") }
var p = new Person()
console.log(p.__proto__ === Person.prototype)   // => true
console.log(Person.sayHi)        // => undefined
p.sayHi()                        // => hello
```

| 成员 | 谁有 | 指向 |
|---|---|---|
| `prototype` | 构造函数 | 一个公共仓库对象 |
| `__proto__` | 所有对象 | 造它的构造函数的 `prototype` |
| `constructor` | 仓库对象里 | 指回构造函数本身 |

一句话串起来：`实例.__proto__ === 构造函数.prototype`，而 `构造函数.prototype.constructor === 构造函数`。

### constructor：从实例找回构造函数

仓库里自带一个 `constructor` 属性指回构造函数本身，实例顺着原型链就能读到它。

因为 `new` 时引擎顺手放好了这个引用，`p.constructor === Person` 成立，可用来判断类型或按同类再造一个实例。但整体替换 `prototype` 会把这个属性一起丢掉，必须手动补回。

```js
function Person() {}
var p = new Person()
console.log(p.constructor === Person)                // => true
Person.prototype = { sayHi() {} }
console.log(Person.prototype.constructor === Person) // => false
Person.prototype.constructor = Person               // 手动补回
```

> ⚠️ 用 `constructor` 判断类型不算可靠，因为它能被改；`instanceof` 更稳。

### 原型链查找规则：一直往上到 Object.prototype

读取属性时先找对象自己，没有就顺着 `__proto__` 一层层往上，直到 `Object.prototype`，仍没有返回 `undefined`。

因为仓库本身也是对象、也有 `__proto__`，查找就连成一条链。这解释了为什么所有对象都能用 `toString`、`hasOwnProperty`，它们来自链条末端。

```js
function Person() {}
var p = new Person()
console.log(p.__proto__ === Person.prototype)                  // => true
console.log(Person.prototype.__proto__ === Object.prototype)  // => true
console.log(p.toString === Object.prototype.toString)         // => true
console.log(p.abc)                                           // => undefined
```

1. 先找实例自身，有就返回。
2. 再找构造函数 `prototype`。
3. 继续往上到 `Object.prototype`。
4. 都没有则返回 `undefined`。

查找不到不会报错。`p.hasOwnProperty("name")` 能分清属性在自己身上还是来自原型，`"say" in p` 则是整条链上找。

```js
function Person() {}
Person.prototype.say = function () {}
var p = new Person()
console.log(p.hasOwnProperty("say"))   // => false，来自原型
console.log("say" in p)                // => true，整条链上能找到
p.say = function () {}
console.log(p.hasOwnProperty("say"))   // => true，现在写到了自己身上
```

`hasOwnProperty` 只看对象自身，`in` 会把原型链也算进去，两者配合就能定位属性到底住在哪一层。

### 方法挂原型 vs 挂实例的内存差别

属性尤其数组、对象写在构造函数里各存一份，方法挂到 `prototype` 上全体共用一份。

因为方法没有实例状态，共用不会冲突，执行时的 `this` 依旧动态指向调用者，所以共享一份也能区分数据。注意读会顺着链找，写只会落在对象自己身上。

```js
function Person(name) {
    this.name = name
    this.hobby = []          // 引用类型放构造函数，各一份
}
Person.prototype.say = function () { console.log(this.name) }
var a = new Person("张三")
var b = new Person("李四")
console.log(a.say === b.say)   // => true
```

| 内容 | 放哪里 | 原因 |
|---|---|---|
| 属性、数组、对象 | 构造函数 `this.x` | 每个实例必须独立 |
| 方法 | `prototype` | 无状态，共享省内存 |

> ⚠️ 若把 `hobby: []` 放到原型上，`a.hobby.push("篮球")` 会让 `b.hobby` 也变，因为两个实例读到的是同一个数组。

这个坑用代码验证最直观：

```js
function Person() {}
Person.prototype.hobby = []
var a = new Person()
var b = new Person()
a.hobby.push("篮球")
console.log(b.hobby)   // => ["篮球"]，b 也被影响了
```

`a.hobby.push` 是先顺着原型读到同一个数组、再改它的内容，并没有给 `a` 自己赋值，所以两个实例共享同一份。要独立就得把 `this.hobby = []` 写回构造函数里。

===CH===
no: 101
title: 选项卡-面向对象
lessons: 130
summary: 把选项卡封装成 Tabs 类，容器与事件类型参数化，几个容器就 new 几次
points: 把变化的容器与事件抽成参数，逻辑只写一遍 || 只把长期要用的挂 this，中间量用局部变量 || 事件回调用箭头函数才能拿到实例的 this || 外层索引必须 let，每轮各有一份绑定 || 数据各实例独立，方法共用原型一份
===BODY===
### 案例目标：一套选项卡要能 new 多次

把一组标签与面板的切换逻辑收进一个 `Tabs` 构造函数，页面里有几个容器就 `new` 几次。

因为过程式写法遇到三个选项卡，就要复制三组 `querySelector` 变量和三段排他循环，改一处得改三处。封装成模具后，变化的容器与事件类型变成参数，不变的逻辑只写一遍。

```js
new Tabs(".container1", "click")
new Tabs(".container2", "mouseover")
new Tabs(".container3", "mouseover")
```

三行代码得到三个实例，状态各自独立，方法却共用一份。

### Tabs 构造函数：四步封装

构造里查容器、收集 DOM、存配置、立即绑定事件，方法挂到原型上。

因为只需长期持有的才挂 `this`，`container` 这类一次性查询的中间量用局部变量即可，不占实例内存。方法放原型，所有实例共用一份。

```js
function Tabs(select, type) {
    var container = document.querySelector(select)
    this.tabs = container.querySelectorAll(".header li")
    this.panels = container.querySelectorAll(".box li")
    this.type = type
    this.change()
}
Tabs.prototype.change = function () {
    for (let i = 0; i < this.tabs.length; i++) {
        this.tabs[i].addEventListener(this.type, () => {
            for (let m = 0; m < this.tabs.length; m++) {
                this.tabs[m].classList.remove("active")
                this.panels[m].classList.remove("active")
            }
            this.tabs[i].classList.add("active")
            this.panels[i].classList.add("active")
        })
    }
}
export default Tabs
```

| 步骤 | 代码 | 作用 |
|---|---|---|
| 存引用 | `this.tabs`、`this.panels` | 每个实例记住自己的 DOM |
| 存配置 | `this.type` | 支持 `click` / `mouseover` |
| 立即激活 | `this.change()` | 构造完就绑好事件 |
| 方法放原型 | `Tabs.prototype.change` | 全体共用一份 |

### 两个关键细节：箭头函数与 let

事件回调用箭头函数、外层循环用 `let`，这两处决定 `this` 和索引是否正确。

因为 `addEventListener` 的普通回调里 `this` 指向被绑定的 DOM 元素，拿不到实例。箭头函数继承外层 `change` 的 `this`，才能访问 `this.panels`。

外层 `i` 被异步回调捕获，必须用 `let` 让每轮各生成一份绑定。

```js
// 普通函数：this 是 <li>，拿不到实例
this.tabs[i].addEventListener(this.type, function () {
    console.log(this)   // => <li> 元素
})
// 箭头函数：this 继承外层，指向 Tabs 实例
this.tabs[i].addEventListener(this.type, () => {
    console.log(this)   // => Tabs 实例
})
```

> ⚠️ 内层 `m` 只在同步循环里用，`var` 也可以；外层 `i` 被异步捕获，用 `var` 会点谁都跳到最后一项。

### 参数化与多实例互不干扰

`this.type` 传进 `addEventListener`，同一个类就能支持点击、移入等不同交互。

因为会变的抽成参数、不变的写在类里，调用方零改动。三个实例的数据各存在自己的 `this` 上，方法共用 `prototype.change`，所以互不干扰，也不污染全局。

| 对比 | 过程式 | 面向对象 |
|---|---|---|
| 变量 | 三组全局变量 | 各存实例里 |
| 排他逻辑 | 复制三份 | 原型一份 |
| 换事件类型 | 改代码 | 传参 |
| 复用方式 | 复制粘贴 | `new` |

> ⚠️ 查 DOM 要用 `container.querySelectorAll`，用 `document` 会拿到全页面所有标签；模块内忘写 `new` 会立刻报错，反而不是坏事。

===CH===
no: 102
title: ES6-class
lessons: 131
summary: class 是构造函数加原型的语法糖，方法自动挂原型、强制 new、声明前不可用
points: class 本质是函数，typeof 仍是 function || constructor 等同原函数体，且只能有一个 || 方法自动挂 prototype 且不可枚举 || 类里方法之间不加逗号，不是对象字面量 || class 声明前处于 TDZ、强制 new、内部自动严格模式
===BODY===
### class 是构造函数加原型的语法糖

`class` 只是换了一种写法，本质仍是"构造函数加原型"，`typeof` 依旧是 `"function"`。

因为底层没变，`new` 的调用方式、实例共享原型方法这些结论全部照旧。写起来像 Java，是为了让属性与方法集中在同一块外壳里，可读性更好。

```js
class CreateObj {
    constructor(name) { this.name = name }
    say() { console.log(this.name, "hello") }
}
var o = new CreateObj("kerwin")
o.say()                          // => kerwin hello
console.log(typeof CreateObj)    // => "function"
```

`CreateObj.prototype.say` 与手写挂原型落在同一个位置，类自身上并没有 `say`。

### constructor 就是原来的函数体

`constructor` 是 `new` 时执行的那段代码，等同于构造函数的函数体。

因为类只能有一个 `constructor`，写两个直接语法错误；不写也会自动补一个空的。实例属性照旧写在里面，每个实例各存一份。

```js
class Empty {}
console.log(new Empty())          // => Empty {}
class A {
    constructor(name) { this.name = name }
}
console.log(new A("kerwin"))      // => A { name: "kerwin" }
```

类名首字母按习惯大写，与构造函数一致；这不是语法要求，只是便于识别。

### 方法定义在 prototype 上，且不写逗号

类里的方法直接写 `名字() {}`，自动挂到 `prototype`，方法之间不加逗号。

因为这是类语法而不是对象字面量，`key: value` 和逗号都不合法。这样定义的方法不可枚举，`Object.keys(实例)`、`for...in` 不会把它们混进数据里。

```js
class CreateObj {
    say() {}
    run() {}
    // say() {},   ← 方法间加逗号会语法错误
}
console.log(CreateObj.prototype.say)            // => ƒ say()
console.log(CreateObj.say)                      // => undefined
console.log(Object.keys(CreateObj.prototype))   // => []
```

结果是方法不在类自身上，也不出现在 `Object.keys` 里，比手写挂原型更干净。

### 与构造函数的等价关系

把构造函数版逐行换成 class 版，调用方一个字都不用改。

因为语法糖只改实现写法、不改使用方式，所以 `Tabs` 从函数版改写成 class 版时，那几行 `new` 的用法完全不变。

| 构造函数版 | class 版 |
|---|---|
| `function C(n) { this.n = n }` | `constructor(n) { this.n = n }` |
| `C.prototype.say = function () {}` | `say() {}` |
| `new C("x")` | `new C("x")` |
| 原型方法可枚举 | 原型方法不可枚举 |

下面这段把两种写法摆在一起，调用方式完全相同：

```js
function C(n) { this.n = n }
C.prototype.say = function () { return this.n }
console.log(new C("x").say())   // => x

class D {
  constructor(n) { this.n = n }
  say() { return this.n }
}
console.log(new D("x").say())   // => x
```

对应关系一目了然：`constructor` 接管函数体，`say() {}` 接管 `prototype.say`，而 `new` 的写法一点没变。

`export default Tabs` 这类导出语句也不变，这就是等价关系最实际的价值。

### class 声明前不能用，且强制 new

`class` 声明同样会被提升，但提升后落在暂时性死区里，声明之前访问一律抛 `ReferenceError`；不用 `new` 调用直接报错，类内部还自动是严格模式。

因为引擎把"忘写 `new` 污染全局"这个坑从语法上堵死了，比构造函数靠自律安全得多。提前使用得到的是 `ReferenceError`，而不是 `undefined`——这正是「绑定已存在、值还没初始化」的表现。

```js
var o = new CreateObj()   // => ReferenceError: Cannot access 'CreateObj' before initialization
class CreateObj {}
class B {}
B()   // => TypeError: Class constructor B cannot be invoked without 'new'
```

| 差异 | 构造函数 | `class` |
|---|---|---|
| 必须 `new` | 不强制 | 强制 |
| 变量提升 | 有，声明前即可用 | 有，但声明前处于 TDZ |
| 严格模式 | 默认非严格 | 自动严格 |
| 方法可枚举 | 是 | 否 |
| `typeof` | `"function"` | `"function"` |

> ⚠️ `constructor` 里给未声明变量赋值会报 `ReferenceError`；方法单独取出再调用，严格模式下 `this` 是 `undefined`。

### 补充笔记：静态方法

类里还能定义挂在类本身、而不是实例上的方法，用 `static` 标记。

```js
class Person {
  constructor(name) { this.name = name }
  static create(name) { return new Person(name) }
}
console.log(Person.create("kerwin").name)   // => kerwin
console.log(new Person("x").create)         // => undefined
```

实例方法挂在 `prototype` 供实例调用，`static` 方法挂在类上只能用 `Person.create()` 调，适合做工厂或工具方法。

===CH===
no: 103
title: 面向对象继承
lessons: 132
summary: 属性靠 call 借父类构造，方法靠原型链接父类原型，两者合起来是组合继承
points: 继承让子类只写增量，父类升级一处生效 || call 借属性，apply 只是传参形式不同 || 只借属性拿不到原型方法，需另接原型链 || 换原型后 constructor 指向父类，要手动补回 || 组合继承两次执行父类构造，宜用 Object.create
===BODY===
### 为什么需要继承：消除重复代码

继承让子类自动拥有父类的属性和方法，只写自己多出来的部分。

因为 `Student` 与 `Person` 大部分字段和 `say` 相同，抄一遍意味着父类加字段、修 bug 时子类都要同步改。继承把重复收敛到一处，升级只需改父类。

```js
function Person(name, age) {
    this.name = name
    this.age = age
}
Person.prototype.say = function () { console.log(this.name, "hello") }
// 不继承就得把上面两块原样抄进 Student
```

抄来的 `say` 与父类的不是同一个函数，没法统一升级，这正是继承要消除的重复。

### call 借属性

`Parent.call(this, ...)` 把父类构造函数体借到子类实例上执行一遍。

因为 `call` 能把函数里的 `this` 强制换成子类的 `this`，父类中的赋值就落到子类实例上。等价写法是 `apply`，区别只在传参：`call` 逐个传，`apply` 用数组传。

```js
function Student(name, age, grade) {
    Person.call(this, name, age)   // 借父类赋 name、age
    this.grade = grade
}
var s = new Student("kerwin", 100, 100)
console.log(s.name, s.grade)   // => kerwin 100
```

| 方法 | 传参方式 | 写法 |
|---|---|---|
| `call` | 逐个 | `Person.call(this, name, age)` |
| `apply` | 数组 | `Person.apply(this, [name, age])` |

`call` 的本质不是继承，而是换掉函数执行时的 `this`：

```js
var obj2 = { grade: 100 }
Person.call(obj2, "kerwin", 100)
console.log(obj2)   // => { grade: 100, name: "kerwin", age: 100 }
```

把 `Person` 的函数体在 `obj2` 上跑一遍，它白得两个属性，子类继承属性正是借了这一点。

> ⚠️ 这一步只执行了函数体、没碰 `Student.prototype`，所以原型上的 `say` 继承不到，`s.say()` 会报 `is not a function`。

### 原型链借方法

把 `Student.prototype` 换成一个父类实例，让子类的原型链能连到 `Parent.prototype`。

因为 `new Parent()` 造出的对象，其 `__proto__` 指向 `Parent.prototype`。把它当子类原型后，实例顺着链往上两层就能找到父类方法。

注意不能直接写 `= Parent.prototype`。那样父子共用同一块原型，给子类加方法会污染父类。

```js
Student.prototype = new Person()
Student.prototype.constructor = Student   // 换原型后补回
var s = new Student("kerwin", 100, 100)
s.say()                                  // => kerwin hello
console.log(s instanceof Person)         // => true
```

> ⚠️ 换原型要趁早，之后再挂新方法；顺序反了，先挂的方法会随旧原型一起被丢弃。`constructor` 换后会指向父类，需手动修正。

为什么不能直接写 `= Parent.prototype`？因为那样父子会共用同一块原型：

```js
Student.prototype = Person.prototype
Student.prototype.printGrade = function () {}
var p = new Person("张三", 20)
console.log(p.printGrade)   // => ƒ，父类实例莫名其妙多了子类方法
```

两个变量指向同一个对象，给子类加方法其实改的是父类原型，所以必须用 `new Person()` 造一层中间原型来隔开。

### 组合继承：两次调用父类构造的问题

属性靠 `call` 借、方法靠原型链借，两者合起来叫组合继承，是 ES5 最常用的方案。

`call` 在子类构造里调一次父类，`= new Parent()` 又调一次，父类构造一共执行两遍。后一次还会把 `name`、`age` 以 `undefined` 挂到原型上占位。

更好的写法是 `Object.create(Parent.prototype)`。它只接原型链、不执行父类构造，也就没有这两处副作用。

```js
function Child(a, b, c) {
    Parent.call(this, a, b)                        // ① 属性
    this.c = c
}
Child.prototype = Object.create(Parent.prototype) // ② 方法
Child.prototype.constructor = Child              // ③ 修 constructor
Child.prototype.methodB = function () {}         // ④ 新增
```

| 方案 | 继承属性 | 继承方法 | 问题 |
|---|---|---|---|
| 构造函数继承 `call` | 有 | 无 | 拿不到原型方法 |
| 原型继承 `= new Parent()` | 无 | 有 | 构造多跑、属性占位 |
| 组合继承 | 有 | 有 | 父类构造执行两次 |

`extends` 就是把这套模板收成两行，第 105 章会逐条对照。

===CH===
no: 104
title: 继承案例
lessons: 133
summary: 用基类加子类渲染两种列表，覆盖同名方法时必须显式 call 回父类
points: 两个列表九成相同，公共逻辑放进基类 || 子类用 call 复用父类属性，只新增 imgUrl || 覆盖 render 后调用方统一，同名不同表现 || 覆盖版里 this.render() 会无限递归 || 调父类要写 父.prototype.render.call(this)
===BODY===
### 需求与思路

页面上有两个容器：一个只渲染标题和条目，另一个还要显示一张封面图。两者九成逻辑相同，差别只有一处，正好用构造函数式继承消除重复。

做法分三步。子类构造函数里用 `CreateList.call(this, ...)` 借来父类装好的属性，这一步解决「属性从哪来」。

接着用 `Object.create(CreateList.prototype)` 接上方法链并补回 `constructor`；最后覆盖 `render`，先调父类版本再补图。

### 完整案例代码

```js
// 依赖：页面有 .box1 与 .box2，box2 里含一个空的 <img>
function CreateList(select, data = {}) {
  this.ele = document.querySelector(select)
  this.title = data.title
  this.list = data.list || []
}
CreateList.prototype.render = function () {
  this.ele.querySelector("h1").innerHTML = this.title
  this.ele.querySelector("ul").innerHTML =
    this.list.map(item => `<li>${item}</li>`).join("")
}

function CreateImgList(select, data) {
  CreateList.call(this, select, data)        // ← 关键点：借用父类属性，this 换成子类实例
  this.imgUrl = data.url
}
CreateImgList.prototype = Object.create(CreateList.prototype)  // ← 关键点：只接原型，不执行父构造函数
CreateImgList.prototype.constructor = CreateImgList            // ← 关键点：constructor 指回自己
CreateImgList.prototype.render = function () {
  CreateList.prototype.render.call(this)     // ← 关键点：显式调父类；写 this.render() 会递归到自己
  this.ele.querySelector("img").src = this.imgUrl
}

var data1 = { title: "体育", list: ["体育-1", "体育-2"] }
var data2 = { title: "综艺", url: "https://example.com/a.jpg", list: ["综艺-1"] }
new CreateList(".box1", data1).render()
var obj2 = new CreateImgList(".box2", data2)
obj2.render()
console.log(obj2 instanceof CreateList)          // => true
console.log(obj2.constructor === CreateImgList)  // => true
```

### 关键知识点

- **借属性用 `call`**：`call` 把构造函数里的 `this` 换成子类实例，`ele`、`title`、`list` 才挂到 `obj2` 上。若直接 `CreateList(...)` 调用，属性会落到 `window`（严格模式下报错），实例上什么都没有。
- **借方法用 `Object.create` 或原型赋值**：`Object.create` 只连原型链，不执行父构造函数。换成 `Child.prototype = new CreateList()` 也能跑，但父构造函数会被调用两次，原型上白多一份 `ele`、`title`，既浪费又容易遮住实例属性。
- **`constructor` 要指回自己**：换原型后 `constructor` 沿链指向父类，`obj2.constructor === CreateImgList` 变成 false，靠构造器判类型的代码就出错。补一行改回来即可。
- **覆盖后必须 `父.prototype.render.call(this)`**：同名方法在子类原型上就地命中，`this.render()` 找到的是自己，会无限递归到栈溢出。写全父类方法名，才能先干父类的活再补自己的。
===CH===
no: 105
title: ES6-继承
lessons: 134
summary: extends 接原型链，super 借构造并调父类方法，把 ES5 继承模板收成两行
points: extends 一行顶替换原型与修 constructor || super() 借父类构造，且必须先于 this || super.x() 等价 父.prototype.x.call(this) || 子类同名方法覆盖父类，形成多态 || 忘写 new 会直接报错，不再污染全局
===BODY===
### extends：一行接好原型链

`class Child extends Parent` 把子类原型接到父类原型上，并让静态方法也被继承。

因为它等价于 ES5 里 `Object.create(Parent.prototype)` 加修正 `constructor` 两步。引擎还会额外把子类构造函数本身的原型指向父类，所以 `instanceof` 对父子都成立。

`extends` 后面可以是任何有 `prototype` 的表达式，类或普通构造函数都行。

```js
class Person {
    constructor(name) { this.name = name }
    say() { console.log(this.name, "hello") }
}
class Student extends Person {}
var s = new Student("kerwin")
console.log(s instanceof Person)   // => true
console.log(Object.getPrototypeOf(Student.prototype) === Person.prototype) // => true
```

子类不写 `constructor` 时，引擎会自动生成 `constructor(...args) { super(...args) }`。

```js
class Student extends Person {}

var s = new Student("kerwin", 100)
console.log(s)   // => Student { name: "kerwin", age: 100 }
```

虽然子类一个字没写，参数还是被自动转交给了父类的 `constructor`，所以属性照样挂到实例上。

### super 的两层含义

`super()` 在构造里调用父类构造并初始化 `this`，`super.x()` 在方法里调用父类原型上的同名方法。

因为 `extends` 类的实例是父类造的，`super()` 之前 `this` 不可用，必须先调用它再赋子类属性。

`super.say()` 等价于 `Parent.prototype.say.call(this)`，里面的 `this` 仍是当前子类实例，不会丢。

```js
class Student extends Person {
    constructor(name, grade) {
        super(name)        // 先借父类构造，才有 this
        this.grade = grade
    }
    say() {
        super.say()        // 调父类 say
        console.log(this.grade)
    }
}
```

| 写法 | 等价 ES5 | 出现位置 |
|---|---|---|
| `super(name)` | `Parent.call(this, name)` | `constructor` 里，必须在 `this` 前 |
| `super.say()` | `Parent.prototype.say.call(this)` | 普通或静态方法里 |

> ⚠️ 子类写了 `constructor` 却忘了 `super()`，或在 `super()` 之前用 `this`，都会抛 `ReferenceError`。

下面这段就是把 `this` 写在 `super()` 之前的后果：

```js
class Student extends Person {
  constructor(name, grade) {
    this.grade = grade       // ReferenceError：super 之前没有 this
    super(name)
  }
}
```

`extends` 类的实例由父类造出，`super()` 执行完才有 `this`；把赋值挪到 `super(name)` 之后就正常了。

### 方法覆盖与多态

子类定义同名方法会覆盖父类版本，同一句 `obj.render()` 在不同实例上产生不同行为，叫多态。

因为查找先在子类原型命中，父类实现被遮住；需要保留父类逻辑时用 `super.render()` 调回来。好处是调用方不必写分支判断具体是哪一个子类。

```js
class CreateList {
    render() { console.log("标题 + 列表") }
}
class CreateImgList extends CreateList {
    render() {
        super.render()
        console.log("再加一张图")
    }
}
new CreateList().render()      // => 标题 + 列表
new CreateImgList().render()   // => 标题 + 列表 / 再加一张图
```

> ⚠️ `super.say` 不加括号只是取到函数引用、不会执行；`super` 只能在 `extends` 类里用，箭头函数里也没有自己的 `super`。

### 与 ES5 组合继承的对照表

`extends` 与 `super` 把 ES5 那套五步模板收成两行。

因为 `constructor` 修正、静态方法继承都由引擎自动完成，`super()` 之前才有 `this` 这类规则也由语法保证，可读性和出错率都明显改善。

| 项目 | ES5 组合继承 | ES6 `extends` |
|---|---|---|
| 继承方法 | `Child.prototype = new Parent()` | `class Child extends Parent` |
| 继承属性 | `Parent.call(this, ...)` | `super(...)` |
| 调父类方法 | `Parent.prototype.x.call(this)` | `super.x()` |
| 修 `constructor` | 手动补 | 自动 |
| `this` 初始化 | 一开始就有 | `super()` 之后 |
| 忘写 `new` | 污染全局 | 直接报错 |

三句话概括全部映射：`extends` 接原型，`super()` 借属性，`super.x()` 调父类方法。
