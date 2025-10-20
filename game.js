// game.js

const BOARD_SIZE_PIXELS = 600; 
let GRID_SIZE;
let IMAGE_SRC;

// tileOrder stores the ID (correct index) of the tile at the current position (index)
let tileOrder = []; 
let boardElement;
let messageElement;
let shuffleButton;
let solveButton; 
let hintButton; 
let previewContainer;
let targetImageElement; 

let moveCount = 0; // Initialize move counter
let moveCountElement; // Reference to the move counter display

// Utility functions for coordinate conversion
function indexToCoords(index) {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return { row, col };
}

function coordsToIndex(row, col) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return -1;
    }
    return row * GRID_SIZE + col;
}

function getBackgroundPosition(tileId) {
    const tileDimension = BOARD_SIZE_PIXELS / GRID_SIZE;
    const { row, col } = indexToCoords(tileId);
    
    // Background position should be negative offset from the top left corner of the image
    const x = -col * tileDimension;
    const y = -row * tileDimension;
    
    return `${x}px ${y}px`;
}

// Check if two indices are adjacent (horizontally or vertically)
function areAdjacent(index1, index2) {
    const c1 = indexToCoords(index1);
    const c2 = indexToCoords(index2);
    
    const rowDiff = Math.abs(c1.row - c2.row);
    const colDiff = Math.abs(c1.col - c2.col);
    
    // They are adjacent if one coordinate difference is 1 and the other is 0
    return (rowDiff + colDiff) === 1;
}

function isSolved() {
    // Check if tileOrder is [0, 1, 2, ..., N*N - 1]
    for (let i = 0; i < tileOrder.length; i++) {
        if (tileOrder[i] !== i) {
            return false;
        }
    }
    return true;
}

// Function to handle the final state when the puzzle is solved
function handleSolvedState(isManual = true) {
    shuffleButton.textContent = "Play Again";
    boardElement.classList.add('solved');
    
    // Reveal the empty tile image piece
    revealEmptyTile();
    
    // Disable interaction until shuffled again
    document.querySelectorAll('.tile').forEach(tile => {
        tile.style.cursor = 'default';
        if (!tile.classList.contains('empty-tile')) {
            tile.style.pointerEvents = 'none'; 
        }
    });

    if (isManual) {
        messageElement.textContent = `Congratulations! You solved the puzzle in ${moveCount} moves!`;
        // Add win animation
        messageElement.classList.add('win-animation');
        setTimeout(() => messageElement.classList.remove('win-animation'), 1000); 
    } else {
        messageElement.textContent = "Puzzle resolved by solver.";
    }
}

// Function to update the visual positions of existing tiles based on tileOrder
function updateTilePositions() {
    const totalTiles = GRID_SIZE * GRID_SIZE;
    
    // Iterate through all current positions (i)
    for (let i = 0; i < totalTiles; i++) {
        const tileId = tileOrder[i]; // The ID of the tile that should be at position i
        
        // Find the corresponding DOM element by its correctId (tileId)
        // Note: Using querySelector inside a loop can be slow if the board is huge, but for 3x3 or 4x4 it's fine.
        // A Map/Object lookup would be faster if complexity required it.
        const tileElement = boardElement.querySelector(`[data-correct-id="${tileId}"]`);
        
        if (tileElement) {
            // Calculate grid position (r, c) based on current position i
            const { row: r, col: c } = indexToCoords(i);
            
            // Update visual position using grid-area (1-based index for CSS grid)
            tileElement.style.gridArea = `${r + 1} / ${c + 1}`;
            tileElement.dataset.currentPosition = i;
        }
    }
}

