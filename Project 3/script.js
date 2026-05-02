let scene, camera, renderer;
let objects = [];
let orbs = [];

let move = { forward: false, back: false, left: false, right: false };
let yaw = 0, pitch = 0;

let clock = new THREE.Clock();

// AUDIO
let audioCtx;
let oscillator;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // LIGHTS
  let ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  let light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(0, 10, 0);
  scene.add(light);

  // FLOOR
  let grid = new THREE.GridHelper(200, 50, 0x444444, 0x222222);
  scene.add(grid);

  // INITIAL STRUCTURES
  for (let i = 0; i < 40; i++) {
    createStructure(rand(-60,60), 0, rand(-60,60));
  }

  // FLOATING ORBS
  for (let i = 0; i < 20; i++) {
    createOrb(rand(-50,50), rand(5,20), rand(-50,50));
  }

  camera.position.set(0, 6, 20);

  // CONTROLS
  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  document.addEventListener("click", handleClick);

  document.addEventListener("mousemove", onMouseMove);

  window.addEventListener("resize", onResize);
}

// ================= STRUCTURES =================
function createStructure(x, y, z) {
  let height = rand(3, 12);

  let geo = new THREE.CylinderGeometry(0.5, 1.5, height, 6);
  let mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(`hsl(${rand(180,260)}, 40%, 60%)`),
    roughness: 0.4,
    metalness: 0.3
  });

  let mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, height/2, z);

  scene.add(mesh);
  objects.push(mesh);
}

// ================= ORBS =================
function createOrb(x,y,z) {
  let geo = new THREE.SphereGeometry(0.6, 16, 16);
  let mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(`hsl(${rand(200,280)}, 80%, 70%)`)
  });

  let orb = new THREE.Mesh(geo, mat);
  orb.position.set(x,y,z);

  scene.add(orb);
  orbs.push(orb);
}

// ================= CONTROLS =================
function keyDown(e){
  if(e.key==="w") move.forward = true;
  if(e.key==="s") move.back = true;
  if(e.key==="a") move.left = true;
  if(e.key==="d") move.right = true;
}

function keyUp(e){
  if(e.key==="w") move.forward = false;
  if(e.key==="s") move.back = false;
  if(e.key==="a") move.left = false;
  if(e.key==="d") move.right = false;
}

function onMouseMove(e){
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;

  pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
}

function handleClick() {
    console.log("ckicked");
  document.body.requestPointerLock();

  createStructure(
    camera.position.x + Math.sin(yaw)*8,
    0,
    camera.position.z + Math.cos(yaw)*8
  );

  startAudio();
}

// ================= MOVEMENT =================
function moveCamera(delta){
  let speed = 12 * delta;

  if(move.forward){
    camera.position.x += Math.sin(yaw) * speed;
    camera.position.z += Math.cos(yaw) * speed;
  }
  if(move.back){
    camera.position.x -= Math.sin(yaw) * speed;
    camera.position.z -= Math.cos(yaw) * speed;
  }
  if(move.left){
    camera.position.x -= Math.cos(yaw) * speed;
    camera.position.z += Math.sin(yaw) * speed;
  }
  if(move.right){
    camera.position.x += Math.cos(yaw) * speed;
    camera.position.z -= Math.sin(yaw) * speed;
  }

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

// ================= ANIMATION =================
function animate(){
  requestAnimationFrame(animate);

  let delta = clock.getDelta();

  moveCamera(delta);

  // animate structures
  objects.forEach(obj=>{
    obj.rotation.y += 0.003;
  });

  // animate orbs
  orbs.forEach((orb,i)=>{
    orb.position.y += Math.sin(Date.now()*0.001 + i)*0.01;
  });

  renderer.render(scene, camera);
}

// ================= AUDIO =================
function startAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 220;

    oscillator.connect(audioCtx.destination);
    oscillator.start();
  }

  let freq = 200 + (Math.sin(Date.now()*0.001) * 100);
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
}

// ================= UTILS =================
function rand(min,max){
  return Math.random()*(max-min)+min;
}

function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
