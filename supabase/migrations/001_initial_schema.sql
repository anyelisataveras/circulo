-- =====================================================
-- Circulo Grant Manager - Supabase Database Migration
-- Version: 1.0.0
-- Description: Initial schema creation for all tables
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE preferred_language AS ENUM ('en', 'es', 'ca', 'eu');
CREATE TYPE grant_status AS ENUM ('monitoring', 'preparing', 'submitted', 'awarded', 'rejected', 'archived');
CREATE TYPE application_status AS ENUM ('draft', 'in_review', 'submitted', 'awarded', 'rejected', 'withdrawn');
CREATE TYPE activity_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE report_type AS ENUM ('interim', 'final', 'financial', 'technical');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'revision_requested');
CREATE TYPE audit_status AS ENUM ('scheduled', 'in_progress', 'completed', 'passed', 'failed');
CREATE TYPE notification_type AS ENUM ('deadline', 'status_change', 'document_expiry', 'general');
CREATE TYPE audit_log_status AS ENUM ('success', 'failure', 'error');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'image', 'document', 'video');
CREATE TYPE transcription_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed', 'bounced');
CREATE TYPE ai_session_type AS ENUM ('review', 'translation', 'generation', 'correction', 'chat');
CREATE TYPE ai_session_status AS ENUM ('processing', 'completed', 'failed');
CREATE TYPE funding_source_type AS ENUM ('grant', 'co_financing', 'in_kind');
CREATE TYPE impact_report_type AS ENUM ('annual', 'quarterly', 'project', 'donor', 'custom');
CREATE TYPE impact_report_status AS ENUM ('draft', 'review', 'finalized', 'sent');
CREATE TYPE participation_status AS ENUM ('active', 'completed', 'dropped');
CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'audited');
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id BIGSERIAL PRIMARY KEY,
  open_id VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  login_method VARCHAR(64),
  role user_role DEFAULT 'user' NOT NULL,
  preferred_language preferred_language DEFAULT 'en' NOT NULL,
  google_id VARCHAR(255),
  google_access_token TEXT, -- Will be encrypted
  google_refresh_token TEXT, -- Will be encrypted
  google_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_signed_in TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Grant Opportunities
