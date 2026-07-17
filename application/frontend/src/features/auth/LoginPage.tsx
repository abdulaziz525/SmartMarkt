import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { LogIn, AlertTriangle, Loader2 } from 'lucide-react';

const ar = {
  title: 'تسجيل الدخول إلى SmartMarkt',
  subtitle: 'أدخل بريدك الإلكتروني أو اسم المستخدم للمتابعة',
  identifierLabel: 'البريد الإلكتروني أو اسم المستخدم',
  identifierPlaceholder: 'البريد الإلكتروني أو اسم المستخدم',
  passwordLabel: 'كلمة المرور',
  passwordPlaceholder: '••••••••',
  loginButton: 'تسجيل الدخول',
  loginButtonLoading: 'جارٍ تسجيل الدخول...',
  signupPrompt: 'ليس لديك حساب؟',
  signupLink: 'أنشئ مؤسسة جديدة',
  defaultError: 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.'
};

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await apiService.login(loginIdentifier, loginPassword);
      onLogin();
    } catch (err: any) {
      setError(err.message || ar.defaultError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Branding and Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-6">
            <span className="font-extrabold text-3xl text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" dir="rtl">{ar.title}</h1>
          <p className="text-slate-400 text-sm" dir="rtl">{ar.subtitle}</p>
        </div>

        {/* Form Card */}
        <form 
          onSubmit={handleLoginSubmit} 
          className="w-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm rounded-2xl p-8 shadow-xl"
        >
          <div className="space-y-5">
            <div className="space-y-2 text-right" dir="rtl">
              <label className="block text-sm font-semibold text-slate-300">
                {ar.identifierLabel}
              </label>
              <input 
                type="text" 
                name="username" 
                placeholder={ar.identifierPlaceholder} 
                required 
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left"
                dir="ltr"
              />
            </div>
            
            <div className="space-y-2 text-right" dir="rtl">
              <label className="block text-sm font-semibold text-slate-300">
                {ar.passwordLabel}
              </label>
              <input 
                type="password" 
                name="password" 
                placeholder={ar.passwordPlaceholder} 
                required 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-left"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm" dir="rtl">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
              dir="rtl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {ar.loginButtonLoading}
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  {ar.loginButton}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Signup Prompt */}
        <div className="mt-6 text-center text-sm" dir="rtl">
          <p className="text-slate-400">
            {ar.signupPrompt} <a href="/signup" className="font-semibold text-indigo-400 hover:text-indigo-300">{ar.signupLink}</a>
          </p>
        </div>
      </div>
    </div>
  );
};
