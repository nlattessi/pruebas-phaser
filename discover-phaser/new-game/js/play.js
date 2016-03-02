var playState = {

  create: function() {
    this.cursor = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([
      Phaser.Keyboard.UP, Phaser.Keyboard.DOWN,
      Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT
    ]);
    this.wasd = {
      up: game.input.keyboard.addKey(Phaser.Keyboard.W),
      left: game.input.keyboard.addKey(Phaser.Keyboard.A),
      right: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };

    this.player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    game.physics.arcade.enable(this.player);
    this.player.body.gravity.y = 500;
    // Create the 'right' animation by looping the frames 1 and 2
    this.player.animations.add('right', [1, 2], 8, true);
    // Create the 'left' animation by looping the frames 3 and 4
    this.player.animations.add('left', [3, 4], 8, true);

    this.enemies = game.add.group();
    this.enemies.enableBody = true;
    this.enemies.createMultiple(10, 'enemy');

    this.coin = game.add.sprite(60, 140, 'coin');
    game.physics.arcade.enable(this.coin);
    this.coin.anchor.setTo(0.5, 0.5);

    this.scoreLabel = game.add.text(30, 30, 'score: 0',
      { font: '18px Arial', fill: '#ffffff' }
    );
    // New score variable
    game.global.score = 0;

    this.jumpSound = game.add.audio('jump');
    this.coinSound = game.add.audio('coin');
    this.deadSound = game.add.audio('dead');

    this.createWorld();
    //game.time.events.loop(2200, this.addEnemy, this);
    this.nextEnemy = 0;

    // Create the emitter with 15 particles. We dont' need to set the x and y
    // Since we don't know where to do the explosion yet
    this.emitter = game.add.emitter(0, 0, 15);

    // Set the 'pixel' image for the particles
    this.emitter.makeParticles('pixel');

    // Set the y speed of the particles between -150 and 150
    // The speed will be randomly picked between -150 and 150 for each particle
    this.emitter.setYSpeed(-150, 150);

    // Do the same for x speed
    this.emitter.setXSpeed(-150, 150);

    // Use no gravity for the particles
    this.emitter.gravity = 0;

    // Scale the particles
    this.emitter.minParticleScale = 0.2;
    this.emitter.maxParticleScale = 0.7;
    // Rotate the particles
    this.emitter.minRotation = 10;
    this.emitter.maxRotation = 100;
    // Change the size of the emitter
    this.emitter.width = 69;
    this.emitter.height = 42;

    // If the game is running on a mobile device
    if (!game.device.desktop) {
      // Display the mobile inputs
      this.addMobileInputs();
    }

    // this.jumpTime = 0;
  },

  jumpPlayer: function() {
    // If player is touching the ground
    if (this.player.body.onFloor()) {
      // Jump with sound
      this.jumpTime = this.game.time.now;
      this.player.body.velocity.y = -320;
      this.jumpSound.play();
    }
    // } else if ( (this.game.time.now - this.jumpTime) < 200 ) {
    //   this.player.body.velocity.y = -320;
    // }
  },

  addMobileInputs: function() {
    // Add the jump button
    this.jumpButton = game.add.sprite(350, 247, 'jumpButton');
    this.jumpButton.inputEnabled = true;
    this.jumpButton.events.onInputDown.add(this.jumpPlayer, this);
    this.jumpButton.alpha = 0.5;

    // Movement variables
    this.moveLeft = false;
    this.moveRight = false;

    // Add the move left button
    this.leftButton = game.add.sprite(50, 247, 'leftButton');
    this.leftButton.inputEnabled = true;
    this.leftButton.events.onInputOver.add(function(){this.moveLeft=true;}, this);
    this.leftButton.events.onInputOut.add(function(){this.moveLeft=false;}, this);
    this.leftButton.events.onInputDown.add(function(){this.moveLeft=true;}, this);
    this.leftButton.events.onInputUp.add(function(){this.moveLeft=false;}, this);
    this.leftButton.alpha = 0.5;

    // Add the move right button
    this.rightButton = game.add.sprite(130, 247, 'rightButton');
    this.rightButton.inputEnabled = true;
    this.rightButton.events.onInputOver.add(function(){this.moveRight=true;}, this);
    this.rightButton.events.onInputOut.add(function(){this.moveRight=false;}, this);
    this.rightButton.events.onInputDown.add(function(){this.moveRight=true;}, this);
    this.rightButton.events.onInputUp.add(function(){this.moveRight=false;}, this);
    this.rightButton.alpha = 0.5;
  },

  update: function() {
    // This function is called 60 times per second
    // It contains the game's logic

    if (this.nextEnemy < game.time.now) {
      // Define our variables
      var start = 4000, end = 1000, score = 100;

      // Formula to decrease delay between enemies over time
      // At first it's 4000ms, then slowly goes to 1000ms
      var delay = Math.max(start - (start-end)*game.global.score/score, end);

      // Create a new enemy, and update 'nextEnemy' time
      this.addEnemy();
      this.nextEnemy = game.time.now + delay;
    }

    // Changed 'this.walls' into 'this.layer'
    game.physics.arcade.collide(this.player, this.layer);
    game.physics.arcade.collide(this.enemies, this.layer);

    this.movePlayer();

    if (!this.player.inWorld) {
      this.playerDie();
    }

    game.physics.arcade.overlap(this.player, this.coin, this.takeCoin, null, this);

    // Make the enemies and walls collide
    game.physics.arcade.collide(this.enemies, this.walls);

    // Call the 'playerDie' function when the play and an enemy colapse
    game.physics.arcade.overlap(this.player, this.enemies, this.playerDie, null, this);

    //this.enemies.forEachAlive(this.checkPosition, this);
  },

  checkPosition: function(enemy) {
    if (enemy.y > this.player.y) {
      enemy.kill();
    }
  },

  takeCoin: function(player, coin) {
    this.coinSound.play();

    // New score variable
    game.global.score += 5;
    this.scoreLabel.text = 'score: ' + game.global.score;

    // Change the coin position
    this.updateCoinPosition();

    // Scale the coin to 0 to make it invisible
    this.coin.scale.setTo(0, 0);

    // Grow the coin back to its original scale in 300ms
    game.add.tween(this.coin.scale).to({ x: 1, y: 1 }, 300).start();

    // Grow the player slightly, then go back to it's original size
    game.add.tween(this.player.scale).to({ x: 1.3, y: 1.3 }, 50).to({ x:1, y: 1 }, 150).start();
  },

  updateCoinPosition: function() {
    // Store all the possible coin positions in an array
    var coinPosition = [
      {x: 140, y: 60}, {x: 360, y: 60}, // Top row
      {x: 60, y: 140}, {x: 440, y: 140}, // Middle row
      {x: 130, y: 300}, {x: 370, y: 300} // Bottom row
    ];

    // Remove the current coin position from the array
    // Otherwise the coin could appear at the same spot twice in a row
    for (var i = 0; i < coinPosition.length; i++) {
      if (coinPosition[i].x === this.coin.x) {
        coinPosition.splice(i, 1);
      }
    }

    // Randomly select a position from the array
    var newPosition = coinPosition[
      game.rnd.integerInRange(0, coinPosition.length - 1)];

    // Set the new position of the coin
    this.coin.reset(newPosition.x, newPosition.y);
  },

  movePlayer: function() {
    // Move the player to the left
    if (this.cursor.left.isDown || this.wasd.left.isDown || this.moveLeft) {
      this.player.body.velocity.x = -200;
      this.player.animations.play('left'); // Start the left animation
    }
    // Move the player to the right
    else if (this.cursor.right.isDown || this.wasd.right.isDown || this.moveRight) {
      this.player.body.velocity.x = 200;
      this.player.animations.play('right'); // Start the left animation
    }
    // Stop the player
    else {
      this.player.body.velocity.x = 0;
      this.player.animations.stop(); // Stop the animation
      this.player.frame = 0; // Set the player frame to 0 (stand still)
    }

    // Make the player jump
    if (this.cursor.up.isDown || this.wasd.up.isDown) {
      this.jumpPlayer();
    }
  },

  createWorld: function() {
    // Create the tilemap
    this.map  = game.add.tilemap('map');

    // Add the tileset to the map
    this.map.addTilesetImage('tileset');

    // Create the layer, by specifyng the name of the Tiled layer
    this.layer = this.map.createLayer('Tile Layer 1');

    // Set the world size to match the size of the layer
    this.layer.resizeWorld();

    // Enable collisions for the first element of our tileset (the blue wall)
    this.map.setCollision(1);


    // // Create our wall group with Arcade Physics
    // this.walls = game.add.group();
    // this.walls.enableBody = true;
    //
    // // Create 10 walls
    // game.add.sprite(0, 0, 'wallV', 0, this.walls); // Left
    // game.add.sprite(480, 0, 'wallV', 0, this.walls); // Right
    //
    // game.add.sprite(0, 0, 'wallH', 0, this.walls); // Top left
    // game.add.sprite(300, 0, 'wallH', 0, this.walls); // Top right
    // game.add.sprite(0, 320, 'wallH', 0, this.walls); // Bottom left
    // game.add.sprite(300, 320, 'wallH', 0, this.walls); // Bottom right
    //
    // game.add.sprite(-100, 160, 'wallH', 0, this.walls); // Middle left
    // game.add.sprite(400, 160, 'wallH', 0, this.walls); // Middle right
    //
    // var middleTop = game.add.sprite(100, 80, 'wallH', 0, this.walls);
    // middleTop.scale.setTo(1.5, 1);
    // var middleBottom = game.add.sprite(100, 240, 'wallH', 0, this.walls);
    // middleBottom.scale.setTo(1.5, 1);
    //
    // // Set all the wall to be immovable
    // this.walls.setAll('body.immovable', true);
  },

  playerDie: function() {
    // If the player is already dead, do nothin
    if (!this.player.alive) {
      return;
    }

    // Kill the player to make it disappear from the screen
    this.player.kill();

    // Start the sound and the particles
    this.deadSound.play();
    // Set the position of the emitter on the player
    this.emitter.x = this.player.x;
    this.emitter.y = this.player.y;
    // Start the emitter, by exploding 15 particles that will live for 600ms
    this.emitter.start(true, 600, null, 15);

    // Call the 'startMenu' function in 1000ms
    game.time.events.add(1000, this.startMenu, this);
  },

  startMenu: function() {
    game.state.start('menu');
  },

  addEnemy: function() {
    // Get the first dead enemy of the group
    var enemy = this.enemies.getFirstDead();

    // If there isn't any dead enemy, do nothing
    if (!enemy) {
      return;
    }

    // Initialise the enemy
    enemy.anchor.setTo(0.5, 1);
    enemy.reset(game.world.centerX, 0);
    enemy.body.gravity.y = 500;
    enemy.body.velocity.x = 100 * Phaser.Utils.randomChoice(-1, 1);
    enemy.body.bounce.x = 1;
    enemy.checkWorldBounds = true;
    enemy.outOfBoundsKill = true;
  }
};
