/**
 * 全面修复 setData 转换残留
 * 处理所有 "this.x = val,\n    key: val" 和 "this.x = val, key: val" 模式
 */
const fs = require('fs')
const path = require('path')

const PAGES_DIR = path.join(__dirname, 'src/pages')
let totalFixes = 0

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const result = []
  let i = 0
  let fixes = 0

  while (i < lines.length) {
    const line = lines[i]
    
    // Pattern 1: "this.xxx = val," followed by orphan "key: val" lines
    // Detect: line ends with comma after assignment, next line is indented "key: val"
    const trailingCommaMatch = line.match(/^(\s*)(this\.(\w+)\s*=\s*.+),\s*(\/\/.*)?$/)
    if (trailingCommaMatch && i + 1 < lines.length) {
      const nextTrimmed = lines[i + 1].trim()
      // Check if next line is "identifier: value" (not a method call, not an object literal start)
      if (/^[a-zA-Z_]\w*\s*:(?!:)/.test(nextTrimmed) && !nextTrimmed.startsWith('//')) {
        const indent = trailingCommaMatch[1]
        // Remove trailing comma
        const fixedLine = line.replace(/,(\s*(\/\/.*)?)$/, '$1')
        result.push(fixedLine)
        fixes++
        i++
        
        // Consume subsequent "key: val" lines
        while (i < lines.length) {
          const kvTrimmed = lines[i].trim()
          const kvMatch = kvTrimmed.match(/^([a-zA-Z_]\w*)\s*:\s*(.+?)([,]?\s*)$/)
          if (kvMatch && !kvTrimmed.startsWith('//')) {
            const val = kvMatch[2].replace(/,\s*$/, '')
            result.push(`${indent}this.${kvMatch[1]} = ${val}`)
            fixes++
            i++
          } else {
            break
          }
        }
        continue
      }
    }

    // Pattern 2: Inline "this.xxx = val, key: val2" on one line
    // But avoid legitimate code like "this.arr = [1, 2, 3]" or function calls
    const inlineMatch = line.match(/^(\s*)(this\.(\w+)\s*=\s*)(.+)$/)
    if (inlineMatch) {
      const indent = inlineMatch[1]
      const prefix = inlineMatch[2]
      const rest = inlineMatch[4]
      
      // Try to split on ", identifier:" at depth 0
      let parts = []
      let current = ''
      let depth = 0
      let foundOrphan = false
      
      for (let j = 0; j < rest.length; j++) {
        const ch = rest[j]
        if (ch === '{' || ch === '[' || ch === '(') depth++
        if (ch === '}' || ch === ']' || ch === ')') depth--
        if (ch === '\'' || ch === '"' || ch === '`') {
          // Skip strings
          const quote = ch
          current += ch
          j++
          while (j < rest.length && rest[j] !== quote) {
            if (rest[j] === '\\') { current += rest[j]; j++ }
            current += rest[j]
            j++
          }
          if (j < rest.length) current += rest[j]
          continue
        }
        
        if (ch === ',' && depth === 0) {
          const remaining = rest.slice(j + 1).trimStart()
          const keyMatch = remaining.match(/^([a-zA-Z_]\w*)\s*:(?!:)/)
          if (keyMatch) {
            parts.push(current.trim())
            current = ''
            foundOrphan = true
            continue
          }
        }
        current += ch
      }
      parts.push(current.trim())
      
      if (foundOrphan && parts.length > 1) {
        result.push(`${indent}${prefix}${parts[0]}`)
        for (let k = 1; k < parts.length; k++) {
          const kvMatch = parts[k].match(/^([a-zA-Z_]\w*)\s*:\s*(.+)$/)
          if (kvMatch) {
            result.push(`${indent}this.${kvMatch[1]} = ${kvMatch[2]}`)
          } else {
            result.push(`${indent}${parts[k]}`)
          }
        }
        fixes++
        i++
        continue
      }
    }

    // Pattern 3: Standalone orphan "key: val" after a this.xxx line (no trailing comma)
    // This happens when the comma was already removed but orphans remain
    
    result.push(line)
    i++
  }

  if (fixes > 0) {
    fs.writeFileSync(filePath, result.join('\n'))
    console.log(`✅ ${path.relative(PAGES_DIR, filePath)}: ${fixes} fixes`)
    totalFixes += fixes
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (e.name.endsWith('.vue')) fixFile(full)
  }
}

walk(PAGES_DIR)
console.log(`\nTotal: ${totalFixes} fixes`)
