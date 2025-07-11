"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import Header from "../components/Header";
import FooterSection from "../components/FooterSection";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hier zou je de form data kunnen versturen naar je backend
    console.log("Form submitted:", formData);
    alert("Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-background-primary min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Contact</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-100">
            Heb je vragen of wil je meer informatie? Neem gerust contact met ons op. 
            We helpen je graag verder!
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-primary-600 mb-8">Stuur ons een bericht</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                      Naam *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Jouw naam"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="jouw@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                    Telefoonnummer
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+31 6 12345678"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-text-primary mb-2">
                    Onderwerp *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Kies een onderwerp</option>
                    <option value="dienst-boeken">Dienst boeken</option>
                    <option value="dienstverlener-worden">Dienstverlener worden</option>
                    <option value="algemene-vraag">Algemene vraag</option>
                    <option value="klacht">Klacht</option>
                    <option value="anders">Anders</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                    Bericht *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Vertel ons hoe we je kunnen helpen..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-primary-700 transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Verstuur bericht
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-primary-600 mb-8">Contactgegevens</h2>
              <div className="space-y-8">
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-secondary-500 mb-1">E-mail</h3>
                    <p className="text-text-primary">info@careservicepinoso.com</p>
                    <p className="text-text-primary">support@careservicepinoso.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-secondary-500 mb-1">Telefoon</h3>
                    <p className="text-text-primary">+34 965 123 456</p>
                    <p className="text-text-primary">+31 6 12345678 (WhatsApp)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-secondary-500 mb-1">Adres</h3>
                    <p className="text-text-primary">Calle Mayor 123</p>
                    <p className="text-text-primary">03650 Pinoso, Alicante</p>
                    <p className="text-text-primary">Spanje</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold text-secondary-500 mb-1">Openingstijden</h3>
                    <p className="text-text-primary">Maandag - Vrijdag: 9:00 - 18:00</p>
                    <p className="text-text-primary">Zaterdag: 10:00 - 14:00</p>
                    <p className="text-text-primary">Zondag: Gesloten</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-12 p-6 bg-background-accent rounded-xl">
                <h3 className="text-xl font-bold text-secondary-500 mb-4">Noodgevallen</h3>
                <p className="text-text-primary mb-4">
                  Voor spoedgevallen buiten kantooruren, bel ons direct:
                </p>
                <p className="text-lg font-bold text-primary-600">+34 965 123 456</p>
                <p className="text-sm text-text-primary mt-2">
                  We zijn 24/7 beschikbaar voor urgente situaties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-background-accent">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary-600 text-center mb-12">Veelgestelde vragen</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-secondary-500 mb-2">Hoe snel kan ik een dienst boeken?</h3>
              <p className="text-text-primary">De meeste diensten kunnen binnen 24 uur worden ingepland. Voor spoedgevallen proberen we binnen 2-4 uur iemand te vinden.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-secondary-500 mb-2">Zijn alle dienstverleners Nederlandstalig?</h3>
              <p className="text-text-primary">Ja, alle dienstverleners spreken Nederlands. Sommigen spreken ook Spaans voor lokale communicatie.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-secondary-500 mb-2">Hoe worden dienstverleners geverifieerd?</h3>
              <p className="text-text-primary">Alle dienstverleners ondergaan een uitgebreide screening inclusief identiteitscontrole, referenties en een persoonlijk gesprek.</p>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
