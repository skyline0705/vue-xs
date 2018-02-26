# vue-xs
[^_^]:
  TODO
  [![Build Status](https://circleci.com/gh/vuejs/vue-xs/tree/master.svg?style=shield)](https://circleci.com/gh/vuejs/vue-xs/tree/master)

English | [简体中文](README-CN.md)

Simple [xstream](https://github.com/staltz/xstream) binding for Vue.js. It also supports subscriptions for generic observables that implement the `.addListener` and `.removeListener` interface. For example, you can use it to subscribe to `most.js` or Falcor streams, but some features require xstream to work.

### Installation

#### NPM + ES2015

``` bash
npm install vue vue-xs rxjs --save
```

``` js
import Vue from 'vue'
import xstream from 'xstream'
import VueXS from 'vue-xs'
import fromEvent from 'xstream/extra/fromEvent'

// tada!
Vue.use(VueXS, {
  Stream: xstream,
  fromEvent: fromEvent
})
```

### Usage

``` js
// provide XStream streams with the `subscriptions` option
new Vue({
  el: '#app',
  subscriptions: {
    msg: messageStream
  }
})
```

``` html
<!-- bind to it normally in templates -->
<div>{{ msg }}</div>
```

The `subscriptions` options can also take a function so that you can return unique streams for each component instance:

``` js
Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: xstream.create(...)
    }
  }
})
```

The streams are exposed as `vm.$streams`:

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

### `v-stream`: Streaming DOM Events

> This feature requires XStream fromEvent.

`vue-xs` provides the `v-stream` directive which allows you to stream DOM events to a Stream. The syntax is similar to `v-on` where the directive argument is the event name, and the binding value is the target Stream.

``` html
<button v-stream:click="plus$">+</button>
```

Note that you need to declare `plus$` as an instance of `xstream` on the vm instance before the render happens, just like you need to declare data. You can do that right in the `subscriptions` function:

``` js
new Vue({
  subscriptions () {
    // declare the receiving Subjects
    this.plus$ = xstream.create()
    // ...then create subscriptions using the Subjects as source stream.
    // the source stream emits in the form of { event: HTMLEvent, data?: any }
    return {
      count: this.plus$.map(() => 1)
        .fold((total, change) => total + change, 0)
    }
  }
})
```

Or, use the `domStreams` convenience option:

``` js
new Vue({
  domStreams: ['plus$'],
  subscriptions () {
    // use this.plus$
  }
})
```

Finally, you can pass additional data to the stream using the alternative syntax:

``` html
<button v-stream:click="{ stream: plus$, data: someData }">+</button>
```

This is useful when you need to pass along temporary variables like `v-for` iterators. You can get the data by simply plucking it from the source stream:

``` js
const plusData$ = this.plus$.map(({data}) => data)
```

you can also pass along extra options (passed along to native `addEventListener` as the 3rd argument):

``` html
<button v-stream:click="{
  stream: plus$,
  data: someData,
  options: { once: true, passive: true, capture: true }
}">+</button>
```

See [example](https://github.com/skyline0705/vue-xs/blob/master/example/counter.html) for actual usage.

### Other API Methods

#### `$watchAsStream(expOrFn, [options])`

> This feature requires XStream fromEvent.

This is a prototype method added to instances. You can use it to create an stream from a value watcher. The emitted value is in the format of `{ newValue, oldValue }`:

``` js
var vm = new Vue({
  data: {
    a: 1
  },
  subscriptions () {
    // declaratively map to another property with Rx operators
    return {
      aPlusOne: this.$watchAsStream('a')
        .map(({newValue}) => newValue)
        .map(a => a + 1)
    }
  }
})

// or produce side effects...
vm.$watchAsStream('a')
  .addListener({
    next: ({ newValue, oldValue }) => console.log('stream value', newValue, oldValue),
    error: err => console.error(err),
    complete: () => console.log('complete')
  })
```

The optional `options` object accepts the same options as `vm.$watch`.

#### `$eventToStream(event)`

> This feature requires XStream fromEvent.

Convert vue.$on (including lifecycle events) to Streams. The emitted value is in the format of `{ name, msg }`:

``` js
var vm = new Vue({
  created () {
    this.$eventToStream('customEvent')
	  .addListener({
      next: (event) => console.log(event.name,event.msg)
    })
  }
})

// vm.$once vue-xs version
this.$eventToStream('customEvent')
  .take(1)

// Another way to auto unsub:
let beforeDestroy$ = this.$eventToStream('hook:beforeDestroy').take(1)
xstream.periodic(500)
  .takeUntil(beforeDestroy$)
```

#### `$addListenerTo(stream, {next, error, complete})`

This is a prototype method added to instances. You can use it to subscribe to an stream, but let VueRx manage the unsubscribe(removeListener).

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

> This feature requires XStream fromEvent.

This is a prototype method added to instances. Use it to create an stream from DOM events within the instances' element. This is similar to `XStream fromEvent`, but usable inside the `subscriptions` function even before the DOM is actually rendered.

`selector` is for finding descendant nodes under the component root element, if you want to listen to events from root element itself, pass `null` as first argument.

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

> This feature requires XStream fromEvent.

Convert function calls to stream sequence which emits the call arguments.

This is a prototype method added to instances. Use it to create a stream from a function name. The function will be assigned as a vm method.

```html
<custom-form :onSubmit="submitHandler"></custom-form>
```
``` js
var vm = new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createStreamMethod('submitHandler')
    }
  }
})
```

You can use the `streamMethods` option to make it more declarative:

``` js
new Vue({
  streamMethods: {
    submitHandler:'submitHandler$'
    // or with Array shothand: ['submitHandler']
  }
})
```

The above will automatically create two things on the instance:

1. A `submitHandler` method which can be bound to in template with `v-on`;
2. A `submitHandler$` stream which will be the stream emitting calls to `submitHandler`.

[example](https://github.com/skyline0705/vue-xs/blob/master/example/counter-function.html)

### Caveats

You cannot use the `watch` option to watch subscriptions, because it is processed before the subscriptions are set up. But you can use `$watch` in the `created` hook instead.

### Example

See `/examples` for some simple examples.

### License

[MIT](http://opensource.org/licenses/MIT)
