window.addEventListener("load", function () {
  // Get the device pixel ratio
  const debug = false;
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.getElementById("canvas0");
  const mainMenu = document.getElementById("mainMenu");
  const againButton = document.getElementById("againBtn");
  const gameOverMenu = document.getElementById("gameOverMenu");
  const scoreCount = document.getElementById("score");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const gameSpeed = 24;
  let avatar = "mc";
  let gameOver = false;
  let enemies = [];
  let score = 0;

  class InputHandler {
    constructor() {
      this.keys = [];
      window.addEventListener("keydown", (e) => {
        const { key } = e;
        if (
          (key === "ArrowDown" ||
            key === "ArrowUp" ||
            key === "ArrowLeft" ||
            key === "ArrowRight" ||
            key === " ") &&
          this.keys.indexOf(key) === -1
        ) {
          this.keys.push(key);
        }
      });
      window.addEventListener("keyup", (e) => {
        const { key } = e;
        if (
          key === "ArrowDown" ||
          key === "ArrowUp" ||
          key === "ArrowLeft" ||
          key === "ArrowRight" ||
          key === " "
        ) {
          this.keys.splice(this.keys.indexOf(key), 1);
        }
      });
      window.addEventListener("touchstart", () => {
        if (this.keys.indexOf(" ") === -1) {
          this.keys.push(" ");
        }
      });
      window.addEventListener("touchend", () => {
        this.keys.splice(this.keys.indexOf(" "), 1);
      });
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 200;
      this.height = 200;
      this.offsetY = 20;
      this.x = 150;
      this.y = this.gameHeight - this.height + this.offsetY;
      this.image = document.getElementById(avatar);
      this.frameX = 0;
      this.maxFrame = 20;
      this.frameY = 0;
      this.speed = 0;
      this.maxSpeed = 10;
      this.maxJumpSpeed = 20;
      this.vy = 0;
      this.weight = 1;
      this.fps = 50;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.collisionBox = {
        x: this.x + this.x * 0.3,
        y: this.y + this.y * 0.03,
        width: this.width - this.width * 0.72,
        height: this.height - this.height * 0.15,
      };
    }

    draw(context) {
      if (debug) {
        context.strokeStyle = "red";
        context.strokeRect(
          this.collisionBox.x,
          this.collisionBox.y,
          this.collisionBox.width,
          this.collisionBox.height
        );
      }
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(input, deltaTime, enemies) {
      // Collision detection
      enemies.forEach((enemy) => {
        if (
          this.collisionBox.x <
            enemy.collisionBox.x + enemy.collisionBox.width &&
          this.collisionBox.x + this.collisionBox.width >
            enemy.collisionBox.x &&
          this.collisionBox.y <
            enemy.collisionBox.y + enemy.collisionBox.height &&
          this.collisionBox.height + this.collisionBox.y > enemy.collisionBox.y
        ) {
          gameOver = true;
        }
      });

      // Sprite animation
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }

      // Controls
      if (input.keys.indexOf(" ") > -1 && this.onGround()) {
        this.vy -= this.maxJumpSpeed;
      } else {
        this.speed = 0;
      }
      // Horizontal movement
      this.x += this.speed;
      if (this.x < 0) this.x = 0;
      if (this.x > this.gameWidth - this.width) {
        this.x = this.gameWidth - this.width;
      }
      // Vertical movement
      this.y += this.vy;
      if (!this.onGround()) {
        this.vy += this.weight;
        this.frameY = 1;
      } else {
        this.vy = 0;
        this.frameY = 0;
      }
      if (this.y > this.gameHeight - this.height) {
        this.y = this.gameHeight - this.height + this.offsetY;
      }

      this.collisionBox = {
        x: this.x + this.x * 0.3,
        y: this.y + this.y * 0.03,
        width: this.width - this.width * 0.72,
        height: this.height - this.height * 0.15,
      };
    }

    onGround() {
      return this.y >= this.gameHeight - (this.height - this.offsetY);
    }
  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.image0 = document.getElementById("bg0");
      this.image1 = document.getElementById("bg1");
      this.image2 = document.getElementById("bg2");
      this.image3 = document.getElementById("bg3");

      this.x0 = 0;
      this.x1 = 0;
      this.x2 = 0;
      this.x3 = 0;
      this.y = 0;

      this.width = 3000;
      this.height = this.gameHeight;
      this.speed0 = gameSpeed / 8 / 8 / 8;
      this.speed1 = gameSpeed / 8 / 8;
      this.speed2 = gameSpeed / 8;
      this.speed3 = gameSpeed;
    }

    draw(context) {
      context.drawImage(this.image0, this.x0, this.y, this.width, this.height);
      context.drawImage(
        this.image0,
        this.x0 + this.width,
        this.y,
        this.width + this.speed0,
        this.height
      );
      context.drawImage(this.image1, this.x1, this.y, this.width, this.height);
      context.drawImage(
        this.image1,
        this.x1 + this.width,
        this.y,
        this.width + this.speed1,
        this.height
      );
      context.drawImage(
        this.image2,
        this.x2,
        this.y + 100,
        this.width,
        this.height
      );
      context.drawImage(
        this.image2,
        this.x2 + this.width,
        this.y + 100,
        this.width + this.speed2,
        this.height
      );
      context.drawImage(this.image3, this.x3, this.y, this.width, this.height);
      context.drawImage(
        this.image3,
        this.x3 + this.width,
        this.y,
        this.width + this.speed3,
        this.height
      );
    }
    update() {
      this.x0 -= this.speed0;
      if (this.x0 < 0 - this.width) this.x0 = 0;

      this.x1 -= this.speed1;
      if (this.x1 < 0 - this.width) this.x1 = 0;

      this.x2 -= this.speed2;
      if (this.x2 < 0 - this.width) this.x2 = 0;

      this.x3 -= this.speed3;
      if (this.x3 < 0 - this.width) this.x3 = 0;
    }
  }

  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 200;
      this.height = 200;
      this.image = document.getElementById("dog");
      this.x = this.gameWidth;
      this.offsetY = 20;
      this.y = this.gameHeight - this.height + this.offsetY;
      this.speed = gameSpeed;
      this.frameX = 0;
      this.maxFrame = 0;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.markedForDeletion = false;
      this.collisionBox = {
        x: this.x + 25,
        y: this.y + 40,
        width: this.width - 60,
        height: this.height - 50,
      };
    }

    draw(context) {
      if (debug) {
        context.strokeStyle = "red";
        context.strokeRect(
          this.collisionBox.x,
          this.collisionBox.y,
          this.collisionBox.width,
          this.collisionBox.height
        );
      }
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }

    update(deltaTime) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }
      this.x -= this.speed;
      if (this.x < 0 - this.width) {
        this.markedForDeletion = true;
        score++;
        scoreCount.innerHTML = score;
      }
      this.collisionBox = {
        x: this.x + 50,
        y: this.y + 80,
        width: this.width - 120,
        height: this.height - 100,
      };
    }
  }

  function handleEnemies(deltaTime) {
    if (enemyTimer > enemyInterval + randomEnemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      enemyTimer = 0;
      randomEnemyInterval = Math.random() * 1000 + 500;
    } else {
      enemyTimer += deltaTime;
    }
    enemies.forEach((enemy) => {
      enemy.draw(ctx);
      enemy.update(deltaTime);
    });

    enemies = enemies.filter((enemy) => !enemy.markedForDeletion);
  }

  function displayStatusText(context) {
    context.font = "40px helvetica";
    context.fillStyle = "black";
    context.fillText("Score: " + score, 20, 50);
    context.fillStyle = "white";
    context.fillText("Score: " + score, 22, 52);
  }

  let input;
  let player;
  let background;

  let lastTime;
  let enemyTimer;
  let enemyInterval;
  let randomEnemyInterval;
  let animationId;
  let lastFrameTime;

  function animate(timeStamp) {
    if (gameOver) {
      cancelAnimationFrame(animationId);
      gameOverMenu.classList.add("show");
      return;
    }
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    lastFrameTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.draw(ctx);
    background.update();
    player.draw(ctx);
    player.update(input, deltaTime, enemies);
    handleEnemies(deltaTime);
    displayStatusText(ctx);
    animationId = requestAnimationFrame(animate);
  }

  againButton.addEventListener("click", () => {
    enemies = [];
    gameOver = false;
    score = 0;
    input = new InputHandler();
    player = new Player(canvas.width, canvas.height);
    background = new Background(canvas.width, canvas.height);
    lastTime = 0;
    enemyTimer = 0;
    enemyInterval = 1000;
    randomEnemyInterval = Math.random() * 1000 + 500;
    lastFrameTime = 0;
    gameOverMenu.classList.remove("show");
    animate(0);
  });
  function setAvatar(name) {
    avatar = name;
    input = new InputHandler();
    player = new Player(canvas.width, canvas.height);
    background = new Background(canvas.width, canvas.height);

    lastTime = 0;
    enemyTimer = 0;
    enemyInterval = 1000;
    randomEnemyInterval = Math.random() * 1000 + 500;
    animationId;
    lastFrameTime = 0;
    mainMenu.classList.remove("show");
    animate(0);
  }

  document.getElementById("mc-btn").addEventListener("click", () => {
    setAvatar("mc");
  });

  document.getElementById("skater-btn").addEventListener("click", () => {
    setAvatar("skater");
  });

  document.getElementById("wizard-btn").addEventListener("click", () => {
    setAvatar("wizard");
  });
});