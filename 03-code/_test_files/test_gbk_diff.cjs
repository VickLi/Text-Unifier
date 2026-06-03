/**
 * 测试 GBK 编码文件在对比模式下的表现
 * 通过原生模块验证编码探测 + 归一化后的文本内容
 */
const path = require('path');
const fs = require('fs');

const testDir = __dirname;
const native = require(path.join(testDir, '..', 'native', 'index.js'));

function getPath(fn) { return path.join(testDir, fn); }

let pass = true;
function check(desc, ok, detail) {
  if (ok) console.log('  [PASS] ' + desc);
  else { console.log('  [FAIL] ' + desc + ' — ' + (detail || 'FAIL')); pass = false; }
}

console.log('═══ 步骤 1a.6: GBK 编码兼容性测试 ═══\n');

// 1. 探测编码
const encA = native.detectEncoding(getPath('gbk_A.txt'));
const encB = native.detectEncoding(getPath('gbk_B.txt'));
check('gbk_A.txt 编码探测', encA === 'GB18030', encA);
check('gbk_B.txt 编码探测', encB === 'GB18030', encB);

// 2. 合并解码验证内容
const resA = native.mergeFiles([getPath('gbk_A.txt')], 50);
const resB = native.mergeFiles([getPath('gbk_B.txt')], 50);

check('gbk_A 解码无乱码', !resA.mergedText.includes('\uFFFD'), '');
check('gbk_A 内容正确', resA.mergedText.includes('第一章 踏上旅途'), resA.mergedText.slice(0, 30));
check('gbk_A 含作者', resA.mergedText.includes('张三'), '');

check('gbk_B 解码无乱码', !resB.mergedText.includes('\uFFFD'), '');
check('gbk_B 内容正确', resB.mergedText.includes('第一章 踏上旅途'), resB.mergedText.slice(0, 30));
check('gbk_B 含新增章节', resB.mergedText.includes('新版本新增章节'), '');

// 3. 模拟对比：两个文件都解码后，用 diffUtils 的对齐逻辑（段落分割）
const paragraphsA = resA.mergedText.split('\n').filter(Boolean);
const paragraphsB = resB.mergedText.split('\n').filter(Boolean);

check('gbk_A 段落数正确', paragraphsA.length === 3, `got ${paragraphsA.length}`);
check('gbk_B 段落数正确', paragraphsB.length === 4, `got ${paragraphsB.length}`);
check('共有段落匹配', paragraphsA[0] === paragraphsB[0], `"${paragraphsA[0]}" vs "${paragraphsB[0]}"`);

console.log('\n═══════════════════════════════════════');
if (pass) {
  console.log('✅ 步骤 1a.6 全部通过！GBK 文件编码探测、解码、段落对齐均正常。');
  process.exit(0);
} else {
  console.log('❌ 有测试未通过');
  process.exit(1);
}
