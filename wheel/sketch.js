"use strict";



/**
 * Draw and interact with a circle of musical notes / arbitrary buttons.
 * 
 * Arc chunks always start counting at 12 o'clock and proceed clockwise.
 
 * TODO: allow rotation of the shape to next inversion (e.g. move highest note "up" to zero (i.e. size()) and then all other notes by same +ve delta.  retrigger the chord) 
 *       e.g. by dragging not within the note-buttons.
 *
 * TODO: allow the same interface to handle rhythm tiling.  Be careful abstraction doesn't diminish the interface (prefer another interface if necessary).
 *
 * TODO: allow annotations of chunks with their pitch classes.
 *
 * TODO: annotate (optionally) intervals.
 * 
 * FIX: when dragging notes, it's possible to delete one's own note from known-about notes (when I think dragging over same chunk) but then be left what that note still sounding.
 */


 var oscPluses;

 var _wheels;
 var _bgColor;
 var _snapshots;
 var _flashMsgs;
 var _showHelpText;
 var _clickPosns;
 
//Interaction
var _isLeftDragging = false; 
var _isRightDragging = false; 

//Visuals
var _schemes;
var _colorsGlobal;

var _drawPaletteNameUntil = 0;




function setup() {
  createCanvas(windowWidth, windowHeight);
  _schemes = new RingList(PaletteTools.makeSamplePalettes());
  _colorsGlobal = _schemes.current();
  _wheels = makeWheels();
  _snapshots = [];
  _flashMsgs = [];
  _showHelpText = false;
  //randomiseColors();
  _clickPosns = [];
  _bgColor = color(100);//lets us see we've reloaded page

}


function makeWheels(){
  var ws = [];
  ws.push(new Wheel({ 
    x: 1.25 * width / 4, 
    y: height / 2, 
    r: min(height, width) * 0.175, 
    numDivs: 6, 
    palette: _colorsGlobal
  } ));
  ws.push(new Wheel({
    x: 2.75 * width / 4, 
    y: height / 2, 
    r: min(height, width) * 0.35, 
    numDivs: 12, 
    palette: _colorsGlobal
  }));  
  return ws;
}

function choose(list) {
  if (list.length === 0) {
    return null;
  }
  var index = floor(random(list.length));
  return list[index];
}

function drawTexts(lines, x, y)
{
  push();
  //fill(0);
  //noStroke();
  stroke(255);
  fill(0);
  
  lines.forEach(function (line, i) {
    text(line, x, y + 25*i);
  });
  pop();
} 

function drawDebugText(x, y) {
  var touchesLines = touches.map(function (p, i) {
    return "touches[" + i + "] = " + p.x + ", " + p.y;
  });

  var lines = [//'accelX: ' + accelerationX, 
  "mouse: " + mouseX + ", " + mouseY, 
  "single-touch: " + touchX + ", " + touchY];

  drawTexts(lines.concat(touchesLines), x, y);
}

function drawHelpText(x,y) {  

    var kvPairs = [
      { k:"Left-Click", v: "Add note"}, 
      { k:"Left-Drag", v: "Move note"}, 
      //{ k:"Right-Drag", v: "Rotate chord under mouse"}, 
      { k:"< >", v: "Rotate chords on all wheels"}, 
      { k:"z x", v: "Rotate chord to use (common) note under mouse"}, 
      { k:"- +", v: "Change size of wheel under mouse"}, 
      { k:"c", v: "Change to a new palette"}, 
      { k:"s", v: "Shuffle the colours assignments from the current palette"}, 
      { k:"SPACE", v: "Clear wheel under mouse (or all) - PARTIAL IMPL"}, 
      //{ k:"o", v: "Change next issued oscillator type"}, 
      { k:"h, ?", v: "Show or Hide this help text"}];

  var lines = kvPairs.map(function (pair){ return pair.k + " -> " + pair.v ;});
  push();
  textAlign(LEFT);
  drawTexts(lines, x, y);
  pop();

}
function draw() {
  background(_bgColor);

  //drawOscPluses();
  _wheels.forEach(function(w) { w.draw();});
  if (_showHelpText) { 
    drawHelpText(30,30); 
    drawDebugText(30,height - 150); 
  } 

  drawAndCullFlashMessages(width/2, height/2);
  //  runScheduledStuff();

}

