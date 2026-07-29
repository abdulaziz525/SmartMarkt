const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components', 'dashboard');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// 1. BranchAlertsWidget
fs.writeFileSync(path.join(componentsDir, 'BranchAlertsWidget.tsx'), `
import React from 'react';
import { AlertTriangle, Maximize2 } from 'lucide-react';

interface BranchAlertsWidgetProps {
  allBranchesAlerts: any[];
  lang: string;
  onFocus?: () => void;
  isDashboardEditing?: boolean;
}

export const BranchAlertsWidget: React.FC<BranchAlertsWidgetProps> = ({ allBranchesAlerts, lang, onFocus, isDashboardEditing }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm h-full flex flex-col relative group">
      {onFocus && !isDashboardEditing && (
        <button onClick={onFocus} className="absolute top-3 right-3 p-1.5 bg-slate-800/80 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition z-10">
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
      <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center gap-2 pr-12">
        <AlertTriangle className="h-5 w-5 text-slate-400" />
        <h3 className="font-bold text-slate-200 text-sm">
          {lang === 'ar' ? 'تنبيهات فروع المتجر' : 'Store Branches Alerts'}
        </h3>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[300px]">
          <thead>
            <tr className="bg-slate-800/50 text-xs text-slate-400 border-b border-slate-800">
              <th className={\`p-3 font-semibold \${lang === 'ar' ? 'text-right' : 'text-left'}\`}>{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
              <th className="p-3 font-semibold text-center text-red-400">{lang === 'ar' ? 'تحذير حرج (يوم أو أقل)' : 'Critical (1 day or less)'}</th>
              <th className="p-3 font-semibold text-center text-amber-400">{lang === 'ar' ? 'تنبيه (5 أيام أو مخزون منخفض)' : 'Warning (5 days / qty <= 10)'}</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {allBranchesAlerts.map((a: any) => (
              <tr key={a.storeId} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className={\`p-3 font-bold text-slate-200 \${lang === 'ar' ? 'text-right' : 'text-left'}\`}>
                  {lang === 'ar' ? a.nameAr : a.nameEn}
                </td>
                <td className="p-3 text-center">
                  {a.redCount > 0 ? (
                    <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full border border-red-500/30 font-mono font-bold animate-pulse inline-block">
                      {a.redCount}
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {a.yellowCount > 0 ? (
                    <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30 font-mono font-bold inline-block">
                      {a.yellowCount}
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
`);

// 2. MetricCardWidget
fs.writeFileSync(path.join(componentsDir, 'MetricCardWidget.tsx'), `
import React from 'react';
import { Maximize2, TrendingUp } from 'lucide-react';

interface MetricCardWidgetProps {
  title: string;
  value: string | number;
  suffix?: string;
  subtitle?: React.ReactNode;
  colorClass: string; // e.g., 'indigo', 'emerald', 'purple', 'amber'
  lang: string;
  onFocus?: () => void;
  isDashboardEditing?: boolean;
}

export const MetricCardWidget: React.FC<MetricCardWidgetProps> = ({ title, value, suffix, subtitle, colorClass, lang, onFocus, isDashboardEditing }) => {
  const colorMap: Record<string, { bg: string, text: string }> = {
    indigo: { bg: 'bg-indigo-500/5', text: 'text-indigo-400' },
    purple: { bg: 'bg-purple-500/5', text: 'text-purple-400' },
    emerald: { bg: 'bg-emerald-500/5', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/5', text: 'text-amber-400' },
  };

  const colors = colorMap[colorClass] || colorMap.indigo;

  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group h-full flex flex-col justify-center">
      <div className={\`absolute right-0 top-0 h-24 w-24 \${colors.bg} rounded-full blur-xl transition group-hover:scale-110\`}></div>
      
      {onFocus && !isDashboardEditing && (
        <button onClick={onFocus} className="absolute top-3 right-3 p-1.5 bg-slate-800/80 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition z-10">
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider pr-8 relative z-10">
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold text-white relative z-10">
        {value} {suffix && <span className={\`text-sm font-semibold \${colors.text}\`}>{suffix}</span>}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-slate-500 relative z-10">
          {subtitle}
        </div>
      )}
    </div>
  );
};
`);

