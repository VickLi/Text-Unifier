# AI 程序员执行命令：Text Unifier V4.0 增量集成

> **传达方式**: 将此文档全文粘贴给 AI 程序员，逐步骤执行
> **基线代码**: V4.0 当前源码（`03-code/` 或 `src/`）
> **禁止行为**: 跳过验证步骤、一次改多个 Flag、修改无关文件
> **重要**: 模块 E(内容清洗)、M(搜索替换)、H(撤回栈) 已从本软件移除，移至独立项目。预览区为只读。

---

## 一、你的角色和任务

你是 Text Unifier V4.0 项目的 AI 程序员。当前 V4.0 代码已经过 7 轮修订，所有**保留模块**的代码已存在。你的任务不是从零写代码，而是：

1. 在 Zustand Store 中新增 `featureFlags` 字段（3 个 boolean，全部初始 `false`）
2. 按下面规定的**严格阶段顺序**，逐个启用 Flag，验证对应功能
3. 每个步骤通过后立即 Git commit
4. 最终移除所有 Flag，交付完整版本

**核心原则**：每次只改 1 个 Flag + 相关组件的条件渲染包裹。一步一验证，一步一提交。

---

## 二、阶段 0：添加 Feature Flag 基础设施

### 步骤 0.1 — 添加 featureFlags 字段

**修改文件**: `src/store/useStore.ts`（或你项目中 Zustand Store 的实际文件路径）

**操作**：在 `AppState` 接口和 `create()` 初始值中添加：

```typescript
// === 功能开关（增量集成用，全部稳定后移除） ===
featureFlags: {
  diffViewer: false,      // 阶段 1a
  mergeCore: false,       // 阶段 1b
  exportFeature: false,   // 阶段 2
},
```

**注意**：模块 E(内容清洗)、M(搜索替换)、H(撤回栈) 已从本软件移除，不设 Flag。预览区为只读。

**验证**: TypeScript 编译零错误。`npm run build` 或 `tsc --noEmit` 通过。

**通过后**: `git add -A && git commit -m "step 0.1: add featureFlags to store"`

---

### 步骤 0.2 — 所有功能组件包裹条件渲染

**操作**：对以下每个组件，在**最外层渲染处**包裹 `featureFlags.xxx &&` 条件。未启用时显示灰色占位块（不是空白）。

**占位块模板**（复制使用）：
```tsx
{!featureFlags.xxx && (
  <div className="bg-gray-100 rounded border border-dashed border-gray-300 
                  flex items-center justify-center text-gray-400 text-sm"
       style={{ /* 设为对应区域的实际宽高 */ }}>
    功能名称（未启用）
  </div>
)}
```

**需要包裹的组件清单**（对照下表逐一处理）：

| Flag | 包裹的组件/区域 | 占位块文字 |
|:---|:---|:---|
| `diffViewer` | ModeTabs 中的「📋 文档对比」Tab + `<DiffViewer />` + `<DiffStats />` | 「文档对比（未启用）」 |
| `mergeCore` | ModeTabs 中的「🔗 合并去重」Tab + `<PreviewPanel />` + `<ConnectionPointList />` + `<ConnectionMarker />` + `<Minimap />` | 「合并去重（未启用）」 |
| `exportFeature` | BottomToolbar 中的导出按钮 | 隐藏按钮即可（不显示占位） |

**注意**：
- 模块 A（FileChipBar/DragOverlay）和模块 B 的编码探测部分**不要加 Flag**——它们属于阶段 0 共享基础设施，始终可用。
- 模块 E/M/H 已移除。如果代码中仍存在 `CleanPanel`, `SearchReplace`, `UndoRedoButtons` 等组件，应**直接删除或注释**，不需要 Flag 包裹。

**验证**: 启动应用（`npm run electron:dev`），界面应显示：
- 标题栏
- 空芯片栏（可拖拽文件）
- 灰色占位块（非空白区域）
- 无清洗面板、无搜索框、无撤回/重做按钮

**通过后**: `git add -A && git commit -m "step 0.2: wrap all feature components with featureFlags"`

---

### 步骤 0.3 — 验证文件输入（模块 A）

**操作**：无需修改代码。拖拽 2 个 .txt 文件到窗口。

**验证清单**（全部必须通过）：
- [ ] 拖入 .txt → 蓝色遮罩显示「释放到此添加 TXT 文件」
- [ ] 松开后芯片栏显示 2 个芯片
- [ ] 第 1 个芯片显示 ★ 蓝色星标徽章
- [ ] 芯片显示文件名（超过 20 字截断）+ 大小标签
- [ ] 悬停文件名 300ms → Tooltip 显示完整文件名
- [ ] 点击芯片 × → 文件删除
- [ ] 拖拽芯片横向排序 → 顺序变化
- [ ] 拖入非 .txt 文件 → 红色遮罩 + Toast「仅支持 .txt 文件」
- [ ] 拖入重复文件 → Toast「文件已存在」

