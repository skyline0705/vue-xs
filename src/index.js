/* global Vue, xstream */

import { install } from './util'
import xsMixin from './mixin'
import streamDirective from './directives/stream'
import watchAsObservable from './methods/watchAsObservable'
import fromDOMEvent from './methods/fromDOMEvent'
import subscribeTo from './methods/subscribeTo'
import eventToObservable from './methods/eventToObservable'
import createObservableMethod from './methods/createObservableMethod'

export default function VueXS (Vue, xstream) {
  install(Vue, xstream)
  Vue.mixin(xsMixin)
  Vue.directive('stream', streamDirective)
  Vue.prototype.$watchAsObservable = watchAsObservable
  Vue.prototype.$fromDOMEvent = fromDOMEvent
  Vue.prototype.$subscribeTo = subscribeTo
  Vue.prototype.$eventToObservable = eventToObservable
  Vue.prototype.$createObservableMethod = createObservableMethod
}

// auto install
if (typeof Vue !== 'undefined' && typeof xstream !== 'undefined') {
  Vue.use(VueXS, xstream)
}