function cullFlashMessages() {
  if (_flashMsgs.length<1) {
    return;
  }
  var timeNow = millis();
  var keep = _flashMsgs.filter(function (fm) { 
    return (fm.until > timeNow); });
  _flashMsgs = keep;
}

function drawAndCullFlashMessages(x, y) {
  if (_flashMsgs.length<1) {
    return;
  }  
  cullFlashMessages();
  push();
  textAlign(CENTER);
  var msgs = _flashMsgs.map(function (item) { return item.msg; });
  drawTexts(msgs, x, y);
  pop();
}


function flashMessage(str, durMs) {
  durMs = durMs || 1000;
  var until = millis() + durMs;
  _flashMsgs.push({msg: str, until: until});
}

function keyTyped() {

  if (key==="h") {
    _showHelpText = !_showHelpText;
  }

  if (key===" ") {
    _wheels.forEach(function(w){ w.clear(); });    
  }

  function remakeWheels(sizeOffset) {
    var newWheels = _wheels.map(function (w){
      //TODO: only change if isUnderMousePred
      return w.remake(w.numDivs() + sizeOffset);
    });
    _wheels = newWheels;  
  }
  if (key === '>' || key === '.') {
    _wheels.forEach(function(w) { 
      w.rotatePlayingNotesFromTo(0, 1);
    } );
  }
  if (key === '<' || key === ',') {
    _wheels.forEach(function(w) { 
      w.rotatePlayingNotesFromTo(1, 0);
    } );
  }

  if (key === 'z') {
    _wheels.forEach(function(w) { 
      w.rotateChordWithCommonTone(RotationDir.DOWN, new Pos(mouseX, mouseY));
    });
  }

  if (key === 'x') {
    _wheels.forEach(function(w) { 
      w.rotateChordWithCommonTone(RotationDir.UP, new Pos(mouseX, mouseY));
    });
  }

  if (key === '+' || key === '=') {
    remakeWheels(1);
  }
  if (key === '-') {
    remakeWheels(-1);
  }
  
  if (key == 'c') {
    _colorsGlobal = _schemes.change();
    _wheels.forEach(function(w) { w.setColors(_colorsGlobal); } );
    flashMessage("Palette: "+_colorsGlobal.title(), 1000);
  }

  if (key == 's') {
    _colorsGlobal.shuffleSelf();
  }

}

function touchMoved() {
  mouseOrTouchDragged(touchX, touchY);
  return false;
}

function mouseDragged() {
  mouseOrTouchDragged(mouseX, mouseY);
}

function mousePressed() {
  mouseOrTouchStarted(mouseX, mouseY);
}

function touchStarted() {
  mouseOrTouchStarted(touchX, touchY);
  return false;
}

function mouseReleased() {
  mouseOrTouchEnded();
}

function touchEnded() {
  mouseOrTouchEnded();
}

function mouseOrTouchEnded() {
  _isLeftDragging = false;
  _isRightDragging = false;
  flashMessage("mouse/touch ended");
}

function mouseOrTouchStarted(x, y) {
  flashMessage("mouse/touch started " + [x, y], 500);
  _wheels.forEach(function(w){ 
    w.handleMouseClicked(new Pos(mouseX, mouseY));
  });
}

//just recognition of button and start / continued drag, 
//and then delegation...
function mouseOrTouchDragged(x, y) {
  //TODO: make this work with single/double touch?
  //It won't work with touch as it refers to mouse button left /right.  
  
  //TODO: right-button mouse dragging doesn't work in browser.
  //Drag on an outer rim?

  if (mouseButton === RIGHT) {
    if (!_isRightDragging) {
      _wheels.forEach(function (w) { 
        w.handleMouseStartRightDrag(new Pos(mouseX, mouseY));
      });
    } else {
      _wheels.forEach(function (w) { 
        w.handleMouseRightDraggedMore(new Pos(mouseX, mouseY));
      });
    }
    _isRightDragging = true;
  } else if (mouseButton == LEFT) {
    if (!_isLeftDragging) {
      _wheels.forEach(function (w) { 
        w.handleMouseStartLeftDrag(new Pos(mouseX, mouseY));
      });
    } else {
      _wheels.forEach(function (w) { 
        w.handleMouseLeftDraggedMore(new Pos(mouseX, mouseY));
      });
    }
    _isLeftDragging = true;
  } else {
    //centre button drag.
  }
}


