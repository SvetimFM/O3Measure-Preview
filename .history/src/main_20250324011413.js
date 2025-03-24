import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';

// ---------- STATE MANAGEMENT ----------
const appState = {
  currentStep: 0, // 0: Wall Selection, 1: Object Definition, 2: Anchor Points, 3: Wall Projection
  wallPoints: [],
  objectPoints: [],
  anchorPoints: [],
  objectDimensions: { width: 0, height: 0 },
  objectProjection: null,
  wallProjection: null,
  controllers: {
    left: null,
    right: null
  },
  handModels: {
    left: null,
    right: null
  },
  ui: {
    panel: null,
    nextButton: null,
    resetButton: null,
    dimensionsText: null,
    dragHandle: null
  },
  interaction: {
    isDragging: false,
    draggedObject: null,
    isDraggingUI: false,
    isPointerInteracting: false,
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector3()
  },
  projectionDepth: 0 // Distance adjustment for fine-tuning
};

// ---------- THREE.JS SETUP ----------
let container;
let camera, scene, renderer;
let controller1, controller2;

// Dot materials for different purposes - with appropriate sizes
const wallDotMaterial = new THREE.MeshPhongMaterial({ 
  color: 0x00ff00,
  emissive: 0x003300 // Slight glow effect for better visibility
}); // Green for wall
const objectDotMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xff0000,
  emissive: 0x330000
}); // Red for object corners
const anchorDotMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xffcc00, // Yellow for better visibility
  emissive: 0x332200
}); // Yellow for anchor points
const projectionMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xffffff, 
  transparent: true, 
  opacity: 0.6, // Slightly more opaque for better visibility
  side: THREE.DoubleSide 
});
const wallProjectionMaterial = new THREE.MeshBasicMaterial({
  color: 0xcccccc,
  transparent: true,
  opacity: 0.25, // More transparent as requested
  side: THREE.DoubleSide,
  wireframe: false // Solid for better visualization
});

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  // Position the camera at user height (about 1.6 meters)
  camera.position.set(0, 1.6, 0);
  
  // Add lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);
  
  // Add ambient light for better visibility
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  scene.add(ambientLight);

  // Initialize renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // Add XR AR Button
  document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test', 'hand-tracking'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.getElementById('overlay') }
  }));

  // Setup controllers
  setupControllers();
  
  // Create floating UI panel
  createUIPanel();
  
  // Initial UI panel position for non-XR mode
  if (appState.ui.panel) {
    appState.ui.panel.position.set(0, -0.3, -0.5);
  }
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
}

function setupControllers() {
  // Set up controllers
  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
  controller2.addEventListener('squeezestart', onSqueezeStart);
  controller2.addEventListener('squeezeend', onSqueezeEnd);
  scene.add(controller2);

  // Setup hand tracking if available
  const handModelFactory = new XRHandModelFactory();
  
  // Left hand
  appState.handModels.left = renderer.xr.getHand(0);
  appState.handModels.left.add(handModelFactory.createHandModel(appState.handModels.left, 'mesh'));
  scene.add(appState.handModels.left);
  
  // Right hand
  appState.handModels.right = renderer.xr.getHand(1);
  appState.handModels.right.add(handModelFactory.createHandModel(appState.handModels.right, 'mesh'));
  scene.add(appState.handModels.right);

  // Store controllers by hand (will be assigned in update loop based on handedness)
  appState.controllers.left = null;
  appState.controllers.right = null;
}

function createUIPanel() {
  // Create a draggable floating panel
  const panelGroup = new THREE.Group();
  
  // Main panel - even larger to accommodate bigger text and stacked buttons
  const panelGeometry = new THREE.PlaneGeometry(0.18, 0.2);  // Significantly larger panel size
  const panelMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x222222, 
    transparent: false, // No transparency to avoid visual artifacts
    side: THREE.DoubleSide
  });
  
  const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
  panelGroup.add(panelMesh);
  
  // Add a border to the panel
  const panelBorder = new THREE.LineSegments(
    new THREE.EdgesGeometry(panelGeometry),
    new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 2 })
  );
  panelBorder.position.set(0, 0, 0.001);
  panelGroup.add(panelBorder);
  
  // Create drag handles at the corners
  const handleSize = 0.015;  // Smaller handle
  const handleGeometry = new THREE.SphereGeometry(handleSize/2);
  const handleMaterial = new THREE.MeshBasicMaterial({ color: 0x6699cc });
  
  // Top-right corner handle - adjusted for much larger panel
  const topRightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
  topRightHandle.position.set(0.09 - handleSize/2, 0.1 - handleSize/2, 0.005); // Positioned for the much larger panel
  topRightHandle.userData.isDragHandle = true;
  topRightHandle.userData.handlePosition = 'topRight';
  panelGroup.add(topRightHandle);
  
  // Make the entire panel draggable
  panelMesh.userData.isDraggable = true;
  panelMesh.userData.isDragPanel = true;
  
  // Save handle reference
  appState.ui.dragHandle = topRightHandle;
  
  // Create text for showing current step - make it even bigger
  const stepText = createTextMesh('Step 1: Wall Selection', 0xffffff);
  stepText.position.set(0, 0.06, 0.002);
  stepText.scale.set(0.7, 0.7, 0.7); // Further increased text size for better visibility
  panelGroup.add(stepText);
  
  // Create dimensions text display - make it bigger
  appState.ui.dimensionsText = createTextMesh('', 0xffffff);
  appState.ui.dimensionsText.position.set(0, 0.02, 0.002);
  appState.ui.dimensionsText.scale.set(0.65, 0.65, 0.65); // Further increased text size for better visibility
  panelGroup.add(appState.ui.dimensionsText);
  
  // Create Next button - stacked vertically
  appState.ui.nextButton = createButton('Next', 0x4CAF50);
  appState.ui.nextButton.position.set(0, -0.015, 0.002);
  panelGroup.add(appState.ui.nextButton);
  
  // Create Reset button - stacked vertically below Next button
  appState.ui.resetButton = createButton('Reset', 0xFF5722);
  appState.ui.resetButton.position.set(0, -0.055, 0.002);
  panelGroup.add(appState.ui.resetButton);
  
  // Initial position - will be updated in render loop to follow left controller
  panelGroup.position.set(0, 0.3, -0.5);
  panelGroup.visible = true; // Always visible for better user experience
  
  appState.ui.panel = panelGroup;
  
  // Add the panel to the scene
  scene.add(panelGroup);
}

