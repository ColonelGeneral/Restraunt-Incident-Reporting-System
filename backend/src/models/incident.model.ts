import { Schema, model, type Types } from 'mongoose';

const incidentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    status: {
      type: String,
      default: 'Open',
      enum: ['Open', 'In Progress', 'Resolved']
    },
    storeLocation: {
      type: String,
      required: true,
      trim: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    aiSummary: {
      type: String,
      default: ''
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deleteLockedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

export type IncidentDocument = {
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId | null;
};

export const Incident = model('Incident', incidentSchema);
