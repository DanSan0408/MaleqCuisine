-- Dashboard Configuration Tables
-- Section 1: Slideshow Images
CREATE TABLE IF NOT EXISTS dashboard_slideshow_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Section 2: Featured Menu Items
CREATE TABLE IF NOT EXISTS dashboard_featured_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    menu_item_id INT NOT NULL,
    position INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_featured_item (menu_item_id)
);

-- Section 3: Company Story Configuration
CREATE TABLE IF NOT EXISTS dashboard_company_story (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL DEFAULT 'Our Story',
    description TEXT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_slideshow_position ON dashboard_slideshow_images(position);
CREATE INDEX idx_slideshow_active ON dashboard_slideshow_images(is_active);
CREATE INDEX idx_featured_position ON dashboard_featured_items(position);
CREATE INDEX idx_featured_active ON dashboard_featured_items(is_active);
CREATE INDEX idx_story_active ON dashboard_company_story(is_active);
