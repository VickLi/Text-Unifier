use napi_derive::napi;
use regex::Regex;
use serde::{Deserialize, Serialize};

/// 文档排版结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[napi(object)]
pub struct FormatResult {
    pub formatted_text: String,
    pub paragraph_count: u32,
    pub protected_blocks: u32,
    pub merged_blocks: u32,
}

/// 文档排版器：实现 RQ-03 去硬回车排版引擎
pub struct DocumentFormatter {
    blank_line_re: Regex,
    multi_space_re: Regex,
    multi_newline_re: Regex,
    sentence_end_re: Regex,
    indent_re: Regex,
    list_marker_re: Regex,
}

impl Default for DocumentFormatter {
    fn default() -> Self {
        Self::new()
    }
}

impl DocumentFormatter {
    pub fn new() -> Self {
        Self {
            blank_line_re: Regex::new(r"\n\s*\n").unwrap(),
            multi_space_re: Regex::new(r" {2,}").unwrap(),
            multi_newline_re: Regex::new(r"\n{3,}").unwrap(),
            sentence_end_re: Regex::new(r"[。！？」）〗》]$").unwrap(),
            indent_re: Regex::new(r"^(  |\u{3000})").unwrap(),
            list_marker_re: Regex::new(
                r"^(\s*[-*•·]\s?|^\s*\d+[.、\)]\s?|^\s*[①⑴㈠㊀]\s?)"
            ).unwrap(),
        }
    }

    pub fn format(&self, text: &str) -> FormatResult {
        if text.trim().is_empty() {
            return FormatResult {
                formatted_text: String::new(),
                paragraph_count: 0,
                protected_blocks: 0,
                merged_blocks: 0,
            };
        }

        let raw_blocks: Vec<&str> = self.blank_line_re.split(text).collect();
        let mut result_paragraphs: Vec<String> = Vec::new();
        let mut protected_blocks = 0u32;
        let mut merged_blocks = 0u32;

        for block in &raw_blocks {
            let block = block.trim();
            if block.is_empty() { continue; }

            let sub_blocks = self.refine_split_safe(block);
            for sub_block in &sub_blocks {
                let lines: Vec<&str> = sub_block.lines().collect();
                if self.is_protected_block(&lines) {
                    result_paragraphs.push(sub_block.to_string());
                    protected_blocks += 1;
                } else {
                    let merged = self.merge_lines(&lines);
                    if !merged.is_empty() {
                        result_paragraphs.push(merged);
                        merged_blocks += 1;
                    }
                }
            }
        }

        let formatted_text = result_paragraphs.join("\n\n");
        let formatted_text = self.multi_newline_re.replace_all(&formatted_text, "\n\n");
        let formatted_text = formatted_text.trim().to_string();

        FormatResult {
            paragraph_count: result_paragraphs.len() as u32,
            formatted_text,
            protected_blocks,
            merged_blocks,
        }
    }

    fn refine_split_safe(&self, block: &str) -> Vec<String> {
        let lines: Vec<&str> = block.lines().collect();
        if lines.len() <= 1 { return vec![block.to_string()]; }

        let mut split_points: Vec<usize> = vec![0];
        for i in 1..lines.len() {
            let current_line = lines[i].trim();
            if current_line.is_empty() { continue; }
            if self.indent_re.is_match(lines[i]) {
                split_points.push(i);
                continue;
            }
            let prev_line = lines[i - 1].trim();
            if !prev_line.is_empty() && self.sentence_end_re.is_match(prev_line) {
                split_points.push(i);
            }
        }
        split_points.push(lines.len());
        split_points.dedup();
        split_points.sort();

        let mut result = Vec::new();
        for window in split_points.windows(2) {
            let start = window[0];
            let end = window[1];
            if start < end {
                let sub_lines = &lines[start..end];
                let sub_text = sub_lines.join("\n");
                if !sub_text.trim().is_empty() {
                    result.push(sub_text);
                }
            }
        }
        result
    }

