/**
 * 更新 app.asar 中的 Electron 入口文件 —— 稳定版
 * 用独特的时间戳临时目录避免冲突
 */
const path = require('path');
const fs = require('fs');
const asar = require('@electron/asar');

const [asarPath, cjsDir, outputAsar] = process.argv.slice(2).map(p => path.resolve(p));
const tmpDir = path.join(path.dirname(asarPath), `_asar_${Date.now()}`);

// 1. 提取
console.log('提取 ' + asarPath + ' → ' + tmpDir);
fs.mkdirSync(tmpDir, { recursive: true });
asar.extractAll(asarPath, tmpDir);
console.log('已提取:', fs.readdirSync(tmpDir).join(', '));

// 2. 更新 dist-electron
const deDir = path.join(tmpDir, 'dist-electron');
fs.copyFileSync(path.join(cjsDir, 'main.cjs'), path.join(deDir, 'main.cjs'));
fs.copyFileSync(path.join(cjsDir, 'preload.cjs'), path.join(deDir, 'preload.cjs'));
for (const f of ['main.js', 'preload.js']) {
  const fp = path.join(deDir, f);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}
console.log('✅ dist-electron 已更新');

// 3. 更新 package.json
const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'));
pkg.main = 'dist-electron/main.cjs';
fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');
console.log('✅ package.json main → dist-electron/main.cjs');

// 4. 打包
if (fs.existsSync(outputAsar)) fs.unlinkSync(outputAsar);
asar.createPackage(tmpDir, outputAsar).then(() => {
  console.log('✅ asar 已创建:', outputAsar);
  // 5. 清理
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('✅ 完成');
}).catch(err => {
  console.error('❌ 打包失败:', err.message);
  process.exit(1);
});
