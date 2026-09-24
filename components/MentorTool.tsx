import React, { useState } from 'react';
import { BrainCircuit, Upload, Send, FileText, Loader2, Sparkles, Copy, CheckCircle, AlertCircle, X, Paperclip, Trash2 } from 'lucide-react';
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart } from '../lib/pdfUtils';

const MentorTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const handleConsult = async () => {
    if (!prompt.trim() && files.length === 0) return;
    setIsLoading(true);
    setResponse('');
    setErrorMessage(null);
    try {
      const ai = getGeminiClient();
      const parts: any[] = [];
      for (const f of files) {
        const part = await fileToGenerativePart(f);
        parts.push(part);
      }
      parts.push({ text: prompt || "Analise minuciosamente os documentos jurídicos anexados e forneça orientações práticas, jurisprudência relevante e fundamentação." });
      
      const result = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{ role: 'user', parts }],
        config: { systemInstruction: "Você é um Mentor Jurídico Sênior especializado na atuação criminal do Ministério Público de São Paulo (MPSP)." }
      });
      setResponse(result.text || "Sem resposta.");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "Erro na consulta ao Mentor Jurídico.");
      setResponse("Erro na consulta.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all placeholder-slate-600";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      <div className="w-full md:w-[420px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 shadow-xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-600 rounded-lg text-white"><BrainCircuit size={20} /></div>
          <div><h2 className="font-bold uppercase tracking-tight text-white">Mentor Jurídico</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Consultoria IA</p></div>
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

        <div className="space-y-4 flex-1">
          <label 
            onDragOver={(e) => {e.preventDefault(); setIsDragging(true)}}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files))}}
            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragging ? 'border-violet-500 bg-violet-900/20' : 'border-slate-800 bg-slate-950 hover:bg-slate-900'}`}
          >
            <Upload size={20} className="text-violet-500 mb-1" />
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Anexar Múltiplos Arquivos (PDF/Img)</p>
            <input type="file" multiple accept="application/pdf,image/*,.pdf" className="hidden" onChange={handleFileChange} />
          </label>

          {files.length > 0 && (
              <div className="space-y-1">
                {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px]">
                        <span className="text-slate-400 truncate w-48">{f.name}</span>
                        <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400"><X size={14}/></button>
                    </div>
                ))}
              </div>
          )}

          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Sua dúvida ou instrução jurídica..." className={`${inputClass} flex-1 resize-none h-32`} />
          
          <button onClick={handleConsult} disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all">
            {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Iniciar Análise
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 p-8 overflow-y-auto custom-scrollbar flex flex-col items-center">
        {response && (
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-10 text-slate-300 leading-relaxed whitespace-pre-wrap shadow-2xl animate-in slide-in-from-bottom">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                    <span className="font-bold text-violet-400 uppercase text-xs tracking-[0.2em]">Parecer da IA</span>
                    <button onClick={() => {navigator.clipboard.writeText(response); setCopiedResponse(true); setTimeout(()=>setCopiedResponse(false),2000)}} className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                        {copiedResponse ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                </div>
                {response}
            </div>
        )}
      </div>
    </div>
  );
};

export default MentorTool;
