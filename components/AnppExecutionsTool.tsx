
import React, { useState } from 'react';
import { Gavel, DollarSign, Clock, CheckCircle2, AlertCircle, TrendingUp, FileText, Plus, X, AlertTriangle } from 'lucide-react';

interface Obligation {
  id: string;
  type: 'PECUNIARIA' | 'SERVICO' | 'OUTROS';
  description: string;
  total: number;
  current: number;
  status: 'PENDENTE' | 'EM_DIA' | 'ATRASADO' | 'CONCLUIDO';
  dueDate: string;
}

const AnppExecutionsTool: React.FC = () => {
  const [obligations, setObligations] = useState<Obligation[]>([
    { id: '1', type: 'PECUNIARIA', description: 'Prestação Pecuniária', total: 5000, current: 2000, status: 'EM_DIA', dueDate: '2024-12-20' },
    { id: '2', type: 'SERVICO', description: 'Serviço Comunitário (Horas)', total: 100, current: 20, status: 'ATRASADO', dueDate: '2024-05-15' }
  ]);

  const [formData, setFormData] = useState({
    processo: '',
    reu: '',
    vara: ''
  });

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'CONCLUIDO': return 'bg-green-500';
        case 'EM_DIA': return 'bg-blue-500';
        case 'ATRASADO': return 'bg-red-500';
        default: return 'bg-slate-500';
    }
  };

  const calculateProgress = (curr: number, total: number) => {
    return Math.min(100, Math.round((curr / total) * 100));
  };

  const handleAddValue = (id: string, amount: number) => {
    setObligations(prev => prev.map(ob => {
        if (ob.id === id) {
            const newCurrent = Math.min(ob.total, ob.current + amount);
            return { 
                ...ob, 
                current: newCurrent, 
                status: newCurrent >= ob.total ? 'CONCLUIDO' : 'EM_DIA' 
            };
        }
        return ob;
    }));
  };

  const inputClass = "w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all placeholder-slate-600";
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      
      {/* Sidebar Info */}
      <div className="w-[380px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 shadow-2xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-600 rounded-lg text-white"><Gavel size={20} /></div>
          <div>
            <h2 className="font-bold uppercase tracking-tight text-white">ANPP - Execuções</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fiscalização de Acordos</p>
          </div>
        </div>

        <div className="space-y-4">
            <div><label className={labelClass}>Processo</label><input type="text" value={formData.processo} onChange={e => setFormData({...formData, processo: e.target.value})} className={inputClass} placeholder="0000000-00..." /></div>
            <div><label className={labelClass}>Investigado</label><input type="text" value={formData.reu} onChange={e => setFormData({...formData, reu: e.target.value})} className={inputClass} /></div>
            <div><label className={labelClass}>Vara</label><input type="text" value={formData.vara} onChange={e => setFormData({...formData, vara: e.target.value})} className={inputClass} /></div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl mt-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={14} className="text-yellow-500"/> Alertas</h4>
            {obligations.some(o => o.status === 'ATRASADO') ? (
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-xs text-red-400 font-medium">
                    Há obrigações em atraso. Verifique a lista.
                </div>
            ) : (
                <div className="p-3 bg-green-900/20 border border-green-900/50 rounded-lg text-xs text-green-400 font-medium">
                    Acordo sendo cumprido regularmente.
                </div>
            )}
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-slate-950">
         <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
                <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tight">Painel de Cumprimento</h1>
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 transition-all">
                    <Plus size={16}/> Adicionar Obrigação
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {obligations.map(ob => {
                    const progress = calculateProgress(ob.current, ob.total);
                    const isMoney = ob.type === 'PECUNIARIA';
                    
                    return (
                        <div key={ob.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(ob.status)}`}></div>
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                        {isMoney ? <DollarSign className="text-green-500" size={20}/> : <Clock className="text-blue-500" size={20}/>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200">{ob.description}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vencimento: {new Date(ob.dueDate).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${ob.status === 'ATRASADO' ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {ob.status}
                                </span>
                            </div>

                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                    <span>Progresso</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                    <div className={`h-full transition-all duration-1000 ${isMoney ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-between mt-2 font-mono text-sm text-slate-300">
                                    <span>{isMoney ? `R$ ${ob.current}` : `${ob.current}h`}</span>
                                    <span className="text-slate-600">/ {isMoney ? `R$ ${ob.total}` : `${ob.total}h`}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleAddValue(ob.id, isMoney ? 100 : 1)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all">
                                    + Registrar {isMoney ? 'Pagamento' : 'Horas'}
                                </button>
                                <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                                    <FileText size={16}/>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Generators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-green-400 text-sm mb-1">Manifestação de Cumprimento</h4>
                        <p className="text-xs text-slate-500">Gerar promoção de arquivamento por extinção da punibilidade.</p>
                    </div>
                    <button className="bg-green-900/20 border border-green-900/50 text-green-400 p-3 rounded-xl hover:bg-green-900/40 transition-all"><FileText size={20}/></button>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-red-400 text-sm mb-1">Promoção de Revogação</h4>
                        <p className="text-xs text-slate-500">Gerar pedido de rescisão e oferecimento de denúncia.</p>
                    </div>
                    <button className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-xl hover:bg-red-900/40 transition-all"><AlertCircle size={20}/></button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnppExecutionsTool;
