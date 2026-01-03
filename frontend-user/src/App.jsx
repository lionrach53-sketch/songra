import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, CheckCircle, Clock, Leaf, Heart, Shield, 
  MessageCircle, History, Camera, Image, X, 
  ChevronLeft, User, AlertCircle, Eye,
  ChevronRight, Copy, Brain, Phone
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

// Composant Image avec fallback
const ImageWithFallback = ({ src, alt, className, onClick }) => {
  const [imgError, setImgError] = useState(false);
  
  const handleError = () => {
    setImgError(true);
  };
  
  useEffect(() => {
    setImgError(false);
  }, [src]);
  
  if (imgError || !src) {
    return (
      <div 
        className={`${className} bg-gray-100 flex items-center justify-center rounded-lg border-2 border-gray-200`}
        onClick={onClick}
      >
        <div className="text-center p-4">
          <Image size={32} className="text-gray-400 mx-auto mb-2" />
          <span className="text-gray-500 text-sm">Image non disponible</span>
        </div>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={handleError}
    />
  );
};

// Composant de notification (global)
const Notification = ({ message, type, onClose }) => {
  const bgColor = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  const colorClass = bgColor[type] || bgColor.info;

  return (
    <div className={`fixed top-4 right-4 z-50 border-l-4 p-4 rounded-lg shadow-lg max-w-sm ${colorClass}`}>
      <div className="flex items-start">
        <AlertCircle className="mr-3 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <div className="font-medium">{message}</div>
        </div>
        <button 
          onClick={onClose} 
          className="ml-4 text-gray-500 hover:text-gray-700"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// Composant modal pour afficher les images
const ImageModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative max-w-4xl w-full">
          <button 
            onClick={onClose}
            className="absolute -top-10 right-0 text-white hover:text-gray-300"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-800 text-white">
              <h3 className="text-lg font-medium">{title}</h3>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <ImageWithFallback
                src={imageUrl}
                alt={title}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserApp = () => {
  const [step, setStep] = useState('welcome');
  const [category, setCategory] = useState(null);
  const [problem, setProblem] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userTickets, setUserTickets] = useState([]);
  const [aiResponse, setAiResponse] = useState('');
  const [assistantResult, setAssistantResult] = useState(null); // résultat de la conversation IA (sans ticket)
  const [ragMedia, setRagMedia] = useState(null); // médias associés à la meilleure fiche RAG
  const [sendingToExpert, setSendingToExpert] = useState(false);
  const [conversation, setConversation] = useState([]); // historique des échanges IA (utilisateur / assistant)
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ticketFullDetails, setTicketFullDetails] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showUsefulNumbers, setShowUsefulNumbers] = useState(false);
  const [emergencyNumbers, setEmergencyNumbers] = useState([]);
  const [loadingEmergency, setLoadingEmergency] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem('phoneNumber');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      loadUserHistory(savedPhone);
    }
  }, []);

  // Fonction pour ajouter des notifications
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const newNotification = { id, message, type };
    setNotifications(prev => [...prev, newNotification]);
    
    // Nettoyer après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const categories = [
    {
      id: 'agriculture',
      name: 'Agriculture',
      icon: Leaf,
      color: 'bg-green-500',
      description: 'Cultures, bétail, irrigation, maladies',
      examples: ['Maladies des plantes', 'Irrigation', 'Fertilisation', 'Élevage']
    },
    {
      id: 'elevage',
      name: 'Élevage',
      icon: Heart,
      color: 'bg-red-500',
      description: 'Santé et gestion des animaux',
      examples: ['Chaleur bétail', 'Vache malade', 'Poules malades', 'Vermifuge']
    },
    {
      id: 'sos_accident',
      name: 'SOS Accident',
      icon: Heart,
      color: 'bg-orange-500',
      description: 'Premiers gestes en cas d’accident',
      examples: ['Blessure au champ', 'Coupure', 'Brûlure', 'Chute']
    },
    {
      id: 'cybersecurity',
      name: 'Cybersécurité',
      icon: Shield,
      color: 'bg-blue-500',
      description: 'Arnaques, protection des données',
      examples: ['Arnaque Mobile Money', 'Mot de passe', 'Phishing', 'Sécurité']
    }
  ];

  // Formater une réponse structurée simple à partir des fiches RAG
  const buildStructuredRagAnswer = (ragItems, fallbackAnswer) => {
    const best = (ragItems && ragItems.length > 0) ? ragItems[0] : null;
    const title = best?.title || 'Conseil local';
    const answer = fallbackAnswer || best?.answer || '';
    const source = best?.source || 'fiches locales';

    if (!answer) {
      return "Je n'ai pas assez d'informations dans ma base locale pour répondre précisément. Parle avec un expert proche de chez toi pour plus de détails.";
    }

    return (
      `1) Ce que je comprends de ton problème :\n` +
      `Tu expliques un souci lié à : ${title}. Je vais utiliser les conseils déjà validés localement.\n\n` +
      `2) Conseils pratiques à suivre :\n` +
      `${answer}\n\n` +
      `3) Quand appeler un expert :\n` +
      `Si malgré ces conseils la situation ne s'améliore pas, si le problème devient plus grave, ou si tu as un doute, ` +
      `va voir un agent agricole, un vétérinaire ou un service technique local pour vérifier sur place. ` +
      `(Source : ${source}).`
    );
  };

  // Plus de réponses mock : toute la réponse vient désormais du backend (RAG + GPT ou fallback RAG).

  const loadUserHistory = async (phone) => {
    try {
      const res = await fetch(`${API_URL}/user-tickets?phone=${phone}`);
      if (res.ok) {
        const data = await res.json();
        setUserTickets(data);
      } else {
        console.error('Erreur chargement historique');
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      if (!navigator.onLine) {
        addNotification('Vous êtes hors ligne. Impossible de charger l\'historique.', 'warning');
      }
    }
  };

  const loadEmergencyNumbers = async () => {
    try {
      setLoadingEmergency(true);
      const res = await fetch(`${API_URL}/emergency-numbers`);
      if (!res.ok) {
        throw new Error('Erreur lors du chargement des numéros utiles');
      }
      const data = await res.json();
      setEmergencyNumbers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement numéros utiles:', err);
      addNotification('Impossible de charger les numéros utiles. Réessayez plus tard.', 'error');
    } finally {
      setLoadingEmergency(false);
    }
  };

  useEffect(() => {
    if (showUsefulNumbers) {
      loadEmergencyNumbers();
    }
  }, [showUsefulNumbers]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification('La photo est trop grande. Maximum 5MB.', 'error');
        return;
      }
      
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderUsefulNumbersModal = () => {
    if (!showUsefulNumbers) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4"
        onClick={() => setShowUsefulNumbers(false)}
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Phone size={16} className="text-blue-600" />
              Numéros utiles (urgence)
            </h3>
            <button
              onClick={() => setShowUsefulNumbers(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          {/* Texte d'introduction supprimé selon la demande */}
          {loadingEmergency ? (
            <div className="flex items-center justify-center py-4 text-xs text-gray-500">
              Chargement des numéros utiles...
            </div>
          ) : emergencyNumbers.length === 0 ? (
            <p className="text-[11px] text-gray-500 mb-3">
              Aucun numéro d'urgence n'est encore configuré. Un expert peut les ajouter dans le panneau d'administration.
            </p>
          ) : (
            <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 mb-3">
              <ul className="space-y-2">
                {emergencyNumbers.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col text-xs bg-white/80 border border-blue-100 rounded-lg px-3 py-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-gray-800">
                        {item.label}
                      </span>
                      <a
                        href={`tel:${(item.number || '').split(' ').join('')}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold hover:bg-blue-700"
                      >
                        <Phone size={11} />
                        {item.number}
                      </a>
                    </div>
                    {item.description && (
                      <span className="text-[11px] text-gray-600 mt-0.5">
                        {item.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-gray-500">
            En cas de doute grave (perte de connaissance, détresse respiratoire, gros saignement), appelle directement un service d&apos;urgence avant d&apos;utiliser l&apos;assistant IA.
          </p>
        </div>
      </div>
    );
  };

  const submitProblem = async () => {
    if (!problem.trim() || !phoneNumber.trim()) {
      addNotification('Veuillez remplir tous les champs', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Vérifier si le backend est accessible
      const healthCheck = await fetch('http://localhost:8000/health');
      if (!healthCheck.ok) {
        throw new Error('Le serveur est indisponible. Veuillez réessayer plus tard.');
      }

      const payload = {
        phone_number: phoneNumber,
        content: problem,
        channel: 'app',
        category: category
      };

      // Ajouter la photo si elle existe
      if (photoPreview) {
        payload.photo_base64 = photoPreview;
      }

      // Pour la conversation IA, on appelle d'abord l'assistant sans créer de ticket
      const ticketRes = await fetch(`${API_URL}/assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!ticketRes.ok) {
        const error = await ticketRes.json().catch(() => ({ detail: 'Erreur création ticket' }));
        throw new Error(error.detail || 'Erreur création ticket');
      }

      const ticketData = await ticketRes.json();

      let finalResponse = '';

      // Priorité 1 : réponse RAG + LLM depuis le backend (sans hors sujet)
      if (ticketData.llm_answer) {
        finalResponse = ticketData.llm_answer;
      }
      // Priorité 2 : si pas de LLM mais des fiches RAG sont disponibles, formater une réponse structurée locale
      else if (ticketData.rag_items && ticketData.rag_items.length > 0) {
        finalResponse = buildStructuredRagAnswer(ticketData.rag_items, ticketData.rag_fallback_answer);
      }
      // Priorité 3 : analyse IA locale de la photo
      else if (ticketData.photo_analysis) {
        const aiAnalysis = ticketData.photo_analysis;
        finalResponse = `🔬 ANALYSE IA LOCALE DÉTECTÉE\n\n` +
                        `Maladie: ${aiAnalysis.disease_detected || 'Non identifiée'}\n` +
                        `Confiance: ${aiAnalysis.confidence ? `${(aiAnalysis.confidence * 100).toFixed(0)}%` : 'N/A'}\n\n` +
                        `${aiAnalysis.analysis || aiAnalysis.recommendations || 'Analyse non disponible'}\n\n` +
                        `💊 TRAITEMENT RECOMMANDÉ:\n${aiAnalysis.treatment || aiAnalysis.recommendations || 'Consultez un expert'}\n\n` +
                        (aiAnalysis.requires_expert ? 
                          `⚠️ Un expert va vérifier cette analyse pour confirmer.` :
                          `✓ Diagnostic fiable. Un expert validera sous 24h.`);
      }

                  // Sauvegarder les médias de la fiche RAG principale (si disponibles)
                  setRagMedia((ticketData.rag_items && ticketData.rag_items[0] && ticketData.rag_items[0].media) || null);
      
      setAiResponse(finalResponse);
      // Sauvegarder le résultat de l'assistant (photo + analyse) sans créer de ticket
      setAssistantResult({
        photo: photoPreview,
        photo_analysis: ticketData.photo_analysis || null
      });
      // Initialiser la conversation avec la première question/réponse
      setConversation([
        {
          role: 'user',
          content: problem,
          photo: photoPreview || null
        },
        {
          role: 'assistant',
          content: finalResponse,
          photo_analysis: ticketData.photo_analysis || null
        }
      ]);
      setTicket(null); // on réinitialise le ticket, il sera créé seulement si l'utilisateur contacte un expert
      // À ce stade, aucun ticket n'est encore créé. Le ticket ne sera créé
      // que si l'utilisateur choisit de contacter un expert.
      
      localStorage.setItem('phoneNumber', phoneNumber);
      
      // Recharger l'historique
      loadUserHistory(phoneNumber);
      
      setProblem(''); // on vide le champ pour la prochaine question IA
      setStep('result');
      addNotification('Demande envoyée avec succès !', 'success');
      
    } catch (err) {
      console.error('Erreur:', err);
      addNotification(err.message || 'Erreur lors de l\'envoi. Vérifiez votre connexion.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Création explicite d'un ticket lorsque l'utilisateur choisit de contacter un expert
  const contactExpert = async () => {
    const userMessages = conversation.filter(msg => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if ((!lastUserMessage || !lastUserMessage.content?.trim()) && !problem.trim()) {
      addNotification('Veuillez poser votre question avant de contacter un expert.', 'warning');
      return;
    }

    if (!phoneNumber.trim()) {
      addNotification('Veuillez vérifier votre numéro de téléphone.', 'warning');
      return;
    }

    setSendingToExpert(true);

    try {
      // Construire un résumé des questions posées pour l'expert
      const summaryFromConversation = userMessages
        .map((m, idx) => `Question ${idx + 1} : ${m.content}`)
        .join('\n\n');

      const contentForExpert = summaryFromConversation || problem;

      const payload = {
        phone_number: phoneNumber,
        content: contentForExpert,
        channel: 'app',
        category: category
      };

      if (photoPreview) {
        payload.photo_base64 = photoPreview;
      }

      const res = await fetch(`${API_URL}/webhooks/incoming-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Erreur lors de la création du ticket' }));
        throw new Error(error.detail || 'Erreur lors de la création du ticket');
      }

      const data = await res.json();

      // Utiliser la réponse IA déjà affichée si disponible, sinon reconstruire
      let finalResponse = aiResponse;
      if (!finalResponse) {
        if (data.llm_answer) {
          finalResponse = data.llm_answer;
        } else if (data.rag_items && data.rag_items.length > 0) {
          finalResponse = buildStructuredRagAnswer(data.rag_items, data.rag_fallback_answer);
        } else if (data.photo_analysis) {
          const aiAnalysis = data.photo_analysis;
          finalResponse = `🔬 ANALYSE IA LOCALE DÉTECTÉE\n\n` +
                          `Maladie: ${aiAnalysis.disease_detected || 'Non identifiée'}\n` +
                          `Confiance: ${aiAnalysis.confidence ? `${(aiAnalysis.confidence * 100).toFixed(0)}%` : 'N/A'}\n\n` +
                          `${aiAnalysis.analysis || aiAnalysis.recommendations || 'Analyse non disponible'}\n\n` +
                          `💊 TRAITEMENT RECOMMANDÉ:\n${aiAnalysis.treatment || aiAnalysis.recommendations || 'Consultez un expert'}\n\n` +
                          (aiAnalysis.requires_expert ? 
                            `⚠️ Un expert va vérifier cette analyse pour confirmer.` :
                            `✓ Diagnostic fiable. Un expert validera sous 24h.`);
        } else {
          finalResponse = "Votre demande a été envoyée à un expert. Vous recevrez une réponse dès que possible.";
        }
      }

      setAiResponse(finalResponse);

      const newTicket = {
        ticket_id: data.ticket_id,
        ai_response: finalResponse,
        photo: photoPreview,
        ai_analysis: data.photo_analysis,
        category: category,
        problem: problem,
        created_at: new Date().toISOString()
      };

      setTicket(newTicket);
      loadUserHistory(phoneNumber);
      addNotification('Votre demande a été envoyée à un expert.', 'success');
    } catch (err) {
      console.error('Erreur contact expert:', err);
      addNotification(err.message || 'Erreur lors de l\'envoi au niveau expert.', 'error');
    } finally {
      setSendingToExpert(false);
    }
  };

  // Envoyer une nouvelle question dans la conversation IA (multi-tours)
  const sendFollowupQuestion = async () => {
    if (!problem.trim()) {
      addNotification('Écrivez d\'abord votre question pour l\'IA.', 'warning');
      return;
    }

    if (!phoneNumber.trim()) {
      addNotification('Veuillez vérifier votre numéro de téléphone.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        phone_number: phoneNumber,
        content: problem,
        channel: 'app',
        category: category
      };

      const res = await fetch(`${API_URL}/assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Erreur lors de la réponse IA' }));
        throw new Error(error.detail || 'Erreur lors de la réponse IA');
      }

      const data = await res.json();

      let finalResponse = '';

      if (data.llm_answer) {
        finalResponse = data.llm_answer;
      } else if (data.rag_items && data.rag_items.length > 0) {
        finalResponse = buildStructuredRagAnswer(data.rag_items, data.rag_fallback_answer);
      } else if (data.photo_analysis) {
        const aiAnalysis = data.photo_analysis;
        finalResponse = `🔬 ANALYSE IA LOCALE DÉTECTÉE\n\n` +
                        `Maladie: ${aiAnalysis.disease_detected || 'Non identifiée'}\n` +
                        `Confiance: ${aiAnalysis.confidence ? `${(aiAnalysis.confidence * 100).toFixed(0)}%` : 'N/A'}\n\n` +
                        `${aiAnalysis.analysis || aiAnalysis.recommendations || 'Analyse non disponible'}\n\n` +
                        `💊 TRAITEMENT RECOMMANDÉ:\n${aiAnalysis.treatment || aiAnalysis.recommendations || 'Consultez un expert'}\n\n` +
                        (aiAnalysis.requires_expert ? 
                          `⚠️ Un expert va vérifier cette analyse pour confirmer.` :
                          `✓ Diagnostic fiable. Un expert validera sous 24h.`);
      } else {
        finalResponse = "Je n'ai pas assez d'informations pour compléter la réponse. Parlez-en à un expert si le problème persiste.";
      }

      // Mettre à jour la dernière réponse IA et l'historique de conversation
      setAiResponse(finalResponse);
      setConversation(prev => [
        ...prev,
        { role: 'user', content: problem },
        { role: 'assistant', content: finalResponse, photo_analysis: data.photo_analysis || null }
      ]);

      // Mettre à jour les médias RAG associés à la nouvelle réponse (si présents)
      setRagMedia((data.rag_items && data.rag_items[0] && data.rag_items[0].media) || null);

      // Mettre à jour l'analyse photo IA si fournie (sans changer la photo)
      setAssistantResult(prev => ({
        photo: prev?.photo || null,
        photo_analysis: data.photo_analysis || prev?.photo_analysis || null
      }));

      setProblem('');
    } catch (err) {
      console.error('Erreur follow-up IA:', err);
      addNotification(err.message || 'Erreur lors de la réponse de l\'IA.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketFullDetails = async (ticketId) => {
    setLoadingTicketDetails(true);
    try {
      // Charger les détails du ticket depuis l'API
      const res = await fetch(`${API_URL}/tickets/${ticketId}`);
      
      if (res.ok) {
        const data = await res.json();
        setTicketFullDetails(data);
      } else {
        // Si l'API échoue, utiliser un message simple basé sur le dernier message
        const ticket = userTickets.find(t => t.id === ticketId);
        if (ticket) {
          const fullDetails = {
            ticket: {
              ...ticket,
              ai_response: `Résumé automatique de la demande :\n\n${ticket.last_message || 'Aucun détail disponible.'}`,
              problem: ticket.last_message,
              photo_url: ticket.photo_url
            },
            user: {
              phone: phoneNumber,
              name: localStorage.getItem('userName') || 'Utilisateur'
            },
            messages: ticket.status === 'resolved' ? [
              {
                content: "Votre problème a été résolu par notre expert. Si vous avez d'autres questions, n'hésitez pas à nous contacter.",
                sent_at: new Date(ticket.created_at).toISOString(),
                sender_type: 'expert'
              }
            ] : ticket.status === 'assigned' ? [
              {
                content: "Un expert a pris en charge votre demande. Vous recevrez une réponse détaillée sous peu.",
                sent_at: new Date(ticket.created_at).toISOString(),
                sender_type: 'expert'
              }
            ] : []
          };
          
          setTicketFullDetails(fullDetails);
        }
      }
    } catch (err) {
      console.error('Erreur chargement détails:', err);
      addNotification('Erreur de chargement des détails', 'error');
    } finally {
      setLoadingTicketDetails(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      high: { color: 'bg-red-100 text-red-800', text: 'Urgente' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Moyenne' },
      low: { color: 'bg-green-100 text-green-800', text: 'Normale' }
    };
    return badges[urgency] || badges.low;
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { icon: Clock, color: 'text-orange-600', text: 'En attente' },
      assigned: { icon: MessageCircle, color: 'text-blue-600', text: 'En traitement' },
      resolved: { icon: CheckCircle, color: 'text-green-600', text: 'Résolu' }
    };
    return badges[status] || badges.open;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const openImageModal = (imageUrl, title) => {
    if (!imageUrl) {
      addNotification('Aucune image disponible', 'info');
      return;
    }
    setSelectedImage({ url: imageUrl, title });
    setShowImageModal(true);
  };

  const copyToClipboard = (text) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.writeText) {
        addNotification('La copie n\'est pas supportée sur cet appareil.', 'warning');
        return;
      }

      navigator.clipboard
        .writeText(text || '')
        .then(() => {
          addNotification('Copié dans le presse-papier !', 'success');
        })
        .catch(() => {
          addNotification('Échec de la copie dans le presse-papier.', 'error');
        });
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
      addNotification('Erreur lors de la copie dans le presse-papier.', 'error');
    }
  };

  // Étape Accueil
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}
        {renderUsefulNumbersModal()}
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">SONGRA</h1>
              <p className="text-gray-600">Votre assistant expert 24/7</p>
              <div className="mt-3 inline-block bg-blue-100 px-3 py-1 rounded-full">
                <p className="text-xs text-blue-800 font-medium">📸 IA Locale v3.0</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre numéro de téléphone
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+226 70 00 00 00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => phoneNumber.trim() ? setStep('category') : addNotification('Veuillez entrer votre numéro', 'warning')}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition mb-4"
            >
              Commencer
            </button>

            {userTickets.length > 0 && (
              <button
                onClick={() => {
                  setStep('history');
                  loadUserHistory(phoneNumber);
                }}
                className="w-full border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
              >
                <History size={20} />
                Voir mes demandes ({userTickets.length})
              </button>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              <p className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle size={14} className="text-green-500" />
                Réponse instantanée par IA
              </p>
              <p className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle size={14} className="text-green-500" />
                Analyse de photos locale
              </p>
              <p className="flex items-center justify-center gap-1">
                <CheckCircle size={14} className="text-green-500" />
                Suivi de votre demande
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Étape Catégorie
  if (step === 'category') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        {renderUsefulNumbersModal()}
        <div className="max-w-2xl mx-auto py-8">
          <button
            onClick={() => setStep('welcome')}
            className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Retour
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choisissez un domaine</h2>
          <p className="text-gray-600 mb-4">Dans quel domaine avez-vous besoin d'aide ?</p>

          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-gray-500 max-w-xs">
              En cas d&apos;urgence vitale (accident grave, feu, malaise sévère), contactez directement les numéros d&apos;urgence ci-dessous.
            </p>
            <button
              type="button"
              onClick={() => setShowUsefulNumbers(true)}
              className="inline-flex items-center px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <Phone size={14} className="mr-1" />
              Numéros utiles
            </button>
          </div>

          <div className="grid gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setStep('problem');
                  }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${cat.color} p-4 rounded-xl group-hover:scale-110 transition`}>
                      <Icon className="text-white" size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-1">{cat.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{cat.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.examples.map((ex, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Étape Problème
  if (step === 'problem') {
    const selectedCat = categories.find(c => c.id === category);
    
    if (!selectedCat) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-4">Catégorie non trouvée</p>
            <button
              onClick={() => setStep('category')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
    
    const Icon = selectedCat.icon;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}

        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={selectedImage?.url}
          title={selectedImage?.title}
        />

        {renderUsefulNumbersModal()}

        <div className="max-w-2xl mx-auto py-8">
          <button
            onClick={() => setStep('category')}
            className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Changer de catégorie
          </button>

          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`${selectedCat.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">{selectedCat.name}</h2>
            </div>
            <p className="text-gray-600 text-sm">{selectedCat.description}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              Décrivez votre problème
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder={`Exemple: ${
                category === 'agriculture' ? 'Mes plants de maïs ont des taches jaunes sur les feuilles...' :
                category === 'health' ? 'Mon enfant a de la fièvre depuis hier...' :
                'J\'ai reçu un SMS suspect demandant mes codes...'
              }`}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Soyez le plus précis possible pour une meilleure réponse
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              📸 Ajouter une photo (optionnel)
            </label>
            
            {!photoPreview ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                >
                  <Image className="text-gray-400 mb-2" size={32} />
                  <span className="text-sm text-gray-600 text-center">Choisir une photo</span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                >
                  <Camera className="text-gray-400 mb-2" size={32} />
                  <span className="text-sm text-gray-600 text-center">Prendre une photo</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <ImageWithFallback
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                  onClick={() => openImageModal(photoPreview, 'Photo du problème')}
                />
                <button
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                >
                  <X size={20} />
                </button>
                <div className="mt-2 text-sm text-gray-600 text-center">
                  Photo ajoutée ✓ Elle sera analysée par l'IA
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <button
            onClick={submitProblem}
            disabled={loading || !problem.trim()}
            className="w-full mt-6 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyse en cours...
              </>
            ) : (
              <>
                <Send size={20} />
                {photo ? 'Envoyer avec photo' : 'Obtenir de l\'aide'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Étape Résultat
  if (step === 'result') {
    if (!aiResponse) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">Chargement de la réponse...</p>
            <button
              onClick={() => setStep('welcome')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      );
    }
    
    const displayPhoto = (ticket && ticket.photo) || (assistantResult && assistantResult.photo);
    const displayAnalysis = (ticket && ticket.ai_analysis) || (assistantResult && assistantResult.photo_analysis);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}

        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={selectedImage?.url}
          title={selectedImage?.title}
        />

        {renderUsefulNumbersModal()}

        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-600" size={32} />
              <h2 className="text-2xl font-bold text-gray-800">Réponse instantanée</h2>
            </div>
            
            {conversation && conversation.length > 0 && (
              <div className="mb-4 space-y-2 max-h-72 overflow-y-auto border-b border-gray-100 pb-3">
                {conversation.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap border ${
                          isUser
                            ? 'bg-green-50 text-gray-800 rounded-br-none border-green-200'
                            : 'bg-blue-50 text-gray-800 rounded-bl-none border-blue-200'
                        }`}
                      >
                        <p
                          className={`font-semibold text-xs mb-1 opacity-80 ${
                            isUser ? 'text-green-700' : 'text-blue-700'
                          }`}
                        >
                          {isUser ? 'Vous' : 'Assistant IA'}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {displayPhoto && (
              <div className="mb-4">
                <div className="relative">
                  <ImageWithFallback
                    src={displayPhoto}
                    alt="Votre photo"
                    className="w-full h-48 object-cover rounded-lg border-2 border-green-200 cursor-pointer hover:opacity-90 transition"
                    onClick={() => openImageModal(displayPhoto, 'Photo envoyée')}
                  />
                  <button
                    onClick={() => openImageModal(displayPhoto, 'Photo envoyée')}
                    className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
                  >
                    <Eye size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                    ✓ Photo analysée par IA locale
                  </div>
                  {displayAnalysis && displayAnalysis.confidence && (
                    <div
                      className={`px-2 py-1 rounded font-medium ${
                        displayAnalysis.confidence > 0.7
                          ? 'bg-blue-100 text-blue-800'
                          : displayAnalysis.confidence > 0.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Confiance: {Math.round((displayAnalysis.confidence || 0) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            )}

            {ragMedia && Array.isArray(ragMedia) && ragMedia.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Illustrations pour mieux comprendre
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Ces images ou vidéos sont des exemples généraux pour illustrer le problème. Elles ne sont pas des photos de votre champ.
                </p>
                <div className="space-y-3">
                  {ragMedia.filter(m => m && m.type === 'image' && m.url).map((m, idx) => (
                    <div key={`media-img-${idx}`} className="relative">
                      <ImageWithFallback
                        src={m.url}
                        alt={m.title || 'Illustration du problème'}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                        onClick={() => openImageModal(m.url, m.title || 'Illustration du problème')}
                      />
                      {m.title && (
                        <p className="mt-1 text-xs text-gray-600">
                          {m.title}
                        </p>
                      )}
                    </div>
                  ))}

                  {ragMedia.filter(m => m && m.type === 'video' && m.url).map((m, idx) => (
                    <div key={`media-video-${idx}`} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs">
                      <div className="text-gray-700 mr-2">
                        <p className="font-semibold mb-0.5">Vidéo explicative</p>
                        <p className="text-gray-600 line-clamp-2">{m.title || 'Voir une vidéo simple sur ce sujet'}</p>
                      </div>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 font-semibold text-xs underline whitespace-nowrap"
                      >
                        Ouvrir
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded mb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="text-green-600" size={20} />
                  <h3 className="font-semibold text-gray-800">Analyse IA</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(aiResponse)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Copy size={14} />
                  Copier
                </button>
              </div>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mt-2">{aiResponse}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Poser une autre question à l'IA
              </label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Ajoutez un détail ou posez une nouvelle question liée à votre problème..."
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
              />
              <button
                onClick={sendFollowupQuestion}
                disabled={loading || !problem.trim()}
                className="mt-3 w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer à l'IA
                  </>
                )}
              </button>
            </div>

            {ticket ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-blue-600" size={20} />
                  <p className="font-semibold text-gray-800">Ticket envoyé à un expert</p>
                </div>
                <p className="text-sm text-gray-600">
                  Un expert humain va vérifier cette réponse{displayPhoto ? ' et analyser votre photo' : ''} et peut vous contacter pour plus de détails.
                </p>
                <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <strong className="font-medium">Numéro de ticket:</strong> 
                    <span className="font-mono ml-2">#{ticket.ticket_id}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Conservez ce numéro pour suivre votre demande
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-blue-600" size={20} />
                  <p className="font-semibold text-gray-800">Souhaitez-vous l'avis d'un expert ?</p>
                </div>
                <p className="text-sm text-gray-600">
                  Vous avez reçu une première réponse de l'assistant IA. Si vous voulez qu'un expert humain vérifie votre situation et vous réponde, appuyez sur le bouton ci-dessous.
                </p>
                <button
                  onClick={contactExpert}
                  disabled={sendingToExpert}
                  className="mt-3 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  {sendingToExpert ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <User size={18} />
                      Contacter un expert humain
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setProblem('');
                removePhoto();
                setConversation([]);
                setAssistantResult(null);
                setRagMedia(null);
                setTicket(null);
                setStep('category');
              }}
              className="bg-white border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Nouvelle demande
            </button>
            <button
              onClick={() => {
                setStep('history');
                loadUserHistory(phoneNumber);
              }}
              className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <History size={20} />
              Voir historique
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Étape Historique
  if (step === 'history') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}

        <div className="max-w-2xl mx-auto py-8">
          <button
            onClick={() => setStep('welcome')}
            className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Retour
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes demandes</h2>

          {userTickets.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <History className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Aucune demande pour le moment</p>
              <button
                onClick={() => setStep('category')}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg"
              >
                Faire une demande
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userTickets.map((t) => {
                const urgency = getUrgencyBadge(t.urgency);
                const status = getStatusBadge(t.status);
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={t.id} 
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer group"
                    onClick={async () => {
                      setSelectedHistoryTicket(t);
                      await loadTicketFullDetails(t.id);
                      setStep('ticket-detail');
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">Ticket #{t.id}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${urgency.color}`}>
                            {urgency.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(t.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${status.color}`}>
                          <StatusIcon size={16} />
                          <span className="text-sm font-medium">{status.text}</span>
                        </div>
                        <ChevronRight className="text-gray-400 group-hover:text-gray-600 transition" size={20} />
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3 line-clamp-2">{t.last_message || 'Aucun message'}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500">
                        {t.has_photo ? (
                          <span className="flex items-center gap-1">
                            <Image size={14} className="text-blue-500" />
                            Avec photo
                          </span>
                        ) : (
                          <span>Sans photo</span>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        t.category === 'agriculture' ? 'bg-green-100 text-green-800' :
                        t.category === 'health' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {categories.find(c => c.id === t.category)?.name || t.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Étape Détail du ticket (historique)
  if (step === 'ticket-detail' && (selectedHistoryTicket || ticketFullDetails)) {
    const ticket = selectedHistoryTicket || (ticketFullDetails?.ticket || {});
    const user = ticketFullDetails?.user || {};
    const messages = ticketFullDetails?.messages || [];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}

        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={selectedImage?.url}
          title={selectedImage?.title}
        />

        <div className="max-w-2xl mx-auto py-8">
          <button
            onClick={() => setStep('history')}
            className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Retour à l'historique
          </button>

          {loadingTicketDetails ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des détails...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* En-tête du ticket */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Ticket #{ticket.id}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        ticket.status === 'open' ? 'bg-orange-100 text-orange-800' :
                        ticket.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.status === 'open' && <Clock size={14} className="mr-1" />}
                        {ticket.status === 'assigned' && <MessageCircle size={14} className="mr-1" />}
                        {ticket.status === 'resolved' && <CheckCircle size={14} className="mr-1" />}
                        {ticket.status === 'open' ? 'En attente' : 
                         ticket.status === 'assigned' ? 'En traitement' : 'Résolu'}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        ticket.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        ticket.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.urgency === 'high' ? 'Urgente' : 
                         ticket.urgency === 'medium' ? 'Moyenne' : 'Normale'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Créé le</p>
                    <p className="font-medium">
                      {formatDate(ticket.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Catégorie */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`${
                    ticket.category === 'agriculture' ? 'bg-green-500' :
                    ticket.category === 'health' ? 'bg-red-500' :
                    'bg-blue-500'
                  } p-2 rounded-lg`}>
                    {ticket.category === 'agriculture' && <Leaf className="text-white" size={20} />}
                    {ticket.category === 'health' && <Heart className="text-white" size={20} />}
                    {ticket.category === 'cybersecurity' && <Shield className="text-white" size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {categories.find(c => c.id === ticket.category)?.name || ticket.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      {categories.find(c => c.id === ticket.category)?.description || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description initiale */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Votre demande
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.last_message || ticket.problem || 'Aucune description'}</p>
                </div>
              </div>

              {/* Photo (si disponible) */}
              {ticket.photo_url && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Camera size={20} />
                    Photo envoyée
                  </h3>
                  <div className="relative">
                    <ImageWithFallback
                      src={ticket.photo_url}
                      alt="Photo du problème"
                      className="w-full h-48 object-cover rounded-lg border-2 border-yellow-200 cursor-pointer hover:opacity-90 transition"
                      onClick={() => openImageModal(ticket.photo_url, `Photo du ticket #${ticket.id}`)}
                    />
                    <button
                      onClick={() => openImageModal(ticket.photo_url, `Photo du ticket #${ticket.id}`)}
                      className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Analyse IA */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Brain className="text-green-600" size={20} />
                    Analyse IA
                  </h3>
                  <button
                      onClick={() => copyToClipboard(ticket.ai_response || 'Aucune réponse IA disponible pour ce ticket.')}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Copy size={14} />
                    Copier
                  </button>
                </div>
                <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticket.ai_response || 'Aucune réponse IA disponible pour ce ticket.'}
                  </p>
                </div>
              </div>

              {/* Messages de l'expert */}
              {messages.length > 0 && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User size={20} />
                    Réponses des experts
                  </h3>
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-blue-600" />
                            <span className="font-medium text-gray-800">
                              {message.sender_type === 'expert' ? 'Expert' : 
                               message.sender_type === 'system' ? 'Système' : 'Utilisateur'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.sent_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statut final */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Statut final</h3>
                {ticket.status === 'open' ? (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                    <div className="flex items-center gap-3">
                      <Clock className="text-orange-600" size={24} />
                      <div>
                        <p className="font-medium text-gray-800">En attente de traitement</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Votre demande est en file d'attente. Un expert vous répondra sous 24 heures.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : ticket.status === 'assigned' ? (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="text-blue-600" size={24} />
                      <div>
                        <p className="font-medium text-gray-800">En cours de traitement</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Un expert a pris en charge votre demande. Vous recevrez une réponse complète sous peu.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="font-medium text-gray-800">Problème résolu</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Votre demande a été traitée et résolue par nos experts.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setProblem(ticket.last_message || ticket.problem || '');
                      setCategory(ticket.category);
                      setStep('problem');
                    }}
                    className="bg-white border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Nouvelle demande similaire
                  </button>
                  <button
                    onClick={() => setStep('history')}
                    className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <History size={16} />
                    Retour historique
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 text-center">
        <MessageCircle className="mx-auto text-green-600 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
        <p className="text-gray-600 mb-4">Étape inconnue</p>
        <button
          onClick={() => setStep('welcome')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default UserApp;