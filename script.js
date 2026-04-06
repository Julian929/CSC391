let img;
let imgLoaded = false;

let song;
let songLoaded = false;

let filterFX;
let delayFX;

let mode = "blur"; // blur, pixel, color
let ripples = [];

function preload() {
  // Optional default image
  img = loadImage("https://picsum.photos/1000/700", () => {
    imgLoaded = true;
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // Audio effects
  filterFX = new p5.LowPass();
  delayFX = new p5.Delay();

  // Image upload
  const imageUpload = document.getElementById("imageUpload");
  imageUpload.addEventListener("change", handleImageUpload);

  // Audio upload
  const audioUpload = document.getElementById("audioUpload");
  audioUpload.addEventListener("change", handleAudioUpload);

  // Play button
  document.getElementById("playBtn").addEventListener("click", toggleAudio);
}

function draw() {
  background(10, 10, 18);

  if (imgLoaded && img) {
    drawManipulatedImage();
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Upload an image to begin", width / 2, height / 2);
  }

  updateAudio();
  updateRipples();
  drawOverlayText();
}

function drawManipulatedImage() {
  let scaleFactor = max(width / img.width, height / img.height);
  let drawW = img.width * scaleFactor;
  let drawH = img.height * scaleFactor;
  let x = (width - drawW) / 2;
  let y = (height - drawH) / 2;

  push();

  if (mode === "blur") {
    let blurAmount = map(dist(mouseX, mouseY, width / 2, height / 2), 0, width / 2, 0, 6);
    drawingContext.filter = `blur(${blurAmount}px)`;
    image(img, x, y, drawW, drawH);
    drawingContext.filter = "none";
  } 
  else if (mode === "pixel") {
    let pixelSize = int(map(mouseX, 0, width, 5, 40));
    drawPixelatedImage(img, x, y, drawW, drawH, pixelSize);
  } 
  else if (mode === "color") {
    tint(
      map(mouseX, 0, width, 120, 255),
      map(mouseY, 0, height, 100, 255),
      255,
      230
    );
    image(img, x, y, drawW, drawH);
    noTint();
  }

  // Ripple distortions
  for (let ripple of ripples) {
    ripple.display();
  }

  // Cursor glow
  noFill();
  stroke(255, 180);
  strokeWeight(2);
  ellipse(mouseX, mouseY, 40 + sin(frameCount * 0.1) * 8);

  pop();
}

function drawPixelatedImage(sourceImg, x, y, w, h, pixelSize) {
  sourceImg.loadPixels();

  for (let i = 0; i < w; i += pixelSize) {
    for (let j = 0; j < h; j += pixelSize) {
      let imgX = floor(map(i, 0, w, 0, sourceImg.width));
      let imgY = floor(map(j, 0, h, 0, sourceImg.height));

      let index = (imgX + imgY * sourceImg.width) * 4;
      let r = sourceImg.pixels[index];
      let g = sourceImg.pixels[index + 1];
      let b = sourceImg.pixels[index + 2];

      fill(r, g, b);
      noStroke();
      rect(x + i, y + j, pixelSize, pixelSize);
    }
  }
}

function mousePressed() {
  ripples.push(new Ripple(mouseX, mouseY));

  // Small sound gesture
  if (songLoaded && song && song.isPlaying()) {
    let rateBoost = random(0.9, 1.4);
    song.rate(rateBoost);
    setTimeout(() => {
      song.rate(map(mouseX, 0, width, 0.6, 1.8));
    }, 200);
  }
}

function keyPressed() {
  if (key === 'b' || key === 'B') mode = "blur";
  if (key === 'p' || key === 'P') mode = "pixel";
  if (key === 'c' || key === 'C') mode = "color";
  if (key === 'r' || key === 'R') ripples = [];
}

function drawOverlayText() {
  fill(255, 180);
  noStroke();
  textAlign(RIGHT, BOTTOM);
  textSize(16);
  text(`Mode: ${mode.toUpperCase()}`, width - 30, height - 30);
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function(e) {
      loadImage(e.target.result, loadedImg => {
        img = loadedImg;
        imgLoaded = true;
      });
    };
    reader.readAsDataURL(file);
  }
}

function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith("audio/")) {
    const url = URL.createObjectURL(file);

    if (song) {
      song.stop();
    }

    loadSound(url, loadedSound => {
      song = loadedSound;
      song.disconnect();
      song.connect(filterFX);
      delayFX.process(filterFX, 0.2, 0.4, 1500);
      songLoaded = true;
    });
  }
}

function toggleAudio() {
  userStartAudio();

  if (songLoaded && song) {
    if (song.isPlaying()) {
      song.pause();
    } else {
      song.loop();
    }
  }
}

function updateAudio() {
  if (songLoaded && song && song.isPlaying()) {
    let freq = map(mouseY, 0, height, 1800, 100);
    let resonance = map(mouseX, 0, width, 2, 18);
    filterFX.freq(freq);
    filterFX.res(resonance);

    let volume = map(mouseY, height, 0, 0.2, 1);
    song.setVolume(volume, 0.1);

    let playbackRate = map(mouseX, 0, width, 0.6, 1.8);
    song.rate(playbackRate);
  }
}

function updateRipples() {
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    if (ripples[i].finished()) {
      ripples.splice(i, 1);
    }
  }
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.alpha = 200;
    this.growth = random(2, 5);
  }

  update() {
    this.radius += this.growth;
    this.alpha -= 2.5;
  }

  display() {
    noFill();
    stroke(255, this.alpha);
    strokeWeight(2);
    ellipse(this.x, this.y, this.radius * 2);

    stroke(100, 180, 255, this.alpha * 0.5);
    ellipse(this.x, this.y, this.radius * 1.2);
  }

  finished() {
    return this.alpha <= 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}