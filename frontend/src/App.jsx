import React, { useState, useEffect } from 'react';

// --- CONFIGURAÇÃO DA API ---
// Aponte para o seu backend na Render.
const API_BASE_URL = 'https://plataforma-paroquia.onrender.com';

// Função auxiliar para fazer pedidos à API
const apiService = {
  request: async (path, method = 'GET', data = null, token = null) => {
    const url = `${API_BASE_URL}/api${path}`;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro de rede ou resposta não-JSON' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(`API Error on ${path}:`, error);
      throw error;
    }
  },

  // --- Funções da API Pública ---
  getParishInfo: () => apiService.request('/parish-info'),
  getServices: () => apiService.request('/services'),
  getMassTimes: () => apiService.request('/mass-times'),
  getPastorais: () => apiService.request('/pastorais'),
  register: (userData) => apiService.request('/register', 'POST', userData),
  login: (credentials) => apiService.request('/login', 'POST', credentials),
};

// --- Componente Principal ---
function App() {
  const [parishInfo, setParishInfo] = useState(null);
  const [massTimes, setMassTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para o formulário de registo
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const info = await apiService.getParishInfo();
        const times = await apiService.getMassTimes();
        setParishInfo(info);
        setMassTimes(times || []);
        setError(null);
      } catch (err) {
        setError('Falha ao carregar os dados da paróquia. Verifique a consola para mais detalhes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const data = { name, email, password };
      const response = await apiService.register(data);
      setMessage(response.message || 'Registo bem-sucedido!');
      // Limpar formulário
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setMessage(`Erro no registo: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">A carregar...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <header className="bg-white shadow-md p-6">
        <h1 className="text-4xl font-bold text-gray-800 text-center">
          {parishInfo?.name || 'Plataforma da Paróquia'}
        </h1>
      </header>

      <main className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna de Informações */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Horários das Missas</h2>
          <ul className="space-y-2">
            {massTimes.map((mt) => (
              <li key={mt.ID} className="border-b pb-2">
                <p className="font-bold">{mt.location}</p>
                <p>{mt.Day}: {mt.Time}</p>
                {mt.Description && <p className="text-sm text-gray-600">{mt.Description}</p>}
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna de Registo */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Registe-se na Plataforma</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-gray-700">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
            >
              Criar Conta
            </button>
          </form>
          {message && <p className="mt-4 text-center p-2 bg-gray-200 rounded-md">{message}</p>}
        </div>
      </main>
    </div>
  );
}

export default App;

