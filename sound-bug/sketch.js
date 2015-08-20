var osc = null;

function setup(){
      createCanvas(400, 400);
}

function makeOsc(){
  osc = new p5.Oscillator();
  osc.setType('sine');
  //osc.amp(0);
  osc.freq(440);
  //osc.amp(a, 3.0, 1);
}

function keyTyped(){
    console.log("new ver: typed: " + key);
    switch(key){
        case '1':
          makeOsc();
          break;
        case '2':
          osc.amp(0);
          break;
        case '3':
          osc.amp(1, 5.5);
          break;
        case '4':
          osc.start();
          break;
        case '5':
          makeOsc();
          osc.amp(0);
          osc.amp(1, 1.5);
          osc.start();
          break;
        case '8':
          makeOsc();
          osc.amp(0);
          osc.start();
          osc.amp(1, 3);
          break;
        case ' ':
          if (osc != null){
            osc.stop();
            osc = null;
          }
          break;
    }
}

function draw(){
    fill(0);
    rect(10,10,200,200);
}
