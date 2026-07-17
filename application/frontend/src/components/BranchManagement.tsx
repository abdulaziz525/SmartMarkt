import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, MapPin } from 'lucide-react';
import { apiService } from '../services/api';
import type { Branch } from '../types';

interface BranchManagementProps {
  lang: 'ar' | 'en';
}

export function BranchManagement({ lang }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    try {
      const data = await apiService.getBranches();
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const branch: Branch = {
      id: editingBranch?.id || `b-${Date.now()}`,
      nameAr: formData.get('nameAr') as string,
      nameEn: formData.get('nameEn') as string,
      location: formData.get('location') as string,
      status: (formData.get('status') as 'active' | 'inactive') || 'active',
    };

    await apiService.saveBranch(branch);
    setIsModalOpen(false);
    setEditingBranch(null);
    fetchBranches();
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الفرع؟' : 'Are you sure you want to delete this branch?')) {
      await apiService.deleteBranch(id);
      fetchBranches();
    }
  };

  if (isLoading) {
    return <div className="text-slate-400">{lang === 'ar' ? 'جاري التحميل...' : 'Loading branches...'}</div>;
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{lang === 'ar' ? 'إدارة الفروع' : 'Branch Management'}</h3>
          <p className="text-xs text-slate-400">{lang === 'ar' ? 'إضافة وتعديل فروع المتجر' : 'Manage store branches'}</p>
        </div>
        <button
          onClick={() => {
            setEditingBranch(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition"
        >
          <Plus className="h-4 w-4" />
          {lang === 'ar' ? 'إضافة فرع' : 'Add Branch'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map(branch => (
          <div key={branch.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-200">{lang === 'ar' ? branch.nameAr : branch.nameEn}</h4>
                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${branch.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                  {branch.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="h-4 w-4" />
                {branch.location}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingBranch(branch);
                  setIsModalOpen(true);
                }}
                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(branch.id)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">
              {editingBranch
                ? (lang === 'ar' ? 'تعديل الفرع' : 'Edit Branch')
                : (lang === 'ar' ? 'فرع جديد' : 'New Branch')}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-slate-300 text-sm">
              <div className="space-y-1">
                <label className="font-bold">{lang === 'ar' ? 'الاسم (بالعربية)' : 'Name (Arabic)'}</label>
                <input
                  type="text"
                  name="nameAr"
                  required
                  defaultValue={editingBranch?.nameAr || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold">{lang === 'ar' ? 'الاسم (بالإنجليزية)' : 'Name (English)'}</label>
                <input
                  type="text"
                  name="nameEn"
                  required
                  defaultValue={editingBranch?.nameEn || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold">{lang === 'ar' ? 'الموقع / العنوان' : 'Location / Address'}</label>
                <input
                  type="text"
                  name="location"
                  required
                  defaultValue={editingBranch?.location || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold">{lang === 'ar' ? 'الحالة' : 'Status'}</label>
                <select
                  name="status"
                  defaultValue={editingBranch?.status || 'active'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{lang === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
                >
                  {lang === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
