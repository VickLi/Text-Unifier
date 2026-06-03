/**
 * 自动化测试脚本：使用 Rust 原生模块验证编码探测和归一化
 */
const path = require('path');
const fs = require('fs');

const testDir = __dirname;

// 加载原生模块
let native;
try {
  native = require(path.join(testDir, '..', 'native', 'index.js'));
  console.log('✓ Rust 原生模块加载成功');
} catch (e) {
  console.error('✗ Rust 原生模块加载失败:', e.message);
  process.exit(1);
}

// 辅助函数：确保文件路径存在
function getPath(filename) {
  const p = path.join(testDir, filename);
  if (!fs.existsSync(p)) {
    console.error(`✗ 文件不存在: ${p}`);
    process.exit(1);
  }
  return p;
}

let allPassed = true;
function check(desc, ok, detail) {
  if (ok) {
    console.log(`  ✓ ${desc}`);
  } else {
    console.log(`  ✗ ${desc} — ${detail || '失败'}`);
    allPassed = false;
  }
}

console.log('\n═══════════════════════════════════════');
console.log('测试 1: 编码探测');
console.log('═══════════════════════════════════════\n');

// 1. GBK 编码探测
try {
  const enc1 = native.detectEncoding(getPath('test_gbk.txt'));
  const expectedEnc = 'GB18030'; // GBK is detected as GB18030 by encoding_rs
  check('GBK 文件 → ' + enc1, enc1 === expectedEnc || enc1 === 'GBK', `实际编码: ${enc1}, 期望: ${expectedEnc}`);
} catch (e) {
  check('GBK 编码探测', false, e.message);
}

// 2. 空文件编码探测
try {
  const enc2 = native.detectEncoding(getPath('test_empty.txt'));
  check('空文件 → ' + enc2, enc2 === 'UTF-8' || enc2 === 'unknown', `实际编码: ${enc2}`);
} catch (e) {
  check('空文件编码探测', false, e.message);
}

// 3. CRLF 文件编码探测（纯 ASCII，应为 UTF-8）
try {
  const enc3 = native.detectEncoding(getPath('test_crlf.txt'));
  check('CRLF 文件 → ' + enc3, enc3 === 'UTF-8', `实际编码: ${enc3}`);
} catch (e) {
  check('CRLF 文件编码探测', false, e.message);
}

// 4. BOM 文件编码探测
try {
  const enc4 = native.detectEncoding(getPath('test_bom.txt'));
  check('BOM 文件 → ' + enc4, enc4 === 'UTF-8-BOM', `实际编码: ${enc4}`);
} catch (e) {
  check('BOM 文件编码探测', false, e.message);
}

console.log('\n═══════════════════════════════════════');
console.log('测试 2: 合并归一化（merge_files 含编码+归一化）');
console.log('═══════════════════════════════════════\n');

// 5. CRLF → 统一为 \n（通过 merge_files 验证归一化）
try {
  const result5 = native.mergeFiles([getPath('test_crlf.txt')], 50);
  const text5 = result5.mergedText;
  const hasCR = text5.includes('\r\n');
  check('CRLF → 统一为 \\n', !hasCR, `仍包含 CRLF: ${hasCR}`);
  check('CRLF 内容正确', text5 === 'Hello\nWorld\nTest', `实际内容: ${JSON.stringify(text5)}`);
} catch (e) {
  check('CRLF → \\n 归一化', false, e.message);
}

// 6. 连续空格 → 压缩为单个空格
try {
  const result6 = native.mergeFiles([getPath('test_spaces.txt')], 50);
  const text6 = result6.mergedText;
  const hasMultiSpace = text6.includes('  ');
  check('连续空格 → 单个空格', !hasMultiSpace, `仍有连续空格`);
  check('空格压缩内容正确', text6 === 'Hello World Test', `实际内容: ${JSON.stringify(text6)}`);
} catch (e) {
  check('空格压缩', false, e.message);
}

// 7. BOM 文件 → BOM 被去除
try {
  const result7 = native.mergeFiles([getPath('test_bom.txt')], 50);
  const text7 = result7.mergedText;
  const hasBOM = text7.charCodeAt(0) === 0xFEFF || text7.charCodeAt(0) === 0xEF ||
                 text7.charCodeAt(0) === 0xBB || text7.charCodeAt(0) === 0xBF;
  check('BOM → 被去除', !hasBOM, `文本开头字符: ${text7.charCodeAt(0)}`);
  check('BOM 内容正确', text7 === 'Hello World with BOM', `实际内容: ${JSON.stringify(text7)}`);
} catch (e) {
  check('BOM 去除', false, e.message);
}

// 8. GBK 文件正确解码
try {
  const result8 = native.mergeFiles([getPath('test_gbk.txt')], 50);
  const text8 = result8.mergedText;
  check('GBK 文件解码', text8.includes('第一章'), `内容: ${JSON.stringify(text8.slice(0, 50))}`);
  check('GBK 内容完整', text8.includes('张三'), `内容: ${JSON.stringify(text8.slice(-30))}`);
  // 检查无乱码（不应出现 � 等替换字符）
  const hasReplacement = text8.includes('\uFFFD');
  check('GBK 无乱码', !hasReplacement, `包含替换字符`);
} catch (e) {
  check('GBK 解码', false, e.message);
}

// 9. 空文件不报错
try {
  const result9 = native.mergeFiles([getPath('test_empty.txt')], 50);
  check('空文件不报错', true, '');
  check('空文件结果为空', result9.mergedText === '', `结果: ${JSON.stringify(result9.mergedText)}`);
} catch (e) {
  check('空文件不报错', false, e.message);
}

console.log('\n═══════════════════════════════════════');
if (allPassed) {
  console.log('✅ 全部测试通过！');
  process.exit(0);
} else {
  console.log('❌ 部分测试未通过');
  process.exit(1);
}
