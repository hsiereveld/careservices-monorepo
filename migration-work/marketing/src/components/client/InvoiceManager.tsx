import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  FileText,
  DollarSign,
  X,
  CreditCard,
  FileCheck,
  Clock as ClockIcon,
  CheckSquare,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Invoice {
  id: string;
  invoice_number: string;
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
  payments?: InvoicePayment[];
}

interface InvoiceLineItem {
  id: string;
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

interface InvoicePayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string | null;
  notes: string | null;
}

export function InvoiceManager() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setRefreshing(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          line_items:invoice_line_items(*),
          installments:invoice_installments(*),
          payments:invoice_payments(*)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvoices(data || []);
    } catch (err: any) {
      setError('Fout bij het laden van facturen: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleInvoiceDetails = (invoiceId: string) => {
    if (expandedInvoiceId === invoiceId) {
      setExpandedInvoiceId(null);
    } else {
      setExpandedInvoiceId(invoiceId);
    }
  };

  const handlePayWithMollie = async (invoice: Invoice) => {
    if (!user) return;

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
      setProcessingPayment(false);
    }
  };

  // Filter invoices based on status
  const filteredInvoices = invoices.filter(invoice => 
    statusFilter === 'all' || invoice.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Concept';
      case 'sent': return 'Openstaand';
      case 'paid': return 'Betaald';
      case 'overdue': return 'Te laat';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  const getInstallmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getInstallmentStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Te betalen';
      case 'paid': return 'Betaald';
      case 'overdue': return 'Te laat';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  // Calculate remaining amount to pay
  const getRemainingAmount = (invoice: Invoice): number => {
    const totalPaid = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    return Math.max(0, invoice.total_amount - totalPaid);
  };

  // Get payment status display
  const getPaymentStatusDisplay = (invoice: Invoice) => {
    if (invoice.status === 'paid') {
      return (
        <div className="flex items-center space-x-2 text-green-700">
          <CheckSquare className="w-4 h-4" />
          <span>Volledig betaald</span>
        </div>
      );
    }
    
    const totalPaid = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const remainingAmount = invoice.total_amount - totalPaid;
    
    if (totalPaid > 0 && remainingAmount > 0) {
      return (
        <div className="flex items-center space-x-2 text-blue-700">
          <ClockIcon className="w-4 h-4" />
          <span>Deels betaald (€{totalPaid.toFixed(2)} van €{invoice.total_amount.toFixed(2)})</span>
        </div>
      );
    } else if (invoice.status === 'sent') {
      return (
        <div className="flex items-center space-x-2 text-blue-700">
          <ClockIcon className="w-4 h-4" />
          <span>Wacht op betaling</span>
        </div>
      );
    } else if (invoice.status === 'overdue') {
      return (
        <div className="flex items-center space-x-2 text-red-700">
          <XCircle className="w-4 h-4" />
          <span>Betaling te laat</span>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-500 mr-3" />
          <span className="text-gray-600">Facturen laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-primary-200/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary">Mijn Facturen</h3>
          <p className="text-text-secondary">Bekijk en beheer al je facturen</p>
        </div>
        <div className="relative">
          <button
            onClick={fetchInvoices}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Vernieuwen</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Payment Error Message */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{paymentError}</span>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <div className="relative">
          <Filter className="w-5 h-5 text-text-light absolute left-4 top-1/2 transform -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-primary-50 border border-primary-200 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
          >
            <option value="all">Alle facturen</option>
            <option value="sent">Openstaand</option>
            <option value="overdue">Te laat</option>
            <option value="paid">Betaald</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Invoice Header */}
              <div className="bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">Factuur #{invoice.invoice_number}</h4>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(invoice.issue_date).toLocaleDateString('nl-NL')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                      <div className="mt-1 text-sm font-medium">
                        €{invoice.total_amount.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleInvoiceDetails(invoice.id)}
                      className="p-1 text-text-light hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      {expandedInvoiceId === invoice.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedInvoiceId === invoice.id && (
                <div className="p-4 bg-white">
                  {/* Payment Status Banner */}
                  <div className={`mb-4 p-3 rounded-lg ${
                    invoice.status === 'paid' ? 'bg-green-50 border border-green-200' : 
                    invoice.status === 'overdue' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    {getPaymentStatusDisplay(invoice)}
                    
                    {/* Show payment details if there are any */}
                    {invoice.payments && invoice.payments.length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium mb-1">Betalingsgeschiedenis:</div>
                        <ul className="space-y-1">
                          {invoice.payments.map((payment, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{new Date(payment.payment_date).toLocaleDateString('nl-NL')}</span>
                              <span className="font-medium">€{payment.amount.toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Show remaining amount if not fully paid */}
                    {invoice.status !== 'paid' && getRemainingAmount(invoice) > 0 && (
                      <div className="mt-2 text-sm font-medium">
                        Nog te betalen: €{getRemainingAmount(invoice).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Invoice Details */}
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h5 className="font-medium text-text-primary mb-2">Factuurgegevens</h5>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary text-sm">Factuurnummer:</span>
                          <span className="text-text-primary text-sm">{invoice.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary text-sm">Factuurdatum:</span>
                          <span className="text-text-primary text-sm">{new Date(invoice.issue_date).toLocaleDateString('nl-NL')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary text-sm">Vervaldatum:</span>
                          <span className="text-text-primary text-sm">{new Date(invoice.due_date).toLocaleDateString('nl-NL')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary text-sm">Betalingstype:</span>
                          <span className="text-text-primary text-sm">{invoice.payment_type === 'installment' ? 'Termijnen' : 'Volledig'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-text-primary mb-2">Bedragen</h5>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-secondary text-sm">Netto bedrag:</span>
                          <span className="text-text-primary text-sm">€{invoice.net_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary text-sm">BTW bedrag:</span>
                          <span className="text-text-primary text-sm">€{invoice.vat_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-text-primary text-sm">Totaal bedrag:</span>
                          <span className="text-text-primary text-sm">€{invoice.total_amount.toFixed(2)}</span>
                        </div>
                        {invoice.payments && invoice.payments.length > 0 && (
                          <div className="flex justify-between text-green-700">
                            <span className="text-sm">Betaald:</span>
                            <span className="text-sm font-medium">€{invoice.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                          </div>
                        )}
                        {invoice.status !== 'paid' && getRemainingAmount(invoice) > 0 && (
                          <div className="flex justify-between text-blue-700 font-medium">
                            <span className="text-sm">Nog te betalen:</span>
                            <span className="text-sm">€{getRemainingAmount(invoice).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  {invoice.line_items && invoice.line_items.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-text-primary mb-2">Factuurregels</h5>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Omschrijving</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Aantal</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Prijs</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">BTW</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Totaal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {invoice.line_items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-100">
                                <td className="px-3 py-2 text-sm">{item.description}</td>
                                <td className="px-3 py-2 text-sm text-right">{item.quantity}</td>
                                <td className="px-3 py-2 text-sm text-right">€{item.unit_price.toFixed(2)}</td>
                                <td className="px-3 py-2 text-sm text-right">{item.vat_rate}%</td>
                                <td className="px-3 py-2 text-sm text-right font-medium">€{item.line_total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Installments */}
                  {invoice.payment_type === 'installment' && invoice.installments && invoice.installments.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-text-primary mb-2">Betalingstermijnen</h5>
                      <div className="space-y-3">
                        {invoice.installments.map((installment) => (
                          <div key={installment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-text-primary">Termijn {installment.installment_number}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getInstallmentStatusColor(installment.status)}`}>
                                    {getInstallmentStatusLabel(installment.status)}
                                  </span>
                                </div>
                                <div className="text-sm text-text-secondary mt-1">
                                  <span>{installment.percentage_due}% - </span>
                                  <span>€{installment.amount_due.toFixed(2)} - </span>
                                  <span>Vervaldatum: {new Date(installment.due_date).toLocaleDateString('nl-NL')}</span>
                                </div>
                              </div>
                              {installment.status === 'paid' && installment.payment_date && (
                                <div className="text-sm text-green-600">
                                  Betaald op {new Date(installment.payment_date).toLocaleDateString('nl-NL')}
                                </div>
                              )}
                              {(installment.status === 'pending' || installment.status === 'overdue') && (
                                <button
                                  onClick={() => {
                                    setSelectedInstallmentId(installment.id);
                                    handlePayWithMollie(invoice);
                                  }}
                                  disabled={processingPayment}
                                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
                                >
                                  {processingPayment && selectedInstallmentId === installment.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CreditCard className="w-4 h-4" />
                                  )}
                                  <span>Betalen</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoice PDF */}
                  {invoice.invoice_pdf_url && (
                    <div className="mt-4">
                      <h5 className="font-medium text-text-primary mb-3">Factuur</h5>
                      <a 
                        href={invoice.invoice_pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Factuur bekijken</span>
                      </a>
                    </div>
                  )}

                  {/* Payment Actions */}
                  {(invoice.status === 'sent' || invoice.status === 'overdue') && getRemainingAmount(invoice) > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-text-primary mb-3">Betaalopties</h5>
                      <button
                        onClick={() => handlePayWithMollie(invoice)}
                        disabled={processingPayment}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="animate-spin w-5 h-5" />
                            <span>Bezig met verwerken...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            <span>Betalen met Mollie</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Geen facturen gevonden</h3>
          <p className="text-text-secondary">
            {statusFilter === 'all' 
              ? 'Je hebt nog geen facturen ontvangen'
              : `Je hebt geen facturen met status "${getStatusLabel(statusFilter)}"`
            }
          </p>
        </div>
      )}
    </div>
  );
}