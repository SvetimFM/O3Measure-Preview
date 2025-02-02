// Import Three.js and ARButton from node_modules.
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// ---------- GLOBAL VARIABLES AND STATE MANAGEMENT ----------
let scene, camera, renderer;
let controller;
let raycaster;
let wallMesh, itemMesh, projectionMesh;
let inSceneInstructions; // In-scene UI sprite for instructions

// Define states with corresponding user actions.
const STATE = {
  SELECT_WALL: 0,
  SELECT_ITEM: 1,
  SELECT_ANCHOR: 2,
  POSITIONING: 3,
  FINAL: 4
};
let currentState = STATE.SELECT_WALL;

const wallPoints = [];
const itemPoints = [];
const anchorPoints = [];

let isDragging = false;
let dragOffset = new THREE.Vector3();

// Get the HTML instructions overlay element.
const instructionsEl = document.getElementById('instructions');

// ---------- INITIALIZATION ----------
init();
animate();

function init() {
  scene = new THREE.Scene();
  // For AR, the background is passthrough.
  scene.background = new THREE.Color(0x505050);

  // In AR, the camera pose comes from the headset.
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // Add a hemispheric light.
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 1, 0);
  scene.add(hemiLight);

  // Create a grid to represent the floor.
  // Anchor the grid at a fixed world position (e.g. y = 0, representing floor level).
  const grid = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
  grid.position.set(0, 0, 0);
  scene.add(grid);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Use ARButton to request an immersive AR session (which gives passthrough).
  document.body.appendChild(
    ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      domOverlay: { root: document.body }
    })
  );

  // Set up the primary controller for input.
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  controller.addEventListener('selectstart', (event) => console.log('selectstart', event));
  controller.addEventListener('selectend', (event) => console.log('selectend', event));
  scene.add(controller);

  // Add controller grip with visual model so the user sees the controller.
  const controllerGrip = renderer.xr.getControllerGrip(0);
  const controllerModelFactory = new XRControllerModelFactory();
  controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
  scene.add(controllerGrip);

  raycaster = new THREE.Raycaster();

  window.addEventListener('resize', onWindowResize, false);

  // Set initial instructions.
  updateInstructions();
  inSceneInstructions = createInSceneInstructions(instructionsEl.textContent);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateInstructions() {
  let text = '';
  switch (currentState) {
    case STATE.SELECT_WALL:
      text = 'Wall: Press trigger to place 3 red dots to define the wall plane.';
      break;
    case STATE.SELECT_ITEM:
      text = 'Item: Press trigger to place 3 blue dots to define item dimensions.';
      break;
    case STATE.SELECT_ANCHOR:
      text = 'Anchor: Press trigger to place 2 yellow dots for anchor points.';
      break;
    case STATE.POSITIONING:
      text = 'Drag: Press squeeze (grip) to drag the projection box to position the item.';
      break;
    default:
      text = '';
  }
  if (instructionsEl) instructionsEl.textContent = text;
  if (inSceneInstructions) updateInSceneInstructions(inSceneInstructions, text);
}

