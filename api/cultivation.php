<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'status':
                getAutoCultivationStatus();
                break;
            case 'calculate':
                calculateOfflineProgress();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    case 'POST':
        switch ($action) {
            case 'start':
                startAutoCultivation();
                break;
            case 'stop':
                stopAutoCultivation();
                break;
            case 'claim':
                claimOfflineRewards();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    default:
        errorResponse('不支持的请求方法', 405);
}

function getAutoCultivationStatus() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare('
            SELECT * FROM auto_cultivation 
            WHERE user_id = ? AND is_active = 1
            ORDER BY start_time DESC 
            LIMIT 1
        ');
        $stmt->execute([$user['user_id']]);
        $cultivation = $stmt->fetch();
        
        if ($cultivation) {
            // 计算当前进度
            $now = time();
            $startTime = strtotime($cultivation['start_time']);
            $lastCalculated = strtotime($cultivation['last_calculated']);
            
            $hoursElapsed = ($now - $lastCalculated) / 3600;
            $expGained = floor($hoursElapsed * $cultivation['exp_per_hour']);
            $costPaid = floor($hoursElapsed * $cultivation['cost_per_hour']);
            
            jsonResponse([
                'success' => true,
                'active' => true,
                'cultivation' => [
                    'type' => $cultivation['cultivation_type'],
                    'start_time' => $cultivation['start_time'],
                    'exp_per_hour' => $cultivation['exp_per_hour'],
                    'cost_per_hour' => $cultivation['cost_per_hour'],
                    'cost_type' => $cultivation['cost_type'],
                    'total_exp_gained' => $cultivation['total_exp_gained'] + $expGained,
                    'total_cost_paid' => $cultivation['total_cost_paid'] + $costPaid,
                    'pending_exp' => $expGained,
                    'pending_cost' => $costPaid,
                    'hours_elapsed' => $hoursElapsed
                ]
            ]);
        } else {
            jsonResponse([
                'success' => true,
                'active' => false
            ]);
        }
        
    } catch (PDOException $e) {
        errorResponse('获取修炼状态失败', 500);
    }
}

function startAutoCultivation() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $cultivationType = $input['type'] ?? 'meditation';
    
    // 验证修炼类型
    $validTypes = ['meditation', 'formation', 'pill_assisted'];
    if (!in_array($cultivationType, $validTypes)) {
        errorResponse('无效的修炼类型');
    }
    
    try {
        $db = getDB();
        
        // 检查是否已有活跃的修炼
        $stmt = $db->prepare('
            SELECT id FROM auto_cultivation 
            WHERE user_id = ? AND is_active = 1
        ');
        $stmt->execute([$user['user_id']]);
        if ($stmt->fetch()) {
            errorResponse('已有活跃的自动修炼');
        }
        
        // 获取玩家数据以确定修炼效率
        $stmt = $db->prepare('
            SELECT level, realm, spirit_stones, gold 
            FROM player_data 
            WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $playerData = $stmt->fetch();
        
        if (!$playerData) {
            errorResponse('玩家数据不存在');
        }
        
        // 计算修炼效率和消耗
        $expPerHour = 60; // 基础每小时60经验
        $costPerHour = 0;
        $costType = 'spirit_stones';
        
        switch ($cultivationType) {
            case 'meditation':
                $expPerHour = 60;
                $costPerHour = 0;
                break;
            case 'formation':
                $expPerHour = 180; // 3倍效率
                $costPerHour = 10; // 每小时10灵石
                $costType = 'spirit_stones';
                if ($playerData['spirit_stones'] < $costPerHour) {
                    errorResponse('灵石不足，无法开始阵法修炼');
                }
                break;
            case 'pill_assisted':
                $expPerHour = 300; // 5倍效率
                $costPerHour = 50; // 每小时50金币
                $costType = 'gold';
                if ($playerData['gold'] < $costPerHour) {
                    errorResponse('金币不足，无法开始丹药辅助修炼');
                }
                break;
        }
        
        // 根据境界调整效率
        $realmMultiplier = 1.0;
        switch ($playerData['realm']) {
            case '练气期': $realmMultiplier = 1.0; break;
            case '筑基期': $realmMultiplier = 1.2; break;
            case '金丹期': $realmMultiplier = 1.5; break;
            case '元婴期': $realmMultiplier = 2.0; break;
            case '化神期': $realmMultiplier = 3.0; break;
        }
        
        $expPerHour = floor($expPerHour * $realmMultiplier);
        
        // 开始自动修炼
        $stmt = $db->prepare('
            INSERT INTO auto_cultivation 
            (user_id, cultivation_type, exp_per_hour, cost_per_hour, cost_type) 
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $user['user_id'], 
            $cultivationType, 
            $expPerHour, 
            $costPerHour, 
            $costType
        ]);
        
        jsonResponse([
            'success' => true,
            'message' => '自动修炼已开始',
            'cultivation' => [
                'type' => $cultivationType,
                'exp_per_hour' => $expPerHour,
                'cost_per_hour' => $costPerHour,
                'cost_type' => $costType
            ]
        ]);
        
    } catch (PDOException $e) {
        errorResponse('开始自动修炼失败', 500);
    }
}

function stopAutoCultivation() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    try {
        $db = getDB();
        
        // 停止自动修炼
        $stmt = $db->prepare('
            UPDATE auto_cultivation 
            SET is_active = 0, end_time = NOW() 
            WHERE user_id = ? AND is_active = 1
        ');
        $stmt->execute([$user['user_id']]);
        
        if ($stmt->rowCount() > 0) {
            jsonResponse([
                'success' => true,
                'message' => '自动修炼已停止'
            ]);
        } else {
            errorResponse('没有活跃的自动修炼');
        }
        
    } catch (PDOException $e) {
        errorResponse('停止自动修炼失败', 500);
    }
}

