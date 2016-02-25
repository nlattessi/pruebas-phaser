var TTTCounter = (function() {

  function TTTCounter(phaserGame, x, y) {

    // We need to call the initializer of the 'super' class
    Phaser.Sprite.call(this, phaserGame, x, y);

    // Custom variables for TTTCounter
    this.tween = undefined;
    this.score = '';
    this.game = phaserGame;
  }

  // Required for creating custom sprites
  TTTCounter.prototype = Object.create(Phaser.Sprite.prototype);
  TTTCounter.prototype.constructor = TTTCounter;

  // Add custom methods below
  TTTCounter.prototype.setScore = function(score, animated) {
    this.score = '' + score; // Cast it to a string
    this.render();

    if (animated) {
      this.shake();
    }
  };

  TTTCounter.prototype.render = function() {
    // We always start with a clear sprite
    if (this.children.length !== 0) {
      this.removeChildren();
    }

    // Keep track of the x-position
    var xpos = 0;

    // totalWidth = width of every sprite + padding
    var totalWidth = 0;

    // Loop over all the numbers
    for (var i = 0; i < this.score.length; i++) {
      var sprite = new Phaser.Sprite(
        this.game,
        xpos,
        0,
        'numbers',
        this.score.charAt(i)
      );
      this.addChild(sprite);
      xpos += sprite.width + 2;
      totalWidth += sprite.width + 2;
    }

    // We don't want the padding at the end
    totalWidth -= 2;

    // Align the 'total number' to the center
    for (var j = 0; j < this.children.length;  j++) {
      var child = this.children[j];
      child.x -= totalWidth / 2;
    }
  };

  TTTCounter.prototype.shake = function() {
    // Add tween to 'this'
    this.tween = this.game.add.tween(this);
    this.tween.to({
      y: [this.y + 5, this.y] // You can chain multiple values in an array
    }, 200, Phaser.Easing.Quadratic.Out);

    this.tween.start();
  };

  return TTTCounter;

})();
