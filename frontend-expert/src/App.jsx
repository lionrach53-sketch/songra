import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, CheckCircle, Clock, AlertCircle, 
  Filter, Search, User, Mail, Phone, Calendar,
  ChevronLeft, Eye, Send, X, 
  Shield, Leaf, Heart, RefreshCw,
  BarChart3, Mailbox, Image, Camera,
  Bell, CheckSquare, AlertTriangle, ExternalLink,
  BookOpen
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

// Composant de notification
const Notification = ({ message, type, onClose }) => {
  const bgColor = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  const IconComponent = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Bell
  }[type] || Bell;

  return (
    <div className={`fixed top-4 right-4 z-50 border-l-4 p-4 rounded-lg shadow-lg max-w-sm ${bgColor[type]}`}>
      <div className="flex items-start">
        <IconComponent className="mr-3 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <div className="font-medium">
            {type === 'success' ? 'Succès' : 
             type === 'error' ? 'Erreur' : 
             type === 'warning' ? 'Attention' : 'Information'}
          </div>
          <div className="text-sm mt-1">{message}</div>
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

// Composant de modal
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 opacity-75" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
              <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-500"
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant modal pour visualiser l'image
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

const App = () => {
  // ÉTATS
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('test@resolvehub.bf');
  const [password, setPassword] = useState('test123');
  const [expertInfo, setExpertInfo] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    assigned_tickets: 0,
    resolved_today: 0,
    tickets_with_photos: 0
  });
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications et modals
  const [notifications, setNotifications] = useState([]);
  const [showConfirmResolve, setShowConfirmResolve] = useState(false);
  const [ticketToResolve, setTicketToResolve] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [isNewKnowledge, setIsNewKnowledge] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyNumbers, setEmergencyNumbers] = useState([]);
  const [loadingEmergency, setLoadingEmergency] = useState(false);
  const [editingEmergency, setEditingEmergency] = useState(null);
  const [isNewEmergency, setIsNewEmergency] = useState(false);

  // RÉFÉRENCES
  const refreshIntervalRef = useRef(null);
  const notificationTimeouts = useRef({});
  const editFormRef = useRef(null);

  // CONSTANTES
  const statuses = [
    { id: 'open', name: 'Ouvert', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
    { id: 'assigned', name: 'Assigné', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: User },
    { id: 'resolved', name: 'Résolu', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle }
  ];

  const urgencies = [
    { id: 'low', name: 'Normale', color: 'text-green-600', bgColor: 'bg-green-100' },
    { id: 'medium', name: 'Moyenne', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { id: 'high', name: 'Urgente', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  const categories = [
    { id: 'agriculture', name: 'Agriculture', icon: Leaf, color: 'bg-green-500' },
    { id: 'elevage', name: 'Élevage', icon: Heart, color: 'bg-red-500' },
    { id: 'sos_accident', name: 'SOS Accident', icon: Heart, color: 'bg-orange-500' },
    { id: 'cybersecurity', name: 'Cybersécurité', icon: Shield, color: 'bg-blue-500' }
  ];

  // FONCTIONS UTILITAIRES
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const newNotification = { id, message, type };
    setNotifications(prev => [...prev, newNotification]);
    
    // Nettoyer après 5 secondes
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      delete notificationTimeouts.current[id];
    }, 5000);
    
    notificationTimeouts.current[id] = timeoutId;
  };

  const clearAllTimeouts = () => {
    Object.values(notificationTimeouts.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    notificationTimeouts.current = {};
  };

  // BASE DE CONNAISSANCE (ADMIN SIMPLE)
  const loadKnowledge = async () => {
    setLoadingKnowledge(true);
    try {
      const res = await fetch(`${API_URL}/admin/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setKnowledgeItems(data);
      } else {
        addNotification('Erreur chargement base de connaissances', 'error');
      }
    } catch (err) {
      console.error('Erreur chargement base de connaissances:', err);
      addNotification('Erreur de connexion au serveur', 'error');
    } finally {
      setLoadingKnowledge(false);
    }
  };

  // NUMÉROS UTILES (ADMIN)
  const loadEmergencyNumbers = async () => {
    setLoadingEmergency(true);
    try {
      const res = await fetch(`${API_URL}/admin/emergency-numbers`);
      if (res.ok) {
        const data = await res.json();
        setEmergencyNumbers(data);
      } else {
        addNotification('Erreur chargement numéros utiles', 'error');
      }
    } catch (err) {
      console.error('Erreur chargement numéros utiles:', err);
      addNotification('Erreur de connexion au serveur', 'error');
    } finally {
      setLoadingEmergency(false);
    }
  };

  const openNewEmergencyForm = () => {
    setIsNewEmergency(true);
    setEditingEmergency({
      id: null,
      label: '',
      number: '',
      description: '',
      display_order: emergencyNumbers.length
    });
  };

  const openEditEmergencyForm = (item) => {
    setIsNewEmergency(false);
    setEditingEmergency({
      id: item.id,
      label: item.label,
      number: item.number,
      description: item.description || '',
      display_order: item.display_order || 0
    });
  };

  const persistEmergencyForm = async () => {
    if (!editingEmergency) return;
    if (!editingEmergency.label.trim() || !editingEmergency.number.trim()) {
      addNotification('Nom et numéro sont obligatoires', 'warning');
      return;
    }

    const payload = {
      label: editingEmergency.label,
      number: editingEmergency.number,
      description: editingEmergency.description || null,
      display_order: Number.isFinite(editingEmergency.display_order)
        ? editingEmergency.display_order
        : 0
    };

    try {
      const url = isNewEmergency
        ? `${API_URL}/admin/emergency-numbers`
        : `${API_URL}/admin/emergency-numbers/${editingEmergency.id}`;
      const method = isNewEmergency ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addNotification(
          isNewEmergency
            ? 'Numéro utile créé avec succès'
            : 'Numéro utile mis à jour avec succès',
          'success'
        );
        setEditingEmergency(null);
        setIsNewEmergency(false);
        await loadEmergencyNumbers();
      } else {
        addNotification('Erreur lors de l’enregistrement du numéro utile.', 'error');
      }
    } catch (err) {
      console.error('Erreur save emergency number:', err);
      addNotification('Erreur de connexion au serveur lors de l’enregistrement.', 'error');
    }
  };

  const deleteEmergencyNumber = async (itemId) => {
    if (!window.confirm('Supprimer ce numéro utile ?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/emergency-numbers/${itemId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        addNotification('Numéro utile supprimé avec succès', 'success');
        await loadEmergencyNumbers();
      } else {
        addNotification('Erreur lors de la suppression du numéro utile.', 'error');
      }
    } catch (err) {
      console.error('Erreur suppression emergency number:', err);
      addNotification('Erreur de connexion au serveur lors de la suppression.', 'error');
    }
  };

  const reloadKnowledge = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/reload-knowledge`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        addNotification(`Base de connaissances rechargée (${data.total_items} fiches)`, 'success');
        await loadKnowledge();
      } else {
        addNotification('Erreur lors du rechargement de la base de connaissances', 'error');
      }
    } catch (err) {
      console.error('Erreur reload base de connaissances:', err);
      addNotification('Erreur de connexion au serveur', 'error');
    }
  };

  const handleKnowledgeFileUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let itemsPayload = null;
      if (Array.isArray(parsed)) {
        itemsPayload = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        itemsPayload = parsed.items;
      } else {
        addNotification('Format JSON invalide. Attendu: liste d’objets ou { items: [...] }', 'error');
        return;
      }

      const res = await fetch(`${API_URL}/admin/knowledge/import-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification(`Import JSON réussi (${data.created} créées, ${data.updated} mises à jour)`, 'success');
        await loadKnowledge();
      } else {
        addNotification('Erreur lors de l’import JSON', 'error');
      }
    } catch (err) {
      console.error('Erreur import JSON:', err);
      addNotification('Erreur de lecture ou de parsing du fichier JSON', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const openNewKnowledgeForm = () => {
    setIsNewKnowledge(true);
    setEditingKnowledge({
      id: null,
      domain: 'agriculture',
      title: '',
      question: '',
      answer: '',
      tags: [],
      language: 'fr',
      source: '',
      mediaImageUrl: '',
      mediaImageTitle: '',
      mediaVideoUrl: '',
      mediaVideoTitle: ''
    });

    // S'assurer que le formulaire est bien visible
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const openEditKnowledgeForm = (item) => {
    let mediaImageUrl = '';
    let mediaImageTitle = '';
    let mediaVideoUrl = '';
    let mediaVideoTitle = '';

    if (item.media && Array.isArray(item.media)) {
      const img = item.media.find(m => m && m.type === 'image');
      const vid = item.media.find(m => m && m.type === 'video');
      if (img) {
        mediaImageUrl = img.url || '';
        mediaImageTitle = img.title || '';
      }
      if (vid) {
        mediaVideoUrl = vid.url || '';
        mediaVideoTitle = vid.title || '';
      }
    }

    setIsNewKnowledge(false);
    setEditingKnowledge({
      id: item.id,
      domain: item.domain,
      title: item.title,
      question: item.question || '',
      answer: item.answer || '',
      tags: item.tags || [],
      language: item.language || 'fr',
      source: item.source || '',
      mediaImageUrl,
      mediaImageTitle,
      mediaVideoUrl,
      mediaVideoTitle
    });

    // Faire défiler jusqu'au formulaire d'édition pour que l'action "Éditer" soit visible
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const persistKnowledgeForm = async () => {
    if (!editingKnowledge) return;

    if (!editingKnowledge.title.trim() || !editingKnowledge.answer.trim()) {
      addNotification('Titre et réponse sont obligatoires pour la fiche.', 'warning');
      return;
    }

    const tagsArray = Array.isArray(editingKnowledge.tags)
      ? editingKnowledge.tags
      : (editingKnowledge.tags || '')
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);

    const media = [];
    if (editingKnowledge.mediaImageUrl) {
      media.push({
        type: 'image',
        url: editingKnowledge.mediaImageUrl,
        title: editingKnowledge.mediaImageTitle || undefined
      });
    }
    if (editingKnowledge.mediaVideoUrl) {
      media.push({
        type: 'video',
        url: editingKnowledge.mediaVideoUrl,
        title: editingKnowledge.mediaVideoTitle || undefined
      });
    }

    const payload = {
      domain: editingKnowledge.domain,
      title: editingKnowledge.title,
      question: editingKnowledge.question || null,
      answer: editingKnowledge.answer,
      tags: tagsArray,
      language: editingKnowledge.language || 'fr',
      source: editingKnowledge.source || null,
      media: media.length > 0 ? media : null
    };

    try {
      const url = isNewKnowledge
        ? `${API_URL}/admin/knowledge`
        : `${API_URL}/admin/knowledge/${editingKnowledge.id}`;
      const method = isNewKnowledge ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addNotification(
          isNewKnowledge
            ? 'Fiche de connaissance créée avec succès'
            : 'Fiche de connaissance mise à jour avec succès',
          'success'
        );
        setEditingKnowledge(null);
        setIsNewKnowledge(false);
        await loadKnowledge();
      } else {
        addNotification('Erreur lors de l’enregistrement de la fiche.', 'error');
      }
    } catch (err) {
      console.error('Erreur save knowledge:', err);
      addNotification('Erreur de connexion au serveur lors de l’enregistrement.', 'error');
    }
  };

  const deleteKnowledge = async (itemId) => {
    if (!window.confirm('Supprimer cette fiche de connaissance ?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/knowledge/${itemId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        addNotification('Fiche supprimée avec succès', 'success');
        await loadKnowledge();
      } else {
        addNotification('Erreur lors de la suppression de la fiche.', 'error');
      }
    } catch (err) {
      console.error('Erreur suppression knowledge:', err);
      addNotification('Erreur de connexion au serveur lors de la suppression.', 'error');
    }
  };

  // CONNEXION
  const loginExpert = async () => {
    if (!email.trim() || !password.trim()) {
      addNotification('Veuillez entrer email et mot de passe', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        setExpertInfo(data.expert);
        localStorage.setItem('expertToken', data.token);
        localStorage.setItem('expertId', data.expert.id);
        
        // Démarrer rafraîchissement
        startAutoRefresh();
        
        // Charger données
        await loadTickets();
        await loadStats();
        
        setStep('dashboard');
        addNotification('Connexion réussie !', 'success');
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Identifiants invalides');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      addNotification('Erreur de connexion. Essayez: test@resolvehub.bf / test123', 'error');
    } finally {
      setLoading(false);
    }
  };

  // RAFRAÎCHISSEMENT AUTO
  const startAutoRefresh = () => {
    stopAutoRefresh();
    
    refreshIntervalRef.current = setInterval(() => {
      if (step === 'dashboard') {
        loadTickets();
        loadStats();
      } else if (step === 'ticket-detail' && selectedTicket?.ticket?.id) {
        loadTicketDetails(selectedTicket.ticket.id);
      }
    }, 30000);
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // CHARGER TICKETS
  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      const res = await fetch(`${API_URL}/tickets`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        applyFilters(data);
      } else if (res.status === 401) {
        handleLogout();
      } else {
        console.error('Erreur chargement tickets:', res.status);
      }
    } catch (err) {
      console.error('Erreur chargement tickets:', err);
      if (err.message.includes('Failed to fetch')) {
        addNotification('Impossible de se connecter au serveur', 'error');
      }
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('expertToken');
      const res = await fetch(`${API_URL}/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setStats({
          total_tickets: data.total_tickets || 0,
          open_tickets: data.open_tickets || 0,
          assigned_tickets: data.assigned_tickets || 0,
          resolved_today: data.resolved_today || 0,
          tickets_with_photos: data.tickets_with_photos || 0
        });
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  // APPLIQUER FILTRES
  const applyFilters = (ticketsList = tickets) => {
    let filtered = [...ticketsList];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(t => t.urgency === urgencyFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.last_message?.toLowerCase().includes(query)) ||
        (t.id?.toString().includes(query)) ||
        (t.user_phone?.toLowerCase().includes(query)) ||
        (t.category?.toLowerCase().includes(query))
      );
    }

    setFilteredTickets(filtered);
  };

  // DÉTAILS TICKET
  const loadTicketDetails = async (ticketId) => {
    try {
      const token = localStorage.getItem('expertToken');
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
        setStep('ticket-detail');
      } else {
        addNotification('Erreur chargement détail du ticket', 'error');
      }
    } catch (err) {
      addNotification('Erreur de connexion au serveur', 'error');
      console.error('Erreur détail ticket:', err);
    }
  };

  // ENVOYER MESSAGE
  const sendMessage = async (ticketId) => {
    if (!newMessage.trim()) {
      addNotification('Veuillez écrire un message', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('expertToken');
      const res = await fetch(`${API_URL}/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (res.ok) {
        setNewMessage('');
        loadTicketDetails(ticketId);
        addNotification('Message envoyé!', 'success');
        loadTickets();
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'Erreur envoi message');
      }
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  // MARQUER COMME RÉSOLU
  const markAsResolved = async (ticketId) => {
    try {
      const token = localStorage.getItem('expertToken');
      const res = await fetch(`${API_URL}/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        addNotification('Ticket résolu avec succès', 'success');
        setShowConfirmResolve(false);
        
        // Recharger après un court délai
        setTimeout(() => {
          if (selectedTicket?.ticket?.id === ticketId) {
            loadTicketDetails(ticketId);
          }
          loadTickets();
          loadStats();
        }, 500);
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'Erreur résolution ticket');
      }
    } catch (err) {
      addNotification(err.message, 'error');
    }
  };

  // DÉCONNEXION
  const handleLogout = () => {
    stopAutoRefresh();
    clearAllTimeouts();
    localStorage.removeItem('expertToken');
    localStorage.removeItem('expertId');
    setStep('login');
    setNotifications([]);
    setTickets([]);
    setSelectedTicket(null);
  };

  // FORMAT DATE
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

  // OUVRIRE IMAGE
  const openImageModal = (imageUrl, title) => {
    if (!imageUrl) {
      addNotification('Aucune image disponible pour ce ticket', 'info');
      return;
    }
    
    setSelectedImage({ url: imageUrl, title });
    setShowImageModal(true);
  };

  // OUVRIRE IMAGE DEPUIS TICKET
  const openTicketImage = (ticket) => {
    if (!ticket.photo_url) {
      addNotification('Ce ticket ne contient pas de photo', 'info');
      return;
    }
    
    setSelectedImage({ 
      url: ticket.photo_url, 
      title: `Photo du ticket #${ticket.id}` 
    });
    setShowImageModal(true);
  };

  // EFFETS
  useEffect(() => {
    const token = localStorage.getItem('expertToken');
    if (token) {
      // Vérifier si le backend est accessible
      const checkBackend = async () => {
        try {
          const response = await fetch('http://localhost:8000/health');
          if (!response.ok) {
            addNotification(
              'Backend non accessible. Vérifiez que le serveur est en cours d\'exécution.',
              'error'
            );
          }
        } catch (error) {
          console.error('Backend non accessible:', error);
          addNotification(
            'Impossible de se connecter au backend. Vérifiez que le serveur est en cours d\'exécution sur http://localhost:8000',
            'error'
          );
        }
      };
      
      setStep('dashboard');
      loadTickets();
      loadStats();
      startAutoRefresh();
      checkBackend();
    }

    return () => {
      stopAutoRefresh();
      clearAllTimeouts();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, categoryFilter, urgencyFilter, searchQuery, tickets]);

  // RENDU LOGIN
  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Shield className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">PANEL EXPERT</h1>
              <p className="text-gray-600">Accès réservé aux experts certifiés</p>
              <div className="mt-3 inline-block bg-blue-100 px-3 py-1 rounded-full">
                <p className="text-xs text-blue-800 font-medium">IA Locale v3.0</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="expert@resolvehub.bf"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && loginExpert()}
                />
              </div>
            </div>

            <button
              onClick={loginExpert}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connexion...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Se connecter
                </>
              )}
            </button>

            <div className="text-center text-sm text-gray-500">
              <p>Compte test :</p>
              <p className="font-mono">test@resolvehub.bf / test123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDU DASHBOARD
  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
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

        <Modal
          isOpen={showKnowledgeModal}
          onClose={() => setShowKnowledgeModal(false)}
          title="Base de connaissances (RAG)"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-600">
                Fiches utilisées par le moteur RAG pour assister la population locale.
              </p>
              <button
                onClick={reloadKnowledge}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={16} className="mr-1" />
                Recharger depuis JSON
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <label className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-200">
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleKnowledgeFileUpload}
                  />
                  <BookOpen size={14} className="mr-2" />
                  Importer un fichier JSON
                </label>
                <span className="ml-1 text-[11px] text-gray-500">
                  (met à jour ou ajoute des fiches)
                </span>
              </div>
              <button
                onClick={openNewKnowledgeForm}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Nouvelle fiche
              </button>
            </div>

            {loadingKnowledge ? (
              <div className="py-6 text-center text-gray-500 text-sm">
                Chargement de la base de connaissances...
              </div>
            ) : knowledgeItems.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-sm">
                Aucune fiche de connaissance trouvée.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {knowledgeItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {item.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.domain}
                      </span>
                    </div>
                    {item.question && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">Question typique :</span> {item.question}
                      </p>
                    )}
                    <p className="text-xs text-gray-700 mb-1 whitespace-pre-line">
                      {item.answer}
                    </p>
                    {item.media && Array.isArray(item.media) && item.media.length > 0 && (
                      <div className="mt-1 mb-1">
                        <p className="text-[10px] text-gray-500 font-medium mb-0.5">
                          Médias associés :
                        </p>
                        <ul className="flex flex-wrap gap-1">
                          {item.media.map((m, idx) => (
                            <li
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-700 border border-purple-100"
                            >
                              {m.type === 'image' ? 'Image' : m.type === 'video' ? 'Vidéo' : 'Media'}
                              {m.title ? ` – ${m.title}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex flex-wrap gap-1">
                        {item.tags && item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.source && (
                          <span className="text-[10px] text-gray-400">
                            Source : {item.source}
                          </span>
                        )}
                        <button
                          onClick={() => openEditKnowledgeForm(item)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline ml-2"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => deleteKnowledge(item.id)}
                          className="text-[10px] text-red-600 hover:text-red-800 underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingKnowledge && (
              <div ref={editFormRef} className="mt-4 border-t border-gray-200 pt-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  {isNewKnowledge ? 'Nouvelle fiche de connaissance' : 'Modifier la fiche'}
                </h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Domaine</label>
                      <select
                        value={editingKnowledge.domain}
                        onChange={(e) => setEditingKnowledge(prev => ({ ...prev, domain: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="agriculture">agriculture</option>
                        <option value="elevage">elevage</option>
                        <option value="health">health (SOS/accident)</option>
                        <option value="cybersecurity">cybersecurity</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Langue</label>
                      <input
                        type="text"
                        value={editingKnowledge.language}
                        onChange={(e) => setEditingKnowledge(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Titre</label>
                    <input
                      type="text"
                      value={editingKnowledge.title}
                      onChange={(e) => setEditingKnowledge(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Question typique (optionnel)</label>
                    <input
                      type="text"
                      value={editingKnowledge.question}
                      onChange={(e) => setEditingKnowledge(prev => ({ ...prev, question: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Réponse (texte complet)</label>
                    <textarea
                      value={editingKnowledge.answer}
                      onChange={(e) => setEditingKnowledge(prev => ({ ...prev, answer: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Tags (séparés par des virgules)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingKnowledge.tags) ? editingKnowledge.tags.join(', ') : editingKnowledge.tags}
                      onChange={(e) => setEditingKnowledge(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Source (optionnel)</label>
                    <input
                      type="text"
                      value={editingKnowledge.source}
                      onChange={(e) => setEditingKnowledge(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">URL image (illustration)</label>
                      <input
                        type="text"
                        value={editingKnowledge.mediaImageUrl}
                        onChange={(e) => setEditingKnowledge(prev => ({ ...prev, mediaImageUrl: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-[11px]"
                        placeholder="https://...jpg"
                      />
                      <input
                        type="text"
                        value={editingKnowledge.mediaImageTitle}
                        onChange={(e) => setEditingKnowledge(prev => ({ ...prev, mediaImageTitle: e.target.value }))}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-[11px]"
                        placeholder="Titre de l’image (optionnel)"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">URL vidéo (explication)</label>
                      <input
                        type="text"
                        value={editingKnowledge.mediaVideoUrl}
                        onChange={(e) => setEditingKnowledge(prev => ({ ...prev, mediaVideoUrl: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-[11px]"
                        placeholder="https://..."
                      />
                      <input
                        type="text"
                        value={editingKnowledge.mediaVideoTitle}
                        onChange={(e) => setEditingKnowledge(prev => ({ ...prev, mediaVideoTitle: e.target.value }))}
                        className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-[11px]"
                        placeholder="Titre de la vidéo (optionnel)"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingKnowledge(null);
                        setIsNewKnowledge(false);
                      }}
                      className="px-3 py-1.5 text-[11px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={persistKnowledgeForm}
                      className="px-3 py-1.5 text-[11px] bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>

        <Modal
          isOpen={showEmergencyModal}
          onClose={() => {
            setShowEmergencyModal(false);
            setEditingEmergency(null);
            setIsNewEmergency(false);
          }}
          title="Numéros utiles (urgence)"
        >
          <div className="space-y-4 text-sm">
            <p className="text-xs text-gray-600 mb-1">
              Gérez ici les numéros d&apos;urgence affichés dans l&apos;application utilisateur (pompier, police, gendarmerie, clinique, etc.).
            </p>

            {loadingEmergency ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                Chargement des numéros utiles...
              </div>
            ) : emergencyNumbers.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                Aucun numéro utile configuré.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {emergencyNumbers.map((num) => (
                  <div key={num.id} className="border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{num.label}</p>
                      <p className="text-xs text-blue-700 font-mono">{num.number}</p>
                      {num.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{num.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-gray-400">Ordre : {num.display_order}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditEmergencyForm(num)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => deleteEmergencyNumber(num.id)}
                          className="text-[10px] text-red-600 hover:text-red-800 underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-800">
                  {editingEmergency ? (isNewEmergency ? 'Nouveau numéro' : 'Modifier le numéro') : 'Ajouter / modifier un numéro'}
                </h4>
                <button
                  onClick={openNewEmergencyForm}
                  className="px-3 py-1.5 text-[11px] bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Nouveau
                </button>
              </div>

              {editingEmergency && (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Libellé</label>
                    <input
                      type="text"
                      value={editingEmergency.label}
                      onChange={(e) => setEditingEmergency(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Ex : Sapeurs-pompiers"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Numéro</label>
                    <input
                      type="text"
                      value={editingEmergency.number}
                      onChange={(e) => setEditingEmergency(prev => ({ ...prev, number: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-[12px]"
                      placeholder="Ex : 18, 17, 112..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Description (optionnel)</label>
                    <input
                      type="text"
                      value={editingEmergency.description}
                      onChange={(e) => setEditingEmergency(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[11px]"
                      placeholder="Ex : Numéro national BF, à adapter selon la région"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 mb-1">Ordre d&apos;affichage</label>
                    <input
                      type="number"
                      value={editingEmergency.display_order}
                      onChange={(e) => setEditingEmergency(prev => ({ ...prev, display_order: parseInt(e.target.value || '0', 10) }))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-[11px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingEmergency(null);
                        setIsNewEmergency(false);
                      }}
                      className="px-3 py-1.5 text-[11px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={persistEmergencyForm}
                      className="px-3 py-1.5 text-[11px] bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pt-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Tableau de bord Expert</h1>
              <p className="text-gray-600">
                Bienvenue, <span className="font-semibold text-blue-600">{expertInfo?.name || 'Expert'}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  setShowEmergencyModal(true);
                  await loadEmergencyNumbers();
                }}
                className="flex items-center gap-2 bg-white text-red-700 border border-red-200 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition text-sm"
              >
                <Phone size={18} />
                Numéros utiles
              </button>
              <button
                onClick={async () => {
                  setShowKnowledgeModal(true);
                  await loadKnowledge();
                }}
                className="flex items-center gap-2 bg-white text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                <BookOpen size={20} />
                Base de connaissances
              </button>
              <button
                onClick={() => {
                  loadTickets();
                  loadStats();
                  addNotification('Actualisation manuelle effectuée', 'info');
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <RefreshCw size={20} />
                Actualiser
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {[
              { 
                label: 'Total Tickets', 
                value: stats.total_tickets, 
                icon: BarChart3, 
                color: 'text-blue-600',
                key: 'total'
              },
              { 
                label: 'Ouverts', 
                value: stats.open_tickets, 
                icon: Clock, 
                color: 'text-orange-600',
                key: 'open'
              },
              { 
                label: 'Assignés', 
                value: stats.assigned_tickets, 
                icon: User, 
                color: 'text-blue-600',
                key: 'assigned'
              },
              { 
                label: 'Résolus (24h)', 
                value: stats.resolved_today, 
                icon: CheckCircle, 
                color: 'text-green-600',
                key: 'resolved'
              },
              { 
                label: 'Avec photos', 
                value: stats.tickets_with_photos, 
                icon: Camera, 
                color: 'text-purple-600',
                key: 'photos'
              }
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.key} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={stat.color} size={32} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ID, téléphone, contenu..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgence
                </label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous niveaux</option>
                  {urgencies.map(urg => (
                    <option key={urg.id} value={urg.id}>{urg.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Liste tickets */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Tickets ({filteredTickets.length})
              </h2>
              <span className="text-sm text-gray-500">
                Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <Mailbox className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Aucun ticket trouvé</p>
                {tickets.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Essayez de modifier vos filtres
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernier message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTickets.map((ticket) => {
                      const status = statuses.find(s => s.id === ticket.status);
                      const category = categories.find(c => c.id === ticket.category);
                      
                      return (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm font-semibold">#{ticket.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {category && (
                                <div className={`${category.color} p-2 rounded-lg`}>
                                  <category.icon className="text-white" size={16} />
                                </div>
                              )}
                              <span className="text-sm">{category?.name || ticket.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 line-clamp-2 max-w-xs">
                              {ticket.last_message || 'Aucun message'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {ticket.user_phone || 'Anonyme'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status?.bgColor} ${status?.color}`}>
                              {status && <status.icon size={14} className="mr-1" />}
                              {status?.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {ticket.has_photo ? (
                              <button
                                onClick={() => openTicketImage(ticket)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <Image size={16} />
                                <span className="text-xs">Voir photo</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatDate(ticket.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => loadTicketDetails(ticket.id)}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                              <Eye size={16} className="mr-2" />
                              Consulter
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDU DÉTAIL TICKET
  if (step === 'ticket-detail' && selectedTicket) {
    const ticket = selectedTicket.ticket || {};
    const messages = selectedTicket.messages || [];
    const user = selectedTicket.user || {};
    
    // Gestion de l'analyse photo
    let photoAnalysis = ticket.photo_analysis;
    if (photoAnalysis && typeof photoAnalysis === 'string') {
      try {
        photoAnalysis = JSON.parse(photoAnalysis);
      } catch (error) {
        console.error('Erreur parsing photo_analysis:', error);
        photoAnalysis = null;
      }
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          />
        ))}

        <Modal
          isOpen={showConfirmResolve}
          onClose={() => setShowConfirmResolve(false)}
          title="Confirmer la résolution"
        >
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Êtes-vous sûr de vouloir marquer le ticket #{ticketToResolve?.id} comme résolu ?
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmResolve(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => ticketToResolve && markAsResolved(ticketToResolve.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </Modal>

        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={selectedImage?.url}
          title={selectedImage?.title}
        />

        <div className="max-w-6xl mx-auto py-6">
          <button
            onClick={() => setStep('dashboard')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ChevronLeft size={20} />
            Retour au tableau de bord
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation et détails */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Ticket #{ticket.id}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        ticket.status === 'open' ? 'bg-orange-100 text-orange-800' :
                        ticket.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.status === 'open' && <Clock size={14} className="mr-1" />}
                        {ticket.status === 'assigned' && <User size={14} className="mr-1" />}
                        {ticket.status === 'resolved' && <CheckCircle size={14} className="mr-1" />}
                        {ticket.status === 'open' ? 'Ouvert' : ticket.status === 'assigned' ? 'Assigné' : 'Résolu'}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        ticket.urgency === 'high' ? 'bg-red-100 text-red-800' :
                        ticket.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.urgency === 'high' ? 'Urgente' : ticket.urgency === 'medium' ? 'Moyenne' : 'Normale'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Créé le</div>
                    <div className="font-medium">{formatDate(ticket.created_at)}</div>
                  </div>
                </div>

                {/* Affichage de la photo */}
                {ticket.photo_url && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Camera size={20} />
                        Photo envoyée par l'utilisateur
                      </h3>
                      <button
                        onClick={() => openImageModal(ticket.photo_url, `Photo du ticket #${ticket.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <ExternalLink size={14} />
                        Agrandir
                      </button>
                    </div>
                    <div className="relative">
                      <ImageWithFallback
                        src={ticket.photo_url}
                        alt="Photo du problème"
                        className="w-full h-64 object-cover rounded-lg border-2 border-blue-200 cursor-pointer hover:opacity-90 transition"
                        onClick={() => openImageModal(ticket.photo_url, `Photo du ticket #${ticket.id}`)}
                      />
                    </div>
                  </div>
                )}

                {/* Analyse IA de la photo */}
                {photoAnalysis && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      📊 Analyse IA Locale de la photo
                    </h3>
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800 text-lg">
                            {photoAnalysis.disease_detected || 'Analyse générique'}
                          </span>
                          {photoAnalysis.confidence && (
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              photoAnalysis.confidence > 0.7 
                                ? 'bg-green-100 text-green-800'
                                : photoAnalysis.confidence > 0.5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Confiance: {Math.round((photoAnalysis.confidence || 0) * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{photoAnalysis.analysis || photoAnalysis.recommendations || 'Analyse non disponible'}</p>
                        
                        {photoAnalysis.symptoms && photoAnalysis.symptoms.length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-800 mb-1">Symptômes détectés:</h4>
                            <ul className="list-disc pl-5 text-sm text-gray-700">
                              {photoAnalysis.symptoms.map((symptom, idx) => (
                                <li key={idx}>{symptom}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">💊 Traitement:</h4>
                          <p className="text-sm text-gray-700">{photoAnalysis.treatment || photoAnalysis.recommendations || 'Recommandations non spécifiées'}</p>
                        </div>
                        {photoAnalysis.prevention && (
                          <div>
                            <h4 className="font-medium text-gray-800 mb-1">🛡️ Prévention:</h4>
                            <p className="text-sm text-gray-700">{photoAnalysis.prevention}</p>
                          </div>
                        )}
                      </div>
                      
                      {photoAnalysis.requires_expert && (
                        <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                          <div className="flex items-start">
                            <AlertCircle className="text-yellow-600 mr-2 mt-0.5" size={18} />
                            <p className="text-sm text-yellow-800">
                              Cette analyse nécessite une validation par un expert humain.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">💬 Conversation</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto p-2 mb-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="mx-auto mb-2" size={32} />
                        <p>Aucun message pour le moment</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${
                            message.sender_type === 'expert'
                              ? 'bg-blue-100 ml-8 border-l-4 border-blue-500'
                              : message.sender_type === 'system'
                              ? 'bg-gray-100 ml-8 border-l-4 border-gray-500'
                              : 'bg-gray-100 mr-8 border-l-4 border-gray-400'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium flex items-center gap-2">
                              {message.sender_type === 'expert' ? (
                                <>
                                  <User size={14} />
                                  Expert
                                </>
                              ) : message.sender_type === 'system' ? (
                                <>
                                  <AlertCircle size={14} />
                                  Système
                                </>
                              ) : (
                                <>
                                  <User size={14} />
                                  Utilisateur
                                </>
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.sent_at)}
                            </span>
                          </div>
                          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                            {message.sender_type === 'user' && message.content?.startsWith('Question 1 :') ? (
                              <>
                                <p className="font-semibold mb-1">Résumé des questions de l'utilisateur :</p>
                                <ul className="list-disc pl-5 space-y-1">
                                  {message.content.split('\n').map((line, i) => {
                                    const trimmed = line.trim();
                                    if (!trimmed) return null;
                                    return (
                                      <li key={i}>{trimmed}</li>
                                    );
                                  })}
                                </ul>
                              </>
                            ) : (
                              <p>{message.content}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Formulaire de réponse */}
                  {ticket.status !== 'resolved' && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Répondre</h4>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrivez votre réponse à l'utilisateur ici..."
                        className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            sendMessage(ticket.id);
                          }
                        }}
                      />
                      <div className="flex justify-between">
                        <div className="text-sm text-gray-500">
                          Appuyez sur Ctrl+Enter pour envoyer
                        </div>
                        <button
                          onClick={() => sendMessage(ticket.id)}
                          disabled={!newMessage.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={20} />
                          Envoyer la réponse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Informations utilisateur */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} />
                  Informations utilisateur
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-lg">
                      {user.phone || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium">
                      {user.name || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Localisation</p>
                    <p className="font-medium">
                      {user.location || 'Non spécifié'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Détails du ticket */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Détails du ticket</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">ID du ticket</p>
                    <p className="font-medium font-mono">#{ticket.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Catégorie</p>
                    <p className="font-medium">
                      {categories.find(c => c.id === ticket.category)?.name || ticket.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de création</p>
                    <p className="font-medium">{formatDate(ticket.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Photo incluse</p>
                    <p className="font-medium flex items-center gap-2">
                      {ticket.photo_url ? (
                        <>
                          <CheckCircle className="text-green-600" size={16} />
                          Oui
                        </>
                      ) : (
                        <>
                          <X className="text-gray-400" size={16} />
                          Non
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Analyse IA</p>
                    <p className="font-medium flex items-center gap-2">
                      {ticket.photo_analysis ? (
                        <>
                          <CheckCircle className="text-green-600" size={16} />
                          Disponible
                        </>
                      ) : (
                        <>
                          <X className="text-gray-400" size={16} />
                          Non disponible
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Actions rapides</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => loadTicketDetails(ticket.id)}
                    className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Actualiser
                  </button>
                  
                  {ticket.status !== 'resolved' && (
                    <>
                      <button
                        onClick={() => {
                          setNewMessage("Bonjour, j'ai pris en charge votre demande. Pourriez-vous me donner plus de détails sur le problème?");
                        }}
                        className="w-full border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
                      >
                        + Demander des précisions
                      </button>
                      
                      <button
                        onClick={() => {
                          setTicketToResolve(ticket);
                          setShowConfirmResolve(true);
                        }}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                      >
                        <CheckSquare size={20} />
                        Marquer comme résolu
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FALLBACK
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <Shield className="mx-auto text-blue-600 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Session expirée</h2>
        <p className="text-gray-600 mb-4">Votre session a expiré ou vous avez été déconnecté.</p>
        <button
          onClick={handleLogout}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Se reconnecter
        </button>
      </div>
    </div>
  );
};

export default App;