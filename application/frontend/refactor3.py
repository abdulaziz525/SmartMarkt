import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add DashboardGrid import if missing
if 'DashboardGrid' not in content:
    idx = content.rfind("import { WidgetOverlayModal }")
    if idx != -1:
        end_idx = content.find('\\n', idx)
        content = content[:end_idx+1] + "import { DashboardGrid } from './components/dashboard/DashboardGrid';\\n" + content[end_idx+1:]

# Replace ResponsiveGridLayout with DashboardGrid in the dashboard tab
start_str = "<ResponsiveGridLayout"
end_str = "</ResponsiveGridLayout>"

# We must only replace in the specific dashboard block
if "TAB: DASHBOARD" in content:
    content = content.replace("<ResponsiveGridLayout", "<DashboardGrid", 1)
    content = content.replace("</ResponsiveGridLayout>", "</DashboardGrid>", 1)
    # Remove the ts-ignore we added earlier for RGL
    content = content.replace("{/* @ts-ignore: RGL Props mismatch */}\\n              <DashboardGrid", "<DashboardGrid")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Replaced ResponsiveGridLayout with DashboardGrid!")
