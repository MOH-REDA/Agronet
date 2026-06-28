import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Combine, Handshake, Leaf, MapPin, ShieldCheck, Sprout, Tractor, UsersRound } from 'lucide-react';
import '../PublicPages.css';

const About = () => (
  <main className="public-page about-public-page">
    <section className="public-hero about-hero">
      <div className="public-shell public-hero-grid">
        <div className="public-hero-copy"><span className="public-kicker">Why AgroNet exists</span><h1>Good machinery should never sit idle while a nearby field waits.</h1><p>AgroNet connects farmers who need equipment with owners who have capacity to share. The result is practical access, stronger local income, and more productive agricultural communities.</p><div className="public-actions"><Link className="public-primary" to="/equipment">Explore the marketplace <ArrowRight size={18} /></Link><Link className="public-text-link" to="/how-it-works">How it works</Link></div></div>
        <div className="public-hero-image about-hero-image"><img src="/agronet-community-v2.webp" alt="Farmers working together" /><div className="public-image-note"><Handshake size={22} /><span><strong>Local access. Shared value.</strong><small>Equipment working harder for the whole community.</small></span></div></div>
      </div>
    </section>

    <section className="public-section"><div className="public-shell public-story-grid">
      <div className="public-section-heading"><span>Built around a real constraint</span><h2>Access matters more than ownership</h2></div>
      <div className="public-story-copy"><p>For many agricultural jobs, buying a machine is difficult to justify. The work may last only a few days, while the cost and maintenance last for years. At the same time, equipment owners often have unused capacity between their own jobs.</p><p>AgroNet closes that gap. It gives renters enough detail to choose confidently and gives owners a structured way to present, schedule, and manage their machinery.</p></div>
    </div></section>

    <section className="public-section public-dark-section"><div className="public-shell"><header className="public-section-heading light"><span>Our operating principles</span><h2>Useful trust, not marketplace theatre</h2><p>Every product decision should make a real agricultural transaction clearer or safer.</p></header><div className="principle-grid">
      <article><ShieldCheck size={25} /><h3>Trust is visible</h3><p>Verified profiles, reviews from completed work, and trackable booking states help people judge risk.</p></article>
      <article><MapPin size={25} /><h3>Local comes first</h3><p>Nearby equipment reduces transport friction and keeps more economic value inside farming communities.</p></article>
      <article><Leaf size={25} /><h3>Use beats waste</h3><p>Sharing increases equipment utilization instead of requiring every farm to carry the same capital burden.</p></article>
      <article><UsersRound size={25} /><h3>Both sides matter</h3><p>The workflow must be clear for the renter requesting work and the owner protecting a valuable machine.</p></article>
    </div></div></section>

    <section className="public-section"><div className="public-shell public-ecosystem"><div><span className="public-kicker">One network, many jobs</span><h2>From soil preparation to harvest</h2><p>AgroNet is designed to support the equipment and service combinations that real farm work requires—not just a generic rental listing.</p><div className="ecosystem-tags"><span><Tractor size={18} /> Tractors</span><span><Combine size={18} /> Harvesters</span><span><Sprout size={18} /> Crop care</span><span><UsersRound size={18} /> Operators</span></div></div><img src="/agronet-harvest-v2.webp" alt="Combine harvester working in a field" /></div></section>

    <section className="public-final-cta"><div className="public-shell"><div><span>See the network in action</span><h2>Find the machine your next job needs.</h2></div><Link to="/equipment">Browse equipment <ArrowRight size={18} /></Link></div></section>
  </main>
);

export default About;
