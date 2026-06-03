# Text Unifier V3.2.2 — Bug 修复说明

| 项目 | 内容 |
| :--- | :--- |
| **修复日期** | 2026-05-14 |
| **修复范围** | 1 个 🔴 P0 严重 Bug |
| **构建版本** | v3.2.2 |

---

## 修复清单

| Bug ID | 等级 | 文件 | 问题 | 修复 |
| :--- | :---: | :--- | :--- | :--- |
| BUG-V3.2.2-001 | 🔴 P0 | `DragOverlay.tsx` | 拖拽文件到窗口后不加载 | 新增 `dragover` 事件 + `dataTransfer.types` 检测 |

---

### 🔴 BUG-V3.2.2-001：拖拽 TXT 文件到窗口后不加载

| 项目 | 内容 |
| :--- | :--- |
| **严重等级** | 🔴 P0 - 严重（核心功能不可用） |
| **发现场景** | 从资源管理器拖拽 `.txt` 文件到软件窗口，遮罩正常显示，松开鼠标后文件未加载 |
| **根因** | `useGlobalDragDrop` Hook 缺少 `dragover` 事件监听 |

#### 问题原因

HTML5 Drag & Drop API 要求：`drop` 事件要触发，`dragover` 事件**必须**调用 `preventDefault()`，否则浏览器认为该区域不是有效拖放目标。

修复前事件流：
```
用户从系统拖入文件 → dragenter（遮罩显示 ✅）
                    → 松开鼠标 → drop ❌ 不触发（缺少 dragover.preventDefault()）
```

#### 修复逻辑

1. **新增 `handleDragOver` 回调**：调用 `e.preventDefault()` 声明窗口为有效拖放目标

```typescript
const handleDragOver = useCallback(
  (e: DragEvent) => {
    e.preventDefault(); // 必须！使 drop 事件能触发
  },
  []
);
```

2. **注册 `dragover` 事件监听**：在 `useEffect` 中注册

3. **`dragenter` 改用 `dataTransfer.types` 检测**：原代码通过 `e.dataTransfer.files` 检测文件类型，但 OS 文件管理器拖入时 `dataTransfer.files` 在 `dragenter`/`dragover` 阶段为空（浏览器安全限制）。改为检测 `dataTransfer.types` 是否包含 `'Files'`。

```typescript
const isFileDrag = Array.from(e.dataTransfer?.types || []).includes('Files');
if (!isFileDrag) return;
```

修复后事件流：
```
用户从系统拖入文件 → dragenter（遮罩显示 ✅）
                    → dragover（preventDefault ✅）
                    → drop（文件路径获取 → scanFiles → 分析结果 ✅）
```

---

## 修复效果验证

| 检查项 | 状态 |
| :--- | :---: |
| TypeScript `tsc --noEmit` | ✅ **零错误** |
| Vite build | ✅ **成功** |
