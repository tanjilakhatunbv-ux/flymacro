import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('super-admin', 'operator', 'support', 'user');
  CREATE TYPE "public"."enum_users_oauth_provider" AS ENUM('google', 'github');
  CREATE TYPE "public"."enum_specs_role" AS ENUM('tank', 'healer', 'melee-dps', 'ranged-dps');
  CREATE TYPE "public"."enum_macros_models_tier" AS ENUM('regular', 'premium');
  CREATE TYPE "public"."enum_macros_type" AS ENUM('free', 'premium');
  CREATE TYPE "public"."enum_macros_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__macros_v_version_models_tier" AS ENUM('regular', 'premium');
  CREATE TYPE "public"."enum__macros_v_version_type" AS ENUM('free', 'premium');
  CREATE TYPE "public"."enum__macros_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_category" AS ENUM('announcement', 'blog', 'changelog');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_category" AS ENUM('announcement', 'blog', 'changelog');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_credit_packages_currency" AS ENUM('CNY', 'USD');
  CREATE TYPE "public"."enum_credit_orders_currency" AS ENUM('CNY', 'USD');
  CREATE TYPE "public"."enum_credit_orders_status" AS ENUM('pending', 'paid', 'failed');
  CREATE TYPE "public"."enum_credit_transactions_type" AS ENUM('register_bonus', 'recharge', 'exchange', 'renew', 'refund', 'admin_adjust');
  CREATE TYPE "public"."enum_tickets_status" AS ENUM('open', 'in-progress', 'resolved', 'closed');
  CREATE TYPE "public"."enum_tickets_priority" AS ENUM('low', 'normal', 'high', 'urgent');
  CREATE TYPE "public"."enum_tickets_category" AS ENUM('refund', 'usage', 'account', 'feedback', 'other');
  CREATE TYPE "public"."enum_ticket_messages_sender_type" AS ENUM('user', 'staff');
  CREATE TYPE "public"."enum_notifications_category" AS ENUM('system', 'order', 'ticket', 'promotion');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"avatar_id" integer,
  	"role" "enum_users_role" DEFAULT 'user' NOT NULL,
  	"oauth_provider" "enum_users_oauth_provider",
  	"oauth_id" varchar,
  	"credits" numeric DEFAULT 20,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "classes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name_zh" varchar NOT NULL,
  	"name_en" varchar NOT NULL,
  	"color" varchar NOT NULL,
  	"icon_id" integer,
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "specs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name_zh" varchar NOT NULL,
  	"name_en" varchar NOT NULL,
  	"class_id" integer NOT NULL,
  	"role" "enum_specs_role" NOT NULL,
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "versions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"codename" varchar,
  	"released_at" timestamp(3) with time zone,
  	"is_current" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "macros_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "macros_models_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "macros_models" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" numeric,
  	"tier" "enum_macros_models_tier" DEFAULT 'regular',
  	"duration_days" numeric DEFAULT 0,
  	"auto_renewable" boolean DEFAULT true,
  	"sort" numeric DEFAULT 0
  );
  
  CREATE TABLE "macros" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"type" "enum_macros_type" DEFAULT 'free',
  	"summary" varchar,
  	"preview_img_id" integer,
  	"demo_video_url" varchar,
  	"body" jsonb,
  	"code_content" varchar,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_macros_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "macros_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"classes_id" integer,
  	"specs_id" integer,
  	"versions_id" integer
  );
  
  CREATE TABLE "_macros_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_macros_v_version_models_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_macros_v_version_models" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"price" numeric,
  	"tier" "enum__macros_v_version_models_tier" DEFAULT 'regular',
  	"duration_days" numeric DEFAULT 0,
  	"auto_renewable" boolean DEFAULT true,
  	"sort" numeric DEFAULT 0,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_macros_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_type" "enum__macros_v_version_type" DEFAULT 'free',
  	"version_summary" varchar,
  	"version_preview_img_id" integer,
  	"version_demo_video_url" varchar,
  	"version_body" jsonb,
  	"version_code_content" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__macros_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_macros_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"classes_id" integer,
  	"specs_id" integer,
  	"versions_id" integer
  );
  
  CREATE TABLE "guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"weight" numeric DEFAULT 100,
  	"cover_id" integer,
  	"body" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_guides_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_guides_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_weight" numeric DEFAULT 100,
  	"version_cover_id" integer,
  	"version_body" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__guides_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"category" "enum_articles_category" DEFAULT 'announcement',
  	"pinned" boolean DEFAULT false,
  	"cover_id" integer,
  	"body" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_category" "enum__articles_v_version_category" DEFAULT 'announcement',
  	"version_pinned" boolean DEFAULT false,
  	"version_cover_id" integer,
  	"version_body" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"body" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_body" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "credit_packages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"credits_granted" numeric NOT NULL,
  	"dodo_product_id" varchar NOT NULL,
  	"currency" "enum_credit_packages_currency" DEFAULT 'CNY' NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "credit_orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar NOT NULL,
  	"user_id" integer NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" "enum_credit_orders_currency" DEFAULT 'CNY' NOT NULL,
  	"credits_granted" numeric NOT NULL,
  	"status" "enum_credit_orders_status" DEFAULT 'pending' NOT NULL,
  	"dodo_checkout_id" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "macro_exchanges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"macro_id" integer NOT NULL,
  	"model_name" varchar,
  	"credits_spent" numeric NOT NULL,
  	"granted_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"auto_renew" boolean DEFAULT false,
  	"revoked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "credit_transactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"amount" numeric NOT NULL,
  	"balance_after" numeric NOT NULL,
  	"type" "enum_credit_transactions_type" NOT NULL,
  	"related_order_id" integer,
  	"related_exchange_id" integer,
  	"reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar NOT NULL,
  	"user_id" integer NOT NULL,
  	"status" "enum_tickets_status" DEFAULT 'open' NOT NULL,
  	"priority" "enum_tickets_priority" DEFAULT 'normal',
  	"category" "enum_tickets_category",
  	"related_macro_id" integer,
  	"related_order_id" integer,
  	"assignee_id" integer,
  	"closed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ticket_messages_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer
  );
  
  CREATE TABLE "ticket_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ticket_id" integer NOT NULL,
  	"sender_id" integer NOT NULL,
  	"sender_type" "enum_ticket_messages_sender_type" DEFAULT 'user' NOT NULL,
  	"body" jsonb NOT NULL,
  	"is_internal_note" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "notifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"recipient_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar,
  	"link" varchar,
  	"category" "enum_notifications_category" DEFAULT 'system',
  	"read" boolean DEFAULT false,
  	"read_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"classes_id" integer,
  	"specs_id" integer,
  	"versions_id" integer,
  	"macros_id" integer,
  	"guides_id" integer,
  	"articles_id" integer,
  	"pages_id" integer,
  	"credit_packages_id" integer,
  	"credit_orders_id" integer,
  	"macro_exchanges_id" integer,
  	"credit_transactions_id" integer,
  	"tickets_id" integer,
  	"ticket_messages_id" integer,
  	"notifications_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "classes" ADD CONSTRAINT "classes_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "specs" ADD CONSTRAINT "specs_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "macros_tags" ADD CONSTRAINT "macros_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."macros"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "macros_models_features" ADD CONSTRAINT "macros_models_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."macros_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "macros_models" ADD CONSTRAINT "macros_models_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."macros"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "macros" ADD CONSTRAINT "macros_preview_img_id_media_id_fk" FOREIGN KEY ("preview_img_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "macros_rels" ADD CONSTRAINT "macros_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."macros"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "macros_rels" ADD CONSTRAINT "macros_rels_classes_fk" FOREIGN KEY ("classes_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "macros_rels" ADD CONSTRAINT "macros_rels_specs_fk" FOREIGN KEY ("specs_id") REFERENCES "public"."specs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "macros_rels" ADD CONSTRAINT "macros_rels_versions_fk" FOREIGN KEY ("versions_id") REFERENCES "public"."versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_macros_v_version_tags" ADD CONSTRAINT "_macros_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_macros_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_macros_v_version_models_features" ADD CONSTRAINT "_macros_v_version_models_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_macros_v_version_models"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_macros_v_version_models" ADD CONSTRAINT "_macros_v_version_models_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_macros_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_macros_v" ADD CONSTRAINT "_macros_v_parent_id_macros_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."macros"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_macros_v" ADD CONSTRAINT "_macros_v_version_preview_img_id_media_id_fk" FOREIGN KEY ("version_preview_img_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_macros_v_rels" ADD CONSTRAINT "_macros_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_macros_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_macros_v_rels" ADD CONSTRAINT "_macros_v_rels_classes_fk" FOREIGN KEY ("classes_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_macros_v_rels" ADD CONSTRAINT "_macros_v_rels_specs_fk" FOREIGN KEY ("specs_id") REFERENCES "public"."specs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_macros_v_rels" ADD CONSTRAINT "_macros_v_rels_versions_fk" FOREIGN KEY ("versions_id") REFERENCES "public"."versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_parent_id_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_orders" ADD CONSTRAINT "credit_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "macro_exchanges" ADD CONSTRAINT "macro_exchanges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "macro_exchanges" ADD CONSTRAINT "macro_exchanges_macro_id_macros_id_fk" FOREIGN KEY ("macro_id") REFERENCES "public"."macros"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_related_order_id_credit_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."credit_orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_related_exchange_id_macro_exchanges_id_fk" FOREIGN KEY ("related_exchange_id") REFERENCES "public"."macro_exchanges"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_related_macro_id_macros_id_fk" FOREIGN KEY ("related_macro_id") REFERENCES "public"."macros"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_related_order_id_credit_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."credit_orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ticket_messages_attachments" ADD CONSTRAINT "ticket_messages_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ticket_messages_attachments" ADD CONSTRAINT "ticket_messages_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ticket_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_classes_fk" FOREIGN KEY ("classes_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_specs_fk" FOREIGN KEY ("specs_id") REFERENCES "public"."specs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_versions_fk" FOREIGN KEY ("versions_id") REFERENCES "public"."versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_macros_fk" FOREIGN KEY ("macros_id") REFERENCES "public"."macros"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_credit_packages_fk" FOREIGN KEY ("credit_packages_id") REFERENCES "public"."credit_packages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_credit_orders_fk" FOREIGN KEY ("credit_orders_id") REFERENCES "public"."credit_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_macro_exchanges_fk" FOREIGN KEY ("macro_exchanges_id") REFERENCES "public"."macro_exchanges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_credit_transactions_fk" FOREIGN KEY ("credit_transactions_id") REFERENCES "public"."credit_transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tickets_fk" FOREIGN KEY ("tickets_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ticket_messages_fk" FOREIGN KEY ("ticket_messages_id") REFERENCES "public"."ticket_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "classes_slug_idx" ON "classes" USING btree ("slug");
  CREATE INDEX "classes_icon_idx" ON "classes" USING btree ("icon_id");
  CREATE INDEX "classes_updated_at_idx" ON "classes" USING btree ("updated_at");
  CREATE INDEX "classes_created_at_idx" ON "classes" USING btree ("created_at");
  CREATE UNIQUE INDEX "specs_slug_idx" ON "specs" USING btree ("slug");
  CREATE INDEX "specs_class_idx" ON "specs" USING btree ("class_id");
  CREATE INDEX "specs_updated_at_idx" ON "specs" USING btree ("updated_at");
  CREATE INDEX "specs_created_at_idx" ON "specs" USING btree ("created_at");
  CREATE UNIQUE INDEX "versions_label_idx" ON "versions" USING btree ("label");
  CREATE INDEX "versions_updated_at_idx" ON "versions" USING btree ("updated_at");
  CREATE INDEX "versions_created_at_idx" ON "versions" USING btree ("created_at");
  CREATE INDEX "macros_tags_order_idx" ON "macros_tags" USING btree ("_order");
  CREATE INDEX "macros_tags_parent_id_idx" ON "macros_tags" USING btree ("_parent_id");
  CREATE INDEX "macros_models_features_order_idx" ON "macros_models_features" USING btree ("_order");
  CREATE INDEX "macros_models_features_parent_id_idx" ON "macros_models_features" USING btree ("_parent_id");
  CREATE INDEX "macros_models_order_idx" ON "macros_models" USING btree ("_order");
  CREATE INDEX "macros_models_parent_id_idx" ON "macros_models" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "macros_slug_idx" ON "macros" USING btree ("slug");
  CREATE INDEX "macros_preview_img_idx" ON "macros" USING btree ("preview_img_id");
  CREATE INDEX "macros_updated_at_idx" ON "macros" USING btree ("updated_at");
  CREATE INDEX "macros_created_at_idx" ON "macros" USING btree ("created_at");
  CREATE INDEX "macros__status_idx" ON "macros" USING btree ("_status");
  CREATE INDEX "macros_rels_order_idx" ON "macros_rels" USING btree ("order");
  CREATE INDEX "macros_rels_parent_idx" ON "macros_rels" USING btree ("parent_id");
  CREATE INDEX "macros_rels_path_idx" ON "macros_rels" USING btree ("path");
  CREATE INDEX "macros_rels_classes_id_idx" ON "macros_rels" USING btree ("classes_id");
  CREATE INDEX "macros_rels_specs_id_idx" ON "macros_rels" USING btree ("specs_id");
  CREATE INDEX "macros_rels_versions_id_idx" ON "macros_rels" USING btree ("versions_id");
  CREATE INDEX "_macros_v_version_tags_order_idx" ON "_macros_v_version_tags" USING btree ("_order");
  CREATE INDEX "_macros_v_version_tags_parent_id_idx" ON "_macros_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_macros_v_version_models_features_order_idx" ON "_macros_v_version_models_features" USING btree ("_order");
  CREATE INDEX "_macros_v_version_models_features_parent_id_idx" ON "_macros_v_version_models_features" USING btree ("_parent_id");
  CREATE INDEX "_macros_v_version_models_order_idx" ON "_macros_v_version_models" USING btree ("_order");
  CREATE INDEX "_macros_v_version_models_parent_id_idx" ON "_macros_v_version_models" USING btree ("_parent_id");
  CREATE INDEX "_macros_v_parent_idx" ON "_macros_v" USING btree ("parent_id");
  CREATE INDEX "_macros_v_version_version_slug_idx" ON "_macros_v" USING btree ("version_slug");
  CREATE INDEX "_macros_v_version_version_preview_img_idx" ON "_macros_v" USING btree ("version_preview_img_id");
  CREATE INDEX "_macros_v_version_version_updated_at_idx" ON "_macros_v" USING btree ("version_updated_at");
  CREATE INDEX "_macros_v_version_version_created_at_idx" ON "_macros_v" USING btree ("version_created_at");
  CREATE INDEX "_macros_v_version_version__status_idx" ON "_macros_v" USING btree ("version__status");
  CREATE INDEX "_macros_v_created_at_idx" ON "_macros_v" USING btree ("created_at");
  CREATE INDEX "_macros_v_updated_at_idx" ON "_macros_v" USING btree ("updated_at");
  CREATE INDEX "_macros_v_latest_idx" ON "_macros_v" USING btree ("latest");
  CREATE INDEX "_macros_v_autosave_idx" ON "_macros_v" USING btree ("autosave");
  CREATE INDEX "_macros_v_rels_order_idx" ON "_macros_v_rels" USING btree ("order");
  CREATE INDEX "_macros_v_rels_parent_idx" ON "_macros_v_rels" USING btree ("parent_id");
  CREATE INDEX "_macros_v_rels_path_idx" ON "_macros_v_rels" USING btree ("path");
  CREATE INDEX "_macros_v_rels_classes_id_idx" ON "_macros_v_rels" USING btree ("classes_id");
  CREATE INDEX "_macros_v_rels_specs_id_idx" ON "_macros_v_rels" USING btree ("specs_id");
  CREATE INDEX "_macros_v_rels_versions_id_idx" ON "_macros_v_rels" USING btree ("versions_id");
  CREATE UNIQUE INDEX "guides_slug_idx" ON "guides" USING btree ("slug");
  CREATE INDEX "guides_cover_idx" ON "guides" USING btree ("cover_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE INDEX "guides__status_idx" ON "guides" USING btree ("_status");
  CREATE INDEX "_guides_v_parent_idx" ON "_guides_v" USING btree ("parent_id");
  CREATE INDEX "_guides_v_version_version_slug_idx" ON "_guides_v" USING btree ("version_slug");
  CREATE INDEX "_guides_v_version_version_cover_idx" ON "_guides_v" USING btree ("version_cover_id");
  CREATE INDEX "_guides_v_version_version_updated_at_idx" ON "_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_guides_v_version_version_created_at_idx" ON "_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_guides_v_version_version__status_idx" ON "_guides_v" USING btree ("version__status");
  CREATE INDEX "_guides_v_created_at_idx" ON "_guides_v" USING btree ("created_at");
  CREATE INDEX "_guides_v_updated_at_idx" ON "_guides_v" USING btree ("updated_at");
  CREATE INDEX "_guides_v_latest_idx" ON "_guides_v" USING btree ("latest");
  CREATE INDEX "_guides_v_autosave_idx" ON "_guides_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_cover_idx" ON "articles" USING btree ("cover_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_cover_idx" ON "_articles_v" USING btree ("version_cover_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "credit_packages_updated_at_idx" ON "credit_packages" USING btree ("updated_at");
  CREATE INDEX "credit_packages_created_at_idx" ON "credit_packages" USING btree ("created_at");
  CREATE UNIQUE INDEX "credit_orders_order_number_idx" ON "credit_orders" USING btree ("order_number");
  CREATE INDEX "credit_orders_user_idx" ON "credit_orders" USING btree ("user_id");
  CREATE INDEX "credit_orders_status_idx" ON "credit_orders" USING btree ("status");
  CREATE INDEX "credit_orders_dodo_checkout_id_idx" ON "credit_orders" USING btree ("dodo_checkout_id");
  CREATE INDEX "credit_orders_updated_at_idx" ON "credit_orders" USING btree ("updated_at");
  CREATE INDEX "credit_orders_created_at_idx" ON "credit_orders" USING btree ("created_at");
  CREATE INDEX "macro_exchanges_user_idx" ON "macro_exchanges" USING btree ("user_id");
  CREATE INDEX "macro_exchanges_macro_idx" ON "macro_exchanges" USING btree ("macro_id");
  CREATE INDEX "macro_exchanges_updated_at_idx" ON "macro_exchanges" USING btree ("updated_at");
  CREATE INDEX "macro_exchanges_created_at_idx" ON "macro_exchanges" USING btree ("created_at");
  CREATE INDEX "user_macro_idx" ON "macro_exchanges" USING btree ("user_id","macro_id");
  CREATE INDEX "credit_transactions_user_idx" ON "credit_transactions" USING btree ("user_id");
  CREATE INDEX "credit_transactions_related_order_idx" ON "credit_transactions" USING btree ("related_order_id");
  CREATE INDEX "credit_transactions_related_exchange_idx" ON "credit_transactions" USING btree ("related_exchange_id");
  CREATE INDEX "credit_transactions_updated_at_idx" ON "credit_transactions" USING btree ("updated_at");
  CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions" USING btree ("created_at");
  CREATE INDEX "tickets_user_idx" ON "tickets" USING btree ("user_id");
  CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");
  CREATE INDEX "tickets_related_macro_idx" ON "tickets" USING btree ("related_macro_id");
  CREATE INDEX "tickets_related_order_idx" ON "tickets" USING btree ("related_order_id");
  CREATE INDEX "tickets_assignee_idx" ON "tickets" USING btree ("assignee_id");
  CREATE INDEX "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");
  CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");
  CREATE INDEX "ticket_messages_attachments_order_idx" ON "ticket_messages_attachments" USING btree ("_order");
  CREATE INDEX "ticket_messages_attachments_parent_id_idx" ON "ticket_messages_attachments" USING btree ("_parent_id");
  CREATE INDEX "ticket_messages_attachments_file_idx" ON "ticket_messages_attachments" USING btree ("file_id");
  CREATE INDEX "ticket_messages_ticket_idx" ON "ticket_messages" USING btree ("ticket_id");
  CREATE INDEX "ticket_messages_sender_idx" ON "ticket_messages" USING btree ("sender_id");
  CREATE INDEX "ticket_messages_updated_at_idx" ON "ticket_messages" USING btree ("updated_at");
  CREATE INDEX "ticket_messages_created_at_idx" ON "ticket_messages" USING btree ("created_at");
  CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id");
  CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");
  CREATE INDEX "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_classes_id_idx" ON "payload_locked_documents_rels" USING btree ("classes_id");
  CREATE INDEX "payload_locked_documents_rels_specs_id_idx" ON "payload_locked_documents_rels" USING btree ("specs_id");
  CREATE INDEX "payload_locked_documents_rels_versions_id_idx" ON "payload_locked_documents_rels" USING btree ("versions_id");
  CREATE INDEX "payload_locked_documents_rels_macros_id_idx" ON "payload_locked_documents_rels" USING btree ("macros_id");
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_credit_packages_id_idx" ON "payload_locked_documents_rels" USING btree ("credit_packages_id");
  CREATE INDEX "payload_locked_documents_rels_credit_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("credit_orders_id");
  CREATE INDEX "payload_locked_documents_rels_macro_exchanges_id_idx" ON "payload_locked_documents_rels" USING btree ("macro_exchanges_id");
  CREATE INDEX "payload_locked_documents_rels_credit_transactions_id_idx" ON "payload_locked_documents_rels" USING btree ("credit_transactions_id");
  CREATE INDEX "payload_locked_documents_rels_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("tickets_id");
  CREATE INDEX "payload_locked_documents_rels_ticket_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("ticket_messages_id");
  CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "classes" CASCADE;
  DROP TABLE "specs" CASCADE;
  DROP TABLE "versions" CASCADE;
  DROP TABLE "macros_tags" CASCADE;
  DROP TABLE "macros_models_features" CASCADE;
  DROP TABLE "macros_models" CASCADE;
  DROP TABLE "macros" CASCADE;
  DROP TABLE "macros_rels" CASCADE;
  DROP TABLE "_macros_v_version_tags" CASCADE;
  DROP TABLE "_macros_v_version_models_features" CASCADE;
  DROP TABLE "_macros_v_version_models" CASCADE;
  DROP TABLE "_macros_v" CASCADE;
  DROP TABLE "_macros_v_rels" CASCADE;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "_guides_v" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "credit_packages" CASCADE;
  DROP TABLE "credit_orders" CASCADE;
  DROP TABLE "macro_exchanges" CASCADE;
  DROP TABLE "credit_transactions" CASCADE;
  DROP TABLE "tickets" CASCADE;
  DROP TABLE "ticket_messages_attachments" CASCADE;
  DROP TABLE "ticket_messages" CASCADE;
  DROP TABLE "notifications" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_oauth_provider";
  DROP TYPE "public"."enum_specs_role";
  DROP TYPE "public"."enum_macros_models_tier";
  DROP TYPE "public"."enum_macros_type";
  DROP TYPE "public"."enum_macros_status";
  DROP TYPE "public"."enum__macros_v_version_models_tier";
  DROP TYPE "public"."enum__macros_v_version_type";
  DROP TYPE "public"."enum__macros_v_version_status";
  DROP TYPE "public"."enum_guides_status";
  DROP TYPE "public"."enum__guides_v_version_status";
  DROP TYPE "public"."enum_articles_category";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_category";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_credit_packages_currency";
  DROP TYPE "public"."enum_credit_orders_currency";
  DROP TYPE "public"."enum_credit_orders_status";
  DROP TYPE "public"."enum_credit_transactions_type";
  DROP TYPE "public"."enum_tickets_status";
  DROP TYPE "public"."enum_tickets_priority";
  DROP TYPE "public"."enum_tickets_category";
  DROP TYPE "public"."enum_ticket_messages_sender_type";
  DROP TYPE "public"."enum_notifications_category";`)
}
