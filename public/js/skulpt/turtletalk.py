import turtle

talk = True

def announce_position(turtle_obj):

  x, y = rounded_pos(turtle_obj)

  if talk:
    if turtle_obj.prev_x == x and turtle_obj.prev_y == y:
      maybe_say("Position unchanged")
    else:
      maybe_say("Turtle is at {0}, {1}".format(x, y))
      if x > 0:
        if y > 0:
          maybe_say("Upper Right Quad")
        elif y == 0:
          maybe_say("Right Half")
        else:
          maybe_say("Lower Right Quad")
      elif x == 0:
        if y > 0:
          maybe_say("Upper Half")
        elif y == 0:
          maybe_say("Center of Screen")
        else:
          maybe_say("Lower Half")
      else:
        if y > 0:
          maybe_say("Upper Left Quad")
    turtle_obj.prev_x, turtle_obj.prev_y = [x, y]


def announce_orientation(turtle_obj):
  if talk:
    h = turtle_obj.heading()
    maybe_say("Turtle is facing {0} degrees".format(h))
    if h == 0:
      maybe_say("Facing Right")
    elif h > 0 and h < 90:
      maybe_say("Facing Upper Right")
    elif h == 90:
      maybe_say("Facing Up")
    elif h > 90 and h < 180:
      maybe_say("Facing Upper Left")
    elif h == 180:
      maybe_say("Facing Left")
    elif h > 180 and h < 270:
      maybe_say("Facing Lower Left")
    elif h == 270:
      maybe_say("Facing Down")
    elif h > 270 and h < 360:
      maybe_say("Facing Lower Right")

def maybe_say(msg):
  if talk:
    print(msg)

def rounded_pos(turtle_obj):
  x, y = turtle_obj.pos()
  return [round(x,0), round(y,0)]

class _Turtle(turtle.Turtle):
  def __init__(self):
    turtle.Turtle.__init__(self)
    maybe_say("Turtle Object initialized")

    self.prev_x = None
    self.prev_y = None
    announce_position(self)
    announce_orientation(self)

  def forward(self, distance):
    maybe_say("Turtle is moving forward {0} pixels".format(distance))
    turtle.Turtle.forward(self, distance)
    announce_position(self)

  def backward(self, distance):
    maybe_say("Turtle is moving forward {0} pixels".format(distance))
    turtle.Turtle.forward(self, distance)
    announce_position(self)

  def left(self, angle):
    maybe_say("Turtle is turning left {0} degrees".format(angle))
    turtle.Turtle.left(self, angle)
    announce_orientation(self)

  def right(self, angle):
    maybe_say("Turtle is turning right {0} degrees".format(angle))
    turtle.Turtle.right(self, angle)
    announce_orientation(self)

  def goto(self, x, y):
    maybe_say("Turtle is moving to {0}, {1}".format(round(x,0),round(y,0)))
    turtle.Turtle.goto(self, x, y)
    announce_position(self)

  def circle(self, radius):
    x, y = rounded_pos(self)
    h = self.heading()
    maybe_say("Turtle is drawing a circle with radius {0}, with the edge at {1}, {2}, facing {3} degrees.".format(radius, x, y, h))
    turtle.Turtle.circle(self, radius)

  def write(self, arg, move=False, align="left", font=("Arial", 8, "normal")):
    maybe_say("Writing {0} to screen".format(arg))
    turtle.Turtle.write(self, arg, move, align, font)

  def clear(self):
    maybe_say("Turtle drawings cleared")
    turtle.Turtle.clear(self)

  def onclick(self, fn, btn=1, add=None):
    def new_fn(x, y):
      maybe_say("Turtle click registered")
      fn(x, y)
    turtle.Turtle.onclick(self, new_fn, btn, add)
    maybe_say("Click function for Turtle registered")

  def ondrag(self, fn, btn=1, add=None):
    def new_fn(x, y):
      maybe_say("Turtle drag registered")
      fn(x, y)
    turtle.Turtle.onclick(self, new_fn, btn, add)
    maybe_say("Drag function for Turtle registered")

  def onrelease(self, fn, btn=1, add=None):
    def new_fn(x, y):
      maybe_say("Turtle release registered")
      fn(x, y)
    turtle.Turtle.onclick(self, new_fn, btn, add)
    maybe_say("Release function for Turtle registered")

def announce_listening_state(screen):
  if talk and (not screen.listening):
    maybe_say("Screen is not listening for events")
  else:
    maybe_say("Screen is listening for events")

class _Screen(turtle.Screen):
  def __init__(self):
    turtle.Screen.__init__(self)
    self.listening = False

  def onclick(self, fn, btn=1, add=None):
    def new_fn(x, y):
      maybe_say("Screen click detected at {0}, {1}".format(round(x,0),round(y,0)))
      fn(x, y)
    turtle.Screen.onclick(self, new_fn, btn, add)
    maybe_say("Registered screen click listener")
    announce_listening_state(self)

  def onkey(self, fn, key):
    def new_fn():
      maybe_say("{0} keypress detected".format(key))
      fn()
    turtle.Screen.onkey(self, new_fn, key)
    maybe_say("Registered screen key listener for {0} key".format(key))
    announce_listening_state(self)

  def listen(self):
    turtle.Screen.listen(self)
    self.listening = True
    announce_listening_state(self)

  def bgcolor(self, *args):
    turtle.Screen.bgcolor(self, *args)
    maybe_say("Screen color changed to {}".format(*args))

Turtle = _Turtle
Screen = _Screen