function createButton(text, color) {
  const buttonGroup = new THREE.Group();
  
  // Button background - wider and with solid background
  const buttonGeo = new THREE.PlaneGeometry(0.08, 0.035);
  const buttonMat = new THREE.MeshBasicMaterial({ 
    color: color,
    transparent: false, // Solid background
    opacity: 1.0
  });
  const buttonMesh = new THREE.Mesh(buttonGeo, buttonMat);
  
  // Add highlight effect on hover
  buttonMesh.userData = {
    defaultColor: color,
    hoverColor: new THREE.Color(color).multiplyScalar(1.2), // Brighter color for hover
    isButton: true,
    buttonText: text
  };
  
  buttonGroup.add(buttonMesh);
  
  // Create text directly on canvas instead of using createTextMesh
  // This avoids multiple transparent layers that can cause visual issues
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  
  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set text style
  context.font = 'bold 64px Arial'; // Very large font size for good visibility
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff'; // White text
  
  // Add text shadow for better contrast
  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.shadowBlur = 4;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  
  // Draw text
  context.fillText(text, canvas.width/2, canvas.height/2);
  
  // Create texture and apply to a mesh
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter; // Prevents blurry text
  
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  const textGeometry = new THREE.PlaneGeometry(0.075, 0.03);
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.set(0, 0, 0.001); // Slightly in front of button
  
  buttonGroup.add(textMesh);
  
  // Make the button interactive for touch
  buttonGroup.userData = {
    isButton: true,
    buttonText: text
  };
  
  return buttonGroup;
}

function createTextMesh(text, color) {
  // Create higher quality text with better contrast and no transparency issues
  const canvas = document.createElement('canvas');
  canvas.width = 1024; // Even higher resolution for clearer text
  canvas.height = 256; // Taller to accommodate larger text
  const context = canvas.getContext('2d');
  
  // Create a solid background with slight rounding for better text visibility
  context.fillStyle = '#222222'; // Dark background for contrast
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Set text properties
  context.fillStyle = '#ffffff'; // White text
  context.font = 'bold 72px Arial'; // Very large, bold font for better visibility
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Add shadow for better visibility
  context.shadowColor = 'rgba(0, 0, 0, 0.7)';
  context.shadowBlur = 6;
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  
  // Draw text with outline for better visibility
  context.strokeStyle = '#000000';
  context.lineWidth = 3;
  context.strokeText(text, canvas.width/2, canvas.height/2);
  context.fillText(text, canvas.width/2, canvas.height/2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter; // Prevents blurry text
  texture.needsUpdate = true;
  
  // Use an opaque material for the text to avoid transparency issues
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: false, // No transparency to avoid visual artifacts
    side: THREE.DoubleSide
  });
  
  const geometry = new THREE.PlaneGeometry(0.35, 0.12); // Larger plane
  return new THREE.Mesh(geometry, material);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---------- INTERACTION HANDLERS ----------
function onSelectStart(event) {
  const controller = event.target;
  
  // Create raycaster for interactions
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Create a ray for pointer visualization
  createRayPointer(controller, raycaster.ray);
  
  // Check if we're trying to drag the UI panel handle
  if (appState.ui.dragHandle) {
    const handleIntersects = raycaster.intersectObject(appState.ui.dragHandle);
    if (handleIntersects.length > 0) {
      appState.interaction.isDraggingUI = true;
      appState.interaction.draggedObject = appState.ui.panel;
      return;
    }
  }
  
  // Check for UI panel dragging (anywhere on the panel)
  const panelIntersects = raycaster.intersectObject(appState.ui.panel, true);
  if (panelIntersects.length > 0 && panelIntersects[0].object.userData.isDragPanel) {
    appState.interaction.isDraggingUI = true;
    appState.interaction.draggedObject = appState.ui.panel;
    return;
  }
  
  // Object and wall dragging
  const draggableObjects = [];
  
  // Add object projection and wall projection if they exist
  if (appState.objectProjection) draggableObjects.push(appState.objectProjection);
  
  // Add wall mesh from wall group if it exists
  if (appState.wallProjection && appState.wallProjection.children) {
    appState.wallProjection.children.forEach(child => {
      if (child.userData && child.userData.isDraggable) {
        draggableObjects.push(child);
      }
    });
  }
  
  // Check for draggable projections
  const projectionIntersects = raycaster.intersectObjects(draggableObjects);
  if (projectionIntersects.length > 0) {
    appState.interaction.draggedObject = projectionIntersects[0].object;
    appState.interaction.isDragging = true;
    
    // Store intersection point for calculating dragging offset
    appState.interaction.intersectionPoint = projectionIntersects[0].point.clone();
    return;
  }
  
  // Check if we're trying to drag an existing dot
  const dotObjects = [];
  
  // Collect all draggable dots 
  appState.wallPoints.forEach(point => dotObjects.push(point.mesh));
  appState.objectPoints.forEach(point => dotObjects.push(point.mesh));
  appState.anchorPoints.forEach(point => dotObjects.push(point.mesh));
  
  // Check for intersection with any dot
  const dotIntersects = raycaster.intersectObjects(dotObjects);
  if (dotIntersects.length > 0) {
    // Start dragging the dot
    const dotMesh = dotIntersects[0].object;
    appState.interaction.draggedObject = dotMesh;
    appState.interaction.isDragging = true;
    
    // Make the dot temporarily larger to indicate it's being dragged
    dotMesh.scale.set(1.2, 1.2, 1.2);
    return;
  }
  
  // Check if we're pressing buttons on the UI panel
  // Check if we hit the next button
  const nextIntersects = raycaster.intersectObject(appState.ui.nextButton, true);
  if (nextIntersects.length > 0) {
    // Visual feedback for button press
    const buttonMesh = appState.ui.nextButton.children[0];
    buttonMesh.material.color.set(buttonMesh.userData.hoverColor);
    setTimeout(() => {
      buttonMesh.material.color.set(buttonMesh.userData.defaultColor);
    }, 200);
    
    goToNextStep();
    return;
  }
  
  // Check if we hit the reset button
  const resetIntersects = raycaster.intersectObject(appState.ui.resetButton, true);
  if (resetIntersects.length > 0) {
    // Visual feedback for button press
    const buttonMesh = appState.ui.resetButton.children[0];
    buttonMesh.material.color.set(buttonMesh.userData.hoverColor);
    setTimeout(() => {
      buttonMesh.material.color.set(buttonMesh.userData.defaultColor);
    }, 200);
    
    resetCurrentStep();
    return;
  }
  
  // Handle placing dots based on current step
  switch (appState.currentStep) {
    case 0: // Wall Selection
      placeWallDot(controller);
      break;
    case 1: // Object Definition
      placeObjectDot(controller);
      break;
    case 2: // Anchor Points
      placeAnchorDot(controller);
      break;
    case 3: // Wall Projection
      // Handled by direct interaction with the projections
      break;
  }
}

