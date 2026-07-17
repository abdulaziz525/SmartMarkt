import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { Store, User, Building, MapPin, Phone, Hash, ChevronRight } from 'lucide-react';

interface SetupPageProps {
  onSetupComplete: () => void;
}

export const SetupPage: React.FC<SetupPageProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: User Account details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Organization details
  const [organizationName, setOrganizationName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 3: First Store details
  const [storeName, setStoreName] = useState('');

  const validateStep1 = () => {
    if (!fullName || !email || !password) {
      setError('All fields are required');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!organizationName || !vatNumber || !phone || !address) {
      setError('All fields are required');
      return false;
    }
    // Saudi VAT validation (15 digits, starts and ends with 3)
    const vatRegex = /^3\d{13}3$/;
    if (!vatRegex.test(vatNumber)) {
      setError('VAT number must be 15 digits starting and ending with 3');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNext2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!storeName) {
      setError('Store name is required');
      return;
    }
    setIsLoading(true);

    try {
      await apiService.setupStore({
        fullName,
        email,
        password,
        organizationName,
        storeName,
        nameAr: storeName, // fallback for legacy backend mappings
        nameEn: organizationName, // fallback for legacy backend mappings
        vatNumber,
        phone,
        address
      });
      onSetupComplete();
    } catch (err: any) {
      setError(err.message || 'Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 mb-4 shadow-lg shadow-indigo-600/30">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SmartMarkt</h1>
          <p className="text-slate-400">Let's set up your store and create your owner account.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
          
          {/* Progress Bar */}
          <div className="flex w-full h-1 bg-slate-800 absolute top-0 left-0">
            <div className={`h-full bg-indigo-600 transition-all duration-300 ${
              step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
            }`} />
          </div>

          <div className="p-8">
            {error && (
              <div data-testid="signup-error" className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleNext1} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-xl font-bold text-white">Owner Account Details</h2>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    data-testid="signup-fullname"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Abdullah Al-Ahmadi"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Email Address (Username)</label>
                  <input
                    type="email"
                    required
                    data-testid="signup-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@smartmarkt.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    data-testid="signup-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    required
                    data-testid="signup-confirmpassword"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  data-testid="signup-next-1"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition mt-8"
                >
                  Continue to Organization Details
                  <ChevronRight className="h-5 w-5" />
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleNext2} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <Building className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-xl font-bold text-white">Organization Details</h2>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Organization Name</label>
                  <input
                    type="text"
                    required
                    data-testid="signup-orgname"
                    value={organizationName}
                    onChange={e => setOrganizationName(e.target.value)}
                    placeholder="e.g. Al-Star Enterprises"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-500" /> VAT Number
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="signup-vatnumber"
                    value={vatNumber}
                    onChange={e => setVatNumber(e.target.value)}
                    placeholder="3000..."
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    data-testid="signup-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="05..."
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" /> Main Address
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="signup-address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Riyadh, Saudi Arabia"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    data-testid="signup-back-2"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    data-testid="signup-next-2"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center"
                  >
                    Continue to Store details
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleSetupSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <Building className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-xl font-bold text-white">First Store Setup</h2>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-300">Store Name</label>
                  <input
                    type="text"
                    required
                    data-testid="signup-storename"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="e.g. Star Supermarket - Branch 1"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    data-testid="signup-back-3"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    data-testid="signup-submit"
                    disabled={isLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center disabled:opacity-50"
                  >
                    {isLoading ? 'Setting up...' : 'Complete Setup'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
