
import React from 'react';
import { ChevronLeft, User, LayoutDashboard, LogOut, HelpCircle } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  userName: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, showBackButton, onBack, onLogout }) => {
  return (
    <header className="bg-slate-900 text-slate-100 h-16 flex items-center justify-between px-8 shadow-md shrink-0 z-20 border-b border-slate-800">
      <div className="flex items-center gap-6">
        {showBackButton ? (
          <button 
            onClick={onBack}
            className="group p-2 rounded-xl hover:bg-slate-800 transition-all border border-slate-700 flex items-center gap-2"
          >
              <ChevronLeft size={20} className="text-slate-500 group-hover:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Voltar</span>
          </button>
        ) : (
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-slate-500" />
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-slate-500">Painel SISDIGITAL</span>
          </div>
        )}
        
        <div className="h-6 w-px bg-slate-800"></div>
        
        <div className="flex items-center gap-4">
            <Logo className="h-7" isDark={true} />
            <div className="flex flex-col border-l border-slate-800 pl-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none">Intranet</span>
                <span className="text-[9px] font-medium text-slate-600 uppercase tracking-widest mt-1">Ministério Público</span>
            </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 group">
            <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">{userName}</p>
                <p className="text-[10px] text-red-500 font-bold tracking-widest uppercase">Oficial de Promotoria</p>
            </div>
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shadow-sm transition-all overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400 transition-colors">
                    <User size={20} />
                </div>
            </div>
        </div>
        
        <div className="h-6 w-px bg-slate-800"></div>

        <button 
            onClick={onLogout}
            className="p-2 rounded-xl hover:bg-red-950 hover:text-red-400 text-slate-500 transition-all"
            title="Sair do Sistema"
        >
            <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
