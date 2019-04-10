export default function addListenerTo (observable, { next, error, complete }) {
  var obs$ = observable.subscribe({ next, error, complete })
  ;(this._obSubscriptions || (this._obSubscriptions = [])).push(obs$)
  return obs$
}
