/**
 * 修复 Vue 运行时问题
 * 1. <block> → <template>
 * 2. e.currentTarget.dataset → 直接传参（需要手动处理）
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

  // 1. <block> → <template>
  content = content.replace(/<block\b/g, () => { fixes++; return '<template' })
  content = content.replace(/<\/block>/g, () => { fixes++; return '</template>' })

  if (content !== original) {
    fs.writeFileSync(vuePath, content)
    console.log(`Fixed ${pageName}: ${fixes} <block> → <template>`)
    totalFixes += fixes
  }
})

console.log(`\nTotal <block> fixes: ${totalFixes}`)
console.log('\n⚠️  e.currentTarget.dataset 需要手动修改为直接传参')
