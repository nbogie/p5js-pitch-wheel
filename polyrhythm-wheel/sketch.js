"use strict";
//TODO: reinstate samples, and correctly preload them
//TODO: don't use p5.sound's snd.play(delay) but web audio's snd.play(when).
//DONE: have timer hand go round in time with cycle speed.
//DONE: trigger (schedule) drum sounds / beeps
//DONE: trigger (optional) a bigger sound at the cycle start.
//DONE: user control of BPM
var colors;
var bgColor;
var frameNum;
var times;
var sounds;
var nextBarStartTime;
var nextCycleTime;
var minCycleTime;
var nextBarStartAndCycleTimes;
var oscsAndGains;

var paused;

var colors = {
  'base03':"#042028",
  'base02':"#0a2832",
  'base01':"#465a61",
  'base00':"#52676f",
  'base0':"#708183",
  'base1':"#81908f",
  'base2':"#e9e2cb",
  'base3':"#fcf4dc",
  'yellow':"#a57705",
  'orange':"#bd3612",
  'red':"#c60007",
  'magenta':"#c61b6e",
  'violet':"#5859b7",
  'blue':"#2075c7",
  'cyan':"#259185",
  'green':"#728a05" 
};




function Times() {
  var times = [3, 4];
  var next = 0;
  
  this.setNext = function (n){
    times[next] = n;
    next = (next + 1) % times.length;
  };
  
  this.getTimes = function () {
    return times.slice();
  };
  this.getTimesAsVsString = function () {
    return this.getTimes().map(function(n) { return n.toString(); }).join(" vs ");
  };
}

function setup() {
  //sounds = [loadSound('sounds/hihat.mp3'), loadSound('sounds/snare.mp3'), loadSound('sounds/tom.mp3')];
  sounds = [];
  frameNum = 0;
  paused = false;
  
  times = new Times();
  createCanvas(windowWidth, windowHeight);
  bgColor = color(100);//lets us see we've reloaded page
  nextCycleTime = 3.0;
  minCycleTime = 0.5;
  nextBarStartTime = getAudioContext().currentTime + 0.2; //wait two secs (TODO: wait on sounds loading then go immediately)
  nextBarStartAndCycleTimes = [];
  window.setTimeout(schedulePlaysForTimes, 100);
  oscsAndGains = [];
  createOscsAndGains();
  console.log(JSON.stringify(oscsAndGains));

}

function createOscsAndGains() {
  for(var i = 0; i < times.getTimes().length + 1; i++) {
    console.log("creating OSC and gain for " + times.getTimes().length);
    var osc = getAudioContext().createOscillator();
    osc.frequency.value = (i+1) * 220;
    osc.type = 'square';
    var gainNode = getAudioContext().createGain();
    osc.connect(gainNode);
    gainNode.connect(getAudioContext().destination);
    gainNode.gain.value = 0;
    osc.start(0);

    var obj = {osc: osc, gain: gainNode};
    oscsAndGains.push(obj);
  }
}

function playBeep(i, when){
  var dur = 0.03;
  oscsAndGains[i].gain.gain.setValueAtTime(0.3, when);
  oscsAndGains[i].gain.gain.setValueAtTime(0, when + dur);
}

function playSound(snd, when){
  //snd.rate(1);
  var delay = when - getAudioContext().currentTime;
  snd.play(delay);

  
}

function barInfoToString(i){
  return "Start: " + i.start.toPrecision(3) + 
         ", dur: " + i.dur.toPrecision(3) + 
         ", end: " + i.end.toPrecision(3);
}

function schedulePlaysForTimes() {
  if (paused) {
    return; //lets the schedule cycle drop.
  }
  console.log("scheduling called at " + getAudioContext().currentTime);
  var cycleTime = nextCycleTime;  // a function of "BPM"
  var ts = times.getTimes();
  
  var startTime = nextBarStartTime;
  var barStartTime;
  //TODO: schedule just enough bars that we'll react to changes in under two 
  //seconds but definitely have enough scheduled for a second or two, 
  //rather than constantly be re-registering this as a callback.
  for (var bar = 0; bar < 2; bar++) {
    barStartTime = startTime + (bar * cycleTime);
    nextBarStartAndCycleTimes.push({ start:barStartTime, dur:cycleTime, end: barStartTime + cycleTime });
    //playSound(sounds[2], barStartTime);
    playBeep(2, barStartTime);
    for(var k = 0; k < 2; k++){
      for (var i = 0; i < ts[k]; ++i) {
        var when = barStartTime + (i * cycleTime / ts[k]);
        
        //playSound(sounds[k], when);
        playBeep(k, when);
      }
    }
  }
  nextBarStartTime = barStartTime + cycleTime;
  var timeBeforeNextUnscheduledNoteMs = 1000 * (nextBarStartTime - getAudioContext().currentTime);
  
  //the next schedule can consider a different BPM and time sigs, even though we schedule its invokation here.
  window.setTimeout(schedulePlaysForTimes, timeBeforeNextUnscheduledNoteMs - 400);
}

function choose(list) {
  if (list.length === 0) {
    return null;
  }
  var index = floor(random(list.length));
  return list[index];
}

