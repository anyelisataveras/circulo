CREATE TABLE `ai_assistance_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`session_type` enum('review','translation','generation','correction','chat') NOT NULL,
	`application_id` int,
	`document_id` int,
	`input_text` text,
	`output_text` text,
	`source_language` enum('en','es','ca','eu'),
	`target_language` enum('en','es','ca','eu'),
	`suggestions` text,
	`tokens_used` int,
	`model` varchar(100),
	`status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `ai_assistance_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`recipient_email` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`email_type` varchar(100) NOT NULL,
	`template_name` varchar(255),
	`content` text,
	`related_entity_type` varchar(100),
	`related_entity_id` int,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`sent_at` timestamp,
	`error_message` text,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `n8n_webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhook_name` varchar(255) NOT NULL,
	`webhook_url` text NOT NULL,
	`webhook_type` varchar(100) NOT NULL,
	`auth_token` varchar(500),
	`is_active` boolean DEFAULT true,
	`last_triggered_at` timestamp,
	`trigger_count` int DEFAULT 0,
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `n8n_webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`phone_number` varchar(50) NOT NULL,
	`sender_name` varchar(255),
	`message_type` enum('text','voice','image','document','video') NOT NULL,
	`message_content` text,
	`original_audio_url` text,
	`transcription_status` enum('pending','processing','completed','failed'),
	`media_url` text,
	`media_file_key` varchar(500),
	`application_id` int,
	`is_processed` boolean DEFAULT false,
	`processed_at` timestamp,
	`metadata` text,
	`received_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
