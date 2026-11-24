const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

for (const target of ['chrome', 'firefox']) {
  test(`${target} build includes every file referenced by the manifest and HTML`, () => {
    const root = `build/${target}`
    const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`, 'utf8'))
    assert.equal(manifest.manifest_version, target === 'chrome' ? 3 : 2)
    const references = [...Object.values(manifest.icons || {}), ...Object.values(manifest.chrome_url_overrides || {})]
    for (const content of manifest.content_scripts || []) references.push(...content.js || [], ...content.css || [])
    if (manifest.background?.service_worker) references.push(manifest.background.service_worker)
    references.push(...manifest.background?.scripts || [])
    if (manifest.options_ui?.page) references.push(manifest.options_ui.page)
    const action = manifest.action || manifest.browser_action
    if (action?.default_popup) references.push(action.default_popup)
    for (const file of references) {
      assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`)
      if (file.endsWith('.html')) {
        const html = fs.readFileSync(path.join(root, file), 'utf8')
        for (const [, link] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
          if (!link || /^(?:[a-z]+:|#|\/\/)/i.test(link)) continue
          assert.ok(fs.existsSync(path.join(root, path.dirname(file), link)), `missing HTML asset ${link}`)
        }
      }
    }
  })
}

for (const target of ['chrome', 'firefox']) {
  test(`${target} CSS includes its local image assets`, () => {
    const root = `build/${target}/styles`
    for (const file of fs.readdirSync(root).filter(f => f.endsWith('.css'))) {
      const css = fs.readFileSync(path.join(root, file), 'utf8')
      for (const [, link] of css.matchAll(/url\(['"]?([^'"()]+)['"]?\)/g)) {
        if (/^(?:[a-z]+:|#|\/\/)/i.test(link)) continue
        assert.ok(fs.existsSync(path.join(root, path.dirname(file), link)), `missing CSS asset ${link}`)
      }
    }
  })
}
