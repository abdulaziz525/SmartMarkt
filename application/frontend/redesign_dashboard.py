import re

with open('src/App.tsx', 'r') as f:
    app_code = f.read()

# 1. Remove Edit/Reset buttons from header
header_start = """                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-indigo-400" />
                  {lang === 'ar' ? 'لوحة القيادة التفاعلية' : 'Dynamic Dashboard'}
                </h2>"""
header_end = """                </div>
              </div>"""

# Remove the buttons div
app_code = re.sub(
    r'(<h2 className="text-xl font-bold text-white flex items-center gap-2">.*?</h2>)\s*<div className="flex gap-2">.*?</button>\s*</div>\s*</div>',
    r'\1\n              </div>',
    app_code,
    flags=re.DOTALL
)

# 2. Remove style block
app_code = re.sub(
    r'<style>.*?</style>',
    '',
    app_code,
    flags=re.DOTALL
)

# 3. Replace ResponsiveGridLayout with regular div
app_code = re.sub(
    r'\{/\* @ts-ignore: RGL Props mismatch \*/\}\s*<ResponsiveGridLayout[^>]*>',
    '<div className="space-y-6 w-full">',
    app_code,
    flags=re.DOTALL
)
app_code = re.sub(
    r'<ResponsiveGridLayout[^>]*>',
    '<div className="space-y-6 w-full">',
    app_code,
    flags=re.DOTALL
)
app_code = app_code.replace("</ResponsiveGridLayout>", "</div>")

# 4. Remove `className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}` wrappers 
# and replace with empty or just content
app_code = re.sub(
    r'<div key="alerts" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div key="alerts" className="w-full h-full">',
    app_code
)

app_code = re.sub(
    r'<div key="branch" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div key="branch" className="w-full h-full">',
    app_code
)

app_code = re.sub(
    r'<div key="chart" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div key="chart" className="w-full h-full lg:col-span-2">',
    app_code
)

app_code = re.sub(
    r'<div key="bestsellers" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div key="bestsellers" className="w-full h-full lg:col-span-1">',
    app_code
)

# Fix metric cards wrapping
app_code = re.sub(
    r'<div key="metric1" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">\n                  <div key="metric1" className="w-full h-full">',
    app_code
)

app_code = re.sub(
    r'<div key="metric2" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div key="metric2" className="w-full h-full">',
    app_code
)

app_code = re.sub(
    r'<div key="metric3" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div key="metric3" className="w-full h-full">',
    app_code
)

app_code = re.sub(
    r'<div key="metric4" className=\{`w-full h-full \$\{isDashboardEditing \? \'cursor-move\' : \'\'\}`\}>',
    '<div key="metric4" className="w-full h-full">',
    app_code
)
# Close metrics grid
app_code = app_code.replace("                  </div>\n                </div>\n\n              {/* Graphics & Details Section */}", "                  </div>\n                </div>\n                </div>\n\n              {/* Graphics & Details Section */}")


# Wrap chart and bestsellers in grid
app_code = app_code.replace(
    "{/* Graphics & Details Section */}\n              {/* No grid wrapper needed */}",
    "{/* Graphics & Details Section */}\n              <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6 w-full\">"
)

app_code = app_code.replace(
    "                  </div>\n                </div>\n\n                {/* Branch Performance */}",
    "                  </div>\n                </div>\n              </div>\n\n                {/* Branch Performance */}"
)

# Write it back
with open('src/App.tsx', 'w') as f:
    f.write(app_code)

print("Dashboard redesigned!")
