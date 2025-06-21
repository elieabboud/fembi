-- Database initialization script for Pokemon API Audit system
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL,
    correlation_id VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    limit_value INTEGER NOT NULL,
    offset_value INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    response_data JSONB,
    error_message TEXT,
    processing_time_ms INTEGER,
    external_api_url TEXT,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_source ON audit_logs(source);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_source_created_at ON audit_logs(source, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success_source ON audit_logs(success, source);

-- Create audit statistics view
CREATE OR REPLACE VIEW audit_statistics AS
SELECT 
    source,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COUNT(*) FILTER (WHERE success = false) as failed_requests,
    COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
    ROUND(AVG(processing_time_ms), 2) as avg_processing_time_ms,
    MIN(created_at) as first_request,
    MAX(created_at) as last_request
FROM audit_logs 
GROUP BY source;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_audit_logs_updated_at 
    BEFORE UPDATE ON audit_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO audit_logs (request_id, correlation_id, source, limit_value, offset_value, success, response_data, processing_time_ms, external_api_url) 
VALUES 
    ('sample-001', 'corr-001', 'pokemon', 20, 0, true, '{"sample": "data"}', 150, 'https://pokeapi.co/api/v2/pokemon'),
    ('sample-002', 'corr-002', 'product', 10, 0, true, '{"sample": "product"}', 200, 'https://dummyjson.com/products')
ON CONFLICT DO NOTHING;