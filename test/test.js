/* eslint-env jest */

'use strict'

const Vue = require('vue/dist/vue.js')
const VueXS = require('../dist/vue-xs.js')
const Stream = require('xstream').Stream

const fromEvent = require('xstream/extra/fromEvent').default

Vue.config.productionTip = false
Vue.use(VueXS, { Stream, fromEvent })

const nextTick = Vue.nextTick

function mock () {
  let listener
  const stream = Stream.create({
    start: _listener => { listener = _listener },
    stop: () => { listener = null }
  })

  return {
    stream,
    next: val => listener.next(val)
  }
}

function trigger (target, event) {
  var e = document.createEvent('HTMLEvents')
  e.initEvent(event, true, true)
  target.dispatchEvent(e)
}

function click (target) {
  trigger(target, 'click')
}

test('expose $observables', () => {
  const { stream, next } = mock()

  const vm = new Vue({
    subscriptions: {
      hello: stream.startWith(0)
    }
  })

  const results = []
  vm.$observables.hello.addListener({
    next: val => {
      results.push(val)
    }
  })

  next(1)
  next(2)
  next(3)
  expect(results).toEqual([0, 1, 2, 3])
})

test('bind subscriptions to render', done => {
  const { stream, next } = mock()

  const vm = new Vue({
    subscriptions: {
      hello: stream.startWith('foo')
    },
    render (h) {
      return h('div', this.hello)
    }
  }).$mount()

  expect(vm.$el.textContent).toBe('foo')

  next('bar')
  nextTick(() => {
    expect(vm.$el.textContent).toBe('bar')
    done()
  })
})

test('subscriptions() has access to component state', () => {
  const { stream } = mock()

  const vm = new Vue({
    data: {
      foo: 'FOO'
    },
    props: ['bar'],
    propsData: {
      bar: 'BAR'
    },
    subscriptions () {
      return {
        hello: stream.startWith(this.foo + this.bar)
      }
    },
    render (h) {
      return h('div', this.hello)
    }
  }).$mount()

  expect(vm.$el.textContent).toBe('FOOBAR')
})

test('subscriptions() can throw error properly', done => {
  const { stream, next } = mock()

  const vm = new Vue({
    subscriptions () {
      return {
        num: stream.startWith(1).map(n => n.toFixed())
      }
    },
    render (h) {
      return h('div', this.num)
    }
  }).$mount()

  nextTick(() => {
    expect(() => {
      next(null)
    }).toThrow()
    expect(vm.$el.textContent).toBe('1')
    done()
  })
})

test('v-stream directive (basic)', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button v-stream:click="click$">+</button>
      </div>
    `,
    domStreams: ['click$'],
    subscriptions () {
      return {
        count: this.click$.map(() => 1)
          .fold((total, change) => total + change, 0)
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    done()
  })
})

test('v-stream directive (with .native modify)', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <my-button id="btn-native" v-stream:click.native="clickNative$">+</my-button>
        <my-button id="btn" v-stream:click="click$">-</my-button>
      </div>
    `,
    components: {
      myButton: {
        template: '<button>MyButton</button>'
      }
    },
    domStreams: ['clickNative$', 'click$'],
    subscriptions () {
      return {
        count: Stream.merge(
          this.clickNative$,
          this.click$
        )
          .filter(e => e.event.target && e.event.target.id === 'btn-native')
          .map(() => 1)
          .fold((total, change) => total + change, 0)
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('#btn'))
  click(vm.$el.querySelector('#btn'))
  click(vm.$el.querySelector('#btn-native'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    done()
  })
})

test('v-stream directive (with data)', done => {
  const vm = new Vue({
    data: {
      delta: -1
    },
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button v-stream:click="{ stream: click$, data: delta }">+</button>
      </div>
    `,
    domStreams: ['click$'],
    subscriptions () {
      return {
        count: this.click$.map(({ data }) => data)
          .fold((total, change) => total + change, 0)
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('-1')
    vm.delta = 1
    nextTick(() => {
      click(vm.$el.querySelector('button'))
      nextTick(() => {
        expect(vm.$el.querySelector('span').textContent).toBe('0')
        done()
      })
    })
  })
})

test('v-stream directive (multiple bindings on same node)', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button
          v-stream:click="{ stream: plus$, data: 1 }"
          v-stream:keyup="{ stream: plus$, data: -1 }">+</button>
      </div>
    `,
    domStreams: ['plus$'],
    subscriptions () {
      return {
        count: this.plus$.map(({ data }) => data)
          .fold((total, change) => total + change, 0)
      }
    }
  }).$mount()

  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    trigger(vm.$el.querySelector('button'), 'keyup')
    nextTick(() => {
      expect(vm.$el.querySelector('span').textContent).toBe('0')
      done()
    })
  })
})

