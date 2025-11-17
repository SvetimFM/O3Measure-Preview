# Modern Spatial UI System - Developer Guide

This guide covers the cutting-edge spatial UI system built with **Troika-Three-Text** and **Three-Mesh-UI** following **Meta Quest 2025 design guidelines**.

## 🎨 What's New?

### Before (Basic A-Frame)
```html
<!-- Low-quality bitmap text -->
<a-text value="Button" color="#fff"></a-text>

<!-- Flat panels -->
<a-plane color="#333"></a-plane>
```

### After (Modern Spatial UI)
```html
<!-- High-quality SDF text -->
<a-entity spatial-text="value: Button; fontSize: 0.05"></a-entity>

<!-- Curved 3D panels with depth -->
<a-entity curved-panel="width: 0.5; height: 0.3; radius: 2"></a-entity>

<!-- Modern buttons with animations -->
<a-entity spatial-button="label: Click Me"></a-entity>
```

---

## 📦 Components Overview

### 1. `spatial-text` - High-Quality Text Rendering

Uses **Troika-Three-Text** for crisp, scalable text at any distance.

**Features:**
- ✅ Signed Distance Field (SDF) rendering
- ✅ Smooth at any scale/distance
- ✅ Unicode support
- ✅ Text outlines
- ✅ Better performance than bitmap fonts

**Basic Usage:**
```html
<a-entity spatial-text="
  value: Hello World;
  fontSize: 0.05;
  color: #15ACCF;
  anchorX: center;
  anchorY: middle">
</a-entity>
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | string | 'Text' | Text content |
| `fontSize` | number | 0.05 | Font size in meters |
| `color` | color | #ffffff | Text color |
| `anchorX` | string | center | Horizontal alignment (left/center/right) |
| `anchorY` | string | middle | Vertical alignment (top/middle/bottom) |
| `maxWidth` | number | 1 | Maximum width before wrapping |
| `textAlign` | string | center | Text alignment |
| `outlineWidth` | number | 0 | Outline thickness |
| `outlineColor` | color | #000000 | Outline color |
| `opacity` | number | 1 | Transparency (0-1) |

**Advanced Example:**
```html
<a-entity spatial-text="
  value: O3Measure;
  fontSize: 0.08;
  color: #15ACCF;
  anchorX: center;
  outlineWidth: 0.003;
  outlineColor: #000000;
  maxWidth: 0.5">
</a-entity>
```

---

### 2. `curved-panel` - Curved UI Panels

Creates curved panels that follow the user's field of view, per Meta Quest guidelines.

**Features:**
- ✅ Curved geometry (cylindrical)
- ✅ Depth layers for 3D effect
- ✅ Customizable borders
- ✅ Glow effects
- ✅ Shadows

**Basic Usage:**
```html
<a-entity curved-panel="
  width: 0.5;
  height: 0.3;
  radius: 2;
  color: #1a1a1a;
  borderColor: #15ACCF">
</a-entity>
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | number | 0.5 | Panel width |
| `height` | number | 0.3 | Panel height |
| `radius` | number | 2 | Curvature radius (larger = less curved) |
| `segments` | number | 32 | Geometry segments (higher = smoother) |
| `color` | color | #1a1a1a | Panel color |
| `opacity` | number | 0.95 | Transparency |
| `borderWidth` | number | 0.002 | Border thickness |
| `borderColor` | color | #15ACCF | Border color |
| `depth` | number | 0.01 | Panel thickness/depth |
| `glowIntensity` | number | 0 | Emissive glow (0-1) |
| `castShadow` | boolean | true | Enable shadows |

**Example with Glow:**
```html
<a-entity curved-panel="
  width: 0.6;
  height: 0.4;
  radius: 1.5;
  color: #2a2a2a;
  borderColor: #15ACCF;
  borderWidth: 0.003;
  glowIntensity: 0.3;
  depth: 0.015">
</a-entity>
```

---

### 3. `spatial-button` - Modern 3D Buttons

Interactive buttons with depth, animations, and haptic feedback.

**Features:**
- ✅ 3D depth and shadows
- ✅ Rounded corners
- ✅ Hover/press animations
- ✅ Haptic feedback
- ✅ Emissive glow on hover
- ✅ Scale animation