// Function to create tile elements once
function createBoardElements() {
    boardElement.innerHTML = '';
    boardElement.classList.remove('solved');
    
    const totalTiles = GRID_SIZE * GRID_SIZE;
    boardElement.style.setProperty('--grid-size', GRID_SIZE);
    
    for (let tileId = 0; tileId < totalTiles; tileId++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        
        // Data attributes help track positions and identities
        // We set the correct ID once
        tile.dataset.correctId = tileId;
        
        if (tileId === totalTiles - 1) {
            // This is the empty tile
            tile.classList.add('empty-tile');
        } else {
            // Apply background image and position
            tile.style.backgroundImage = `url(${IMAGE_SRC})`;
            tile.style.backgroundPosition = getBackgroundPosition(tileId);
        }
        
        tile.addEventListener('click', handleTileClick);
        boardElement.appendChild(tile);
    }
}

// Helper to update the move counter display
function updateMoveCount(count) {
    moveCount = count;
    if (moveCountElement) {
        moveCountElement.textContent = `Moves: ${moveCount}`;
    }
}


function handleTileClick(event) {
    const clickedTileElement = event.currentTarget;
    // We get the current position from the dataset
    const clickedPos = parseInt(clickedTileElement.dataset.currentPosition);
    
    // Find the current position of the empty tile (ID = totalTiles - 1)
    const emptyTileId = GRID_SIZE * GRID_SIZE - 1;
    const emptyPos = tileOrder.findIndex(id => id === emptyTileId);

    if (areAdjacent(clickedPos, emptyPos)) {
        // 1. Logic Swap
        [tileOrder[clickedPos], tileOrder[emptyPos]] = [tileOrder[emptyPos], tileOrder[clickedPos]];
        
        // 2. Update visual positions (triggering CSS transition)
        updateTilePositions();
        
        // 3. Increment move counter
        updateMoveCount(moveCount + 1);
        
        if (isSolved()) {
            handleSolvedState(true);
        } else {
            messageElement.textContent = "";
        }
    }
}

function revealEmptyTile() {
    const emptyTileElement = boardElement.querySelector('.empty-tile');
    if (emptyTileElement) {
        const totalTiles = GRID_SIZE * GRID_SIZE;
        const emptyTileId = totalTiles - 1;
        
        emptyTileElement.style.backgroundImage = `url(${IMAGE_SRC})`;
        emptyTileElement.style.backgroundPosition = getBackgroundPosition(emptyTileId);
        emptyTileElement.style.opacity = 1;
        emptyTileElement.style.pointerEvents = 'none'; 
    }
}


// --- Shuffling Logic ---

function getValidMoves(emptyPos) {
    const { row, col } = indexToCoords(emptyPos);
    const moves = [];
    
    // Potential moves: up, down, left, right
    [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].forEach(([r, c]) => {
        const index = coordsToIndex(r, c);
        if (index !== -1) {
            moves.push(index); // Index of the tile to swap with the empty space
        }
    });
    return moves;
}

// Simple shuffling by making a sequence of random valid moves
function shuffleTiles(steps = 100) {
    const totalTiles = GRID_SIZE * GRID_SIZE;
    let emptyTileId = totalTiles - 1;
    let emptyPos = tileOrder.findIndex(id => id === emptyTileId);
    
    for (let i = 0; i < steps; i++) {
        const validMoves = getValidMoves(emptyPos);
        if (validMoves.length === 0) continue; 
        
        // Pick a random adjacent tile position to swap with the empty tile
        const movePos = validMoves[Math.floor(Math.random() * validMoves.length)];
        
        // Swap tile at movePos with tile at emptyPos
        [tileOrder[emptyPos], tileOrder[movePos]] = [tileOrder[movePos], tileOrder[emptyPos]];
        
        // Update empty position (it moves to where the tile came from)
        emptyPos = movePos;
    }
    
    // Check if the resulting state is the solved state (rare, but possible with low steps)
    if (isSolved()) {
        // If solved immediately after shuffling, run more steps
        // Increase steps slightly for safety, scaled by size
        const nextSteps = steps + GRID_SIZE * 5; 
        shuffleTiles(nextSteps);
    }
}

