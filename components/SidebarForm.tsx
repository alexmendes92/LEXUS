import React, { useState } from 'react';
import { Person } from '../types';
import { UserPlus, Sparkles, X, Users, ClipboardType, Loader2, Upload, FileText, AlertCircle } from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart, formatFileSize } from '../lib/pdfUtils';

interface SidebarFormProps {
  onAddPerson: (person: Person) => void;
  people: Person[];
  onRemovePerson: (id: string) => void;
}

const initialFormState = {
  nome: '',
  folha: '',
  nacionalidade: 'Brasileiro(a)',
  cpf: '',
  rg: '',
  pai: '',
  mae: '',
  dataNascimento: ''
};

const SidebarForm: React.FC<SidebarFormProps> = ({ onAddPerson, people, onRemovePerson }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatCPF = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatRG = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})([0-9a-zA-Z]{1}$)/, '$1-$2');
  };

  const formatDateInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 8);
    if (clean.length <= 2) return clean;
    if (clean.length <= 4) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === 'cpf') newValue = formatCPF(value);
    else if (name === 'rg') newValue = formatRG(value);
    else if (name === 'dataNascimento') newValue = formatDateInput(value);
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleClear = () => {
    setFormData(initialFormState);
    setAiInput('');
    setAiFile(null);
    setErrorMessage(null);
  };

  const handleAdd = () => {
    if (!formData.nome.trim()) {
      setErrorMessage("O nome da parte é obrigatório.");
      return;
    }
    const newPerson: Person = { id: crypto.randomUUID(), ...formData };
    onAddPerson(newPerson);
    handleClear();
  };

  const handleAiParse = async () => {
    if (!aiInput.trim() && !aiFile) {
      setErrorMessage("Cole um texto ou selecione um documento PDF/imagem.");
      return;
    }
    setIsParsing(true);
    setErrorMessage(null);
    try {
      const ai = getGeminiClient();
      const parts: any[] = [];

      if (aiFile) {
        const generativePart = await fileToGenerativePart(aiFile);
        parts.push(generativePart);
        parts.push({
          text: `Analise este documento (PDF/Imagem) de processo crime (Denúncia, BO, Folha de Antecedentes ou Termo de Declarações).
Extraia os dados de qualificação da pessoa investigada ou parte para pesquisa de antecedentes (NI). Retorne estritamente o JSON válido conforme schema.`
        });
      } else {
        parts.push({
          text: `Extraia os dados desta pessoa para uma pesquisa de antecedentes (NI) a partir do seguinte texto: "${aiInput}". Retorne estritamente o JSON válido conforme schema.`
        });
      }

      const response = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              folha: { type: Type.STRING },
              nacionalidade: { type: Type.STRING },
              cpf: { type: Type.STRING },
              rg: { type: Type.STRING },
              pai: { type: Type.STRING },
              mae: { type: Type.STRING },
              dataNascimento: { type: Type.STRING }
            },
            required: ["nome"]
          }
        }
      });
      const extracted = JSON.parse(response.text || "{}");
      setFormData(prev => ({ 
        ...prev, 
        ...extracted, 
        cpf: extracted.cpf ? formatCPF(extracted.cpf) : prev.cpf, 
        rg: extracted.rg ? formatRG(extracted.rg) : prev.rg,
        dataNascimento: extracted.dataNascimento ? formatDateInput(extracted.dataNascimento) : prev.dataNascimento
      }));
      setIsAiMode(false);
      setAiInput('');
      setAiFile(null);
    } catch (error: any) {
      console.error("AI parse error:", error);
      setErrorMessage(error?.message || "Erro ao processar dados com IA.");
    } finally {
      setIsParsing(false);
    }
  };

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all placeholder-slate-500 text-slate-100";
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="w-full md:w-[380px] bg-slate-900 flex flex-col h-full border-r border-slate-800 shadow-2xl relative z-10">
      <div className="bg-slate-950 p-6 text-white overflow-hidden relative border-b border-slate-800">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-amber-600 rounded-lg"><Users size={20} className="text-slate-950" /></div>
          <div>
            <h2 className="font-bold text-lg leading-tight uppercase tracking-tight">Pesquisa NI</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cadastro de Partes</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nova Parte</span>
            </div>
            <button 
              onClick={() => { setIsAiMode(!isAiMode); setErrorMessage(null); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${isAiMode ? 'bg-amber-600 border-amber-700 text-white' : 'bg-slate-800 border-slate-700 text-amber-500 hover:bg-slate-700'}`}
            >
              <Sparkles size={12} /> {isAiMode ? 'Modo Manual' : 'Extrair com IA'}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
                <X size={12} />
              </button>
            </div>
          )}

          {isAiMode ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
              <div className="p-4 bg-amber-950/20 rounded-2xl border border-amber-900/30 space-y-3">
                {/* Drag and Drop PDF / Image zone */}
                <label 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) setAiFile(e.dataTransfer.files[0]);
                  }}
                  className={`w-full py-3.5 px-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging ? 'border-amber-400 bg-amber-900/30' : 'border-amber-900/50 bg-slate-900/60 hover:bg-slate-900'
                  }`}
                >
                  <Upload size={18} className="text-amber-500 mb-1" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider text-center">
                    {aiFile ? aiFile.name : 'Upload PDF / Imagem (Denúncia, BO)'}
                  </span>
                  {aiFile && (
                    <span className="text-[9px] text-slate-400 mt-0.5">({formatFileSize(aiFile.size)})</span>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="application/pdf,image/*,.pdf" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAiFile(e.target.files[0]);
                    }} 
                  />
                </label>

                {aiFile && (
                  <div className="flex items-center justify-between p-2 bg-slate-900 border border-amber-900/40 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 truncate text-amber-300 text-[11px]">
                      <FileText size={13} className="shrink-0" />
                      <span className="truncate">{aiFile.name}</span>
                    </div>
                    <button onClick={() => setAiFile(null)} className="text-slate-400 hover:text-red-400 p-0.5">
                      <X size={13} />
                    </button>
                  </div>
                )}

                <div className="relative">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ClipboardType size={12} /> Ou cole texto dos autos
                  </p>
                  <textarea 
                    value={aiInput} 
                    onChange={(e) => setAiInput(e.target.value)} 
                    placeholder="Cole aqui o trecho da denúncia, despacho ou qualificação..." 
                    className="w-full h-24 bg-slate-900 border border-amber-900/40 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder-slate-600" 
                  />
                </div>

                <button 
                  onClick={handleAiParse} 
                  disabled={isParsing || (!aiInput.trim() && !aiFile)} 
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isParsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>{isParsing ? 'Extraindo Dados...' : 'Preencher Formulário'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className={labelClass}>Fls.</label>
                  <input type="text" name="folha" value={formData.folha} onChange={handleChange} className={inputClass} placeholder="00" />
                </div>
                <div className="col-span-3">
                  <label className={labelClass}>Nome Completo *</label>
                  <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={inputClass} placeholder="Nome..." />
                </div>
              </div>
              
              <div>
                <label className={labelClass}>Nascimento</label>
                <input 
                  type="text" 
                  name="dataNascimento" 
                  value={formData.dataNascimento} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>RG</label>
                  <input type="text" name="rg" value={formData.rg} onChange={handleChange} maxLength={12} className={inputClass} placeholder="00.000.000-X" />
                </div>
                <div>
                  <label className={labelClass}>CPF</label>
                  <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} maxLength={14} className={inputClass} placeholder="000.000.000-00" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Mãe</label>
                <input type="text" name="mae" value={formData.mae} onChange={handleChange} className={inputClass} placeholder="Nome da mãe" />
              </div>
              <div>
                <label className={labelClass}>Pai</label>
                <input type="text" name="pai" value={formData.pai} onChange={handleChange} className={inputClass} placeholder="Nome do pai" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleClear} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl font-bold text-xs uppercase transition-all border border-slate-700">
                  Limpar
                </button>
                <button onClick={handleAdd} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold text-xs uppercase transition-all shadow-lg shadow-amber-900/40">
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </div>

        {people.length > 0 && (
          <div className="border-t border-slate-800 bg-slate-950/30 p-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block">Partes ({people.length})</span>
            <div className="space-y-2">
              {people.map(person => (
                <div key={person.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex items-center justify-between shadow-sm">
                   <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{person.nome}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Fls. {person.folha || 'N/A'}</p>
                   </div>
                   <button onClick={() => onRemovePerson(person.id)} className="p-2 text-slate-500 hover:text-red-500 rounded-lg">
                     <X size={16} />
                   </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarForm;