**Basic Usage:**
```html
<a-entity spatial-button="
  label: Click Me;
  width: 0.15;
  height: 0.05"
  position="0 1.5 -0.5">
</a-entity>
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | Button | Button text |
| `width` | number | 0.15 | Button width |
| `height` | number | 0.05 | Button height |
| `depth` | number | 0.01 | Button thickness |
| `color` | color | #15ACCF | Normal color |
| `hoverColor` | color | #1ac4e6 | Hover color |
| `pressColor` | color | #0f8fad | Press color |
| `textColor` | color | #ffffff | Text color |
| `fontSize` | number | 0.03 | Text size |
| `borderRadius` | number | 0.01 | Corner roundness |
| `glowOnHover` | boolean | true | Glow when hovered |
| `haptics` | boolean | true | Enable haptic feedback |

**Event Handling:**
```javascript
const button = document.querySelector('[spatial-button]');
button.addEventListener('spatial-button-click', (evt) => {
  console.log('Button clicked!');
});
```

---

### 4. `spatial-panel` - Smart Container

Flexible panel container with auto-layout and user-following options.

**Features:**
- ✅ Curved or flat modes
- ✅ Optional user-following
- ✅ Spatial anchoring
- ✅ Auto-sizing
- ✅ Content padding

**Basic Usage:**
```html
<a-entity spatial-panel="
  width: 0.5;
  height: 0.4;
  curved: true;
  followUser: false">
</a-entity>
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | number | 0.5 | Panel width |
| `height` | number | 0.3 | Panel height |
| `curved` | boolean | true | Use curved panel |
| `curvature` | number | 2 | Curvature radius |
| `padding` | number | 0.02 | Content padding |
| `backgroundColor` | color | #1a1a1a | Background color |
| `backgroundOpacity` | number | 0.95 | Background opacity |
| `borderColor` | color | #15ACCF | Border color |
| `borderWidth` | number | 0.002 | Border width |
| `followUser` | boolean | false | Follow camera |
| `followSmoothing` | number | 0.1 | Follow speed (0-1) |
| `anchorToSpace` | boolean | true | Fix to world space |

---

## 🖐️ Hand Tracking Integration

### 5. `hand-ui-raycaster` - Hand Pointing

Cast rays from finger tips for UI interaction.

**Features:**
- ✅ Index finger pointing
- ✅ Visual laser pointer
- ✅ Hover detection
- ✅ Pinch-to-click
- ✅ Distance limiting

**Setup:**
```html
<!-- Add to hand entities -->
<a-entity id="leftHand"
  hand-tracking-controls="hand: left"
  hand-ui-raycaster="hand: left; showLine: true">
</a-entity>

<a-entity id="rightHand"
  hand-tracking-controls="hand: right"
  hand-ui-raycaster="hand: right; showLine: true">
</a-entity>
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hand` | string | right | Which hand (left/right) |
| `lineColor` | color | #15ACCF | Pointer line color |
| `lineOpacity` | number | 0.5 | Line transparency |
| `lineWidth` | number | 0.002 | Line thickness |
| `showLine` | boolean | true | Show laser pointer |
| `maxDistance` | number | 2 | Max interaction distance |
| `enabled` | boolean | true | Enable/disable |

---

### 6. `ui-grabbable` - Grab & Reposition

Allow UI panels to be grabbed and moved.

**Features:**
- ✅ Grip gesture detection
- ✅ Smooth following
- ✅ Distance limiting
- ✅ Haptic feedback
- ✅ Visual feedback

**Usage:**
```html
<a-entity spatial-panel
  ui-grabbable="enabled: true; hapticFeedback: true">
</a-entity>
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | true | Enable grabbing |
| `smoothing` | number | 0.3 | Follow smoothness (0-1) |
| `maxDistance` | number | 1.5 | Max grab distance |
| `hapticFeedback` | boolean | true | Haptic on grab/release |

**Events:**
```javascript
panel.addEventListener('grab-start', () => {
  console.log('Panel grabbed');
});

panel.addEventListener('grab-end', () => {
  console.log('Panel released');
});
```

---

### 7. `poke-detector` - Direct Touch

Detect finger poke gestures for button pressing.

**Features:**
- ✅ Collision detection
- ✅ Both hands supported
- ✅ Haptic feedback
- ✅ Visual feedback

**Usage:**
```html
<a-entity spatial-button
  poke-detector="threshold: 0.01; haptics: true">
