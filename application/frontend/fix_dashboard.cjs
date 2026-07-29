const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Update default layout to include 'branch' and use rowHeight=40
content = content.replace(
  /const defaultDashboardLayouts = \{[\s\S]*?\};\n  const \[dashboardLayouts, setDashboardLayouts\] = useState/m,
  `const defaultDashboardLayouts = {
    lg: [
      { i: "alerts", x: 0, y: 0, w: 12, h: 4, static: false },
      { i: "metric1", x: 0, y: 4, w: 3, h: 4 },
      { i: "metric2", x: 3, y: 4, w: 3, h: 4 },
      { i: "metric3", x: 6, y: 4, w: 3, h: 4 },
      { i: "metric4", x: 9, y: 4, w: 3, h: 4 },
      { i: "chart", x: 0, y: 8, w: 8, h: 9 },
      { i: "bestsellers", x: 8, y: 8, w: 4, h: 9 },
      { i: "branch", x: 0, y: 17, w: 12, h: 7 }
    ],
    md: [
      { i: "alerts", x: 0, y: 0, w: 12, h: 4 },
      { i: "metric1", x: 0, y: 4, w: 6, h: 4 },
      { i: "metric2", x: 6, y: 4, w: 6, h: 4 },
      { i: "metric3", x: 0, y: 8, w: 6, h: 4 },
      { i: "metric4", x: 6, y: 8, w: 6, h: 4 },
      { i: "chart", x: 0, y: 12, w: 12, h: 9 },
      { i: "bestsellers", x: 0, y: 21, w: 12, h: 9 },
      { i: "branch", x: 0, y: 30, w: 12, h: 7 }
    ],
    sm: [
      { i: "alerts", x: 0, y: 0, w: 12, h: 5 },
      { i: "metric1", x: 0, y: 5, w: 12, h: 4 },
      { i: "metric2", x: 0, y: 9, w: 12, h: 4 },
      { i: "metric3", x: 0, y: 13, w: 12, h: 4 },
      { i: "metric4", x: 0, y: 17, w: 12, h: 4 },
      { i: "chart", x: 0, y: 21, w: 12, h: 9 },
      { i: "bestsellers", x: 0, y: 30, w: 12, h: 9 },
      { i: "branch", x: 0, y: 39, w: 12, h: 7 }
    ]
  };
  const [dashboardLayouts, setDashboardLayouts] = useState`
);

content = content.replace(
  `          {activeTab === 'dashboard' && (
            <div className="space-y-6">`,
  `          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-indigo-400" />
                  {lang === 'ar' ? 'لوحة القيادة التفاعلية' : 'Dynamic Dashboard'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if(confirm(lang === 'ar' ? 'هل أنت متأكد من إعادة ضبط التخطيط؟' : 'Reset layout to default?')) {
                        setDashboardLayouts(defaultDashboardLayouts);
                        localStorage.setItem('smartmarkt_dashboard_layout', JSON.stringify(defaultDashboardLayouts));
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  >
                    {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
                  </button>
                  <button
                    onClick={() => setIsDashboardEditing(!isDashboardEditing)}
                    className={\`px-4 py-1.5 rounded-lg text-xs font-bold transition \${isDashboardEditing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}\`}
                  >
                    {isDashboardEditing ? (lang === 'ar' ? 'حفظ التخطيط' : 'Save Layout') : (lang === 'ar' ? 'تعديل التخطيط' : 'Edit Layout')}
                  </button>
                </div>
              </div>

              <style>
                {\`
                  .dashboard-editing .react-grid-item {
                    border: 2px dashed #4f46e5 !important;
                    border-radius: 1rem;
                    background: rgba(30, 41, 59, 0.5);
                  }
                  .react-grid-item > div {
                    height: 100%;
                  }
                  .react-grid-item .react-resizable-handle {
                    opacity: 0;
                    transition: opacity 0.2s;
                  }
                  .dashboard-editing .react-grid-item:hover .react-resizable-handle {
                    opacity: 1;
                  }
                \`}
              </style>

              <ResponsiveGridLayout
                className={\`layout \${isDashboardEditing ? 'dashboard-editing' : ''}\`}
                layouts={dashboardLayouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
                rowHeight={40}
                onLayoutChange={onLayoutChange}
                isDraggable={isDashboardEditing}
                isResizable={isDashboardEditing}
                margin={[16, 16]}
                useCSSTransforms={true}
              >`
);

content = content.replace(
  /\{\/\* Branch Alerts Table \*\/\}\n\s*\{allBranchesAlerts\.length > 0 && \(\n\s*<div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">/,
  `{/* Branch Alerts Table */}
              {allBranchesAlerts.length > 0 ? (
                <div key="alerts" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">`
);
content = content.replace(
  /<\/table>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/,
  `</table>
                  </div>
                  </div>
                </div>
              ) : <div key="alerts" style={{display: 'none'}}></div>}`
);

// Metrics
content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">/,
  `{/* No grid wrapper needed */}`
);
content = content.replace(
  /<div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">/,
  `<div key="metric1" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group h-full flex flex-col justify-center">`
);
content = content.replace(
  /<div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">/,
  `</div>
                </div>

                <div key="metric2" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group h-full flex flex-col justify-center">`
);
content = content.replace(
  /<div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">/,
  `</div>
                </div>

                <div key="metric3" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group h-full flex flex-col justify-center">`
);
content = content.replace(
  /<div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">/,
  `</div>
                </div>

                <div key="metric4" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group h-full flex flex-col justify-center">`
);
content = content.replace(
  /After COGS and VAT deduction'\}\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/,
  `After COGS and VAT deduction'}
                  </div>
                  </div>
                </div>`
);

// Chart and Best sellers
content = content.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/,
  `{/* No grid wrapper needed */}`
);
content = content.replace(
  /<div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm lg:col-span-2 space-y-4">/,
  `<div key="chart" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4 h-full flex flex-col">`
);
content = content.replace(
  /<div className="h-64 w-full flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-800">/,
  `<div className="flex-1 w-full flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-800">`
);
content = content.replace(
  /<\/div>\n\s*<\/div>\n\s*\{\/\* Best Selling Products \*\/\}/,
  `</div>
                  </div>
                </div>

                {/* Best Selling Products */}`
);

content = content.replace(
  /<div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">/,
  `<div key="bestsellers" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4 h-full overflow-hidden flex flex-col">`
);
content = content.replace(
  /<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\{\/\* Branch Performance \*\/\}/,
  `</div>
                  </div>
                </div>

                {/* Branch Performance */}`
);

// Branch Performance
content = content.replace(
  /\{hasAccess\(\['owner', 'manager'\]\) && branchMetrics\.length > 0 && \(\n\s*<div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4 lg:col-span-3 mt-6">/,
  `{hasAccess(['owner', 'manager']) && branchMetrics.length > 0 ? (
                <div key="branch" className={\`w-full h-full \${isDashboardEditing ? 'cursor-move' : ''}\`}>
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4 h-full flex flex-col">`
);
content = content.replace(
  /<\/table>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\)\}/,
  `</table>
                  </div>
                  </div>
                </div>
              ) : <div key="branch" style={{display: 'none'}}></div>}
              </ResponsiveGridLayout>
            </div>
          )}`
);

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx modified successfully.");
