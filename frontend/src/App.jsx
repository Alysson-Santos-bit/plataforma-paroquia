import React, { useState, useEffect } from 'react';

// --- PASSO IMPORTANTE ---
// Cole o endereço público da sua porta 8080 (que você copiou da aba PORTS) aqui.
// Ele deve se parecer com: https://alysson-santos-bit-humongous-space-engine-9pjqv7pxq7ph9w7v-8080.app.github.dev
const API_BASE_URL = 'https://glorious-palm-tree-g4p549q76rqg29q96-8080.app.github.dev';


// Ícones como componentes SVG para não precisar de bibliotecas externas
const HomeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const UserIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const HeartIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

const InfoIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </svg>
);


function App() {
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
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    // Buscar informações da paróquia
    fetch(`${API_BASE_URL}/api/parish-info`)
      .then(response => response.ok ? response.json() : Promise.reject('Falha na resposta da rede'))
      .then(data => setParishInfo(data))
      .catch(error => console.error('Erro ao buscar informações da paróquia:', error));

    // Buscar serviços
    fetch(`${API_BASE_URL}/api/services`)
      .then(response => response.ok ? response.json() : Promise.reject('Falha na resposta da rede'))
      .then(data => setServices(data))
      .catch(error => console.error('Erro ao buscar serviços:', error));

    // Buscar pastorais
    fetch(`${API_BASE_URL}/api/pastorals`)
      .then(response => response.ok ? response.json() : Promise.reject('Falha na resposta da rede'))
      .then(data => setPastorals(data))
      .catch(error => console.error('Erro ao buscar pastorais:', error));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleServiceChange = (serviceId) => {
    setFormData(prevState => ({
      ...prevState,
      service_id: serviceId,
    }));
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
  
  const renderContent = () => {
    switch (activeSection) {
      case 'inicio':
        return (
          <>
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <h1 className="text-4xl font-bold text-slate-800 mb-4">{parishInfo.name || 'Carregando...'}</h1>
              <p className="text-slate-600 text-lg leading-relaxed">{parishInfo.history || 'Carregando história...'}</p>
            </div>
            <div className="mt-10">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Nossos Serviços</h2>
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
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Nossas Pastorais</h2>
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
                <p className="text-center text-slate-600 mb-8">Você está se inscrevendo para: <span className="font-bold text-blue-600">{selectedService?.name}</span></p>
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
                    <p className="text-slate-600 mb-8">Sua contribuição é um ato de fé e generosidade que nos ajuda a manter nossas obras de evangelização e caridade. Escolha a melhor forma de contribuir.</p>
                    <div className="bg-white p-8 rounded-lg shadow-lg space-y-4">
                        <h3 className="text-xl font-semibold text-slate-700">PIX (Chave CNPJ)</h3>
                        <p className="text-lg text-slate-800 font-mono bg-slate-100 p-3 rounded-md">XX.XXX.XXX/0001-XX</p>
                        <p className="text-slate-500 text-sm">Use o aplicativo do seu banco para ler o QR Code ou copie a chave PIX.</p>
                         <div className="flex justify-center my-4">
                           {/* Placeholder for QR Code */}
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
        return <div>Seção não encontrada</div>;
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
              {/* Botão para menu mobile pode ser adicionado aqui */}
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
                     Não tem uma conta? <a href="#" className="font-semibold text-blue-600 hover:underline">Cadastre-se</a>
                 </p>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

