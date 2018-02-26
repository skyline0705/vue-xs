import { xstream, hasXStream, warn, getKey, unsub } from '../util'

export default {
  // Example ./example/counter_dir.html
  bind (el, binding, vnode) {
    if (!hasXStream()) {
      return
    }

    let handle = { subject: binding.value }
    const event = binding.arg
    const streamName = binding.expression
    const modifiers = binding.modifiers

    const subject = handle.subject
    const next = subject.shamefullySendNext.bind(subject)
    if (!modifiers.native && vnode.componentInstance) {
      handle.subscription = vnode.componentInstance.$eventToObservable(event)
      handle.subscription.addListener({
        next: e => {
          next({
            event: e,
            data: handle.data
          })
        }
      })
    } else {
      if (!xstream.fromEvent) {
        warn(
          `No 'fromEvent' method on Stream class. ` +
          `v-stream directive requires xstream's fromEvent factory. ` +
          `Try import 'xstream/extra/fromEvent' for ${streamName}`,
          vnode.context
        )
        return
      }
      const fromEventArgs = handle.options ? [el, event, handle.options] : [el, event]
      handle.subscription = xstream.fromEvent(...fromEventArgs)
      handle.subscription.addListener({
        next: e => {
          next({
            event: e,
            data: handle.data
          })
        }
      })
    }
    // store handle on element with a unique key for identifying
    // multiple v-stream directives on the same node
    ;(el._rxHandles || (el._rxHandles = {}))[getKey(binding)] = handle
  },

  update (el, binding) {
    const handle = binding.value
    const _handle = el._rxHandles && el._rxHandles[getKey(binding)]
    if (_handle && handle) {
      _handle.data = handle.data
    }
  },

  unbind (el, binding) {
    debugger
    const key = getKey(binding)
    const handle = el._rxHandles && el._rxHandles[key]
    if (handle) {
      unsub(handle.subscription)
      el._rxHandles[key] = null
    }
  }
}
