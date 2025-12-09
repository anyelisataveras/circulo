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
-- =====================================================
-- Circulo Grant Manager - Row Level Security Policies
-- Version: 1.0.0
-- Description: RLS policies for secure data access
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assistance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE open_id = auth.jwt() ->> 'sub'
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE open_id = auth.jwt() ->> 'sub' 
    AND role = 'admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get current user's ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS BIGINT AS $$
  SELECT id FROM public.users WHERE open_id = auth.jwt() ->> 'sub'
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view all users (for collaboration)
CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (open_id = auth.jwt() ->> 'sub');

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- Only system can insert users (via trigger)
CREATE POLICY "System can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- GRANT OPPORTUNITIES POLICIES
-- =====================================================

-- All authenticated users can view grant opportunities
CREATE POLICY "All users can view grants"
  ON public.grant_opportunities FOR SELECT
  USING (true);

-- Only admins can create grant opportunities
CREATE POLICY "Admins can create grants"
  ON public.grant_opportunities FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update grant opportunities
CREATE POLICY "Admins can update grants"
  ON public.grant_opportunities FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete grant opportunities
CREATE POLICY "Admins can delete grants"
  ON public.grant_opportunities FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- APPLICATIONS POLICIES
-- =====================================================

-- All authenticated users can view all applications (team collaboration)
CREATE POLICY "All users can view applications"
  ON public.applications FOR SELECT
  USING (true);

-- All authenticated users can create applications
CREATE POLICY "All users can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (true);

-- All authenticated users can update applications
CREATE POLICY "All users can update applications"
  ON public.applications FOR UPDATE
  USING (true);

-- Only admins can delete applications
CREATE POLICY "Admins can delete applications"
  ON public.applications FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

CREATE POLICY "All users can view projects"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "All users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update projects"
  ON public.projects FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- BUDGET ITEMS POLICIES
-- =====================================================

CREATE POLICY "All users can view budget items"
  ON public.budget_items FOR SELECT
  USING (true);

CREATE POLICY "All users can create budget items"
  ON public.budget_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update budget items"
  ON public.budget_items FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete budget items"
  ON public.budget_items FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- PARTNERS POLICIES
-- =====================================================

CREATE POLICY "All users can view partners"
  ON public.partners FOR SELECT
  USING (true);

CREATE POLICY "All users can create partners"
  ON public.partners FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update partners"
  ON public.partners FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete partners"
  ON public.partners FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

-- All users can view all documents (team collaboration)
CREATE POLICY "All users can view documents"
  ON public.documents FOR SELECT
  USING (true);

-- All users can upload documents
CREATE POLICY "All users can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (true);

-- Users can update documents they uploaded
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (uploaded_by_user_id = public.get_current_user_id());

-- Admins can update any document
CREATE POLICY "Admins can update any document"
  ON public.documents FOR UPDATE
  USING (public.is_admin());

-- Users can delete documents they uploaded
CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (uploaded_by_user_id = public.get_current_user_id());

-- Admins can delete any document
CREATE POLICY "Admins can delete any document"
  ON public.documents FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- ACTIVITIES POLICIES
-- =====================================================

CREATE POLICY "All users can view activities"
  ON public.activities FOR SELECT
  USING (true);

CREATE POLICY "All users can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update activities"
  ON public.activities FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete activities"
  ON public.activities FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- EXPENSES POLICIES
-- =====================================================

CREATE POLICY "All users can view expenses"
  ON public.expenses FOR SELECT
  USING (true);

CREATE POLICY "All users can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update expenses"
  ON public.expenses FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete expenses"
  ON public.expenses FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- REPORTS POLICIES
-- =====================================================

CREATE POLICY "All users can view reports"
  ON public.reports FOR SELECT
  USING (true);

CREATE POLICY "All users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update reports"
  ON public.reports FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- AUDIT RECORDS POLICIES
-- =====================================================

CREATE POLICY "All users can view audit records"
  ON public.audit_records FOR SELECT
  USING (true);

CREATE POLICY "All users can create audit records"
  ON public.audit_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update audit records"
  ON public.audit_records FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete audit records"
  ON public.audit_records FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin());

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = public.get_current_user_id());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = public.get_current_user_id());

