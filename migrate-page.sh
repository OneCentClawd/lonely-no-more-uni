#!/bin/bash
# 迁移小程序页面到 uni-app vue 文件
# 用法: ./migrate-page.sh <page-name>
# 例如: ./migrate-page.sh index

PAGE=$1
SRC="/Users/jacky/lonely-no-more/miniprogram/pages/$PAGE/$PAGE"
DEST_DIR="/Users/jacky/lonely-no-more-uni/src/pages/$PAGE"
DEST="$DEST_DIR/$PAGE.vue"

mkdir -p "$DEST_DIR"

# 读取 wxml, js, wxss
WXML=$(cat "${SRC}.wxml" 2>/dev/null || echo "")
JS=$(cat "${SRC}.js" 2>/dev/null || echo "")
WXSS=$(cat "${SRC}.wxss" 2>/dev/null || echo "")

# 基本替换: wx:if → v-if, wx:for → v-for, wx:else → v-else, bindtap → @click
# 注意: 这只是初步转换，需要人工审查
TEMPLATE=$(echo "$WXML" | \
  sed 's/wx:if="{{/v-if="/g' | \
  sed 's/wx:elif="{{/v-else-if="/g' | \
  sed 's/wx:else/v-else/g' | \
  sed 's/wx:for="{{/v-for="item in /g' | \
  sed 's/wx:for-item="/v-for-item="/g' | \
  sed 's/wx:for-index="/v-for-index="/g' | \
  sed 's/wx:key="/:key="/g' | \
  sed 's/bindtap="/@click="/g' | \
  sed 's/bindinput="/@input="/g' | \
  sed 's/bindchange="/@change="/g' | \
  sed 's/bindscrolltolower="/@scrolltolower="/g' | \
  sed 's/catchtap="/@click.stop="/g' | \
  sed 's/}}"/"/g' | \
  sed 's/src="{{/src="/g' | \
  sed 's/class="{{/:class="/g')

# JS: wx. → uni. 替换
SCRIPT=$(echo "$JS" | sed 's/wx\./uni./g')

echo "<!-- 迁移自小程序, 需人工审查 -->" > "$DEST"
echo "<template>" >> "$DEST"
echo "$TEMPLATE" >> "$DEST"
echo "</template>" >> "$DEST"
echo "" >> "$DEST"
echo "<script>" >> "$DEST"
echo "$SCRIPT" >> "$DEST"
echo "</script>" >> "$DEST"
echo "" >> "$DEST"
echo "<style scoped>" >> "$DEST"
echo "$WXSS" >> "$DEST"
echo "</style>" >> "$DEST"

echo "✅ Migrated: $PAGE → $DEST"
