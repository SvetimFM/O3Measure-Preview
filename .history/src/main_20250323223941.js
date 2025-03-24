// Import Three.js and ARButton from node_modules.
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// ---------- GLOBAL VARIABLES AND STATE MANAGEMENT ----------
let scene, camera, renderer;
let controllerRight, controllerLeft;
let raycaster;
let wallMesh, itemMesh, projectionMesh;
let inSceneInstructions; // In-scene UI sprite for instructions
let uiPanel; // UI panel attached to left controller

// Define states with corresponding user actions.
const STATE = {
  SELECT_WALL: 0,
  DEFINE_OBJECT: 1,
  SELECT_ANCHOR_POINTS: 2,
  POSITION_PROJECTION: 3,
  FINAL: 4
};
let currentState = STATE.SELECT_WALL;

const wallPoints = [];
const objectCornerPoints = []; // Top-left, top-right, bottom-right
const anchorPoints = [];
let objectDimensions = { width: 0, height: 0 };

let isDragging = false;
let dragOffset = new THREE.Vector3();

// Get the HTML instructions overlay element.
// Defer getting the element until after DOM is loaded
let instructionsEl;

// Define placeholder functions that will be fully implemented below
// This is needed to prevent "function not defined" errors since 
// these are used in event listeners before the full implementation
let onSqueeze = function(event) {};
let onSqueezeStart = function(event) {};
let onSqueezeEnd = function(event) {};
let onSelectLeft = function(event) {};
let onSqueezeLeft = function(event) {};
let onSqueezeStartLeft = function(event) {};
let onSqueezeEndLeft = function(event) {};

// ---------- INITIALIZATION ----------
init();
animate();

function init() {
  // Get the instructions element after DOM is loaded
  instructionsEl = document.getElementById('instructions');
  
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
  // Anchor the grid at ground level (y = -1.6 approximates average user height).
  const grid = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
  grid.position.set(0, -1.6, 0);
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

  // Set up the controllers for input - both left and right
  controllerRight = renderer.xr.getController(0);
  controllerRight.addEventListener('select', onSelect);
  controllerRight.addEventListener('selectstart', (event) => console.log('selectstart', event));
  controllerRight.addEventListener('selectend', (event) => console.log('selectend', event));
  controllerRight.addEventListener('squeeze', onSqueeze);
  controllerRight.addEventListener('squeezestart', onSqueezeStart);
  controllerRight.addEventListener('squeezeend', onSqueezeEnd);
  controllerRight.name = 'right-controller';
  scene.add(controllerRight);
  
  controllerLeft = renderer.xr.getController(1);
  controllerLeft.addEventListener('select', onSelectLeft);
  controllerLeft.addEventListener('selectstart', (event) => console.log('selectstart-left', event));
  controllerLeft.addEventListener('selectend', (event) => console.log('selectend-left', event));
  controllerLeft.addEventListener('squeeze', onSqueezeLeft);
  controllerLeft.addEventListener('squeezestart', onSqueezeStartLeft);
  controllerLeft.addEventListener('squeezeend', onSqueezeEndLeft);
  controllerLeft.name = 'left-controller';
  scene.add(controllerLeft);
  
  // Create UI panel attached to left controller
  createUIPanel();

  // Add controller grips with visual models so the user sees both controllers.
  const controllerModelFactory = new XRControllerModelFactory();
  
  const controllerGrip = renderer.xr.getControllerGrip(0);
  controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
  scene.add(controllerGrip);
  
  const controllerGripLeft = renderer.xr.getControllerGrip(1);
  controllerGripLeft.add(controllerModelFactory.createControllerModel(controllerGripLeft));
  scene.add(controllerGripLeft);

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
      text = 'Place dots on the wall you want to hang something on. Use right controller to place dots.';
      break;
    case STATE.DEFINE_OBJECT:
      text = 'Place dots to define your object: top-left, top-right, then bottom-right corner.';
      break;
    case STATE.SELECT_ANCHOR_POINTS:
      text = 'Place 1-4 anchor points on your object where it will mount to the wall.';
      break;
    case STATE.POSITION_PROJECTION:
      text = 'Use grip button to drag and position your object on the wall. White dots show mounting points.';
      break;
    case STATE.FINAL:
      text = 'Setup complete! Press "Reset" on the UI to start over.';
      break;
    default:
      text = '';
  }
  if (instructionsEl) instructionsEl.textContent = text;
  if (inSceneInstructions) updateInSceneInstructions(inSceneInstructions, text);
  updateUIPanel();
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