// Create an in-scene instruction sprite (for AR UI).
function createInSceneInstructions(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(0,0,0,0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '30px sans-serif';
  context.fillStyle = '#fff';
  context.fillText(text, 20, 60);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(2, 0.5, 1);
  // Position the sprite in front of the user.
  sprite.position.set(0, 1.5, -2);
  scene.add(sprite);
  return sprite;
}

function updateInSceneInstructions(sprite, text) {
  const canvas = sprite.material.map.image;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(0,0,0,0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '30px sans-serif';
  context.fillStyle = '#fff';
  context.fillText(text, 20, 60);
  sprite.material.map.needsUpdate = true;
}

// ---------- CONTROLLER INTERACTIONS ----------
function onSelect(event) {
  console.log('Controller position:', controller.position);

  // Compute the forward direction from the controller.
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(controller.quaternion);
  // Create a dynamic plane using the controller's forward vector and its current position.
  const dynamicPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(forward, controller.position);

  // Set up the ray from the controller.
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.copy(forward);

  let intersect = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(dynamicPlane, intersect)) {
    console.log('Dynamic ray intersect:', intersect);
    if (currentState === STATE.SELECT_WALL) {
      handleWallSelection(intersect);
    } else if (currentState === STATE.SELECT_ITEM) {
      handleItemSelection(intersect);
    } else if (currentState === STATE.SELECT_ANCHOR) {
      handleAnchorSelection(intersect);
    } else if (currentState === STATE.POSITIONING) {
      startDragging(intersect);
    }
  }
}

// ---------- HANDLING WALL SELECTION ----------
function handleWallSelection(point) {
  wallPoints.push(point.clone());
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  sphere.position.copy(point);
  scene.add(sphere);

  if (wallPoints.length === 3) {
    // The 3 red dots define the wall plane.
    const xs = wallPoints.map(p => p.x);
    const ys = wallPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    wallMesh = new THREE.Mesh(geometry, material);
    wallMesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, wallPoints[0].z);
    scene.add(wallMesh);

    currentState = STATE.SELECT_ITEM;
    updateInstructions();
    console.log("Wall defined. Now, select 3 points (blue) for item dimensions.");
  }
}

// ---------- HANDLING ITEM DIMENSION SELECTION ----------
function handleItemSelection(point) {
  itemPoints.push(point.clone());
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
  );
  sphere.position.copy(point);
  scene.add(sphere);

  if (itemPoints.length === 3) {
    // The 3 blue dots define the item dimensions.
    const xs = itemPoints.map(p => p.x);
    const ys = itemPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    itemMesh = new THREE.Mesh(geometry, material);
    itemMesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, itemPoints[0].z);
    scene.add(itemMesh);

    currentState = STATE.SELECT_ANCHOR;
    updateInstructions();
    console.log("Item dimensions set. Now, select 2 anchor points (yellow) on the item.");
  }
}

// ---------- HANDLING ANCHOR POINT SELECTION ----------
function handleAnchorSelection(point) {
  anchorPoints.push(point.clone());
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  sphere.position.copy(point);
  scene.add(sphere);

  if (anchorPoints.length === 2) {
    createProjection();
    currentState = STATE.POSITIONING;
    updateInstructions();
    console.log("Anchor points set. Now, press squeeze to drag the projection box to position the item.");
  }
}

// ---------- CREATING THE PROJECTION ----------
function createProjection() {
  if (itemMesh) {
    const geometry = itemMesh.geometry.clone();
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    projectionMesh = new THREE.Mesh(geometry, material);
    projectionMesh.position.copy(itemMesh.position);
    scene.add(projectionMesh);

    anchorPoints.forEach(anchor => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      sphere.position.copy(projectionMesh.worldToLocal(anchor.clone()));
      projectionMesh.add(sphere);
    });
  }
}

// ---------- DRAGGING THE PROJECTION ----------
function startDragging(point) {
  if (projectionMesh) {
    const distance = projectionMesh.position.distanceTo(point);
    if (distance < 0.2) {
      isDragging = true;
      dragOffset.copy(projectionMesh.position).sub(point);
      // Listen for squeezeend to finalize the drag.
      controller.addEventListener('squeezeend', endDragging);
      console.log("Dragging started.");
    }
  }
}

function endDragging() {
  isDragging = false;
  controller.removeEventListener('squeezeend', endDragging);
  console.log("Dragging ended. Final position set.");
}

function updateDragging() {
  if (isDragging && projectionMesh) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    if (wallMesh) {
      const wallNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(wallMesh.quaternion);
      const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(wallNormal, wallMesh.position);
      let intersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(wallPlane, intersect)) {
        projectionMesh.position.copy(intersect.add(dragOffset));
      }
    }
  }
}

// ---------- ANIMATION LOOP ----------
function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  updateDragging();
  renderer.render(scene, camera);
}
