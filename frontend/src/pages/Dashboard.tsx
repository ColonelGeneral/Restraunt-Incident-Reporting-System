import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import LineChartComponent from '../components/MonthlyChart';
import IncidentForm from '../components/IncidentForm';
import { apiPath } from '../utils/api';

type Incident = {
  _id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  storeLocation: string;
  createdAt: string;
  createdBy?: string;
  imageUrl?: string;
  aiSummary?: string;
};

type Analytics = {
  cards: {
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    criticalIncidents: number;
  };
  charts: {
    byStatus: Array<{ _id: string; count: number }>;
    bySeverity: Array<{ _id: string; count: number }>;
    byCategory: Array<{ _id: string; count: number }>;
  };
};

export default function Dashboard() {
  const auth = useAuth();
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; storeLocation?: string; category?: string }>({});

  useEffect(() => {
    async function loadIncidents() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiPath('/api/incidents'), { headers: { Authorization: `Bearer ${auth.token}` } });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        setIncidents(data.incidents ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    }

    async function loadAnalytics() {
      try {
        const qs = new URLSearchParams();
        if (filters.startDate) qs.set('startDate', filters.startDate);
        if (filters.endDate) qs.set('endDate', filters.endDate);
        if (filters.storeLocation) qs.set('storeLocation', filters.storeLocation);
        if (filters.category) qs.set('category', filters.category);

        const res = await fetch(apiPath('/api/analytics/dashboard?' + qs.toString()), { headers: { Authorization: `Bearer ${auth.token}` } });
        if (!res.ok) throw new Error(`Analytics API ${res.status}`);
        const data = await res.json();
        setAnalytics(data as Analytics);
      } catch (err) {
        // ignore analytics errors for non-managers
      }
    }

    void loadIncidents();
    if (auth.user?.role === 'manager' || auth.user?.role === 'admin') {
      void loadAnalytics();
      // load stores and categories for filters
      void (async function loadLists() {
        try {
          const s = await fetch(apiPath('/api/analytics/stores'), { headers: { Authorization: `Bearer ${auth.token}` } }).then((r) => r.json());
          setStores(s.stores || []);
        } catch {}
        try {
          const c = await fetch(apiPath('/api/analytics/categories'), { headers: { Authorization: `Bearer ${auth.token}` } }).then((r) => r.json());
          setCategories((c.categoryCounts || []).map((x: any) => x._id));
        } catch {}
      })();
    }
  }, [auth.token, auth.user]);

  const roleLabel = auth.user?.role ?? 'guest';
  const totalIncidents = incidents?.length ?? 0;
  const openIncidents = incidents?.filter((incident) => incident.status === 'Open').length ?? 0;
  const resolvedIncidents = incidents?.filter((incident) => incident.status === 'Resolved').length ?? 0;
  const criticalIncidents = incidents?.filter((incident) => incident.severity === 'Critical').length ?? 0;

  const roleInsights = [
    {
      role: 'Employee',
      tone: 'open',
      subtitle: 'Submission overview',
      metrics: [
        { label: 'My reports', value: totalIncidents },
        { label: 'Open items', value: openIncidents },
        { label: 'Resolved', value: resolvedIncidents }
      ],
      note: 'Track what you filed, what is still open, and how quickly the team closes cases.'
    },
    {
      role: 'Manager',
      tone: 'critical',
      subtitle: 'Team performance',
      metrics: [
        { label: 'Open queue', value: analytics?.cards.openIncidents ?? openIncidents },
        { label: 'Critical', value: analytics?.cards.criticalIncidents ?? criticalIncidents },
        { label: 'Resolved', value: analytics?.cards.resolvedIncidents ?? resolvedIncidents }
      ],
      note: 'See backlog pressure, escalation hotspots, and resolution momentum across the floor.'
    },
    {
      role: 'Admin',
      tone: 'resolved',
      subtitle: 'Operational health',
      metrics: [
        { label: 'All incidents', value: analytics?.cards.totalIncidents ?? totalIncidents },
        { label: 'Stores tracked', value: stores.length || 1 },
        { label: 'Categories', value: categories.length || 1 }
      ],
      note: 'Monitor cross-site coverage, reporting hygiene, and portfolio-wide incident trends.'
    }
  ];

  const visibleRoles = auth.user?.role === 'employee' ? roleInsights.slice(0, 1) : roleInsights.slice(0, auth.user?.role === 'manager' ? 2 : 3);

  async function refreshAll() {
    // re-run incidents and analytics with filters
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filters.startDate) qs.set('startDate', filters.startDate);
      if (filters.endDate) qs.set('endDate', filters.endDate);
      if (filters.storeLocation) qs.set('storeLocation', filters.storeLocation);
      if (filters.category) qs.set('category', filters.category);

      const [incRes, anRes] = await Promise.all([
        fetch(apiPath('/api/incidents?' + qs.toString()), { headers: { Authorization: `Bearer ${auth.token}` } }),
        fetch(apiPath('/api/analytics/dashboard?' + qs.toString()), { headers: { Authorization: `Bearer ${auth.token}` } })
      ]);

      if (incRes.ok) {
        const d = await incRes.json();
        setIncidents(d.incidents ?? []);
      }

      if (anRes.ok) {
        const a = await anRes.json();
        setAnalytics(a as Analytics);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }

  async function exportCSV() {
    try {
      const qs = new URLSearchParams();
      if (filters.startDate) qs.set('startDate', filters.startDate);
      if (filters.endDate) qs.set('endDate', filters.endDate);
      if (filters.storeLocation) qs.set('storeLocation', filters.storeLocation);
      if (filters.category) qs.set('category', filters.category);

      const res = await fetch(apiPath('/api/analytics/export?' + qs.toString()), { headers: { Authorization: `Bearer ${auth.token}` } });
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'incidents_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError('Export failed');
    }
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#a4de6c'];

  return (
    <div className="app-shell">
      <section className="panel dashboard-hero">
        <div className="hero-copy">
          <div className="eyebrow">Operations dashboard</div>
          <h2>Incident control center</h2>
          <p>
            Welcome, {auth.user?.name ?? auth.user?.email ?? 'user'}. This workspace is tuned for {roleLabel} access and shows the most relevant operational signals first.
          </p>
        </div>
        <div className="hero-badges">
          <div className="hero-badge">
            <span>Role</span>
            <strong>{roleLabel}</strong>
          </div>
          <div className="hero-badge">
            <span>Total incidents</span>
            <strong>{totalIncidents}</strong>
          </div>
          <div className="hero-badge">
            <span>Open</span>
            <strong>{openIncidents}</strong>
          </div>
        </div>

        <div className="role-grid">
          {visibleRoles.map((card) => (
            <article key={card.role} className={`role-card ${card.tone}`}>
              <div className="role-card-top">
                <div>
                  <p className="role-name">{card.role}</p>
                  <h3>{card.subtitle}</h3>
                </div>
                <span className="role-chip">Sample analytics</span>
              </div>
              <div className="role-metrics">
                {card.metrics.map((metric) => (
                  <div key={metric.label} className="role-metric">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>
              <p className="role-note">{card.note}</p>
            </article>
          ))}
        </div>

        {analytics && (auth.user?.role === 'manager' || auth.user?.role === 'admin') && (
          <div className="kpi-grid dashboard-kpis">
            <div className="kpi-card accent-amber">
              <div className="label">Total incidents</div>
              <div className="value">{analytics.cards.totalIncidents}</div>
              <div className="hint">Across all filters</div>
            </div>
            <div className="kpi-card accent-blue">
              <div className="label">Open</div>
              <div className="value">{analytics.cards.openIncidents}</div>
              <div className="hint">Needs attention</div>
            </div>
            <div className="kpi-card accent-green">
              <div className="label">Resolved</div>
              <div className="value">{analytics.cards.resolvedIncidents}</div>
              <div className="hint">Closed cases</div>
            </div>
            <div className="kpi-card accent-red">
              <div className="label">Critical</div>
              <div className="value">{analytics.cards.criticalIncidents}</div>
              <div className="hint">Escalation watchlist</div>
            </div>
          </div>
        )}

        {auth.user && (auth.user.role === 'manager' || auth.user.role === 'admin') && (
          <div className="toolbar-card">
            <div className="toolbar-title">
              <strong>Analytics filters</strong>
              <span>Refine by range, store, or category</span>
            </div>
            <div className="filters-row">
            <label>
              Start
              <input type="date" value={filters.startDate ?? ''} onChange={(e) => setFilters((s) => ({ ...s, startDate: e.target.value }))} />
            </label>
            <label>
              End
              <input type="date" value={filters.endDate ?? ''} onChange={(e) => setFilters((s) => ({ ...s, endDate: e.target.value }))} />
            </label>
            <label>
              Store
              <select value={filters.storeLocation ?? ''} onChange={(e) => setFilters((s) => ({ ...s, storeLocation: e.target.value || undefined }))}>
                <option value="">All</option>
                {stores.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>
              Category
              <select value={filters.category ?? ''} onChange={(e) => setFilters((s) => ({ ...s, category: e.target.value || undefined }))}>
                <option value="">All</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <button className="btn btn-primary" onClick={() => void refreshAll()}>Apply</button>
            <button className="btn btn-ghost" onClick={() => void exportCSV()}>Export CSV</button>
            </div>
          </div>
        )}

        <div className="content-grid">
          <section className="panel section-card">
            <div className="section-head">
              <div>
                <div className="section-kicker">Live incidents</div>
                <h3>Active queue</h3>
              </div>
              <div className="section-stat">{incidents?.length ?? 0} records</div>
            </div>

            {/* Incident creation for employees */}
          {auth.user?.role === 'employee' && (
            <div className="create-card">
              <div className="section-kicker">Quick action</div>
              <h3>Create an incident</h3>
              <IncidentForm token={auth.token} onCreated={() => void refreshAll()} />
            </div>
          )}
          {loading && <div>Loading incidents…</div>}
          {error && <div style={{ color: 'crimson' }}>{error}</div>}

          {!loading && !error && (
            <>
              {incidents && incidents.length > 0 ? (
                <div className="incident-grid">
                  {incidents.map((inc) => (
                    <div key={inc._id} className="incident-card">
                      {inc.imageUrl ? (
                        // eslint-disable-next-line jsx-a11y/img-redundant-alt
                        <img src={inc.imageUrl} alt="incident thumbnail" className="incident-thumb" />
                      ) : (
                        <div className="incident-thumb" />
                      )}
                      <div className="incident-meta">
                        <div className="incident-title">{inc.title}</div>
                        <div className="incident-sub">{inc.storeLocation} • {new Date(inc.createdAt).toLocaleString()}</div>
                        <div className="incident-desc">{inc.description.length > 160 ? inc.description.slice(0, 160) + '…' : inc.description}</div>
                        {inc.aiSummary && <div className="incident-ai">AI summary: {inc.aiSummary}</div>}
                        <div className="incident-actions">
                          <div className={`pill ${inc.status.toLowerCase()}`}>{inc.status}</div>
                          <div className={`pill ${inc.severity.toLowerCase()}`}>{inc.severity}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>No incidents yet.</div>
              )}
            </>
          )}
          </section>

          {auth.user && (auth.user.role === 'manager' || auth.user.role === 'admin') && analytics && (
            <section className="panel section-card analytics-panel">
              <div className="section-head">
                <div>
                  <div className="section-kicker">Performance analytics</div>
                  <h3>Command overview</h3>
                </div>
                <div className="section-stat">Updated live</div>
              </div>

              <div className="analytics-grid modern-analytics-grid">
                <div className="chart-card">
                  <h4>Incidents over time</h4>
                  <div className="chart-wrap tall">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChartComponent token={auth.token} filters={filters} />
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card">
                  <h4>Open vs resolved</h4>
                  <div className="chart-wrap tall">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={analytics.charts.byStatus.map((d) => ({ name: d._id, value: d.count }))}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card chart-card-wide">
                  <div className="chart-card-header">
                    <h4>Category mix</h4>
                    <span>Distribution across all incident types</span>
                  </div>
                  <div className="chart-wrap short">
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie data={analytics.charts.byCategory.map((d) => ({ name: d._id, value: d.count }))} dataKey="value" nameKey="name" outerRadius={62} label>
                          {analytics.charts.byCategory.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