function pacifyJSHintByCallingP5Functions(){
  //there's probably a way to tell jshint that
  //these fns will be called only by a framework.
  if (false){
    setup();
    draw();
    //mouseClicked();
    mousePressed();
    mouseReleased();
    mouseDragged();
    touchStarted();
    touchMoved();
    touchEnded();
    //keyPressed();
    keyTyped();
  }
}

/** 
* current spec properties: 
* x, y, r, numDivs, palette
*/
var Wheel = function (spec){ 
  var _colors = spec.palette;
  var _noteOffQueue = [];
  var _x = spec.x;
  var _y = spec.y;
  var _numDivs = spec.numDivs;
  var _outerCircleRad = spec.r; 
  var _innerCircleRad = spec.r * 0.65;
  var _leftDragStartChunk = null;
  var _rightDragStartChunk = null;
  var _defaultNoteDuration = null;
  var that = this; //expose this in inner fns.  http://javascript.crockford.com/private.html
  console.log(spec);
  //TODO: have the wheel be the interface and not know much about what it controls
  var _oscs = [];
  
  this.makeInitialPlayStates = function (){
    var ss = [];
    for (var i=0; i < _numDivs; i++) { 
      ss.push("not_playing");
    }
    return ss;
  };

  var _states = this.makeInitialPlayStates();
  
  this.numDivs = function() {
    return _numDivs;
  };

  this.clear = function() {
    _noteOffQueue = [];
    _oscs.forEach(function(o) {
      o.amp(0, 0.04);
      window.setTimeout(function () { o.stop(); }, 50);
    }); 
    _oscs = [];
    _states = this.makeInitialPlayStates();
  };



  this.remake = function(n) {
    this.clear();
    if (n < 2)
    {
      return this;
    }
    if (n > 24)
    {
      return this;
    }

    return new Wheel(_x, _y, _outerCircleRad, n, _colors);
  };


  this.labelForChunk = function(i) {
    var pitchClasses = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A" ,"A#", "B"];
    var labels = pitchClasses.concat(pitchClasses);
    return labels[i];
  };

  this.freqForChunk = function(i) {
    var fqs = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 
    440.00, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25, 659.25, 698.46, 739.99, 783.99, 
    830.61, 880.00, 932.33, 987.77, 1046.50];
    //TODO: guard and give better err msg.
    return fqs[i];
  };

  this.setColors = function(cs) {
    _colors = cs;
  };

  this.draw = function() {
    this.drawCircles();
    //    if (millis() < _drawOscNameUntil) {
    //      DrawingUtils.drawAnnotationCentredAt(a, new Pos(_x, _y), _oscFactory.currentName());
    //    }
    //    if (a.millis() < _drawNextAmpUntil) {
    //      DrawingUtils.drawAnnotationCentredAt(a, new Pos(_x, _y+30), "Next Amp: "+_nextAmp);
    //    }
    this.drawConnectingLines();
  };

  this.drawCircles = function() {
    this.drawArcs(_outerCircleRad, _numDivs, 
      _x, _y, 
      _colors.get(0), _colors.get(1), _colors.get(3));
    this.drawInnerCircle();
  };

  this.drawInnerCircle = function() {
    fill(_colors.get(1));
    stroke(255);
    ellipse(_x, _y, _innerCircleRad * 2, _innerCircleRad * 2);
  };

  this.drawConnectingLines = function() {
    var pairs = Pair.makeRing(this.playingNotes());
    pairs.forEach(function(pair) {
      that.drawLineBetween(pair.item(), pair.next());
    });
  };

  this.drawArcs = function(radius, numDivs, x, y, c1, c2, c3) {
    var arcR = radius * 2 + 1;
    var startAngle = PI * 1.5;
    var stopAngle = PI * 1.5;
    var delta = TWO_PI / numDivs;
    strokeWeight(3);
    stroke(255);

    for (var i=0; i < numDivs; i++)
    {
      var cs = [c1, c2, c3];
      var cChunk = cs[i%2];
      fill(cChunk);
      stopAngle = startAngle + delta;
      noStroke();
      arc(x, y, arcR, arcR, startAngle, stopAngle);
      if (_states[i] === "playing") {
        fill(c3);
        var marginAngle = 0;// 0.025; //0.0
        var highlightR = arcR;
        arc(x, y, highlightR, highlightR, startAngle + marginAngle, stopAngle - marginAngle);
      }

      DrawingUtils.drawAnnotationCentredAt(this.centreOfChunkAbsoluteCart(i), this.labelForChunk(i));

      startAngle = stopAngle;
    }
  };

  this.relPos = function(absPos) {
    return absPos.offsetNew(- _x, - _y);
  };

  this.hasChunkUnderMouse = function(absPos) {
    var chunkIx = this.getChunkMaybe(this.relPos(absPos));
    return (chunkIx !== null);
  };
  this.getClockThetaForChunkIndex = function(chunkIndex) {
    var chunkHalfWidth = PI / this.numDivs();
    return (chunkIndex * chunkHalfWidth * 2) + chunkHalfWidth;
  };

  this.getPsThetaForChunkIndex = function(chunkIndex) {
    return this.psThetaFromClockTheta(this.getClockThetaForChunkIndex(chunkIndex));
  };

  this.psThetaFromClockTheta = function(clockThetaRads) {
    var res = clockThetaRads;
    if (res > 1.5 * PI) {
      res = res - TWO_PI;
    }
    return res - PI/2;
  };
  this.reportPosition = function(absPos, relPos){
    var polar = relPos.toPolar();
    var r = polar.radius();
    if (Utils.within(r, 0, _outerCircleRad)) {
      var whichIx = this.whichChunk(polar.clockThetaRads());
      console.log("testing" + absPos + " rel " + relPos + ", polar "+polar+" i think in chunk " + 
        whichIx + " newtheta "+(polar.clockThetaRads()) + " newPSTheta: " + this.getPsThetaForChunkIndex(whichIx));
    }  
  };
  this.getChunkMaybe = function(relPos) {
    var polar = relPos.toPolar();
    if (Utils.within(polar.radius(), _innerCircleRad, _outerCircleRad)) {
      return this.whichChunk(polar.clockThetaRads());
    } else {
      return null;
    }
  };
  
  this.isChunkPlaying = function(chunkIx) {
    return(_states[chunkIx] === "playing");
  };

  //from: http://stackoverflow.com/questions/1985260/javascript-array-rotate
  Array.prototype.mmRotate = (function() {
      // save references to array functions to make lookup faster
      var push = Array.prototype.push,
          splice = Array.prototype.splice;

      return function(count) {
          //console.log("rotating " + this + " by " + count);
          var len = this.length >>> 0, // convert to uint
              count = count >> 0; // convert to int

          // convert count to value in range [0, len)
          count = ((count % len) + len) % len;

          // use splice.call() instead of this.splice() to make function generic
          push.apply(this, splice.call(this, 0, count));
          //console.log("yields " + this);
          return this;
      };
  })();

  this.rotateChordWithCommonTone = function(dir, p) {
    var chunkIx = this.getChunkMaybe(this.relPos(p));
    if (chunkIx !== null) {
      if (dir === RotationDir.UP) {
        var nextLowerM = this.nextLowerPlayingChunkIx(chunkIx);
        if (nextLowerM !== null) {
          this.rotatePlayingNotesFromTo(nextLowerM, chunkIx);
        }
      } else {
        var nextHigherM = this.nextHigherPlayingChunkIx(chunkIx);
        if (nextHigherM !== null) {
          this.rotatePlayingNotesFromTo(nextHigherM, chunkIx);
        }
      }
    }
  };

  this.nextHigherPlayingChunkIx = function(fromIx) {
    return Utils.nextHigherNumberInRing(this.playingNotes(), fromIx);
  };

  this.nextLowerPlayingChunkIx = function (fromIx) {
    return Utils.nextLowerNumberInRing(this.playingNotes(), fromIx);
  };

  this.rotatePlayingNotesFromTo = function(start, end) {
    //console.log("rotating playing notes from " + start + " to " +end+ " given numDivs=" + this.numDivs());
    var newStates = _states.slice();
    newStates.mmRotate(start - end);
    this.clear();

    newStates.forEach(function(ns, i){
      if (ns === "playing") {
        that.playNote(i, null);//TODO: preserve duration of prev note incarnation.
        _states[i] = "playing";
      }
    });
  };

  this.handleMouseMoved = function(absPos) {
    this.reportPosition(absPos, this.relPos(absPos));
  };

  this.handleMouseClicked = function(absPos) {
    var relPos = this.relPos(absPos);
    _clickPosns.push(absPos);
    var polar = relPos.toPolar();
    var r = polar.radius();
    if (Utils.within(r, _innerCircleRad, _outerCircleRad)) {
      var which = this.whichChunk(polar.clockThetaRads());
      this.playNote(which, _defaultNoteDuration);
      _states[which] = "playing";
    }
    //console.log(relPos + " -> polar radius:" + r +  ", theta(rads)" + polar.thetaRads() +  ", (degrees)" + polar.thetaDegrees());
    
    //console.log("playing notes: " + this.playingNotes());
    //console.log("RING: >>" + Pair.makeRing(this.playingNotes()) + "<<");
  };

  //TODO: this should be handled on mousePressed.
  this.handleMouseStartRightDrag = function (absPos) {
    _rightDragStartChunk = null;
    var chunkIx = this.getChunkMaybe(this.relPos(absPos));
    if (chunkIx !== null) {
      console.log("started right-dragging in chunk #" + chunkIx);
      _rightDragStartChunk = chunkIx;
    }
  };

  this.handleMouseRightDraggedMore = function (absPos) {
    var relPos = absPos.offsetNew(- _x, - _y);
    var chunkIx = this.getChunkMaybe(relPos);
    //console.log(String.format("testing mdr. chunk now is %d, and rdsc is: %d", chunkIx, _rightDragStartChunk));
    if (chunkIx !== null) {
      if (_rightDragStartChunk !== null) {
        if (_rightDragStartChunk == chunkIx) {
          //we haven't dragged past a chunk yet.
        } else {
          this.rotatePlayingNotesFromTo(_rightDragStartChunk, chunkIx);
          _rightDragStartChunk = chunkIx;
        }
      }
    }
  };

  this.handleMouseStartLeftDrag = function (absPos) {
    _leftDragStartChunk = null;
    
    flashMessage("wheel handling left drag start");
    
    var chunkIx = this.getChunkMaybe(this.relPos(absPos));
    if (chunkIx !== null) {

      if (this.isChunkPlaying(chunkIx)) {
        //console.log("started left-dragging in chunk #" + chunkIx);
        _leftDragStartChunk = chunkIx;
      } else {
        //console.log("chunk not playing: "+chunkIx);
      }
    }
  };

  this.handleMouseLeftDraggedMore = function (absPos) {
    var chunkIx = this.getChunkMaybe(this.relPos(absPos));
    if (chunkIx !== null) {
      if (_leftDragStartChunk !== null) {
        if (_leftDragStartChunk !== chunkIx) {
          this.stopNotesForChunk(_leftDragStartChunk);
          this.playNote(chunkIx, null);
          _states[chunkIx] = "playing";
          _leftDragStartChunk = chunkIx;
          //TODO: find the osc in the queued noteoffs for this chunk, and kill it
          // re-add a new note off for the new chunk.
        }
      }
    }
    //TODO: update the ring?
    //console.log(relPos + " -> " + r +  ", theta(rads)" + polar.thetaRads() +  ", (degrees)" + polar.thetaDegrees());
    //console.log("RING: " + makeRing(playingNotes()));
  };

  this.centreOfChunkAbsoluteCart = function(i) {
    var ctr = this.centreOfChunk(i).toCartesian();
    return ctr.offsetNew(_x, _y);
  };

  this.inEdgeCentreOfChunkAbsoluteCart = function(i) {
    var ctr = this.inEdgeCentreOfChunk(i).toCartesian();
    return ctr.offsetNew(_x, _y);
  };

  this.getHalfWayRadius = function() {
    var chunkDepth = _outerCircleRad - _innerCircleRad;
    return _outerCircleRad - (chunkDepth/2);
  };

  this.centreOfChunk = function(chunkIndex) {
    return new Polar(this.getHalfWayRadius(), this.getPsThetaForChunkIndex(chunkIndex));
  };

  this.inEdgeCentreOfChunk = function(chunkIndex) {
    return new Polar(_innerCircleRad, this.getPsThetaForChunkIndex(chunkIndex));
  };

  this.whichChunk = function(theta) {
    var res = floor(((theta) / TWO_PI) * this.numDivs());
    if (res < 0 || res >= this.numDivs()) {
      //throw new RuntimeException("Bad chunk index generated "+res+ " in conversion from theta "+theta);
    }
    return res;
  };

  this.stopNotesForChunk = function(chunkIx) {
    var newQueue = [];
    _noteOffQueue.forEach(function(noteOff) {
      if (noteOff.isForChunk(chunkIx)) {
        that.stopNote(noteOff);
        //console.log("stopping note for chunk : " + chunkIx);
      } else {
        newQueue.push(noteOff);
      }
    });
    _states[chunkIx] = "not_playing";
    return newQueue;
    //TODO: use something like haskell's partition to deal separately with expired and live notes
  };

  //TODO: rethink, now that the note-off queue will be holiding references to oscillators potentially
  // long after they've been removed from the wheel.
  this.stopNote = function(noteOff) {
    if (noteOff.osc() !== null) {
      noteOff.osc().amp(0, 0.04);
      window.setTimeout(function () {
        noteOff.osc().stop();
      }, 50);      
    }
  };


  this.playingNotes = function() {
    var res = [];
    _states.forEach(
      function(s, i) { 
        if (s === "playing") {
          res.push(i);
        }
      });
    return res;
  };

  this.drawLineBetween = function(chunk1, chunk2) {
    var p1 = this.inEdgeCentreOfChunkAbsoluteCart(chunk1);
    var p2 = this.inEdgeCentreOfChunkAbsoluteCart(chunk2);
    stroke(_colors.get(3));
    strokeWeight(7);
    line(p1.x(), p1.y(), p2.x(), p2.y());
  };

  this.printNoteOffQueue = function() {
    console.log(_noteOffQueue);
  };
  this.queueNoteOff = function(chunkIndex, osc, time) {
    var nOff = new NoteOff(chunkIndex, osc, time);
    _noteOffQueue.push(nOff);
  };

  this.playRandomNote = function(durMs) {
    var ri = random(this.numDivs());
    this.playNote(ri, durMs);
  };

  this.makeOsc = function (f, a) {
    var osc = new p5.Oscillator();
    osc.setType('sine');
    osc.freq(f, 0.05);
    //a simple env to fade in to the given target amplitude.
    //really we just want to avoid clicking.
    //flashMessage("amp: " + a.toPrecision(2), 500);
    //var env = new p5.Env(0.1, a, 60);
    //We can't currently ramp in from 0 to targetAmp without using an env., 
    //or without allowing some time to pass.  
    //An envelope means we lose control of the amp for later fading, 
    //so it's the latter.
    //for example, we can't say: osc.amp(0); osc.amp(targetAmp, 0.1)
    osc.amp(0);
    window.setTimeout(function () { 
      //TODO: careful, the osc may already have been disposed of in the future.
      osc.amp(a, 0.05); 
    }, 5);

    osc.start();
    //env.play();
    //NOTE: you can't do this - some time must pass or the previous osc.amp(0) setting will be forgotten and a starting vol of 0.5 will cause a click.
    //osc.amp(a, 3.0, 1);
    return osc;
  };

  this.playNote = function(chunkIndex, durMs) {
    var f = this.freqForChunk(chunkIndex);
    var osc = this.makeOsc(f, 0.15);
    //hold onto the note in a list of oscillators AND a list of notes (oscs) to stop at some point in the future.
    _oscs.push(osc);
//    console.log("playing note: " + chunkIndex +" with durMs " + durMs);
    var stopTime;
    if (durMs === null) { 
      stopTime = null;
    } else { 
      stopTime = millis() + durMs;
    }
    this.queueNoteOff(chunkIndex, osc, stopTime);
  };


  this.isUnderMouse = function(p) {
    var d = (new Pos(_x, _y)).distTo(p);
    return (d <= _outerCircleRad);
  };



}; //ENDS Wheel

