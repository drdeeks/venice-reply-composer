-- Database schema for Verifiable On-Chain Job Board

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Candidates table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    talent_profile_id VARCHAR(255),
    builder_score INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    resume_cid VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merit skill attestations
CREATE TABLE skill_attestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) NOT NULL,
    attestation_id BYTEA NOT NULL, -- The on-chain attestation proof
    issuer_address VARCHAR(42),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

-- Job postings
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42),
    job_id_onchain BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements_ipfs_cid VARCHAR(255),
    salary_min BIGINT NOT NULL,
    salary_max BIGINT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    employer_wallet VARCHAR(42) NOT NULL,
    required_skills JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job applications
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT,
    application_data_ipfs_cid VARCHAR(255),
    application_id_onchain BIGINT,
    status VARCHAR(20) DEFAULT 'submitted',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)
);

-- Indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_talent_id ON users(talent_profile_id);
CREATE INDEX idx_skill_attestations_user ON skill_attestations(user_id);
CREATE INDEX idx_jobs_employer ON jobs(employer_wallet);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_user ON applications(user_id);

-- Rows for foreign key relationships
CREATE INDEX idx_skill_attestations_user_fk ON skill_attestations(user_id);
CREATE INDEX idx_applications_job_fk ON applications(job_id);
CREATE INDEX idx_applications_user_fk ON applications(user_id);