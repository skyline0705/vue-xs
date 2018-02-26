/* global Vue, xstream */

import { install } from './util'
import xsMixin from './mixin'
import streamDirective from './directives/stream'
import watchAsStream from './methods/watchAsStream'
import fromDOMEvent from './methods/fromDOMEvent'
import subscribeTo from './methods/subscribeTo'
import eventToStream from './methods/eventToStream'
import createStreamMethod from './methods/createStreamMethod'

export default function VueXS (Vue, xstream) {
  install(Vue, xstream)
  Vue.mixin(xsMixin)
  Vue.directive('stream', streamDirective)
  Vue.prototype.$watchAsStream = watchAsStream
  Vue.prototype.$fromDOMEvent = fromDOMEvent
  Vue.prototype.$subscribeTo = subscribeTo
  Vue.prototype.$eventToStream = eventToStream
  Vue.prototype.$createStreamMethod = createStreamMethod
}

// auto install
if (typeof Vue !== 'undefined' && typeof xstream !== 'undefined') {
  Vue.use(VueXS, xstream)
}
