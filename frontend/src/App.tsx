const appHighlights = [
  'Employee incident reporting',
  'Manager and admin review workflows',
  'Gemini-assisted summaries and categorization',
  'Seeded demo accounts for fast testing'
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Restaurant Incident Reporting Tool</p>
        <h1>Operational reporting with a clean workflow for staff and leadership.</h1>
        <p className="lead">
          This workspace is being built in phases so the incident lifecycle, analytics,
          email notifications, and AI features can land in small reviewable commits.
        </p>
        <div className="hero-actions">
          <a href="#milestones" className="primary-action">View milestones</a>
          <a href="#setup" className="secondary-action">Setup notes</a>
        </div>
      </section>

      <section className="panel" id="milestones">
        <h2>Current foundation</h2>
        <ul className="highlight-list">
          {appHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel" id="setup">
        <h2>Next system work</h2>
        <p>
          The backend will expose auth, incident, analytics, and AI endpoints. The frontend
          will connect to MongoDB-backed APIs and Vercel deployment targets.
        </p>
      </section>
    </main>
  );
}

export default App;
