import React, { useState } from 'react';
import { useAuth, UserRole } from './AuthContext';
import { GraduationCap, ArrowRight, Mail, Lock, User, Loader2, ChevronDown, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge, PrimaryButton, SecondaryButton } from './SharedComponents';

export const LoginPage: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      localStorage.setItem('intended_role', role);
      try {
        if (isRegistering) {
          await signUpWithEmail(cleanEmail, password, name || 'Authorized User', role);
        } else {
          await signInWithEmail(cleanEmail, password);
        }
      } catch (innerErr) {
        localStorage.removeItem('intended_role');
        throw innerErr;
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let message = 'An unexpected error occurred.';
      const errorCode = err.code || '';
      
      if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
        if (role === 'admin') {
          message = 'Administrative credentials rejected. If you are the system architect and haven\'t established a password yet, please use "Google Authority" to bypass and create your master profile.';
        } else {
          message = 'Authentication failed. Please ensure your credentials are correct and that an Administrator has activated your profile in the registry.';
        }
      } else if (errorCode === 'auth/user-not-found') {
        if (role === 'admin') {
          message = 'No administrator record found. Authorized personnel should use Google Login to initialize their system identity.';
        } else {
          message = 'Identity not registered. New Faculty and Student profiles must be established by an Administrator in the central registry first.';
        }
      } else if (errorCode === 'auth/invalid-email') {
        message = 'The email address is improperly formatted.';
      } else if (errorCode === 'auth/too-many-requests') {
        message = 'Security lock: Too many failed attempts. Try again later or reset password.';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address to initialize password recovery.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSuccess('Recovery link dispatched. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle(role);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-stone-100 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-50" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-stone-200/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-30" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white border border-stone-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden relative z-10"
      >
        {/* Left Side - Visual Branding */}
        <div className="hidden md:flex flex-col justify-between p-16 bg-stone-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white text-stone-900 p-3 rounded-2xl shadow-xl">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">SmartUni</h2>
              <p className="font-mono text-[9px] uppercase font-bold tracking-[0.3em] text-stone-500">Academic Infrastructure</p>
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-5xl font-bold tracking-tighter leading-[0.9] mb-8">
              The Intelligent <br /> 
              Campus <br />
              <span className="text-stone-500">Ecosystem.</span>
            </h3>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-400">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-stone-400 text-sm font-medium">Enterprise-grade security & encryption.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-400">
                  <User size={20} />
                </div>
                <p className="text-stone-400 text-sm font-medium">Personalized workspace for all roles.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/5">
            <p className="text-stone-600 font-mono text-[9px] uppercase tracking-[0.4em] font-bold">SmartUni System &copy; 2026</p>
          </div>
          
          {/* Background circle decorative */}
          <div className="absolute -right-20 bottom-1/4 h-64 w-64 border border-white/5 rounded-full" />
        </div>

        {/* Right Side - Auth Form */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="text-center md:text-left mb-12">
            <p className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-stone-400 mb-2">Authenticated Access</p>
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 leading-none">
              {isRegistering ? 'Create Account' : 'System Login'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 shadow-inner group">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 mb-4 ml-1">Portal Clearance</label>
              <div className="relative">
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 pointer-events-none transition-colors" size={20} />
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-6 pr-14 py-5 bg-white border border-stone-200 rounded-[1.5rem] focus:border-stone-900 focus:ring-8 focus:ring-stone-900/5 outline-none transition-all text-sm font-bold text-stone-900 appearance-none shadow-sm cursor-pointer hover:border-stone-400"
                >
                  <option value="student">🎓 Student Registry</option>
                  <option value="faculty">💼 Faculty Council</option>
                  <option value="admin">🗝️ System Administrator</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
                {isRegistering && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative group overflow-hidden">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={20} />
                    <input 
                      type="text" placeholder="Full Legal Name" value={name} required={isRegistering}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-stone-50/50 border border-stone-200 rounded-[1.5rem] focus:border-stone-900 focus:bg-white focus:ring-8 focus:ring-stone-900/5 outline-none transition-all text-sm font-medium hover:border-stone-400"
                    />
                  </motion.div>
                )}
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={20} />
                  <input 
                    type="email" placeholder="Institutional Email" value={email} required
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-stone-50/50 border border-stone-200 rounded-[1.5rem] focus:border-stone-900 focus:bg-white focus:ring-8 focus:ring-stone-900/5 outline-none transition-all text-sm font-medium hover:border-stone-400"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} placeholder="Access Key" value={password} required
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-16 py-5 bg-stone-50/50 border border-stone-200 rounded-[1.5rem] focus:border-stone-900 focus:bg-white focus:ring-8 focus:ring-stone-900/5 outline-none transition-all text-sm font-medium hover:border-stone-400"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-900 transition-colors" tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
            </div>

            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-50 border border-green-100 p-5 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="text-green-600" size={20} />
                  <p className="text-green-800 text-[11px] font-bold uppercase tracking-widest">{success}</p>
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 p-5 rounded-2xl space-y-3">
                  <p className="text-red-700 text-[11px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                  {error.includes('Invalid') && (
                    <button type="button" onClick={handleForgotPassword} className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-stone-400 hover:text-stone-900 underline underline-offset-4 transition-colors">Recover Password</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <PrimaryButton 
              label={isRegistering ? "Generate Identity" : "Initialize Login"} 
              loading={loading} icon={ArrowRight} 
            />

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-stone-400 hover:text-stone-900 transition-colors underline underline-offset-8"
              >
                {isRegistering ? "Return to Secure Login" : "Initialize New Portal Identity"}
              </button>
            </div>

            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t border-stone-100"></div>
              <span className="flex-shrink mx-6 text-stone-300 text-[9px] uppercase font-mono tracking-[0.4em] font-bold">Strategic Auth</span>
              <div className="flex-grow border-t border-stone-100"></div>
            </div>

            <SecondaryButton 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={loading}
              label="Google Authority"
              icon={() => (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            />

            <div className="pt-10 border-t border-stone-50 text-center">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-stone-400 leading-relaxed italic">
                Strategic Access Only. All logins require prior <br /> administrative verification.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-10 left-10 hidden lg:block">
        <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-stone-300 font-bold rotate-90 origin-left translate-x-2">Institutional Grade Software</p>
      </motion.div>
    </div>
  );
};
