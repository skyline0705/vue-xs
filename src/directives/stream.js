import { xstream, hasXStream, isStream, warn, getKey, unsub } from '../util'

export default {
  // Example ./example/counter_dir.html
  bind (el, binding, vnode) {
    if (!hasXStream()) {
      return
    }

    let handle = binding.value
    const event = binding.arg
    const streamName = binding.expression
    const modifiers = binding.modifiers

    if (isStream(handle)) {
      handle = { stream: handle }
    } else if (!handle || !isStream(handle.stream)) {
      warn(
        'Invalid Stream found in directive with key "' + streamName + '".' +
        streamName + ' should be an instance of XStream or have the ' +
        'type { stream: xstream, data: any }.',
        vnode.context
      )
      return
    }

    const stream = handle.stream
    const next = stream.shamefullySendNext.bind(stream)
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
    if (_handle && handle && isStream(handle.stream)) {
      _handle.data = handle.data
    }
  },

  unbind (el, binding) {
    const key = getKey(binding)
    const handle = el._rxHandles && el._rxHandles[key]
    if (handle) {
      unsub(handle.subscription)
      el._rxHandles[key] = null
    }
  }
}