function drawPalette(w, h){

  var palette = [
  ["base03",  "#042028", "brightblack",   "black"],
  ["base02",  "#0a2832", "black",         "black"],
  ["base01",  "#465a61", "brightgreen",   "green"],
  ["base00",  "#52676f", "brightyellow",  "yellow"],
  ["base0",   "#708183", "brightblue",    "blue"],
  ["base1",   "#81908f", "brightcyan",    "cyan"],
  ["base2",   "#e9e2cb", "white",         "white"],
  ["base3",   "#fcf4dc", "brightwhite",   "white"],
  ["yellow",  "#a57705", "yellow",        "yellow"],
  ["orange",  "#bd3612", "brightred",     "red"],
  ["red",     "#c60007", "red",           "red"],
  ["magenta", "#c61b6e", "magenta",       "magenta"],
  ["violet",  "#5859b7", "brightmagenta", "magenta"],
  ["blue",    "#2075c7", "blue",          "blue"],
  ["cyan",    "#259185", "cyan",          "cyan"],
  ["green",   "#728a05", "green",         "green"]];

  palette.forEach(function(arr, i) { 
    fill(arr[1]);
    var y = i * h * 2 / palette.length;
    var depth = h * 2 / palette.length;
    rect(0, y, w * 2, depth);
    fill(0);
    noStroke();
    text(arr[0], w, y + depth/2);
  });
}

function centre() {
  return {
    x: width / 2,
    y: height / 2
  };
}
function drawCircleBases() {
  var c = centre();
  var r = wheelRadius();
  var rInner = r * 0.65;
  fill(colors.base00);
  strokeWeight(3);
  stroke(0);
  ellipse(c.x, c.y, r * 2, r * 2);
  fill(colors.base2);
  ellipse(c.x, c.y, rInner * 2, rInner * 2);
}
function wheelRadius() {
  return  min(width/2, height/2);
}
function drawLines() {
  var c = centre();
  var r = wheelRadius();
  stroke(colors.orange);
  strokeWeight(6);
  drawLinesSplittingInto(times.getTimes()[0], c.x, c.y, r);
  strokeWeight(4);
  stroke(colors.blue);
  drawLinesSplittingInto(times.getTimes()[1], c.x, c.y, r);
}


function draw() {
  var r = wheelRadius();

  background(colors.base2);
  drawPalette(width/5, height/5);
  var c = centre();
  drawCircleBases();
  drawLines();
  drawAnimTimerLineForNow(c.x, c.y, r);

  fill(0);
  textAlign(CENTER);
  textSize(22);
  noStroke();
  text(times.getTimesAsVsString(), c.x + 60, c.y - 40);
}

function drawAnimTimerLineForNow(x, y, r) {
  //text(JSON.stringify(nextBarStartAndCycleTimes.map(barInfoToString)), 100, 320);
  
  if (nextBarStartAndCycleTimes.length < 1) { 
    return;
  }
  var nowSec = getAudioContext().currentTime;
  //text(nowSec.toPrecision(2), 100, 350);
  var barInfo = nextBarStartAndCycleTimes[0];

  if (barInfo.start > nowSec){
    console.log("too early to render bar");
    return;
  }
  if (barInfo.end < nowSec){
    var gone = nextBarStartAndCycleTimes.shift();
    //console.log("shifted old bar " + JSON.stringify(gone) + " at " + nowSec.toPrecision(2));
    if (nextBarStartAndCycleTimes.length < 1) { 
      console.log("bar info was old and there's no new one.");
      //no new bar has been scheduled (or we've incorrectly jettisoned it)?
      return;
    } else {
      barInfo = nextBarStartAndCycleTimes[0];
    }
  }
  var elapsedSec = nowSec - barInfo.start;
  var elapsedRatio = elapsedSec / barInfo.dur;
  //text(elapsedRatio.toPrecision(3), 100, 380);

  drawLineToEdgePos(x, y, elapsedRatio * TWO_PI, r);
}

function drawLineToEdgePos(x, y, angle, r){
  //console.log("drawing line from " + JSON.stringify({x:x, y: y, angle: angle, r:r}));
  strokeWeight(5);
  stroke(colors.base3);

  var p = polarToCart(r, angle);
  line(x, y, x+p.x, y+p.y);
}

function polarToCart(r, angle){
  var x = round(r*cos(angle));
  var y = round(r*sin(angle));
  return {x:x, y:y};    
}

function drawLinesSplittingInto(n, x, y, r){
  var angleDeltaRadians = TWO_PI / n;
  for (var i=0; i <n; i++) {
    var angle = i * angleDeltaRadians;    
    var p = polarToCart(r, angle);
    line(x, y, x + p.x, y + p.y);
  }
}

function togglePause() {
  paused = ! paused;
  if (!paused) {
    nextBarStartTime = getAudioContext().currentTime + 0.3;
    schedulePlaysForTimes();
  }
  //TODO: stop or reset the animated timer hand
}

function keyPressed() {
  if (keyCode === 32) {
    togglePause();
  }
}

function changeCycleTime(inc) {
  nextCycleTime += inc;
  if (nextCycleTime <= minCycleTime){
    nextCycleTime = minCycleTime;    
  }
}

function keyTyped() {
  if (key>="1" && key <= "9") {
    times.setNext(key - "0");
  }
  if (key==="+" || key === "=") {
    changeCycleTime(-0.2);
  }
  if (key === "-"){
    changeCycleTime(0.2);
  }
}

