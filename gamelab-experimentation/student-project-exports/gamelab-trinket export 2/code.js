

var p5Inst = new p5(null, 'sketch');

window.preload = function () {
  initMobileControls(p5Inst);

  p5Inst._predefinedSpriteAnimations = {};
  p5Inst._pauseSpriteAnimationsByDefault = false;
  var animationListJSON = {"orderedKeys":["041c9ab7-5725-44c7-8419-35ca0c808762"],"propsByKey":{"041c9ab7-5725-44c7-8419-35ca0c808762":{"name":"Spinoza.jpg_1","sourceUrl":"assets/v3/animations/b6762697-2e97-4713-b0e8-692f4e365dce/041c9ab7-5725-44c7-8419-35ca0c808762.png","frameSize":{"x":500,"y":581},"frameCount":1,"looping":true,"frameDelay":4,"version":"trT6EtRpYahTRsthjJTJaB4kPATqNtdP","categories":[""],"loadedFromSource":true,"saved":true,"sourceSize":{"x":500,"y":581},"rootRelativePath":"assets/v3/animations/b6762697-2e97-4713-b0e8-692f4e365dce/041c9ab7-5725-44c7-8419-35ca0c808762.png"}}};
  var orderedKeys = animationListJSON.orderedKeys;
  var allAnimationsSingleFrame = false;
  orderedKeys.forEach(function (key) {
    var props = animationListJSON.propsByKey[key];
    var frameCount = allAnimationsSingleFrame ? 1 : props.frameCount;
    var image = loadImage(props.rootRelativePath, function () {
      var spriteSheet = loadSpriteSheet(
          image,
          props.frameSize.x,
          props.frameSize.y,
          frameCount
      );
      p5Inst._predefinedSpriteAnimations[props.name] = loadAnimation(spriteSheet);
      p5Inst._predefinedSpriteAnimations[props.name].looping = props.looping;
      p5Inst._predefinedSpriteAnimations[props.name].frameDelay = props.frameDelay;
    });
  });

  function wrappedExportedCode(stage) {
    if (stage === 'preload') {
      if (setup !== window.setup) {
        window.setup = setup;
      } else {
        return;
      }
    }
// -----

var spriteQuiz = createSprite(200,50);
spriteQuiz.setAnimation("Spinoza.jpg_1");
spriteQuiz.scale = 0.2;

function draw() {
  background("white");
  spriteQuiz.rotation = randomNumber(45,75);
  spriteQuiz.y = spriteQuiz.y + 2;
  drawSprites();
}

// -----
    try { window.draw = draw; } catch (e) {}
    switch (stage) {
      case 'preload':
        if (preload !== window.preload) { preload(); }
        break;
      case 'setup':
        if (setup !== window.setup) { setup(); }
        break;
    }
  }
  window.wrappedExportedCode = wrappedExportedCode;
  wrappedExportedCode('preload');
};

window.setup = function () {
  window.wrappedExportedCode('setup');
};
