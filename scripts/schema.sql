-- Ice cream parlor: flavors table for RDS (MySQL)
CREATE TABLE IF NOT EXISTS ice_cream_flavors (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