</a-entity>
```

**Events:**
- `poke-start` - Finger enters element
- `poke-end` - Finger leaves element

---

### 8. `hover-highlight` - Visual Feedback

Automatic hover effects for interactive elements.

**Features:**
- ✅ Scale animation
- ✅ Emissive glow
- ✅ Configurable colors
- ✅ Smooth transitions

**Usage:**
```html
<a-entity spatial-button
  hover-highlight="color: #15ACCF; intensity: 0.3; scale: 1.05">
</a-entity>
```

---

## 🎯 Complete Examples

### Example 1: Simple Menu

```html
<a-entity id="simple-menu" position="0 1.5 -0.8">
  <!-- Panel -->
  <a-entity curved-panel="
    width: 0.4;
    height: 0.5;
    color: #1a1a1a;
    borderColor: #15ACCF">

    <!-- Title -->
    <a-entity spatial-text="
      value: Menu;
      fontSize: 0.05;
      color: #15ACCF"
      position="0 0.2 0.02">
    </a-entity>

    <!-- Buttons -->
    <a-entity spatial-button="
      label: Start;
      width: 0.3;
      height: 0.05"
      position="0 0.05 0.02">
    </a-entity>

    <a-entity spatial-button="
      label: Settings;
      width: 0.3;
      height: 0.05"
      position="0 -0.05 0.02">
    </a-entity>

    <a-entity spatial-button="
      label: Quit;
      width: 0.3;
      height: 0.05;
      color: #EF4444"
      position="0 -0.15 0.02">
    </a-entity>
  </a-entity>
</a-entity>
```

### Example 2: Modern Spatial Menu Component

```html
<!-- Just add this to your scene -->
<a-entity modern-spatial-menu
  position="0 1.5 -0.8"
  curved="true"
  grabbable="true">
</a-entity>
```

This creates a complete menu with:
- Curved panel background
- SDF text title
- 5 interactive buttons
- Close button
- Hand tracking support
- Haptic feedback

### Example 3: Floating Info Panel

```html
<a-entity info-panel="
  title: Welcome!;
  message: Point with your finger and pinch to select;
  width: 0.35;
  height: 0.2;
  autoHide: 5000"
  position="0 1.6 -0.6">
</a-entity>
```

### Example 4: Performance HUD

```html
<a-entity spatial-hud></a-entity>
```

Automatically shows:
- FPS counter with color coding
- Status text
- Follows camera view

---

## 🎨 Customization Guide

### Changing Theme Colors

All components support color customization:

```html
<!-- Primary color theme -->
<a-entity curved-panel="
  color: #1a1a1a;
  borderColor: #15ACCF">
</a-entity>

<!-- Success theme -->
<a-entity spatial-button="
  color: #10B981;
  hoverColor: #059669">
</a-entity>

<!-- Error theme -->
<a-entity spatial-button="
  color: #EF4444;
  hoverColor: #DC2626">
</a-entity>
```

### Adjusting Curvature

For different viewing distances:

```html
<!-- Close to user - more curved -->
<a-entity curved-panel="radius: 1.2"></a-entity>

<!-- Normal distance - moderate curve -->
<a-entity curved-panel="radius: 2"></a-entity>

<!-- Far from user - less curved -->
<a-entity curved-panel="radius: 3"></a-entity>

<!-- Flat panel -->
<a-entity spatial-panel="curved: false"></a-entity>
```

### Custom Layouts

```javascript
// Create a vertical button list
const panel = document.createElement('a-entity');
panel.setAttribute('spatial-panel', { width: 0.4, height: 0.6 });

const buttons = ['Option 1', 'Option 2', 'Option 3'];
buttons.forEach((label, i) => {
  const btn = document.createElement('a-entity');
  btn.setAttribute('spatial-button', { label: label, width: 0.35 });
  btn.setAttribute('position', `0 ${0.2 - i * 0.08} 0.02`);
  panel.appendChild(btn);
});

