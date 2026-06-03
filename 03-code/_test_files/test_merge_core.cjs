/**
 * 自动化测试：合并去重核心（步骤 1b.2~1b.5）
 */
const path = require('path');
const testDir = __dirname;
const native = require(path.join(testDir, '..', 'native', 'index.js'));

function p(fn) { return path.join(testDir, fn); }

let pass = true;
function check(desc, ok, detail) {
  if (ok) console.log('  [PASS] ' + desc);
  else { console.log('  [FAIL] ' + desc + ' — ' + (detail || 'FAIL')); pass = false; }
}

console.log('=== 1b.2: 自动合并（长重叠 ≥50字） ===');
const rLong = native.mergeFiles([p('merge_A_long.txt'), p('merge_B_long.txt')], 50);
check('mergedText 含 A 前缀', rLong.mergedText.startsWith('A'.repeat(100) + 'X'.repeat(50)), '');
check('mergedText 含 B 后缀', rLong.mergedText.endsWith('B'.repeat(100)), '');
check('重叠仅保留一份', rLong.mergedText.indexOf('X'.repeat(50) + 'X'.repeat(50)) === -1, '仍有重复X');
check('总长度 250', rLong.totalChars === 250, `got ${rLong.totalChars}`);
check('连接点数量 1', rLong.connectionPoints.length === 1, `got ${rLong.connectionPoints.length}`);
check('连接点自动合并', rLong.connectionPoints[0].isAutoMerged === true, '');

console.log('\n=== 1b.2/1b.6: 短重叠（<50字）待确认 ===');
const rShort = native.mergeFiles([p('merge_A_short.txt'), p('merge_B_short.txt')], 50);
check('短重叠保留双份', rShort.mergedText.includes('ABCDEF') && rShort.mergedText.includes('FGHI'), rShort.mergedText);
check('连接点未自动合并', rShort.connectionPoints[0].isAutoMerged === false, '');
check('无连接标记在文本中', rShort.connectionPoints.length === 1, `got ${rShort.connectionPoints.length}`);

console.log('\n=== 1b.3: 完全包含跳过 ===');
const rContain = native.mergeFiles([p('merge_A_contain.txt'), p('merge_B_contain.txt')], 50);
check('合并结果仅含A内容', rContain.mergedText === 'ABCDEFGHI', rContain.mergedText);
check('B被标记为跳过', rContain.skippedFiles.includes('merge_B_contain.txt'), JSON.stringify(rContain.skippedFiles));
check('totalChars=9', rContain.totalChars === 9, `got ${rContain.totalChars}`);

console.log('\n=== 1b.4: 无重叠拼接（带\\n分隔） ===');
const rNone = native.mergeFiles([p('merge_A_none.txt'), p('merge_B_none.txt')], 50);
check('两段内容均存在', rNone.mergedText.includes('ABC') && rNone.mergedText.includes('XYZ'), rNone.mergedText);
check('无重叠长度>0的连接点', rNone.connectionPoints.every(cp => cp.overlapLength === 0), JSON.stringify(rNone.connectionPoints));

console.log('\n=== 1b.4: 单文件 ===');
const rSingle = native.mergeFiles([p('merge_A_none.txt')], 50);
check('直接输出原文', rSingle.mergedText === 'ABC', rSingle.mergedText);
check('无连接点', rSingle.connectionPoints.length === 0, `got ${rSingle.connectionPoints.length}`);

console.log('\n=== 1b.5: 多文件链式合并（短重叠<阈值，待确认） ===');
const rChain = native.mergeFiles([p('chain_A.txt'), p('chain_B.txt'), p('chain_C.txt')], 50);
check('三段内容均保留', rChain.mergedText.includes('ABC') && rChain.mergedText.includes('BCD') && rChain.mergedText.includes('CDE'), rChain.mergedText);
check('2个连接点', rChain.connectionPoints.length === 2, `got ${rChain.connectionPoints.length}`);
check('连接点均未自动合并', rChain.connectionPoints.every(cp => !cp.isAutoMerged), '');

console.log('\n====================');
if (pass) {
  console.log('[ALL PASS] 合并核心逻辑全部正确！');
  process.exit(0);
} else {
  console.log('[SOME FAILED]');
  process.exit(1);
}
