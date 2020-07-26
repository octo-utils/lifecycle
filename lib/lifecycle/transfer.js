import { SYMBOL_isTransferable } from '../_intl/symbol.js'

export function transferable(type, target) {
  if (typeof type !== 'symbol') {
    throw new TypeError('expect type to be a symbol, index: 0');
  }
  return Object.freeze({
    type,
    [SYMBOL_isTransferable]: true,
    value: target
  })
}

export function isTransferable(target) {
  return target && !!target[SYMBOL_isTransferable]
}