    fn is_protected_block(&self, lines: &[&str]) -> bool {
        let non_empty_lines: Vec<&&str> = lines.iter().filter(|l| !l.trim().is_empty()).collect();
        let total = non_empty_lines.len();
        if total == 0 { return false; }

        let list_lines = non_empty_lines.iter()
            .filter(|l| self.list_marker_re.is_match(l)).count();
        if (list_lines as f64 / total as f64) > 0.5 { return true; }

        if total < 4 { return false; }

        let total_chars: usize = non_empty_lines.iter()
            .map(|l| l.trim().chars().count()).sum();
        let avg_len = total_chars as f64 / total as f64;
        if avg_len >= 12.0 { return false; }

        let mid_punct_lines = non_empty_lines.iter()
            .filter(|l| {
                let trimmed = l.trim();
                trimmed.contains('，') || trimmed.contains('；') || trimmed.contains('、')
            }).count();
        if (mid_punct_lines as f64 / total as f64) > 0.5 { return false; }

        let lines_without_period = non_empty_lines.iter()
            .filter(|l| {
                let trimmed = l.trim();
                !trimmed.is_empty() && !self.sentence_end_re.is_match(trimmed)
            }).count();
        if (lines_without_period as f64 / total as f64) > 0.85 { return true; }

        false
    }

    fn merge_lines(&self, lines: &[&str]) -> String {
        if lines.len() == 1 { return lines[0].trim_end().to_string(); }
        let merged: Vec<String> = lines.iter()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();
        let result = merged.join(" ");
        let result = self.multi_space_re.replace_all(&result, " ");
        result.trim().to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    // Note: document_formatter tests use #[napi(object)] on FormatResult
    // but since we're testing the Rust struct directly (not via napi),
    // the napi derive doesn't affect unit tests.

    #[test]
    fn test_empty_text() {
        let formatter = DocumentFormatter::new();
        let result = formatter.format("");
        assert_eq!(result.formatted_text, "");
        assert_eq!(result.paragraph_count, 0);
    }

    #[test]
    fn test_single_line_no_change() {
        let formatter = DocumentFormatter::new();
        let result = formatter.format("Hello World");
        assert_eq!(result.formatted_text, "Hello World");
    }

    #[test]
    fn test_merge_lines_within_paragraph() {
        let formatter = DocumentFormatter::new();
        let result = formatter.format("这是第一行\n这是第二行\n这是第三行");
        assert_eq!(result.formatted_text, "这是第一行 这是第二行 这是第三行");
    }

    #[test]
    fn test_preserve_paragraph_separator() {
        let formatter = DocumentFormatter::new();
        let input = "段落A的第一行\n段落A的第二行\n\n段落B的第一行\n段落B的第二行";
        let result = formatter.format(input);
        assert_eq!(result.formatted_text, "段落A的第一行 段落A的第二行\n\n段落B的第一行 段落B的第二行");
    }

    #[test]
    fn test_normalize_multi_newlines() {
        let formatter = DocumentFormatter::new();
        let result = formatter.format("段落A\n\n\n段落B");
        assert_eq!(result.formatted_text, "段落A\n\n段落B");
    }

    #[test]
    fn test_protect_list_block() {
        let formatter = DocumentFormatter::new();
        let result = formatter.format("- 项目1\n- 项目2\n- 项目3");
        assert_eq!(result.formatted_text, "- 项目1\n- 项目2\n- 项目3");
    }

    #[test]
    fn test_indent_starts_new_paragraph() {
        let formatter = DocumentFormatter::new();
        let input = "普通段落第一行\n普通段落第二行\n  这是缩进开头的新段落";
        let result = formatter.format(input);
        assert_eq!(result.formatted_text, "普通段落第一行 普通段落第二行\n\n  这是缩进开头的新段落");
    }

    #[test]
    fn test_approximate_idempotent() {
        let formatter = DocumentFormatter::new();
        let first = formatter.format("这是第一行\n这是第二行\n\n这是第三行");
        let second = formatter.format(&first.formatted_text);
        assert_eq!(first.formatted_text, second.formatted_text);
    }

    #[test]
    fn test_tab_character_handling() {
        let formatter = DocumentFormatter::new();
        let input = "列A\t列B\t列C\n续行1\t续行2";
        let result = formatter.format(input);
        assert_eq!(result.formatted_text, "列A\t列B\t列C 续行1\t续行2");
    }

    #[test]
    fn test_mixed_tab_and_space() {
        let formatter = DocumentFormatter::new();
        let input = "Hello\tWorld\nFoo  Bar";
        let result = formatter.format(input);
        assert_eq!(result.formatted_text, "Hello\tWorld Foo Bar");
    }

    #[test]
    fn test_protected_block_poem() {
        let formatter = DocumentFormatter::new();
        let input = "床前明月光\n疑是地上霜\n举头望明月\n低头思故乡";
        let result = formatter.format(input);
        assert_eq!(result.formatted_text, "床前明月光\n疑是地上霜\n举头望明月\n低头思故乡");
    }
}
