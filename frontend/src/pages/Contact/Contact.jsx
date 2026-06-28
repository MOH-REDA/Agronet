import React, { useState } from 'react';
import { CheckCircle2, Clock3, HelpCircle, Mail, MapPin, Phone, Send, ShieldCheck } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { useLanguage } from '../../i18n/LanguageContext';
import '../PublicPages.css';

const localCopy = {
  fr: { topics: ['Annonce de matériel', 'Réservation', 'Paiement ou versement', 'Vérification du propriétaire', 'Assistance du compte', 'Autre'], email: 'Assistance par e-mail', emailHint: 'Idéal pour les détails du compte et des réservations.', phone: 'Assistance téléphonique', phoneHint: 'Du lundi au samedi pendant les heures d’assistance.', hours: 'Horaires', weekdays: 'Lun–Ven · 08:00–18:00', saturday: 'Samedi · 08:00–16:00', market: 'Zone desservie', morocco: 'Agriculteurs partout au Maroc', locationHint: 'La disponibilité dépend de la localisation.', faq: 'Avant de nous écrire', faqTitle: 'Réponses rapides aux questions fréquentes', questions: [['Où suivre ma demande ?', 'Ouvrez votre tableau de bord ou vos réservations pour suivre la réponse, le paiement et la réalisation.'], ['Comment fonctionne la vérification ?', 'Le propriétaire transmet ses informations pour validation par un administrateur.'], ['La caution fait-elle partie du prix ?', 'Non. Le coût de location et la caution remboursable sont affichés séparément.']] },
  en: { topics: ['Equipment listing', 'Booking or reservation', 'Payment or payout', 'Owner verification', 'Account support', 'Other'], email: 'Email support', emailHint: 'Best for account and booking details.', phone: 'Phone support', phoneHint: 'Monday–Saturday during support hours.', hours: 'Support hours', weekdays: 'Mon–Fri · 08:00–18:00', saturday: 'Saturday · 08:00–16:00', market: 'Market', morocco: 'Serving farmers across Morocco', locationHint: 'Availability varies by location.', faq: 'Before you message', faqTitle: 'Fast answers to common questions', questions: [['Where can I track my request?', 'Open your dashboard or bookings to follow responses, payment, scheduling, and completion.'], ['How does verification work?', 'Owners submit their information for administrator review.'], ['Is the deposit part of the price?', 'No. Rental cost and refundable deposit are displayed separately.']] },
  ar: { topics: ['إعلان معدات', 'حجز', 'دفع أو تحويل', 'التحقق من المالك', 'دعم الحساب', 'أخرى'], email: 'الدعم عبر البريد', emailHint: 'مناسب لتفاصيل الحساب والحجز.', phone: 'الدعم الهاتفي', phoneHint: 'من الاثنين إلى السبت خلال ساعات الدعم.', hours: 'ساعات الدعم', weekdays: 'الاثنين–الجمعة · 08:00–18:00', saturday: 'السبت · 08:00–16:00', market: 'منطقة الخدمة', morocco: 'نخدم الفلاحين في جميع أنحاء المغرب', locationHint: 'التوفر يختلف حسب الموقع.', faq: 'قبل مراسلتنا', faqTitle: 'إجابات سريعة عن الأسئلة الشائعة', questions: [['أين أتابع طلبي؟', 'افتح لوحة التحكم أو الحجوزات لمتابعة الرد والدفع والتنفيذ.'], ['كيف يعمل التحقق؟', 'يرسل المالك معلوماته لمراجعتها من طرف المسؤول.'], ['هل الضمان ضمن السعر؟', 'لا. يظهر سعر الإيجار والضمان القابل للاسترداد بشكل منفصل.']] }
};

