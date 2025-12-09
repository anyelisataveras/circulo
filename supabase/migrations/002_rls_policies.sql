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
