var colors;
var bgColor;
var oscPluses;
var oscPlusFloating;


function OscPlus(f, a, x, y){
  this.osc = makeOsc(f,a);
  this.freqCache = f;
  this.ampCache = a;
  this.x = x;
  this.y = y;
  this.color = choose(colors);
  
  this.draw = function(){
    push();
    fill(this.color);
    circSize = map(this.ampCache, 0, 1, 4, 36);
    noStroke();
    ellipse(this.x, this.y, circSize, circSize);
    fill(0);
    text(""+round(this.freqCache), this.x+10, this.y-10);
    pop();
  };
  
  this.updatePos = function(x, y){
    this.x = x;
    this.y = y;
  }

  this.freq = function(f, time){
    this.freqCache = f;
    this.osc.freq(f, time);
  }
  this.amp = function(a, time){
    this.ampCache = a;
    this.osc.amp(a, time);
  }
  this.killOscSoftly = function(){
    this.osc.amp(0,0.01);
    this.osc.stop(0.02);
  };
}

function makeOsc(f, a){
  osc = new p5.Oscillator();
  osc.setType('sine');
  osc.freq(f);
  osc.amp(a, 0.05);
  osc.start();
  return osc;
}
function makePalette(){
  return [
        color( 241, 103, 69), 
        color( 255, 198, 93), 
        color( 123, 200, 164), 
        color( 76, 195, 217)]; 

}
function setup() {
  // uncomment this line to make the canvas the full size of the window
  createCanvas(windowWidth, windowHeight-100);
  bgColor = color(100);
  textAlign(CENTER);
  //makeOsc(440,0.2);  
  colors = makePalette();
  oscPluses = [];
  //oscPlusFloating = new OscPlus(440,0.3, 100,100);
}
function shutUp(){
  console.log("Shutting up.");
  
  //TODO: possibly osc will have been freed when p5 tries to adjust amp subsequent times.
  //      Find out correct way to dispose of a playing amp without hard amp drop.
  oscPluses.forEach(function(op){ op.killOscSoftly(); } );
  oscPluses = [];
  if (oscPlusFloating != null){
    oscPlusFloating.killOscSoftly();
   oscPlusFloating = null;
  }
}

function choose(list){
  var index = floor(random(list.length));
  return list[index];
}

function drawSquares(){
    colors.forEach(function(c, i){ 
    fill(c); 
    var jitter =0; //random(2);
    rect(42*i, 50 + jitter, 40, 40);
  });
}

function drawTexts(lines)
{
  push();
  fill(0);
  noStroke()
  lines.forEach(function(line, i){
    text(line, width/2, height/2 + 20*i);
  });
  pop();
} 

function drawDebugText(){
  var touchesLines = touches.map(function(p, i){
    return 'touches[' + i + '] = ' + p.x + ', ' + p.y;
  });

  var lines = [//'accelX: ' + accelerationX, 
           'mouse: ' + mouseX + ', ' + mouseY, 
           'single-touch: ' + touchX + ', ' + touchY];

  drawTexts(lines.concat(touchesLines));  
}

function draw() {
  background(bgColor);
  drawSquares();
  drawDebugText();
  drawOscPluses();
  drawFloatingOscPlus();
}

function drawOscPluses(){

  oscPluses.forEach(function(op){ op.draw()});
}
function drawFloatingOscPlus(){

  if (oscPlusFloating != null){
    push();
    fill(0);
    stroke(0);
    line(0, oscPlusFloating.y, width, oscPlusFloating.y);
    line(oscPlusFloating.x, 0, oscPlusFloating.x, height);
    pop();
    oscPlusFloating.draw();

  }
}


function keyPressed() {
  if (keyCode === 32) {
    shutUp();
  }
}

function xValToFreq(x){
  //TODO: constrain. 
  //TODO: linear / exp?
  return map(x, 0, width, 30, 1500);
}

function yValToAmp(y){
  //TODO: constrain. 
  return map(y, height, 0, 0, 1);
}

function touchMoved(){
  mouseOrTouchDragged(touchX, touchY);
  return false;
}
function mouseDragged(){
  mouseOrTouchDragged(mouseX, mouseY);
}
function mouseOrTouchDragged(x, y){
  console.log("touch moved");
  if (oscPlusFloating!=null){  
    oscPlusFloating.freq(xValToFreq(x), 0.05);
    oscPlusFloating.amp(yValToAmp(y), 0.05);
    oscPlusFloating.updatePos(x,y);
  }
  return false;
}
function mousePressed(){
  mouseOrTouchStarted(mouseX, mouseY);
}

function touchStarted(){
  mouseOrTouchStarted(touchX, touchY);
  return false;
}
function mouseReleased(){
  mouseOrTouchEnded();

}
function touchEnded(){
  mouseOrTouchEnded();
}

function mouseOrTouchEnded(){
  if (oscPlusFloating != null){
    oscPluses.push(oscPlusFloating);  //TODO: consider making a new osc based on the floating one.
    oscPlusFloating = null;
  }
}


function mouseOrTouchStarted(x, y){
  newOsc = new OscPlus(xValToFreq(x), 
                       yValToAmp(y), x, y);
  if(oscPlusFloating != null){
    oscPlusFloating.killOscSoftly();
  }

  oscPlusFloating = newOsc;

  return false;
}

function mouseClicked() {
  bgColor = choose(colors);
}