import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

imports = """
import { BranchAlertsWidget } from './components/dashboard/BranchAlertsWidget';
import { MetricCardWidget } from './components/dashboard/MetricCardWidget';
import { SalesChartWidget } from './components/dashboard/SalesChartWidget';
import { BestSellersWidget } from './components/dashboard/BestSellersWidget';
import { BranchPerformanceWidget } from './components/dashboard/BranchPerformanceWidget';
import { WidgetOverlayModal } from './components/dashboard/WidgetOverlayModal';
"""

if 'BranchAlertsWidget' not in content:
    idx = content.rfind('import ')
    end_idx = content.find('\\n', idx)
    content = content[:end_idx+1] + imports + content[end_idx+1:]

if 'focusedWidget' not in content:
    content = content.replace(
        'const [isDashboardEditing, setIsDashboardEditing] = useState(false);',
        'const [isDashboardEditing, setIsDashboardEditing] = useState(false);\\n  const [focusedWidget, setFocusedWidget] = useState<string | null>(null);'
    )

start_marker = "{/* ========================================================\\n              TAB: DASHBOARD\\n              ======================================================== */}\\n          {activeTab === 'dashboard' && ("
end_marker = "{/* ========================================================\\n              TAB: POS SALES SCREEN\\n              ======================================================== */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_dashboard = """{/* ========================================================
              TAB: DASHBOARD
              ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 relative">
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
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${isDashboardEditing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {isDashboardEditing ? (lang === 'ar' ? 'حفظ التخطيط' : 'Save Layout') : (lang === 'ar' ? 'تعديل التخطيط' : 'Edit Layout')}
                  </button>
                </div>
              </div>

              <style>
                {`
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
                `}
              </style>

              <ResponsiveGridLayout
                className={`layout ${isDashboardEditing ? 'dashboard-editing' : ''}`}
                layouts={dashboardLayouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
                rowHeight={40}
                onLayoutChange={onLayoutChange}
                isDraggable={isDashboardEditing}
                isResizable={isDashboardEditing}
                margin={[16, 16]}
                useCSSTransforms={true}
              >
                {allBranchesAlerts.length > 0 ? (
                  <div key="alerts" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                    <BranchAlertsWidget 
                      allBranchesAlerts={allBranchesAlerts} 
                      lang={lang} 
                      onFocus={() => setFocusedWidget('alerts')}
                      isDashboardEditing={isDashboardEditing} 
                    />
                  </div>
                ) : <div key="alerts" style={{display: 'none'}}></div>}

                <div key="metric1" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                  <MetricCardWidget
                    title={lang === 'ar' ? 'مبيعات اليوم المحققة' : 'Today\\'s Total Sales'}
                    value={filteredInvoices.reduce((a, c) => a + c.total, 0).toFixed(2)}
                    suffix={getTrans('currency')}
                    subtitle={
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>+12% {lang === 'ar' ? 'منذ الأمس' : 'vs yesterday'}</span>
                      </div>
                    }
                    colorClass="indigo"
                    lang={lang}
                    onFocus={() => setFocusedWidget('metric1')}
                    isDashboardEditing={isDashboardEditing}
                  />
                </div>

                <div key="metric2" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                  <MetricCardWidget
                    title={lang === 'ar' ? 'عدد فواتير المبيعات' : 'Sales Invoice Count'}
                    value={filteredInvoices.length}
                    suffix={lang === 'ar' ? 'فاتورة' : 'bills'}
                    subtitle={`${lang === 'ar' ? 'متوسط الفاتورة:' : 'Avg basket:'} ${(filteredInvoices.reduce((a, c) => a + c.total, 0) / (filteredInvoices.length || 1)).toFixed(1)} ${getTrans('currency')}`}
                    colorClass="purple"
                    lang={lang}
                    onFocus={() => setFocusedWidget('metric2')}
                    isDashboardEditing={isDashboardEditing}
                  />
                </div>

                <div key="metric3" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                  <MetricCardWidget
                    title={lang === 'ar' ? 'ضريبة القيمة المضافة المحصلة' : 'Total VAT Collected (15%)'}
                    value={filteredInvoices.reduce((a, c) => a + c.vatAmount, 0).toFixed(2)}
                    suffix={getTrans('currency')}
                    subtitle={lang === 'ar' ? 'جاهزة للإقرار الضريبي' : 'ZATCA Compliance active'}
                    colorClass="emerald"
                    lang={lang}
                    onFocus={() => setFocusedWidget('metric3')}
                    isDashboardEditing={isDashboardEditing}
                  />
                </div>

                <div key="metric4" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                  <MetricCardWidget
                    title={lang === 'ar' ? 'إجمالي الأرباح الصافية (تقديري)' : 'Estimated Net Profit'}
                    value={reportMetrics.netProfit.toFixed(2)}
                    suffix={getTrans('currency')}
                    subtitle={lang === 'ar' ? 'بعد استقطاع التكاليف والضرائب' : 'After COGS and VAT deduction'}
                    colorClass="amber"
                    lang={lang}
                    onFocus={() => setFocusedWidget('metric4')}
                    isDashboardEditing={isDashboardEditing}
                  />
                </div>

                <div key="chart" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                  <SalesChartWidget
                    salesHistory={salesHistory}
                    maxSalesVal={maxSalesVal}
                    lang={lang}
                    onFocus={() => setFocusedWidget('chart')}
                    isDashboardEditing={isDashboardEditing}
                  />
                </div>

                <div key="bestsellers" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                  <BestSellersWidget
                    bestSellers={bestSellers}
                    lang={lang}
                    onFocus={() => setFocusedWidget('bestsellers')}
                    isDashboardEditing={isDashboardEditing}
                  />
                </div>

                {hasAccess(['owner', 'manager']) && branchMetrics.length > 0 ? (
                  <div key="branch" className={`w-full h-full ${isDashboardEditing ? 'cursor-move' : ''}`}>
                    <BranchPerformanceWidget
                      branchMetrics={branchMetrics}
                      lang={lang}
                      onFocus={() => setFocusedWidget('branch')}
                      isDashboardEditing={isDashboardEditing}
                    />
                  </div>
                ) : <div key="branch" style={{display: 'none'}}></div>}
              </ResponsiveGridLayout>

              <WidgetOverlayModal isOpen={focusedWidget !== null} onClose={() => setFocusedWidget(null)}>
                {focusedWidget === 'alerts' && <BranchAlertsWidget allBranchesAlerts={allBranchesAlerts} lang={lang} isDashboardEditing={false} />}
                {focusedWidget === 'metric1' && (
                  <MetricCardWidget
                    title={lang === 'ar' ? 'مبيعات اليوم المحققة' : 'Today\\'s Total Sales'}
                    value={filteredInvoices.reduce((a, c) => a + c.total, 0).toFixed(2)}
                    suffix={getTrans('currency')}
                    subtitle={
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>+12% {lang === 'ar' ? 'منذ الأمس' : 'vs yesterday'}</span>
                      </div>
                    }
                    colorClass="indigo"
                    lang={lang}
                    isDashboardEditing={false}
                  />
                )}
                {focusedWidget === 'metric2' && (
                  <MetricCardWidget
                    title={lang === 'ar' ? 'عدد فواتير المبيعات' : 'Sales Invoice Count'}
                    value={filteredInvoices.length}
                    suffix={lang === 'ar' ? 'فاتورة' : 'bills'}
                    subtitle={`${lang === 'ar' ? 'متوسط الفاتورة:' : 'Avg basket:'} ${(filteredInvoices.reduce((a, c) => a + c.total, 0) / (filteredInvoices.length || 1)).toFixed(1)} ${getTrans('currency')}`}
                    colorClass="purple"
                    lang={lang}
                    isDashboardEditing={false}
                  />
                )}
                {focusedWidget === 'metric3' && (
                  <MetricCardWidget
                    title={lang === 'ar' ? 'ضريبة القيمة المضافة المحصلة' : 'Total VAT Collected (15%)'}
                    value={filteredInvoices.reduce((a, c) => a + c.vatAmount, 0).toFixed(2)}
                    suffix={getTrans('currency')}
                    subtitle={lang === 'ar' ? 'جاهزة للإقرار الضريبي' : 'ZATCA Compliance active'}
                    colorClass="emerald"
                    lang={lang}
                    isDashboardEditing={false}
                  />
                )}
                {focusedWidget === 'metric4' && (
                  <MetricCardWidget
                    title={lang === 'ar' ? 'إجمالي الأرباح الصافية (تقديري)' : 'Estimated Net Profit'}
                    value={reportMetrics.netProfit.toFixed(2)}
                    suffix={getTrans('currency')}
                    subtitle={lang === 'ar' ? 'بعد استقطاع التكاليف والضرائب' : 'After COGS and VAT deduction'}
                    colorClass="amber"
                    lang={lang}
                    isDashboardEditing={false}
                  />
                )}
                {focusedWidget === 'chart' && <SalesChartWidget salesHistory={salesHistory} maxSalesVal={maxSalesVal} lang={lang} isDashboardEditing={false} />}
                {focusedWidget === 'bestsellers' && <BestSellersWidget bestSellers={bestSellers} lang={lang} isDashboardEditing={false} />}
                {focusedWidget === 'branch' && <BranchPerformanceWidget branchMetrics={branchMetrics} lang={lang} isDashboardEditing={false} />}
              </WidgetOverlayModal>
            </div>
          )}

          """
    content = content[:start_idx] + new_dashboard + content[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("App.tsx refactored successfully via python script.")
