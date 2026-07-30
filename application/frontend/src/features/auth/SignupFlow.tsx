import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { AlertTriangle, Loader2, ArrowRight, ArrowLeft, User, Store, MailCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ar = {
  title: 'إنشاء مؤسسة جديدة',
  subtitle: 'قم بإعداد حسابك ومؤسستك في خطوتين',
  step1Title: 'تفاصيل الحساب',
  step2Title: 'تفاصيل المؤسسة والفرع',
  fullName: 'الاسم كامل',
  username: 'اسم المستخدم',
  email: 'البريد الإلكتروني',
  password: 'كلمة السر',
  confirmPassword: 'تأكيد كلمة السر',
  organizationName: 'اسم المؤسسة',
  storeName: 'اسم الفرع/المتجر',
  vatNumber: 'الرقم الضريبي أو السجل التجاري',
  phone: 'رقم الجوال',
  address: 'العنوان',
  next: 'التالي',
  back: 'السابق',
  submit: 'إنشاء الحساب',
  loginPrompt: 'لديك حساب بالفعل؟',
  loginLink: 'تسجيل الدخول',
  loading: 'جارٍ العمل...',
  passwordsMismatch: 'كلمات المرور غير متطابقة',
  invalidEmail: 'صيغة البريد الإلكتروني غير صحيحة',
  requiredFields: 'الرجاء تعبئة جميع الحقول المطلوبة',
  verifyEmailTitle: 'التحقق من البريد الإلكتروني',
  verifyEmailSub: 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني',
  verificationCode: 'رمز التحقق',
  verifyAndContinue: 'تحقق وتابع',
  invalidCr: 'رقم السجل التجاري / الرقم الضريبي غير صحيح أو غير مسجل',
  verifyingCr: 'جاري التحقق من الرقم عبر واثق...'
};

export const SignupFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    storeName: '',
    vatNumber: '',
    phone: '',
    address: '',
    verificationCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(ar.requiredFields);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(ar.passwordsMismatch);
      return false;
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      setError(ar.invalidEmail);
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.organizationName || !formData.storeName || !formData.vatNumber || !formData.phone || !formData.address) {
      setError(ar.requiredFields);
      return false;
    }
    setError('');
    return true;
  };

  const handleNextToVerification = async () => {
    if (!validateStep1()) return;
    
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || 'Failed to send code');
      }
      setStep(1.5);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في إرسال الرمز');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      setError(ar.requiredFields);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: formData.verificationCode })
      });
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || 'Invalid code');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1.5) setStep(1);
    else if (step === 2) setStep(1.5);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    setError('');
    
    // Step 2.1: Verify via Wathq
    try {
      const wathqRes = await fetch('/api/auth/wathq-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crNumber: formData.vatNumber })
      });
      
      if (!wathqRes.ok) {
        throw new Error(ar.invalidCr);
      }
      
      const wathqData = await wathqRes.json();
      
      if (!wathqData.valid) {
        throw new Error(ar.invalidCr);
      }
      
      // Verification passed, create account
      await apiService.signup({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        storeName: formData.storeName,
        vatNumber: formData.vatNumber,
        phone: formData.phone,
        address: formData.address
      });
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-6">
            <span className="font-extrabold text-3xl text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" dir="rtl">{ar.title}</h1>
          <p className="text-slate-400 text-sm" dir="rtl">{ar.subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="w-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          {/* Stepper Header */}
          <div className="flex items-center justify-between mb-8" dir="rtl">
            <div className={`flex flex-col items-center gap-2 ${step === 1 || step === 1.5 ? 'text-indigo-400' : (step > 1.5 ? 'text-emerald-400' : 'text-slate-500')}`}>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 ${step === 1 ? 'border-indigo-400 bg-indigo-400/10' : (step > 1 ? 'border-emerald-400 bg-emerald-400/10' : 'border-slate-500')}`}>
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <span className="text-xs font-semibold">{ar.step1Title}</span>
            </div>
            
            <div className={`flex-1 h-px mx-4 ${step > 1 ? 'bg-emerald-400/50' : 'bg-slate-800'}`}></div>
            
            <div className={`flex flex-col items-center gap-2 ${step === 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 ${step === 2 ? 'border-indigo-400 bg-indigo-400/10' : 'border-slate-500'}`}>
                <Store className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">{ar.step2Title}</span>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); }}>
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.fullName}</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.username}</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left" dir="ltr" />
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.email}</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right" dir="rtl">
                    <label className="block text-sm font-semibold text-slate-300">{ar.confirmPassword}</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left" dir="ltr" />
                  </div>
                  <div className="space-y-2 text-right" dir="rtl">
                    <label className="block text-sm font-semibold text-slate-300">{ar.password}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left" dir="ltr" />
                  </div>
                </div>
              </div>
            )}

            {step === 1.5 && (
              <div className="space-y-6 py-4 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2">
                  <MailCheck className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2" dir="rtl">{ar.verifyEmailTitle}</h3>
                  <p className="text-sm text-slate-400" dir="rtl">{ar.verifyEmailSub}<br/><span className="text-white font-mono mt-1 block">{formData.email}</span></p>
                </div>
                
                <div className="w-full space-y-2">
                  <input 
                    type="text" 
                    name="verificationCode" 
                    value={formData.verificationCode} 
                    onChange={handleChange} 
                    placeholder="XXXX"
                    required 
                    maxLength={4}
                    className="w-full max-w-[200px] mx-auto text-center bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-2xl font-mono tracking-[0.5em]" 
                    dir="ltr" 
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.organizationName}</label>
                  <input type="text" name="organizationName" value={formData.organizationName} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.storeName}</label>
                  <input type="text" name="storeName" value={formData.storeName} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.vatNumber}</label>
                  <input type="text" name="vatNumber" value={formData.vatNumber} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left" dir="ltr" />
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.phone}</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left" dir="ltr" />
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <label className="block text-sm font-semibold text-slate-300">{ar.address}</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition" />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm" dir="rtl">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-8 flex gap-4 flex-row-reverse">
              {step === 1 && (
                <button type="button" onClick={handleNextToVerification} disabled={isLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-70">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>{ar.next}</span>}
                  {!isLoading && <ArrowLeft className="h-5 w-5" />}
                </button>
              )}
              
              {step === 1.5 && (
                <>
                  <button type="button" onClick={handleVerifyCode} disabled={isLoading} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-70">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>{ar.verifyAndContinue}</span>}
                  </button>
                  <button type="button" onClick={handleBack} disabled={isLoading} className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    <span>{ar.back}</span>
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <button type="button" onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>{ar.submit}</span>}
                  </button>
                  <button type="button" onClick={handleBack} disabled={isLoading} className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    <span>{ar.back}</span>
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Login Prompt */}
        <div className="mt-6 text-center text-sm" dir="rtl">
          <p className="text-slate-400">
            {ar.loginPrompt} <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">{ar.loginLink}</Link>
          </p>
        </div>

      </div>
    </div>
  );
};
