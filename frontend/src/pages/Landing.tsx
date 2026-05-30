import React from 'react';
import { Link } from 'react-router-dom';

const appHighlights = [
  'Employee incident reporting',
  'Manager and admin review workflows',
  'Gemini-assisted summaries and categorization',
  'Seeded demo accounts and sample incidents',
  'Cloudinary-powered image uploads'
];

const landingStats = [
  { label: 'Demo roles', value: '3' },
  { label: 'Sample incidents', value: '6+' },
  { label: 'Analytics views', value: '4' },
  { label: 'AI summaries', value: 'Enabled' }
];

const featuredIncidents = [
  {
    title: 'Spilled oil near fryer line',
    tag: 'High risk',
    description: 'Downtown Branch, documented with an image and AI summary for quick follow-up.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'POS terminal downtime',
    tag: 'Critical',
    description: 'Head Office outage capture showing a resolved systems incident and audit trail.',
    imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Cold storage temperature alert',
    tag: 'Food safety',
    description: 'Airport Branch temperature alert tracked with action notes and operational visibility.',
    imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=900&q=80'
  }
];

const platformNotes = [
  {
    title: 'Fast intake',
    body: 'Staff submit incidents in seconds with images, structured fields, and AI-assisted summaries.'
  },
  {
    title: 'Clear oversight',
    body: 'Managers and admins get dashboards, filters, exports, and incident health metrics in one place.'
  },
  {
    title: 'Demo-ready',
    body: 'Seeded accounts and sample records make it easy to explore the app immediately after launch.'
  }
];

export default function Landing() {
  return (
    <main className="app-shell">
      <section className="hero landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">Restaurant Incident Reporting Tool</p>
          <h1>Modern incident ops for restaurants that need speed, visibility, and control.</h1>
          <p className="lead">
            Capture incidents with images, AI summaries, and role-based analytics. Built for employees,
            managers, and admins who want a cleaner workflow than a spreadsheet and a basic form.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="primary-action">Open dashboard</Link>
            <Link to="/login" className="secondary-action">Log in</Link>
          </div>

          <div className="landing-stats">
            {landingStats.map((stat) => (
              <div key={stat.label} className="landing-stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero-visuals">
          <div className="hero-image-card hero-image-main">
            <img
              src="https://images.unsplash.com/photo-1556741533-974f8e62a92d?auto=format&fit=crop&w=1200&q=80"
              alt="Restaurant team reviewing incident dashboard"
            />
            <div className="hero-image-overlay">
              <span>Live operations</span>
              <strong>Role-aware dashboard + analytics</strong>
            </div>
          </div>

          <div className="hero-image-row">
            <div className="hero-image-card hero-image-small">
              <img
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80"
                alt="Kitchen team working together"
              />
            </div>
            <div className="hero-image-card hero-image-small">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
                alt="Food preparation environment"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="panel landing-panel" id="milestones">
        <div className="section-head landing-section-head">
          <div>
            <div className="section-kicker">What it includes</div>
            <h2>Built for real restaurant workflows</h2>
          </div>
        </div>
        <div className="feature-grid">
          {platformNotes.map((item) => (
            <article key={item.title} className="feature-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <ul className="highlight-list landing-highlight-list">
          {appHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel landing-panel">
        <div className="section-head landing-section-head">
          <div>
            <div className="section-kicker">Sample data</div>
            <h2>Preview the seeded incidents</h2>
          </div>
          <span className="section-stat">Images + analytics-ready fields</span>
        </div>
        <div className="sample-gallery">
          {featuredIncidents.map((incident) => (
            <article key={incident.title} className="sample-card">
              <img src={incident.imageUrl} alt={incident.title} className="sample-card-image" />
              <div className="sample-card-body">
                <div className="sample-card-top">
                  <h3>{incident.title}</h3>
                  <span>{incident.tag}</span>
                </div>
                <p>{incident.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
