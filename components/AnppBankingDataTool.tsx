import React, { useState } from 'react';
import { Landmark, CreditCard, User, FileText, Copy, Printer, CheckCircle, Save, Upload, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { Type } from "@google/genai";
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart, formatFileSize } from '../lib/pdfUtils';

const AnppBankingDataTool: React.FC = () => {
  const [data, setData] = useState({
    nome: '',
    cpf: '',
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: 'Corrente',
    pix: '',
    processo: ''
  });
  const [copied, setCopied] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (file: File) => {
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);

    try {
      const ai = getGeminiClient();
      const generativePart = await fileToGenerativePart(file);

      const response = await ai.models.generateContent({
        model: RECOMMENDED_FLASH_MODEL,
        contents: [{
          parts: [
            generativePart,
            {
              text: `Analise este comprovante bancário, extrato, cartão, formulário ou petição em PDF/Imagem.
Extraia com exatidão os dados bancários e cadastrais para fins de restituição ou ANPP (Acordo de Não Persecução Penal).
Retorne estritamente o JSON válido conforme schema.`
            }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              processo: { type: Type.STRING, description: "Número do processo judicial se constar" },
              nome: { type: Type.STRING, description: "Nome do titular da conta" },
              cpf: { type: Type.STRING, description: "CPF ou CNPJ do titular" },
              banco: { type: Type.STRING, description: "Nome do banco ou instituição financeira" },
              agencia: { type: Type.STRING, description: "Número da agência bancária" },
              conta: { type: Type.STRING, description: "Número da conta com dígito verificador" },
              tipoConta: { type: Type.STRING, enum: ["Corrente", "Poupança"] },
              pix: { type: Type.STRING, description: "Chave PIX se indicada" }
            }
          }
        }
      });

      const extracted = JSON.parse(response.text || "{}");
      setData(prev => ({
        ...prev,
        nome: extracted.nome || prev.nome,
        cpf: extracted.cpf || prev.cpf,
        banco: extracted.banco || prev.banco,
        agencia: extracted.agencia || prev.agencia,
        conta: extracted.conta || prev.conta,
        tipoConta: extracted.tipoConta || prev.tipoConta,
        pix: extracted.pix || prev.pix,
        processo: extracted.processo || prev.processo
      }));
      setExtractSuccess(true);
      setTimeout(() => setExtractSuccess(false), 4000);
    } catch (err: any) {
      console.error("Bank data extract error:", err);
      setExtractError(err?.message || "Falha ao extrair dados do comprovante bancário.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopy = () => {
    const text = `
DADOS BANCÁRIOS PARA RESTITUIÇÃO / ANPP
Processo: ${data.processo || 'Não informado'}
Titular: ${data.nome || 'Não informado'}
CPF: ${data.cpf || 'Não informado'}
Banco: ${data.banco || 'Não informado'}
Agência: ${data.agencia || 'Não informado'}
Conta: ${data.conta || 'Não informado'} (${data.tipoConta})
Chave PIX: ${data.pix || 'Não informada'}
    `.trim();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const generatedTermo = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
        <h2 style="margin: 0; text-transform: uppercase;">Ministério Público do Estado de São Paulo</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">4ª Promotoria de Justiça Criminal da Capital</p>
      </div>

      <h3 style="text-align: center; text-transform: uppercase; text-decoration: underline; margin-bottom: 40px;">Formulário de Indicação de Dados Bancários</h3>

      <p style="text-align: justify; margin-bottom: 20px;">
        Eu, <b>${data.nome.toUpperCase() || '__________________________________'}</b>, inscrito(a) no CPF sob o nº <b>${data.cpf || '___.___.___-__'}</b>, 
        nos autos do processo nº <b>${data.processo || '___________________'}</b>, indico abaixo os dados bancários para fins de 
        recebimento de valores estipulados em Acordo de Não Persecução Penal (ANPP) ou Restituição:
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 30px 0; border: 1px solid #000;">
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background: #f0f0f0; font-weight: bold; width: 30%;">Instituição Bancária</td>
          <td style="padding: 10px; border: 1px solid #000;">${data.banco || ''}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background: #f0f0f0; font-weight: bold;">Agência</td>
          <td style="padding: 10px; border: 1px solid #000;">${data.agencia || ''}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background: #f0f0f0; font-weight: bold;">Conta</td>
          <td style="padding: 10px; border: 1px solid #000;">${data.conta || ''} (${data.tipoConta})</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background: #f0f0f0; font-weight: bold;">Chave PIX</td>
          <td style="padding: 10px; border: 1px solid #000;">${data.pix || ''}</td>
        </tr>
      </table>

      <p style="text-align: justify; margin-top: 40px;">
        Declaro que os dados acima são verdadeiros e que a conta informada é de minha titularidade, assumindo total responsabilidade pela veracidade das informações.
      </p>

      <div style="margin-top: 80px; text-align: center;">
        <p>São Paulo, ${new Date().toLocaleDateString('pt-BR')}</p>
        <br/><br/>
        <p>______________________________________________________</p>
        <p><b>${data.nome.toUpperCase() || 'ASSINATURA'}</b></p>
      </div>
    </div>
  `;

  const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all placeholder-slate-600";
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      <style>{`@media print { body * { visibility: hidden; } .printable, .printable * { visibility: visible; } .printable { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
      
      {/* Sidebar Form */}
      <div className="w-[420px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6 shadow-2xl z-10 overflow-y-auto custom-scrollbar no-print">
        <div className="flex items-center gap-3 mb-2 pb-3 border-b border-slate-800">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-md shadow-emerald-950"><Landmark size={20} /></div>
          <div>
            <h2 className="font-bold uppercase tracking-tight text-white">Dados Bancários</h2>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Restituição & ANPP</p>
          </div>
        </div>

        {/* AI Upload Comprovante Box */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-widest">
            <Sparkles size={14} /> Extração Automática de Comprovante
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Arraste um PDF ou foto do comprovante de conta, print de tela bancária ou cartão.
          </p>

          <label 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
            }}
            className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging ? 'border-emerald-400 bg-emerald-900/30' : 'border-emerald-800/60 bg-slate-950 hover:bg-slate-900 hover:border-emerald-500'
            }`}
          >
            {isExtracting ? (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <Loader2 size={20} className="animate-spin text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">Lendo Comprovante...</span>
              </div>
            ) : (
              <>
                <Upload size={18} className="text-emerald-400 mb-1" />
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                  Carregar PDF / Imagem Bancária
                </span>
                <span className="text-[9px] text-slate-500">Extrato, Comprovante ou Print</span>
              </>
            )}
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf,image/*,.pdf" 
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }} 
            />
          </label>

          {extractSuccess && (
            <div className="p-2.5 bg-emerald-950/70 border border-emerald-700 text-emerald-300 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              <span>Dados bancários preenchidos automaticamente!</span>
            </div>
          )}

          {extractError && (
            <div className="p-2.5 bg-red-950/70 border border-red-800 text-red-300 rounded-lg text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span>{extractError}</span>
              </div>
              <button onClick={() => setExtractError(null)} className="text-red-400 hover:text-white">
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Processo</label>
            <input type="text" name="processo" value={data.processo} onChange={handleChange} className={inputClass} placeholder="0000000-00.0000.8.26.0050" />
          </div>
          
          <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl space-y-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold uppercase text-xs tracking-widest">
              <User size={14}/> Beneficiário
            </div>
            <div>
              <label className={labelClass}>Nome Completo</label>
              <input type="text" name="nome" value={data.nome} onChange={handleChange} className={inputClass} placeholder="Nome do titular da conta" />
            </div>
            <div>
              <label className={labelClass}>CPF / CNPJ</label>
              <input type="text" name="cpf" value={data.cpf} onChange={handleChange} className={inputClass} placeholder="000.000.000-00" />
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl space-y-4">
            <div className="flex items-center gap-2 mb-2 text-slate-400 font-bold uppercase text-xs tracking-widest">
              <CreditCard size={14}/> Conta Bancária
            </div>
            <div>
              <label className={labelClass}>Banco</label>
              <input type="text" name="banco" value={data.banco} onChange={handleChange} className={inputClass} placeholder="Ex: Nubank, Banco do Brasil, Itaú" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Agência</label>
                <input type="text" name="agencia" value={data.agencia} onChange={handleChange} className={inputClass} placeholder="0001" />
              </div>
              <div>
                <label className={labelClass}>Conta</label>
                <input type="text" name="conta" value={data.conta} onChange={handleChange} className={inputClass} placeholder="12345-6" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tipo de Conta</label>
              <select name="tipoConta" value={data.tipoConta} onChange={handleChange} className={inputClass}>
                <option value="Corrente">Corrente</option>
                <option value="Poupança">Poupança</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Chave PIX (Opcional)</label>
              <input type="text" name="pix" value={data.pix} onChange={handleChange} className={inputClass} placeholder="CPF, e-mail, telefone ou chave aleatória" />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-slate-950 flex flex-col items-center">
         <div className="w-full max-w-3xl flex flex-col gap-6">
            <div className="flex justify-end gap-3 no-print">
                <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-slate-200 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-700 transition-all">
                    {copied ? <CheckCircle size={16}/> : <Copy size={16}/>} Copiar Dados
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950">
                    <Printer size={16}/> Imprimir Termo
                </button>
            </div>

            <div className="bg-white shadow-2xl rounded-sm p-12 min-h-[800px] printable">
                <div dangerouslySetInnerHTML={{ __html: generatedTermo }} />
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnppBankingDataTool;
