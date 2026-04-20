// --- Elements ---
const rootElement = document.documentElement;
const themeToggleBtns = document.querySelectorAll('.theme-toggle'); 
const homeThemeBtnText = document.getElementById('home-theme-toggle');
const supportBtn = document.getElementById('support-btn');

const homeView = document.getElementById('home-view');
const activeView = document.getElementById('active-view');

const startFocusBtn = document.getElementById('start-focus-btn');
const setupForm = document.getElementById('setup-form');
const beginFocusBtn = document.getElementById('begin-focus-btn');

const inputTotalHrs = document.getElementById('setup-total-hrs');
const inputWorkMins = document.getElementById('setup-work-mins');
const inputBreakMins = document.getElementById('setup-break-mins');

const endWorkBtn = document.getElementById('end-work-btn');
const exitModal = document.getElementById('exit-modal');
const modalNoBtn = document.getElementById('modal-no-btn');
const modalYesBtn = document.getElementById('modal-yes-btn');

// Timer & Buttons
const timerDisplay = document.getElementById('timer-display');
const timerLabel = document.getElementById('timer-label');
const startSessionBtn = document.getElementById('start-session-btn');
const timerActionBtn = document.getElementById('timer-action-btn'); 
const fullscreenBtn = document.getElementById('fullscreen-btn'); 

// Task & Reflection Elements
const targetBuilderSection = document.getElementById('target-builder-section');
const targetHeader = document.getElementById('target-header');
const newTaskInput = document.getElementById('new-task-input');
const interactiveTaskList = document.getElementById('interactive-task-list');
const finishTargetsBtn = document.getElementById('finish-targets-btn');

const readOnlyTaskContainer = document.getElementById('read-only-task-container');
const readOnlyTaskList = document.getElementById('read-only-task-list');

const reflectionFormContainer = document.getElementById('reflection-form-container');
const reflectionForm = document.getElementById('reflection-form');
const reflectionHeader = document.getElementById('reflection-header');
const journalList = document.getElementById('journal-list');

const logAchievementsBtn = document.getElementById('log-achievements-btn');
const achievementChecklistContainer = document.getElementById('achievement-checklist-container');
const achievementList = document.getElementById('achievement-list');
const saveAchievementsBtn = document.getElementById('save-achievements-btn');
const achievementResultText = document.getElementById('achievement-result-text');
const thingsToImproveInput = document.getElementById('things-to-improve');

const planNextTargetsBtn = document.getElementById('plan-next-targets-btn');
const nextTargetBuilderContainer = document.getElementById('next-target-builder-container');
const nextTaskInput = document.getElementById('next-task-input');
const nextTaskList = document.getElementById('next-task-list');
const saveNextTargetsBtn = document.getElementById('save-next-targets-btn');
const nextTargetsResultText = document.getElementById('next-targets-result-text');
const initializeNextBtn = document.getElementById('initialize-next-btn');

// --- 1. Master UI & Setup Logic ---
if (supportBtn) {
    supportBtn.addEventListener('click', () => window.open('https://buymeacoffee.com', '_blank'));
}

function updateThemeUI(isDark) {
    if (isDark) {
        rootElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('momentum-theme', 'dark');
        if (homeThemeBtnText) homeThemeBtnText.textContent = 'SWITCH TO LIGHT MODE';
    } else {
        rootElement.removeAttribute('data-theme');
        localStorage.setItem('momentum-theme', 'light');
        if (homeThemeBtnText) homeThemeBtnText.textContent = 'SWITCH TO DARK MODE';
    }
}

const savedTheme = localStorage.getItem('momentum-theme');
updateThemeUI(savedTheme === 'dark');

themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        updateThemeUI(rootElement.getAttribute('data-theme') !== 'dark'); 
    });
});

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = '[×] EXIT FULL SCREEN';
    } else {
        fullscreenBtn.textContent = '[ ] FULL SCREEN';
    }
});

// --- 2. Setup Form Variables ---
startFocusBtn.addEventListener('click', () => {
    startFocusBtn.classList.add('hidden'); 
    setupForm.classList.remove('hidden'); 
});

function checkSetupInputs() {
    beginFocusBtn.disabled = !(inputTotalHrs.value > 0 && inputWorkMins.value > 0 && inputBreakMins.value > 0);
}

inputTotalHrs.addEventListener('input', checkSetupInputs);
inputWorkMins.addEventListener('input', checkSetupInputs);
inputBreakMins.addEventListener('input', checkSetupInputs);

let WORK_DURATION = 0; 
let BREAK_DURATION = 0; 
let sessionCount = 1; 

let timeRemaining = 0;
let activeTimerInterval = null;
let isWorkSession = true;
let isTimerRunning = false;

let currentTasks = []; 
let nextTasks = []; 
let achievementsLogged = false;
let nextTargetsPlanned = false;

function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
}

