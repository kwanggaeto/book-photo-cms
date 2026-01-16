CREATE TABLE `Photo` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text NOT NULL,
	`filename` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`expiresAt` integer NOT NULL,
	`size` integer NOT NULL,
	`mimeType` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Photo_uid_unique` ON `Photo` (`uid`);