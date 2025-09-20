import React, { useState, useEffect, useCallback } from 'react';

// --- CONFIGURAÇÃO DA API ---
// Aponte para o seu backend na Render.
const API_BASE_URL = 'https://plataforma-paroquia.onrender.com';

// Objeto para centralizar todos os pedidos à API
const apiService = {
  request: async (path, method = 'GET', data = null, token = null) => {
    const url = `${API_BASE_URL}/api${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Ocorreu um erro na comunicação com o servidor.');
      }
      return responseData;
    } catch (error) {
      console.error(`Erro na API em ${path}:`, error);
      throw error;
    }
  },

  // --- Funções da API ---
  getParishInfo: () => apiService.request('/parish-info'),
  getServices: () => apiService.request('/services'),
  getMassTimes: () => apiService.request('/mass-times'),
  getPastorais: () => apiService.request('/pastorais'),
  register: (userData) => apiService.request('/register', 'POST', userData),
  login: (credentials) => apiService.request('/login', 'POST', credentials),
  getMyRegistrations: (token) => apiService.request('/my-registrations', 'GET', null, token),
  // ... adicione outras funções da API aqui conforme necessário
};


// --- Componentes da Interface ---

// Cabeçalho / Barra de Navegação
const Header = ({ user, setView, onLogout }) => (
  <header className="bg-white shadow-md p-4 flex justify-between items-center">
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 cursor-pointer" onClick={() => setView(user ? 'home' : 'login')}>
      Plataforma Paroquial
    </h1>
    <nav>
      {user ? (
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 hidden md:block">Olá, {user.name}!</span>
          {user.isAdmin && (
            <button onClick={() => setView('admin')} className="text-blue-600 hover:underline">Admin</button>
          )}
          <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition">
            Sair
          </button>
        </div>
      ) : (
        <div className="space-x-2">
          <button onClick={() => setView('login')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            Entrar
          </button>
          <button onClick={() => setView('register')} className="text-blue-600 border border-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition">
            Registar
          </button>
        </div>
      )}
    </nav>
  </header>
);

// Página de Login
const LoginPage = ({ setView, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiService.login({ email, password });
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Falha no login. Verifique as suas credenciais.');
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Aceder à Plataforma</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border rounded-md" />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border rounded-md" />
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition">Entrar</button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Não tem uma conta? <button onClick={() => setView('register')} className="text-blue-600 hover:underline">Registe-se aqui</button>
        </p>
      </div>
    </div>
  );
};

// Página de Registo
const RegisterPage = ({ setView }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await apiService.register({ name, email, password });
            setMessage(response.message || 'Registo bem-sucedido! Pode agora fazer o login.');
        } catch (err) {
            setError(err.message || 'Ocorreu um erro no registo.');
        }
    };
    
    return (
        <div className="flex justify-center items-center py-12">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Criar Nova Conta</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 border rounded-md" />
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border rounded-md" />
                    <input type="password" placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border rounded-md" />
                    {message && <p className="text-green-600 text-center bg-green-100 p-2 rounded-md">{message}</p>}
                    {error && <p className="text-red-500 text-center bg-red-100 p-2 rounded-md">{error}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition">Criar Conta</button>
                </form>
                 <p className="mt-6 text-center text-gray-600">
                    Já tem uma conta? <button onClick={() => setView('login')} className="text-blue-600 hover:underline">Faça o login</button>
                </p>
            </div>
        </div>
    );
};

// Painel Principal (Home)
const HomePage = ({ token }) => {
    const [parishInfo, setParishInfo] = useState(null);
    const [massTimes, setMassTimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [info, times] = await Promise.all([
                    apiService.getParishInfo(),
                    apiService.getMassTimes()
                ]);
                setParishInfo(info);
                setMassTimes(times || []);
            } catch (err) {
                setError('Não foi possível carregar as informações da paróquia.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="text-center p-10">A carregar informações...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    
    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Bem-vindo à {parishInfo?.name}</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{parishInfo?.history}</p>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Horários das Missas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {massTimes.map((mt) => (
                      <div key={mt.ID} className="border p-4 rounded-md">
                        <p className="font-bold text-lg">{mt.location}</p>
                        <p className="text-gray-800">{mt.Day}: <span className="font-semibold">{mt.Time}</span></p>
                        {mt.Description && <p className="text-sm text-gray-600 mt-1">{mt.Description}</p>}
                      </div>
                    ))}
                </div>
            </div>
            {/* Adicionar mais secções aqui: Serviços, Pastorais, Minhas Inscrições, etc. */}
        </div>
    );
};


// --- Componente Raiz da Aplicação ---

function App() {
  const [view, setView] = useState('loading'); // loading, login, register, home, admin
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Função para lidar com o login
  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setView('home');
  };

  // Função para lidar com o logout
  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  }, []);

  // Verificar se o utilizador já está logado ao carregar a aplicação
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setView('home');
    } else {
      setView('login');
    }
  }, []);

  // Renderizar a view atual
  const renderView = () => {
    switch (view) {
      case 'login':
        return <LoginPage setView={setView} onLogin={handleLogin} />;
      case 'register':
        return <RegisterPage setView={setView} />;
      case 'home':
        if (!user) {
          handleLogout(); // Segurança: se não houver utilizador, faz logout
          return null;
        }
        return <HomePage token={token} />;
      // Adicionar case 'admin' aqui no futuro
      case 'loading':
         return <div className="text-center p-10">A carregar aplicação...</div>;
      default:
        return <LoginPage setView={setView} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header user={user} setView={setView} onLogout={handleLogout} />
      <main>
        {renderView()}
      </main>
    </div>
  );
}

export default App;

