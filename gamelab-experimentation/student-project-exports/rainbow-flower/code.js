

var p5Inst = new p5(null, 'sketch');

window.preload = function () {
  initMobileControls(p5Inst);

  p5Inst._predefinedSpriteAnimations = {};
  p5Inst._pauseSpriteAnimationsByDefault = false;
  var animationListJSON = {"orderedKeys":[],"propsByKey":{}};
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

gradientRect(0, 100, 400, 200, 200);
flower(200, 200, 100);

function flower(xCoord, yCoord, depth) {
  stroke("black");
  strokeWeight(1);
  for (var i = 0; i < depth; i++) {
    fill(rgb(rainbowR(i, depth), rainbowG(i, depth), rainbowB(i, depth)));
    ellipse(xCoord + i * Math.cos(i), yCoord + i * Math.sin(i));
  }
}

function gradientRect(xStart, yStart, w, h, steps) {
  for (var i = 0; i < steps; i++) {
    noStroke();
    fill(rgb(rainbowR(i, steps), rainbowG(i, steps), rainbowB(i, steps)));
    rect(xStart + i / steps * w, yStart, w / steps, h);
  }
}

function rainbowR(s, t) {
  // var s = step;
  // var t = stepTotal;
  if (s <= t / 5) {
    return 255;
  } else if (s > t/5 && s <= 2*t/5) {
    return (-255*5/t)*(s - 2*t/5);
  } else if (s > 2*t/5 && s <= 4*t/5) {
    return 0;
  } else if (s > 4*t/5 && s <= t) {
    return (255*5/t)*(s - 4*t/5);
  } else {
    throw new Error();
  }
}

function rainbowG(s, t) {
  if (s <= t/5) {
    return (255*5/t)*s;
  } else if (s > t/5 && s <= 3*t/5) {
    return 255;
  } else if (s > 3*t/5 && s <= 4*t/5) {
    return (-255*5/t)*(s - 4*t/5);
  } else if (s > 4*t/5 && s <= t) {
    return 0;
  } else {
    throw new Error();
  }
}

function rainbowB(s, t) {
  if (s <= 2*t/5) {
    return 0;
  } else if (s > 2*t/5 && s <= 3*t/5) {
    return (255*5/t)*(s - 2*t/5);
  } else if (s > 3*t/5 && s <= t) {
    return 255;
  } else {
    throw new Error();
  }
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
