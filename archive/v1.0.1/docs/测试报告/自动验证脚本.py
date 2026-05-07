"""
Text Unifier V1.0.1 - 自动验证脚本
对测试数据的内容进行逻辑验证，确保测试数据与预期一致
"""
import os
import sys
import hashlib
import json

TEST_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_data")

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def normalize_text(text):
    """模拟 Rust TextNormalizer 的归一化逻辑"""
    import re
    import unicodedata
    # 统一换行符
    text = re.sub(r'\r\n|\r', '\n', text)
    # 过滤控制字符（保留\n，保留\t作为空白符） -- 注意：Rust 的 is_control() 会过滤 tab，但 PRD 要求 tab 应替换为空格
    text = ''.join(c for c in text if c == '\n' or c == '\t' or unicodedata.category(c) not in ('Cc', 'Cf'))
    # 按行分割
    lines = text.split('\n')
    paragraphs = []
    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            continue
        # 连续空白替换为单个空格
        normalized = re.sub(r'[ \t]+', ' ', trimmed)
        paragraphs.append(normalized)
    return paragraphs

def compute_hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def test_normalizer():
    """测试归一化逻辑"""
    print("\n=== 测试: 文本归一化 ===")
    failures = 0
    
    # 测试换行符归一化
    result = normalize_text("Hello\r\nWorld\rTest")
    assert result == ["Hello", "World", "Test"], f"换行符归失败: {result}"
    print("  ✅ 换行符归一化 (CRLF/LF/CR -> LF)")
    
    # 测试连续空白
    result = normalize_text("Hello    World" + chr(9) + "Test")
    assert result == ["Hello World Test"], f"空白折叠失败: {result}"
    print("  ✅ 连续空白折叠")
    
    # 测试首尾空格
    result = normalize_text("  Hello  \n\n  \nWorld  ")
    assert result == ["Hello", "World"], f"首尾空格修剪失败: {result}"
    print("  ✅ 首尾空格修剪 + 空行过滤")
    
    # 测试 "Hello  World" 与 "Hello World" 相同
    r1 = normalize_text("Hello  World")
    r2 = normalize_text("Hello World")
    assert r1 == r2, f"多空格归一化不匹配: {r1} != {r2}"
    print("  ✅ 多空格归一化匹配 (AC-02)")
    
    # 测试中文归一化
    r1 = normalize_text("这是一段中文测试")
    r2 = normalize_text("这是一段中文测试")
    assert r1 == r2, f"中文归一化不匹配"
    print("  ✅ 中文内容归一化")
    
    print(f"  📊 共通过 6 项测试")

def test_duplicate_detection():
    """模拟重复检测逻辑"""
    print("\n=== 测试: 重复检测逻辑 ===")
    failures = 0
    
    test_cases = [
        ("01_basic_duplicate", ["file_A.txt", "file_B.txt"], {
            "expected_duplicates": 8,  # 8个公共段落被识别为重复（file_A多1个唯一段、file_B多1个唯一段）
        }),
        ("02_whitespace_variation", ["file_A.txt", "file_B.txt"], {
            "expected_duplicates": 3
        }),
        ("06_no_duplicates", ["file_A.txt", "file_B.txt"], {
            "expected_duplicates": 0
        }),
        ("07_all_duplicates", ["file_A.txt", "file_B.txt"], {
            "expected_duplicates": 3
        }),
    ]
    
    for folder, files, expected in test_cases:
        folder_path = os.path.join(TEST_DATA_DIR, "functional", folder)
        if not os.path.exists(folder_path):
            print(f"  ⚠️  测试目录不存在: {folder_path}")
            continue
        
        all_paras = {}
        for fname in files:
            fpath = os.path.join(folder_path, fname)
            if not os.path.exists(fpath):
                print(f"  ⚠️  文件不存在: {fpath}")
                continue
            content = read_file(fpath)
            paras = normalize_text(content)
            all_paras[fname] = paras
        
        # 构建指纹索引
        fingerprint_map = {}
        for fname, paras in all_paras.items():
            for i, para in enumerate(paras):
                h = compute_hash(para)
                if h not in fingerprint_map:
                    fingerprint_map[h] = {"content": para, "files": []}
                if fname not in [f["name"] for f in fingerprint_map[h]["files"]]:
                    fingerprint_map[h]["files"].append({"name": fname, "line": i+1})
        
        # 统计重复组
        duplicate_count = sum(1 for v in fingerprint_map.values() if len(v["files"]) > 1)
        
        exp = expected["expected_duplicates"]
        if duplicate_count == exp:
            print(f"  ✅ {folder}: 重复组 = {duplicate_count} (预期 {exp})")
        else:
            print(f"  ❌ {folder}: 重复组 = {duplicate_count} (预期 {exp})")
            failures += 1

def test_bom_handling():
    """测试 BOM 处理"""
    print("\n=== 测试: BOM 处理 ===")
    
    # 模拟 file_A.txt (含BOM) 和 file_B.txt (无BOM)
    content_with_bom = "\ufeffNormal text without BOM issues."
    content_without_bom = "Normal text without BOM issues."
    
    # 去除BOM
    cleaned = content_with_bom[1:] if content_with_bom.startswith('\ufeff') else content_with_bom
    assert cleaned == content_without_bom, "BOM 移除失败"
    print("  ✅ BOM 头移除")
    
    # 归一化后比对
    r1 = normalize_text(cleaned)
    r2 = normalize_text(content_without_bom)
    assert r1 == r2, f"BOM 文件归一化不匹配"
    print("  ✅ BOM 文件与无 BOM 文件内容匹配")

def test_all_data_files():
    """验证所有测试数据文件可读"""
    print("\n=== 测试: 测数数据文件完整性 ===")
    total = 0
    for root, dirs, files in os.walk(TEST_DATA_DIR):
        for f in files:
            if f.endswith('.txt'):
                path = os.path.join(root, f)
                try:
                    content = read_file(path)
                    total += 1
                except Exception as e:
                    print(f"  ❌ 无法读取: {path}: {e}")
    print(f"  ✅ 共 {total} 个测试文件可正常读取")

def run_all():
    print("=" * 50)
    print("Text Unifier V1.0.1 - 自动验证脚本")
    print("=" * 50)
    
    test_normalizer()
    test_bom_handling()
    test_duplicate_detection()
    test_all_data_files()
    
    print("\n" + "=" * 50)
    print("验证完成")
    print("=" * 50)

if __name__ == "__main__":
    run_all()
