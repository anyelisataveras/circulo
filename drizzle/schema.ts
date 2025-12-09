import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, decimal, serial } from "drizzle-orm/pg-core";

// Define enums for PostgreSQL
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const languageEnum = pgEnum("language", ["en", "es", "ca", "eu"]);
export const grantStatusEnum = pgEnum("grant_status", ["monitoring", "preparing", "submitted", "awarded", "rejected", "archived"]);
export const applicationStatusEnum = pgEnum("application_status", ["draft", "in_review", "submitted", "awarded", "rejected", "withdrawn"]);
export const budgetFundingSourceEnum = pgEnum("budget_funding_source", ["grant", "co_financing", "in_kind"]);
export const activityStatusEnum = pgEnum("activity_status", ["planned", "in_progress", "completed", "cancelled"]);
export const reportTypeEnum = pgEnum("report_type", ["interim", "final", "financial", "technical"]);
export const reportStatusEnum = pgEnum("report_status", ["draft", "submitted", "approved", "revision_requested"]);
export const auditStatusEnum = pgEnum("audit_status", ["scheduled", "in_progress", "completed", "passed", "failed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["deadline", "status_change", "document_expiry", "general"]);
export const auditLogStatusEnum = pgEnum("audit_log_status", ["success", "failure", "error"]);
export const messageTypeEnum = pgEnum("message_type", ["text", "voice", "image", "document", "video"]);
export const transcriptionStatusEnum = pgEnum("transcription_status", ["pending", "processing", "completed", "failed"]);
export const emailStatusEnum = pgEnum("email_status", ["pending", "sent", "failed", "bounced"]);
export const aiSessionTypeEnum = pgEnum("ai_session_type", ["review", "translation", "generation", "correction", "chat"]);
export const aiSessionStatusEnum = pgEnum("ai_session_status", ["processing", "completed", "failed"]);
export const impactReportTypeEnum = pgEnum("impact_report_type", ["annual", "quarterly", "project", "donor", "custom"]);
export const impactReportStatusEnum = pgEnum("impact_report_status", ["draft", "review", "finalized", "sent"]);
export const verificationStatusEnum = pgEnum("verification_status", ["unverified", "verified", "audited"]);
export const participationStatusEnum = pgEnum("participation_status", ["active", "completed", "dropped"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["pending", "processing", "completed", "failed"]);

/**
 * Core user table backing auth flow.
 * Uses Supabase Auth UUID as the primary identifier.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseUserId: varchar("supabase_user_id", { length: 64 }).notNull().unique(), // Supabase Auth UUID
  openId: varchar("open_id", { length: 64 }), // Legacy field for migration
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  preferredLanguage: languageEnum("preferred_language").default("en").notNull(),
  googleId: varchar("google_id", { length: 255 }),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Grant opportunities from various funding sources
 */
export const grantOpportunities = pgTable("grant_opportunities", {
  id: serial("id").primaryKey(),
  fundingSource: varchar("funding_source", { length: 255 }).notNull(),
  programTitle: varchar("program_title", { length: 500 }).notNull(),
  publicationDate: timestamp("publication_date"),
  applicationStartDate: timestamp("application_start_date"),
  applicationDeadline: timestamp("application_deadline").notNull(),
  minAmount: integer("min_amount"),
  maxAmount: integer("max_amount"),
  coFinancingPercentage: integer("co_financing_percentage"),
  eligibilityCriteria: text("eligibility_criteria"),
  thematicArea: varchar("thematic_area", { length: 255 }),
  geographicScope: varchar("geographic_scope", { length: 255 }),
  strategicFitScore: integer("strategic_fit_score"),
  priorityScore: integer("priority_score"),
  status: grantStatusEnum("status").default("monitoring").notNull(),
  assignedToUserId: integer("assigned_to_user_id"),
  callDocumentationUrl: text("call_documentation_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GrantOpportunity = typeof grantOpportunities.$inferSelect;
export type InsertGrantOpportunity = typeof grantOpportunities.$inferInsert;

/**
 * Grant applications submitted by the organization
 */
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  grantOpportunityId: integer("grant_opportunity_id").notNull(),
  projectTitle: varchar("project_title", { length: 500 }).notNull(),
  status: applicationStatusEnum("status").default("draft").notNull(),
  submissionDate: timestamp("submission_date"),
  requestedAmount: integer("requested_amount"),
  coFinancingAmount: integer("co_financing_amount"),
  projectStartDate: timestamp("project_start_date"),
  projectEndDate: timestamp("project_end_date"),
  projectDuration: integer("project_duration"),
  targetBeneficiaries: text("target_beneficiaries"),
  geographicScope: varchar("geographic_scope", { length: 255 }),
  eligibilityCheckCompleted: boolean("eligibility_check_completed").default(false),
  eligibilityNotes: text("eligibility_notes"),
  assignedToUserId: integer("assigned_to_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Project design and narrative for each application
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().unique(),
  problemStatement: text("problem_statement"),
  objectives: text("objectives"),
  activities: text("activities"),
  expectedResults: text("expected_results"),
  indicators: text("indicators"),
  methodology: text("methodology"),
  innovationAspects: text("innovation_aspects"),
  sustainabilityPlan: text("sustainability_plan"),
  riskAssessment: text("risk_assessment"),
  timeline: text("timeline"),
  logicalFramework: text("logical_framework"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Budget items for each application
 */
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity"),
  unitCost: integer("unit_cost"),
  totalCost: integer("total_cost"),
  fundingSource: budgetFundingSourceEnum("funding_source").notNull(),
  justification: text("justification"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

/**
 * Partners involved in grant applications
 */
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  organizationName: varchar("organization_name", { length: 500 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 255 }),
  country: varchar("country", { length: 100 }),
  contribution: text("contribution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

/**
 * Documents related to applications and organization
 */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id"),
  documentType: varchar("document_type", { length: 255 }).notNull(),
  documentName: varchar("document_name", { length: 500 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  expirationDate: timestamp("expiration_date"),
  uploadedByUserId: integer("uploaded_by_user_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Activities executed as part of awarded grants
 */
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  projectId: integer("project_id"),
  activityName: varchar("activity_name", { length: 500 }).notNull(),
  description: text("description"),
  plannedStartDate: timestamp("planned_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  status: activityStatusEnum("status").default("planned").notNull(),
  participantCount: integer("participant_count"),
  location: varchar("location", { length: 255 }),
  responsibleUserId: integer("responsible_user_id"),
  progressPercentage: integer("progress_percentage").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Expenses incurred during grant execution
 */
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  budgetItemId: integer("budget_item_id"),
  expenseDate: timestamp("expense_date").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  vendor: varchar("vendor", { length: 500 }),
  invoiceNumber: varchar("invoice_number", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 100 }),
  paymentDate: timestamp("payment_date"),
  receiptUrl: text("receipt_url"),
  receiptFileKey: varchar("receipt_file_key", { length: 500 }),
  isEligible: boolean("is_eligible").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Reports submitted to funders
 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  reportType: reportTypeEnum("report_type").notNull(),
  reportingPeriodStart: timestamp("reporting_period_start"),
  reportingPeriodEnd: timestamp("reporting_period_end"),
  dueDate: timestamp("due_date"),
  submissionDate: timestamp("submission_date"),
  status: reportStatusEnum("status").default("draft").notNull(),
  content: text("content"),
  documentUrl: text("document_url"),
  documentFileKey: varchar("document_file_key", { length: 500 }),
  submittedByUserId: integer("submitted_by_user_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Audit trail and justification documentation
 */
export const auditRecords = pgTable("audit_records", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  auditDate: timestamp("audit_date"),
  auditType: varchar("audit_type", { length: 255 }),
  auditor: varchar("auditor", { length: 500 }),
  findings: text("findings"),
  recommendations: text("recommendations"),
  status: auditStatusEnum("status").default("scheduled").notNull(),
  documentUrl: text("document_url"),
  documentFileKey: varchar("document_file_key", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AuditRecord = typeof auditRecords.$inferSelect;
export type InsertAuditRecord = typeof auditRecords.$inferInsert;

/**
 * Notifications and reminders for deadlines
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  type: notificationTypeEnum("type").notNull(),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  relatedEntityId: integer("related_entity_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * API credentials for external integrations
 */
export const apiCredentials = pgTable("api_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  credentialType: varchar("credential_type", { length: 100 }).notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ApiCredential = typeof apiCredentials.$inferSelect;
export type InsertApiCredential = typeof apiCredentials.$inferInsert;

/**
 * Audit log for security and compliance
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }),
  entityId: integer("entity_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: text("metadata"),
  status: auditLogStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Translations for multi-language support
 */
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: integer("entity_id").notNull(),
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  language: languageEnum("language").notNull(),
  translatedText: text("translated_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;

/**
 * Google Drive file references
 */
export const googleDriveFiles = pgTable("google_drive_files", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  googleFileId: varchar("google_file_id", { length: 255 }).notNull(),
  googleFileName: varchar("google_file_name", { length: 500 }),
  googleMimeType: varchar("google_mime_type", { length: 100 }),
  googleWebViewLink: text("google_web_view_link"),
  syncEnabled: boolean("sync_enabled").default(false),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GoogleDriveFile = typeof googleDriveFiles.$inferSelect;
export type InsertGoogleDriveFile = typeof googleDriveFiles.$inferInsert;

/**
 * WhatsApp messages received via N8N
 */
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }),
  messageType: messageTypeEnum("message_type").notNull(),
  messageContent: text("message_content"),
  originalAudioUrl: text("original_audio_url"),
  transcriptionStatus: transcriptionStatusEnum("transcription_status"),
  mediaUrl: text("media_url"),
  mediaFileKey: varchar("media_file_key", { length: 500 }),
  applicationId: integer("application_id"),
  isProcessed: boolean("is_processed").default(false),
  processedAt: timestamp("processed_at"),
  metadata: text("metadata"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

/**
 * Email notifications sent to users
 */
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  emailType: varchar("email_type", { length: 100 }).notNull(),
  templateName: varchar("template_name", { length: 255 }),
  content: text("content"),
  relatedEntityType: varchar("related_entity_type", { length: 100 }),
  relatedEntityId: integer("related_entity_id"),
  status: emailStatusEnum("status").default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * AI-powered document assistance sessions
 */
export const aiAssistanceSessions = pgTable("ai_assistance_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionType: aiSessionTypeEnum("session_type").notNull(),
  applicationId: integer("application_id"),
  documentId: integer("document_id"),
  inputText: text("input_text"),
  outputText: text("output_text"),
  sourceLanguage: languageEnum("source_language"),
  targetLanguage: languageEnum("target_language"),
  suggestions: text("suggestions"),
  tokensUsed: integer("tokens_used"),
  model: varchar("model", { length: 100 }),
  status: aiSessionStatusEnum("status").default("processing").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type AiAssistanceSession = typeof aiAssistanceSessions.$inferSelect;
export type InsertAiAssistanceSession = typeof aiAssistanceSessions.$inferInsert;

/**
 * N8N webhook configurations
 */
export const n8nWebhooks = pgTable("n8n_webhooks", {
  id: serial("id").primaryKey(),
  webhookName: varchar("webhook_name", { length: 255 }).notNull(),
  webhookUrl: text("webhook_url").notNull(),
  webhookType: varchar("webhook_type", { length: 100 }).notNull(),
  authToken: varchar("auth_token", { length: 500 }),
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").default(0),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type N8nWebhook = typeof n8nWebhooks.$inferSelect;
export type InsertN8nWebhook = typeof n8nWebhooks.$inferInsert;

/**
 * NGO Organization Profile
 */
export const organizationProfile = pgTable("organization_profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Owner user
  organizationName: varchar("organization_name", { length: 500 }).notNull(),
  legalName: varchar("legal_name", { length: 500 }),
  taxId: varchar("tax_id", { length: 100 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  foundedYear: integer("founded_year"),
  organizationType: varchar("organization_type", { length: 100 }),
  missionStatement: text("mission_statement"),
  visionStatement: text("vision_statement"),
  thematicAreas: text("thematic_areas"),
  geographicScope: text("geographic_scope"),
  targetBeneficiaries: text("target_beneficiaries"),
  address: text("address"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 255 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 500 }),
  socialMedia: text("social_media"),
  logoUrl: text("logo_url"),
  logoFileKey: varchar("logo_file_key", { length: 500 }),
  staffCount: integer("staff_count"),
  volunteerCount: integer("volunteer_count"),
  annualBudget: integer("annual_budget"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OrganizationProfile = typeof organizationProfile.$inferSelect;
export type InsertOrganizationProfile = typeof organizationProfile.$inferInsert;

/**
 * Impact Metrics
 */
export const impactMetrics = pgTable("impact_metrics", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id"),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  metricCategory: varchar("metric_category", { length: 100 }),
  metricValue: integer("metric_value").notNull(),
  metricUnit: varchar("metric_unit", { length: 100 }),
  description: text("description"),
  reportingPeriodStart: timestamp("reporting_period_start"),
  reportingPeriodEnd: timestamp("reporting_period_end"),
  dataSource: varchar("data_source", { length: 255 }),
  verificationStatus: verificationStatusEnum("verification_status").default("unverified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type InsertImpactMetric = typeof impactMetrics.$inferInsert;

/**
 * Impact Reports
 */
export const impactReports = pgTable("impact_reports", {
  id: serial("id").primaryKey(),
  reportTitle: varchar("report_title", { length: 500 }).notNull(),
  reportType: impactReportTypeEnum("report_type").notNull(),
  applicationId: integer("application_id"),
  reportingPeriodStart: timestamp("reporting_period_start").notNull(),
  reportingPeriodEnd: timestamp("reporting_period_end").notNull(),
  status: impactReportStatusEnum("status").default("draft").notNull(),
  content: text("content"),
  generatedByAi: boolean("generated_by_ai").default(false),
  aiPrompt: text("ai_prompt"),
  includedMetrics: text("included_metrics"),
  targetAudience: varchar("target_audience", { length: 255 }),
  language: languageEnum("language").default("en").notNull(),
  pdfUrl: text("pdf_url"),
  pdfFileKey: varchar("pdf_file_key", { length: 500 }),
  createdByUserId: integer("created_by_user_id").notNull(),
  lastEditedByUserId: integer("last_edited_by_user_id"),
  version: integer("version").default(1).notNull(),
  parentReportId: integer("parent_report_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  finalizedAt: timestamp("finalized_at"),
  sentAt: timestamp("sent_at"),
});

export type ImpactReport = typeof impactReports.$inferSelect;
export type InsertImpactReport = typeof impactReports.$inferInsert;

/**
 * Report Templates
 */
export const reportTemplates = pgTable("report_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  templateType: varchar("template_type", { length: 100 }).notNull(),
  description: text("description"),
  structure: text("structure"),
  defaultSections: text("default_sections"),
  isPublic: boolean("is_public").default(false),
  createdByUserId: integer("created_by_user_id"),
  language: languageEnum("language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

/**
 * Beneficiaries/Participants
 */
export const beneficiaries = pgTable("beneficiaries", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id"),
  activityId: integer("activity_id"),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  isAnonymized: boolean("is_anonymized").default(false),
  anonymizedId: varchar("anonymized_id", { length: 100 }),
  age: integer("age"),
  gender: varchar("gender", { length: 50 }),
  location: varchar("location", { length: 255 }),
  category: varchar("category", { length: 100 }),
  participationDate: timestamp("participation_date"),
  participationStatus: participationStatusEnum("participation_status").default("active"),
  notes: text("notes"),
  consentGiven: boolean("consent_given").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = typeof beneficiaries.$inferInsert;

/**
 * Impact Stories Library
 */
export const impactStories = pgTable("impact_stories", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  beneficiaryType: varchar("beneficiary_type", { length: 255 }),
  location: varchar("location", { length: 255 }),
  impact: text("impact"),
  metrics: text("metrics"),
  language: languageEnum("language").default("en").notNull(),
  tags: text("tags"),
  applicationId: integer("application_id"),
  createdByUserId: integer("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ImpactStory = typeof impactStories.$inferSelect;
export type InsertImpactStory = typeof impactStories.$inferInsert;

/**
 * Report Documents
 */
export const reportDocuments = pgTable("report_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  analysisStatus: analysisStatusEnum("analysis_status").default("pending").notNull(),
  analysisResult: text("analysis_result"),
  extractedMetrics: text("extracted_metrics"),
  extractedStories: text("extracted_stories"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  analyzedAt: timestamp("analyzed_at"),
});

export type ReportDocument = typeof reportDocuments.$inferSelect;
export type InsertReportDocument = typeof reportDocuments.$inferInsert;
