
import React, { useState, useMemo, useEffect } from 'react';
import { Person, PromotoriaDef } from '../types';
import { Search, Gavel, User, Mail, MessageCircle, Truck, Printer, Copy, CheckCircle, Trash2, Edit3, X, MapPin, BadgeCheck, FileStack, Plus, PlusCircle, LayoutList, BellRing, Send, Save, ArrowLeft, FileText, Loader2, FileSpreadsheet, Download, Sparkles, Clipboard, Building2, CalendarDays, HelpCircle, Archive, Upload, FileSignature, Image as ImageIcon, Files, FolderPlus, FolderOpen, Users, CheckCircle2, Circle, Paperclip, Fingerprint, Phone, AlertCircle } from 'lucide-react';
import { Type } from "@google/genai";
import { PDFDocument } from 'pdf-lib';
import { getGeminiClient, RECOMMENDED_FLASH_MODEL, fileToGenerativePart, formatFileSize } from '../lib/pdfUtils';

interface ArchivingNotificationToolProps {
  promotorias: PromotoriaDef[];
  onOpenHelp?: () => void;
}

// --- New Types for Process Management ---
interface ArchivedProcess {
  id: string;
  numero: string;
  promotor: string;
  cargo: string;
  partes: Person[];
  status: 'PENDENTE' | 'CONCLUIDO';
  createdAt: string;
}

const MOCK_PROCESSES: ArchivedProcess[] = [
  {
    id: '1',
    numero: '1533496-19.2025.8.26.0050',
    promotor: 'Margareth Ferraz França',
    cargo: '79º Promotor de Justiça',
    status: 'PENDENTE',
    createdAt: new Date().toISOString(),
    partes: [
      { id: 'p1', nome: 'LETICIA ALVES FERREIRA DE ARAUJO', tipoParte: 'Vítima', statusIntimacao: 'Pendente', folha: '99', telefone: '(11) 96084-4410', email: 'email@example.com', endereco: 'RUA TONI GAUDIO', numero: '584', bairro: 'ANHANGUERA', cidade: 'S.PAULO', complemento: 'CASA', cep: '05266-170' } as Person
    ]
  }
];

