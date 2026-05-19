import React from 'react';
import { LogOut, User, LayoutDashboard, GraduationCap, Users, BookOpen, ClipboardCheck, FileText, Trophy, ChevronRight, Link as LinkIcon, Bell, Settings, Search } from 'lucide-react';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './SharedComponents';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const { logout, profile } = useAuth();

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-stone-900 overflow-hidden select-none">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-stone-900/5 z-50 transition-all duration-1000" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-stone-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stone-200/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Persistent Sidebar */}
      <aside className="w-72 bg-white border-r border-stone-200/60 flex flex-col z-[60] relative overflow-hidden shadow-[10px_0_40px_-20px_rgba(0,0,0,0.03)]">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onViewChange('dashboard')}>
            <div className="bg-stone-900 text-white p-2.5 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-500">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-xl leading-none text-stone-900">SmartUni</h1>
              <p className="font-mono text-[8px] uppercase font-bold tracking-[0.3em] text-stone-400 mt-1 opacity-60">Academic Hub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 mt-2 border-b border-stone-50 pb-2">
            <p className="font-mono text-[9px] uppercase font-bold tracking-[0.2em] text-stone-300">Navigation</p>
          </div>
          
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')} 
          />
          
          {profile?.role === 'admin' && (
            <>
              <NavItem icon={<Users size={18} />} label="Faculty" active={currentView === 'faculty'} onClick={() => onViewChange('faculty')} />
              <NavItem icon={<Users size={18} />} label="Students" active={currentView === 'students'} onClick={() => onViewChange('students')} />
              <NavItem icon={<GraduationCap size={18} />} label="Classes" active={currentView === 'classes'} onClick={() => onViewChange('classes')} />
            </>
          )}
          
          {profile?.role === 'faculty' && (
            <>
              <NavItem icon={<ClipboardCheck size={18} />} label="Attendance" active={currentView === 'attendance'} onClick={() => onViewChange('attendance')} />
              <NavItem icon={<FileText size={18} />} label="Results" active={currentView === 'results'} onClick={() => onViewChange('results')} />
            </>
          )}
          
          {profile?.role === 'student' && (
            <>
              <NavItem icon={<ClipboardCheck size={18} />} label="Attendance" active={currentView === 'attendance'} onClick={() => onViewChange('attendance')} />
              <NavItem icon={<Trophy size={18} />} label="Results" active={currentView === 'results'} onClick={() => onViewChange('results')} />
            </>
          )}

          <div className="px-4 mb-4 mt-8 border-b border-stone-50 pb-2">
            <p className="font-mono text-[9px] uppercase font-bold tracking-[0.2em] text-stone-300">Identity</p>
          </div>
          
          <NavItem 
            icon={<User size={18} />} 
            label="My Profile" 
            active={currentView === 'profile'} 
            onClick={() => onViewChange('profile')} 
          />
        </nav>

        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 text-xs font-bold text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-2xl active:scale-[0.98] transition-all cursor-pointer group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Orchestration Layer */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,1),rgba(245,245,244,0.4))]">
        <header className="h-20 border-b border-stone-200/40 bg-white/60 backdrop-blur-3xl sticky top-0 z-[50] px-12 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase font-bold tracking-[0.4em] text-stone-900">
                {currentView}
              </span>
              <span className="text-stone-200 font-light text-lg">/</span>
              <span className="text-stone-400 font-mono text-[9px] uppercase tracking-widest opacity-40">Section Control</span>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-12">
            <div className="relative w-full group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
              <input 
                type="text" 
                placeholder="Institutional Search..." 
                className="w-full bg-stone-100/50 border border-stone-200/60 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:bg-white transition-all placeholder:text-stone-400 placeholder:font-mono placeholder:uppercase placeholder:tracking-widest"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white border border-stone-200/60 rounded-2xl p-2.5 hover:border-stone-400 active:scale-95 transition-all cursor-pointer text-stone-400 hover:text-stone-900 shadow-sm relative group">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </div>
            
            <div className="h-8 w-px bg-stone-200/60 mx-2" />
            
            <div 
              onClick={() => onViewChange('profile')}
              className="flex items-center gap-4 pl-2 pr-1 py-1 rounded-2xl hover:bg-stone-100/50 transition-all cursor-pointer group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-bold text-stone-900 leading-none mb-1 capitalize">{profile?.name}</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">{profile?.role}</span>
                  <Badge variant="stone" className="text-[8px] px-1.5 py-0.5 scale-90 border-0">Primary</Badge>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-[0_5px_15px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="p-12 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 30, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.99 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <footer className="p-12 text-center opacity-20 hover:opacity-100 transition-opacity duration-1000">
            <p className="font-mono text-[9px] uppercase font-bold tracking-[0.5em] text-stone-400">SmartUni Infrastructure Management Architecture &copy; 2026</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`
      flex w-full items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold active:scale-[0.98] transition-all group cursor-pointer relative
      ${active 
        ? 'bg-stone-50 text-stone-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-stone-200/40' 
        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50/80'}
    `}
  >
    <span className={`transition-all duration-300 ${active ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-900'}`}>
      {icon}
    </span>
    <span className="relative z-10">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-nav-indicator" 
        className="absolute left-0 w-1 h-5 bg-stone-900 rounded-r-full" 
      />
    )}
  </button>
);

