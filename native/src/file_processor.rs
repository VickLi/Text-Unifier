use anyhow::{bail, Context, Result};
use encoding_rs::UTF_8;
use std::path::Path;

/// 最大文件大小限制：100MB（修复 BUG-012）
const MAX_FILE_SIZE: u64 = 100 * 1024 * 1024;

/// 文件处理器：读取文件并处理编码问题
pub struct FileProcessor;

impl FileProcessor {
    /// 读取文件内容，处理 BOM 和编码
    pub fn read_file_content(path: &Path) -> Result<String> {
        let file_len = std::fs::metadata(path)
            .with_context(|| format!("无法访问文件: {}", path.display()))?
            .len();
        if file_len > MAX_FILE_SIZE {
            bail!(
                "文件 '{}' 大小超过 100MB 限制（当前: {:.1}MB）",
                path.display(),
                file_len as f64 / (1024.0 * 1024.0)
            );
        }

        let raw_bytes =
            std::fs::read(path).with_context(|| format!("无法读取文件: {}", path.display()))?;

        let encodings_to_try: [&'static encoding_rs::Encoding; 4] = [
            encoding_rs::UTF_8,
            encoding_rs::GB18030,
            encoding_rs::WINDOWS_1252,
            encoding_rs::SHIFT_JIS,
        ];

        for encoding in &encodings_to_try {
            let (text, _actual_encoding, had_errors) = encoding.decode(&raw_bytes);
            if !had_errors {
                let text = if text.starts_with('\u{FEFF}') {
                    text[1..].to_string()
                } else {
                    text.into_owned()
                };
                return Ok(text);
            }
        }

        let (text, _, _) = UTF_8.decode(&raw_bytes);
        Ok(text.into_owned())
    }

    /// 获取文件的元信息（文件名、修改时间等）
    pub fn get_file_metadata(path: &Path) -> Result<FileMetadata> {
        let metadata = std::fs::metadata(path)
            .with_context(|| format!("无法获取文件元数据: {}", path.display()))?;

        let file_name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as u32)
            .unwrap_or(0);

        Ok(FileMetadata {
            file_name,
            file_size: metadata.len() as u32,
            modified,
        })
    }
}

/// 文件元数据
#[derive(Debug, Clone)]
pub struct FileMetadata {
    #[allow(dead_code)]
    pub file_name: String,
    pub file_size: u32,
    pub modified: u32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_read_utf8_without_bom() {
        let mut tmp = tempfile::NamedTempFile::new().unwrap();
        write!(tmp, "Hello\nWorld").unwrap();
        let content = FileProcessor::read_file_content(tmp.path()).unwrap();
        assert_eq!(content, "Hello\nWorld");
    }

    #[test]
    fn test_read_utf8_with_bom() {
        let mut tmp = tempfile::NamedTempFile::new().unwrap();
        tmp.write_all(b"\xEF\xBB\xBFHello\nWorld").unwrap();
        let content = FileProcessor::read_file_content(tmp.path()).unwrap();
        assert_eq!(content, "Hello\nWorld");
    }
}
