import * as THREE from 'three'

const scene = new THREE.Scene()

// The cube will have a different color on each side.
const materials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000 }),
  new THREE.MeshBasicMaterial({ color: 0x0000ff }),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  new THREE.MeshBasicMaterial({ color: 0xff00ff }),
  new THREE.MeshBasicMaterial({ color: 0x00ffff }),
  new THREE.MeshBasicMaterial({ color: 0xffff00 })
]

// Create the cube and add it to the demo scene.
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.2, 0.2),
  materials
)
// cube.position.set(0, 0, -1)
// scene.add(cube)

// Set up the WebGLRenderer, which handles rendering to the session's base layer.
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

const camera = new THREE.PerspectiveCamera();
camera.matrixAutoUpdate = false

// CRUCIAL: Tell Three.js to manage WebXR internally
document.body.appendChild(renderer.domElement);

async function activateXR () {
try {
    const session = await navigator.xr.requestSession('immersive-ar');
    
    // Hand the session over to Three.js
    renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(session);
    
    // Let Three.js handle the animation loop instead of manual session.requestAnimationFrame
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    // When the user taps the screen, place the cube
    controller.addEventListener('select', () => {
      // Move the cube to 1 meter in front of the controller (the phone camera)
      cube.position.set(0, 0, -1);
      
      // Apply the controller's current world matrix to the cube
      cube.position.applyMatrix4(controller.matrixWorld);
      cube.quaternion.setFromRotationMatrix(controller.matrixWorld);
      
      // Finally, add it to the scene
      scene.add(cube);
    });

  } catch (error) {
    console.error('Failed to start AR session:', error);
  }
}

document.getElementById('btn').addEventListener('click', () => {
  activateXR()
});
