var colors;
var bgColor;
var oscPluses;
var oscPlusFloating;
var snapshots;
var flashMsgs;


function OscPlus(f, a, x, y){
  this.osc = makeOsc(f,a);
  this.x = x;
  this.y = y;
  this.color = choose(colors);
  //NOTE: this is into the web audio api and amp may not have a simple value, as it might itself be (for example) an oscillator.
  this.getAmp = function(){
    return this.osc.amp().value;
  };
  this.getFreq = function(){
    return this.osc.freq().value;
  };
  this.draw = function(){
    push();
    fill(this.color);
    circSize = map(this.getAmp(), 0, 1, 4, 36);
    noStroke();
    ellipse(this.x, this.y, circSize, circSize);
    fill(0);
    text(""+round(this.getFreq()), this.x+10, this.y-10);
    pop();
  };
  
  this.updatePos = function(x, y){
    this.x = x;
    this.y = y;
  }

  this.freq = function(f, time){
    this.osc.freq(f, time);
  }
  this.amp = function(a, time){
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
  snapshots = [];
  flashMsgs = [];
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
function quieten(){
  //TODO: quieten should also affect the y value.  Consider moving the y first and just applying mapping of y to amp as normal on any pos change.
  oscPluses.forEach(function(op){ op.amp(0.2, 2)});
}

function takeSnapshot(){
  snapshot = oscPluses.map(function(op) { return { f: op.getFreq(), a: op.getAmp(), x: op.x, y: op.y}; });
  snapshots.push(snapshot);
  console.log("saved: " + snapshot);
}

function restoreSnapshot(){
  snapshot = choose(snapshots);
  console.log("restoring " + snapshot);
  if (snapshot != null){
    shutUp();

    snapshot.forEach(function(item){ 
      op = new OscPlus(item.f, item.a, item.x, item.y);
      oscPluses.push(op);
    });
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

function drawTexts(lines, x, y)
{
  push();
  fill(0);
  noStroke()
  lines.forEach(function(line, i){
    text(line, x, y + 20*i);
  });
  pop();
} 

function drawDebugText(x, y){
  var touchesLines = touches.map(function(p, i){
    return 'touches[' + i + '] = ' + p.x + ', ' + p.y;
  });

  var lines = [//'accelX: ' + accelerationX, 
           'mouse: ' + mouseX + ', ' + mouseY, 
           'single-touch: ' + touchX + ', ' + touchY];

  drawTexts(lines.concat(touchesLines), x, y);
}

function draw() {
  background(bgColor);
  drawSquares();
  drawDebugText(150,height - 150);
  drawOscPluses();
  drawFloatingOscPlus();
  drawAndCullFlashMessages(width/2, height/2);
}

function cullFlashMessages(){
  if (flashMsgs.length<1){
    return;
  }
  timeNow = millis();
  keep = flashMsgs.filter(function(fm){ 
    console.log(fm.until > timeNow);
    return (fm.until > timeNow); });
  console.log(keep);
  flashMsgs = keep;
}
  
function drawAndCullFlashMessages(x, y){
  cullFlashMessages();
  msgs = flashMsgs.map(function(item){ return item.msg; });
  drawTexts(msgs, x, y);
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

function flashMessage(str, durMs){
  until = millis() + durMs;
  flashMsgs.push({msg: str, until: until});
}

function keyTyped(){
  if (key==='q'){
    quieten();
  }
  if (key==='s'){
    takeSnapshot();
    flashMessage("Saved Snapshot - 'r' to restore.", 2000);
    shutUp();
  }
  if (key==='r'){
    restoreSnapshot();    
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