test('$fromDOMEvent()', done => {
  const vm = new Vue({
    template: `
      <div>
        <span class="count">{{ count }}</span>
        <button>+</button>
      </div>
    `,
    subscriptions () {
      const click$ = this.$fromDOMEvent('button', 'click')
      return {
        count: click$.map(() => 1)
          .fold((total, change) => total + change, 0)
      }
    }
  }).$mount()

  document.body.appendChild(vm.$el)
  expect(vm.$el.querySelector('span').textContent).toBe('0')
  click(vm.$el.querySelector('button'))
  nextTick(() => {
    expect(vm.$el.querySelector('span').textContent).toBe('1')
    done()
  })
})

test('$watchAsObservable()', done => {
  const vm = new Vue({
    data: {
      count: 0
    }
  })

  const results = []
  vm.$watchAsObservable('count').addListener({
    next: change => {
      results.push(change)
    }
  })

  vm.count++
  nextTick(() => {
    expect(results).toEqual([{ newValue: 1, oldValue: 0 }])
    vm.count++
    nextTick(() => {
      expect(results).toEqual([
        { newValue: 1, oldValue: 0 },
        { newValue: 2, oldValue: 1 }
      ])
      done()
    })
  })
})

test('$subscribeTo()', () => {
  const { stream, next } = mock()
  const results = []
  const vm = new Vue({
    created () {
      this.$subscribeTo(stream, {
        next: count => {
          results.push(count)
        }
      })
    }
  })

  next(1)
  expect(results).toEqual([1])

  vm.$destroy()
  setTimeout(() => {
    next(2)
    expect(results).toEqual([1]) // should not trigger anymore
  })
})

test('$eventToObservable()', done => {
  let calls = 0
  const vm = new Vue({
    created () {
      this.$eventToObservable('ping')
        .addListener({
          next: function (event) {
            expect(event.name).toEqual('ping')
            expect(event.msg).toEqual('ping message')
            calls++
          }
        })
    }
  })
  vm.$emit('ping', 'ping message')

  nextTick(() => {
    vm.$destroy()
    // Should not emit
    vm.$emit('pong', 'pong message')
    expect(calls).toEqual(1)
    done()
  })
})

test('$eventToObservable() with lifecycle hooks', done => {
  const vm = new Vue({
    created () {
      this.$eventToObservable('hook:beforeDestroy')
        .addListener({
          next: () => {
            done()
          }
        })
    }
  })
  nextTick(() => {
    vm.$destroy()
  })
})

test('$createObservableMethod() with no context', done => {
  const vm = new Vue({
    created () {
      this.$createObservableMethod('add')
        .addListener({
          next: function (param) {
            expect(param).toEqual('hola')
            done()
          }
        })
    }
  })
  nextTick(() => {
    vm.add('hola')
  })
})

test('$createObservableMethod() with muli params & context', done => {
  const vm = new Vue({
    created () {
      this.$createObservableMethod('add', true)
        .addListener({
          next: function (param) {
            expect(param[0]).toEqual('hola')
            expect(param[1]).toEqual('mundo')
            expect(param[2]).toEqual(vm)
            done()
          }
        })
    }
  })
  nextTick(() => {
    vm.add('hola', 'mundo')
  })
})

test('observableMethods mixin', done => {
  const vm = new Vue({
    observableMethods: ['add'],
    created () {
      this.add$
        .addListener({
          next: function (param) {
            expect(param[0]).toEqual('Qué')
            expect(param[1]).toEqual('tal')
            done()
          }
        })
    }
  })
  nextTick(() => {
    vm.add('Qué', 'tal')
  })
})

test('observableMethods mixin', done => {
  const vm = new Vue({
    observableMethods: { 'add': 'plus$' },
    created () {
      this.plus$
        .addListener({
          next: function (param) {
            expect(param[0]).toEqual('Qué')
            expect(param[1]).toEqual('tal')
            done()
          }
        })
    }
  })
  nextTick(() => {
    vm.add('Qué', 'tal')
  })
})
