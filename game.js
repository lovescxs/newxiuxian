// Vue 3 修仙游戏应用
const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

// API配置
const API_BASE_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('auth_token') || '';

// API请求工具函数
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '请求失败');
        }
        
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
};

createApp({
    setup() {
        // 响应式数据
        const isLoggedIn = ref(false);
        const currentUser = ref(null);
        const authMode = ref('login');
        const authError = ref('');
        const saving = ref(false);
        const exploring = ref(false);
        const isCultivating = ref(false);
        const cultivationType = ref('');
        const cultivationTime = ref(0);
        const inBattle = ref(false);
        const currentEnemy = ref(null);
        const battleMessages = ref([]);
        const notifications = ref([]);
        const gameLog = ref([]);
        
        // 新功能状态
        const alchemyInProgress = ref(false);
        const alchemyTimeLeft = ref(0);
        const alchemyDuration = ref(0);
        const selectedEquipment = ref(null);

        // 自动修炼状态
        const autoCultivationActive = ref(false);
        const autoCultivationType = ref('');
        const autoCultivationStartTime = ref(null);
        const offlineProgress = ref(null);
        const showOfflineModal = ref(false);

        // 任务系统状态
        const availableQuests = ref([]);
        const activeQuests = ref([]);
        const completedQuests = ref([]);
        const questProgress = ref({});
        
        // 聊天和管理功能
        const chatMessages = ref([]);
        const chatInput = ref('');
        const isAdmin = ref(false);
        const allUsers = ref([]);
        const adminAnnouncement = ref('');
        const onlineUsers = ref(1);
        const totalUsers = ref(1);
        const totalMessages = ref(0);
        
        // 排行榜功能
        const activeLeaderboardTab = ref('level');
        const leaderboardTabs = [
            { id: 'level', name: '等级榜' },
            { id: 'gold', name: '财富榜' },
            { id: 'battle', name: '战力榜' }
        ];
        
        // 界面状态
        const activeLeftTab = ref('cultivation');
        const activeCenterTab = ref('adventure');
        const activeShopCategory = ref('pills');
        
        // 表单数据
        const authForm = reactive({
            username: '',
            password: '',
            confirmPassword: ''
        });
        
        // 玩家数据
        const player = reactive({
            name: '道友',
            realm: '练气期',
            level: 1,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            exp: 0,
            maxExp: 100,
            gold: 1000,
            spiritStones: 50,
            cultivationPoints: 0,
            attack: 20,
            defense: 10,
            skills: {
                fireball: { level: 1, exp: 0, locked: false },
                heal: { level: 1, exp: 0, locked: false },
                shield: { level: 1, exp: 0, locked: false },
                lightning: { level: 0, exp: 0, locked: true }
            },
            inventory: {
                '回血丹': 5,
                '回灵丹': 3,
                '草药': 10
            },
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },
            stats: {
                monstersKilled: 0,
                cultivationTime: 0,
                battleWins: 0
            },
            // 新增宗门相关属性
            sect: null,
            sectContribution: 0,
            sectLevel: 1
        });
        
        // 界面状态
        const activeQuestTab = ref('available');

        // 游戏数据
        const leftTabs = [
            { id: 'cultivation', name: '修炼', icon: '🧘' },
            { id: 'skills', name: '技能', icon: '⚡' },
            { id: 'inventory', name: '背包', icon: '🎒' },
            { id: 'quests', name: '任务', icon: '📋' },
            { id: 'achievements', name: '成就', icon: '🏆' },
            { id: 'sect', name: '宗门', icon: '🏛️' },
            { id: 'leaderboard', name: '排行榜', icon: '🏅' },
            { id: 'chat', name: '江湖', icon: '💬' },
            { id: 'admin', name: '管理', icon: '🛡️' }
        ];
        
        const centerTabs = [
            { id: 'log', name: '日志', icon: '📜' },
            { id: 'adventure', name: '探索', icon: '🗺️' },
            { id: 'battle', name: '战斗', icon: '⚔️' },
            { id: 'shop', name: '商店', icon: '🏪' },
            { id: 'alchemy', name: '炼丹', icon: '🧪' },
            { id: 'enhance', name: '强化', icon: '⚒️' }
        ];
        
        const locations = [
            {
                id: 'forest',
                name: '幽暗森林',
                icon: '🌲',
                description: '充满神秘气息的古老森林，适合初学者探索',
                baseExp: 10,
                baseGold: 15,
                encounters: ['slime', 'wolf'],
                treasures: ['草药', '回血丹']
            },
            {
                id: 'cave',
                name: '灵石矿洞',
                icon: '⛰️',
                description: '蕴含丰富灵石的矿洞，但也充满危险',
                baseExp: 8,
                baseGold: 20,
                encounters: ['wolf', 'demon'],
                treasures: ['灵石', '铁矿']
            },
            {
                id: 'ruins',
                name: '古代遗迹',
                icon: '🏛️',
                description: '远古修仙者留下的遗迹，机遇与风险并存',
                baseExp: 15,
                baseGold: 30,
                encounters: ['demon'],
                treasures: ['修为丹', '灵石']
            }
        ];
        
        const enemies = [
            {
                id: 'slime',
                name: '史莱姆',
                avatar: '🟢',
                hp: 30,
                maxHp: 30,
                attack: 8,
                defense: 2,
                exp: 15,
                gold: 20,
                drops: ['草药']
            },
            {
                id: 'wolf',
                name: '灵狼',
                avatar: '🐺',
                hp: 60,
                maxHp: 60,
                attack: 15,
                defense: 5,
                exp: 30,
                gold: 50,
                drops: ['草药', '回血丹']
            },
            {
                id: 'demon',
                name: '小妖',
                avatar: '👹',
                hp: 100,
                maxHp: 100,
                attack: 25,
                defense: 8,
                exp: 60,
                gold: 100,
                drops: ['回血丹', '回灵丹', '灵石碎片']
            }
        ];
        
        const shopCategories = [
            { id: 'pills', name: '丹药', icon: '💊' },
            { id: 'equipment', name: '装备', icon: '⚔️' },
            { id: 'materials', name: '材料', icon: '🔨' }
        ];
        
        const shopItems = {
            pills: [
                { id: 'heal_pill', name: '回血丹', icon: '❤️', price: 50, description: '恢复50点生命值' },
                { id: 'mana_pill', name: '回灵丹', icon: '💙', price: 40, description: '恢复30点灵力值' },
                { id: 'exp_pill', name: '修为丹', icon: '⭐', price: 200, description: '增加100点修为' },
                { id: 'spirit_pill', name: '聚灵丹', icon: '💎', price: 500, description: '永久增加10点最大灵力' }
            ],
            equipment: [
                { id: 'iron_sword', name: '铁剑', icon: '⚔️', price: 300, type: 'weapon', attack: 15, description: '普通的铁制长剑' },
                { id: 'steel_armor', name: '钢甲', icon: '🛡️', price: 400, type: 'armor', defense: 20, hp: 50, description: '坚固的钢制护甲' },
                { id: 'spirit_ring', name: '灵戒', icon: '💍', price: 600, type: 'accessory', mp: 30, description: '蕴含灵力的戒指' }
            ],
            materials: [
                { id: 'herb', name: '草药', icon: '🌿', price: 10, description: '常见的药草' },
                { id: 'spirit_stone', name: '灵石', icon: '💎', price: 100, description: '蕴含灵力的石头' },
                { id: 'iron_ore', name: '铁矿', icon: '⛏️', price: 30, description: '用于锻造的铁矿石' },
                { id: 'enhance_stone', name: '强化石', icon: '💎', price: 100, description: '用于装备强化的材料' },
                { id: 'spirit_grass', name: '灵草', icon: '🌿', price: 80, description: '炼丹用的高级药草' },
                { id: 'fire_lotus', name: '火莲子', icon: '🔥', price: 150, description: '珍贵的炼丹材料' }
            ]
        };
        
        // 成就系统
        const achievements = ref([
            {
                id: 'first_level',
                name: '初入修仙',
                description: '达到练气期第1层',
                icon: '🌟',
                target: 1,
                current: 0,
                completed: false,
                reward: '金币 x100'
            },
            {
                id: 'realm_breakthrough',
                name: '境界突破',
                description: '突破到筑基期',
                icon: '⚡',
                target: 1,
                current: 0,
                completed: false,
                reward: '修炼速度 +20%'
            },
            {
                id: 'monster_slayer',
                name: '妖兽杀手',
                description: '击败100只妖兽',
                icon: '⚔️',
                target: 100,
                current: 0,
                completed: false,
                reward: '攻击力 +10'
            },
            {
                id: 'treasure_hunter',
                name: '寻宝专家',
                description: '探索50次',
                icon: '🗺️',
                target: 50,
                current: 0,
                completed: false,
                reward: '幸运值 +5'
            },
            {
                id: 'alchemist',
                name: '炼丹师',
                description: '成功炼制20颗丹药',
                icon: '🧪',
                target: 20,
                current: 0,
                completed: false,
                reward: '炼丹成功率 +10%'
            }
        ]);
        
        // 宗门系统
        const availableSects = [
            {
                id: 'tianshan',
                name: '天山派',
                description: '以剑法闻名的正道宗门',
                icon: '⚔️',
                bonus: '攻击力 +15%'
            },
            {
                id: 'yaowang',
                name: '药王谷',
                description: '精通炼丹的医道宗门',
                icon: '🧪',
                bonus: '炼丹成功率 +20%'
            },
            {
                id: 'wudang',
                name: '武当山',
                description: '内功深厚的道家宗门',
                icon: '☯️',
                bonus: '修炼速度 +25%'
            },
            {
                id: 'emei',
                name: '峨眉派',
                description: '防御见长的佛门宗门',
                icon: '🛡️',
                bonus: '防御力 +20%'
            }
        ];
        
        const sectTasks = ref([
            {
                id: 'daily_cultivation',
                name: '日常修炼',
                description: '修炼2小时',
                reward: '贡献度 +10',
                accepted: false,
                available: true
            },
            {
                id: 'monster_hunt',
                name: '妖兽狩猎',
                description: '击败5只妖兽',
                reward: '贡献度 +20',
                accepted: false,
                available: true
            },
            {
                id: 'herb_gathering',
                name: '采集灵草',
                description: '收集10株灵草',
                reward: '贡献度 +15',
                accepted: false,
                available: true
            }
        ]);
        
        // 炼丹系统
        const alchemyRecipes = [
            {
                id: 'healing_pill',
                name: '回血丹',
                icon: '💊',
                materials: [
                    { name: '灵草', count: 2 }
                ],
                result: '回血丹 x3',
                duration: 30
            },
            {
                id: 'mana_pill',
                name: '回蓝丹',
                icon: '🔵',
                materials: [
                    { name: '灵草', count: 1 },
                    { name: '火莲子', count: 1 }
                ],
                result: '回蓝丹 x2',
                duration: 45
            },
            {
                id: 'power_pill',
                name: '力量丹',
                icon: '💪',
                materials: [
                    { name: '灵草', count: 3 },
                    { name: '火莲子', count: 2 }
                ],
                result: '力量丹 x1',
                duration: 60
            }
        ];
        
        const realms = [
            { name: '练气期', maxLevel: 9, expMultiplier: 1 },
            { name: '筑基期', maxLevel: 9, expMultiplier: 2 },
            { name: '金丹期', maxLevel: 9, expMultiplier: 4 },
            { name: '元婴期', maxLevel: 9, expMultiplier: 8 },
            { name: '化神期', maxLevel: 9, expMultiplier: 16 }
        ];
        
        // 定时器
        let cultivationTimer = null;
        let mpRegenTimer = null;
        let cultivationPointsTimer = null;
        
        // 用户认证方法
        const login = async () => {
            authError.value = '';
            
            if (!authForm.username || !authForm.password) {
                authError.value = '请填写完整的登录信息';
                return;
            }
            
            try {
                const response = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: {
                        username: authForm.username,
                        password: authForm.password
                    }
                });
                
                // 保存认证令牌
                authToken = response.token;
                localStorage.setItem('auth_token', authToken);
                
                // 设置用户信息
                currentUser.value = response.user;
                isLoggedIn.value = true;
                isAdmin.value = response.user.is_admin;
                
                // 加载游戏数据
                await loadGameData();
                
                // 加载聊天记录
                await loadChatMessages();
                
                // 加载用户列表（管理员）
                if (isAdmin.value) {
                    await loadAllUsers();
                }
                
                showNotification('登录成功！欢迎回到修仙世界！', 'success');
                addLogEntry('成功登录游戏');
                
                // 清空表单
                authForm.username = '';
                authForm.password = '';
                
            } catch (error) {
                authError.value = error.message || '登录失败，请重试';
            }
        };
        
        const register = async () => {
            authError.value = '';
            
            if (!authForm.username || !authForm.password || !authForm.confirmPassword) {
                authError.value = '请填写完整的注册信息';
                return;
            }
            
            if (authForm.password !== authForm.confirmPassword) {
                authError.value = '两次输入的密码不一致';
                return;
            }
            
            if (authForm.password.length < 6) {
                authError.value = '密码长度至少6位';
                return;
            }
            
            try {
                await apiRequest('/auth/register', {
                    method: 'POST',
                    body: {
                        username: authForm.username,
                        password: authForm.password
                    }
                });
                
                showNotification('注册成功！请登录开始游戏', 'success');
                authMode.value = 'login';
                
                // 清空表单
                authForm.username = '';
                authForm.password = '';
                authForm.confirmPassword = '';
                
            } catch (error) {
                authError.value = error.message || '注册失败，请重试';
            }
        };
        
        const logout = async () => {
            try {
                // 保存游戏数据
                await saveGame();
                
                // 调用API登出
                if (authToken) {
                    await apiRequest('/auth/logout', {
                        method: 'POST'
                    });
                }
            } catch (error) {
                console.error('登出API调用失败:', error);
            }
            
            // 清理本地状态
            authToken = '';
            localStorage.removeItem('auth_token');
            
            // 清理定时器
            if (cultivationTimer) clearInterval(cultivationTimer);
            if (mpRegenTimer) clearInterval(mpRegenTimer);
            if (cultivationPointsTimer) clearInterval(cultivationPointsTimer);
            
            // 重置状态
            isLoggedIn.value = false;
            currentUser.value = null;
            isCultivating.value = false;
            inBattle.value = false;
            isAdmin.value = false;
            
            showNotification('已安全退出游戏', 'info');
        };
        
        // 数据保存和加载
        const saveGame = async () => {
            if (!currentUser.value) return;
            
            saving.value = true;
            
            try {
                const gameData = {
                    player: { ...player },
                    gameLog: [...gameLog.value],
                    lastSaved: new Date().toISOString()
                };
                
                await apiRequest('/game/save', {
                    method: 'POST',
                    body: gameData
                });
                
                showNotification('游戏数据保存成功！', 'success');
                addLogEntry('游戏数据已保存');
                
            } catch (error) {
                console.error('保存游戏数据失败:', error);
                showNotification('保存失败，请重试', 'error');
            } finally {
                saving.value = false;
            }
        };
        
        const loadGameData = async () => {
            if (!currentUser.value) return;
            
            try {
                const response = await apiRequest('/game/data', {
                    method: 'GET'
                });
                
                if (response.data) {
                    const gameData = response.data;
                    
                    // 恢复玩家数据
                    Object.assign(player, gameData.player);
                    
                    // 恢复游戏日志
                    gameLog.value = gameData.gameLog || [];
                    
                    addLogEntry('游戏数据加载成功');
                } else {
                    // 新玩家，初始化数据
                    addLogEntry('欢迎新的修仙者！你的仙途之路从这里开始！');
                }
                
            } catch (error) {
                console.error('加载游戏数据失败:', error);
                showNotification('数据加载失败，使用默认数据', 'warning');
                addLogEntry('数据加载失败，使用默认数据开始游戏');
            }
        };
        
        // 修炼系统
        const startCultivation = (type) => {
            if (isCultivating.value) {
                showNotification('你已经在修炼中了！', 'warning');
                return;
            }
            
            if (type === 'formation' && player.spiritStones < 1) {
                showNotification('灵石不足，无法进行阵法修炼！', 'error');
                return;
            }
            
            isCultivating.value = true;
            cultivationType.value = type;
            cultivationTime.value = 0;
            
            let expPerSecond = type === 'meditation' ? 1 : 5;
            let costPerMinute = type === 'formation' ? 1 : 0;
            let lastCostTime = Date.now();
            
            cultivationTimer = setInterval(() => {
                cultivationTime.value++;
                player.exp += expPerSecond;
                player.stats.cultivationTime++;

                // 更新任务进度
                updateQuestProgress('cultivation', 1);

                // 消耗灵石（阵法修炼）
                if (type === 'formation' && Date.now() - lastCostTime >= 60000) {
                    if (player.spiritStones >= costPerMinute) {
                        player.spiritStones -= costPerMinute;
                        lastCostTime = Date.now();
                    } else {
                        stopCultivation();
                        showNotification('灵石耗尽，修炼停止！', 'warning');
                        return;
                    }
                }

                checkLevelUp();
            }, 1000);
            
            addLogEntry(`开始${type === 'meditation' ? '打坐冥想' : '阵法修炼'}...`);
            showNotification('修炼开始！', 'info');
        };
        
        const stopCultivation = () => {
            if (!isCultivating.value) return;
            
            isCultivating.value = false;
            cultivationType.value = '';
            
            if (cultivationTimer) {
                clearInterval(cultivationTimer);
                cultivationTimer = null;
            }
            
            addLogEntry(`修炼结束，共修炼了${formatTime(cultivationTime.value)}`);
            showNotification('修炼结束！', 'info');
        };
        
        // 等级和境界系统
        const checkLevelUp = () => {
            while (player.exp >= player.maxExp) {
                levelUp();
            }
        };
        
        const levelUp = () => {
            player.exp -= player.maxExp;
            player.level++;
            
            // 属性提升
            const hpIncrease = 20;
            const mpIncrease = 10;
            const attackIncrease = 5;
            const defenseIncrease = 3;
            
            player.maxHp += hpIncrease;
            player.hp = player.maxHp;
            player.maxMp += mpIncrease;
            player.mp = player.maxMp;
            player.attack += attackIncrease;
            player.defense += defenseIncrease;
            
            // 更新成就
            updateAchievement('first_level', player.level);

            // 更新任务进度
            updateQuestProgress('level_up', 1);

            // 检查境界突破
            checkRealmBreakthrough();
            
            // 计算下一级所需经验
            player.maxExp = Math.floor(100 * Math.pow(1.2, player.level - 1));
            
            addLogEntry(`恭喜！等级提升到${player.level}级！`);
            showNotification(`等级提升！现在是${player.level}级`, 'success');
        };
        
        const checkRealmBreakthrough = () => {
            const currentRealmIndex = realms.findIndex(realm => realm.name === player.realm);
            const currentRealm = realms[currentRealmIndex];
            
            if (player.level > currentRealm.maxLevel && currentRealmIndex < realms.length - 1) {
                const newRealm = realms[currentRealmIndex + 1];
                player.realm = newRealm.name;
                player.level = 1;
                
                // 解锁新技能
                if (newRealm.name === '筑基期') {
                    player.skills.lightning.locked = false;
                    addLogEntry('突破到筑基期！解锁雷电术！');
                }
                
                addLogEntry(`恭喜突破到${newRealm.name}！`);
                showNotification(`境界突破！进入${newRealm.name}！`, 'success');
            }
        };
        
        // 技能系统
        const upgradeSkill = (skillName) => {
            const skill = player.skills[skillName];
            if (!skill || skill.locked) {
                showNotification('技能未解锁！', 'error');
                return;
            }
            
            const upgradeCost = getUpgradeCost(skill.level);
            if (player.cultivationPoints < upgradeCost) {
                showNotification('修为点不足！', 'error');
                return;
            }
            
            player.cultivationPoints -= upgradeCost;
            skill.level++;
            
            addLogEntry(`${getSkillName(skillName)}升级到${skill.level}级！`);
            showNotification('技能升级成功！', 'success');
        };
        
        const getUpgradeCost = (level) => {
            return 100 * level;
        };
        
        const getSkillName = (skillName) => {
            const names = {
                fireball: '火球术',
                heal: '治疗术',
                shield: '护体术',
                lightning: '雷电术'
            };
            return names[skillName] || skillName;
        };
        
        const getSkillIcon = (skillName) => {
            const icons = {
                fireball: '🔥',
                heal: '💚',
                shield: '🛡️',
                lightning: '⚡'
            };
            return icons[skillName] || '✨';
        };
        
        // 探索系统
        const exploreLocation = (locationId) => {
            if (exploring.value) return;
            
            exploring.value = true;
            const location = locations.find(loc => loc.id === locationId);
            
            // 更新成就
            updateAchievement('treasure_hunter');

            // 更新任务进度
            updateQuestProgress('exploration', 1);

            addLogEntry(`进入${location.name}探索...`);
            
            setTimeout(() => {
                const eventChance = Math.random();
                
                if (eventChance < 0.4) {
                    // 遭遇战斗
                    const enemyId = location.encounters[Math.floor(Math.random() * location.encounters.length)];
                    const enemy = enemies.find(e => e.id === enemyId);
                    addLogEntry(`遭遇了${enemy.name}！`);
                    startBattle(enemyId);
                } else if (eventChance < 0.7) {
                    // 发现宝藏
                    const treasure = location.treasures[Math.floor(Math.random() * location.treasures.length)];
                    const amount = Math.floor(Math.random() * 3) + 1;
                    
                    if (!player.inventory[treasure]) {
                        player.inventory[treasure] = 0;
                    }
                    player.inventory[treasure] += amount;
                    
                    addLogEntry(`发现了${amount}个${treasure}！`);
                    showNotification(`获得${treasure} x${amount}`, 'success');
                } else {
                    // 平安探索
                    const exp = Math.floor(Math.random() * location.baseExp) + 5;
                    const gold = Math.floor(Math.random() * location.baseGold) + 10;
                    
                    player.exp += exp;
                    player.gold += gold;
                    
                    addLogEntry(`平安完成探索，获得${exp}点修为和${gold}金币。`);
                    showNotification(`探索成功！获得修为和金币`, 'success');
                }
                
                checkLevelUp();
                exploring.value = false;
            }, 2000);
        };
        
        // 战斗系统
        const startBattle = (enemyId) => {
            if (inBattle.value) return;
            
            const enemyTemplate = enemies.find(e => e.id === enemyId);
            currentEnemy.value = { ...enemyTemplate };
            
            inBattle.value = true;
            battleMessages.value = [];
            
            activeCenterTab.value = 'battle';
            
            addBattleMessage(`战斗开始！你遭遇了${currentEnemy.value.name}！`);
        };
        
        const battleAction = (action) => {
            if (!inBattle.value || !currentEnemy.value) return;
            
            let playerDamage = 0;
            let playerHealing = 0;
            let mpCost = 0;
            let defending = false;
            
            switch (action) {
                case 'attack':
                    playerDamage = Math.floor(Math.random() * 10) + player.attack;
                    addBattleMessage(`你对${currentEnemy.value.name}造成了${playerDamage}点伤害！`);
                    break;
                    
                case 'skill':
                    if (player.mp < 10) {
                        addBattleMessage('灵力不足，无法使用技能！');
                        return;
                    }
                    mpCost = 10;
                    const skillLevel = player.skills.fireball.level;
                    playerDamage = Math.floor(Math.random() * 15) + player.attack + (skillLevel * 5);
                    addBattleMessage(`你使用火球术对${currentEnemy.value.name}造成了${playerDamage}点伤害！`);
                    break;
                    
                case 'heal':
                    if (player.mp < 8) {
                        addBattleMessage('灵力不足，无法使用治疗术！');
                        return;
                    }
                    mpCost = 8;
                    const healLevel = player.skills.heal.level;
                    playerHealing = Math.floor(Math.random() * 20) + 20 + (healLevel * 5);
                    player.hp = Math.min(player.maxHp, player.hp + playerHealing);
                    addBattleMessage(`你使用治疗术恢复了${playerHealing}点生命值！`);
                    break;
                    
                case 'defend':
                    defending = true;
                    addBattleMessage('你进入防御姿态，减少50%伤害！');
                    break;
            }
            
            // 消耗灵力
            player.mp = Math.max(0, player.mp - mpCost);
            
            // 对敌人造成伤害
            if (playerDamage > 0) {
                const actualDamage = Math.max(1, playerDamage - currentEnemy.value.defense);
                currentEnemy.value.hp = Math.max(0, currentEnemy.value.hp - actualDamage);
            }
            
            // 检查敌人是否死亡
            if (currentEnemy.value.hp <= 0) {
                winBattle();
                return;
            }
            
            // 敌人回合
            setTimeout(() => {
                enemyTurn(defending);
            }, 1000);
        };
        
        const enemyTurn = (playerDefending) => {
            const enemy = currentEnemy.value;
            const enemyDamage = Math.floor(Math.random() * 10) + enemy.attack;
            let actualDamage = Math.max(1, enemyDamage - player.defense);
            
            if (playerDefending) {
                actualDamage = Math.floor(actualDamage * 0.5);
            }
            
            player.hp = Math.max(0, player.hp - actualDamage);
            addBattleMessage(`${enemy.name}对你造成了${actualDamage}点伤害！`);
            
            // 检查玩家是否死亡
            if (player.hp <= 0) {
                loseBattle();
                return;
            }
        };
        
        const winBattle = () => {
            const enemy = currentEnemy.value;
            
            player.exp += enemy.exp;
            player.gold += enemy.gold;
            player.stats.battleWins++;
            player.stats.monstersKilled++;
            
            // 更新成就
            updateAchievement('monster_slayer');

            // 更新任务进度
            updateQuestProgress('monster_kill', 1);

            // 掉落物品
            if (enemy.drops && enemy.drops.length > 0) {
                const drop = enemy.drops[Math.floor(Math.random() * enemy.drops.length)];
                if (!player.inventory[drop]) {
                    player.inventory[drop] = 0;
                }
                player.inventory[drop]++;
                addBattleMessage(`获得了${drop}！`);
            }
            
            addBattleMessage(`战斗胜利！获得${enemy.exp}点修为和${enemy.gold}金币！`);
            showNotification('战斗胜利！', 'success');
            
            endBattle();
            checkLevelUp();
        };
        
        const loseBattle = () => {
            addBattleMessage('你被击败了！');
            showNotification('战斗失败！', 'error');
            
            // 复活并恢复部分生命值
            player.hp = Math.floor(player.maxHp * 0.3);
            player.mp = Math.floor(player.maxMp * 0.3);
            
            endBattle();
        };
        
        const endBattle = () => {
            inBattle.value = false;
            currentEnemy.value = null;
            battleMessages.value = [];
        };
        
        const addBattleMessage = (message) => {
            battleMessages.value.push(message);
            if (battleMessages.value.length > 10) {
                battleMessages.value.shift();
            }
        };
        
        // 商店系统
        const getShopItems = () => {
            return shopItems[activeShopCategory.value] || [];
        };
        
        const buyItem = (item) => {
            if (player.gold < item.price) {
                showNotification('金币不足！', 'error');
                return;
            }
            
            player.gold -= item.price;
            
            if (!player.inventory[item.name]) {
                player.inventory[item.name] = 0;
            }
            player.inventory[item.name]++;
            
            addLogEntry(`购买了${item.name}`);
            showNotification(`购买成功：${item.name}`, 'success');
        };
        
        // 背包系统
        const getInventoryItems = () => {
            return Object.entries(player.inventory)
                .filter(([name, count]) => count > 0)
                .map(([name, count]) => ({ name, count }));
        };
        
        const getInventoryCount = () => {
            return getInventoryItems().length;
        };
        
        const useItem = (itemName) => {
            if (!player.inventory[itemName] || player.inventory[itemName] <= 0) {
                showNotification('没有该物品！', 'error');
                return;
            }
            
            switch (itemName) {
                case '回血丹':
                    if (player.hp >= player.maxHp) {
                        showNotification('生命值已满！', 'warning');
                        return;
                    }
                    player.hp = Math.min(player.maxHp, player.hp + 50);
                    player.inventory[itemName]--;
                    addLogEntry('使用回血丹，恢复50点生命值');
                    showNotification('使用回血丹成功！', 'success');
                    break;
                    
                case '回灵丹':
                    if (player.mp >= player.maxMp) {
                        showNotification('灵力值已满！', 'warning');
                        return;
                    }
                    player.mp = Math.min(player.maxMp, player.mp + 30);
                    player.inventory[itemName]--;
                    addLogEntry('使用回灵丹，恢复30点灵力值');
                    showNotification('使用回灵丹成功！', 'success');
                    break;
                    
                case '修为丹':
                    player.exp += 100;
                    player.inventory[itemName]--;
                    addLogEntry('使用修为丹，增加100点修为');
                    showNotification('使用修为丹成功！', 'success');
                    checkLevelUp();
                    break;
                    
                default:
                    showNotification('该物品无法使用', 'warning');
            }
        };
        
        const getItemIcon = (itemName) => {
            const icons = {
                '回血丹': '❤️',
                '回灵丹': '💙',
                '修为丹': '⭐',
                '草药': '🌿',
                '灵石': '💎',
                '铁矿': '⛏️',
                '灵石碎片': '💠'
            };
            return icons[itemName] || '📦';
        };
        
        // 工具方法
        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        };
        
        const addLogEntry = (message) => {
            const entry = {
                time: new Date().toLocaleTimeString(),
                message: message
            };
            gameLog.value.push(entry);
            
            // 限制日志条目数量
            if (gameLog.value.length > 100) {
                gameLog.value.shift();
            }
        };
        
        const clearLog = () => {
            gameLog.value = [];
            showNotification('游戏日志已清空', 'info');
        };
        
        const showNotification = (message, type = 'info') => {
            const notification = {
                id: Date.now(),
                message,
                type
            };
            
            notifications.value.push(notification);
            
            // 自动移除通知
            setTimeout(() => {
                const index = notifications.value.findIndex(n => n.id === notification.id);
                if (index > -1) {
                    notifications.value.splice(index, 1);
                }
            }, 3000);
        };
        
        // 宗门系统函数
        const joinSect = (sectId) => {
            const sect = availableSects.find(s => s.id === sectId);
            if (sect) {
                player.sect = sectId;
                player.sectContribution = 0;
                player.sectLevel = 1;
                addLogEntry(`加入了${sect.name}`);
                showNotification(`成功加入${sect.name}！`, 'success');
                saveGame();
            }
        };
        
        const getSectInfo = () => {
            if (!player.sect) return null;
            return availableSects.find(s => s.id === player.sect);
        };
        
        const acceptTask = (taskId) => {
            const task = sectTasks.value.find(t => t.id === taskId);
            if (task && !task.accepted) {
                task.accepted = true;
                addLogEntry(`接受了任务：${task.name}`);
                showNotification(`接受任务：${task.name}`, 'info');
            }
        };
        
        // 成就系统函数
        const updateAchievement = (achievementId, progress = 1) => {
            const achievement = achievements.value.find(a => a.id === achievementId);
            if (achievement && !achievement.completed) {
                achievement.current = Math.min(achievement.current + progress, achievement.target);
                if (achievement.current >= achievement.target && !achievement.completed) {
                    achievement.completed = true;
                    addLogEntry(`获得成就：${achievement.name}`);
                    showNotification(`获得成就：${achievement.name}！`, 'success');
                }
            }
        };
        
        // 炼丹系统函数
        const canCraftRecipe = (recipe) => {
            return recipe.materials.every(material => {
                const count = player.inventory[material.name] || 0;
                return count >= material.count;
            });
        };
        
        const startAlchemy = (recipe) => {
            if (alchemyInProgress.value || !canCraftRecipe(recipe)) {
                showNotification('无法开始炼丹！', 'error');
                return;
            }
            
            // 消耗材料
            recipe.materials.forEach(material => {
                if (player.inventory[material.name]) {
                    player.inventory[material.name] -= material.count;
                    if (player.inventory[material.name] <= 0) {
                        delete player.inventory[material.name];
                    }
                }
            });
            
            alchemyInProgress.value = true;
            alchemyDuration.value = recipe.duration;
            alchemyTimeLeft.value = recipe.duration;
            
            addLogEntry(`开始炼制${recipe.name}`);
            showNotification(`开始炼制${recipe.name}`, 'info');
            
            const timer = setInterval(() => {
                alchemyTimeLeft.value--;
                if (alchemyTimeLeft.value <= 0) {
                    clearInterval(timer);
                    completeAlchemy(recipe);
                }
            }, 1000);
        };
        
        const completeAlchemy = (recipe) => {
            alchemyInProgress.value = false;
            
            // 成功率计算（基础80%）
            const successRate = 0.8;
            const success = Math.random() < successRate;
            
            if (success) {
                // 添加产出物品
                const resultMatch = recipe.result.match(/(.*) x(\d+)/);
                if (resultMatch) {
                    const itemName = resultMatch[1];
                    const count = parseInt(resultMatch[2]);
                    if (!player.inventory[itemName]) {
                        player.inventory[itemName] = 0;
                    }
                    player.inventory[itemName] += count;
                }
                addLogEntry(`炼制${recipe.name}成功！`);
                showNotification(`炼制${recipe.name}成功！`, 'success');
                updateAchievement('alchemist');
                updateQuestProgress('pill_craft', 1);
            } else {
                addLogEntry(`炼制${recipe.name}失败了...`);
                showNotification(`炼制${recipe.name}失败了...`, 'error');
            }
        };
        
        // 装备强化系统函数
        const getEnhanceableEquipment = () => {
            return Object.values(player.equipment).filter(eq => eq !== null);
        };
        
        const selectEquipment = (equipment) => {
            selectedEquipment.value = equipment;
        };
        
        const getEnhanceSuccessRate = (equipment) => {
            const level = equipment.level || 0;
            return Math.max(30, 90 - level * 5); // 基础90%，每级降低5%
        };
        
        const getEnhanceCost = (equipment) => {
            const level = equipment.level || 0;
            return Math.max(1, level + 1);
        };
        
        const getEnhanceGoldCost = (equipment) => {
             const level = equipment.level || 0;
             return (level + 1) * 100;
         };
         
         const getEnhancedStats = (equipment) => {
             const enhanced = {};
             const level = equipment.level || 0;
             if (equipment.attack) enhanced.attack = equipment.attack + (level + 1) * 5;
             if (equipment.defense) enhanced.defense = equipment.defense + (level + 1) * 3;
             if (equipment.hp) enhanced.hp = equipment.hp + (level + 1) * 10;
             if (equipment.mp) enhanced.mp = equipment.mp + (level + 1) * 5;
             return enhanced;
         };
         
         const canEnhanceEquipment = (equipment) => {
             const cost = getEnhanceCost(equipment);
             const goldCost = getEnhanceGoldCost(equipment);
             const hasStone = (player.inventory['强化石'] || 0) >= cost;
             return hasStone && player.gold >= goldCost;
         };
        
        const enhanceEquipment = (equipment) => {
            if (!canEnhanceEquipment(equipment)) {
                showNotification('强化条件不足！', 'error');
                return;
            }
            
            const cost = getEnhanceCost(equipment);
            const goldCost = getEnhanceGoldCost(equipment);
            const successRate = getEnhanceSuccessRate(equipment) / 100;
            
            // 消耗材料
            player.inventory['强化石'] -= cost;
            if (player.inventory['强化石'] <= 0) {
                delete player.inventory['强化石'];
            }
            
            player.gold -= goldCost;
            
            // 强化判定
            if (Math.random() < successRate) {
                equipment.level = (equipment.level || 0) + 1;
                if (equipment.attack) equipment.attack += 5;
                if (equipment.defense) equipment.defense += 3;
                if (equipment.hp) equipment.hp += 10;
                if (equipment.mp) equipment.mp += 5;
                addLogEntry(`${equipment.name} 强化成功！等级 +${equipment.level}`);
                showNotification(`${equipment.name} 强化成功！`, 'success');
            } else {
                addLogEntry(`${equipment.name} 强化失败...`);
                showNotification(`${equipment.name} 强化失败...`, 'error');
            }
            
            saveGame();
        };
        
        // 聊天功能
        const sendMessage = async () => {
            if (!chatInput.value.trim()) return;
            
            try {
                await apiRequest('/chat/send', {
                    method: 'POST',
                    body: {
                        content: chatInput.value.trim()
                    }
                });
                
                chatInput.value = '';
                
                // 重新加载聊天消息
                await loadChatMessages();
                
                // 自动滚动到底部
                setTimeout(() => {
                    const chatContainer = document.querySelector('.chat-messages');
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                }, 100);
                
            } catch (error) {
                console.error('发送消息失败:', error);
                showNotification(error.message || '发送消息失败', 'error');
            }
        };
        
        const formatChatTime = (timestamp) => {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        };
        
        // saveChatMessages函数已移除，现在使用API保存聊天消息
        
        const loadChatMessages = async () => {
            try {
                const response = await apiRequest('/chat/messages', {
                    method: 'GET'
                });
                
                chatMessages.value = response.messages || [];
                totalMessages.value = response.total || 0;
                
            } catch (error) {
                console.error('加载聊天消息失败:', error);
                chatMessages.value = [];
                totalMessages.value = 0;
            }
        };
        
        // 排行榜功能
        const getLeaderboardData = async () => {
            try {
                const response = await apiRequest(`/game/leaderboard?type=${activeLeaderboardTab.value}`, {
                    method: 'GET'
                });
                
                return response.leaderboard || [];
                
            } catch (error) {
                console.error('获取排行榜数据失败:', error);
                return [];
            }
        };
        
        const getLeaderboardValue = (player) => {
            switch (activeLeaderboardTab.value) {
                case 'level':
                    return `${player.level || 1}级`;
                case 'gold':
                    return `${player.gold || 0}金币`;
                case 'battle':
                    return `${player.attack || 0}攻击力`;
                default:
                    return '';
            }
        };
        
        const getRankIcon = (rank) => {
            switch (rank) {
                case 1: return '🥇';
                case 2: return '🥈';
                case 3: return '🥉';
                default: return '🏅';
            }
        };
        
        // getAllUsersData函数已移除，现在使用API获取用户数据
        
        // 管理员功能
        const banUser = async (username) => {
            if (!isAdmin.value) return;
            
            try {
                await apiRequest('/admin/ban', {
                    method: 'POST',
                    body: { username }
                });
                
                await loadAllUsers();
                addLogEntry(`管理员封禁了用户: ${username}`);
                showNotification(`用户 ${username} 已被封禁`, 'success');
                
            } catch (error) {
                console.error('封禁用户失败:', error);
                showNotification(error.message || '封禁用户失败', 'error');
            }
        };
        
        const unbanUser = async (username) => {
            if (!isAdmin.value) return;
            
            try {
                await apiRequest('/admin/unban', {
                    method: 'POST',
                    body: { username }
                });
                
                await loadAllUsers();
                addLogEntry(`管理员解封了用户: ${username}`);
                showNotification(`用户 ${username} 已被解封`, 'success');
                
            } catch (error) {
                console.error('解封用户失败:', error);
                showNotification(error.message || '解封用户失败', 'error');
            }
        };
        
        const sendAnnouncement = async () => {
            if (!isAdmin.value || !adminAnnouncement.value.trim()) return;
            
            try {
                await apiRequest('/admin/announcement', {
                    method: 'POST',
                    body: {
                        content: adminAnnouncement.value.trim()
                    }
                });
                
                adminAnnouncement.value = '';
                await loadChatMessages();
                showNotification('系统公告已发布', 'success');
                
            } catch (error) {
                console.error('发布公告失败:', error);
                showNotification(error.message || '发布公告失败', 'error');
            }
        };
        
        const clearChatHistory = async () => {
            if (!isAdmin.value) return;
            
            try {
                await apiRequest('/chat/clear', {
                    method: 'POST'
                });
                
                chatMessages.value = [];
                totalMessages.value = 0;
                showNotification('聊天记录已清空', 'success');
                
            } catch (error) {
                console.error('清空聊天记录失败:', error);
                showNotification(error.message || '清空聊天记录失败', 'error');
            }
        };
        
        const loadAllUsers = async () => {
            try {
                const response = await apiRequest('/admin/users', {
                    method: 'GET'
                });
                
                allUsers.value = response.users || [];
                totalUsers.value = response.total || 0;
                
            } catch (error) {
                console.error('加载用户列表失败:', error);
                allUsers.value = [];
                totalUsers.value = 0;
            }
        };
        
        // checkAdminStatus函数已移除，现在从API登录响应中获取管理员状态
        
        // 自动修炼系统函数
        const checkAutoCultivationStatus = async () => {
            try {
                const response = await apiRequest('/cultivation/status', {
                    method: 'GET'
                });

                if (response.active) {
                    autoCultivationActive.value = true;
                    autoCultivationType.value = response.cultivation.type;
                    autoCultivationStartTime.value = response.cultivation.start_time;

                    // 检查离线进度
                    await checkOfflineProgress();
                } else {
                    autoCultivationActive.value = false;
                }

            } catch (error) {
                console.error('检查自动修炼状态失败:', error);
            }
        };

        const startAutoCultivation = async (type) => {
            try {
                const response = await apiRequest('/cultivation/start', {
                    method: 'POST',
                    body: { type }
                });

                autoCultivationActive.value = true;
                autoCultivationType.value = type;
                autoCultivationStartTime.value = new Date().toISOString();

                showNotification(`${getCultivationTypeName(type)}自动修炼已开始`, 'success');
                addLogEntry(`开始${getCultivationTypeName(type)}自动修炼`);

            } catch (error) {
                showNotification(error.message || '开始自动修炼失败', 'error');
            }
        };

        const stopAutoCultivation = async () => {
            try {
                await apiRequest('/cultivation/stop', {
                    method: 'POST'
                });

                autoCultivationActive.value = false;
                autoCultivationType.value = '';
                autoCultivationStartTime.value = null;

                showNotification('自动修炼已停止', 'info');
                addLogEntry('停止自动修炼');

            } catch (error) {
                showNotification(error.message || '停止自动修炼失败', 'error');
            }
        };

        const checkOfflineProgress = async () => {
            try {
                const response = await apiRequest('/cultivation/calculate', {
                    method: 'GET'
                });

                if (response.offline_progress && response.offline_progress.exp_gained > 0) {
                    offlineProgress.value = response.offline_progress;
                    showOfflineModal.value = true;
                }

            } catch (error) {
                console.error('检查离线进度失败:', error);
            }
        };

        const claimOfflineRewards = async () => {
            try {
                const response = await apiRequest('/cultivation/claim', {
                    method: 'POST'
                });

                const rewards = response.rewards;
                player.exp += rewards.exp_gained;

                if (rewards.cost_type === 'spirit_stones') {
                    player.spiritStones -= rewards.cost_paid;
                } else {
                    player.gold -= rewards.cost_paid;
                }

                showNotification(`离线修炼获得${rewards.exp_gained}经验`, 'success');
                addLogEntry(`离线修炼${rewards.hours_cultivated.toFixed(1)}小时，获得${rewards.exp_gained}经验`);

                checkLevelUp();
                showOfflineModal.value = false;
                offlineProgress.value = null;

            } catch (error) {
                showNotification(error.message || '领取离线奖励失败', 'error');
            }
        };

        const getCultivationTypeName = (type) => {
            const names = {
                'meditation': '打坐冥想',
                'formation': '阵法修炼',
                'pill_assisted': '丹药辅助'
            };
            return names[type] || type;
        };

        // 任务系统函数
        const loadQuests = async () => {
            try {
                const response = await apiRequest('/quests/available', {
                    method: 'GET'
                });

                const quests = response.quests || [];
                availableQuests.value = quests.filter(q => q.status === 'available');
                activeQuests.value = quests.filter(q => q.status === 'accepted');
                completedQuests.value = quests.filter(q => q.status === 'completed');

            } catch (error) {
                console.error('加载任务失败:', error);
            }
        };

        const acceptQuest = async (questId) => {
            try {
                await apiRequest('/quests/accept', {
                    method: 'POST',
                    body: { quest_id: questId }
                });

                showNotification('任务接受成功', 'success');
                await loadQuests();

            } catch (error) {
                showNotification(error.message || '接受任务失败', 'error');
            }
        };

        const claimQuestReward = async (questId) => {
            try {
                const response = await apiRequest('/quests/claim', {
                    method: 'POST',
                    body: { quest_id: questId }
                });

                const rewards = response.rewards;
                if (rewards.exp) player.exp += rewards.exp;
                if (rewards.gold) player.gold += rewards.gold;
                if (rewards.spirit_stones) player.spiritStones += rewards.spirit_stones;

                showNotification('任务奖励已领取', 'success');
                await loadQuests();
                checkLevelUp();

            } catch (error) {
                showNotification(error.message || '领取任务奖励失败', 'error');
            }
        };

        const updateQuestProgress = async (action, value = 1) => {
            try {
                await apiRequest('/quests/update', {
                    method: 'POST',
                    body: { action, value }
                });

                // 静默更新，不显示通知
                await loadQuests();

            } catch (error) {
                console.error('更新任务进度失败:', error);
            }
        };

        const getRequirementText = (key, value) => {
            const texts = {
                'cultivation_time': `修炼${Math.floor(value / 3600)}小时`,
                'monsters_killed': `击败${value}只妖兽`,
                'explorations': `完成${value}次探索`,
                'level_ups': `提升${value}个等级`,
                'pills_crafted': `炼制${value}颗丹药`
            };
            return texts[key] || `${key}: ${value}`;
        };

        // 自动登录检查
        const checkAutoLogin = async () => {
            if (authToken) {
                try {
                    const response = await apiRequest('/auth/verify', {
                        method: 'GET'
                    });

                    if (response.user) {
                        currentUser.value = response.user;
                        isLoggedIn.value = true;
                        isAdmin.value = response.user.is_admin;

                        await loadGameData();
                        await loadChatMessages();
                        await checkAutoCultivationStatus();
                        await loadQuests();

                        if (isAdmin.value) {
                            await loadAllUsers();
                        }

                        showNotification('自动登录成功', 'success');
                    }
                } catch (error) {
                    console.error('自动登录失败:', error);
                    authToken = '';
                    localStorage.removeItem('auth_token');
                }
            }
        };
        
        // 生命周期
        onMounted(async () => {
            // 检查自动登录
            await checkAutoLogin();
            
            // 定期恢复灵力
            mpRegenTimer = setInterval(() => {
                if (player.mp < player.maxMp) {
                    player.mp = Math.min(player.maxMp, player.mp + 1);
                }
            }, 5000);
            
            // 定期增加修为点
            cultivationPointsTimer = setInterval(() => {
                player.cultivationPoints += 1;
            }, 10000);
        });
        
        // 监听器
        watch(() => player.exp, () => {
            checkLevelUp();
        });
        
        // 自动保存
        watch([() => player.level, () => player.realm], () => {
            if (isLoggedIn.value) {
                setTimeout(() => saveGame(), 1000);
            }
        });
        
        return {
            // 状态
            isLoggedIn,
            currentUser,
            authMode,
            authError,
            saving,
            exploring,
            isCultivating,
            cultivationType,
            cultivationTime,
            inBattle,
            currentEnemy,
            battleMessages,
            notifications,
            gameLog,
            
            // 新功能状态
            alchemyInProgress,
            alchemyTimeLeft,
            alchemyDuration,
            selectedEquipment,

            // 自动修炼状态
            autoCultivationActive,
            autoCultivationType,
            autoCultivationStartTime,
            offlineProgress,
            showOfflineModal,

            // 任务系统状态
            availableQuests,
            activeQuests,
            completedQuests,
            questProgress,
            
            // 聊天和管理功能
            chatMessages,
            chatInput,
            isAdmin,
            allUsers,
            adminAnnouncement,
            onlineUsers,
            totalUsers,
            totalMessages,
            
            // 排行榜功能
            activeLeaderboardTab,
            leaderboardTabs,
            
            // 界面状态
            activeLeftTab,
            activeCenterTab,
            activeShopCategory,
            activeQuestTab,
            
            // 表单数据
            authForm,
            
            // 游戏数据
            player,
            leftTabs,
            centerTabs,
            locations,
            enemies,
            shopCategories,
            achievements,
            availableSects,
            sectTasks,
            alchemyRecipes,
            
            // 方法
            login,
            register,
            logout,
            saveGame,
            startCultivation,
            stopCultivation,
            upgradeSkill,
            exploreLocation,
            startBattle,
            battleAction,
            buyItem,
            useItem,
            clearLog,
            
            // 新功能方法
            joinSect,
            getSectInfo,
            acceptTask,
            updateAchievement,
            canCraftRecipe,
            startAlchemy,
            getEnhanceableEquipment,
            selectEquipment,
            getEnhanceSuccessRate,
            getEnhanceCost,
            getEnhanceGoldCost,
            getEnhancedStats,
            canEnhanceEquipment,
            enhanceEquipment,

            // 自动修炼方法
            checkAutoCultivationStatus,
            startAutoCultivation,
            stopAutoCultivation,
            checkOfflineProgress,
            claimOfflineRewards,
            getCultivationTypeName,

            // 任务系统方法
            loadQuests,
            acceptQuest,
            claimQuestReward,
            updateQuestProgress,
            getRequirementText,
            
            // 工具方法
            formatTime,
            getUpgradeCost,
            getSkillName,
            getSkillIcon,
            getShopItems,
            getInventoryItems,
            getInventoryCount,
            getItemIcon,
            
            // 聊天和管理功能方法
            sendMessage,
            formatChatTime,
            saveChatMessages,
            loadChatMessages,
            banUser,
            unbanUser,
            sendAnnouncement,
            clearChatHistory,
            loadAllUsers,
            checkAdminStatus,
            
            // 排行榜功能方法
            getLeaderboardData,
            getLeaderboardValue,
            getRankIcon,
            getAllUsersData
        };
    }
}).mount('#app');