const Contact = () => {
  const { language, t } = useLanguage();
  const copy = localCopy[language] || localCopy.fr;
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const handleChange = (event) => { setFormData(previous => ({ ...previous, [event.target.name]: event.target.value })); setStatus({ type: '', message: '' }); };
  const handleSubmit = async (event) => {
    event.preventDefault(); setStatus({ type: 'loading', message: t('contact.sending') });
    try {
      await emailjs.send('service_aojraus', 'template_8ytv53q', { ...formData, time: new Date().toLocaleString(language) }, 'suRWpjOkOGYs_dtBi');
      setStatus({ type: 'success', message: t('contact.success') }); setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (_error) { setStatus({ type: 'error', message: t('contact.error') }); }
  };

  return (
    <main className="public-page contact-public-page">
      <section className="contact-hero"><div className="public-shell contact-hero-grid"><div><span className="public-kicker">{t('contact.eyebrow')}</span><h1>{t('contact.title')}</h1><p>{t('contact.subtitle')}</p></div><div className="contact-hero-mail"><div className="hero-mail-envelope" aria-hidden="true"><Mail size={42} /><span className="hero-mail-pulse" /></div><div><span><ShieldCheck size={15} /> {t('contact.booking')}</span><small>{t('contact.bookingHint')}</small></div></div></div></section>
      <section className="contact-main"><div className="public-shell contact-layout">
        <div className="contact-form-panel"><div className="public-section-heading"><span>{t('contact.formEyebrow')}</span><h2>{t('contact.formTitle')}</h2><p>{t('contact.required')}</p></div>
          <form onSubmit={handleSubmit} className="public-contact-form">
            <div className="contact-field-row"><label><span>{t('contact.name')}</span><input name="name" value={formData.name} onChange={handleChange} autoComplete="name" required /></label><label><span>{t('contact.email')}</span><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="vous@exemple.com" autoComplete="email" required /></label></div>
            <label><span>{t('contact.topic')}</span><select name="subject" value={formData.subject} onChange={handleChange} required><option value="" disabled>{t('contact.select')}</option>{copy.topics.map(topic => <option key={topic}>{topic}</option>)}</select></label>
            <label><span>{t('contact.message')}</span><textarea name="message" value={formData.message} onChange={handleChange} rows="6" maxLength="1500" placeholder={t('contact.placeholder')} required /><small>{formData.message.length}/1500</small></label>
            {status.message && <div className={`contact-status ${status.type}`}>{status.type === 'success' ? <CheckCircle2 size={18} /> : <HelpCircle size={18} />}{status.message}</div>}
            <button type="submit" disabled={status.type === 'loading'}>{status.type === 'loading' ? t('contact.sending') : <>{t('contact.send')} <Send size={17} /></>}</button>
          </form>
        </div>
        <aside className="contact-side-panel">
          <div className="contact-mail-copy"><span>{t('contact.response')}</span><h2>{t('contact.mailTitle')}</h2><p>{t('contact.mailCopy')}</p><a href="mailto:support@agronet.com"><Mail size={17} /> {t('contact.mailAction')}</a></div>
          <div className="contact-method"><span><Mail size={20} /></span><div><small>{copy.email}</small><a href="mailto:support@agronet.com">support@agronet.com</a><p>{copy.emailHint}</p></div></div>
          <div className="contact-method"><span><Phone size={20} /></span><div><small>{copy.phone}</small><a href="tel:+212702979422">+212 702 97 94 22</a><p>{copy.phoneHint}</p></div></div>
          <div className="contact-method"><span><Clock3 size={20} /></span><div><small>{copy.hours}</small><strong>{copy.weekdays}</strong><p>{copy.saturday}</p></div></div>
          <div className="contact-method"><span><MapPin size={20} /></span><div><small>{copy.market}</small><strong>{copy.morocco}</strong><p>{copy.locationHint}</p></div></div>
        </aside>
      </div></section>
      <section className="contact-faq"><div className="public-shell"><header className="public-section-heading"><span>{copy.faq}</span><h2>{copy.faqTitle}</h2></header><div className="faq-grid">{copy.questions.map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div></div></section>
    </main>
  );
};

export default Contact;
