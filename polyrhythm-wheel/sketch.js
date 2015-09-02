"use strict";
//TODO: user control of BPM
//TODO: trigger (schedule) drum sounds / beeps
//TODO: trigger (optional) a bigger sound at the cycle start.
//TODO: don't use p5.sound's snd.play(delay) but web audio's snd.play(when).
//TODO: have timer hand go round in time with cycle speed.
var colors;
var bgColor;
var frameNum;
var times;
var sounds;
var nextBarStartTime;
var nextCycleTime;
var minCycleTime;

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
  sounds = [loadSound('sounds/hihat.mp3'), loadSound('sounds/snare.mp3'), loadSound('sounds/tom.mp3')];
  frameNum = 0;
  paused = false;
  
  times = new Times();
  createCanvas(windowWidth, windowHeight);
  bgColor = color(100);//lets us see we've reloaded page
  nextCycleTime = 3.0;
  minCycleTime = 0.5;
  nextBarStartTime = getAudioContext().currentTime + 2; //wait two secs (TODO: wait on sounds loading then go immediately)
  window.setTimeout(schedulePlaysForTimes, 2000);

}

function makePattern(n) {
  var res = [];
  for(var i = 0; i < n; i++) {
    res.push(1);
  }
  return res;
}

function playSound(snd, when){
  snd.rate(1);
  snd.play(when);
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
    playSound(sounds[2], barStartTime - startTime);

    for(var k = 0; k < 2; k++){
      for (var i = 0; i < ts[k]; ++i) {
        var when = barStartTime + i * cycleTime / ts[k];
        var offset = when - startTime;
        playSound(sounds[k], offset);
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
    text(arr[0], w, y + depth/2);
  });
}

function draw() {
  frameNum++;
  if (frameNum >= 360) {
    frameNum = 0;
  }
  background(colors.base2);
  drawPalette(width/5, height/5);
  var x = width/2;
  var y = height/2;
  var r = min(width/2, height/2);
  var rInner = r * 0.65;

  fill(colors.base00);
  ellipse(x, y, r * 2, r * 2);
  fill(colors.base2);
  ellipse(x, y, rInner * 2, rInner * 2);
  stroke(colors.orange);
  strokeWeight(8);
  drawLinesSplittingInto(times.getTimes()[0], x, y, r);
  strokeWeight(5);
  stroke(colors.blue);
  drawLinesSplittingInto(times.getTimes()[1], x, y, r);

  //TODO: track elapsed time since last draw, and use that delta 
  //to decide how far the timer's progressed.
  drawTimerLine(x, y, frameNum, r);

  fill(0);
  textAlign(CENTER);
  textSize(22);
  text(times.getTimesAsVsString(), x + 60, y - 40);
}

function drawTimerLine(x, y, deg, r){
  strokeWeight(5);
  stroke(colors.base3);

  var p = polarToCart(r, deg/360 * TWO_PI);
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