// 3. SalesChartWidget
fs.writeFileSync(path.join(componentsDir, 'SalesChartWidget.tsx'), `
import React from 'react';
import { Maximize2 } from 'lucide-react';

interface SalesChartWidgetProps {
  salesHistory: any[];
  maxSalesVal: number;
  lang: string;
  onFocus?: () => void;
  isDashboardEditing?: boolean;
}

export const SalesChartWidget: React.FC<SalesChartWidgetProps> = ({ salesHistory, maxSalesVal, lang, onFocus, isDashboardEditing }) => {
  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4 h-full flex flex-col relative group">
      {onFocus && !isDashboardEditing && (
        <button onClick={onFocus} className="absolute top-3 right-3 p-1.5 bg-slate-800/80 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition z-10">
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center justify-between pr-8">
        <h3 className="text-lg font-bold text-white">
          {lang === 'ar' ? 'أداء المبيعات والأرباح (آخر 7 أيام)' : 'Sales & Profits (Last 7 Days)'}
        </h3>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
            <span className="h-3 w-3 rounded bg-indigo-500 inline-block"></span>
            {lang === 'ar' ? 'المبيعات' : 'Sales'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="h-3 w-3 rounded bg-emerald-500 inline-block"></span>
            {lang === 'ar' ? 'الأرباح' : 'Profit'}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-800">
        {salesHistory.map((item, idx) => {
          const salesHeight = (item.sales / maxSalesVal) * 80;
          const profitHeight = (item.profit / maxSalesVal) * 80;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group/bar">
              <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-xs hidden group-hover/bar:block z-10 shadow-xl min-w-[100px]">
                <div className="font-semibold text-slate-300">{item.date}</div>
                <div className="text-indigo-400">{lang === 'ar' ? 'مبيعات:' : 'Sales:'} {item.sales}</div>
                <div className="text-emerald-400">{lang === 'ar' ? 'أرباح:' : 'Profit:'} {item.profit}</div>
              </div>

              <div className="w-full flex items-end gap-1 justify-center h-full min-h-[100px]">
                <div 
                  className="w-4 sm:w-6 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all group-hover/bar:brightness-125"
                  style={{ height: \`\${Math.max(4, salesHeight)}%\` }}
                ></div>
                <div 
                  className="w-4 sm:w-6 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all group-hover/bar:brightness-125"
                  style={{ height: \`\${Math.max(4, profitHeight)}%\` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-2 text-center overflow-ellipsis w-full truncate block whitespace-nowrap">
                {item.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`);

// 4. BestSellersWidget
fs.writeFileSync(path.join(componentsDir, 'BestSellersWidget.tsx'), `
import React from 'react';
import { Maximize2 } from 'lucide-react';

interface BestSellersWidgetProps {
  bestSellers: any[];
  lang: string;
  onFocus?: () => void;
  isDashboardEditing?: boolean;
}

export const BestSellersWidget: React.FC<BestSellersWidgetProps> = ({ bestSellers, lang, onFocus, isDashboardEditing }) => {
  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4 h-full overflow-hidden flex flex-col relative group">
      {onFocus && !isDashboardEditing && (
        <button onClick={onFocus} className="absolute top-3 right-3 p-1.5 bg-slate-800/80 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition z-10">
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      <h3 className="text-lg font-bold text-white pr-8">
        {lang === 'ar' ? 'المنتجات الأكثر مبيعاً' : 'Best Selling Products'}
      </h3>
      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
        {bestSellers.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-8">
            {lang === 'ar' ? 'لا توجد بيانات مبيعات كافية' : 'No sales data yet'}
          </p>
        ) : (
          bestSellers.map((item, idx) => {
            const totalBestQty = Math.max(...bestSellers.map(b => b.qty), 1);
            const progress = (item.qty / totalBestQty) * 100;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="font-mono flex-shrink-0">{item.qty} {lang === 'ar' ? 'وحدة' : 'units'}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{ width: \`\${progress}%\` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
`);

// 5. BranchPerformanceWidget
fs.writeFileSync(path.join(componentsDir, 'BranchPerformanceWidget.tsx'), `
import React from 'react';
import { Maximize2 } from 'lucide-react';

interface BranchPerformanceWidgetProps {
  branchMetrics: any[];
  lang: string;
  onFocus?: () => void;
  isDashboardEditing?: boolean;
}

export const BranchPerformanceWidget: React.FC<BranchPerformanceWidgetProps> = ({ branchMetrics, lang, onFocus, isDashboardEditing }) => {
  return (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4 h-full flex flex-col relative group">
      {onFocus && !isDashboardEditing && (
        <button onClick={onFocus} className="absolute top-3 right-3 p-1.5 bg-slate-800/80 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition z-10">
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      <h3 className="text-lg font-bold text-white pr-8">
        {lang === 'ar' ? 'أداء الفروع' : 'Branch Performance'}
      </h3>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-right border-collapse min-w-[400px]">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-800">
              <th className="p-3">{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
              <th className="p-3 font-mono">{lang === 'ar' ? 'المبيعات' : 'Sales'}</th>
              <th className="p-3 font-mono">{lang === 'ar' ? 'الأرباح' : 'Profit'}</th>
              <th className="p-3">{lang === 'ar' ? 'المنتج الأكثر مبيعاً' : 'Best Seller'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {branchMetrics.map((branch, idx) => (
              <tr key={idx} className="hover:bg-slate-900/60 transition">
                <td className="p-3 font-bold text-slate-200">{branch.name}</td>
                <td className="p-3 font-mono font-bold text-indigo-400">{branch.sales.toFixed(2)} SAR</td>
                <td className="p-3 font-mono font-bold text-emerald-400">{branch.profit.toFixed(2)} SAR</td>
                <td className="p-3 text-xs text-slate-400">{branch.bestSeller}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
`);

// 6. WidgetOverlayModal
fs.writeFileSync(path.join(componentsDir, 'WidgetOverlayModal.tsx'), `
import React from 'react';
import { X } from 'lucide-react';

interface WidgetOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const WidgetOverlayModal: React.FC<WidgetOverlayModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
      {/* Dimmed Background */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col bg-slate-950 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-slate-800 text-slate-300 hover:text-white rounded-full shadow-lg border border-slate-700 hover:bg-slate-700 transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 w-full h-full overflow-hidden rounded-2xl p-2 bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
};
`);

console.log('Components generated successfully.');
