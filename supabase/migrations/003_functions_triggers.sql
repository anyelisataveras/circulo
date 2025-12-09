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
