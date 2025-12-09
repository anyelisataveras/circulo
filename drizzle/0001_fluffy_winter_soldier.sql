CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`activity_name` varchar(500) NOT NULL,
	`description` text,
	`planned_start_date` timestamp,
	`planned_end_date` timestamp,
	`actual_start_date` timestamp,
	`actual_end_date` timestamp,
	`status` enum('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`participant_count` int,
	`location` varchar(255),
	`responsible_user_id` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `api_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`service_name` varchar(255) NOT NULL,
	`credential_type` varchar(100) NOT NULL,
	`encrypted_credentials` text NOT NULL,
	`is_active` boolean DEFAULT true,
	`expires_at` timestamp,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grant_opportunity_id` int NOT NULL,
	`project_title` varchar(500) NOT NULL,
	`status` enum('draft','in_review','submitted','awarded','rejected','withdrawn') NOT NULL DEFAULT 'draft',
	`submission_date` timestamp,
	`requested_amount` int,
	`co_financing_amount` int,
	`project_start_date` timestamp,
	`project_end_date` timestamp,
	`project_duration` int,
	`target_beneficiaries` text,
	`geographic_scope` varchar(255),
	`eligibility_check_completed` boolean DEFAULT false,
	`eligibility_notes` text,
	`assigned_to_user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(255) NOT NULL,
	`entity_type` varchar(100),
	`entity_id` int,
	`ip_address` varchar(45),
	`user_agent` text,
	`metadata` text,
	`status` enum('success','failure','error') NOT NULL,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`audit_date` timestamp,
	`audit_type` varchar(255),
	`auditor` varchar(500),
	`findings` text,
	`recommendations` text,
	`status` enum('scheduled','in_progress','completed','passed','failed') NOT NULL DEFAULT 'scheduled',
	`document_url` text,
	`document_file_key` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audit_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`quantity` int,
	`unit_cost` int,
	`total_cost` int,
	`funding_source` enum('grant','co_financing','in_kind') NOT NULL,
	`justification` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int,
	`document_type` varchar(255) NOT NULL,
	`document_name` varchar(500) NOT NULL,
	`file_url` text NOT NULL,
	`file_key` varchar(500) NOT NULL,
	`mime_type` varchar(100),
	`file_size` int,
	`expiration_date` timestamp,
	`uploaded_by_user_id` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`budget_item_id` int,
	`expense_date` timestamp NOT NULL,
	`description` text NOT NULL,
	`category` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`vendor` varchar(500),
	`invoice_number` varchar(255),
	`payment_method` varchar(100),
	`payment_date` timestamp,
	`receipt_url` text,
	`receipt_file_key` varchar(500),
	`is_eligible` boolean DEFAULT true,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `google_drive_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_id` int NOT NULL,
	`google_file_id` varchar(255) NOT NULL,
	`google_file_name` varchar(500),
	`google_mime_type` varchar(100),
	`google_web_view_link` text,
	`sync_enabled` boolean DEFAULT false,
	`last_synced_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_drive_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grant_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funding_source` varchar(255) NOT NULL,
	`program_title` varchar(500) NOT NULL,
	`publication_date` timestamp,
	`application_deadline` timestamp NOT NULL,
	`min_amount` int,
	`max_amount` int,
	`co_financing_percentage` int,
	`eligibility_criteria` text,
	`thematic_area` varchar(255),
	`geographic_scope` varchar(255),
	`strategic_fit_score` int,
	`priority_score` int,
	`status` enum('monitoring','preparing','submitted','awarded','rejected','archived') NOT NULL DEFAULT 'monitoring',
	`assigned_to_user_id` int,
	`call_documentation_url` text,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grant_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`message` text,
	`type` enum('deadline','status_change','document_expiry','general') NOT NULL,
	`related_entity_type` varchar(100),
	`related_entity_id` int,
	`is_read` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`organization_name` varchar(500) NOT NULL,
	`contact_person` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`role` varchar(255),
	`country` varchar(100),
	`contribution` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`problem_statement` text,
	`objectives` text,
	`activities` text,
	`expected_results` text,
	`indicators` text,
	`methodology` text,
	`innovation_aspects` text,
	`sustainability_plan` text,
	`risk_assessment` text,
	`timeline` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_application_id_unique` UNIQUE(`application_id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`report_type` enum('interim','final','financial','technical') NOT NULL,
	`reporting_period_start` timestamp,
	`reporting_period_end` timestamp,
	`due_date` timestamp,
	`submission_date` timestamp,
	`status` enum('draft','submitted','approved','revision_requested') NOT NULL DEFAULT 'draft',
	`content` text,
	`document_url` text,
	`document_file_key` varchar(500),
	`submitted_by_user_id` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` int NOT NULL,
	`field_name` varchar(100) NOT NULL,
	`language` enum('en','es','ca','eu') NOT NULL,
	`translated_text` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `translations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `preferred_language` enum('en','es','ca','eu') DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `google_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `google_access_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_refresh_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_token_expiry` timestamp;