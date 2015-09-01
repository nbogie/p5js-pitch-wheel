"use strict";
var colors;
var bgColor;


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


function setup() {
  createCanvas(windowWidth, windowHeight);
  bgColor = color(100);//lets us see we've reloaded page
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
    var y = i * h*2 / palette.length;
    var depth = h*2 / palette.length;
    rect(0, y, w*2, depth);
    fill(0);
    text(arr[0], w, y+depth/2);
  });
}

function draw() {
  background(colors.base2);
  drawPalette(width/5, height/5);
  var x = width/2;
  var y = height/2;
  var r = min(width/2, height/2);
  var rInner = r * 0.65;
  fill(colors.base00);
  ellipse(x, y, r*2, r*2);
  fill(colors.base2);
  ellipse(x, y, rInner*2, rInner*2);
  stroke(colors.magenta);
  strokeWeight(3);
  drawLinesSplittingInto(5, x, y, r);
  strokeWeight(2);
  stroke(colors.violet);
  drawLinesSplittingInto(4, x, y, r);
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
    line(x, y, x+p.x, y+p.y);
  }
}

function keyPressed() {
  if (keyCode === 32) {
    //
  }
}

function keyTyped() {
  if (key==="d") {

  }
  if (key==="h") {
  }
}

