import { xstream, defineReactive, isStream, warn, unsub } from './util'

export default {
  created () {
    const vm = this
    const domStreams = vm.$options.domStreams
    if (domStreams) {
      domStreams.forEach(key => {
        vm[key] = xstream.Stream.create()
      })
    }

    const observableMethods = vm.$options.observableMethods
    if (observableMethods) {
      if (Array.isArray(observableMethods)) {
        observableMethods.forEach(methodName => {
          vm[ methodName + '$' ] = vm.$createObservableMethod(methodName)
        })
      } else {
        Object.keys(observableMethods).forEach(methodName => {
          vm[observableMethods[methodName]] = vm.$createObservableMethod(methodName)
        })
      }
    }

    let obs = vm.$options.subscriptions
    if (typeof obs === 'function') {
      obs = obs.call(vm)
    }
    if (obs) {
      vm.$observables = {}
      vm._obSubscriptions = []
      Object.keys(obs).forEach(key => {
        defineReactive(vm, key, undefined)
        const ob = vm.$observables[key] = obs[key]
        if (!isStream(ob)) {
          warn(
            'Invalid Stream found in subscriptions option with key "' + key + '".',
            vm
          )
          return
        }
        vm._obSubscriptions.push(obs[key])
        obs[key].addListener({
          next: value => { vm[key] = value },
          error: error => { throw error }
        })
      })
    }
  },

  beforeDestroy () {
    if (this._obSubscriptions) {
      this._obSubscriptions.forEach(unsub)
    }
  }
}
