ALTER TABLE "photos" ADD COLUMN "message_id" uuid;--> statement-breakpoint
CREATE INDEX "photos_message_id_index" ON "photos" USING btree ("message_id");