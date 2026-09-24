
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SidebarForm from './components/SidebarForm';
import CaseInfoBar from './components/CaseInfoBar';
import DocumentPreview from './components/DocumentPreview';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import SisDigitalTool from './components/SisDigitalTool';
import OficioTool from './components/OficioTool';
import AnppTool from './components/AnppTool';
import MultaPenalTool from './components/MultaPenalTool';
import ArchivingPromotionTool from './components/ArchivingPromotionTool';
import ActivityLogTool from './components/ActivityLogTool';
import MentorTool from './components/MentorTool';
import DatabaseManagerTool from './components/DatabaseManagerTool';
import ActivityAnalysisTool from './components/ActivityAnalysisTool';
import { Person, CaseData, AppScreen, Activity, PromotoriaDef, Gender } from './types';

// ESCALA DETALHADA 4ª PJ Crim (61º ao 80º PJ)
const MOCK_PROMOTORIAS: PromotoriaDef[] = [
    { id: 61, label: '61º Promotor de Justiça', schedule: [{ name: 'Nina Pereira Malheiros', gender: 'F', start: 1, end: 31 }] },
    { id: 62, label: '62º Promotor de Justiça', schedule: [{ name: 'Pedro Henrique da Silva Rosa', gender: 'M', start: 1, end: 31 }] },
    { id: 63, label: '63º Promotor de Justiça', schedule: [{ name: 'Michaela Carli Gomes', gender: 'F', start: 1, end: 31 }] },
    { id: 64, label: '64º Promotor de Justiça', schedule: [
        { name: 'Pedro Henrique Pavanelli Lima', gender: 'M', start: 7, end: 16 },
        { name: 'Tânia Serra Azul Guimaraes Biazolli', gender: 'F', start: 17, end: 31 },
        { name: 'Tânia Serra Azul Guimaraes Biazolli', gender: 'F', start: 1, end: 6 } // Fallback
    ]},
    { id: 65, label: '65º Promotor de Justiça', schedule: [
        { name: 'Rafael Leme Cabello', gender: 'M', start: 7, end: 16 },
        { name: 'Paulo Henrique Castex', gender: 'M', start: 17, end: 31 },
        { name: 'Paulo Henrique Castex', gender: 'M', start: 1, end: 6 } // Fallback
    ]},
    { id: 66, label: '66º Promotor de Justiça', schedule: [
        { name: 'Martha de Camargo Duarte Dias', gender: 'F', start: 1, end: 16 },
        { name: 'Barbara da Cunha Defaveri', gender: 'F', start: 17, end: 31 }
    ]},
    { id: 67, label: '67º Promotor de Justiça', schedule: [{ name: 'Vera Lorza Duarte', gender: 'F', start: 1, end: 31 }] },
    { id: 68, label: '68º Promotor de Justiça', schedule: [{ name: 'Beatriz Lotufo Oliveira', gender: 'F', start: 1, end: 31 }] },
    { id: 69, label: '69º Promotor de Justiça', schedule: [
        { name: 'Laurani Assis de Figueiredo', gender: 'F', start: 7, end: 16 },
        { name: 'Adriana Ribeiro Soares de Morais', gender: 'F', start: 17, end: 31 },
        { name: 'Adriana Ribeiro Soares de Morais', gender: 'F', start: 1, end: 6 } // Fallback
    ]},
    { id: 70, label: '70º Promotor de Justiça', schedule: [{ name: 'Barbara da Cunha Defaveri', gender: 'F', start: 1, end: 31 }] },
    { id: 71, label: '71º Promotor de Justiça', schedule: [{ name: 'Leonardo D\'Angelo Vargas Pereira', gender: 'M', start: 1, end: 31 }] },
    { id: 72, label: '72º Promotor de Justiça', schedule: [{ name: 'Pedro Henrique da Silva Rosa', gender: 'M', start: 1, end: 31 }] },
    { id: 73, label: '73º Promotor de Justiça', schedule: [{ name: 'Daniel Fontana', gender: 'M', start: 1, end: 31 }] },
    { id: 74, label: '74º Promotor de Justiça', schedule: [{ name: 'Pedro de Andrade Khouri Santos', gender: 'M', start: 1, end: 31 }] },
    { id: 75, label: '75º Promotor de Justiça', schedule: [
        { name: 'Guilherme Carvalho da Silva', gender: 'M', start: 7, end: 16 },
        { name: 'Fernanda Queiroz Karan Franco', gender: 'F', start: 17, end: 31 },
        { name: 'Fernanda Queiroz Karan Franco', gender: 'F', start: 1, end: 6 } // Fallback
    ]},
    { id: 76, label: '76º Promotor de Justiça', schedule: [{ name: 'Laurani Assis de Figueiredo', gender: 'F', start: 1, end: 31 }] },
    { id: 77, label: '77º Promotor de Justiça', schedule: [{ name: 'Solange Aparecida Cruz', gender: 'F', start: 1, end: 31 }] },
    { id: 78, label: '78º Promotor de Justiça', schedule: [{ name: 'Claudio Henrique Bastos Giannini', gender: 'M', start: 1, end: 31 }] },
    { id: 79, label: '79º Promotor de Justiça', schedule: [{ name: 'Margareth Ferraz França', gender: 'F', start: 1, end: 31 }] },
    { id: 80, label: '80º Promotor de Justiça', schedule: [{ name: 'Tais Servilha Ferrari', gender: 'F', start: 1, end: 31 }] }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('DASHBOARD');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [caseData, setCaseData] = useState<CaseData>({
    numeroProcesso: '',
    cargo: '',
    promotor: '',
    dataAudiencia: ''
  });

  const [promotorias, setPromotorias] = useState<PromotoriaDef[]>(MOCK_PROMOTORIAS);

  useEffect(() => {
    // Simulação de verificação de sessão
    setTimeout(() => {
        setLoadingSession(false);
    }, 500);
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('DASHBOARD');
  };

  const handleLogin = () => {
      setIsLoggedIn(true);
  };

  const handleAddPerson = (person: Person) => {
    setPeople(prev => [...prev, person]);
  };

  const handleRemovePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const handleResetAll = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados?")) {
        setPeople([]);
        setCaseData({
            numeroProcesso: '',
            cargo: '',
            promotor: '',
            dataAudiencia: ''
        });
    }
  };

  const handleOpenActivity = (activity: Activity) => {
    setCaseData(prev => ({
      ...prev,
      numeroProcesso: activity.numeroProcesso,
      cargo: activity.cargo,
      promotor: activity.promotor
    }));

    switch (activity.tipo) {
      case 'Pesquisa de NI': setCurrentScreen('PESQUISA_NI'); break;
      case 'Multa Penal': setCurrentScreen('MULTA_PENAL'); break;
      case 'ANPP - Execuções':
      case 'ANPP - Dados Bancários': setCurrentScreen('ANPP'); break;
      case 'Ofício': setCurrentScreen('OFICIO'); break;
      case 'Notícia de Fato':
      case 'Notificação - (Art. 28)':
      case 'Agendamento de Despacho': setCurrentScreen('SISDIGITAL'); break;
      case 'Outros': setCurrentScreen('DASHBOARD'); break;
      default:
        if (activity.tipo.includes('Arquivamento')) {
           setCurrentScreen('PROMOCAO_ARQUIVAMENTO');
        } else {
           setCurrentScreen('DASHBOARD');
        }
    }
  };

  const handleAnalyzeActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setCurrentScreen('ACTIVITY_ANALYSIS');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'DASHBOARD':
        return <Dashboard onSelectScreen={setCurrentScreen} />;
      
      case 'PESQUISA_NI':
        return (
          <main className="flex flex-1 overflow-hidden animate-in fade-in duration-700">
            <SidebarForm 
                onAddPerson={handleAddPerson} 
                people={people}
                onRemovePerson={handleRemovePerson}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <CaseInfoBar 
                caseData={caseData} 
                setCaseData={setCaseData} 
                promotorias={promotorias} 
              />
              <div className="flex-1 p-6 lg:p-10 overflow-hidden bg-slate-950 relative">
                 <div className="h-full w-full max-w-[1400px] mx-auto">
                    <DocumentPreview 
                        caseData={caseData} 
                        people={people} 
                        onReset={handleResetAll}
                    />
                 </div>
              </div>
            </div>
          </main>
        );

      case 'SISDIGITAL': return <SisDigitalTool promotorias={promotorias} />;
      case 'OFICIO': return <OficioTool promotorias={promotorias} />;
      case 'ANPP': return <AnppTool promotorias={promotorias} />;
      case 'MULTA_PENAL': return <MultaPenalTool />;
      case 'PROMOCAO_ARQUIVAMENTO': return <ArchivingPromotionTool />;
      case 'ACTIVITIES': return <ActivityLogTool onOpenActivity={handleOpenActivity} onAnalyzeActivity={handleAnalyzeActivity} promotorias={promotorias} />;
      case 'MENTOR': return <MentorTool />;
      case 'DATABASE': return <DatabaseManagerTool />;
      case 'ACTIVITY_ANALYSIS': return <ActivityAnalysisTool activity={selectedActivity} onBack={() => setCurrentScreen('ACTIVITIES')} />;

      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-slate-950">
             <div className="text-center p-12 bg-slate-900 rounded-3xl shadow-xl border border-slate-800">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Ferramenta em Desenvolvimento</h2>
                <p className="text-slate-500 mb-8">A ferramenta {currentScreen} está sendo integrada.</p>
                <button 
                  onClick={() => setCurrentScreen('DASHBOARD')}
                  className="bg-slate-100 text-slate-900 px-8 py-3 rounded-xl font-bold"
                >
                  Voltar ao Dashboard
                </button>
             </div>
          </div>
        );
    }
  };

  if (loadingSession) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <WelcomeScreen onLogin={handleLogin} />;
  }

  const displayName = 'Alex Santana Mendes'; 

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 selection:bg-red-900 selection:text-white">
      <Header 
        userName={displayName} 
        showBackButton={currentScreen !== 'DASHBOARD'} 
        onBack={() => {
            if (currentScreen === 'ACTIVITY_ANALYSIS') setCurrentScreen('ACTIVITIES');
            else setCurrentScreen('DASHBOARD');
        }}
        onLogout={handleLogout}
      />
      {renderScreen()}
    </div>
  );
};

export default App;
