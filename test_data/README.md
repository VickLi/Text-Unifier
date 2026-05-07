# Text Unifier - 测试数据目录

## 目录结构

```
test_data/
├── functional/                    # 功能测试数据
│   ├── 01_basic_duplicate/        # 基本重复检测
│   ├── 02_whitespace_variation/   # 空格容错
│   ├── 03_newline_variation/      # 换行符容错
│   ├── 04_bom_special_chars/      # BOM/特殊字符
│   ├── 05_non_txt_rejection/      # 非txt文件拒绝
│   ├── 06_no_duplicates/          # 无重复场景
│   ├── 07_all_duplicates/         # 全部重复场景
│   ├── 08_multi_file_duplicate/   # 多文件重复
│   └── 09_leading_trailing_spaces/# 首尾空格
├── performance/                   # 性能测试数据
│   ├── large_file_A.txt (51MB)    # 大文件A
│   ├── large_file_B.txt (51MB)    # 大文件B
│   └── large_file_gen.py          # 生成脚本
└── security/                      # 安全测试数据
    ├── 01_path_traversal/
    ├── 02_encoding_attack/
    ├── 03_null_bytes/
    └── 04_very_long_line/
```
