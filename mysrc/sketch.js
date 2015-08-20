var osc;
var playing = false;
var colors;
var bgColor;
//GENERATED SOURCE - DO NOT EDIT
function setup() {
  // uncomment this line to make the canvas the full size of the window
  createCanvas(windowWidth, windowHeight-100);
  bgColor = color(100);
  textAlign(CENTER);
  
  osc = new p5.Oscillator();
  osc.setType('sine');
  osc.freq(440);
  osc.amp(0);
  osc.start();
  colors = [
        color( 241, 103, 69), 
        color( 255, 198, 93), 
        color( 123, 200, 164), 
        color( 76, 195, 217)]; 

}

function choose(list){
  var index = floor(random(list.length));
  return list[index];
}

function draw() {
  background(bgColor);
  colors.forEach(function(c, i){ 
    fill(c); 
    rect(30*i, 50, 40, 40);
  });
  fill(0);
  text('click to play', width/2, height/2);
  text('accelX: ' + accelerationX, width/2, height/2 + 20);
  text('mouse: ' + mouseX + ', ' + mouseY, width/2, height/2 + 40);
  text('single-touch: ' + touchX + ', ' + touchY, width/2, height/2 + 60);
  touches.forEach(function(p, i){
    text('touch: ' + i + ' ' + p.x + ', ' + p.y, width/2, height/2 + 80 + 20*i);
  });
}

function touchMoved(){
  //bgColor = color(touchX % 256, 0, 0);
  osc.freq(map(touchX, 0, width, 100, 1000), 0.1);
  osc.amp(map(touchY, height, 0, 0, 1), 0.05);
  return false;
}

function touchStarted(){
  return false;
}

function mouseClicked() {
  bgColor = choose(colors);
  if (mouseX > 0 && mouseX < width && mouseY < height && mouseY > 0) {
    if (!playing) {
      // ramp amplitude to 0.5 over 0.1 seconds
      osc.amp(0.5, 0.05);
      playing = true;
    } else {
      // ramp amplitude to 0 over 0.5 seconds
      osc.amp(0, 0.5);
      playing = false;
    }
  }
}