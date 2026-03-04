/**
 * 微信小程序 WXML → Vue3 template 转换器
 * 处理：{{}} 绑定、wx:if/for/key、bindtap、data-属性等
 */
const fs = require('fs')
const path = require('path')

const SRC = '/Users/jacky/lonely-no-more/miniprogram/pages'
const DEST = '/Users/jacky/lonely-no-more-uni/src/pages'

const pages = fs.readdirSync(SRC).filter(f => fs.statSync(path.join(SRC, f)).isDirectory())

function convertWxml(wxml) {
  let out = wxml

  // wx:for → v-for with proper syntax
  // wx:for="{{list}}" wx:for-item="item" wx:key="id" → v-for="(item, index) in list" :key="item.id"
  // Simple case: wx:for="{{list}}" wx:key="id"
  out = out.replace(/wx:for="?\{\{([^}]+)\}\}"?\s*wx:for-item="([^"]+)"\s*wx:for-index="([^"]+)"\s*wx:key="([^"]+)"/g, (_, list, item, idx, key) => {
    const k = key === '*this' ? item : `${item}.${key}`
    return `v-for="(${item}, ${idx}) in ${list.trim()}" :key="${k}"`
  })
  out = out.replace(/wx:for="?\{\{([^}]+)\}\}"?\s*wx:for-item="([^"]+)"\s*wx:key="([^"]+)"/g, (_, list, item, key) => {
    const k = key === '*this' ? item : `${item}.${key}`
    return `v-for="(${item}, index) in ${list.trim()}" :key="${k}"`
  })
  out = out.replace(/wx:for="?\{\{([^}]+)\}\}"?\s*wx:key="([^"]+)"/g, (_, list, key) => {
    const k = key === '*this' ? 'item' : `item.${key}`
    return `v-for="(item, index) in ${list.trim()}" :key="${k}"`
  })
  // leftover wx:for without key
  out = out.replace(/wx:for="?\{\{([^}]+)\}\}"?/g, (_, list) => {
    return `v-for="(item, index) in ${list.trim()}"`
  })
  // Remove standalone wx:for-item, wx:for-index (already handled above)
  out = out.replace(/\s*wx:for-item="[^"]*"/g, '')
  out = out.replace(/\s*wx:for-index="[^"]*"/g, '')
  out = out.replace(/\s*wx:key="[^"]*"/g, '')

  // wx:if/elif/else
  out = out.replace(/wx:if="?\{\{([^}]+)\}\}"?/g, (_, expr) => `v-if="${expr.trim()}"`)
  out = out.replace(/wx:elif="?\{\{([^}]+)\}\}"?/g, (_, expr) => `v-else-if="${expr.trim()}"`)
  out = out.replace(/wx:else/g, 'v-else')

  // Event bindings
  out = out.replace(/bindtap="([^"]+)"/g, '@click="$1"')
  out = out.replace(/catchtap="([^"]+)"/g, '@click.stop="$1"')
  out = out.replace(/bindinput="([^"]+)"/g, '@input="$1"')
  out = out.replace(/bindchange="([^"]+)"/g, '@change="$1"')
  out = out.replace(/bindconfirm="([^"]+)"/g, '@confirm="$1"')
  out = out.replace(/bindscrolltolower="([^"]+)"/g, '@scrolltolower="$1"')
  out = out.replace(/bindlongtap="([^"]+)"/g, '@longtap="$1"')
  out = out.replace(/bindlongpress="([^"]+)"/g, '@longpress="$1"')
  out = out.replace(/bindload="([^"]+)"/g, '@load="$1"')
  out = out.replace(/binderror="([^"]+)"/g, '@error="$1"')
  out = out.replace(/bindsubmit="([^"]+)"/g, '@submit="$1"')
  out = out.replace(/bindfocus="([^"]+)"/g, '@focus="$1"')
  out = out.replace(/bindblur="([^"]+)"/g, '@blur="$1"')
  out = out.replace(/bindscroll="([^"]+)"/g, '@scroll="$1"')

  // data-xxx="{{val}}" → :data-xxx="val"
  out = out.replace(/data-(\w+)="?\{\{([^}]+)\}\}"?/g, ':data-$1="$2"')
  // data-xxx="static" (no binding) stays as is

  // Attribute bindings: attr="{{expr}}" → :attr="expr"
  // But NOT for text content {{expr}} which should stay
  // Handle src, class, style, value, placeholder, etc.
  out = out.replace(/(src|mode|url|open-type|hover-class|checked|disabled|hidden|scroll-y|scroll-x|maxlength|focus|auto-focus|confirm-type|adjust-position|cursor-spacing|selection-start|selection-end)="?\{\{([^}]+)\}\}"?/g, ':$1="$2"')

  // class="xxx {{expr ? 'a' : 'b'}}" → :class="['xxx', expr ? 'a' : 'b']"
  // This is complex; for now just handle simple class="{{expr}}" case
  out = out.replace(/class="\{\{([^}]+)\}\}"/g, ':class="$1"')
  // Mixed: class="static {{dynamic}}" — needs manual fix

  // style="color: {{expr}}" → :style="`color: ${expr}`"
  out = out.replace(/style="([^"]*)\{\{([^}]+)\}\}([^"]*)"/g, (_, pre, expr, post) => {
    return `:style="\`${pre}\${${expr}}${post}\`"`
  })

  // value="{{expr}}" → :value="expr"
  out = out.replace(/value="?\{\{([^}]+)\}\}"?/g, ':value="$1"')

  // Text content {{expr}} → stay as {{expr}} (Vue supports this)
  // But we need to clean up broken ones from sed

  // <wxs> → remove (handle separately)
  out = out.replace(/<wxs[\s\S]*?<\/wxs>/g, '<!-- WXS removed, convert to methods/computed -->')

  // <import> / <include> → remove
  out = out.replace(/<import[^>]*\/>/g, '')
  out = out.replace(/<include[^>]*\/>/g, '')

  return out
}

function convertJs(js) {
  let out = js
  // wx. → uni.
  out = out.replace(/\bwx\./g, 'uni.')
  // getApp() stays the same in uni-app
  // Page({}) → export default {} with proper structure
  // This is complex, leave as-is for now (manual conversion)
  return out
}

for (const page of pages) {
  const wxmlPath = path.join(SRC, page, `${page}.wxml`)
  const jsPath = path.join(SRC, page, `${page}.js`)
  const wxssPath = path.join(SRC, page, `${page}.wxss`)
  const wxsPath = path.join(SRC, page, `${page}.wxs`)
  const destDir = path.join(DEST, page)
  const destFile = path.join(destDir, `${page}.vue`)

  if (!fs.existsSync(wxmlPath)) continue
  fs.mkdirSync(destDir, { recursive: true })

  const wxml = fs.readFileSync(wxmlPath, 'utf8')
  const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : ''
  const wxss = fs.existsSync(wxssPath) ? fs.readFileSync(wxssPath, 'utf8') : ''

  const template = convertWxml(wxml)
  const script = convertJs(js)

  const vue = `<!-- 自动迁移，需人工审查 -->
<template>
${template}
</template>

<script>
${script}
</script>

<style scoped>
${wxss}
</style>
`
  fs.writeFileSync(destFile, vue)
  console.log(`✅ ${page}`)
}

console.log('\nDone! Pages need manual review for:')
console.log('- Page({}) → export default {} conversion')
console.log('- WXS → methods/computed')
console.log('- Complex class bindings')
console.log('- Template data references (this.data.xxx → this.xxx)')
