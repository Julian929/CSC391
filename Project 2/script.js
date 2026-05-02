
let particles = [];
let connections = [];

let mode = "dream";

// SOUND
let osc;
let filterFX;
let reverbFX;
let started = false;

// Musical scale (C major)
let scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
let octaveShift = 1;

// Visual control
let bgHue = 220;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  background(230, 40, 8);
  noCursor();

  // SOUND SETUP
  osc = new p5.Oscillator('sine');
  osc.amp(0);

  filterFX = new p5.LowPass();
  reverbFX = new p5.Reverb();

  osc.disconnect();
  osc.connect(filterFX);
  reverbFX.process(filterFX, 4, 2);

  document.getElementById("startBtn").addEventListener("click", startAudioSystem);
}

function draw() {
  fadeBackground();
  ambientGlow();

  generateParticles();
  updateParticles();
  drawConnections();

  drawCursor();
  updateSound();
  drawModeLabel();
}

// ================= VISUALS =================

function fadeBackground() {
  noStroke();
  fill(bgHue, 30, 8, 6);
  rect(0, 0, width, height);

  bgHue += 0.03;
  if (bgHue > 360) bgHue = 0;
}

function ambientGlow() {
  noStroke();
  for (let i = 0; i < 3; i++) {
    fill((bgHue + i * 40) % 360, 50, 60, 4);
    ellipse(
      width / 2 + sin(frameCount * 0.01 + i) * 200,
      height / 2 + cos(frameCount * 0.012 + i) * 140,
      200 + i * 80
    );
  }
}

function generateParticles() {
  if (mouseIsPressed) {
    for (let i = 0; i < 4; i++) {
      particles.push(new Particle(mouseX, mouseY));
    }
  } else {
    particles.push(new Particle(mouseX, mouseY));
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();

    if (particles[i].finished()) {
      particles.splice(i, 1);
    }
  }
}

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);

      if (d < 120) {
        stroke((bgHue + 120) % 360, 40, 100, map(d, 0, 120, 40, 0));
        line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
      }
    }
  }
}

// ================= SOUND =================

function updateSound() {
  if (!started) return;

  let index = floor(map(mouseX, 0, width, 0, scale.length));
  index = constrain(index, 0, scale.length - 1);

  let freq = scale[index] * octaveShift;

  let filterFreq = map(mouseY, height, 0, 200, 4000);
  let amp = map(mouseY, height, 0, 0.05, 0.15);

  osc.freq(freq, 0.1);
  filterFX.freq(filterFreq, 0.1);
  osc.amp(amp, 0.2);
}

function mousePressed() {
  if (!started) return;

  // CHORD SOUND
  let baseIndex = floor(map(mouseX, 0, width, 0, scale.length));
  baseIndex = constrain(baseIndex, 0, scale.length - 1);

  let root = scale[baseIndex];
  let third = scale[(baseIndex + 2) % scale.length];
  let fifth = scale[(baseIndex + 4) % scale.length];

  playNote(root);
  playNote(third);
  playNote(fifth);
}

function playNote(freq) {
  let o = new p5.Oscillator('triangle');
  let env = new p5.Envelope();

  o.disconnect();
  o.connect(filterFX);

  o.freq(freq);

  env.setADSR(0.01, 0.2, 0.1, 0.5);
  env.setRange(0.3, 0);

  o.start();
  env.play(o);

  setTimeout(() => o.stop(), 1000);
}

function startAudioSystem() {
  userStartAudio();

  if (!started) {
    osc.start();
    osc.amp(0.08, 1);
    started = true;
  }
}

// ================= UI =================

function drawCursor() {
  noFill();
  stroke((bgHue + 180) % 360, 60, 100, 90);
  strokeWeight(2);
  ellipse(mouseX, mouseY, 30 + sin(frameCount * 0.1) * 6);

  stroke((bgHue + 240) % 360, 40, 100, 50);
  ellipse(mouseX, mouseY, 60);
}

function drawModeLabel() {
  noStroke();
  fill(0, 0, 100, 70);
  textAlign(RIGHT, BOTTOM);
  textSize(16);
  text("Harmonic Field", width - 25, height - 25);
}

// ================= PARTICLE CLASS =================

class Particle {
  constructor(x, y) {
    this.x = x + random(-10, 10);
    this.y = y + random(-10, 10);
    this.vx = random(-1.2, 1.2);
    this.vy = random(-1.2, 1.2);
    this.size = random(6, 20);
    this.life = 100;
    this.hue = (bgHue + random(-30, 30) + 360) % 360;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1.5;
    this.size *= 0.995;
  }

  display() {
    noStroke();
    fill(this.hue, 70, 100, this.life * 0.5);
    ellipse(this.x, this.y, this.size);
  }

  finished() {
    return this.life <= 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(230, 40, 8);
}
