import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, FileText, AlertTriangle, HelpCircle, Lock, Eye, Database, Server } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-accent to-primary-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Privacyverklaring
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            Hoe wij omgaan met uw persoonlijke gegevens bij Care & Service Pinoso
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Privacyverklaring</h2>
              <p className="text-text-secondary">Laatst bijgewerkt: 1 juli 2025</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-text-secondary">
            <p>
              Bij Care & Service Pinoso hechten wij grote waarde aan de bescherming van uw persoonsgegevens. 
              In deze privacyverklaring willen we heldere en transparante informatie geven over hoe wij omgaan met uw persoonsgegevens.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">1. Wie zijn wij</h3>
            <p>
              Care & Service Pinoso is een initiatief van HS Management & Beheer BV, gevestigd aan Torenlaant 5B, 1402 AT Bussum, Nederland. 
              Wij zijn verantwoordelijk voor de verwerking van persoonsgegevens zoals weergegeven in deze privacyverklaring.
            </p>
            <p>
              Contactgegevens:<br />
              E-mail: h.siereveld@gmail.com<br />
              Telefoon: +31 (0)6-34339304<br />
              KvK: 32171536<br />
              BTW: NL822369680B01
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">2. Welke gegevens verzamelen wij</h3>
            <p>
              Wij verwerken uw persoonsgegevens doordat u gebruik maakt van onze diensten en/of omdat u deze zelf aan ons verstrekt. 
              Hieronder vindt u een overzicht van de persoonsgegevens die wij verwerken:
            </p>
            <ul className="space-y-2">
              <li>Voor- en achternaam</li>
              <li>Geboortedatum</li>
              <li>Adresgegevens</li>
              <li>Telefoonnummer</li>
              <li>E-mailadres</li>
              <li>IP-adres</li>
              <li>Gegevens over uw activiteiten op onze website</li>
              <li>Bankrekeningnummer (alleen voor professionals)</li>
              <li>BTW-nummer (alleen voor professionals)</li>
              <li>KvK-nummer (alleen voor professionals)</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">3. Waarom verzamelen wij deze gegevens</h3>
            <p>
              Care & Service Pinoso verwerkt uw persoonsgegevens voor de volgende doelen:
            </p>
            <ul className="space-y-2">
              <li>Het afhandelen van uw betaling</li>
              <li>U te kunnen bellen of e-mailen indien dit nodig is om onze dienstverlening uit te kunnen voeren</li>
              <li>U te informeren over wijzigingen van onze diensten en producten</li>
              <li>Om diensten bij u af te leveren</li>
              <li>Het matchen van klanten en professionals</li>
              <li>Het verwerken en uitbetalen van vergoedingen aan professionals</li>
              <li>Care & Service Pinoso analyseert uw gedrag op de website om daarmee de website te verbeteren</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">4. Hoe lang bewaren wij uw gegevens</h3>
            <p>
              Care & Service Pinoso bewaart uw persoonsgegevens niet langer dan strikt nodig is om de doelen te realiseren waarvoor uw gegevens worden verzameld. 
              Wij hanteren de volgende bewaartermijnen:
            </p>
            <ul className="space-y-2">
              <li><strong>Accountgegevens:</strong> Zolang uw account actief is plus 2 jaar na de laatste activiteit</li>
              <li><strong>Boekingsgegevens:</strong> 7 jaar (wettelijke fiscale bewaartermijn)</li>
              <li><strong>Betalingsgegevens:</strong> 7 jaar (wettelijke fiscale bewaartermijn)</li>
              <li><strong>Communicatie:</strong> 2 jaar na het laatste contact</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">5. Delen van persoonsgegevens met derden</h3>
            <p>
              Care & Service Pinoso deelt uw persoonsgegevens met verschillende derden als dit noodzakelijk is voor het uitvoeren van de overeenkomst 
              en om te voldoen aan een eventuele wettelijke verplichting. Met bedrijven die uw gegevens verwerken in onze opdracht, sluiten wij een 
              verwerkersovereenkomst om te zorgen voor eenzelfde niveau van beveiliging en vertrouwelijkheid van uw gegevens.
            </p>
            <p>
              Wij delen gegevens met de volgende categorieën derden:
            </p>
            <ul className="space-y-2">
              <li>Betalingsdienstverleners (voor het verwerken van betalingen)</li>
              <li>Hostingproviders (voor het hosten van onze website en database)</li>
              <li>E-mailproviders (voor het verzenden van e-mails)</li>
              <li>Professionals (alleen de gegevens die nodig zijn voor het uitvoeren van de dienst)</li>
              <li>Klanten (alleen de gegevens die nodig zijn voor het ontvangen van de dienst)</li>
            </ul>
            <p>
              Care & Service Pinoso verkoopt uw gegevens niet aan derden en verstrekt deze uitsluitend indien dit nodig is voor de uitvoering van onze 
              overeenkomst met u of om te voldoen aan een wettelijke verplichting.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">6. Cookies en vergelijkbare technieken</h3>
            <p>
              Care & Service Pinoso gebruikt functionele, analytische en tracking cookies. Een cookie is een klein tekstbestand dat bij het eerste bezoek 
              aan deze website wordt opgeslagen in de browser van uw computer, tablet of smartphone. Care & Service Pinoso gebruikt cookies met een puur 
              technische functionaliteit. Deze zorgen ervoor dat de website naar behoren werkt en dat bijvoorbeeld uw voorkeursinstellingen onthouden worden.
            </p>
            <p>
              U kunt zich afmelden voor cookies door uw internetbrowser zo in te stellen dat deze geen cookies meer opslaat. Daarnaast kunt u ook alle 
              informatie die eerder is opgeslagen via de instellingen van uw browser verwijderen.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">7. Gegevens inzien, aanpassen of verwijderen</h3>
            <p>
              U heeft het recht om uw persoonsgegevens in te zien, te corrigeren of te verwijderen. Daarnaast heeft u het recht om uw eventuele toestemming 
              voor de gegevensverwerking in te trekken of bezwaar te maken tegen de verwerking van uw persoonsgegevens door Care & Service Pinoso en heeft u 
              het recht op gegevensoverdraagbaarheid. Dat betekent dat u bij ons een verzoek kunt indienen om de persoonsgegevens die wij van u beschikken 
              in een computerbestand naar u of een ander, door u genoemde organisatie, te sturen.
            </p>
            <p>
              U kunt een verzoek tot inzage, correctie, verwijdering, gegevensoverdraging van uw persoonsgegevens of verzoek tot intrekking van uw toestemming 
              of bezwaar op de verwerking van uw persoonsgegevens sturen naar h.siereveld@gmail.com.
            </p>
            <p>
              Om er zeker van te zijn dat het verzoek tot inzage door u is gedaan, vragen wij u een kopie van uw identiteitsbewijs met het verzoek mee te sturen. 
              Maak in deze kopie uw pasfoto, MRZ (machine readable zone, de strook met nummers onderaan het paspoort), paspoortnummer en Burgerservicenummer (BSN) zwart. 
              Dit ter bescherming van uw privacy. We reageren zo snel mogelijk, maar binnen vier weken, op uw verzoek.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">8. Hoe wij persoonsgegevens beveiligen</h3>
            <p>
              Care & Service Pinoso neemt de bescherming van uw gegevens serieus en neemt passende maatregelen om misbruik, verlies, onbevoegde toegang, 
              ongewenste openbaarmaking en ongeoorloofde wijziging tegen te gaan. Als u de indruk heeft dat uw gegevens niet goed beveiligd zijn of er 
              aanwijzingen zijn van misbruik, neem dan contact op via h.siereveld@gmail.com.
            </p>
            <p>
              Wij hebben de volgende maatregelen genomen om uw persoonsgegevens te beveiligen:
            </p>
            <ul className="space-y-2">
              <li>Beveiligingssoftware, zoals een virusscanner en firewall</li>
              <li>TLS (voorheen SSL) - Wij versturen uw gegevens via een beveiligde internetverbinding</li>
              <li>DKIM, SPF en DMARC - Dit zijn drie internetstandaarden die wij gebruiken om te voorkomen dat u uit onze naam e-mails ontvangt die virussen bevatten, spam zijn of bedoeld zijn om persoonlijke (inlog)gegevens te bemachtigen</li>
              <li>Wachtwoordbeleid - Wij hanteren strenge eisen aan wachtwoorden</li>
              <li>Toegangsbeperking - Alleen geautoriseerde medewerkers hebben toegang tot persoonsgegevens</li>
              <li>Verwerkersovereenkomsten - Met alle derde partijen die uw gegevens verwerken hebben wij verwerkersovereenkomsten afgesloten</li>
            </ul>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">9. Wijzigingen in deze privacyverklaring</h3>
            <p>
              Wij kunnen deze privacyverklaring van tijd tot tijd wijzigen. Wijzigingen zullen op onze website worden gepubliceerd. 
              Het is daarom aan te raden om deze privacyverklaring geregeld te raadplegen, zodat u van deze wijzigingen op de hoogte bent.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">10. Klachten</h3>
            <p>
              Mocht u een klacht hebben over de verwerking van uw persoonsgegevens, dan vragen wij u hierover direct contact met ons op te nemen. 
              Komen wij er samen met u niet uit, dan vinden wij dit natuurlijk erg vervelend. U heeft altijd het recht een klacht in te dienen bij 
              de Autoriteit Persoonsgegevens, dit is de toezichthoudende autoriteit op het gebied van privacybescherming.
            </p>

            <h3 className="text-xl font-bold text-text-primary mt-8 mb-4">11. Contact</h3>
            <p>
              Als u vragen heeft over deze privacyverklaring, kunt u contact opnemen met Care & Service Pinoso via:
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
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-700">Transparantie</h3>
            </div>
            <p className="text-blue-700 mb-4">
              Wij streven naar volledige transparantie over hoe wij met uw gegevens omgaan. Heeft u vragen over specifieke verwerkingen? Neem gerust contact met ons op.
            </p>
            <Link 
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <span>Contact opnemen</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-700">Uw Rechten</h3>
            </div>
            <p className="text-green-700 mb-4">
              U heeft verschillende rechten met betrekking tot uw persoonsgegevens, waaronder het recht op inzage, correctie en verwijdering.
            </p>
            <Link 
              href="/algemene-voorwaarden"
              className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-2"
            >
              <span>Algemene voorwaarden lezen</span>
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