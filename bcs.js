class BallCollisionSimulator {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.balls = [];
    this.animationId = null;
    this.colors = options.colors || ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    this.killFeed = [];
    this.onKill = null;
    
    this.initialBallCount = 0;
    this.shrinkIntervals = [];
    this.currentShrinkStage = 0;
    this.maxShrinkStages = 5;

    this.knife = {
      img: options.knifeImage || null,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      available: true,
    };

    this.heart = {
      img: options.heartImage || null,
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      available: true,
    };

    this.box = {
      x: 20,
      y: 20,
      width: canvas.width - 40,
      height: canvas.height - 40
    };

    this.defaultBallConfig = {
      radius: 60,
      mass: 6,
      x: null,
      y: null,
      vx: 0,
      vy: 0,
      color: null,
      hasKnife: false,
      firstmass: 6,
      firstradius: 60
    };

    this.originalBoxSize = {
      width: this.box.width,
      height: this.box.height
    };

    this._setupCanvas();
    this.placeKnifeRandomly();
    this.placeHeartRandomly();
  }
  
  _setupCanvas() {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawBox();
  }

  _drawBox() {
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.box.x, this.box.y, this.box.width, this.box.height);
  }

  placeKnifeRandomly() {
    if (!this.knife.img) return;

    this.knife.x = Math.random() * (this.box.width - this.knife.width) + this.box.x;
    this.knife.y = Math.random() * (this.box.height - this.knife.height) + this.box.y;
    this.knife.available = true;
  }

  placeHeartRandomly() {
    if (!this.heart.img) return;

    this.heart.x = Math.random() * (this.box.width - this.heart.width) + this.box.x;
    this.heart.y = Math.random() * (this.box.height - this.heart.height) + this.box.y;
    this.heart.available = true;
  }

  _drawKnife() {
    if (!this.knife.img || !this.knife.available) return;

    this.ctx.drawImage(
      this.knife.img,
      this.knife.x,
      this.knife.y,
      this.knife.width,
      this.knife.height
    );
  }

  _drawHeart() {
    if (!this.heart.img || !this.heart.available) return;

    this.ctx.drawImage(
      this.heart.img,
      this.heart.x,
      this.heart.y,
      this.heart.width,
      this.heart.height
    );
  }

  _checkToolCollision() {
    this._checkKnifeCollision();
    this._checkHeartCollision();
  }

  _checkKnifeCollision() {
    if (!this.knife.available || !this.knife.img) return;

    for (const ball of this.balls) {
      const kX = Math.max(this.knife.x, Math.min(ball.x, this.knife.x + this.knife.width));
      const kY = Math.max(this.knife.y, Math.min(ball.y, this.knife.y + this.knife.height));
      const distkX = ball.x - kX;
      const distkY = ball.y - kY;
      const distancek = Math.sqrt(distkX * distkX + distkY * distkY);

      if (distancek <= ball.radius) {
        ball.hasKnife = true;
        this.knife.available = false;
        this.placeKnifeRandomly();
      }
    }
  }

  _checkHeartCollision() {
    if (!this.heart.available || !this.heart.img) return;

    for (const ball of this.balls) {
      const hX = Math.max(this.heart.x, Math.min(ball.x, this.heart.x + this.heart.width));
      const hY = Math.max(this.heart.y, Math.min(ball.y, this.heart.y + this.heart.height));
      const disthX = ball.x - hX;
      const disthY = ball.y - hY;
      const distanceh = Math.sqrt(disthX * disthX + disthY * disthY);

      if (distanceh <= ball.radius) {
        ball.mass = Math.min(ball.mass + 1, ball.firstmass);
        ball.radius = Math.min(ball.radius + 10, ball.firstradius);
        this.heart.available = false;
        setTimeout(() => {
          this.placeHeartRandomly();
        }, 5000);
        break;
      }
    }
  }

  addBalls(count) {
    this.balls = [];
    this.killCounts = {};
    
    for (let i = 0; i < count; i++) {
      const color = this.colors[i % this.colors.length];
      const id = i + 1;
      
      const ball = {
        ...this.defaultBallConfig,
        id,
        color,
        x: Math.random() * (this.box.width - 2 * this.defaultBallConfig.radius) + this.box.x + this.defaultBallConfig.radius,
        y: Math.random() * (this.box.height - 2 * this.defaultBallConfig.radius) + this.box.y + this.defaultBallConfig.radius,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        firstmass: this.defaultBallConfig.mass,
        firstradius: this.defaultBallConfig.radius
      };
      
      this.balls.push(ball);
      this.killCounts[id] = 0;
    }
    
    this.initialBallCount = count;
    this.currentShrinkStage = 0;
  }

  removeBall(id) {
    this.balls = this.balls.filter(ball => ball.id !== id);
  }

  getBalls() {
    return [...this.balls];
  }

  getBall(id) {
    return this.balls.find(ball => ball.id === id) || null;
  }

  updateBall(id, updates) {
    const ball = this.getBall(id);
    if (ball) {
      Object.assign(ball, updates);
    }
  }

  clearBalls() {
    this.balls = [];
  }

  reset() {
    this.clearBalls();
    this._setupCanvas();
    this.placeKnifeRandomly();
    this.placeHeartRandomly();
    this.currentShrinkStage = 0;
    this.killCounts = {};
  }

  _drawBalls() {
    this.balls.forEach(ball => {
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = ball.color;
      this.ctx.fill();
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(ball.id.toString(), ball.x, ball.y);

      if (ball.hasKnife && this.knife.img) {
        const knifeSize = ball.radius * 1.2;
        this.ctx.drawImage(
          this.knife.img,
          ball.x + ball.radius * 0.2,
          ball.y - knifeSize / 2,
          knifeSize,
          knifeSize
        );
      }
    });
  }

  _updateBalls() {
    this.balls.forEach(ball => {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.radius < this.box.x) {
        ball.x = this.box.x + ball.radius;
        ball.vx = -ball.vx;
      }
      if (ball.x + ball.radius > this.box.x + this.box.width) {
        ball.x = this.box.x + this.box.width - ball.radius;
        ball.vx = -ball.vx;
      }
      if (ball.y - ball.radius < this.box.y) {
        ball.y = this.box.y + ball.radius;
        ball.vy = -ball.vy;
      }
      if (ball.y + ball.radius > this.box.y + this.box.height) {
        ball.y = this.box.y + this.box.height - ball.radius;
        ball.vy = -ball.vy;
      }
    });

    this._detectBallCollisions();
  }

  _detectBallCollisions() {
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const ball1 = this.balls[i];
        const ball2 = this.balls[j];

        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball1.radius + ball2.radius) {
          this._handleKnifeEffect(ball1, ball2);

          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);

          const vx1Rotated = ball1.vx * cos + ball1.vy * sin;
          const vy1Rotated = ball1.vy * cos - ball1.vx * sin;
          const vx2Rotated = ball2.vx * cos + ball2.vy * sin;
          const vy2Rotated = ball2.vy * cos - ball2.vx * sin;

          const vx1RotatedAfter = ((ball1.mass - ball2.mass) * vx1Rotated + 2 * ball2.mass * vx2Rotated) /
            (ball1.mass + ball2.mass);
          const vx2RotatedAfter = ((ball2.mass - ball1.mass) * vx2Rotated + 2 * ball1.mass * vx1Rotated) /
            (ball1.mass + ball2.mass);

          ball1.vx = vx1RotatedAfter * cos - vy1Rotated * sin;
          ball1.vy = vy1Rotated * cos + vx1RotatedAfter * sin;
          ball2.vx = vx2RotatedAfter * cos - vy2Rotated * sin;
          ball2.vy = vy2Rotated * cos + vx2RotatedAfter * sin;

          const overlap = (ball1.radius + ball2.radius - distance) / 2;
          ball1.x -= overlap * Math.cos(angle);
          ball1.y -= overlap * Math.sin(angle);
          ball2.x += overlap * Math.cos(angle);
          ball2.y += overlap * Math.sin(angle);
        }
      }
    }
  }

  _handleKnifeEffect(ball1, ball2) {
    if (ball1.hasKnife && !ball2.hasKnife) {
      ball2.mass = Math.max(0, ball2.mass - 1);
      ball2.radius = Math.max(0, ball2.radius - 10);
      ball2.lastHitBy = ball1.id;
      ball1.hasKnife = false;
    }
    else if (ball2.hasKnife && !ball1.hasKnife) {
      ball1.mass = Math.max(0, ball1.mass - 1);
      ball1.radius = Math.max(0, ball1.radius - 10);
      ball1.lastHitBy = ball2.id;
      ball2.hasKnife = false;
    }
    else if (ball1.hasKnife && ball2.hasKnife) {
      ball1.hasKnife = false;
      ball2.hasKnife = false;
    }
  }

  _checkBallDie() {
    for (let i = 0; i < this.balls.length; i++) {
      if (this.balls[i].radius <= 0) {
        const deadBall = this.balls[i];
        let killer = null;
        if (deadBall.lastHitBy) {
          killer = this.getBall(deadBall.lastHitBy);
        }

        if (killer) {
          this.killFeed.push({
            killerId: killer.id,
            killerColor: killer.color,
            victimId: deadBall.id,
            victimColor: deadBall.color,
            time: new Date()
          });

          this.killCounts[killer.id] = (this.killCounts[killer.id] || 0) + 1;

          if (this.onKill) {
            this.onKill({
              killerId: killer.id,
              killerColor: killer.color,
              victimId: deadBall.id,
              victimColor: deadBall.color,
              ballsNumber: this.balls.length - 1,
              killCounts: this.killCounts
            });
          }
        }

        this.balls.splice(i, 1);
        i--;
        
        this._checkShrinkCircle();
      }
    }
  }
  
  _checkShrinkCircle() {
    if (this.initialBallCount <= 0) return;
    
    const remainingBalls = this.balls.length;
    const shrinkThreshold = Math.ceil(this.initialBallCount * (1 - (this.currentShrinkStage + 1) / this.maxShrinkStages));
    
    if (remainingBalls <= shrinkThreshold && this.currentShrinkStage < this.maxShrinkStages) {
      this.currentShrinkStage++;
      this._shrinkBox();
    }
    
    if (remainingBalls === 1 && this.balls.length > 0) {
      const winner = this.balls[0];
      const killCount = this.killCounts[winner.id] || 0;
      
      setTimeout(() => {
        alert(`游戏结束！\n\n获胜者：小球 #${winner.id}\n剩余血量：${winner.mass}\n击杀数：${killCount}`);
      }, 500);
    }
  }
  
  _shrinkBox() {
    const shrinkRatio = 0.8;
    const centerX = this.box.x + this.box.width / 2;
    const centerY = this.box.y + this.box.height / 2;
    
    this.box.width *= shrinkRatio;
    this.box.height *= shrinkRatio;
    this.box.x = centerX - this.box.width / 2;
    this.box.y = centerY - this.box.height / 2;
    
    this.placeKnifeRandomly();
    this.placeHeartRandomly();
  }

  _animate() {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawBox();
    this._updateBalls();
    this._checkToolCollision();
    this._drawKnife();
    this._drawHeart();
    this._drawBalls();
    this._checkBallDie();

    this.animationId = requestAnimationFrame(() => this._animate());
  }

  start() {
    if (!this.animationId && this.balls.length > 0) {
      this._animate();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  setBoxBoundary(x, y, width, height) {
    this.box = { x, y, width, height };
  }

  setKnifeImage(img) {
    this.knife.img = img;
    this.placeKnifeRandomly();
  }

  setHeartImage(img) {
    this.heart.img = img;
    this.placeHeartRandomly();
  }

  reduceBoxSize(way, size) {
    const centerX = this.box.x + this.box.width / 2;
    const centerY = this.box.y + this.box.height / 2;

    const newWidth = way === "hori" || way === "box" ? this.box.width - size : this.box.width;
    const newHeight = way === "vert" || way === "box" ? this.box.height - size : this.box.height;

    const minSize = 100;
    if (newWidth > minSize && newHeight > minSize) {
      switch (way) {
        case "box":
          this.box.width = newWidth;
          this.box.height = newHeight;
          this.box.x = centerX - newWidth / 2;
          this.box.y = centerY - newHeight / 2;
          break;
        case "vert":
          this.box.height = newHeight;
          this.box.y = centerY - newHeight / 2;
          break;
        case "hori":
          this.box.width = newWidth;
          this.box.x = centerX - newWidth / 2;
          break;
      }

      return [this.box.width, this.box.height];
    }
    return null;
  }
  
  increaseBoxSize(way, size) {
    const centerX = this.box.x + this.box.width / 2;
    const centerY = this.box.y + this.box.height / 2;

    const newWidth = way === "hori" || way === "box" ? this.box.width + size : this.box.width;
    const newHeight = way === "vert" || way === "box" ? this.box.height + size : this.box.height;

    if (newWidth <= this.originalBoxSize.width && newHeight <= this.originalBoxSize.height) {
      switch (way) {
        case "box":
          this.box.width = newWidth;
          this.box.height = newHeight;
          this.box.x = centerX - newWidth / 2;
          this.box.y = centerY - newHeight / 2;
          break;
        case "vert":
          this.box.height = newHeight;
          this.box.y = centerY - newHeight / 2;
          break;
        case "hori":
          this.box.width = newWidth;
          this.box.x = centerX - newWidth / 2;
          break;
      }

      return [this.box.width, this.box.height];
    }
    return null;
  }
}