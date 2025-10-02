-- Migration: Initial Schema
-- Created: 2025-10-02
-- Description: Complete database schema for form application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ORGANIZATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "settings" JSONB DEFAULT '{}'::jsonb,
  "plan_type" TEXT NOT NULL DEFAULT 'free',
  "max_forms" INTEGER NOT NULL DEFAULT 10,
  "max_submissions_per_month" INTEGER NOT NULL DEFAULT 1000,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "orgs_slug_idx" ON "organizations"("slug");
CREATE INDEX "orgs_plan_idx" ON "organizations"("plan_type");
CREATE INDEX "orgs_active_idx" ON "organizations"("is_active");

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "organization_id" UUID REFERENCES "organizations"("id") ON DELETE SET NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "email_verification_token" TEXT,
  "password_reset_token" TEXT,
  "password_reset_expiry" TIMESTAMP,
  "last_login_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_org_idx" ON "users"("organization_id");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_active_idx" ON "users"("is_active");

-- ==================== FORMS TABLE ====================
CREATE TABLE IF NOT EXISTS "forms" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "organization_id" UUID REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "is_public" BOOLEAN NOT NULL DEFAULT true,
  "settings" JSONB DEFAULT '{}'::jsonb,
  "max_submissions" INTEGER,
  "submission_count" INTEGER NOT NULL DEFAULT 0,
  "meta_title" TEXT,
  "meta_description" TEXT,
  "opens_at" TIMESTAMP,
  "closes_at" TIMESTAMP,
  "requires_auth" BOOLEAN NOT NULL DEFAULT false,
  "allowed_domains" TEXT[],
  "recaptcha_enabled" BOOLEAN NOT NULL DEFAULT false,
  "published_at" TIMESTAMP,
  "archived_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "forms_user_idx" ON "forms"("user_id");
CREATE INDEX "forms_org_idx" ON "forms"("organization_id");
CREATE INDEX "forms_slug_idx" ON "forms"("slug");
CREATE INDEX "forms_status_idx" ON "forms"("status");
CREATE INDEX "forms_public_idx" ON "forms"("is_public");
CREATE UNIQUE INDEX "forms_user_slug_uniq" ON "forms"("user_id", "slug");
CREATE INDEX "forms_created_at_idx" ON "forms"("created_at");

-- ==================== FORM FIELDS TABLE ====================
CREATE TABLE IF NOT EXISTS "form_fields" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "form_id" UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "placeholder" TEXT,
  "help_text" TEXT,
  "default_value" TEXT,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "validation_rules" JSONB DEFAULT '{}'::jsonb,
  "error_message" TEXT,
  "options" JSONB DEFAULT '[]'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0,
  "width" TEXT DEFAULT 'full',
  "is_conditional" BOOLEAN NOT NULL DEFAULT false,
  "conditional_logic" JSONB DEFAULT '{}'::jsonb,
  "prefill_key" TEXT,
  "data_source" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "form_fields_form_idx" ON "form_fields"("form_id");
CREATE INDEX "form_fields_order_idx" ON "form_fields"("form_id", "order");
CREATE INDEX "form_fields_name_idx" ON "form_fields"("form_id", "name");
CREATE UNIQUE INDEX "form_fields_form_name_uniq" ON "form_fields"("form_id", "name");

-- ==================== SUBMISSIONS TABLE ====================
CREATE TABLE IF NOT EXISTS "submissions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "form_id" UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "ip_address" TEXT,
  "user_agent" TEXT,
  "referrer" TEXT,
  "submission_token" TEXT NOT NULL UNIQUE,
  "is_test" BOOLEAN NOT NULL DEFAULT false,
  "flagged_as_spam" BOOLEAN NOT NULL DEFAULT false,
  "spam_score" INTEGER,
  "reviewed_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" TIMESTAMP,
  "review_notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "submissions_form_idx" ON "submissions"("form_id");
CREATE INDEX "submissions_user_idx" ON "submissions"("user_id");
CREATE INDEX "submissions_status_idx" ON "submissions"("status");
CREATE UNIQUE INDEX "submissions_token_idx" ON "submissions"("submission_token");
CREATE INDEX "submissions_created_at_idx" ON "submissions"("created_at");
CREATE INDEX "submissions_form_created_idx" ON "submissions"("form_id", "created_at");
CREATE INDEX "submissions_spam_idx" ON "submissions"("flagged_as_spam");