// ---------- UI PANEL CREATION AND INTERACTION ----------
function createUIPanel() {
  // Create a UI panel that will be attached to the left controller
  const panelGeometry = new THREE.PlaneGeometry(0.15, 0.2);
  const panelMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  
  uiPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  // Position slightly in front and to the left of the controller
  uiPanel.position.set(0, 0, -0.1);
  uiPanel.rotation.y = Math.PI / 4; // Angle slightly for better viewing
  
  // Add UI elements (buttons)
  addUIButton(uiPanel, 'Next', 0, 0.07, onNextButtonPressed);
  addUIButton(uiPanel, 'Reset', 0, -0.07, onResetButtonPressed);
  
  // Add the panel to the left controller
  controllerLeft.add(uiPanel);
  uiPanel.visible = true;
}

function addUIButton(parent, label, x, y, clickHandler) {
  // Create button background
  const buttonGeometry = new THREE.PlaneGeometry(0.1, 0.03);
  const buttonMaterial = new THREE.MeshBasicMaterial({
    color: 0x4444aa,
    side: THREE.DoubleSide
  });
  const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
  button.position.set(x, y, 0.001);
  button.userData = { type: 'button', label, clickHandler };
  
  // Add text label
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.font = '24px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });
  const textGeometry = new THREE.PlaneGeometry(0.09, 0.025);
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.z = 0.001;
  
  button.add(textMesh);
  parent.add(button);
  return button;
}

function updateUIPanel() {
  // Update UI based on current state
  if (uiPanel) {
    // Update button states or visibility based on current state
    // For now, we'll just make sure the panel is visible and attached to the left controller
    uiPanel.visible = true;
    
    // Ensure the panel stays with the left controller
    if (!controllerLeft.children.includes(uiPanel)) {
      controllerLeft.add(uiPanel);
    }
  }
}

function onNextButtonPressed() {
  // Handle "Next" button press based on current state
  switch (currentState) {
    case STATE.SELECT_WALL:
      if (wallPoints.length >= 3) {
        createWallPlane();
        currentState = STATE.DEFINE_OBJECT;
        updateInstructions();
      }
      break;
    case STATE.DEFINE_OBJECT:
      if (objectCornerPoints.length >= 3) {
        createObjectMesh();
        currentState = STATE.SELECT_ANCHOR_POINTS;
        updateInstructions();
      }
      break;
    case STATE.SELECT_ANCHOR_POINTS:
      if (anchorPoints.length >= 1) {
        createProjection();
        currentState = STATE.POSITION_PROJECTION;
        updateInstructions();
      }
      break;
    case STATE.POSITION_PROJECTION:
      currentState = STATE.FINAL;
      updateInstructions();
      break;
    case STATE.FINAL:
      resetAll();
      break;
  }
}

function onResetButtonPressed() {
  // Reset the current step based on state
  switch (currentState) {
    case STATE.SELECT_WALL:
      resetWallPoints();
      break;
    case STATE.DEFINE_OBJECT:
      resetObjectPoints();
      break;
    case STATE.SELECT_ANCHOR_POINTS:
      resetAnchorPoints();
      break;
    case STATE.POSITION_PROJECTION:
    case STATE.FINAL:
      resetAll();
      break;
  }
  updateInstructions();
}

// ---------- CONTROLLER INTERACTIONS ----------
function onSelect(event) {
  console.log('Right controller position:', controllerRight.position);

  // Compute the forward direction from the controller.
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(controllerRight.quaternion);
  // Create a dynamic plane using the controller's forward vector and its current position.
  const dynamicPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(forward, controllerRight.position);

  // Set up the ray from the controller.
  raycaster.ray.origin.setFromMatrixPosition(controllerRight.matrixWorld);
  raycaster.ray.direction.copy(forward);

  let intersect = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(dynamicPlane, intersect)) {
    console.log('Dynamic ray intersect:', intersect);
    if (currentState === STATE.SELECT_WALL) {
      handleWallSelection(intersect);
    } else if (currentState === STATE.DEFINE_OBJECT) {
      handleObjectCornerSelection(intersect);
    } else if (currentState === STATE.SELECT_ANCHOR_POINTS) {
      handleAnchorSelection(intersect);
    } else if (currentState === STATE.POSITION_PROJECTION) {
      startDragging(intersect);
    }
  }
}

