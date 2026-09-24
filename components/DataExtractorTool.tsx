import React, { useState } from 'react';
import { Upload, ScanText, FileText, Loader2, Sparkles, Copy, CheckCircle, AlertCircle, X, Trash2, Download, RefreshCw, FileCheck } from 'lucide-react';
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart, formatFileSize } from '../lib/pdfUtils';

const PROMPT_PRESETS = [
  {
    label: "Qualificação Completa",
    icon: "👤",
    prompt: "Extraia todos os dados de qualificação de todas as pessoas mencionadas (Nome Completo, CPF, RG, Filiação materna/paterna, Data de Nascimento, Endereço Completo, Telefones, E-mails e Profissão). Organize em lista clara e padronizada."
  },
  {
    label: "Resumo Fático & Tipificação",
    icon: "⚖️",
    prompt: "Faça um resumo analítico e conciso dos fatos criminais descritos nos documentos, incluindo: Data, Hora, Local do fato, Modus operandi, Tipificação penal imputada (artigos do CP/Leis especiais), indícios de autoria e materialidade comprovada."
  },
  {
    label: "Dados Financeiros & PIX",
    icon: "🏦",
    prompt: "Extraia todas as informações financeiras encontradas: Valores (R$), Instituições Bancárias, Agências, Contas Correntes/Poupança, Titulares das contas, CPFs e Chaves PIX citadas."
  },
  {
    label: "Dispositivo & Prazos",
    icon: "📅",
    prompt: "Identifique e extraia a decisão/despacho final proferido, dispositivos legais aplicados, determinações de cumprimento, prazos concedidos e pendências judiciais urgentes."
  },
  {
    label: "Bens Apreendidos & Perícias",
    icon: "🔍",
    prompt: "Liste todos os objetos e bens apreendidos, veículos, substâncias entorpecentes, armas, laudos periciais requisitados e seus respectivos status de juntada."
  }
];

const DataExtractorTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [instruction, setInstruction] = useState('');
  const [extractedData, setExtractedData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleExtract = async () => {
    if (files.length === 0) {
      setError("Por favor, selecione ou arraste ao menos um arquivo PDF ou imagem.");
      return;
    }
    if (!instruction.trim()) {
      setError("Digite uma instrução ou selecione um dos modelos rápidos abaixo.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData('');

    try {
      const ai = getGeminiClient();
      const parts: any[] = [];

      for (const file of files) {
        const generativePart = await fileToGenerativePart(file);
        parts.push(generativePart);
      }

      parts.push({
        text: `Você é um Assistente Jurídico especializado do Ministério Público de São Paulo.
Sua missão é ler minuciosamente os documentos anexados (PDFs e/ou imagens) e atender com precisão e fidelidade fática à seguinte solicitação:

INSTRUÇÃO: ${instruction}

DIRETRIZES:
1. Mantenha fidelidade absoluta aos documentos. Não invente dados não constantes dos autos.
2. Formate as informações de maneira estruturada, clara, com títulos e marcadores.
3. Destaque em negrito nomes, números de processos, CPFs e valores importantes.
4. Se alguma informação solicitada não for encontrada no documento, aponte explicitamente "Não constante nos documentos analisados".`
      });

      const response = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{ parts }]
      });

      setExtractedData(response.text || "Nenhum dado pôde ser extraído dos documentos.");
    } catch (err: any) {
      console.error("Extraction error:", err);
      setError(err?.message || "Erro ao processar extração. Verifique a validade dos arquivos e a chave de API.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!extractedData) return;
    const blob = new Blob([extractedData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Extracao_Documentos_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const inputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-600/30 focus:border-sky-500 transition-all placeholder-slate-600";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      {/* Sidebar Controls */}
      <div className="w-full md:w-[460px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-5 shadow-2xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
          <div className="p-2.5 bg-sky-600 rounded-xl text-white shadow-lg shadow-sky-600/30">
            <ScanText size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base uppercase tracking-tight text-white">Extrator Inteligente</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-PDFs e Imagens de Autos</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="space-y-4">
          <label 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              isDragging ? 'border-sky-400 bg-sky-950/40 scale-[0.99]' : 'border-slate-800 bg-slate-950 hover:bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <Upload size={24} className="text-sky-400 mb-1.5 animate-bounce" />
            <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Clique ou Arraste PDFs / Imagens</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Suporta múltiplos PDFs, prints e certidões</p>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept="application/pdf,image/*,.pdf" 
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }
              }} 
            />
          </label>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Arquivos Selecionados ({files.length})
                </span>
                <button 
                  onClick={() => setFiles([])} 
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline"
                >
                  LIMPAR TODOS
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <FileText size={14} className="text-sky-400 shrink-0" />
                      <span className="text-slate-300 truncate text-[11px] font-medium" title={f.name}>{f.name}</span>
                      <span className="text-[9px] text-slate-500 shrink-0">({formatFileSize(f.size)})</span>
                    </div>
                    <button 
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} 
                      className="text-slate-500 hover:text-red-400 p-1 rounded-md transition-colors"
                      title="Remover arquivo"
                    >
                      <X size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Modelos de Extração Rápida
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {PROMPT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setInstruction(preset.prompt)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-left bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-800/60 transition-all group"
                >
                  <span className="text-sm shrink-0">{preset.icon}</span>
                  <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Instrução Personalizada
              </span>
              {instruction && (
                <button onClick={() => setInstruction('')} className="text-[10px] text-slate-500 hover:text-slate-400">
                  Limpar
                </button>
              )}
            </div>
            <textarea 
              value={instruction} 
              onChange={(e) => setInstruction(e.target.value)} 
              placeholder="Ex: Extraia todos os endereços residenciais citados e verifique se há certidão de óbito..." 
              className={`${inputClass} h-28 resize-none`} 
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-red-300 text-xs animate-in fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Erro no processamento</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Action Button */}
          <button 
            onClick={handleExtract} 
            disabled={isLoading || files.length === 0} 
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 transition-all active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16}/> 
                <span>Analisando {files.length} Documento(s)...</span>
              </>
            ) : (
              <>
                <ScanText size={16}/> 
                <span>Executar Extração IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 bg-slate-950 p-8 lg:p-10 overflow-y-auto custom-scrollbar flex flex-col items-center">
        {!extractedData && !isLoading && (
          <div className="my-auto text-center space-y-4 max-w-md animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border border-slate-800 shadow-xl">
              <ScanText size={36} className="text-sky-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 uppercase tracking-tight">Pronto para Extração</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Arraste autos de processo, certidões ou laudos periciais na coluna ao lado. Você pode usar os modelos de extração rápida ou redigir sua própria instrução.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="my-auto text-center space-y-4 animate-in fade-in">
            <Loader2 size={48} className="animate-spin text-sky-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-200">Processando e interpretando documentos...</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              O modelo está lendo os arquivos anexados, indexando conteúdos e formatando os resultados.
            </p>
          </div>
        )}

        {extractedData && (
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-200 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-sky-400" />
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                  Resultado Consolidado ({files.length} arquivo(s))
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  title="Baixar arquivo TXT"
                >
                  <Download size={14} />
                  <span>Baixar TXT</span>
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(extractedData);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }} 
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    copied ? 'bg-green-600 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado!' : 'Copiar Resultado'}</span>
                </button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap selection:bg-sky-600 selection:text-white font-sans text-slate-300">
              {extractedData}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExtractorTool;
