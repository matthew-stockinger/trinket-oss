

var p5Inst = new p5(null, 'sketch');

window.preload = function () {
  initMobileControls(p5Inst);

  p5Inst._predefinedSpriteAnimations = {};
  p5Inst._pauseSpriteAnimationsByDefault = false;
  var animationListJSON = {"orderedKeys":["4d581dbb-3e3c-4af1-add7-db39426b8885","4762e6dd-5109-44cf-b4a4-d151f1672323","4fe0692c-3f88-4a45-af56-a4136cc3fdf4","f5321b60-8a90-4b58-bbc6-40a826081c63","81025f69-c686-455e-9a1e-2b414f126891","4dfd7be1-5723-4f41-836c-b6682aa2ce79","1fc7943b-84e3-4f93-a13a-4da617769a36"],"propsByKey":{"4d581dbb-3e3c-4af1-add7-db39426b8885":{"name":"vrect50","sourceUrl":null,"frameSize":{"x":5,"y":50},"frameCount":1,"looping":true,"frameDelay":12,"version":"JErt3HmbR4mL2KG4XPMZmuzwmJNEd9rm","loadedFromSource":true,"saved":true,"sourceSize":{"x":5,"y":50},"rootRelativePath":"assets/4d581dbb-3e3c-4af1-add7-db39426b8885.png"},"4762e6dd-5109-44cf-b4a4-d151f1672323":{"name":"hrect","sourceUrl":null,"frameSize":{"x":50,"y":5},"frameCount":1,"looping":true,"frameDelay":12,"version":"Ff4xtF8SAudHrLkJaGX7nHlGzxwaw.3H","loadedFromSource":true,"saved":true,"sourceSize":{"x":50,"y":5},"rootRelativePath":"assets/4762e6dd-5109-44cf-b4a4-d151f1672323.png"},"4fe0692c-3f88-4a45-af56-a4136cc3fdf4":{"name":"hrect50","sourceUrl":null,"frameSize":{"x":50,"y":5},"frameCount":1,"looping":true,"frameDelay":12,"version":"xUfvbx3sN0c1_IOsYJ85eJct3J7HB3v5","loadedFromSource":true,"saved":true,"sourceSize":{"x":50,"y":5},"rootRelativePath":"assets/4fe0692c-3f88-4a45-af56-a4136cc3fdf4.png"},"f5321b60-8a90-4b58-bbc6-40a826081c63":{"name":"square","sourceUrl":null,"frameSize":{"x":14,"y":14},"frameCount":1,"looping":true,"frameDelay":12,"version":"sXjTdWYH5GcyAKi.itHoCvkaG.0MwCOn","loadedFromSource":true,"saved":true,"sourceSize":{"x":14,"y":14},"rootRelativePath":"assets/f5321b60-8a90-4b58-bbc6-40a826081c63.png"},"81025f69-c686-455e-9a1e-2b414f126891":{"name":"circle","sourceUrl":null,"frameSize":{"x":15,"y":15},"frameCount":1,"looping":true,"frameDelay":12,"version":"LdGqNOGU7s39crhuXLiLjr7ZI.4bfB3p","loadedFromSource":true,"saved":true,"sourceSize":{"x":15,"y":15},"rootRelativePath":"assets/81025f69-c686-455e-9a1e-2b414f126891.png"},"4dfd7be1-5723-4f41-836c-b6682aa2ce79":{"name":"hWall","sourceUrl":null,"frameSize":{"x":100,"y":1},"frameCount":1,"looping":true,"frameDelay":12,"version":"hrhSqzAlXLTIyvjtGVy55aviM1qpRZYJ","loadedFromSource":true,"saved":true,"sourceSize":{"x":100,"y":1},"rootRelativePath":"assets/4dfd7be1-5723-4f41-836c-b6682aa2ce79.png"},"1fc7943b-84e3-4f93-a13a-4da617769a36":{"name":"vWall","sourceUrl":null,"frameSize":{"x":2,"y":100},"frameCount":1,"looping":true,"frameDelay":12,"version":"DT.ldAt9vckeh6AMaZgQLeDFOjp_.1rz","loadedFromSource":true,"saved":true,"sourceSize":{"x":2,"y":100},"rootRelativePath":"assets/1fc7943b-84e3-4f93-a13a-4da617769a36.png"}}};
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

createEdgeSprites();
var playerSpeed = 4;
var winner = false;

var player = createSprite(200, 200);
player.setAnimation("square");

var obstacles = [];
var ring1 = createGroup();
spawnCircles(200, 200, 10, 100, ring1);
var ring2 = createGroup();
spawnCircles(200, 200, 10, 150, ring2);
var ring3 = createGroup();
spawnCircles(375, 25, 5, 50, ring3);
var ring4 = createGroup();
spawnCircles(0, 200, 10, 175, ring4);
var ring5 = createGroup();
spawnCircles(400, 200, 10, 175, ring5);
obstacles = obstacles.concat([
  ring1, ring2,
  ring3, ring4, 
  ring5
]);

var barY1 = 150;
var barY2 = 250;
var barX = 100;
var bars = createGroup();
bars.add(createSprite(barX, barY1));
bars.add(createSprite(barX, barY2));
bars.add(createSprite(barX + 50, barY1));
bars.add(createSprite(barX + 50, barY2));
bars.add(createSprite(barX + 100, barY1));
bars.add(createSprite(barX + 100, barY2));
bars.add(createSprite(barX + 150, barY1));
bars.add(createSprite(barX + 150, barY2));
bars.add(createSprite(barX + 200, barY1));
bars.add(createSprite(barX + 200, barY2));
bars.setAnimationEach("hrect");


function draw() {
  // the level setup
  background("whiteSmoke");
  rotateGroup(ring1, 2*PI/30/3);
  rotateGroup(ring2, -2*PI/30/5);
  rotateGroup(ring3, 2*PI/30/2);
  rotateGroup(ring4, 2*PI/30/5);
  rotateGroup(ring5, 2*PI/30/5);
  player.collide(edges);
  player.collide(bars);
  
  // player stuff
  keys();
  drawSprites();
  if (hitObstacle()) resetPlayer();
  if (inGoal()) winner = true;
  
  // goal box
  fill("lightBlue");
  strokeWeight(2);
  rect(349, 1, 50, 50);
  if (winner) endScreen();
}

// n = number of ellipses
// r = radius of ring
function spawnCircles(x, y, n, r, group) {
  group.x = x;
  group.y = y;
  group.n = n;
  group.r = r;
  for (var i = 0; i < n; i++) {
    var xPos = x + r*Math.cos((2*PI/n)*i);
    var yPos = y + r*Math.sin((2*PI/n)*i);
    group.add(createSprite(xPos, yPos));
    group.get(i).angle = 2*PI/n*i;
  }
  group.setAnimationEach("circle");
  group.setColliderEach("circle");
}

// speed in rad/frame.  positive = counterclockwise
function rotateGroup(group, speed) {
  for (var i = 0; i < group.n; i++) {
    var target = group.get(i);
    target.angle += speed;
    target.x = group.x + group.r * Math.cos(target.angle);
    target.y = group.y + group.r * Math.sin(target.angle);
  }
}

function keys() {
  if (keyDown("up")) player.y -= playerSpeed;
  if (keyDown("down")) player.y += playerSpeed;
  if (keyDown("right")) player.x += playerSpeed;
  if (keyDown("left")) player.x -= playerSpeed;
}

function hitObstacle() {
  for (var i = 0; i < obstacles.length; i++) {
    if (obstacles[i].isTouching(player)) return true;
  }
  return false;
}

function resetPlayer() {
  player.x = 200;
  player.y = 200;
}

function inGoal() {
  if (player.x >= 350 && player.y <= 50) return true;
  return false;
}

function endScreen() {
  background("azure");
  textSize(40);
  fill("black");
  text("Nice!\nYou made it!", 100, 100);
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
