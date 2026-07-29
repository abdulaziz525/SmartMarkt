with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Imported with errors" in line or "تم استيراد بعض المنتجات مع وجود أخطاء:" in line:
        if "DashboardGrid" in line or "DashboardGrid" in lines[i-1]:
            print(f"Found issue at line {i}")
            lines[i] = "        alert((lang === 'ar' ? 'تم استيراد بعض المنتجات مع وجود أخطاء: \\\\n' : 'Imported with errors: \\\\n') + errors.slice(0, 5).join('\\\\n'));\\n"
            if "DashboardGrid" in lines[i-1]:
                lines[i-1] = ""

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
print("Done")
