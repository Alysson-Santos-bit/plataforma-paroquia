import React, { useState, useEffect, useCallback } from 'react';

// --- CONFIGURAÇÃO DA API ---
const API_BASE_URL = 'https://plataforma-paroquia.onrender.com';

// --- SERVIÇO DE API CENTRALIZADO ---
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ocorreu um erro na comunicação com o servidor.' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Erro na API em ${path}:`, error);
      throw error;
    }
  },

  getParishInfo: () => apiService.request('/parish-info'),
  getServices: () => apiService.request('/services'),
  getMassTimes: () => apiService.request('/mass-times'),
  getPastorais: () => apiService.request('/pastorais'),
  register: (userData) => apiService.request('/register', 'POST', userData),
  login: (credentials) => apiService.request('/login', 'POST', credentials),
  
  // Rotas Protegidas
  createRegistration: (serviceId, token) => apiService.request('/registrations', 'POST', { service_id: serviceId }, token),
  getMyRegistrations: (token) => apiService.request('/my-registrations', 'GET', null, token),
  createContribution: (contributionData, token) => apiService.request('/contributions', 'POST', contributionData, token),
  getMyContributions: (token) => apiService.request('/my-contributions', 'GET', null, token),

  // Rotas de Admin
  getDashboardStats: (token) => apiService.request('/admin/dashboard-stats', 'GET', null, token),
  getAllRegistrations: (token) => apiService.request('/admin/registrations', 'GET', null, token),
  updateRegistrationStatus: (regId, status, token) => apiService.request(`/admin/registrations/${regId}`, 'PATCH', { status }, token),
  getAllUsers: (token) => apiService.request('/admin/users', 'GET', null, token),
  updateUser: (userId, userData, token) => apiService.request(`/admin/users/${userId}`, 'PUT', userData, token),
};


// --- COMPONENTES ---

