import React, { useState } from 'react';
import { Upload, Gavel, Copy, CheckCircle, Loader2, AlertCircle, Trash2, MapPin, User, FileText, Fingerprint, DollarSign, Calendar, Building2, ShieldAlert, X } from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart, formatFileSize } from '../lib/pdfUtils';

interface ExtractedMultaData {
  numeroProcesso: string;
  numeroExecucao?: string;
  nomeParte: string;
  cpf: string;
  rg?: string;
  filiacaoMae?: string;
  dataNascimento?: string;
  valorMulta?: string;
  quantidadeDiasMulta?: string;
  fracaoDiaMulta?: string;
  varaOrigem?: string;
  comarca?: string;
  dataTransitoJulgado?: string;
  estaPreso: string;
  estabelecimentoPrisional?: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

const MultaPenalTool: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExtractedMultaData | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleExtract = async () => {
    if (files.length === 0) {
      setError("Por favor, selecione ou arraste as certidões de multa penal (PDF ou imagens).");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const ai = getGeminiClient();
      const parts: any[] = [];

      for (const file of files) {
        const generativePart = await fileToGenerativePart(file);
        parts.push(generativePart);
      }

      parts.push({ 
        text: `Você é um Analista Jurídico do Ministério Público do Estado de São Paulo especializado na Execução da Pena de Multa (Art. 51 do Código Penal).
Analise rigorosamente a(s) Certidão(ões) de Multa Penal e Peças de Execução anexadas.
Extraia e consolide todos os dados do réu/devedor, valores calculados e dados processuais com máxima precisão. Retorne estritamente o JSON válido conforme o schema.`
      });

      const response = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              numeroProcesso: { type: Type.STRING, description: "Número do processo criminal de origem (formato CNJ)" },
              numeroExecucao: { type: Type.STRING, description: "Número do processo de execução penal ou de multa, se houver" },
              nomeParte: { type: Type.STRING, description: "Nome completo do sentenciado/condenado" },
              cpf: { type: Type.STRING, description: "CPF do sentenciado com pontuação" },
              rg: { type: Type.STRING, description: "RG do sentenciado" },
              filiacaoMae: { type: Type.STRING, description: "Nome da mãe do sentenciado" },
              dataNascimento: { type: Type.STRING, description: "Data de nascimento" },
              valorMulta: { type: Type.STRING, description: "Valor total liquidado/atualizado da multa em Reais (ex: R$ 1.542,80)" },
              quantidadeDiasMulta: { type: Type.STRING, description: "Total de dias-multa fixados na sentença" },
              fracaoDiaMulta: { type: Type.STRING, description: "Fração do dia-multa (ex: 1/30 do salário mínimo)" },
              varaOrigem: { type: Type.STRING, description: "Vara Criminal de origem (ex: 3ª Vara Criminal)" },
              comarca: { type: Type.STRING, description: "Comarca de origem (ex: Capital, Santos)" },
              dataTransitoJulgado: { type: Type.STRING, description: "Data do trânsito em julgado para a acusação e defesa" },
              estaPreso: { type: Type.STRING, description: "'Sim' ou 'Não'" },
              estabelecimentoPrisional: { type: Type.STRING, description: "Nome do estabelecimento prisional se estiver preso" },
              cep: { type: Type.STRING, description: "CEP residencial do sentenciado" },
              endereco: { type: Type.STRING, description: "Logradouro (Rua, Av, etc)" },
              numero: { type: Type.STRING, description: "Número do endereço" },
              bairro: { type: Type.STRING, description: "Bairro" },
              cidade: { type: Type.STRING, description: "Cidade" },
              uf: { type: Type.STRING, description: "UF (ex: SP)" }
            },
            required: ["numeroProcesso", "nomeParte", "cpf", "estaPreso"]
          }
        }
      });

      const parsed: ExtractedMultaData = JSON.parse(response.text || "{}");
      setData(parsed);
    } catch (err: any) {
      console.error("Multa penal extraction error:", err);
      setError(err?.message || "Falha ao processar as certidões de multa. Verifique os arquivos.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const copySummaryForPetition = () => {
    if (!data) return;
    const summary = `
EXECUÇÃO DA PENA DE MULTA - DADOS CONSOLIDADOS
--------------------------------------------------
Processo Crime Origem: ${data.numeroProcesso || '-'}
${data.numeroExecucao ? `Execução de Multa: ${data.numeroExecucao}` : ''}
Vara / Comarca: ${data.varaOrigem || '-'} / ${data.comarca || 'SP'}
Trânsito em Julgado: ${data.dataTransitoJulgado || '-'}

SENTENCIADO / EXECUTADO:
Nome: ${data.nomeParte || '-'}
CPF: ${data.cpf || '-'}
RG: ${data.rg || '-'}
Mãe: ${data.filiacaoMae || '-'}
Data de Nascimento: ${data.dataNascimento || '-'}
Situação Prisional: ${data.estaPreso?.toLowerCase().includes('sim') ? `Preso (${data.estabelecimentoPrisional || 'Estabelecimento Prisional'})` : 'Solto'}

ENDEREÇO RESIDENCIAL:
${data.endereco || ''}, ${data.numero || 's/n'} - ${data.bairro || ''}
${data.cidade || ''}/${data.uf || 'SP'} - CEP: ${data.cep || ''}

LIQUIDAÇÃO DA MULTA:
Valor da Multa: ${data.valorMulta || '-'}
Dias-Multa: ${data.quantidadeDiasMulta || '-'}
Fração Fixada: ${data.fracaoDiaMulta || '-'}
--------------------------------------------------
`.trim();

    copyToClipboard(summary, 'all_summary');
  };

  const DataField = ({ label, value, id, icon: Icon }: { label: string, value?: string, id: string, icon?: any }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between group hover:border-purple-500/50 transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          {Icon && <Icon size={12} className="text-purple-400 shrink-0" />}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{label}</span>
        </div>
        <p className="text-sm font-semibold text-slate-100 truncate select-all">{value || '-'}</p>
      </div>
      <button 
        onClick={() => copyToClipboard(value || '', id)}
        className={`p-2 rounded-lg transition-all ml-2 shrink-0 ${copiedField === id ? 'bg-green-950/60 text-green-400 border border-green-700/50' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-purple-300 hover:border-purple-500/40'}`}
        title="Copiar campo"
      >
        {copiedField === id ? <CheckCircle size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      {/* Sidebar Controls */}
      <div className="w-full md:w-[420px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-5 shadow-xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
          <div className="p-2.5 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-600/30">
            <Gavel size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base uppercase tracking-tight text-slate-100">Multa Penal</h2>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Extração de Certidões & Autos</p>
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
              isDragging ? 'border-purple-400 bg-purple-950/30 scale-[0.99]' : 'border-slate-800 bg-slate-950 hover:bg-slate-900/60 hover:border-purple-500/40'
            }`}
          >
            <Upload size={22} className="text-purple-400 animate-bounce" />
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Arraste Certidões de Multa</span>
            <span className="text-[10px] text-slate-500">PDFs, certidões VEC e cálculos judiciais</span>
            <input type="file" multiple className="hidden" accept="image/*,application/pdf,.pdf" onChange={handleFileUpload} />
          </label>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Arquivos Anexados ({files.length})
                </span>
                <button onClick={() => setFiles([])} className="text-[10px] font-bold text-red-400 hover:underline">
                  LIMPAR
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <span className="text-slate-300 truncate text-[11px] max-w-[200px]" title={f.name}>{f.name}</span>
                    <span className="text-[9px] text-slate-500 mr-2">({formatFileSize(f.size)})</span>
                    <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleExtract} 
                disabled={loading} 
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all active:scale-[0.99] mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={15}/> : <Gavel size={15}/>} 
                <span>{loading ? 'Analisando Certidões...' : 'Iniciar Extração Jurídica'}</span>
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-red-300 text-xs">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Erro ao extrair</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-950 p-8 lg:p-12 overflow-y-auto flex flex-col items-center custom-scrollbar relative">
        {!data && !loading && (
          <div className="my-auto text-center space-y-4 max-w-sm animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-slate-800">
              <Gavel size={36} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 uppercase tracking-tight">Extração de Multa Penal</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Carregue a Certidão de Multa Penal da VEC ou cálculo de liquidação. A IA extrairá os dados completos do réu, situação prisional, trânsito em julgado e valores.
            </p>
          </div>
        )}
        
        {loading && (
          <div className="my-auto flex flex-col items-center gap-3 animate-in fade-in">
            <Loader2 className="animate-spin text-purple-500" size={44} />
            <p className="text-sm font-semibold text-slate-200">Processando e consolidando dados da multa...</p>
            <p className="text-xs text-slate-500">Cruzando qualificações, valores de dias-multa e situação prisional</p>
          </div>
        )}
        
        {data && (
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in slide-in-from-bottom border-t-4 border-t-purple-600 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Dados Consolidados da Multa</h2>
                <p className="text-[11px] text-purple-400 font-bold uppercase tracking-widest mt-0.5">Execução Penal - Art. 51 do CP</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={copySummaryForPetition}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                    copiedField === 'all_summary' ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30'
                  }`}
                >
                  {copiedField === 'all_summary' ? <CheckCircle size={14} /> : <Copy size={14} />}
                  <span>{copiedField === 'all_summary' ? 'Copiado!' : 'Copiar Resumo da Petição'}</span>
                </button>

                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                  data.estaPreso?.toLowerCase().includes('sim') ? 'bg-red-950/70 text-red-400 border border-red-800/60' : 'bg-green-950/70 text-green-400 border border-green-800/60'
                }`}>
                  <ShieldAlert size={13} />
                  <span>{data.estaPreso?.toLowerCase().includes('sim') ? 'Sentenciado Preso' : 'Sentenciado Solto'}</span>
                </div>
              </div>
            </div>

            {/* Grid of Extracted Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="md:col-span-2">
                <DataField id="proc" label="Número do Processo Crime" value={data.numeroProcesso} icon={FileText} />
              </div>
              <DataField id="exec" label="Número da Execução" value={data.numeroExecucao} icon={FileText} />

              <div className="md:col-span-2">
                <DataField id="nome" label="Nome do Sentenciado" value={data.nomeParte} icon={User} />
              </div>
              <DataField id="cpf" label="CPF" value={data.cpf} icon={Fingerprint} />

              <DataField id="rg" label="RG" value={data.rg} icon={Fingerprint} />
              <DataField id="mae" label="Filiação Materna" value={data.filiacaoMae} icon={User} />
              <DataField id="nasc" label="Data de Nascimento" value={data.dataNascimento} icon={Calendar} />

              <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-xl md:col-span-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign size={14} className="text-purple-400" />
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Valores da Condenação Penal</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Valor Total Calculado</span>
                    <p className="text-base font-bold text-green-400">{data.valorMulta || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Dias-Multa</span>
                    <p className="text-sm font-semibold text-slate-200">{data.quantidadeDiasMulta || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Fração Fixada</span>
                    <p className="text-sm font-semibold text-slate-200">{data.fracaoDiaMulta || '-'}</p>
                  </div>
                </div>
              </div>

              <DataField id="vara" label="Vara Criminal Origem" value={data.varaOrigem} icon={Building2} />
              <DataField id="comarca" label="Comarca" value={data.comarca} icon={Building2} />
              <DataField id="transito" label="Trânsito em Julgado" value={data.dataTransitoJulgado} icon={Calendar} />

              {data.estabelecimentoPrisional && (
                <div className="md:col-span-3">
                  <DataField id="presidio" label="Estabelecimento Prisional" value={data.estabelecimentoPrisional} icon={Building2} />
                </div>
              )}

              <div className="md:col-span-3">
                <DataField 
                  id="end_completo" 
                  label="Endereço Completo para Notificação/Citação" 
                  value={`${data.endereco || ''} ${data.numero ? ', nº ' + data.numero : ''} ${data.bairro ? '- ' + data.bairro : ''} ${data.cidade ? '- ' + data.cidade : ''}${data.uf ? '/' + data.uf : ''} ${data.cep ? '(CEP: ' + data.cep + ')' : ''}`.trim()} 
                  icon={MapPin} 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Extraído com precisão a partir de {files.length} documento(s)
              </span>
              <button 
                onClick={() => setData(null)} 
                className="text-xs font-bold text-slate-400 hover:text-purple-400 uppercase tracking-widest transition-colors"
              >
                Limpar e Nova Extração
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultaPenalTool;
