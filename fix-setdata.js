/**
 * 修复 setData 转换遗留的 "this.x = val, y: val2" 语法错误
 * 将 "this.xxx = val, yyy: val2, zzz: val3" 转为多行 "this.xxx = val\nthis.yyy = val2\nthis.zzz = val3"
 */
const fs = require('fs')
const path = require('path')
const glob = require('path')

const PAGES_DIR = '/Users/jacky/lonely-no-more-uni/src/pages'

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false

  // Pattern: this.xxx = val, yyy: val2 (possibly chained)
  // Match lines like: this.prop = value, prop2: value2, prop3: value3
  const lines = content.split('\n')
  const fixedLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Match: leading whitespace + this.xxx = value, key: value [, key: value]...
    const match = line.match(/^(\s*)(this\.(\w+)\s*=\s*)(.+)$/)
    if (match) {
      const indent = match[1]
      const firstAssign = match[2]
      const rest = match[4]

      // Check if rest contains ", key: value" pattern (not inside strings/objects)
      // Simple heuristic: look for ", identifier: " pattern
      const parts = []
      let current = ''
      let depth = 0 // track {}, [], ()

      for (let j = 0; j < rest.length; j++) {
        const ch = rest[j]
        if (ch === '{' || ch === '[' || ch === '(') depth++
        if (ch === '}' || ch === ']' || ch === ')') depth--
        if (ch === ',' && depth === 0) {
          // Check if next non-space chars match "identifier:"
          const remaining = rest.slice(j + 1).trimStart()
          const keyMatch = remaining.match(/^(\w+)\s*:/)
          if (keyMatch) {
            parts.push(current.trim())
            current = ''
            // Skip comma
            continue
          }
        }
        current += ch
      }
      parts.push(current.trim())

      if (parts.length > 1) {
        // First part is the value for the first assignment
        fixedLines.push(`${indent}${firstAssign}${parts[0]}`)
        // Remaining parts are "key: value" → "this.key = value"
        for (let k = 1; k < parts.length; k++) {
          const kvMatch = parts[k].match(/^(\w+)\s*:\s*(.+)$/)
          if (kvMatch) {
            fixedLines.push(`${indent}this.${kvMatch[1]} = ${kvMatch[2]}`)
          } else {
            fixedLines.push(`${indent}${parts[k]}`) // fallback
          }
        }
        changed = true
        continue
      }
    }
    fixedLines.push(line)
  }

  if (changed) {
    fs.writeFileSync(filePath, fixedLines.join('\n'))
    console.log(`✅ Fixed: ${filePath}`)
  }
}

// Process all vue files
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkDir(full)
    else if (entry.name.endsWith('.vue')) fixFile(full)
  }
}

walkDir(PAGES_DIR)
console.log('Done!')