// Create a ray pointer for visualization
function createRayPointer(controller, ray) {
  // We no longer remove existing rays - we maintain them for both controllers
  
  // Check if this controller already has a ray
  let existingRay = null;
  scene.children.forEach(child => {
    if (child.userData && child.userData.isPointerRay && child.userData.controller === controller) {
      existingRay = child;
    }
  });
  
  // If the controller already has a ray, update it
  if (existingRay) {
    // Update ray position and direction
    existingRay.position.copy(ray.origin);
    
    // Update ray geometry
    const points = [
      new THREE.Vector3(0, 0, 0),
      ray.direction.clone().multiplyScalar(5) // 5 meter length
    ];
    existingRay.geometry.setFromPoints(points);
    existingRay.geometry.verticesNeedUpdate = true;
    
    // Update pointer position
    if (existingRay.children.length > 0) {
      existingRay.children[0].position.copy(ray.direction.clone().multiplyScalar(5));
    }
  } else {
    // Create a new ray
    const rayLength = 5; // meters
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      ray.direction.clone().multiplyScalar(rayLength)
    ]);
    
    const rayMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff, // Cyan color for better visibility
      opacity: 1.0, // Fully opaque
      transparent: false,
      linewidth: 3 // Thicker line (note: this may not work on all platforms)
    });
    
    const rayLine = new THREE.Line(rayGeometry, rayMaterial);
    rayLine.position.copy(ray.origin);
    rayLine.userData.isPointerRay = true;
    rayLine.userData.controller = controller; // Store which controller this ray belongs to
    
    // Add a larger, more visible sphere at the end of the ray
    const pointerGeometry = new THREE.SphereGeometry(0.01); // Doubled size
    const pointerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, // Bright red
      emissive: 0xff0000, // Emissive to make it glow
      emissiveIntensity: 0.5
    });
    const pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
    pointer.position.copy(ray.direction.clone().multiplyScalar(rayLength));
    rayLine.add(pointer);
    
    scene.add(rayLine);
  }
  
  // Add a crosshair for fine aiming when placing wall points and other elements
  if (!controller.userData.hasCrosshair) {
    // Create a crosshair that appears in front of the controller
    const crosshairDistance = 0.15; // 15cm in front of controller (closer for better aiming)
    const crosshairSize = 0.015; // 1.5cm across (smaller for precision)
    const crosshairGroup = new THREE.Group();
    
    // Create a ring for better visibility
    const ringGeometry = new THREE.RingGeometry(crosshairSize*0.8, crosshairSize, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff, // Cyan for visibility
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    // Create horizontal line
    const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-crosshairSize, 0, 0),
      new THREE.Vector3(-crosshairSize*0.4, 0, 0), // Gap in middle
      new THREE.Vector3(crosshairSize*0.4, 0, 0), // Gap in middle
      new THREE.Vector3(crosshairSize, 0, 0)
    ]);
    
    // Create vertical line
    const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -crosshairSize, 0),
      new THREE.Vector3(0, -crosshairSize*0.4, 0), // Gap in middle
      new THREE.Vector3(0, crosshairSize*0.4, 0), // Gap in middle
      new THREE.Vector3(0, crosshairSize, 0)
    ]);
    
    // Create center dot
    const centerGeometry = new THREE.CircleGeometry(crosshairSize*0.15, 16);
    
    // Bright material for visibility
    const crosshairMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ffff, // Cyan for better visibility against various backgrounds
      opacity: 1.0, 
      transparent: false,
      linewidth: 2
    });
    
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000, // Red center dot
      side: THREE.DoubleSide
    });
    
    // Create lines with gaps in the middle
    const horizontalLine = new THREE.LineSegments(horizontalGeometry, crosshairMaterial);
    const verticalLine = new THREE.LineSegments(verticalGeometry, crosshairMaterial);
    const centerDot = new THREE.Mesh(centerGeometry, centerMaterial);
    
    crosshairGroup.add(ring);
    crosshairGroup.add(horizontalLine);
    crosshairGroup.add(verticalLine);
    crosshairGroup.add(centerDot);
    
    // Position crosshair in front of controller
    crosshairGroup.position.z = -crosshairDistance;
    crosshairGroup.userData.isCrosshair = true;
    
    controller.add(crosshairGroup);
    controller.userData.hasCrosshair = true;
    controller.userData.crosshair = crosshairGroup;
  }
  
  // Store the ray for interaction
  appState.interaction.pointer = ray;
}

function onSelectEnd(event) {
  // We no longer remove ray pointers - they stay visible at all times
  
  // Handle dot dragging end
  if (appState.interaction.isDragging && appState.interaction.draggedObject) {
    const draggedObj = appState.interaction.draggedObject;
    
    // Reset the scale back to normal if it's a dot
    if (draggedObj.scale.x !== 1) {
      draggedObj.scale.set(1, 1, 1);
    }
    
    // Update based on object type
    if (draggedObj.userData.pointType === 'wall') {
      const index = draggedObj.userData.pointIndex;
      appState.wallPoints[index].position.copy(draggedObj.position);
      
      // Update wall preview if all 3 points are placed
      if (appState.wallPoints.length === 3) {
        renderWallPreview();
      }
    } 
    else if (draggedObj.userData.pointType === 'object') {
      const index = draggedObj.userData.pointIndex;
      appState.objectPoints[index].position.copy(draggedObj.position);
      
      // Recalculate dimensions if we've edited object points
      if (appState.objectPoints.length === 3) {
        calculateObjectDimensions();
      }
    } 
    else if (draggedObj.userData.pointType === 'anchor') {
      const index = draggedObj.userData.pointIndex;
      appState.anchorPoints[index].position.copy(draggedObj.position);
      
      // Update anchor visualizations if in projection mode
      if (appState.currentStep === 3 && appState.objectProjection) {
        addAnchorPointsToProjection();
      }
    }
    else if (draggedObj.userData.isObjectProjection || draggedObj.userData.isWall) {
      // If we dragged the object or wall projection, ensure anchors are updated
      if (appState.currentStep === 3 && appState.objectProjection) {
        addAnchorPointsToProjection();
      }
    }
    
    // Update UI
    updateDimensionsDisplay();
  }
  
  // Reset all interaction states
  appState.interaction.isDragging = false;
  appState.interaction.isDraggingUI = false;
  appState.interaction.draggedObject = null;
  appState.interaction.intersectionPoint = null;
}

function onSqueezeStart(event) {
  const controller = event.target;
  
  // Only process right controller interactions
  if (controller !== appState.controllers.right && controller !== controller1) return;
  
  // Only relevant in step 3 (wall projection)
  if (appState.currentStep === 3) {
    appState.isDragging = true;
  }
}

function onSqueezeEnd(event) {
  appState.isDragging = false;
}

// ---------- STEP SPECIFIC FUNCTIONS ----------
function placeWallDot(controller) {
  if (appState.wallPoints.length >= 3) return; // Limit to 3 points for defining a plane
  
  // Create a raycaster from the controller for more precise placement
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Calculate position a bit in front of the controller (where the crosshair is)
  const position = new THREE.Vector3();
  position.copy(raycaster.ray.origin);
  position.addScaledVector(raycaster.ray.direction, 0.15); // Match crosshair distance
  
  // Provide visual feedback - flash the crosshair
  if (controller.userData.crosshair) {
    // Flash the crosshair briefly by changing its color
    controller.userData.crosshair.children.forEach(child => {
      if (child.material) {
        const originalColor = child.material.color.clone();
        child.material.color.set(0xffff00); // Flash yellow
        setTimeout(() => {
          child.material.color.copy(originalColor);
        }, 150); // Reset after 150ms
      }
    });
  }
  
  // Smaller, more visible dots
  const dotGeometry = new THREE.SphereGeometry(0.01); // Reduced size for precision
  const dot = new THREE.Mesh(dotGeometry, wallDotMaterial);
  dot.position.copy(position);
  
  // Make dots draggable
  dot.userData.isDraggable = true;
  dot.userData.pointType = 'wall';
  dot.userData.pointIndex = appState.wallPoints.length;
  
  scene.add(dot);
  
  appState.wallPoints.push({
    mesh: dot,
    position: position.clone()
  });
  
  // Update UI
  updateDimensionsDisplay();
  
  // If we have 3 wall points, render the wall preview
  if (appState.wallPoints.length === 3) {
    renderWallPreview();
  }
}

