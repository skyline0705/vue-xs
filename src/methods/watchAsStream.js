import { xstream, hasXStream } from '../util'

export default function watchAsStream (expOrFn, options) {
  if (!hasXStream()) {
    return
  }

  const vm = this
  const obs$ = xstream.Stream.create({
    start (listener) {
      const watch = () => {
        this._unwatch = vm.$watch(expOrFn, (newValue, oldValue) => {
          listener.next({ oldValue: oldValue, newValue: newValue })
        }, options)
      }
      // if $watchAsStream is called inside the subscriptions function,
      // because data hasn't been observed yet, the watcher will not work.
      // in that case, wait until created hook to watch.
      if (vm._data) {
        watch()
      } else {
        vm.$once('hook:created', watch)
      }
    },
    stop () {
      // disconnects the $watch expression
      this._unwatch && this._unwatch()
      delete this._unwatch
    }
  })

  return obs$
}
