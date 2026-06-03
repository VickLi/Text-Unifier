import os

# 1. GBK encoded file
with open('test_gbk.txt', 'w', encoding='gbk') as f:
    f.write('第一章 踏上旅途\n')
    f.write('在遥远的东方，有一座古老的城市。\n')
    f.write('作者：张三\n')

# 2. Empty file
with open('test_empty.txt', 'w', encoding='utf-8') as f:
    pass

# 3. CRLF file (binary write to ensure \r\n)
with open('test_crlf.txt', 'wb') as f:
    f.write(b'Hello\r\nWorld\r\nTest')

# 4. Consecutive spaces file
with open('test_spaces.txt', 'w', encoding='utf-8') as f:
    f.write('Hello    World   Test')

# 5. UTF-8 BOM file
with open('test_bom.txt', 'wb') as f:
    f.write(b'\xef\xbb\xbfHello World with BOM')

# Verify
for fn in os.listdir('.'):
    if fn.endswith('.py'):
        continue
    size = os.path.getsize(fn)
    print(f'{fn}: {size} bytes')
