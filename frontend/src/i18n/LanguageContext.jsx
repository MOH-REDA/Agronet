/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const messages = {
  fr: {
    'brand.tagline': "Location de matériel",
    'nav.marketplace': 'Marché', 'nav.how': 'Comment ça marche', 'nav.about': 'À propos', 'nav.contact': 'Contact',
    'nav.list': 'Publier un matériel', 'nav.saved': 'Favoris', 'nav.signIn': 'Se connecter', 'nav.register': 'Créer un compte',
    'nav.dashboard': 'Tableau de bord', 'nav.bookings': 'Réservations et demandes', 'nav.settings': 'Paramètres',
    'nav.users': 'Gérer les utilisateurs', 'nav.equipment': 'Gérer le matériel', 'nav.signOut': 'Se déconnecter',
    'nav.notifications': 'Notifications', 'nav.language': 'Langue', 'role.admin': 'Administrateur', 'role.member': 'Membre',
    'common.previous': 'Précédent', 'common.continue': 'Continuer', 'common.saveDraft': 'Enregistrer le brouillon', 'common.publish': 'Publier le matériel',
    'listing.eyebrow': 'Espace propriétaire', 'listing.title': 'Publiez votre matériel',
    'listing.subtitle': 'Présentez clairement votre machine pour recevoir des demandes sérieuses et adaptées.',
    'listing.editTitle': 'Mettre à jour votre matériel', 'listing.editSubtitle': 'Gardez les informations, les services et les tarifs à jour.',
    'listing.step': 'Étape {current} sur {total}', 'listing.progress': '{value}% terminé', 'listing.saved': 'Brouillon enregistré',
    'listing.helpTitle': 'Une annonce qui inspire confiance', 'listing.help1': 'Ajoutez une photo nette et récente.',
    'listing.help2': 'Précisez l’état et les capacités réelles.', 'listing.help3': 'Indiquez un tarif et une caution transparents.',
    'step.machine': 'Machine', 'step.registration': 'Immatriculation', 'step.business': 'Propriétaire', 'step.contact': 'Contact',
    'step.location': 'Localisation', 'step.terms': 'Conditions', 'step.seasonal': 'Saisonnalité', 'step.pricing': 'Tarification',
    'contact.eyebrow': 'Assistance AgroNet', 'contact.title': 'Dites-nous ce qui bloque votre travail.',
    'contact.subtitle': "Une question sur une annonce, une vérification, une réservation ou un paiement ? Donnez-nous les détails et nous vous guiderons.",
    'contact.booking': 'Pour un problème de réservation', 'contact.bookingHint': "Ajoutez le numéro de réservation et le nom du matériel pour accélérer l'analyse.",
    'contact.formEyebrow': 'Envoyer un message', 'contact.formTitle': 'Comment pouvons-nous vous aider ?', 'contact.required': 'Les champs marqués * sont obligatoires.',
    'contact.name': 'Votre nom *', 'contact.email': 'Adresse e-mail *', 'contact.topic': 'Quel est le sujet ? *', 'contact.select': 'Choisissez un sujet',
    'contact.message': 'Message *', 'contact.send': 'Envoyer le message', 'contact.sending': 'Envoi en cours…',
    'contact.placeholder': "Indiquez le matériel, le numéro de réservation et ce que vous attendiez.",
    'contact.mailTitle': 'Écrivez-nous directement', 'contact.mailCopy': "Notre équipe lit chaque message et vous répond avec une prochaine étape claire.",
    'contact.mailAction': 'Ouvrir votre messagerie', 'contact.response': 'Réponse habituelle sous 24 h ouvrées',
    'contact.success': 'Votre message est parti. Nous vous répondrons rapidement.', 'contact.error': "Le message n'a pas pu être envoyé. Réessayez ou écrivez-nous directement.",
    'footer.ready': 'Prêt à simplifier vos opérations agricoles ?', 'footer.copy': 'Louez ou valorisez du matériel agricole avec une communauté de confiance.',
    'footer.start': 'Commencer', 'footer.sales': 'Nous contacter', 'footer.quick': 'Liens rapides', 'footer.support': 'Assistance', 'footer.rights': 'Tous droits réservés.'
  },
  en: {
    'brand.tagline': 'Equipment marketplace',
    'nav.marketplace': 'Marketplace', 'nav.how': 'How it works', 'nav.about': 'About', 'nav.contact': 'Contact',
    'nav.list': 'List equipment', 'nav.saved': 'Saved', 'nav.signIn': 'Sign in', 'nav.register': 'Create account',
    'nav.dashboard': 'Dashboard', 'nav.bookings': 'Bookings and requests', 'nav.settings': 'Settings',
    'nav.users': 'Manage users', 'nav.equipment': 'Manage equipment', 'nav.signOut': 'Sign out',
    'nav.notifications': 'Notifications', 'nav.language': 'Language', 'role.admin': 'Administrator', 'role.member': 'Member',
    'common.previous': 'Previous', 'common.continue': 'Continue', 'common.saveDraft': 'Save draft', 'common.publish': 'Publish equipment',
    'listing.eyebrow': 'Owner workspace', 'listing.title': 'List your equipment', 'listing.subtitle': 'Present your machine clearly to receive serious, relevant requests.',
    'listing.editTitle': 'Update your equipment', 'listing.editSubtitle': 'Keep information, services, and pricing current.',
    'listing.step': 'Step {current} of {total}', 'listing.progress': '{value}% complete', 'listing.saved': 'Draft saved',
    'listing.helpTitle': 'A listing renters can trust', 'listing.help1': 'Add a clear, recent photo.', 'listing.help2': 'Describe its real condition and capabilities.', 'listing.help3': 'Use transparent pricing and deposit terms.',
    'step.machine': 'Machine', 'step.registration': 'Registration', 'step.business': 'Owner', 'step.contact': 'Contact', 'step.location': 'Location', 'step.terms': 'Terms', 'step.seasonal': 'Seasonal', 'step.pricing': 'Pricing',
    'contact.eyebrow': 'AgroNet support', 'contact.title': "Tell us what's blocking the work.", 'contact.subtitle': "Questions about a listing, verification, booking, or payment? Share the details and we'll guide you.",
    'contact.booking': 'For booking issues', 'contact.bookingHint': 'Include the booking number and equipment name so we can investigate faster.',
    'contact.formEyebrow': 'Send a message', 'contact.formTitle': 'How can we help?', 'contact.required': 'Fields marked * are required.',
    'contact.name': 'Your name *', 'contact.email': 'Email address *', 'contact.topic': 'What is this about? *', 'contact.select': 'Select a topic',
    'contact.message': 'Message *', 'contact.send': 'Send message', 'contact.sending': 'Sending…', 'contact.placeholder': 'Include the equipment, booking number, and what you expected to happen.',
    'contact.mailTitle': 'Email us directly', 'contact.mailCopy': 'Our team reads every message and replies with a clear next step.', 'contact.mailAction': 'Open your email app', 'contact.response': 'Typical reply within one business day',
    'contact.success': "Your message is on its way. We'll get back to you shortly.", 'contact.error': 'We could not send the message. Try again or email us directly.',
    'footer.ready': 'Ready to simplify your farming operations?', 'footer.copy': 'Rent or monetize agricultural equipment with a trusted community.', 'footer.start': 'Get started', 'footer.sales': 'Contact us', 'footer.quick': 'Quick links', 'footer.support': 'Support', 'footer.rights': 'All rights reserved.'
  },
  ar: {
    'brand.tagline': 'سوق المعدات الفلاحية',
    'nav.marketplace': 'السوق', 'nav.how': 'كيف يعمل', 'nav.about': 'من نحن', 'nav.contact': 'اتصل بنا',
    'nav.list': 'أضف معدات', 'nav.saved': 'المفضلة', 'nav.signIn': 'تسجيل الدخول', 'nav.register': 'إنشاء حساب',
    'nav.dashboard': 'لوحة التحكم', 'nav.bookings': 'الحجوزات والطلبات', 'nav.settings': 'الإعدادات',
    'nav.users': 'إدارة المستخدمين', 'nav.equipment': 'إدارة المعدات', 'nav.signOut': 'تسجيل الخروج',
    'nav.notifications': 'الإشعارات', 'nav.language': 'اللغة', 'role.admin': 'مسؤول', 'role.member': 'عضو',
    'common.previous': 'السابق', 'common.continue': 'متابعة', 'common.saveDraft': 'حفظ المسودة', 'common.publish': 'نشر المعدات',
    'listing.eyebrow': 'فضاء المالك', 'listing.title': 'انشر معداتك', 'listing.subtitle': 'قدّم آلتك بوضوح لتتلقى طلبات جادة ومناسبة.',
    'listing.editTitle': 'تحديث المعدات', 'listing.editSubtitle': 'حافظ على تحديث المعلومات والخدمات والأسعار.',
    'listing.step': 'الخطوة {current} من {total}', 'listing.progress': 'اكتمل {value}٪', 'listing.saved': 'تم حفظ المسودة',
    'listing.helpTitle': 'إعلان جدير بالثقة', 'listing.help1': 'أضف صورة واضحة وحديثة.', 'listing.help2': 'اشرح الحالة والقدرات الحقيقية.', 'listing.help3': 'حدد السعر والضمان بشفافية.',
    'step.machine': 'الآلة', 'step.registration': 'التسجيل', 'step.business': 'المالك', 'step.contact': 'التواصل', 'step.location': 'الموقع', 'step.terms': 'الشروط', 'step.seasonal': 'الموسم', 'step.pricing': 'التسعير',
    'contact.eyebrow': 'دعم أغرونت', 'contact.title': 'أخبرنا بما يعيق عملك.', 'contact.subtitle': 'هل لديك سؤال حول إعلان أو تحقق أو حجز أو دفع؟ أرسل التفاصيل وسنرشدك.',
    'contact.booking': 'لمشاكل الحجز', 'contact.bookingHint': 'أضف رقم الحجز واسم المعدات لتسريع المعالجة.',
    'contact.formEyebrow': 'أرسل رسالة', 'contact.formTitle': 'كيف يمكننا مساعدتك؟', 'contact.required': 'الحقول المعلّمة * إلزامية.',
    'contact.name': 'اسمك *', 'contact.email': 'البريد الإلكتروني *', 'contact.topic': 'ما موضوع الرسالة؟ *', 'contact.select': 'اختر موضوعاً',
    'contact.message': 'الرسالة *', 'contact.send': 'إرسال الرسالة', 'contact.sending': 'جارٍ الإرسال…', 'contact.placeholder': 'اذكر المعدات ورقم الحجز وما كنت تتوقع حدوثه.',
    'contact.mailTitle': 'راسلنا مباشرة', 'contact.mailCopy': 'يقرأ فريقنا كل رسالة ويرد عليك بخطوة تالية واضحة.', 'contact.mailAction': 'فتح تطبيق البريد', 'contact.response': 'الرد المعتاد خلال يوم عمل واحد',
    'contact.success': 'تم إرسال رسالتك. سنرد عليك قريباً.', 'contact.error': 'تعذر إرسال الرسالة. حاول مجدداً أو راسلنا مباشرة.',
    'footer.ready': 'هل أنت مستعد لتبسيط أعمالك الفلاحية؟', 'footer.copy': 'استأجر أو استثمر معداتك الفلاحية داخل مجتمع موثوق.', 'footer.start': 'ابدأ الآن', 'footer.sales': 'اتصل بنا', 'footer.quick': 'روابط سريعة', 'footer.support': 'الدعم', 'footer.rights': 'جميع الحقوق محفوظة.'
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem('agronet:language') || 'fr');
  const setLanguage = (next) => setLanguageState(messages[next] ? next : 'fr');

  useEffect(() => {
    localStorage.setItem('agronet:language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    direction: language === 'ar' ? 'rtl' : 'ltr',
    t: (key, variables = {}) => {
      let value = messages[language]?.[key] || messages.fr[key] || key;
      Object.entries(variables).forEach(([name, replacement]) => { value = value.replaceAll(`{${name}}`, replacement); });
      return value;
    }
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