// Handle interaction with the UI panel on the left controller
onSelectLeft = function(event) {
  console.log('Left controller position:', controllerLeft.position);
  
  // Set up raycaster for UI interaction
  raycaster.ray.origin.setFromMatrixPosition(controllerRight.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyQuaternion(controllerRight.quaternion);
  
  // Check for UI panel interactions
  const intersects = raycaster.intersectObject(uiPanel, true);
  
  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    
    // Check if we hit a button
    if (intersectedObject.userData && intersectedObject.userData.type === 'button') {
      console.log('Button clicked:', intersectedObject.userData.label);
      // Call the button's click handler
      if (typeof intersectedObject.userData.clickHandler === 'function') {
        intersectedObject.userData.clickHandler();
      }
    }
  }
}

// ---------- HANDLING WALL SELECTION ----------
function handleWallSelection(point) {
  wallPoints.push(point.clone());
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.004, 16, 16), // 80% smaller than original 0.02
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  sphere.position.copy(point);
  sphere.userData = { type: 'wallPoint', index: wallPoints.length - 1 };
  scene.add(sphere);

  // Update instructions to show progress
  instructionsEl.textContent = `Wall points: ${wallPoints.length}/3. Place dots on wall.`;
}

function createWallPlane() {
  if (wallPoints.length >= 3) {
    // The 3 red dots define the wall plane.
    const xs = wallPoints.map(p => p.x);
    const ys = wallPoints.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;

    const geometry = new THREE.PlaneGeometry(width * 1.5, height * 1.5); // Make wall larger than dots
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    wallMesh = new THREE.Mesh(geometry, material);
    
    // Calculate center point and place wall there
    wallMesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, wallPoints[0].z);
    scene.add(wallMesh);
    
    console.log("Wall plane created. Width:", width * 39.37, "inches, Height:", height * 39.37, "inches");
  }
}

function resetWallPoints() {
  // Remove wall points and wall mesh from scene
  scene.children = scene.children.filter(obj => {
    const isWallPoint = obj.userData && obj.userData.type === 'wallPoint';
    const isWallMesh = obj === wallMesh;
    return !(isWallPoint || isWallMesh);
  });
  
  // Clear wall points array
  wallPoints.length = 0;
  wallMesh = null;
  
  console.log("Wall points reset.");
}

// ---------- HANDLING OBJECT DIMENSION SELECTION ----------
function handleObjectCornerSelection(point) {
  objectCornerPoints.push(point.clone());
  
  // Determine which corner this is for naming
  let cornerName;
  switch(objectCornerPoints.length) {
    case 1: cornerName = "top-left"; break;
    case 2: cornerName = "top-right"; break;
    case 3: cornerName = "bottom-right"; break;
    default: cornerName = "extra"; break;
  }
  
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.004, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
  );
  sphere.position.copy(point);
  sphere.userData = { type: 'objectCorner', index: objectCornerPoints.length - 1, corner: cornerName };
  scene.add(sphere);

  // Update instructions to show progress
  instructionsEl.textContent = `Object corners: ${objectCornerPoints.length}/3. Place dot at ${cornerName} corner.`;
}

function createObjectMesh() {
  if (objectCornerPoints.length >= 3) {
    // Calculate object dimensions using the 3 corners
    const topLeft = objectCornerPoints[0];
    const topRight = objectCornerPoints[1];
    const bottomRight = objectCornerPoints[2];
    
    // Calculate width (distance between top-left and top-right)
    const width = topLeft.distanceTo(topRight);
    
    // Calculate height (distance between top-right and bottom-right)
    const height = topRight.distanceTo(bottomRight);
    
    // Save dimensions for later use
    objectDimensions.width = width;
    objectDimensions.height = height;
    
    // Convert to inches (1 unit = 1 meter)
    const widthInches = width * 39.37;
    const heightInches = height * 39.37;
    
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    itemMesh = new THREE.Mesh(geometry, material);
    
    // Position at the center of the object
    const centerX = (topLeft.x + bottomRight.x) / 2;
    const centerY = (topLeft.y + bottomRight.y) / 2;
    const centerZ = (topLeft.z + bottomRight.z) / 2;
    itemMesh.position.set(centerX, centerY, centerZ);
    
    // Add dimensions text to the center of the object
    const dimensionsLabel = createTextLabel(`${widthInches.toFixed(1)}" × ${heightInches.toFixed(1)}"`, 0x0000ff);
    dimensionsLabel.position.set(0, 0, 0.001);
    itemMesh.add(dimensionsLabel);
    
    scene.add(itemMesh);
    
    console.log("Object dimensions set:", widthInches.toFixed(1), "×", heightInches.toFixed(1), "inches");
  }
}

