import { useState, useEffect, useCallback } from 'react';

// --- Constantes e Configuração ---
// IMPORTANTE: Esta URL muda sempre que o Codespace reinicia.
// Verifique a aba "PORTS" no seu Codespaces e copie o endereço público da porta 8080 aqui.
const API_BASE_URL = 'https://glorious-palm-tree-g4p549q76rqg29q96-8080.app.github.dev';

// --- Ícones (Componentes SVG) ---
const ChurchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2" />
    <path d="M14 22v-4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v4" />
    <path d="M18 22V5l-6-3-6 3v17" />
    <path d="M12 7v5" />
    <path d="M10 9h4" />
  </svg>
);

const UsersIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);

const CalendarIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);

// --- Componente Principal ---
export default function App() {
  // --- Estados da Aplicação ---
  const [parishInfo, setParishInfo] = useState({ name: '', history: '' });
  const [services, setServices] = useState([]);
  const [pastorals, setPastorals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Estados para autenticação e modais
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'register'
  const [currentUser, setCurrentUser] = useState(null);

  // Estados dos formulários
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- Funções de Notificação ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 5000); // A notificação desaparece após 5 segundos
  };

  // --- Funções de Busca de Dados (API) ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [parishRes, servicesRes, pastoralsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/parish-info`),
        fetch(`${API_BASE_URL}/api/services`),
        fetch(`${API_BASE_URL}/api/pastorais`),
      ]);

      if (!parishRes.ok || !servicesRes.ok || !pastoralsRes.ok) {
        throw new Error('Falha na comunicação com o servidor. Verifique os status dos pedidos na aba "Network".');
      }

      const parishData = await parishRes.json();
      const servicesData = await servicesRes.json();
      const pastoralsData = await pastoralsRes.json();

      setParishInfo(parishData);
      setServices(servicesData || []);
      setPastorals(pastoralsData || []);

    } catch (error) {
      console.error("Erro detalhado ao buscar dados:", error);
      showNotification('Falha em buscar dados. Verifique se a URL da API está correta e se o backend está a correr.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Efeitos ---
  useEffect(() => {
    fetchData();

    // Verifica se há um token no localStorage ao carregar a página
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('authUser');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
    }
  }, [fetchData]);

  // --- Funções de Manipulação de Eventos ---
  const handleAuthModalOpen = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }
      showNotification(data.message, 'success');
      setAuthMode('login'); // Muda para a tela de login após o sucesso
    } catch (error) {
      console.error("Erro detalhado do registo:", error);
      showNotification(`Erro no registo: ${error.message}`, 'error');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      // A resposta da API agora será lida aqui.
      if (!response.ok) {
        // Lança o erro específico recebido do backend.
        throw new Error(data.error || 'E-mail ou senha inválidos'); 
      }
      
      // Guarda o token e os dados do utilizador no localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setCurrentUser(data.user);
      showNotification(data.message, 'success');
      setShowAuthModal(false);
    } catch (error) {
      console.error("Erro detalhado do login:", error);
      // Mostra a mensagem de erro específica do backend.
      showNotification(`Erro no login: ${error.message}`, 'error');
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setCurrentUser(null);
    showNotification('Sessão encerrada com sucesso!', 'success');
  };

  const handleRegistration = async (serviceId) => {
    if (!currentUser) {
      showNotification('Por favor, faça login para se inscrever.', 'info');
      handleAuthModalOpen('login');
      return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/registrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ service_id: serviceId }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro desconhecido');
        }
        showNotification(data.message, 'success');
    } catch (error) {
        console.error("Erro detalhado da inscrição:", error);
        showNotification(`Erro na inscrição: ${error.message}`, 'error');
    }
  };


  // --- Renderização ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Carregando plataforma...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Notificação */}
      {notification.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'info' ? 'bg-blue-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      {/* Cabeçalho */}
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChurchIcon className="text-blue-800 h-8 w-8" />
            <h1 className="text-xl font-bold text-gray-800">{parishInfo.name}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-gray-700">Bem-vindo(a), {currentUser.name}!</span>
                <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => handleAuthModalOpen('login')} className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition">
                Login / Cadastrar
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Modal de Autenticação */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
              {authMode === 'login' ? 'Acessar Plataforma' : 'Criar Nova Conta'}
            </h2>
            <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit}>
              {authMode === 'register' && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="name">Nome Completo</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="password">Senha</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-800 text-white py-2 rounded-lg hover:bg-blue-900 transition font-semibold">
                {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            </form>
            <p className="text-center mt-4">
              {authMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-blue-600 hover:underline ml-1"
              >
                {authMode === 'login' ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}


      {/* Conteúdo Principal */}
      <main className="container mx-auto px-6 py-8">
        {/* Seção Sobre */}
        <section id="sobre" className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <h2 className="text-3xl font-bold text-blue-800 mb-4">Sobre a Nossa Paróquia</h2>
          <p className="text-gray-700 leading-relaxed">{parishInfo.history}</p>
        </section>

        {/* Seção de Serviços e Sacramentos */}
        <section id="servicos">
          <h2 className="text-3xl font-bold text-blue-800 mb-6">Serviços e Sacramentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(services || []).map((service) => (
              <div key={service.ID} className="bg-white p-6 rounded-lg shadow-lg flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name}</h3>
                <p className="text-gray-600 flex-grow mb-4">{service.description}</p>
                <button onClick={() => handleRegistration(service.ID)} className="mt-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition w-full">
                  Inscrever-se
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Seção de Pastorais e Movimentos */}
        <section id="pastorais" className="mt-12">
            <h2 className="text-3xl font-bold text-blue-800 mb-6">Pastorais e Movimentos</h2>
            <div className="space-y-6">
                {(pastorals || []).map((pastoral) => (
                    <div key={pastoral.ID} className="bg-white p-6 rounded-lg shadow-lg">
                         <h3 className="text-xl font-semibold text-gray-800 mb-2">{pastoral.name}</h3>
                         <p className="text-gray-600 mb-4">{pastoral.description}</p>
                         <div className="flex items-center text-sm text-gray-500">
                            <UsersIcon className="w-4 h-4 mr-2" />
                            <span>Reunião: {pastoral.meeting_time} - {pastoral.meeting_location}</span>
                         </div>
                    </div>
                ))}
            </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="bg-gray-800 text-white mt-12 py-6">
        <div className="container mx-auto px-6 text-center">
            <p>&copy; {new Date().getFullYear()} {parishInfo.name}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

