import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export const Header = ({ title, subtitle, category = "Academic Portal" }: { title: string, subtitle: string, category?: string }) => (
  <div className="mb-12">
    <p className="font-mono text-[11px] uppercase font-bold tracking-[0.4em] text-stone-400 mb-4">{category}</p>
    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 leading-[1.1]">{title}</h1>
    <p className="text-stone-500 text-lg font-medium mt-6 max-w-2xl leading-relaxed">{subtitle}</p>
  </div>
);

export const StatCard = ({ label, value, icon, index = 0 }: { label: string, value: string | number, icon: React.ReactNode, index?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-8 group hover:border-stone-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all cursor-default"
  >
    <div className="h-14 w-14 rounded-2xl bg-stone-50/50 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-stone-100">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-mono uppercase font-bold tracking-[0.3em] text-stone-400 mb-3">{label}</p>
      <h4 className="text-4xl font-bold tracking-tight text-stone-900 leading-none">{value}</h4>
    </div>
  </motion.div>
);

export const SectionTitle = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-5 mb-10">
    <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-stone-600 border border-stone-200/60 shadow-sm">
      {icon}
    </div>
    <h2 className="font-bold text-stone-900 tracking-tight text-xl leading-snug">{title}</h2>
  </div>
);

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-[2.5rem] border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden ${className}`}>
    {children}
  </div>
);

export const EmptyState = ({ message, icon }: { message: string, icon: React.ReactNode }) => (
  <div className="col-span-full py-32 text-center border-2 border-dashed border-stone-100 rounded-[4rem] bg-stone-50/30 w-full animate-in fade-in zoom-in duration-700">
    <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-md border border-stone-100 text-stone-200">
      {icon}
    </div>
    <p className="text-stone-400 text-sm italic font-medium max-w-xs mx-auto leading-relaxed px-6">{message}</p>
  </div>
);

export const FormInput = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-4">
    <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-stone-400 ml-1">
      {label}
    </label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-900 transition-colors" size={20} />}
      <input 
        {...props} 
        className={`w-full ${Icon ? 'pl-16' : 'px-8'} py-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-8 focus:ring-stone-900/5 focus:border-stone-900 focus:bg-white transition-all text-sm font-bold hover:border-stone-300 shadow-sm`} 
      />
    </div>
  </div>
);

export const PrimaryButton = ({ label, icon: Icon, loading, ...props }: any) => (
  <button 
    disabled={loading}
    {...props}
    className={`w-full bg-stone-900 text-white font-bold py-5 rounded-2xl hover:bg-stone-800 active:scale-[0.98] transition-all text-[11px] uppercase tracking-[0.3em] shadow-lg hover:shadow-xl shadow-stone-200 cursor-pointer flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group ${props.className || ''}`}
  >
    {loading ? <Loader2 className="animate-spin" size={20} /> : (
      <>
        {label}
        {Icon && <Icon size={20} className="transition-transform group-hover:translate-x-1" />}
      </>
    )}
  </button>
);

export const SecondaryButton = ({ label, icon: Icon, loading, ...props }: any) => (
  <button 
    disabled={loading}
    {...props}
    className={`w-full bg-white text-stone-900 border border-stone-200 font-bold py-5 rounded-2xl hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] transition-all text-[11px] uppercase tracking-[0.3em] shadow-sm cursor-pointer flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group ${props.className || ''}`}
  >
    {loading ? <Loader2 className="animate-spin text-stone-900" size={20} /> : (
      <>
        {label}
        {Icon && <Icon size={20} className="transition-transform group-hover:translate-x-1" />}
      </>
    )}
  </button>
);

export const Badge = ({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "danger" | "stone", className?: string }) => {
  const styles = {
    default: "bg-stone-50 text-stone-500 border-stone-100",
    success: "bg-green-50 text-green-700 border-green-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-red-50 text-red-700 border-red-100",
    stone: "bg-stone-900 text-white border-stone-900",
  };
  
  return (
    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const QuickActionCard = ({ label, icon, onClick, index = 0 }: { label: string, icon: React.ReactNode, onClick: () => void, index?: number }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-[2.5rem] border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-stone-900 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all group aspect-square"
  >
    <div className="h-12 w-12 rounded-2xl bg-stone-50/50 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 text-center leading-tight">{label}</span>
  </motion.button>
);

export const NoticeCard = ({ title, date, content, category, index = 0 }: { title: string, date: string, content: string, category?: string, index?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white p-8 rounded-[2.5rem] border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-stone-300 transition-all flex flex-col gap-5 group"
  >
    <div className="flex justify-between items-start">
      <Badge variant="stone">{category || "Official Notice"}</Badge>
      <span className="text-[10px] font-mono text-stone-300 font-bold">{date}</span>
    </div>
    <div>
      <h4 className="text-xl font-bold text-stone-900 tracking-tight leading-tight mb-3 group-hover:text-stone-700 transition-colors">{title}</h4>
      <p className="text-sm text-stone-500 font-medium leading-relaxed line-clamp-3">{content}</p>
    </div>
    <div className="pt-4 border-t border-stone-50">
      <SecondaryButton 
        label="Read Directive" 
        onClick={() => {}} 
        className="!py-2.5 !px-6 !w-fit !text-[9px]"
      />
    </div>
  </motion.div>
);
