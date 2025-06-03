<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'available':
                getAvailableQuests();
                break;
            case 'progress':
                getQuestProgress();
                break;
            case 'daily':
                getDailyQuests();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    case 'POST':
        switch ($action) {
            case 'accept':
                acceptQuest();
                break;
            case 'complete':
                completeQuest();
                break;
            case 'claim':
                claimQuestReward();
                break;
            case 'update':
                updateQuestProgress();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    default:
        errorResponse('不支持的请求方法', 405);
}

function getAvailableQuests() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    try {
        $db = getDB();
        
        // 获取玩家等级和境界
        $stmt = $db->prepare('SELECT level, realm FROM player_data WHERE user_id = ?');
        $stmt->execute([$user['user_id']]);
        $playerData = $stmt->fetch();
        
        if (!$playerData) {
            errorResponse('玩家数据不存在');
        }
        
        // 获取可用任务
        $stmt = $db->prepare('
            SELECT q.*, 
                   COALESCE(pq.status, "available") as status,
                   COALESCE(pq.progress, "{}") as progress
            FROM quests q
            LEFT JOIN player_quests pq ON q.id = pq.quest_id AND pq.user_id = ?
            WHERE q.is_active = 1 
            AND q.level_requirement <= ?
            AND (q.realm_requirement = ? OR q.realm_requirement = "凡人")
            ORDER BY q.quest_type, q.level_requirement
        ');
        $stmt->execute([$user['user_id'], $playerData['level'], $playerData['realm']]);
        $quests = $stmt->fetchAll();
        
        // 处理任务数据
        foreach ($quests as &$quest) {
            $quest['requirements'] = json_decode($quest['requirements'], true);
            $quest['rewards'] = json_decode($quest['rewards'], true);
            $quest['progress'] = json_decode($quest['progress'], true);
        }
        
        jsonResponse([
            'success' => true,
            'quests' => $quests
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取任务列表失败', 500);
    }
}

function acceptQuest() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $questId = $input['quest_id'] ?? 0;
    
    if (!$questId) {
        errorResponse('任务ID不能为空');
    }
    
    try {
        $db = getDB();
        
        // 检查任务是否存在且可接受
        $stmt = $db->prepare('SELECT * FROM quests WHERE id = ? AND is_active = 1');
        $stmt->execute([$questId]);
        $quest = $stmt->fetch();
        
        if (!$quest) {
            errorResponse('任务不存在或已失效');
        }
        
        // 检查玩家是否满足条件
        $stmt = $db->prepare('SELECT level, realm FROM player_data WHERE user_id = ?');
        $stmt->execute([$user['user_id']]);
        $playerData = $stmt->fetch();
        
        if ($playerData['level'] < $quest['level_requirement']) {
            errorResponse('等级不足，无法接受此任务');
        }
        
        // 检查是否已接受
        $stmt = $db->prepare('
            SELECT status FROM player_quests 
            WHERE user_id = ? AND quest_id = ?
        ');
        $stmt->execute([$user['user_id'], $questId]);
        $existing = $stmt->fetch();
        
        if ($existing && $existing['status'] !== 'available') {
            errorResponse('任务已接受或已完成');
        }
        
        // 接受任务
        $stmt = $db->prepare('
            INSERT INTO player_quests (user_id, quest_id, status, accepted_at, progress)
            VALUES (?, ?, "accepted", NOW(), "{}")
            ON DUPLICATE KEY UPDATE 
                status = "accepted", 
                accepted_at = NOW(),
                progress = "{}"
        ');
        $stmt->execute([$user['user_id'], $questId]);
        
        jsonResponse([
            'success' => true,
            'message' => '任务接受成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('接受任务失败', 500);
    }
}

function updateQuestProgress() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $value = $input['value'] ?? 1;
    
    try {
        $db = getDB();
        
        // 获取玩家已接受的任务
        $stmt = $db->prepare('
            SELECT pq.*, q.requirements 
            FROM player_quests pq
            JOIN quests q ON pq.quest_id = q.id
            WHERE pq.user_id = ? AND pq.status = "accepted"
        ');
        $stmt->execute([$user['user_id']]);
        $playerQuests = $stmt->fetchAll();
        
        foreach ($playerQuests as $playerQuest) {
            $requirements = json_decode($playerQuest['requirements'], true);
            $progress = json_decode($playerQuest['progress'], true);
            
            $updated = false;
            
            // 根据动作更新进度
            switch ($action) {
                case 'cultivation':
                    if (isset($requirements['cultivation_time'])) {
                        $progress['cultivation_time'] = ($progress['cultivation_time'] ?? 0) + $value;
                        $updated = true;
                    }
                    break;
                case 'monster_kill':
                    if (isset($requirements['monsters_killed'])) {
                        $progress['monsters_killed'] = ($progress['monsters_killed'] ?? 0) + $value;
                        $updated = true;
                    }
                    break;
                case 'exploration':
                    if (isset($requirements['explorations'])) {
                        $progress['explorations'] = ($progress['explorations'] ?? 0) + $value;
                        $updated = true;
                    }
                    break;
                case 'level_up':
                    if (isset($requirements['level_ups'])) {
                        $progress['level_ups'] = ($progress['level_ups'] ?? 0) + $value;
                        $updated = true;
                    }
                    break;
                case 'pill_craft':
                    if (isset($requirements['pills_crafted'])) {
                        $progress['pills_crafted'] = ($progress['pills_crafted'] ?? 0) + $value;
                        $updated = true;
                    }
                    break;
            }
            
            if ($updated) {
                // 检查是否完成
                $completed = true;
                foreach ($requirements as $req => $target) {
                    if (($progress[$req] ?? 0) < $target) {
                        $completed = false;
                        break;
                    }
                }
                
                $status = $completed ? 'completed' : 'accepted';
                $completedAt = $completed ? date('Y-m-d H:i:s') : null;
                
                // 更新进度
                $stmt = $db->prepare('
                    UPDATE player_quests 
                    SET progress = ?, status = ?, completed_at = ?
                    WHERE id = ?
                ');
                $stmt->execute([
                    json_encode($progress), 
                    $status, 
                    $completedAt,
                    $playerQuest['id']
                ]);
            }
        }
        
        jsonResponse([
            'success' => true,
            'message' => '任务进度已更新'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('更新任务进度失败', 500);
    }
}

function claimQuestReward() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $questId = $input['quest_id'] ?? 0;
    
    if (!$questId) {
        errorResponse('任务ID不能为空');
    }
    
    try {
        $db = getDB();
        $db->beginTransaction();
        
        // 检查任务状态
        $stmt = $db->prepare('
            SELECT pq.*, q.rewards 
            FROM player_quests pq
            JOIN quests q ON pq.quest_id = q.id
            WHERE pq.user_id = ? AND pq.quest_id = ? AND pq.status = "completed"
        ');
        $stmt->execute([$user['user_id'], $questId]);
        $playerQuest = $stmt->fetch();
        
        if (!$playerQuest) {
            $db->rollBack();
            errorResponse('任务未完成或不存在');
        }
        
        $rewards = json_decode($playerQuest['rewards'], true);
        
        // 发放奖励
        $stmt = $db->prepare('SELECT * FROM player_data WHERE user_id = ?');
        $stmt->execute([$user['user_id']]);
        $playerData = $stmt->fetch();
        
        $newExp = $playerData['experience'] + ($rewards['exp'] ?? 0);
        $newGold = $playerData['gold'] + ($rewards['gold'] ?? 0);
        $newSpiritStones = $playerData['spirit_stones'] + ($rewards['spirit_stones'] ?? 0);
        
        $stmt = $db->prepare('
            UPDATE player_data 
            SET experience = ?, gold = ?, spirit_stones = ?
            WHERE user_id = ?
        ');
        $stmt->execute([$newExp, $newGold, $newSpiritStones, $user['user_id']]);
        
        // 发放物品奖励
        if (isset($rewards['items'])) {
            foreach ($rewards['items'] as $itemName => $quantity) {
                $stmt = $db->prepare('
                    INSERT INTO player_inventory (user_id, item_name, quantity)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                ');
                $stmt->execute([$user['user_id'], $itemName, $quantity]);
            }
        }
        
        // 标记任务为已领取
        $stmt = $db->prepare('
            UPDATE player_quests 
            SET status = "claimed", claimed_at = NOW()
            WHERE id = ?
        ');
        $stmt->execute([$playerQuest['id']]);
        
        $db->commit();
        
        jsonResponse([
            'success' => true,
            'message' => '任务奖励已领取',
            'rewards' => $rewards
        ]);
        
    } catch (PDOException $e) {
        if (isset($db)) {
            $db->rollBack();
        }
        errorResponse('领取任务奖励失败', 500);
    }
}