function solveGame() {
    const totalTiles = GRID_SIZE * GRID_SIZE;
    // Set tileOrder to the solved state: [0, 1, 2, ..., N*N - 1]
    tileOrder = Array.from({ length: totalTiles }, (_, i) => i);
    
    // Update visuals
    updateTilePositions();
    // Do not increment move count here.
    
    handleSolvedState(false); 
}

function resetGame() {
    const totalTiles = GRID_SIZE * GRID_SIZE;
    // Initial solved state: [0, 1, 2, ..., N*N - 1]
    tileOrder = Array.from({ length: totalTiles }, (_, i) => i);
    shuffleButton.textContent = "Shuffle";
    messageElement.textContent = "";
    updateMoveCount(0); // Reset move count
    
    // Reset empty tile appearance (Fix: clear inline styles applied during win state)
    const emptyTileElement = boardElement.querySelector('.empty-tile');
    if (emptyTileElement) {
        // Clear specific inline styles set during win state
        emptyTileElement.style.backgroundImage = '';
        emptyTileElement.style.backgroundPosition = '';
        emptyTileElement.style.opacity = ''; 
        emptyTileElement.style.pointerEvents = ''; 
    }
    
    // Ensure tiles are interactive by clearing inline styles set during handleSolvedState
    document.querySelectorAll('.tile').forEach(tile => {
        tile.style.cursor = ''; // Revert to CSS default (pointer)
        if (!tile.classList.contains('empty-tile')) {
            tile.style.pointerEvents = ''; // Clear inline pointer-events: none set during win
        }
    });
    
    // Clear solved state from board
    boardElement.classList.remove('solved');
}

function startGame() {
    // 1. Reset game state (moves, solved status)
    resetGame();
    
    // 2. Re-create board elements based on current GRID_SIZE
    createBoardElements();
    
    // 3. Animation: Add shuffling class before shuffling starts
    boardElement.classList.add('shuffling');

    // Use an appropriate number of steps for a solid shuffle. Scale steps based on grid size.
    const shuffleSteps = GRID_SIZE * GRID_SIZE * 20; 
    shuffleTiles(shuffleSteps); 
    
    updateTilePositions(); // Initial position setup after shuffle
    messageElement.textContent = `Puzzle shuffled! Grid size: ${GRID_SIZE}x${GRID_SIZE}. Click a tile next to the empty space.`;
    
    // Animation: Remove shuffling class after a short delay (0.3s matches CSS transition)
    setTimeout(() => {
        boardElement.classList.remove('shuffling');
    }, 300);
}

function toggleHint() {
    const isHidden = previewContainer.classList.toggle('hidden');
    hintButton.textContent = isHidden ? "Show Hint" : "Hide Hint";
}


export function initGame(imageSrc, gridSize) {
    IMAGE_SRC = imageSrc;
    GRID_SIZE = gridSize;
    
    boardElement = document.getElementById('puzzle-board');
    messageElement = document.getElementById('message');
    shuffleButton = document.getElementById('shuffle-button');
    solveButton = document.getElementById('solve-button'); 
    moveCountElement = document.getElementById('move-count'); 
    
    // New elements
    hintButton = document.getElementById('hint-button');
    previewContainer = document.getElementById('preview-container');
    targetImageElement = document.getElementById('target-image');
    
    if (!boardElement || !messageElement || !shuffleButton || !solveButton || !moveCountElement || !hintButton || !previewContainer || !targetImageElement) {
        console.error("Missing necessary DOM elements:", { boardElement, messageElement, shuffleButton, solveButton, moveCountElement, hintButton, previewContainer, targetImageElement });
        return;
    }
    
    // Set up the target image preview (this only needs to happen once or when imageSrc changes)
    targetImageElement.src = IMAGE_SRC;

    // We only need to set up listeners once. Add a flag to prevent multiple attachments.
    if (!shuffleButton.listenerAttached) {
        shuffleButton.addEventListener('click', startGame);
        solveButton.addEventListener('click', solveGame); 
        hintButton.addEventListener('click', toggleHint); 
        shuffleButton.listenerAttached = true;
    }
    
    // Start the game with the new configuration
    startGame();
}