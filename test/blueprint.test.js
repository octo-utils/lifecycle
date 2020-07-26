import { node } from '../lib/lifecycle/blueprint.js'
import { spawn } from '../lib/lifecycle/coroutine.js';
import chai from 'chai'

const { expect } = chai

describe('lib', function () {
  it('blueprint', async function () {
    const stageNames = [];
    const genCyc = node(function* ({ stage }) {
      stageNames.push('head');
      return stage('primary')
    })
      .connect('primary', node(function* ({ curr, stage }) {
        // console.log('primary here...')
        stageNames.push(curr());
        return stage('secondary')
      }))
      .connect('secondary', node(function* ({ curr, tail }) {
        // console.log('secondary here...')
        stageNames.push(curr());
        return tail()
      }))

    await spawn(genCyc())

    console.log(stageNames)

    expect(stageNames.map(item => item.toString()))
      .to.be.eql(['head', 'primary', 'secondary'])
  })
})
