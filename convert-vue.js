/**
 * 批量转换小程序 Page({}) 语法为 Vue Options API
 * 在服务器上运行
 */
const fs = require('fs')
const path = require('path')

const PAGES_DIR = '/home/Jack/lonely-no-more-uni/src/pages'

// 获取所有页面目录
const pages = fs.readdirSync(PAGES_DIR).filter(f => {
  const stat = fs.statSync(path.join(PAGES_DIR, f))
  return stat.isDirectory()
})

console.log(`Found ${pages.length} pages:`, pages)

pages.forEach(pageName => {
  const vuePath = path.join(PAGES_DIR, pageName, `${pageName}.vue`)
  if (!fs.existsSync(vuePath)) {
    console.log(`Skip ${pageName}: no .vue file`)
    return
  }

  let content = fs.readFileSync(vuePath, 'utf-8')
  
  // 检查是否已经转换过
  if (content.includes('export default {')) {
    console.log(`Skip ${pageName}: already converted`)
    return
  }

  // 检查是否有 Page({})
  if (!content.includes('Page({')) {
    console.log(`Skip ${pageName}: no Page({}) found`)
    return
  }

  console.log(`Converting ${pageName}...`)

  // 提取 <script> 部分
  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/)
  if (!scriptMatch) {
    console.log(`Skip ${pageName}: no <script> found`)
    return
  }

  let scriptContent = scriptMatch[1]

  // 1. 找到 Page({ 和对应的 }) 结尾
  const pageStartIdx = scriptContent.indexOf('Page({')
  if (pageStartIdx === -1) {
    console.log(`Skip ${pageName}: Page({ not found in script`)
    return
  }

  // 找到 Page 调用之前的代码（imports, 常量定义等）
  const beforePage = scriptContent.substring(0, pageStartIdx).trim()

  // 找到 Page({...}) 的内容
  let braceCount = 0
  let pageContentStart = pageStartIdx + 6 // "Page({" 长度
  let pageContentEnd = -1
  
  for (let i = pageStartIdx + 5; i < scriptContent.length; i++) {
    if (scriptContent[i] === '{') braceCount++
    if (scriptContent[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        pageContentEnd = i
        break
      }
    }
  }

  if (pageContentEnd === -1) {
    console.log(`Skip ${pageName}: could not find Page end`)
    return
  }

  const pageContent = scriptContent.substring(pageContentStart, pageContentEnd)

  // 2. 提取 data 部分
  const dataMatch = pageContent.match(/data:\s*\{([\s\S]*?)\n  \},/)
  let dataContent = ''
  if (dataMatch) {
    dataContent = dataMatch[1]
  }

  // 3. 提取方法（data 之后的所有函数）
  // 移除 data 块，剩下的都是方法
  let methodsContent = pageContent
  if (dataMatch) {
    methodsContent = methodsContent.replace(dataMatch[0], '')
  }

  // 4. 转换 this.data.xxx → this.xxx
  methodsContent = methodsContent.replace(/this\.data\./g, 'this.')
  
  // 5. 转换 this.setData({...}) → 直接赋值
  // 简单的单属性赋值: this.setData({ loading: true })
  methodsContent = methodsContent.replace(
    /this\.setData\(\{\s*(\w+):\s*([^{}]+?)\s*\}\)/g,
    'this.$1 = $2'
  )
  
  // 复杂的多属性赋值: this.setData({...})
  // 转换成 Object.assign(this, {...})
  methodsContent = methodsContent.replace(
    /this\.setData\((\{[\s\S]*?\})\)/g,
    (match, obj) => {
      // 尝试解析对象的每个属性
      const props = []
      const propRegex = /(\w+):\s*([^,}]+)/g
      let propMatch
      while ((propMatch = propRegex.exec(obj)) !== null) {
        props.push(`this.${propMatch[1]} = ${propMatch[2].trim()}`)
      }
      if (props.length > 0 && props.length <= 5) {
        return props.join('\n        ')
      }
      // 太复杂就用 Object.assign
      return `Object.assign(this, ${obj})`
    }
  )

  // 6. 生成 Vue Options API 格式
  const vueScript = `
const app = getApp()

export default {
  data() {
    return {${dataContent}
    }
  },
  
  // 生命周期映射: onLoad → onLoad (uni-app 保留), onShow → onShow
  ${methodsContent.trim()}
}
`

  // 7. 替换原来的 <script> 部分
  const newScriptContent = beforePage + '\n' + vueScript

  content = content.replace(
    /<script>[\s\S]*?<\/script>/,
    `<script>\n${newScriptContent}\n</script>`
  )

  // 写回文件
  fs.writeFileSync(vuePath, content)
  console.log(`Converted ${pageName} ✅`)
})

console.log('Done!')
