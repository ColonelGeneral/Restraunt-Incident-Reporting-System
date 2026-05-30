import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';
import { Incident } from '../models/incident.model.js';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', authenticateUser, authorizeRoles('manager', 'admin'), async (_, response) => {
  const [statusCounts, severityCounts, categoryCounts, totalIncidents] = await Promise.all([
    Incident.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Incident.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    Incident.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    Incident.countDocuments()
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