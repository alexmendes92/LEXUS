
import React, { useMemo, useState } from 'react';
import { CaseData, Person, Gender } from '../types';
import { Bold, Italic, Underline, List, ListOrdered, MoreHorizontal, Copy, Zap, CheckCircle } from 'lucide-react';

interface DocumentPreviewProps {
  caseData: CaseData;
  people: Person[];
  onReset: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ caseData, people, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [isPreviewBlank, setIsPreviewBlank] = useState(false);

  // Extract the number from cargo for the (C.XX) suffix
  const cargoCode = useMemo(() => {
    if (!caseData.cargo || isPreviewBlank) return "";
    const match = caseData.cargo.match(/\d+/);
    return match ? `(C.${match[0]})` : "";
  }, [caseData.cargo, isPreviewBlank]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Formato vindo do input date é YYYY-MM-DD
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateString;
  };

  const generatedContent = useMemo(() => {
    const renderPersonTemplate = (p: Partial<Person>) => `
      <ul style="list-style-type: disc; margin-left: 40px; margin-bottom: 24px; padding-left: 0; font-family: 'Inter', sans-serif; font-size: 14px; color: #000;">
        <li style="margin-bottom: 4px;"><b>Nome:</b> ${p.nome || '________________'} - (Fls. ${p.folha || '____'})</li>
        <li style="margin-bottom: 4px;"><b>Nacionalidade:</b> ${p.nacionalidade || '________________'}</li>
        <li style="margin-bottom: 4px;"><b>CPF:</b> ${p.cpf || '________________'}</li>
        <li style="margin-bottom: 4px;"><b>RG:</b> ${p.rg || '________________'}</li>
        <li style="margin-bottom: 4px;"><b>Pai:</b> ${p.pai || '________________'}</li>
        <li style="margin-bottom: 4px;"><b>Mãe:</b> ${p.mae || '________________'}</li>
        <li style="margin-bottom: 4px;"><b>Data de Nascimento:</b> ${p.dataNascimento ? formatDate(p.dataNascimento) : '____/____/____'}</li>
      </ul>
    `;

    const listItems = isPreviewBlank 
      ? renderPersonTemplate({}) 
      : people.map(p => renderPersonTemplate(p)).join('');

    const processNumber = isPreviewBlank ? '________________' : (caseData.numeroProcesso || '________________');
    const promotorName = isPreviewBlank ? '________________' : (caseData.promotor || '________________');
    const cargoTitle = isPreviewBlank ? '________________' : (caseData.cargo || '________________');
    const dataAudiencia = isPreviewBlank ? '____/____/____' : formatDate(caseData.dataAudiencia);

    const urgentNotice = (caseData.urgente && !isPreviewBlank) ? `
      <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 24px; color: #b91c1c; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">
        🚨 URGENTE: AUDIÊNCIA DESIGNADA PARA ${dataAudiencia} 🚨
      </div>
    ` : '';

    return `
      <div style="font-family: 'Inter', sans-serif; color: #000; line-height: 1.6; font-size: 14px;">
        ${urgentNotice}
        <p style="margin-bottom: 24px;"><b>Pesquisa - Autos - ${processNumber} ${cargoCode}</b></p>
        
        <p style="margin-bottom: 24px;">Prezados,</p>
        
        <p style="margin-bottom: 24px;">
          A pedido do(a). Dr.(a) <b>${promotorName}</b>, ${cargoTitle}, solicito a localização de:
        </p>
        
        <div style="margin-bottom: 32px;">
          ${(isPreviewBlank || people.length > 0) ? listItems : '<p style="color: #94a3b8; font-style: italic; margin-left: 40px;">Adicione partes para visualizar aqui...</p>'}
        </div>
        
        <p>Atenciosamente,</p>
      </div>
    `;
  }, [caseData, people, cargoCode, isPreviewBlank]);

  const handleCopy = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generatedContent;
    
    // Fallback para texto plano mantendo o máximo de estrutura
    const plainText = tempDiv.innerText;

    const htmlBlob = new Blob([generatedContent], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    
    navigator.clipboard.write([
        new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
        })
    ]).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error('Falha ao copiar:', err);
      alert('Erro ao copiar conteúdo.');
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden">
      {/* Barra de Título */}
      <div className="bg-slate-50 py-3 px-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Visualização do Ofício</h3>
          
          <div className="flex bg-slate-200 p-1 rounded-lg shadow-inner">
            <button 
              onClick={() => setIsPreviewBlank(false)}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${!isPreviewBlank ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Preenchido
            </button>
            <button 
              onClick={() => setIsPreviewBlank(true)}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${isPreviewBlank ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Em Branco
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
      </div>

      {/* Barra de Ferramentas Simbolizada */}
      <div className="bg-white border-b border-slate-100 p-2 flex items-center gap-3 text-slate-400 overflow-x-auto">
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer whitespace-nowrap">
          Corpo do Texto <span className="ml-1 text-[10px]">▼</span>
        </div>
        <div className="w-px h-4 bg-slate-200 shrink-0"></div>
        <button className="hover:bg-slate-50 p-1.5 rounded transition-colors"><Bold size={16} /></button>
        <button className="hover:bg-slate-50 p-1.5 rounded transition-colors"><Italic size={16} /></button>
        <button className="hover:bg-slate-50 p-1.5 rounded transition-colors"><Underline size={16} /></button>
        <div className="w-px h-4 bg-slate-200 shrink-0"></div>
        <button className="hover:bg-slate-50 p-1.5 rounded transition-colors"><List size={16} /></button>
        <button className="hover:bg-slate-50 p-1.5 rounded transition-colors"><ListOrdered size={16} /></button>
        <div className="w-px h-4 bg-slate-200 shrink-0"></div>
        <button className="hover:bg-slate-50 p-1.5 rounded transition-colors"><MoreHorizontal size={16} /></button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-100/50 flex flex-col items-center">
        <div className="w-full max-w-[800px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] border border-slate-200 rounded-sm p-12 min-h-[600px] transition-all text-black">
          <div 
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: generatedContent }}
          />
        </div>
      </div>

      {/* Ações Inferiores */}
      <div className="bg-white p-4 md:p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
        <button 
             onClick={handleCopy}
             className={`px-6 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 font-medium transition-all transform active:scale-95 ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
        >
            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
            {copied ? 'Copiado!' : 'Copiar Texto'}
        </button>
        <button 
            onClick={onReset}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 font-bold transition-all transform active:scale-95"
        >
          <Zap size={18} fill="currentColor" /> NOVO PROCESSO
        </button>
      </div>
    </div>
  );
};

export default DocumentPreview;
    