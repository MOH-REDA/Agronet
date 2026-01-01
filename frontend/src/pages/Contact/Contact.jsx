import React, { useState } from 'react';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import emailjs from '@emailjs/browser';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sending your message...' });
    try {
      await emailjs.send(
        'service_aojraus',
        'template_8ytv53q',
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          time: new Date().toLocaleString(),
        },
        'suRWpjOkOGYs_dtBi'
      );
      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to send message. Please try again.' });
    }
  };

  return (
    <div className="contact-page">
      <div className="container">
        <h1 className="contact-title">Get in Touch</h1>
        <p className="contact-subtitle">We're here to help! Choose your preferred way to connect with us.</p>

        <div className="contact-cards">
          <div className="contact-card">
            <Mail className="contact-icon" />
            <h3>Email Us</h3>
            <p>Get a response within 24 hours</p>
            <a href="mailto:support@agronet.com">support@agronet.com</a>
          </div>

          <div className="contact-card">
            <Phone className="contact-icon" />
            <h3>Call Us</h3>
            <p>Available 24/7 for urgent matters</p>
            <a href="tel:+1234567890">+212 702 97 94 22</a>
          </div>

          <div className="contact-card">
            <MessageSquare className="contact-icon" />
            <h3>Live Chat</h3>
            <p>Chat with our support team</p>
            <button className="chat-button">Start Chat</button>
          </div>
        </div>

        <div className="contact-content">
          <div className="contact-form-section">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-button" disabled={status.type === 'loading'}>
                {status.type === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            {status.message && (
              <p
                className="emailjs-status"
                style={{
                  color:
                    status.type === 'success'
                      ? 'green'
                      : status.type === 'error'
                      ? 'red'
                      : 'black'
                }}
              >
                {status.message}
              </p>
            )}
          </div>

          <div className="contact-info-section">
            <h2>Visit Us</h2>
            <div className="location-image">
              <img src="/farm-field.jpeg" alt="Farm field" />
            </div>
            <address>
              123 Agriculture Drive<br />
              Casablanca 20000<br />
              Morocco           
            </address>

            <div className="business-hours">
              <h3>Business Hours</h3>
              <ul>
                <li>
                  <span>Monday - Friday</span>
                  <span>8:00 AM - 6:00 PM</span>
                </li>
                <li>
                  <span>Saturday</span>
                  <span>8:00 AM - 4:00 PM</span>
                </li>
                <li>
                  <span>Sunday</span>
                  <span>Closed</span>
                </li>
              </ul>
            </div>

            <div className="social-links">
              <h3>Connect With Us</h3>
              <div className="social-icons">
                <a href="https://web.facebook.com/" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                <a href="https://x.com/" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                <a href="https://www.linkedin.com/" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                <a href="https://www.instagram.com/" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 