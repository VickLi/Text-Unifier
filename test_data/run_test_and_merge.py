"""
Text Unifier V1.0.1 — Full Scenario Auto Test & Merge Output

Processes all functional test scenarios, simulates Rust backend
normalization + dedup algorithm, outputs merged_result.txt to each folder.
"""
import os
import re
import hashlib
import unicodedata
import time
from pathlib import Path


def normalize_text(text: str) -> list[str]:
    """Simulates Rust TextNormalizer::normalize() exactly."""
    text = re.sub(r'\r\n|\r', '\n', text)
    # Rust: .filter(|&c| c == '\n' || !c.is_control()) — is_control()=true for Cc only
    text = ''.join(c for c in text if c == '\n' or unicodedata.category(c) not in ('Cc',))
    paragraphs = []
    for line in text.split('\n'):
        trimmed = line.strip()
        if not trimmed:
            continue
        paragraphs.append(re.sub(r'[ \t]+', ' ', trimmed))
    return paragraphs


def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def make_snippet(text: str, max_chars: int = 10) -> str:
    if len(text) > max_chars:
        return text[:max_chars] + '...'
    return text


def analyze_files(file_paths: list[str]) -> dict:
    """Simulates Rust InterFileDeduper (V1.1 algorithm).

    V1.1 变更：按文件顺序流式合并，仅做文件间去重。
    - 每个文件内部段落完整保留，不做内部去重
    - 后续文件中与前面文件重复的段落被跳过
    - 跨文件重复的段落生成 DuplicateGroup
    """
    start = time.perf_counter()
    file_data = []

    for path in file_paths:
        p = Path(path)
        fname = p.name
        try:
            raw = p.read_text('utf-8-sig')
        except UnicodeDecodeError:
            try:
                raw = p.read_text('gb18030')
            except UnicodeDecodeError:
                raw = p.read_text('utf-8', errors='replace')
        file_data.append((fname, normalize_text(raw)))

    # V1.1 InterFileDeduper 核心状态
    previous_files_hashes: set[str] = set()  # 已处理文件的所有段落哈希
    preview: list[dict] = []                  # 最终输出段落
    preview_counter: int = 0

    # 跨文件来源追踪：hash -> {content, sources[]}
    cross_file_index: dict[str, dict] = {}
    group_counter: int = 0

    for fname, paras in file_data:
        current_file_hashes: set[str] = set()

        for i, para in enumerate(paras):
            h = compute_sha256(para)
            current_file_hashes.add(h)

            # 追踪跨文件来源
            if h not in cross_file_index:
                cross_file_index[h] = {
                    'content': para,
                    'sources': [],
                }
            cross_file_index[h]['sources'].append({
                'file_name': fname,
                'start_line': i + 1,
            })

            # 核心判断：是否已在前面文件中出现过？
            if h in previous_files_hashes:
                # 跨文件重复 → 跳过，不加入输出
                continue

            # 全新内容或文件内重复 → 加入输出
            preview_counter += 1
            src_files = list(dict.fromkeys(
                s['file_name'] for s in cross_file_index[h]['sources']
            ))
            preview.append({
                'id': f"pre_{preview_counter:04d}",
                'text': para,
                'content_hash': h,
                'source_files': src_files,
                'is_original': True,
            })

        # 处理完整文件后，将本文件所有哈希加入 previous_files_hashes
        previous_files_hashes.update(current_file_hashes)

    # 生成重复组：出现在 ≥2 个文件中的段落
    dup_groups = []
    for h, entry in cross_file_index.items():
        if len(entry['sources']) > 1:
            group_counter += 1
            dup_groups.append({
                'id': f"grp_{group_counter}",
                'content_hash': h,
                'snippet': make_snippet(entry['content']),
                'sources': entry['sources'],
                'occurrence_count': len(entry['sources']),
            })

    elapsed_ms = (time.perf_counter() - start) * 1000
    return {
        'duplicate_groups': dup_groups,
        'preview_paragraphs': preview,
        'total_files': len(file_paths),
        'total_paragraphs': sum(len(fd[1]) for fd in file_data),
        'unique_paragraphs': len(preview),
        'duplicate_count': len(dup_groups),
        'processing_time_ms': round(elapsed_ms, 2),
    }


