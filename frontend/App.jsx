import React, { useState, useEffect } from 'react';

// === ÍCONES (SVG) ===
// Usamos SVGs diretamente para não depender de bibliotecas externas.
const UserCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);


// === HOOK PERSONALIZADO para buscar dados da API ===
const useApi = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = "http://localhost:8080/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
          throw new Error('Falha na resposta da rede');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};


// === COMPONENTES DA UI ===

// --- Componente de Alerta/Notificação ---
const Alert = ({ message, type, onClose }) => {
  if (!message) return null;
  const baseClasses = "fixed top-5 right-5 p-4 rounded-lg shadow-lg flex items-center z-50";
  const typeClasses = {
    success: "bg-green-100 border-green-400 text-green-700",
    error: "bg-red-100 border-red-400 text-red-700",
  };
  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="ml-4"><CloseIcon /></button>
    </div>
  );
};

// --- Componente Modal ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up">
        <header className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon />
          </button>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- Formulário de Autenticação (Login/Registro) ---
const AuthForm = ({ setPage, setUser, setAlert }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    try {
      const response = await fetch(`http://localhost:8080/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro.');
      }
      
      if (isLogin) {
        setUser({ name: data.userName });
        setPage('home');
        setAlert({ message: `Bem-vindo(a) de volta, ${data.userName}!`, type: 'success' });
      } else {
        setIsLogin(true);
        setAlert({ message: data.message, type: 'success' });
      }
    } catch (error) {
      setAlert({ message: error.message, type: 'error' });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">{isLogin ? 'Login do Paroquiano' : 'Cadastro'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <input type="text" name="name" placeholder="Nome Completo" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        )}
        <input type="email" name="email" placeholder="Seu melhor e-mail" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <input type="password" name="password" placeholder="Senha" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300">
          {isLogin ? 'Entrar' : 'Registrar'}
        </button>
      </form>
      <p className="text-center mt-4">
        {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
        <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline">
          {isLogin ? 'Cadastre-se' : 'Faça login'}
        </button>
      </p>
    </div>
  );
};


// --- Formulário de Inscrição em Serviço ---
const RegistrationForm = ({ service, onClose, setAlert }) => {
  const [formData, setFormData] = useState({
    userName: '', userEmail: '', userPhone: '',
    serviceId: service.ID, serviceName: service.Name
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`http://localhost:8080/api/registrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao enviar inscrição.');
        }
        setAlert({ message: data.message, type: 'success' });
        onClose();
    } catch (error) {
        setAlert({ message: error.message, type: 'error' });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
        <input type="text" name="userName" onChange={handleChange} className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">E-mail de Contato</label>
        <input type="email" name="userEmail" onChange={handleChange} className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Telefone (WhatsApp)</label>
        <input type="tel" name="userPhone" onChange={handleChange} className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      <div className="flex justify-end pt-4">
        <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirmar Inscrição</button>
      </div>
    </form>
  );
};

