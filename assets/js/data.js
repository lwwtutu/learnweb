/* ============================================================
   章节数据：站点唯一数据源（导航 / 首页 / 搜索 均由此驱动）
   ============================================================ */
window.COURSE = {
  title: "Java 学习手册",
  subtitle: "JavaSE 从零到项目实战",
  chapters: [
    {
      id: "ch01", num: "01", title: "Java 入门", sub: "环境搭建与第一个程序",
      tag: "基础", time: 45, level: 1,
      desc: "认识 JDK、JRE、JVM 三者关系，装好开发环境，写出并跑通第一个 Java 程序，掌握注释、变量与字面量。",
      sections: [
        { id: "jdk", title: "JDK、JRE 与 JVM" },
        { id: "first-program", title: "第一个 Java 程序" },
        { id: "compile-run", title: "编译与运行机制" },
        { id: "idea", title: "IntelliJ IDEA 工作流" },
        { id: "comment", title: "注释与代码规范" },
        { id: "variable", title: "变量与数据类型" },
        { id: "literal", title: "字面量与标识符" }
      ]
    },
    {
      id: "ch02", num: "02", title: "基础语法", sub: "变量、常量与类型转换",
      tag: "基础", time: 50, level: 1,
      desc: "八种基本数据类型的内存占用与取值范围，变量三要素与作用域，自动类型转换与强制转换的精度陷阱。",
      sections: [
        { id: "constant", title: "常量与变量" },
        { id: "scope", title: "变量的作用域" },
        { id: "primitive", title: "八种基本数据类型" },
        { id: "reference", title: "引用数据类型" },
        { id: "auto-cast", title: "自动类型转换" },
        { id: "force-cast", title: "强制类型转换" }
      ]
    },
    {
      id: "ch03", num: "03", title: "运算符与方法", sub: "表达式、方法与键盘录入",
      tag: "基础", time: 55, level: 1,
      desc: "算术、赋值、关系、逻辑、三元与位运算符的完整用法，方法定义与重载，Scanner 实现人机交互。",
      sections: [
        { id: "arithmetic", title: "算术运算符" },
        { id: "assign", title: "赋值与自增自减" },
        { id: "logic", title: "关系与逻辑运算符" },
        { id: "ternary", title: "三元与位运算符" },
        { id: "priority", title: "运算符优先级" },
        { id: "method", title: "方法定义与调用" },
        { id: "overload", title: "方法重载与参数传递" },
        { id: "scanner", title: "Scanner 键盘录入" }
      ]
    },
    {
      id: "ch04", num: "04", title: "程序流程控制", sub: "分支、循环与随机数",
      tag: "基础", time: 55, level: 1,
      desc: "if/switch 分支、for/while/do-while 循环、break 与 continue 跳转，嵌套循环与 Random 随机数实战。",
      sections: [
        { id: "if", title: "if / else 分支" },
        { id: "switch", title: "switch 选择结构" },
        { id: "for", title: "for 循环" },
        { id: "while", title: "while 与 do-while" },
        { id: "jump", title: "break 与 continue" },
        { id: "nested", title: "嵌套循环与死循环" },
        { id: "random", title: "Random 随机数" }
      ]
    },
    {
      id: "ch05", num: "05", title: "数组", sub: "一维、二维与常见算法",
      tag: "核心", time: 65, level: 2,
      desc: "数组的内存模型与默认值，遍历与越界异常，二维数组，Arrays 工具类、冒泡排序、二分查找与拷贝扩容。",
      sections: [
        { id: "array-basic", title: "数组的定义与内存" },
        { id: "array-loop", title: "遍历与常见异常" },
        { id: "array-2d", title: "二维数组" },
        { id: "arrays-util", title: "Arrays 工具类" },
        { id: "bubble", title: "冒泡排序" },
        { id: "binary-search", title: "二分查找" },
        { id: "array-copy", title: "拷贝与扩容" }
      ]
    },
    {
      id: "ch06", num: "06", title: "字符串与正则", sub: "String、StringBuilder、正则",
      tag: "核心", time: 70, level: 2,
      desc: "String 不可变与常量池，常用 API、== 与 equals 的区别，拼接性能，StringBuilder 与正则表达式。",
      sections: [
        { id: "string-pool", title: "String 不可变与常量池" },
        { id: "string-api", title: "常用 API 速查" },
        { id: "string-eq", title: "== 与 equals" },
        { id: "string-concat", title: "拼接与性能" },
        { id: "string-builder", title: "StringBuilder / StringBuffer" },
        { id: "string-format", title: "格式化与 join" },
        { id: "regex", title: "正则表达式" }
      ]
    },
    {
      id: "ch07", num: "07", title: "包装类与 Object", sub: "装箱拆箱、缓存与对象契约",
      tag: "核心", time: 60, level: 2,
      desc: "8 种包装类与装箱拆箱、Integer 缓存区间、NPE 高发场景，Object 的 toString / equals / hashCode 契约。",
      sections: [
        { id: "wrapper", title: "包装类与装箱拆箱" },
        { id: "integer-cache", title: "Integer 缓存机制" },
        { id: "number", title: "数值转换与 NPE" },
        { id: "character", title: "Character 与 char" },
        { id: "object-methods", title: "Object 的方法契约" },
        { id: "equals-hash", title: "重写 equals 与 hashCode" }
      ]
    },
    {
      id: "ch08", num: "08", title: "类与对象", sub: "面向对象基础与静态成员",
      tag: "面向对象", time: 80, level: 3,
      desc: "类与对象的关系、构造器与 this、成员变量与局部变量的区别、封装与 JavaBean、static 静态成员与代码块。",
      sections: [
        { id: "oop-intro", title: "类与对象的关系" },
        { id: "constructor", title: "构造器" },
        { id: "this", title: "this 关键字" },
        { id: "var-scope", title: "成员变量 vs 局部变量" },
        { id: "encapsulation", title: "封装与访问控制" },
        { id: "javabean", title: "标准 JavaBean" },
        { id: "static", title: "static 静态成员" },
        { id: "block-main", title: "代码块与 main 方法" },
        { id: "package", title: "包与可变参数" }
      ]
    },
    {
      id: "ch09", num: "09", title: "继承与多态", sub: "复用、重写与动态绑定",
      tag: "面向对象", time: 75, level: 3,
      desc: "extends 继承体系、权限修饰符、方法重写与 super、构造器执行顺序、多态与向上向下转型、instanceof 与 final。",
      sections: [
        { id: "extends", title: "继承与方法重写" },
        { id: "super", title: "super 与构造器顺序" },
        { id: "modifier", title: "权限修饰符" },
        { id: "polymorphism", title: "多态" },
        { id: "cast", title: "向上转型与向下转型" },
        { id: "instanceof", title: "instanceof 与 final" }
      ]
    },
    {
      id: "ch10", num: "10", title: "抽象、接口与内部类", sub: "面向接口编程与扩展机制",
      tag: "面向对象", time: 80, level: 3,
      desc: "抽象类与模板方法、接口与默认方法、抽象类 vs 接口的选型、四种内部类、匿名内部类、枚举与单例模式。",
      sections: [
        { id: "abstract", title: "抽象类" },
        { id: "interface", title: "接口" },
        { id: "abstract-vs-interface", title: "抽象类 vs 接口" },
        { id: "inner-class", title: "四种内部类" },
        { id: "anonymous", title: "匿名内部类" },
        { id: "enum", title: "枚举" },
        { id: "singleton", title: "单例模式" }
      ]
    },
    {
      id: "ch11", num: "11", title: "常用 API 与 Lambda", sub: "集合、函数式与 GUI",
      tag: "进阶", time: 70, level: 4,
      desc: "ArrayList 集合的增删改查、Lambda 表达式与方法引用、JFrame 窗口与四种布局管理器、事件监听机制。",
      sections: [
        { id: "arraylist", title: "ArrayList 集合" },
        { id: "lambda", title: "Lambda 表达式" },
        { id: "method-ref", title: "方法引用" },
        { id: "gui", title: "GUI 与布局管理器" },
        { id: "event", title: "事件监听" }
      ]
    },
    {
      id: "ch12", num: "12", title: "项目实战", sub: "石头迷阵 + 人事管理",
      tag: "实战", time: 120, level: 5,
      desc: "以二维数组建模 4×4 数字华容道，完成界面绘制、移动判定、打乱与计时，并实现一个控制台人事管理系统。",
      sections: [
        { id: "project-plan", title: "需求与项目结构" },
        { id: "model", title: "二维数组建模" },
        { id: "paint", title: "界面绘制" },
        { id: "move", title: "移动与胜利判定" },
        { id: "shuffle", title: "打乱、计时与重启" },
        { id: "hr-system", title: "人事管理系统" },
        { id: "next-step", title: "进阶路线" }
      ]
    }
  ]
};
