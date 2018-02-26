export let xstream
export let Vue
export let warn = function () {}

export function install (_Vue, _xstream) {
  xstream = _xstream
  Vue = _Vue
  warn = Vue.util.warn || warn
}

export function hasXStream (vm) {
  if (!xstream) {
    warn(
      '$watchAsObservable requires XStream to be present globally or ' +
      'be passed to Vue.use() as the second argument.',
      vm
    )
    return false
  }
  return true
}

export function isStream (ob) {
  return ob && typeof ob.addListener === 'function'
}

export function unsub (handle) {
  if (!handle) return
  handle._ils.forEach(listener => {
    handle.removeListener(listener)
  })
}

export function defineReactive (vm, key, val) {
  if (key in vm) {
    vm[key] = val
  } else {
    Vue.util.defineReactive(vm, key, val)
  }
}

export function getKey (binding) {
  return [binding.arg].concat(Object.keys(binding.modifiers)).join(':')
}