// --- Componente Header/Navegação ---
const Header = ({ setPage, user, setUser }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-30">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <a href="#" onClick={() => setPage('home')} className="text-2xl font-bold text-blue-800">
          Paróquia Santo Antônio
        </a>
        <div className="hidden md:flex space-x-6 items-center">
          <a href="#" onClick={() => setPage('home')} className="text-gray-600 hover:text-blue-600">Início</a>
          <a href="#" onClick={() => setPage('services')} className="text-gray-600 hover:text-blue-600">Serviços e Inscrições</a>
          <a href="#" onClick={() => setPage('pastorals')} className="text-gray-600 hover:text-blue-600">Pastorais</a>
          <a href="#" onClick={() => setPage('tithe')} className="text-gray-600 hover:text-blue-600">Dízimo</a>
        </div>
        <div>
          {user ? (
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Olá, {user.name}</span>
              <button onClick={() => { setUser(null); setPage('home'); }} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Sair</button>
            </div>
          ) : (
            <button onClick={() => setPage('login')} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <UserCircleIcon />
              <span className="ml-2">Login</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};


// === PÁGINAS ===

// --- Página Inicial ---
const HomePage = () => {
    const { data: parishInfo, loading, error } = useApi('/parish-info');

    if (loading) return <div className="text-center p-10">Carregando informações...</div>;
    if (error) return <div className="text-center p-10 text-red-500">Erro ao carregar: {error}</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Seção Principal */}
            <section className="text-center bg-blue-800 text-white p-12 rounded-xl shadow-lg mb-12">
                <h1 className="text-4xl font-extrabold mb-2">Bem-vindo à Paróquia Santo Antônio</h1>
                <p className="text-lg text-blue-200">Sua comunidade de fé em Marília, SP.</p>
            </section>

            {/* Grid de Informações */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
                {/* História */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Nossa História</h3>
                    <p className="text-gray-600 leading-relaxed">{parishInfo?.history}</p>
                </div>
                {/* Horários de Missa */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Horários de Missa</h3>
                    <ul className="space-y-2">
                        {parishInfo?.mass_times.map((time, index) => (
                            <li key={index} className="flex items-center text-gray-600"><ClockIcon /> {time}</li>
                        ))}
                    </ul>
                </div>
                {/* Calendário Litúrgico */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">Calendário Litúrgico</h3>
                    <p className="text-gray-600 mb-4">Acompanhe o tempo litúrgico e as leituras do dia.</p>
                    <a href={parishInfo?.liturgical_calendar_url} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        Ver Calendário
                    </a>
                </div>
            </div>

            {/* Redes Sociais */}
            <section>
                 <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Nossas Redes Sociais</h2>
                 <div className="grid md:grid-cols-2 gap-8">
                     <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="font-bold text-lg mb-2 text-center">Facebook</h3>
                        {/* A incorporação do Facebook requer configuração no lado do Facebook */}
                        <div className="bg-gray-200 h-96 flex items-center justify-center rounded">
                            <p className="text-gray-500">[Espaço para feed do Facebook]</p>
                        </div>
                     </div>
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="font-bold text-lg mb-2 text-center">Instagram</h3>
                        {/* A incorporação do Instagram pode ser mais complexa e exigir APIs */}
                        <div className="bg-gray-200 h-96 flex items-center justify-center rounded">
                             <p className="text-gray-500">[Espaço para feed do Instagram]</p>
                        </div>
                     </div>
                 </div>
            </section>
        </div>
    );
};


// --- Página de Serviços e Inscrições ---
const ServicesPage = ({ setAlert }) => {
    const { data: services, loading, error } = useApi('/services');
    const [selectedService, setSelectedService] = useState(null);

    if (loading) return <div className="text-center p-10">Carregando serviços...</div>;
    if (error) return <div className="text-center p-10 text-red-500">Erro ao carregar: {error}</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Serviços e Inscrições</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services?.map(service => (
                    <div key={service.ID} className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                        <h3 className="text-xl font-bold text-blue-800 mb-2">{service.name}</h3>
                        <p className="text-gray-600 flex-grow mb-4">{service.description}</p>
                        <button onClick={() => setSelectedService(service)} className="mt-auto w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            Fazer Inscrição
                        </button>
                    </div>
                ))}
            </div>
            <Modal isOpen={!!selectedService} onClose={() => setSelectedService(null)} title={`Inscrição para ${selectedService?.name}`}>
                {selectedService && <RegistrationForm service={selectedService} onClose={() => setSelectedService(null)} setAlert={setAlert}/>}
            </Modal>
        </div>
    );
};

// --- Página das Pastorais ---
const PastoralsPage = () => {
    const { data: pastorals, loading, error } = useApi('/pastorals');

    if (loading) return <div className="text-center p-10">Carregando pastorais...</div>;
    if (error) return <div className="text-center p-10 text-red-500">Erro ao carregar: {error}</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Pastorais e Movimentos</h2>
            <div className="space-y-6">
                {pastorals?.map(pastoral => (
                    <div key={pastoral.ID} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold text-green-700 mb-2">{pastoral.name}</h3>
                        <p className="text-gray-600 mb-3">{pastoral.description}</p>
                        <p className="text-sm text-gray-800 bg-gray-100 p-3 rounded-lg"><span className="font-semibold">Reuniões:</span> {pastoral.meetingInfo}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Página do Dízimo ---
const TithePage = ({ setAlert }) => {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    const handlePayment = () => {
        if (!amount || !paymentMethod) {
            setAlert({ message: 'Por favor, insira um valor e escolha um método de pagamento.', type: 'error' });
            return;
        }
        // Simulação de pagamento
        setAlert({ message: `Sua contribuição de R$ ${amount} via ${paymentMethod} foi iniciada. Obrigado!`, type: 'success' });
        setAmount('');
        setPaymentMethod('');
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Contribuição do Dízimo</h2>
                <p className="text-center text-gray-600 mb-6">"Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." (2 Cor 9:7)</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor da Contribuição (R$)</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ex: 50.00" 
                            className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button onClick={() => setPaymentMethod('PIX')} className={`p-4 border rounded-lg ${paymentMethod === 'PIX' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>PIX</button>
                            <button onClick={() => setPaymentMethod('Cartão de Crédito')} className={`p-4 border rounded-lg ${paymentMethod === 'Cartão de Crédito' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Cartão de Crédito</button>
                            <button onClick={() => setPaymentMethod('Boleto')} className={`p-4 border rounded-lg ${paymentMethod === 'Boleto' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Boleto</button>
                        </div>
                    </div>
                    {paymentMethod && amount && (
                         <div className="text-center p-4 bg-yellow-100 rounded-lg">
                            <p className="font-semibold">Confirmação</p>
                            <p>Você está contribuindo com <span className="font-bold">R$ {amount}</span> via <span className="font-bold">{paymentMethod}</span>.</p>
                         </div>
                    )}
                    <button onClick={handlePayment} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold">
                        Confirmar Contribuição
                    </button>
                </div>
            </div>
        </div>
    );
};


// === COMPONENTE PRINCIPAL (App) ===
export default function App() {
  const [page, setPage] = useState('home'); // home, services, pastorals, tithe, login
  const [user, setUser] = useState(null); // { name: 'Nome do Usuário' }
  const [alert, setAlert] = useState({ message: '', type: '' }); // { message, type: 'success'|'error' }

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);
  
  const renderPage = () => {
    switch (page) {
      case 'services':
        return <ServicesPage setAlert={setAlert} />;
      case 'pastorals':
        return <PastoralsPage />;
      case 'tithe':
        return <TithePage setAlert={setAlert} />;
      case 'login':
        return <AuthForm setPage={setPage} setUser={setUser} setAlert={setAlert} />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ message: '', type: '' })}/>
      <Header setPage={setPage} user={user} setUser={setUser} />
      <main>
        {renderPage()}
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 mt-12">
        <p>&copy; {new Date().getFullYear()} Paróquia Santo Antônio de Marília. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// Adicionando um estilo para a animação do modal
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);
