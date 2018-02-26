import { xstream, hasXStream, warn } from '../util'

/**
 * @name Vue.prototype.$createObservableMethod
 * @description Creates an observable from a given function name.
 * @param {String} methodName Function name
 * @param {Boolean} [passContext] Append the call context at the end of emit data?
 * @return {Observable} Hot stream
 */
export default function createObservableMethod (methodName, passContext) {
  if (!hasXStream()) {
    return
  }
  const vm = this

  if (vm[methodName] !== undefined) {
    warn(
      'Potential bug: ' +
      `Method ${methodName} already defined on vm and has been overwritten by $createObservableMethod.` +
      String(vm[methodName]),
      vm
    )
  }

  const producer = {
    start (listener) {
      vm[methodName] = function () {
        const args = Array.from(arguments)
        if (passContext) {
          args.push(this)
          listener.next(args)
        } else {
          if (args.length <= 1) {
            listener.next(args[0])
          } else {
            listener.next(args)
          }
        }
      }
    },
    stop () {
      delete vm[methodName]
    }
  }

  // Must be a hot stream otherwise function context may overwrite over and over again
  return xstream.Stream.create(producer)
}
