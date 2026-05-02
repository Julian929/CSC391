let scene, camera, renderer;
let objects = [];
let particles = [];

let move = { f:false,b:false,l:false,r:false };
let yaw=0, pitch=0;

let clock = new THREE.Clock();

// SOUND
let audioCtx;
let masterGain;

// scale (harmonic system)
let scale = [261.63,293.66,329.63,349.23,392.00,440.00,493.88];

init();
animate();

function init(){
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  camera = new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  document.body.appendChild(renderer.domElement);

  let light = new THREE.PointLight(0xffffff,1,100);
  light.position.set(0,10,0);
  scene.add(light);

  scene.add(new THREE.AmbientLight(0x404040));

  // initial structures
  for(let i=0;i<40;i++){
    createStructure(rand(-60,60),0,rand(-60,60));
  }

  camera.position.set(0,6,20);

  document.addEventListener("keydown",e=>key(e,true));
  document.addEventListener("keyup",e=>key(e,false));
  document.addEventListener("mousemove",mouseMove);
  document.addEventListener("click",handleClick);
  window.addEventListener("resize",resize);
}

// ===== STRUCTURES =====
function createStructure(x,y,z){
  let h = rand(3,12);

  let geo = new THREE.CylinderGeometry(0.5,1.5,h,6);
  let mat = new THREE.MeshStandardMaterial({
    color:new THREE.Color(`hsl(${rand(180,260)},40%,60%)`)
  });

  let mesh = new THREE.Mesh(geo,mat);
  mesh.position.set(x,h/2,z);

  scene.add(mesh);
  objects.push(mesh);
}

// ===== PARTICLES =====
class Particle{
  constructor(x,y,z){
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2,8,8),
      new THREE.MeshBasicMaterial({color:0x88ccff})
    );

    this.mesh.position.set(x,y,z);
    scene.add(this.mesh);

    this.life = 100;
    this.vx = rand(-0.02,0.02);
    this.vy = rand(0.01,0.05);
    this.vz = rand(-0.02,0.02);
  }

  update(){
    this.mesh.position.x += this.vx;
    this.mesh.position.y += this.vy;
    this.mesh.position.z += this.vz;
    this.life--;

    if(this.life<=0){
      scene.remove(this.mesh);
      return false;
    }
    return true;
  }
}

// ===== INPUT =====
function key(e,down){
  if(e.key==="w") move.f=down;
  if(e.key==="s") move.b=down;
  if(e.key==="a") move.l=down;
  if(e.key==="d") move.r=down;
}

function mouseMove(e){
  yaw -= e.movementX*0.002;
  pitch -= e.movementY*0.002;
  pitch=Math.max(-Math.PI/2,Math.min(Math.PI/2,pitch));
}

function handleClick(){
  document.body.requestPointerLock();

  let x = camera.position.x + Math.sin(yaw)*8;
  let z = camera.position.z + Math.cos(yaw)*8;

  createStructure(x,0,z);
  playChord();
}

// ===== MOVEMENT =====
function moveCamera(dt){
  let s = 12*dt;

  if(move.f){
    camera.position.x += Math.sin(yaw)*s;
    camera.position.z += Math.cos(yaw)*s;
  }
  if(move.b){
    camera.position.x -= Math.sin(yaw)*s;
    camera.position.z -= Math.cos(yaw)*s;
  }
  if(move.l){
    camera.position.x -= Math.cos(yaw)*s;
    camera.position.z += Math.sin(yaw)*s;
  }
  if(move.r){
    camera.position.x += Math.cos(yaw)*s;
    camera.position.z -= Math.sin(yaw)*s;
  }

  camera.rotation.order="YXZ";
  camera.rotation.y=yaw;
  camera.rotation.x=pitch;

  // generate particles while moving
  if(move.f||move.b||move.l||move.r){
    particles.push(new Particle(
      camera.position.x,
      camera.position.y-2,
      camera.position.z
    ));
  }
}

// ===== SOUND =====
function initAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
}

function playChord(){
  initAudio();

  let idx = Math.floor(Math.random()*scale.length);

  let root = scale[idx];
  let third = scale[(idx+2)%scale.length];
  let fifth = scale[(idx+4)%scale.length];

  [root,third,fifth].forEach(freq=>{
    let o = audioCtx.createOscillator();
    let g = audioCtx.createGain();

    o.frequency.value = freq;
    o.type="sine";

    o.connect(g);
    g.connect(masterGain);

    g.gain.setValueAtTime(0.2,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+1);

    o.start();
    o.stop(audioCtx.currentTime+1);
  });
}

// ===== LOOP =====
function animate(){
  requestAnimationFrame(animate);

  let dt = clock.getDelta();

  moveCamera(dt);

  objects.forEach(o=>o.rotation.y+=0.002);

  particles = particles.filter(p=>p.update());

  renderer.render(scene,camera);
}

function resize(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}

function rand(a,b){return Math.random()*(b-a)+a;}
