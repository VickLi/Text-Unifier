import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

// ============================================================
// Types
// ============================================================

export interface FileInfo {
  name: string
  path: string
  size: number
  size_label: string
  encoding: string
  preview: string
  total_chars: number
}

export interface MergeResult {
  merged_text: string
  total_chars: number
  file_count: number
  encoding_warnings: string[]
}

export type AppStatus = 'idle' | 'loading' | 'ready' | 'error'

// ============================================================
// Store
// ============================================================

interface DemoStore {
  // Files
  files: FileInfo[]
  isReading: boolean
  readError: string | null

  // Merge
  mergedText: string
  mergeStatus: AppStatus
  mergeError: string | null
  encodingWarnings: string[]

  // UI
  toastMessage: string | null

  // Actions
  addFiles: (paths: string[]) => Promise<void>
  removeFile: (path: string) => void
  clearFiles: () => void
  runMerge: () => Promise<void>
  exportText: () => Promise<void>
  showToast: (msg: string) => void
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  files: [],
  isReading: false,
  readError: null,
  mergedText: '',
  mergeStatus: 'idle',
  mergeError: null,
  encodingWarnings: [],
  toastMessage: null,

  addFiles: async (paths: string[]) => {
    set({ isReading: true, readError: null })

    const existing = get().files
    const newFiles: FileInfo[] = [...existing]

    for (const path of paths) {
      // 去重
      if (existing.some(f => f.path === path)) {
        set({ toastMessage: `文件已存在: ${path.split('\\').pop()?.split('/').pop()}` })
        continue
      }
      // 格式校验
      const ext = path.split('.').pop()?.toLowerCase()
      if (ext !== 'txt') {
        set({ toastMessage: `仅支持 .txt 文件: ${path}` })
        continue
      }

      try {
        const info = await invoke<FileInfo>('read_text_file', { path })
        newFiles.push(info)
      } catch (err) {
        set({ readError: `读取失败: ${String(err)}` })
      }
    }

    set({ files: newFiles, isReading: false })

    // 添加文件后自动合并
    if (newFiles.length >= 2) {
      setTimeout(() => get().runMerge(), 100)
    }
  },

  removeFile: (path: string) => {
    set(state => ({
      files: state.files.filter(f => f.path !== path),
      mergedText: '',
      mergeStatus: 'idle',
    }))
  },

  clearFiles: () => {
    set({
      files: [],
      mergedText: '',
      mergeStatus: 'idle',
      mergeError: null,
      encodingWarnings: [],
    })
  },

  runMerge: async () => {
    const { files } = get()
    if (files.length < 2) {
      if (files.length === 1) {
        set({ mergedText: files[0].preview, mergeStatus: 'ready' })
      }
      return
    }

    set({ mergeStatus: 'loading', mergeError: null })
    try {
      const paths = files.map(f => f.path)
      const result = await invoke<MergeResult>('demo_merge', { paths })
      set({
        mergedText: result.merged_text,
        mergeStatus: 'ready',
        encodingWarnings: result.encoding_warnings,
      })
    } catch (err) {
      set({ mergeStatus: 'error', mergeError: String(err) })
    }
  },

  exportText: async () => {
    const { mergedText } = get()
    if (!mergedText.trim()) {
      set({ toastMessage: '没有可导出的内容' })
      return
    }

    try {
      // Use Tauri save dialog via invoke
      const { save } = await import('@tauri-apps/plugin-dialog')
      const filePath = await save({
        filters: [{ name: 'Text Files', extensions: ['txt'] }],
        defaultPath: 'merged_demo.txt',
      })

      if (filePath) {
        await invoke('export_text', { path: filePath, content: mergedText })
        set({ toastMessage: `导出成功: ${filePath}` })
      }
    } catch (err) {
      set({ toastMessage: `导出失败: ${String(err)}` })
    }
  },

  showToast: (msg: string) => {
    set({ toastMessage: msg })
    setTimeout(() => set({ toastMessage: null }), 3000)
  },
}))
