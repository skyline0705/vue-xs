import { xstream, hasXStream } from '../util'

export default function fromDOMEvent (selector, event) {
  if (!hasXStream()) {
    return
  }
  if (typeof window === 'undefined') {
    return xstream.Stream.create()
  }

  const vm = this
  const doc = document.documentElement
  const obs$ = xstream.Stream.create({
    start(listener) {
      this.listener = function (e) {
        if (!vm.$el) return
        if (selector === null && vm.$el === e.target) return listener.next(e)
        var els = vm.$el.querySelectorAll(selector)
        var el = e.target
        for (var i = 0, len = els.length; i < len; i++) {
          if (els[i] === el) return listener.next(e)
        }
      }
      doc.addEventListener(event, this.listener)
    },
    stop() {
      // disconnects the $watch expression
      doc.removeEventListener(event, this.listener)
      delete this.listener
    }
  })

  return obs$
}
