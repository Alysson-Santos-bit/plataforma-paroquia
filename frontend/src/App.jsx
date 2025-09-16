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

// Componente para o QR Code (Exemplo)
const PixQrCodeIcon = (props) => (
    <svg {...props} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path fill="#000" d="M128 0H0v128h128V0ZM96 96H32V32h64v64Zm128-96H128v128h128V0Zm-32 96h-64V32h64v64ZM0 256h128V128H0v128Zm32-96h64v64H32v-64Zm224 96H128V128h128v128Zm-32-96h-64v64h-32v-32h-32v32h-32v32h64v-32h32v-32h32v32h32v-64Z"/>
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

  // Estados das inscrições e contribuições
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myContributions, setMyContributions] = useState([]); // Novo estado
  const [contributionAmount, setContributionAmount] = useState('');
  const [showPixModal, setShowPixModal] = useState(false);


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
           const errorData = await infoRes.json();
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

  // Efeito para buscar os dados do utilizador (inscrições e contribuições) quando ele faz login
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const token = localStorage.getItem('token');
        try {
          // Busca ambas as informações em paralelo
          const [regsRes, contribsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/my-registrations`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/my-contributions`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);

          if (!regsRes.ok || !contribsRes.ok) {
            throw new Error('Não foi possível buscar os dados do paroquiano.');
          }
          
          const regsData = await regsRes.json();
          const contribsData = await contribsRes.json();

          setMyRegistrations(regsData || []);
          setMyContributions(contribsData || []);
        } catch (err) {
           console.error("Erro detalhado ao buscar dados do utilizador:", err);
           showNotification(`Erro: ${err.message}`, 'error');
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Função para mostrar notificações
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  // Funções de controlo dos modais
  const handleAuthClick = () => setShowAuthModal(true);
  const handleCloseModal = () => {
    setShowAuthModal(false);
    setShowPixModal(false);
  }

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
      setIsRegistering(false);
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
    setMyRegistrations([]);
    setMyContributions([]); // Limpa as contribuições ao fazer logout
    showNotification('Sessão encerrada com sucesso!');
  };

  // --- Lógica de Inscrição e Contribuição ---
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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ service_id: serviceId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Não foi possível completar a inscrição.');
        
        showNotification(data.message);
        
        const updatedRegsRes = await fetch(`${API_BASE_URL}/api/my-registrations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedRegsData = await updatedRegsRes.json();
        setMyRegistrations(updatedRegsData || []);

    } catch (err) {
        showNotification(err.message, 'error');
    }
  };

  const handlePixContribution = async () => {
    const value = parseFloat(contributionAmount);
    if (!value || value <= 0) {
      showNotification('Por favor, insira um valor válido.', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/contributions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ value: value, method: 'PIX' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Não foi possível registar a contribuição.');
        
        setShowPixModal(true);
        
        // Atualiza o histórico de contribuições
        const updatedContribsRes = await fetch(`${API_BASE_URL}/api/my-contributions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedContribsData = await updatedContribsRes.json();
        setMyContributions(updatedContribsData || []);

    } catch (err) {
        showNotification(err.message, 'error');
    }
  };
  
  const copyPixKey = () => {
    const pixKey = "chave.pix.da.paroquia@email.com"; // Chave PIX de exemplo
    navigator.clipboard.writeText(pixKey).then(() => {
        showNotification('Chave PIX copiada!');
    }, (err) => {
        showNotification('Falha ao copiar a chave.', 'error');
    });
  }
  
  // Função para formatar a data
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  }


  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-100"><p className="text-xl">Carregando...</p></div>;
  if (error) return <div className="flex justify-center items-center h-screen bg-red-100"><p className="text-xl text-red-700">{error}</p></div>;

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
        {currentUser && (
          <>
            {/* Secção "Área do Paroquiano" */}
            <section id="parishioner-area" className="mb-12 bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Área do Paroquiano</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Minhas Inscrições */}
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-700 mb-4">Minhas Inscrições</h3>
                        {myRegistrations.length > 0 ? (
                            <ul className="space-y-4">
                            {myRegistrations.map(reg => (
                                <li key={reg.ID} className="p-4 bg-gray-100 rounded-lg">
                                    <h4 className="font-semibold text-lg text-gray-800">{reg.service?.name || 'Serviço não encontrado'}</h4>
                                    <p className="text-sm text-gray-600">Status: <span className="font-medium text-yellow-600">{reg.status}</span></p>
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">Você ainda não se inscreveu em nenhum serviço.</p>
                        )}
                    </div>

                    {/* Contribuição do Dízimo */}
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-700 mb-4">Contribuição</h3>
                        <div className="p-4 bg-gray-100 rounded-lg">
                            <p className="text-gray-700 mb-4">A sua contribuição generosa ajuda a manter as obras da nossa paróquia. Deus lhe pague!</p>
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="text-gray-800 font-bold text-lg">R$</span>
                                <input 
                                    type="number" 
                                    value={contributionAmount}
                                    onChange={(e) => setContributionAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <button onClick={handlePixContribution} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                                Contribuir com PIX
                            </button>
                        </div>
                         {/* Histórico de Contribuições */}
                         <div className="mt-6">
                            <h4 className="text-xl font-semibold text-gray-700 mb-3">Seu Histórico</h4>
                            {myContributions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg">
                                        <thead className="bg-gray-200">
                                            <tr>
                                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                                                <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {myContributions.map(contrib => (
                                                <tr key={contrib.ID}>
                                                    <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-900">{formatDate(contrib.CreatedAt)}</td>
                                                    <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-900">R$ {contrib.value.toFixed(2)}</td>
                                                    <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-900">{contrib.method}</td>
                                                    <td className="py-2 px-4 whitespace-nowrap text-sm">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            {contrib.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm mt-2">Nenhuma contribuição registada ainda.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
          </>
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
                <h2 className="text-2xl font-bold mb-6 text-center">Criar Conta</h2>
                <form onSubmit={handleRegisterSubmit}>
                  {/* ... campos de registo ... */}
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
                  <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full" type="submit">Registar</button>
                </form>
                <p className="text-center mt-4">Já tem uma conta? <button onClick={() => setIsRegistering(false)} className="text-blue-500 hover:underline">Faça o login</button></p>
              </div>
            ) : (
              // Formulário de Login
              <div>
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                <form onSubmit={handleLoginSubmit}>
                   {/* ... campos de login ... */}
                   <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label>
                    <input className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" type="email" id="email" name="email" required />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2" htmlFor="password">Senha</label>
                    <input className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" type="password" id="password" name="password" required />
                  </div>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full" type="submit">Entrar</button>
                </form>
                <p className="text-center mt-4">Não tem uma conta? <button onClick={() => setIsRegistering(true)} className="text-blue-500 hover:underline">Cadastre-se</button></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal do PIX */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" onClick={handleCloseModal}>
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm relative text-center" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            <h2 className="text-2xl font-bold mb-4">Contribuição via PIX</h2>
            <p className="text-gray-600 mb-4">Leia o QR Code com a app do seu banco ou copie a chave abaixo.</p>
            <div className="flex justify-center mb-4">
              <PixQrCodeIcon className="w-48 h-48" />
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-gray-600 text-sm">Chave PIX (Exemplo):</p>
                <p className="font-mono text-lg font-bold">chave.pix.da.paroquia@email.com</p>
            </div>
            <button onClick={copyPixKey} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">
                Copiar Chave
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

