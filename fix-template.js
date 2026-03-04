/**
 * 修复 Vue 模板语法
 * - range="{{xxx}}" → :range="xxx"
 * - data-xxx="{{yyy}}" → :data-xxx="yyy"
 * - scroll-into-view="{{xxx}}" → :scroll-into-view="xxx"
 * - enhanced="{{true}}" → :enhanced="true"
 * - catchtap="" → @click.stop=""
 */
const fs = require('fs')
const path = require('path')

const PAGES_DIR = '/home/Jack/lonely-no-more-uni/src/pages'

const pages = fs.readdirSync(PAGES_DIR).filter(f => {
  return fs.statSync(path.join(PAGES_DIR, f)).isDirectory()
})

let totalFixes = 0

pages.forEach(pageName => {
  const vuePath = path.join(PAGES_DIR, pageName, `${pageName}.vue`)
  if (!fs.existsSync(vuePath)) return

  let content = fs.readFileSync(vuePath, 'utf-8')
  const original = content
  let fixes = 0

  // 1. attr="{{value}}" → :attr="value" (动态绑定)
  content = content.replace(/(\s)(\w[\w-]*)="\{\{([^}]+)\}\}"/g, (match, space, attr, value) => {
    fixes++
    return `${space}:${attr}="${value}"`
  })

  // 2. catchtap="" → @click.stop=""
  content = content.replace(/catchtap="([^"]*)"/g, (match, handler) => {
    fixes++
    return `@click.stop="${handler}"`
  })

  // 3. bindtap → @click (以防遗漏)
  content = content.replace(/bindtap="([^"]*)"/g, (match, handler) => {
    fixes++
    return `@click="${handler}"`
  })

  // 4. bindinput → @input
  content = content.replace(/bindinput="([^"]*)"/g, (match, handler) => {
    fixes++
    return `@input="${handler}"`
  })

  // 5. bindchange → @change
  content = content.replace(/bindchange="([^"]*)"/g, (match, handler) => {
    fixes++
    return `@change="${handler}"`
  })

  // 6. class="xxx {{condition ? 'a' : 'b'}}" → :class="['xxx', condition ? 'a' : 'b']"
  // 这个比较复杂，先处理简单情况
  content = content.replace(/class="([^"{}]+)\s*\{\{([^}]+)\}\}"/g, (match, staticClass, dynamic) => {
    fixes++
    return `:class="['${staticClass.trim()}', ${dynamic}]"`
  })

  if (content !== original) {
    fs.writeFileSync(vuePath, content)
    console.log(`Fixed ${pageName}: ${fixes} fixes`)
    totalFixes += fixes
  }
})

console.log(`\nTotal fixes: ${totalFixes}`)
