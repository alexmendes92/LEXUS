
import React from 'react';
import { Search, FileText, Mail, FileCheck, ArrowRight, Gavel, Archive, ListTodo, BrainCircuit, Database, Send, ScanText, Palette, ClipboardCheck, Stamp, FileSearch, Zap, BellRing, BookOpen, PartyPopper, Server, FileBarChart, CalendarClock, Landmark, TrendingUp } from 'lucide-react';
import { AppScreen } from '../types';

interface DashboardProps {
  onSelectScreen: (screen: AppScreen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectScreen }) => {
  const tools = [
    // --- 1. ROTINA DIÁRIA (CORE) ---
    {
      id: 'ACTIVITIES' as AppScreen,
      title: 'Minhas Atividades',
      description: 'Gerencie e acompanhe suas atividades e processos pessoais.',
      icon: <ListTodo className="text-teal-400" size={32} />,
      color: 'bg-teal-950/40',
      borderColor: 'border-teal-800/50'
    },
    {
      id: 'DESPACHO_AGENDAMENTO' as AppScreen,
      title: 'Agendamento',
      description: 'Agende oitivas, reuniões e despachos com geração de convites.',
      icon: <CalendarClock className="text-pink-400" size={32} />,
      color: 'bg-pink-950/40',
      borderColor: 'border-pink-800/50'
    },
    {
      id: 'PESQUISA_NI' as AppScreen,
      title: 'Pesquisa de NI',
      description: 'Gere solicitações de localização de partes para o SIS/NI.',
      icon: <Search className="text-amber-400" size={32} />,
      color: 'bg-amber-950/40',
      borderColor: 'border-amber-800/50'
    },

    // --- 2. GESTÃO ANPP ---
    {
      id: 'ANPP' as AppScreen,
      title: 'Formulário ANPP',
      description: 'Acordo de Não Persecução Penal (Minuta e Teams).',
      icon: <FileCheck className="text-green-400" size={32} />,
      color: 'bg-green-950/40',
      borderColor: 'border-green-800/50'
    },
    {
      id: 'ANPP_EXECUTIONS' as AppScreen,
      title: 'Execução ANPP',
      description: 'Fiscalize o cumprimento das obrigações (Pagamentos/Serviços).',
      icon: <TrendingUp className="text-emerald-400" size={32} />,
      color: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/50'
    },
    {
      id: 'ANPP_BANKING' as AppScreen,
      title: 'Dados Bancários',
      description: 'Gere o termo de dados bancários para restituição.',
      icon: <Landmark className="text-lime-400" size={32} />,
      color: 'bg-lime-950/40',
      borderColor: 'border-lime-800/50'
    },

    // --- 3. DOCUMENTOS & MODELOS ---
    {
      id: 'SISDIGITAL' as AppScreen,
      title: 'SISDIGITAL',
      description: 'Termo de Conclusão para Notícia de Fato.',
      icon: <FileText className="text-blue-400" size={32} />,
      color: 'bg-blue-950/40',
      borderColor: 'border-blue-800/50'
    },
    {
      id: 'OFICIO' as AppScreen,
      title: 'Ofício',
      description: 'Modelos de ofícios para DPs, GAESP, Corregedoria e outros.',
      icon: <Mail className="text-red-400" size={32} />,
      color: 'bg-red-950/40',
      borderColor: 'border-red-800/50'
    },

    // --- 4. PROCEDIMENTOS ESPECÍFICOS ---
    {
      id: 'PROVIDENCIAS' as AppScreen,
      title: 'Providências',
      description: 'Gerador de Certidões simples para cumprimento de cotas.',
      icon: <ClipboardCheck className="text-cyan-400" size={32} />,
      color: 'bg-cyan-950/40',
      borderColor: 'border-cyan-800/50'
    },
    {
      id: 'NOTICIA_FATO_PROCEDURE' as AppScreen,
      title: 'Procedimento N.F.',
      description: 'Documentar tentativas de contato e declarações em Notícia de Fato.',
      icon: <FileSearch className="text-orange-400" size={32} />,
      color: 'bg-orange-950/40',
      borderColor: 'border-orange-800/50'
    },
    {
      id: 'MULTA_PENAL' as AppScreen,
      title: 'Multa Penal',
      description: 'Extração automática de dados de certidões de multa.',
      icon: <Gavel className="text-purple-400" size={32} />,
      color: 'bg-purple-950/40',
      borderColor: 'border-purple-800/50'
    },
    {
      id: 'PROMOCAO_ARQUIVAMENTO' as AppScreen,
      title: 'Arquivamento',
      description: 'Limpeza e extração de texto de Promoções de Arquivamento.',
      icon: <Archive className="text-slate-400" size={32} />,
      color: 'bg-slate-900',
      borderColor: 'border-slate-800'
    },
    {
      id: 'INTIMACAO_ARQUIVAMENTO' as AppScreen,
      title: 'Notificação de Arquivamento',
      description: 'Gestão de comunicações (Art. 28 CPP) via WhatsApp, E-mail e Correios.',
      icon: <BellRing className="text-rose-400" size={32} />,
      color: 'bg-rose-950/40',
      borderColor: 'border-rose-800/50'
    },

    // --- 5. INTELIGÊNCIA & UTILITÁRIOS ---
    {
      id: 'CERTIDAO_GENERATOR' as AppScreen,
      title: 'Gerador de Modelos',
      description: 'Crie certidões complexas baseadas em seus modelos PDF.',
      icon: <Stamp className="text-emerald-400" size={32} />,
      color: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/50'
    },
    {
      id: 'DATA_EXTRACTOR' as AppScreen,
      title: 'Extrator Inteligente',
      description: 'Envie um PDF e peça para extrair qualquer dado específico.',
      icon: <ScanText className="text-sky-400" size={32} />,
      color: 'bg-sky-950/40',
      borderColor: 'border-sky-800/50'
    },
    {
      id: 'MENTOR' as AppScreen,
      title: 'Mentor Jurídico',
      description: 'Análise avançada de peças e orientação jurídica via IA.',
      icon: <BrainCircuit className="text-violet-400" size={32} />,
      color: 'bg-violet-950/40',
      borderColor: 'border-violet-800/50'
    },

    // --- 6. GESTÃO & BEM-ESTAR ---
    {
      id: 'RELATORIO_CGMP' as AppScreen,
      title: 'Relatório CGMP',
      description: 'Tabela de produtividade mensal dos Promotores (Inquéritos, Audiências, etc).',
      icon: <FileBarChart className="text-blue-400" size={32} />,
      color: 'bg-blue-900/40',
      borderColor: 'border-blue-800/50'
    },
    {
      id: 'PARTY_FINANCE' as AppScreen,
      title: 'Gestor de Eventos',
      description: 'Controle financeiro de festas e confraternizações da 4ª PJ.',
      icon: <PartyPopper className="text-pink-400" size={32} />,
      color: 'bg-pink-950/40',
      borderColor: 'border-pink-800/50'
    },
    {
      id: 'DATABASE' as AppScreen,
      title: 'Gerenciador de Dados',
      description: 'Edite as tabelas de Promotores e Cargos do sistema.',
      icon: <Database className="text-indigo-400" size={32} />,
      color: 'bg-indigo-950/40',
      borderColor: 'border-indigo-800/50'
    },

    // --- 7. DOCUMENTAÇÃO ---
    {
      id: 'USER_GUIDE' as AppScreen,
      title: 'Guia do Usuário',
      description: 'Manual completo e tutoriais de uso das ferramentas do sistema.',
      icon: <BookOpen className="text-white" size={32} />,
      color: 'bg-indigo-600',
      borderColor: 'border-indigo-500'
    },
    {
      id: 'DB_SCHEMA_DOCS' as AppScreen,
      title: 'Estrutura de Dados (SQL)',
      description: 'Documentação técnica do esquema de banco de dados.',
      icon: <Server className="text-emerald-400" size={32} />,
      color: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/50'
    },
    {
      id: 'LAYOUT_DOCS' as AppScreen,
      title: 'Design System',
      description: 'Documentação visual, paleta de cores e estrutura do app.',
      icon: <Palette className="text-slate-200" size={32} />,
      color: 'bg-slate-800',
      borderColor: 'border-slate-600'
    }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-950 flex flex-col items-center custom-scrollbar">
      <div className="w-full max-w-6xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Painel de Ferramentas</h1>
          <p className="text-slate-500">Selecione a ferramenta que deseja utilizar para o seu processo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectScreen(tool.id)}
              className="group bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl hover:shadow-indigo-950/20 hover:border-slate-700 transition-all flex flex-col items-center text-center relative overflow-hidden active:scale-95"
            >
              <div className={`w-20 h-20 ${tool.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-1 ${tool.borderColor}`}>
                {tool.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3 uppercase tracking-tight">{tool.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {tool.description}
              </p>
              <div className="mt-auto flex items-center gap-2 text-slate-500 group-hover:text-slate-200 font-bold text-[10px] uppercase tracking-widest transition-colors">
                Acessar Ferramenta <ArrowRight size={14} />
              </div>
              
              <div className={`absolute top-0 right-0 w-24 h-24 ${tool.color} opacity-20 rounded-full blur-2xl -mr-12 -mt-12`}></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
