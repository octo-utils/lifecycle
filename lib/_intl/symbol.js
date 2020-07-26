export function isLifeCycle(target) {
  return target && Boolean(target[SYMBOL_isLifeCycle])
}

export const SYMBOL_isLifeCycle = Symbol() 

export const SYMBOL_isTransferable = Symbol()

export const SYMBOL_typeTransferPatchCycleFnParam = Symbol()
