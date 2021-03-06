import Vue from 'vue'
import { WatchOptions } from 'vue'
import xstream from 'xstream'

export type Streams = Record<string, xstream<any>>
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    subscriptions?: Streams | ((this: V) => Streams)
    domStreams?: string[]
    streamMethods?: string[] | Record<string, string>
  }
}

export interface WatchStream<T> {
  newValue: T
  oldValue: T
}
declare module "vue/types/vue" {
  interface Vue {
    $streams: Streams;
    $watchAsStream(expr: string, options?: WatchOptions): xstream<WatchStream<any>>
    $watchAsStream<T>(fn: (this: this) => T, options?: WatchOptions): xstream<WatchStream<T>>
    $eventToStream(event: string): xstream<{name: string, msg: any}>
    $addListenerTo<T>(
      stream: xstream<T>,
      next: (t: T) => void,
      error?: (e: any) => void,
      complete?: () => void): void
    $fromDOMEvent(selector: string | null, event: string): xstream<Event>
    $createStreamMethod(methodName: string): xstream<any>
  }
}

export declare function install(V: typeof Vue): void