CREATE TABLE public.grant_opportunities (
  id BIGSERIAL PRIMARY KEY,
  funding_source VARCHAR(255) NOT NULL,
  program_title VARCHAR(500) NOT NULL,
  publication_date TIMESTAMPTZ,
  application_start_date TIMESTAMPTZ,
  application_deadline TIMESTAMPTZ NOT NULL,
  min_amount INTEGER,
  max_amount INTEGER,
  co_financing_percentage INTEGER CHECK (co_financing_percentage >= 0 AND co_financing_percentage <= 100),
  eligibility_criteria TEXT,
  thematic_area VARCHAR(255),
  geographic_scope VARCHAR(255),
  strategic_fit_score INTEGER CHECK (strategic_fit_score >= 1 AND strategic_fit_score <= 5),
  priority_score INTEGER,
  status grant_status DEFAULT 'monitoring' NOT NULL,
  assigned_to_user_id BIGINT,
  call_documentation_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Applications
CREATE TABLE public.applications (
  id BIGSERIAL PRIMARY KEY,
  grant_opportunity_id BIGINT NOT NULL,
  project_title VARCHAR(500) NOT NULL,
  status application_status DEFAULT 'draft' NOT NULL,
  submission_date TIMESTAMPTZ,
  requested_amount INTEGER,
  co_financing_amount INTEGER,
  project_start_date TIMESTAMPTZ,
  project_end_date TIMESTAMPTZ,
  project_duration INTEGER,
  target_beneficiaries TEXT,
  geographic_scope VARCHAR(255),
  eligibility_check_completed BOOLEAN DEFAULT FALSE,
  eligibility_notes TEXT,
  assigned_to_user_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Projects
CREATE TABLE public.projects (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL UNIQUE,
  problem_statement TEXT,
  objectives TEXT, -- JSON
  activities TEXT, -- JSON
  expected_results TEXT,
  indicators TEXT, -- JSON
  methodology TEXT,
  innovation_aspects TEXT,
  sustainability_plan TEXT,
  risk_assessment TEXT,
  timeline TEXT, -- JSON
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Budget Items
CREATE TABLE public.budget_items (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER,
  unit_cost INTEGER, -- in cents
  total_cost INTEGER, -- in cents
  funding_source funding_source_type NOT NULL,
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Partners
CREATE TABLE public.partners (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  organization_name VARCHAR(500) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(320),
  phone VARCHAR(50),
  role VARCHAR(255),
  country VARCHAR(100),
  contribution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Documents
CREATE TABLE public.documents (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT,
  document_type VARCHAR(255) NOT NULL,
  document_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  expiration_date TIMESTAMPTZ,
  uploaded_by_user_id BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Activities
CREATE TABLE public.activities (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  activity_name VARCHAR(500) NOT NULL,
  description TEXT,
  planned_start_date TIMESTAMPTZ,
  planned_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  status activity_status DEFAULT 'planned' NOT NULL,
  participant_count INTEGER,
  location VARCHAR(255),
  responsible_user_id BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Expenses
CREATE TABLE public.expenses (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  budget_item_id BIGINT,
  expense_date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  vendor VARCHAR(500),
  invoice_number VARCHAR(255),
  payment_method VARCHAR(100),
  payment_date TIMESTAMPTZ,
  receipt_url TEXT,
  receipt_file_key VARCHAR(500),
  is_eligible BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reports
CREATE TABLE public.reports (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  report_type report_type NOT NULL,
  reporting_period_start TIMESTAMPTZ,
  reporting_period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  submission_date TIMESTAMPTZ,
  status report_status DEFAULT 'draft' NOT NULL,
  content TEXT,
  document_url TEXT,
  document_file_key VARCHAR(500),
  submitted_by_user_id BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Audit Records
CREATE TABLE public.audit_records (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL,
  audit_date TIMESTAMPTZ,
  audit_type VARCHAR(255),
  auditor VARCHAR(500),
  findings TEXT,
  recommendations TEXT,
  status audit_status DEFAULT 'scheduled' NOT NULL,
  document_url TEXT,
  document_file_key VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Notifications
CREATE TABLE public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT,
  type notification_type NOT NULL,
  related_entity_type VARCHAR(100),
  related_entity_id BIGINT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- API Credentials
CREATE TABLE public.api_credentials (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  credential_type VARCHAR(100) NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata TEXT, -- JSON
  status audit_log_status NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Translations
CREATE TABLE public.translations (
  id BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id BIGINT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  language preferred_language NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Google Drive Files
CREATE TABLE public.google_drive_files (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT NOT NULL,
  google_file_id VARCHAR(255) NOT NULL,
  google_file_name VARCHAR(500),
  google_mime_type VARCHAR(100),
  google_web_view_link TEXT,
  sync_enabled BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- WhatsApp Messages
CREATE TABLE public.whatsapp_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  phone_number VARCHAR(50) NOT NULL,
  sender_name VARCHAR(255),
  message_type message_type NOT NULL,
  message_content TEXT,
  original_audio_url TEXT,
  transcription_status transcription_status,
  media_url TEXT,
  media_file_key VARCHAR(500),
  application_id BIGINT,
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  metadata TEXT, -- JSON
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Email Logs
CREATE TABLE public.email_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  recipient_email VARCHAR(320) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  email_type VARCHAR(100) NOT NULL,
  template_name VARCHAR(255),
  content TEXT,
  related_entity_type VARCHAR(100),
  related_entity_id BIGINT,
  status email_status DEFAULT 'pending' NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata TEXT, -- JSON
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- AI Assistance Sessions
CREATE TABLE public.ai_assistance_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  session_type ai_session_type NOT NULL,
  application_id BIGINT,
  document_id BIGINT,
  input_text TEXT,
  output_text TEXT,
  source_language preferred_language,
  target_language preferred_language,
  suggestions TEXT, -- JSON
  tokens_used INTEGER,
  model VARCHAR(100),
  status ai_session_status DEFAULT 'processing' NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- N8N Webhooks
CREATE TABLE public.n8n_webhooks (
  id BIGSERIAL PRIMARY KEY,
  webhook_name VARCHAR(255) NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_type VARCHAR(100) NOT NULL,
  auth_token VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Organization Profile
CREATE TABLE public.organization_profile (
  id BIGSERIAL PRIMARY KEY,
  organization_name VARCHAR(500) NOT NULL,
  legal_name VARCHAR(500),
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),
  founded_year INTEGER,
  organization_type VARCHAR(100),
  mission_statement TEXT,
  vision_statement TEXT,
  thematic_areas TEXT, -- JSON
  geographic_scope TEXT, -- JSON
  target_beneficiaries TEXT,
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(320),
  website VARCHAR(500),
  social_media TEXT, -- JSON
  logo_url TEXT,
  logo_file_key VARCHAR(500),
  staff_count INTEGER,
  volunteer_count INTEGER,
  annual_budget INTEGER, -- in cents
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Impact Metrics
CREATE TABLE public.impact_metrics (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT,
  metric_name VARCHAR(255) NOT NULL,
  metric_category VARCHAR(100),
  metric_value INTEGER NOT NULL,
  metric_unit VARCHAR(100),
  description TEXT,
  reporting_period_start TIMESTAMPTZ,
  reporting_period_end TIMESTAMPTZ,
  data_source VARCHAR(255),
  verification_status verification_status DEFAULT 'unverified',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Impact Reports
CREATE TABLE public.impact_reports (
  id BIGSERIAL PRIMARY KEY,
  report_title VARCHAR(500) NOT NULL,
  report_type impact_report_type NOT NULL,
  application_id BIGINT,
  reporting_period_start TIMESTAMPTZ NOT NULL,
  reporting_period_end TIMESTAMPTZ NOT NULL,
  status impact_report_status DEFAULT 'draft' NOT NULL,
  content TEXT,
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  included_metrics TEXT, -- JSON
  target_audience VARCHAR(255),
  language preferred_language DEFAULT 'en' NOT NULL,
  pdf_url TEXT,
  pdf_file_key VARCHAR(500),
  created_by_user_id BIGINT NOT NULL,
  last_edited_by_user_id BIGINT,
  version INTEGER DEFAULT 1 NOT NULL,
  parent_report_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  finalized_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

-- Report Templates
CREATE TABLE public.report_templates (
  id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL,
  description TEXT,
  structure TEXT, -- JSON
  default_sections TEXT, -- JSON
  is_public BOOLEAN DEFAULT FALSE,
  created_by_user_id BIGINT,
  language preferred_language DEFAULT 'en' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Beneficiaries
CREATE TABLE public.beneficiaries (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT,
  activity_id BIGINT,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  is_anonymized BOOLEAN DEFAULT FALSE,
  anonymized_id VARCHAR(100),
  age INTEGER,
  gender VARCHAR(50),
  location VARCHAR(255),
  category VARCHAR(100),
  participation_date TIMESTAMPTZ,
  participation_status participation_status DEFAULT 'active',
  notes TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Impact Stories
CREATE TABLE public.impact_stories (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  beneficiary_type VARCHAR(255),
  location VARCHAR(255),
  impact TEXT,
  metrics TEXT,
  language preferred_language DEFAULT 'en' NOT NULL,
  tags TEXT, -- JSON
  application_id BIGINT,
  created_by_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Report Documents
CREATE TABLE public.report_documents (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_key VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  analysis_status analysis_status DEFAULT 'pending' NOT NULL,
  analysis_result TEXT, -- JSON
  extracted_metrics TEXT, -- JSON
  extracted_stories TEXT, -- JSON
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  analyzed_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users
CREATE INDEX idx_users_open_id ON public.users(open_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Grant Opportunities
CREATE INDEX idx_grant_opportunities_status ON public.grant_opportunities(status);
CREATE INDEX idx_grant_opportunities_deadline ON public.grant_opportunities(application_deadline);
CREATE INDEX idx_grant_opportunities_assigned_to ON public.grant_opportunities(assigned_to_user_id);

-- Applications
CREATE INDEX idx_applications_grant_opportunity ON public.applications(grant_opportunity_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_assigned_to ON public.applications(assigned_to_user_id);

-- Documents
CREATE INDEX idx_documents_application_id ON public.documents(application_id);
CREATE INDEX idx_documents_type ON public.documents(document_type);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by_user_id);

-- Activities
CREATE INDEX idx_activities_application_id ON public.activities(application_id);
CREATE INDEX idx_activities_status ON public.activities(status);

-- Expenses
CREATE INDEX idx_expenses_application_id ON public.expenses(application_id);
CREATE INDEX idx_expenses_budget_item ON public.expenses(budget_item_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Impact Reports
CREATE INDEX idx_impact_reports_created_by ON public.impact_reports(created_by_user_id);
CREATE INDEX idx_impact_reports_application ON public.impact_reports(application_id);
CREATE INDEX idx_impact_reports_status ON public.impact_reports(status);

-- Report Documents
CREATE INDEX idx_report_documents_user_id ON public.report_documents(user_id);
CREATE INDEX idx_report_documents_analysis_status ON public.report_documents(analysis_status);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'Core user table with authentication and profile data';
COMMENT ON TABLE public.grant_opportunities IS 'Available grant opportunities from various funding sources';
COMMENT ON TABLE public.applications IS 'Grant applications submitted by the organization';
COMMENT ON TABLE public.documents IS 'Documents related to applications and organization';
COMMENT ON TABLE public.impact_reports IS 'AI-generated impact reports for donors and stakeholders';
COMMENT ON TABLE public.report_documents IS 'Documents uploaded for AI analysis and report generation';
