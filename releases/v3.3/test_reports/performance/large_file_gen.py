"""生成大文本文件用于性能测试"""
import os

output_dir = os.path.dirname(os.path.abspath(__file__))

# 生成 50MB 左右的测试文件
def generate_large_file(filename, target_size_mb=50):
    filepath = os.path.join(output_dir, filename)
    lines = []
    # 生成 1000 个独特的段落
    for i in range(1000):
        lines.append(f"Unique paragraph number {i} with some random content for testing purposes.\n")
    
    # 生成 100 个重复段落（每个重复 20 次）
    for i in range(100):
        para = f"Repeated paragraph {i} that will appear in both files for dedup testing.\n"
        for _ in range(20):
            lines.append(para)
    
    # 生成混合内容
    for i in range(500):
        lines.append(f"Mixed content paragraph {i} with unique data.\n")
    
    content = "\n".join(lines)
    
    # 重复内容直到达到目标大小
    current_size = len(content.encode('utf-8'))
    multiplier = max(1, target_size_mb * 1024 * 1024 // current_size)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        for _ in range(multiplier):
            f.write(content)
            f.write("\n---Section Break---\n")
    
    actual_size = os.path.getsize(filepath)
    print(f"Generated {filename}: {actual_size / 1024 / 1024:.2f} MB")

if __name__ == '__main__':
    generate_large_file('large_file_A.txt', 50)
    generate_large_file('large_file_B.txt', 50)
    print("Done!")
