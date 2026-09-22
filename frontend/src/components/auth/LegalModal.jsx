import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Scale } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy' | 'notices'
  const [legalLang, setLegalLang] = useState('fr'); // 'fr' | 'en'
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
              {legalLang === 'fr' ? 'Cadre Légal & Confidentialité' : 'Legal Terms & Privacy'}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Lang switcher within modal */}
            <div className="flex bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLegalLang('fr')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  legalLang === 'fr'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLegalLang('en')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  legalLang === 'en'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'terms'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{legalLang === 'fr' ? "Conditions d'Utilisation" : 'Terms of Use'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'privacy'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{legalLang === 'fr' ? 'Confidentialité (RGPD)' : 'Privacy (GDPR)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notices')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'notices'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{legalLang === 'fr' ? 'Mentions Légales' : 'Legal Notices'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto text-xs sm:text-sm text-stone-600 dark:text-stone-300 space-y-4 leading-relaxed flex-1">
          {/* TERMS OF USE */}
          {activeTab === 'terms' && (
            legalLang === 'fr' ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                  1. Objet et Présentation du Service
                </h4>
                <p>
                  <strong>MyFolio</strong> est une application web conçue pour la gestion visuelle de collections organisées sous forme de livres interactifs, permettant de cataloguer, taguer et classifier des objets et produits avec une expérience fluide et sans publicité.
                </p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  2. Acceptation et Accès au Service
                </h4>
                <p>
                  L'accès à MyFolio et la création d'un compte utilisateur impliquent l'acceptation expresse et sans réserve des présentes Conditions Générales d'Utilisation. L'utilisateur s'engage à fournir des informations véridiques et à maintenir la confidentialité de son mot de passe.
                </p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  3. Propriété Intellectuelle et Données
                </h4>
                <p>
                  L'utilisateur conserve la pleine propriété de tous les contenus, images et descriptions qu'il importe dans ses collections. MyFolio ne revendique aucun droit sur vos données personnelles ni sur vos créations.
                </p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  4. Disponibilité et Responsabilité
                </h4>
                <p>
                  Le service est fourni en l'état. Tout est mis en œuvre pour garantir une disponibilité maximale et la sauvegarde sécurisée de vos collections.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                  1. Purpose & Service Overview
                </h4>
                <p>
                  <strong>MyFolio</strong> is a web application designed for visual collection management organized as interactive books, enabling users to catalog, tag, and sort elements and products with an intuitive and ad-free experience.
                </p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  2. Acceptance & Account Access
                </h4>
                <p>
                  Creating an account and using MyFolio implies full and unreserved acceptance of these Terms of Use. Users agree to provide truthful information and safeguard their account credentials.
                </p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  3. Intellectual Property & Content
                </h4>
                <p>
                  You retain full ownership of all collection data, notes, and pictures you upload into your books. MyFolio claims no ownership over your personal data.
                </p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  4. Availability
                </h4>
                <p>
                  The service is provided on an "as is" basis with high reliability and secure cloud-hosted data storage.
                </p>
              </div>
            )
          )}

          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            legalLang === 'fr' ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                  1. Données Personnelles Collectées
                </h4>
                <p>Nous limitons la collecte aux informations strictement indispensables :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Adresse e-mail</strong> : utilisée exclusivement pour l'authentification et la récupération de mot de passe.</li>
                  <li><strong>Nom d'affichage</strong> : utilisé pour personnaliser l'accueil dans l'application.</li>
                  <li><strong>Mot de passe</strong> : systématiquement chiffré et salé via l'algorithme <code>bcrypt</code>. Il n'est jamais lisible en clair.</li>
                </ul>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200">
                  <strong>🔒 Engagement Zéro Spam, Zéro Monétisation :</strong> Vos données ne sont jamais vendues, louées ou transmises à des tiers, ni utilisées pour des campagnes publicitaires.
                </div>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  2. Vos Droits RGPD
                </h4>
                <p>
                  Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'exportation et de suppression définitive de vos données personnelles et de l'ensemble de vos collections à tout moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                  1. Personal Data Collected
                </h4>
                <p>We collect only the strictly necessary information:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Email Address</strong>: Used solely for authentication and password recovery.</li>
                  <li><strong>Display Name</strong>: Used to personalize your welcome greeting in the app.</li>
                  <li><strong>Password</strong>: Systematically hashed with <code>bcrypt</code> and never stored in plain text.</li>
                </ul>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200">
                  <strong>🔒 Zero Spam, Zero Monetization:</strong> Your data is never sold, rented, or shared with third parties for commercial or advertising purposes.
                </div>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  2. GDPR Compliance & User Rights
                </h4>
                <p>
                  Under the General Data Protection Regulation (GDPR), you hold the full right to access, rectify, export, and permanently delete your account and associated collections at any time.
                </p>
              </div>
            )
          )}

          {/* LEGAL NOTICES */}
          {activeTab === 'notices' && (
            legalLang === 'fr' ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                  1. Éditeur du Projet
                </h4>
                <p><strong>Nom du projet :</strong> MyFolio</p>
                <p><strong>Auteur :</strong> Alexhuang03</p>
                <p><strong>Dépôt GitHub :</strong> <a href="https://github.com/Alexhuang03/MyFolio" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">github.com/Alexhuang03/MyFolio</a></p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  2. Technologies & Hébergement
                </h4>
                <p>
                  Application moderne propulsée par <strong>React 19</strong>, <strong>Vite</strong>, <strong>Tailwind CSS</strong>, <strong>Node.js</strong> et base de données <strong>MongoDB</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                  1. Platform Publisher
                </h4>
                <p><strong>Project Name:</strong> MyFolio</p>
                <p><strong>Author:</strong> Alexhuang03</p>
                <p><strong>GitHub Repository:</strong> <a href="https://github.com/Alexhuang03/MyFolio" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">github.com/Alexhuang03/MyFolio</a></p>

                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-base pt-2">
                  2. Tech Stack
                </h4>
                <p>
                  Modern web architecture built with <strong>React 19</strong>, <strong>Vite</strong>, <strong>Tailwind CSS</strong>, <strong>Node.js</strong> and <strong>MongoDB</strong>.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            {t('terms_btn_close')}
          </button>
        </div>
      </div>
    </div>
  );
}

