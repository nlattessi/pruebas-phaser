var TTTGame = (function() {

  var ANGLE = 26.55;
  var TILE_WIDTH = 68;
  var SPEED = 5;
  var TAXI_START_X = 30;
  var JUMP_HEIGHT = 7;

  function TTTGame(phaserGame) {
    this.game = phaserGame;

    this.hasStarted = false;

    this.mouseTouchDown = false;
    this.isDead = false;

    this.arrTiles = [];

    this.jumpSpeed = JUMP_HEIGHT;
    this.isJumping = false;
    this.currentJumpHeight = 0;

    this.roadCount = 0;
    this.nextObstacleIndex = 0;
    this.arrObstacles = [];

    this.taxi = undefined;
    this.taxiX = TAXI_START_X;

    this.numberOfIterations = 0;
    this.roadStartPosition = {
      x: GAME_WIDTH + 100,
      y: GAME_HEIGHT / 2 - 100
    }
  };

  TTTGame.prototype.taxiJump = function() {
    this.currentJumpHeight -= this.jumpSpeed;
    this.jumpSpeed -= 0.5;
    if (this.jumpSpeed < -JUMP_HEIGHT) {
      this.jumpSpeed = JUMP_HEIGHT;
      this.isJumping = false;
    }
  };

  TTTGame.prototype.gameOver = function() {
    this.taxi.tint = 0xff0000;
  }

  TTTGame.prototype.calculatePositionOnRoadWithXPosition = function(xpos) {
    var adjacent = this.roadStartPosition.x - xpos;
    var alpha = ANGLE * Math.PI / 180;
    var hypotenuse = adjacent / Math.cos(alpha);
    var opposite = Math.sin(alpha) * hypotenuse;
    return {
      x: xpos,
      y: opposite + this.roadStartPosition.y - 57
    }
  };

  TTTGame.prototype.calculateNextObstacleIndex = function() {
    var minimumOffset = 3;
    var maximumOffset = 10;
    var num = Math.random() * (maximumOffset - minimumOffset);
    this.nextObstacleIndex = this.roadCount + Math.round(num) + minimumOffset;
  };

  TTTGame.prototype.checkObstacles = function() {
    var i = this.arrObstacles.length - 1;

    while (i >= 0) {

      var sprite = this.arrObstacles[i];

      if (sprite.x < this.taxi.x - 10) {
        this.arrObstacles.splice(i, 1);
      }

      var dx = sprite.x - this.taxi.x;
      dx = Math.pow(dx, 2);
      var dy = (sprite.y - sprite.height / 2) - this.taxi.y;
      dy = Math.pow(dy, 2);
      var distance = Math.sqrt(dx + dy);

      if (distance < 25) {
        // We have a hit
        if (!this.isDead) {
          this.gameOver();
        }
      }

      i--;
    }
  };

  TTTGame.prototype.generateRoad = function() {

    this.roadCount++;
    var tile = 'tile_road_1';
    var isObstacle = false;

    if (this.roadCount > this.nextObstacleIndex && this.hasStarted) {
      tile = 'obstacle_1';
      isObstacle = true;
      this.calculateNextObstacleIndex();
    }

    var sprite = new Phaser.Sprite(this.game, 0, 0, tile);
    this.game.world.addChildAt(sprite, 0);
    sprite.anchor.setTo(0.5, 1.0);
    sprite.x = this.roadStartPosition.x
    sprite.y = this.roadStartPosition.y;
    this.arrTiles.push(sprite);

    if (isObstacle) {
      this.arrObstacles.push(sprite);
    }
  };

  TTTGame.prototype.moveTilesWithSpeed = function(speed) {
    var i = this.arrTiles.length - 1;
    while (i >= 0) {
      var sprite = this.arrTiles[i];
      sprite.x -= speed * Math.cos( ANGLE * Math.PI / 180 );
      sprite.y += speed * Math.sin( ANGLE * Math.PI / 180 );

      if (sprite.x < - 120){
        this.arrTiles.splice(i, 1);
        sprite.destroy();
      }

      i--;
    }
  };

  TTTGame.prototype.init = function() {
    this.game.stage.backgroundColor = '#9bd3e1';
    this.game.add.plugin(Phaser.Plugin.Debug);
  };

  TTTGame.prototype.preload = function() {
    // this.game.load is an instance of the Phaser.Loader class
    this.game.load.image('tile_road_1', 'static/img/assets/tile_road_1.png');
    this.game.load.image('taxi', 'static/img/assets/taxi.png');
    this.game.load.image('obstacle_1', 'static/img/assets/obstacle_1.png');
  };

  TTTGame.prototype.create = function() {
    this.generateRoad();

    var x = this.game.world.centerX;
    var y = this.game.world.centerY;
    this.taxi = new Phaser.Sprite(this.game, x, y, 'taxi');
    this.taxi.anchor.setTo(0.5, 1.0);
    this.game.add.existing(this.taxi);
  };

  TTTGame.prototype.touchDown = function() {
    this.mouseTouchDown = true;

    if (!this.hasStarted) {
      this.hasStarted = true;
    }

    if (!this.isJumping) {
      this.isJumping = true;
    }
  };

  TTTGame.prototype.touchUp = function() {
    this.mouseTouchDown = false;
  };

  TTTGame.prototype.update = function() {

    if (this.game.input.activePointer.isDown) {
      if (!this.mouseTouchDown) {
        this.touchDown();
      }
    } else {
      if (this.mouseTouchDown) {
        this.touchUp();
      }
    }

    this.numberOfIterations++;
    if (this.numberOfIterations > TILE_WIDTH / SPEED) {
      this.numberOfIterations = 0;
      this.generateRoad();
    }

    if (this.isJumping) {
      this.taxiJump();
    }

    var pointOnRoad =
    this.calculatePositionOnRoadWithXPosition(this.taxiX);

    this.taxi.x = pointOnRoad.x;
    this.taxi.y = pointOnRoad.y + this.currentJumpHeight;

    this.checkObstacles();

    this.moveTilesWithSpeed(SPEED);
  };

  return TTTGame;

})();
