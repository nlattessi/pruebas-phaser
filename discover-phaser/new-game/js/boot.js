var bootState = {

  preload: function() {
    // Load the image
    game.load.image('progressBar', 'assets/progressBar.png');
  },

  create: function() {
    // Set some game settings
    game.stage.backgroundColor = '#3498db';
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // If the device is not a desktop, so it's a mobile device
    if (!game.device.desktop) {
      // Set the type of scalin to 'show all'
      game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

      // Add a blue color to the page, to hide the white borders we might have
      document.body.style.backgroundColor = '#3498db';

      // Set the min and max width/height of the game
      game.scale.setMinMax(250, 170, 1000, 680);

      // Center the game on the screen
      game.scale.pageAlignHorizontally = true;
      game.scale.pageAlignVertically = true;
    }

    // Start the load start
    game.state.start('load');
  }
};
