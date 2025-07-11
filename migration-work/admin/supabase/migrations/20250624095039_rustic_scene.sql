/*
  # Email Templates System

  1. New Tables
    - `email_templates` - Stores email templates with subject, body, and metadata
  
  2. Security
    - Enable RLS on `email_templates` table
    - Add policies for admin and backoffice users
  
  3. Functionality
    - Add trigger for updating timestamp
    - Insert default email templates for various scenarios
*/

-- Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies (only if they don't exist)
DO $$
BEGIN
  -- Check if admin policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_templates' 
    AND policyname = 'Admins can manage email templates'
  ) THEN
    CREATE POLICY "Admins can manage email templates"
      ON email_templates
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
      ));
  END IF;
  
  -- Check if backoffice policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_templates' 
    AND policyname = 'BackOffice can manage email templates'
  ) THEN
    CREATE POLICY "BackOffice can manage email templates"
      ON email_templates
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'backoffice'
      ));
  END IF;
END
$$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;

-- Create trigger
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_email_templates_updated_at();

-- Insert default email templates (only if they don't exist)
DO $$
DECLARE
  template_count integer;
BEGIN
  -- Check if templates already exist
  SELECT COUNT(*) INTO template_count FROM email_templates;
  
  -- Only insert if no templates exist
  IF template_count = 0 THEN
    -- Client onboarding templates
    INSERT INTO email_templates (template_name, subject, body, description) VALUES
    ('welcome_client', 
     'Welkom bij Care & Service, {{first_name}}!', 
     '<h1>Welkom bij Care & Service Pinoso!</h1>
      <p>Beste {{first_name}},</p>
      <p>Hartelijk dank voor je registratie bij Care & Service. We zijn blij dat je deel uitmaakt van onze gemeenschap van Nederlanders en Belgen in Pinoso.</p>
      <p>Met je account kun je nu:</p>
      <ul>
        <li>Diensten boeken</li>
        <li>Je boekingen beheren</li>
        <li>Contact leggen met betrouwbare professionals</li>
      </ul>
      <p>Heb je vragen of hulp nodig? Aarzel niet om contact met ons op te nemen.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Welkomstmail voor nieuwe klanten'),

    -- Professional onboarding templates
    ('application_submitted_professional', 
     'Je aanmelding is ontvangen, {{first_name}}!', 
     '<h1>Bedankt voor je aanmelding!</h1>
      <p>Beste {{first_name}},</p>
      <p>We hebben je aanmelding als professional bij Care & Service ontvangen. Ons team zal je aanmelding zo snel mogelijk beoordelen.</p>
      <p>Je ontvangt binnen 1-3 werkdagen bericht over de status van je aanmelding.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Bevestiging van ontvangst van professional aanmelding'),

    ('application_invited_for_interview', 
     'Uitnodiging voor gesprek - Care & Service', 
     '<h1>Uitnodiging voor een gesprek</h1>
      <p>Beste {{first_name}},</p>
      <p>We zijn onder de indruk van je aanmelding en willen je graag uitnodigen voor een persoonlijk gesprek.</p>
      <p>{{interview_message}}</p>
      <p>{{interview_date}}</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Uitnodiging voor interview na positieve beoordeling van aanmelding'),

    ('application_approved_professional', 
     'Je aanmelding is goedgekeurd! Volgende stappen', 
     '<h1>Gefeliciteerd! Je bent nu een Care & Service Professional</h1>
      <p>Beste {{first_name}},</p>
      <p>We zijn verheugd je te kunnen meedelen dat je aanmelding is goedgekeurd! Je kunt nu inloggen op je account en beginnen met het aanbieden van je diensten.</p>
      <p>Volgende stappen:</p>
      <ol>
        <li>Log in op je account</li>
        <li>Vul je profiel aan</li>
        <li>Stel je beschikbaarheid in</li>
        <li>Configureer je diensten en prijzen</li>
      </ol>
      <p>We kijken ernaar uit om met je samen te werken!</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Goedkeuring van professional aanmelding'),

    ('application_rejected_professional', 
     'Update over je aanmelding bij Care & Service', 
     '<h1>Update over je aanmelding</h1>
      <p>Beste {{first_name}},</p>
      <p>Bedankt voor je interesse in Care & Service. Na zorgvuldige beoordeling van je aanmelding moeten we je helaas meedelen dat we op dit moment niet verder kunnen gaan met je aanmelding.</p>
      <p>{{rejection_reason}}</p>
      <p>We waarderen je interesse en wensen je veel succes in de toekomst.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Afwijzing van professional aanmelding'),

    -- Booking process templates (Client)
    ('booking_request_client', 
     'Bevestiging van je boekingsaanvraag - {{service_name}}', 
     '<h1>Je boekingsaanvraag is ontvangen</h1>
      <p>Beste {{first_name}},</p>
      <p>Bedankt voor je boeking van {{service_name}} op {{booking_date}} om {{booking_time}}.</p>
      <p>Je boeking heeft de status "In afwachting" en wacht op bevestiging van een professional. Je ontvangt een e-mail zodra je boeking is bevestigd.</p>
      <p>Boekingsdetails:</p>
      <ul>
        <li>Dienst: {{service_name}}</li>
        <li>Datum: {{booking_date}}</li>
        <li>Tijd: {{booking_time}}</li>
        <li>Adres: {{booking_address}}</li>
        <li>Geschatte prijs: €{{estimated_price}}</li>
      </ul>
      <p>Je kunt de status van je boeking bekijken in je dashboard.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Bevestiging van boekingsaanvraag voor klanten'),

    ('booking_confirmed_client', 
     'Je boeking is bevestigd - {{service_name}}', 
     '<h1>Je boeking is bevestigd!</h1>
      <p>Beste {{first_name}},</p>
      <p>Goed nieuws! Je boeking van {{service_name}} op {{booking_date}} om {{booking_time}} is bevestigd.</p>
      <p>Boekingsdetails:</p>
      <ul>
        <li>Dienst: {{service_name}}</li>
        <li>Datum: {{booking_date}}</li>
        <li>Tijd: {{booking_time}}</li>
        <li>Adres: {{booking_address}}</li>
        <li>Professional: {{provider_name}}</li>
        <li>Geschatte prijs: €{{estimated_price}}</li>
      </ul>
      <p>Je kunt de details van je boeking bekijken in je dashboard.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Bevestiging van boeking voor klanten'),

    ('booking_cancelled_client', 
     'Je boeking is geannuleerd - {{service_name}}', 
     '<h1>Je boeking is geannuleerd</h1>
      <p>Beste {{first_name}},</p>
      <p>Je boeking van {{service_name}} op {{booking_date}} om {{booking_time}} is geannuleerd.</p>
      <p>Reden voor annulering: {{cancellation_reason}}</p>
      <p>Als je vragen hebt of een nieuwe boeking wilt maken, kun je inloggen op je dashboard of contact met ons opnemen.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Annulering van boeking voor klanten'),

    ('booking_rescheduled_client', 
     'Je boeking is verzet - {{service_name}}', 
     '<h1>Je boeking is verzet</h1>
      <p>Beste {{first_name}},</p>
      <p>Je boeking van {{service_name}} is verzet naar een nieuwe datum/tijd.</p>
      <p>Nieuwe boekingsdetails:</p>
      <ul>
        <li>Dienst: {{service_name}}</li>
        <li>Nieuwe datum: {{new_booking_date}}</li>
        <li>Nieuwe tijd: {{new_booking_time}}</li>
        <li>Adres: {{booking_address}}</li>
        <li>Professional: {{provider_name}}</li>
      </ul>
      <p>Als deze nieuwe datum/tijd niet voor je werkt, kun je inloggen op je dashboard om de boeking aan te passen of te annuleren.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Verzetting van boeking voor klanten'),

    -- Booking process templates (Professional)
    ('new_booking_request_professional', 
     'Nieuwe boekingsaanvraag - {{service_name}}', 
     '<h1>Je hebt een nieuwe boekingsaanvraag!</h1>
      <p>Beste {{provider_name}},</p>
      <p>Je hebt een nieuwe boekingsaanvraag ontvangen voor {{service_name}}.</p>
      <p>Boekingsdetails:</p>
      <ul>
        <li>Dienst: {{service_name}}</li>
        <li>Datum: {{booking_date}}</li>
        <li>Tijd: {{booking_time}}</li>
        <li>Adres: {{booking_address}}</li>
        <li>Klant: {{client_name}}</li>
        <li>Geschatte prijs: €{{estimated_price}}</li>
      </ul>
      <p>Log in op je dashboard om deze boeking te accepteren of te weigeren. Reageer snel om de klant niet te laten wachten!</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Nieuwe boekingsaanvraag voor professionals'),

    ('booking_confirmed_professional', 
     'Boeking bevestigd - {{service_name}}', 
     '<h1>Je hebt een boeking bevestigd</h1>
      <p>Beste {{provider_name}},</p>
      <p>Je hebt de boeking voor {{service_name}} op {{booking_date}} om {{booking_time}} bevestigd.</p>
      <p>Boekingsdetails:</p>
      <ul>
        <li>Dienst: {{service_name}}</li>
        <li>Datum: {{booking_date}}</li>
        <li>Tijd: {{booking_time}}</li>
        <li>Adres: {{booking_address}}</li>
        <li>Klant: {{client_name}}</li>
        <li>Telefoonnummer klant: {{client_phone}}</li>
        <li>Geschatte prijs: €{{estimated_price}}</li>
      </ul>
      <p>Vergeet niet om de klant op de hoogte te houden van eventuele wijzigingen en om op tijd te zijn voor de afspraak.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Bevestiging van boeking voor professionals'),

    ('booking_cancelled_by_client_professional', 
     'Boeking geannuleerd door klant - {{service_name}}', 
     '<h1>Een boeking is geannuleerd door de klant</h1>
      <p>Beste {{provider_name}},</p>
      <p>De boeking voor {{service_name}} op {{booking_date}} om {{booking_time}} is geannuleerd door de klant.</p>
      <p>Reden voor annulering: {{cancellation_reason}}</p>
      <p>Deze tijd is nu weer beschikbaar in je agenda.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Annulering van boeking door klant voor professionals'),

    -- Service execution templates
    ('service_started_client', 
     'Je service is gestart - {{service_name}}', 
     '<h1>Je service is gestart</h1>
      <p>Beste {{first_name}},</p>
      <p>Je service {{service_name}} is zojuist gestart door {{provider_name}}.</p>
      <p>Als je vragen hebt, kun je direct contact opnemen met de professional op {{provider_phone}}.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Notificatie van start van service voor klanten'),

    ('service_completed_client', 
     'Je service is voltooid - {{service_name}}', 
     '<h1>Je service is voltooid</h1>
      <p>Beste {{first_name}},</p>
      <p>Je service {{service_name}} is succesvol voltooid door {{provider_name}}.</p>
      <p>We hopen dat je tevreden bent met de service. We zouden het op prijs stellen als je een review achterlaat voor {{provider_name}}.</p>
      <p><a href="{{review_link}}">Klik hier om een review achter te laten</a></p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Notificatie van voltooiing van service voor klanten'),

    ('review_received_professional', 
     'Je hebt een nieuwe review ontvangen', 
     '<h1>Je hebt een nieuwe review ontvangen!</h1>
      <p>Beste {{provider_name}},</p>
      <p>Je hebt een nieuwe review ontvangen van {{client_name}} voor de service {{service_name}} op {{booking_date}}.</p>
      <p>Rating: {{rating}}/5</p>
      <p>Review: "{{review_text}}"</p>
      <p>Goede reviews helpen je om meer klanten aan te trekken. Bedankt voor je uitstekende service!</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Notificatie van nieuwe review voor professionals'),

    -- Invoicing process templates
    ('invoice_generated_client', 
     'Nieuwe factuur - {{invoice_number}}', 
     '<h1>Je factuur is beschikbaar</h1>
      <p>Beste {{first_name}},</p>
      <p>Er is een nieuwe factuur voor je gegenereerd.</p>
      <p>Factuurdetails:</p>
      <ul>
        <li>Factuurnummer: {{invoice_number}}</li>
        <li>Datum: {{invoice_date}}</li>
        <li>Bedrag: €{{invoice_amount}}</li>
        <li>Vervaldatum: {{due_date}}</li>
      </ul>
      <p><a href="{{invoice_link}}">Bekijk en download je factuur</a></p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Notificatie van nieuwe factuur voor klanten'),

    ('payment_reminder_client', 
     'Betalingsherinnering - Factuur {{invoice_number}}', 
     '<h1>Betalingsherinnering</h1>
      <p>Beste {{first_name}},</p>
      <p>Dit is een vriendelijke herinnering dat je factuur {{invoice_number}} nog niet is betaald. De vervaldatum was {{due_date}}.</p>
      <p>Factuurdetails:</p>
      <ul>
        <li>Factuurnummer: {{invoice_number}}</li>
        <li>Datum: {{invoice_date}}</li>
        <li>Bedrag: €{{invoice_amount}}</li>
        <li>Vervaldatum: {{due_date}}</li>
      </ul>
      <p><a href="{{invoice_link}}">Bekijk en betaal je factuur</a></p>
      <p>Als je de betaling al hebt gedaan, kun je deze e-mail negeren.</p>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Betalingsherinnering voor klanten'),

    ('payment_confirmed_client', 
     'Betalingsbevestiging - Factuur {{invoice_number}}', 
     '<h1>Betaling ontvangen</h1>
      <p>Beste {{first_name}},</p>
      <p>We hebben je betaling voor factuur {{invoice_number}} ontvangen. Bedankt voor je prompte betaling.</p>
      <p>Factuurdetails:</p>
      <ul>
        <li>Factuurnummer: {{invoice_number}}</li>
        <li>Datum: {{invoice_date}}</li>
        <li>Betaald bedrag: €{{invoice_amount}}</li>
        <li>Betaaldatum: {{payment_date}}</li>
      </ul>
      <p>Met vriendelijke groet,<br>Het Care & Service Team</p>',
     'Betalingsbevestiging voor klanten');
  END IF;
END
$$;