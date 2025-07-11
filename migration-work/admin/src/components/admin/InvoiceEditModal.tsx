import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  User, 
  DollarSign, 
  Loader2,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  vat_amount: number;
  net_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_date: string | null;
  invoice_pdf_url: string | null;
  notes: string | null;
  payment_type: 'full' | 'installment';
  parent_booking_id: string | null;
  line_items?: InvoiceLineItem[];
  installments?: InvoiceInstallment[];
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
  booking_id: string | null;
}

interface InvoiceInstallment {
  id: string;
  installment_number: number;
  percentage_due: number;
  amount_due: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date: string | null;
}

interface Client {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface InvoiceEditModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSave: () => void;
}

export function InvoiceEditModal({ invoice, onClose, onSave }: InvoiceEditModalProps) {
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoice_number: '',
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_amount: 0,
    vat_amount: 0,
    net_amount: 0,
    status: 'draft',
    notes: '',
    payment_type: 'full'
  });
  
  const [lineItems, setLineItems] = useState<Partial<InvoiceLineItem>[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchClients();
    
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        total_amount: invoice.total_amount,
        vat_amount: invoice.vat_amount,
        net_amount: invoice.net_amount,
        status: invoice.status,
        notes: invoice.notes || '',
        payment_type: invoice.payment_type,
        parent_booking_id: invoice.parent_booking_id
      });
      
      if (invoice.line_items) {
        setLineItems(invoice.line_items);
      }
    }
  }, [invoice]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
        
      if (profilesError) throw profilesError;
      
      // Fetch emails from admin_user_emails view
      const { data: emails, error: emailsError } = await supabase
        .from('admin_user_emails')
        .select('id, email');
        
      if (emailsError) throw emailsError;
      
      // Combine the data
      const clientsData = profiles?.map(profile => {
        const email = emails?.find(e => e.id === profile.id)?.email || '';
        return {
          id: profile.id,
          email,
          first_name: profile.first_name,
          last_name: profile.last_name
        };
      }) || [];
      
      setClients(clientsData);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError('Error fetching clients: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Recalculate line total
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : updatedItems[index].unit_price;
      updatedItems[index].line_total = quantity * unitPrice;
    }
    
    setLineItems(updatedItems);
    recalculateTotals(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: 21,
        line_total: 0
      }
    ]);
  };

  const removeLineItem = (index: number) => {
    const updatedItems = [...lineItems];
    updatedItems.splice(index, 1);
    setLineItems(updatedItems);
    recalculateTotals(updatedItems);
  };

  const recalculateTotals = (items: Partial<InvoiceLineItem>[]) => {
    const total = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const vatAmount = items.reduce((sum, item) => {
      const lineTotal = item.line_total || 0;
      const vatRate = item.vat_rate || 21;
      return sum + (lineTotal * vatRate / (100 + vatRate));
    }, 0);
    const netAmount = total - vatAmount;
    
    setFormData(prev => ({
      ...prev,
      total_amount: total,
      vat_amount: vatAmount,
      net_amount: netAmount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      if (!invoice) {
        throw new Error('No invoice to update');
      }
      
      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          invoice_number: formData.invoice_number,
          client_id: formData.client_id,
          issue_date: formData.issue_date,
          due_date: formData.due_date,
          total_amount: formData.total_amount,
          vat_amount: formData.vat_amount,
          net_amount: formData.net_amount,
          status: formData.status,
          notes: formData.notes,
          payment_type: formData.payment_type
        })
        .eq('id', invoice.id);
        
      if (invoiceError) throw invoiceError;
      
      // Update line items
      // First, delete existing line items
      const { error: deleteError } = await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', invoice.id);
        
      if (deleteError) throw deleteError;
      
      // Then insert new line items
      if (lineItems.length > 0) {
        const lineItemsToInsert = lineItems.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          line_total: item.line_total,
          booking_id: item.booking_id
        }));
        
        const { error: insertError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsToInsert);
          
        if (insertError) throw insertError;
      }
      
      // Add status history entry if status changed
      if (formData.status !== invoice.status) {
        const { error: historyError } = await supabase
          .from('invoice_status_history')
          .insert({
            invoice_id: invoice.id,
            old_status: invoice.status,
            new_status: formData.status,
            changed_by: (await supabase.auth.getUser()).data.user?.id,
            change_reason: 'Manual update by admin'
          });
          
        if (historyError) {
          console.error('Error adding status history:', historyError);
          // Continue even if history entry fails
        }
      }
      
      setSuccess('Factuur succesvol bijgewerkt!');
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (err: any) {
      console.error('Error updating invoice:', err);
      setError('Error updating invoice: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusOptions = () => {
    return [
      { value: 'draft', label: 'Concept' },
      { value: 'sent', label: 'Verzonden' },
      { value: 'paid', label: 'Betaald' },
      { value: 'overdue', label: 'Te laat' },
      { value: 'cancelled', label: 'Geannuleerd' }
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary-500" />
            {invoice ? 'Factuur Bewerken' : 'Nieuwe Factuur'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factuurnummer
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klant
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Selecteer een klant</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name} ({client.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Factuurdatum
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vervaldatum
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                {getStatusOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Betalingstype
            </label>
            <select
              value={formData.payment_type}
              onChange={(e) => setFormData({ ...formData, payment_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="full">Volledige betaling</option>
              <option value="installment">Termijnbetaling</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notities
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium text-gray-900">Factuurregels</h4>
              <button
                type="button"
                onClick={addLineItem}
                className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nieuwe Regel
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              {lineItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Geen factuurregels. Klik op 'Nieuwe Regel' om er een toe te voegen.</p>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Omschrijving"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Aantal"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.unit_price || ''}
                          onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Prijs"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          value={item.vat_rate || ''}
                          onChange={(e) => handleLineItemChange(index, 'vat_rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="BTW %"
                          min="0"
                          max="100"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {formatCurrency(item.line_total || 0)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Netto Bedrag:</span>
                  <span className="text-sm font-medium">{formatCurrency(formData.net_amount || 0)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">BTW Bedrag:</span>
                  <span className="text-sm font-medium">{formatCurrency(formData.vat_amount || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-medium">
                  <span>Totaal Bedrag:</span>
                  <span>{formatCurrency(formData.total_amount || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Opslaan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Opslaan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}