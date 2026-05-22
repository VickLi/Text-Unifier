#[macro_use]
extern crate napi_derive;

mod chain_merger;
mod encoding_detector;
mod text_normalizer;

use chain_merger::{chain_merge, FileData, MergeResult};
use encoding_detector::detect_and_read;
use napi::bindgen_prelude::*;
use std::path::Path;
use text_normalizer::TextNormalizer;

fn to_napi_err(msg: String) -> napi::Error {
    napi::Error::from_reason(msg)
}

/// V4.0 napi 导出：链式重叠合并
///
/// 读取文件 → 编码探测 → 文本归一化 → 最长后缀-前缀匹配 → 返回 MergeResult
#[napi]
pub fn merge_files(paths: Vec<String>, threshold: u32) -> Result<MergeResult> {
    let normalizer = TextNormalizer::new();
    let mut file_data_list: Vec<FileData> = Vec::with_capacity(paths.len());

    for path_str in &paths {
        let file_path = Path::new(path_str);
        let file_name = file_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let enc_result = detect_and_read(file_path)
            .map_err(|e| to_napi_err(format!("文件 '{}' 读取失败: {}", file_name, e)))?;

        let content_len = enc_result.content.len();
        let normalized_paras = normalizer.normalize(&enc_result.content);

        // V4.0: 归一化后段落重新拼接为连续文本（chain_merger 操作字符串）
        let content = if normalized_paras.is_empty() && !enc_result.content.is_empty() {
            enc_result.content
        } else {
            normalized_paras.join("\n")
        };

        file_data_list.push(FileData {
            file_name,
            content,
            file_size: content_len as u32,
            encoding: enc_result.encoding,
        });
    }

    Ok(chain_merge(file_data_list, threshold))
}

/// V4.0 napi 导出：编码探测
///
/// 读取文件并返回探测到的编码名称，不执行归一化
#[napi]
pub fn detect_encoding(file_path: String) -> Result<String> {
    let path = Path::new(&file_path);
    let result = detect_and_read(path)
        .map_err(|e| to_napi_err(format!("编码探测失败: {}", e)))?;
    Ok(result.encoding)
}

/// V4.0 napi 导出：读取文件文本内容
///
/// 读取文件 → 编码探测 → 返回解码后的 UTF-8 文本内容（不执行归一化）
#[napi]
pub fn read_file_text(file_path: String) -> Result<String> {
    let path = Path::new(&file_path);
    let result = detect_and_read(path)
        .map_err(|e| to_napi_err(format!("文件读取失败: {}", e)))?;
    Ok(result.content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merge_files_empty() {
        let result = merge_files(vec![], 50).unwrap();
        assert_eq!(result.total_chars, 0);
    }

    #[test]
    fn test_merge_files_nonexistent() {
        let result = merge_files(vec!["nonexistent_test_file.txt".to_string()], 50);
        assert!(result.is_err());
    }

    #[test]
    fn test_detect_encoding_invalid() {
        let result = detect_encoding("C:\\nonexistent\\file.txt".to_string());
        assert!(result.is_err());
    }
}
