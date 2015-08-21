//"use strict";
var colors;
var bgColor;
var spectrumColor;
var waveformColor;
var oscPluses;
var oscPlusFloating;
var snapshots;
var flashMsgs;
var currentUserNameM;
var showHelpText;
var showWaveform;
var showSpectrum;
var gridWithOtherOscs;
var fft;

var lowestFreq = 30;
var highestFreq = 3000;

var messagesRef = null;

function makeOsc(f, a) {
  var osc = new p5.Oscillator();
  osc.setType('sine');
  osc.freq(f, 0.05);
  //a simple env to fade in to the given target amplitude.
  //really we just want to avoid clicking.
  //flashMessage("amp: " + a.toPrecision(2), 500);
  var env = new p5.Env(2, a, 10); //  makeEnv();
  osc.amp(env);
  osc.start();
  env.play();
  //NOTE: you can't do this - some time must pass or the previous osc.amp(0) setting will be forgotten and a starting vol of 0.5 will cause a click.
  //osc.amp(a, 3.0, 1);
  return osc;
}
function OscPlus(f, a, x, y) {
  this.ampCached = a;
  this.osc = makeOsc(f, a);
  this.x = x;
  this.y = y;
  this.color = choose(colors);
  this.cachedHarmSeq = harmsAndSubHarms(f);

  this.getAmp = function () {
    return this.ampCached;
  };

  //NOTE: this is into the web audio api and amp may not have a simple value, as it might itself be (for example) an oscillator.
  //Doesn't work if amp has been assigned an env(will eval to 0).
  this.getRealAmp = function () {
    return this.osc.amp().value;
  };
  this.getRealFreq = function () {
    return this.osc.freq().value;
  };
  this.draw = function (withGrid, withNumbers) {
    push();
    fill(this.color);
    var circSize = map(this.getAmp(), 0, maxOscAmp(), 7, 100);
    push();
    noStroke();
    ellipse(this.x, this.y, circSize, circSize);
    fill(0);
    text("" + round(this.getRealFreq()), this.x + 10, this.y - 10);
    pop();

    if (withGrid) {
      drawGridFor(this, withNumbers);
    }

    pop();
  };

  this.updatePos = function (x, y) {
    this.x = x;
    this.y = y;
  };

  this.freq = function (f, time) {
    this.osc.freq(f, time);
    //TODO: optimise?
    this.cachedHarmSeq = harmsAndSubHarms(f);
  };
  this.amp = function (a, time) {
    this.ampCached = a;
    this.osc.amp(a, time);
  };
  this.killOscSoftly = function () {
    this.osc.amp(0, 0.1);
    this.osc.stop(0.15);
    this.osc = null;
  };
}

function makeEnvNOTUSED() {
  var aT = 0.05; // attack time in seconds
  var aL = 0.8; // attack level 0.0 to 1.0
  var dT = 0.3; // decay time in seconds
  var dL = 0.7; // decay level  0.0 to 1.0
  var sT = 0.2; // sustain time in seconds
  var sL = dL; // sustain level  0.0 to 1.0
  var rT = 999; // release time in seconds
  // release level defaults to zero
  return new p5.Env(aT, aL, dT, dL, sT, sL, rT);
}


function makePalette() {
  return [
  color(241, 103, 69),
  color(255, 198, 93),
  color(123, 200, 164),
  color(76, 195, 217)]; 
}

function setup() {
  snapshots = [];
  flashMsgs = [];
  fft = new p5.FFT();
  // uncomment this line to make the canvas the full size of the window
  createCanvas(windowWidth, windowHeight);
  showHelpText = false;
  colors = makePalette();
  randomiseColors();
  bgColor = color(100);//lets us see we've reloaded page
  oscPluses = [];
  oscPlusFloating = null;
  gridWithOtherOscs = false;
  showSpectrum = true;
  showWaveform = true;

  setupFirebase();
  loadSnapshotsFromDB();
}
function maxOscAmp() {
  return 0.15;
}

