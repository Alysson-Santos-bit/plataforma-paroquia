import React, { useState, useEffect } from 'react';

// --- Constante da API ---
// IMPORTANTE: Esta URL pode mudar se você reiniciar o Codespaces.
// Verifique sempre na aba "PORTS" se o endereço da porta 8080 ainda é o mesmo.
const API_BASE_URL = 'https://glorious-palm-tree-g4p549q76rqg29q96-8080.app.github.dev';

// --- Componentes de Ícones ---
const UserCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </svg>
);

const HomeIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

// --- Componente Principal da Aplicação ---
export default function App() {
  // Estados da aplicação
  const [parishInfo, setParishInfo] = useState({ name: '', history: '' });
  const [services, setServices] = useState([]);
  const [pastorals, setPastorals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de autenticação e UI
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Novo estado para as inscrições do utilizador
  const [myRegistrations, setMyRegistrations] = useState([]);

  // Efeito para buscar os dados públicos da paróquia
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, servicesRes, pastoralsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/parish-info`),
          fetch(`${API_BASE_URL}/api/services`),
          fetch(`${API_BASE_URL}/api/pastorais`),
        ]);

        if (!infoRes.ok || !servicesRes.ok || !pastoralsRes.ok) {
           const errorData = await infoRes.json(); // Tenta ler o corpo do erro
           throw new Error(errorData.error || 'Falha em buscar dados do servidor.');
        }

        const infoData = await infoRes.json();
        const servicesData = await servicesRes.json();
        const pastoralsData = await pastoralsRes.json();

        setParishInfo(infoData);
        setServices(servicesData || []);
        setPastorals(pastoralsData || []);
        
      } catch (err) {
        console.error("Erro detalhado ao buscar dados:", err);
        setError(`Não foi possível carregar os dados da paróquia. Detalhe: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Efeito para verificar se já existe um token no arranque da aplicação
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // Efeito para buscar as inscrições do utilizador quando ele faz login
  useEffect(() => {
    const fetchMyRegistrations = async () => {
      if (currentUser) {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE_URL}/api/my-registrations`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Não foi possível buscar as suas inscrições.');
          }
          const data = await res.json();
          // Log de diagnóstico para o frontend
          console.log("Dados de inscrições recebidos:", data);
          setMyRegistrations(data || []);
        } catch (err) {
           console.error("Erro detalhado ao buscar inscrições:", err);
           showNotification(`Erro: ${err.message}`, 'error');
        }
      }
    };

    fetchMyRegistrations();
  }, [currentUser]); // Executa sempre que o currentUser mudar

  // Função para mostrar notificações
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Funções de controlo do modal de autenticação
  const handleAuthClick = () => setShowAuthModal(true);
  const handleCloseModal = () => setShowAuthModal(false);

  // --- Lógica de Autenticação ---

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = e.target.elements;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.value, email: email.value, password: password.value }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      showNotification(data.message);
      setIsRegistering(false); // Volta para a tela de login
    } catch (err) {
      console.error("Erro detalhado do registo:", err);
      showNotification(`Erro ao registar: ${err.message}`, 'error');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = e.target.elements;

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value, password: password.value }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'E-mail ou senha inválidos');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);

      showNotification(data.message);
      handleCloseModal();
    } catch (err) {
      console.error("Erro detalhado do login:", err);
      showNotification(`Erro no login: ${err.message}`, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setMyRegistrations([]); // Limpa as inscrições ao fazer logout
    showNotification('Sessão encerrada com sucesso!');
  };

  // --- Lógica de Inscrição nos Serviços ---
  const handleRegistration = async (serviceId) => {
    if (!currentUser) {
      showNotification('Por favor, faça login para se inscrever.', 'error');
      handleAuthClick();
      return;
    }
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/registrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ service_id: serviceId })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Não foi possível completar a inscrição.');
        }
        showNotification(data.message);
        // Atualiza a lista de inscrições após uma nova inscrição
        const updatedRegsRes = await fetch(`${API_BASE_URL}/api/my-registrations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedRegsData = await updatedRegsRes.json();
        setMyRegistrations(updatedRegsData || []);

    } catch (err) {
        showNotification(err.message, 'error');
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100"><p className="text-xl">Carregando...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen bg-red-100"><p className="text-xl text-red-700">{error}</p></div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Notificação Flutuante */}
      {notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-out z-50`}>
          {notification.message}
        </div>
      )}

      {/* Cabeçalho */}
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <HomeIcon className="text-yellow-500" />
            <h1 className="text-2xl font-bold text-gray-800">{parishInfo.name}</h1>
          </div>
          <div>
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Bem-vindo(a), {currentUser.name}!</span>
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={handleAuthClick} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full flex items-center space-x-2 transition duration-300">
                <UserCircleIcon />
                <span>Login / Cadastro</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-6 py-8">
        {/* Secção "Minhas Inscrições" - Visível apenas se logado */}
        {currentUser && (
          <section id="my-registrations" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Minhas Inscrições</h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              {myRegistrations.length > 0 ? (
                <ul className="space-y-4">
                  {myRegistrations.map(reg => (
                    <li key={reg.ID} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                      <div>
                        {/* AQUI ESTÁ A CORREÇÃO: reg.service em vez de reg.Service */}
                        <h3 className="font-semibold text-lg text-gray-800">{reg.service?.name || 'Serviço não encontrado'}</h3>
                        <p className="text-sm text-gray-600">Status: <span className="font-medium text-yellow-600">{reg.status}</span></p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">Você ainda não se inscreveu em nenhum serviço.</p>
              )}
            </div>
          </section>
        )}

        {/* História da Paróquia */}
        <section id="history" className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Nossa História</h2>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <p className="text-gray-700 leading-relaxed text-justify">{parishInfo.history}</p>
          </div>
        </section>

        {/* Serviços Paroquiais */}
        <section id="services" className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Serviços e Sacramentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => (
              <div key={service.ID} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition duration-300">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <button onClick={() => handleRegistration(service.ID)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                    Inscrever-se
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pastorais */}
        <section id="pastorals">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Pastorais e Movimentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastorals.map(pastoral => (
              <div key={pastoral.ID} className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{pastoral.name}</h3>
                <p className="text-gray-600 mb-4">{pastoral.description}</p>
                <div className="text-sm text-gray-500">
                  <p><span className="font-semibold">Reuniões:</span> {pastoral.meeting_info}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal de Autenticação */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" onClick={handleCloseModal}>
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            {isRegistering ? (
              // Formulário de Registo
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Criar Conta</h2>
                <form onSubmit={handleRegisterSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="name">Nome Completo</label>
                    <input className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" type="text" id="name" name="name" required />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label>
                    <input className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" type="email" id="email" name="email" required />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2" htmlFor="password">Senha (mín. 6 caracteres)</label>
                    <input className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" type="password" id="password" name="password" required />
                  </div>
                  <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full transition duration-300" type="submit">Registar</button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-4">
                  Já tem uma conta? <button onClick={() => setIsRegistering(false)} className="text-blue-500 hover:underline">Faça o login</button>
                </p>
              </div>
            ) : (
              // Formulário de Login
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label>
                    <input className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" type="email" id="email" name="email" required />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2" htmlFor="password">Senha</label>
                    <input className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" type="password" id="password" name="password" required />
                  </div>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300" type="submit">Entrar</button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-4">
                  Não tem uma conta? <button onClick={() => setIsRegistering(true)} className="text-blue-500 hover:underline">Cadastre-se</button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