**通过后**: `git add -A && git commit -m "step 0.3: verify module A (file input) works"`  
如失败：排查文件 `DragOverlay.tsx`, `FileChipBar.tsx` 及相关 Store Actions。

---

### 步骤 0.4 — 验证编码探测 + 归一化（模块 B 基础部分）

**操作**：拖入一个 GBK 编码的 .txt 文件，再拖入一个 UTF-8 文件。打开 DevTools Console。

**验证清单**：
- [ ] GBK 文件正确解码为中文，无乱码
- [ ] 空文件（0 字节 .txt）不报错
- [ ] 含 `\r\n` 换行的文件 → 统一为 `\n`
- [ ] 含连续空格的文件 → 压缩为单个空格
- [ ] 含 BOM 的文件 → BOM 被去除

**通过后**: `git add -A && git commit -m "step 0.4: verify encoding detection + normalization"`  
如失败：排查 `native/src/` 下的 Rust 代码或 `ipc.ts` 中的调用。

---

### 步骤 0.5 — 阶段 0 收尾

**操作**：确认步骤 0.1~0.4 全部通过，Git 状态干净。

```bash
git tag v4.0-phase0-stable
```

**里程碑**：共享基础设施就绪。此后所有步骤如果出 Bug，无需回退到比此更早的状态。

---

## 三、阶段 1a：文档对比（模块 I）

> **铁律**：此阶段 `mergeCore`、`exportFeature` **全部必须保持 `false`**。只改 `diffViewer`。

### 步骤 1a.1 — 启用 diffViewer Flag

**操作**：在 `useStore.ts` 中将 `featureFlags.diffViewer` 改为 `true`。**不改其他 Flag。**

**验证**: 启动应用，应看到：
- [ ] Tab 栏出现「📋 文档对比」按钮
- [ ] 「🔗 合并去重」Tab **不可见**
- [ ] 清洗面板、搜索框、撤回/导出按钮**全部不可见**

**通过后**: `git commit -m "step 1a.1: enable diffViewer flag"`

---

### 步骤 1a.2 — 验证对比模式基础交互

**操作**：拖入 1 个文件 → 点击「📋 文档对比」Tab。

**验证**：
- [ ] 显示「请添加第二个文件以进行对比」

拖入 3 个文件 → 点击「📋 文档对比」Tab。

**验证**：
- [ ] 弹出 Modal「文档对比仅支持 2 个文件，请先移除多余文件」

**通过后**: `git commit -m "step 1a.2: verify diff mode file limit checks"`

---

### 步骤 1a.3 — 验证双栏对比渲染

**操作**：准备 2 个有差异的 .txt 文件（建议一个含"第一章 踏上旅途"和"作者：张三"，另一个含"第一章 踏上旅途"和"她温柔地说"和"新版新增章节"）。拖入后切换到对比模式。

**验证**：
- [ ] 相同段落显示绿色背景
- [ ] 仅左文件有的段落显示红色背景 + 红色左边框
- [ ] 仅右文件有的段落显示蓝色背景 + 蓝色左边框
- [ ] 相似但有差异的段落显示灰色背景 + 差异词 `<mark>` 红底标出

**通过后**: `git commit -m "step 1a.3: verify diff four-color rendering"`

---

### 步骤 1a.4 — 验证同步滚动

**操作**：在对比视图中滚动左栏。

**验证**：
- [ ] 右栏同步滚动到相同比例位置
- [ ] 反向（滚动右栏）也同步

**通过后**: `git commit -m "step 1a.4: verify sync scroll"`

---

### 步骤 1a.5 — 验证统计栏

**操作**：查看对比视图底部。

**验证**：
- [ ] 显示格式：「共有 N 段 | 左独有 M 段 | 右独有 K 段 | 差异 D 段」
- [ ] 数字与实际情况一致

**通过后**: `git commit -m "step 1a.5: verify diff stats bar"`

---

### 步骤 1a.6 — 验证编码兼容性

**操作**：拖入 2 个 GBK 编码的 .txt 文件，切换到对比模式。

**验证**：
- [ ] 两个文件均正确解码显示中文
- [ ] 对比结果正确（无乱码导致的对齐失败）

**通过后**: `git commit -m "step 1a.6: verify diff with GBK files"`

---

### 步骤 1a.7 — 确认阶段 1b/2 功能不可见

