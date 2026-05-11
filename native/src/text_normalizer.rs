use regex::Regex;

/// 文本归一化器：实现 PRD 中的 normalizeText 规则
///
/// 规则：
/// 1. 统一换行符为 \n
/// 2. 移除首尾空白字符（trim）
/// 3. 将连续多个空白符（空格/制表符）替换为单个空格
/// 4. 过滤不可见控制字符（除换行外）
/// 5. 按行分割，过滤空行（仅含空白符的行视为空行）
pub struct TextNormalizer {
    newline_re: Regex,
    whitespace_re: Regex,
}

impl Default for TextNormalizer {
    fn default() -> Self {
        Self::new()
    }
}

impl TextNormalizer {
    pub fn new() -> Self {
        Self {
            newline_re: Regex::new(r"\r\n|\r").unwrap(),
            whitespace_re: Regex::new(r"[ \t]+").unwrap(),
        }
    }

    /// 执行完整归一化，返回段落数组
    pub fn normalize(&self, raw: &str) -> Vec<String> {
        let step1 = self.newline_re.replace_all(raw, "\n");
        let step1 = step1.replace('\t', " ");

        let step2: String = step1
            .chars()
            .filter(|&c| c == '\n' || !c.is_control())
            .collect();

        let lines: Vec<&str> = step2.split('\n').collect();
        let mut paragraphs: Vec<String> = Vec::with_capacity(lines.len());

        for line in lines {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            let normalized = self.whitespace_re.replace_all(trimmed, " ");
            paragraphs.push(normalized.to_string());
        }

        paragraphs
    }

    /// 轻量归一化（仅用于预览显示，不做行分割）
    #[allow(dead_code)]
    pub fn normalize_for_display(&self, text: &str) -> String {
        let step1 = self.newline_re.replace_all(text, "\n");
        let step2: String = step1
            .chars()
            .filter(|&c| c == '\n' || !c.is_control())
            .collect();
        let trimmed = step2.trim();
        self.whitespace_re.replace_all(trimmed, " ").to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unify_newlines() {
        let normalizer = TextNormalizer::new();
        let result = normalizer.normalize("Hello\r\nWorld\rTest");
        assert_eq!(result, vec!["Hello", "World", "Test"]);
    }

    #[test]
    fn test_collapse_whitespace() {
        let normalizer = TextNormalizer::new();
        let result = normalizer.normalize("Hello    World\tTest");
        assert_eq!(result, vec!["Hello World Test"]);
    }

    #[test]
    fn test_trim_and_empty_lines() {
        let normalizer = TextNormalizer::new();
        let result = normalizer.normalize("  Hello  \n\n  \nWorld  ");
        assert_eq!(result, vec!["Hello", "World"]);
    }

    #[test]
    fn test_hello_world_duplication() {
        let normalizer = TextNormalizer::new();
        let r1 = normalizer.normalize("Hello  World");
        let r2 = normalizer.normalize("Hello World");
        assert_eq!(r1, r2);
    }

    #[test]
    fn test_remove_control_chars() {
        let normalizer = TextNormalizer::new();
        let input = "Hello\u{0000}World\u{0001}Test";
        let result = normalizer.normalize(input);
        assert_eq!(result, vec!["HelloWorldTest"]);
    }
}
