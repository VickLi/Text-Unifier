# V4.0 增量集成 — 阶段 0~1 变更记录

> **日期**: 2026-05-24  
> **执行人**: AI  
> **范围**: Feature Flag 基础设施 + 功能线③文档对比启用

---

## 阶段 0：Feature Flag 基础设施

### 变更目标
为项目添加 6 个 Feature Flag（功能开关），实现对 12 个功能模块的分组控制。所有 Flag 初始为 `false`，应用启动后仅显示标题栏 + 文件输入栏 + 占位提示。

### 修改文件一览

| 文件 | 变更类型 | 行数变化 |
|:---|:---|:---|
| `03-code/src/types/index.ts` | 新增接口 | +16 |
| `03-code/src/store/defaults.ts` | 新增常量 | +11 |
| `03-code/src/store/useStore.ts` | 新增字段 + 初始值 + reset | +7 |
| `03-code/src/App.tsx` | 条件渲染 + 占位块 | +20, -15 |
| `03-code/src/components/ModeTabs.tsx` | 动态过滤 + useEffect | +9, -4 |
| `03-code/src/components/PreviewPanel.tsx` | 快捷键/按钮 Flag 包裹 | +10, -4 |
| `03-code/src/components/CleanPanel.tsx` | 清洗/搜索 Flag 包裹 | +14, -0 |

### 详细变更

#### 1. types/index.ts — FeatureFlags 接口
```typescript
export interface FeatureFlags {
  diffViewer: boolean;   // 功能线③
  cleaning: boolean;     // 功能线②
  searchReplace: boolean; // 功能线②
  undoRedo: boolean;     // 功能线②
  exportFeature: boolean; // 功能线②
  mergeCore: boolean;    // 功能线①
}
```

#### 2. defaults.ts — DEFAULT_FEATURE_FLAGS
```typescript
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  diffViewer: false, cleaning: false, searchReplace: false,
  undoRedo: false, exportFeature: false, mergeCore: false,
};
```

#### 3. useStore.ts — Store 集成
- `AppState` 接口新增 `featureFlags: FeatureFlags`
- 初始状态：`featureFlags: { ...DEFAULT_FEATURE_FLAGS }`（浅拷贝防篡改）
- `resetSession` 恢复：`featureFlags: { ...DEFAULT_FEATURE_FLAGS }`

#### 4. App.tsx — 条件渲染逻辑
- **标题栏**: 导出按钮 → `exportFeature ? <ExportButton/> : 灰色禁用占位`；合并设置/重新开始 → `mergeCore &&`
- **ModeTabs**: 仅当 `mergeCore || diffViewer` 任一启用时渲染
- **主内容区**:
  - `mergeCore && activeMode==='merge'` → 三栏布局（连接点/预览/清洗）
  - `diffViewer && activeMode==='compare'` → DiffViewer 双栏对比
  - `!mergeCore && !diffViewer` → 全屏占位提示"功能模块未启用"
- **MergeSettings 弹窗**: `mergeCore && showMergeSettings &&`

#### 5. ModeTabs.tsx — 动态 Tab 过滤
- 根据 Flag 构建 modes 数组：`mergeCore` 才加合并 Tab，`diffViewer` 才加对比 Tab
- `useEffect` 监听 Flag 变化：Tab 变少时自动切换到第一个可用模式
- 无可用模式时返回 `null`

#### 6. PreviewPanel.tsx — 撤回/重做/导出快捷键控制
- `undoRedo` Flag 控制：Ctrl+Z / Ctrl+Y / Shift+Ctrl+Z 键盘快捷键 + ↶↷ UI 按钮
- `exportFeature` Flag 控制：Ctrl+S 快捷键

#### 7. CleanPanel.tsx — 清洗/搜索替换控制
- `cleaning` Flag 控制：繁简转换 + 全角↔半角 ToggleButton
- `searchReplace` Flag 控制：SearchReplace 搜索替换组件
- 两者都禁用时显示"清洗功能未启用"占位
- 分隔线仅在两者都启用时显示

---

## 阶段 1：功能线③ 文档对比启用

### 变更内容
- `defaults.ts`: `diffViewer: false` → `diffViewer: true`
- 仅 1 行变更

### 用户可见行为
| Flag 值 | 行为 |
|:---|:---|
| `diffViewer = true` | ModeTabs 显示"文档对比"Tab |
| `mergeCore = false` | 不显示合并去重功能 |
| `exportFeature = false` | 导出按钮灰色禁用 |
| `undoRedo = false` | 撤回/重做按钮隐藏 |
| `cleaning = false` | 清洗面板显示"未启用" |
| `searchReplace = false` | 搜索替换不显示 |

### 功能验证点
- [x] 应用启动 → ModeTabs 仅显示"📋 文档对比"Tab
- [x] 通过文件标签栏添加 2 个文件 → DiffViewer 自动加载并执行双栏对比
- [x] 对比结果按段落对齐：相同(绿)、左独(红)、右独(蓝)、交错(紫)、差异(黄)
- [x] 右侧 MiniMap + 底部统计图例正常显示
- [x] 标题栏：导出按钮显示灰色"导出功能已禁用"
- [x] 不显示合并设置按钮、撤回/重做按钮

---

## 统计

| 指标 | 数值 |
|:---|:---|
| 修改文件数 | 7 |
| 新增代码行 | ~77 |
| 删除代码行 | ~23 |
| TypeScript 编译 | ✅ 0 errors |
| Lint 检查 | ✅ 0 errors |

---

## 下一步

按增量集成指令继续执行：
- **阶段 2**: 功能线② — 依次启用 `cleaning` → `searchReplace` → `undoRedo` → `exportFeature`
- **阶段 3**: 功能线① — 启用 `mergeCore`
- **阶段 4**: 收尾 — 移除所有 Feature Flag 条件判断
