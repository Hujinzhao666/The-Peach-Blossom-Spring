// 桃花源记游戏引擎
class PeachBlossomGame {
    constructor() {
        this.currentScene = null;
        this.currentDialogue = null;
        this.gameState = {
            witheredCount: 0,
            suspicionLevel: 0,
            hiddenBranchUnlocked: false,
            currentBranch: 'normal',
            inventory: [],
            visitedScenes: [],
            choices: []
        };
        this.textSpeed = 50;
        this.isAutoMode = false;
        this.isSkipping = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.showTitleScreen();
    }

    setupEventListeners() {
        // 标题界面按钮
        document.getElementById('start-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('load-game').addEventListener('click', () => this.loadGame());
        document.getElementById('settings').addEventListener('click', () => this.showSettings());
        document.getElementById('back-to-title').addEventListener('click', () => this.showTitleScreen());

        // 游戏控制按钮
        document.getElementById('continue-btn').addEventListener('click', () => this.nextDialogue());
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('load-game-btn').addEventListener('click', () => this.loadGame());
        document.getElementById('skip-text').addEventListener('click', () => this.toggleSkip());
        document.getElementById('auto-mode').addEventListener('click', () => this.toggleAutoMode());

        // 设置控制
        document.getElementById('text-speed').addEventListener('input', (e) => {
            this.textSpeed = 100 - (e.target.value * 20);
            this.saveSettings();
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (this.currentDialogue) {
                this.nextDialogue();
            }
        } else if (e.key === 'Control') {
            this.toggleSkip();
        } else if (e.key === 's') {
            this.saveGame();
        } else if (e.key === 'l') {
            this.loadGame();
        }
    }

    showTitleScreen() {
        this.switchScreen('title-screen');
        this.updateBackground('resources/scene1_opening.png', 'pink-style');
    }

    showSettings() {
        this.switchScreen('settings-screen');
    }

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    startNewGame() {
        this.gameState = {
            witheredCount: 0,
            suspicionLevel: 0,
            hiddenBranchUnlocked: false,
            currentBranch: 'normal',
            inventory: [],
            visitedScenes: [],
            choices: []
        };
        this.switchScreen('main-game');
        this.startScene('scene1');
    }

    updateBackground(imagePath, styleClass = '') {
        const background = document.getElementById('game-background');
        
        // 添加淡出效果
        background.style.transition = 'opacity 0.5s ease-in-out';
        background.style.opacity = '0';
        
        setTimeout(() => {
            if (imagePath) {
                background.style.backgroundImage = `url('${imagePath}')`;
            }
            
            // 移除所有样式类
            background.classList.remove('pink-style', 'dark-style');
            if (styleClass) {
                background.classList.add(styleClass);
            }
            
            // 淡入效果
            background.style.opacity = '1';
        }, 500);
    }

    startScene(sceneId) {
        this.currentScene = sceneId;
        this.gameState.visitedScenes.push(sceneId);
        
        const scene = scenes[sceneId];
        if (!scene) {
            console.error('Scene not found:', sceneId);
            return;
        }

        // 显示加载界面
        this.showLoadingScreen();
        
        setTimeout(() => {
            // 更新背景
            this.updateBackground(scene.background, scene.style);
            
            // 清除之前的互动对象
            this.clearClickableObjects();
            
            // 设置互动对象
            if (scene.clickableObjects) {
                this.setupClickableObjects(scene.clickableObjects);
            }
            
            // 开始场景对话
            if (scene.dialogues && scene.dialogues.length > 0) {
                this.startDialogueSequence(scene.dialogues);
            }
            
            // 隐藏加载界面
            this.hideLoadingScreen();
        }, 1000);
    }
    
    showLoadingScreen() {
        document.getElementById('loading-screen').classList.remove('hidden');
    }
    
    hideLoadingScreen() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    setupClickableObjects(objects) {
        const container = document.getElementById('clickable-objects');
        
        objects.forEach(obj => {
            const element = document.createElement('div');
            element.className = 'clickable-object';
            element.style.left = obj.x + '%';
            element.style.top = obj.y + '%';
            element.style.width = obj.width + 'px';
            element.style.height = obj.height + 'px';
            element.textContent = obj.icon || '';
            element.title = obj.tooltip || '';
            
            element.addEventListener('click', () => this.handleObjectClick(obj, element));
            
            container.appendChild(element);
        });
    }

    clearClickableObjects() {
        document.getElementById('clickable-objects').innerHTML = '';
    }

    handleObjectClick(obj, element) {
        if (obj.action === 'withered-petal') {
            this.gameState.witheredCount++;
            this.updateTriggerDisplay();
            
            if (this.gameState.witheredCount >= 3) {
                this.gameState.hiddenBranchUnlocked = true;
                this.gameState.suspicionLevel = 1;
                this.showEffect('flicker');
                this.showMessage('乱世之中，怎会有这般无缺的美景？');
            }
            
            // 隐藏该对象
            element.style.display = 'none';
        } else if (obj.action === 'normal-petal') {
            this.showMessage('这花瓣从何处来？');
            element.style.display = 'none';
        } else if (obj.action === 'collect-petal') {
            this.gameState.inventory.push('cherry-petal');
            this.showMessage('获得了一片珍稀桃花瓣');
            element.style.display = 'none';
        }
    }

    updateTriggerDisplay() {
        document.getElementById('withered-count').textContent = `枯萎花瓣: ${this.gameState.witheredCount}/3`;
        document.getElementById('suspicion-level').textContent = `疑心值: ${this.gameState.suspicionLevel}`;
    }

    showEffect(effectType) {
        const effectLayer = document.getElementById('effect-layer');
        effectLayer.classList.add(effectType);
        
        setTimeout(() => {
            effectLayer.classList.remove(effectType);
        }, 300);
    }

    showMessage(text) {
        // 创建临时消息显示
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 1.2rem;
            max-width: 80%;
            text-align: center;
        `;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 2000);
    }

    startDialogueSequence(dialogues) {
        this.dialogueQueue = [...dialogues];
        this.nextDialogue();
    }

    nextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.hideDialogue();
            return;
        }

        const dialogue = this.dialogueQueue.shift();
        this.currentDialogue = dialogue;

        if (dialogue.type === 'narration') {
            this.showNarration(dialogue.text);
        } else if (dialogue.type === 'dialogue') {
            this.showDialogue(dialogue.character, dialogue.text);
        } else if (dialogue.type === 'choice') {
            this.showChoices(dialogue.choices);
            return; // 等待玩家选择
        }

        // 自动模式下继续
        if (this.isAutoMode && dialogue.type !== 'choice') {
            setTimeout(() => this.nextDialogue(), this.textSpeed * 10);
        }
    }

    showNarration(text) {
        const narrationBox = document.getElementById('narration-box');
        const narrationText = document.getElementById('narration-text');
        
        narrationBox.classList.remove('hidden');
        document.getElementById('dialogue-box').classList.add('hidden');
        
        this.typeText(narrationText, text);
    }

    showDialogue(character, text) {
        const dialogueBox = document.getElementById('dialogue-box');
        const characterName = document.getElementById('character-name');
        const dialogueText = document.getElementById('dialogue-text');
        
        document.getElementById('narration-box').classList.add('hidden');
        dialogueBox.classList.remove('hidden');
        
        characterName.textContent = character;
        this.typeText(dialogueText, text);
    }

    hideDialogue() {
        document.getElementById('narration-box').classList.add('hidden');
        document.getElementById('dialogue-box').classList.add('hidden');
        this.currentDialogue = null;
    }

    showChoices(choices) {
        const choiceBox = document.getElementById('choice-box');
        const choicesContainer = document.getElementById('choices');
        
        choicesContainer.innerHTML = '';
        
        choices.forEach((choice, index) => {
            // 检查条件
            if (choice.condition && !this.checkCondition(choice.condition)) {
                return; // 跳过不满足条件的选择
            }
            
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice.text;
            button.addEventListener('click', () => this.makeChoice(choice));
            
            choicesContainer.appendChild(button);
        });
        
        choiceBox.classList.remove('hidden');
    }

    checkCondition(condition) {
        if (condition.type === 'hidden-unlocked') {
            return this.gameState.hiddenBranchUnlocked;
        } else if (condition.type === 'suspicion-level') {
            return this.gameState.suspicionLevel >= condition.value;
        }
        return true;
    }

    makeChoice(choice) {
        document.getElementById('choice-box').classList.add('hidden');
        
        // 记录选择
        this.gameState.choices.push(choice.id);
        
        // 执行选择的动作
        if (choice.action) {
            this.executeAction(choice.action);
        }
        
        // 继续对话
        if (choice.nextDialogues) {
            this.dialogueQueue = [...choice.nextDialogues, ...this.dialogueQueue];
        }
        
        this.nextDialogue();
    }

    executeAction(action) {
        switch (action.type) {
            case 'set-branch':
                this.gameState.currentBranch = action.branch;
                this.goToEnding(action.ending);
                break;
            case 'increase-suspicion':
                this.gameState.suspicionLevel += action.value;
                if (action.unlockHidden) {
                    this.gameState.hiddenBranchUnlocked = true;
                }
                this.updateTriggerDisplay();
                break;
            case 'change-style':
                this.updateBackground(null, action.style);
                break;
            case 'go-to-scene':
                this.startScene(action.scene);
                break;
            case 'go-to-ending':
                this.goToEnding(action.ending);
                break;
        }
    }

    goToEnding(endingType) {
        let endingPage;
        switch (endingType) {
            case 'A':
                endingPage = 'endingA.html';
                break;
            case 'B':
                endingPage = 'endingB.html';
                break;
            case 'C':
                endingPage = 'endingC.html';
                break;
            default:
                endingPage = 'endingA.html';
        }
        
        window.location.href = endingPage;
    }

    typeText(element, text) {
        element.textContent = '';
        let index = 0;
        
        const typeChar = () => {
            if (index < text.length) {
                element.textContent += text[index];
                index++;
                
                if (!this.isSkipping) {
                    setTimeout(typeChar, this.textSpeed);
                } else {
                    element.textContent = text;
                }
            }
        };
        
        typeChar();
    }

    toggleSkip() {
        this.isSkipping = !this.isSkipping;
        const btn = document.getElementById('skip-text');
        btn.style.background = this.isSkipping ? 'rgba(255, 154, 158, 0.3)' : '';
    }

    toggleAutoMode() {
        this.isAutoMode = !this.isAutoMode;
        const btn = document.getElementById('auto-mode');
        btn.style.background = this.isAutoMode ? 'rgba(255, 154, 158, 0.3)' : '';
    }

    saveGame() {
        const saveData = {
            gameState: this.gameState,
            currentScene: this.currentScene,
            currentDialogue: this.currentDialogue,
            dialogueQueue: this.dialogueQueue
        };
        
        localStorage.setItem('peachBlossomSave', JSON.stringify(saveData));
        this.showMessage('游戏已保存');
    }

    loadGame() {
        const saveData = localStorage.getItem('peachBlossomSave');
        if (!saveData) {
            this.showMessage('没有找到存档');
            return;
        }
        
        try {
            const data = JSON.parse(saveData);
            this.gameState = data.gameState;
            this.currentScene = data.currentScene;
            this.dialogueQueue = data.dialogueQueue || [];
            
            this.switchScreen('main-game');
            this.updateTriggerDisplay();
            
            if (this.currentScene) {
                this.startScene(this.currentScene);
            }
            
            this.showMessage('游戏已加载');
        } catch (e) {
            console.error('Failed to load game:', e);
            this.showMessage('存档损坏');
        }
    }

    saveSettings() {
        const settings = {
            textSpeed: this.textSpeed,
            isAutoMode: this.isAutoMode
        };
        localStorage.setItem('peachBlossomSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const settings = localStorage.getItem('peachBlossomSettings');
        if (settings) {
            try {
                const data = JSON.parse(settings);
                this.textSpeed = data.textSpeed || 50;
                this.isAutoMode = data.isAutoMode || false;
                
                document.getElementById('text-speed').value = (100 - this.textSpeed) / 20;
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }
}

// 游戏场景数据
const scenes = {
    scene1: {
        background: 'resources/scene1_opening.png',
        style: 'pink-style',
        dialogues: [
            {
                type: 'narration',
                text: '东晋太元年间，武陵有渔人，缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。'
            },
            {
                type: 'dialogue',
                character: '渔人',
                text: '这花瓣从何处来？竟如此美丽...'
            },
            {
                type: 'narration',
                text: '渔人驾竹筏顺流而下，桃花瓣随风飘落，如梦如幻。远处，一片桃花林出现在眼前...'
            },
            {
                type: 'dialogue',
                character: '渔人',
                text: '乱世之中，怎会有这般无缺的美景？'
            },
            {
                type: 'narration',
                text: '桃林尽头，一个狭窄的溶洞出现在眼前，藤蔓遮掩，透出微光...'
            },
            {
                type: 'choice',
                choices: [
                    {
                        id: 'enter-cave',
                        text: '拨开藤蔓，进入溶洞',
                        action: { type: 'go-to-scene', scene: 'scene2' }
                    }
                ]
            }
        ],
        clickableObjects: [
            {
                x: 30,
                y: 40,
                width: 40,
                height: 40,
                icon: '🌸',
                action: 'normal-petal',
                tooltip: '点击桃花瓣'
            },
            {
                x: 60,
                y: 50,
                width: 30,
                height: 30,
                icon: '🥀',
                action: 'withered-petal',
                tooltip: '枯萎的花瓣'
            },
            {
                x: 70,
                y: 45,
                width: 30,
                height: 30,
                icon: '🥀',
                action: 'withered-petal',
                tooltip: '枯萎的花瓣'
            },
            {
                x: 45,
                y: 60,
                width: 30,
                height: 30,
                icon: '🥀',
                action: 'withered-petal',
                tooltip: '枯萎的花瓣'
            }
        ]
    },
    scene2: {
        background: 'resources/scene2_village.png',
        style: 'pink-style',
        dialogues: [
            {
                type: 'narration',
                text: '豁然开朗。土地平旷，屋舍俨然，有良田美池桑竹之属。阡陌交通，鸡犬相闻。'
            },
            {
                type: 'dialogue',
                character: '孩童',
                text: '你是谁呀？从来没见过外人呢！'
            },
            {
                type: 'dialogue',
                character: '渔人',
                text: '我是武陵渔人，误闯至此，不知这是何方仙境？乱世之中，诸位竟能如此安居乐业？'
            },
            {
                type: 'dialogue',
                character: '村长',
                text: '此处名桃花源。先祖避秦乱而来，不复出焉，与外人间隔久矣，不知乱世之说何来？'
            },
            {
                type: 'dialogue',
                character: '渔人',
                text: '避秦乱？那已是数百年前的事了...'
            },
            {
                type: 'choice',
                choices: [
                    {
                        id: 'accept-wine',
                        text: '接受老翁的米酒',
                        action: { type: 'increase-suspicion', value: -1 },
                        nextDialogues: [
                            {
                                type: 'dialogue',
                                character: '村长',
                                text: '很好，酒能忘忧，此处正是无忧无虑之地。'
                            }
                        ]
                    },
                    {
                        id: 'refuse-wine',
                        text: '拒绝饮酒，继续询问',
                        action: { type: 'increase-suspicion', value: 1 },
                        nextDialogues: [
                            {
                                type: 'dialogue',
                                character: '村长',
                                text: '你若心存疑虑，便难在此安身。'
                            }
                        ]
                    },
                    {
                        id: 'question-reality',
                        text: '追问村长为何桃花无一片枯萎',
                        condition: { type: 'suspicion-level', value: 1 },
                        action: { 
                            type: 'increase-suspicion', 
                            value: 2,
                            unlockHidden: true 
                        },
                        nextDialogues: [
                            {
                                type: 'dialogue',
                                character: '村长',
                                text: '你若心存疑虑，便难在此安身。此处不容怀疑之人。'
                            }
                        ]
                    }
                ]
            },
            {
                type: 'narration',
                text: '几日后，渔人渐渐适应了桃花源的生活。这里的人们过着简单而快乐的日子，但他心中的疑虑却越来越深...'
            },
            {
                type: 'choice',
                choices: [
                    {
                        id: 'continue-to-scene3',
                        text: '继续探索桃花源',
                        action: { type: 'go-to-scene', scene: 'scene3' }
                    }
                ]
            }
        ]
    },
    scene3: {
        background: 'resources/scene2_village.png',
        style: 'pink-style',
        dialogues: [
            {
                type: 'narration',
                text: '数日后，渔人决定离开。村民们为他准备了桃干和竹简，村长再次叮嘱...'
            },
            {
                type: 'dialogue',
                character: '村长',
                text: '此处无赋税战乱，邻里和睦。若愿留便如家人，若要离去，万望莫告外人。'
            },
            {
                type: 'dialogue',
                character: '渔人',
                text: '多谢厚爱，家中有亲人牵挂，需得回去。'
            },
            {
                type: 'narration',
                text: '渔人面临着一个重要的选择...'
            },
            {
                type: 'choice',
                choices: [
                    {
                        id: 'promise-keep',
                        text: '坚守承诺：我必守诺，绝不泄露桃源所在',
                        action: { type: 'go-to-ending', ending: 'A' }
                    },
                    {
                        id: 'greed-tell',
                        text: '心生贪念：这般仙境，告知太守定能得重赏',
                        action: { type: 'go-to-ending', ending: 'B' }
                    },
                    {
                        id: 'suspicion-dark',
                        text: '疑窦丛生：此地太过诡异，我必查清真相',
                        condition: { type: 'hidden-unlocked' },
                        action: { type: 'go-to-ending', ending: 'C' }
                    }
                ]
            }
        ],
        clickableObjects: [
            {
                x: 20,
                y: 30,
                width: 35,
                height: 35,
                icon: '🌸',
                action: 'collect-petal',
                tooltip: '珍稀桃花瓣'
            },
            {
                x: 50,
                y: 45,
                width: 35,
                height: 35,
                icon: '🌸',
                action: 'collect-petal',
                tooltip: '珍稀桃花瓣'
            },
            {
                x: 75,
                y: 35,
                width: 35,
                height: 35,
                icon: '🌸',
                action: 'collect-petal',
                tooltip: '珍稀桃花瓣'
            },
            {
                x: 35,
                y: 65,
                width: 35,
                height: 35,
                icon: '🌸',
                action: 'collect-petal',
                tooltip: '珍稀桃花瓣'
            },
            {
                x: 65,
                y: 70,
                width: 35,
                height: 35,
                icon: '🌸',
                action: 'collect-petal',
                tooltip: '珍稀桃花瓣'
            }
        ]
    }
};

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PeachBlossomGa