var Utils = {
  within: function (v, minV, maxV) {
    return (v >= minV && v <= maxV);
  },
  
  //http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
  shuffleMod: function (o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  },

  //scared to modify the Array prototype
  last: function (arr) {
    return arr[arr.length - 1];
  },

  nextLowerNumberInRing: function (list, bar) {
    if (list.length < 1) {
      return null;
    }
    var nextLowest = null;
    list.forEach(function(c){
      if (c < bar) {
        nextLowest = c;
      }      
    });
    if (nextLowest === null) {
      nextLowest = Utils.last(list);
    }
    return nextLowest;
  },

  //TODO: re-impl using existing JS fns
  nextHigherNumberInRing: function (list, bar) {
    if (list.length < 1) {
      return null;
    }
    var revList = list.slice().reverse();
    var nextHigher = null;
    revList.forEach(function(c){
      if (c > bar) {
        nextHigher = c;
      }
    });
    if (nextHigher === null) {
      nextHigher = list[0];
    }
    return nextHigher;
  }
};

var Polar = function(r, theta) {
  var _r = r;
  var _theta = theta;

  this.toString = function() {
    return "("+_r + "@"+ _theta + " radians)";
  };

  this.radius = function() { 
    return _r;
  };

  this.clockThetaRads = function() {
    var newTheta = this.thetaRads() + PI/2;
    if (newTheta < 0) {
      return newTheta + TWO_PI;
    } else { 
      return newTheta;
    }
  };
  this.thetaRads = function() {
    return _theta;
  };
  this.thetaDegrees = function() { 
    return this.radToDeg(this.thetaRads());
  };

  this.radToDeg = function(rad) {
    return rad * 360 / TWO_PI;
  };

  this.toCartesian = function() {
    var x = round(this.radius()*cos(this.thetaRads()));
    var y = round(this.radius()*sin(this.thetaRads()));
    return new Pos(x, y);
  };
}; //END fn Polar


