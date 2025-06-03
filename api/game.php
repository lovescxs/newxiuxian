<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'data':
                getGameData();
                break;
            case 'leaderboard':
                getLeaderboard();
                break;
            case 'stats':
                getGameStats();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    case 'POST':
        switch ($action) {
            case 'save':
                saveGameData();
                break;
            case 'action':
                gameAction();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    default:
        errorResponse('不支持的请求方法', 405);
}

function getGameData() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    try {
        $db = getDB();
        
        // 获取玩家基础数据
        $stmt = $db->prepare('
            SELECT * FROM player_data WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $playerData = $stmt->fetch();
        
        // 获取技能数据
        $stmt = $db->prepare('
            SELECT skill_name, skill_level FROM player_skills WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $skills = [];
        while ($row = $stmt->fetch()) {
            $skills[$row['skill_name']] = $row['skill_level'];
        }
        
        // 获取物品数据
        $stmt = $db->prepare('
            SELECT item_name, quantity, item_data FROM player_inventory WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $inventory = [];
        while ($row = $stmt->fetch()) {
            $inventory[] = [
                'name' => $row['item_name'],
                'quantity' => $row['quantity'],
                'data' => json_decode($row['item_data'], true)
            ];
        }
        
        // 获取装备数据
        $stmt = $db->prepare('
            SELECT slot, item_name, enhancement_level, item_data FROM player_equipment WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $equipment = [];
        while ($row = $stmt->fetch()) {
            $equipment[$row['slot']] = [
                'name' => $row['item_name'],
                'enhancement' => $row['enhancement_level'],
                'data' => json_decode($row['item_data'], true)
            ];
        }
        
        // 获取成就数据
        $stmt = $db->prepare('
            SELECT achievement_id, progress, completed FROM player_achievements WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $achievements = [];
        while ($row = $stmt->fetch()) {
            $achievements[$row['achievement_id']] = [
                'progress' => $row['progress'],
                'completed' => (bool)$row['completed']
            ];
        }
        
        jsonResponse([
            'success' => true,
            'data' => [
                'player' => $playerData,
                'skills' => $skills,
                'inventory' => $inventory,
                'equipment' => $equipment,
                'achievements' => $achievements
            ]
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取游戏数据失败', 500);
    }
}

function saveGameData() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        errorResponse('无效的数据格式');
    }
    
    try {
        $db = getDB();
        $db->beginTransaction();
        
        // 保存玩家基础数据
        if (isset($input['player'])) {
            $player = $input['player'];
            $stmt = $db->prepare('
                UPDATE player_data SET 
                    level = ?, experience = ?, hp = ?, max_hp = ?, mp = ?, max_mp = ?,
                    attack = ?, defense = ?, gold = ?, spirit_stones = ?, cultivation_points = ?,
                    realm = ?, cultivation_method = ?, sect_name = ?, sect_contribution = ?
                WHERE user_id = ?
            ');
            $stmt->execute([
                $player['level'], $player['experience'], $player['hp'], $player['maxHp'],
                $player['mp'], $player['maxMp'], $player['attack'], $player['defense'],
                $player['gold'], $player['spiritStones'], $player['cultivationPoints'],
                $player['realm'], $player['cultivationMethod'], $player['sectName'],
                $player['sectContribution'], $user['user_id']
            ]);
        }
        
        // 保存技能数据
        if (isset($input['skills'])) {
            $stmt = $db->prepare('DELETE FROM player_skills WHERE user_id = ?');
            $stmt->execute([$user['user_id']]);
            
            $stmt = $db->prepare('INSERT INTO player_skills (user_id, skill_name, skill_level) VALUES (?, ?, ?)');
            foreach ($input['skills'] as $skillName => $level) {
                $stmt->execute([$user['user_id'], $skillName, $level]);
            }
        }
        
        // 保存物品数据
        if (isset($input['inventory'])) {
            $stmt = $db->prepare('DELETE FROM player_inventory WHERE user_id = ?');
            $stmt->execute([$user['user_id']]);
            
            $stmt = $db->prepare('INSERT INTO player_inventory (user_id, item_name, quantity, item_data) VALUES (?, ?, ?, ?)');
            foreach ($input['inventory'] as $item) {
                $stmt->execute([
                    $user['user_id'], 
                    $item['name'], 
                    $item['quantity'], 
                    json_encode($item['data'] ?? null)
                ]);
            }
        }
        
        // 保存装备数据
        if (isset($input['equipment'])) {
            foreach ($input['equipment'] as $slot => $item) {
                $stmt = $db->prepare('
                    UPDATE player_equipment SET 
                        item_name = ?, enhancement_level = ?, item_data = ?
                    WHERE user_id = ? AND slot = ?
                ');
                $stmt->execute([
                    $item['name'], 
                    $item['enhancement'] ?? 0, 
                    json_encode($item['data'] ?? null),
                    $user['user_id'], 
                    $slot
                ]);
            }
        }
        
        // 保存成就数据
        if (isset($input['achievements'])) {
            foreach ($input['achievements'] as $achievementId => $achievement) {
                $stmt = $db->prepare('
                    INSERT INTO player_achievements (user_id, achievement_id, progress, completed, completed_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        progress = VALUES(progress), 
                        completed = VALUES(completed),
                        completed_at = IF(VALUES(completed) = 1 AND completed = 0, NOW(), completed_at)
                ');
                $stmt->execute([
                    $user['user_id'],
                    $achievementId,
                    $achievement['progress'],
                    $achievement['completed'] ? 1 : 0,
                    $achievement['completed'] ? date('Y-m-d H:i:s') : null
                ]);
            }
        }
        
        // 记录游戏日志
        $stmt = $db->prepare('INSERT INTO game_logs (user_id, action, details) VALUES (?, ?, ?)');
        $stmt->execute([$user['user_id'], 'save_game', json_encode(['timestamp' => time()])]);
        
        $db->commit();
        
        jsonResponse([
            'success' => true,
            'message' => '游戏数据保存成功'
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        errorResponse('保存游戏数据失败', 500);
    }
}

function getLeaderboard() {
    $type = $_GET['type'] ?? 'level';
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    
    try {
        $db = getDB();
        
        $orderBy = 'pd.level DESC, pd.experience DESC';
        switch ($type) {
            case 'level':
                $orderBy = 'pd.level DESC, pd.experience DESC';
                break;
            case 'gold':
                $orderBy = 'pd.gold DESC';
                break;
            case 'spirit_stones':
                $orderBy = 'pd.spirit_stones DESC';
                break;
            case 'realm':
                $orderBy = 'pd.realm DESC, pd.level DESC';
                break;
        }
        
        $stmt = $db->prepare("
            SELECT u.username, pd.level, pd.experience, pd.gold, pd.spirit_stones, pd.realm,
                   pd.sect_name, pd.sect_contribution
            FROM users u
            JOIN player_data pd ON u.id = pd.user_id
            WHERE u.is_banned = 0
            ORDER BY {$orderBy}
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $leaderboard = $stmt->fetchAll();
        
        jsonResponse([
            'success' => true,
            'type' => $type,
            'data' => $leaderboard
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取排行榜失败', 500);
    }
}

function getGameStats() {
    try {
        $db = getDB();
        
        // 总用户数
        $stmt = $db->query('SELECT COUNT(*) as total_users FROM users WHERE is_banned = 0');
        $totalUsers = $stmt->fetch()['total_users'];
        
        // 在线用户数
        $stmt = $db->query('SELECT COUNT(*) as online_users FROM online_users WHERE last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)');
        $onlineUsers = $stmt->fetch()['online_users'];
        
        // 总消息数
        $stmt = $db->query('SELECT COUNT(*) as total_messages FROM chat_messages');
        $totalMessages = $stmt->fetch()['total_messages'];
        
        // 最高等级
        $stmt = $db->query('SELECT MAX(level) as max_level FROM player_data');
        $maxLevel = $stmt->fetch()['max_level'];
        
        jsonResponse([
            'success' => true,
            'stats' => [
                'total_users' => $totalUsers,
                'online_users' => $onlineUsers,
                'total_messages' => $totalMessages,
                'max_level' => $maxLevel
            ]
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取统计数据失败', 500);
    }
}

function gameAction() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    try {
        $db = getDB();
        
        // 记录游戏行为日志
        $stmt = $db->prepare('INSERT INTO game_logs (user_id, action, details) VALUES (?, ?, ?)');
        $stmt->execute([$user['user_id'], $action, json_encode($input)]);
        
        jsonResponse([
            'success' => true,
            'message' => '操作记录成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('记录操作失败', 500);
    }
}
?>