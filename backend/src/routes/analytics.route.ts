import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { Incident } from '../models/incident.model.js';

export const analyticsRouter = Router();

function buildMatchFromQuery(q: any) {
  const match: any = {};
  if (q.storeLocation) match.storeLocation = q.storeLocation;
  if (q.category) match.category = q.category;
  if (q.severity) match.severity = q.severity;
  if (q.startDate || q.endDate) {
    match.createdAt = {};
    if (q.startDate) match.createdAt.$gte = new Date(q.startDate);
    if (q.endDate) match.createdAt.$lte = new Date(q.endDate);
  }
  return match;
}

analyticsRouter.get('/dashboard', authenticateUser, authorizeRoles('manager', 'admin'), async (request, response) => {
  const match = buildMatchFromQuery(request.query);

  const [statusCounts, severityCounts, categoryCounts, totalIncidents] = await Promise.all([
    Incident.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Incident.aggregate([{ $match: match }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Incident.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Incident.countDocuments(match)
  ]);

  const openCount = statusCounts.find((entry) => entry._id === 'Open')?.count ?? 0;
  const resolvedCount = statusCounts.find((entry) => entry._id === 'Resolved')?.count ?? 0;
  const criticalCount = severityCounts.find((entry) => entry._id === 'Critical')?.count ?? 0;

  return response.json({
    cards: {
      totalIncidents,
      openIncidents: openCount,
      resolvedIncidents: resolvedCount,
      criticalIncidents: criticalCount
    },
    charts: {
      byStatus: statusCounts,
      bySeverity: severityCounts,
      byCategory: categoryCounts
    }
  });
});

// Monthly time-series over the requested range (default last 6 months)
analyticsRouter.get('/monthly', authenticateUser, authorizeRoles('manager', 'admin'), async (request, response) => {
  const months = Number(request.query.months ?? 6);
  const end = request.query.endDate ? new Date(String(request.query.endDate)) : new Date();
  const start = request.query.startDate ? new Date(String(request.query.startDate)) : new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);

  const match = buildMatchFromQuery(request.query);
  match.createdAt = { $gte: start, $lte: end };

  const series = await Incident.aggregate([
    { $match: match },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Build labels for each month in range and map counts
  const labels: Array<{ label: string; year: number; month: number }> = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    labels.push({ label: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`, year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const map = new Map(series.map((s: any) => [`${s._id.year}-${s._id.month}`, s.count]));
  const result = labels.map((l) => ({ month: l.label, count: map.get(`${l.year}-${l.month}`) ?? 0 }));

  return response.json({ series: result });
});

analyticsRouter.get('/stores', authenticateUser, authorizeRoles('manager', 'admin'), async (_, response) => {
  const stores = await Incident.distinct('storeLocation');
  return response.json({ stores });
});

analyticsRouter.get('/severity', authenticateUser, authorizeRoles('manager', 'admin'), async (_, response) => {
  const severityCounts = await Incident.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  return response.json({ severityCounts });
});

analyticsRouter.get('/categories', authenticateUser, authorizeRoles('manager', 'admin'), async (_, response) => {
  const categoryCounts = await Incident.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return response.json({ categoryCounts });
});

// Export incidents as CSV with optional filters
analyticsRouter.get('/export', authenticateUser, authorizeRoles('manager', 'admin'), async (request, response) => {
  const match = buildMatchFromQuery(request.query);
  const incidents = await Incident.find(match).sort({ createdAt: -1 }).lean();

  const fields = ['_id', 'title', 'description', 'severity', 'status', 'storeLocation', 'createdAt', 'createdBy'];

  const escapeCsv = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvLines = [fields.join(',')];
  for (const incident of incidents as Record<string, unknown>[]) {
    csvLines.push(fields.map((field) => escapeCsv(incident[field])).join(','));
  }

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', 'attachment; filename="incidents_export.csv"');
  return response.send(csvLines.join('\n'));
});