var Pair = function(item, prev, next) {
  var _item = item;
  var _prev = prev;
  var _next = next;

  this.prev = function() {
    return _prev;
  };
  this.item = function() {
    return _item;
  };
  this.next = function() {
    return _next;
  };
};//End Pair stuff

//TODO: somehow bundle this with the other Pair stuff.
Pair.makeRing = function(ns){
  var res = [];
  if (ns.length < 2) { 
    return res;
  } 
  var first = ns[0];
  var prev = Utils.last(ns);

  for (var i = 0; i < ns.length-1; i++)
  {
    var curr = ns[i];
    var next = ns[i+1];    
    res.push(new Pair(curr, prev, next));
    prev = curr;
  }

  res.push(new Pair(Utils.last(ns), prev, first)); 
  return res;
};


var NoteOff = function(chunkIndex, osc, time) {
  var _chunkIndex = chunkIndex;
  var _osc = osc;
  var _time = time;

  this.time = function() {
    return _time;
  };
  this.chunkIndex = function() {
    return _chunkIndex;
  };
  this.osc = function() {
    return _osc;
  };
  this.isForChunk = function(i) {
    return _chunkIndex === i;
  };

  this.expired = function(timeNow) {
    return (_time !== null && _time > 0 && _time <= timeNow);
  };

  this.toString = function() {
    return "NoteOff c:" + _chunkIndex + "@" + _time;
  };
};




