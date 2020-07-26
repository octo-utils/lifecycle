
import uniqBy from '../_intl/uniq-by.js'
import cycle from './cycle.js'

const SYMBOL_isConnectable = Symbol('isConnectable')

const SYMBOL_begin = Symbol('begin')

const SYMBOL_end = Symbol('end')

const SYMBOL_privateGetter = Symbol('privateGetter')

const SYMBOL_privateGetContext = Symbol('privateGetContext')

const isConnectable = a => a[SYMBOL_isConnectable] === true

export function connect(from, tagName, to) {
  if (!isConnectable(to)) {
    throw Object.assign(new TypeError('expect node to be connectable, index: 2'), { target: to });
  }
  from.connect(tagName, to)
  return void 0
}

function* _tailNoop() {
  return yield null;
}

function _tailMustBeFunction(tail) {
  return typeof tail === 'function' ? tail : _tailNoop
}

function _patchFnIgnoreNext(fn) {
  return function* (param) {
    const { head, curr, tail } = param
    return yield fn({ ...param, node: node, head, tail, curr, next: tail })
  }
}

function* _gen(contextPatch) {
  const { getHeadFn, head_fn, stages } = contextPatch
  return yield cycle([
    [SYMBOL_begin, _patchFnIgnoreNext(getHeadFn(head_fn))],
    ...stages.map(([tagName, getCycleOfStage]) => {
      return [tagName, _patchFnIgnoreNext(function* (param) {
        const final = yield getCycleOfStage(null, (head_fn) => (function* () {
          return yield head_fn(param)
        }))
        return final
      })]
    }),
  ])
}

export function node(head_fn) {
  const contextPatch = {
    getHeadFn: (head_fn) => head_fn,
    head_fn,
    stages: []
  }

  const getCycle = function (tail_fn = _tailNoop, getHeadFn = null) {
    connect(
        getCycle,
        SYMBOL_end,
        node(_patchFnIgnoreNext(_tailMustBeFunction(tail_fn)))
      )
    return _gen({
      ...contextPatch,
      ...typeof getHeadFn === 'function' && {
        getHeadFn
      }
    })
  }

  return Object.assign(getCycle, {
    [SYMBOL_isConnectable]: true,
    [SYMBOL_privateGetter]: function (flag) {
      if (flag === SYMBOL_privateGetContext) {
        return Object.freeze({ ...contextPatch })
      }
      return null
    },
    connect(tagName, to) {
      if (!isConnectable(to)) {
        throw Object.assign(new TypeError('expect node to be connectable, index: 1'), { target: to });
      }
      contextPatch.stages.push([tagName, to])
      contextPatch.stages = uniqBy(item => item[0], contextPatch.stages)
      return getCycle
    }
  })
}