**操作**：仔细检查界面每个区域。

**验证**：
- [ ] 无「🔗 合并去重」Tab（仅有灰色占位块）
- [ ] 无连接点列表
- [ ] 无导出按钮

**通过后**: 
```bash
git commit -m "step 1a.7: confirm phase 1b/2 features hidden"
git tag v4.0-phase1a-stable
```

**里程碑**：文档对比功能稳定。**此后方可启用阶段 1b。**

---

## 四、阶段 1b：合并去重核心（模块 B 合并算法 + D + C + L）

> **铁律**：`exportFeature` **必须保持 `false`**。只改 `mergeCore`。

### 步骤 1b.1 — 启用 mergeCore Flag

**操作**：`featureFlags.mergeCore = true`。**不改其他 Flag。**

**验证**：
- [ ] Tab 栏出现「🔗 合并去重」按钮
- [ ] 「📋 文档对比」Tab 也在（1a 已启用）
- [ ] 阶段 2 功能**全部不可见**

**通过后**: `git commit -m "step 1b.1: enable mergeCore flag"`

---

### 步骤 1b.2 — 验证合并基础（≥阈值自动合并）

**操作**：创建两个测试文件：
- `A.txt` 内容：`ABCDEF`
- `B.txt` 内容：`FGHI`（与 A 末尾 `F` 重叠 1 字）

拖入后切换到合并模式。

**验证**：
- [ ] 预览区显示连续文本 `ABCDEFGHI`（非段落列表）
- [ ] A 末尾的 `F` 和 B 开头的 `F` 合并为 1 个
- [ ] 连接标记显示为灰色虚线 `┈┈ 连接 (A ↔ B, 1字重叠) ┈┈`

**如果重叠 < 阈值（默认 50）**，连接标记应为蓝色高亮「待确认」而非灰色。对此步骤，请设置 A 结尾 50 字 = B 开头 50 字来测试自动合并场景。

**通过后**: `git commit -m "step 1b.2: verify auto-merge (overlap >= threshold)"`

---

### 步骤 1b.3 — 验证完全包含跳过

**操作**：
- `A.txt`：`ABCDEFGHI`
- `B.txt`：`DEF`

**验证**：
- [ ] B 被完全跳过，预览区仅显示 A 的内容
- [ ] 连接点列表不包含此项（或标记为"已跳过"）

**通过后**: `git commit -m "step 1b.3: verify fully-contained file skip"`

---

### 步骤 1b.4 — 验证无重叠拼接 + 单文件

**操作**：
- `A.txt`：`ABC`，`B.txt`：`XYZ` → 应为 `ABCXYZ`
- 仅拖入 1 个文件 → 应直接输出原文

**验证**：
- [ ] 无重叠时直接拼接，无删除
- [ ] 单文件时无连接点列表，预览区显示原文

**通过后**: `git commit -m "step 1b.4: verify no-overlap concat and single file"`

---

### 步骤 1b.5 — 验证多文件链式合并

**操作**：
- `A.txt`：`ABC`
- `B.txt`：`BCD`
- `C.txt`：`CDE`

**验证**：
- [ ] 合并结果为 `ABCDE`（两次边界重叠各删 2 字）
- [ ] 连接点列表显示 2 个连接点

**通过后**: `git commit -m "step 1b.5: verify multi-file chain merge"`

---

### 步骤 1b.6 — 验证短重叠（<阈值）待确认

**操作**：设置 A 末尾 5 字 = B 开头 5 字（阈值默认 50）。

**验证**：
- [ ] 预览区显示原文双重叠（A 末尾 5 字 + B 开头 5 字都出现）
- [ ] 连接点显示蓝色高亮底色 + 「待确认(5字重叠)」标签
- [ ] 开关默认**关闭**状态

**通过后**: `git commit -m "step 1b.6: verify short-overlap pending confirmation"`

---

### 步骤 1b.7 — 验证连接点切换 + Tooltip

**操作**：点击步骤 1b.6 中待确认连接点的开关。

**验证**：
- [ ] 开关变为开启
- [ ] 预览区从双份原文 → 合并态（重叠删除）
- [ ] 再次点击开关 → 恢复双份原文
- [ ] 悬停连接点 snippet 300ms → Tooltip 显示完整重叠文本 + 前后各 50 字上下文

**通过后**: `git commit -m "step 1b.7: verify connection point toggle + tooltip"`

---

### 步骤 1b.8 — 验证连接标记交互

**操作**：在预览区找到 `┈┈ 连接 ┈┈` 标记。

