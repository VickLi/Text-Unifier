#[macro_use]
extern crate napi_derive;

mod document_formatter;
mod duplicate_resolver;
mod file_processor;
mod paragraph_index;
mod text_normalizer;

use document_formatter::{DocumentFormatter, FormatResult};
use duplicate_resolver::{AnalysisReport, FileMeta};
use file_processor::FileProcessor;
use napi::bindgen_prelude::*;
use paragraph_index::InterFileDeduper;
use rayon::prelude::*;
use std::path::Path;
use text_normalizer::TextNormalizer;

/// napi-rs 兼容的错误包装
fn to_napi_err(msg: String) -> napi::Error {
    napi::Error::from_reason(msg)
}

/// V3.0 napi 导出：扫描并分析文件
#[napi]
pub fn scan_files(paths: Vec<String>) -> Result<AnalysisReport> {
    // 并行读取并归一化所有文件，使用显式错误处理避免 napi Error 类型干扰
    #[derive(Clone)]
    struct FileResult {
        metadata: file_processor::FileMetadata,
        file_name: String,
        normalized: Vec<String>,
        error: Option<String>,
    }

    let file_results: Vec<FileResult> = paths
        .par_iter()
        .map(|path| {
            let normalizer = TextNormalizer::new();
            let file_path = Path::new(path);
            let file_name = file_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            let metadata = match FileProcessor::get_file_metadata(file_path) {
                Ok(m) => m,
                Err(e) => {
                    let err_msg = format!("文件 '{}' 元信息读取失败: {}", file_name, e);
                    return FileResult {
                        metadata: file_processor::FileMetadata { file_name: file_name.clone(), file_size: 0, modified: 0 },
                        file_name,
                        normalized: vec![],
                        error: Some(err_msg),
                    };
                },
            };

            let content = match FileProcessor::read_file_content(file_path) {
                Ok(c) => c,
                Err(e) => {
                    let err_msg = format!("文件 '{}' 读取失败: {}", file_name, e);
                    return FileResult {
                        metadata,
                        file_name,
                        normalized: vec![],
                        error: Some(err_msg),
                    };
                },
            };

            let normalized = normalizer.normalize(&content);
            FileResult {
                metadata,
                file_name,
                normalized,
                error: None,
            }
        })
        .collect();

    let mut resolved: Vec<(file_processor::FileMetadata, String, Vec<String>)> = Vec::new();
    for r in file_results {
        if let Some(err) = r.error {
            return Err(to_napi_err(err));
        }
        resolved.push((r.metadata, r.file_name, r.normalized));
    }

    // V1.1 新算法：使用 InterFileDeduper 按文件顺序处理
    let mut engine = InterFileDeduper::new();
    let mut files_metadata: Vec<FileMeta> = Vec::with_capacity(resolved.len());

    for (meta, file_name, normalized_paras) in &resolved {
        files_metadata.push(FileMeta {
            file_name: file_name.clone(),
            file_size: meta.file_size,
            modified: meta.modified,
        });
        engine.process_file(file_name, normalized_paras);
    }

    let (duplicate_groups, preview_paragraphs) = engine.finalize();
    let total_files = paths.len() as u32;

    let report = duplicate_resolver::DuplicateResolver::build_report(
        duplicate_groups,
        preview_paragraphs,
        total_files,
        files_metadata,
    );

    Ok(report)
}

/// V3.0 napi 导出：文档排版（去硬回车）
#[napi]
pub fn format_document(text: String) -> Result<FormatResult> {
    if text.trim().is_empty() {
        return Err(to_napi_err("排版处理失败: 输入文本为空".to_string()));
    }

    if text.len() > 100 * 1024 * 1024 {
        return Err(to_napi_err("排版处理失败: 文本大小超过限制".to_string()));
    }

    let formatter = DocumentFormatter::new();
    let result = formatter.format(&text);

    Ok(result)
}

/// V3.1 napi 导出：编码探测（返回解码后的 UTF-8 文本，不执行归一化）
#[napi]
pub fn detect_encoding(file_path: String) -> Result<String> {
    let path = Path::new(&file_path);
    FileProcessor::read_file_content(path)
        .map_err(|e| to_napi_err(format!("编码探测失败: {}", e)))
}

/// V3.1 napi 导出：预处理文本的归一化 + 去重
/// 跳过文件 IO，直接对传入文本执行 TextNormalizer + InterFileDeduper
#[napi]
pub fn scan_preprocessed_texts(
    texts: Vec<String>,
    file_names: Vec<String>,
    file_sizes: Vec<u32>,
) -> Result<AnalysisReport> {
    if texts.is_empty() {
        return Err(to_napi_err("文本数组不能为空".to_string()));
    }

    let normalizer = TextNormalizer::new();
    let mut engine = InterFileDeduper::new();
    let mut files_metadata: Vec<FileMeta> = Vec::with_capacity(texts.len());

    for i in 0..texts.len() {
        let normalized = normalizer.normalize(&texts[i]);
        let file_name = file_names
            .get(i)
            .cloned()
            .unwrap_or_else(|| format!("file_{}.txt", i + 1));
        let file_size = file_sizes.get(i).copied().unwrap_or(0);

        files_metadata.push(FileMeta {
            file_name: file_name.clone(),
            file_size,
            modified: 0,
        });
        engine.process_file(&file_name, &normalized);
    }

    let (duplicate_groups, preview_paragraphs) = engine.finalize();
    let total_files = texts.len() as u32;

    Ok(duplicate_resolver::DuplicateResolver::build_report(
        duplicate_groups,
        preview_paragraphs,
        total_files,
        files_metadata,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_files_empty_paths() {
        // 空路径数组返回空报告（不是错误）
        let result = scan_files(vec![]);
        assert!(result.is_ok());
        let report = result.unwrap();
        assert_eq!(report.total_files, 0);
        assert!(report.duplicate_groups.is_empty());
        assert!(report.preview_paragraphs.is_empty());
    }

    #[test]
    fn test_scan_preprocessed_texts_basic() {
        let result = scan_preprocessed_texts(
            vec!["Hello World".to_string(), "Hello World".to_string()],
            vec!["a.txt".to_string(), "b.txt".to_string()],
            vec![10, 10],
        );
        assert!(result.is_ok());
        let report = result.unwrap();
        assert_eq!(report.total_files, 2);
        // "Hello World" 出现在两个文件中，应生成一个重复组
        assert_eq!(report.duplicate_groups.len(), 1);
        // preview_paragraphs 应只有 1 段（跨文件去重）
        assert_eq!(report.preview_paragraphs.len(), 1);
    }

    #[test]
    fn test_detect_encoding_invalid_path() {
        let result = detect_encoding("C:\\nonexistent\\file.txt".to_string());
        assert!(result.is_err());
    }
}
