CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  phone           TEXT,
  date_of_birth   DATE,
  address         TEXT,
  role            TEXT        NOT NULL DEFAULT 'customer'
                              CHECK (role IN ('customer', 'admin')),
  password_hash   TEXT,
  github_id       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique email (matches our toLowerCase() convention).
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx
  ON users (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_uidx
  ON users (github_id)
  WHERE github_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);