function except(list, item) {
  return list.filter(function (c) { return c !== item; });
}

function randomiseColors() {
  bgColor = choose(colors);
  spectrumColor = choose(except(colors, bgColor));
  waveformColor = choose(except(colors, bgColor).concat([color(0), color(255)]));
}

function setupFirebase() {
  messagesRef = new Firebase("https://t4458o4c8k9.firebaseio-demo.com/");

  function handleNewMessage(snapshot) {
    var data = snapshot.val();
    console.log("new message added to firebase...");
    //flashMessage("new entry in db");
    //console.log(data)
  }

  // Add a callback that is triggered for each chat message.
  //not currently doing anything meaningful
  messagesRef.limitToLast(10).on("child_added", handleNewMessage);
}


function loadSnapshotsFromDB() {
  messagesRef.once("value", function (everything) {
    var allData = everything.val();
    console.log(allData);
    //Object.keys(allData).map(function (k) { return allData[k].type; })
    // yields: [undefined, undefined, "snapshot"]
    if (allData !== null) {
      var snapKeys = Object.keys(allData).filter(function (k) { return "snapshot" === allData[k].type; });
      snapshots = snapKeys.map(function (k) { return allData[k]; });
    } else {
      snapshots = [];
    }
  }, function (er) { 
    console.log("Error retrieving snapshots: "+ er.code);
  });
}

function shutUp() {  
  //TODO: possibly osc will have been freed when p5 tries to adjust amp subsequent times.
  //      Find out correct way to dispose of a playing amp without hard amp drop.
  oscPluses.forEach(function (op) { op.killOscSoftly(); } );
  oscPluses = [];
  if (oscPlusFloating !== null) {
    oscPlusFloating.killOscSoftly();
    oscPlusFloating = null;
  }
  randomiseColors();

}
function quieten() {
  //TODO: quieten should also affect the y value.  Consider moving the y first and just applying mapping of y to amp as normal on any pos change.
  //TODO: this may increase the vol of those quieter than stated here.
  oscPluses.forEach(function (op) { op.amp(0.1, 1); });
}

function getCurrentUserNameOrDefault() {
  if (currentUserNameM === undefined || currentUserNameM === null) { 
    return "anonymous";
  } else {
    return currentUserNameM; 
  }
}

function wipeDB() {
  messagesRef.set(null); 
}

function takeSnapshot() {
  var snapshot = 
  { 
    type: "snapshot", 
    owner: getCurrentUserNameOrDefault(),
    title: "untitled",
    time: new Date().getTime(),
    oscPluses: oscPluses.map(function (op) { return { f: op.getRealFreq(), a: op.getAmp(), x: op.x, y: op.y}; })
  };
  snapshots.push(snapshot);  
  if (messagesRef !== null) {
    messagesRef.push(snapshot);
  }
}

function restoreSnapshot() {
  if (snapshots === undefined || snapshots === null) {
    console.log("snapshots undefined or null!");
  }else {
    var snapshot = choose(snapshots);
    if (snapshot !== null) {
      shutUp();
      snapshot.oscPluses.forEach(function (item) { 
        var op = new OscPlus(item.f, item.a, item.x, item.y);
        oscPluses.push(op);
      });
    }
  }

}

function choose(list) {
  if (list.length === 0) {
    return null;
  }
  var index = floor(random(list.length));
  return list[index];
}

function drawSquares() {
  colors.forEach(function (c, i) { 
    fill(c); 
    var jitter =0; //random(2);
    rect(42*i, 50 + jitter, 40, 40);
  });
}

