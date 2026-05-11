use serde::{Deserialize, Serialize};

/// 来源信息：记录段落来自哪个文件的哪一行
/// V3.0: 添加 #[napi(object)]，start_line 由 usize 改为 u32
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct SourceInfo {
    pub file_name: String,
    pub start_line: u32,
}

/// 重复组：一组相同的段落
/// V3.0: 添加 #[napi(object)]，occurrence_count 由 usize 改为 u32
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct DuplicateGroup {
    pub id: String,
    pub content_hash: String,
    pub snippet: String,
    pub sources: Vec<SourceInfo>,
    pub occurrence_count: u32,
}

/// 预览段落：用于右侧预览区的单个段落
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct PreviewParagraph {
    pub id: String,
    pub text: String,
    pub content_hash: String,
    pub source_files: Vec<String>,
    pub is_original: bool,
}

/// 文件元数据（前端显示用）
/// V3.0: 添加 #[napi(object)]，file_size/modified 由 u64 改为 u32
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct FileMeta {
    pub file_name: String,
    pub file_size: u32,
    pub modified: u32,
}

/// 分析报告：扫描文件后的完整结果
/// V3.0: 添加 #[napi(object)]，total_files 由 usize 改为 u32
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct AnalysisReport {
    pub duplicate_groups: Vec<DuplicateGroup>,
    pub preview_paragraphs: Vec<PreviewParagraph>,
    pub total_files: u32,
    /// 文件元数据列表（修复 BUG-006）
    pub files_metadata: Vec<FileMeta>,
}

/// 导出结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct ExportResult {
    pub saved_path: String,
}

/// 重复解析器：生成初始预览文档与重复组列表
pub struct DuplicateResolver;

impl DuplicateResolver {
    /// 构建分析报告
    pub fn build_report(
        duplicate_groups: Vec<DuplicateGroup>,
        preview_paragraphs: Vec<PreviewParagraph>,
        total_files: u32,
        files_metadata: Vec<FileMeta>,
    ) -> AnalysisReport {
        AnalysisReport {
            duplicate_groups,
            preview_paragraphs,
            total_files,
            files_metadata,
        }
    }
}
