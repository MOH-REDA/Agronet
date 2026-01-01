import React from 'react';
import { Link } from 'react-router-dom';
import { Tractor, Users, MessageSquare } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Connect with Agricultural Equipment Owners
              </h1>
              <p className="lead mb-4">
                Agronet brings farmers and equipment owners together, making agriculture more accessible and efficient.
              </p>
              <div className="d-flex gap-3">
                <Link to="/signup" className="btn btn-success btn-lg">
                  Get Started
                </Link>
                <Link to="/how-it-works" className="btn btn-outline-dark btn-lg">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <img
                src="/agricultural-equipment.jpg"
                alt="Agricultural Equipment"
                className="img-fluid rounded-3 shadow-lg"
                style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works py-5">
        <div className="container">
          <h2 className="text-center mb-5">How It Works</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="feature-icon mb-3">
                    <Users size={40} />
                  </div>
                  <h3 className="h4 mb-3">Create an Account</h3>
                  <p className="text-muted">
                    Sign up as a farmer or equipment owner and complete your profile.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="feature-icon mb-3">
                    <Tractor size={40} />
                  </div>
                  <h3 className="h4 mb-3">Find Equipment</h3>
                  <p className="text-muted">
                    Browse available equipment or list your machinery for rent.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="feature-icon mb-3">
                    <MessageSquare size={40} />
                  </div>
                  <h3 className="h4 mb-3">Connect & Collaborate</h3>
                  <p className="text-muted">
                    Communicate directly and arrange equipment rental terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-us py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="mb-4">About Us</h2>
              <p className="lead mb-4">
                Agronet is revolutionizing agricultural equipment sharing by connecting farmers with equipment owners.
              </p>
              <p className="mb-4">
                Our platform makes it easy for farmers to access the equipment they need while helping equipment owners maximize their investment.
              </p>
              <Link to="/about" className="btn btn-outline-success">
                Learn More About Us
              </Link>
            </div>
            <div className="col-lg-6">
              <img
                src="/aboutus.png"
                alt="About Agronet"
                className="img-fluid rounded-3 shadow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What We Stand For Section */}
      <section className="values-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">What We Stand For</h2>
            <p className="lead text-muted">
              Our core values guide everything we do, from product development to customer support
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-3">
              <div className="value-card text-center">
                <div className="value-icon bg-light-green">
                  <i className="fas fa-shield-alt text-success"></i>
                </div>
                <h3 className="value-title">Trust</h3>
                <p className="value-description">
                  Verified users, secure payments, and honest listings build the foundation of our community
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="value-card text-center">
                <div className="value-icon bg-light-green">
                  <i className="fas fa-leaf text-success"></i>
                </div>
                <h3 className="value-title">Sustainability</h3>
                <p className="value-description">
                  Maximizing equipment usage and reducing waste for a more sustainable agricultural future
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="value-card text-center">
                <div className="value-icon bg-light-green">
                  <i className="fas fa-bolt text-success"></i>
                </div>
                <h3 className="value-title">Empowerment</h3>
                <p className="value-description">
                  Supporting farmers to grow faster with access to the right equipment at the right time
                </p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="value-card text-center">
                <div className="value-icon bg-light-green">
                  <i className="fas fa-users text-success"></i>
                </div>
                <h3 className="value-title">Community</h3>
                <p className="value-description">
                  Creating strong, local farming networks that support each other's success
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 