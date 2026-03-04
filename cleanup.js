/**
 * 清理重复的 const app = getApp()
 * 修复 setData 转换遗留问题
 */
const fs = require('fs')
const path = require('path')

const PAGES_DIR = '/home/Jack/lonely-no-more-uni/src/pages'

const pages = fs.readdirSync(PAGES_DIR).filter(f => {
  return fs.statSync(path.join(PAGES_DIR, f)).isDirectory()
})

pages.forEach(pageName => {
  const vuePath = path.join(PAGES_DIR, pageName, `${pageName}.vue`)
  if (!fs.existsSync(vuePath)) return

  let content = fs.readFileSync(vuePath, 'utf-8')
  let changed = false

  // 1. 移除重复的 const app = getApp()
  // 保留第一个，删除后面的
  let firstAppIdx = content.indexOf('const app = getApp()')
  if (firstAppIdx !== -1) {
    let afterFirst = content.substring(firstAppIdx + 'const app = getApp()'.length)
    if (afterFirst.includes('const app = getApp()')) {
      afterFirst = afterFirst.replace(/const app = getApp\(\)\n?/g, '')
      content = content.substring(0, firstAppIdx + 'const app = getApp()'.length) + afterFirst
      changed = true
    }
  }

  // 2. 修复 setData 转换的语法错误
  // 例如: this.latitude = app.globalData.latitude,
  //       longitude: app.globalData.longitude,
  // 应该是: this.latitude = app.globalData.latitude
  //        this.longitude = app.globalData.longitude
  
  // 找到不完整的赋值（以逗号结尾后跟属性名:）
  content = content.replace(
    /this\.(\w+)\s*=\s*([^,\n]+),\n\s+(\w+):\s*([^,\n]+),?\n\s+(\w+):\s*([^\n}]+)/g,
    (match, p1, v1, p2, v2, p3, v3) => {
      return `this.${p1} = ${v1}\n        this.${p2} = ${v2}\n        this.${p3} = ${v3}`
    }
  )

  // 简单的两属性情况
  content = content.replace(
    /this\.(\w+)\s*=\s*([^,\n]+),\n\s+(\w+):\s*([^\n}]+)/g,
    (match, p1, v1, p2, v2) => {
      return `this.${p1} = ${v1}\n        this.${p2} = ${v2}`
    }
  )

  // 3. 修复 Object.assign 中的 this.data 引用（如果还有的话）
  content = content.replace(/this\.data\./g, 'this.')

  if (changed || content !== fs.readFileSync(vuePath, 'utf-8')) {
    fs.writeFileSync(vuePath, content)
    console.log(`Fixed ${pageName}`)
  }
})

console.log('Cleanup done!')
