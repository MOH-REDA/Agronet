import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, CalendarDays, MapPin, Send, Sparkles, Tractor, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEquipmentAdvice } from '../../services/api';
import { getStorageUrl } from '../../config/api';
import './SmartEquipmentAdvisor.css';

const examples = [
  'Prepare 8 hectares for wheat planting',
  'Spray pesticides on a 12-hectare farm',
  'Harvest wheat quickly',
];

const SmartEquipmentAdvisor = ({ filters = {} }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [footerVisible, setFooterVisible] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.02 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const submit = async (event, exampleText) => {
    event?.preventDefault();
    const text = (exampleText || request).trim();
    if (text.length < 10) { setError('Add a little more detail about the farm task.'); return; }

    setMessages(previous => [...previous, { role: 'user', text }]);
    setRequest(''); setLoading(true); setError('');
    try {
      const response = await getEquipmentAdvice({
        request: text,
        city: filters.location || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
      });
      setMessages(previous => [...previous, { role: 'assistant', result: response }]);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'The advisor could not complete this request.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <button className={`advisor-launcher ${open ? 'open' : ''} ${footerVisible ? 'near-footer' : ''}`} type="button" onClick={() => setOpen(value => !value)} aria-label={open ? 'Close Smart Equipment Advisor' : 'Open Smart Equipment Advisor'} aria-expanded={open}>
        {open ? <X size={22} /> : <Sparkles size={23} />}
        {!open && <span className="advisor-launcher-badge">AI</span>}
        <span className="advisor-launcher-label">Ask AgroNet</span>
      </button>

      {open && <div className={`advisor-chat ${footerVisible ? 'near-footer' : ''}`} role="dialog" aria-modal="false" aria-labelledby="advisor-chat-title">
        <header className="advisor-chat-header">
          <span className="advisor-chat-avatar"><Sparkles size={20} /></span>
          <div><span>AgroNet AI</span><h2 id="advisor-chat-title">Equipment advisor</h2></div>
          <span className="advisor-online"><i /> Online</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close advisor"><X size={19} /></button>
        </header>

        <div className="advisor-chat-context">
          {filters.location && <span><MapPin size={12} /> {filters.location}</span>}
          {filters.startDate && filters.endDate && <span><CalendarDays size={12} /> Selected dates</span>}
          {!filters.location && !filters.startDate && <span>Using all currently available listings</span>}
        </div>

        <div className="advisor-chat-thread" aria-live="polite">
          <div className="advisor-message assistant welcome">
            <span className="advisor-message-avatar"><Bot size={16} /></span>
            <div className="advisor-bubble"><strong>What are you trying to get done?</strong><p>Describe the task, crop, field size, and location. I’ll recommend suitable equipment from AgroNet’s real listings.</p></div>
          </div>

          {messages.length === 0 && <div className="advisor-chat-prompts">{examples.map(example => <button type="button" key={example} onClick={event => submit(event, example)}>{example}<ArrowRight size={13} /></button>)}</div>}

          {messages.map((message, index) => message.role === 'user'
            ? <div className="advisor-message user" key={`${message.text}-${index}`}><div className="advisor-bubble">{message.text}</div></div>
            : <AdvisorReply key={`reply-${index}`} result={message.result} navigate={navigate} />)}

          {loading && <div className="advisor-message assistant"><span className="advisor-message-avatar"><Bot size={16} /></span><div className="advisor-bubble advisor-typing"><i /><i /><i /></div></div>}
          {error && <div className="advisor-chat-error">{error}</div>}
          <div ref={endRef} />
        </div>

        <form className="advisor-chat-composer" onSubmit={submit}>
          <textarea ref={inputRef} value={request} onChange={event => { setRequest(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event); } }} rows="1" maxLength="1000" placeholder="Describe your farming task…" aria-label="Message the equipment advisor" />
          <button type="submit" disabled={loading || request.trim().length < 10} aria-label="Send message"><Send size={17} /></button>
          <small>AI estimates can be wrong. Confirm details with the owner.</small>
        </form>
      </div>}
    </>
  );
};

const AdvisorReply = ({ result, navigate }) => (
  <div className="advisor-message assistant">
    <span className="advisor-message-avatar"><Bot size={16} /></span>
    <div className="advisor-reply-content">
      <div className="advisor-bubble"><span className={`advisor-reply-source ${result.source === 'openrouter' ? 'ai' : ''}`}>{result.source === 'openrouter' ? 'AI recommendation' : 'Smart database match'}</span><strong>{result.inferred_task}</strong><p>{result.summary}</p></div>
      {result.recommendations?.map(({ equipment, reason, estimated_days, estimated_rental_cost }) => {
        const image = equipment.images?.[0] ? getStorageUrl(equipment.images[0]) : '/agronet-hero-v2.webp';
        return <article className="advisor-chat-card" key={equipment.id}>
          <img src={image} alt={equipment.name} loading="lazy" />
          <div><span>{equipment.type}{equipment.city ? ` · ${equipment.city}` : ''}</span><h3>{equipment.name}</h3><p>{reason}</p><div className="advisor-chat-estimate"><span><Tractor size={13} /> {Number(equipment.minPrice || 0).toLocaleString('fr-MA')} MAD/day</span><span><CalendarDays size={13} /> ≈ {estimated_days} day{estimated_days === 1 ? '' : 's'}</span></div><strong>≈ {Number(estimated_rental_cost || 0).toLocaleString('fr-MA')} MAD</strong><div className="advisor-chat-actions"><button type="button" onClick={() => navigate(`/equipment/${equipment.id}`)}>Details</button><button type="button" onClick={() => navigate(`/equipment/${equipment.id}/reserve`)}>Reserve <ArrowRight size={13} /></button></div></div>
        </article>;
      })}
      {!result.recommendations?.length && <div className="advisor-bubble">No confident match yet. Try changing the location, dates, or describing the capability you need.</div>}
    </div>
  </div>
);

export default SmartEquipmentAdvisor;
