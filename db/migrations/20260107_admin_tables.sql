-- admins table (migration)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- passwordless_credentials table (migration)
CREATE TABLE passwordless_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credential_id BYTEA UNIQUE NOT NULL,
  public_key BYTEA NOT NULL,
  sign_count BIGINT DEFAULT 0,
  transports TEXT[],
  created_at TIMESTAMP DEFAULT now()
);
