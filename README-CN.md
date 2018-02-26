# vue-xs

[^_^]:
  TODO
  [![Build Status](https://circleci.com/gh/vuejs/vue-rx/tree/master.svg?style=shield)](https://circleci.com/gh/vuejs/vue-rx/tree/master)

[English](README.md) | 简体中文

Vue.js 的简单 [xstream](https://github.com/staltz/xstream) 绑定。它还支撑实现 `.addListener` 和 `.removeListener` 接口的通用 observables 的订阅。举例来说，你可以使用它来订阅 `most.js` 或 Falcor 流，但是某些功能需要 xstream 才能运行。

### 安装

#### NPM + ES2015

``` bash
npm install vue vue-xs xstream --save
```

``` js
import Vue from 'vue'
import xstream from 'xstream'
import VueXS from 'vue-xs'
import fromEvent from 'xstream/extra/fromEvent'

// 搞定!
Vue.use(VueXS, {
  Stream: xstream,
  fromEvent: fromEvent
})
```

### 用法

``` js
// 使用 `subscriptions` 选项提供 XStream streams
new Vue({
  el: '#app',
  subscriptions: {
    msg: messageStream
  }
})
```

``` html
<!-- 在模板中正常进行绑定 -->
<div>{{ msg }}</div>
```

`subscriptions` 选项还可以接收函数，这样就可以为每个组件实例返回唯一的 streams :

``` js
Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: xstream.create(...)
    }
  }
})
```

streams 通过 `vm.$streams` 对外暴露:

``` js
var vm = new Vue({
  subscriptions: {
    msg: messageStream
  }
})

vm.$streams.msg.addListener({
  next: msg => console.log(msg)
})
```

### `v-stream`: 流式 DOM 事件

> 此功能需要 XStream fromEvent 。

`vue-xs` 提供了 `v-stream` 指令，它允许你将 DOM 事件流式传递给 Stream 。语法类似于 `v-on` ，其中指令参数是事件名称，绑定值是目标 Stream 。

``` html
<button v-stream:click="plus$">+</button>
```

注意，你需要在渲染发生前，在 vm 实例上将 `plus$` 作为 `xstream` 的实例进行声明，就像你需要声明数据一样。你可以在 `subscriptions` 函数中完成:

``` js
new Vue({
  subscriptions () {
    // 声明接收的 Streams
    this.plus$ = xstream.create()
    // 然后使用 Streams 作为源数据流来创建 subscriptions 。
    // 源数据流以 { event: HTMLEvent, data?: any } 这种形式发出数据
    return {
      count: this.plus$.map(() => 1)
        .fold((total, change) => total + change, 0)
    }
  }
})
```

或者使用便捷选项 `domStreams`:

``` js
new Vue({
  domStreams: ['plus$'],
  subscriptions () {
    // 使用 this.plus$
  }
})
```

最后，你可以使用替代语法，传递额外的数据给流:

``` html
<button v-stream:click="{ stream: plus$, data: someData }">+</button>
```

当你需要传递像 `v-for` 迭代器这样的临时变量时，这很有用。你可以通过简单地从源数据流中提取来获得数据：

``` js
const plusData$ = this.plus$.map(({data}) => data)
```

你还可以传递额外选项(作为第三个参数传递给原生的 `addEventListener`):

``` html
<button v-stream:click="{
  stream: plus$,
  data: someData,
  options: { once: true, passive: true, capture: true }
}">+</button>
```

对于实际用法，请参见[示例](https://github.com/skyline0705/vue-xs/blob/master/example/counter.html)。

### 其他 API 方法

#### `$watchAsStream(expOrFn, [options])`

> 此功能需要 XStream fromEvent 。

这是一个添加到实例上的原型方法。你可以使用它来创建 stream， 该 stream 来自值的观察者。发出值的形式为 `{ newValue, oldValue }`:

``` js
var vm = new Vue({
  data: {
    a: 1
  },
  subscriptions () {
    // 使用 xstream 操作符声明式地映射至另一个属性
    return {
      aPlusOne: this.$watchAsStream('a')
        .map(({newValue}) => newValue)
        .map(a => a + 1)
    }
  }
})

// 或产生副作用...
vm.$watchAsStream('a')
  .addListener({
    next: ({ newValue, oldValue }) => console.log('stream value', newValue, oldValue),
    error: err => console.error(err),
    complete: () => console.log('complete')
  })
```

可选的 `options` 对象接收与 `vm.$watch` 相同的选项。

#### `$eventToStream(event)`

> 此功能需要 XStream fromEvent  。

将 vue.$on (包括生命周期事件) 转换成 Streams 。发出值的形式为 `{ name, msg }`:

``` js
var vm = new Vue({
  created () {
    this.$eventToStream('customEvent')
	  .addListener({
      next: (event) => console.log(event.name,event.msg)
    })
  }
})

// vm.$once 的 vue-xs 版本
this.$eventToStream('customEvent')
  .take(1)

let beforeDestroy$ = this.$eventToStream('hook:beforeDestroy').take(1)
xstream.periodic(500)
  .endWhen(beforeDestroy$)
```

#### `$addListenerTo(stream, {next, error, complete})`

这是一个添加到实例上的原型方法。可以用它来订阅 stream，但是让 VueXS 来管理取消订阅 (removeListener)。

``` js
var vm = new Vue({
  mounted () {
    this.$addListenerTo(xstream.periodic(1000), {
      next: function (count) {
        console.log(count)
      }
    })
  }
})
```

#### `$fromDOMEvent(selector, event)`

> 此功能需要 XStream fromEvent。

这是一个添加到实例上的原型方法。使用它从实例的元素的 DOM 事件创建 stream 。这类似于 `XStream fromEvent`，但即使在 DOM 实际渲染 之前，`subscriptions` 函数中也是可用的。

`selector` 用于寻找组件根元素的子孙节点，如果你想要监听根元素本身，那么传递 `null` 作为第一个参数

``` js
var vm = new Vue({
  subscriptions () {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').map(({target}) => target && target.value)
    }
  }
})
```

#### `$createStreamMethod(methodName)`

> 此功能需要 XStream fromEvent。

将函数调用转换为发出调用参数的 stream 序列。

这是一个添加到实例上的原型方法。用它来根据函数名称创建一个共享的 stream 。该函数会被赋值为一个 vm 方法。

```html
<custom-form :onSubmit="submitHandler"></custom-form>
```
``` js
var vm = new Vue({
  subscriptions () {
    return {
      // 需要 `share` 操作符
      formData: this.$createStreamMethod('submitHandler')
    }
  }
})
```
你可以使用 `streamMethods` 选项使其更为声明式:

``` js
new Vue({
  streamMethods: {
    submitHandler:'submitHandler$'
    // 或者使用数组简写形式: ['submitHandler']
  }
})
```

上面的代码会自动地在实例上创建两样东西:

1. `submitHandler` 方法，它可以使用 `v-on` 在模板中进行绑定。
2. `submitHandler$` stream， 它是向 `submitHandler` 发出调用的流。

[示例](https://github.com/skyline0705/vue-xs/blob/master/example/counter-function.html)

### 警告

你不能使用 `watch` 选项来观察 subscriptions ，因为它在 subscriptions 设置之前处理过了。但是你可以在 `created` 钩子中使用 `$watch` 来代替。

### 示例

参见 `/examples` 文件夹以获取一些简单的示例。

### 许可证

[MIT](http://opensource.org/licenses/MIT)
