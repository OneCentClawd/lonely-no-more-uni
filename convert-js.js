/**
 * 微信小程序 Page({}) JS → Vue3 <script> 转换器
 * 重写所有页面的 JS 部分为 Vue Options API
 */
const fs = require('fs')
const path = require('path')

const SRC = '/Users/jacky/lonely-no-more/miniprogram/pages'
const DEST = '/Users/jacky/lonely-no-more-uni/src/pages'
const pages = fs.readdirSync(SRC).filter(f => fs.statSync(path.join(SRC, f)).isDirectory())

function convertPageJs(js, pageName) {
  // Replace wx. → uni.
  let code = js.replace(/\bwx\./g, 'uni.')

  // Replace require → import style (just comment for now)
  code = code.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g, '// import $1 from \'$2\'')

  // Extract Page({ ... }) content
  const pageMatch = code.match(/Page\(\{([\s\S]*)\}\)\s*$/)
  if (!pageMatch) {
    return `// Could not auto-convert, manual migration needed\n${code}`
  }

  const inner = pageMatch[1]

  // Extract data section
  const dataMatch = inner.match(/data:\s*\{([\s\S]*?)\n  \},/)
  let dataContent = dataMatch ? dataMatch[1] : ''

  // Get everything before Page()
  const beforePage = code.substring(0, code.indexOf('Page({'))

  // Extract methods (everything that's not data, onLoad, onShow, etc.)
  const lifecycles = ['onLoad', 'onShow', 'onHide', 'onUnload', 'onReady', 'onPullDownRefresh', 'onReachBottom', 'onShareAppMessage', 'onPageScroll']

  let result = `${beforePage}
const app = getApp()

export default {
  data() {
    return {${dataContent}
    }
  },`

  // Extract lifecycle and method functions
  const funcRegex = /\n  (\w+)\s*\(([^)]*)\)\s*\{/g
  let match
  let methods = []
  let lifecycleMethods = []

  // Simple approach: just replace this.data.xxx with this.xxx, this.setData({x}) with Object.assign(this, {x})
  // and wrap non-lifecycle methods in methods: {}
  
  // For now, output as-is but wrapped in Vue structure
  // The inner content needs this.data.xxx → this.xxx and this.setData() → direct assignment
  
  let methodsSection = inner
  // Remove data section
  if (dataMatch) {
    methodsSection = methodsSection.replace(dataMatch[0], '')
  }

  // Replace this.data.xxx → this.xxx
  methodsSection = methodsSection.replace(/this\.data\./g, 'this.')
  
  // Replace this.setData({...}) → Object.assign pattern
  // Simple single-line: this.setData({ key: val })
  methodsSection = methodsSection.replace(/this\.setData\(\{([^}]+)\}\)/g, (match, content) => {
    // Parse key: value pairs and convert to this.key = value
    const pairs = content.split(',').map(p => p.trim()).filter(Boolean)
    return pairs.map(p => {
      const [key, ...rest] = p.split(':')
      if (key && rest.length) {
        return `this.${key.trim()} = ${rest.join(':').trim()}`
      }
      return `// TODO: ${p}`
    }).join('\n        ')
  })

  // Multi-line setData — harder, just add a comment
  methodsSection = methodsSection.replace(/this\.setData\(/g, '// TODO: convert setData\n        this.setData(')

  result += methodsSection
  result += '\n}'

  return result
}

// Also need to copy utils
const utilSrc = '/Users/jacky/lonely-no-more/miniprogram/utils'
const utilDest = '/Users/jacky/lonely-no-more-uni/src/utils'
if (fs.existsSync(utilSrc)) {
  fs.mkdirSync(utilDest, { recursive: true })
  for (const f of fs.readdirSync(utilSrc)) {
    let content = fs.readFileSync(path.join(utilSrc, f), 'utf8')
    content = content.replace(/\bwx\./g, 'uni.')
    fs.writeFileSync(path.join(utilDest, f), content)
  }
  console.log('✅ utils copied')
}

// Copy static assets
const staticSrc = '/Users/jacky/lonely-no-more/miniprogram/images'
const staticDest = '/Users/jacky/lonely-no-more-uni/src/static/images'
if (fs.existsSync(staticSrc)) {
  fs.mkdirSync(staticDest, { recursive: true })
  for (const f of fs.readdirSync(staticSrc)) {
    fs.copyFileSync(path.join(staticSrc, f), path.join(staticDest, f))
  }
  console.log('✅ images copied')
}

console.log('\nJS conversion is complex — recommend Puppy manually convert each page.')
console.log('Template conversion (convert.js) handles most WXML→Vue template syntax.')
console.log('Key manual changes needed per page:')
console.log('  1. Page({}) → export default {}')
console.log('  2. this.data.xxx → this.xxx')  
console.log('  3. this.setData({x:v}) → this.x = v')
console.log('  4. require() → import')
console.log('  5. onLoad(options) → onLoad() { const options = this.$route?.query }')