-- =====================================================
-- API CREDENTIALS POLICIES
-- =====================================================

-- Users can only view their own credentials
CREATE POLICY "Users can view own credentials"
  ON public.api_credentials FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Users can create their own credentials
CREATE POLICY "Users can create own credentials"
  ON public.api_credentials FOR INSERT
  WITH CHECK (user_id = public.get_current_user_id());

-- Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON public.api_credentials FOR UPDATE
  USING (user_id = public.get_current_user_id());

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
  ON public.api_credentials FOR DELETE
  USING (user_id = public.get_current_user_id());

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- System can create audit logs
CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRANSLATIONS POLICIES
-- =====================================================

CREATE POLICY "All users can view translations"
  ON public.translations FOR SELECT
  USING (true);

CREATE POLICY "All users can create translations"
  ON public.translations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update translations"
  ON public.translations FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete translations"
  ON public.translations FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- GOOGLE DRIVE FILES POLICIES
-- =====================================================

CREATE POLICY "All users can view google drive files"
  ON public.google_drive_files FOR SELECT
  USING (true);

CREATE POLICY "All users can create google drive files"
  ON public.google_drive_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update google drive files"
  ON public.google_drive_files FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete google drive files"
  ON public.google_drive_files FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- WHATSAPP MESSAGES POLICIES
-- =====================================================

-- All users can view whatsapp messages
CREATE POLICY "All users can view whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (true);

-- System can create whatsapp messages (via webhook)
CREATE POLICY "System can create whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (true);

-- All users can update whatsapp messages
CREATE POLICY "All users can update whatsapp messages"
  ON public.whatsapp_messages FOR UPDATE
  USING (true);

-- Admins can delete whatsapp messages
CREATE POLICY "Admins can delete whatsapp messages"
  ON public.whatsapp_messages FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- EMAIL LOGS POLICIES
-- =====================================================

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs FOR SELECT
  USING (public.is_admin());

-- System can create email logs
CREATE POLICY "System can create email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- AI ASSISTANCE SESSIONS POLICIES
-- =====================================================

-- Users can view their own AI sessions
CREATE POLICY "Users can view own ai sessions"
  ON public.ai_assistance_sessions FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Admins can view all AI sessions
CREATE POLICY "Admins can view all ai sessions"
  ON public.ai_assistance_sessions FOR SELECT
  USING (public.is_admin());

-- Users can create their own AI sessions
CREATE POLICY "Users can create own ai sessions"
  ON public.ai_assistance_sessions FOR INSERT
  WITH CHECK (user_id = public.get_current_user_id());

-- Users can update their own AI sessions
CREATE POLICY "Users can update own ai sessions"
  ON public.ai_assistance_sessions FOR UPDATE
  USING (user_id = public.get_current_user_id());

-- =====================================================
-- N8N WEBHOOKS POLICIES
-- =====================================================

-- Only admins can view webhooks
CREATE POLICY "Admins can view webhooks"
  ON public.n8n_webhooks FOR SELECT
  USING (public.is_admin());

-- Only admins can create webhooks
CREATE POLICY "Admins can create webhooks"
  ON public.n8n_webhooks FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update webhooks
CREATE POLICY "Admins can update webhooks"
  ON public.n8n_webhooks FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete webhooks
CREATE POLICY "Admins can delete webhooks"
  ON public.n8n_webhooks FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- ORGANIZATION PROFILE POLICIES
-- =====================================================

-- All users can view organization profile
CREATE POLICY "All users can view organization profile"
  ON public.organization_profile FOR SELECT
  USING (true);

-- Only admins can create organization profile
CREATE POLICY "Admins can create organization profile"
  ON public.organization_profile FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update organization profile
CREATE POLICY "Admins can update organization profile"
  ON public.organization_profile FOR UPDATE
  USING (public.is_admin());

-- =====================================================
-- IMPACT METRICS POLICIES
-- =====================================================

CREATE POLICY "All users can view impact metrics"
  ON public.impact_metrics FOR SELECT
  USING (true);

CREATE POLICY "All users can create impact metrics"
  ON public.impact_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update impact metrics"
  ON public.impact_metrics FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete impact metrics"
  ON public.impact_metrics FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- IMPACT REPORTS POLICIES