function createTextLabel(text, backgroundColor = 0x000000) {
  // Create a canvas for the text
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  
  // Background with transparency
  context.fillStyle = `rgba(${(backgroundColor >> 16) & 255}, ${(backgroundColor >> 8) & 255}, ${backgroundColor & 255}, 0.7)`;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Text
  context.font = 'bold 36px Arial';
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.1, 0.05, 1);
  
  return sprite;
}

function resetObjectPoints() {
  // Remove object corner points and object mesh from scene
  scene.children = scene.children.filter(obj => {
    const isObjectCorner = obj.userData && obj.userData.type === 'objectCorner';
    const isItemMesh = obj === itemMesh;
    return !(isObjectCorner || isItemMesh);
  });
  
  // Clear object corner points array
  objectCornerPoints.length = 0;
  itemMesh = null;
  
  console.log("Object points reset.");
}

// ---------- HANDLING ANCHOR POINT SELECTION ----------
function handleAnchorSelection(point) {
  // Only allow up to 4 anchor points
  if (anchorPoints.length >= 4) {
    console.log("Maximum of 4 anchor points already placed.");
    return;
  }
  
  anchorPoints.push(point.clone());
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.004, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  sphere.position.copy(point);
  sphere.userData = { type: 'anchorPoint', index: anchorPoints.length - 1 };
  scene.add(sphere);

  // Update instructions to show progress
  instructionsEl.textContent = `Anchor points: ${anchorPoints.length}/4. Place 1-4 anchor points for mounting.`;
  console.log(`Anchor point ${anchorPoints.length} placed.`);
}

function resetAnchorPoints() {
  // Remove anchor points from scene
  scene.children = scene.children.filter(obj => {
    const isAnchorPoint = obj.userData && obj.userData.type === 'anchorPoint';
    return !isAnchorPoint;
  });
  
  // Remove projection if it exists
  if (projectionMesh) {
    scene.remove(projectionMesh);
    projectionMesh = null;
  }
  
  // Clear anchor points array
  anchorPoints.length = 0;
  
  console.log("Anchor points reset.");
}

function resetAll() {
  // Reset all points and meshes
  resetWallPoints();
  resetObjectPoints();
  resetAnchorPoints();
  
  // Reset state to beginning
  currentState = STATE.SELECT_WALL;
  updateInstructions();
  
  console.log("All points and states reset. Starting over.");
}

// ---------- CREATING THE PROJECTION ----------
function createProjection() {
  if (itemMesh && wallMesh && anchorPoints.length > 0) {
    // Create a projection with the same dimensions as the object
    const width = objectDimensions.width;
    const height = objectDimensions.height;
    
    // Create a plane geometry for the projection
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0x808080, // Grey color
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      wireframe: false
    });
    
    projectionMesh = new THREE.Mesh(geometry, material);
    
    // Initially position the projection on the wall at its center
    // We'll rotate it to match the wall orientation
    projectionMesh.position.copy(wallMesh.position);
    projectionMesh.position.z += 0.01; // Slight offset to prevent z-fighting
    
    scene.add(projectionMesh);
    
    // Add a border to the projection
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const borderGeometry = new THREE.EdgesGeometry(geometry);
    const borderLines = new THREE.LineSegments(borderGeometry, borderMaterial);
    projectionMesh.add(borderLines);
    
    // Convert to inches (1 unit = 1 meter)
    const widthInches = width * 39.37;
    const heightInches = height * 39.37;
    
    // Add dimensions text to the projection
    const dimensionsLabel = createTextLabel(`${widthInches.toFixed(1)}" × ${heightInches.toFixed(1)}"`, 0x000000);
    dimensionsLabel.position.set(0, 0, 0.002);
    projectionMesh.add(dimensionsLabel);
    
    // Add anchor points to the projection
    // We need to transform the anchor points from object space to projection space
    anchorPoints.forEach((anchor, index) => {
      // Calculate relative position in the object's coordinate system
      const objectMatrix = new THREE.Matrix4().copy(itemMesh.matrixWorld).invert();
      const localPos = anchor.clone().applyMatrix4(objectMatrix);
      
      // Create a mounting point marker (white circle)
      const anchorMarker = new THREE.Mesh(
        new THREE.CircleGeometry(0.01, 16),
        new THREE.MeshBasicMaterial({ 
          color: 0xffffff,
          side: THREE.DoubleSide
        })
      );
      
      // Position the marker at the same relative position in the projection
      anchorMarker.position.copy(localPos);
      anchorMarker.position.z = 0.002; // Slight offset to be above the projection
      
      // Add a label with mounting point number
      const anchorLabel = createTextLabel(`${index + 1}`, 0x000000);
      anchorLabel.scale.set(0.03, 0.03, 1); // Make it smaller
      anchorLabel.position.set(0, 0, 0.001);
      
      anchorMarker.add(anchorLabel);
      projectionMesh.add(anchorMarker);
    });
    
    console.log("Projection created with", anchorPoints.length, "mounting points.");
  } else {
    console.warn("Cannot create projection: missing item mesh, wall mesh, or anchor points.");
  }
}

