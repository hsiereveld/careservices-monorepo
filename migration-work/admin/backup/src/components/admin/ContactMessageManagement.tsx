import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Edit, 
  Save, 
  X, 
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  contact_preference: 'email' | 'phone' | 'any';
  user_id: string | null;
  status: 'new' | 'in_progress' | 'completed' | 'spam';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function ContactMessageManagement() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [messageStatus, setMessageStatus] = useState<'new' | 'in_progress' | 'completed' | 'spam'>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMessages(data || []);
    } catch (err: any) {
      setError('Fout bij het laden van berichten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageDetails = (messageId: string) => {
    if (expandedMessageId === messageId) {
      setExpandedMessageId(null);
    } else {
      setExpandedMessageId(messageId);
    }
  };

  const handleEditMessage = (message: ContactMessage) => {
    setEditingMessage(message);
    setAdminNotes(message.admin_notes || '');
    setMessageStatus(message.status);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setAdminNotes('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({
          status: messageStatus,
          admin_notes: adminNotes
        })
        .eq('id', editingMessage.id);

      if (updateError) throw updateError;

      setSuccess('Bericht succesvol bijgewerkt!');
      setEditingMessage(null);
      fetchMessages();
    } catch (err: any) {
      setError('Fout bij het bijwerken van bericht: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;

    try {
      setError('');
      setSuccess('');

      const { error: deleteError } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) throw deleteError;

      setSuccess('Bericht succesvol verwijderd!');
      fetchMessages();
    } catch (err: any) {
      setError('Fout bij het verwijderen van bericht: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'spam': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nieuw';
      case 'in_progress': return 'In behandeling';
      case 'completed': return 'Afgehandeld';
      case 'spam': return 'Spam';
      default: return status;
    }
  };

  const getContactPreferenceLabel = (preference: string) => {
    switch (preference) {
      case 'email': return 'E-mail';
      case 'phone': return 'Telefoon';
      case 'any': return 'Geen voorkeur';
      default: return preference;
    }
  };

  // Filter messages based on search and status
  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Contactberichten</h2>
          <p className="text-text-secondary">Beheer en beantwoord berichten van gebruikers</p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Vernieuwen
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Zoek berichten..."
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
          >
            <option value="all">Alle statussen</option>
            <option value="new">Nieuw</option>
            <option value="in_progress">In behandeling</option>
            <option value="completed">Afgehandeld</option>
            <option value="spam">Spam</option>
          </select>
        </div>
      </div>

      {/* Message List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div key={message.id} className="p-6">
                {/* Message Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{message.subject || 'Geen onderwerp'}</h3>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <User className="w-4 h-4" />
                        <span>{message.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <Mail className="w-4 h-4" />
                        <span>{message.email}</span>
                      </div>
                      {message.phone && (
                        <div className="flex items-center space-x-2 text-sm text-text-secondary">
                          <Phone className="w-4 h-4" />
                          <span>{message.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(message.status)}`}>
                      {getStatusLabel(message.status)}
                    </span>
                    <span className="text-xs text-text-light">
                      {new Date(message.created_at).toLocaleString('nl-NL')}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleMessageDetails(message.id)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      >
                        {expandedMessageId === message.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditMessage(message)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Message Details */}
                {expandedMessageId === message.id && (
                  <div className="mt-4 pl-14">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-text-primary mb-2">Bericht:</h4>
                      <p className="text-text-secondary whitespace-pre-wrap">{message.message}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-text-secondary mb-2">
                      <Clock className="w-4 h-4" />
                      <span>Contactvoorkeur: {getContactPreferenceLabel(message.contact_preference)}</span>
                    </div>
                    
                    {message.admin_notes && (
                      <div className="bg-yellow-50 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-yellow-700 mb-2">Admin notities:</h4>
                        <p className="text-yellow-600 whitespace-pre-wrap">{message.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {messages.length === 0 ? 'Geen berichten gevonden' : 'Geen berichten gevonden met huidige filters'}
            </h3>
            <p className="text-gray-600">
              {messages.length === 0 
                ? 'Er zijn nog geen contactberichten ontvangen'
                : 'Probeer je zoekfilters aan te passen'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Message Modal */}
      {editingMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Bericht Bewerken
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Van:</p>
                    <p className="font-medium">{editingMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email:</p>
                    <p>{editingMessage.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefoon:</p>
                    <p>{editingMessage.phone || 'Niet opgegeven'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ontvangen op:</p>
                    <p>{new Date(editingMessage.created_at).toLocaleString('nl-NL')}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Onderwerp:</p>
                  <p className="font-medium">{editingMessage.subject || 'Geen onderwerp'}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Bericht:</p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-1">
                    <p className="whitespace-pre-wrap">{editingMessage.message}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Contactvoorkeur:</p>
                  <p>{getContactPreferenceLabel(editingMessage.contact_preference)}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={messageStatus}
                    onChange={(e) => setMessageStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="new">Nieuw</option>
                    <option value="in_progress">In behandeling</option>
                    <option value="completed">Afgehandeld</option>
                    <option value="spam">Spam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin notities
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Voeg notities toe over dit bericht..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      <span>Opslaan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Wijzigingen Opslaan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}