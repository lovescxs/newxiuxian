-- 修仙游戏数据库结构
CREATE DATABASE IF NOT EXISTS cultivation_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cultivation_game;

-- 用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username)
);

-- 玩家游戏数据表
CREATE TABLE player_data (
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
    gold INT DEFAULT 100,
    spirit_stones INT DEFAULT 0,
    cultivation_points INT DEFAULT 0,
    realm VARCHAR(50) DEFAULT '凡人',
    cultivation_method VARCHAR(100),
    sect_name VARCHAR(100),
    sect_contribution INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- 玩家技能表
CREATE TABLE player_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(50) NOT NULL,
    skill_level INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_name),
    INDEX idx_user_id (user_id)
);

-- 玩家物品表
CREATE TABLE player_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    item_data JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- 玩家装备表
CREATE TABLE player_equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slot VARCHAR(20) NOT NULL,
    item_name VARCHAR(100),
    enhancement_level INT DEFAULT 0,
    item_data JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_slot (user_id, slot),
    INDEX idx_user_id (user_id)
);

-- 玩家成就表
CREATE TABLE player_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id VARCHAR(50) NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id)
);

-- 聊天消息表
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('user', 'admin', 'system') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
);

-- 系统公告表
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    admin_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    INDEX idx_created_at (created_at)
);

-- 游戏日志表
CREATE TABLE game_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- 在线用户表（用于统计）
CREATE TABLE online_users (
    user_id INT PRIMARY KEY,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 自动修炼系统表
CREATE TABLE auto_cultivation (
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

-- 任务系统表
CREATE TABLE quests (
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
CREATE TABLE player_quests (
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

-- 签到系统表
CREATE TABLE daily_checkin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    checkin_date DATE NOT NULL,
    consecutive_days INT DEFAULT 1,
    rewards_claimed JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, checkin_date),
    INDEX idx_user_id (user_id),
    INDEX idx_date (checkin_date)
);

-- 插入默认管理员账户
INSERT INTO users (username, password, is_admin) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);
-- 密码是 'password'，实际使用时请修改

-- 为管理员创建初始游戏数据
INSERT INTO player_data (user_id, level, experience, hp, max_hp, mp, max_mp, attack, defense, gold, spirit_stones, realm)
SELECT id, 1, 0, 100, 100, 50, 50, 10, 5, 1000, 100, '凡人' FROM users WHERE username = 'admin';

-- 插入默认任务
INSERT INTO quests (quest_type, title, description, requirements, rewards, level_requirement) VALUES
('daily', '日常修炼', '完成1小时的修炼', '{"cultivation_time": 3600}', '{"exp": 100, "gold": 50}', 1),
('daily', '击败妖兽', '击败5只妖兽', '{"monsters_killed": 5}', '{"exp": 200, "gold": 100, "items": {"回血丹": 2}}', 1),
('daily', '探索世界', '完成3次探索', '{"explorations": 3}', '{"exp": 150, "spirit_stones": 10}', 1),
('weekly', '境界突破', '提升1个境界等级', '{"level_ups": 1}', '{"exp": 500, "gold": 300, "spirit_stones": 50}', 5),
('weekly', '炼丹大师', '成功炼制10颗丹药', '{"pills_crafted": 10}', '{"exp": 300, "items": {"灵草": 5, "火莲子": 3}}', 10);