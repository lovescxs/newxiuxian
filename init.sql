-- 修仙世界游戏数据库初始化脚本
-- 这个文件是api/database.sql的简化版本，用于Docker Hub部署

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS cultivation_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cultivation_game;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username)
);

-- 玩家数据表
CREATE TABLE IF NOT EXISTS player_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    hp INT DEFAULT 100,
    max_hp INT DEFAULT 100,
    mp INT DEFAULT 50,
    max_mp INT DEFAULT 50,
    attack INT DEFAULT 10,
    defense INT DEFAULT 5,
    gold INT DEFAULT 1000,
    spirit_stones INT DEFAULT 100,
    realm VARCHAR(50) DEFAULT '凡人',
    location VARCHAR(50) DEFAULT '新手村',
    sect VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id),
    INDEX idx_level (level),
    INDEX idx_realm (realm)
);

-- 自动修炼表
CREATE TABLE IF NOT EXISTS auto_cultivation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cultivation_type ENUM('meditation', 'formation', 'pill_assisted') DEFAULT 'meditation',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    exp_per_hour INT DEFAULT 60,
    cost_per_hour INT DEFAULT 0,
    cost_type ENUM('gold', 'spirit_stones', 'pills') DEFAULT 'spirit_stones',
    total_exp_gained INT DEFAULT 0,
    total_cost_paid INT DEFAULT 0,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_active (is_active)
);

-- 任务表
CREATE TABLE IF NOT EXISTS quests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quest_type ENUM('daily', 'weekly', 'main', 'side', 'event') DEFAULT 'daily',
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements JSON NOT NULL,
    rewards JSON NOT NULL,
    level_requirement INT DEFAULT 1,
    realm_requirement VARCHAR(50) DEFAULT '凡人',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 玩家任务进度表
CREATE TABLE IF NOT EXISTS player_quests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quest_id INT NOT NULL,
    progress JSON DEFAULT '{}',
    status ENUM('available', 'accepted', 'completed', 'claimed') DEFAULT 'available',
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    claimed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_quest (user_id, quest_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- 其他必要表（简化版本）
CREATE TABLE IF NOT EXISTS player_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    item_type VARCHAR(50) DEFAULT 'material',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_item (user_id, item_name)
);

CREATE TABLE IF NOT EXISTS player_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    skill_level INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_name)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS game_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
);

-- 插入默认管理员账户
INSERT IGNORE INTO users (username, password, is_admin) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

-- 为管理员创建初始游戏数据
INSERT IGNORE INTO player_data (user_id, level, experience, hp, max_hp, mp, max_mp, attack, defense, gold, spirit_stones, realm)
SELECT id, 1, 0, 100, 100, 50, 50, 10, 5, 1000, 100, '凡人' FROM users WHERE username = 'admin' AND NOT EXISTS (
    SELECT 1 FROM player_data WHERE user_id = (SELECT id FROM users WHERE username = 'admin')
);

-- 插入默认任务
INSERT IGNORE INTO quests (id, quest_type, title, description, requirements, rewards, level_requirement) VALUES
(1, 'daily', '日常修炼', '完成1小时的修炼', '{"cultivation_time": 3600}', '{"exp": 100, "gold": 50}', 1),
(2, 'daily', '击败妖兽', '击败5只妖兽', '{"monsters_killed": 5}', '{"exp": 200, "gold": 100, "items": {"回血丹": 2}}', 1),
(3, 'daily', '探索世界', '完成3次探索', '{"explorations": 3}', '{"exp": 150, "spirit_stones": 10}', 1),
(4, 'weekly', '境界突破', '提升1个境界等级', '{"level_ups": 1}', '{"exp": 500, "gold": 300, "spirit_stones": 50}', 5),
(5, 'weekly', '炼丹大师', '成功炼制10颗丹药', '{"pills_crafted": 10}', '{"exp": 300, "items": {"灵草": 5, "火莲子": 3}}', 10);

-- 插入默认技能
INSERT IGNORE INTO player_skills (user_id, skill_name, skill_level)
SELECT id, '火球术', 1 FROM users WHERE username = 'admin' AND NOT EXISTS (
    SELECT 1 FROM player_skills WHERE user_id = (SELECT id FROM users WHERE username = 'admin') AND skill_name = '火球术'
);

INSERT IGNORE INTO player_skills (user_id, skill_name, skill_level)
SELECT id, '治疗术', 1 FROM users WHERE username = 'admin' AND NOT EXISTS (
    SELECT 1 FROM player_skills WHERE user_id = (SELECT id FROM users WHERE username = 'admin') AND skill_name = '治疗术'
);

-- 插入一些初始物品
INSERT IGNORE INTO player_inventory (user_id, item_name, quantity, item_type)
SELECT id, '回血丹', 5, 'consumable' FROM users WHERE username = 'admin' AND NOT EXISTS (
    SELECT 1 FROM player_inventory WHERE user_id = (SELECT id FROM users WHERE username = 'admin') AND item_name = '回血丹'
);

INSERT IGNORE INTO player_inventory (user_id, item_name, quantity, item_type)
SELECT id, '灵草', 10, 'material' FROM users WHERE username = 'admin' AND NOT EXISTS (
    SELECT 1 FROM player_inventory WHERE user_id = (SELECT id FROM users WHERE username = 'admin') AND item_name = '灵草'
);

-- 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_player_data_user_level ON player_data(user_id, level);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recent ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_logs_user_recent ON game_logs(user_id, created_at DESC);
