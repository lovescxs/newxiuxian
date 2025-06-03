<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

switch ($method) {
    case 'POST':
        switch ($action) {
            case 'register':
                register();
                break;
            case 'login':
                login();
                break;
            case 'logout':
                logout();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    case 'GET':
        switch ($action) {
            case 'profile':
                getProfile();
                break;
            case 'verify':
                verifyToken();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    default:
        errorResponse('不支持的请求方法', 405);
}

function register() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        errorResponse('用户名和密码不能为空');
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    $email = isset($input['email']) ? trim($input['email']) : null;
    
    // 验证输入
    if (strlen($username) < 3 || strlen($username) > 20) {
        errorResponse('用户名长度必须在3-20个字符之间');
    }
    
    if (strlen($password) < 6) {
        errorResponse('密码长度至少6位');
    }
    
    if (!preg_match('/^[a-zA-Z0-9_\x{4e00}-\x{9fa5}]+$/u', $username)) {
        errorResponse('用户名只能包含字母、数字、下划线和中文');
    }
    
    try {
        $db = getDB();
        
        // 检查用户名是否已存在
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            errorResponse('用户名已存在');
        }
        
        // 创建用户
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('INSERT INTO users (username, password, email) VALUES (?, ?, ?)');
        $stmt->execute([$username, $hashedPassword, $email]);
        
        $userId = $db->lastInsertId();
        
        // 创建初始游戏数据
        $stmt = $db->prepare('
            INSERT INTO player_data (user_id, level, experience, hp, max_hp, mp, max_mp, attack, defense, gold, spirit_stones, realm) 
            VALUES (?, 1, 0, 100, 100, 50, 50, 10, 5, 100, 0, "凡人")
        ');
        $stmt->execute([$userId]);
        
        // 创建初始装备槽位
        $equipmentSlots = ['weapon', 'armor', 'accessory'];
        $stmt = $db->prepare('INSERT INTO player_equipment (user_id, slot) VALUES (?, ?)');
        foreach ($equipmentSlots as $slot) {
            $stmt->execute([$userId, $slot]);
        }
        
        jsonResponse([
            'success' => true,
            'message' => '注册成功',
            'user_id' => $userId
        ]);
        
    } catch (PDOException $e) {
        errorResponse('注册失败，请重试', 500);
    }
}

function login() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        errorResponse('用户名和密码不能为空');
    }
    
    $username = trim($input['username']);
    $password = $input['password'];
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare('SELECT id, username, password, is_admin, is_banned FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            errorResponse('用户名或密码错误');
        }
        
        if ($user['is_banned']) {
            errorResponse('账号已被封禁');
        }
        
        // 更新最后登录时间
        $stmt = $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
        $stmt->execute([$user['id']]);
        
        // 更新在线状态
        $stmt = $db->prepare('INSERT INTO online_users (user_id) VALUES (?) ON DUPLICATE KEY UPDATE last_activity = NOW()');
        $stmt->execute([$user['id']]);
        
        // 生成JWT
        $payload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'is_admin' => (bool)$user['is_admin'],
            'exp' => time() + (24 * 60 * 60) // 24小时过期
        ];
        
        $token = generateJWT($payload);
        
        jsonResponse([
            'success' => true,
            'message' => '登录成功',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'is_admin' => (bool)$user['is_admin']
            ]
        ]);
        
    } catch (PDOException $e) {
        errorResponse('登录失败，请重试', 500);
    }
}

function logout() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    try {
        $db = getDB();
        
        // 移除在线状态
        $stmt = $db->prepare('DELETE FROM online_users WHERE user_id = ?');
        $stmt->execute([$user['user_id']]);
        
        jsonResponse([
            'success' => true,
            'message' => '登出成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('登出失败', 500);
    }
}

function getProfile() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare('
            SELECT u.id, u.username, u.email, u.is_admin, u.created_at, u.last_login,
                   pd.level, pd.experience, pd.hp, pd.max_hp, pd.mp, pd.max_mp,
                   pd.attack, pd.defense, pd.gold, pd.spirit_stones, pd.cultivation_points,
                   pd.realm, pd.cultivation_method, pd.sect_name, pd.sect_contribution
            FROM users u
            LEFT JOIN player_data pd ON u.id = pd.user_id
            WHERE u.id = ?
        ');
        $stmt->execute([$user['user_id']]);
        $profile = $stmt->fetch();
        
        if (!$profile) {
            errorResponse('用户不存在', 404);
        }
        
        jsonResponse([
            'success' => true,
            'profile' => $profile
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取用户信息失败', 500);
    }
}

function verifyToken() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('Token无效', 401);
    }
    
    jsonResponse([
        'success' => true,
        'user' => $user
    ]);
}
?>