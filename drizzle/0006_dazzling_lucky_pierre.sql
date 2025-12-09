CREATE TABLE `report_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`file_name` varchar(500) NOT NULL,
	`file_key` varchar(500) NOT NULL,
	`file_url` text NOT NULL,
	`file_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`analysis_status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`analysis_result` text,
	`extracted_metrics` text,
	`extracted_stories` text,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`analyzed_at` timestamp,
	CONSTRAINT `report_documents_id` PRIMARY KEY(`id`)
);
