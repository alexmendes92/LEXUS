import React, { useState } from 'react';
import { Upload, Archive, Copy, CheckCircle, Loader2, AlertCircle, Trash2, FileText, Download, X, FileCheck } from 'lucide-react';
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart, formatFileSize } from '../lib/pdfUtils';

const ArchivingPromotionTool: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleExtract = async () => {
    if (files.length === 0) {
      setError("Por favor, adicione os arquivos PDFs ou imagens da promoção de arquivamento.");
      return;
    }
    setLoading(true);
    setError(null);
    setExtractedText(null);
    
    try {
      const ai = getGeminiClient();
      const parts: any[] = [];

      for (const file of files) {
        const generativePart = await fileToGenerativePart(file);
        parts.push(generativePart);
      }

      parts.push({ 
        text: `Atue como um Assistente Jurídico de Elite do Ministério Público do Estado de São Paulo.
        
TAREFA:
Extrair, unificar e limpar rigorosamente o teor integral da Promoção de Arquivamento contida nas páginas/arquivos anexados.

REGRAS DE TRATAMENTO JURÍDICO:
1. MARGENS E CARIMBOS LATERAIS: Remova completamente as barras verticais e tarjas laterais do SAJ/e-SAJ/Projudi (ex: "Este documento é cópia do original assinado digitalmente por...", "Processo nº...", "fls. XX", hashes criptográficos).
2. CABEÇALHOS E RODAPÉS: Remova numerações de página repetitivas, logos repetitivos em cada página e endereços de rodapé institucionais.
3. FLUIDEZ TEXTUAL: Corrija quebras de linhas artificiais (onde a frase foi cortada no meio da linha e continuada na seguinte). Reúna os parágrafos de forma fluida.
4. FORMATAÇÃO: NÃO utilize marcações Markdown como '**', '###' ou blocos de código. Forneça o texto jurídico puro, pronto para ser colado em petição do Word.
5. PRESERVAÇÃO: Não resuma nem omita a fundamentação fática, teses jurídicas, jurisprudências citadas ou o requerimento final de arquivamento.

SAÍDA:
Apenas o texto jurídico integral e limpo.` 
      });

      const response = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{ parts }]
      });

      let clean = response.text || "";
      // Strip any residual markdown asterisks or quotes
      clean = clean.replace(/\*\*/g, '').replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();
      setExtractedText(clean);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Falha ao processar os arquivos. Verifique se são PDFs válidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Promocao_Arquivamento_Limpa_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a);
  };

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      {/* Sidebar */}
      <div className="w-full md:w-[420px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-5 shadow-xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
          <div className="p-2.5 bg-slate-700 rounded-xl text-white shadow-md">
            <Archive size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base uppercase tracking-tight text-slate-100">Promoção de Arquivamento</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Remoção de Margens & Limpeza</p>
          </div>
        </div>

        <div className="space-y-4">
          <label 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
            }}
            className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
              isDragging ? 'border-slate-400 bg-slate-800/80 scale-[0.99]' : 'border-slate-800 bg-slate-950 hover:bg-slate-900 hover:border-slate-700'
            }`}
          >
            <Upload size={22} className="text-slate-400 animate-bounce" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center px-4">
              Arraste PDFs da Promoção
            </span>
            <span className="text-[10px] text-slate-500">Páginas ou autos com tarja lateral e carimbos</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept="image/*,application/pdf,.pdf" 
              onChange={(e) => {
                if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
              }} 
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Arquivos ({files.length})
                </span>
                <button onClick={() => setFiles([])} className="text-[10px] font-bold text-red-400 hover:underline">
                  LIMPAR
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <span className="text-slate-300 truncate text-[11px] max-w-[200px]" title={f.name}>{f.name}</span>
                    <span className="text-[9px] text-slate-500 mr-2">({formatFileSize(f.size)})</span>
                    <button 
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} 
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleExtract} 
                disabled={loading} 
                className="w-full bg-slate-100 hover:bg-white disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={15}/> : <FileText size={15}/>} 
                <span>{loading ? 'Limpando e Unificando...' : 'Extrair Texto Limpo'}</span>
              </button>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-red-300 text-xs">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Erro no processamento</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-slate-950 p-8 lg:p-12 overflow-y-auto flex flex-col items-center custom-scrollbar relative">
        {!extractedText && !loading && (
          <div className="my-auto text-center space-y-4 max-w-md animate-in fade-in duration-500 opacity-60">
            <Archive size={44} className="mx-auto text-slate-500" />
            <h3 className="text-xl font-bold text-slate-200 uppercase tracking-tight">Área de Visualização do Documento</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              O texto unificado aparecerá aqui, 100% limpo das marcas laterais do e-SAJ, números de folhas e quebras de linha quebradas, pronto para copiar diretamente para petições no Word.
            </p>
          </div>
        )}
        
        {loading && (
          <div className="my-auto flex flex-col items-center justify-center gap-3 animate-in fade-in">
            <Loader2 className="animate-spin text-slate-400" size={44} />
            <p className="text-sm font-semibold text-slate-200">Tratando páginas e removendo ruídos visuais...</p>
            <p className="text-xs text-slate-500">Eliminando margens verticais, carimbos eletrônicos e recompondo parágrafos</p>
          </div>
        )}
        
        {extractedText && (
          <div className="w-full max-w-4xl flex flex-col gap-4 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md py-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileCheck size={16} className="text-green-400" />
                Texto Formatado e Limpo
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                  title="Baixar como arquivo TXT"
                >
                  <Download size={14} />
                  <span>Baixar TXT</span>
                </button>
                <button 
                  onClick={handleCopy} 
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg transition-all ${
                    copied ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-900 hover:bg-white'
                  }`}
                >
                  {copied ? <CheckCircle size={14}/> : <Copy size={14}/>}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto Limpo'}</span>
                </button>
              </div>
            </div>
            <div className="bg-white p-12 lg:p-16 shadow-2xl rounded-lg text-slate-900 font-serif text-[12pt] leading-relaxed whitespace-pre-wrap selection:bg-yellow-200 border border-slate-300">
              {extractedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivingPromotionTool;
