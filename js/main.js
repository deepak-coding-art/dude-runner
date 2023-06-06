window.addEventListener("load", function () {
  // Get the device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.getElementById("canvas0");
  const playMenu = document.getElementById("playMenu");
  // Buttons
  const mcButton = document.getElementById("mc-btn");
  const skaterButton = document.getElementById("skater-btn");
  const wizardButton = document.getElementById("wizard-btn");
  const againMc = document.getElementById("again-mc-btn");
  const againSkater = document.getElementById("again-skater-btn");
  const againWizard = document.getElementById("again-wizard-btn");
  const playBtn = document.getElementById("playBtn");
  const backToMainMenu = document.getElementById("quit-to-main-menu");
  const menuToMain = document.getElementById("menu-to-mainMenu");
  const goLeaderBoard = document.getElementById("go-to-leader");
  const leaderToMain = document.getElementById("leader-board-to-main");
  const dailyScores = document.getElementById("daily-timeline");
  const weeklyScores = document.getElementById("weekly-timeline");
  const monthlyScores = document.getElementById("monthly-timeline");
  const muteButton = document.getElementById("muteButton");
  // Options
  const scoreSortSelections = [dailyScores, weeklyScores, monthlyScores];
  // Audios
  const startAudio = document.getElementById("start-audio");
  const middleAudio = document.getElementById("middle-audio");
  const endAudio = document.getElementById("end-audio");
  const introVideo = document.getElementById("introVid");
  const coinCollectAudio = document.getElementById("coin-collect-audio");
  const hitBonkAudio = document.getElementById("hit-bonk-audio");
  const jumpAAudio = document.getElementById("jump-a-audio");
  const jumpCAudio = document.getElementById("jump-c-audio");
  const pointBoostAudio = document.getElementById("point-boost-audio");
  // Forms
  const usernameForm = document.getElementById("getUsername");
  // Screens
  const gameOverMenu = document.getElementById("gameOverMenu");
  const scoreCount = document.getElementById("score");
  const coinElement = document.getElementById("coinElement");
  const mainMenu = document.getElementById("mainMenu");
  const leaderBoard = document.getElementById("leader-board");
  const ranksElement = document.getElementById("ranks");
  const mutedIcon = document.getElementById("muteIcon");
  const notMutedIcon = document.getElementById("notMuteIcon");
  const getUsernameCont = document.getElementById("getUsernameCont");
  // Canvas setup
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const apiBaseEndpoint = "https://owlies-core.herokuapp.com/api";
  const numberOfRanksShown = 10;
  // Init variables
  let highScore = localStorage.getItem("highScore") || 0;
  let coinScoreIncenseFactor = 50;
  let gameSpeed = 14;
  let avatar = "mc";
  let gameOver = false;
  let enemies = [];
  let coins = [];
  let score = 0;
  let input;
  let player;
  let background;
  let lastTime;
  let enemyTimer;
  let enemyInterval;
  let coinTimer;
  let coinInterval;
  let randomCoinInterval;
  let randomEnemyInterval;
  let animationId;
  let lastFrameTime;
  let scoreCounter;
  let coinCount;
  let coinHit;
  let scoreAnimating;
  let dynamicFont;
  let interval;
  let scoreHolt;
  let activeSelect = 0;
  let loadingInterval;
  let muted = localStorage.getItem("muted") || false;
  if (muted === "true") {
    muted = true;
  } else if (muted === "false") {
    muted = false;
  }

  updateMute();
  // Debug
  const debug = false;
  const debugGameOver = false;
  const debugRun = false;
  const debugSpeed = null;

  // Utils
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function randomNumberGen(min, max) {
    // min and max included
    return Math.random() * (max - min) + min;
  }

  function getRandomIntInRange(min, max) {
    // Ensure min and max are integers
    min = Math.ceil(min);
    max = Math.floor(max);
    // Generate random integer within the range (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getObstacleInterval(gameSpeed) {
    const minInterval = 1000;
    let obstacleInterval = (1 / gameSpeed) * 25000;
    obstacleInterval = Math.max(obstacleInterval, minInterval);
    if (obstacleInterval <= 1000) {
      obstacleInterval = getRandomIntInRange(500, obstacleInterval);
    }
    return obstacleInterval;
  }

  function circleRectCollision(
    circleX,
    circleY,
    circleRadius,
    rectX,
    rectY,
    rectWidth,
    rectHeight
  ) {
    // Calculate the distance between the center of the circle and the closest point on the rectangle
    let distX = Math.abs(circleX - rectX - rectWidth / 2);
    let distY = Math.abs(circleY - rectY - rectHeight / 2);

    // If the distance is greater than the sum of the radius and half the rectangle's width or height, there is no collision
    if (
      distX > rectWidth / 2 + circleRadius ||
      distY > rectHeight / 2 + circleRadius
    ) {
      return false;
    }

    // If the distance is less than or equal to the radius of the circle, check if the closest point on the rectangle is inside the circle
    if (distX <= rectWidth / 2 || distY <= rectHeight / 2) {
      return true;
    }

    // Check if the closest point on the rectangle is inside the circle
    let dx = distX - rectWidth / 2;
    let dy = distY - rectHeight / 2;
    return dx * dx + dy * dy <= circleRadius * circleRadius;
  }

  function fixEnemyCoinOverlap(enemies, coins) {
    enemies.forEach((enemy) => {
      coins.forEach((coin) => {
        if (
          coin.collisionBox.x <
            enemy.collisionBox.x + enemy.collisionBox.width &&
          coin.collisionBox.x + coin.collisionBox.width > enemy.collisionBox.x
        ) {
          coin.x = getRandomIntInRange(coin.x + 250, coin.x + 500);
        }
      });
    });
  }

  function updateMute() {
    if (muted) {
      mutedIcon.classList.add("showIcon");
      notMutedIcon.classList.remove("showIcon");
    } else {
      mutedIcon.classList.remove("showIcon");
      notMutedIcon.classList.add("showIcon");
    }
    startAudio.pause();
    startAudio.currentTime = 0;
    middleAudio.pause();
    middleAudio.currentTime = 0;
    endAudio.pause();
    endAudio.currentTime = 0;
  }

  // dates
  async function checkUpdates() {
    const { data } = await getSingleUser(getUsername());
    const userData = data[0];
    const updated_at = new Date(userData.updated_at);
    const isToday = isBeforeOrAfterToday(updated_at);
    const isThisWeek = isBeforeOrInCurrentWeek(updated_at);
    const isThisMonth = isBeforeOrInCurrentMonth(updated_at);
    const { total_score } = userData;
    return { isToday, isThisWeek, isThisMonth, total_score };
  }

  function checkUpdatesUserData(userData) {
    const updated_at = new Date(userData.updated_at);
    const isToday = isBeforeOrAfterToday(updated_at);
    const isThisWeek = isBeforeOrInCurrentWeek(updated_at);
    const isThisMonth = isBeforeOrInCurrentMonth(updated_at);
    const { total_score } = userData;
    return { isToday, isThisWeek, isThisMonth, total_score };
  }

  function isBeforeOrAfterToday(date) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set today's time to 0:00 AM GMT
    return date < today ? false : true;
  }

  function isBeforeOrInCurrentWeek(date) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setUTCHours(0, 0, 0, 0); // Set start of the week to 0:00 AM GMT on Sunday
    startOfWeek.setDate(today.getDate() - today.getUTCDay()); // Set to the previous Sunday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // Set to the next Sunday

    return date < startOfWeek
      ? false
      : date >= startOfWeek && date < endOfWeek
      ? true
      : true;
  }

  function isBeforeOrInCurrentMonth(date) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setUTCHours(23, 59, 59, 999); // Set end of the month to 23:59:59.999 PM GMT

    return date < startOfMonth
      ? false
      : date >= startOfMonth && date <= endOfMonth
      ? true
      : true;
  }

  function initGame(name, restart = false) {
    // Shared Code
    endAudio.pause();
    endAudio.currentTime = 0;
    muteButton.classList.add("hide");

    avatar = name;
    input = new InputHandler();
    player = new Player(canvas.width, canvas.height);
    background = new Background(canvas.width, canvas.height);
    muted = localStorage.getItem("muted") || false;
    if (muted === "true") {
      muted = true;
    } else if (muted === "false") {
      muted = false;
    }

    updateMute();

    if (!debug && !muted) {
      startAudio.play();
    }

    score = 0;
    coinCount = 0;

    lastTime = 0;
    enemyTimer = 0;
    enemyInterval = 100;
    randomEnemyInterval = Math.random() * 1000 + 500;
    lastFrameTime = 0;
    scoreCounter = 0;
    coinTimer = 0;
    coinInterval = 100;
    randomCoinInterval = Math.random() * 1000 + 500;
    coinHit = false;
    scoreAnimating = false;
    dynamicFont = "40px helvetica";
    interval = null;
    scoreHolt = null;

    gameSpeed = debugSpeed || 14;
    enemies = [];
    coins = [];

    gameOver = false;
    if (restart) {
      // Restart code
      gameOverMenu.classList.remove("show");
    } else {
      // Firs start code
      playMenu.classList.remove("show");
    }

    animate(0);
  }

  const againFunction = (name) => {
    initGame(name, true);
  };

  function getUsername() {
    const username = localStorage.getItem("username");
    if (username) {
      return username;
    } else {
      return null;
    }
  }

  function saveUsername(username) {
    localStorage.setItem("username", username);
  }

  function setAvatar(name) {
    canvas.style.border = "solid 5px var(--border-white);";
    initGame(name, false);
  }

  async function fetchScores() {
    clearInterval(loadingInterval);
    ranksElement.innerHTML = `<div class="loading" id="ranksLoading">Loading.</div>`;
    loadingInterval = setInterval(() => {
      const element = document.getElementById("ranksLoading");
      const loadingText = element.innerHTML;
      if (loadingText.length < 10) {
        element.innerHTML = loadingText + ".";
      } else {
        element.innerHTML = "Loading";
      }
    }, 500);
    const results = await getAllScores();
    // console.log(results);
    clearInterval(loadingInterval);
    if (results.error) {
      ranksElement.innerHTML = `<div class="no-data" id="ranksLoading">No Data</div>`;
    } else {
      let activeScoreField;
      if (activeSelect === 0) {
        activeScoreField = "daily_score";
      } else if (activeSelect === 1) {
        activeScoreField = "weekly_score";
      } else if (activeSelect === 2) {
        activeScoreField = "monthly_score";
      }
      ranksElement.innerHTML = "";
      const newResults = results.data;
      const username = localStorage.getItem("username") || undefined;
      // Sort newResults by high_score
      newResults.sort((a, b) => b[activeScoreField] - a[activeScoreField]);
      const newFreshResults = [];
      newResults.every((result) => {
        if (newFreshResults.length >= numberOfRanksShown) {
          return false;
        }
        if (activeScoreField === "daily_score") {
          const { isToday } = checkUpdatesUserData(result);
          if (isToday) {
            newFreshResults.push(result);
          }
        } else if (activeScoreField === "weekly_score") {
          const { isThisWeek } = checkUpdatesUserData(result);
          if (isThisWeek) {
            newFreshResults.push(result);
          }
        } else if (activeScoreField === "monthly_score") {
          const { isThisMonth } = checkUpdatesUserData(result);
          if (isThisMonth) {
            newFreshResults.push(result);
          }
        }
        return true;
      });
      const rank = document.createElement("div");
      rank.classList.add("rank");

      rank.innerHTML = `
      <h3 class="block">Rank</h3>
      <h4 class="block">Name</h4>
      <h4 class="block">Score</h4>
  `;
      ranksElement.appendChild(rank);

      newFreshResults.forEach((result, index) => {
        `<div class="rank">
            <h3 class="block">Rank</h3>
            <h4 class="block">Name</h4>
            <h4 class="block">Score</h4>
          </div>`;
        const rank = document.createElement("div");
        rank.classList.add("rank");
        rank.innerHTML = `<h3 class="block">${index + 1}</h3>
          <h4 class="block">${result.name} ${
          result.name === username ? "(You)" : ""
        }
            </h4>
            <h4 class="block">${result[activeScoreField] || 0}</h4>`;
        ranksElement.appendChild(rank);
      });
    }
  }

  async function initSaveScore() {
    username = getUsername();
    if (!username) {
      getUsernameCont.classList.remove("hide");
    } else {
      let { isToday, isThisWeek, isThisMonth, total_score } = checkUpdates();
      let daily_score, weekly_score, monthly_score;
      if (isToday) {
        daily_score += score;
      } else {
        daily_score = score;
      }

      if (isThisWeek) {
        weekly_score += score;
      } else {
        weekly_score = score;
      }

      if (isThisMonth) {
        monthly_score += score;
      } else {
        monthly_score = score;
      }

      total_score += score;

      gameOverMenu.classList.add("show");
      muteButton.classList.remove("hide");
      const response = await updateScore({
        name: username,
        high_score: highScore,
        score,
        daily_score,
        weekly_score,
        monthly_score,
        total_score,
        daily_reset_time: "0:00 UTC",
      });
    }
  }

  // Classes
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
      this.weight = 1.2;
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

    update(input, deltaTime, enemies, coins) {
      // Collision detection
      // Enemies
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
          if (!debugGameOver) {
            gameOver = true;
          }
        }

        if (
          this.collisionBox.x > enemy.collisionBox.x - 10 &&
          !this.onGround()
        ) {
          if (!debug && !muted) {
            hitBonkAudio.play();
          }
          enemy.maxFrame = 20;
        }

        if (
          this.collisionBox.x > enemy.collisionBox.x - 100 &&
          !this.onGround()
        ) {
          // this.frameY = 2;
        }
      });
      // Coins
      const collisionIndexes = [];
      coins.forEach((coin, index) => {
        const collide = circleRectCollision(
          coin.collisionBox.x,
          coin.collisionBox.y,
          coin.collisionBox.radius,
          this.collisionBox.x,
          this.collisionBox.y,
          this.collisionBox.width,
          this.collisionBox.height
        );
        if (collide) {
          collisionIndexes.push(index);
          score += coinScoreIncenseFactor;
          coinCount++;
          coinElement.innerHTML = coinCount;
          coinHit = true;
          if (!debug && !muted) {
            coinCollectAudio.pause();
            coinCollectAudio.currentTime = 0;
            coinCollectAudio.play();

            pointBoostAudio.pause();
            pointBoostAudio.currentTime = 0;
            pointBoostAudio.play();
          }
        }
      });

      collisionIndexes.forEach((collision) => {
        coins.splice(collision, 1);
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
        if (!debug && !muted) {
          if (avatar === "skater") {
            jumpCAudio.play();
          } else {
            jumpAAudio.play();
          }
        }
        this.frameX = 0;
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
        x: this.x + this.x * 0.48,
        y: this.y + this.y * 0.03,
        width: this.width - this.width * 0.85,
        height: this.height - this.height * 0.25,
      };

      if (score % 100 === 0 && score !== 0) {
        if (!debug && !muted) {
          pointBoostAudio.play();
        }
      }
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
      context.drawImage(
        this.image1,
        this.x1,
        this.y + 100,
        this.width,
        this.height
      );
      context.drawImage(
        this.image1,
        this.x1 + this.width,
        this.y + 100,
        this.width + this.speed1,
        this.height
      );
      context.drawImage(
        this.image2,
        this.x2,
        this.y + 200,
        this.width,
        this.height
      );
      context.drawImage(
        this.image2,
        this.x2 + this.width,
        this.y + 200,
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

      this.speed0 = gameSpeed / 8 / 8 / 8;
      this.speed1 = gameSpeed / 8 / 8;
      this.speed2 = gameSpeed / 8;
      this.speed3 = gameSpeed;
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
    constructor(gameWidth, gameHeight, size = 1, number = 0) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.size = size;
      this.width = 200;
      this.height = 200;
      this.image = document.getElementById("dog");
      this.x = this.gameWidth + number;
      this.offsetY = 20;
      this.y = this.gameHeight - this.height * this.size + this.offsetY;
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
        this.width * this.size,
        this.height * this.size
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

        // Increase speed
        gameSpeed += Math.pow(0.9, gameSpeed);
        if (gameSpeed > 25) gameSpeed = 25;
      }
      this.collisionBox = {
        x: this.x + 68 * this.size,
        y: this.y + 90 * this.size,
        width: this.width - 130 / this.size,
        height: this.height - 100 / this.size,
      };

      this.speed = gameSpeed;
    }
  }

  class Coin {
    constructor(gameWidth, gameHeight, size = 1, number = 0) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.size = size;
      this.width = 200;
      this.height = 200;
      this.image = document.getElementById("coin");
      this.x = this.gameWidth + number;
      this.offsetY = -10;
      this.y = this.gameHeight - this.height * this.size + this.offsetY;
      this.speed = gameSpeed;
      this.frameX = 0;
      this.maxFrame = 0;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.markedForDeletion = false;
      this.collisionBox = {
        x: this.x,
        y: this.y,
        width: this.width * this.size,
        height: this.height * this.size,
        radius: (this.width * this.size) / 2,
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
      context.beginPath();
      context.arc(
        this.x + this.collisionBox.width / 2,
        this.y + this.collisionBox.height / 2,
        this.collisionBox.width / 2,
        0,
        Math.PI * 2
      );
      context.stroke();
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width * this.size,
        this.height * this.size
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

        // Increase speed
        gameSpeed += Math.pow(0.9, gameSpeed);
        if (gameSpeed > 25) gameSpeed = 25;
      }
      this.collisionBox = {
        x: this.x,
        y: this.y,
        width: this.width * this.size,
        height: this.height * this.size,
        radius: (this.width * this.size) / 2,
      };
      this.speed = gameSpeed;
    }
  }

  // Game functions
  function handleObjects(deltaTime) {
    // enemy
    if (enemyTimer > enemyInterval + randomEnemyInterval) {
      let random = Math.ceil(randomNumberGen(0, 2));
      let size = randomNumberGen(1.2, 0.8);
      let distance = 0;
      enemies.push(new Enemy(canvas.width, canvas.height, size, distance));
      if (random > 1) {
        for (let i = 0; i <= random - 1; i++) {
          size = randomNumberGen(1.2, 0.8);
          distance = (enemies.at(-1).width * enemies.at(-1).size) / 2;
          if (i > 0) {
            continue;
          }
          enemies.push(new Enemy(canvas.width, canvas.height, size, distance));
        }
      }

      enemyTimer = 0;
      randomEnemyInterval = getObstacleInterval(gameSpeed);
    } else {
      enemyTimer += deltaTime;
    }
    if (scoreCounter > 5) {
      score++;
      scoreCount.innerHTML = score;
      scoreCounter = 0;
    } else {
      scoreCounter++;
    }
    enemies.forEach((enemy) => {
      enemy.draw(ctx);
      enemy.update(deltaTime);
    });

    enemies = enemies.filter((enemy) => !enemy.markedForDeletion);

    // Coins
    if (coinTimer > coinInterval + randomCoinInterval) {
      const randomHeight = randomNumberGen(0, 0.25);
      coins.push(
        new Coin(
          canvas.width,
          canvas.height - canvas.height * randomHeight,
          0.25,
          0
        )
      );

      coinTimer = 0;
      randomCoinInterval = getObstacleInterval(
        gameSpeed * randomNumberGen(1, 2)
      );
    } else {
      coinTimer += deltaTime;
    }

    fixEnemyCoinOverlap(enemies, coins);
    coins.forEach((coin) => {
      coin.draw(ctx);
      coin.update(deltaTime);
    });

    coins = coins.filter((coin) => !coin.markedForDeletion);
  }

  function displayStatusText(context) {
    context.font = "40px helvetica";
    context.fillStyle = "black";
    context.fillText("High Score: " + highScore, 20, 50);
    context.fillStyle = "white";
    context.fillText("High Score: " + highScore, 22, 52);
    context.fillStyle = "black";
    context.fillText("Score: ", 20, 100);
    context.fillStyle = "white";
    context.fillText("Score: ", 22, 102);
    if (coinHit) {
      dynamicFont = "50px helvetica";
      scoreAnimating = true;
      coinHit = false;
      scoreHolt = score;
      setTimeout(() => {
        dynamicFont = "40px helvetica";
        scoreHolt = null;
      }, 400);
    } else if (!scoreAnimating) {
      context.font = "40px helvetica";
    } else {
      context.font = dynamicFont;
    }
    context.fillStyle = "black";
    context.fillText(scoreHolt ? scoreHolt : score, 150, 100);
    context.fillStyle = "white";
    context.fillText(scoreHolt ? scoreHolt : score, 150, 102);

    // Coins
    // context.fillStyle = "black";
    // context.fillText("Coins: " + coinCount, 20, 130);
    // context.fillStyle = "white";
    // context.fillText("Coins: " + coinCount, 22, 132);
  }

  // Main loop
  function animate(timeStamp) {
    if (gameOver) {
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
      }
      cancelAnimationFrame(animationId);

      startAudio.pause();
      startAudio.currentTime = 0;
      middleAudio.pause();
      middleAudio.currentTime = 0;
      initSaveScore();
      if (!debug && !muted) {
        endAudio.play();
      }

      return;
    }
    const deltaTime = timeStamp - lastTime;
    if (deltaTime > 16) {
      lastTime = timeStamp;
      lastFrameTime = timeStamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      background.draw(ctx);
      background.update();
      player.draw(ctx);
      player.update(input, deltaTime, enemies, coins);
      handleObjects(deltaTime);
      displayStatusText(ctx);
    }
    animationId = requestAnimationFrame(animate);
  }

  // Database Api calls
  async function getAllScores() {
    try {
      const endPoint = "https://owlies-core.herokuapp.com/api/game/allPlayers";
      const response = await fetch(endPoint);
      const data = await response.json();
      return data;
    } catch (err) {
      console.log(err);
      return { error: err };
    }
  }

  // let data = qs.stringify({
  //   name: "lakmal344",
  //   high_score: "",
  //   score: "",
  //   daily_score: "",
  //   weekly_score: "",
  //   monthly_score: "",
  //   total_score: "",
  //   daily_reset_time: "",
  // });

  // let config = {
  //   method: "post",
  //   maxBodyLength: Infinity,
  //   url: "http://localhost:3000/api/game/addNewPlayer",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  //   data: data,
  // };

  // axios
  //   .request(config)
  //   .then((response) => {
  //     console.log(JSON.stringify(response.data));
  //   })
  //   .catch((error) => {
  //     console.log(error);
  //   });

  async function saveScore(data = {}) {
    try {
      const endPoint = apiBaseEndpoint + "/game/addNewPlayer";
      const response = await fetch(endPoint, {
        method: "POST",
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(error);
      return { error };
    }
  }

  async function updateScore(data = {}) {
    try {
      const endPoint = apiBaseEndpoint + "/game/updatePlayer";
      const response = await fetch(endPoint, {
        method: "POST",
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(error);
      return { error };
    }
  }

  async function getSingleUser(username) {
    try {
      const data = { name: username };
      const endPoint = apiBaseEndpoint + "/game/singlePlayer";
      const response = await fetch(endPoint, {
        method: "POST",
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(error);
      return { error };
    }
  }

  // Controls
  mcButton.addEventListener("click", () => {
    setAvatar("mc");
  });

  skaterButton.addEventListener("click", () => {
    setAvatar("skater");
  });

  wizardButton.addEventListener("click", () => {
    setAvatar("wizard");
  });

  againMc.addEventListener("click", () => {
    againFunction("mc");
  });

  againSkater.addEventListener("click", () => {
    againFunction("skater");
  });

  againWizard.addEventListener("click", () => {
    againFunction("wizard");
  });

  playBtn.addEventListener("click", () => {
    mainMenu.classList.remove("show");
    playMenu.classList.add("show");
    introVideo.classList.add("hide");
  });

  goLeaderBoard.addEventListener("click", () => {
    mainMenu.classList.remove("show");
    leaderBoard.classList.add("show");
    fetchScores();
  });

  backToMainMenu.addEventListener("click", () => {
    location.reload();
  });

  menuToMain.addEventListener("click", () => {
    mainMenu.classList.add("show");
    playMenu.classList.remove("show");
    introVideo.classList.remove("hide");
  });

  leaderToMain.addEventListener("click", () => {
    mainMenu.classList.add("show");
    leaderBoard.classList.remove("show");
  });
  muteButton.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem("muted", muted);
    updateMute();
  });

  usernameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerHTML = "";
    const usernameField = document.getElementById("usernameField");
    const username = usernameField.value;
    if (username.length < 3) {
      errorMessage.innerHTML = "Username must be at least 3 characters long";
      return;
    }
    const response = await saveScore({
      name: username,
      high_score: highScore,
      score,
      daily_score: score,
      weekly_score: score,
      monthly_score: score,
      total_score: highScore,
      daily_reset_time: "0:00 UTC",
    });

    if (response.error) {
      errorMessage.innerHTML = response.message;
      return;
    }
    saveUsername(username);

    let { isToday, isThisWeek, isThisMonth, total_score } = checkUpdates();
    let daily_score, weekly_score, monthly_score;
    if (isToday) {
      daily_score += score;
    } else {
      daily_score = score;
    }

    if (isThisWeek) {
      weekly_score += score;
    } else {
      weekly_score = score;
    }

    if (isThisMonth) {
      monthly_score += score;
    } else {
      monthly_score = score;
    }

    total_score += score;
    const newResponse = await updateScore({
      name: username,
      high_score: highScore,
      score,
      daily_score,
      weekly_score,
      monthly_score,
      total_score,
      daily_reset_time: "0:00 UTC",
    });

    gameOverMenu.classList.add("show");
    muteButton.classList.remove("hide");
    getUsernameCont.classList.add("hide");
  });

  scoreSortSelections.forEach((selection, selectionIndex) => {
    selection.addEventListener("click", () => {
      scoreSortSelections.forEach((selectionNode, selectionNodeIndex) => {
        if (selectionIndex === selectionNodeIndex) {
          selectionNode.classList.add("active");
          if (activeSelect === selectionNodeIndex) return;
          activeSelect = selectionNodeIndex;
          fetchScores();
          return;
        }
        selectionNode.classList.remove("active");
      });
    });
  });

  // Audio events
  startAudio.addEventListener("ended", () => {
    middleAudio.play();
  });

  middleAudio.addEventListener("ended", function () {
    middleAudio.currentTime = 0;
    middleAudio.play();
  });

  introVideo.addEventListener("ended", () => {
    mainMenu.classList.add("show");
  });

  if (debugRun) {
    mainMenu.classList.remove("show");
    initGame("mc");
  }

  // getAllScores();
});