scene.appendChild(panel);
```

---

## 🚀 Performance Tips

### 1. Limit Text Updates

SDF text is fast, but avoid updating every frame:

```javascript
// ❌ Bad - updates every frame
this.tick = function() {
  textEl.setAttribute('spatial-text', 'value', `FPS: ${fps}`);
};

// ✅ Good - throttled updates
setInterval(() => {
  textEl.setAttribute('spatial-text', 'value', `FPS: ${fps}`);
}, 1000);
```

### 2. Reuse Geometries

For multiple similar panels:

```javascript
// Components automatically reuse geometries
// Just use the same configuration
```

### 3. Curved Panel Segments

Balance quality vs performance:

```html
<!-- Lower quality, better performance -->
<a-entity curved-panel="segments: 16"></a-entity>

<!-- Higher quality, more GPU load -->
<a-entity curved-panel="segments: 64"></a-entity>

<!-- Recommended balance -->
<a-entity curved-panel="segments: 32"></a-entity>
```

### 4. Visibility Culling

Hide panels when not in use:

```javascript
menu.setAttribute('visible', false); // Stops rendering completely
```

---

## 🐛 Troubleshooting

### Text Not Appearing

**Problem**: spatial-text shows nothing

**Solutions:**
1. Check z-position (must be in front of panel)
2. Verify fontSize is appropriate for distance
3. Ensure Troika is loaded: Check console for "Spatial UI loaded"
4. Try increasing depthOffset: `depthOffset: 0.001`

### Buttons Not Clickable

**Problem**: spatial-button doesn't respond

**Solutions:**
1. Ensure hands have `hand-ui-raycaster` component
2. Check button has `interactive` class (added automatically)
3. Verify hand tracking is enabled in Quest settings
4. Try adding `poke-detector` for direct touch

### Curved Panels Look Flat

**Problem**: curved-panel appears flat

**Solutions:**
1. Increase segments: `segments: 64`
2. Adjust camera position (view from different angle)
3. Check radius isn't too large: try `radius: 1.5`
4. Enable shadows for depth perception: `castShadow: true`

### Performance Issues

**Problem**: Low FPS with UI

**Solutions:**
1. Reduce panel segments: `segments: 16`
2. Limit number of buttons/elements
3. Disable shadows on panels: `castShadow: false`
4. Use flat panels instead of curved when possible

### Hand Tracking Not Working

**Problem**: Can't interact with UI using hands

**Solutions:**
1. Enable hand tracking in Quest settings
2. Ensure good lighting conditions
3. Check hands are within `maxDistance`
4. Verify raycaster is attached to hand entities
5. Look for "Hand UI Interaction loaded" in console

---

## 📚 API Reference Summary

### Components

| Component | Purpose | Key Feature |
|-----------|---------|-------------|
| `spatial-text` | High-quality text | SDF rendering |
| `curved-panel` | Curved backgrounds | Follows FOV |
| `spatial-button` | 3D buttons | Depth & animations |
| `spatial-panel` | Smart containers | Auto-layout |
| `hand-ui-raycaster` | Finger pointing | Laser pointer |
| `ui-grabbable` | Grab & move | Repositioning |
| `poke-detector` | Direct touch | Collision detection |
| `hover-highlight` | Visual feedback | Glow & scale |

### Pre-built Components

| Component | Description |
|-----------|-------------|
| `modern-spatial-menu` | Complete menu system |
| `info-panel` | Floating notifications |
| `spatial-hud` | Performance HUD |

---

## 🎓 Best Practices

### ✅ Do

- Use curved panels for main menus (better FOV)
- Add hover-highlight to all interactive elements
- Enable haptic feedback for better UX
- Use poke-detector for critical buttons
- Position panels 0.6-1.0m from user
- Use spatial-text for all text (better quality)

### ❌ Don't

- Lock UI to user's head (use followUser sparingly)
- Make buttons smaller than 0.05 x 0.05m
- Update text every frame (throttle to ~10fps)
- Use flat a-text (use spatial-text instead)
- Forget to add raycasters to hands
- Place UI too close (<0.4m) or too far (>2m)

---

**Version:** 1.0.0
**Created:** 2025-01-17
**Compatibility:** Meta Quest 2, Quest 3, Quest Pro
**Dependencies:** Troika-Three-Text, Three-Mesh-UI, A-Frame 1.7.0
