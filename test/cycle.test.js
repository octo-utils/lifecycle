'use strict';
// import delay from 'delay'
import chai from 'chai'
import { cycle, spawn } from '../lib/lifecycle/index.js'

const { expect } = chai

describe('lib', function () {
  // this.slow(300);
  it('cycle', async function () {
    let stackLengthRoot = Symbol();
    let stackLengthDepth = Symbol();
    const stageNames = [];
    const cyc = cycle([
      ['begin', function* ({ next, curr, head }) {
        stackLengthRoot = new Error().stack.length
        stageNames.push(curr());
        return yield next()
      }],
      ['middle', function* ({ curr, next: hostNext }) {
        stageNames.push(curr());
        return yield cycle([
          ['middle-1', function* ({ curr, next }) {
            stageNames.push(curr());
            return yield next();
          }],
          ['middle-2', function* ({ curr, next }) {
            stageNames.push(curr());
            return yield next();
          }],
          ['middle-3', function* ({ curr, next }) {
            stackLengthDepth = new Error().stack.length
            stageNames.push(curr());
            return yield hostNext();
          }],
        ]);
      }],
      ['tail', function* ({ curr, head, tail }) {
        stageNames.push(curr());
        return yield tail();
      }],
      ['end', function* ({ cycle, curr }) {
        stageNames.push(curr());
        return yield null;
      }]
    ])

    await spawn(cyc)

    console.log(stageNames)

    expect(stackLengthDepth).eq(stackLengthRoot)

    expect(stageNames.map(item => item.toString()))
      .to.be.eql([
        'begin', 'middle', 'middle-1', 'middle-2', 'middle-3', 'tail', 'end'
      ])
  })
})
