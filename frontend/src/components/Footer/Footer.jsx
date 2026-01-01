import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer>
      {/* CTA Section */}
      <div className="cta-section">
        <div className="container text-center">
          <h2 className="cta-title">Ready to Transform Your Farming Operations?</h2>
          <p className="cta-description">
            Join thousands of satisfied farmers who trust Agronet for their equipment needs.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-light btn-lg me-3">
              Get Started Today
            </Link>
            <Link to="/contact" className="btn btn-outline-light btn-lg">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="footer-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 mb-4">
              <div className="footer-brand">
                <h3>Agronet</h3>
                <p>
                  Revolutionizing agricultural equipment rentals for modern farming needs.
                </p>
              </div>
            </div>

            <div className="col-lg-3 mb-4">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/equipment">Equipment</Link></li>
                <li><Link to="/how-it-works">How It Works</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="col-lg-3 mb-4">
              <h4>Support</h4>
              <ul className="footer-links">
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/help">Help Center</Link></li>
              </ul>
            </div>

            <div className="col-lg-3 mb-4">
              <h4>Connect</h4>
              <ul className="footer-links">
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <div className="container text-center">
          <p>© {new Date().getFullYear()} Agronet. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 