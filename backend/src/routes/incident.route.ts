import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { env } from '../config/env.js';
import { authenticateUser, authorizeRoles, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { AuditLog } from '../models/auditLog.model.js';
import { Incident } from '../models/incident.model.js';
import { User } from '../models/user.model.js';
import { sendIncidentStatusChangeEmail } from '../services/email.service.js';
import { analyzeIncidentDescription } from '../services/gemini.service.js';

export const incidentRouter = Router();

const incidentSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  storeLocation: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal('')),
  aiSummary: z.string().optional(),
  generatedSummary: z.boolean().optional()
});

const incidentUpdateSchema = incidentSchema.partial().extend({
  status: z.enum(['Open', 'In Progress', 'Resolved']).optional()
});

function getDeleteDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + env.DELETE_WINDOW_MINUTES * 60 * 1000);
}

function canDeleteIncident(incident: { createdAt?: Date }) {
  if (!incident.createdAt) {
    return false;
  }

  return Date.now() <= getDeleteDeadline(incident.createdAt).getTime();
}

incidentRouter.post('/', authenticateUser, authorizeRoles('employee', 'manager', 'admin'), async (request: AuthenticatedRequest, response) => {
  const parsed = incidentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ message: 'Invalid incident payload' });
  }

  const currentUser = request.user;

  if (!currentUser) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  const aiData = parsed.data.generatedSummary
    ? await analyzeIncidentDescription(parsed.data.description)
    : null;

  const incident = await Incident.create({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    severity: parsed.data.severity,
    status: 'Open',
    storeLocation: parsed.data.storeLocation,
    imageUrl: parsed.data.imageUrl ?? '',
    aiSummary: parsed.data.aiSummary ?? aiData?.summary ?? '',
    createdBy: new Types.ObjectId(currentUser.userId)
  });

  await AuditLog.create({
    incidentId: incident._id,
    action: 'created',
    oldValue: null,
    newValue: incident.toObject(),
    performedBy: new Types.ObjectId(currentUser.userId)
  });

  return response.status(201).json({ incident });
});

incidentRouter.get('/', authenticateUser, async (request: AuthenticatedRequest, response) => {
  const currentUser = request.user;

  if (!currentUser) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  const query: Record<string, unknown> = {};

  if (currentUser.role === 'employee') {
    query.createdBy = currentUser.userId;
  }

  if (typeof request.query.status === 'string') {
    query.status = request.query.status;
  }

  if (typeof request.query.category === 'string') {
    query.category = request.query.category;
  }

  if (typeof request.query.severity === 'string') {
    query.severity = request.query.severity;
  }

  if (typeof request.query.storeLocation === 'string') {
    query.storeLocation = request.query.storeLocation;
  }

  if (typeof request.query.search === 'string' && request.query.search.trim()) {
    query.$or = [
      { title: { $regex: request.query.search.trim(), $options: 'i' } },
      { description: { $regex: request.query.search.trim(), $options: 'i' } },
      { storeLocation: { $regex: request.query.search.trim(), $options: 'i' } }
    ];
  }

  const incidents = await Incident.find(query).sort({ createdAt: -1 });

  return response.json({
    incidents: incidents.map((incident) => ({
      ...incident.toObject(),
      canDelete: ['manager', 'admin'].includes(currentUser.role) && canDeleteIncident(incident)
    }))
  });
});

incidentRouter.get('/:id', authenticateUser, async (request: AuthenticatedRequest, response) => {
  const currentUser = request.user;

  if (!currentUser) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  const incident = await Incident.findById(request.params.id);

  if (!incident) {
    return response.status(404).json({ message: 'Incident not found' });
  }

  const isOwner = String(incident.createdBy) === currentUser.userId;

  if (currentUser.role === 'employee' && !isOwner) {
    return response.status(403).json({ message: 'Insufficient permissions' });
  }

  return response.json({
    incident: {
      ...incident.toObject(),
      canDelete: ['manager', 'admin'].includes(currentUser.role) && canDeleteIncident(incident)
    }
  });
});

incidentRouter.patch('/:id', authenticateUser, async (request: AuthenticatedRequest, response) => {
  const parsed = incidentUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ message: 'Invalid incident update payload' });
  }

  const currentUser = request.user;

  if (!currentUser) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  const incident = await Incident.findById(request.params.id);

  if (!incident) {
    return response.status(404).json({ message: 'Incident not found' });
  }

  const isOwner = incident.createdBy.toString() === currentUser.userId;
  const isPrivileged = ['manager', 'admin'].includes(currentUser.role);

  if (!isOwner && !isPrivileged) {
    return response.status(403).json({ message: 'Insufficient permissions' });
  }

  // New rule: once an employee creates an incident it cannot be edited by that employee.
  // Managers and admins remain able to edit incidents.
  if (isOwner && currentUser.role === 'employee' && !isPrivileged) {
    return response.status(403).json({ message: 'Employees cannot edit incidents after creation' });
  }

  const previousState = incident.toObject();
  Object.assign(incident, parsed.data);
  await incident.save();

  await AuditLog.create({
    incidentId: incident._id,
    action: 'updated',
    oldValue: previousState,
    newValue: incident.toObject(),
    performedBy: new Types.ObjectId(currentUser.userId)
  });

  return response.json({ incident });
});

incidentRouter.patch('/:id/status', authenticateUser, authorizeRoles('manager', 'admin'), async (request: AuthenticatedRequest, response) => {
  const statusSchema = z.object({
    status: z.enum(['Open', 'In Progress', 'Resolved'])
  });

  const parsed = statusSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ message: 'Valid status is required' });
  }

  const incident = await Incident.findById(request.params.id);

  if (!incident) {
    return response.status(404).json({ message: 'Incident not found' });
  }

  const previousStatus = incident.status;
  incident.status = parsed.data.status;
  await incident.save();

  await AuditLog.create({
    incidentId: incident._id,
    action: 'status_changed',
    oldValue: previousStatus,
    newValue: parsed.data.status,
    performedBy: new Types.ObjectId(request.user!.userId)
  });

  // Notify the incident creator by email about the status change (best-effort)
  try {
    const creator = await User.findById(incident.createdBy);
    if (creator && creator.email) {
      // fire-and-forget; don't block the response
      void sendIncidentStatusChangeEmail(creator.email, incident.toObject(), previousStatus, parsed.data.status);
    }
  } catch (err) {
    console.error('Failed to lookup creator or send notification:', err);
  }

  return response.json({ incident });
});

incidentRouter.delete('/:id', authenticateUser, authorizeRoles('manager', 'admin'), async (request: AuthenticatedRequest, response) => {
  const incident = await Incident.findById(request.params.id);

  if (!incident) {
    return response.status(404).json({ message: 'Incident not found' });
  }

  if (!canDeleteIncident(incident)) {
    return response.status(400).json({ message: 'Delete window has expired' });
  }

  await AuditLog.create({
    incidentId: incident._id,
    action: 'deleted',
    oldValue: incident.toObject(),
    newValue: null,
    performedBy: new Types.ObjectId(request.user!.userId)
  });

  await incident.deleteOne();

  return response.json({ message: 'Incident deleted' });
});