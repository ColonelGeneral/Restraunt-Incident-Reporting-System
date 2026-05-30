import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

if (env.EMAIL_HOST && env.EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT ?? 587,
    secure: (env.EMAIL_PORT ?? 587) === 465,
    auth: env.EMAIL_USER && env.EMAIL_PASS ? { user: env.EMAIL_USER, pass: env.EMAIL_PASS } : undefined
  });
} else {
  console.warn('Email service not fully configured (EMAIL_HOST/EMAIL_USER missing) — notifications will be disabled.');
}

export async function sendIncidentStatusChangeEmail(to: string, incident: any, oldStatus: string, newStatus: string) {
  if (!transporter) {
    console.log('Skipping email send — transporter not configured.');
    return;
  }

  const subject = `Incident status updated: ${incident.title} — ${newStatus}`;
  const text = `Hello,

The status of your incident titled "${incident.title}" has changed from ${oldStatus} to ${newStatus}.

Description: ${incident.description}
Store: ${incident.storeLocation}

If you have questions, contact your manager.

Regards,
Incident Reporting Team`;

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_USER,
      to,
      subject,
      text
    });
    console.log('Incident status change email sent:', info.messageId);
  } catch (err) {
    console.error('Failed to send incident status change email:', err);
  }
}

export default transporter;