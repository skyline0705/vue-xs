import { xstream, hasXStream } from '../util'

/**
 * @see {@link https://vuejs.org/v2/api/#vm-on}
 * @param {String||Array} evtName Event name
 * @return {Observable} Event stream
 */
export default function eventToStream (evtName) {
  if (!hasXStream()) {
    return
  }
  const vm = this
  const evtNames = Array.isArray(evtName) ? evtName : [evtName]
  const obs$ = xstream.Stream.create({
    start (listener) {
      this.eventPairs = evtNames.map(name => {
        const callback = msg => listener.next({ name, msg })
        vm.$on(name, callback)
        return { name, callback }
      })
    },
    stop () {
      this.eventPairs.forEach(pair => vm.$off(pair.name, pair.callback))
      delete this.eventPairs
    }
  })

  return obs$
}
