-- Form Builder Application Database Schema
-- PostgreSQL 15+
-- Generated from Architecture Design Document

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    email_verified TIMESTAMP,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- WORKSPACES & MULTI-TENANCY
-- ============================================================================

CREATE TYPE workspace_plan AS ENUM ('free', 'pro', 'enterprise');

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    plan workspace_plan DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- ============================================================================
-- WORKSPACE MEMBERS & RBAC
-- ============================================================================

CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role NOT NULL,
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- ============================================================================
-- FORMS
-- ============================================================================

CREATE TYPE form_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    slug VARCHAR(100),
    status form_status DEFAULT 'draft',
    settings JSONB DEFAULT '{
        "theme": "light",
        "primaryColor": "#000000",
        "requireAuth": false,
        "allowMultipleSubmissions": true,
        "notifyOnSubmission": false,
        "notificationEmails": [],
        "collectEmail": false,
        "showProgressBar": true
    }',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

CREATE INDEX idx_forms_workspace ON forms(workspace_id);
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_updated ON forms(workspace_id, status, updated_at);

-- ============================================================================
-- FORM FIELDS
-- ============================================================================

CREATE TYPE field_type AS ENUM (
    'short_text', 'long_text', 'email', 'number', 'phone',
    'url', 'date', 'time', 'datetime',
    'single_choice', 'multiple_choice', 'dropdown',
    'checkbox', 'rating', 'scale',
    'file_upload', 'signature',
    'section_header', 'divider'
);

CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    label VARCHAR(500) NOT NULL,
    type field_type NOT NULL,
    options JSONB DEFAULT '{
        "required": false,
        "choices": [],
        "allowOther": false
    }',
    "order" INTEGER NOT NULL,
    description TEXT,
    placeholder VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_form_fields_form ON form_fields(form_id);
CREATE INDEX idx_form_fields_order ON form_fields(form_id, "order");

-- ============================================================================
-- FORM SUBMISSIONS
-- ============================================================================

CREATE TYPE submission_status AS ENUM ('completed', 'partial', 'flagged');

CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    data JSONB NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW(),
    completion_time INTEGER,
    source VARCHAR(50),
    referrer TEXT,
    status submission_status DEFAULT 'completed'
);

CREATE INDEX idx_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_submissions_user ON form_submissions(user_id);
CREATE INDEX idx_submissions_submitted ON form_submissions(submitted_at);
CREATE INDEX idx_submissions_status ON form_submissions(status);
CREATE INDEX idx_submissions_form_date ON form_submissions(form_id, submitted_at);

-- ============================================================================
-- FORM RESPONSES (Denormalized for Analytics)
-- ============================================================================

CREATE TABLE form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    value TEXT,
    value_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_responses_submission ON form_responses(submission_id);
CREATE INDEX idx_responses_field ON form_responses(field_id);
CREATE INDEX idx_responses_value ON form_responses(value_type, value);

-- ============================================================================
-- FORM ANALYTICS
-- ============================================================================

CREATE TABLE form_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    starts INTEGER DEFAULT 0,
    submissions INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2),
    avg_completion_time INTEGER,
    sources JSONB DEFAULT '{
        "direct": 0,
        "social": 0,
        "email": 0,
        "embed": 0,
        "api": 0
    }',
    UNIQUE(form_id, date)
);

CREATE INDEX idx_analytics_form ON form_analytics(form_id);
CREATE INDEX idx_analytics_date ON form_analytics(date);
CREATE INDEX idx_analytics_form_date ON form_analytics(form_id, date);

-- ============================================================================
-- FILE UPLOADS
-- ============================================================================

CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_uploads_submission ON file_uploads(submission_id);
CREATE INDEX idx_uploads_field ON file_uploads(field_id);

-- ============================================================================
-- INTEGRATIONS
-- ============================================================================

CREATE TYPE integration_type AS ENUM (
    'webhook', 'slack', 'email', 'zapier',
    'google_sheets', 'airtable', 'notion'
);

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    type integration_type NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX idx_integrations_form ON integrations(form_id);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_fields_updated_at
    BEFORE UPDATE ON form_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================================

-- Insert sample user
INSERT INTO users (email, name, email_verified) VALUES
    ('admin@example.com', 'Admin User', NOW());

-- Insert sample workspace
INSERT INTO workspaces (name, slug, owner_id, plan)
SELECT 'Demo Workspace', 'demo', id, 'pro'
FROM users WHERE email = 'admin@example.com';

-- Insert workspace member
INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
SELECT w.id, u.id, 'owner', u.id
FROM workspaces w, users u
WHERE w.slug = 'demo' AND u.email = 'admin@example.com';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts and authentication data';
COMMENT ON TABLE workspaces IS 'Multi-tenancy organizations/teams';
COMMENT ON TABLE workspace_members IS 'User-workspace relationships with RBAC';
COMMENT ON TABLE forms IS 'Form definitions and configurations';
COMMENT ON TABLE form_fields IS 'Individual form fields/questions';
COMMENT ON TABLE form_submissions IS 'Submission metadata and responses';
COMMENT ON TABLE form_responses IS 'Denormalized field-level responses for analytics';
COMMENT ON TABLE form_analytics IS 'Aggregated daily form metrics';
COMMENT ON TABLE file_uploads IS 'File upload tracking and metadata';
COMMENT ON TABLE integrations IS 'Third-party integration configurations';
COMMENT ON TABLE audit_logs IS 'Security and compliance audit trail';
