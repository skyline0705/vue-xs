import Vue from 'vue'
import * as VueRX from '../index'
import xstream from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'

Vue.use(VueRX, {xstream, fromEvent})

const vm1 = new Vue({
  el: '#app',
  subscriptions: {
    msg: xstream.periodic(100)
  }
})

vm1.$observables.msg.addListener({
  next: msg => console.log(msg)
})

Vue.component('foo', {
  subscriptions: function () {
    return {
      msg: xstream.periodic(100)
    }
  }
})

new Vue({
  domStreams: ['plus$']
})

const vm2 = new Vue({
  data: {
    a: 1
  },
  subscriptions () {
    // declaratively map to another property with Rx operators
    return {
      aPlusOne: this.$watchAsObservable('a')
        .map(({newValue}) => newValue)
        .map((a: number) => a + 1)
    }
  }
})

// or produce side effects...
vm2.$watchAsObservable('a')
  .addListener({
    next: ({ newValue, oldValue }) => console.log('stream value', newValue, oldValue),
    error: err => console.error(err),
    complete: () => console.log('complete')
  })


new Vue({
  created () {
    this.$eventToObservable('customEvent')
    .addListener({
      next: (event) => console.log(event.name,event.msg)
    })
  }
})

new Vue({
  mounted () {
    this.$subscribeTo(xstream.periodic(1000), function (count) {
      console.log(count)
    })
  }
})

new Vue({
  subscriptions () {
    return {
      inputValue: this.$fromDOMEvent('input', 'keyup').map(({target}) => target && target.value)
    }
  }
})

new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod('submitHandler')
    }
  }
})

new Vue({
  subscriptions () {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod('submitHandler')
    }
  }
})
