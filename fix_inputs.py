import os
import re

directories = ["src/app", "src/components"]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<input ' not in content:
        return

    # Strategy: 
    # 1. Add onFocus={(e) => e.target.select()} to any input type="number" or any input where type is "number"
    # 2. For onChange that does Number(e.target.value), replace it with e.target.value === '' ? ('' as any) : Number(e.target.value)
    
    modified = False
    new_content = ""
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'type="number"' in line or 'type={"number"}' in line:
            # Fix onFocus
            if 'onFocus' not in line:
                line = line.replace('type="number"', 'type="number" onFocus={(e) => e.target.select()}')
                modified = True
            
            # Fix onChange
            if 'Number(e.target.value)' in line and '===' not in line:
                line = line.replace('Number(e.target.value)', '(e.target.value === "" ? "" as any : Number(e.target.value))')
                modified = True
            
            # Fix parseInt
            if 'parseInt(e.target.value)' in line and '===' not in line:
                line = line.replace('parseInt(e.target.value) || 1', '(e.target.value === "" ? "" as any : parseInt(e.target.value))')
                line = line.replace('parseInt(e.target.value)', '(e.target.value === "" ? "" as any : parseInt(e.target.value))')
                modified = True
                
            # Fix parseFloat
            if 'parseFloat(e.target.value)' in line and '===' not in line:
                line = line.replace('parseFloat(e.target.value) || 0', '(e.target.value === "" ? "" as any : parseFloat(e.target.value))')
                line = line.replace('parseFloat(e.target.value)', '(e.target.value === "" ? "" as any : parseFloat(e.target.value))')
                modified = True

        new_content += line + "\n"
        
    if modified:
        # Remove trailing newline if it wasn't there
        if not content.endswith('\n'):
            new_content = new_content[:-1]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))
