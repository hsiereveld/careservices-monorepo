import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  CreditCard,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InvoiceEditModal } from './InvoiceEditModal';

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
  booking?: {
    service?: {
      name: string;
    };
    booking_date: string;
  };
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

export function InvoicingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch invoices with line items and installments
      const { data: invoicesData, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          line_items:invoice_line_items(
            *,
            booking:bookings!booking_id(
              service:services!service_id(name),
              booking_date
            )
          ),
          installments:invoice_installments(*)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!invoicesData || invoicesData.length === 0) {
        setInvoices([]);
        return;
      }

      // Get unique client IDs
      const clientIds = [...new Set(invoicesData.map(invoice => invoice.client_id))];

      // Fetch client profiles and user emails separately
      const [profilesResponse, usersResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', clientIds),
        supabase
          .from('admin_user_emails')
          .select('id, email')
          .in('id', clientIds)
      ]);

      if (profilesResponse.error) {
        console.warn('Could not fetch profiles:', profilesResponse.error);
      }

      if (usersResponse.error) {
        console.warn('Could not fetch user emails:', usersResponse.error);
      }

      // Create lookup maps
      const profilesMap = new Map();
      const usersMap = new Map();

      if (profilesResponse.data) {
        profilesResponse.data.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      if (usersResponse.data) {
        usersResponse.data.forEach(user => {
          usersMap.set(user.id, user);
        });
      }

      // Combine invoice data with customer information
      const enrichedInvoices = invoicesData.map(invoice => ({
        ...invoice,
        customer: {
          first_name: profilesMap.get(invoice.client_id)?.first_name || '',
          last_name: profilesMap.get(invoice.client_id)?.last_name || '',
          email: usersMap.get(invoice.client_id)?.email || ''
        }
      }));

      setInvoices(enrichedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      // Get the invoice to show in confirmation dialog
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Confirmation dialog based on status
      let confirmed = false;
      if (newStatus === 'sent') {
        confirmed = window.confirm(`Weet je zeker dat je factuur ${invoice.invoice_number} wilt verzenden?`);
      } else if (newStatus === 'paid') {
        confirmed = window.confirm(`Weet je zeker dat je factuur ${invoice.invoice_number} als betaald wilt markeren?`);
      } else {
        confirmed = window.confirm(`Weet je zeker dat je de status van factuur ${invoice.invoice_number} wilt wijzigen naar ${getStatusLabel(newStatus)}?`);
      }
      
      if (!confirmed) return;
      
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus,
          payment_date: newStatus === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', invoiceId);

      if (error) throw error;

      // Add status history entry
      const { error: historyError } = await supabase
        .from('invoice_status_history')
        .insert({
          invoice_id: invoiceId,
          old_status: invoice.status,
          new_status: newStatus,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          change_reason: `Handmatig bijgewerkt door beheerder`
        });
        
      if (historyError) {
        console.error('Error adding status history:', historyError);
        // Continue even if history entry fails
      }

      setSuccess(`Factuur ${invoice.invoice_number} status bijgewerkt naar ${getStatusLabel(newStatus)}`);
      await fetchInvoices();
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update invoice status');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateMolliePayment = async (invoice: Invoice) => {
    try {
      setProcessingPayment(true);
      setPaymentError(null);

      // Call the Supabase Edge Function to initiate a Mollie payment
      const { data, error } = await supabase.functions.invoke('initiate-mollie-payment', {
        body: {
          invoice_id: invoice.id,
          amount: invoice.total_amount,
          currency: 'EUR',
          description: `Factuur ${invoice.invoice_number}`,
          return_url: `${window.location.origin}/payment-status`
        }
      });

      if (error) {
        throw new Error(`Error initiating payment: ${error.message}`);
      }

      if (!data.success || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      // Redirect to Mollie checkout page
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error('Error initiating Mollie payment:', err);
      setPaymentError(err instanceof Error ? err.message : 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Concept';
      case 'sent': return 'Verzonden';
      case 'paid': return 'Betaald';
      case 'overdue': return 'Te laat';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <Trash2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const getClientName = (invoice: Invoice) => {
    if (invoice.customer?.first_name || invoice.customer?.last_name) {
      return `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim();
    }
    return invoice.customer?.email || 'Unknown Client';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Facturatie</h2>
          <p className="text-text-secondary">Beheer facturen en betalingen</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>Vernieuwen</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <button
                onClick={fetchInvoices}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Error Message */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
              <div className="mt-2 text-sm text-red-700">{paymentError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Totaal Facturen</p>
              <p className="text-3xl font-bold text-text-primary">{invoices.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Totaal Omzet</p>
              <p className="text-3xl font-bold text-text-primary">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Betaalde Facturen</p>
              <p className="text-3xl font-bold text-text-primary">
                {invoices.filter(inv => inv.status === 'paid').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Te laat</p>
              <p className="text-3xl font-bold text-text-primary">
                {invoices.filter(inv => inv.status === 'overdue').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factuur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bedrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vervaldatum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(invoice.issue_date)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getClientName(invoice)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.customer?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Netto: {formatCurrency(invoice.net_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      <span className="ml-1 capitalize">{getStatusLabel(invoice.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formatDate(invoice.due_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* View Button */}
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Bekijken"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Bewerken"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {/* Send Button - Only for draft invoices */}
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateInvoiceStatus(invoice.id, 'sent')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Verzenden"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Mark as Paid Button - Only for sent or overdue invoices */}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <button
                          onClick={() => handleUpdateInvoiceStatus(invoice.id, 'paid')}
                          className="text-green-600 hover:text-green-900"
                          title="Markeren als betaald"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* PDF Download Button - Only if PDF URL exists */}
                      {invoice.invoice_pdf_url && (
                        <a
                          href={invoice.invoice_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first invoice.
          </p>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Invoice Details - {selectedInvoice.invoice_number}
              </h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                  <p className="text-sm text-gray-600">{getClientName(selectedInvoice)}</p>
                  <p className="text-sm text-gray-600">{selectedInvoice.customer?.email}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Invoice Information</h4>
                  <p className="text-sm text-gray-600">Issue Date: {formatDate(selectedInvoice.issue_date)}</p>
                  <p className="text-sm text-gray-600">Due Date: {formatDate(selectedInvoice.due_date)}</p>
                  <p className="text-sm text-gray-600">Status: <span className="capitalize">{selectedInvoice.status}</span></p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Line Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.line_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.vat_rate}%</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-600">Net Amount:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedInvoice.net_amount)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm text-gray-600">VAT Amount:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedInvoice.vat_amount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t font-medium">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(selectedInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Installments (if applicable) */}
              {selectedInvoice.payment_type === 'installment' && selectedInvoice.installments && selectedInvoice.installments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Payment Installments</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Installment</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedInvoice.installments.map((installment) => (
                          <tr key={installment.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">#{installment.installment_number}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(installment.amount_due)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatDate(installment.due_date)}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(installment.status)}`}>
                                {installment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-4">
                <div className="flex space-x-3">
                  {/* Status Action Buttons */}
                  {selectedInvoice.status === 'draft' && (
                    <button
                      onClick={() => {
                        handleUpdateInvoiceStatus(selectedInvoice.id, 'sent');
                        setShowInvoiceModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Verzenden</span>
                      </div>
                    </button>
                  )}
                  
                  {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue') && (
                    <button
                      onClick={() => {
                        handleUpdateInvoiceStatus(selectedInvoice.id, 'paid');
                        setShowInvoiceModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Markeren als Betaald</span>
                      </div>
                    </button>
                  )}
                  
                  {/* PDF Download Button */}
                  {selectedInvoice.invoice_pdf_url && (
                    <a
                      href={selectedInvoice.invoice_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </div>
                    </a>
                  )}
                  
                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setShowInvoiceModal(false);
                      handleEditInvoice(selectedInvoice);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Edit className="h-4 w-4" />
                      <span>Bewerken</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Edit Modal */}
      {showEditModal && selectedInvoice && (
        <InvoiceEditModal 
          invoice={selectedInvoice}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}