var Pos = function(x, y) {
  var _x = x;
  var _y = y;
  
  this.distTo = function (other) {
    return dist(_x, _y, other.x(), other.y());
  };
  this.offsetNew = function(oX, oY) {
    return new Pos(_x + oX, _y + oY);
  };
  this.toString = function() {
    return "(" + _x + "," + _y + ")";
  };
  this.x = function() { 
    return _x;
  };
  this.y = function() { 
    return _y;
  };

  this.toPolar = function() {
    //theta will be in the range -PI to PI, with positive Y (down) meaning positive theta.
    var r = mag(_x,_y);
    var theta = atan2(_y, _x);  //NOT atan, that loses info
    return new Polar(r, theta);
  };
};//END fn POS


var DrawingUtils = {

  textCentred: function(annot, pos) {
    var x = pos.x()- textWidth(annot)/2;
    var y =  pos.y() + textAscent()/2;
    text(annot, x, y);
  },

  drawAnnotationCentredAt: function(p, annot) {
    fill(0);
    textSize(22);
    DrawingUtils.textCentred(annot, p);
  },

  drawAnnotationAt: function(p, annot) {
    fill(0);
    textSize(22);
    text(annot, p.x(),p.y());
  }
};  //DrawingUtils


var Palette = function (n, title, cs) {
  var _clNum = n;
  var _title = title;
  var _cs = cs;

  this.toString = function() {
    return "Palette " + _cs + " #" +  _clNum + ": " + _title;
  };
  
  this.title = function() {
    return _title;
  };
  
  this.get = function(i) {
    return _cs[i];
  };

  this.shuffleSelf = function() {
    Utils.shuffleMod(_cs);
  };

};//END fn Palette

