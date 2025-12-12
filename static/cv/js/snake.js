let snakeGameInterval = null;
let snakeKeyHandler = null;

function startSnakeGame() {
  const canvas = document.getElementById("snake-game");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const gridSize = 20;
  const cols = canvas.width / gridSize;
  const rows = canvas.height / gridSize;

  let snake = [{ x: 5, y: 5 }];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = spawnFood();
  let score = 0;
  let gameOver = false;

  function spawnFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(
      food.x * gridSize,
      food.y * gridSize,
      gridSize - 2,
      gridSize - 2
    );

    // Draw snake
    snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? "#4af626" : "#1f6b12";
      ctx.fillRect(
        segment.x * gridSize,
        segment.y * gridSize,
        gridSize - 2,
        gridSize - 2
      );
    });

    // Game over text
    if (gameOver) {
      ctx.fillStyle = "#4af626";
      ctx.font = "20px VT323";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    }
  }

  function update() {
    if (gameOver) return;

    direction = nextDirection;
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      gameOver = true;
      return;
    }

    // Self collision
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOver = true;
      return;
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      document.getElementById("snake-score").textContent = "SCORE: " + score;
      food = spawnFood();
    } else {
      snake.pop();
    }
  }

  function gameLoop() {
    update();
    draw();
  }

  function handleSnakeKeys(e) {
    if (gameOver && e.key === "Enter") {
      snake = [{ x: 5, y: 5 }];
      direction = { x: 1, y: 0 };
      nextDirection = { x: 1, y: 0 };
      food = spawnFood();
      score = 0;
      gameOver = false;
      document.getElementById("snake-score").textContent = "SCORE: 0";
      return;
    }

    if (e.key === "Escape") {
      stopSnakeGame();
      if (typeof loadContent === "function") {
        loadContent("home");
        currentIndex = 0;
        updateMenu();
      }
      return;
    }

    const keyMap = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };

    if (keyMap[e.key]) {
      const newDir = keyMap[e.key];
      // Prevent reversing
      if (newDir.x !== -direction.x || newDir.y !== -direction.y) {
        nextDirection = newDir;
      }
      e.preventDefault();
    }
  }

  // Cleanup previous game if any
  stopSnakeGame();

  // Start new game
  snakeKeyHandler = handleSnakeKeys;
  document.addEventListener("keydown", snakeKeyHandler);
  snakeGameInterval = setInterval(gameLoop, 100);
}

function stopSnakeGame() {
  if (snakeGameInterval) {
    clearInterval(snakeGameInterval);
    snakeGameInterval = null;
  }
  if (snakeKeyHandler) {
    document.removeEventListener("keydown", snakeKeyHandler);
    snakeKeyHandler = null;
  }
}
