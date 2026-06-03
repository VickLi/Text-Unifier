/// V4.0 链式重叠合并引擎
/// 在全文任意位置查找 needle 的最长前缀匹配，原地插入剩余内容。

#[allow(unused_imports)]
use napi::bindgen_prelude::*;

#[napi(object)]
#[derive(Clone)]
pub struct MergeResult {
    pub merged_text: String,
    pub connection_points: Vec<ConnectionPoint>,
    pub total_chars: u32,
    pub files_metadata: Vec<FileMeta>,
    pub skipped_files: Vec<String>,
    pub encoding_warnings: Vec<String>,
    /// 每个文件的归一化后完整内容（用于前端动态重建 mergedText）
    pub file_contents: Vec<String>,
}

#[napi(object)]
#[derive(Clone)]
pub struct ConnectionPoint {
    pub id: String,
    pub file_a: String,
    pub file_b: String,
    pub overlap_length: u32,
    pub overlap_snippet: String,
    pub is_auto_merged: bool,
    pub position: u32,
}

#[napi(object)]
#[derive(Clone)]
pub struct FileMeta {
    pub file_name: String,
    pub file_size: u32,
    pub encoding: String,
}

pub struct FileData {
    pub file_name: String,
    pub content: String,
    pub file_size: u32,
    pub encoding: String,
}

pub fn chain_merge(file_data_list: Vec<FileData>, threshold: u32) -> MergeResult {
    let threshold = if threshold < 10 { 10 } else { threshold };
    let mut connection_points: Vec<ConnectionPoint> = Vec::new();
    let mut skipped_files: Vec<String> = Vec::new();
    let mut encoding_warnings: Vec<String> = Vec::new();

    let files_metadata: Vec<FileMeta> = file_data_list.iter().map(|fd| FileMeta {
        file_name: fd.file_name.clone(), file_size: fd.file_size, encoding: fd.encoding.clone(),
    }).collect();

    if file_data_list.is_empty() {
        return MergeResult { merged_text: String::new(), connection_points: vec![], total_chars: 0,
            files_metadata, skipped_files: vec![], encoding_warnings: vec![], file_contents: vec![] }; 
    }

    for fd in &file_data_list {
        if fd.encoding == "UTF-8" && fd.content.contains('\u{FFFD}') {
            encoding_warnings.push(format!("文件 '{}' 包含无法解码的字符，已用 � 替换", fd.file_name));
        }
    }

    let mut merged_text = file_data_list[0].content.clone();

    for (i, file_data) in file_data_list.iter().enumerate().skip(1) {
        let prev_name = &file_data_list[i - 1].file_name;

        if merged_text.contains(&file_data.content) {
            skipped_files.push(file_data.file_name.clone());
            continue;
        }

        // 在 merged_text 中查找 file_data.content 的最长前缀匹配
        let (pos, overlap) = find_overlap_anywhere(&merged_text, &file_data.content);
        let cp_id = format!("cp_{}", connection_points.len());

        if overlap >= threshold as usize && overlap > 0 {
            // 自动合并：在匹配位置插入 needle 的剩余内容
            let byte_overlap = char_to_byte(&file_data.content, overlap);
            let insert_byte = char_to_byte(&merged_text, pos + overlap);
            let suffix = merged_text[insert_byte..].to_string();
            merged_text.truncate(insert_byte);
            merged_text.push_str(&file_data.content[byte_overlap..]);
            merged_text.push_str(&suffix);

            // 连接点的 position 为匹配插入点的字符偏移
            let snippet = if overlap > 50 {
                let byte_50 = char_to_byte(&file_data.content, 50);
                format!("{}...", &file_data.content[..byte_50])
            } else {
                let byte_end = char_to_byte(&file_data.content, overlap);
                file_data.content[..byte_end].to_string()
            };

            connection_points.push(ConnectionPoint {
                id: cp_id, file_a: prev_name.clone(), file_b: file_data.file_name.clone(),
                overlap_length: overlap as u32, overlap_snippet: snippet,
                is_auto_merged: true, position: (pos + overlap) as u32,
            });
        } else {
            // 待确认 / 无重叠：追加到末尾
            if !merged_text.is_empty() && !merged_text.ends_with('\n') { merged_text.push('\n'); }
            merged_text.push_str(&file_data.content);

            let snippet = if overlap > 0 && overlap <= 50 {
                let byte_end = char_to_byte(&file_data.content, overlap);
                file_data.content[..byte_end].to_string()
            } else if overlap > 50 {
                let byte_50 = char_to_byte(&file_data.content, 50);
                format!("{}...", &file_data.content[..byte_50])
            } else { String::new() };

            connection_points.push(ConnectionPoint {
                id: cp_id, file_a: prev_name.clone(), file_b: file_data.file_name.clone(),
                overlap_length: overlap as u32, overlap_snippet: snippet,
                is_auto_merged: false, position: merged_text.chars().count() as u32 - file_data.content.chars().count() as u32,
            });
        }
    }

    // 收集非跳过文件的归一化内容（用于前端动态重建 mergedText）
    let file_contents: Vec<String> = file_data_list.into_iter()
        .filter(|fd| !skipped_files.contains(&fd.file_name))
        .map(|fd| fd.content)
        .collect();
    MergeResult { total_chars: merged_text.chars().count() as u32, merged_text, connection_points,
        files_metadata, skipped_files, encoding_warnings, file_contents }
}