**验证**：
- [ ] 自动合并的连接标记：灰色虚线 + 「已自动合并」+ 「切断」按钮
- [ ] 待确认的连接标记：蓝色虚线 + 「待确认」+ 「连接」按钮
- [ ] 点击「切断」→ 连接断开，重叠恢复
- [ ] 点击「连接」→ 恢复合并
- [ ] 连接标记不可被编辑或删除

**通过后**: `git commit -m "step 1b.8: verify connection marker cut/connect"`

---

### 步骤 1b.9 — 验证 Minimap

**操作**：拖入 2 个较大文件（>500 字），查看右侧 Minimap。

**验证**：
- [ ] Minimap 宽 30px，右侧 sticky
- [ ] 色条均匀铺满全文高度（2px 色条 + 1px 间距，N ≈ 容器高度/3）
- [ ] 连接点处色条 = 黄色（自动合并）/ 蓝色（待确认），其余灰色
- [ ] 点击 Minimap 某位置 → 预览区滚动到对应比例位置
- [ ] 窗口宽度 < 1024px → Minimap 隐藏

**通过后**: `git commit -m "step 1b.9: verify minimap"`

---

### 步骤 1b.10 — 验证预览区只读 + 溯源

**操作**：在预览区尝试点击或双击文本。

**验证**：
- [ ] 文本**不可编辑**，光标不出现
- [ ] 悬停文本 300ms → Tooltip「来源：xxx.txt」
- [ ] 连接点处悬停 → Tooltip「重叠区：A ↔ B (N字重叠)」

**通过后**: `git commit -m "step 1b.10: verify preview read-only + source tooltip"`

---

### 步骤 1b.11 — 验证底部状态栏

**操作**：有 2 个连接点（1 自动 + 1 待确认）。

**验证**：
- [ ] 显示「总 N 字 | 连接点 M (自动A/待确认B) | 预估 X KB」

**通过后**: `git commit -m "step 1b.11: verify bottom status bar"`

---

### 步骤 1b.12 — 验证合并阈值设置（模块 L）

**操作**：点击连接点面板顶部齿轮图标 ⚙ → 修改阈值为 30。

**验证**：
- [ ] 原来 < 50 的待确认重叠 → 变为灰色「已自动合并」
- [ ] 重启应用 → 阈值仍为 30（持久化验证）
- [ ] 输入 5 或 600 → Toast「阈值范围 10~500」

**通过后**: `git commit -m "step 1b.12: verify merge threshold config + persistence"`

---

### 步骤 1b.13 — 确认阶段 2 功能不可见

**操作**：仔细检查界面。

**验证**：
- [ ] 无导出按钮

**通过后**:
```bash
git commit -m "step 1b.13: confirm phase 2 features hidden"
git tag v4.0-phase1b-stable
```

**里程碑**：合并去重核心功能稳定。**此后方可启用阶段 2。**

---

## 五、阶段 2：导出（模块 J）

> **前置条件**：阶段 1b 已完成（tag `v4.0-phase1b-stable`）。

### 步骤 2.1 — 启用 exportFeature Flag

**操作**：`featureFlags.exportFeature = true`。

**验证**：
- [ ] 底部出现「⏎ 导出」按钮
- [ ] 无撤回/重做按钮、无清洗面板、无搜索框（E/M/H 已移除）

**通过后**: `git commit -m "step 2.1: enable exportFeature flag"`

---

### 步骤 2.2 — 验证导出内容正确

**操作**：点击「⏎ 导出」或按 Ctrl+S → 选择保存路径 → 打开导出的文件。

**验证**：
- [ ] 默认文件名 = `{第一个文件名}_merged.txt`
- [ ] 编码为 UTF-8
- [ ] 内容与预览区一致（连接标记不导出）
- [ ] 换行为 `\r\n`

**通过后**: `git commit -m "step 2.2: verify export content"`

---

### 步骤 2.3 — 验证空导出保护

**操作**：清空所有文件 → 点击导出。

**验证**：
- [ ] Toast「没有可导出的内容」
- [ ] 不弹出保存对话框

**通过后**:
```bash
git commit -m "step 2.3: verify empty export protection"
git tag v4.0-phase2-stable
```

**里程碑**：全部保留模块功能验证通过（A, B, C, D, I, J, K, L）。

---

## 六、阶段 4：收尾清理

### 步骤 4.1 — 移除所有 Feature Flag 条件判断

**操作**：逐一检查每个组件的条件渲染 `featureFlags.xxx &&`，移除条件包裹，恢复直接渲染。同时删除灰色占位块。

**注意**：保留组件内部逻辑不变。仅移除 `featureFlags.xxx ? <Component /> : <Placeholder />` 改为直接 `<Component />`。

