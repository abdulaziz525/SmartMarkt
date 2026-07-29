import re

with open('dashboard_code_clean.txt', 'r') as f:
    dashboard_code = f.read()

with open('src/App.tsx', 'r') as f:
    app_code = f.read()

start_marker = "{/* ========================================================\n              TAB: DASHBOARD\n              ======================================================== */}"
end_marker = "{/* ========================================================\n              TAB: POS SALES SCREEN\n              ======================================================== */}"

start_idx = app_code.find(start_marker)
# Find the LAST end_marker in case we accidentally duplicated it
end_idx = app_code.rfind(end_marker)

if start_idx != -1 and end_idx != -1:
    app_code = app_code[:start_idx] + dashboard_code + "\n          " + app_code[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(app_code)

print("Reverted App.tsx again")
