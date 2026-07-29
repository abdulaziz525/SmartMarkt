import re

with open('dashboard_code_clean.txt', 'r') as f:
    dashboard_code = f.read()

with open('src/App.tsx', 'r') as f:
    app_code = f.read()

# Remove imports
imports_to_remove = [
    "import { BranchAlertsWidget } from './components/dashboard/BranchAlertsWidget';\n",
    "import { MetricCardWidget } from './components/dashboard/MetricCardWidget';\n",
    "import { SalesChartWidget } from './components/dashboard/SalesChartWidget';\n",
    "import { BestSellersWidget } from './components/dashboard/BestSellersWidget';\n",
    "import { BranchPerformanceWidget } from './components/dashboard/BranchPerformanceWidget';\n",
    "import { WidgetOverlayModal } from './components/dashboard/WidgetOverlayModal';\n",
    "import { DashboardGrid } from './components/dashboard/DashboardGrid';\n"
]

for imp in imports_to_remove:
    app_code = app_code.replace(imp, "")

# Remove focusedWidget state
app_code = app_code.replace("  const [focusedWidget, setFocusedWidget] = useState<string | null>(null);\n", "")

# Replace TAB: DASHBOARD
start_marker = "{/* ========================================================\n              TAB: DASHBOARD\n              ======================================================== */}"
end_marker = "{/* ========================================================\n              TAB: POS SALES SCREEN\n              ======================================================== */}"

start_idx = app_code.find(start_marker)
end_idx = app_code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    # dashboard_code starts with `          ` (spaces) and continues. 
    # we just inject it exactly.
    app_code = app_code[:start_idx] + dashboard_code + "\n          " + app_code[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(app_code)

print("Reverted App.tsx")
