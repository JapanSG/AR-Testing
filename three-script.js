import * as THREE from 'three'

const width = window.innerWidth
const height = window.innerHeight

// init

const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10)
camera.position.z = 1

const scene = new THREE.Scene()

const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
const material = new THREE.MeshNormalMaterial()

const mesh = new THREE.Mesh(geometry, material)
mesh.position.set(0, 0, 0)
scene.add(mesh)

const renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize(width, height)
// renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement)

renderer.render(scene, camera)

// animation

// function animate( time ) {

// 	mesh.rotation.x = time / 500;
// 	mesh.rotation.z = time / 1000;

// 	renderer.render( scene, camera );

// }

const timers = {
  up: null,
  down: null,
  left: null,
  right: null,
  rollLeft: null,
  rollRight: null
}

function rotateMesh (direction) {
  let timer;
  switch (direction) {
    case 'up':
      timer = setTimeout(() => {
        mesh.rotation.x -= 0.05
        renderer.render(scene, camera)
        rotateMesh(direction)
      }, 10);
      break;
    case 'down':
      timer = setTimeout(() => {
        mesh.rotation.x += 0.05
        renderer.render(scene, camera)
        rotateMesh(direction)
      }, 10);
      break;
    case 'left':
      timer = setTimeout(() => {
        mesh.rotation.y -= 0.05
        renderer.render(scene, camera)
        rotateMesh(direction)
      }, 10);
      break;
    case 'right':
      timer = setTimeout(() => {
        mesh.rotation.y += 0.05
        renderer.render(scene, camera)
        rotateMesh(direction)
      }, 10);
      break;
    case 'rollLeft':
      timer = setTimeout(() => {
        mesh.rotation.z -= 0.05
        renderer.render(scene, camera)
        rotateMesh(direction)
      }, 10);
      break;
    case 'rollRight':
      timer = setTimeout(() => {
        mesh.rotation.z += 0.05
        renderer.render(scene, camera)
        rotateMesh(direction)
      }, 10);
      break;
    default:
      break;
  }
  renderer.render(scene, camera)
  timers[direction] = timer;
}

function keyboardRotateMesh (event) {
  const key = event.key.toLowerCase();
  switch (key) {
    case 'w':
      if (timers['up']) {
        return;
      }
      rotateMesh('up');
      break;
    case 's':
      if (timers['down']) {
        return;
      }
      rotateMesh('down');
      break;
    case 'a':
      if (timers['left']) {
        return;
      }
      rotateMesh('left');
      break;
    case 'd':
      if (timers['right']) {
        return;
      }
      rotateMesh('right');
      break;
    case 'q':
      if (timers['rollLeft']) {
        return;
      }
      rotateMesh('rollLeft');
      break;
    case 'e':
      if (timers['rollRight']) {
        return;
      }
      rotateMesh('rollRight');
      break;
  }
}

function keyboardStopRotateMesh (event) {
  const key = event.key.toLowerCase();
  let direction;
  switch (key) {
    case 'w':
      direction = 'up';
      break;
    case 's':
      direction = 'down';
      break;
    case 'a':
      direction = 'left';
      break;
    case 'd':
      direction = 'right';
      break;
    case 'q':
      direction = 'rollLeft';
      break;
    case 'e':
      direction = 'rollRight';
      break;
  }
  clearTimeout(timers[direction]);
  timers[direction] = null;
  console.log(`Stopped rotating ${direction}`);
}
    

const btnID = ['up', 'down', 'left', 'right', 'rollLeft', 'rollRight']
btnID.forEach(id => {
  const button = document.getElementById(id)
  button.addEventListener('mousedown', () => rotateMesh(id))
  button.addEventListener('mouseup', () => {
    clearTimeout(timers[id]);
    timers[id] = null;
    console.log(`Stopped rotating ${id}`);
    console.log(timers)
  })
})

window.addEventListener('keydown', keyboardRotateMesh)
window.addEventListener('keyup', keyboardStopRotateMesh)
