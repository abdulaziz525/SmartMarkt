import re

with open('src/App.tsx', 'r') as f:
    app_code = f.read()

# Remove unused variables and imports
app_code = re.sub(r'import \{ ResponsiveGridLayout \} from "react-grid-layout";\n?', '', app_code)
app_code = re.sub(r'import type \{ Layout \} from "react-grid-layout";\n?', '', app_code)
app_code = re.sub(r'import "react-grid-layout/css/styles\.css";\n?', '', app_code)
app_code = re.sub(r'import "react-resizable/css/styles\.css";\n?', '', app_code)

app_code = re.sub(r'const \[isDashboardEditing, setIsDashboardEditing\] = useState\(false\);\n?', '', app_code)

# Remove defaultDashboardLayouts
app_code = re.sub(r'const defaultDashboardLayouts = \{.*?layout: \[.*?\].*?\};\n?', '', app_code, flags=re.DOTALL)

# Remove dashboardLayouts state
app_code = re.sub(r'const \[dashboardLayouts, setDashboardLayouts\] = useState.*?;\n?', '', app_code)

# Remove onLayoutChange
app_code = re.sub(r'const onLayoutChange = .*?;\n?', '', app_code, flags=re.DOTALL)

# Remove handleSupplierPayoff as well, to fix all unused variables
app_code = re.sub(r'const handleSupplierPayoff = .*?;\n?', '', app_code, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(app_code)

print("Cleaned unused variables")