function placeObjectDot(controller) {
  if (appState.objectPoints.length >= 3) return; // We need 3 points for object corners
  
  // Create a raycaster from the controller for more precise placement
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Calculate position a bit in front of the controller (where the crosshair is)
  const position = new THREE.Vector3();
  position.copy(raycaster.ray.origin);
  position.addScaledVector(raycaster.ray.direction, 0.15); // Match crosshair distance
  
  // Provide visual feedback - flash the crosshair
  if (controller.userData.crosshair) {
    // Flash the crosshair briefly by changing its color
    controller.userData.crosshair.children.forEach(child => {
      if (child.material) {
        const originalColor = child.material.color.clone();
        child.material.color.set(0xffff00); // Flash yellow
        setTimeout(() => {
          child.material.color.copy(originalColor);
        }, 150); // Reset after 150ms
      }
    });
  }
  
  // Smaller, more visible dots
  const dotGeometry = new THREE.SphereGeometry(0.01); // Reduced size for precision
  const dot = new THREE.Mesh(dotGeometry, objectDotMaterial);
  dot.position.copy(position);
  
  // Make dots draggable
  dot.userData.isDraggable = true;
  dot.userData.pointType = 'object';
  dot.userData.pointIndex = appState.objectPoints.length;
  
  scene.add(dot);
  
  appState.objectPoints.push({
    mesh: dot,
    position: position.clone()
  });
  
  // Calculate dimensions after 3 points are placed
  if (appState.objectPoints.length === 3) {
    calculateObjectDimensions();
  }
  
  // Update UI
  updateDimensionsDisplay();
}

function placeAnchorDot(controller) {
  if (appState.anchorPoints.length >= 4) return; // Limit to 4 anchor points
  
  // Create a raycaster from the controller for more precise placement
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Calculate position a bit in front of the controller (where the crosshair is)
  const position = new THREE.Vector3();
  position.copy(raycaster.ray.origin);
  position.addScaledVector(raycaster.ray.direction, 0.15); // Match crosshair distance
  
  // Provide visual feedback - flash the crosshair
  if (controller.userData.crosshair) {
    // Flash the crosshair briefly by changing its color
    controller.userData.crosshair.children.forEach(child => {
      if (child.material) {
        const originalColor = child.material.color.clone();
        child.material.color.set(0xffff00); // Flash yellow
        setTimeout(() => {
          child.material.color.copy(originalColor);
        }, 150); // Reset after 150ms
      }
    });
  }
  
  // Smaller, more visible dots
  const dotGeometry = new THREE.SphereGeometry(0.01); // Reduced size for precision
  const dot = new THREE.Mesh(dotGeometry, anchorDotMaterial);
  dot.position.copy(position);
  
  // Make dots draggable
  dot.userData.isDraggable = true;
  dot.userData.pointType = 'anchor';
  dot.userData.pointIndex = appState.anchorPoints.length;
  
  scene.add(dot);
  
  appState.anchorPoints.push({
    mesh: dot,
    position: position.clone()
  });
  
  // Update UI
  updateDimensionsDisplay();
}

// Render a preview of the wall when all 3 points are defined
function renderWallPreview() {
  // Clear any existing wall preview
  if (appState.wallProjection) {
    scene.remove(appState.wallProjection);
    appState.wallProjection = null;
  }
  
  // Create a plane from wall points
  const wallPlane = createPlaneFromPoints(
    appState.wallPoints[0].position,
    appState.wallPoints[1].position,
    appState.wallPoints[2].position
  );
  
  // Create the wall projection
  createWallProjection(wallPlane);
}

function calculateObjectDimensions() {
  // Ensure we have 3 points
  if (appState.objectPoints.length !== 3) return;
  
  const p1 = appState.objectPoints[0].position; // Top-left
  const p2 = appState.objectPoints[1].position; // Top-right
  const p3 = appState.objectPoints[2].position; // Bottom-right
  
  // Calculate width (distance between top-left and top-right)
  const width = p1.distanceTo(p2);
  
  // Calculate height (distance between top-right and bottom-right)
  const height = p2.distanceTo(p3);
  
  // Convert to inches (assuming Three.js units are in meters)
  const inchesPerMeter = 39.3701;
  appState.objectDimensions = {
    width: (width * inchesPerMeter).toFixed(1),
    height: (height * inchesPerMeter).toFixed(1)
  };
  
  // Update display
  updateDimensionsDisplay();
}

function createObjectProjection() {
  // Ensure we have all required points
  if (appState.wallPoints.length < 3 || appState.objectPoints.length < 3) return;
  
  // Create a plane from wall points
  const wallPlane = createPlaneFromPoints(
    appState.wallPoints[0].position,
    appState.wallPoints[1].position,
    appState.wallPoints[2].position
  );
  
  // Create a wall projection that shows the defined wall area
  createWallProjection(wallPlane);
  
  // Convert object dimensions to meters for Three.js
  const inchesToMeters = 0.0254;
  const width = parseFloat(appState.objectDimensions.width) * inchesToMeters;
  const height = parseFloat(appState.objectDimensions.height) * inchesToMeters;
  
  // Create rectangle plane for the projection
  const projectionGeometry = new THREE.PlaneGeometry(width, height);
  const projectionMesh = new THREE.Mesh(projectionGeometry, projectionMaterial);
  
  // Position in the middle of the wall
  const wallCenter = new THREE.Vector3().addVectors(
    appState.wallPoints[0].position,
    appState.wallPoints[1].position
  ).multiplyScalar(0.5);
  
  projectionMesh.position.copy(wallCenter);
  
  // Store the initial position for depth adjustments
  projectionMesh.userData.initialPosition = wallCenter.clone();
  
  // Make the object projection draggable
  projectionMesh.userData.isDraggable = true;
  projectionMesh.userData.isObjectProjection = true;
  
  // Align with wall plane - we need to flip it so it faces outward
  const normal = wallPlane.normal.clone();
  projectionMesh.lookAt(wallCenter.clone().add(normal));
  
  // Fix the rotation to ensure the object is oriented correctly (not upside down)
  projectionMesh.rotateZ(Math.PI); // Flip it right-side up
  
  // Store the normal vector for depth adjustments
  projectionMesh.userData.normal = normal;
  
  scene.add(projectionMesh);
  appState.objectProjection = projectionMesh;
  
  // Add anchor points to the projection
  if (appState.anchorPoints.length > 0) {
    addAnchorPointsToProjection();
  }
}