-- =====================================================

-- All users can view all impact reports
CREATE POLICY "All users can view impact reports"
  ON public.impact_reports FOR SELECT
  USING (true);

-- All users can create impact reports
CREATE POLICY "All users can create impact reports"
  ON public.impact_reports FOR INSERT
  WITH CHECK (true);

-- Users can update reports they created
CREATE POLICY "Users can update own impact reports"
  ON public.impact_reports FOR UPDATE
  USING (created_by_user_id = public.get_current_user_id());

-- Admins can update any report
CREATE POLICY "Admins can update any impact report"
  ON public.impact_reports FOR UPDATE
  USING (public.is_admin());

-- Users can delete reports they created
CREATE POLICY "Users can delete own impact reports"
  ON public.impact_reports FOR DELETE
  USING (created_by_user_id = public.get_current_user_id());

-- Admins can delete any report
CREATE POLICY "Admins can delete any impact report"
  ON public.impact_reports FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- REPORT TEMPLATES POLICIES
-- =====================================================

-- All users can view public templates
CREATE POLICY "All users can view public templates"
  ON public.report_templates FOR SELECT
  USING (is_public = true);

-- Users can view templates they created
CREATE POLICY "Users can view own templates"
  ON public.report_templates FOR SELECT
  USING (created_by_user_id = public.get_current_user_id());

-- Admins can view all templates
CREATE POLICY "Admins can view all templates"
  ON public.report_templates FOR SELECT
  USING (public.is_admin());

-- All users can create templates
CREATE POLICY "All users can create templates"
  ON public.report_templates FOR INSERT
  WITH CHECK (true);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON public.report_templates FOR UPDATE
  USING (created_by_user_id = public.get_current_user_id());

-- Admins can update any template
CREATE POLICY "Admins can update any template"
  ON public.report_templates FOR UPDATE
  USING (public.is_admin());

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON public.report_templates FOR DELETE
  USING (created_by_user_id = public.get_current_user_id());

-- Admins can delete any template
CREATE POLICY "Admins can delete any template"
  ON public.report_templates FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- BENEFICIARIES POLICIES
-- =====================================================

CREATE POLICY "All users can view beneficiaries"
  ON public.beneficiaries FOR SELECT
  USING (true);

CREATE POLICY "All users can create beneficiaries"
  ON public.beneficiaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "All users can update beneficiaries"
  ON public.beneficiaries FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete beneficiaries"
  ON public.beneficiaries FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- IMPACT STORIES POLICIES
-- =====================================================

CREATE POLICY "All users can view impact stories"
  ON public.impact_stories FOR SELECT
  USING (true);

-- All users can create impact stories
CREATE POLICY "All users can create impact stories"
  ON public.impact_stories FOR INSERT
  WITH CHECK (true);

-- Users can update stories they created
CREATE POLICY "Users can update own impact stories"
  ON public.impact_stories FOR UPDATE
  USING (created_by_user_id = public.get_current_user_id());

-- Admins can update any story
CREATE POLICY "Admins can update any impact story"
  ON public.impact_stories FOR UPDATE
  USING (public.is_admin());

-- Users can delete stories they created
CREATE POLICY "Users can delete own impact stories"
  ON public.impact_stories FOR DELETE
  USING (created_by_user_id = public.get_current_user_id());

-- Admins can delete any story
CREATE POLICY "Admins can delete any impact story"
  ON public.impact_stories FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- REPORT DOCUMENTS POLICIES
-- =====================================================

-- Users can view their own report documents
CREATE POLICY "Users can view own report documents"
  ON public.report_documents FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Admins can view all report documents
CREATE POLICY "Admins can view all report documents"
  ON public.report_documents FOR SELECT
  USING (public.is_admin());

-- Users can upload their own report documents
CREATE POLICY "Users can create own report documents"
  ON public.report_documents FOR INSERT
  WITH CHECK (user_id = public.get_current_user_id());

-- Users can update their own report documents
CREATE POLICY "Users can update own report documents"
  ON public.report_documents FOR UPDATE
  USING (user_id = public.get_current_user_id());

