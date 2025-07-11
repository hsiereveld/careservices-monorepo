import { supabase } from '../lib/supabase';

/**
 * Send an email using the Supabase Edge Function and Resend
 * 
 * @param templateName The name of the email template to use
 * @param to The recipient email address
 * @param data An object containing data to replace placeholders in the template
 * @returns A promise that resolves to the result of the email sending operation
 */
export async function sendEmail(
  templateName: string,
  to: string,
  data: Record<string, any>
): Promise<{ success: boolean; error?: string; details?: string }> {
  try {
    // Call the Supabase Edge Function
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        templateName,
        to,
        data
      }
    });

    if (error) {
      console.error('Error calling send-email function:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Er is een fout opgetreden bij het verzenden van de e-mail';
      let details = error.message;
      
      if (error.message?.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = 'E-mail service configuratie probleem';
        details = 'De e-mail service is niet correct geconfigureerd. Controleer of de RESEND_API_KEY en andere benodigde secrets zijn ingesteld in de Supabase Edge Function instellingen.';
      } else if (error.message?.includes('FunctionsRelayError')) {
        errorMessage = 'E-mail service niet beschikbaar';
        details = 'De e-mail service is momenteel niet beschikbaar. Probeer het later opnieuw.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Netwerkfout';
        details = 'Er is een netwerkfout opgetreden. Controleer je internetverbinding en probeer opnieuw.';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: details
      };
    }

    // Check if the result indicates success
    if (result && !result.success) {
      console.error('Email sending failed:', result.error);
      
      let errorMessage = 'E-mail kon niet worden verzonden';
      let details = result.error;
      
      // Handle specific error cases from the Edge Function
      if (result.error?.includes('RESEND_API_KEY')) {
        errorMessage = 'E-mail service niet geconfigureerd';
        details = 'De RESEND_API_KEY is niet ingesteld. Neem contact op met de beheerder.';
      } else if (result.error?.includes('Template not found')) {
        errorMessage = 'E-mailtemplate niet gevonden';
        details = `De template "${templateName}" bestaat niet in de database.`;
      } else if (result.error?.includes('User not found')) {
        errorMessage = 'Ontvanger niet gevonden';
        details = 'Het opgegeven e-mailadres of gebruiker bestaat niet.';
      } else if (result.error?.includes('Failed to send email via Resend')) {
        errorMessage = 'E-mail service fout';
        details = 'Er is een fout opgetreden bij de externe e-mail service. Probeer het later opnieuw.';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: details
      };
    }

    return { success: true, ...result };
  } catch (err: any) {
    console.error('Error sending email:', err);
    
    let errorMessage = 'Onverwachte fout';
    let details = err.message;
    
    if (err.name === 'TypeError' && err.message?.includes('fetch')) {
      errorMessage = 'Verbindingsfout';
      details = 'Kan geen verbinding maken met de e-mail service. Controleer je internetverbinding.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: details
    };
  }
}

/**
 * Test the email service by sending a test email
 * 
 * @param to The recipient email address
 * @returns A promise that resolves to the result of the test
 */
async function testEmailService(to: string): Promise<{ success: boolean; error?: string; details?: string }> {
  try {
    const testData = {
      first_name: 'Test',
      last_name: 'Gebruiker',
      service_name: 'Test Service',
      booking_date: new Date().toLocaleDateString('nl-NL'),
      booking_time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      site_name: 'Care & Service Pinoso',
      contact_email: 'info@care-service-pinoso.com'
    };

    // First check if the welcome_client template exists, if not use a generic test
    const result = await sendEmail('welcome_client', to, testData);
    
    if (!result.success && result.error?.includes('Template not found')) {
      // If welcome_client template doesn't exist, try to send a basic test email
      return {
        success: false,
        error: 'Test e-mail template niet gevonden',
        details: 'Er is geen "welcome_client" template gevonden in de database. Maak eerst een e-mailtemplate aan om de service te kunnen testen.'
      };
    }
    
    return result;
  } catch (err: any) {
    console.error('Error testing email service:', err);
    return { 
      success: false, 
      error: 'Fout bij het testen van e-mail service',
      details: err.message
    };
  }
}