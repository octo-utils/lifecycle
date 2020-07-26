"use strict";
import { isLifeCycle } from '../_intl/symbol.js'
import { isTransferable } from './transfer.js';

const isNil = obj => typeof obj === typeof void 0 || obj === null;

const isMaybeGenerator = obj => (
  !isNil(obj) && "function" == typeof obj.next && "function" == typeof obj.throw
);

const tail = array => array[array.length - 1]

async function _executeTickDefault(gen, lastValue, executeTick, executeLoop, depth) {
  const { value, done } = gen.next(lastValue);
  const isValueMaybeGenerator = isMaybeGenerator(value)
  return { value, done, isValueMaybeGenerator }
}

async function _executeLoop(executeTick = _executeTickDefault, gen, initialValue = null) {
  let valueCurrent = initialValue
  let isDoneRoot = false
  let stackFlatten = [{ genSelf: gen }]

  while(!isDoneRoot) {
    let isDoneTick = false
    while(stackFlatten.length > 0) {
      const { genSelf } = tail(stackFlatten)
      const { value, done, isValueMaybeGenerator } = 
        await executeTick(genSelf, valueCurrent)
      
      isDoneTick = done
      valueCurrent = value
      if (isTransferable(value)) {
        valueCurrent = value.value
      }
      
      if (isValueMaybeGenerator) {
        stackFlatten.push({ genSelf: value })
      } else if (done) {
        stackFlatten.pop()
      }
    }
    isDoneRoot = isDoneTick
  }

  return valueCurrent;
}

export async function spawn(gen, initialStage = null) {
  const FLAG_CANCELED = Symbol('CANCELED');

  let isCanceled = false;

  async function cancel() {
    isCanceled = true;
  };

  async function _executeTickSpawn(gen, lastValue, ...rest) {
    if (isCanceled) {
      throw FLAG_CANCELED
    }
    return _executeTickDefault(gen, lastValue, ...rest)
  }

  const task = (async function() {
    let result = null
    try {
      result = await _executeLoop(_executeTickSpawn, gen, initialStage);
    } catch (error) {
      if (error === FLAG_CANCELED) return null;
      throw error
    }
    return result;
  })();

  return Object.assign(task, {
    cancel: async () => {
      cancel();
      return await task;
    }
  })
}
