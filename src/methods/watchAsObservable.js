import { xstream, hasXStream, getDisposable } from '../util'

export default function watchAsObservable (expOrFn, options) {
  if (!hasXStream()) {
    return
  }

  const vm = this
  const obs$ = xstream.Stream.create(observer => {
    let _unwatch
    const watch = () => {
      _unwatch = vm.$watch(expOrFn, (newValue, oldValue) => {
        observer.next({ oldValue: oldValue, newValue: newValue })
      }, options)
    }

    // if $watchAsObservable is called inside the subscriptions function,
    // because data hasn't been observed yet, the watcher will not work.
    // in that case, wait until created hook to watch.
    if (vm._data) {
      watch()
    } else {
      vm.$once('hook:created', watch)
    }

    // Returns function which disconnects the $watch expression
    return getDisposable(() => {
      _unwatch && _unwatch()
    })
  })

  return obs$
}
