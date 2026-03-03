CREATE TABLE `flyerEvidences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchingResultId` int NOT NULL,
	`evidenceImageUrl` varchar(512) NOT NULL,
	`evidenceImageKey` varchar(512) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flyerEvidences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lineUserMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lineUserId` varchar(255) NOT NULL,
	`displayName` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lineUserMappings_id` PRIMARY KEY(`id`),
	CONSTRAINT `lineUserMappings_lineUserId_unique` UNIQUE(`lineUserId`)
);
