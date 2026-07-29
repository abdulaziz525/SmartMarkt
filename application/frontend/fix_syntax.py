with open('src/App.tsx', 'r') as f:
    content = f.read()

bad_str = "        alert((lang === 'ar' ? 'تم استيراد بعض المنتجات مع وجود أخطاء: \\\\import { DashboardGrid } from \\'./components/dashboard/DashboardGrid\\';\\nn' : 'Imported with errors: \\\\n') + errors.slice(0, 5).join('\\\\n'));"
good_str = "        alert((lang === 'ar' ? 'تم استيراد بعض المنتجات مع وجود أخطاء: \\\\n' : 'Imported with errors: \\\\n') + errors.slice(0, 5).join('\\\\n'));"

content = content.replace(bad_str, good_str)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Fixed syntax error.")
