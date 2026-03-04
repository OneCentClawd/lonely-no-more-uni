/**
 * 从原始小程序 .js 文件生成正确的 Vue <script> 部分
 * 替换现有 .vue 文件中的 <script> 内容
 * 
 * 策略：用 AST-like 方式解析 setData 调用，而不是正则替换
 */
const fs = require('fs')
const path = require('path')

const ORIG = '/Users/jacky/lonely-no-more/miniprogram/pages'
const DEST = '/Users/jacky/lonely-no-more-uni/src/pages'

function findMatchingBrace(code, startIdx) {
  let depth = 0
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{' || code[i] === '(' || code[i] === '[') depth++
    if (code[i] === '}' || code[i] === ')' || code[i] === ']') {
      depth--
      if (depth === 0) return i
    }
    // Skip strings
    if (code[i] === '\'' || code[i] === '"' || code[i] === '`') {
      const q = code[i]
      i++
      while (i < code.length && code[i] !== q) {
        if (code[i] === '\\') i++
        i++
      }
    }
  }
  return -1
}

function convertSetData(code) {
  // Find all this.setData({ ... }) calls and convert to individual assignments
  let result = ''
  let i = 0
  
  while (i < code.length) {
    const idx = code.indexOf('this.setData(', i)
    if (idx === -1) {
      result += code.slice(i)
      break
    }
    
    result += code.slice(i, idx)
    
    // Find the opening paren
    const parenStart = idx + 'this.setData('.length
    // Find matching close paren
    const parenEnd = findMatchingBrace(code, idx + 'this.setData'.length)
    if (parenEnd === -1) {
      result += code.slice(idx, idx + 'this.setData('.length)
      i = parenStart
      continue
    }
    
    // Extract the argument (should be an object literal)
    const arg = code.slice(parenStart, parenEnd).trim()
    
    // Get indentation from current line
    let lineStart = idx
    while (lineStart > 0 && code[lineStart - 1] !== '\n') lineStart--
    const indent = code.slice(lineStart, idx).match(/^\s*/)[0]
    
    if (arg.startsWith('{')) {
      // Parse object properties
      const inner = arg.slice(1, -1).trim()
      const assignments = parseObjectProps(inner)
      
      if (assignments.length > 0) {
        result += assignments.map((a, idx) => {
          const prefix = idx === 0 ? '' : indent
          if (a.shorthand) {
            return `${prefix}this.${a.key} = ${a.key}`
          } else {
            return `${prefix}this.${a.key} = ${a.value}`
          }
        }).join('\n')
      } else {
        // Fallback: couldn't parse, keep as comment
        result += `/* TODO: this.setData(${arg}) */`
      }
    } else {
      // Not an object literal, keep as-is with comment
      result += `/* TODO: this.setData(${arg}) */`
    }
    
    i = parenEnd + 1
  }
  
  return result
}

function parseObjectProps(inner) {
  // Parse "key: value, key2: value2, shorthand, ..."
  const props = []
  let i = 0
  
  while (i < inner.length) {
    // Skip whitespace
    while (i < inner.length && /\s/.test(inner[i])) i++
    if (i >= inner.length) break
    
    // Skip comments
    if (inner[i] === '/' && inner[i + 1] === '/') {
      while (i < inner.length && inner[i] !== '\n') i++
      continue
    }
    
    // Read key (identifier, possibly with dots or brackets for computed)
    let key = ''
    if (inner[i] === '[') {
      // Computed property - skip for now
      const end = findMatchingBrace(inner, i)
      if (end === -1) break
      key = inner.slice(i, end + 1)
      i = end + 1
    } else if (inner[i] === '.' && inner[i + 1] === '.') {
      // Spread operator - skip
      while (i < inner.length && inner[i] !== ',') i++
      if (inner[i] === ',') i++
      continue
    } else {
      while (i < inner.length && /[\w$.]/.test(inner[i])) {
        key += inner[i]
        i++
      }
    }
    
    if (!key) { i++; continue }
    
    // Skip whitespace
    while (i < inner.length && /\s/.test(inner[i])) i++
    
    if (inner[i] === ':') {
      // key: value
      i++ // skip colon
      while (i < inner.length && /\s/.test(inner[i])) i++
      
      // Read value (need to handle nested objects, arrays, ternaries, etc.)
      let value = ''
      let depth = 0
      while (i < inner.length) {
        const ch = inner[i]
        if ((ch === '{' || ch === '[' || ch === '(')) depth++
        if ((ch === '}' || ch === ']' || ch === ')')) depth--
        if (ch === ',' && depth === 0) { i++; break }
        
        // Skip strings
        if (ch === '\'' || ch === '"' || ch === '`') {
          value += ch
          i++
          while (i < inner.length && inner[i] !== ch) {
            if (inner[i] === '\\') { value += inner[i]; i++ }
            value += inner[i]
            i++
          }
          if (i < inner.length) { value += inner[i]; i++ }
          continue
        }
        
        value += ch
        i++
      }
      
      props.push({ key, value: value.trim(), shorthand: false })
    } else if (inner[i] === ',' || i >= inner.length) {
      // Shorthand: { messages } → this.messages = messages
      props.push({ key, shorthand: true })
      if (inner[i] === ',') i++
    } else {
      // Unknown, skip to next comma
      while (i < inner.length && inner[i] !== ',') i++
      if (inner[i] === ',') i++
    }
  }
  
  return props
}

function convertPageToVue(jsCode) {
  // Step 1: wx. → uni.
  let code = jsCode.replace(/\bwx\./g, 'uni.')
  
  // Step 2: Convert this.setData() calls
  code = convertSetData(code)
  
  // Step 3: this.data.xxx → this.xxx
  code = code.replace(/this\.data\./g, 'this.')
  
  // Step 4: Extract Page({...}) structure
  const pageIdx = code.indexOf('Page({')
  if (pageIdx === -1) return null
  
  const beforePage = code.substring(0, pageIdx).trim()
  const pageEnd = findMatchingBrace(code, pageIdx + 5) // after "Page("
  if (pageEnd === -1) return null
  
  const pageContent = code.substring(pageIdx + 6, pageEnd) // inside Page({...})
  
  // Parse data section
  const dataMatch = pageContent.match(/\n\s*data:\s*\{/)
  let dataSection = ''
  let restContent = pageContent
  
  if (dataMatch) {
    const dataStart = pageContent.indexOf(dataMatch[0]) + dataMatch[0].length - 1
    const dataEnd = findMatchingBrace(pageContent, dataStart)
    if (dataEnd !== -1) {
      dataSection = pageContent.substring(dataStart + 1, dataEnd)
      // Remove data section from rest
      const fullDataMatch = pageContent.substring(pageContent.indexOf(dataMatch[0]), dataEnd + 1)
      restContent = pageContent.replace(fullDataMatch, '')
    }
  }
  
  // Build Vue component
  const lifecycles = ['onLoad', 'onShow', 'onHide', 'onUnload', 'onReady', 'onPullDownRefresh', 'onReachBottom', 'onShareAppMessage', 'onPageScroll']
  
  // Parse methods from restContent
  let methods = []
  let lifecycleMethods = []
  
  // Simple approach: extract method definitions
  const methodRegex = /\n\s{2}(\w+)\s*\(([^)]*)\)\s*\{/g
  let match
  let methodPositions = []
  
  while ((match = methodRegex.exec(restContent)) !== null) {
    const name = match[1]
    const params = match[2]
    const startIdx = match.index
    // Find method body end
    const braceStart = restContent.indexOf('{', startIdx + match[0].length - 1)
    const braceEnd = findMatchingBrace(restContent, braceStart)
    if (braceEnd !== -1) {
      const body = restContent.substring(braceStart + 1, braceEnd)
      const isLifecycle = lifecycles.includes(name)
      const entry = { name, params, body }
      if (isLifecycle) {
        lifecycleMethods.push(entry)
      } else {
        methods.push(entry)
      }
    }
  }
  
  // Build output
  let output = ''
  
  // Imports / requires / consts before Page()
  if (beforePage) {
    // Convert require to import-like
    let cleaned = beforePage.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g, 
      "import $1 from '$2'")
    output += cleaned + '\n\n'
  }
  
  // Add getApp() if not already present
  if (!beforePage.includes('getApp()')) {
    output += 'const app = getApp()\n\n'
  }
  output += 'export default {\n'
  output += '  data() {\n'
  output += '    return {\n'
  
  // Clean up data section indentation
  const dataLines = dataSection.split('\n').map(l => {
    const trimmed = l.trim()
    if (!trimmed) return ''
    return '      ' + trimmed
  }).filter(l => l.trim()).join('\n')
  output += dataLines + '\n'
  
  output += '    }\n'
  output += '  },\n\n'
  
  // Lifecycle methods (at component level in uni-app)
  for (const lc of lifecycleMethods) {
    output += `  ${lc.name}(${lc.params}) {${lc.body}  },\n\n`
  }
  
  // Methods
  if (methods.length > 0) {
    output += '  methods: {\n'
    for (let i = 0; i < methods.length; i++) {
      const m = methods[i]
      output += `    ${m.name}(${m.params}) {${m.body}    }`
      output += i < methods.length - 1 ? ',\n\n' : '\n'
    }
    output += '  }\n'
  }
  
  output += '}\n'
  
  return output
}

// Process all pages
const pages = fs.readdirSync(ORIG).filter(f => fs.statSync(path.join(ORIG, f)).isDirectory())

for (const page of pages) {
  const jsFile = path.join(ORIG, page, `${page}.js`)
  const vueFile = path.join(DEST, page, `${page}.vue`)
  
  if (!fs.existsSync(jsFile) || !fs.existsSync(vueFile)) continue
  
  const jsCode = fs.readFileSync(jsFile, 'utf8')
  const vueCode = fs.readFileSync(vueFile, 'utf8')
  
  const newScript = convertPageToVue(jsCode)
  if (!newScript) {
    console.log(`⚠️  ${page}: Could not parse Page({})`)
    continue
  }
  
  // Replace <script> section in vue file
  const scriptStart = vueCode.indexOf('<script>')
  const scriptEnd = vueCode.indexOf('</script>')
  
  if (scriptStart === -1 || scriptEnd === -1) {
    console.log(`⚠️  ${page}: No <script> tags found`)
    continue
  }
  
  const newVue = vueCode.substring(0, scriptStart) + '<script>\n' + newScript + '\n' + vueCode.substring(scriptEnd)
  fs.writeFileSync(vueFile, newVue)
  console.log(`✅ ${page}`)
}

console.log('\nDone! Run: npx vite build')
