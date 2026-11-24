const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')

function setup(t, detector) {
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] })
  const classes = new Set()
  const classList = { add: v => classes.add(v), remove: v => classes.delete(v), toggle: v => classes.has(v) ? classes.delete(v) : classes.add(v) }
  const elements = {
    '.disable input': { checked: true },
    '.status': { classList }, '.webcam': { classList }, '.message': { innerHTML: '' },
    '#webcam-player': { readyState: 2, play: async () => {}, srcObject: null },
    '#webcam-canvas': { getContext: () => ({ drawImage() {} }) },
    '#movie_player video': { paused: false, pause() {}, play: async () => {} }
  }
  let stops = 0
  const stream = { getTracks: () => [{ stop: () => stops++ }] }
  const sandbox = { require: () => ({ on() {} }), window: {}, document: { querySelector: s => elements[s] }, navigator: { mediaDevices: { getUserMedia: async () => stream } }, FaceDetector: detector, setTimeout, clearTimeout, setInterval, clearInterval }
  vm.runInNewContext(fs.readFileSync('src/scripts/contentscript.js', 'utf8') + '\nglobalThis.api = {initCapture, stopCapture};', sandbox)
  return { ...sandbox.api, elements, stops: () => stops }
}

test('unavailable native detection stops the webcam without an unhandled rejection', async t => {
  const app = setup(t, class { async detect() { throw new Error('service unavailable') } })
  await app.initCapture()
  t.mock.timers.tick(100)
  await new Promise(setImmediate)
  assert.equal(app.stops(), 1)
  assert.equal(app.elements['.disable input'].checked, false)
  assert.match(app.elements['.message'].innerHTML, /detection is unavailable/)
  assert.equal(app.elements['#webcam-player'].srcObject, null)
})

test('a missing native constructor fails before opening the camera', async t => {
  const app = setup(t, class { constructor() { throw new Error('not supported') } })
  await app.initCapture()
  assert.equal(app.stops(), 0)
  assert.equal(app.elements['.disable input'].checked, false)
  assert.match(app.elements['.message'].innerHTML, /detection is unavailable/)
})

test('stopping capture releases every active webcam track', async t => {
  const app = setup(t, class { async detect() { return [] } })
  await app.initCapture()
  app.stopCapture()
  assert.equal(app.stops(), 1)
  assert.equal(app.elements['#webcam-player'].srcObject, null)
})