def save_merged_output(folder_path: str, preview: list[dict]) -> str:
    path = os.path.join(folder_path, 'merged_output.txt')
    content = '\n\n'.join(p['text'] for p in preview)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return path


def print_report(results: list[dict]):
    sep = '=' * 66
    print()
    print(sep)
    print("  Text Unifier V1.1 - Full Scenario Test Report (InterFileDeduper)")
    print(sep)

    total_dup = total_para = total_uniq = total_time = 0
    passed = failed = 0

    for r in results:
        folder = r['folder']
        st = r['status']
        dup = r['duplicate_count']
        t_para = r['total_paragraphs']
        u_para = r['unique_paragraphs']
        t = r['time_ms']
        nf = r['n_files']
        out = r.get('output_path', '')

        total_dup += dup
        total_para += t_para
        total_uniq += u_para
        total_time += t
        passed += (st == 'PASS')
        failed += (st != 'PASS')

        mark = '[PASS]' if st == 'PASS' else '[FAIL]'
        print(f"\n  [{folder}] {mark}")
        print(f"  |- Files: {nf}")
        print(f"  |- Total paragraphs: {t_para}")
        print(f"  |- Unique: {u_para} | Duplicates: {dup}")
        print(f"  |- Time: {t}ms")
        if out:
            rel = os.path.relpath(out, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            print(f"  |- Output: {rel}")

    print()
    print(sep)
    print("  Summary")
    print(sep)
    print(f"  Scenarios: {passed + failed} | Passed: {passed} | Failed: {failed}")
    print(f"  Total paragraphs: {total_para} | Unique: {total_uniq} | Duplicates: {total_dup}")
    print(f"  Total time: {round(total_time, 2)}ms")
    print(sep)
    print()


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    func_dir = os.path.join(base, 'functional')

    # V1.1 预期重复组数（跨文件重复）：
    # 说明：03 中 file_B 包含字面量 \r\n 文本（非实际 CRLF），归一化为 1 段且不与 file_A 重复
    #       04 中 file_A 的制表符 \t 是控制字符被过滤，"Tabcharactershere." ≠ "Tab characters here."
    scenarios = [
        ('01_basic_duplicate',         ['file_A.txt', 'file_B.txt'],                    8),
        ('02_whitespace_variation',    ['file_A.txt', 'file_B.txt'],                    3),
        ('03_newline_variation',       ['file_A.txt', 'file_B.txt'],                    0),
        ('04_bom_special_chars',       ['file_A.txt', 'file_B.txt'],                    1),
        ('06_no_duplicates',           ['file_A.txt', 'file_B.txt'],                    0),
        ('07_all_duplicates',          ['file_A.txt', 'file_B.txt'],                    3),
        ('08_multi_file_duplicate',    ['file_A.txt', 'file_B.txt', 'file_C.txt'],      1),
        ('09_leading_trailing_spaces', ['file_A.txt', 'file_B.txt'],                    3),
    ]

    results = []
    print("Starting full scenario auto test...")

    for folder, files, exp_dup in scenarios:
        fpath = os.path.join(func_dir, folder)
        paths = [os.path.join(fpath, f) for f in files]
        missing = [f for f in paths if not os.path.exists(f)]
        if missing:
            print(f"  [SKIP] {folder}: missing {missing}")
            continue

        print(f"  Processing: {folder} ...", end=' ')
        result = analyze_files(paths)
        out_path = save_merged_output(fpath, result['preview_paragraphs'])
        actual = result['duplicate_count']
        status = 'PASS' if actual == exp_dup else 'FAIL'
        print("OK" if status == 'PASS' else f"expected={exp_dup} actual={actual}")

        results.append({
            'folder': folder, 'status': status,
            'n_files': len(files),
            'total_paragraphs': result['total_paragraphs'],
            'unique_paragraphs': result['unique_paragraphs'],
            'duplicate_count': actual,
            'time_ms': result['processing_time_ms'],
            'output_path': out_path,
        })

    print_report(results)
    print("  Merged results saved to: merged_output.txt in each folder")
    print()


if __name__ == '__main__':
    main()
