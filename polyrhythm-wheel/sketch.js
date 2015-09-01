"use strict";
//TODO: user control of BPM
//TODO: trigger (schedule) drum sounds / beeps
//TODO: trigger (optional) a bigger sound at the cycle start.

var colors;
var bgColor;
var frameNum;
var times;

var part;

var sounds;



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
  sounds = [loadSound('sounds/hihat.mp3'), loadSound('sounds/snare.mp3')];

  frameNum = 0;
  times = new Times();
  createCanvas(windowWidth, windowHeight);
  bgColor = color(100);//lets us see we've reloaded page
  
  part = new p5.Part();
  part.setBPM(30);
  recreatePhrasesForTimes(part, times.getTimes());
  window.setTimeout(function () {
    part.loop();    
  }, 2000);

}

function makePattern(n) {
  var res = [];
  for(var i = 0; i < n; i++) {
    res.push(1);
  }
  return res;
}

function makeSound0(){
  makeSound(0);  
}

function makeSound(n){
  sounds[n].rate(1);
  sounds[n].play();
}

function makeSound1(){
  makeSound(1);
}

function removeAllPhrasesFromPart(p) {
  for(var i=0 ; i < 10; i++) {
    p.removePhrase('phrase' + i);
  }
}

function recreatePhrasesForTimes(p, ts) {
  removeAllPhrasesFromPart(p);
  ts.forEach(function(n, i) {  
    var ptn = makePattern(n);
    console.log("ptn: " + ptn);
    var fn = (i % 2 === 0 ) ? makeSound0 : makeSound1;
    p.addPhrase(new p5.Phrase('phrase'+i, fn, ptn));
  });
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
  stroke(colors.magenta);
  strokeWeight(3);
  drawLinesSplittingInto(times.getTimes()[0], x, y, r);
  strokeWeight(2);
  stroke(colors.violet);
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

function keyPressed() {
  if (keyCode === 32) {
    //
  }
}

function keyTyped() {
  if (key>="1" && key <= "9") {
    times.setNext(key - "0");
    recreatePhrasesForTimes(part, times.getTimes());
    part.stop();
    part.loop();
  }
  if (key==="h") {
  }
}

