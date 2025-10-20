"use client";

import { useState, useEffect, useCallback } from "react";

export default function PuzzlePage() {
  const [difficulty, setDifficulty] = useState("easy"); // 'easy' = 3x3, 'hard' = 4x4
  const [moves, setMoves] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [isResolved, setIsResolved] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const gridSize = difficulty === "easy" ? 3 : 4;
  const totalTiles = gridSize * gridSize;

  // Target image
  const targetImage =
    "https://ucarecdn.com/7141ddd7-b66d-45d0-9a95-8ccf62ab2410/-/format/auto/";

  // Initialize puzzle tiles in solved state
  const initializePuzzle = useCallback(() => {
    const newTiles = [];
    for (let i = 0; i < totalTiles - 1; i++) {
      newTiles.push({
        id: i,
        position: i,
        isEmpty: false,
      });
    }
    // Add empty tile at the end
    newTiles.push({
      id: totalTiles - 1,
      position: totalTiles - 1,
      isEmpty: true,
    });

    setTiles(newTiles);
    setMoves(0);
    setIsResolved(false);
    setGameStarted(false);
  }, [totalTiles]);

  // Get valid moves for a tile position
  const getValidMoves = (position, size) => {
    const row = Math.floor(position / size);
    const col = position % size;
    const moves = [];

    // Check up, down, left, right
    if (row > 0) moves.push((row - 1) * size + col); // up
    if (row < size - 1) moves.push((row + 1) * size + col); // down
    if (col > 0) moves.push(row * size + (col - 1)); // left
    if (col < size - 1) moves.push(row * size + (col + 1)); // right

    return moves;
  };

  // Shuffle tiles with proper algorithm
  const shuffleTiles = useCallback(() => {
    if (tiles.length === 0) return;

    const shuffled = [...tiles];

    // Perform many random valid moves to ensure solvable state
    for (let i = 0; i < 1000; i++) {
      const currentEmpty = shuffled.findIndex((tile) => tile.isEmpty);
      const validMoves = getValidMoves(currentEmpty, gridSize);

      if (validMoves.length > 0) {
        const randomMove =
          validMoves[Math.floor(Math.random() * validMoves.length)];

        // Swap empty with random valid tile
        [shuffled[currentEmpty], shuffled[randomMove]] = [
          shuffled[randomMove],
          shuffled[currentEmpty],
        ];
      }
    }

    setTiles(shuffled);
    setMoves(0);
    setIsResolved(false);
    setGameStarted(true);
  }, [tiles, gridSize]);

  // Start countdown and auto shuffle
  const startGame = useCallback(() => {
    setIsCountingDown(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCountingDown(false);
          // Small delay to let countdown finish, then shuffle
          setTimeout(() => {
            shuffleTiles();
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [shuffleTiles]);

  // Handle tile click
  const handleTileClick = (clickedIndex) => {
    if (!gameStarted || isCountingDown) return;

    const emptyIndex = tiles.findIndex((tile) => tile.isEmpty);
    const validMoves = getValidMoves(emptyIndex, gridSize);

    if (validMoves.includes(clickedIndex)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[clickedIndex]] = [
        newTiles[clickedIndex],
        newTiles[emptyIndex],
      ];

      setTiles(newTiles);
      setMoves((prev) => prev + 1);

      // Check if resolved
      const isComplete = newTiles.every((tile, index) => tile.id === index);
      if (isComplete) {
        setIsResolved(true);
      }
    }
  };

  // Play again function
  const playAgain = () => {
    initializePuzzle();
    setTimeout(() => {
      startGame();
    }, 500);
  };

  // Initialize on mount and difficulty change
  useEffect(() => {
    initializePuzzle();
  }, [difficulty, initializePuzzle]);

  // Auto start game after initial load
  useEffect(() => {
    if (tiles.length > 0 && !gameStarted && !isCountingDown) {
      const timer = setTimeout(() => {
        startGame();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tiles, gameStarted, isCountingDown, startGame]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#9AFF00] tracking-wider mb-4">
            SYMBIOTIC LOGO PUZZLE
          </h1>
        </div>

        <div className="border-2 border-gray-600 rounded-lg p-4 lg:p-8 bg-[#2a2a2a]">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            {/* Difficulty Selection */}
            <div className="flex items-center gap-4">
              <span className="text-white text-lg">Select Difficulty:</span>
              <button
                onClick={() => setDifficulty("easy")}
                disabled={isCountingDown}
                className={`px-6 py-3 rounded border-2 transition-colors text-lg font-bold ${
                  difficulty === "easy"
                    ? "bg-[#9AFF00] text-black border-[#9AFF00]"
                    : "bg-transparent text-[#9AFF00] border-[#9AFF00] hover:bg-[#9AFF00] hover:text-black"
                } ${isCountingDown ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Easy (3x3)
              </button>
              <button
                onClick={() => setDifficulty("hard")}
                disabled={isCountingDown}
                className={`px-6 py-3 rounded border-2 transition-colors text-lg font-bold ${
                  difficulty === "hard"
                    ? "bg-[#9AFF00] text-black border-[#9AFF00]"
                    : "bg-transparent text-[#9AFF00] border-[#9AFF00] hover:bg-[#9AFF00] hover:text-black"
                } ${isCountingDown ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Hard (4x4)
              </button>
            </div>

            {/* Status */}
            <div className="text-right">
              <div className="mb-2 text-xl">Moves: {moves}</div>
              {isResolved && (
                <div className="text-[#9AFF00] font-bold text-xl">
                  Puzzle Solved! 🎉
                </div>
              )}
            </div>
          </div>

          {/* Countdown Overlay */}
          {isCountingDown && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="text-center">
                <div className="text-8xl font-bold text-[#9AFF00] mb-4">
                  {countdown}
                </div>
                <div className="text-2xl text-white">Game starting...</div>
              </div>
            </div>
          )}

          <div className="flex flex-col xl:flex-row gap-8 items-center justify-center">
            {/* Puzzle Grid */}
            <div className="flex-shrink-0">
              <div
                className="grid gap-2 bg-black p-4 rounded-lg mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  width: "fit-content",
                }}
              >
                {tiles.map((tile, index) => (
                  <div
                    key={tile.id}
                    onClick={() => handleTileClick(index)}
                    className={`
                      border border-black cursor-pointer transition-all duration-200 rounded-sm
                      ${
                        tile.isEmpty
                          ? "bg-[#333333]"
                          : "bg-[#9AFF00] hover:bg-[#8AEF00] active:scale-95 hover:shadow-lg"
                      }
                      ${gridSize === 3 ? "w-32 h-32 lg:w-40 lg:h-40" : "w-24 h-24 lg:w-32 lg:h-32"}
                      ${!gameStarted || isCountingDown ? "cursor-not-allowed" : ""}
                    `}
                    style={{
                      backgroundImage: tile.isEmpty
                        ? "none"
                        : `url(${targetImage})`,
                      backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                      backgroundPosition: `${(tile.id % gridSize) * (100 / (gridSize - 1))}% ${Math.floor(tile.id / gridSize) * (100 / (gridSize - 1))}%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Target Image */}
            {showHint && (
              <div className="flex-shrink-0">
                <div className="border-2 border-[#9AFF00] rounded-lg p-4 bg-[#1a1a1a]">
                  <div className="text-[#9AFF00] text-center mb-3 font-bold text-xl">
                    Target Image
                  </div>
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      width: gridSize === 3 ? "320px" : "256px",
                      height: gridSize === 3 ? "320px" : "256px",
                      backgroundImage: `url(${targetImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <button
              onClick={playAgain}
              disabled={isCountingDown}
              className={`px-8 py-4 bg-[#9AFF00] text-black rounded-lg font-bold text-lg hover:bg-[#8AEF00] transition-colors ${
                isCountingDown ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Play Again
            </button>
            <button
              onClick={() => setShowHint(!showHint)}
              disabled={isCountingDown}
              className={`px-8 py-4 bg-[#9AFF00] text-black rounded-lg font-bold text-lg hover:bg-[#8AEF00] transition-colors ${
                isCountingDown ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400">
          <p className="text-lg">
            Made by <span className="text-[#9AFF00]">Haziq</span> • Follow me on{" "}
            <a
              href="https://x.com/0xGoldx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9AFF00] hover:text-[#8AEF00] underline transition-colors"
            >
              X
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
