CREATE TABLE `impact_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`beneficiary_type` varchar(255),
	`location` varchar(255),
	`impact` text,
	`metrics` text,
	`language` enum('en','es','ca','eu') NOT NULL DEFAULT 'en',
	`tags` text,
	`application_id` int,
	`created_by_user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `impact_stories_id` PRIMARY KEY(`id`)
);
