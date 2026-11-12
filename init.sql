-- CineChain Database Initialization
-- This runs once when PostgreSQL container starts

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the database if it doesn't exist (handled by POSTGRES_DB env var)
-- Just ensure the schema will be created by Spring Boot (ddl-auto: update)

COMMENT ON DATABASE cinechain IS 'CineChain Cinema Booking Platform Database';
