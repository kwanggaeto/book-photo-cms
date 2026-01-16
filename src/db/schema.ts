import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const photos = sqliteTable("Photo", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    uid: text("uid").notNull().unique(),
    filename: text("filename").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(strftime('%s', 'now'))`),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    size: integer("size").notNull(),
    mimeType: text("mimeType").notNull(),
});
