"use strict";
import { SYMBOL_isLifeCycle, SYMBOL_typeTransferPatchCycleFnParam } from '../_intl/symbol.js'
import { transferable } from './transfer.js';

const SYMBOL_isStage = Symbol('isStage')

function _isStage(target) {
  return !!target && !!target[SYMBOL_isStage] && !!target.name
}

export function stage(stringTag) {
  const a = {}
  a.name = stringTag
  a[SYMBOL_isStage] = true
  return Object.freeze(Object.defineProperties(a, {
    [SYMBOL_isStage]: {
      writable: false,
      configurable: false
    },
    name: {
      writable: false,
      configurable: false
    },
    toString: {
      value: () => stringTag,
      enumerable: false,
      configurable: false
    },
  }))
}

export default function* cycle(stagesWithTag) {
  if (!Array.isArray(stagesWithTag)) {
    throw new TypeError('expect stagesWithTag to be an array, index: 0');
  }

  const tagsOfStages = stagesWithTag.map(item => item[0]);
  const tagFirstStage = tagsOfStages[0];
  const tagLastStage = tagsOfStages[tagsOfStages.length - 1];
  const mappingTagToStage = stagesWithTag.reduce((mapping, current) => {
    const [tag, gen_fn] = current;
    mapping[tag] = gen_fn;
    return mapping;
  }, {});

  const makeReturn = tagToReturn => () => stage(tagToReturn)

  const tagHeadReturn = makeReturn(tagFirstStage);

  const tagLastReturn = makeReturn(tagLastStage);

  function* _runCycle(maybeStageLast, stagePrev = null) {
    if (!_isStage(maybeStageLast)) {
      if (maybeStageLast === void 0 || maybeStageLast === null) {
        return null
      }
      return maybeStageLast // return vanilia javascript value
    }
    const tagLast = maybeStageLast.name
    const fnCurrent = mappingTagToStage[tagLast]
    
    if (typeof fnCurrent !== "function") {
      return maybeStageLast // return stage to prarent scope
    }

    const tagCurr = makeReturn(tagLast)

    const stageFnParam = yield transferable(SYMBOL_typeTransferPatchCycleFnParam, {
      stage,
      next: () => {
        const indexOfCurrent = tagsOfStages.indexOf(tagLast);
        return stage(tagsOfStages[indexOfCurrent + 1] || tagsOfStages[0]);
      },
      curr: tagCurr,
      head: tagHeadReturn,
      tail: tagLastReturn,
      prev: stagePrev
    })

    const stageNext = yield fnCurrent(Object.freeze(stageFnParam));
    return yield Object.assign(_runCycle(stageNext, tagCurr), {
      [SYMBOL_isLifeCycle]: true
    });
  }

  return yield _runCycle(stage(tagFirstStage));
}
