const KEYS = {
	LEFT: 37,
	RIGHT: 39,
	SPACE: 32,
};

let game = {
	ctx: null,
	platform: null,
	ball: null,
	blocks: [],
	rows: 4,
	cols: 8,
	width: 640,
	hight: 360,
	running: true,
	score: 0,
	sprites: {
		background: null,
		ball: null,
		platform: null,
		block: null,
	},
	sounds: {
		bump: null,
	},
	init() {
		this.ctx = document.getElementById('mycanvas').getContext('2d');
		this.setEvents();
		this.setTextFont();
	},
	setTextFont() {
		this.ctx.fillStyle = '#FFFFFF';
		this.ctx.font = '20px Tahoma';
	},
	setEvents() {
		window.addEventListener('keydown', e => {
			if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.RIGHT) {
				this.platform.start(e.keyCode);
			}
			if (e.keyCode === KEYS.SPACE) {
				this.platform.fire();
			}
		});
		window.addEventListener('keyup', e => {
			this.platform.stop();
		});
	},
	preload(callback) {
		let loaded = 0;
		let required = Object.keys(this.sprites).length;
		required += Object.keys(this.sounds).length;

		let onResourseLoad = () => {
			++loaded;
			if (loaded >= required) {
				callback();
			}
		};

		this.preloadSprites(onResourseLoad);
		this.preloadAudio(onResourseLoad);
	},
	preloadSprites(onResourseLoad) {
		for (let key in this.sprites) {
			this.sprites[key] = new Image();
			this.sprites[key].src = 'images/src/' + key + '.png';
			this.sprites[key].addEventListener('load', onResourseLoad);
		}
	},
	preloadAudio(onResourseLoad) {
		for (let key in this.sounds) {
			this.sounds[key] = new Audio('sounds/' + key + '.mp3');
			this.sounds[key].addEventListener('canplaythrough', onResourseLoad, { once: true });
		}
	},
	create() {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				this.blocks.push({
					active: true,
					width: 60,
					height: 20,
					x: 64 * col + 65,
					y: 24 * row + 35,
				});
			}
		}
	},
	update() {
		this.collideBlocks();
		this.collidePlatform();
		this.ball.collideWorldBounds();
		this.platform.collideWorldBounds();
		this.platform.move();
		this.ball.move();
	},
	addScore() {
		++this.score;
		if (this.score >= this.blocks.length) {
			this.end('Вы победили!');
		}
	},
	collideBlocks() {
		for (let block of this.blocks) {
			if (block.active && this.ball.collide(block)) {
				this.ball.bumbBlock(block);
				this.addScore();
				this.sounds.bump.play();
			}
		}
	},
	collidePlatform() {
		if (this.ball.collide(this.platform)) {
			this.ball.bumbPlatform(this.platform);
		}
	},
	run() {
		if (this.running) {
			window.requestAnimationFrame(() => {
				this.update();
				this.render();
				this.run();
			});
		}
	},
	render() {
		this.ctx.clearRect(0, 0, game.width, game.hight);
		this.ctx.drawImage(this.sprites.background, 0, 0);
		this.ctx.drawImage(
			this.sprites.ball,
			0,
			0,
			this.ball.width,
			this.ball.height,
			this.ball.x,
			this.ball.y,
			this.ball.width,
			this.ball.height
		);
		this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
		this.renderBlocks();
		this.ctx.fillText(`Score: ${this.score}`, 10, 20);
	},
	renderBlocks() {
		for (let block of this.blocks) {
			if (block.active) {
				this.ctx.drawImage(this.sprites.block, block.x, block.y);
			}
		}
	},
	start: function () {
		this.init();
		this.preload(() => {
			this.create();
			this.run();
		});
	},
	random(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	},
	end(message) {
		game.running = false;
		alert(`${message}`);
		window.location.reload();
	},
};

game.ball = {
	dx: 0,
	dy: 0,
	velocity: 3,
	x: 320,
	y: 280,
	width: 20,
	height: 20,
	start() {
		this.dy = -this.velocity;
		this.dx = game.random(-this.velocity, this.velocity);
	},
	move() {
		if (this.dx) {
			this.x += this.dx;
		}
		if (this.dy) {
			this.y += this.dy;
		}
	},
	collide(element) {
		let x = this.x + this.dx;
		let y = this.y + this.dy;
		if (x + this.width > element.x && x < element.x + element.width && y + this.height > element.y && y < element.y + element.height) {
			return true;
		} else {
			return false;
		}
	},
	collideWorldBounds() {
		let x = this.x + this.dx;
		let y = this.y + this.dy;

		let ballLeft = x;
		let ballRight = ballLeft + this.width;
		let ballTop = y;
		let ballBottom = ballTop + this.height;

		let worldLeft = 0;
		let worldRight = game.width;
		let worldTop = 0;
		let worldBottom = game.hight;

		if (ballLeft < worldLeft) {
			this.x = 0;
			this.dx = this.velocity;
		} else if (ballRight > worldRight) {
			this.x = worldRight - this.width;
			this.dx = -this.velocity;
		} else if (ballTop < worldTop) {
			this.y = 0;
			this.dy = this.velocity;
		} else if (ballBottom > worldBottom) {
			game.end('Вы проиграли!');
		}
	},
	bumbBlock(block) {
		this.dy *= -1;
		block.active = false;
	},
	bumbPlatform(platform) {
		if (platform.dx) {
			this.x += platform.dx;
		}
		if (this.dy > 0) {
			this.dy = -this.velocity;
			let touchx = this.x + this.width / 2;
			this.dx = this.velocity * platform.getTouchOffset(touchx);
		}
	},
};

game.platform = {
	velocity: 6,
	dx: 0,
	x: 280,
	y: 300,
	width: 100,
	height: 14,
	ball: game.ball,
	fire() {
		if (this.ball) {
			this.ball.start();
			this.ball = null;
		}
	},
	start(direction) {
		if (direction === KEYS.LEFT) {
			this.dx = -this.velocity;
		} else if (direction === KEYS.RIGHT) {
			this.dx = this.velocity;
		}
	},
	stop() {
		this.dx = 0;
	},
	move() {
		if (this.dx) {
			this.x += this.dx;
			if (this.ball) {
				this.ball.x += this.dx;
			}
		}
	},
	getTouchOffset(x) {
		let diff = this.x + this.width - x;
		let offset = this.width - diff;
		let result = (2 * offset) / this.width;
		return result - 1;
	},
	collideWorldBounds() {
		let x = this.x + this.dx;
		let platformLeft = x;
		let platformRight = platformLeft + this.width;
		let worldLeft = 0;
		let worldRight = game.width;
		if (platformLeft < worldLeft || platformRight > worldRight) {
			this.dx = 0;
		}
	},
};

window.addEventListener('load', () => {
	game.start();
});