function drawTexts(lines, x, y)
{
  push();
  fill(0);
  noStroke();
  lines.forEach(function (line, i) {
    text(line, x, y + 20*i);
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
  var lines = [
  "SPACE - clear current config",
  "'s' - Snapshot the current config (to local and cloud)",
  "'r' - Restore a random config",
  "'d' - load all snapshots from cloud (ready to be restored).",
  "'g' - Toggle grid on and off (floating osc always uses grid)",
  "'w' - Toggle show waveform", 
  "'p' - Toggle show spectrum", 
  "'q' - Quieten fades(or raises) all osc amps to some low value.",
  "'c' - randomise colors (within same palette)", 
  "'h' - Show/Hide this help info",
  "SPACE - clear current config",
  ""
  ];
  push();
  textAlign(LEFT);
  drawTexts(lines, x, y);
  pop();

}
function drawSpectrum(spectrum) {
  push();
  noStroke();
  fill(spectrumColor);
  for (var i = 0; i< spectrum.length; i++) {
    var x = map(i, 0, spectrum.length / 8, 0, width);
    var h = -height + map(spectrum[i], 0, 255, height, 0);
    rect(x, height, width / spectrum.length, h );
  }
  pop();
}
function drawWaveform(waveform) {
  push();
  noFill();
  beginShape();
  stroke(waveformColor); // waveform is red
  strokeWeight(1);
  for (var i = 0; i< waveform.length; i++) {
    var x = map(i, 0, waveform.length, 0, width);
    var y = map( waveform[i], -1, 1, 0, height);
    vertex(x,y);
  }
  endShape();
  pop();
}

function drawFFTSpectrum() {
  var spectrum = fft.analyze(); 
  drawSpectrum(spectrum);
}

function drawFFTWaveform() {
  var waveform = fft.waveform();
  drawWaveform(waveform);
}

function draw() {
  background(bgColor);
  drawSquares();

  if (showSpectrum) {
    drawFFTSpectrum();
  }

  if (showWaveform) {
    drawFFTWaveform();
  }

  var gridWithFloatingOsc = true;
  var numbersWithFloatingOsc = gridWithFloatingOsc;

  drawOscPluses(gridWithOtherOscs, false);
  drawFloatingOscPlus(gridWithFloatingOsc, numbersWithFloatingOsc);

  if (showHelpText) { 
    drawHelpText(400,height - 250); 
    drawDebugText(150,height - 150); 
  } 

  drawAndCullFlashMessages(width/2, height/2);
}

function cullFlashMessages() {
  if (flashMsgs.length<1) {
    return;
  }
  var timeNow = millis();
  var keep = flashMsgs.filter(function (fm) { 
    return (fm.until > timeNow); });
  flashMsgs = keep;
}

function drawAndCullFlashMessages(x, y) {
  cullFlashMessages();
  push();
  textAlign(CENTER);
  var msgs = flashMsgs.map(function (item) { return item.msg; });
  drawTexts(msgs, x, y);
  pop();
}

function drawOscPluses(withGrid, withNumbers) {
  oscPluses.forEach(function (op) { op.draw(withGrid, withNumbers); });
}

function freqToScreenX(f) {
  //TODO: link this with its reciprocal fn's impl
  return map(f, lowestFreq, highestFreq, 0, width);
}

function drawFloatingOscPlus(withGrid, withNumbers) {

  if (oscPlusFloating !== null) {
    push();
    fill(0);
    stroke(0);
    line(0, oscPlusFloating.y, width, oscPlusFloating.y);
    line(oscPlusFloating.x, 0, oscPlusFloating.x, height);

    pop();
    oscPlusFloating.draw(withGrid, withNumbers);

  }
}

function drawGridFor(osc, withNumbers) {
  var series = osc.cachedHarmSeq;
  series = series.map(function (elem) { 
    elem.r = round(elem.r); 
    elem.x = freqToScreenX(elem.f);
    return elem; 
  });

  function fToText(fr) {
    fr = round(fr);
    if (fr < 100) {
      return ""+fr;
    } else {
      return fr + "Hz";
    }  
  }
  //console.log(series.length);
  //stroke(0.5, 0);
  //stroke("0xAAB0B0B0");
  push();
  fill(0);
  stroke(0);
  series.forEach(function (elem) { 
    //strokeWeight(1);
    line(elem.x, 0, elem.x, height);
  });
  pop();

  push();
  noStroke();
  fill(0);
  series.forEach(function (elem, i) { 
    if (withNumbers) {
      text(elem.desc, elem.x+5, constrain(osc.y-(i*10), 15, height - 30));
      text(fToText(elem.f), elem.x+5, constrain(osc.y+20+(i*10), 30, height - 15));
    }
  });
  pop();
}

function keyPressed() {
  if (keyCode === 32) {
    shutUp();
  }
}

function flashMessage(str, durMs) {
  durMs = durMs || 1000;
  var until = millis() + durMs;
  flashMsgs.push({msg: str, until: until});
}

function keyTyped() {
  if (key==="d") {
    loadSnapshotsFromDB();
    flashMessage("got snapshots from db");
  }
  if (key==="h") {
    showHelpText = !showHelpText;
  }
  if (key==="g") {
    gridWithOtherOscs = !gridWithOtherOscs;
  }
  if (key==="w") {
    showWaveform = !showWaveform;
  }

  if (key==="p") {
    showSpectrum = !showSpectrum;
  }

  if (key==="q") {
    quieten();
  }
  if (key==="s") {
    takeSnapshot();
    flashMessage("Saved Snapshot - 'r' to restore.", 2000);
    shutUp();
  }
  if (key==="W") {
    //wipeDB();
    //flashMessage("DB Wiped.  Seriously.", 2000);
  }
  if (key==="r") {
    restoreSnapshot();    
    flashMessage("restored a snapshot");
  }
  if (key==="c") {
    randomiseColors();    
  }
}
function mapXValToFreq(x) {
  //TODO: constrain. 
  //TODO: linear / exp?
  return map(x, 0, width, lowestFreq, highestFreq);
}

function mapYValToAmp(y) {
  //TODO: constrain. 
  return map(y, height, 0, 0, maxOscAmp());
}

function touchMoved() {
  mouseOrTouchDragged(touchX, touchY);
  return false;
}

function mouseDragged() {
  mouseOrTouchDragged(mouseX, mouseY);
}

function harmsAndSubHarms(baseF) {
  var ratioStrs = ["1/6", "1/5", "1/4", "1/3", "1/2", "1", "2", "3", "4", "5", "6"];
  return ratioStrs.map(function (r) { 
    return { 
      r: eval(r), 
      f: eval(r) * baseF, 
      desc: r 
    }; });
}

function mouseOrTouchDragged(x, y) {
  console.log("touch moved");
  if (oscPlusFloating !== null) {  
    oscPlusFloating.freq(mapXValToFreq(x), 0.05);
    oscPlusFloating.amp(mapYValToAmp(y), 0.05);
    oscPlusFloating.updatePos(x,y);
  }
  return false;
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
  if (oscPlusFloating !== null) {
    oscPluses.push(oscPlusFloating);  //TODO: consider making a new osc based on the floating one.
    oscPlusFloating = null;
  }
}


function mouseOrTouchStarted(x, y) {
  var newOsc = new OscPlus(mapXValToFreq(x), 
   mapYValToAmp(y), x, y);
  if(oscPlusFloating !== null) {
    oscPlusFloating.killOscSoftly();
  }
  oscPlusFloating = newOsc;
  return false;
}

function mouseClicked() {
  //randomiseColors();
}

function pacifyJSHintByCallingP5Functions(){
  //there's probably a way to tell jshint that
  //these fns will be called only by a framework.
  if (false){
    setup();
    draw();
    mouseClicked();
    mousePressed();
    mouseReleased();
    mouseDragged();
    touchStarted();
    touchMoved();
    touchEnded();
    keyPressed();
    keyTyped();
  }
}