-- Users can delete their own report documents
CREATE POLICY "Users can delete own report documents"
  ON public.report_documents FOR DELETE
  USING (user_id = public.get_current_user_id());

-- Admins can delete any report document
CREATE POLICY "Admins can delete any report document"
  ON public.report_documents FOR DELETE
  USING (public.is_admin());
-- =====================================================
-- Circulo Grant Manager - Database Functions & Triggers
-- Version: 1.0.0
-- Description: Utility functions, triggers, and automation
-- =====================================================

-- =====================================================
-- TIMESTAMP TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grant_opportunities_updated_at
  BEFORE UPDATE ON public.grant_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_records_updated_at
  BEFORE UPDATE ON public.audit_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_credentials_updated_at
  BEFORE UPDATE ON public.api_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_drive_files_updated_at
  BEFORE UPDATE ON public.google_drive_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_n8n_webhooks_updated_at
  BEFORE UPDATE ON public.n8n_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_profile_updated_at
  BEFORE UPDATE ON public.organization_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impact_metrics_updated_at
  BEFORE UPDATE ON public.impact_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impact_reports_updated_at
  BEFORE UPDATE ON public.impact_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impact_stories_updated_at
  BEFORE UPDATE ON public.impact_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUDIT LOGGING TRIGGERS
-- =====================================================

-- Function to log all data modifications
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val BIGINT;
BEGIN
  -- Get current user ID
  user_id_val := public.get_current_user_id();
  
  -- Log the action
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata,
    status
  ) VALUES (
    user_id_val,
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    jsonb_build_object(
      'old', CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    )::TEXT,
    'success'
  );
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
CREATE TRIGGER audit_grant_opportunities
  AFTER INSERT OR UPDATE OR DELETE ON public.grant_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_applications
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_budget_items
  AFTER INSERT OR UPDATE OR DELETE ON public.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_trail();

-- =====================================================
-- NOTIFICATION TRIGGERS
-- =====================================================

-- Function to create notification on deadline approaching
CREATE OR REPLACE FUNCTION public.notify_deadline_approaching()
RETURNS TRIGGER AS $$
DECLARE
  days_until_deadline INTEGER;
  user_record RECORD;
BEGIN
  -- Calculate days until deadline
  days_until_deadline := EXTRACT(DAY FROM (NEW.application_deadline - NOW()));
  
  -- If deadline is within 7 days, notify assigned user
  IF days_until_deadline <= 7 AND days_until_deadline >= 0 THEN
    IF NEW.assigned_to_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_entity_type,
        related_entity_id
      ) VALUES (
        NEW.assigned_to_user_id,
        'Grant Deadline Approaching',
        'The grant "' || NEW.program_title || '" has a deadline in ' || days_until_deadline || ' days.',
        'deadline',
        'grant_opportunities',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_grant_deadline
  AFTER INSERT OR UPDATE OF application_deadline ON public.grant_opportunities
  FOR EACH ROW
  WHEN (NEW.application_deadline IS NOT NULL)
  EXECUTE FUNCTION public.notify_deadline_approaching();

-- Function to notify on application status change
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.assigned_to_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_entity_type,
        related_entity_id
      ) VALUES (
        NEW.assigned_to_user_id,
        'Application Status Changed',
        'Application "' || NEW.project_title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
        'status_change',
        'applications',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_application_status
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();

-- Function to notify on document expiration
CREATE OR REPLACE FUNCTION public.notify_document_expiring()
RETURNS TRIGGER AS $$
DECLARE
  days_until_expiry INTEGER;
BEGIN
  -- Calculate days until expiration
  days_until_expiry := EXTRACT(DAY FROM (NEW.expiration_date - NOW()));
  
  -- If expiration is within 30 days, notify uploader
  IF days_until_expiry <= 30 AND days_until_expiry >= 0 THEN
    IF NEW.uploaded_by_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_entity_type,
        related_entity_id
      ) VALUES (
        NEW.uploaded_by_user_id,
        'Document Expiring Soon',
        'Document "' || NEW.document_name || '" will expire in ' || days_until_expiry || ' days.',
        'document_expiry',
        'documents',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_document_expiry
  AFTER INSERT OR UPDATE OF expiration_date ON public.documents
  FOR EACH ROW
  WHEN (NEW.expiration_date IS NOT NULL)
  EXECUTE FUNCTION public.notify_document_expiring();

-- =====================================================
-- BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Function to calculate total budget for an application
CREATE OR REPLACE FUNCTION public.calculate_application_budget(app_id BIGINT)
RETURNS TABLE(
  total_cost BIGINT,
  grant_funding BIGINT,
  co_financing BIGINT,
  in_kind BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(bi.total_cost), 0) AS total_cost,
    COALESCE(SUM(CASE WHEN bi.funding_source = 'grant' THEN bi.total_cost ELSE 0 END), 0) AS grant_funding,
    COALESCE(SUM(CASE WHEN bi.funding_source = 'co_financing' THEN bi.total_cost ELSE 0 END), 0) AS co_financing,
    COALESCE(SUM(CASE WHEN bi.funding_source = 'in_kind' THEN bi.total_cost ELSE 0 END), 0) AS in_kind
  FROM public.budget_items bi
  WHERE bi.application_id = app_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total expenses for an application
CREATE OR REPLACE FUNCTION public.calculate_application_expenses(app_id BIGINT)
RETURNS TABLE(
  total_expenses BIGINT,
  eligible_expenses BIGINT,
  ineligible_expenses BIGINT,
  paid_expenses BIGINT,
  unpaid_expenses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN e.is_eligible THEN e.amount ELSE 0 END), 0) AS eligible_expenses,
    COALESCE(SUM(CASE WHEN NOT e.is_eligible THEN e.amount ELSE 0 END), 0) AS ineligible_expenses,
    COALESCE(SUM(CASE WHEN e.payment_date IS NOT NULL THEN e.amount ELSE 0 END), 0) AS paid_expenses,
    COALESCE(SUM(CASE WHEN e.payment_date IS NULL THEN e.amount ELSE 0 END), 0) AS unpaid_expenses
  FROM public.expenses e
  WHERE e.application_id = app_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get application progress