function createWallProjection(wallPlane) {
  // Clear any existing wall projection
  if (appState.wallProjection) {
    scene.remove(appState.wallProjection);
  }
  
  // Create a larger plane representing the defined wall
  // Calculate the bounding area from the wall points
  const p0 = appState.wallPoints[0].position;
  const p1 = appState.wallPoints[1].position;
  const p2 = appState.wallPoints[2].position;
  
  // Calculate the center of the wall points
  const center = new THREE.Vector3()
    .add(p0)
    .add(p1)
    .add(p2)
    .divideScalar(3);
  
  // Calculate the maximum distance from center to any wall point
  const baseRadius = Math.max(
    center.distanceTo(p0),
    center.distanceTo(p1),
    center.distanceTo(p2)
  ) * 1.5;
  
  // Make wall taller and wider by 3 and 5 feet respectively (in meters)
  const extraWidth = 1.524; // 5 feet in meters
  const extraHeight = 0.9144; // 3 feet in meters
  const wallWidth = baseRadius * 2 + extraWidth;
  const wallHeight = baseRadius * 2 + extraHeight;
  
  // Create wall group
  const wallGroup = new THREE.Group();
  
  // Create a wall plane that's larger as requested
  const wallGeometry = new THREE.PlaneGeometry(wallWidth, wallHeight);
  // Make wall more transparent
  // Use the global wallProjectionMaterial which is already updated to be more transparent
  const wallMesh = new THREE.Mesh(wallGeometry, wallProjectionMaterial);
  
  // Position at the center of the wall points
  wallMesh.position.copy(center);
  
  // Store the reference for the normal vector for depth adjustments
  wallMesh.userData.normal = wallPlane.normal.clone();
  // Only make the wall draggable during wall setup phase (step 0)
  wallMesh.userData.isDraggable = (appState.currentStep === 0);
  wallMesh.userData.isWall = true;  // Flag as wall for special handling
  
  // Orient to match the wall plane
  wallMesh.lookAt(center.clone().add(wallPlane.normal));
  
  // Add the wall mesh to the group
  wallGroup.add(wallMesh);
  
  // We're removing the grid lines that look like a floor
  
  // Save to state and add to scene
  scene.add(wallGroup);
  appState.wallProjection = wallGroup;
  
  // Store initial position and normal for depth adjustments
  appState.wallProjection.userData = {
    initialPosition: center.clone(),
    normal: wallPlane.normal.clone()
  };
}

function addAnchorPointsToProjection() {
  if (!appState.objectProjection) return;
  
  // Clear any existing anchor visualizations
  appState.objectProjection.children.forEach(child => {
    if (child.userData.isAnchorVisualization) {
      appState.objectProjection.remove(child);
    }
  });
  
  // Calculate object dimensions and local coordinates
  const objectWidth = parseFloat(appState.objectDimensions.width) * 0.0254; // Convert inches to meters
  const objectHeight = parseFloat(appState.objectDimensions.height) * 0.0254;
  
  // Use the object points to create a normalized coordinate system
  if (appState.objectPoints.length !== 3) return;
  
  const topLeft = appState.objectPoints[0].position;
  const topRight = appState.objectPoints[1].position;
  const bottomRight = appState.objectPoints[2].position;
  
  // Calculate object width and height vectors
  const xVector = new THREE.Vector3().subVectors(topRight, topLeft).normalize();
  const yVector = new THREE.Vector3().subVectors(bottomRight, topRight).normalize();
  
  // For each anchor point, create a yellow circle on the projection
  appState.anchorPoints.forEach((anchor, index) => {
    // Transform anchor coordinates to object-local space
    const anchorPos = anchor.position.clone();
    const relativePos = anchorPos.clone().sub(topLeft);
    
    // Project onto x and y axis of object
    const x = relativePos.dot(xVector) / topLeft.distanceTo(topRight) * objectWidth;
    const y = relativePos.dot(yVector) / topRight.distanceTo(bottomRight) * objectHeight;
    
    // Normalize to -0.5 to 0.5 range for projection plane
    const normX = (x / objectWidth) - 0.5;
    const normY = (y / objectHeight) - 0.5;
    
    // Create a more visible anchor visualization
    const anchorVisualization = new THREE.Group();
    
    // Main circle - using yellow to match anchor dot color
    const circle = new THREE.Mesh(
      new THREE.CircleGeometry(0.012, 32), // Slightly smaller circle
      new THREE.MeshBasicMaterial({ 
        color: 0xffcc00, // Yellow to match anchor dots
        transparent: true,
        opacity: 0.9
      })
    );
    
    // Ring around the circle for better visibility
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.012, 0.016, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      })
    );
    
    // Add a label with anchor number
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 64;
    labelCanvas.height = 64;
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((index + 1).toString(), 32, 32);
    
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.01, 0.01),
      new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        depthTest: false
      })
    );
    label.position.z = 0.002;
    
    anchorVisualization.add(circle);
    anchorVisualization.add(ring);
    anchorVisualization.add(label);
    
    // Position the anchor visualization correctly on the projection
    anchorVisualization.position.set(
      normX * objectWidth,
      normY * objectHeight,
      0.002 // Slightly in front of the projection
    );
    
    anchorVisualization.userData.isAnchorVisualization = true;
    anchorVisualization.userData.anchorIndex = index;
    appState.objectProjection.add(anchorVisualization);
  });
}

function createPlaneFromPoints(p1, p2, p3) {
  // Create two vectors in the plane
  const v1 = new THREE.Vector3().subVectors(p2, p1);
  const v2 = new THREE.Vector3().subVectors(p3, p1);
  
  // Take the cross product to find the normal
  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
  
  // Return a THREE.Plane object
  return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, p1);
}