**验证**: TypeScript 编译零错误。启动应用，所有功能直接可见。

**通过后**: `git commit -m "step 4.1: remove all feature flag conditionals"`

---

### 步骤 4.2 — 删除 featureFlags 字段

**操作**：从 `useStore.ts` 中删除 `featureFlags` 字段和初始值。

**验证**: TypeScript 编译零错误。无任何地方引用 `featureFlags`。

**通过后**: `git commit -m "step 4.2: remove featureFlags from store"`

---

### 步骤 4.3 — 全量回归测试

**操作**：跑通阶段 0~2 所有验证项（跳过 Flag 开关验证，因为 Flag 已移除）。

**验证**: 全部 AC 通过。

**通过后**: `git commit -m "step 4.3: full regression test passed"`

---

### 步骤 4.4 — 最终打包

**操作**：
```bash
npm run electron:build
```

**验证**：安装包可正常安装运行，所有功能正常。

**通过后**:
```bash
git tag v4.0-full-stable
```

---

## 七、故障排查速查表

| 症状 | 排查范围 | 优先检查文件 |
|:---|:---|:---|
| 拖拽无效 | 步骤 0.3 | `DragOverlay.tsx`, `FileChipBar.tsx`, Store 的 `addFiles` |
| 编码乱码 | 步骤 0.4 | `native/src/` 下的 Rust 代码, `ipc.ts` |
| 对比结果全灰 | 步骤 1a.3 | `diffUtils.ts`, LCS 算法实现 |
| 同步滚动不同步 | 步骤 1a.4 | `DiffViewer.tsx`, scroll 事件监听 |
| 合并后丢字/多字 | 步骤 1b.2~1b.5 | `native/src/chain_merger.rs`, 后缀-前缀匹配算法 |
| 连接点不显示 | 步骤 1b.6 | `ConnectionPointList.tsx`, Store 的 `connectionPoints` |
| Minimap 色条覆盖不全 | 步骤 1b.9 | `Minimap.tsx`, N ≈ 容器高度/3 计算 |
| 导出内容带连接标记 | 步骤 2.2 | `ExportButton.tsx`, 连接标记过滤逻辑 |

---

## 八、V4.0 功能边界说明

> 以下功能**已从本软件移除**，移至独立项目「Text Unifier 内容工具」。如果代码中仍存在相关组件，应直接删除（不需要 Flag 包裹）：

| 模块 | 原功能 | 处理方式 |
|:---|:---|:---|
| E | 繁简转换（ToggleButton） | 删除 `CleanPanel.tsx`, `ToggleButton.tsx` |
| E | 全角半角转换 | 同上 |
| M | 搜索替换（SearchReplace） | 删除 `SearchReplace.tsx` |
| M | Ctrl+H 唤起 | 删除相关快捷键绑定 |
| H | 撤回栈（UndoRedoButtons） | 删除 `UndoRedoButtons`，从 BottomToolbar 移除 |
| H | Ctrl+Z/Y | 删除相关快捷键绑定 |
| — | 预览区可编辑 | 预览区改为只读（`readOnly`），删除 `contentEditable` 逻辑 |

---

## 九、每日进度报告模板

完成每天的工作后，用以下格式报告：

```
## V4.0 增量集成 — 进度报告 [日期]

### 已完成步骤
- [x] step 1a.1: enable diffViewer flag
- [x] step 1a.2: verify diff mode file limit checks
- [ ] step 1a.3: verify diff four-color rendering ← 当前进行中

### 遇到的问题
- 步骤 1a.3: DiffViewer 左栏段落高度不一致导致对齐错位
  - 尝试修复: 在 DiffParagraph 添加 min-height
  - 状态: 已解决 / 仍在排查

### 当前 Flag 状态
- diffViewer: true
- mergeCore: false
- exportFeature: false

### Git 状态
- 最后 tag: v4.0-phase0-stable
- 未提交更改: 2 files
```

---

## 十、Git Tag 路线图

```
v4.0-phase0-stable   ← 阶段 0 完成（共享基础设施：A 文件输入 + B 归一化）
v4.0-phase1a-stable  ← 阶段 1a 完成（I 文档对比）
v4.0-phase1b-stable  ← 阶段 1b 完成（B合并 + D预览 + C连接点 + L阈值）
v4.0-phase2-stable   ← 阶段 2 完成（J 导出）
v4.0-full-stable     ← 最终交付
```

---

*此文档为 AI 程序员逐步骤执行清单。严格按顺序执行，每步通过后打勾并 commit。遇到无法解决的问题时，回退到上一个稳定 tag 并报告。*