const Header = ({ user, setView, onLogout }) => (
  <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
    <h1 className="text-xl md:text-3xl font-bold text-gray-800 cursor-pointer" onClick={() => setView(user ? 'home' : 'login')}>
      Paróquia Santo Antônio
    </h1>
    <nav className="flex items-center space-x-2 md:space-x-4">
      {user ? (
        <>
          <button onClick={() => setView('home')} className="text-gray-600 hover:text-blue-600">Início</button>
          <button onClick={() => setView('profile')} className="text-gray-600 hover:text-blue-600">O Meu Perfil</button>
          {user.isAdmin && (
            <button onClick={() => setView('admin')} className="font-bold text-blue-600 hover:underline">Painel Admin</button>
          )}
          <button onClick={onLogout} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition text-sm">
            Sair
          </button>
        </>
      ) : (
        <>
          <button onClick={() => setView('login')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Entrar</button>
          <button onClick={() => setView('register')} className="text-blue-600 border border-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition">Registar</button>
        </>
      )}
    </nav>
  </header>
);

const LoginPage = ({ setView, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiService.login({ email, password });
            onLogin(data.user, data.token);
        } catch (err) {
            setError(err.message || 'Falha no login. Verifique as suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center py-12 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Aceder à Plataforma</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500" />
                    <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500" />
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400">
                        {loading ? 'A entrar...' : 'Entrar'}
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-600">Não tem uma conta? <button onClick={() => setView('register')} className="text-blue-600 hover:underline">Registe-se aqui</button></p>
            </div>
        </div>
    );
};

const RegisterPage = ({ setView }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        try {
            const response = await apiService.register({ name, email, password });
            setMessage(response.message || 'Registo bem-sucedido! Pode agora fazer o login.');
        } catch (err) {
            setError(err.message || 'Ocorreu um erro no registo.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex justify-center items-center py-12 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Criar Nova Conta</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500" />
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500" />
                    <input type="password" placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500" />
                    {message && <p className="text-green-600 text-center bg-green-100 p-2 rounded-md">{message}</p>}
                    {error && <p className="text-red-500 text-center bg-red-100 p-2 rounded-md">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400">
                        {loading ? 'A criar conta...' : 'Criar Conta'}
                    </button>
                </form>
                 <p className="mt-6 text-center text-gray-600">Já tem uma conta? <button onClick={() => setView('login')} className="text-blue-600 hover:underline">Faça o login</button></p>
            </div>
        </div>
    );
};

const HomePage = ({ token }) => {
    const [data, setData] = useState({ info: null, massTimes: [], services: [], pastorais: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            console.log("[DIAGNÓSTICO FRONTEND] A iniciar o carregamento dos dados...");
            try {
                const massTimes = await apiService.getMassTimes();
                console.log("[DIAGNÓSTICO FRONTEND] Horários de missa recebidos:", massTimes);

                const services = await apiService.getServices();
                console.log("[DIAGNÓSTICO FRONTEND] Serviços recebidos:", services);
                
                const [info, pastorais] = await Promise.all([
                    apiService.getParishInfo(),
                    apiService.getPastorais()
                ]);
                 console.log("[DIAGNÓSTICO FRONTEND] Informações e pastorais recebidas.");

                setData({ info, massTimes: massTimes || [], services: services || [], pastorais: pastorais || [] });
                console.log("[DIAGNÓSTICO FRONTEND] Estado 'data' atualizado.");

            } catch (err) {
                console.error("[DIAGNÓSTICO FRONTEND] Erro ao carregar dados:", err);
                setError('Não foi possível carregar as informações da paróquia.');
            } finally {
                setLoading(false);
                console.log("[DIAGNÓSTICO FRONTEND] Carregamento terminado.");
            }
        };
        loadData();
    }, []);

    const handleRegisterService = async (serviceId) => {
        setMessage('');
        try {
            const response = await apiService.createRegistration(serviceId, token);
            setMessage(response.message);
        } catch (err) {
            setMessage(err.message || "Erro ao inscrever-se.");
        }
        setTimeout(() => setMessage(''), 5000);
    };

    if (loading) return <div className="text-center p-10">A carregar informações...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="p-4 md:p-8 space-y-8">
            {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md fixed top-20 right-8 z-50 shadow-lg" role="alert"><p>{message}</p></div>}
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Bem-vindo à {data.info?.name}</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{data.info?.history}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Horários das Missas</h2>
                    <div className="space-y-3">
                        {data.massTimes && data.massTimes.length > 0 ? data.massTimes.map(mt => (
                            <div key={mt.ID} className="border-b pb-2">
                                <p className="font-bold text-lg">{mt.location}</p>
                                <p className="text-gray-800">{mt.Day}: <span className="font-semibold">{mt.Time}</span></p>
                                {mt.Description && <p className="text-sm text-gray-600 mt-1">{mt.Description}</p>}
                            </div>
                        )) : <p className="text-gray-500">Nenhum horário de missa encontrado no momento.</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">Serviços da Paróquia</h2>
                    <div className="space-y-3">
                        {data.services && data.services.length > 0 ? data.services.map(s => (
                            <div key={s.ID} className="border-b pb-2">
                                <h3 className="font-bold">{s.Name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{s.Description}</p>
                                <button onClick={() => handleRegisterService(s.ID)} className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600">Inscrever-se</button>
                            </div>
                        )) : <p className="text-gray-500">Nenhum serviço disponível para inscrição no momento.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyProfilePage = ({ token }) => {
    const [data, setData] = useState({ registrations: [], contributions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [registrations, contributions] = await Promise.all([
                apiService.getMyRegistrations(token),
                apiService.getMyContributions(token)
            ]);
            setData({ registrations: registrations || [], contributions: contributions || [] });
        } catch (err) {
            setError("Não foi possível carregar os seus dados.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleDonate = async () => {
        const amount = prompt("Digite o valor da doação (ex: 10.50):");
        if (amount && !isNaN(parseFloat(amount))) {
            const pixKey = "00020126360014br.gov.bcb.pix0114+5514999999999520400005303986540" + parseFloat(amount).toFixed(2).replace('.', '') + "5802BR5913NOME FICTICIO6008MARILIA62070503***6304E2E1";
            alert("Chave PIX Copia e Cola gerada (simulação):\n\n" + pixKey + "\n\nApós 'pagar', clique em OK para confirmar o registo da doação.");
            
            try {
                const response = await apiService.createContribution({ value: parseFloat(amount), method: 'PIX' }, token);
                setMessage(response.message);
                fetchData(); 
            } catch (err) {
                setMessage(err.message || 'Erro ao registar doação.');
            }
             setTimeout(() => setMessage(''), 5000);
        } else if(amount) {
            alert("Valor inválido.");
        }
    };


    if (loading) return <div className="text-center p-10">A carregar o seu perfil...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="p-4 md:p-8 space-y-8">
             {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md fixed top-20 right-8 z-50 shadow-lg" role="alert"><p>{message}</p></div>}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">O Meu Perfil</h1>
                <button onClick={handleDonate} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Fazer Doação (Dízimo)</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">As Minhas Inscrições</h2>
                    <div className="space-y-3">
                        {data.registrations.length > 0 ? data.registrations.map(reg => (
                            <div key={reg.ID} className="p-3 border rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{reg.service.Name}</p>
                                    <p className="text-sm text-gray-500">Data: {new Date(reg.CreatedAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 text-sm rounded-full ${reg.Status === 'Pendente' ? 'bg-yellow-200 text-yellow-800' : reg.Status === 'Confirmado' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                    {reg.Status}
                                </span>
                            </div>
                        )) : <p className="text-gray-500">Você ainda não se inscreveu em nenhum serviço.</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700">O Meu Histórico de Doações</h2>
                     <div className="space-y-3">
                        {data.contributions.length > 0 ? data.contributions.map(con => (
                            <div key={con.ID} className="p-3 border rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg">R$ {con.value.toFixed(2)}</p>
                                    <p className="text-sm text-gray-500">Em {new Date(con.CreatedAt).toLocaleDateString()} via {con.Method}</p>
                                </div>
                                <span className="px-3 py-1 text-sm rounded-full bg-green-200 text-green-800">{con.Status}</span>
                            </div>
                        )) : <p className="text-gray-500">Nenhuma doação registada.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminPage = ({ token }) => {
    const [view, setView] = useState('dashboard'); // dashboard, registrations, users
    const [data, setData] = useState({ stats: null, registrations: [], users: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [stats, registrations, users] = await Promise.all([
                apiService.getDashboardStats(token),
                apiService.getAllRegistrations(token),
                apiService.getAllUsers(token)
            ]);
            setData({ stats, registrations: registrations || [], users: users || [] });
        } catch (err) {
            setError("Não foi possível carregar os dados de administração.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateStatus = async (regId, status) => {
        try {
            const response = await apiService.updateRegistrationStatus(regId, status, token);
            setMessage(response.message);
            fetchData(); // Refresh data
        } catch(err) {
            setMessage(err.message || 'Erro ao atualizar status.');
        }
        setTimeout(() => setMessage(''), 5000);
    };

    if (loading) return <div className="text-center p-10">A carregar painel de administração...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    const { stats, registrations, users } = data;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel de Administração</h1>
            {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md" role="alert"><p>{message}</p></div>}
            
            <div className="flex border-b mb-6">
                <button onClick={() => setView('dashboard')} className={`py-2 px-4 ${view === 'dashboard' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}>Dashboard</button>
                <button onClick={() => setView('registrations')} className={`py-2 px-4 ${view === 'registrations' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}>Inscrições</button>
                <button onClick={() => setView('users')} className={`py-2 px-4 ${view === 'users' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}>Utilizadores</button>
            </div>

            {view === 'dashboard' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h3 className="text-gray-500 text-lg">Total de Utilizadores</h3>
                        <p className="text-4xl font-bold">{stats.total_users}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h3 className="text-gray-500 text-lg">Total de Inscrições</h3>
                        <p className="text-4xl font-bold">{stats.total_registrations}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h3 className="text-gray-500 text-lg">Total de Doações</h3>
                        <p className="text-4xl font-bold">R$ {stats.total_contribution_value.toFixed(2)}</p>
                    </div>
                </div>
            )}

            {view === 'registrations' && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Gerir Inscrições</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b">Utilizador</th>
                                    <th className="py-2 px-4 border-b">Serviço</th>
                                    <th className="py-2 px-4 border-b">Data</th>
                                    <th className="py-2 px-4 border-b">Status</th>
                                    <th className="py-2 px-4 border-b">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registrations.map(reg => (
                                    <tr key={reg.ID}>
                                        <td className="py-2 px-4 border-b">{reg.user?.Name || 'N/A'}</td>
                                        <td className="py-2 px-4 border-b">{reg.service?.Name || 'N/A'}</td>
                                        <td className="py-2 px-4 border-b">{new Date(reg.CreatedAt).toLocaleDateString()}</td>
                                        <td className="py-2 px-4 border-b">{reg.Status}</td>
                                        <td className="py-2 px-4 border-b">
                                            {reg.Status === 'Pendente' && (
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleUpdateStatus(reg.ID, 'Confirmado')} className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600">Aprovar</button>
                                                    <button onClick={() => handleUpdateStatus(reg.ID, 'Recusado')} className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600">Recusar</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

             {view === 'users' && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Gerir Utilizadores</h2>
                     <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                           <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b">Nome</th>
                                    <th className="py-2 px-4 border-b">Email</th>
                                    <th className="py-2 px-4 border-b">Admin?</th>
                                    <th className="py-2 px-4 border-b">Ações</th>
                                </tr>
                            </thead>
                             <tbody>
                                {users.map(user => (
                                    <tr key={user.ID}>
                                        <td className="py-2 px-4 border-b">{user.name}</td>
                                        <td className="py-2 px-4 border-b">{user.email}</td>
                                        <td className="py-2 px-4 border-b">{user.isAdmin ? 'Sim' : 'Não'}</td>
                                        <td className="py-2 px-4 border-b">
                                            <button className="text-blue-500 hover:underline text-sm" onClick={() => alert('Função de editar utilizador a ser implementada.')}>Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Componente Raiz ---

function App() {
  const [view, setView] = useState('loading'); // loading, login, register, home, profile, admin
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setView('home');
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  }, []);

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

  const renderView = () => {
    if (!user && !['login', 'register', 'loading'].includes(view)) {
        handleLogout();
        return <LoginPage setView={setView} onLogin={handleLogin} />;
    }

    switch (view) {
      case 'login':
        return <LoginPage setView={setView} onLogin={handleLogin} />;
      case 'register':
        return <RegisterPage setView={setView} />;
      case 'home':
        return <HomePage token={token} />;
      case 'profile':
        return <MyProfilePage token={token} />;
      case 'admin':
        return user.isAdmin ? <AdminPage token={token} /> : <HomePage token={token} />;
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