var PaletteTools = { 

  makePalette: function(n, title, colorHexes) {
    var csMade = colorHexes.map(function(h){
      return color("#"+h);
    });
    return new Palette(n, title, csMade);
  }, 

  makePaletteRGB: function(n, title, cs) {
    //console.log("cs given: " + cs + ' for title ' + title + " and n " + n);
    return new Palette(n, title, cs);
  }, 

  
  makeSamplePalettes: function() {

    //color scheme - should be printable and be accessible for those with impaired colour vision 
    var colorsBright = PaletteTools.makePaletteRGB(-1, "bright", [
      color(241, 103, 69), 
      color(255, 198, 93), 
      color(123, 200, 164), 
      color(76, 195, 217)
      ]);

    var colorsGrayscale = PaletteTools.makePaletteRGB(-1, "grayscale", [
      color(0, 0, 0), 
      color(255, 255, 255), 
      color(127), 
      color(196)]);

    return [
    colorsBright, 
    PaletteTools.makePalette(92095, "Giant Goldfish", ["69D2E7", "A7DBD8", "E0E4CC", "F38630", "FA6900"]), 
    PaletteTools.makePalette(582195, "Chocolate Creams", ["755C3B", "FCFBE3", "FBCFCF", "CDBB99", "A37E58"]), 
    PaletteTools.makePalette(437077, "gemtone sea & shore", ["1693A5", "02AAB0", "00CDAC", "7FFF24", "C3FF68"]), 
    colorsGrayscale, 
    PaletteTools.makePalette(625987, "don't you go down", ["EDEBE6", "D6E1C7", "94C7B6", "403B33", "D3643B"]), 
    PaletteTools.makePalette(1098589, "coup de grâce", ["99B898", "FECEA8", "FF847C", "E84A5F", "2A363B"]), 
    PaletteTools.makePalette(678929, "War", ["230F2B", "F21D41", "EBEBBC", "BCE3C5", "82B3AE"]), 
    PaletteTools.makePalette(482416, "Wasabi Suicide", ["FF4242", "F4FAD2", "D4EE5E", "E1EDB9", "F0F2EB"]), 
    PaletteTools.makePalette(444487, "Curiosity Killed", ["EFFFCD", "DCE9BE", "555152", "2E2633", "99173C"]) 
    ];
  }
};

/** An ordered collection of which we can either:
 *   - ask for the current element, or 
 *   - advance to the next one. **/ 
 var RingList = function(items) {
  var _i = 0;
  var _items = items;
  
  this.current = function() {
    return _items[_i];
  };
  
  this.change = function() {
    if (_i >= _items.length -1) {
      _i = 0;
    } else {
      _i ++;
    }
    return this.current();
  };
};  // END fn RingList

var RotationDir = { UP: "up", DOWN: "down" };
