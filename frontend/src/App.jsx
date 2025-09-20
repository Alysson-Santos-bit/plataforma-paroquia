import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Constante da API ---
const API_BASE_URL = 'https://glorious-palm-tree-g4p549q76rqg29q96-8080.app.github.dev';

// --- Componentes de Ícones ---
const UserCircleIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" /></svg> );
const HomeIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> );
const PixQrCodeIcon = (props) => ( <svg {...props} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M128 0H0v128h128V0ZM96 96H32V32h64v64Zm128-96H128v128h128V0Zm-32 96h-64V32h64v64ZM0 256h128V128H0v128Zm32-96h64v64H32v-64Zm224 96H128V128h128v128Zm-32-96h-64v64h-32v-32h-32v32h-32v32h64v-32h32v-32h32v32h32v-64Z"/></svg> );
const ClockIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> );
const CalendarIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> );
const FacebookIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg> );
const InstagramIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg> );
const AdminIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> );
const MailIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const PhoneIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const MapPinIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>);
const SpinnerIcon = (props) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> );


// --- Componente Principal da Aplicação ---
export default function App() {
  const [parishInfo, setParishInfo] = useState({});
  const [services, setServices] = useState([]);
  const [pastorals, setPastorals] = useState([]);
  const [massTimes, setMassTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [contributionAmount, setContributionAmount] = useState('');
  const [showPixModal, setShowPixModal] = useState(false);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard');
  const [allUsers, setAllUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [infoRes, servicesRes, pastoralsRes, massTimesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/parish-info`),
          fetch(`${API_BASE_URL}/api/services`),
          fetch(`${API_BASE_URL}/api/pastorais`),
          fetch(`${API_BASE_URL}/api/mass-times`),
        ]);
        if (!infoRes.ok || !servicesRes.ok || !pastoralsRes.ok || !massTimesRes.ok) throw new Error('Falha em buscar dados do servidor.');
        setParishInfo(await infoRes.json());
        setServices(await servicesRes.json() || []);
        setPastorals(await pastoralsRes.json() || []);
        setMassTimes(await massTimesRes.json() || []);
      } catch (err) {
        setError('Não foi possível carregar os dados da paróquia. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const token = localStorage.getItem('token');
      try {
        const [regsRes, contribsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/my-registrations`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/my-contributions`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if(!regsRes.ok || !contribsRes.ok) throw new Error("Falha ao buscar dados do paroquiano.");
        setMyRegistrations(await regsRes.json() || []);
        setMyContributions(await contribsRes.json() || []);
        if (currentUser.isAdmin) {
          const [allRegsRes, statsRes, allUsersRes] = await Promise.all([
             fetch(`${API_BASE_URL}/api/admin/registrations`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
             fetch(`${API_BASE_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          if (!allRegsRes.ok || !statsRes.ok || !allUsersRes.ok) throw new Error("Falha ao buscar dados de administração.");
          setAllRegistrations(await allRegsRes.json() || []);
          setDashboardStats(await statsRes.json());
          setAllUsers(await allUsersRes.json() || []);
        }
      } catch (err) {
         showNotification(`Erro: ${err.message}`, 'error');
      }
    };
    fetchUserData();
  }, [currentUser]);

  const showNotification = (message, type = 'success') => { setNotification({ show: true, message, type }); setTimeout(() => { setNotification({ show: false, message: '', type: 'success' }); }, 5000); };
  const handleAuthClick = () => setShowAuthModal(true);
  const handleCloseModal = () => { setShowAuthModal(false); setShowPixModal(false); setShowUserEditModal(false); setEditingUser(null); }
  const handleRegisterSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); const { name, email, password, address, dob, gender } = e.target.elements; const userData = { name: name.value, email: email.value, password: password.value, address: address.value, dob: dob.value, gender: gender.value }; try { const res = await fetch(`${API_BASE_URL}/api/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Erro desconhecido'); showNotification(data.message); setIsRegistering(false); } catch (err) { showNotification(`Erro ao registar: ${err.message}`, 'error'); } finally { setIsSubmitting(false); } };
  const handleLoginSubmit = async (e) => { e.preventDefault(); setIsSubmitting(true); const { email, password } = e.target.elements; try { const res = await fetch(`${API_BASE_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value, password: password.value }), }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'E-mail ou senha inválidos'); localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); setCurrentUser(data.user); showNotification(data.message); handleCloseModal(); } catch (err) { showNotification(`Erro no login: ${err.message}`, 'error'); } finally { setIsSubmitting(false); } };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setCurrentUser(null); setMyRegistrations([]); setMyContributions([]); setAllRegistrations([]); setDashboardStats(null); setAllUsers([]); showNotification('Sessão encerrada com sucesso!'); };
  const handleRegistration = async (serviceId) => { if (!currentUser) { showNotification('Por favor, faça login para se inscrever.', 'error'); handleAuthClick(); return; } const token = localStorage.getItem('token'); try { const res = await fetch(`${API_BASE_URL}/api/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ service_id: serviceId }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Não foi possível completar a inscrição.'); showNotification(data.message); const updatedRegsRes = await fetch(`${API_BASE_URL}/api/my-registrations`, { headers: { 'Authorization': `Bearer ${token}` }}); setMyRegistrations(await updatedRegsRes.json() || []); if(currentUser.isAdmin) { const allRegsRes = await fetch(`${API_BASE_URL}/api/admin/registrations`, { headers: { 'Authorization': `Bearer ${token}` } }); setAllRegistrations(await allRegsRes.json() || []);} } catch (err) { showNotification(err.message, 'error'); } };
  const handlePixContribution = async () => { const value = parseFloat(contributionAmount); if (!value || value <= 0) { showNotification('Por favor, insira um valor válido.', 'error'); return; } const token = localStorage.getItem('token'); try { const res = await fetch(`${API_BASE_URL}/api/contributions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ value: value, method: 'PIX' }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Não foi possível registar a contribuição.'); setShowPixModal(true); showNotification("Leia o QR Code ou copie a chave para contribuir."); const updatedContribsRes = await fetch(`${API_BASE_URL}/api/my-contributions`, { headers: { 'Authorization': `Bearer ${token}` }}); setMyContributions(await updatedContribsRes.json() || []); } catch (err) { showNotification(err.message, 'error'); } };
  const copyPixKey = () => { const pixKey = "chave.pix.da.paroquia@email.com"; navigator.clipboard.writeText(pixKey).then(() => showNotification('Chave PIX copiada!'), () => showNotification('Falha ao copiar a chave.', 'error')); }
  const handleStatusChange = async (regId, newStatus) => { const token = localStorage.getItem('token'); try { const res = await fetch(`${API_BASE_URL}/api/admin/registrations/${regId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Falha ao atualizar status.'); showNotification('Status da inscrição atualizado com sucesso!'); setAllRegistrations(prevRegs => prevRegs.map(reg => reg.ID === regId ? { ...reg, status: newStatus } : reg)); } catch (err) { showNotification(err.message, 'error'); } };
  const handleUpdateUser = async (e) => { e.preventDefault(); if (!editingUser) return; setIsSubmitting(true); const token = localStorage.getItem('token'); const { name, email, address, dob, gender, isAdmin } = e.target.elements; const updatedData = { name: name.value, email: email.value, address: address.value, dob: dob.value, gender: gender.value, isAdmin: isAdmin.checked }; try { const res = await fetch(`${API_BASE_URL}/api/admin/users/${editingUser.ID}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updatedData) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Falha ao atualizar utilizador.'); showNotification('Utilizador atualizado com sucesso!'); setAllUsers(prevUsers => prevUsers.map(u => u.ID === editingUser.ID ? {...u, ...data.user} : u)); handleCloseModal(); } catch (err) { showNotification(err.message, 'error'); } finally { setIsSubmitting(false); } };

  const timesByLocation = massTimes.reduce((acc, time) => { (acc[time.location] = acc[time.location] || []).push(time); return acc; }, {});
  const chartData = services.map(service => ({ name: service.name, inscrições: allRegistrations.filter(reg => reg.service_id === service.ID).length })).filter(item => item.inscrições > 0);

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-gray-100"><p className="text-xl">Carregando...</p></div>;
  if (error) return <div className="flex justify-center items-center h-screen bg-red-100"><p className="text-xl text-red-700">{error}</p></div>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col">
      {notification.show && (<div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-out z-50`}>{notification.message}</div>)}
      <header className="bg-white shadow-md sticky top-0 z-20"><div className="container mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center"><div className="flex items-center space-x-2"><HomeIcon className="text-yellow-500 h-8 w-8" /><h1 className="text-xl sm:text-2xl font-bold text-gray-800">{parishInfo.name}</h1></div><div className="mt-2 sm:mt-0">{currentUser ? (<div className="flex items-center space-x-4"><span className="text-sm sm:text-base text-gray-700">Bem-vindo(a), {currentUser.name}!</span><button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded-full text-sm sm:text-base transition duration-300">Logout</button></div>) : (<button onClick={handleAuthClick} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 sm:px-4 rounded-full flex items-center space-x-2 transition duration-300 text-sm sm:text-base"><UserCircleIcon /><span>Login / Cadastro</span></button>)}</div></div></header>
      
      <main className="container mx-auto px-4 sm:px-6 py-8 flex-grow">
        {currentUser && !currentUser.isAdmin && (
            <section id="parishioner-area" className="mb-12 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Área do Paroquiano</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Minhas Inscrições</h3>
                            {myRegistrations.length > 0 ? (
                                <ul className="space-y-4">
                                    {myRegistrations.map(reg => (
                                        <li key={reg.ID} className="p-4 bg-gray-100 rounded-lg">
                                            <h4 className="font-semibold text-lg text-gray-800">{reg.service?.name || 'Serviço não encontrado'}</h4>
                                            <p className="text-sm text-gray-600">Status: <span className="font-medium text-yellow-600">{reg.status}</span></p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<p className="text-gray-600">Você ainda não se inscreveu em nenhum serviço.</p>)}
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Contribuição</h3>
                            <div className="p-4 bg-gray-100 rounded-lg">
                                <p className="text-gray-700 mb-4">A sua contribuição generosa ajuda a manter as obras da nossa paróquia.</p>
                                <div className="flex items-center space-x-2 mb-4"><span className="text-gray-800 font-bold text-lg">R$</span><input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="0,00" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"/></div>
                                <button onClick={handlePixContribution} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">Contribuir com PIX</button>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Histórico de Contribuições</h3>
                        <div className="text-xs text-gray-500 mb-2 md:hidden">(Deslize a tabela para ver mais)</div>
                        <div className="overflow-x-auto">
                            {myContributions.length > 0 ? (
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 whitespace-nowrap">Data</th>
                                            <th scope="col" className="px-4 py-3 whitespace-nowrap">Valor</th>
                                            <th scope="col" className="px-4 py-3">Método</th>
                                            <th scope="col" className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myContributions.map(c => (
                                            <tr key={c.ID} className="bg-white border-b">
                                                <td className="px-4 py-3 whitespace-nowrap">{new Date(c.CreatedAt).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">R$ {typeof c.value === 'number' ? c.value.toFixed(2) : '0.00'}</td>
                                                <td className="px-4 py-3">{c.method}</td>
                                                <td className="px-4 py-3"><span className="font-medium text-orange-500">{c.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (<p className="text-gray-600">Nenhuma contribuição registada.</p>)}
                        </div>
                    </div>
                </div>
            </section>
        )}
        
        {currentUser && currentUser.isAdmin && (
            <section id="admin-area" className="mb-12 bg-red-50 border border-red-200 p-4 sm:p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl sm:text-3xl font-bold text-red-800 mb-6 border-b-2 border-red-500 pb-2 flex items-center"><AdminIcon className="mr-3"/>Painel Administrativo</h2>
                <div className="mb-6 border-b border-gray-200">
                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
                        <li className="mr-2"><button onClick={() => setAdminTab('dashboard')} className={`inline-block p-4 rounded-t-lg border-b-2 ${adminTab === 'dashboard' ? 'text-red-600 border-red-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}>Dashboard</button></li>
                        <li className="mr-2"><button onClick={() => setAdminTab('registrations')} className={`inline-block p-4 rounded-t-lg border-b-2 ${adminTab === 'registrations' ? 'text-red-600 border-red-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}>Gerir Inscrições</button></li>
                        <li className="mr-2"><button onClick={() => setAdminTab('users')} className={`inline-block p-4 rounded-t-lg border-b-2 ${adminTab === 'users' ? 'text-red-600 border-red-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}>Gerir Paroquianos</button></li>
                    </ul>
                </div>

                {adminTab === 'dashboard' && (
                    <div>
                        {dashboardStats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white p-4 rounded-lg shadow"><h4 className="text-sm font-semibold text-gray-500">Total de Paroquianos</h4><p className="text-3xl font-bold text-gray-800">{dashboardStats.total_users}</p></div>
                                <div className="bg-white p-4 rounded-lg shadow"><h4 className="text-sm font-semibold text-gray-500">Total de Inscrições</h4><p className="text-3xl font-bold text-gray-800">{dashboardStats.total_registrations}</p></div>
                                <div className="bg-white p-4 rounded-lg shadow"><h4 className="text-sm font-semibold text-gray-500">Total de Contribuições</h4><p className="text-3xl font-bold text-gray-800">{dashboardStats.total_contributions}</p></div>
                                <div className="bg-white p-4 rounded-lg shadow"><h4 className="text-sm font-semibold text-gray-500">Valor Arrecadado (PIX)</h4><p className="text-3xl font-bold text-gray-800">R$ {typeof dashboardStats.total_contribution_value === 'number' ? dashboardStats.total_contribution_value.toFixed(2) : '0.00'}</p></div>
                            </div>
                        )}
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Inscrições por Serviço</h3>
                        <div className="bg-white p-4 rounded-lg shadow" style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-35} textAnchor="end" height={120} interval={0} tick={{ fontSize: 12 }}/>
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="inscrições" fill="#b91c1c" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
                {adminTab === 'registrations' && (
                    <div>
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Todas as Inscrições</h3>
                        <div className="text-xs text-gray-500 mb-2 md:hidden">(Deslize a tabela para ver mais)</div>
                        {allRegistrations.length > 0 ? (
                            <div className="overflow-x-auto max-h-[600px]"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0"><tr><th scope="col" className="px-4 py-3 whitespace-nowrap">Paroquiano</th><th scope="col" className="px-4 py-3 whitespace-nowrap">Serviço Inscrito</th><th scope="col" className="px-4 py-3 whitespace-nowrap">Data</th><th scope="col" className="px-4 py-3">Status</th></tr></thead>
                                <tbody>{allRegistrations.map(reg => ( <tr key={reg.ID} className="bg-white border-b"><td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{reg.user?.name}</td><td className="px-4 py-3 whitespace-nowrap">{reg.service?.name}</td><td className="px-4 py-3 whitespace-nowrap">{new Date(reg.CreatedAt).toLocaleDateString('pt-BR')}</td><td className="px-4 py-3"><select value={reg.status} onChange={(e) => handleStatusChange(reg.ID, e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"><option value="Pendente">Pendente</option><option value="Confirmada">Confirmada</option><option value="Recusada">Recusada</option></select></td></tr>))}</tbody>
                            </table></div>
                        ) : (<p className="text-gray-600">Nenhuma inscrição encontrada.</p>)}
                    </div>
                )}
                {adminTab === 'users' && (
                    <div>
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4">Todos os Paroquianos</h3>
                        <div className="text-xs text-gray-500 mb-2 md:hidden">(Deslize a tabela para ver mais)</div>
                        {allUsers.length > 0 ? (
                            <div className="overflow-x-auto max-h-[600px]">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0"><tr><th scope="col" className="px-4 py-3">Nome</th><th scope="col" className="px-4 py-3">E-mail</th><th scope="col" className="px-4 py-3">Admin</th><th scope="col" className="px-4 py-3">Ações</th></tr></thead>
                                    <tbody>{allUsers.map(user => (<tr key={user.ID} className="bg-white border-b"><td className="px-4 py-3 font-medium whitespace-nowrap">{user.name}</td><td className="px-4 py-3 whitespace-nowrap">{user.email}</td><td className="px-4 py-3">{user.isAdmin ? 'Sim' : 'Não'}</td><td className="px-4 py-3"><button onClick={() => { setEditingUser(user); setShowUserEditModal(true); }} className="font-medium text-blue-600 hover:underline">Editar</button></td></tr>))}</tbody>
                                </table>
                            </div>
                        ) : (<p className="text-gray-600">Nenhum utilizador encontrado.</p>)}
                    </div>
                )}
            </section>
        )}

        <section id="schedules" className="mb-12"><h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Horários e Atendimento</h2><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl shadow-lg"><h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 flex items-center"><CalendarIcon className="mr-2"/>Celebrações</h3><div className="space-y-6">{Object.entries(timesByLocation).map(([location, times]) => (<div key={location}><h4 className="text-lg sm:text-xl font-bold text-gray-600 mb-3">{location}</h4><ul className="space-y-2 pl-4 border-l-2 border-gray-200">{times.map(t => (<li key={t.ID} className="flex flex-col sm:flex-row items-start sm:items-center text-gray-700"><span className="font-semibold w-full sm:w-32">{t.day}</span><span className="font-medium w-full sm:w-24">{t.time}</span><span className="text-sm sm:text-base">{t.description}</span></li>))}</ul></div>))}</div></div><div className="space-y-8"><div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 flex items-center"><ClockIcon className="mr-2"/>Secretaria</h3><p className="text-gray-700 whitespace-pre-line">{parishInfo.secretariat_hours}</p></div><div className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 flex items-center"><UserCircleIcon className="mr-2"/>Atendimento do Padre</h3><p className="text-gray-700 whitespace-pre-line">{parishInfo.priest_hours}</p></div></div></div></section>
        <section id="history" className="mb-12"><h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Nossa História</h2><div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg"><p className="text-gray-700 leading-relaxed text-justify">{parishInfo.history}</p></div></section>
        <section id="services" className="mb-12"><h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Serviços e Sacramentos</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{services.map(service => (<div key={service.ID} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition duration-300"><div className="p-6"><h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3><p className="text-gray-600 mb-4">{service.description}</p><button onClick={() => handleRegistration(service.ID)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">Inscrever-se</button></div></div>))}</div></section>
        <section id="pastorals" className="mb-12"><h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Pastorais e Movimentos</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{pastorals.map(pastoral => (<div key={pastoral.ID} className="bg-white p-6 rounded-xl shadow-lg"><h3 className="text-xl font-bold text-gray-800 mb-2">{pastoral.name}</h3><p className="text-gray-600 mb-4">{pastoral.description}</p><div className="text-sm text-gray-500"><p><span className="font-semibold">Reuniões:</span> {pastoral.meeting_info}</p></div></div>))}</div></section>
        <section id="social-media">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">Acompanhe-nos nas Redes Sociais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <a href="https://www.facebook.com/groups/1234749000206433" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white p-8 rounded-xl shadow-lg flex items-center justify-center space-x-4 transform hover:scale-105 transition duration-300"><FacebookIcon className="w-10 h-10"/><span className="text-2xl font-bold">Facebook</span></a>
            <a href="https://www.instagram.com/paroquiasantoantoniomarilia" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-8 rounded-xl shadow-lg flex items-center justify-center space-x-4 transform hover:scale-105 transition duration-300"><InstagramIcon className="w-10 h-10"/><span className="text-2xl font-bold">Instagram</span></a>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white mt-auto">
        <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                <div><h3 className="text-lg font-bold mb-4">Paróquia Santo Antônio de Marília</h3><div className="flex items-center justify-center md:justify-start mb-2"><MapPinIcon className="w-5 h-5 mr-2"/><p>Av. Santo Antônio, 721 - Marília/SP</p></div></div>
                <div><h3 className="text-lg font-bold mb-4">Contacto</h3><div className="flex items-center justify-center md:justify-start mb-2"><PhoneIcon className="w-5 h-5 mr-2"/><p>(14) 3433-2522</p></div><div className="flex items-center justify-center md:justify-start"><MailIcon className="w-5 h-5 mr-2"/><p>par.santoantonio@diocesedemarilia.com.br</p></div></div>
                <div><h3 className="text-lg font-bold mb-4">Redes Sociais</h3><div className="flex justify-center md:justify-start space-x-4"><a href="https://www.facebook.com/groups/1234749000206433" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition duration-300"><FacebookIcon className="w-7 h-7"/></a><a href="https://www.instagram.com/paroquiasantoantoniomarilia" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition duration-300"><InstagramIcon className="w-7 h-7"/></a></div></div>
            </div>
            <div className="text-center text-gray-400 mt-8 pt-4 border-t border-gray-700"><p>&copy; {new Date().getFullYear()} Paróquia Santo Antônio de Marília. Todos os direitos reservados.</p></div>
        </div>
      </footer>

      {showAuthModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" onClick={handleCloseModal}><div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative" onClick={e => e.stopPropagation()}><button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>{isRegistering ? (<div><h2 className="text-2xl font-bold mb-6 text-center">Criar Conta</h2><form onSubmit={handleRegisterSubmit}><div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="name">Nome Completo</label><input className="w-full px-4 py-2 border rounded-lg" type="text" id="name" name="name" required /></div><div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="address">Endereço</label><input className="w-full px-4 py-2 border rounded-lg" type="text" id="address" name="address" required /></div><div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="dob">Data de Nascimento</label><input className="w-full px-4 py-2 border rounded-lg" type="date" id="dob" name="dob" required /></div><div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="gender">Género</label><select id="gender" name="gender" className="w-full px-4 py-2 border rounded-lg"><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div><div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label><input className="w-full px-4 py-2 border rounded-lg" type="email" id="email" name="email" required /></div><div className="mb-6"><label className="block text-gray-700 mb-2" htmlFor="password">Senha</label><input className="w-full px-4 py-2 border rounded-lg" type="password" id="password" name="password" required /></div><button disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full flex justify-center items-center transition duration-300 disabled:bg-yellow-300" type="submit">{isSubmitting ? <SpinnerIcon className="animate-spin mr-2" /> : null}{isSubmitting ? 'A Registar...' : 'Registar'}</button></form><p className="text-center mt-4">Já tem uma conta? <button onClick={() => setIsRegistering(false)} className="text-blue-500 hover:underline">Faça o login</button></p></div>) : (<div><h2 className="text-2xl font-bold mb-6 text-center">Login</h2><form onSubmit={handleLoginSubmit}><div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label><input className="w-full px-4 py-2 border rounded-lg" type="email" id="email" name="email" required /></div><div className="mb-6"><label className="block text-gray-700 mb-2" htmlFor="password">Senha</label><input className="w-full px-4 py-2 border rounded-lg" type="password" id="password" name="password" required /></div><button disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full flex justify-center items-center transition duration-300 disabled:bg-blue-300" type="submit">{isSubmitting ? <SpinnerIcon className="animate-spin mr-2" /> : null}{isSubmitting ? 'A Entrar...' : 'Entrar'}</button></form><p className="text-center mt-4">Não tem uma conta? <button onClick={() => setIsRegistering(true)} className="text-blue-500 hover:underline">Cadastre-se</button></p></div>)}</div></div>)}
      {showPixModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" onClick={handleCloseModal}><div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm relative text-center" onClick={e => e.stopPropagation()}><button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button><h2 className="text-2xl font-bold mb-4">Contribuição via PIX</h2><p className="text-gray-600 mb-4">Leia o QR Code com a app do seu banco ou copie a chave abaixo.</p><div className="flex justify-center mb-4"><PixQrCodeIcon className="w-48 h-48" /></div><div className="bg-gray-100 p-3 rounded-lg"><p className="text-gray-600 text-sm">Chave PIX (E-mail - Exemplo):</p><p className="font-mono text-lg font-bold">chave.pix.da.paroquia@email.com</p></div><button onClick={copyPixKey} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">Copiar Chave</button></div></div>)}
      {showUserEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" onClick={handleCloseModal}>
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center">Editar Paroquiano</h2>
            <form onSubmit={handleUpdateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="name">Nome</label><input className="w-full px-4 py-2 border rounded-lg" type="text" id="name" name="name" defaultValue={editingUser.name} required /></div>
                    <div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="email">E-mail</label><input className="w-full px-4 py-2 border rounded-lg" type="email" id="email" name="email" defaultValue={editingUser.email} required /></div>
                    <div className="mb-4 md:col-span-2"><label className="block text-gray-700 mb-2" htmlFor="address">Endereço</label><input className="w-full px-4 py-2 border rounded-lg" type="text" id="address" name="address" defaultValue={editingUser.address} required /></div>
                    <div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="dob">Data de Nascimento</label><input className="w-full px-4 py-2 border rounded-lg" type="date" id="dob" name="dob" defaultValue={editingUser.dob} required /></div>
                    <div className="mb-4"><label className="block text-gray-700 mb-2" htmlFor="gender">Género</label><select id="gender" name="gender" defaultValue={editingUser.gender} className="w-full px-4 py-2 border rounded-lg"><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></select></div>
                    <div className="md:col-span-2 flex items-center mb-4">
                        <input id="isAdmin" name="isAdmin" type="checkbox" defaultChecked={editingUser.isAdmin} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="isAdmin" className="ml-2 text-sm font-medium text-gray-900">Promover a Administrador</label>
                    </div>
                </div>
                <button disabled={isSubmitting} className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full flex justify-center items-center transition duration-300 disabled:bg-blue-300" type="submit">
                  {isSubmitting ? <SpinnerIcon className="animate-spin mr-2" /> : null}
                  {isSubmitting ? 'A Salvar...' : 'Salvar Alterações'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

