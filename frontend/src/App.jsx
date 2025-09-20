import React, { useState, useEffect, useCallback } from 'react';

// Constante para a URL base da sua API
const API_BASE_URL = 'http://localhost:8080'; // Deixe em branco se o frontend e o backend estiverem no mesmo domínio

// --- Ícones SVG para a UI ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>;
const LogInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const HeartHandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 12.5a2.5 2.5 0 0 0-2.5-2.5V12a2.5 2.5 0 0 0 2.5 2.5Z"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;


// --- Funções Auxiliares da API ---
const api = {
    async request(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api${path}`, { ...options, headers });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Ocorreu um erro.');
            }
            return data;
        } catch (error) {
            console.error(`API Error on ${path}:`, error);
            throw error;
        }
    },
    // Funções públicas
    getParishInfo: () => api.request('/info'),
    getServices: () => api.request('/services'),
    getPastorais: () => api.request('/pastorais'),
    getMassTimes: () => api.request('/mass-times'),
    login: (email, password) => api.request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (userData) => api.request('/register', { method: 'POST', body: JSON.stringify(userData) }),
    // Funções de Utilizador Autenticado
    createRegistration: (service_id) => api.request('/registrations', { method: 'POST', body: JSON.stringify({ service_id }) }),
    getMyRegistrations: () => api.request('/my-registrations'),
    createContribution: (value, method) => api.request('/contributions', { method: 'POST', body: JSON.stringify({ value, method }) }),
    getMyContributions: () => api.request('/my-contributions'),
    // Funções de Admin
    getAllRegistrations: () => api.request('/admin/registrations'),
    updateRegistrationStatus: (id, status) => api.request(`/admin/registrations/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getDashboardStats: () => api.request('/admin/dashboard'),
    getAllUsers: () => api.request('/admin/users'),
    updateUser: (id, userData) => api.request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
};

// --- Componentes da UI ---

const Header = ({ user, setPage, handleLogout }) => (
    <header className="bg-white shadow-md sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <div className="text-xl font-bold text-gray-800 cursor-pointer" onClick={() => setPage('home')}>
                Paróquia Santo Antônio
            </div>
            <div className="flex space-x-4 items-center">
                <button onClick={() => setPage('home')} className="text-gray-600 hover:text-blue-600">Início</button>
                <button onClick={() => setPage('services')} className="text-gray-600 hover:text-blue-600">Inscrições</button>
                <button onClick={() => setPage('pastorais')} className="text-gray-600 hover:text-blue-600">Pastorais</button>
                {user ? (
                    <>
                        {user.isAdmin && <button onClick={() => setPage('admin')} className="font-bold text-red-600 hover:text-red-800">Admin</button>}
                        <button onClick={() => setPage('profile')} className="text-gray-600 hover:text-blue-600">Perfil</button>
                        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Sair</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setPage('login')} className="text-gray-600 hover:text-blue-600">Login</button>
                        <button onClick={() => setPage('register')} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Registar</button>
                    </>
                )}
            </div>
        </nav>
    </header>
);

