CREATE TABLE `analysisHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`analysisType` enum('receipt','flyer','matching') NOT NULL,
	`targetId` int,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`result` json,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `analysisHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flyers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supermarketId` int NOT NULL,
	`flyerImageUrl` varchar(512),
	`flyerImageKey` varchar(512),
	`source` varchar(50) NOT NULL,
	`validFrom` timestamp,
	`validTo` timestamp,
	`items` json,
	`rawText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flyers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchingResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`flyerId` int NOT NULL,
	`purchaseTrendId` int,
	`itemName` varchar(255) NOT NULL,
	`category` varchar(255),
	`regularPrice` decimal(10,2),
	`salePrice` decimal(10,2),
	`savingsAmount` decimal(10,2),
	`discountPercentage` decimal(5,2),
	`userPurchaseFrequency` int,
	`matchScore` decimal(5,2),
	`isRecommended` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matchingResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseTrends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`purchaseCount` int NOT NULL DEFAULT 0,
	`averagePrice` decimal(10,2),
	`lastPurchaseDate` timestamp,
	`purchaseFrequencyDays` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseTrends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` varchar(512) NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`purchaseDate` timestamp,
	`totalAmount` decimal(10,2),
	`storeName` varchar(255),
	`items` json,
	`rawText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supermarkets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`region` varchar(255),
	`tokubaiUrl` varchar(512),
	`shufooUrl` varchar(512),
	`otherChirashiUrl` varchar(512),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supermarkets_id` PRIMARY KEY(`id`)
);
