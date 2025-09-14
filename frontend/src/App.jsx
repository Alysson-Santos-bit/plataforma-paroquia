import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'https://glorious-palm-tree-g4p549q76rqg29q96-8080.app.github.dev';

// --- Ícones (Componentes SVG) ---
const HomeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
// Adicione outros ícones conforme necessário...

function App() {
  // --- Estados da Aplicação ---
  const [parishInfo, setParishInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [pastorals, setPastorals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Autenticação e Modais
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  
  // Estado para guardar os dados do utilizador autenticado
  const [currentUser, setCurrentUser] = useState(null);

  // --- Efeitos ---
  useEffect(() => {
    // Função para verificar se existe um token guardado no navegador
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setCurrentUser(JSON.parse(userData));
        }
    };

    const fetchData = async () => {
      try {
        const [infoRes, servicesRes, pastoralsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/parish-info`),
          fetch(`${API_BASE_URL}/api/services`),
          fetch(`${API_BASE_URL}/api/pastorais`),
        ]);

        if (!infoRes.ok || !servicesRes.ok || !pastoralsRes.ok) {
          throw new Error('Falha ao buscar dados do servidor');
        }

        const infoData = await infoRes.json();
        const servicesData = await servicesRes.json();
        const pastoralsData = await pastoralsRes.json();

        setParishInfo(infoData);
        setServices(servicesData || []);
        setPastorals(pastoralsData || []);
      } catch (err) {
        setError(err.message);
        showNotification(err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    fetchData();
  }, []);

  // --- Funções Auxiliares ---
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 5000);
  };

  // --- Manipuladores de Eventos (Handlers) ---
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = e.target.elements;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value,
          email: email.value,
          password: password.value,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      showNotification(data.message, 'success');
      setRegisterModalOpen(false);
      setLoginModalOpen(true); // Abre o modal de login após o registo
    } catch (err) {
      console.error("Erro ao registar:", err);
      showNotification(err.message, 'error');
    }
  };
  
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = e.target.elements;

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      // Guardar o token e os dados do utilizador no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setCurrentUser(data.user);
      showNotification(data.message, 'success');
      setLoginModalOpen(false);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      showNotification(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    showNotification('Sessão terminada com sucesso.', 'success');
  };

  // --- Renderização ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold">Carregando Plataforma Paroquial...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Notificação Flutuante */}
      {notification.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      {/* Cabeçalho */}
      <header className="bg-white shadow-md sticky top-0 z-20">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">
            {parishInfo?.name || 'Plataforma Paroquial'}
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-gray-700">Bem-vindo, {currentUser.name}!</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Login / Cadastrar
              </button>
            )}
          </div>
        </nav>
      </header>
      
      {/* Conteúdo Principal */}
      <main className="container mx-auto p-6">
        {/* Seção de História */}
        <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-4">Nossa História</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-700 leading-relaxed">{parishInfo?.history}</p>
            </div>
        </section>

        {/* Seção de Serviços */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-4">Serviços e Sacramentos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.ID} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.Name}</h3>
                <p className="text-gray-600 mb-4">{service.Description}</p>
                <button className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors">
                  Inscrever-se
                </button>
              </div>
            ))}
          </div>
        </section>
        
        {/* Seção de Pastorais */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-4">Pastorais e Movimentos</h2>
          <div className="space-y-4">
            {pastorals.map((pastoral) => (
              <div key={pastoral.ID} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">{pastoral.Name}</h3>
                <p className="text-gray-600 mt-1">{pastoral.Description}</p>
                <div className="text-sm text-gray-500 mt-3">
                  <p><strong>Reunião:</strong> {pastoral.MeetingTime}</p>
                  <p><strong>Local:</strong> {pastoral.MeetingLocation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal de Login */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            <form onSubmit={handleLoginSubmit}>
              {/* Campos do formulário */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label>
                <input className="w-full px-3 py-2 border rounded-md" type="email" id="email" name="email" required />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="password">Senha</label>
                <input className="w-full px-3 py-2 border rounded-md" type="password" id="password" name="password" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">Entrar</button>
            </form>
            <div className="mt-4 text-center">
                <p className="text-gray-600">Não tem uma conta? 
                    <button 
                        onClick={() => { setLoginModalOpen(false); setRegisterModalOpen(true); }}
                        className="text-blue-600 hover:underline ml-1"
                    >
                        Cadastre-se
                    </button>
                </p>
                <button onClick={() => setLoginModalOpen(false)} className="mt-4 text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registo */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Cadastre-se</h2>
            <form onSubmit={handleRegisterSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="name">Nome Completo</label>
                <input className="w-full px-3 py-2 border rounded-md" type="text" id="name" name="name" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label>
                <input className="w-full px-3 py-2 border rounded-md" type="email" id="email" name="email" required />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="password">Senha</label>
                <input className="w-full px-3 py-2 border rounded-md" type="password" id="password" name="password" required />
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors">Criar Conta</button>
            </form>
            <div className="mt-4 text-center">
                <p className="text-gray-600">Já tem uma conta?
                    <button
                        onClick={() => { setRegisterModalOpen(false); setLoginModalOpen(true); }}
                        className="text-blue-600 hover:underline ml-1"
                    >
                        Faça o login
                    </button>
                </p>
                <button onClick={() => setRegisterModalOpen(false)} className="mt-4 text-gray-500 hover:text-gray-700">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

