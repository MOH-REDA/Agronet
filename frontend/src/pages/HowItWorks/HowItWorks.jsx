import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, CalendarDays, CheckCircle2, ClipboardCheck, Search, ShieldCheck, Tractor, Upload, UserCheck, Wrench } from 'lucide-react';
import '../PublicPages.css';

const renterSteps = [
  { icon: Search, title: 'Compare real listings', copy: 'Review photos, specifications, pricing, location, availability, and owner trust signals.' },
  { icon: CalendarDays, title: 'Build the request', copy: 'Choose dates and decide whether you need only the machine, its owner, or a worker.' },
  { icon: ClipboardCheck, title: 'Review every cost', copy: 'See rental price, duration, deposit, service details, and payment method before submitting.' },
  { icon: CheckCircle2, title: 'Track the job', copy: 'Follow owner approval, payment verification, pickup, completion, and review from your dashboard.' },
];
const ownerSteps = [
  { icon: Upload, title: 'Create a useful listing', copy: 'Add strong photos, machine specifications, service capabilities, pricing, and location.' },
  { icon: UserCheck, title: 'Build owner trust', copy: 'Complete your profile, add a photo, request verification, and earn reviews through completed work.' },
  { icon: CalendarDays, title: 'Control requests', copy: 'Review who needs the machine, the exact dates, work type, field size, and location.' },
  { icon: Banknote, title: 'Complete and get paid', copy: 'Track the booking to completion and keep payout details organized in one place.' },
];

const Flow = ({ steps }) => <div className="workflow-list">{steps.map(({ icon: Icon, title, copy }, index) => <article key={title}><span className="workflow-number">{String(index + 1).padStart(2, '0')}</span><span className="workflow-icon">{React.createElement(Icon, { size: 22 })}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>;

const HowItWorks = () => (
  <main className="public-page how-public-page">
    <section className="public-hero process-hero"><div className="public-shell public-hero-grid"><div className="public-hero-copy"><span className="public-kicker">Search → request → work → complete</span><h1>A clear path from finding equipment to finishing the job.</h1><p>AgroNet keeps dates, services, pricing, trust, payment status, and completion in one connected workflow.</p><div className="public-actions"><Link className="public-primary" to="/equipment">Find equipment <ArrowRight size={18} /></Link><Link className="public-text-link" to="/equipment/list">List a machine</Link></div></div><div className="process-hero-panel"><div className="process-machine"><img src="/agronet-harvest-v2.webp" alt="Agricultural machine" /><span><Tractor size={18} /> Equipment selected</span></div><div className="process-line"><i className="active" /><i className="active" /><i /><i /></div><div className="process-status"><span><CheckCircle2 size={17} /> Dates selected</span><span><ShieldCheck size={17} /> Booking protected</span><span><Wrench size={17} /> Owner response next</span></div></div></div></section>

    <section className="public-section"><div className="public-shell"><header className="public-section-heading"><span>For farmers and renters</span><h2>Book the capability, not just the machine</h2><p>The request captures what the job actually needs.</p></header><Flow steps={renterSteps} /></div></section>

    <section className="public-section owner-workflow-section"><div className="public-shell owner-workflow-grid"><div className="public-section-heading light"><span>For equipment owners</span><h2>Put idle capacity to productive use</h2><p>You stay in control of the machine, the work you accept, and each booking’s progress.</p><Link className="public-primary pale" to="/equipment/list">Start a listing <ArrowRight size={18} /></Link></div><Flow steps={ownerSteps} /></div></section>

    <section className="public-section"><div className="public-shell"><header className="public-section-heading"><span>What the statuses mean</span><h2>No mystery after clicking submit</h2></header><div className="status-journey"><div><span>1</span><strong>Requested</strong><small>The owner reviews dates and work details.</small></div><ArrowRight /><div><span>2</span><strong>Scheduled</strong><small>Owner and payment steps are confirmed.</small></div><ArrowRight /><div><span>3</span><strong>In progress</strong><small>The rental or service is happening.</small></div><ArrowRight /><div><span>4</span><strong>Completed</strong><small>Both sides close the job and can review.</small></div></div></div></section>

    <section className="public-final-cta"><div className="public-shell"><div><span>Your next job can start here</span><h2>Browse equipment with clear details and pricing.</h2></div><Link to="/equipment">Open marketplace <ArrowRight size={18} /></Link></div></section>
  </main>
);

export default HowItWorks;
