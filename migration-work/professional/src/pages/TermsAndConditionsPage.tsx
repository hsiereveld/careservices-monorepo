import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, FileText, AlertTriangle, HelpCircle } from 'lucide-react';

export function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Algemene Voorwaarden
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Lees onze algemene voorwaarden voor het gebruik van de diensten van Care & Service Pinoso
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Algemene Voorwaarden</h2>
              <p className="text-text-secondary">Laatst bijgewerkt: 1 juli 2025</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-text-secondary">
            <p>
              Welkom bij Care & Service Pinoso. Deze algemene voorwaarden zijn van toepassing op het gebruik van onze diensten en platform. 
              Door gebruik te maken van onze diensten, gaat u akkoord met deze voorwaarden.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">1. Definities</h3>
            <ul className="space-y-2">
              <li><strong>Platform:</strong> De website en applicatie van Care & Service Pinoso.</li>
              <li><strong>Diensten:</strong> Alle diensten die via het platform worden aangeboden.</li>
              <li><strong>Gebruiker:</strong> Iedereen die het platform gebruikt, inclusief klanten en professionals.</li>
              <li><strong>Klant:</strong> Een gebruiker die diensten afneemt via het platform.</li>
              <li><strong>Professional:</strong> Een gebruiker die diensten aanbiedt via het platform.</li>
              <li><strong>Overeenkomst:</strong> De overeenkomst tussen Care & Service Pinoso en de gebruiker.</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">2. Toepasselijkheid</h3>
            <p>
              Deze algemene voorwaarden zijn van toepassing op alle overeenkomsten tussen Care & Service Pinoso en gebruikers van het platform, 
              tenzij uitdrukkelijk schriftelijk anders is overeengekomen.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">3. Dienstverlening</h3>
            <p>
              Care & Service Pinoso biedt een platform waarop klanten en professionals met elkaar in contact kunnen komen voor het aanbieden en afnemen van diensten. 
              Care & Service Pinoso is geen partij bij de overeenkomst die tussen klant en professional tot stand komt.
            </p>
            <p>
              Care & Service Pinoso streeft ernaar om de kwaliteit van de aangeboden diensten te waarborgen, maar kan niet garanderen dat alle diensten aan de verwachtingen voldoen.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">4. Registratie en Account</h3>
            <p>
              Om gebruik te maken van het platform, moet u zich registreren en een account aanmaken. U bent verantwoordelijk voor het geheimhouden van uw inloggegevens 
              en voor alle activiteiten die via uw account plaatsvinden.
            </p>
            <p>
              U garandeert dat de informatie die u bij registratie verstrekt volledig, juist en actueel is. Care & Service Pinoso behoudt zich het recht voor 
              om accounts te weigeren of te verwijderen zonder opgaaf van redenen.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">5. Verplichtingen van de Gebruiker</h3>
            <p>
              Als gebruiker van het platform verplicht u zich om:
            </p>
            <ul className="space-y-2">
              <li>Het platform niet te gebruiken voor illegale doeleinden;</li>
              <li>Geen inbreuk te maken op de rechten van anderen;</li>
              <li>Geen schade toe te brengen aan het platform of aan andere gebruikers;</li>
              <li>Geen valse of misleidende informatie te verstrekken;</li>
              <li>De privacy van andere gebruikers te respecteren.</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">6. Verplichtingen van Professionals</h3>
            <p>
              Als professional verplicht u zich daarnaast om:
            </p>
            <ul className="space-y-2">
              <li>Diensten aan te bieden waarvoor u gekwalificeerd bent;</li>
              <li>Afspraken met klanten na te komen;</li>
              <li>Diensten uit te voeren volgens de overeengekomen voorwaarden;</li>
              <li>Klanten met respect te behandelen;</li>
              <li>Alle toepasselijke wet- en regelgeving na te leven.</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">7. Verplichtingen van Klanten</h3>
            <p>
              Als klant verplicht u zich daarnaast om:
            </p>
            <ul className="space-y-2">
              <li>Afspraken met professionals na te komen;</li>
              <li>Tijdig te betalen voor afgenomen diensten;</li>
              <li>Professionals met respect te behandelen;</li>
              <li>Correcte en volledige informatie te verstrekken voor het uitvoeren van diensten.</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">8. Prijzen en Betalingen</h3>
            <p>
              Alle prijzen op het platform zijn in euro's en inclusief BTW, tenzij anders vermeld. Betalingen worden verwerkt via het platform 
              en Care & Service Pinoso houdt een commissie in op betalingen aan professionals.
            </p>
            <p>
              Klanten zijn verplicht om de volledige prijs van de dienst te betalen, ook als de dienst niet aan de verwachtingen voldoet, 
              tenzij er sprake is van ernstige tekortkomingen.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">9. Annuleringsbeleid</h3>
            <p>
              Annuleringen moeten minimaal 24 uur voor de geplande dienst worden doorgegeven. Bij latere annulering kan de volledige prijs in rekening worden gebracht.
            </p>
            <p>
              Professionals kunnen diensten annuleren in geval van overmacht, maar dienen dit zo snel mogelijk te melden aan de klant en aan Care & Service Pinoso.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">10. Aansprakelijkheid</h3>
            <p>
              Care & Service Pinoso is niet aansprakelijk voor schade die voortvloeit uit het gebruik van het platform of de via het platform aangeboden diensten, 
              tenzij er sprake is van opzet of grove nalatigheid van Care & Service Pinoso.
            </p>
            <p>
              De aansprakelijkheid van Care & Service Pinoso is in alle gevallen beperkt tot het bedrag dat in het betreffende geval door de verzekeraar wordt uitgekeerd.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">11. Intellectuele Eigendom</h3>
            <p>
              Alle intellectuele eigendomsrechten met betrekking tot het platform en de inhoud daarvan berusten bij Care & Service Pinoso of haar licentiegevers.
            </p>
            <p>
              Het is niet toegestaan om inhoud van het platform te kopiëren, te wijzigen, te verspreiden of te gebruiken voor commerciële doeleinden zonder 
              voorafgaande schriftelijke toestemming van Care & Service Pinoso.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">12. Privacy</h3>
            <p>
              Care & Service Pinoso verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG). 
              Voor meer informatie verwijzen wij naar onze privacyverklaring.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">13. Wijzigingen</h3>
            <p>
              Care & Service Pinoso behoudt zich het recht voor om deze algemene voorwaarden te wijzigen. Wijzigingen worden via het platform bekendgemaakt 
              en treden in werking 30 dagen na bekendmaking.
            </p>
            <p>
              Als u het platform blijft gebruiken na wijziging van de algemene voorwaarden, gaat u akkoord met de gewijzigde voorwaarden.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">14. Toepasselijk Recht en Geschillen</h3>
            <p>
              Op alle overeenkomsten tussen Care & Service Pinoso en gebruikers is Nederlands recht van toepassing.
            </p>
            <p>
              Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement waar Care & Service Pinoso gevestigd is, 
              tenzij de wet dwingend anders voorschrijft.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">15. Contact</h3>
            <p>
              Als u vragen heeft over deze algemene voorwaarden, kunt u contact opnemen met Care & Service Pinoso via:
            </p>
            <p>
              E-mail: h.siereveld@gmail.com<br />
              Telefoon: +31 (0)6-34339304<br />
              Adres: Torenlaant 5B, 1402 AT Bussum, Nederland
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-primary-50 rounded-2xl p-6 border border-primary-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-primary-700">Uw Privacy</h3>
            </div>
            <p className="text-primary-700 mb-4">
              Wij nemen uw privacy serieus en verwerken uw gegevens volgens de AVG. Lees onze privacyverklaring voor meer informatie.
            </p>
            <Link 
              href="/privacy"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-2"
            >
              <span>Privacyverklaring lezen</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-700">Vragen?</h3>
            </div>
            <p className="text-blue-700 mb-4">
              Heeft u vragen over onze algemene voorwaarden of andere zaken? Neem gerust contact met ons op.
            </p>
            <Link 
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <span>Contact opnemen</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Terug naar home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}