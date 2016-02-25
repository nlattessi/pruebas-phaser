var TTTGame = (function() {

  var ANGLE = 26.55;
  var TILE_WIDTH = 68;
  var TILE_HEIGHT = 63;
  var SPEED = 5;
  var TAXI_START_X = 30;
  var JUMP_HEIGHT = 7;

  function TTTGame(phaserGame) {
    this.game = phaserGame;

    this.logo = undefined;
    this.tapToStart = undefined;

    this.scoreCount = 0;
    this.hasStarted = false;
    this.gameOverGraphic = undefined;
    this.blackOverlay = undefined;
    this.btnRestart = undefined;

    this.mouseTouchDown = false;
    this.isDead = false;

    this.arrTiles = [];

    this.nextQueueIndex = 0;
    this.rightQueue = [];

    this.jumpSpeed = JUMP_HEIGHT;
    this.isJumping = false;
    this.currentJumpHeight = 0;

    this.roadCount = 0;
    this.nextObstacleIndex = 0;
    this.arrObstacles = [];

    this.taxi = undefined;
    this.taxiX = TAXI_START_X;
    this.taxiTargetX = 0;

    this.numberOfIterations = 0;
    this.roadStartPosition = {
      x: GAME_WIDTH + 100,
      y: GAME_HEIGHT / 2 - 100
    }

    this.sfx = {};
  };

  TTTGame.prototype.taxiJump = function() {
    this.currentJumpHeight -= this.jumpSpeed;
    this.jumpSpeed -= 0.5;
    if (this.jumpSpeed < -JUMP_HEIGHT) {
      this.jumpSpeed = JUMP_HEIGHT;
      this.isJumping = false;
    }
  };

  TTTGame.prototype.startGame = function () {
    this.tapToStart.visible = false;
    this.tapToStart.blinker.stopBlinking();
    this.hasStarted = true;
    this.logo.visible = false;
    this.counter.visible = true;
  };

  TTTGame.prototype.gameOver = function() {
    this.sfx.hit.play();

    this.blackOverlay.alpha = 0.6;
    this.blackOverlay.visible = true;

    this.btnRestart.visible = true;

    this.gameOverGraphic.visible = true;
    this.isDead = true;
    this.hasStarted = false;
    this.arrObstacles = [];

    var dieSpeed = SPEED / 10;

    var tween_1 = this.game.add.tween(this.taxi);
    tween_1.to({
      x: this.taxi.x + 20,
      y: this.taxi.y - 40
    }, 300 * dieSpeed, Phaser.Easing.Quadratic.Out);

    var tween_2 = this.game.add.tween(this.taxi);
    tween_2.to({
      y: GAME_HEIGHT + 40
    }, 1000, Phaser.Easing.Quadratic.In);

    tween_1.chain(tween_2);
    tween_1.start();

    var tween_rotate = this.game.add.tween(this.taxi);
    tween_rotate.to({
      angle: 200
    }, 1300 * dieSpeed, Phaser.Easing.Linear.None);
    tween_rotate.start();
  };

  TTTGame.prototype.generateLevel = function () {
    var i = 0;
    // Calculate how many tiles fit on screen and add 2 just to be safe
    var numberOfTiles = Math.ceil( GAME_WIDTH / TILE_WIDTH ) + 2;
    while (i <= numberOfTiles) {
      this.generateRoad();
      if (i != numberOfTiles) {
        // Move the tiles by TILE_WIDTH
        this.moveTilesWithSpeed(TILE_WIDTH);
      }
      i++;
    }
  };

  TTTGame.prototype.reset = function() {
    this.tapToStart.visible = true;
    this.tapToStart.blinker.startBlinking();

    this.blackOverlay.visible = false;

    this.btnRestart.visible = false;

    this.logo.visible = true;
    this.counter.visible = false;

    // Game variables
    this.scoreCount = 0;
    this.counter.setScore(0, false);
    this.hasStarted = false;
    this.isDead = false;

    // Jump variables
    this.jumpSpeed = JUMP_HEIGHT;
    this.isJumping = false;
    this.currentJumpHeight = 0;

    // Road variables
    this.nextObstacleIndex = 0;
    this.arrObstacles = [];

    this.mouseTouchDown = false;

    // Taxi properties
    this.game.tweens.removeFrom(this.taxi);
    this.taxiX = TAXI_START_X;
    this.taxi.rotation = 0;
    this.taxiTargetX = 0;

    // Reset graphic visibility
    this.gameOverGraphic.visible = false;
  };

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

      // We don't want to check on items that are past the taxi
      if (sprite.x < this.taxi.x - 10) {
        this.arrObstacles.splice(i, 1);

        // Increase the score
        this.scoreCount++;
        this.sfx.score.play();

        // Set the score & animate it!
        this.counter.setScore(this.scoreCount, true);
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

    var sprite = this.createTileAtIndex(tile, 4);
    if (isObstacle) {
      this.arrObstacles.push(sprite);
    }

    this.addTileAtIndex(new TTTBuilding(this.game, 0, 0), 0);
    this.createTileAtIndex('tile_road_1', 1);
    this.createTileAtIndex('empty', 2);
    this.addTileAtIndex(new TTTBuilding(this.game, 0, 0), 3);
    this.createTileAtIndex('empty', 5);
    this.createTileAtIndex(this.rightQueueOrEmpty(), 6);
    this.createTileAtIndex('empty', 7);
    this.createTileAtIndex('water', 8);
  };

  TTTGame.prototype.rightQueueOrEmpty = function () {
    var retval = 'empty';

    if (this.rightQueue.length !== 0) {

      // rightQueue is a multidimensional array
      retval = this.rightQueue[0][0];

      this.rightQueue[0].splice(0, 1);
      if (this.rightQueue[0].length === 0) {
        this.rightQueue.splice(0, 1);
      }
    }

    return retval;
  };

  TTTGame.prototype.createTileAtIndex = function (tile, index) {
    var sprite = new Phaser.Sprite(this.game, 0, 0, 'gameAssets', tile);

    this.addTileAtIndex(sprite, index);

    return sprite;
  };

  TTTGame.prototype.addTileAtIndex = function (sprite, index) {
    sprite.anchor.setTo(0.5, 1);

    var middle = 4; // The middle layer

    // < 0 if it's a layer below the middle
    // > 0 if it's a layer above the middle
    var offset = index - middle;

    sprite.x = this.roadStartPosition.x;
    sprite.y = this.roadStartPosition.y + offset * TILE_HEIGHT;
    this.arrTiles[index].addChildAt(sprite, 0);
  };

  TTTGame.prototype.moveTilesWithSpeed = function(speed) {
    var i = this.arrTiles.length - 1;

    // Reverse loop over all the tiles
    while (i >= 0) {

      var children = this.arrTiles[i].children;
      var j = children.length - 1;
      while (j >= 0) {
        var sprite = children[j];
        // Move the sprite
        sprite.x -= speed * Math.cos( ANGLE * Math.PI / 180 );
        sprite.y += speed * Math.sin( ANGLE * Math.PI / 180 );

        if (sprite.x < -120) {
          // We don't need to splice anymore
          // this.arrTiles[i].splice(i, 1)
          this.arrTiles[i].removeChild(sprite);
          sprite.destroy();
        }
        j--;
      }

      i--;
    }
  };

  TTTGame.prototype.calculateTaxiPosition = function () {
    var multiplier = 0.025;
    var num = TAXI_START_X + (this.scoreCount * GAME_WIDTH * multiplier);

    // Limit it to 60% of the game width
    if (num > GAME_WIDTH * 0.60) {
      num = GAME_WIDTH * 0.60;
    }

    // Assign the target X value to taxiTarget
    this.taxiTargetX = num;

    // Gradually increase taxiX to approach taxiTargetX
    if (this.taxiX < this.taxiTargetX) {
      var easing = 15;
      this.taxiX += (this.taxiTargetX - this.taxiX) / easing;
    }
  };

  TTTGame.prototype.generateGreenQueue = function () {
    var retval = [];

    retval.push('green_start');

    // Random amount of middle tiles
    var middle = Math.round(Math.random() * 2);
    var i = 0;
    while (i < middle) {
      retval.push('green_middle_empty');
      i++;
    }

    // Random amount of trees
    var numberOfTrees = Math.round(Math.random() * 2);
    i = 0;
    while (i < numberOfTrees) {
      retval.push('green_middle_tree');
      i++;
    }

    // Before & after the trees we have the same amount of 'middle' tiles
    i = 0;
    while (i < middle) {
      retval.push('green_middle_empty');
      i++;
    }

    retval.push('green_end');

    return retval;
  };

  TTTGame.prototype.generateRightQueue = function () {
    var minimumOffset = 5;
    var maximumOffset = 10;
    var num = Math.random() * (maximumOffset - minimumOffset);
    this.nextQueueIndex = this.roadCount + Math.random(num) + minimumOffset;
    this.rightQueue.push(this.generateGreenQueue());
  };

  TTTGame.prototype.init = function() {
    this.game.stage.backgroundColor = '#9bd3e1';
    //this.game.add.plugin(Phaser.Plugin.Debug);
  };

  TTTGame.prototype.preload = function() {
    // Spritesheets
    this.game.load.atlasJSONArray('numbers', 'static/img/spritesheets/numbers.png', 'static/img/spritesheets/numbers.json');
    this.game.load.atlasJSONArray('playButton', 'static/img/spritesheets/playButton.png', 'static/img/spritesheets/playButton.json');
    this.game.load.atlasJSONArray('gameAssets', 'static/img/spritesheets/gameAssets.png', 'static/img/spritesheets/gameAssets.json');

    // Audio
    this.game.load.audio('hit', 'static/audio/hit.wav');
    this.game.load.audio('jump', 'static/audio/jump.wav');
    this.game.load.audio('score', 'static/audio/score.wav');
  };

  TTTGame.prototype.create = function() {
    var numberOfLayers = 9;

    for (var i = 0; i < numberOfLayers; i++) {
      var layer = new Phaser.Sprite(this.game, 0, 0);
      this.game.world.addChild(layer);
      // this.arrTiles will now hold layers
      this.arrTiles.push(layer);
    }

    this.counter = new TTTCounter(this.game, 0, 0);
    this.game.add.existing(this.counter);
    this.counter.x = GAME_WIDTH / 2;
    this.counter.y = 40;

    this.generateRoad();

    var x = this.game.world.centerX;
    var y = this.game.world.centerY;
    this.taxi = new Phaser.Sprite(this.game, x, y, 'gameAssets', 'taxi');
    this.taxi.anchor.setTo(0.5, 1.0);
    this.game.add.existing(this.taxi);

    this.blackOverlay = this.game.add.graphics(0, 0);
    this.blackOverlay.beginFill(0x000000, 1);
    this.blackOverlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.blackOverlay.endFill();
    this.blackOverlay.visible = false;

    this.logo = this.game.add.sprite(0, 0, 'gameAssets', 'logo');
    this.logo.anchor.setTo(0.5, 0.5);
    this.logo.x = GAME_WIDTH / 2;
    this.logo.y = 100;

    var x = this.game.world.centerX;
    var y = this.game.world.centerY - 100;
    this.gameOverGraphic = new Phaser.Sprite(this.game, x, y, 'gameAssets', 'gameOver');
    this.game.add.existing(this.gameOverGraphic);
    this.gameOverGraphic.anchor.setTo(0.5, 0.5);
    this.gameOverGraphic.visible = false;

    this.tapToStart = this.game.add.sprite(0, 0, 'gameAssets', 'tapToStart');
    this.tapToStart.anchor.setTo(0.5, 0.5);
    this.tapToStart.x = GAME_WIDTH / 2;
    this.tapToStart.y = GAME_HEIGHT - 60;
    this.tapToStart.blinker = new TTTBlinker(this.game, this.tapToStart);

    this.btnRestart = new Phaser.Button(
      this.game,
      0,
      0,
      'playButton', // Key
      this.restart, // Callback
      this, // Context
      'default', // Over
      'default', // Out
      'hover', // Down
      'default' // Up
    );
    this.game.add.existing(this.btnRestart); // Add it to the world
    this.btnRestart.anchor.setTo(0.5, 0.5); // Anchor point in the middle
    this.btnRestart.x = GAME_WIDTH / 2;
    this.btnRestart.y = this.gameOverGraphic.y + this.gameOverGraphic.height / 2 + 50;

    this.sfx = {
      hit: this.game.add.audio('hit'),
      jump: this.game.add.audio('jump'),
      score: this.game.add.audio('score')
    };

    this.reset();

    this.generateLevel();
  };

  TTTGame.prototype.touchDown = function() {
    this.mouseTouchDown = true;

    // Reset call is removed

    // We don't want to do anything if the player is dead
    if (this.isDead) { return; };

    if (!this.hasStarted) {
        this.startGame();
    }

    if (!this.isJumping) {
        this.isJumping = true;
        this.sfx.jump.play();
    }
  };

  TTTGame.prototype.restart = function() {
    this.reset();
  };

  TTTGame.prototype.touchUp = function() {
    this.mouseTouchDown = false;
  };

  TTTGame.prototype.update = function() {
    if (this.roadCount > this.nextQueueIndex) {
      this.generateRightQueue();
    }

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

    if (!this.isDead) {
      if (this.isJumping) {
        this.taxiJump();
      }

      this.calculateTaxiPosition();

      var pointOnRoad =
      this.calculatePositionOnRoadWithXPosition(this.taxiX);

      this.taxi.x = pointOnRoad.x;
      this.taxi.y = pointOnRoad.y + this.currentJumpHeight;

      this.checkObstacles();
    }

    this.moveTilesWithSpeed(SPEED);
  };

  return TTTGame;

})();