-- ==================== SUBMISSION DATA TABLE ====================
CREATE TABLE IF NOT EXISTS "submission_data" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "submission_id" UUID NOT NULL REFERENCES "submissions"("id") ON DELETE CASCADE,
  "field_id" UUID NOT NULL REFERENCES "form_fields"("id") ON DELETE CASCADE,
  "field_name" TEXT NOT NULL,
  "field_type" TEXT NOT NULL,
  "value" TEXT,
  "value_json" JSONB,
  "file_url" TEXT,
  "file_name" TEXT,
  "file_size" INTEGER,
  "file_mime_type" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "submission_data_submission_idx" ON "submission_data"("submission_id");
CREATE INDEX "submission_data_field_idx" ON "submission_data"("field_id");
CREATE UNIQUE INDEX "submission_data_sub_field_uniq" ON "submission_data"("submission_id", "field_id");
CREATE INDEX "submission_data_field_name_idx" ON "submission_data"("field_name");

-- ==================== FORM ANALYTICS TABLE ====================
CREATE TABLE IF NOT EXISTS "form_analytics" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "form_id" UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "date" TIMESTAMP NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "unique_visitors" INTEGER NOT NULL DEFAULT 0,
  "submissions" INTEGER NOT NULL DEFAULT 0,
  "completion_rate" INTEGER DEFAULT 0,
  "avg_time_to_complete" INTEGER,
  "drop_off_points" JSONB DEFAULT '{}'::jsonb,
  "device_breakdown" JSONB DEFAULT '{}'::jsonb,
  "source_breakdown" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "form_analytics_form_date_idx" ON "form_analytics"("form_id", "date");
CREATE INDEX "form_analytics_date_idx" ON "form_analytics"("date");

-- ==================== WEBHOOKS TABLE ====================
CREATE TABLE IF NOT EXISTS "webhooks" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "form_id" UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "secret" TEXT,
  "events" TEXT[] NOT NULL,
  "headers" JSONB DEFAULT '{}'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "failure_count" INTEGER NOT NULL DEFAULT 0,
  "last_success_at" TIMESTAMP,
  "last_failure_at" TIMESTAMP,
  "last_error" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "webhooks_form_idx" ON "webhooks"("form_id");
CREATE INDEX "webhooks_active_idx" ON "webhooks"("is_active");

-- ==================== AUDIT LOGS TABLE ====================
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "organization_id" UUID REFERENCES "organizations"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID NOT NULL,
  "changes" JSONB DEFAULT '{}'::jsonb,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "audit_logs_user_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_org_idx" ON "audit_logs"("organization_id");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- ==================== TRIGGERS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON "organizations"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON "forms"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at BEFORE UPDATE ON "form_fields"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON "submissions"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_data_updated_at BEFORE UPDATE ON "submission_data"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_analytics_updated_at BEFORE UPDATE ON "form_analytics"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON "webhooks"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment submission count on forms
CREATE OR REPLACE FUNCTION increment_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forms
  SET submission_count = submission_count + 1
  WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_submission_count AFTER INSERT ON "submissions"
  FOR EACH ROW EXECUTE FUNCTION increment_form_submission_count();

-- Comments
COMMENT ON TABLE "organizations" IS 'Multi-tenant organizations';
COMMENT ON TABLE "users" IS 'Application users with role-based access';
COMMENT ON TABLE "forms" IS 'Form definitions with settings and metadata';
COMMENT ON TABLE "form_fields" IS 'Individual form fields with validation rules';
COMMENT ON TABLE "submissions" IS 'Form submissions with metadata';
COMMENT ON TABLE "submission_data" IS 'Actual submission field values';
COMMENT ON TABLE "form_analytics" IS 'Daily form analytics and metrics';
COMMENT ON TABLE "webhooks" IS 'Webhook configurations for form events';
COMMENT ON TABLE "audit_logs" IS 'Audit trail for all system actions';