// ---------- DRAGGING THE PROJECTION ----------
function startDragging(point) {
  if (projectionMesh && currentState === STATE.POSITION_PROJECTION) {
    const distance = projectionMesh.position.distanceTo(point);
    if (distance < 0.3) { // Increased grab radius for easier selection
      isDragging = true;
      dragOffset.copy(projectionMesh.position).sub(point);
      projectionMesh.material.color.set(0x00ff00); // Change color to indicate dragging
      console.log("Dragging started.");
    }
  }
}

function endDragging() {
  if (isDragging && projectionMesh) {
    isDragging = false;
    projectionMesh.material.color.set(0x808080); // Restore original color
    console.log("Dragging ended. Final position set.");
  }
}

// Full implementation of squeeze events for controllers
onSqueeze = function(event) {
  if (currentState === STATE.POSITION_PROJECTION && projectionMesh) {
    // Set up raycaster for dragging with right controller
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controllerRight.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controllerRight.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    // Create a plane for intersection
    if (wallMesh) {
      const wallNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(wallMesh.quaternion);
      const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(wallNormal, wallMesh.position);
      
      // Find intersection with wall
      let intersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(wallPlane, intersect)) {
        startDragging(intersect);
      }
    }
  }
}

// Replace placeholder implementations for right controller
onSqueezeStart = function(event) {
  console.log('Squeeze start - right controller');
  // Calls to onSqueeze will handle the start of dragging
}

onSqueezeEnd = function(event) {
  console.log('Squeeze end - right controller');
  // End dragging if active
  endDragging();
}

// Left controller squeeze events (for UI panel interactions)
onSqueezeLeft = function(event) {
  console.log('Squeeze - left controller');
  // Left controller squeeze could be used for secondary functions if needed
}

onSqueezeStartLeft = function(event) {
  console.log('Squeeze start - left controller');
}

onSqueezeEndLeft = function(event) {
  console.log('Squeeze end - left controller');
}

function updateDragging() {
  if (isDragging && projectionMesh) {
    // Update raycaster with current controller position
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controllerRight.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controllerRight.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    if (wallMesh) {
      // Create a plane representing the wall
      const wallNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(wallMesh.quaternion);
      const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(wallNormal, wallMesh.position);
      
      // Find where the controller ray intersects the wall
      let intersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(wallPlane, intersect)) {
        // Move the projection to the intersection point, with offset
        projectionMesh.position.copy(intersect.add(dragOffset));
        
        // Keep the z-offset consistent to avoid z-fighting with wall
        const zOffset = 0.01;
        const adjustedPosition = projectionMesh.position.clone();
        adjustedPosition.z = wallMesh.position.z + zOffset;
        projectionMesh.position.copy(adjustedPosition);
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
  
  // Update UI panel to ensure it follows the left controller
  if (uiPanel && controllerLeft) {
    // Make sure the panel stays attached to the left controller
    // and maintains proper orientation for visibility
    if (!controllerLeft.children.includes(uiPanel)) {
      controllerLeft.add(uiPanel);
    }
  }
  
  // Update controller models and tracking
  const session = renderer.xr.getSession();
  if (session) {
    // If XR session is active, request animation frame to keep controllers updated
    session.requestAnimationFrame(() => {
      // Animation happens automatically through the XRSession
    });
  }
  
  renderer.render(scene, camera);
}
