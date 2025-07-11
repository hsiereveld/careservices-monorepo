import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  Euro,
  Calendar,
  Clock,
  User,
  FileText,
  Loader2,
  RefreshCw,
  ArrowRight,
  X,
  Save,
  DollarSign,
  Briefcase,
  Check,
  FileCheck,
  Percent,
  Calculator,
  CalendarRange,
  Building
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Payout {
  id: string;
  provider_id: string;
  payout_period_start: string;
  payout_period_end: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  provider?: {
    id: string;
    business_name: string;
    user_id: string;
    bank_account_number?: string;
    email?: string;
    phone?: string;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
  };
  line_items?: PayoutLineItem[];
}

interface PayoutLineItem {
  id: string;
  payout_id: string;
  booking_id?: string;
  invoice_id?: string;
  invoice_line_item_id?: string;
  description: string;
  amount: number;
  commission_amount: number;
  commission_percentage?: number;
  created_at: string;
  updated_at: string;
  booking?: {
    service?: {
      name: string;
    };
    booking_date: string;
  };
  invoice?: {
    invoice_number: string;
  };
}

export function PayoutsManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setperiodFilter] = useState('current_month');
  
  // Payout generation state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatingPayouts, setGeneratingPayouts] = useState(false);
  
  // Payout detail state
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showPayoutDetail, setShowPayoutDetail] = useState(false);
  
  // Mark as paid state
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchPayouts();
    
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError('');

      // First, fetch payouts with service provider data
      const { data: payoutsData, error: fetchError } = await supabase
        .from('payouts')
        .select(`
          *,
          provider:service_providers(
            id, 
            business_name, 
            user_id, 
            bank_account_number, 
            email, 
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!payoutsData || payoutsData.length === 0) {
        setPayouts([]);
        return;
      }

      // Extract unique user IDs from service providers
      const userIds = [...new Set(
        payoutsData
          .map(payout => payout.provider?.user_id)
          .filter(Boolean)
      )];

      // Fetch profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
        // Continue without profile data
      }

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }

      // Merge profile data into payouts
      const payoutsWithProfiles = payoutsData.map(payout => ({
        ...payout,
        provider: payout.provider ? {
          ...payout.provider,
          user: profilesMap.get(payout.provider.user_id) || null
        } : null
      }));

      setPayouts(payoutsWithProfiles || []);
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
      setError('Fout bij het laden van uitbetalingen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPayoutDetails = async (payoutId: string) => {
    try {
      setLoading(true);
      
      // Fetch payout with provider details
      const { data: payoutData, error: payoutError } = await supabase
        .from('payouts')
        .select(`
          *,
          provider:service_providers(
            id, 
            business_name, 
            user_id, 
            bank_account_number, 
            email, 
            phone
          )
        `)
        .eq('id', payoutId)
        .single();
        
      if (payoutError) throw payoutError;

      // Fetch profile data if provider exists
      let profileData = null;
      if (payoutData.provider?.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('id', payoutData.provider.user_id)
          .single();
          
        if (!profileError && profile) {
          profileData = profile;
        }
      }
      
      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('payout_line_items')
        .select(`
          *,
          booking:bookings(
            service:services(name),
            booking_date
          ),
          invoice:invoices(invoice_number)
        `)
        .eq('payout_id', payoutId)
        .order('created_at', { ascending: false });
        
      if (lineItemsError) throw lineItemsError;
      
      // Combine data
      const payoutWithDetails: Payout = {
        ...payoutData,
        provider: payoutData.provider ? {
          ...payoutData.provider,
          user: profileData
        } : null,
        line_items: lineItems || []
      };
      
      setSelectedPayout(payoutWithDetails);
      setShowPayoutDetail(true);
    } catch (err: any) {
      console.error('Error fetching payout details:', err);
      setError('Fout bij het laden van uitbetalingsdetails: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayouts = async () => {
    if (!startDate || !endDate) {
      setError('Selecteer een geldige periode');
      return;
    }
    
    try {
      setGeneratingPayouts(true);
      setError('');
      setSuccess('');
      
      // Call the RPC function to generate payouts
      const { data, error } = await supabase
        .rpc('generate_payouts_for_period', {
          p_start_date: startDate,
          p_end_date: endDate
        });
        
      if (error) throw error;
      
      // Count the number of payouts generated
      const payoutCount = data ? data.length : 0;
      
      if (payoutCount > 0) {
        setSuccess(`${payoutCount} uitbetalingen succesvol gegenereerd!`);
        fetchPayouts();
        setShowGenerateModal(false);
      } else {
        setSuccess('Geen nieuwe uitbetalingen gegenereerd. Mogelijk zijn er geen betaalde facturen in deze periode of zijn er al uitbetalingen gegenereerd.');
      }
    } catch (err: any) {
      console.error('Error generating payouts:', err);
      setError('Fout bij het genereren van uitbetalingen: ' + err.message);
    } finally {
      setGeneratingPayouts(false);
    }
  };
  
  const handleMarkAsPaid = async () => {
    if (!selectedPayout) return;
    
    try {
      setProcessingPayment(true);
      setError('');
      setSuccess('');
      
      // Update the payout status
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'paid',
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          notes: paymentNotes || selectedPayout.notes,
          paid_at: new Date().toISOString()
        })
        .eq('id', selectedPayout.id);
        
      if (error) throw error;
      
      setSuccess(`Uitbetaling aan ${selectedPayout.provider?.business_name || 'professional'} gemarkeerd als betaald!`);
      fetchPayouts();
      
      // Update the selected payout
      if (selectedPayout) {
        setSelectedPayout({
          ...selectedPayout,
          status: 'paid',
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
          notes: paymentNotes || selectedPayout.notes,
          paid_at: new Date().toISOString()
        });
      }
      
      setShowMarkAsPaidModal(false);
    } catch (err: any) {
      console.error('Error marking payout as paid:', err);
      setError('Fout bij het markeren als betaald: ' + err.message);
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handleExportPayouts = () => {
    // Get filtered payouts
    const dataToExport = filteredPayouts.map(payout => ({
      business_name: payout.provider?.business_name || 'Onbekend',
      professional_name: `${payout.provider?.user?.first_name || ''} ${payout.provider?.user?.last_name || ''}`.trim() || 'Onbekend',
      period_start: new Date(payout.payout_period_start).toLocaleDateString('nl-NL'),
      period_end: new Date(payout.payout_period_end).toLocaleDateString('nl-NL'),
      amount: payout.total_amount.toFixed(2),
      status: getStatusLabel(payout.status),
      payment_method: payout.payment_method || '',
      transaction_id: payout.transaction_id || '',
      paid_at: payout.paid_at ? new Date(payout.paid_at).toLocaleDateString('nl-NL') : '',
      created_at: new Date(payout.created_at).toLocaleDateString('nl-NL')
    }));
    
    // Convert to CSV
    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(obj => Object.values(obj).map(value => `"${value}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uitbetalingen_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter payouts based on search and status
  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      (payout.provider?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payout.provider?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payout.provider?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payout.provider?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (payout.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'In afwachting';
      case 'processing': return 'In verwerking';
      case 'paid': return 'Betaald';
      case 'failed': return 'Mislukt';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Uitbetalingen</h2>
          <p className="text-gray-600">Beheer uitbetalingen aan professionals</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Uitbetalingen Genereren</span>
          </button>
          {filteredPayouts.length > 0 && (
            <button
              onClick={handleExportPayouts}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exporteren</span>
            </button>
          )}
        </div>
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
            placeholder="Zoek op professional, bedrijfsnaam of transactie ID..."
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
            <option value="pending">In afwachting</option>
            <option value="processing">In verwerking</option>
            <option value="paid">Betaald</option>
            <option value="failed">Mislukt</option>
            <option value="cancelled">Geannuleerd</option>
          </select>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
          </div>
        ) : filteredPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professional</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bedrag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betaaldatum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{payout.provider?.business_name || 'Onbekend'}</div>
                          <div className="text-sm text-gray-500">
                            {payout.provider?.user?.first_name} {payout.provider?.user?.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payout.payout_period_start).toLocaleDateString('nl-NL')} - {new Date(payout.payout_period_end).toLocaleDateString('nl-NL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">€{payout.total_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(payout.status)}`}>
                        {getStatusLabel(payout.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.paid_at ? new Date(payout.paid_at).toLocaleDateString('nl-NL') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => fetchPayoutDetails(payout.id)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Details bekijken"
                        >
                          <FileText className="h-5 w-5" />
                        </button>
                        {payout.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowMarkAsPaidModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Markeren als betaald"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {payouts.length === 0 ? 'Geen uitbetalingen gevonden' : 'Geen uitbetalingen gevonden met huidige filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {payouts.length === 0 
                ? 'Er zijn nog geen uitbetalingen gegenereerd'
                : 'Probeer je zoekfilters aan te passen'
              }
            </p>
            {payouts.length === 0 && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Uitbetalingen Genereren</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Generate Payouts Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Uitbetalingen Genereren
                </h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Uitbetalingen Genereren</h4>
                      <p className="text-sm text-blue-700">
                        Dit proces genereert uitbetalingen voor alle professionals die betaalde facturen hebben in de geselecteerde periode.
                        Uitbetalingen worden alleen gegenereerd voor professionals die nog geen uitbetaling hebben voor deze periode.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Startdatum
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Einddatum
                    </label>
                    <div className="relative">
                      <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">Let op</h4>
                      <p className="text-sm text-yellow-700">
                        Alleen facturen met status 'betaald' worden meegenomen in de berekening.
                        Zorg ervoor dat alle facturen voor deze periode correct zijn verwerkt voordat je uitbetalingen genereert.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleGeneratePayouts}
                    disabled={generatingPayouts || !startDate || !endDate}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {generatingPayouts ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Genereren...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Uitbetalingen Genereren</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Detail Modal */}
      {showPayoutDetail && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Uitbetaling Details
                </h3>
                <button
                  onClick={() => setShowPayoutDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Payout Header */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Professional Informatie</h4>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Building className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Bedrijfsnaam</p>
                          <p className="text-sm text-gray-600">{selectedPayout.provider?.business_name || 'Onbekend'}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <User className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Contactpersoon</p>
                          <p className="text-sm text-gray-600">
                            {selectedPayout.provider?.user?.first_name} {selectedPayout.provider?.user?.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Bankrekening</p>
                          <p className="text-sm text-gray-600">{selectedPayout.provider?.bank_account_number || 'Niet ingesteld'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Uitbetaling Informatie</h4>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <CalendarRange className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Periode</p>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedPayout.payout_period_start).toLocaleDateString('nl-NL')} - {new Date(selectedPayout.payout_period_end).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Euro className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Totaalbedrag</p>
                          <p className="text-sm text-gray-600">€{selectedPayout.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Status</p>
                          <p className="text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(selectedPayout.status)}`}>
                              {getStatusLabel(selectedPayout.status)}
                            </span>
                          </p>
                        </div>
                      </div>
                      {selectedPayout.status === 'paid' && selectedPayout.paid_at && (
                        <div className="flex items-start space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Betaald op</p>
                            <p className="text-sm text-gray-600">{new Date(selectedPayout.paid_at).toLocaleDateString('nl-NL')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Uitbetaling Details</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Omschrijving</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bedrag</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Commissie</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Commissie %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPayout.line_items && selectedPayout.line_items.length > 0 ? (
                          selectedPayout.line_items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-100">
                              <td className="px-4 py-2 text-sm">{item.description}</td>
                              <td className="px-4 py-2 text-sm text-right">€{item.amount.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-right">€{item.commission_amount.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-right">{item.commission_percentage?.toFixed(2) || '-'}%</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-2 text-sm text-center text-gray-500">
                              Geen details beschikbaar
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td className="px-4 py-2 text-sm font-medium">Totaal</td>
                          <td className="px-4 py-2 text-sm font-medium text-right">€{selectedPayout.total_amount.toFixed(2)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Payment Information */}
                {selectedPayout.status === 'paid' && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-3">Betalingsinformatie</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-green-800">Betaalmethode</p>
                        <p className="text-sm text-green-700">{selectedPayout.payment_method || 'Niet gespecificeerd'}</p>
                      </div>
                      {selectedPayout.transaction_id && (
                        <div>
                          <p className="text-sm font-medium text-green-800">Transactie ID</p>
                          <p className="text-sm text-green-700">{selectedPayout.transaction_id}</p>
                        </div>
                      )}
                      {selectedPayout.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-green-800">Notities</p>
                          <p className="text-sm text-green-700">{selectedPayout.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  {selectedPayout.status === 'pending' && (
                    <button
                      onClick={() => setShowMarkAsPaidModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Markeren als Betaald</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowPayoutDetail(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showMarkAsPaidModal && selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Markeren als Betaald
                </h3>
                <button
                  onClick={() => setShowMarkAsPaidModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Uitbetaling Bevestigen</h4>
                      <p className="text-sm text-blue-700">
                        Je staat op het punt om een uitbetaling van <span className="font-semibold">€{selectedPayout.total_amount.toFixed(2)}</span> aan <span className="font-semibold">{selectedPayout.provider?.business_name}</span> te markeren als betaald.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betaalmethode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="bank_transfer">Bankoverschrijving</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Contant</option>
                    <option value="other">Anders</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transactie ID (optioneel)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Bijv. bankreferentie of PayPal ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notities (optioneel)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-20 resize-none"
                    placeholder="Voeg eventuele notities toe over deze betaling..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowMarkAsPaidModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={processingPayment}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Verwerken...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Bevestigen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Status Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Uitbetalingen Module - Implementatie Status</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Automatische berekening van uitbetalingen aan professionals</p>
              <p className="text-sm text-gray-600">
                Uitbetalingen worden automatisch berekend op basis van betaalde facturen in de geselecteerde periode.
                De commissie wordt afgetrokken van het factuurbedrag om het uit te betalen bedrag te bepalen.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Overzicht van te betalen bedragen per professional</p>
              <p className="text-sm text-gray-600">
                Alle uitbetalingen worden overzichtelijk weergegeven met details over de professional, periode en bedrag.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Uitbetalingsgeschiedenis bijhouden</p>
              <p className="text-sm text-gray-600">
                Alle uitbetalingen worden bijgehouden met hun status en betalingsgegevens.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Exporteren van uitbetalingsoverzichten</p>
              <p className="text-sm text-gray-600">
                Uitbetalingen kunnen worden geëxporteerd naar CSV-formaat voor verdere verwerking.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Betalingsbewijzen genereren</p>
              <p className="text-sm text-gray-600">
                Deze functionaliteit is in ontwikkeling. Binnenkort kun je betalingsbewijzen genereren voor professionals.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Integratie met banksystemen voor automatische uitbetaling</p>
              <p className="text-sm text-gray-600">
                Deze functionaliteit is in ontwikkeling. Binnenkort kun je uitbetalingen automatisch verwerken via integratie met banksystemen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for Info icon
function Info(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}