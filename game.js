// Vue 3 修仙游戏应用
const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

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
            }
        });
        
        // 游戏数据
        const leftTabs = [
            { id: 'cultivation', name: '修炼', icon: '🧘' },
            { id: 'skills', name: '技能', icon: '⚡' },
            { id: 'inventory', name: '背包', icon: '🎒' }
        ];
        
        const centerTabs = [
            { id: 'adventure', name: '探索', icon: '🗺️' },
            { id: 'battle', name: '战斗', icon: '⚔️' },
            { id: 'shop', name: '商店', icon: '🏪' }
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
                { id: 'iron_ore', name: '铁矿', icon: '⛏️', price: 30, description: '用于锻造的铁矿石' }
            ]
        };
        
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
                // 模拟登录验证
                const users = JSON.parse(localStorage.getItem('cultivationUsers') || '{}');
                const user = users[authForm.username];
                
                if (!user || user.password !== authForm.password) {
                    authError.value = '用户名或密码错误';
                    return;
                }
                
                currentUser.value = { username: authForm.username };
                isLoggedIn.value = true;
                
                // 加载用户游戏数据
                loadGameData();
                
                showNotification('登录成功！欢迎回到修仙世界！', 'success');
                addLogEntry('成功登录游戏');
                
                // 清空表单
                authForm.username = '';
                authForm.password = '';
                
            } catch (error) {
                authError.value = '登录失败，请重试';
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
                const users = JSON.parse(localStorage.getItem('cultivationUsers') || '{}');
                
                if (users[authForm.username]) {
                    authError.value = '用户名已存在';
                    return;
                }
                
                // 保存新用户
                users[authForm.username] = {
                    password: authForm.password,
                    createdAt: new Date().toISOString()
                };
                
                localStorage.setItem('cultivationUsers', JSON.stringify(users));
                
                showNotification('注册成功！请登录开始游戏', 'success');
                authMode.value = 'login';
                
                // 清空表单
                authForm.username = '';
                authForm.password = '';
                authForm.confirmPassword = '';
                
            } catch (error) {
                authError.value = '注册失败，请重试';
            }
        };
        
        const logout = () => {
            // 保存游戏数据
            saveGame();
            
            // 清理定时器
            if (cultivationTimer) clearInterval(cultivationTimer);
            if (mpRegenTimer) clearInterval(mpRegenTimer);
            if (cultivationPointsTimer) clearInterval(cultivationPointsTimer);
            
            // 重置状态
            isLoggedIn.value = false;
            currentUser.value = null;
            isCultivating.value = false;
            inBattle.value = false;
            
            showNotification('已安全退出游戏', 'info');
        };
        
        // 数据保存和加载
        const saveGame = () => {
            if (!currentUser.value) return;
            
            saving.value = true;
            
            try {
                const gameData = {
                    player: { ...player },
                    gameLog: [...gameLog.value],
                    lastSaved: new Date().toISOString()
                };
                
                const saveKey = `cultivationGame_${currentUser.value.username}`;
                localStorage.setItem(saveKey, JSON.stringify(gameData));
                
                showNotification('游戏数据保存成功！', 'success');
                addLogEntry('游戏数据已保存');
                
            } catch (error) {
                showNotification('保存失败，请重试', 'error');
            } finally {
                saving.value = false;
            }
        };
        
        const loadGameData = () => {
            if (!currentUser.value) return;
            
            try {
                const saveKey = `cultivationGame_${currentUser.value.username}`;
                const savedData = localStorage.getItem(saveKey);
                
                if (savedData) {
                    const gameData = JSON.parse(savedData);
                    
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
        
        // 生命周期
        onMounted(() => {
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
            
            // 界面状态
            activeLeftTab,
            activeCenterTab,
            activeShopCategory,
            
            // 表单数据
            authForm,
            
            // 游戏数据
            player,
            leftTabs,
            centerTabs,
            locations,
            enemies,
            shopCategories,
            
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
            
            // 工具方法
            formatTime,
            getUpgradeCost,
            getSkillName,
            getSkillIcon,
            getShopItems,
            getInventoryItems,
            getInventoryCount,
            getItemIcon
        };
    }
}).mount('#app');