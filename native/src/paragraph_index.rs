use sha2::{Digest, Sha256};
use indexmap::IndexMap;
use std::collections::HashSet;

use crate::duplicate_resolver::{DuplicateGroup, PreviewParagraph, SourceInfo};

/// 计算字符串的 SHA256 哈希
pub fn compute_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

/// 生成 snippet（使用字符索引而非字节索引）
pub fn make_snippet(content: &str) -> String {
    let char_count = content.chars().count();
    if char_count > 10 {
        let snippet: String = content.chars().take(10).collect();
        format!("{}...", snippet)
    } else {
        content.to_string()
    }
}

/// V1.1 文件间去重引擎
pub struct InterFileDeduper {
    previous_files_hashes: HashSet<String>,
    preview_paragraphs: Vec<PreviewParagraph>,
    cross_file_index: IndexMap<String, (String, Vec<String>, Vec<SourceInfo>)>,
    current_file_hashes: HashSet<String>,
    preview_counter: usize,
}

impl InterFileDeduper {
    pub fn new() -> Self {
        Self {
            previous_files_hashes: HashSet::new(),
            preview_paragraphs: Vec::new(),
            cross_file_index: IndexMap::new(),
            current_file_hashes: HashSet::new(),
            preview_counter: 0,
        }
    }

    /// 处理一个文件的所有归一化段落
    pub fn process_file(
        &mut self,
        file_name: &str,
        normalized_paragraphs: &[String],
    ) {
        self.current_file_hashes.clear();

        for (line_idx, paragraph) in normalized_paragraphs.iter().enumerate() {
            let hash = compute_hash(paragraph);
            self.current_file_hashes.insert(hash.clone());

            let entry = self
                .cross_file_index
                .entry(hash.clone())
                .or_insert_with(|| {
                    (make_snippet(paragraph), Vec::new(), Vec::new())
                });
            entry.1.push(file_name.to_string());
            // V3.0: start_line 由 usize 改为 u32，确保安全转换
            entry.2.push(SourceInfo {
                file_name: file_name.to_string(),
                start_line: (line_idx + 1) as u32,
            });

            if self.previous_files_hashes.contains(&hash) {
                continue;
            }

            self.preview_counter += 1;
            self.preview_paragraphs.push(PreviewParagraph {
                id: format!("pre_{:04}", self.preview_counter),
                text: paragraph.clone(),
                content_hash: hash.clone(),
                source_files: vec![file_name.to_string()],
                is_original: true,
            });
        }

        self.previous_files_hashes
            .extend(self.current_file_hashes.drain());
    }

    /// 生成最终的分析报告
    pub fn finalize(self) -> (Vec<DuplicateGroup>, Vec<PreviewParagraph>) {
        let mut duplicate_groups = Vec::new();
        let mut group_counter = 0;

        for (hash, (snippet_text, file_names, sources)) in &self.cross_file_index {
            let unique_file_count = {
                let mut seen = std::collections::HashSet::new();
                for name in file_names {
                    seen.insert(name.as_str());
                }
                seen.len()
            };

            if unique_file_count > 1 {
                group_counter += 1;
                duplicate_groups.push(DuplicateGroup {
                    id: format!("grp_{}", group_counter),
                    content_hash: hash.clone(),
                    snippet: snippet_text.clone(),
                    sources: sources.clone(),
                    // V3.0: occurrence_count 由 usize 改为 u32
                    occurrence_count: unique_file_count as u32,
                });
            }
        }

        (duplicate_groups, self.preview_paragraphs)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_hash() {
        let hash1 = compute_hash("Hello World");
        let hash2 = compute_hash("Hello World");
        let hash3 = compute_hash("Hello World!");
        assert_eq!(hash1, hash2);
        assert_ne!(hash1, hash3);
        assert_eq!(hash1.len(), 64);
    }

    #[test]
    fn test_v1_1_preserves_intra_file_duplicates() {
        let mut engine = InterFileDeduper::new();
        engine.process_file("file1.txt", &[
            "A".to_string(),
            "A".to_string(),
            "B".to_string(),
        ]);
        engine.process_file("file2.txt", &[
            "A".to_string(),
            "C".to_string(),
        ]);
        let (groups, preview) = engine.finalize();
        assert_eq!(preview.len(), 4);
        assert_eq!(preview[0].text, "A");
        assert_eq!(preview[1].text, "A");
        assert_eq!(preview[2].text, "B");
        assert_eq!(preview[3].text, "C");
        let a_group = groups.iter().find(|g| g.snippet == "A").unwrap();
        assert_eq!(a_group.occurrence_count, 2);
    }

    #[test]
    fn test_v1_1_single_file_no_dedup() {
        let mut engine = InterFileDeduper::new();
        engine.process_file("single.txt", &[
            "X".to_string(),
            "X".to_string(),
            "X".to_string(),
        ]);
        let (groups, preview) = engine.finalize();
        assert_eq!(preview.len(), 3);
        assert!(groups.is_empty());
    }

    #[test]
    fn test_v1_1_novel_scenario() {
        let mut engine = InterFileDeduper::new();
        engine.process_file("全本.txt", &[
            "第一章".to_string(),
            "方怡".to_string(),
            "……".to_string(),
            "方怡".to_string(),
            "第二章".to_string(),
        ]);
        engine.process_file("第1章.txt", &[
            "方怡".to_string(),
            "独有段落A".to_string(),
        ]);
        engine.process_file("第2章.txt", &[
            "第二章".to_string(),
            "独有段落B".to_string(),
        ]);
        let (groups, preview) = engine.finalize();
        assert_eq!(preview.len(), 7);
        assert!(groups.iter().any(|g| g.snippet == "方怡" && g.occurrence_count == 2));
    }
}
