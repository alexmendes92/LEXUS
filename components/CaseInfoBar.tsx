import React, { useCallback } from 'react';
import { CaseData, PromotoriaDef } from '../types';
import { Search, Gavel, Calendar, UserRound } from 'lucide-react';

interface CaseInfoBarProps {
  caseData: CaseData;
  setCaseData: React.Dispatch<React.SetStateAction<CaseData>>;
  promotorias: PromotoriaDef[];
}

const CaseInfoBar: React.FC<CaseInfoBarProps> = ({ caseData, setCaseData, promotorias }) => {
  
  const getPromotorForDate = useCallback((cargoLabel: string, dateString: string) => {
    const promotoria = promotorias.find(p => p.label === cargoLabel);
    if (!promotoria) return "";
    if (!dateString) return Array.from(new Set(promotoria.schedule.map(s => s.name))).join(" / ");
    const [year, month, day] = dateString.split('-').map(Number);
    const entry = promotoria.schedule.find(s => day >= s.start && day <= s.end);
    return entry ? entry.name : "";
  }, [promotorias]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setCaseData(prev => {
      const newData = { ...prev, [name]: val };
      
      if (name === 'dataAudiencia') {
        if (value) {
          newData.urgente = true;
        } else {
          newData.urgente = false;
        }
      }

      if (name === 'cargo' || name === 'dataAudiencia') {
        const targetCargo = name === 'cargo' ? value : prev.cargo;
        const targetDate = name === 'dataAudiencia' ? value : prev.dataAudiencia;
        newData.promotor = getPromotorForDate(targetCargo, targetDate);
      }
      return newData;
    });
  };

  const handleSearch = () => {
    if (!caseData.numeroProcesso) return;
    const url = `https://esaj.tjsp.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsulta=${encodeURIComponent(caseData.numeroProcesso)}`;
    window.open(url, '_blank');
  };

  const inputContainer = "relative group flex-1 min-w-[200px]";
  const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-600 transition-colors";
  const inputClass = "h-12 w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all shadow-lg text-slate-100 placeholder-slate-500";

  return (
    <div className="bg-slate-900 p-6 border-b border-slate-800 shadow-xl z-10">
      <div className="max-w-[1400px] mx-auto flex flex-wrap gap-4 items-center">
        <div className={inputContainer}>
          <Gavel size={18} className={iconClass} />
          <input type="text" name="numeroProcesso" placeholder="Nº Processo (SAJ)" value={caseData.numeroProcesso} onChange={handleChange} className={inputClass} />
          <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-slate-700 transition-all" title="ESAJ"><Search size={16} /></button>
        </div>
        <div className={inputContainer}>
          <Calendar size={18} className={iconClass} />
          <select name="cargo" value={caseData.cargo} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer pr-10`}><option value="" disabled>Cargo...</option>{promotorias.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}</select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">▼</div>
        </div>
        <div className={inputContainer}>
          <Calendar size={18} className={iconClass} />
          <input type="date" name="dataAudiencia" value={caseData.dataAudiencia} onChange={handleChange} className={inputClass} />
        </div>
        
        {caseData.dataAudiencia && (
          <div className="flex items-center gap-2 px-4 h-12 bg-red-950/20 border border-red-900/30 rounded-xl animate-in fade-in slide-in-from-left-2">
            <input 
              type="checkbox" 
              id="urgente" 
              name="urgente" 
              checked={caseData.urgente} 
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-600 focus:ring-offset-slate-900"
            />
            <label htmlFor="urgente" className="text-xs font-bold text-red-500 uppercase tracking-wider cursor-pointer select-none">
              Urgente
            </label>
          </div>
        )}

        <div className={`${inputContainer} flex-[1.5]`}>
            <UserRound size={18} className={iconClass} />
            <input type="text" name="promotor" placeholder="Promotor(a)" value={caseData.promotor} onChange={handleChange} className={inputClass} />
        </div>
      </div>
    </div>
  );
};

export default CaseInfoBar;