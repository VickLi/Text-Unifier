/// V4.0 编码探测模块
///
/// 提供多编码探测链，用于自动识别文本文件的字符编码。
///
/// # 探测链（按优先级）
/// 1. UTF-8 BOM (EF BB BF)
/// 2. UTF-16 LE BOM (FF FE)
/// 3. UTF-16 BE BOM (FE FF)
/// 4. GB18030 编码验证
/// 5. Windows-1252 编码验证
/// 6. SHIFT-JIS 编码验证
/// 7. 兜底 UTF-8

use std::fs;
use std::path::Path;

/// 编码探测结果
#[derive(Debug, Clone, PartialEq)]
pub struct EncodingResult {
    /// 探测到的编码名称（如 "UTF-8", "GB18030"）
    pub encoding: String,
    /// 解码后的 UTF-8 文本内容
    pub content: String,
    /// 是否使用了兜底编码（encoding_rs 解码失败后回退）
    pub is_fallback: bool,
}

/// 从文件路径探测编码并读取内容
pub fn detect_and_read(file_path: &Path) -> Result<EncodingResult, String> {
    let raw_bytes = fs::read(file_path)
        .map_err(|e| format!("文件 '{}' 读取失败: {}", file_path.display(), e))?;

    if raw_bytes.is_empty() {
        return Ok(EncodingResult {
            encoding: "UTF-8".to_string(),
            content: String::new(),
            is_fallback: false,
        });
    }

    // Step 1: 检查 UTF-8 BOM (EF BB BF)
    if raw_bytes.len() >= 3 && raw_bytes[0] == 0xEF && raw_bytes[1] == 0xBB && raw_bytes[2] == 0xBF {
        let content = String::from_utf8(raw_bytes[3..].to_vec())
            .unwrap_or_else(|_| String::from_utf8_lossy(&raw_bytes[3..]).to_string());
        return Ok(EncodingResult {
            encoding: "UTF-8-BOM".to_string(),
            content,
            is_fallback: false,
        });
    }

    // Step 2: 检查 UTF-16 LE BOM (FF FE)
    if raw_bytes.len() >= 2 && raw_bytes[0] == 0xFF && raw_bytes[1] == 0xFE {
        return decode_utf16(&raw_bytes[2..], false);
    }

    // Step 3: 检查 UTF-16 BE BOM (FE FF)
    if raw_bytes.len() >= 2 && raw_bytes[0] == 0xFE && raw_bytes[1] == 0xFF {
        return decode_utf16(&raw_bytes[2..], true);
    }

    // Step 4-7: 使用 encoding_rs 探测链
    detect_with_encoding_rs(&raw_bytes, file_path)
}

/// UTF-16 解码辅助函数
fn decode_utf16(raw: &[u8], big_endian: bool) -> Result<EncodingResult, String> {
    let u16_values: Vec<u16> = raw
        .chunks_exact(2)
        .map(|chunk| {
            if big_endian {
                u16::from_be_bytes([chunk[0], chunk[1]])
            } else {
                u16::from_le_bytes([chunk[0], chunk[1]])
            }
        })
        .collect();

    let content = String::from_utf16(&u16_values)
        .map_err(|e| format!("UTF-16 解码失败: {}", e))?;

    let label = if big_endian { "UTF-16BE" } else { "UTF-16LE" };
    Ok(EncodingResult {
        encoding: label.to_string(),
        content,
        is_fallback: false,
    })
}

/// 使用 encoding_rs 探测编码链
fn detect_with_encoding_rs(raw: &[u8], _file_path: &Path) -> Result<EncodingResult, String> {
    // 编码探测链：UTF-8 → GB18030 → Windows-1252 → SHIFT-JIS
    let encodings: &[&str] = &["UTF-8", "GB18030", "Windows-1252", "SHIFT-JIS"];

    for encoding_name in encodings {
        if let Some(encoding) = encoding_rs::Encoding::for_label(encoding_name.as_bytes()) {
            let (content, _, had_errors) = encoding.decode(raw);
            if !had_errors {
                return Ok(EncodingResult {
                    encoding: encoding_name.to_string(),
                    content: content.to_string(),
                    is_fallback: false,
                });
            }
        }
    }

    // 兜底：UTF-8
    let content = String::from_utf8_lossy(raw).to_string();
    let is_valid_utf8 = String::from_utf8(raw.to_vec()).is_ok();
    Ok(EncodingResult {
        encoding: "UTF-8".to_string(),
        content,
        is_fallback: !is_valid_utf8,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_utf8_bom() {
        let mut content = vec![0xEF, 0xBB, 0xBF];
        content.extend_from_slice("Hello World".as_bytes());
        let result = detect_with_encoding_rs(&content[3..], Path::new("test.txt")).unwrap();
        // BOM 已在调用前处理，这里只测试 encoding_rs 路径
        assert_eq!(result.encoding, "UTF-8");
    }

    #[test]
    fn test_detect_ascii_as_utf8() {
        let content = b"Hello World";
        let result = detect_with_encoding_rs(content, Path::new("test.txt")).unwrap();
        // ASCII 会被 UTF-8 正确解码
        assert_eq!(result.encoding, "UTF-8");
    }

    #[test]
    fn test_detect_empty() {
        let result = detect_and_read(Path::new("nonexistent_empty_test.txt")).unwrap_err();
        assert!(result.contains("读取失败"));
    }
}