const HomePage = () => {
    const [info, setInfo] = useState(null);
    const [massTimes, setMassTimes] = useState([]);
    useEffect(() => {
        api.getParishInfo().then(setInfo).catch(err => console.error(err));
        api.getMassTimes().then(setMassTimes).catch(err => console.error(err));
    }, []);

    return (
        <div className="space-y-8">
            {info && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">{info.name}</h1>
                    <p className="text-gray-600 whitespace-pre-line">{info.history}</p>
                </div>
            )}
            <div className="grid md:grid-cols-2 gap-8">
                 <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 flex items-center gap-2"><CalendarIcon /> Horários de Missa</h2>
                     <div className="space-y-2">
                        {massTimes.map(mt => (
                             <div key={mt.ID} className="p-2 border-b">
                                 <p className="font-bold">{mt.location}</p>
                                 <p>{mt.day} - {mt.time}</p>
                                 {mt.details && <p className="text-sm text-gray-500">{mt.details}</p>}
                            </div>
                        ))}
                    </div>
                </div>
                {info && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Atendimento</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold">Secretaria</h3>
                                <p className="text-gray-600 whitespace-pre-line">{info.secretariat_hours}</p>
                            </div>
                             <div>
                                <h3 className="font-bold">Padres</h3>
                                <p className="text-gray-600 whitespace-pre-line">{info.priest_hours}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ServicesPage = ({ user, setPage }) => {
    const [services, setServices] = useState([]);
    const [message, setMessage] = useState('');
    useEffect(() => { api.getServices().then(setServices).catch(err => console.error(err)); }, []);

    const handleRegister = async (serviceId) => {
        if (!user) {
            setPage('login');
            return;
        }
        try {
            const result = await api.createRegistration(serviceId);
            setMessage(result.message);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.message);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-4">Inscrições e Serviços</h1>
            {message && <div className="p-3 mb-4 bg-green-100 text-green-800 rounded">{message}</div>}
            <div className="space-y-4">
                {services.map(s => (
                    <div key={s.ID} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">{s.Name}</h2>
                            <p className="text-gray-600">{s.Description}</p>
                        </div>
                        <button onClick={() => handleRegister(s.ID)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Inscrever-se</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PastoraisPage = () => {
    const [pastorais, setPastorais] = useState([]);
    useEffect(() => { api.getPastorais().then(setPastorais).catch(err => console.error(err)); }, []);
    return (
        <div className="bg-white p-6 rounded-lg shadow">
             <h1 className="text-3xl font-bold mb-4">Pastorais e Movimentos</h1>
             <div className="space-y-4">
                {pastorais.map(p => (
                    <div key={p.ID} className="p-4 border rounded-lg">
                        <h2 className="text-xl font-semibold">{p.Name}</h2>
                        <p className="text-gray-600">{p.Description}</p>
                        <p className="text-sm text-gray-500 mt-2">Coordenador(a): {p.Coordinator}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LoginPage = ({ handleLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await api.login(email, password);
            handleLoginSuccess(data.user, data.token);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
            {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded" />
                <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded" />
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Entrar</button>
            </form>
        </div>
    );
};

const RegisterPage = ({ setPage }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '', dob: '', gender: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const data = await api.register(formData);
            setMessage(data.message + " Você já pode fazer o login.");
            setTimeout(() => setPage('login'), 3000);
        } catch (err) {
            setError(err.message);
        }
    };
    
    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
             <h1 className="text-2xl font-bold mb-6 text-center">Registar Novo Paroquiano</h1>
             {message && <p className="bg-green-100 text-green-700 p-2 rounded mb-4">{message}</p>}
             {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}
             <form onSubmit={handleSubmit} className="space-y-4">
                 <input name="name" placeholder="Nome Completo" onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
                 <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
                 <input name="password" type="password" placeholder="Senha (mín. 6 caracteres)" onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
                 <input name="address" placeholder="Endereço" onChange={handleChange} className="w-full px-3 py-2 border rounded" />
                 <input name="dob" type="date" placeholder="Data de Nascimento" onChange={handleChange} className="w-full px-3 py-2 border rounded" />
                 <select name="gender" onChange={handleChange} className="w-full px-3 py-2 border rounded">
                     <option value="">Selecione o Gênero</option>
                     <option value="Masculino">Masculino</option>
                     <option value="Feminino">Feminino</option>
                 </select>
                 <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Registar</button>
             </form>
        </div>
    );
};

const ProfilePage = ({ user }) => {
    const [registrations, setRegistrations] = useState([]);
    const [contributions, setContributions] = useState([]);

    const fetchData = useCallback(() => {
        api.getMyRegistrations().then(setRegistrations).catch(console.error);
        api.getMyContributions().then(setContributions).catch(console.error);
    }, []);

    useEffect(fetchData, [fetchData]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Olá, {user.name}!</h1>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><UserCheckIcon /> Minhas Inscrições</h2>
                    <ul className="space-y-2">
                        {registrations.map(r => <li key={r.ID} className="p-2 border-b flex justify-between"><span>{r.Service.Name}</span> <span className="font-semibold">{r.Status}</span></li>)}
                    </ul>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><HeartHandIcon /> Minhas Contribuições</h2>
                    <ul className="space-y-2">
                         {contributions.map(c => <li key={c.ID} className="p-2 border-b flex justify-between"><span>{new Date(c.CreatedAt).toLocaleDateString()}</span> <span className="font-semibold">R$ {c.Value.toFixed(2)}</span></li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [users, setUsers] = useState([]);

    const fetchData = useCallback(() => {
        api.getDashboardStats().then(setStats).catch(console.error);
        api.getAllRegistrations().then(setRegistrations).catch(console.error);
        api.getAllUsers().then(setUsers).catch(console.error);
    }, []);

    useEffect(fetchData, [fetchData]);
    
    const handleStatusUpdate = async (regId, newStatus) => {
        try {
            await api.updateRegistrationStatus(regId, newStatus);
            fetchData(); // Recarrega os dados
        } catch (error) {
            alert(`Erro ao atualizar: ${error.message}`);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Painel de Administração</h1>
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold">{stats.total_users}</p><p>Paroquianos</p></div>
                    <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold">{stats.total_registrations}</p><p>Inscrições</p></div>
                    <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold">{stats.total_contributions}</p><p>Contribuições</p></div>
                    <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold">R$ {stats.total_contribution_value.toFixed(2)}</p><p>Valor Total</p></div>
                </div>
            )}
             <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">Gerir Inscrições</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="border-b"><th className="p-2">Utilizador</th><th className="p-2">Serviço</th><th className="p-2">Status</th><th className="p-2">Ações</th></tr></thead>
                        <tbody>
                            {registrations.map(r => (
                                <tr key={r.ID} className="border-b">
                                    <td className="p-2">{r.User.Name}</td>
                                    <td className="p-2">{r.Service.Name}</td>
                                    <td className="p-2 font-semibold">{r.Status}</td>
                                    <td className="p-2 space-x-2">
                                        <button onClick={() => handleStatusUpdate(r.ID, 'Aprovado')} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Aprovar</button>
                                        <button onClick={() => handleStatusUpdate(r.ID, 'Rejeitado')} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Rejeitar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">Gerir Paroquianos</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead><tr className="border-b"><th className="p-2">Nome</th><th className="p-2">Email</th><th className="p-2">Admin?</th></tr></thead>
                         <tbody>
                            {users.map(u => (
                                <tr key={u.ID} className="border-b">
                                    <td className="p-2">{u.Name}</td>
                                    <td className="p-2">{u.Email}</td>
                                    <td className="p-2">{u.IsAdmin ? 'Sim' : 'Não'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Componente Principal da Aplicação ---
export default function App() {
    const [page, setPage] = useState('home');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLoginSuccess = (userData, token) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
        setPage(userData.isAdmin ? 'admin' : 'profile');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setPage('home');
    };

    const renderPage = () => {
        switch (page) {
            case 'login': return <LoginPage handleLoginSuccess={handleLoginSuccess} />;
            case 'register': return <RegisterPage setPage={setPage} />;
            case 'services': return <ServicesPage user={user} setPage={setPage} />;
            case 'pastorais': return <PastoraisPage />;
            case 'profile': return user ? <ProfilePage user={user} /> : <LoginPage handleLoginSuccess={handleLoginSuccess} />;
            case 'admin': return (user && user.isAdmin) ? <AdminDashboard /> : <HomePage />;
            case 'home':
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <Header user={user} setPage={setPage} handleLogout={handleLogout} />
            <main className="container mx-auto px-6 py-8">
                {renderPage()}
            </main>
            <footer className="text-center py-4 text-gray-500">
                <p>&copy; {new Date().getFullYear()} Paróquia Santo Antônio de Marília. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}

