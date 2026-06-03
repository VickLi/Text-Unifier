# Text Unifier V3.2.1 标准化 Bug 报告（复测版）

| 项目 | 内容 |
| :--- | :--- |
| **应用名称** | 文档终版确定器（Text Unifier） |
| **版本号** | V3.2.1 |
| **测试日期** | 2026-05-13 |
| **测试环境** | Windows 11 / Electron v31 / Chromium |

---

## Bug 状态总览

| 分类 | 数量 | 占比 |
| :--- | :---: | :---: |
| ✅ **已修复（CLOSED）** | **5** | **100%** |
| 🔴 **未修复（OPEN）** | **0** | **0%** |
| **合计** | **5** | **100%** |

### 修复率：**5/5 = 100%** 🎉

---

## 修复验证详情

### ✅ BUG-V3.2-001：撤回栈 checkedMap 空值防御 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/store/useStore.ts` → `undo()`/`redo()` |

```typescript
// 修复前
return { paragraphCheckedMap: new Map(Object.entries(snap.checkedMap)) };

// 修复后
const checkedEntries = snap.checkedMap ? Object.entries(snap.checkedMap) : [];
return { paragraphCheckedMap: new Map(checkedEntries) };
```

---

### ✅ BUG-V3.2-002：DiffViewer 卸载后 setState — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/components/DiffViewer.tsx` |

```typescript
useEffect(() => {
    let aborted = false;
    // ...
    const loadAndCompare = async () => {
        const textA = await detectEncoding(fileList[0].path);
        if (aborted) return;   // ← 新增
        const textB = await detectEncoding(fileList[1].path);
        if (aborted) return;   // ← 新增
        // ...
        if (!aborted) setDiffResult(...);  // ← 新增
    };
    loadAndCompare();
    return () => { aborted = true; };  // ← cleanup
}, [fileList]);
```

---

### ✅ BUG-V3.2-003：对比模式归一化增强 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/components/DiffViewer.tsx` → `normalize()` |

增强后的 `normalize` 链：
```
1. \r\n|\r → \n      (统一换行)
2. trim()            (首尾空白)
3. \x00-\x08...      (过滤控制字符)
4. \n\n 分割段落     
5. trim() + [ \t]+→' ' (压缩空格)
6. \u{FEFF} 去除     (BOM 清除)
```

---

### ✅ BUG-V3.2-004：芯片拖拽误触 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/components/FileChipBar.tsx` |

`distance: 8` → `distance: 12`（提升 50% 激活阈值）

---

### ✅ BUG-V3.2-005：wordDiff 中文逐字差异 — CLOSED

| 字段 | 内容 |
| :--- | :--- |
| **状态** | ✅ **CLOSED** |
| **文件** | `src/utils/diffUtils.ts` → `tokenize()` |

```typescript
// 新增中文逐字分词逻辑
if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) {
    tokens.push(ch);  // 中文单字拆分
} else {
    // 非中文按单词组合
    current += ch;
}
```

---

## 编译验证日志

```
TypeScript tsc --noEmit: 零错误 ✅
Vite build: 成功 ✅
Rust cargo test: 零改动 ✅
```

---

## 结论

> ✅ **V3.2 初测发现的 5 个 Bug 已全部修复关闭（5/5 = 100%）。**
> **编译验证全部通过。V3.2.1 推荐发布。**