function updateDimensionsDisplay() {
  let dimensionsText = '';
  
  switch (appState.currentStep) {
    case 0:
      dimensionsText = `Wall Points: ${appState.wallPoints.length}/3`;
      break;
    case 1:
      dimensionsText = `Object Points: ${appState.objectPoints.length}/3`;
      if (appState.objectDimensions.width > 0) {
        dimensionsText += `\nSize: ${appState.objectDimensions.width}" × ${appState.objectDimensions.height}"`;
      }
      break;
    case 2:
      dimensionsText = `Anchor Points: ${appState.anchorPoints.length}/4`;
      break;
    case 3:
      dimensionsText = `Size: ${appState.objectDimensions.width}" × ${appState.objectDimensions.height}"`;
      // Show depth adjustment info
      if (appState.projectionDepth !== 0) {
        const distanceInInches = (appState.projectionDepth * 39.37).toFixed(1);
        const direction = appState.projectionDepth > 0 ? 'away' : 'closer';
        dimensionsText += `\nOffset: ${Math.abs(distanceInInches)}" ${direction}`;
      }
      break;
  }
  
  // Update the text mesh
  if (appState.ui.dimensionsText) {
    // Create a higher-resolution canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Higher resolution
    canvas.height = 256; // Higher resolution
    const context = canvas.getContext('2d');
    
    // Create a solid background to avoid transparency issues
    context.fillStyle = '#222222'; // Dark background
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#ffffff';
    context.font = 'bold 48px Arial'; // Much larger font
    context.textAlign = 'center';
    
    // Add a shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.7)';
    context.shadowBlur = 6;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // Add stroke for better visibility
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    
    // Draw each line of text
    const lines = dimensionsText.split('\n');
    lines.forEach((line, i) => {
      const yPos = 70 + (i * 60); // More space between lines
      context.strokeText(line, canvas.width/2, yPos);
      context.fillText(line, canvas.width/2, yPos);
    });
    
    // Update texture
    if (appState.ui.dimensionsText.material.map) {
      appState.ui.dimensionsText.material.map.dispose();
    }
    appState.ui.dimensionsText.material.map = new THREE.CanvasTexture(canvas);
    
    // Make the material opaque to avoid transparency issues
    appState.ui.dimensionsText.material.transparent = false;
    appState.ui.dimensionsText.material.needsUpdate = true;
  }
}

// ---------- FLOW CONTROL ----------
function goToNextStep() {
  // Make sure we have enough points for the current step
  switch (appState.currentStep) {
    case 0: // Wall Selection -> Object Definition
      if (appState.wallPoints.length < 3) {
        console.log("Please place 3 points on the wall before proceeding");
        return;
      }
      
      // When moving from wall setup, wall should no longer be draggable
      if (appState.wallProjection) {
        appState.wallProjection.children.forEach(child => {
          if (child.userData && child.userData.isWall) {
            child.userData.isDraggable = false;
          }
        });
      }
      break;
    case 1: // Object Definition -> Anchor Points
      if (appState.objectPoints.length < 3) {
        console.log("Please place 3 points to define the object before proceeding");
        return;
      }
      break;
    case 2: // Anchor Points -> Wall Projection
      if (appState.anchorPoints.length < 1) {
        console.log("Please place at least 1 anchor point before proceeding");
        return;
      }
      createObjectProjection();
      break;
  }
  
  // Move to the next step
  appState.currentStep += 1;
  if (appState.currentStep > 3) appState.currentStep = 3; // Cap at step 3
  
  // Update UI for the new step
  updateStepDisplay();
  updateDimensionsDisplay();
}

function resetCurrentStep() {
  switch (appState.currentStep) {
    case 0: // Wall Selection
      appState.wallPoints.forEach(point => {
        scene.remove(point.mesh);
      });
      appState.wallPoints = [];
      
      // Remove wall projection if it exists
      if (appState.wallProjection) {
        scene.remove(appState.wallProjection);
        appState.wallProjection = null;
      }
      break;
    case 1: // Object Definition
      appState.objectPoints.forEach(point => {
        scene.remove(point.mesh);
      });
      appState.objectPoints = [];
      appState.objectDimensions = { width: 0, height: 0 };
      break;
    case 2: // Anchor Points
      appState.anchorPoints.forEach(point => {
        scene.remove(point.mesh);
      });
      appState.anchorPoints = [];
      break;
    case 3: // Wall Projection
      // Hide depth controls
      appState.ui.depthAdjustControls.visible = false;
      
      // Reset projection depth
      appState.projectionDepth = 0;
      
      // Remove object projection
      if (appState.objectProjection) {
        scene.remove(appState.objectProjection);
        appState.objectProjection = null;
      }
      
      // Remove wall projection
      if (appState.wallProjection) {
        scene.remove(appState.wallProjection);
        appState.wallProjection = null;
      }
      
      appState.currentStep = 0; // Go back to the beginning
      resetCurrentStep(); // Reset everything
      break;
  }
  
  // Update UI
  updateStepDisplay();
  updateDimensionsDisplay();
}

function updateStepDisplay() {
  let stepText = '';
  
  switch (appState.currentStep) {
    case 0:
      stepText = 'Step 1: Wall Selection';
      break;
    case 1:
      stepText = 'Step 2: Object Definition';
      break;
    case 2:
      stepText = 'Step 3: Anchor Points';
      break;
    case 3:
      stepText = 'Step 4: Wall Projection';
      break;
  }
  
  // Update the text on the panel with improved formatting
  // Find the step text mesh (first text child of the panel)
  let textMesh = appState.ui.panel.children[2]; // Default to index 2
  // If default index doesn't work, search for the text mesh
  if (!textMesh || !textMesh.material || !textMesh.material.map) {
    for (let i = 0; i < appState.ui.panel.children.length; i++) {
      const child = appState.ui.panel.children[i];
      if (child instanceof THREE.Mesh && child.material && child.material.map) {
        textMesh = child;
        break;
      }
    }
  }
  if (textMesh) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Higher resolution
    canvas.height = 256; // Higher resolution
    const context = canvas.getContext('2d');
    
    // Create a solid background to avoid transparency issues
    context.fillStyle = '#222222'; // Dark background
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set style for better visibility
    context.fillStyle = '#ffffff';
    context.font = 'bold 72px Arial'; // Much larger font for better visibility
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add shadow for better contrast
    context.shadowColor = 'rgba(0, 0, 0, 0.7)';
    context.shadowBlur = 6;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // Draw text with outline for better visibility
    context.strokeStyle = '#000000';
    context.lineWidth = 4;
    context.strokeText(stepText, canvas.width/2, canvas.height/2);
    context.fillText(stepText, canvas.width/2, canvas.height/2);
    
    // Update texture
    if (textMesh.material.map) {
      textMesh.material.map.dispose();
    }
    textMesh.material.map = new THREE.CanvasTexture(canvas);
    
    // Set material to solid (non-transparent) to avoid layering issues
    textMesh.material.transparent = false;
    textMesh.material.needsUpdate = true;
  }
}

// ---------- ANIMATION LOOP ----------
function animate() {
  renderer.setAnimationLoop(render);
}

