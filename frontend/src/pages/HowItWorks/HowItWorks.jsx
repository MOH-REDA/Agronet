import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaCalendarCheck, FaExchangeAlt } from 'react-icons/fa';
import { BiMoney } from 'react-icons/bi';
import { RiCommunityLine } from 'react-icons/ri';
import { MdSecurity } from 'react-icons/md';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      icon: <FaPlus />,
      number: "1",
      title: 'List Your Equipment',
      description: 'Choose a piece of equipment to share with farmers in your community.'
    },
    {
      icon: <FaSearch />,
      number: "2",
      title: 'Find What You Need',
      description: 'Browse through available equipment, view features and availability.'
    },
    {
      icon: <FaCalendarCheck />,
      number: "3",
      title: 'Book & Confirm',
      description: 'Book a desired time slot and get confirmation to proceed.'
    },
    {
      icon: <FaExchangeAlt />,
      number: "4",
      title: 'Use & Return',
      description: 'Use the equipment for your needs, then return it in good condition.'
    }
  ];

  const benefits = [
    {
      icon: <BiMoney />,
      title: 'Save Time & Money',
      description: 'No need to buy expensive equipment for short-term tasks. Access what you need, when you need it.'
    },
    {
      icon: <RiCommunityLine />,
      title: 'Empower Local Farmers',
      description: 'Join the largest farming community, support your neighbors while growing your business.'
    },
    {
      icon: <MdSecurity />,
      title: 'Easy & Secure',
      description: 'Verified users, secure payments, and simple process. Your equipment and transactions are protected.'
    }
  ];

  const heroStyle = {
    backgroundImage: `url('/agri-machines.jpeg')`
  };

  return (
    <div className="how-it-works-page">
      <section className="hero-section" style={heroStyle}>
        <Container>
          <div className="text-center">
            <h1>Rent. Use. Return. It's<br />That Simple.</h1>
            <p>Agronet makes farming more efficient by helping you access and<br />rent agricultural equipment anytime, anywhere.</p>
            <Link to="/register" className="btn btn-light">
              Get Started with Agronet
            </Link>
          </div>
        </Container>
      </section>

      <section className="process-section">
        <Container>
          <div className="section-header text-center">
            <h2>How Agronet Works</h2>
            <p>Follow these simple steps to start renting or listing<br />agricultural equipment in your community</p>
          </div>
          <Row className="process-steps">
            {steps.map((step, index) => (
              <Col key={index} md={6} lg={3}>
                <div className="process-step">
                  <div className="step-icon">
                    <span className="step-number">{step.number}</span>
                    {step.icon}
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="benefits-section">
        <Container>
          <div className="section-header text-center">
            <h2>Why Choose Agronet?</h2>
            <p>Join thousands of farmers who are already saving time and money<br />with our platform</p>
          </div>
          <Row className="benefits">
            {benefits.map((benefit, index) => (
              <Col key={index} md={4}>
                <div className="benefit-card">
                  <div className="benefit-icon">
                    {benefit.icon}
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HowItWorks; 