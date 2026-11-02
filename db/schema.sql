-- Personale der kan logge ind. Admins kan oprette nye medarbejdere.
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ting som personalet har fundet på hotellet.
CREATE TABLE IF NOT EXISTS found_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(500) NOT NULL,
  found_date DATE NOT NULL,
  location VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NULL,
  created_by INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES staff(id)
);

-- Sager oprettet af kunder via webformular (email) eller SMS (telefon).
CREATE TABLE IF NOT EXISTS lost_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token CHAR(32) NOT NULL UNIQUE,
  channel ENUM('web', 'sms') NOT NULL,
  name VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  description VARCHAR(500) NOT NULL,
  lost_date DATE NULL,
  location VARCHAR(100) NULL,
  status ENUM('soeges', 'fundet', 'udleveret') NOT NULL DEFAULT 'soeges',
  found_item_id INT NULL UNIQUE,
  -- Twilios id for den SMS der oprettede sagen. UNIQUE gør, at samme SMS kun bliver til én sag.
  message_sid VARCHAR(64) NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (found_item_id) REFERENCES found_items(id)
);