// Function to check for UI hover states
function checkUIHover(controller) {
  // Create raycaster for interactions
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Check for button hover effects for all interactive elements
  // First collect all UI buttons in a flat array
  const buttons = [];
  
  // Add main UI buttons
  if (appState.ui.nextButton) buttons.push(appState.ui.nextButton);
  if (appState.ui.resetButton) buttons.push(appState.ui.resetButton);
  
  // Check for direct hand touches - this allows both ray pointing and direct touch
  const buttonMeshes = [];
  buttons.forEach(button => {
    // Add the mesh and any child meshes
    if (button.children && button.children.length > 0) {
      button.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          buttonMeshes.push(child);
          child.userData.parentButton = button;
        }
      });
    }
    
    if (button instanceof THREE.Mesh) {
      buttonMeshes.push(button);
    }
  });
  
  // Check for intersections with any button meshes
  const intersects = raycaster.intersectObjects(buttonMeshes, false);
  
  // Reset all buttons first
  buttons.forEach(button => {
    if (button.children && button.children.length > 0) {
      const buttonMesh = button.children[0];
      if (buttonMesh && buttonMesh.material && buttonMesh.userData.defaultColor) {
        buttonMesh.material.color.set(buttonMesh.userData.defaultColor);
      }
    }
  });
  
  // Apply hover effect to intersected button
  if (intersects.length > 0 && !appState.interaction.isDragging) {
    const hitObject = intersects[0].object;
    const buttonMesh = (hitObject.userData.parentButton) ? 
                       hitObject.userData.parentButton.children[0] : 
                       hitObject;
    
    // If it's a button, highlight it
    if (buttonMesh && buttonMesh.userData && buttonMesh.userData.hoverColor) {
      buttonMesh.material.color.set(buttonMesh.userData.hoverColor);
      
      // Check for hand touches - allow users to directly push buttons
      if (appState.handModels.right && appState.handModels.right.visible) {
        // If we're using hand tracking, check if index finger is close to button
        const indexFingerPosition = getHandJointPosition(appState.handModels.right, 'index-finger-tip');
        if (indexFingerPosition) {
          const distance = indexFingerPosition.distanceTo(buttonMesh.position);
          if (distance < 0.03) { // 3cm touch distance
            // Direct touch detected - trigger the button action
            if (buttonMesh.parent === appState.ui.nextButton) {
              goToNextStep();
            } else if (buttonMesh.parent === appState.ui.resetButton) {
              resetCurrentStep();
            }
          }
        }
      }
    }
  }
}

// Helper function to get hand joint position if available
function getHandJointPosition(handModel, jointName) {
  if (!handModel || !handModel.joints || !handModel.joints[jointName]) return null;
  
  const joint = handModel.joints[jointName];
  if (!joint) return null;
  
  const position = new THREE.Vector3();
  position.setFromMatrixPosition(joint.matrixWorld);
  return position;
}

// Handle dragging points with controller
function dragPointWithController(controller) {
  if (!appState.interaction.draggedObject || !controller) return;
  
  const draggedObj = appState.interaction.draggedObject;
  
  // Create ray for pointer-based dragging
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Create/update ray visualization
  createRayPointer(controller, raycaster.ray);
  
  // Get the current position of the controller
  const controllerPosition = new THREE.Vector3();
  controllerPosition.setFromMatrixPosition(controller.matrixWorld);
  
  // For finer control, use raycasting to position the point
  const objects = [];
  
  // If we have a wall projection, use it for raycasting
  if (appState.wallProjection) {
    appState.wallProjection.children.forEach(child => {
      if (child.userData && child.userData.isWall) {
        objects.push(child);
      }
    });
  }
  
  // Check if ray intersects the wall or any other objects
  const intersects = raycaster.intersectObjects(objects);
  
  // Use either the intersection point or the controller position
  let newPosition;
  if (intersects.length > 0) {
    newPosition = intersects[0].point.clone();
  } else {
    // If no intersection, use a position some distance from the controller
    newPosition = controllerPosition.clone().add(
      raycaster.ray.direction.clone().multiplyScalar(0.2)
    );
  }
  
  // Update the dot position 
  draggedObj.position.copy(newPosition);
  
  // Update the stored position in appState
  if (draggedObj.userData.pointType === 'wall') {
    const index = draggedObj.userData.pointIndex;
    appState.wallPoints[index].position.copy(newPosition);
    
    // Update wall preview if all 3 points are placed
    if (appState.wallPoints.length === 3) {
      renderWallPreview();
    }
  } else if (draggedObj.userData.pointType === 'object') {
    const index = draggedObj.userData.pointIndex;
    appState.objectPoints[index].position.copy(newPosition);
    
    // Recalculate dimensions if we moved object points
    if (appState.objectPoints.length === 3) {
      calculateObjectDimensions();
    }
  } else if (draggedObj.userData.pointType === 'anchor') {
    const index = draggedObj.userData.pointIndex;
    appState.anchorPoints[index].position.copy(newPosition);
    
    // Update anchor visualizations if we're in projection mode
    if (appState.currentStep === 3 && appState.objectProjection) {
      addAnchorPointsToProjection();
    }
  }
}

