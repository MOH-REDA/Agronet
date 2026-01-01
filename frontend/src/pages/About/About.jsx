import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  const team = [
    {
      initials: 'SE',
      name: 'Souhaib Eddahmani',
      role: 'Full Stack Developer',
      description: 'Passionate about creating innovative solutions for the agricultural sector.'
    },
    {
      initials: 'MRM',
      name: 'Mohammed Reda Minyani',
      role: 'Full Stack Developer',
      description: 'Dedicated to building technology that empowers farming communities.'
    }
  ];

  return (
    <div className="about-page">
      <section className="hero-section">
        <Container>
          <div className="text-center">
            <h1>
              Connecting Farmers.<br />
              Empowering Agriculture.<br />
              Farmers Working Together
            </h1>
            <p>Agronet — making agricultural resources accessible, and farming collaborative.</p>
            <Link to="/how-it-works" className="btn btn-light">
              Learn More & Mission
            </Link>
          </div>
        </Container>
      </section>

      <section className="our-journey">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <div className="journey-content">
                <h2>Our Journey</h2>
                <p>
                  Agronet was born out of a simple idea: make advanced farming tools accessible to every farmer, regardless of budget or land size. We saw how cooperative mindsets often led people to support each other in rural communities.
                </p>
                <p>
                  Today, we're building bridges between farmers, encouraging them through cooperation. Every rental creates a win-win situation that strengthens our agricultural community.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <div className="journey-image">
                <img 
                  src="/farmer-shaking.jpeg"
                  alt="Farmers handshake" 
                  className="img-fluid rounded shadow"
                  loading="eager"
                  width="1920"
                  height="1080"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="values-section">
        <Container>
          <Row>
            <Col md={4}>
              <div className="value-card">
                <h3>Mission</h3>
                <p>To democratize access to agricultural equipment and empower farmers through resource sharing.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="value-card">
                <h3>Vision</h3>
                <p>A future where every farmer has access to the tools they need to thrive without heavy investments.</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="value-card">
                <h3>Values</h3>
                <ul>
                  <li>Collaboration</li>
                  <li>Sustainability</li>
                  <li>Innovation</li>
                  <li>Integrity</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="team-section">
        <Container>
          <h2 className="text-center mb-5">Meet the Team</h2>
          <Row className="justify-content-center">
            {team.map((member, index) => (
              <Col key={index} md={6} lg={4}>
                <div className="team-member">
                  <div className="member-avatar">
                    {member.initials}
                  </div>
                  <h3>{member.name}</h3>
                  <div className="member-role">{member.role}</div>
                  <p>{member.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="impact-section">
        <Container>
          <h2 className="text-center mb-5">Our Impact in Numbers</h2>
          <Row>
            <Col md={3}>
              <div className="impact-stat">
                <div className="stat-number">150+</div>
                <div className="stat-label">Equipment Listed</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="impact-stat">
                <div className="stat-number">320+</div>
                <div className="stat-label">Active Users</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="impact-stat">
                <div className="stat-number">2,500+</div>
                <div className="stat-label">Successful Rentals</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="impact-stat">
                <div className="stat-number">4.9★</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About; 