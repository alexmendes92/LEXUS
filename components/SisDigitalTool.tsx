import React, { useState, useMemo } from 'react';
import { PromotoriaDef } from '../types';
import { 
  FileText, 
  Copy, 
  CheckCircle, 
  MessageSquare, 
  FilePlus, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw
} from 'lucide-react';

interface SisDigitalToolProps {
  promotorias: PromotoriaDef[];
}

const DEFAULT_JUNTADA_ITEMS = [
  'Certidão de Notificação',
  'Comprovante de Notificação via WhatsApp',
  'Manifestação da Vítima'
];

const SisDigitalTool: React.FC<SisDigitalToolProps> = ({ promotorias }) => {
  const [cargo, setCargo] = useState('');
  const [docId, setDocId] = useState('');
  const [tipoDoc, setTipoDoc] = useState<'NF' | 'ATENDIMENTO'>('NF');
  const [termoType, setTermoType] = useState<'CONCLUSAO' | 'JUNTADA'>('CONCLUSAO');
  
  // Lista de itens do termo de juntada
  const [items, setItems] = useState<string[]>(DEFAULT_JUNTADA_ITEMS);
  const [newItemText, setNewItemText] = useState('');

  const [copiedTermo, setCopiedTermo] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const selectedPromotoria = useMemo(() => 
    promotorias.find(p => p.label === cargo), [cargo, promotorias]);

  const promotorName = useMemo(() => {
    if (!selectedPromotoria || selectedPromotoria.schedule.length === 0) return "";
    return selectedPromotoria.schedule[0].name;
  }, [selectedPromotoria]);

  const cortesia = useMemo(() => {
    if (!selectedPromotoria || selectedPromotoria.schedule.length === 0) return "Dr(a).";
    return selectedPromotoria.schedule[0].gender === 'F' ? 'Dra.' : 'Dr.';
  }, [selectedPromotoria]);

  const cargoNumero = useMemo(() => {
    const match = cargo.match(/\d+/);
    return match ? match[0] : "";
  }, [cargo]);

  const docLabel = tipoDoc === 'NF' ? 'Notícia de Fato' : 'Atendimento';
  const docAbbr = tipoDoc === 'NF' ? 'N.F' : 'Atendimento';

  const handleAddItem = (textToAdd?: string) => {
    const value = (textToAdd !== undefined ? textToAdd : newItemText).trim();
    if (!value) return;
    setItems(prev => [...prev, value]);
    if (textToAdd === undefined) {
      setNewItemText('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, value: string) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleMoveItem = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === items.length - 1) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    setItems(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleResetItems = () => {
    setItems(DEFAULT_JUNTADA_ITEMS);
  };

  const termoConclusaoContent = useMemo(() => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #000; font-size: 14px;">
      <p style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 24px; font-size: 15px; letter-spacing: 0.5px;">TERMO DE CONCLUSÃO</p>
      <p style="margin-bottom: 4px;"><b>${docLabel} n°</b> ${docId || '____._______/____'}</p>
      <p style="margin-bottom: 24px;"><b>Cargo:</b> ${cargoNumero ? `${cargoNumero}° Promotor de Justiça Criminal da Capital` : '____° Promotor de Justiça Criminal da Capital'}</p>
      
      <p style="line-height: 1.8; text-align: justify;">
        Na data infra, eu, Alex Santana Mendes (assinatura eletrônica), Oficial de Promotoria, Matrícula 12078, faço estes autos conclusos ao(à) ${cortesia} <b>${promotorName || '________________'}</b>.
      </p>
    </div>
  `, [docId, cargoNumero, cortesia, promotorName, docLabel]);
  
  const termoJuntadaContent = useMemo(() => {
    const itemsHtml = items.length > 0 
      ? items.map(it => `
          <p style="margin: 6px 0 6px 20px; font-size: 14px; line-height: 1.6;">
            •&nbsp;&nbsp;${it}
          </p>
        `).join('')
      : `
          <p style="margin: 6px 0 6px 20px; font-size: 14px; line-height: 1.6; color: #777; font-style: italic;">
            •&nbsp;&nbsp;[Nenhum item informado]
          </p>
        `;

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #000; font-size: 14px;">
        <p style="text-align: center; font-weight: bold; text-decoration: underline; margin-bottom: 24px; font-size: 15px; letter-spacing: 0.5px;">TERMO DE JUNTADA</p>
        <p style="margin-bottom: 4px;"><b>${docLabel} n°</b> ${docId || '____._______/____'}</p>
        <p style="margin-bottom: 24px;"><b>Cargo:</b> ${cargoNumero ? `${cargoNumero}° Promotor de Justiça Criminal da Capital` : '____° Promotor de Justiça Criminal da Capital'}</p>
        
        <p style="line-height: 1.8; text-align: justify; margin-bottom: 16px;">
          Na data infra, eu, Alex Santana Mendes (assinatura eletrônica), Oficial de Promotoria, Matrícula 12078, juntei aos autos em epígrafe:
        </p>

        <div style="margin: 12px 0 24px 0;">
          ${itemsHtml}
        </div>
      </div>
    `;
  }, [docId, cargoNumero, docLabel, items]);

  const prosecutorMsg = useMemo(() => {
    const firstName = promotorName ? promotorName.split(' ')[0] : 'Promotor(a)';
    if (termoType === 'JUNTADA') {
      const summaryItems = items.length > 0 ? ` (${items.slice(0, 2).join(', ')}${items.length > 2 ? '...' : ''})` : '';
      return `${cortesia} ${firstName}, informo que foi realizada a juntada de documentos na ${docAbbr} ${docId || '____._______/____'}${summaryItems}.`;
    }
    return `${cortesia} ${firstName}, apenas para informar que foi aberto conclusão para análise na ${docAbbr} ${docId || '____._______/____'}`;
  }, [promotorName, cortesia, docAbbr, docId, termoType, items]);

  const handleCopyTermo = () => {
    const contentToCopy = termoType === 'CONCLUSAO' ? termoConclusaoContent : termoJuntadaContent;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentToCopy;
    const plainText = tempDiv.innerText;
    
    try {
      const htmlBlob = new Blob([contentToCopy], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      
      navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]).then(() => {
        setCopiedTermo(true);
        setTimeout(() => setCopiedTermo(false), 2000);
      }).catch(() => {
        // Fallback para plain text
        navigator.clipboard.writeText(plainText).then(() => {
          setCopiedTermo(true);
          setTimeout(() => setCopiedTermo(false), 2000);
        });
      });
    } catch {
      navigator.clipboard.writeText(plainText).then(() => {
        setCopiedTermo(true);
        setTimeout(() => setCopiedTermo(false), 2000);
      });
    }
  };

  const handleCopyMsg = () => {
    navigator.clipboard.writeText(prosecutorMsg).then(() => {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    });
  };

  const inputClass = "w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none transition-all placeholder-slate-500 text-slate-100";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      {/* Sidebar de Configurações */}
      <div className="w-[420px] bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-5 shadow-xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-bold uppercase tracking-tight text-slate-100 text-base">SISDIGITAL</h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Gerador de Termos Oficiais</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Seletor Conclusão / Juntada */}
          <div>
            <label className={labelClass}>Tipo de Termo</label>
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              <button 
                type="button"
                onClick={() => setTermoType('CONCLUSAO')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${termoType === 'CONCLUSAO' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileText size={14}/> Conclusão
              </button>
              <button 
                type="button"
                onClick={() => setTermoType('JUNTADA')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${termoType === 'JUNTADA' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FilePlus size={14}/> Juntada
              </button>
            </div>
          </div>
          
          {/* Seletor Notícia de Fato / Atendimento */}
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button 
              type="button"
              onClick={() => setTipoDoc('NF')}
              className={`py-2 text-[11px] font-bold uppercase rounded-lg transition-all ${tipoDoc === 'NF' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Notícia de Fato
            </button>
            <button 
              type="button"
              onClick={() => setTipoDoc('ATENDIMENTO')}
              className={`py-2 text-[11px] font-bold uppercase rounded-lg transition-all ${tipoDoc === 'ATENDIMENTO' ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Atendimento
            </button>
          </div>

          {/* Número do Procedimento */}
          <div>
            <label className={labelClass}>{tipoDoc === 'NF' ? 'Notícia de Fato nº' : 'Atendimento nº'}</label>
            <input 
              type="text" 
              value={docId} 
              onChange={(e) => setDocId(e.target.value)}
              placeholder="Ex: 38.0004.0000000/2026"
              className={inputClass}
            />
          </div>

          {/* Cargo do Promotor */}
          <div>
            <label className={labelClass}>Cargo (Promotoria)</label>
            <select 
              value={cargo} 
              onChange={(e) => setCargo(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione o Cargo</option>
              {promotorias.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
            </select>
          </div>
          
          {/* ITENS DE JUNTADA */}
          {termoType === 'JUNTADA' && (
            <div className="space-y-4 pt-3 border-t border-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FilePlus size={14} className="text-blue-400" />
                  Itens a Juntar ({items.length})
                </label>
                {items.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-semibold transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>

              {/* Input para Adicionar Novo Item */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newItemText} 
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  placeholder="Nome do documento / item..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/20 focus:border-blue-500 outline-none text-slate-100 placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  disabled={!newItemText.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                  title="Adicionar item"
                >
                  <Plus size={15} />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Lista dos Itens Atuais */}
              <div className="space-y-2 mt-2">
                {items.length === 0 ? (
                  <div className="p-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center">
                    <p className="text-xs text-slate-500">Nenhum item adicionado à lista.</p>
                    <button
                      type="button"
                      onClick={handleResetItems}
                      className="mt-2 text-[11px] text-blue-400 hover:underline flex items-center gap-1 mx-auto font-semibold"
                    >
                      <RotateCcw size={12} /> Restaurar itens padrão
                    </button>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 rounded-xl p-2 hover:border-slate-700 transition-all group"
                    >
                      <span className="text-blue-400 text-xs font-bold pl-1 select-none">•</span>
                      <input 
                        type="text" 
                        value={item}
                        onChange={(e) => handleUpdateItem(index, e.target.value)}
                        className="flex-1 bg-transparent text-xs text-slate-200 outline-none border-b border-transparent focus:border-blue-500 py-0.5"
                      />
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, 'UP')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 hover:bg-slate-800 rounded"
                          title="Mover para cima"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, 'DOWN')}
                          disabled={index === items.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-20 hover:bg-slate-800 rounded"
                          title="Mover para baixo"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                          title="Remover item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Destinatário (quando Conclusão) */}
          {termoType === 'CONCLUSAO' && (
            <div className="pt-3 animate-in fade-in duration-300">
               <div className="p-4 bg-blue-950/40 border border-blue-900/40 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Destinatário da Conclusão</p>
                  <p className="text-sm font-bold text-slate-200 uppercase">
                    {promotorName ? `${cortesia} ${promotorName}` : "Selecione um cargo..."}
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Área Central: Visualização do Documento e Mensagem */}
      <div className="flex-1 bg-slate-950 p-8 overflow-y-auto flex flex-col items-center gap-6 custom-scrollbar">
        {/* Document Card (Aparência Papel A4 Oficial) */}
        <div className="w-full max-w-[800px] bg-white shadow-2xl rounded-sm p-14 min-h-[460px] relative border border-slate-300 text-slate-900">
          <div dangerouslySetInnerHTML={{ __html: termoType === 'CONCLUSAO' ? termoConclusaoContent : termoJuntadaContent }} />
          
          <button 
            type="button"
            onClick={handleCopyTermo}
            className={`absolute top-6 right-6 px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-all ${
              copiedTermo 
                ? 'bg-green-600 text-white' 
                : 'bg-slate-900 hover:bg-blue-700 text-white'
            }`}
          >
            {copiedTermo ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copiedTermo ? 'Copiado Formatado!' : 'Copiar Termo'}
          </button>
        </div>

        {/* Prosecutor Message Card */}
        <div className="w-full max-w-[800px] bg-slate-900 shadow-lg border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={17} className="text-blue-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Mensagem para o Promotor (WhatsApp / Teams)
              </span>
            </div>
            <button 
              type="button"
              onClick={handleCopyMsg}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                copiedMsg 
                  ? 'bg-green-900/40 text-green-300 border border-green-800/50' 
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {copiedMsg ? <CheckCircle size={13} /> : <Copy size={13} />}
              {copiedMsg ? 'Copiado!' : 'Copiar Mensagem'}
            </button>
          </div>
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-300 text-xs leading-relaxed italic select-all">
            "{prosecutorMsg}"
          </div>
        </div>
      </div>
    </div>
  );
};

export default SisDigitalTool;
