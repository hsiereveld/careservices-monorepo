import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  Home, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function MolliePaymentStatusPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'canceled' | 'pending' | 'unknown'>('unknown');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    
    if (id) {
      setPaymentId(id);
      checkPaymentStatus(id);
    } else {
      setLoading(false);
      setStatus('unknown');
      setError('No payment ID found in URL');
    }
  }, [location]);

  const checkPaymentStatus = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch payment transaction from database
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .select('status, invoice_id, metadata')
        .eq('payment_id', id)
        .single();
      
      if (transactionError) {
        throw new Error(`Error fetching payment transaction: ${transactionError.message}`);
      }
      
      if (!transaction) {
        throw new Error('Payment transaction not found');
      }
      
      setInvoiceId(transaction.invoice_id);
      
      // Fetch invoice details
      if (transaction.invoice_id) {
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select('invoice_number, status')
          .eq('id', transaction.invoice_id)
          .single();
        
        if (!invoiceError && invoice) {
          setInvoiceNumber(invoice.invoice_number);
          
          // If invoice is marked as paid, consider the payment successful
          if (invoice.status === 'paid') {
            setStatus('success');
            setLoading(false);
            return;
          }
        }
      }
      
      // Determine status based on transaction status
      switch (transaction.status) {
        case 'paid':
          setStatus('success');
          break;
        case 'failed':
          setStatus('failed');
          break;
        case 'canceled':
          setStatus('canceled');
          break;
        case 'pending':
        case 'open':
          setStatus('pending');
          break;
        default:
          setStatus('unknown');
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      setError(err.message);
      setStatus('unknown');
      setLoading(false);
    }
  };

  const handleRefreshStatus = () => {
    if (paymentId) {
      checkPaymentStatus(paymentId);
    }
  };

  const renderStatusContent = () => {
    switch (status) {
      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Betaling Geslaagd</h2>
            <p className="text-text-secondary mb-6">
              Je betaling is succesvol verwerkt. Bedankt voor je betaling!
            </p>
            {invoiceNumber && (
              <p className="text-text-secondary mb-6">
                Factuurnummer: <span className="font-semibold">{invoiceNumber}</span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/client-dashboard?tab=invoices"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Bekijk Facturen</span>
              </Link>
              <Link 
                href="/dashboard"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Naar Dashboard</span>
              </Link>
            </div>
          </div>
        );
      
      case 'failed':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Betaling Mislukt</h2>
            <p className="text-text-secondary mb-6">
              Er is iets misgegaan met je betaling. Probeer het opnieuw of neem contact op met onze klantenservice.
            </p>
            {invoiceNumber && (
              <p className="text-text-secondary mb-6">
                Factuurnummer: <span className="font-semibold">{invoiceNumber}</span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/client-dashboard?tab=invoices${invoiceId ? `&invoice=${invoiceId}` : ''}`}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Terug naar Facturen</span>
              </Link>
              <button
                onClick={handleRefreshStatus}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Status Vernieuwen</span>
              </button>
            </div>
          </div>
        );
      
      case 'canceled':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Betaling Geannuleerd</h2>
            <p className="text-text-secondary mb-6">
              Je hebt de betaling geannuleerd. Je kunt het later opnieuw proberen.
            </p>
            {invoiceNumber && (
              <p className="text-text-secondary mb-6">
                Factuurnummer: <span className="font-semibold">{invoiceNumber}</span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/client-dashboard?tab=invoices${invoiceId ? `&invoice=${invoiceId}` : ''}`}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Terug naar Facturen</span>
              </Link>
              <Link 
                href="/dashboard"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <Home className="w-5 h-5" />
                <span>Naar Dashboard</span>
              </Link>
            </div>
          </div>
        );
      
      case 'pending':
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Betaling in Behandeling</h2>
            <p className="text-text-secondary mb-6">
              Je betaling wordt momenteel verwerkt. Dit kan enkele minuten duren.
            </p>
            {invoiceNumber && (
              <p className="text-text-secondary mb-6">
                Factuurnummer: <span className="font-semibold">{invoiceNumber}</span>
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRefreshStatus}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Status Vernieuwen</span>
              </button>
              <Link 
                href="/client-dashboard?tab=invoices"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Bekijk Facturen</span>
              </Link>
            </div>
          </div>
        );
      
      case 'unknown':
      default:
        return (
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Status Onbekend</h2>
            <p className="text-text-secondary mb-6">
              We konden de status van je betaling niet bepalen. Controleer je e-mail voor meer informatie of neem contact op met onze klantenservice.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/client-dashboard?tab=invoices"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Bekijk Facturen</span>
              </Link>
              <button
                onClick={handleRefreshStatus}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Status Vernieuwen</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-primary-200/50">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Betalingsstatus controleren...</p>
            </div>
          ) : (
            renderStatusContent()
          )}
        </div>
        
        <div className="text-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Terug</span>
          </button>
        </div>
      </div>
    </div>
  );
}