class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Game state
        this.score = 0;
        this.gameOver = false;
        this.speed = 5;
        this.gravity = 0.5;
        this.jumpForce = -12;
        
        // Player
        this.player = {
            x: 100,
            y: this.canvas.height - 20 - 116, // ground height (20) + player height (216)
            width: 50,
            height: 116,
            velocityY: 0,
            jumping: false,
            frameIndex: 0,
            frameCount: 10,
            frameWidth: 100,
            frameHeight: 200,
            frameTimer: 0,
            frameInterval: 1000 / 12, // 12 FPS
            bobOffset: 0
        };
        this.playerImg = new Image();
        this.playerImg.src = 'assets/character-sprite.png'; // update to sprite sheet filename
        
        // Game objects
        this.coins = [];
        this.enemies = [];
        this.ground = this.canvas.height - 20;
        this.coinImg = new Image();
        this.coinImg.src = 'assets/myob coin.png';
        
        // Controls
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        // Start game loop
        this.lastTime = 0;
        this.animate(0);
        
        // Spawn objects
        this.spawnInterval = setInterval(() => this.spawnObjects(), 2000);
    }
    
    spawnObjects() {
        if (this.gameOver) return;
        
        // Spawn multiple coins in different positions
        if (Math.random() < 0.7) {
            // Decide how many coins to spawn (1 to 4)
            const coinCount = 1 + Math.floor(Math.random() * 4);
            for (let i = 0; i < coinCount; i++) {
                // Spread coins vertically in an arc or line
                const baseY = this.ground - 40 - (Math.random() * 120); // adjust for bigger coin
                this.coins.push({
                    x: this.canvas.width + i * 40, // space coins horizontally
                    y: baseY,
                    width: 40,
                    height: 40
                });
            }
        }
        
        // Spawn more enemies as speed increases
        let enemyCount = 1 + Math.floor((this.speed - 5) / 2); // 1 at base speed, more as speed increases
        for (let e = 0; e < enemyCount; e++) {
            if (Math.random() < 0.3 + 0.05 * (this.speed - 5)) { // slightly higher chance at higher speed
                // Increase height at score milestones
                const milestones = [5, 10, 15, 20, 30];
                let extraHeight = 0;
                for (let i = 0; i < milestones.length; i++) {
                    if (this.score >= milestones[i]) extraHeight += 10;
                }
                const height = 30 + extraHeight;
                this.enemies.push({
                    x: this.canvas.width + e * 60, // space enemies horizontally
                    y: this.ground - height,
                    width: 30,
                    height: height
                });
            }
        }
    }
    
    update() {
        if (this.gameOver) return;
        
        // Player movement
        if ((this.keys['Space'] || this.keys['ArrowUp']) && !this.player.jumping) {
            this.player.velocityY = this.jumpForce;
            this.player.jumping = true;
        }
        
        // Apply gravity
        this.player.velocityY += this.gravity;
        this.player.y += this.player.velocityY;
        
        // Ground collision
        if (this.player.y > this.ground - this.player.height) {
            this.player.y = this.ground - this.player.height;
            this.player.velocityY = 0;
            this.player.jumping = false;
        }
        
        // Update speed based on score
        const speedMilestones = [5, 10, 15, 20, 30];
        let speedBonus = 0;
        for (let i = 0; i < speedMilestones.length; i++) {
            if (this.score >= speedMilestones[i]) speedBonus += 1;
        }
        this.speed = 5 + speedBonus;
        
        // Update coins
        this.coins.forEach((coin, index) => {
            coin.x -= this.speed;
            if (coin.x + coin.width < 0) {
                this.coins.splice(index, 1);
            }
            
            // Coin collision
            if (this.checkCollision(this.player, coin)) {
                this.score++;
                document.getElementById('scoreValue').textContent = this.score;
                this.coins.splice(index, 1);
            }
        });
        
        // Update enemies
        this.enemies.forEach((enemy, index) => {
            enemy.x -= this.speed;
            if (enemy.x + enemy.width < 0) {
                this.enemies.splice(index, 1);
            }
            
            // Enemy collision
            if (this.checkCollision(this.player, enemy)) {
                this.endGame();
            }
        });
        
        // Animate player sprite
        if (!this.player.jumping) {
            this.player.frameTimer += this.speed * 2; // speed up animation with speed
            if (this.player.frameTimer > this.player.frameInterval) {
                this.player.frameIndex = (this.player.frameIndex + 1) % this.player.frameCount;
                this.player.frameTimer = 0;
            }
        } else {
            this.player.frameIndex = 0; // show first frame when jumping
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#a259e6';
        this.ctx.fillRect(0, this.ground, this.canvas.width, 20);
        
        // Draw player with sprite sheet animation and bobbing effect
        this.ctx.drawImage(
            this.playerImg,
            this.player.frameIndex * this.player.frameWidth, 0, // source x, y
            this.player.frameWidth, this.player.frameHeight,    // source w, h
            this.player.x, this.player.y + (this.player.bobOffset || 0), // dest x, y
            this.player.width, this.player.height               // dest w, h
        );
        
        // Draw coins as circles with image clipped inside
        this.coins.forEach(coin => {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.clip();
            this.ctx.drawImage(this.coinImg, coin.x, coin.y, coin.width, coin.height);
            this.ctx.restore();
        });
        
        // Draw enemies
        this.ctx.fillStyle = '#00FF00';
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        clearInterval(this.spawnInterval);
    }
    
    reset() {
        this.score = 0;
        this.gameOver = false;
        this.speed = 5;
        this.player.y = this.ground - this.player.height;
        this.player.velocityY = 0;
        this.coins = [];
        this.enemies = [];
        document.getElementById('scoreValue').textContent = '0';
        document.getElementById('gameOver').classList.add('hidden');
        this.spawnInterval = setInterval(() => this.spawnObjects(), 2000);
    }
    
    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update();
        this.draw();
        
        // Check for restart
        if (this.gameOver && (this.keys['Space'] || this.keys['ArrowUp'])) {
            this.reset();
        }
        
        requestAnimationFrame((time) => this.animate(time));
    }
}

// Start the game
window.onload = () => {
    new Game();
}; 