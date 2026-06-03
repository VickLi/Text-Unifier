import { useCallback, useEffect, useState } from 'react'
import { useDemoStore } from './store/demoStore'

function App() {
  const {
    files, isReading, readError,
    mergedText, mergeStatus, mergeError, encodingWarnings,
    toastMessage,
    addFiles, removeFile, clearFiles, runMerge, exportText,
  } = useDemoStore()

  const [dragOver, setDragOver] = useState(false)
  const [dragReject, setDragReject] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [webViewInfo, setWebViewInfo] = useState<string>('检测中...')

  // 检测 WebView2 / WebKit 信息
  useEffect(() => {
    const ua = navigator.userAgent
    if (ua.includes('Edg')) {
      setWebViewInfo('✅ WebView2 (Edge) 运行正常')
    } else if (ua.includes('Chrome')) {
      setWebViewInfo('✅ WebView2 (Chromium) 运行正常')
    } else if (ua.includes('WebKit')) {
      setWebViewInfo('✅ WebKit (macOS/Linux) 运行正常')
    } else {
      setWebViewInfo('⚠️ 未知 WebView: ' + ua.substring(0, 80))
    }
  }, [])

  // 拖拽处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(c => c + 1)

    const hasNonTxt = Array.from(e.dataTransfer.items).some(
      item => item.kind === 'file' && !item.type.includes('text/plain')
    )
    const files = Array.from(e.dataTransfer.items).filter(i => i.kind === 'file')

    if (files.length > 0 && hasNonTxt) {
      setDragReject(true)
      setDragOver(true)
    } else if (files.length > 0) {
      setDragReject(false)
      setDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(c => {
      const next = c - 1
      if (next <= 0) {
        setDragOver(false)
        setDragReject(false)
        return 0
      }
      return next
    })
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    setDragReject(false)
    setDragCounter(0)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const txtFiles = droppedFiles.filter(f => f.name.toLowerCase().endsWith('.txt'))

    if (txtFiles.length === 0) {
      useDemoStore.getState().showToast('仅支持 .txt 文件')
      return
    }

    const paths: string[] = []
    for (const file of txtFiles) {
      // Tauri 中通过 (file as any).path 属性获取
      if ((file as any).path) {
        paths.push((file as any).path)
      }
    }

    if (paths.length > 0) {
      await addFiles(paths)
    }
  }, [addFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // 按钮选择文件
  const handleFileSelect = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({
        multiple: true,
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
      })
      if (selected && Array.isArray(selected)) {
        await addFiles(selected.map(f => (f as any).path || f))
      }
    } catch (err) {
      useDemoStore.getState().showToast('打开文件对话框失败: ' + String(err))
    }
  }, [addFiles])

  return (
    <div
      className="h-screen flex flex-col bg-gray-50"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ====== 拖拽遮罩 ====== */}
      {dragOver && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            dragReject
              ? 'bg-red-500/20 backdrop-blur-sm'
              : 'bg-blue-500/20 backdrop-blur-sm'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-4">{dragReject ? '🚫' : '📄'}</div>
            <p className="text-xl font-semibold text-gray-800">
              {dragReject ? '仅支持 .txt 文件' : '释放到此添加 TXT 文件'}
            </p>
          </div>
        </div>
      )}

      {/* ====== 标题栏 ====== */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 select-none flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-700">
          Text Unifier Demo — WebView2 兼容性测试
        </h1>
        <span className="ml-auto text-xs text-gray-400">V4.0.0-demo</span>
      </header>

      {/* ====== 状态指示器 ====== */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-4 text-xs">
        <span className={`px-2 py-0.5 rounded-full font-medium ${
          webViewInfo.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {webViewInfo}
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">
          文件: {files.length} | 状态: {
            mergeStatus === 'idle' ? '待处理' :
            mergeStatus === 'loading' ? '合并中...' :
            mergeStatus === 'ready' ? '✅ 就绪' :
            '❌ 错误'
          }
        </span>
        {encodingWarnings.length > 0 && (
          <span className="text-yellow-600">⚠️ {encodingWarnings.length} 个编码警告</span>
        )}
      </div>

      {/* ====== 芯片栏 ====== */}
      <div className="flex-shrink-0 h-10 bg-white border-b border-gray-200 flex items-center px-2 gap-1.5 overflow-x-auto">
        {files.length === 0 ? (
          <span className="text-xs text-gray-400 px-2">点击 + 或拖拽 .txt 文件到此处</span>
        ) : (
          files.map((file, i) => (
            <div
              key={file.path}
              className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 text-xs flex-shrink-0"
            >
              <span className="text-blue-600">📄</span>
              <span className="max-w-[120px] truncate text-gray-700" title={file.name}>
                {file.name.length > 15 ? file.name.slice(0, 15) + '...' : file.name}
              </span>
              {i === 0 && <span className="text-blue-500" title="主文件">★</span>}
              <span className="text-gray-400">{file.size_label}</span>
              <button
                className="ml-0.5 text-gray-400 hover:text-red-500"
                onClick={() => removeFile(file.path)}
              >
                ×
              </button>
            </div>
          ))
        )}
        <button
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold flex items-center justify-center ml-1"
          onClick={handleFileSelect}
          disabled={isReading}
        >
          {isReading ? '⏳' : '+'}
        </button>
      </div>

      {/* ====== 主内容区 ====== */}
      <div className="flex-1 flex overflow-hidden">
        {/* 预览区 */}
        <div className="flex-1 p-4 overflow-auto">
          {mergeStatus === 'loading' ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-gray-500">正在合并...</p>
              </div>
            </div>
          ) : mergeError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p className="text-4xl mb-4">❌</p>
                <p>{mergeError}</p>
              </div>
            </div>
          ) : mergedText ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                {mergedText}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <p className="text-6xl mb-4">📄</p>
                <p className="text-lg">拖拽 .txt 文件到此处或点击 + 按钮添加</p>
                <p className="text-sm mt-2">支持 UTF-8 / GB18030 / SHIFT-JIS 编码</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====== 底部工具栏 ====== */}
      <footer className="flex-shrink-0 h-10 border-t border-gray-200 bg-white px-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>总 {mergedText.length} 字</span>
          <span>|</span>
          <span>文件 {files.length} 个</span>
          {readError && <span className="text-red-500">| {readError}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
            onClick={clearFiles}
          >
            清空
          </button>
          {files.length >= 2 && (
            <button
              className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
              onClick={runMerge}
            >
              重新合并
            </button>
          )}
          <button
            className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white"
            onClick={exportText}
          >
            ⏎ 导出
          </button>
        </div>
      </footer>

      {/* ====== Toast ====== */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-60 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-pulse">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default App