function render() {
  // Determine controller handedness (which one is left/right)
  assignControllersByHandedness();
  
  // Always show ray pointers from both controllers
  if (appState.controllers.left) {
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(appState.controllers.left.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(appState.controllers.left.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    createRayPointer(appState.controllers.left, raycaster.ray);
  }
  
  if (appState.controllers.right) {
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(appState.controllers.right.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(appState.controllers.right.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    createRayPointer(appState.controllers.right, raycaster.ray);
  }
  
  // Position UI panel 12 inches (0.3048 meters) above left controller if available
  if (appState.controllers.left && appState.ui.panel && !appState.interaction.isDraggingUI) {
    const leftControllerPos = new THREE.Vector3();
    leftControllerPos.setFromMatrixPosition(appState.controllers.left.matrixWorld);
    
    // Position 12 inches (0.3048 meters) above the controller
    appState.ui.panel.position.x = leftControllerPos.x;
    appState.ui.panel.position.z = leftControllerPos.z;
    appState.ui.panel.position.y = leftControllerPos.y + 0.3048; // 12 inches in meters
    
    // Don't rotate the panel - keep it facing forward relative to user
    // This keeps text readable from any angle
    if (camera) {
      // Make panel face camera but only rotate around Y axis
      const cameraPos = new THREE.Vector3();
      cameraPos.setFromMatrixPosition(camera.matrixWorld);
      cameraPos.y = appState.ui.panel.position.y; // Keep at same height
      
      // Look at camera but only on horizontal plane
      appState.ui.panel.lookAt(cameraPos);
    }
  }
  
  // Handle interactive dragging
  if (appState.interaction.isDragging && appState.interaction.draggedObject) {
    const draggedObj = appState.interaction.draggedObject;
    
    if (draggedObj.userData.pointType) {
      // Handle dragging dots
      dragPointWithController(appState.controllers.right);
    } 
    else if (draggedObj.userData.isObjectProjection) {
      // Handle dragging object projection
      dragObjectProjection(appState.controllers.right);
    }
    else if (draggedObj.userData.isWall) {
      // Handle dragging wall
      dragWallProjection(appState.controllers.right);
    }
  }
  else if (appState.interaction.isDraggingUI && appState.interaction.draggedObject) {
    // Handle UI panel dragging
    dragUIPanel(appState.controllers.right);
  }
  
  // Check for UI elements being hovered
  if (appState.controllers.right) {
    checkUIHover(appState.controllers.right);
  }
  
  renderer.render(scene, camera);
}

// Drag the UI panel
function dragUIPanel(controller) {
  if (!controller) return;
  
  // Create a ray from the controller
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Calculate a position a fixed distance away from the controller
  const distance = 0.5; // 0.5 meters in front of the controller
  const newPosition = raycaster.ray.origin.clone().add(
    raycaster.ray.direction.clone().multiplyScalar(distance)
  );
  
  // Update the UI panel position
  appState.ui.panel.position.copy(newPosition);
  
  // Make the panel face the user
  appState.ui.panel.lookAt(camera.position);
}

// Drag the object projection
function dragObjectProjection(controller) {
  if (!controller || !appState.objectProjection || !appState.wallProjection) return;
  
  // Get the current position of the controller
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Find intersection with wall plane
  const wallMesh = appState.wallProjection.children.find(c => c.userData && c.userData.isWall);
  if (!wallMesh) return;
  
  // Use the wall's normal to create a plane
  const normal = wallMesh.userData.normal;
  const wallPosition = wallMesh.position.clone();
  const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, wallPosition);
  
  // Find intersection with wall plane
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(wallPlane, intersection);
  
  if (intersection) {
    // Move the projection to the intersection point
    appState.objectProjection.position.copy(intersection);
    
    // Make sure it's still oriented correctly on the wall
    const lookAtPoint = intersection.clone().add(normal);
    
    // Look at the center of the mesh + normal vector
    appState.objectProjection.lookAt(lookAtPoint);
    
    // We need to fix the rotation to keep it right-side up
    appState.objectProjection.rotateZ(Math.PI);
  }
}

// Drag the wall projection
function dragWallProjection(controller) {
  if (!controller || !appState.wallProjection) return;
  
  // Get the current position of the controller
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Calculate a position a certain distance along the ray
  const distance = appState.interaction.draggedObject.position.distanceTo(raycaster.ray.origin);
  const newPosition = raycaster.ray.origin.clone().add(
    raycaster.ray.direction.clone().multiplyScalar(distance)
  );
  
  // Move the wall group to the new position
  const offsetVector = newPosition.clone().sub(appState.interaction.draggedObject.position);
  
  // Move all children of the wall group
  appState.wallProjection.children.forEach(child => {
    child.position.add(offsetVector);
  });
  
  // If we have an object projection, move it too
  if (appState.objectProjection) {
    appState.objectProjection.position.add(offsetVector);
  }
}

function assignControllersByHandedness() {
  const session = renderer.xr.getSession();
  
  if (session) {    
    // Get input sources
    const inputSources = session.inputSources;
    
    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];
      const handedness = inputSource.handedness;
      
      if (handedness === 'left') {
        appState.controllers.left = renderer.xr.getController(i);
      } else if (handedness === 'right') {
        appState.controllers.right = renderer.xr.getController(i);
      }
    }
    
    // If we couldn't determine handedness but have controllers, use them in order
    if (!appState.controllers.left && !appState.controllers.right) {
      if (renderer.xr.getController(0)) {
        appState.controllers.left = renderer.xr.getController(0);
      }
      if (renderer.xr.getController(1)) {
        appState.controllers.right = renderer.xr.getController(1);
      }
    }
    
    // Position the UI panel in a more comfortable position on startup
    if (camera && appState.ui.panel) {
      // Only adjust once
      if (!appState.ui.panel.userData.positionAdjusted) {
        // Position the panel at a more accessible height (waist/chest level)
        appState.ui.panel.position.set(0, 0.2, -0.5);
        appState.ui.panel.userData.positionAdjusted = true;
      }
    }
  }
}

// This function is no longer needed as we now use a floating draggable panel
// rather than attaching to controller
function updateUIPosition() {
  // If panel is in scene but not visible, make it visible
  if (appState.ui.panel && !appState.ui.panel.visible) {
    appState.ui.panel.visible = true;
  }
  
  // Make sure panel faces user
  if (appState.ui.panel && camera) {
    // Only update orientation if not being dragged
    if (!appState.interaction.isDraggingUI) {
      // Calculate direction to camera
      const direction = new THREE.Vector3();
      direction.subVectors(camera.position, appState.ui.panel.position).normalize();
      
      // Create a target position in front of the panel
      const targetPosition = new THREE.Vector3().addVectors(
        appState.ui.panel.position,
        direction
      );
      
      // Make panel face the user
      appState.ui.panel.lookAt(targetPosition);
    }
  }
}

function moveProjectionWithController() {
  if (!appState.objectProjection || !appState.wallProjection || !appState.controllers.right) return;
  
  // Get the current position of the right controller
  const controller = appState.controllers.right;
  const controllerPosition = new THREE.Vector3();
  controllerPosition.setFromMatrixPosition(controller.matrixWorld);
  
  // Create a plane representing the wall
  const wallPlane = createPlaneFromPoints(
    appState.wallPoints[0].position,
    appState.wallPoints[1].position, 
    appState.wallPoints[2].position
  );
  
  // Create a ray from the controller in the forward direction
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Find intersection with wall plane
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(wallPlane, intersection);
  
  if (intersection) {
    // Move the projection to the intersection point
    appState.objectProjection.position.copy(intersection);
    
    // Apply the depth adjustment
    if (appState.projectionDepth !== 0) {
      const normal = appState.objectProjection.userData.normal;
      const depthOffset = normal.clone().multiplyScalar(appState.projectionDepth);
      appState.objectProjection.position.add(depthOffset);
    }
    
    // Make sure it's oriented correctly on the wall
    appState.objectProjection.lookAt(
      intersection.clone().add(wallPlane.normal)
    );
    
    // Move any anchor visualizations along with the projection
    updateAnchorVisualizationPositions();
  }
}

// Add a function to adjust projection depth
function adjustProjectionDepth(change) {
  // Prevent going too far in either direction
  if ((appState.projectionDepth + change > -0.5) && (appState.projectionDepth + change < 0.5)) {
    appState.projectionDepth += change;
    
    // Update the projection position based on the depth
    if (appState.objectProjection && appState.objectProjection.userData.normal) {
      const normal = appState.objectProjection.userData.normal;
      const initialPosition = appState.objectProjection.userData.initialPosition.clone();
      
      // Start from initial position and apply depth offset
      const newPosition = initialPosition.clone().add(
        normal.clone().multiplyScalar(appState.projectionDepth)
      );
      
      // Update position maintaining the same x,y in the wall plane
      const currentPos = appState.objectProjection.position.clone();
      
      // Only adjust the depth component (along the normal)
      const depthComponent = normal.clone().multiplyScalar(normal.dot(newPosition.clone().sub(currentPos)));
      appState.objectProjection.position.add(depthComponent);
      
      // If we have a wall projection, adjust its distance too
      if (appState.wallProjection) {
        // For a group, we need to move each child
        appState.wallProjection.children.forEach(child => {
          child.position.add(depthComponent);
        });
      }
      
      // Update dimensions display to reflect the new depth
      updateDimensionsDisplay();
    }
  }
}

// Keep anchor visualizations properly positioned when the projection moves
function updateAnchorVisualizationPositions() {
  if (!appState.objectProjection) return;
  
  // Since the anchor visualizations are children of the projection,
  // they will move with it automatically. No need to update positions.
}