/**
 * 修复所有 setData 转换残留：
 * 匹配模式：this.xxx = val, 后面跟着缩进的 "key: value," 行
 * 转为 this.key = value
 */
const fs = require('fs')
const path = require('path')

const PAGES_DIR = '/Users/jacky/lonely-no-more-uni/src/pages'

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let lines = content.split('\n')
  let fixed = []
  let i = 0
  let changed = false

  while (i < lines.length) {
    const line = lines[i]
    
    // Detect pattern: "this.xxx = val," at end (trailing comma suggests incomplete setData conversion)
    const assignTrailingComma = line.match(/^(\s*)this\.(\w+)\s*=\s*(.+),\s*$/)
    
    if (assignTrailingComma) {
      const indent = assignTrailingComma[1]
      // Check if next line looks like "key: value" (orphaned from setData)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trimStart()
        if (nextLine.match(/^\w+:\s/)) {
          // This is a broken setData conversion. Fix it.
          // First line: remove trailing comma
          fixed.push(`${indent}this.${assignTrailingComma[2]} = ${assignTrailingComma[3].replace(/,\s*$/, '')}`)
          changed = true
          i++
          
          // Process subsequent "key: value" lines
          while (i < lines.length) {
            const kvLine = lines[i].trim()
            const kvMatch = kvLine.match(/^(\w+):\s*(.+?)([,]?\s*)$/)
            if (kvMatch) {
              const val = kvMatch[2].replace(/,\s*$/, '')
              fixed.push(`${indent}this.${kvMatch[1]} = ${val}`)
              changed = true
              i++
            } else {
              break
            }
          }
          continue
        }
      }
    }
    
    // Also fix inline: "this.x = val, key: val2" on single line
    const inlineMatch = line.match(/^(\s*)this\.(\w+)\s*=\s*(.+?),\s+(\w+):\s+(.+)$/)
    if (inlineMatch) {
      const indent = inlineMatch[1]
      fixed.push(`${indent}this.${inlineMatch[2]} = ${inlineMatch[3]}`)
      // Parse remaining "key: val" pairs
      let rest = `${inlineMatch[4]}: ${inlineMatch[5]}`
      const pairs = rest.split(/,\s*/)
      for (const pair of pairs) {
        const kv = pair.match(/^(\w+):\s*(.+)$/)
        if (kv) {
          fixed.push(`${indent}this.${kv[1]} = ${kv[2]}`)
        }
      }
      changed = true
      i++
      continue
    }
    
    fixed.push(line)
    i++
  }

  if (changed) {
    fs.writeFileSync(filePath, fixed.join('\n'))
    console.log(`✅ Fixed: ${path.relative(PAGES_DIR, filePath)}`)
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkDir(full)
    else if (entry.name.endsWith('.vue')) fixFile(full)
  }
}

walkDir(PAGES_DIR)
console.log('Done!')
