ALTER TABLE users ADD COLUMN username TEXT;
UPDATE users SET username = coalesce(nullif(left(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_-]', '', 'g'), 24), ''), 'user') || '-' || left(replace(id::text, '-', ''), 6) WHERE username IS NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX users_username_lower_unique ON users (lower(username));
ALTER TABLE users ADD COLUMN google_sub TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
