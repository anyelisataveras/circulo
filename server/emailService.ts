import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email service for sending notifications to users
 * Supports deadline reminders, status updates, and general notifications
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

/**
 * Initialize email transporter
 * Uses SMTP configuration from environment variables
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[Email] SMTP not configured. Emails will be logged but not sent.');
    // Return a test transporter that logs emails
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@grant-manager.app';

    const info = await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('[Email] Sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Email templates
 */

export function getDeadlineReminderTemplate(data: {
  userName: string;
  grantTitle: string;
  deadline: string;
  daysRemaining: number;
  applicationUrl: string;
}): EmailTemplate {
  const { userName, grantTitle, deadline, daysRemaining, applicationUrl } = data;

  return {
    subject: `Reminder: ${grantTitle} deadline in ${daysRemaining} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Grant Application Deadline Reminder</h2>
        <p>Hello ${userName},</p>
        <p>This is a reminder that the deadline for <strong>${grantTitle}</strong> is approaching.</p>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Deadline:</strong> ${deadline}</p>
          <p style="margin: 8px 0 0 0;"><strong>Days Remaining:</strong> ${daysRemaining}</p>
        </div>
        <p>Make sure to complete and submit your application before the deadline.</p>
        <a href="${applicationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Application
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
          This is an automated reminder from your Grant Management System.
        </p>
      </div>
    `,
    text: `
Grant Application Deadline Reminder

Hello ${userName},

This is a reminder that the deadline for ${grantTitle} is approaching.

Deadline: ${deadline}
Days Remaining: ${daysRemaining}

Make sure to complete and submit your application before the deadline.

View your application: ${applicationUrl}

This is an automated reminder from your Grant Management System.
    `.trim(),
  };
}

export function getStatusUpdateTemplate(data: {
  userName: string;
  grantTitle: string;
  oldStatus: string;
  newStatus: string;
  applicationUrl: string;
}): EmailTemplate {
  const { userName, grantTitle, oldStatus, newStatus, applicationUrl } = data;

  return {
    subject: `Status Update: ${grantTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Status Update</h2>
        <p>Hello ${userName},</p>
        <p>The status of your grant application has been updated.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Grant:</strong> ${grantTitle}</p>
          <p style="margin: 8px 0 0 0;"><strong>Previous Status:</strong> ${oldStatus}</p>
          <p style="margin: 8px 0 0 0;"><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatus}</span></p>
        </div>
        <a href="${applicationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Application
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
          This is an automated notification from your Grant Management System.
        </p>
      </div>
    `,
    text: `
Application Status Update

Hello ${userName},

The status of your grant application has been updated.

Grant: ${grantTitle}
Previous Status: ${oldStatus}
New Status: ${newStatus}

View your application: ${applicationUrl}

This is an automated notification from your Grant Management System.
    `.trim(),
  };
}

export function getDocumentExpiryTemplate(data: {
  userName: string;
  documentName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  documentsUrl: string;
}): EmailTemplate {
  const { userName, documentName, expiryDate, daysUntilExpiry, documentsUrl } = data;

  return {
    subject: `Document Expiry Alert: ${documentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Document Expiry Alert</h2>
        <p>Hello ${userName},</p>
        <p>One of your documents is about to expire and needs to be renewed.</p>
        <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Document:</strong> ${documentName}</p>
          <p style="margin: 8px 0 0 0;"><strong>Expiry Date:</strong> ${expiryDate}</p>
          <p style="margin: 8px 0 0 0;"><strong>Days Until Expiry:</strong> ${daysUntilExpiry}</p>
        </div>
        <p>Please update this document to ensure your grant applications remain valid.</p>
        <a href="${documentsUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Manage Documents
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
          This is an automated alert from your Grant Management System.
        </p>
      </div>
    `,
    text: `
Document Expiry Alert

Hello ${userName},

One of your documents is about to expire and needs to be renewed.

Document: ${documentName}
Expiry Date: ${expiryDate}
Days Until Expiry: ${daysUntilExpiry}

Please update this document to ensure your grant applications remain valid.

Manage your documents: ${documentsUrl}

This is an automated alert from your Grant Management System.
    `.trim(),
  };
}

export function getWelcomeTemplate(data: {
  userName: string;
  dashboardUrl: string;
}): EmailTemplate {
  const { userName, dashboardUrl } = data;

  return {
    subject: 'Welcome to Grant Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Grant Management System!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for joining our Grant Management System. We're here to help you streamline your grant application process from identification to final justification.</p>
        <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">What you can do:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Track grant opportunities from multiple sources</li>
            <li>Manage applications and deadlines</li>
            <li>Organize documents and compliance materials</li>
            <li>Monitor budgets and expenses</li>
            <li>Generate reports and track progress</li>
          </ul>
        </div>
        <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Go to Dashboard
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
          If you have any questions, please don't hesitate to reach out.
        </p>
      </div>
    `,
    text: `
Welcome to Grant Management System!

Hello ${userName},

Thank you for joining our Grant Management System. We're here to help you streamline your grant application process from identification to final justification.

What you can do:
- Track grant opportunities from multiple sources
- Manage applications and deadlines
- Organize documents and compliance materials
- Monitor budgets and expenses
- Generate reports and track progress

Go to your dashboard: ${dashboardUrl}

If you have any questions, please don't hesitate to reach out.
    `.trim(),
  };
}
