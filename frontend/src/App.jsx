import React from 'react';
// CORREÇÃO: Voltando a usar os URLs do CDN do Firebase para tentar contornar o erro "Module not found".
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


// Shim para 'process' para evitar erros de tempo de execução em ambientes de navegador
window.process = typeof process === 'undefined' ? { env: {} } : process;

// --- Configuração do Firebase ---
// NOTA: Estas são variáveis globais fornecidas pelo ambiente.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-chat-app';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Inicialização do Firebase ---
let app;
let auth;
let db;
let userId = null;
let userDisplayName = 'Anônimo';

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
}

// --- Funções Auxiliares ---
const generateFunnyName = () => {
    const adjetivos = ["Bobo", "Mal-humorado", "Pateta", "Atrevido", "Saltitante", "Excêntrico", "Alegre", "Elegante", "Funky", "Tonto"];
    const substantivos = ["Pinguim", "Vombate", "Narval", "Esquilo", "Panda", "Girafa", "Preguiça", "Coala", "Avestruz", "Ornitorrinco"];
    const adjetivoAleatorio = adjetivos[Math.floor(Math.random() * adjetivos.length)];
    const substantivoAleatorio = substantivos[Math.floor(Math.random() * substantivos.length)];
    return `${adjetivoAleatorio} ${substantivoAleatorio}`;
};

// --- Componentes React ---

// Ícone SVG para Enviar Mensagem
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
);

// Componente de Balão de Mensagem
const Message = ({ msg }) => {
    const isCurrentUser = msg.uid === userId;
    const timestamp = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col max-w-xs md:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-2 rounded-2xl ${
                        isCurrentUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                >
                    {!isCurrentUser && (
                        <p className="text-xs font-bold text-gray-500 mb-1">{msg.displayName}</p>
                    )}
                    <p className="text-sm break-words">{msg.text}</p>
                </div>
                 <p className="text-xs text-gray-400 mt-1 px-1">{timestamp}</p>
            </div>
        </div>
    );
};


// Componente Principal do Aplicativo
export default function App() {
    const [messages, setMessages] = React.useState([]);
    const [newMessage, setNewMessage] = React.useState("");
    const [authReady, setAuthReady] = React.useState(false);
    const [error, setError] = React.useState(null);
    const messagesEndRef = React.useRef(null);

    // Efeito para Autenticação do Firebase
    React.useEffect(() => {
        if (!auth) {
            setError("O Firebase não foi inicializado. Por favor, verifique sua configuração.");
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                const userDocRef = doc(db, `/artifacts/${appId}/public/data/users`, userId);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    userDisplayName = userDocSnap.data().displayName;
                } else {
                    userDisplayName = generateFunnyName();
                    try {
                        await setDoc(userDocRef, { displayName: userDisplayName });
                    } catch (e) {
                         console.error("Erro ao definir o nome de exibição do usuário:", e);
                         setError("Não foi possível salvar seu nome de exibição.");
                    }
                }
            } else {
                 console.log("Nenhum usuário está conectado.");
            }
            setAuthReady(true);
        });

        const signIn = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Falha na autenticação:", e);
                setError("Não foi possível fazer o login. O chat está desativado.");
            }
        };

        signIn();
        return () => unsubscribe();
    }, []);

    // Efeito para buscar mensagens do Firestore
    React.useEffect(() => {
        if (!authReady) return;

        const messagesCollectionPath = `/artifacts/${appId}/public/data/messages`;
        const q = query(collection(db, messagesCollectionPath));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            // Ordenar mensagens pelo timestamp no lado do cliente
            msgs.sort((a, b) => a.timestamp?.seconds - b.timestamp?.seconds);
            setMessages(msgs);
        }, (err) => {
            console.error("Erro ao buscar mensagens:", err);
            setError("Não foi possível carregar as mensagens.");
        });

        return () => unsubscribe();
    }, [authReady]);

    // Efeito para rolar para a mensagem mais recente
     React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !authReady || !userId) return;

        const messagesCollectionPath = `/artifacts/${appId}/public/data/messages`;
        try {
            await addDoc(collection(db, messagesCollectionPath), {
                text: newMessage,
                timestamp: serverTimestamp(),
                uid: userId,
                displayName: userDisplayName
            });
            setNewMessage("");
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
            setError("Falha ao enviar a mensagem.");
        }
    };

    if (error) {
         return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="p-8 bg-white rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Ocorreu um Erro</h2>
                    <p className="text-gray-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans">
             <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-bold text-gray-800">Chat Colaborativo</h1>
                    {authReady && <p className="text-sm text-gray-500">Seu ID de Usuário: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span></p>}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map(msg => <Message key={msg.id} msg={msg} />)}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 p-4">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={authReady ? "Digite sua mensagem..." : "Conectando..."}
                            className="flex-1 w-full px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!authReady}
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 p-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            disabled={!authReady || newMessage.trim() === ""}
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </footer>
        </div>
    );
}

