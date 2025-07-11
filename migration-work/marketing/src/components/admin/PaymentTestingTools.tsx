import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle, Loader2, Info, RefreshCw, Database, Play, Table as Tabs, CreditCard as CreditCardIcon, Globe, ArrowRight, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Tabs as RadixTabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

export function PaymentTestingTools() {
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [invoiceGenerationResult, setInvoiceGenerationResult] = useState<any>(null);
  const [invoiceGenerationLoading, setInvoiceGenerationLoading] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingId, setBookingId] = useState<string>('');
  
  // Mollie test payment state
  const [mollieTestAmount, setMollieTestAmount] = useState<number>(10);
  const [mollieTestInvoiceId, setMollieTestInvoiceId] = useState<string>('');
  const [mollieTestLoading, setMollieTestLoading] = useState(false);
  const [mollieTestResult, setMollieTestResult] = useState<any>(null);
  const [mollieTestError, setMollieTestError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  // Worldline test payment state
  const [worldlineTestAmount, setWorldlineTestAmount] = useState<number>(10);
  const [worldlineTestInvoiceId, setWorldlineTestInvoiceId] = useState<string>('');
  const [worldlineTestLoading, setWorldlineTestLoading] = useState(false);
  const [worldlineTestResult, setWorldlineTestResult] = useState<any>(null);
  const [worldlineTestError, setWorldlineTestError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentBookings();
    fetchRecentInvoices();
  }, []);

  const fetchRecentBookings = async () => {
    try {
      setLoadingBookings(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          service_id,
          customer_id,
          booking_date,
          booking_time,
          status,
          estimated_price,
          service:services(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentBookings(data || []);
    } catch (err) {
      console.error('Error fetching recent bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };
  
  const fetchRecentInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setMollieTestInvoiceId(data[0].id);
        setWorldlineTestInvoiceId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching recent invoices:', err);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!bookingId) {
      setError('Selecteer eerst een boeking');
      return;
    }

    try {
      setInvoiceGenerationLoading(true);
      setError('');
      setSuccess('');
      setInvoiceGenerationResult(null);

      // Call the RPC function to generate an invoice
      const { data, error: invoiceError } = await supabase
        .rpc('generate_invoice_from_booking', { p_booking_id: bookingId });

      if (invoiceError) throw invoiceError;

      // Fetch the generated invoice details
      const { data: invoiceData, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          line_items:invoice_line_items(*)
        `)
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      setInvoiceGenerationResult(invoiceData);
      setInvoiceId(data);
      setInvoiceNumber(invoiceData.invoice_number);
      setSuccess(`Factuur succesvol gegenereerd met ID: ${data}`);
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      setError(`Fout bij het genereren van factuur: ${err.message}`);
    } finally {
      setInvoiceGenerationLoading(false);
    }
  };

  const handleCreateInstallments = async () => {
    if (!invoiceGenerationResult) {
      setError('Genereer eerst een factuur');
      return;
    }

    try {
      setInvoiceGenerationLoading(true);
      setError('');
      setSuccess('');

      // Get the booking date for the invoice
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('booking_date, booking_time')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Create a Date object from booking date and time
      const bookingDate = new Date(bookingData.booking_date);
      if (bookingData.booking_time) {
        const [hours, minutes] = bookingData.booking_time.split(':').map(Number);
        bookingDate.setHours(hours, minutes);
      }

      // Generate 50/50 installments
      const { error: installmentError } = await supabase
        .rpc('generate_booking_confirmation_installments', { 
          p_invoice_id: invoiceGenerationResult.id,
          p_booking_date: bookingDate.toISOString()
        });

      if (installmentError) throw installmentError;

      // Refresh invoice data to include installments
      const { data: updatedInvoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          line_items:invoice_line_items(*),
          installments:invoice_installments(*)
        `)
        .eq('id', invoiceGenerationResult.id)
        .single();

      if (invoiceError) throw invoiceError;

      setInvoiceGenerationResult(updatedInvoiceData);
      setSuccess('Betalingstermijnen succesvol aangemaakt!');
    } catch (err: any) {
      console.error('Error creating installments:', err);
      setError(`Fout bij het aanmaken van betalingstermijnen: ${err.message}`);
    } finally {
      setInvoiceGenerationLoading(false);
    }
  };

  const handleUpdateInvoiceStatus = async (status: string) => {
    if (!invoiceGenerationResult) {
      setError('Genereer eerst een factuur');
      return;
    }

    try {
      setInvoiceGenerationLoading(true);
      setError('');
      setSuccess('');

      // Update invoice status
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceGenerationResult.id);

      if (error) throw error;

      // Refresh invoice data
      const { data: updatedInvoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          line_items:invoice_line_items(*),
          installments:invoice_installments(*)
        `)
        .eq('id', invoiceGenerationResult.id)
        .single();

      if (invoiceError) throw invoiceError;

      setInvoiceGenerationResult(updatedInvoiceData);
      setSuccess(`Factuurstatus succesvol bijgewerkt naar ${status}!`);
    } catch (err: any) {
      console.error('Error updating invoice status:', err);
      setError(`Fout bij het bijwerken van factuurstatus: ${err.message}`);
    } finally {
      setInvoiceGenerationLoading(false);
    }
  };
  
  const handleTestMolliePayment = async () => {
    if (!mollieTestInvoiceId) {
      setMollieTestError('Selecteer een factuur ID');
      return;
    }
    
    if (!mollieTestAmount || mollieTestAmount <= 0) {
      setMollieTestError('Voer een geldig bedrag in (groter dan 0)');
      return;
    }
    
    try {
      setMollieTestLoading(true);
      setMollieTestError(null);
      setMollieTestResult(null);
      
      // Call the test-mollie-payment Edge Function
      const { data, error } = await supabase.functions.invoke('test-mollie-payment', {
        body: {
          invoice_id: mollieTestInvoiceId,
          amount: mollieTestAmount,
          currency: 'EUR',
          description: `Test betaling voor factuur`,
          return_url: `${window.location.origin}/payment-status`
        }
      });
      
      if (error) {
        throw new Error(`Error initiating test payment: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate test payment');
      }
      
      setMollieTestResult(data);
      setSuccess('Test betaling succesvol geïnitieerd!');
    } catch (err: any) {
      console.error('Error testing Mollie payment:', err);
      setMollieTestError(err.message);
    } finally {
      setMollieTestLoading(false);
    }
  };
  
  const handleTestWorldlinePayment = async () => {
    if (!worldlineTestInvoiceId) {
      setWorldlineTestError('Selecteer een factuur ID');
      return;
    }
    
    if (!worldlineTestAmount || worldlineTestAmount <= 0) {
      setWorldlineTestError('Voer een geldig bedrag in (groter dan 0)');
      return;
    }
    
    try {
      setWorldlineTestLoading(true);
      setWorldlineTestError(null);
      setWorldlineTestResult(null);
      
      // Call the test-worldline-payment Edge Function
      const { data, error } = await supabase.functions.invoke('test-worldline-payment', {
        body: {
          invoice_id: worldlineTestInvoiceId,
          amount: worldlineTestAmount,
          currency: 'EUR',
          return_url: `${window.location.origin}/payment-status`
        }
      });
      
      if (error) {
        throw new Error(`Error initiating test payment: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initiate test payment');
      }
      
      setWorldlineTestResult(data);
      setSuccess('Test betaling succesvol geïnitieerd!');
    } catch (err: any) {
      console.error('Error testing Worldline payment:', err);
      setWorldlineTestError(err.message);
    } finally {
      setWorldlineTestLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Betalingstesten</h3>
            <p className="text-gray-600">Test de betalingsintegratie en factuurprocessen</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <RadixTabs defaultValue="invoice">
        <TabsList className="w-full bg-gray-100 p-1 rounded-lg mb-4">
          <TabsTrigger value="invoice" className="flex-1 py-2 rounded-md">
            <div className="flex items-center justify-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Factuur Generatie</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="mollie" className="flex-1 py-2 rounded-md">
            <div className="flex items-center justify-center space-x-2">
              <CreditCardIcon className="w-4 h-4" />
              <span>Mollie Betalingen</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="worldline" className="flex-1 py-2 rounded-md">
            <div className="flex items-center justify-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Worldline Betalingen</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoice">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Invoice Generation Testing */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Factuur Generatie Testen</h4>
                  <p className="text-sm text-gray-600">Test het genereren van facturen bij boekingsbevestiging</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Factuur Generatie Debugger</h5>
                    <p className="text-sm text-blue-700">
                      Deze tool helpt bij het testen en debuggen van het factuurgenereringsproces dat wordt geactiveerd 
                      wanneer een boeking wordt bevestigd. Selecteer een boeking en genereer handmatig een factuur om het proces te testen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecteer een boeking
                </label>
                <div className="relative">
                  <select
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Selecteer een boeking --</option>
                    {recentBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.service?.name} - {new Date(booking.booking_date).toLocaleDateString()} - €{booking.estimated_price}
                      </option>
                    ))}
                  </select>
                  {loadingBookings && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={fetchRecentBookings}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Vernieuwen</span>
                  </button>
                </div>
              </div>

              {/* Generate Invoice Button */}
              <button
                onClick={handleGenerateInvoice}
                disabled={!bookingId || invoiceGenerationLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 mb-4"
              >
                {invoiceGenerationLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Bezig...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Genereer Factuur</span>
                  </>
                )}
              </button>

              {/* Invoice Generation Result */}
              {invoiceGenerationResult && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Gegenereerde Factuur</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Factuur ID:</span>
                      <span className="font-medium">{invoiceGenerationResult.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Factuurnummer:</span>
                      <span className="font-medium">{invoiceGenerationResult.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{invoiceGenerationResult.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Totaalbedrag:</span>
                      <span className="font-medium">€{invoiceGenerationResult.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Betalingstype:</span>
                      <span className="font-medium">{invoiceGenerationResult.payment_type}</span>
                    </div>
                  </div>

                  {/* Line Items */}
                  {invoiceGenerationResult.line_items && invoiceGenerationResult.line_items.length > 0 && (
                    <div className="mt-4">
                      <h6 className="font-medium text-gray-900 mb-2">Factuurregels</h6>
                      <div className="bg-gray-50 rounded-lg p-2">
                        {invoiceGenerationResult.line_items.map((item: any) => (
                          <div key={item.id} className="text-sm">
                            <div className="flex justify-between">
                              <span>{item.description}</span>
                              <span>€{item.line_total.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} x €{item.unit_price.toFixed(2)} (BTW: {item.vat_rate}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Installments */}
                  {invoiceGenerationResult.installments && invoiceGenerationResult.installments.length > 0 && (
                    <div className="mt-4">
                      <h6 className="font-medium text-gray-900 mb-2">Betalingstermijnen</h6>
                      <div className="bg-gray-50 rounded-lg p-2 space-y-2">
                        {invoiceGenerationResult.installments.map((installment: any) => (
                          <div key={installment.id} className="text-sm">
                            <div className="flex justify-between">
                              <span>Termijn {installment.installment_number}</span>
                              <span>€{installment.amount_due.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {installment.percentage_due}% - Vervaldatum: {new Date(installment.due_date).toLocaleDateString()}
                              - Status: {installment.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {invoiceGenerationResult.payment_type !== 'installment' && (
                      <button
                        onClick={handleCreateInstallments}
                        disabled={invoiceGenerationLoading}
                        className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Maak Betalingstermijnen
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateInvoiceStatus('sent')}
                      disabled={invoiceGenerationLoading || invoiceGenerationResult.status === 'sent'}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Markeer als Verzonden
                    </button>
                    <button
                      onClick={() => handleUpdateInvoiceStatus('paid')}
                      disabled={invoiceGenerationLoading || invoiceGenerationResult.status === 'paid'}
                      className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Markeer als Betaald
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Database Debugging Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Database Debugging</h4>
                  <p className="text-sm text-gray-600">Bekijk en debug database functies voor facturen en betalingen</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-800 mb-2">Factuur Generatie Proces</h5>
                    <p className="text-sm text-green-700 mb-2">
                      Wanneer een boeking wordt bevestigd, wordt het volgende proces geactiveerd:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-sm text-green-700">
                      <li>De functie <code>auto_generate_invoice_on_booking_confirmation</code> wordt aangeroepen</li>
                      <li>Er wordt een nieuwe factuur aangemaakt met status 'draft'</li>
                      <li>Er wordt een factuurlijn toegevoegd met de boekingsgegevens</li>
                      <li>De functie <code>generate_booking_confirmation_installments</code> wordt aangeroepen om betalingstermijnen aan te maken</li>
                      <li>De factuurstatus wordt bijgewerkt naar 'sent'</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Belangrijke Database Functies</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <code className="font-mono text-purple-600">generate_invoice_from_booking(booking_id)</code>
                      <p className="text-gray-600 mt-1">Genereert een factuur voor een boeking</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <code className="font-mono text-purple-600">generate_booking_confirmation_installments(invoice_id, booking_date)</code>
                      <p className="text-gray-600 mt-1">Maakt 50/50 betalingstermijnen aan voor een factuur</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <code className="font-mono text-purple-600">mark_installment_as_paid(installment_id, payment_method, transaction_id, notes)</code>
                      <p className="text-gray-600 mt-1">Markeert een betalingstermijn als betaald</p>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Gerelateerde Tabellen</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">invoices</div>
                      <p className="text-gray-600 mt-1">Hoofdtabel voor facturen</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">invoice_line_items</div>
                      <p className="text-gray-600 mt-1">Factuurregels met details over diensten</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">invoice_installments</div>
                      <p className="text-gray-600 mt-1">Betalingstermijnen voor facturen</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">payment_transactions</div>
                      <p className="text-gray-600 mt-1">Betalingstransacties</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="mollie">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCardIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Mollie Betalingen Testen</h4>
                <p className="text-sm text-gray-600">Test het Mollie betalingsproces zonder echte betalingen te doen</p>
              </div>
            </div>
            
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Mollie Test Betalingen</h5>
                  <p className="text-sm text-blue-700">
                    Deze tool simuleert het Mollie betalingsproces. Het genereert een test betaling en redirect URL 
                    die je kunt gebruiken om het volledige betalingsproces te testen, inclusief de webhook en redirect flow.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mollie Test Error */}
            {mollieTestError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700">{mollieTestError}</span>
              </div>
            )}
            
            {/* Test Payment Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Factuur ID
                </label>
                <select
                  value={mollieTestInvoiceId}
                  onChange={(e) => setMollieTestInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Selecteer een factuur --</option>
                  {invoiceGenerationResult && (
                    <option value={invoiceGenerationResult.id}>
                      {invoiceGenerationResult.invoice_number} (Zojuist gegenereerd)
                    </option>
                  )}
                  {/* Fetch and display recent invoices */}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrag (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={mollieTestAmount}
                  onChange={(e) => setMollieTestAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleTestMolliePayment}
                disabled={mollieTestLoading || !mollieTestInvoiceId || mollieTestAmount <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {mollieTestLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Bezig...</span>
                  </>
                ) : (
                  <>
                    <CreditCardIcon className="w-5 h-5" />
                    <span>Test Mollie Betaling</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Test Payment Result */}
            {mollieTestResult && (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h5 className="font-medium text-green-800 mb-2">Test Betaling Geïnitieerd</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Payment ID:</span>
                    <span className="font-medium text-green-800">{mollieTestResult.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Test Modus:</span>
                    <span className="font-medium text-green-800">{mollieTestResult.testMode ? 'Ja' : 'Nee'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Checkout URL:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-green-800 truncate max-w-xs">{mollieTestResult.checkoutUrl}</span>
                      <button 
                        onClick={() => copyToClipboard(mollieTestResult.checkoutUrl)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <a 
                    href={mollieTestResult.checkoutUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Ga naar Checkout</span>
                  </a>
                </div>
              </div>
            )}
            
            {/* Mollie Test Instructions */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Hoe te testen</h5>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
                <li>Selecteer een factuur ID (of genereer eerst een factuur in de "Factuur Generatie" tab)</li>
                <li>Voer een bedrag in</li>
                <li>Klik op "Test Mollie Betaling"</li>
                <li>Klik op de gegenereerde checkout URL om naar de Mollie betaalpagina te gaan</li>
                <li>Volg de instructies op de Mollie testpagina om de betaling te simuleren</li>
                <li>Je wordt teruggeleid naar de payment-status pagina</li>
                <li>De webhook wordt automatisch aangeroepen om de betaling te verwerken</li>
              </ol>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="worldline">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Worldline Betalingen Testen</h4>
                <p className="text-sm text-gray-600">Test het Worldline betalingsproces zonder echte betalingen te doen</p>
              </div>
            </div>
            
            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-medium text-purple-800 mb-2">Worldline Test Betalingen</h5>
                  <p className="text-sm text-purple-700">
                    Deze tool simuleert het Worldline betalingsproces. Het genereert een test betaling en redirect URL 
                    die je kunt gebruiken om het volledige betalingsproces te testen, inclusief de webhook en redirect flow.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Worldline Test Error */}
            {worldlineTestError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700">{worldlineTestError}</span>
              </div>
            )}
            
            {/* Test Payment Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Factuur ID
                </label>
                <select
                  value={worldlineTestInvoiceId}
                  onChange={(e) => setWorldlineTestInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">-- Selecteer een factuur --</option>
                  {invoiceGenerationResult && (
                    <option value={invoiceGenerationResult.id}>
                      {invoiceGenerationResult.invoice_number} (Zojuist gegenereerd)
                    </option>
                  )}
                  {/* Fetch and display recent invoices */}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrag (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={worldlineTestAmount}
                  onChange={(e) => setWorldlineTestAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <button
                onClick={handleTestWorldlinePayment}
                disabled={worldlineTestLoading || !worldlineTestInvoiceId || worldlineTestAmount <= 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {worldlineTestLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Bezig...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    <span>Test Worldline Betaling</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Test Payment Result */}
            {worldlineTestResult && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h5 className="font-medium text-purple-800 mb-2">Test Betaling Geïnitieerd</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Payment ID:</span>
                    <span className="font-medium text-purple-800">{worldlineTestResult.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Test Modus:</span>
                    <span className="font-medium text-purple-800">{worldlineTestResult.testMode ? 'Ja' : 'Nee'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700">Redirect URL:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-purple-800 truncate max-w-xs">{worldlineTestResult.redirectUrl}</span>
                      <button 
                        onClick={() => copyToClipboard(worldlineTestResult.redirectUrl)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <a 
                    href={worldlineTestResult.redirectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Ga naar Betaalpagina</span>
                  </a>
                </div>
              </div>
            )}
            
            {/* Worldline Test Instructions */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Hoe te testen</h5>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
                <li>Selecteer een factuur ID (of genereer eerst een factuur in de "Factuur Generatie" tab)</li>
                <li>Voer een bedrag in</li>
                <li>Klik op "Test Worldline Betaling"</li>
                <li>Klik op de gegenereerde redirect URL om naar de gesimuleerde betaalpagina te gaan</li>
                <li>Je wordt teruggeleid naar de payment-status pagina</li>
                <li>De webhook wordt automatisch aangeroepen om de betaling te verwerken</li>
              </ol>
            </div>
          </div>
        </TabsContent>
      </RadixTabs>
    </div>
  );
}