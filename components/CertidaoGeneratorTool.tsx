import React, { useState } from 'react';
import { Stamp, Upload, Send, FileText, Loader2, Sparkles, Copy, CheckCircle, Paperclip, X, Trash2, ArrowRight, FileCheck2, MessageSquare, AlertCircle } from 'lucide-react';
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart } from '../lib/pdfUtils';

const CertidaoGeneratorTool: React.FC = () => {
  // Input States
  const [modelFiles, setModelFiles] = useState<File[]>([]);
  const [contentFiles, setContentFiles] = useState<File[]>([]);
  const [contentText, setContentText] = useState('');
  const [instruction, setInstruction] = useState('');
  
  // Drag States
  const [isDraggingModel, setIsDraggingModel] = useState(false);
  const [isDraggingContent, setIsDraggingContent] = useState(false);

  // Output State
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refinement State
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Helper to handle files
  const processFiles = (newFiles: File[], target: 'MODEL' | 'CONTENT') => {
    if (target === 'MODEL') {
      setModelFiles(prev => [...prev, ...newFiles]);
    } else {
      setContentFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'MODEL' | 'CONTENT') => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files), target);
    }
  };

  // Drag Handlers for Models
  const handleDragOverModel = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingModel(true);
  };
  const handleDragLeaveModel = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingModel(false);
  };
  const handleDropModel = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingModel(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files), 'MODEL');
    }
  };

  // Drag Handlers for Content
  const handleDragOverContent = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingContent(true);
  };
  const handleDragLeaveContent = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingContent(false);
  };
  const handleDropContent = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingContent(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files), 'CONTENT');
    }
  };

  const removeFile = (index: number, target: 'MODEL' | 'CONTENT') => {
    if (target === 'MODEL') {
      setModelFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setContentFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (refinementInstruction?: string) => {
    const isRefinement = !!refinementInstruction;

    if (!isRefinement) {
        if (modelFiles.length === 0) {
            setErrorMessage("Por favor, anexe pelo menos um Modelo de Certidão (PDF).");
            return;
        }
        if (contentFiles.length === 0 && !contentText.trim()) {
            setErrorMessage("Por favor, forneça o conteúdo (Arquivo ou Texto) para preencher a certidão.");
            return;
        }
        setIsGenerating(true);
        setErrorMessage(null);
        setGeneratedText('');
    } else {
        setIsRefining(true);
        setErrorMessage(null);
    }

    try {
      const ai = getGeminiClient();
      const parts: any[] = [];

      // 1. Instructions and Context regarding files
      let prompt = `
      Você é um Oficial de Promotoria Sênior especializado em redação jurídica.
      
      SUA TAREFA:
      ${isRefinement ? 'Reescrever e ajustar o documento gerado anteriormente.' : 'Gerar uma nova CERTIDÃO completa.'}
      
      ESTRUTURA DA SOLICITAÇÃO:
      1. Os primeiros ${modelFiles.length} arquivos anexados são MODELOS (Exemplos de estilo, formatação e linguagem).
      2. Os ${contentFiles.length} arquivos seguintes (se houver) são FONTES DE DADOS (Onde estão as informações do caso real).
      3. Também forneci texto com dados ou instruções abaixo.
      
      INSTRUÇÃO GERAL INICIAL:
      "${instruction || "Siga estritamente o modelo, substituindo os dados antigos pelos novos dados fornecidos."}"
      
      DADOS ADICIONAIS (TEXTO):
      "${contentText}"
      `;

      if (isRefinement) {
          prompt += `
          ---------------------------------------------------
          CONTEXTO DE REVISÃO:
          O usuário solicitou um ajuste no documento gerado anteriormente.
          
          DOCUMENTO ATUAL (A SER CORRIGIDO):
          ${generatedText}
          
          NOVA INSTRUÇÃO DE CORREÇÃO/REFINAMENTO:
          "${refinementInstruction}"
          
          DIRETRIZES PARA REVISÃO:
          - Aplique a correção solicitada mantendo o estilo e a formatação do modelo original.
          - Se a instrução pedir para buscar um dado que não estava no texto anterior, REVISE OS ARQUIVOS ANEXOS (FONTES DE DADOS) novamente.
          - Retorne o documento completo reescrito.
          ---------------------------------------------------
          `;
      } else {
          prompt += `
          DIRETRIZES DE GERAÇÃO:
          - Use EXATAMENTE o estilo, cabeçalho, rodapé e tom formal do(s) arquivo(s) MODELO.
          - Extraia as informações (nomes, datas, fatos, números) dos arquivos de FONTE DE DADOS ou do texto fornecido.
          - Se faltar alguma informação essencial para completar o modelo, indique entre colchetes [DADO FALTANTE].
          - Retorne apenas o texto da certidão, formatado.
          `;
      }

      parts.push({ text: prompt });

      // 2. Append Model Files
      for (const file of modelFiles) {
        const generativePart = await fileToGenerativePart(file);
        parts.push(generativePart);
      }

      // 3. Separator Text
      if (contentFiles.length > 0) {
        parts.push({ text: "--- FIM DOS MODELOS. INÍCIO DOS ARQUIVOS DE DADOS (CONTEÚDO) ---" });
        
        // 4. Append Content Files
        for (const file of contentFiles) {
          const generativePart = await fileToGenerativePart(file);
          parts.push(generativePart);
        }
      }

      const result = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{ role: 'user', parts }]
      });

      setGeneratedText(result.text || "Erro ao gerar certidão.");
      if (isRefinement) setChatInput('');

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "Erro ao processar. Verifique o tamanho dos arquivos ou sua conexão.");
    } finally {
      setIsGenerating(false);
      setIsRefining(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-600/20 focus:border-red-600 outline-none transition-all placeholder-slate-600 text-slate-100";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      
      {/* Sidebar - Inputs */}
      <div className="w-full md:w-[480px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 shadow-2xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <Stamp size={20} />
          </div>
          <div>
            <h2 className="font-bold uppercase tracking-tight text-white">Gerador Automático</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Modelos & IA</p>
          </div>
        </div>

        <div className="space-y-6 flex-1">
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
            
            {/* Input 1: Models */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className={labelClass}>
                        1. Certidões Modelo (PDF)
                    </label>
                    <span className="text-[9px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">Estilo</span>
                </div>
                <label 
                    onDragOver={handleDragOverModel}
                    onDragLeave={handleDragLeaveModel}
                    onDrop={handleDropModel}
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all group ${isDraggingModel ? 'border-emerald-500 bg-emerald-900/20' : 'border-slate-700 bg-slate-950 hover:bg-slate-800 hover:border-emerald-500/50'}`}
                >
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <FileCheck2 size={20} className={`mb-1 transition-colors ${isDraggingModel ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-500'}`} />
                        <p className={`text-[10px] font-bold ${isDraggingModel ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'}`}>
                            {isDraggingModel ? 'Solte para adicionar' : 'Adicionar Modelo(s)'}
                        </p>
                    </div>
                    <input type="file" multiple accept="application/pdf" className="hidden" onChange={(e) => handleFileChange(e, 'MODEL')} />
                </label>
                {/* File List for Models */}
                {modelFiles.length > 0 && (
                    <div className="space-y-1">
                        {modelFiles.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-xs text-slate-300 truncate w-[90%]">{f.name}</span>
                                <button onClick={() => removeFile(i, 'MODEL')} className="text-slate-500 hover:text-red-400"><X size={14}/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Input 2: Content */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className={labelClass}>
                        2. Novo Conteúdo (Dados)
                    </label>
                    <span className="text-[9px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded border border-blue-800">Fatos</span>
                </div>
                
                <label 
                    onDragOver={handleDragOverContent}
                    onDragLeave={handleDragLeaveContent}
                    onDrop={handleDropContent}
                    className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all group mb-2 ${isDraggingContent ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-950 hover:bg-slate-800 hover:border-blue-500/50'}`}
                >
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <Upload size={20} className={`mb-1 transition-colors ${isDraggingContent ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-500'}`} />
                        <p className={`text-[10px] font-bold ${isDraggingContent ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`}>
                            {isDraggingContent ? 'Solte para adicionar' : 'Adicionar Dados PDF/Img'}
                        </p>
                    </div>
                    <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'CONTENT')} />
                </label>
                
                {/* File List for Content */}
                {contentFiles.length > 0 && (
                    <div className="space-y-1 mb-2">
                        {contentFiles.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-xs text-slate-300 truncate w-[90%]">{f.name}</span>
                                <button onClick={() => removeFile(i, 'CONTENT')} className="text-slate-500 hover:text-red-400"><X size={14}/></button>
                            </div>
                        ))}
                    </div>
                )}

                <textarea
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    placeholder="Ou cole o texto/dados aqui..."
                    className={`${inputClass} h-24 resize-none`}
                />
            </div>

            {/* Input 3: Instruction */}
            <div className="space-y-2">
                <label className={labelClass}>
                    3. Instrução para a IA
                </label>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Ex: Use o modelo de certidão negativa, mas insira os dados do boletim de ocorrência anexo. Destaque o nome do réu em negrito."
                    className={`${inputClass} h-24 resize-none`}
                />
            </div>

            <button 
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isGenerating ? 'Gerando Documento...' : 'Gerar Certidão'}
            </button>
        </div>
      </div>

      {/* Main Content - Preview & Refine */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col items-center bg-slate-950 relative">
        
        {!generatedText && !isGenerating && (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
                <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl border border-slate-800">
                    <FileText size={40} className="text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-300">Gerador Inteligente</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Carregue seus modelos e dados para criar documentos perfeitos em segundos.</p>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-4">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> 1. Modelos</div>
                    <ArrowRight size={12} />
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> 2. Dados</div>
                    <ArrowRight size={12} />
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full"></div> 3. Resultado</div>
                </div>
             </div>
        )}

        {isGenerating && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={48} className="text-emerald-500 animate-spin" />
                <p className="text-sm font-bold text-emerald-500 animate-pulse">Analisando modelos e escrevendo...</p>
            </div>
        )}

        {generatedText && (
            <div className="w-full max-w-4xl flex flex-col gap-6 animate-in slide-in-from-bottom duration-500 h-full">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center bg-slate-900/90 backdrop-blur border border-slate-800 p-4 rounded-2xl sticky top-0 z-20 shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Certidão Gerada</span>
                    </div>
                    <button 
                        onClick={handleCopy}
                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        {copied ? <CheckCircle size={14}/> : <Copy size={14}/>} {copied ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                </div>

                {/* Paper Preview */}
                <div className="bg-white text-black p-16 shadow-2xl rounded-sm min-h-[600px] font-serif text-[1.1rem] leading-relaxed whitespace-pre-wrap">
                    {generatedText}
                </div>

                {/* Refinement Chat Interface */}
                <div className="mt-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revisão e Ajuste</span>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isRefining && handleGenerate(chatInput)}
                            placeholder="Ex: 'Adicione o número do RG', 'Mude a data para ontem', 'Seja mais formal'..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all placeholder-slate-600"
                        />
                        <button 
                            onClick={() => handleGenerate(chatInput)}
                            disabled={isRefining || !chatInput.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-4 rounded-xl transition-all"
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

export default CertidaoGeneratorTool;