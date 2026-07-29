import { useState } from 'react';
import { Plus, Building2, MapPin, Edit3, Trash2, X } from 'lucide-react';
import type { Branch, UserRole } from '../types';
import { apiService } from '../services/api';

interface BranchManagementProps {
  branches: Branch[];
  refreshData: () => Promise<void>;
  lang: 'ar' | 'en';
  hasAccess: (roles: UserRole[]) => boolean;
}

export function BranchManagement({ branches, refreshData, lang, hasAccess }: BranchManagementProps) {
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({ nameAr: '', nameEn: '', location: '', status: 'active' as 'active' | 'inactive' });

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'إدارة الفروع' : 'Branch Management'}</h3>
          <p className="text-xs text-slate-400">{lang === 'ar' ? `${branches.length} فرع مسجل في المؤسسة` : `${branches.length} branch(es) in your organization`}</p>
        </div>
        {hasAccess(['owner']) && (
          <button
            onClick={() => {
              setEditingBranch(null);
              setBranchForm({ nameAr: '', nameEn: '', location: '', status: 'active' });
              setIsBranchModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm"
          >
            <Plus className="h-4 w-4" />
            {lang === 'ar' ? 'إضافة فرع جديد' : 'Add Branch'}
          </button>
        )}
      </div>

      {/* Branches List */}
      {branches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <Building2 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">{lang === 'ar' ? 'لا يوجد فروع مسجلة بعد' : 'No branches registered yet'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:border-slate-700 transition group">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${branch.status === 'active' ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                  <Building2 className={`h-5 w-5 ${branch.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{lang === 'ar' ? branch.nameAr : branch.nameEn}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${branch.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {branch.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Inactive')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <p className="text-xs text-slate-400">{branch.location}</p>
                  </div>

                  <div className="flex items-center mt-1.5">
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                      {lang === 'ar' ? 'المعرف:' : 'ID:'} {branch.id}
                    </span>
                  </div>
                </div>
              </div>
              {hasAccess(['owner']) && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      setEditingBranch(branch);
                      setBranchForm({ nameAr: branch.nameAr, nameEn: branch.nameEn, location: branch.location, status: branch.status });
                      setIsBranchModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 transition"
                    title={lang === 'ar' ? 'تعديل' : 'Edit'}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(lang === 'ar' ? `هل تريد حذف الفرع "${branch.nameAr}"؟ سيتم حذف جميع بياناته.` : `Delete branch "${branch.nameEn}"? All data will be removed.`)) return;
                      await apiService.deleteBranch(branch.id);
                      await refreshData();
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {editingBranch ? (lang === 'ar' ? 'تعديل الفرع' : 'Edit Branch') : (lang === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch')}
                </h3>
              </div>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">{lang === 'ar' ? 'اسم الفرع' : 'Branch Name'}</label>
                <input
                  type="text"
                  value={branchForm.nameAr || branchForm.nameEn}
                  onChange={e => setBranchForm(p => ({ ...p, nameAr: e.target.value, nameEn: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder={lang === 'ar' ? "مثل: الفرع الرئيسي" : "e.g. Main Branch"}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">{lang === 'ar' ? 'العنوان المختصر' : 'Short Address'}</label>
                <input
                  type="text"
                  value={branchForm.location}
                  onChange={e => setBranchForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder={lang === 'ar' ? 'الرياض، حي العليا' : 'Riyadh, Al Olaya'}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">{lang === 'ar' ? 'الحالة' : 'Status'}</label>
                <div className="flex gap-2">
                  {(['active', 'inactive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBranchForm(p => ({ ...p, status: s }))}
                      className={`flex-1 py-2 rounded-lg border font-semibold text-xs transition ${
                        branchForm.status === s
                          ? s === 'active' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {s === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Inactive')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (!branchForm.nameAr || !branchForm.nameEn || !branchForm.location) {
                    alert(lang === 'ar' ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields');
                    return;
                  }
                  const branchData: Branch = {
                    id: editingBranch?.id || `branch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    nameAr: branchForm.nameAr,
                    nameEn: branchForm.nameEn,
                    location: branchForm.location,
                    status: branchForm.status,
                  };
                  await apiService.saveBranch(branchData);
                  setIsBranchModalOpen(false);
                  await refreshData();
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/20"
              >
                {editingBranch ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'إنشاء الفرع' : 'Create Branch')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
