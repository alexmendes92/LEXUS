import React, { useState } from 'react';
import { ClipboardCheck, Upload, Send, FileText, Loader2, Sparkles, Copy, CheckCircle, Paperclip, X, Trash2, Edit3, MessageSquare, AlertCircle } from 'lucide-react';
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart } from '../lib/pdfUtils';

const ProvidenciasTool: React.FC = () => {
  // Input States
  const [order, setOrder] = useState('');
  const [action, setAction] = useState('');
  const [response, setResponse] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  // Processing States
  const [generatedCertidao, setGeneratedCertidao] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refinement Chat States
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Drag State
  const [isDragging, setIsDragging] = useState(false);

  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const processFiles = (newFiles: File[]) => {
    const totalSize = [...files, ...newFiles].reduce((acc, f) => acc + f.size, 0);
    
    if (totalSize > 20 * 1024 * 1024) {
      setFeedbackError("O tamanho total dos anexos não pode exceder 20MB.");
      return;
    }
    setFeedbackError(null);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateCertidao = async (instruction?: string) => {
    const isNewGeneration = !instruction;
    if (isNewGeneration) {
        if (!action.trim() && files.length === 0) {
            setFeedbackError("Descreva a providência tomada ou anexe um documento.");
            return;
        }
        setIsGenerating(true);
        setFeedbackError(null);
    } else {
        setIsRefining(true);
        setFeedbackError(null);
    }

    try {
      const ai = getGeminiClient();
      const parts: any[] = [];

      // Context Setup
      let context = `
      Você é um Oficial de Promotoria do Ministério Público de São Paulo.
      Sua tarefa é redigir uma CERTIDÃO DE PROVIDÊNCIAS formal para os autos (SISDIGITAL).
      
      ESTRUTURA DO DOCUMENTO:
      1. Título: CERTIDÃO (Centralizado, Negrito).
      2. Corpo: "Certifico e dou fé que, em cumprimento à r. cota ministerial..." ou similar.
      3. Relate o que foi ordenado, o que foi feito e qual foi o resultado.
      4. Mencione documentos anexos se houver.
      5. Fecho: "Era o que me cumpria certificar. São Paulo, [DATA ATUAL]. Eu, Oficial de Promotoria, digitei."
      
      DADOS INFORMADOS:
      - Ordem do Promotor: ${order || "Não especificada (Cota padrão)"}
      - Providência/Ação Tomada: ${action}
      - Resposta/Resultado Obtido: ${response || "Não houve resposta específica ou vide anexo."}
      `;

      if (!isNewGeneration) {
          context += `
          
          DOCUMENTO ATUAL:
          ${generatedCertidao}
          
          NOVA INSTRUÇÃO DE AJUSTE (REFINAMENTO):
          "${instruction}"
          
          Reescreva a certidão aplicando a instrução acima. Mantenha o tom formal.
          `;
      }

      parts.push({ text: context });

      // Add files
      for (const file of files) {
        const generativePart = await fileToGenerativePart(file);
        parts.push(generativePart);
      }

      const result = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{ role: 'user', parts }],
      });

      setGeneratedCertidao(result.text || "Erro ao gerar certidão.");
      setChatInput('');

    } catch (error: any) {
      console.error(error);
      setFeedbackError(error?.message || "Erro ao processar com a IA.");
    } finally {
      setIsGenerating(false);
      setIsRefining(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCertidao).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
      if(confirm("Deseja limpar tudo?")) {
          setOrder('');
          setAction('');
          setResponse('');
          setFiles([]);
          setGeneratedCertidao('');
      }
  }

  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all placeholder-slate-600 text-slate-100";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      
      {/* Sidebar - Inputs */}
      <div className="w-full md:w-[420px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-5 shadow-2xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-600 rounded-lg text-white">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold uppercase tracking-tight text-white">Providências</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Certidões SISDIGITAL</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
            {feedbackError && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-red-400" />
                  <span>{feedbackError}</span>
                </div>
                <button onClick={() => setFeedbackError(null)} className="text-red-400 hover:text-white">
                  <X size={12} />
                </button>
              </div>
            )}
            
            <div className="space-y-2">
                <label className={labelClass}>
                    1. Ordem do Promotor (Opcional)
                </label>
                <textarea
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="Ex: Tentar contato com a vítima; Verificar antecedentes..."
                    className={`${inputClass} h-20 resize-none`}
                />
            </div>

            <div className="space-y-2">
                <label className={labelClass}>
                    2. Ação Realizada (Obrigatório)
                </label>
                <textarea
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    placeholder="Ex: Enviei e-mail para x; Consultei o sistema CAEX; Liguei no número y..."
                    className={`${inputClass} h-24 resize-none`}
                />
            </div>

            <div className="space-y-2">
                <label className={labelClass}>
                    3. Resposta / Resultado
                </label>
                <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Ex: A vítima atendeu e disse que virá; O e-mail retornou..."
                    className={`${inputClass} h-20 resize-none`}
                />
            </div>

            {/* File Upload */}
            <div>
                <label className={labelClass}>
                    4. Anexos (Prints/PDFs)
                </label>
                <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${isDragging ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 bg-slate-950 hover:bg-slate-800 hover:border-cyan-500/50'}`}
                >
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <Upload size={20} className={`mb-1 transition-colors ${isDragging ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-500'}`} />
                        <p className={`text-[10px] font-bold ${isDragging ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`}>
                            {isDragging ? 'Solte para anexar' : 'Clique ou Arraste'}
                        </p>
                    </div>
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>

                {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Paperclip size={14} className="text-cyan-500" />
                                    <span className="text-xs font-bold text-slate-300 truncate">{f.name}</span>
                                </div>
                                <button onClick={() => removeFile(i)} className="p-1 hover:text-red-500"><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-2">
                {generatedCertidao && (
                    <button onClick={handleReset} className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all" title="Limpar"><Trash2 size={18}/></button>
                )}
                <button 
                    onClick={() => generateCertidao()}
                    disabled={isGenerating}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isGenerating ? 'Escrevendo...' : 'Gerar Certidão'}
                </button>
            </div>
        </div>
      </div>

      {/* Main Content - Preview & Chat */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col items-center bg-slate-950 relative">
        
        {!generatedCertidao && !isGenerating && (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
                <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl border border-slate-800">
                    <FileText size={40} className="text-cyan-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-300">Aguardando Dados</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Preencha o formulário ao lado com as providências tomadas para gerar a certidão.</p>
                </div>
             </div>
        )}

        {isGenerating && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={40} className="text-cyan-500 animate-spin" />
                <p className="text-sm font-bold text-cyan-500 animate-pulse">Redigindo documento...</p>
            </div>
        )}

        {generatedCertidao && (
            <div className="w-full max-w-3xl flex flex-col gap-6 animate-in slide-in-from-bottom duration-500 h-full">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center bg-slate-900/90 backdrop-blur border border-slate-800 p-4 rounded-2xl sticky top-0 z-20 shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Documento Gerado</span>
                    </div>
                    <button 
                        onClick={handleCopy}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        {copied ? <CheckCircle size={14}/> : <Copy size={14}/>} {copied ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                </div>

                {/* Paper Preview */}
                <div className="bg-white text-black p-12 shadow-2xl rounded-sm min-h-[500px] font-serif text-[1.1rem] leading-relaxed whitespace-pre-wrap">
                    {generatedCertidao}
                </div>

                {/* Chat Interface for Refinement */}
                <div className="mt-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={16} className="text-cyan-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IA de Correção e Ajuste</span>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isRefining && generateCertidao(chatInput)}
                            placeholder="Ex: 'Deixe mais formal', 'Adicione que verifiquei também o CAEX'..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all placeholder-slate-600"
                        />
                        <button 
                            onClick={() => generateCertidao(chatInput)}
                            disabled={isRefining || !chatInput.trim()}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white px-4 rounded-xl transition-all"
                        >
                            {isRefining ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default ProvidenciasTool;