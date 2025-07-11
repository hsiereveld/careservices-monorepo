import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Code,
  FileText,
  Send,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Info,
  ExternalLink,
  Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../utils/emailService';

type ApplicationStatus = 'all' | 'pending' | 'under_review' | 'invited_for_interview' | 'approved' | 'rejected';
type ApplicationFormMode = 'view' | 'review' | 'interview' | null;

interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  body: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    template_name: '',
    subject: '',
    body: '',
    description: ''
  });
  
  // Test email state
  const [showTestEmailForm, setShowTestEmailForm] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [selectedTemplateForTest, setSelectedTemplateForTest] = useState<string | null>(null);
  
  // Copied state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Configuration help state
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_name');

      if (fetchError) throw fetchError;

      setTemplates(data || []);
    } catch (err: any) {
      setError('Fout bij het laden van e-mailtemplates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (mode: 'create' | 'edit' | 'view', template?: EmailTemplate) => {
    setFormMode(mode);
    setEditingTemplate(template || null);
    
    if (template) {
      setFormData({
        template_name: template.template_name,
        subject: template.subject,
        body: template.body,
        description: template.description || ''
      });
    } else {
      setFormData({
        template_name: '',
        subject: '',
        body: '',
        description: ''
      });
    }
    
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      template_name: '',
      subject: '',
      body: '',
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'view') return;

    setError('');
    setSuccess('');

    try {
      // Validate form data
      if (!formData.template_name || !formData.subject || !formData.body) {
        throw new Error('Alle verplichte velden moeten worden ingevuld');
      }

      if (formMode === 'create') {
        // Create new template
        const { error: createError } = await supabase
          .from('email_templates')
          .insert([formData]);

        if (createError) throw createError;
        setSuccess('E-mailtemplate succesvol aangemaakt! 🎉');
      } else {
        // Update existing template
        const { error: updateError } = await supabase
          .from('email_templates')
          .update(formData)
          .eq('id', editingTemplate!.id);

        if (updateError) throw updateError;
        setSuccess('E-mailtemplate succesvol bijgewerkt! 🎉');
      }

      fetchTemplates();
      setTimeout(() => {
        closeForm();
      }, 1500);
    } catch (err: any) {
      setError('Fout bij het opslaan: ' + err.message);
    }
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Weet je zeker dat je de template "${templateName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setSuccess(`E-mailtemplate "${templateName}" succesvol verwijderd! 🗑️`);
      fetchTemplates();
    } catch (err: any) {
      setError('Fout bij het verwijderen van template: ' + err.message);
    }
  };

  const openTestEmailForm = (templateName: string) => {
    setSelectedTemplateForTest(templateName);
    setTestEmailAddress('');
    setShowTestEmailForm(true);
  };

  const closeTestEmailForm = () => {
    setShowTestEmailForm(false);
    setSelectedTemplateForTest(null);
    setTestEmailAddress('');
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForTest || !testEmailAddress) return;

    setSendingTestEmail(true);
    setError('');
    setSuccess('');

    try {
      const result = await sendEmail('welcome_client', testEmailAddress, {
        first_name: 'Test',
        last_name: 'Gebruiker',
        service_name: 'Test Service',
        booking_date: new Date().toLocaleDateString('nl-NL'),
        booking_time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
      });
      
      if (!result.success) {
        // Show detailed error information
        let errorMessage = result.error || 'Fout bij het verzenden van test e-mail';
        if (result.details) {
          errorMessage += ': ' + result.details;
        }
        
        // If it's a configuration error, show the help modal
        if (result.error?.includes('configuratie') || result.error?.includes('RESEND_API_KEY')) {
          setShowConfigHelp(true);
        }
        
        throw new Error(errorMessage);
      }

      setSuccess(`Test e-mail succesvol verzonden naar ${testEmailAddress}! 📧`);
      setTimeout(() => {
        closeTestEmailForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredTemplates = templates.filter(template => 
    template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isReadOnly = formMode === 'view';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">E-mailtemplates</h2>
          <p className="text-gray-600">Beheer alle e-mailtemplates voor automatische communicatie</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfigHelp(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
            title="Configuratie hulp"
          >
            <Settings className="w-4 h-4" />
            <span>Configuratie</span>
          </button>
          <button
            onClick={() => openForm('create')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuwe Template</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-red-700 whitespace-pre-wrap">{error}</span>
            {error.includes('configuratie') && (
              <button
                onClick={() => setShowConfigHelp(true)}
                className="block mt-2 text-red-600 hover:text-red-800 underline text-sm"
              >
                Bekijk configuratie instructies →
              </button>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Configuration Help Modal */}
      {showConfigHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <Settings className="w-6 h-6" />
                  <span>E-mail Service Configuratie</span>
                </h3>
                <button
                  onClick={() => setShowConfigHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Configuratie Vereist</h4>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Om e-mails te kunnen verzenden moet de e-mail service correct worden geconfigureerd in je Supabase project.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Stap 1: Resend API Key verkrijgen</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>Ga naar <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">resend.com <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                    <li>Maak een account aan of log in</li>
                    <li>Ga naar "API Keys" in het dashboard</li>
                    <li>Klik op "Create API Key"</li>
                    <li>Geef de key een naam (bijv. "Care & Service Pinoso")</li>
                    <li>Kopieer de gegenereerde API key</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Stap 2: API Key configureren in Supabase</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
                    <li>Ga naar je <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Supabase Dashboard <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                    <li>Selecteer je project</li>
                    <li>Ga naar "Edge Functions" in het linker menu</li>
                    <li>Klik op de "send-email" functie</li>
                    <li>Ga naar het "Secrets" tabblad</li>
                    <li>Voeg de volgende secrets toe:
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><code className="bg-gray-100 px-1 rounded">RESEND_API_KEY</code> - Je Resend API key</li>
                        <li><code className="bg-gray-100 px-1 rounded">SUPABASE_URL</code> - Je Supabase project URL</li>
                        <li><code className="bg-gray-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> - Je Supabase service role key</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Stap 3: Domein verificatie (optioneel)</h4>
                  <p className="text-sm text-gray-700">
                    Voor productie gebruik kun je je eigen domein verificeren in Resend om e-mails te verzenden vanaf je eigen domein in plaats van de standaard "onboarding@resend.dev".
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-800">Hulp nodig?</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Als je problemen ondervindt met de configuratie, neem dan contact op met de technische beheerder of raadpleeg de Supabase en Resend documentatie.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowConfigHelp(false)}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Zoek templates..."
        />
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Naam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Onderwerp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laatst Bijgewerkt</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{template.template_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{template.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{template.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.updated_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openForm('view', template)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Bekijken"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openForm('edit', template)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Bewerken"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openTestEmailForm(template.template_name)}
                          className="text-green-600 hover:text-green-900"
                          title="Test e-mail verzenden"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id, template.template_name)}
                          className="text-red-600 hover:text-red-900"
                          title="Verwijderen"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {templates.length === 0 ? 'Geen e-mailtemplates gevonden' : 'Geen e-mailtemplates gevonden met huidige filters'}
          </h3>
          <p className="text-gray-600">
            {templates.length === 0 
              ? 'Voeg je eerste e-mailtemplate toe om te beginnen'
              : 'Probeer je zoekfilters aan te passen'
            }
          </p>
          {templates.length === 0 && (
            <button 
              onClick={() => openForm('create')}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Eerste e-mailtemplate toevoegen
            </button>
          )}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formMode === 'create' && 'Nieuwe E-mailtemplate'}
                      {formMode === 'edit' && 'E-mailtemplate Bewerken'}
                      {formMode === 'view' && 'E-mailtemplate Bekijken'}
                    </h2>
                    <p className="text-gray-600">
                      {formMode === 'create' && 'Voeg een nieuwe e-mailtemplate toe'}
                      {formMode === 'edit' && 'Wijzig de e-mailtemplate'}
                      {formMode === 'view' && 'Bekijk alle e-mailtemplate informatie'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Template Naam *
                    </label>
                    <div className="relative">
                      <Code className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        disabled={isReadOnly || formMode === 'edit'}
                        value={formData.template_name || ''}
                        onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                        placeholder="welcome_client"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Unieke identificatie voor de template (bijv. 'welcome_client'). Kan niet worden gewijzigd na aanmaken.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Beschrijving
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      placeholder="Beschrijving van deze template"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Interne beschrijving voor beheerders
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Onderwerp *
                    </label>
                    {!isReadOnly && (
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(formData.subject || '', 'subject')}
                        className="text-primary-600 hover:text-primary-700 text-xs flex items-center space-x-1"
                      >
                        {copiedField === 'subject' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Gekopieerd!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Kopiëren</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                    placeholder="Welkom bij Care & Service, {{first_name}}!"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gebruik {'{{placeholder}}'} voor dynamische inhoud
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Inhoud *
                    </label>
                    {!isReadOnly && (
                      <button 
                        type="button"
                        onClick={() => copyToClipboard(formData.body || '', 'body')}
                        className="text-primary-600 hover:text-primary-700 text-xs flex items-center space-x-1"
                      >
                        {copiedField === 'body' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Gekopieerd!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Kopiëren</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <textarea
                    required
                    disabled={isReadOnly}
                    value={formData.body || ''}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-64 resize-none disabled:opacity-60"
                    placeholder="<h1>Welkom bij Care & Service!</h1><p>Beste {{first_name}},</p><p>Bedankt voor je registratie...</p>"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    HTML is toegestaan. Gebruik {'{{placeholder}}'} voor dynamische inhoud.
                  </p>
                </div>

                {/* Placeholders Help */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-2">
                    <Info className="w-4 h-4" />
                    <span>Beschikbare Placeholders</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
                    <div>{'{{first_name}}'}</div>
                    <div>{'{{last_name}}'}</div>
                    <div>{'{{service_name}}'}</div>
                    <div>{'{{booking_date}}'}</div>
                    <div>{'{{booking_time}}'}</div>
                    <div>{'{{booking_address}}'}</div>
                    <div>{'{{estimated_price}}'}</div>
                    <div>{'{{provider_name}}'}</div>
                    <div>{'{{client_name}}'}</div>
                    <div>{'{{client_phone}}'}</div>
                    <div>{'{{cancellation_reason}}'}</div>
                    <div>{'{{new_booking_date}}'}</div>
                    <div>{'{{new_booking_time}}'}</div>
                    <div>{'{{interview_message}}'}</div>
                    <div>{'{{interview_date}}'}</div>
                    <div>{'{{rejection_reason}}'}</div>
                    <div>{'{{rating}}'}</div>
                    <div>{'{{review_text}}'}</div>
                    <div>{'{{review_link}}'}</div>
                    <div>{'{{invoice_number}}'}</div>
                    <div>{'{{invoice_date}}'}</div>
                    <div>{'{{invoice_amount}}'}</div>
                    <div>{'{{due_date}}'}</div>
                    <div>{'{{invoice_link}}'}</div>
                    <div>{'{{payment_date}}'}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isReadOnly && (
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Save className="w-5 h-5" />
                      <span>
                        {formMode === 'create' ? 'Template Aanmaken' : 'Wijzigingen Opslaan'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md font-medium transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                )}

                {isReadOnly && (
                  <div className="flex justify-end pt-6">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
                    >
                      Sluiten
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestEmailForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Test E-mail Verzenden
                </h3>
                <button
                  onClick={closeTestEmailForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Template
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedTemplateForTest || ''}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Ontvanger E-mailadres *
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ontvanger@email.com"
                  />
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Let op</h4>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Er wordt een test e-mail verzonden met voorbeeldgegevens. De inhoud zal niet exact overeenkomen met de template omdat de placeholders worden vervangen door testwaarden.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={sendingTestEmail}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {sendingTestEmail ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Verzenden...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Test E-mail Verzenden</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeTestEmailForm}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}