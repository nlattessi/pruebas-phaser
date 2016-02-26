// We create our only state
var mainState = {

  // Here we add all the functions we need for our state
  // For this project we will just have 3 functions

  preload: function() {
    // This function will be executed at the beginning
    // That's where we load the game's assets

    // Load the image
    game.load.image('logo', 'logo.png');
  },

  create: function() {
    // This function is called after the preload function
    // Here we set up the game, display, sprite, etc.

    // Display the image on the screen
    this.sprite = game.add.sprite(200, 150, 'logo');
  },

  update: function() {
    // This function is called 60 times per second
    // It contains the game's logic

    // Increment the angle of the sprite by 1, 60 times per second
    this.sprite.angle += 1;
  }
};

// We initialising Phaser
var game = new Phaser.Game(400, 300, Phaser.CANVAS, 'gameDiv');

// And finally we tell Phaser to add and start our 'main' state
game.state.add('main', mainState)
game.state.start('main')
