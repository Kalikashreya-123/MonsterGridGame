// Theme configuration for grid icons
const THEME = {
  player: '🧙‍♂️', // Wizard / Hero
  monster: '🐉', // Dragon / Boss
  wall: '⚡',    // Stone / Obstacle
  empty: ''      // Empty floor tile
};

// Level configurations with star limits
const levels = [
  {
    levelNumber: 1,
    startPos: { r: 0, c: 0 },
    monsterPos: { r: 5, c: 3 },
    starLimits: { threeStar: 8, twoStar: 11 },
    walls: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 4 },
      { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 3 }
    ]
  },
  {
    levelNumber: 2,
    startPos: { r: 0, c: 5 },
    monsterPos: { r: 5, c: 0 },
    starLimits: { threeStar: 10, twoStar: 14 },
    walls: [
      { r: 0, c: 3 }, { r: 1, c: 3 }, { r: 2, c: 1 }, { r: 2, c: 2 },
      { r: 4, c: 0 }, { r: 4, c: 1 }, { r: 4, c: 4 }, { r: 5, c: 4 }
    ]
  },
  {
    levelNumber: 3,
    startPos: { r: 5, c: 5 },
    monsterPos: { r: 0, c: 0 },
    starLimits: { threeStar: 10, twoStar: 15 },
    walls: [
      { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 },
      { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 3, c: 5 }
    ]
  }
];

const GRID_SIZE = 6;
let currentLevelIndex = 0;
let unlockedLevelIndex = parseInt(localStorage.getItem('unlockedLevelIndex')) || 0;

let playerPos = { ...levels[currentLevelIndex].startPos };
let queue = [];
let isRunning = false;

// Check if position is a wall
function isWall(r, c) {
  const currentWalls = levels[currentLevelIndex].walls;
  return currentWalls.some(w => w.r === r && w.c === c);
}

// Update title text indicator
function updateLevelIndicator() {
  const indicator = document.getElementById('level-indicator');
  if (indicator) {
    indicator.textContent = `(Level \({levels[currentLevelIndex].levelNumber} /\){levels.length})`;
  }
}

// Render level selection buttons
function renderLevelButtons() {
  const container = document.getElementById('level-buttons');
  if (!container) return;
  
  container.innerHTML = '';
  levels.forEach((level, index) => {
    const btn = document.createElement('button');
    const isLocked = index > unlockedLevelIndex;
    
    btn.className = `level-btn \({index === currentLevelIndex ? 'active' : ''}\){isLocked ? 'locked' : ''}`;
    btn.textContent = isLocked ? `🔒 Level \({level.levelNumber}` : `Level\){level.levelNumber}`;
    btn.disabled = isLocked;
    btn.onclick = () => selectLevel(index);
    container.appendChild(btn);
  });
}

function selectLevel(index) {
  if (isRunning || index > unlockedLevelIndex) return;
  currentLevelIndex = index;
  resetGame();
}

// Render grid board
function createBoard() {
  const grid = document.getElementById('grid');
  if (!grid) return;
  grid.innerHTML = '';
  const currentMonster = levels[currentLevelIndex].monsterPos;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      if (r === playerPos.r && c === playerPos.c) {
        cell.textContent = THEME.player;
      } else if (r === currentMonster.r && c === currentMonster.c) {
        cell.textContent = THEME.monster;
      } else if (isWall(r, c)) {
        cell.textContent = THEME.wall;
      }

      grid.appendChild(cell);
    }
  }
  updateLevelIndicator();
  renderLevelButtons();
}

// Queue command controls
function addCommand(dir) {
  if (isRunning) return;
  queue.push(dir);
  updateCommandBar();
}

function updateCommandBar() {
  const symbols = { UP: '⬆️', DOWN: '⬇️', LEFT: '⬅️', RIGHT: '➡️' };
  const bar = document.getElementById('command-bar');
  if (bar) {
    bar.textContent = queue.map(d => symbols[d]).join(' ');
  }
}

function clearQueue() {
  if (isRunning) return;
  queue = [];
  updateCommandBar();
}

// Execute commands step-by-step
async function runCommands() {
  if (isRunning || queue.length === 0) return;
  isRunning = true;

  for (let cmd of queue) {
    let nextR = playerPos.r;
    let nextC = playerPos.c;

    if (cmd === 'UP' && playerPos.r > 0) nextR--;
    if (cmd === 'DOWN' && playerPos.r < GRID_SIZE - 1) nextR++;
    if (cmd === 'LEFT' && playerPos.c > 0) nextC--;
    if (cmd === 'RIGHT' && playerPos.c < GRID_SIZE - 1) nextC++;

    if (!isWall(nextR, nextC)) {
      playerPos.r = nextR;
      playerPos.c = nextC;
    }

    createBoard();
    await new Promise(res => setTimeout(res, 350));
  }

  const currentMonster = levels[currentLevelIndex].monsterPos;

  if (playerPos.r === currentMonster.r && playerPos.c === currentMonster.c) {
    setTimeout(showWinModal, 100);
  } else {
    setTimeout(() => alert('❌ Missed the monster! Try a different path.'), 100);
  }

  isRunning = false;
}

// Stars calculation
function calculateStars(moveCount) {
  const limits = levels[currentLevelIndex].starLimits;
  if (moveCount <= limits.threeStar) return 3;
  if (moveCount <= limits.twoStar) return 2;
  return 1;
}

// Show victory modal popup
function showWinModal() {
  const modal = document.getElementById('win-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const starContainer = document.getElementById('star-rating');
  const nextBtn = document.getElementById('next-level-btn');

  const movesUsed = queue.length;
  const starsEarned = calculateStars(movesUsed);

  if (starContainer) {
    starContainer.textContent = '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
  }

  if (currentLevelIndex < levels.length - 1) {
    modalTitle.textContent = "🎉 Level Complete!";
    modalMessage.textContent = `Completed in ${movesUsed} moves!`;
    if (nextBtn) nextBtn.style.display = "inline-block";
  } else {
    modalTitle.textContent = "🏆 Champion!";
    modalMessage.textContent = `All levels beat! Final score: ${movesUsed} moves!`;
    if (nextBtn) nextBtn.style.display = "none";
  }

  if (modal) modal.classList.remove('hidden');
}

// Victory Modal Handlers
function replayLevel() {
  const modal = document.getElementById('win-modal');
  if (modal) modal.classList.add('hidden');
  resetGame();
}

function nextLevel() {
  const modal = document.getElementById('win-modal');
  if (modal) modal.classList.add('hidden');

  if (currentLevelIndex < levels.length - 1) {
    currentLevelIndex++;

    // Unlock the new level if it hasn't been unlocked yet
    if (currentLevelIndex > unlockedLevelIndex) {
      unlockedLevelIndex = currentLevelIndex;
      localStorage.setItem('unlockedLevelIndex', unlockedLevelIndex);
    }

    // Reset game state and load the new level onto the board
    resetGame();
  } else {
    alert('🏆 Champion! You have completed all levels!');
    currentLevelIndex = 0;
    resetGame();
  }
}
function resetGame() {
  if (isRunning) return;
  playerPos = { ...levels[currentLevelIndex].startPos };
  queue = [];
  isRunning = false;
  updateCommandBar();
  createBoard();
}

function resetProgress() {
  if (confirm("Are you sure you want to lock all levels and reset progress?")) {
    localStorage.removeItem('unlockedLevelIndex');
    unlockedLevelIndex = 0;
    currentLevelIndex = 0;
    resetGame();
  }
}

// Initializing game board on load
createBoard();