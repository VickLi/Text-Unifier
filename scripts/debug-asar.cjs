/**
 * 调试脚本：提取 asar 并列出内容
 * 用法: node scripts/debug-asar.cjs <asar路径> <输出目录>
 */
const asar = require('@electron/asar');
const fs = require('fs');
const path = require('path');

const asarPath = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3] || path.join(path.dirname(asarPath), '_debug_out'));

console.log('输入:', asarPath);
console.log('输出:', outDir);

// 列出 asar 内容
const files = asar.listPackage(asarPath);
console.log('总文件数:', files.length);

// 显示顶层目录
const topLevel = new Set();
files.forEach(f => {
  const parts = f.replace(/^[/\\]/, '').split(/[/\\]/);
  if (parts[0]) topLevel.add(parts[0]);
});
console.log('顶层目录:', Array.from(topLevel).join(', '));

// 显示 dist 相关文件
console.log('\ndist 相关文件:');
files.filter(f => f.startsWith('dist') || f.startsWith('\\dist')).slice(0, 10).forEach(f => console.log('  ' + f));

console.log('\ndist-electron 相关文件:');
files.filter(f => f.includes('dist-electron')).slice(0, 10).forEach(f => console.log('  ' + f));

// 提取
console.log('\n提取中...');
fs.mkdirSync(outDir, { recursive: true });
asar.extractAll(asarPath, outDir);

const extracted = fs.readdirSync(outDir);
console.log('提取的顶层目录:', extracted.join(', '));
console.log('✅ 完成');