const ArchivingNotificationTool: React.FC<ArchivingNotificationToolProps> = ({ promotorias, onOpenHelp }) => {
  // --- Database State ---
  const [processes, setProcesses] = useState<ArchivedProcess[]>(MOCK_PROCESSES);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  
  // --- View Mode State ---
  const [viewMode, setViewMode] = useState<'LIST' | 'REGISTER' | 'WORK'>('LIST');

  // --- Registration Form State ---
  const [regData, setRegData] = useState({
    numero: '',
    promotor: '',
    cargo: '',
  });

  // --- Existing States (Mapped to Active Context) ---
  const [processoAtivo, setProcessoAtivo] = useState('');
  const [dipoInfo, setDipoInfo] = useState('1ª RAJ – Capital - Juiz das Garantias');
  
  // --- Promoção State ---
  const [promotionText, setPromotionText] = useState('');
  const [isPromotionLoading, setIsPromotionLoading] = useState(false);
  const [promoFiles, setPromoFiles] = useState<File[]>([]);
  const [isDraggingPromo, setIsDraggingPromo] = useState(false);
  
  // --- Merge State ---
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isDraggingMerge, setIsDraggingMerge] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isBlankCertidao, setIsBlankCertidao] = useState(false);

  // --- State de Seleção e Edição (Legacy adapted) ---
  const [selectedParteId, setSelectedParteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // --- Form State ---
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [aiInput, setAiInput] = useState('');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [extractionFile, setExtractionFile] = useState<File | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'DADOS' | 'PROMOCAO' | 'INTIMACAO' | 'CERTIDAO' | 'MERGE'>('DADOS');
  const [channel, setChannel] = useState<'WHATSAPP' | 'EMAIL' | 'CORREIOS'>('CORREIOS');
  const [copied, setCopied] = useState(false);
  const [docView, setDocView] = useState<'CERTIDAO' | 'PROMOCAO'>('CERTIDAO');

  // --- Derived States ---
  const activeProcess = useMemo(() => processes.find(p => p.id === activeProcessId), [processes, activeProcessId]);
  const activeParties = useMemo(() => activeProcess?.partes || [], [activeProcess]);
  const selectedParte = useMemo(() => activeParties.find(p => p.id === selectedParteId) || null, [activeParties, selectedParteId]);

  // --- Effects ---
  useEffect(() => {
    if (activeProcess) {
      setProcessoAtivo(activeProcess.numero);
    }
  }, [activeProcess]);

  useEffect(() => {
    if (selectedParte) {
      setFormData({ ...selectedParte });
      setAiInput('');
      setPastedImage(null);
      setExtractionFile(null);
    } else if (!isCreating) {
      setFormData({});
    }
  }, [selectedParte, isCreating]);

  // --- Registration Logic ---
  const getPromotorForDate = (cargoLabel: string) => {
    const promotoria = promotorias.find(p => p.label === cargoLabel);
    if (!promotoria) return "";
    const today = new Date().getDate();
    const entry = promotoria.schedule.find(s => today >= s.start && today <= s.end);
    return entry ? entry.name : (promotoria.schedule[0]?.name || "");
  };

  const handleRegisterProcess = () => {
    if (!regData.numero || !regData.promotor) return alert("Preencha os dados do processo.");
    const newProcess: ArchivedProcess = {
      id: crypto.randomUUID(),
      numero: regData.numero,
      promotor: regData.promotor,
      cargo: regData.cargo,
      partes: [], // Initial empty parties list
      status: 'PENDENTE',
      createdAt: new Date().toISOString()
    };
    setProcesses(prev => [newProcess, ...prev]);
    setActiveProcessId(newProcess.id);
    setViewMode('LIST');
    setRegData({ numero: '', promotor: '', cargo: '' });
  };

  const updateProcessStatus = (id: string, status: 'PENDENTE' | 'CONCLUIDO') => {
    setProcesses(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const updatePartyStatus = (parteId: string, status: string) => {
    if (!activeProcessId) return;
    setProcesses(prev => prev.map(proc => {
      if (proc.id === activeProcessId) {
        return {
          ...proc,
          partes: proc.partes.map(p => p.id === parteId ? { ...p, statusIntimacao: status as any } : p)
        };
      }
      return proc;
    }));
  };

  // --- Existing Logic (Adapted) ---
  const maskCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
  };

  const handleInputChange = (field: keyof Person, value: string) => {
    let formatted = value;
    if (field === 'cep') formatted = maskCEP(value);
    if (['nome', 'endereco', 'bairro', 'cidade', 'complemento', 'mae', 'pai'].includes(field)) {
        formatted = formatted.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleFetchCep = async () => {
    const cep = formData.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;
    
    setIsCepLoading(true);
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) {
            alert("CEP não encontrado.");
        } else {
            // NOTA: Complemento removido da atualização automática para preservar dados do usuário
            setFormData(prev => ({
                ...prev,
                endereco: data.logradouro?.toUpperCase(),
                bairro: data.bairro?.toUpperCase(),
                cidade: data.localidade?.toUpperCase(),
                uf: data.uf?.toUpperCase(),
            }));
        }
    } catch (e) {
        console.error("Erro ao buscar CEP", e);
    } finally {
        setIsCepLoading(false);
    }
  };

  const handleSaveParte = () => {
    if (!formData.nome || !activeProcessId) return alert("Erro ao salvar: Nome é obrigatório.");
    
    let newId = formData.id;
    if (!newId && isCreating) {
        newId = crypto.randomUUID();
    }

    const partyToSave = { ...formData, id: newId } as Person;

    // Update the party inside the process list
    setProcesses(prev => prev.map(proc => {
        if (proc.id === activeProcessId) {
            const exists = proc.partes.find(p => p.id === partyToSave.id);
            if (exists) {
                return { ...proc, partes: proc.partes.map(p => p.id === partyToSave.id ? partyToSave : p) };
            } else {
                return { ...proc, partes: [...proc.partes, partyToSave] };
            }
        }
        return proc;
    }));

    if (isCreating) {
        setIsCreating(false);
        if (newId) setSelectedParteId(newId);
    }
    setActiveTab('PROMOCAO');
  };

  // --- Handlers Auxiliares (Paste, Drag, AI) ---
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => { if (event.target?.result) setPastedImage(event.target.result as string); };
            if (blob) reader.readAsDataURL(blob);
            return;
        }
    }
  };

  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'error') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleSmartExtraction = async () => {
    if (!aiInput.trim() && !pastedImage && !extractionFile) {
      showFeedback("Cole um texto, imagem ou selecione um arquivo PDF para extrair.", "error");
      return;
    }
    setIsAiLoading(true);
    setActionFeedback(null);
    try {
      const ai = getGeminiClient();
      const parts: any[] = [];
      
      if (extractionFile) {
        const generativePart = await fileToGenerativePart(extractionFile);
        parts.push(generativePart);
        parts.push({ text: "Analise minuciosamente este documento processual (PDF/Imagem) e extraia com precisão os dados cadastrais da parte (Vítima, Investigado ou Representante). Retorne estritamente o JSON válido conforme schema." });
      } else if (pastedImage) {
        parts.push({ inlineData: { mimeType: "image/png", data: pastedImage.split(',')[1] } });
        parts.push({ text: "Extraia os dados cadastrais desta imagem. Retorne JSON válido conforme schema." });
      } else {
        parts.push({ text: `Analise o texto e extraia os dados cadastrais (Nome, Endereço, Número, Complemento, Bairro, Cidade, UF, CEP, Telefone, Email, CPF, RG, Fls). Padronize nomes e endereços em CAIXA ALTA. Texto: "${aiInput}"` });
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
              endereco: { type: Type.STRING }, 
              numero: { type: Type.STRING }, 
              complemento: { type: Type.STRING }, 
              bairro: { type: Type.STRING }, 
              cidade: { type: Type.STRING }, 
              uf: { type: Type.STRING }, 
              cep: { type: Type.STRING }, 
              email: { type: Type.STRING }, 
              telefone: { type: Type.STRING }, 
              cpf: { type: Type.STRING }, 
              rg: { type: Type.STRING }, 
              folha: { type: Type.STRING }, 
              tipoParte: { type: Type.STRING, enum: ['Vítima', 'Investigado', 'Representante da Vítima'] } 
            } 
          } 
        }
      });
      
      const extracted = JSON.parse(response.text || "{}");
      setFormData(prev => ({ 
        ...prev, 
        ...extracted, 
        cep: extracted.cep ? maskCEP(extracted.cep) : prev.cep 
      }));
      setPastedImage(null); 
      setAiInput(''); 
      setExtractionFile(null);
      showFeedback("Dados extraídos com sucesso!", "success");
    } catch (error: any) { 
      console.error("Smart extraction error:", error);
      showFeedback(error?.message || "Erro na extração dos dados do documento.", "error"); 
    } finally { 
      setIsAiLoading(false); 
    }
  };

  // --- PDF & Docs Handlers ---
  const handleDragOverPromo = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingPromo(true); };
  const handleDragLeavePromo = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingPromo(false); };
  const handleDropPromo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPromo(false);
    if (e.dataTransfer.files) setPromoFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleFormatPromotion = async () => {
    if (promoFiles.length === 0) {
      showFeedback("Selecione ao menos um arquivo PDF ou imagem da promoção.", "error");
      return;
    }
    setIsPromotionLoading(true);
    setActionFeedback(null);
    try {
      const ai = getGeminiClient();
      const parts: any[] = [];
      for (const file of promoFiles) {
        const generativePart = await fileToGenerativePart(file);
        parts.push(generativePart);
      }
      const instruction = "Limpe e formate este texto jurídico da Promoção de Arquivamento. Remova margens verticais, rodapés repetitivos, números de página e quebras de linha quebradas. Remova qualquer formatação Markdown (como **negrito**). Forneça o texto jurídico limpo, corrido e pronto para petição.";
      parts.push({ text: instruction });
      
      const response = await ai.models.generateContent({ 
        model: RECOMMENDED_FLASH_MODEL, 
        contents: [{ parts }] 
      });
      let cleanText = response.text || "";

      // Post-process text
      cleanText = cleanText.replace(/\*\*/g, '').replace(/^"|"$/g, '').trim();
      setPromotionText(cleanText);
      setActiveTab('INTIMACAO');
      showFeedback("Promoção tratada e unificada com sucesso!", "success");
    } catch (error: any) { 
      console.error("Format Error:", error);
      showFeedback(error?.message || "Erro ao formatar os documentos da promoção.", "error"); 
    } finally { 
      setIsPromotionLoading(false); 
    }
  };

  const handleDragOverMerge = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingMerge(true); };
  const handleDragLeaveMerge = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingMerge(false); };
  const handleDropMerge = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingMerge(false);
    if (e.dataTransfer.files) setMergeFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleMergePDFs = async () => {
    if (mergeFiles.length < 2) {
      showFeedback("Selecione pelo menos 2 arquivos PDFs para unir.", "error");
      return;
    }
    setIsMerging(true);
    setActionFeedback(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of mergeFiles) {
        try {
          const fileBuffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (fileErr: any) {
          console.error(`Erro no arquivo ${file.name}:`, fileErr);
          throw new Error(`Falha no arquivo "${file.name}": arquivo corrompido ou protegido por senha.`);
        }
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Unificado_${processoAtivo || 'Doc'}.pdf`;
      link.click();
      showFeedback("PDFs unificados com sucesso! Download iniciado.", "success");
    } catch (e: any) { 
      console.error("Merge error:", e);
      showFeedback(e?.message || "Erro ao unir PDFs.", "error"); 
    } finally { 
      setIsMerging(false); 
    }
  };

  const handleDownloadSMT = () => { 
    // Format based on user request: ;NOME;;;;;CEP;TIPO_LOG;LOGRADOURO;BAIRRO;CIDADE;UF;N;COMPLEMENTO;NUMERO;PROCESSO:XXXX;
    
    const cep = (formData.cep || '').replace(/\D/g, '');
    
    // Simple heuristic to split address type and name
    // Assumes first word is type (RUA, AV, ALAMEDA, etc.)
    const addressParts = (formData.endereco || '').split(' ');
    let tipoLog = '';
    let logradouro = formData.endereco || '';
    
    if (addressParts.length > 1) {
        tipoLog = addressParts[0];
        logradouro = addressParts.slice(1).join(' ');
    }

    const row = [
        '', // 0
        formData.nome || '', // 1
        '', // 2
        '', // 3
        '', // 4
        '', // 5
        cep, // 6
        tipoLog, // 7
        logradouro, // 8
        formData.bairro || '', // 9
        formData.cidade || '', // 10
        formData.uf || 'SP', // 11
        'N', // 12 - Fixed value based on example
        formData.complemento || '', // 13
        formData.numero || '', // 14
        `PROCESSO:${processoAtivo || ''}`, // 15
        '' // Trailing empty for semicolon
    ].join(';');
    
    const csvContent = "data:text/csv;charset=utf-8," + row;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SMT_${(formData.nome || 'SEM_NOME').split(' ')[0]}_${processoAtivo || 'PROCESSO'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const element = document.querySelector('.printable-content');
    if (element && (window as any).html2pdf) {
        const opt = {
            margin: 0, // Set to 0 because .a4-page already handles padding
            filename: `Certidao_${processoAtivo || 'Autos'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        (window as any).html2pdf().set(opt).from(element).save();
    } else {
        // Fallback to print if library not loaded
        document.title = `Certidão ${processoAtivo}`; 
        window.print(); 
        setTimeout(() => document.title = "MPSP App", 1000);
    }
  };

  // --- Templates ---
  const whatsappTemplate = useMemo(() => {
    if (!formData.nome) return '';
    return `Prezado(a) Sr(a). *${formData.nome}*,\n\nInformamos que houve uma manifestação pelo arquivamento do processo nº *${processoAtivo || '____________________'}*.`;
  }, [formData, processoAtivo]);

  const emailTemplate = useMemo(() => {
    if (!formData.nome) return '';
    return `Prezado(a) Sr(a). ${formData.nome},\n\nO Ministério Público comunica que, nos autos do processo nº ${processoAtivo || '____________________'}, foi apresentada promoção de arquivamento.`;
  }, [formData, processoAtivo]);

  const certidaoTemplate = useMemo(() => {
    if (!formData.nome && !isBlankCertidao) return '';
    const fullAddress = `${formData.endereco || ''}, ${formData.numero || 'S/N'} - ${formData.bairro || ''} - ${formData.cidade || ''}`.toUpperCase();
    const date = new Date().toLocaleDateString('pt-BR');
    
    let textoMeio = "";
    if (channel === 'EMAIL') {
        textoMeio = `através de correio eletrônico (e-mail) encaminhado ao endereço ${isBlankCertidao ? '________________' : (formData.email || '___')}`;
    } else if (channel === 'WHATSAPP') {
        textoMeio = `através de aplicativo de mensagem (WhatsApp) no número ${isBlankCertidao ? '________________' : (formData.telefone || '___')}`;
    } else {
        textoMeio = `através de Carta de Notificação enviada para ${isBlankCertidao ? '________________________________________________' : fullAddress}`;
    }

    const processNumber = isBlankCertidao ? '_________________________' : processoAtivo;
    const personName = isBlankCertidao ? '________________________________________' : formData.nome;
    const personType = isBlankCertidao ? '_________' : (formData.tipoParte || 'Vítima');
    const foroText = isBlankCertidao ? '________________________________________' : dipoInfo;
    const certDate = isBlankCertidao ? '____/____/____' : date;

    const textoCertifico = `Certifico e dou fé que, no dia ${certDate}, procedi com a comunicação a ${personName} (${personType}), ${textoMeio}, referente ao arquivamento do processo ${processNumber}.`;

    return `
      <div class="a4-page">
          <div class="header">
              <div class="header-logo"><div class="mpsp-logo"><span style="color:black">MP</span><span style="color:#c00000">SP</span></div></div>
              <div class="promotoria-text">4ª PROMOTORIA DE JUSTIÇA<br>CRIMINAL DA CAPITAL</div>
          </div>
          <div class="content">
              <h3 class="title">CERTIDÃO DE OFICIAL DE PROMOTORIA</h3>
              <div class="info-box"><p><b>Autos:</b> ${processNumber}</p><p><b>Foro:</b> ${foroText}</p></div>
              <p class="cert-text">${textoCertifico}</p>
              <br/>
              <p class="cert-text">Para Constar eu Alex Santana Mendes (Assinatura Eletrônica), Oficial de Promotoria I, realizei a emissão desta certidão.</p>
          </div>
          <div class="footer">
            Av. Dr. Abraão Ribeiro, 313, Térreo – Barra Funda – São Paulo/SP – CEP: 01133-020<br>
            Telefones: (11) 3429-6302 / (11) 3429-6363 – E-mail: 4pjcrimcentcap@mpsp.mp.br
          </div>
      </div>
    `;
  }, [formData, processoAtivo, dipoInfo, channel, isBlankCertidao]);

  const inputClass = "w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500";
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1";
  const sidebarInputClass = "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all placeholder-slate-600";

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-500 bg-slate-950">
      
      <style>{`
        /* Configuração de visualização em tela para simular papel */
        .a4-page {
            width: 210mm;
            height: 297mm; /* Changed from min-height to height to force 1 page */
            padding: 15mm 25mm; /* Margins: Top/Bottom 15mm, Sides 25mm to compensate for 0 margin in html2pdf */
            background: white;
            display: flex;
            flex-direction: column;
            margin: auto;
            color: black;
            font-family: 'Arial', sans-serif;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
            box-sizing: border-box;
            overflow: hidden;
        }

        /* Header Styling */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #b91c1c;
            padding-bottom: 15px;
            margin-bottom: 40px;
        }

        .header-logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .mpsp-logo {
            font-weight: 900;
            font-size: 36px;
            line-height: 1;
            letter-spacing: -2px;
        }

        .mpsp-text {
            border-left: 1px solid #999;
            padding-left: 15px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 500;
            line-height: 1.3;
            color: #333;
        }

        .promotoria-text {
            text-align: left;
            font-weight: 500;
            font-size: 11px;
            border-left: 3px solid #b91c1c;
            padding-left: 15px;
            line-height: 1.3;
            color: #333;
        }

        /* Content Styling */
        .content {
            flex: 1;
            color: #000;
        }

        h3.title {
            text-align: center;
            font-weight: 700;
            margin-bottom: 40px;
            text-transform: uppercase;
            font-size: 15px;
        }

        .info-box {
            margin-bottom: 40px;
            font-size: 14px;
            line-height: 1.6;
            color: #000;
        }

        .cert-text {
            text-align: justify;
            text-indent: 4em;
            margin-bottom: 10px;
            font-size: 14px; /* Reduced to ensure it fits on one page */
            line-height: 1.6; /* Reduced line spacing to ensure fit */
        }

        /* Footer Styling */
        .footer {
            margin-top: auto;
            border-top: 2px solid #b91c1c;
            padding-top: 12px;
            text-align: center;
            font-size: 10px;
            color: #333;
            line-height: 1.5;
        }

        /* Configuração de Impressão */
        @media print {
            @page { margin: 0; size: A4; }
            html, body { 
                background: white !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                color: black !important; 
                width: 210mm;
                height: 297mm;
            }
            
            body * { visibility: hidden; }
            
            .printable-content, .printable-content * { 
                visibility: visible; 
            }
            
            .printable-content {
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background: white !important;
                color: black !important;
                display: flex;
                justify-content: center;
                align-items: start;
            }
            
            .a4-page {
                box-shadow: none;
                width: 100%; 
                height: 100%;
                padding: 15mm 25mm !important;
                margin: 0;
                color: black !important;
                overflow: hidden;
            }
            
            .no-print { display: none !important; }
        }
      `}</style>

      {/* --- SIDEBAR: PROCESS LIST --- */}
      <div className="w-[350px] bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20 no-print">
        <div className="p-6 bg-slate-950 border-b border-slate-800 space-y-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600 rounded-lg text-white"><LayoutList size={20}/></div>
              <div><h2 className="font-bold text-slate-100 uppercase tracking-tight">Arquivamentos</h2><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Controle de Processos</p></div>
           </div>
           <button onClick={() => { setViewMode('REGISTER'); setActiveProcessId(null); setSelectedParteId(null); setIsCreating(false); }} className="w-full py-3 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-900/50 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all">
              <FolderPlus size={16}/> Novo Processo
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
           <div className="px-2 mb-1 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Processos ({processes.length})</span>
           </div>
           {processes
             .sort((a, b) => {
                // Sort Pending First, then Concluded
                if (a.status === b.status) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                return a.status === 'PENDENTE' ? -1 : 1;
             })
             .map(proc => (
             <button 
                key={proc.id} 
                onClick={() => { setActiveProcessId(proc.id); setViewMode('LIST'); setSelectedParteId(null); setIsCreating(false); }} 
                className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${activeProcessId === proc.id ? 'bg-slate-800 border-rose-500/50 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
             >
                <div className={`absolute left-0 top-0 w-1 h-full ${proc.status === 'CONCLUIDO' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{new Date(proc.createdAt).toLocaleDateString()}</span>
                    {proc.status === 'CONCLUIDO' && <CheckCircle2 size={14} className="text-green-500"/>}
                </div>
                <h4 className={`font-black text-sm truncate uppercase mb-1 ${activeProcessId === proc.id ? 'text-rose-400' : 'text-slate-200'}`}>{proc.numero}</h4>
                <p className="text-[10px] text-slate-500 truncate font-medium">{proc.promotor}</p>
             </button>
           ))}
        </div>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        
        {/* VIEW 1: REGISTRATION FORM */}
        {viewMode === 'REGISTER' && (
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex justify-center">
               <div className="w-full max-w-2xl space-y-8 animate-in fade-in zoom-in duration-300">
                  <div className="text-center">
                     <div className="w-16 h-16 bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20"><FolderPlus size={32} className="text-rose-500"/></div>
                     <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">Novo Arquivamento</h2>
                     <p className="text-slate-500 text-sm">Cadastre o processo para iniciar o fluxo.</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className={labelClass}>Número do Processo</label><input type="text" value={regData.numero} onChange={(e) => setRegData({...regData, numero: e.target.value})} className={inputClass} placeholder="0000000-00.0000.0.00.0000" autoFocus /></div>
                        <div>
                            <label className={labelClass}>Cargo</label>
                            <select 
                                value={regData.cargo} 
                                onChange={(e) => {
                                    const newCargo = e.target.value;
                                    const newPromotor = getPromotorForDate(newCargo);
                                    setRegData({...regData, cargo: newCargo, promotor: newPromotor});
                                }} 
                                className={inputClass}
                            >
                                <option value="">Selecione...</option>
                                {promotorias.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                            </select>
                        </div>
                        <div><label className={labelClass}>Promotor</label><input type="text" value={regData.promotor} onChange={(e) => setRegData({...regData, promotor: e.target.value})} className={inputClass} placeholder="Automático" /></div>
                     </div>

                     <button onClick={handleRegisterProcess} className="w-full bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2">
                        <Save size={18} /> Cadastrar Processo
                     </button>
                  </div>
               </div>
            </div>
        )}

        {/* VIEW 2 & 3: PROCESS DASHBOARD & WORKSPACE */}
        {viewMode !== 'REGISTER' && activeProcess && (
            <>
               {/* Context Header */}
               <div className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                        <FolderOpen size={20}/>
                     </div>
                     <div>
                        <h2 className="text-lg font-black text-slate-100 tracking-tight">{activeProcess.numero}</h2>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                           <span>{activeProcess.promotor}</span>
                           <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                           <span>{activeProcess.cargo}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button onClick={() => updateProcessStatus(activeProcess.id, activeProcess.status === 'PENDENTE' ? 'CONCLUIDO' : 'PENDENTE')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${activeProcess.status === 'CONCLUIDO' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-amber-900/20 text-amber-400 border-amber-900/50'}`}>
                        {activeProcess.status === 'CONCLUIDO' ? <CheckCircle2 size={16}/> : <Circle size={16}/>} {activeProcess.status}
                     </button>
                  </div>
               </div>

               {/* Process Dashboard (List of Parties) */}
               {!selectedParteId && !isCreating ? (
                  <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                     <div className="max-w-4xl mx-auto">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={16}/> Partes Envolvidas</h3>
                        <div className="grid gap-3">
                           {activeProcess.partes.map(p => (
                              <button 
                                key={p.id} 
                                onClick={() => { setSelectedParteId(p.id); setViewMode('WORK'); setActiveTab('DADOS'); }}
                                className="w-full bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-4 rounded-xl flex items-center justify-between group transition-all"
                              >
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${p.statusIntimacao === 'Concluído' ? 'bg-green-900/20 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
                                       {p.nome.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                       <h4 className="font-bold text-slate-200 group-hover:text-rose-400 transition-colors">{p.nome}</h4>
                                       <p className="text-xs text-slate-500">{p.tipoParte}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${p.statusIntimacao === 'Concluído' ? 'bg-green-900/20 text-green-500' : 'bg-slate-950 text-slate-500'}`}>
                                       {p.statusIntimacao}
                                    </span>
                                    <ArrowLeft size={16} className="text-slate-600 rotate-180 group-hover:translate-x-1 transition-transform"/>
                                 </div>
                              </button>
                           ))}
                           <button onClick={() => { setViewMode('WORK'); setIsCreating(true); setSelectedParteId(null); setActiveTab('DADOS'); setFormData({}); }} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-700 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all">
                              <Plus size={16}/> Adicionar Outra Parte
                           </button>
                        </div>
                     </div>
                  </div>
               ) : (
                  // WORKSPACE (Tabs)
                  <>
                    <div className="bg-slate-900 border-b border-slate-800 px-8 pt-4 flex gap-4 overflow-x-auto no-print sticky top-0 z-10 custom-scrollbar">
                       <button onClick={() => { setSelectedParteId(null); setIsCreating(false); }} className="flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white mr-4 border-r border-slate-800 pr-4">
                          <ArrowLeft size={16}/> Voltar
                       </button>
                       {[
                         { id: 'DADOS', label: '1. Dados', icon: <User size={16}/> },
                         { id: 'PROMOCAO', label: '2. Promoção', icon: <Archive size={16}/> },
                         { id: 'INTIMACAO', label: '3. Intimação', icon: <Send size={16}/> },
                         { id: 'CERTIDAO', label: '4. Documentos', icon: <FileSignature size={16}/> },
                         { id: 'MERGE', label: '5. Unir Docs', icon: <Files size={16}/> },
                       ].map((tab: any) => (
                         <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest transition-all relative shrink-0 ${activeTab === tab.id ? 'text-rose-500' : 'text-slate-500 hover:text-slate-300'}`}>
                            {tab.icon} {tab.label}{activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 rounded-t-full"></div>}
                         </button>
                       ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-slate-950">
                      <div className="max-w-5xl mx-auto">
                        {actionFeedback && (
                          <div className={`p-4 rounded-xl mb-6 border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
                            actionFeedback.type === 'success' ? 'bg-green-950/50 border-green-800 text-green-300' : 'bg-red-950/50 border-red-800 text-red-300'
                          }`}>
                            <div className="flex items-center gap-2">
                              {actionFeedback.type === 'success' ? <CheckCircle size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}
                              <span>{actionFeedback.message}</span>
                            </div>
                            <button onClick={() => setActionFeedback(null)} className="p-1 hover:text-white">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        {/* --- TAB CONTENT (Reuse existing render logic) --- */}
                        {activeTab === 'DADOS' && (
                          <div className="animate-in slide-in-from-bottom-4 space-y-6">
                             {/* Existing DADOS tab content logic... reused */}
                             <div className="bg-amber-950/20 border border-amber-900/40 p-6 rounded-2xl mb-6 shadow-lg">
                                <div className="flex items-center gap-2 mb-3"><Sparkles className="text-amber-500" size={18}/><h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Extração Inteligente</h3></div>
                                <div className="flex gap-2 relative">
                                   {/* File Input for Extraction */}
                                   <label className="flex items-center justify-center p-3 bg-slate-900 border border-amber-900/50 hover:border-amber-500 rounded-xl cursor-pointer transition-colors">
                                      <Upload size={16} className="text-amber-500" />
                                      <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => { if (e.target.files?.[0]) setExtractionFile(e.target.files[0]); }} />
                                   </label>
                                   
                                   {/* Input Area */}
                                   <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
                                       {extractionFile ? (
                                           <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/30 px-3 py-1 rounded-lg w-full">
                                               <Paperclip size={12}/> {extractionFile.name}
                                               <button onClick={() => setExtractionFile(null)} className="ml-auto hover:text-white"><X size={12}/></button>
                                           </div>
                                       ) : pastedImage ? (
                                           <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/30 px-3 py-1 rounded-lg w-full">
                                               <ImageIcon size={12}/> Imagem Colada
                                               <button onClick={() => setPastedImage(null)} className="ml-auto hover:text-white"><X size={12}/></button>
                                           </div>
                                       ) : (
                                           <textarea value={aiInput} onChange={(e) => setAiInput(e.target.value)} onPaste={handlePaste} placeholder="Cole texto, imagem ou anexe arquivo..." className="w-full bg-transparent text-xs text-slate-200 resize-none h-10 outline-none placeholder-slate-600"/>
                                       )}
                                   </div>
                                   
                                   <button onClick={handleSmartExtraction} disabled={isAiLoading} className="bg-amber-600 hover:bg-amber-500 text-white px-6 rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2">{isAiLoading ? <Loader2 className="animate-spin"/> : <Clipboard size={16}/>} Extrair</button>
                                </div>
                             </div>
                             
                             <div className="bg-white p-8 rounded-lg shadow-xl border border-slate-200 relative">
                                <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                                    <div className="col-span-12 md:col-span-6"><label className={labelClass}>Nome Completo *</label><input type="text" value={formData.nome || ''} onChange={(e) => handleInputChange('nome', e.target.value)} className={inputClass}/></div>
                                    <div className="col-span-12 md:col-span-3"><label className={labelClass}>Tipo</label><select value={formData.tipoParte || 'Vítima'} onChange={(e) => setFormData({...formData, tipoParte: e.target.value as any})} className={inputClass}><option value="Vítima">Vítima</option><option value="Investigado">Investigado</option></select></div>
                                    <div className="col-span-12 md:col-span-3"><label className={labelClass}>Fls.</label><input type="text" value={formData.folha || ''} onChange={(e) => handleInputChange('folha', e.target.value)} className={inputClass} placeholder="00"/></div>
                                    
                                    <div className="col-span-12 md:col-span-4 relative">
                                        <label className={labelClass}>CEP</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.cep || ''} 
                                                onChange={(e) => handleInputChange('cep', e.target.value)} 
                                                onBlur={handleFetchCep}
                                                className={`${inputClass} pr-10`} 
                                                placeholder="00000-000"
                                            />
                                            <button 
                                                onClick={handleFetchCep} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-700"
                                                disabled={isCepLoading}
                                            >
                                                {isCepLoading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-6"><label className={labelClass}>Endereço</label><input type="text" value={formData.endereco || ''} onChange={(e) => handleInputChange('endereco', e.target.value)} className={inputClass}/></div>
                                    <div className="col-span-12 md:col-span-2"><label className={labelClass}>Número</label><input type="text" value={formData.numero || ''} onChange={(e) => handleInputChange('numero', e.target.value)} className={inputClass}/></div>
                                    
                                    <div className="col-span-12 md:col-span-4"><label className={labelClass}>Bairro</label><input type="text" value={formData.bairro || ''} onChange={(e) => handleInputChange('bairro', e.target.value)} className={inputClass}/></div>
                                    <div className="col-span-12 md:col-span-4"><label className={labelClass}>Cidade</label><input type="text" value={formData.cidade || ''} onChange={(e) => handleInputChange('cidade', e.target.value)} className={inputClass}/></div>
                                    <div className="col-span-12 md:col-span-4"><label className={labelClass}>Complemento</label><input type="text" value={formData.complemento || ''} onChange={(e) => handleInputChange('complemento', e.target.value)} className={inputClass}/></div>

                                    <div className="col-span-12 border-t border-slate-100 my-2"></div>

                                    <div className="col-span-12 md:col-span-6"><label className={labelClass}>Telefone / WhatsApp</label><div className="relative"><Phone size={14} className="absolute left-3 top-3 text-slate-400"/><input type="text" value={formData.telefone || ''} onChange={(e) => handleInputChange('telefone', e.target.value)} className={`${inputClass} pl-9`} placeholder="(11) 90000-0000"/></div></div>
                                    <div className="col-span-12 md:col-span-6"><label className={labelClass}>E-mail</label><div className="relative"><Mail size={14} className="absolute left-3 top-3 text-slate-400"/><input type="text" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className={`${inputClass} pl-9`} placeholder="email@exemplo.com"/></div></div>
                                </div>
                                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                                    <button onClick={() => selectedParte && updatePartyStatus(selectedParte.id, 'Concluído')} disabled={!selectedParte} className="text-green-600 font-bold text-xs uppercase hover:underline flex items-center gap-1 disabled:text-gray-400"><CheckCircle2 size={14}/> Marcar como Concluído</button>
                                    <button onClick={handleSaveParte} className="px-10 py-3 rounded-xl bg-rose-600 text-white font-black uppercase text-xs shadow-lg hover:bg-rose-500 flex items-center gap-2"><Save size={18} /> Salvar e Continuar</button>
                                </div>
                             </div>
                          </div>
                        )}
                        
                        {activeTab === 'PROMOCAO' && (
                           <div className="animate-in slide-in-from-bottom-4 space-y-6">
                              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-6">
                                 <h3 className="text-xl font-bold text-slate-100 uppercase">Promoção de Arquivamento</h3>
                                 <label onDrop={handleDropPromo} onDragOver={handleDragOverPromo} onDragLeave={handleDragLeavePromo} className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${isDraggingPromo ? 'border-rose-500 bg-rose-900/20' : 'border-slate-800 bg-slate-950 hover:bg-slate-900'}`}>
                                    <Upload className="mb-2 text-slate-500"/>
                                    <span className="text-xs font-bold uppercase text-slate-500">Arraste PDF/IMG</span>
                                    <input type="file" multiple className="hidden" accept="application/pdf,image/*" onChange={(e) => e.target.files && setPromoFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                                 </label>
                                 {promoFiles.length > 0 && (
                                     <div className="flex flex-wrap gap-2 justify-center">
                                         {promoFiles.map((f, i) => (
                                             <div key={i} className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                                                 <span className="text-xs text-slate-300 max-w-[200px] truncate">{f.name}</span>
                                                 <button onClick={() => setPromoFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-500"><X size={12}/></button>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                                 
                                 {isPromotionLoading && (
                                     <div className="w-full max-w-md mx-auto bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                                         <div className="h-full bg-rose-500 animate-pulse w-full"></div>
                                     </div>
                                 )}

                                 <button onClick={handleFormatPromotion} disabled={isPromotionLoading || promoFiles.length === 0} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs shadow-lg flex items-center gap-2 mx-auto hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                    {isPromotionLoading ? <Loader2 className="animate-spin"/> : <Sparkles size={16}/>} Formatar
                                 </button>
                              </div>
                           </div>
                        )}

                        {activeTab === 'INTIMACAO' && (
                           <div className="space-y-8 animate-in slide-in-from-bottom-4">
                              <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner w-fit">
                                 {[{ id: 'CORREIOS', label: 'Correios', icon: <Truck size={16}/> }, { id: 'WHATSAPP', label: 'WhatsApp', icon: <MessageCircle size={16}/> }, { id: 'EMAIL', label: 'E-mail', icon: <Mail size={16}/> }].map(ch => (
                                   <button key={ch.id} onClick={() => setChannel(ch.id as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${channel === ch.id ? 'bg-slate-800 text-slate-100 shadow-md' : 'text-slate-500 hover:text-slate-400'}`}>
                                      {ch.icon} {ch.label}
                                   </button>
                                 ))}
                              </div>
                              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                                 <div className="bg-slate-950 p-6 rounded-2xl text-slate-300 text-sm leading-relaxed border border-slate-800 italic">"{channel === 'WHATSAPP' ? whatsappTemplate : emailTemplate}"</div>
                                 <div className="flex gap-4 mt-6">
                                     <button onClick={() => {navigator.clipboard.writeText(channel==='WHATSAPP'?whatsappTemplate:emailTemplate); setCopied(true); setTimeout(()=>setCopied(false),2000)}} className="bg-slate-800 text-white py-3 px-6 rounded-xl font-bold uppercase text-xs flex items-center gap-2">
                                         {copied ? <CheckCircle size={16}/> : <Copy size={16}/>} Copiar
                                     </button>
                                     <button onClick={() => setActiveTab('CERTIDAO')} className="bg-rose-600 text-white py-3 px-10 rounded-xl font-bold uppercase text-xs flex items-center gap-2 shadow-lg ml-auto hover:bg-rose-500 transition-all">Próximo <ArrowLeft size={16} className="rotate-180"/></button>
                                 </div>
                              </div>
                           </div>
                        )}

                        {activeTab === 'CERTIDAO' && (
                           <div className="space-y-6 animate-in slide-in-from-bottom-4">
                              <div className="flex items-center gap-6">
                                <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner w-fit">
                                   <button onClick={() => setDocView('CERTIDAO')} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${docView === 'CERTIDAO' ? 'bg-slate-800 text-rose-400' : 'text-slate-500'}`}>Certidão</button>
                                   <button onClick={() => setDocView('PROMOCAO')} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${docView === 'PROMOCAO' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'}`}>Promoção</button>
                                </div>
                                {docView === 'CERTIDAO' && (
                                  <div className="flex bg-slate-200 p-1 rounded-lg shadow-inner">
                                    <button 
                                      onClick={() => setIsBlankCertidao(false)}
                                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${!isBlankCertidao ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                      Preenchido
                                    </button>
                                    <button 
                                      onClick={() => setIsBlankCertidao(true)}
                                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${isBlankCertidao ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                      Em Branco
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="bg-gray-100 p-4 rounded-xl shadow-2xl overflow-auto w-full min-h-[600px] flex justify-center">
                                 {docView === 'CERTIDAO' ? (
                                     <div className="printable-content" dangerouslySetInnerHTML={{ __html: certidaoTemplate }} />
                                 ) : (
                                     <div className="relative group">
                                         <button 
                                             onClick={() => {navigator.clipboard.writeText(promotionText); setCopied(true); setTimeout(()=>setCopied(false),2000)}} 
                                             className="absolute top-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 shadow-lg hover:bg-slate-700 transition-all z-10 opacity-0 group-hover:opacity-100 no-print"
                                         >
                                             {copied ? <CheckCircle size={14}/> : <Copy size={14}/>} {copied ? 'Copiado!' : 'Copiar Texto'}
                                         </button>
                                         <div className="p-16 font-serif text-[12pt] text-justify leading-relaxed whitespace-pre-wrap selection:bg-yellow-200 printable-content bg-white w-[210mm] min-h-[297mm] text-black">
                                             {promotionText || "Nenhuma promoção formatada ainda."}
                                         </div>
                                     </div>
                                 )}
                              </div>
                              <div className="flex gap-4">
                                 <button onClick={handleDownloadSMT} className="flex-1 bg-yellow-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-yellow-500 transition-all"><FileSpreadsheet size={20} /> CSV SMT</button>
                                 <button onClick={handleDownloadPDF} className="flex-[2] bg-rose-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-rose-500 transition-all"><Download size={20} /> Baixar PDF</button>
                              </div>
                           </div>
                        )}

                        {activeTab === 'MERGE' && (
                           <div className="animate-in slide-in-from-bottom-4 space-y-6">
                             <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 text-center">
                                <h3 className="text-xl font-bold text-slate-100 uppercase tracking-tight">Unir Documentos PDF</h3>
                                <label onDrop={handleDropMerge} onDragOver={handleDragOverMerge} onDragLeave={handleDragLeaveMerge} className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${isDraggingMerge ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-800 bg-slate-950 hover:bg-slate-900'}`}>
                                   <Upload className="mb-2 text-slate-600" />
                                   <span className="text-xs font-bold uppercase text-slate-500">Arraste os PDFs</span>
                                   <input type="file" multiple className="hidden" accept="application/pdf" onChange={(e) => e.target.files && setMergeFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                                </label>
                                {mergeFiles.length > 0 && (
                                     <div className="flex flex-wrap gap-2 justify-center">
                                         {mergeFiles.map((f, i) => (
                                             <div key={i} className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                                                 <span className="text-xs text-slate-300 max-w-[200px] truncate">{f.name}</span>
                                                 <button onClick={() => setMergeFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-500"><X size={12}/></button>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                                <button onClick={handleMergePDFs} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold uppercase text-xs shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50 hover:bg-indigo-500 transition-all">
                                   {isMerging ? <Loader2 className="animate-spin"/> : <Files size={16}/>} Unir PDF
                                </button>
                             </div>
                           </div>
                        )}

                      </div>
                    </div>
                  </>
               )}
            </>
        )}

        {!activeProcess && viewMode === 'LIST' && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-2xl border border-slate-800"><BellRing size={32} className="text-slate-700" /></div>
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tight">Controle de Arquivamento</h3>
                <p className="text-sm mt-2">Selecione um processo ou crie um novo.</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default ArchivingNotificationTool;