function calculateOfflineProgress() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    try {
        $db = getDB();
        
        // 获取活跃的自动修炼
        $stmt = $db->prepare('
            SELECT * FROM auto_cultivation 
            WHERE user_id = ? AND is_active = 1
            ORDER BY start_time DESC 
            LIMIT 1
        ');
        $stmt->execute([$user['user_id']]);
        $cultivation = $stmt->fetch();
        
        if (!$cultivation) {
            jsonResponse([
                'success' => true,
                'offline_progress' => null
            ]);
            return;
        }
        
        // 获取玩家当前资源
        $stmt = $db->prepare('
            SELECT spirit_stones, gold FROM player_data WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $playerData = $stmt->fetch();
        
        $now = time();
        $lastCalculated = strtotime($cultivation['last_calculated']);
        $hoursElapsed = ($now - $lastCalculated) / 3600;
        
        // 计算可以修炼的小时数（基于资源限制）
        $maxHours = $hoursElapsed;
        if ($cultivation['cost_per_hour'] > 0) {
            $availableResource = $cultivation['cost_type'] === 'spirit_stones' 
                ? $playerData['spirit_stones'] 
                : $playerData['gold'];
            $maxAffordableHours = $availableResource / $cultivation['cost_per_hour'];
            $maxHours = min($hoursElapsed, $maxAffordableHours);
        }
        
        $expGained = floor($maxHours * $cultivation['exp_per_hour']);
        $costPaid = floor($maxHours * $cultivation['cost_per_hour']);
        
        jsonResponse([
            'success' => true,
            'offline_progress' => [
                'hours_elapsed' => $hoursElapsed,
                'hours_cultivated' => $maxHours,
                'exp_gained' => $expGained,
                'cost_paid' => $costPaid,
                'cost_type' => $cultivation['cost_type'],
                'cultivation_type' => $cultivation['cultivation_type']
            ]
        ]);
        
    } catch (PDOException $e) {
        errorResponse('计算离线进度失败', 500);
    }
}

function claimOfflineRewards() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }

    try {
        $db = getDB();
        $db->beginTransaction();

        // 获取活跃的自动修炼
        $stmt = $db->prepare('
            SELECT * FROM auto_cultivation
            WHERE user_id = ? AND is_active = 1
            ORDER BY start_time DESC
            LIMIT 1
        ');
        $stmt->execute([$user['user_id']]);
        $cultivation = $stmt->fetch();

        if (!$cultivation) {
            $db->rollBack();
            errorResponse('没有活跃的自动修炼');
        }

        // 获取玩家当前数据
        $stmt = $db->prepare('
            SELECT * FROM player_data WHERE user_id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $playerData = $stmt->fetch();

        $now = time();
        $lastCalculated = strtotime($cultivation['last_calculated']);
        $hoursElapsed = ($now - $lastCalculated) / 3600;

        // 计算可以修炼的小时数（基于资源限制）
        $maxHours = $hoursElapsed;
        if ($cultivation['cost_per_hour'] > 0) {
            $availableResource = $cultivation['cost_type'] === 'spirit_stones'
                ? $playerData['spirit_stones']
                : $playerData['gold'];
            $maxAffordableHours = $availableResource / $cultivation['cost_per_hour'];
            $maxHours = min($hoursElapsed, $maxAffordableHours);
        }

        $expGained = floor($maxHours * $cultivation['exp_per_hour']);
        $costPaid = floor($maxHours * $cultivation['cost_per_hour']);

        // 更新玩家数据
        $newExp = $playerData['experience'] + $expGained;
        $newSpiritStones = $playerData['spirit_stones'];
        $newGold = $playerData['gold'];

        if ($cultivation['cost_type'] === 'spirit_stones') {
            $newSpiritStones -= $costPaid;
        } else {
            $newGold -= $costPaid;
        }

        $stmt = $db->prepare('
            UPDATE player_data
            SET experience = ?, spirit_stones = ?, gold = ?
            WHERE user_id = ?
        ');
        $stmt->execute([$newExp, $newSpiritStones, $newGold, $user['user_id']]);

        // 更新自动修炼记录
        $stmt = $db->prepare('
            UPDATE auto_cultivation
            SET total_exp_gained = total_exp_gained + ?,
                total_cost_paid = total_cost_paid + ?,
                last_calculated = NOW()
            WHERE id = ?
        ');
        $stmt->execute([$expGained, $costPaid, $cultivation['id']]);

        // 记录日志
        $stmt = $db->prepare('
            INSERT INTO game_logs (user_id, action, details)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([
            $user['user_id'],
            'claim_offline_cultivation',
            json_encode([
                'exp_gained' => $expGained,
                'cost_paid' => $costPaid,
                'cost_type' => $cultivation['cost_type'],
                'hours' => $maxHours
            ])
        ]);

        $db->commit();

        jsonResponse([
            'success' => true,
            'message' => '离线修炼奖励已领取',
            'rewards' => [
                'exp_gained' => $expGained,
                'cost_paid' => $costPaid,
                'cost_type' => $cultivation['cost_type'],
                'hours_cultivated' => $maxHours
            ]
        ]);

    } catch (PDOException $e) {
        if (isset($db)) {
            $db->rollBack();
        }
        errorResponse('领取离线奖励失败', 500);
    }
}