CREATE OR REPLACE FUNCTION public.get_application_progress(app_id BIGINT)
RETURNS TABLE(
  total_activities INTEGER,
  completed_activities INTEGER,
  in_progress_activities INTEGER,
  planned_activities INTEGER,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_activities,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::INTEGER AS completed_activities,
    COUNT(CASE WHEN a.status = 'in_progress' THEN 1 END)::INTEGER AS in_progress_activities,
    COUNT(CASE WHEN a.status = 'planned' THEN 1 END)::INTEGER AS planned_activities,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END AS progress_percentage
  FROM public.activities a
  WHERE a.application_id = app_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming deadlines
CREATE OR REPLACE FUNCTION public.get_upcoming_deadlines(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
  grant_id BIGINT,
  program_title VARCHAR,
  application_deadline TIMESTAMPTZ,
  days_remaining INTEGER,
  status grant_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.program_title,
    g.application_deadline,
    EXTRACT(DAY FROM (g.application_deadline - NOW()))::INTEGER AS days_remaining,
    g.status
  FROM public.grant_opportunities g
  WHERE g.application_deadline >= NOW()
    AND g.application_deadline <= NOW() + (days_ahead || ' days')::INTERVAL
    AND g.status NOT IN ('rejected', 'archived')
  ORDER BY g.application_deadline ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
  total_grants INTEGER,
  active_applications INTEGER,
  total_budget BIGINT,
  total_expenses BIGINT,
  upcoming_deadlines INTEGER,
  pending_reports INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.grant_opportunities WHERE status != 'archived'),
    (SELECT COUNT(*)::INTEGER FROM public.applications WHERE status IN ('draft', 'in_review', 'submitted')),
    (SELECT COALESCE(SUM(requested_amount), 0) FROM public.applications WHERE status = 'awarded'),
    (SELECT COALESCE(SUM(amount), 0) FROM public.expenses),
    (SELECT COUNT(*)::INTEGER FROM public.grant_opportunities 
     WHERE application_deadline >= NOW() 
     AND application_deadline <= NOW() + INTERVAL '30 days'
     AND status NOT IN ('rejected', 'archived')),
    (SELECT COUNT(*)::INTEGER FROM public.reports WHERE status = 'draft');
END;
$$ LANGUAGE plpgsql;

-- Function to search grants by keywords
CREATE OR REPLACE FUNCTION public.search_grants(search_query TEXT)
RETURNS TABLE(
  id BIGINT,
  program_title VARCHAR,
  funding_source VARCHAR,
  thematic_area VARCHAR,
  application_deadline TIMESTAMPTZ,
  max_amount INTEGER,
  status grant_status,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.program_title,
    g.funding_source,
    g.thematic_area,
    g.application_deadline,
    g.max_amount,
    g.status,
    ts_rank(
      to_tsvector('english', 
        COALESCE(g.program_title, '') || ' ' || 
        COALESCE(g.funding_source, '') || ' ' || 
        COALESCE(g.thematic_area, '') || ' ' || 
        COALESCE(g.eligibility_criteria, '')
      ),
      plainto_tsquery('english', search_query)
    ) AS relevance_score
  FROM public.grant_opportunities g
  WHERE to_tsvector('english', 
          COALESCE(g.program_title, '') || ' ' || 
          COALESCE(g.funding_source, '') || ' ' || 
          COALESCE(g.thematic_area, '') || ' ' || 
          COALESCE(g.eligibility_criteria, '')
        ) @@ plainto_tsquery('english', search_query)
  ORDER BY relevance_score DESC, g.application_deadline ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize beneficiary data
CREATE OR REPLACE FUNCTION public.anonymize_beneficiary()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_anonymized = TRUE AND NEW.anonymized_id IS NULL THEN
    -- Generate anonymized ID
    NEW.anonymized_id := 'BEN-' || LPAD(NEW.id::TEXT, 8, '0');
    -- Clear personal information
    NEW.first_name := NULL;
    NEW.last_name := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anonymize_beneficiary_data
  BEFORE INSERT OR UPDATE ON public.beneficiaries
  FOR EACH ROW
  WHEN (NEW.is_anonymized = TRUE)
  EXECUTE FUNCTION public.anonymize_beneficiary();

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Grant Opportunities
ALTER TABLE public.grant_opportunities
  ADD CONSTRAINT fk_grant_assigned_to_user
  FOREIGN KEY (assigned_to_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Applications
ALTER TABLE public.applications
  ADD CONSTRAINT fk_application_grant
  FOREIGN KEY (grant_opportunity_id)
  REFERENCES public.grant_opportunities(id)
  ON DELETE CASCADE;

ALTER TABLE public.applications
  ADD CONSTRAINT fk_application_assigned_to_user
  FOREIGN KEY (assigned_to_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Projects
ALTER TABLE public.projects
  ADD CONSTRAINT fk_project_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE CASCADE;

-- Budget Items
ALTER TABLE public.budget_items
  ADD CONSTRAINT fk_budget_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE CASCADE;

-- Partners
ALTER TABLE public.partners
  ADD CONSTRAINT fk_partner_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE CASCADE;

-- Documents
ALTER TABLE public.documents
  ADD CONSTRAINT fk_document_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD CONSTRAINT fk_document_uploaded_by
  FOREIGN KEY (uploaded_by_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Activities
ALTER TABLE public.activities
  ADD CONSTRAINT fk_activity_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE CASCADE;

ALTER TABLE public.activities
  ADD CONSTRAINT fk_activity_responsible_user
  FOREIGN KEY (responsible_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Expenses
ALTER TABLE public.expenses
  ADD CONSTRAINT fk_expense_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE CASCADE;

ALTER TABLE public.expenses
  ADD CONSTRAINT fk_expense_budget_item
  FOREIGN KEY (budget_item_id)
  REFERENCES public.budget_items(id)
  ON DELETE SET NULL;

-- Reports
ALTER TABLE public.reports
  ADD CONSTRAINT fk_report_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE CASCADE;

ALTER TABLE public.reports
  ADD CONSTRAINT fk_report_submitted_by
  FOREIGN KEY (submitted_by_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Audit Records
ALTER TABLE public.audit_records
  ADD CONSTRAINT fk_audit_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE CASCADE;

-- Notifications
ALTER TABLE public.notifications
  ADD CONSTRAINT fk_notification_user
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- API Credentials
ALTER TABLE public.api_credentials
  ADD CONSTRAINT fk_api_credential_user
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Audit Logs
ALTER TABLE public.audit_logs
  ADD CONSTRAINT fk_audit_log_user
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Google Drive Files
ALTER TABLE public.google_drive_files
  ADD CONSTRAINT fk_google_drive_document
  FOREIGN KEY (document_id)
  REFERENCES public.documents(id)
  ON DELETE CASCADE;

-- WhatsApp Messages
ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT fk_whatsapp_user
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT fk_whatsapp_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE SET NULL;

-- Email Logs
ALTER TABLE public.email_logs
  ADD CONSTRAINT fk_email_log_user
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- AI Assistance Sessions
ALTER TABLE public.ai_assistance_sessions
  ADD CONSTRAINT fk_ai_session_user
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.ai_assistance_sessions
  ADD CONSTRAINT fk_ai_session_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE SET NULL;

ALTER TABLE public.ai_assistance_sessions
  ADD CONSTRAINT fk_ai_session_document
  FOREIGN KEY (document_id)
  REFERENCES public.documents(id)
  ON DELETE SET NULL;

-- Impact Metrics
ALTER TABLE public.impact_metrics
  ADD CONSTRAINT fk_impact_metric_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE SET NULL;

-- Impact Reports
ALTER TABLE public.impact_reports
  ADD CONSTRAINT fk_impact_report_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE SET NULL;

ALTER TABLE public.impact_reports
  ADD CONSTRAINT fk_impact_report_created_by
  FOREIGN KEY (created_by_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.impact_reports
  ADD CONSTRAINT fk_impact_report_edited_by
  FOREIGN KEY (last_edited_by_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.impact_reports
  ADD CONSTRAINT fk_impact_report_parent
  FOREIGN KEY (parent_report_id)
  REFERENCES public.impact_reports(id)
  ON DELETE SET NULL;

-- Report Templates
ALTER TABLE public.report_templates
  ADD CONSTRAINT fk_report_template_created_by
  FOREIGN KEY (created_by_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Beneficiaries
ALTER TABLE public.beneficiaries
  ADD CONSTRAINT fk_beneficiary_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE SET NULL;

ALTER TABLE public.beneficiaries
  ADD CONSTRAINT fk_beneficiary_activity
  FOREIGN KEY (activity_id)
  REFERENCES public.activities(id)
  ON DELETE SET NULL;

-- Impact Stories
ALTER TABLE public.impact_stories
  ADD CONSTRAINT fk_impact_story_application
  FOREIGN KEY (application_id)
  REFERENCES public.applications(id)
  ON DELETE SET NULL;

ALTER TABLE public.impact_stories
  ADD CONSTRAINT fk_impact_story_created_by
  FOREIGN KEY (created_by_user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Report Documents
ALTER TABLE public.report_documents
  ADD CONSTRAINT fk_report_document_user
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates the updated_at timestamp';
COMMENT ON FUNCTION public.log_audit_trail IS 'Logs all data modifications to audit_logs table';
COMMENT ON FUNCTION public.notify_deadline_approaching IS 'Creates notification when grant deadline is within 7 days';
COMMENT ON FUNCTION public.notify_application_status_change IS 'Creates notification when application status changes';
COMMENT ON FUNCTION public.notify_document_expiring IS 'Creates notification when document expiration is within 30 days';
COMMENT ON FUNCTION public.calculate_application_budget IS 'Calculates total budget breakdown for an application';
COMMENT ON FUNCTION public.calculate_application_expenses IS 'Calculates total expenses breakdown for an application';
COMMENT ON FUNCTION public.get_application_progress IS 'Returns activity completion progress for an application';
COMMENT ON FUNCTION public.get_upcoming_deadlines IS 'Returns grants with deadlines in the next N days';
COMMENT ON FUNCTION public.get_dashboard_stats IS 'Returns key statistics for the dashboard';
COMMENT ON FUNCTION public.search_grants IS 'Full-text search for grant opportunities';
COMMENT ON FUNCTION public.anonymize_beneficiary IS 'Automatically anonymizes beneficiary data when is_anonymized is true';
