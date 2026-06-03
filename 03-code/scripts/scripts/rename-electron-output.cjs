/**
 * 编译后将 Electron CommonJS 输出重命名为 .cjs
 * 兼容 package.json 中的 "type": "module" 设置
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist-electron');

if (!fs.existsSync(distDir)) {
  console.error('dist-electron 目录不存在，请先运行 tsc');
  process.exit(1);
}

const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const oldPath = path.join(distDir, file);
  const newName = file.replace(/\.js$/, '.cjs');
  const newPath = path.join(distDir, newName);
  fs.renameSync(oldPath, newPath);
  console.log(`  ${file} → ${newName}`);
}

console.log(`✅ 已重命名 ${files.length} 个文件`);
