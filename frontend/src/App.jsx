import React, { useState, useEffect } from 'react';

// --- LEMBRETE ---
// Certifique-se de que esta URL está correta com o endereço da sua porta 8080 no Codespaces.
const API_BASE_URL = 'https://glorious-palm-tree-g4p549q76rqg29q96-8080.app.github.dev';


// Ícones como componentes SVG (sem alterações)
const HomeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
// ... outros ícones ...


function App() {
  // Estados existentes (sem alterações)
  const [parishInfo, setParishInfo] = useState({ name: '', history: '' });
  const [services, setServices] = useState([]);
  const [pastorals, setPastorals] = useState([]);
  const [activeSection, setActiveSection] = useState('inicio');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_id: '',
  });

  // --- NOVOS ESTADOS PARA REGISTO E LOGIN ---
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    name: '',
    email: '',
    password: '',
  });


  useEffect(() => {
    fetch(`${API_BASE_URL}/api/parish-info`)
      .then(response => response.ok ? response.json() : Promise.reject('Falha na resposta da rede'))
      .then(data => setParishInfo(data))
      .catch(error => console.error('Erro ao buscar informações da paróquia:', error));

    fetch(`${API_BASE_URL}/api/services`)
      .then(response => response.ok ? response.json() : Promise.reject('Falha na resposta da rede'))
      .then(data => setServices(data))
      .catch(error => console.error('Erro ao buscar serviços:', error));

    fetch(`${API_BASE_URL}/api/pastorals`)
      .then(response => response.ok ? response.json() : Promise.reject('Falha na resposta da rede'))
      .then(data => setPastorals(data))
      .catch(error => console.error('Erro ao buscar pastorais:', error));
  }, []);

  // Funções de formulário existentes (sem alterações)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleServiceChange = (serviceId) => {
    setFormData(prevState => ({ ...prevState, service_id: serviceId }));
    setActiveSection('inscricao');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.service_id) {
        setModalContent({ title: 'Atenção!', message: 'Por favor, selecione um serviço antes de se inscrever.' });
        setShowModal(true);
        return;
    }
    fetch(`${API_BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
      setModalContent({ title: 'Sucesso!', message: 'Sua inscrição foi realizada com sucesso.' });
      setShowModal(true);
      setFormData({ name: '', email: '', phone: '', service_id: formData.service_id });
    })
    .catch(error => {
      console.error('Erro ao criar inscrição:', error);
      setModalContent({ title: 'Erro!', message: 'Houve um problema ao realizar sua inscrição. Tente novamente mais tarde.' });
      setShowModal(true);
    });
  };

  // --- NOVAS FUNÇÕES PARA O FORMULÁRIO DE REGISTO ---
  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterFormData(prevState => ({ ...prevState, [name]: value, }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerFormData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        setModalContent({ title: 'Registo Realizado!', message: data.message });
        setShowModal(true);
        setShowRegisterForm(false); // Fecha o formulário de registo
        setRegisterFormData({ name: '', email: '', password: '' }); // Limpa o formulário
    })
    .catch(error => {
      console.error('Erro ao registrar:', error);
      setModalContent({ title: 'Erro no Registo', message: error.message || 'Não foi possível completar o registo.' });
      setShowModal(true);
    });
  };

  const openRegisterModal = () => {
    setShowLoginForm(false);
    setShowRegisterForm(true);
  }


  // Função de renderização de conteúdo (sem alterações)
  const renderContent = () => {
    // ... switch(activeSection) ...
    // Nenhuma alteração necessária aqui
    switch (activeSection) {
      case 'inicio':
        return (
          <>
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">{parishInfo.name || 'A carregar...'}</h1>
              <p className="text-slate-600 text-lg leading-relaxed">{parishInfo.history || 'A carregar história...'}</p>
            </div>
            <div className="mt-10">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Os Nossos Serviços</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map(service => (
                        <div key={service.ID} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                            <h3 className="text-xl font-semibold text-slate-700 mb-3">{service.name}</h3>
                            <p className="text-slate-500 flex-grow mb-4">{service.description}</p>
                            <button onClick={() => handleServiceChange(service.ID)} className="mt-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 self-start">
                                Inscrever-se
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          </>
        );
      case 'pastorais':
        return (
            <div>
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">As Nossas Pastorais</h2>
                <div className="space-y-6">
                    {pastorals.map(pastoral => (
                        <div key={pastoral.ID} className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-2xl font-semibold text-slate-700 mb-2">{pastoral.name}</h3>
                            <p className="text-slate-600 mb-4">{pastoral.description}</p>
                            <div className="text-sm text-slate-500">
                                <p><span className="font-semibold">Horário:</span> {pastoral.meeting_time}</p>
                                <p><span className="font-semibold">Local:</span> {pastoral.meeting_location}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'inscricao':
        const selectedService = services.find(s => s.ID === formData.service_id);
        return (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Formulário de Inscrição</h2>
                <p className="text-center text-slate-600 mb-8">Você está a inscrever-se para: <span className="font-bold text-blue-600">{selectedService?.name}</span></p>
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input type="text" name="name" id="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                        <input type="email" name="email" id="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                        <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">Confirmar Inscrição</button>
                </form>
            </div>
        );
        case 'contribuicao':
            return (
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Contribua com o Dízimo</h2>
                    <p className="text-slate-600 mb-8">A sua contribuição é um ato de fé e generosidade que nos ajuda a manter as nossas obras de evangelização e caridade. Escolha a melhor forma de contribuir.</p>
                    <div className="bg-white p-8 rounded-lg shadow-lg space-y-4">
                        <h3 className="text-xl font-semibold text-slate-700">PIX (Chave CNPJ)</h3>
                        <p className="text-lg text-slate-800 font-mono bg-slate-100 p-3 rounded-md">XX.XXX.XXX/0001-XX</p>
                        <p className="text-slate-500 text-sm">Use a aplicação do seu banco para ler o QR Code ou copie a chave PIX.</p>
                         <div className="flex justify-center my-4">
                           <div className="w-48 h-48 bg-slate-200 flex items-center justify-center rounded-lg">
                             <span className="text-slate-500">QR Code aqui</span>
                           </div>
                         </div>
                        <button className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300">Copiar Chave PIX</button>
                        <div className="flex items-center justify-center my-4">
                           <hr className="w-full border-slate-300"/>
                           <span className="px-2 text-slate-500 bg-white -mt-1">OU</span>
                           <hr className="w-full border-slate-300"/>
                        </div>
                        <button className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors duration-300">Pagar com Cartão / Boleto</button>
                    </div>
                </div>
            );
      default:
        return <div>Secção não encontrada</div>;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-slate-800">
            {parishInfo.name || "Plataforma Paroquial"}
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => setActiveSection('inicio')} className="text-slate-600 hover:text-blue-600 transition-colors duration-300">Início</button>
            <button onClick={() => setActiveSection('pastorais')} className="text-slate-600 hover:text-blue-600 transition-colors duration-300">Pastorais</button>
            <button onClick={() => setActiveSection('contribuicao')} className="text-slate-600 hover:text-blue-600 transition-colors duration-300">Dízimo</button>
            <button onClick={() => setShowLoginForm(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">
              Login
            </button>
          </div>
           <div className="md:hidden">
           </div>
        </nav>
      </header>
      
      <main className="container mx-auto px-6 py-12">
        {renderContent()}
      </main>

      <footer className="bg-white mt-12 py-6">
          <div className="container mx-auto px-6 text-center text-slate-500">
              <p>&copy; {new Date().getFullYear()} {parishInfo.name}. Todos os direitos reservados.</p>
              <p className="text-sm">Desenvolvido com ♥ para a comunidade.</p>
          </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">{modalContent.title}</h3>
            <p className="text-slate-600 mb-6">{modalContent.message}</p>
            <button onClick={() => setShowModal(false)} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300">
              Fechar
            </button>
          </div>
        </div>
      )}

      {showLoginForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full relative">
             <button onClick={() => setShowLoginForm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Acesso do Paroquiano</h2>
            <form className="space-y-4">
                 <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <input type="email" name="login-email" id="login-email" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                    <input type="password" name="login-password" id="login-password" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">Entrar</button>
                 <p className="text-sm text-center text-slate-500">
                     Não tem uma conta? <button type="button" onClick={openRegisterModal} className="font-semibold text-blue-600 hover:underline">Registe-se</button>
                 </p>
            </form>
          </div>
        </div>
      )}

      {/* --- NOVO MODAL DE REGISTO --- */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full relative">
             <button onClick={() => setShowRegisterForm(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 text-2xl">&times;</button>
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Crie a sua Conta</h2>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input type="text" name="name" id="register-name" required value={registerFormData.name} onChange={handleRegisterInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                    <input type="email" name="email" id="register-email" required value={registerFormData.email} onChange={handleRegisterInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1">Crie uma Senha</label>
                    <input type="password" name="password" id="register-password" required value={registerFormData.password} onChange={handleRegisterInputChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">Criar Conta</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

