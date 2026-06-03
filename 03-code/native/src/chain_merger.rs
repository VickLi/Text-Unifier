/// V4.0 链式重叠合并引擎
/// 实现最长后缀-前缀匹配算法，按文件顺序合并为连续文本。

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
            files_metadata, skipped_files: vec![], encoding_warnings: vec![] };
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

        let overlap = find_overlap(&merged_text, &file_data.content);
        let position = merged_text.len() as u32;
        let cp_id = format!("cp_{}", connection_points.len());

        if overlap >= threshold as usize && overlap > 0 {
            merged_text.push_str(&file_data.content[overlap..]);

            let snippet = if overlap > 50 { format!("{}...", &file_data.content[..50]) }
                          else { file_data.content[..overlap].to_string() };

            connection_points.push(ConnectionPoint {
                id: cp_id, file_a: prev_name.clone(), file_b: file_data.file_name.clone(),
                overlap_length: overlap as u32, overlap_snippet: snippet,
                is_auto_merged: true, position,
            });
        } else {
            if !merged_text.is_empty() && !merged_text.ends_with('\n') { merged_text.push('\n'); }
            merged_text.push_str(&file_data.content);

            let snippet = if overlap > 0 && overlap <= 50 { file_data.content[..overlap].to_string() }
                          else if overlap > 50 { format!("{}...", &file_data.content[..50]) }
                          else { String::new() };

            connection_points.push(ConnectionPoint {
                id: cp_id, file_a: prev_name.clone(), file_b: file_data.file_name.clone(),
                overlap_length: overlap as u32, overlap_snippet: snippet,
                is_auto_merged: false, position,
            });
        }
    }

    MergeResult { total_chars: merged_text.chars().count() as u32, merged_text, connection_points,
        files_metadata, skipped_files, encoding_warnings }
}

fn find_overlap(haystack: &str, needle: &str) -> usize {
    if haystack.is_empty() || needle.is_empty() { return 0; }
    let h: Vec<char> = haystack.chars().collect();
    let n: Vec<char> = needle.chars().collect();
    let max = h.len().min(n.len());
    for len in (1..=max).rev() {
        if h[h.len()-len..] == n[..len] { return len; }
    }
    0
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
    #[test] fn t_overlap() { assert_eq!(find_overlap("ABCDEFG","DEFGHIJ"),4); assert_eq!(find_overlap("ABC","XYZ"),0); }
}
