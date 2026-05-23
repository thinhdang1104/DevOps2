CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('INCOME', 'EXPENSE') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed sample data once for first-time environment setup.
INSERT INTO transactions (type, amount, category, description, created_at)
SELECT seed.type, seed.amount, seed.category, seed.description, seed.created_at
FROM (
  SELECT 'INCOME' AS type, 12000000.00 AS amount, 'SALARY' AS category, 'Luong thang 01' AS description, DATE_SUB(NOW(), INTERVAL 120 DAY) AS created_at
  UNION ALL
  SELECT 'EXPENSE', 2200000.00, 'RENT', 'Tien nha', DATE_SUB(NOW(), INTERVAL 112 DAY)
  UNION ALL
  SELECT 'EXPENSE', 450000.00, 'FOOD', 'Mua thuc pham', DATE_SUB(NOW(), INTERVAL 98 DAY)
  UNION ALL
  SELECT 'INCOME', 1800000.00, 'FREELANCE', 'Du an ngoai gio', DATE_SUB(NOW(), INTERVAL 66 DAY)
  UNION ALL
  SELECT 'EXPENSE', 320000.00, 'TRANSPORT', 'Di chuyen', DATE_SUB(NOW(), INTERVAL 42 DAY)
  UNION ALL
  SELECT 'EXPENSE', 760000.00, 'UTILITIES', 'Dien nuoc internet', DATE_SUB(NOW(), INTERVAL 14 DAY)
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM transactions LIMIT 1);