// --- 3. Builder Logic ---
newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        const text = newTaskInput.value.trim();
        if (text) {
            currentTasks.push(text);
            const taskId = 'task-' + Date.now();
            interactiveTaskList.insertAdjacentHTML('beforeend', `
                <div class="task-item"><input type="checkbox" id="${taskId}"><label for="${taskId}">${text}</label></div>
            `);
            newTaskInput.value = ''; 
        }
    }
});

finishTargetsBtn.addEventListener('click', () => {
    targetBuilderSection.classList.add('hidden');
    readOnlyTaskList.innerHTML = '';
    currentTasks.forEach((task) => {
        readOnlyTaskList.insertAdjacentHTML('beforeend', `
            <div class="task-item"><input type="checkbox" disabled><label>${task}</label></div>
        `);
    });
    readOnlyTaskContainer.classList.remove('hidden');
    startSessionBtn.classList.remove('hidden');
});

// --- 4. Timer Logic ---
startSessionBtn.addEventListener('click', () => {
    startSessionBtn.classList.add('hidden');
    timerActionBtn.classList.remove('hidden');
    timerActionBtn.disabled = false;
    startCountdown();
});

function startCountdown() {
    clearInterval(activeTimerInterval); 
    isTimerRunning = true;
    timerActionBtn.textContent = isWorkSession ? 'PAUSE' : 'SKIP BREAK';
    
    activeTimerInterval = setInterval(() => {
        timeRemaining--;
        updateDisplay(timeRemaining);

        if (!isWorkSession && timeRemaining === Math.floor(BREAK_DURATION / 2)) {
            readOnlyTaskContainer.classList.add('hidden');
            reflectionFormContainer.classList.remove('hidden');
            reflectionFormContainer.classList.remove('invisible');
        }

        if (timeRemaining <= 0) {
            clearInterval(activeTimerInterval);
            isTimerRunning = false;
            
            if (isWorkSession) {
                isWorkSession = false;
                timerLabel.textContent = 'RESTORATION WINDOW';
                timeRemaining = BREAK_DURATION;
                
                reflectionFormContainer.classList.remove('disabled');
                reflectionFormContainer.classList.add('invisible');
                
                updateDisplay(timeRemaining);
                startCountdown(); 
            } else {
                timerLabel.textContent = 'LOG REFLECTION TO CONTINUE';
                timerActionBtn.textContent = 'AWAITING LOG';
                timerActionBtn.disabled = true;
                
                readOnlyTaskContainer.classList.add('hidden');
                reflectionFormContainer.classList.remove('hidden');
                reflectionFormContainer.classList.remove('invisible');
                reflectionFormContainer.classList.remove('disabled');
            }
        }
    }, 1000);
}

timerActionBtn.addEventListener('click', () => {
    if (isWorkSession) {
        if (isTimerRunning) {
            clearInterval(activeTimerInterval);
            isTimerRunning = false;
            timerActionBtn.textContent = 'RESUME';
        } else {
            startCountdown();
        }
    } else {
        if (timeRemaining > 0) {
            clearInterval(activeTimerInterval);
            isTimerRunning = false;
            timeRemaining = 0;
            updateDisplay(0);
            timerLabel.textContent = 'LOG REFLECTION TO CONTINUE';
            timerActionBtn.textContent = 'AWAITING LOG';
            timerActionBtn.disabled = true;
            
            readOnlyTaskContainer.classList.add('hidden');
            reflectionFormContainer.classList.remove('hidden');
            reflectionFormContainer.classList.remove('invisible');
            reflectionFormContainer.classList.remove('disabled');
        }
    }
});

// --- 5. Interactive Reflection Flow ---
logAchievementsBtn.addEventListener('click', () => {
    logAchievementsBtn.classList.add('hidden');
    achievementChecklistContainer.classList.remove('hidden');
    achievementList.innerHTML = '';
    currentTasks.forEach((task, index) => {
        const taskId = 'achieve-task-' + index;
        achievementList.insertAdjacentHTML('beforeend', `
            <div class="task-item"><input type="checkbox" id="${taskId}"><label for="${taskId}">${task}</label></div>
        `);
    });
});

saveAchievementsBtn.addEventListener('click', () => {
    const checkboxes = achievementList.querySelectorAll('input[type="checkbox"]');
    let completed = 0;
    checkboxes.forEach(cb => { if(cb.checked) completed++; });
    const total = currentTasks.length || 1; 
    const percentage = currentTasks.length === 0 ? 0 : Math.round((completed / total) * 100);

    achievementChecklistContainer.classList.add('hidden');
    achievementResultText.textContent = `ACHIEVEMENT: ${percentage}%`;
    achievementResultText.classList.remove('hidden');

    achievementsLogged = true;
    checkInitializeState();
});

planNextTargetsBtn.addEventListener('click', () => {
    planNextTargetsBtn.classList.add('hidden');
    nextTargetBuilderContainer.classList.remove('hidden');
    nextTasks = [];
    nextTaskList.innerHTML = '';
});

nextTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const text = nextTaskInput.value.trim();
        if (text) {
            nextTasks.push(text);
            const taskId = 'next-task-' + Date.now();
            nextTaskList.insertAdjacentHTML('beforeend', `
                <div class="task-item"><input type="checkbox" id="${taskId}" disabled><label for="${taskId}">${text}</label></div>
            `);
            nextTaskInput.value = '';
        }
    }
});

saveNextTargetsBtn.addEventListener('click', () => {
    if (nextTasks.length > 0) {
        nextTargetBuilderContainer.classList.add('hidden');
        nextTargetsResultText.textContent = `NEW TARGETS: ${nextTasks.length}`;
        nextTargetsResultText.classList.remove('hidden');

        nextTargetsPlanned = true;
        checkInitializeState();
    }
});

function checkInitializeState() {
    initializeNextBtn.disabled = !(achievementsLogged && nextTargetsPlanned && nextTasks.length > 0);
}

// --- 6. Routing & End Blocks ---
setupForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    WORK_DURATION = parseInt(inputWorkMins.value) * 60;
    BREAK_DURATION = parseInt(inputBreakMins.value) * 60;
    sessionCount = 1; 
    currentTasks = [];
    nextTasks = [];

    homeView.classList.add('hidden');
    activeView.classList.remove('hidden');
    
    isWorkSession = true;
    timeRemaining = WORK_DURATION;
    updateDisplay(timeRemaining);
    
    timerLabel.textContent = 'WORK SESSION';
    targetHeader.textContent = `TARGETS FOR SESSION ${sessionCount}`;
    reflectionHeader.textContent = `SESSION ${sessionCount} REFLECTION`;
    
    timerActionBtn.classList.add('hidden');
    startSessionBtn.classList.add('hidden');
    
    interactiveTaskList.innerHTML = ''; 
    targetBuilderSection.classList.remove('hidden');
    
    readOnlyTaskContainer.classList.add('hidden');
    reflectionFormContainer.classList.add('hidden');
    reflectionFormContainer.classList.add('invisible');
    reflectionFormContainer.classList.add('disabled');
    
    resetReflectionUI();
});

endWorkBtn.addEventListener('click', () => exitModal.classList.remove('hidden'));
modalNoBtn.addEventListener('click', () => exitModal.classList.add('hidden'));

modalYesBtn.addEventListener('click', () => {
    exitModal.classList.add('hidden');
    clearInterval(activeTimerInterval);
    isTimerRunning = false;
    
    if (document.fullscreenElement) document.exitFullscreen(); 

    activeView.classList.add('hidden');
    homeView.classList.remove('hidden');
    setupForm.classList.add('hidden');
    startFocusBtn.classList.remove('hidden');
    
    setupForm.reset();
    journalList.innerHTML = ''; 
    beginFocusBtn.disabled = true;
    targetBuilderSection.classList.add('hidden');
    readOnlyTaskContainer.classList.add('hidden');
});

reflectionForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    if (!isWorkSession && timeRemaining <= 0) {
        
        const percentageText = achievementResultText.textContent;
        const improvements = thingsToImproveInput.value || "None";
        journalList.insertAdjacentHTML('beforeend', `
            <div class="journal-entry">
                <span class="entry-time">S${sessionCount}</span>
                <p><strong>${percentageText}</strong><br>Improve: ${improvements}</p>
            </div>
        `);
        
        currentTasks = [...nextTasks]; 
        readOnlyTaskList.innerHTML = '';
        currentTasks.forEach((task) => {
            readOnlyTaskList.insertAdjacentHTML('beforeend', `
                <div class="task-item"><input type="checkbox" disabled><label>${task}</label></div>
            `);
        });
        
        reflectionForm.reset();
        resetReflectionUI();
        
        sessionCount++; 
        isWorkSession = true;
        timeRemaining = WORK_DURATION;
        updateDisplay(timeRemaining);
        
        timerLabel.textContent = 'WORK SESSION';
        reflectionHeader.textContent = `SESSION ${sessionCount} REFLECTION`;
        
        reflectionFormContainer.classList.add('hidden');
        reflectionFormContainer.classList.add('invisible');
        reflectionFormContainer.classList.add('disabled');
        
        readOnlyTaskContainer.classList.remove('hidden');
        startSessionBtn.classList.remove('hidden');
        timerActionBtn.classList.add('hidden');
    }
});

function resetReflectionUI() {
    achievementsLogged = false;
    nextTargetsPlanned = false;
    initializeNextBtn.disabled = true;
    
    logAchievementsBtn.classList.remove('hidden');
    achievementResultText.classList.add('hidden');
    
    planNextTargetsBtn.classList.remove('hidden');
    nextTargetsResultText.classList.add('hidden');
    
    achievementChecklistContainer.classList.add('hidden');
    nextTargetBuilderContainer.classList.add('hidden');
}