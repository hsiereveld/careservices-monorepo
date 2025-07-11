'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { 
  TrendingDown, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  MessageSquare,
  Percent
} from 'lucide-react';

interface CommissionRequest {
  id: string;
  requested_rate: number;
  current_rate: number;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  admin_notes?: string;
  service: {
    id: string;
    name: string;
    service_category: {
      name: string;
      commission_rate: number;
    };
  };
}

interface CommissionRequestsProps {
  onRequestCreated?: () => void;
}

export default function CommissionRequests({ onRequestCreated }: CommissionRequestsProps) {
  const [requests, setRequests] = useState<CommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    service_id: '',
    requested_rate: '',
    justification: ''
  });

  useEffect(() => {
    fetchCommissionRequests();
    fetchAvailableServices();
  }, []);

  const fetchCommissionRequests = async () => {
    try {
      const response = await fetch('/api/professional/commission-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching commission requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const response = await fetch('/api/professional/services?type=my-services');
      if (response.ok) {
        const data = await response.json();
        setAvailableServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/professional/commission-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: formData.service_id,
          requested_rate: parseFloat(formData.requested_rate),
          justification: formData.justification,
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setRequests(prev => [newRequest, ...prev]);
        setFormData({ service_id: '', requested_rate: '', justification: '' });
        setShowCreateForm(false);
        onRequestCreated?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error creating commission request:', error);
      alert('Er is een fout opgetreden bij het versturen van je aanvraag');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Goedgekeurd';
      case 'rejected': return 'Afgewezen';
      case 'pending': return 'In behandeling';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Commissie aanvragen laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <TrendingDown className="h-5 w-5 mr-2" />
              Commissie Aanvragen
            </CardTitle>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Aanvraag
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nieuwe Commissie Aanvraag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecteer een service</option>
                  {availableServices.map((service) => (
                    <option key={service.service.id} value={service.service.id}>
                      {service.service.name} (huidige commissie: {service.service.service_category.commission_rate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gewenste Commissie (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.requested_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, requested_rate: e.target.value }))}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivatie
                </label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Leg uit waarom je een lagere commissie verdient (bijv. ervaring, volume, kwaliteit)..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit">
                  Aanvraag Versturen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{request.service.name}</h3>
                    <Badge variant="secondary">{request.service.service_category.name}</Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{getStatusText(request.status)}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Huidige Commissie</span>
                      <p className="font-medium text-red-600">{request.current_rate || request.service.service_category.commission_rate}%</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Gewenste Commissie</span>
                      <p className="font-medium text-green-600">{request.requested_rate}%</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Besparing</span>
                      <p className="font-medium text-blue-600">
                        -{((request.current_rate || request.service.service_category.commission_rate) - request.requested_rate).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs text-gray-500">Motivatie</span>
                    <p className="text-sm text-gray-700 mt-1">{request.justification}</p>
                  </div>

                  {request.admin_notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Admin Reactie</span>
                      </div>
                      <p className="text-sm text-gray-600">{request.admin_notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Aangevraagd op: {formatDate(request.created_at)}</span>
                    {request.reviewed_at && (
                      <span>Behandeld op: {formatDate(request.reviewed_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12">
          <TrendingDown className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen commissie aanvragen</h3>
          <p className="text-gray-600 mb-4">Vraag een lagere commissie aan voor services waar je uitblinkt</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Eerste Aanvraag Maken
          </Button>
        </div>
      )}
    </div>
  );
} 