/// 在 haystack 全文查找 needle 的最长前缀匹配
/// 返回 (haystack 中的位置(字符数), 匹配长度(字符数))
fn find_overlap_anywhere(haystack: &str, needle: &str) -> (usize, usize) {
    if haystack.is_empty() || needle.is_empty() { return (0, 0); }
    let n: Vec<char> = needle.chars().collect();
    let max = n.len().min(haystack.chars().count());
    for len in (1..=max).rev() {
        let prefix: String = n[..len].iter().collect();
        if let Some(byte_pos) = haystack.find(&prefix) {
            let char_pos = haystack[..byte_pos].chars().count();
            return (char_pos, len);
        }
    }
    (0, 0)
}

/// 将字符索引转换为字节偏移
fn char_to_byte(s: &str, char_idx: usize) -> usize {
    s.char_indices().nth(char_idx).map(|(i, _)| i).unwrap_or(s.len())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fd(n: &str, c: &str) -> FileData { FileData{file_name:n.into(),content:c.into(),file_size:c.len() as u32,encoding:"UTF-8".into()} }
    #[test] fn t_empty() { assert!(chain_merge(vec![],50).merged_text.is_empty()); }
    #[test] fn t_single() { assert_eq!(chain_merge(vec![fd("a","Hi")],50).merged_text,"Hi"); }
    #[test] fn t_auto() { let r=chain_merge(vec![fd("a","ABCDEFGHIJ"),fd("b","ABCDEFGHIJKLM")],10); assert!(r.connection_points[0].is_auto_merged); }
    #[test] fn t_pending() { let r=chain_merge(vec![fd("a","ABCDE"),fd("b","FGHIJ")],10); assert!(!r.connection_points[0].is_auto_merged); }
    #[test] fn t_contained() { assert_eq!(chain_merge(vec![fd("a","ABCDE"),fd("b","BC")],3).skipped_files.len(),1); }
    #[test] fn t_overlap_anywhere() {
        let (p1, l1) = find_overlap_anywhere("ABCDEFG","DEFGHIJ");
        assert_eq!(p1, 3); assert_eq!(l1, 4);
        let (p2, l2) = find_overlap_anywhere("ABC","XYZ");
        assert_eq!(p2, 0); assert_eq!(l2, 0);
        let (p3, l3) = find_overlap_anywhere("ABC\n王婷是校舞蹈队的领舞，\n我们高中","王婷是校舞蹈队的领舞，每天");
        assert_eq!(p3, 4); // "王婷" starts at char 4 (A B C \n 王)
        assert_eq!(l3, 11); // "王婷是校舞蹈队的领舞，" = 11 chars
    }
}
