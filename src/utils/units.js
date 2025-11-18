/**
 * Unit Conversion System
 * Comprehensive unit conversion for spatial measurements
 * Supports metric, imperial, and mixed unit systems
 */

/**
 * Unit systems supported by O3Measure
 */
export const UNIT_SYSTEMS = {
  METRIC: 'metric',
  IMPERIAL: 'imperial',
  METRIC_CM: 'metric_cm',
  METRIC_MM: 'metric_mm'
};

/**
 * Unit types for different measurement categories
 */
export const UNIT_TYPES = {
  LENGTH: 'length',
  AREA: 'area',
  VOLUME: 'volume'
};

/**
 * Default unit system (can be changed via settings)
 */
let currentUnitSystem = UNIT_SYSTEMS.METRIC;

/**
 * Set the current unit system
 * @param {string} system - Unit system to use
 */
export function setUnitSystem(system) {
  if (!Object.values(UNIT_SYSTEMS).includes(system)) {
    console.error(`Invalid unit system: ${system}`);
    return;
  }
  currentUnitSystem = system;

  // Persist to localStorage
  localStorage.setItem('o3measure_unit_system', system);

  // Emit event for UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('unit-system-changed', {
      detail: { system }
    }));
  }
}

/**
 * Get the current unit system
 * @returns {string} Current unit system
 */
export function getUnitSystem() {
  // Check localStorage on first load
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('o3measure_unit_system');
    if (stored && Object.values(UNIT_SYSTEMS).includes(stored)) {
      currentUnitSystem = stored;
    }
  }
  return currentUnitSystem;
}

/**
 * Convert meters to the current unit system
 * @param {number} meters - Length in meters
 * @param {object} options - Conversion options
 * @returns {object} Converted value with unit label
 */
export function convertLength(meters, options = {}) {
  const {
    precision = 1,
    system = getUnitSystem(),
    includeUnit = true,
    shortUnit = false
  } = options;

  let value, unit, shortLabel;

  switch (system) {
    case UNIT_SYSTEMS.METRIC:
      // Auto-select best metric unit
      if (meters >= 1) {
        value = meters;
        unit = 'meters';
        shortLabel = 'm';
      } else if (meters >= 0.01) {
        value = meters * 100;
        unit = 'centimeters';
        shortLabel = 'cm';
      } else {
        value = meters * 1000;
        unit = 'millimeters';
        shortLabel = 'mm';
      }
      break;

    case UNIT_SYSTEMS.METRIC_CM:
      value = meters * 100;
      unit = 'centimeters';
      shortLabel = 'cm';
      break;

    case UNIT_SYSTEMS.METRIC_MM:
      value = meters * 1000;
      unit = 'millimeters';
      shortLabel = 'mm';
      break;

    case UNIT_SYSTEMS.IMPERIAL:
      const totalInches = meters * 39.3701;
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;

      if (feet > 0) {
        value = feet;
        unit = 'feet';
        shortLabel = 'ft';

        // Include inches if significant
        if (inches >= 0.5) {
          const inchesRounded = inches.toFixed(precision);
          return {
            value: `${feet}' ${inchesRounded}"`,
            unit: 'feet and inches',
            shortUnit: `${feet}' ${inchesRounded}"`,
            numericValue: totalInches,
            originalMeters: meters
          };
        }
      } else {
        value = totalInches;
        unit = 'inches';
        shortLabel = 'in';
      }
      break;

    default:
      value = meters;
      unit = 'meters';
      shortLabel = 'm';
  }

  const formatted = parseFloat(value.toFixed(precision));
  const displayUnit = shortUnit ? shortLabel : unit;

  return {
    value: includeUnit ? `${formatted} ${displayUnit}` : formatted,
    unit: displayUnit,
    shortUnit: shortLabel,
    numericValue: formatted,
    originalMeters: meters
  };
}

/**
 * Convert square meters to the current unit system
 * @param {number} squareMeters - Area in square meters
 * @param {object} options - Conversion options
 * @returns {object} Converted area with unit label
 */
export function convertArea(squareMeters, options = {}) {
  const {
    precision = 2,
    system = getUnitSystem(),
    includeUnit = true,
    shortUnit = false
  } = options;

  let value, unit, shortLabel;

  switch (system) {
    case UNIT_SYSTEMS.METRIC:
    case UNIT_SYSTEMS.METRIC_CM:
      // Use cm² for smaller areas
      if (squareMeters < 1) {
        value = squareMeters * 10000;
        unit = 'square centimeters';
        shortLabel = 'cm²';
      } else {
        value = squareMeters;
        unit = 'square meters';
        shortLabel = 'm²';
      }
      break;

    case UNIT_SYSTEMS.METRIC_MM:
      value = squareMeters * 1000000;
      unit = 'square millimeters';
      shortLabel = 'mm²';
      break;

    case UNIT_SYSTEMS.IMPERIAL:
      const sqInches = squareMeters * 1550.0031;
      const sqFeet = sqInches / 144;

      if (sqFeet >= 1) {
        value = sqFeet;
        unit = 'square feet';
        shortLabel = 'sq ft';
      } else {
        value = sqInches;
        unit = 'square inches';
        shortLabel = 'sq in';
      }
      break;

    default:
      value = squareMeters;
      unit = 'square meters';
      shortLabel = 'm²';
  }

  const formatted = parseFloat(value.toFixed(precision));
  const displayUnit = shortUnit ? shortLabel : unit;

  return {
    value: includeUnit ? `${formatted} ${displayUnit}` : formatted,
    unit: displayUnit,
    shortUnit: shortLabel,
    numericValue: formatted,
    originalSquareMeters: squareMeters
  };
}

/**
 * Convert cubic meters to the current unit system
 * @param {number} cubicMeters - Volume in cubic meters
 * @param {object} options - Conversion options
 * @returns {object} Converted volume with unit label
 */
export function convertVolume(cubicMeters, options = {}) {
  const {
    precision = 3,
    system = getUnitSystem(),
    includeUnit = true,
    shortUnit = false
  } = options;

  let value, unit, shortLabel;

  switch (system) {
    case UNIT_SYSTEMS.METRIC:
    case UNIT_SYSTEMS.METRIC_CM:
      // Use cm³ for smaller volumes
      if (cubicMeters < 0.001) {
        value = cubicMeters * 1000000;
        unit = 'cubic centimeters';
        shortLabel = 'cm³';
      } else if (cubicMeters < 1) {
        value = cubicMeters * 1000;
        unit = 'liters';
        shortLabel = 'L';
      } else {
        value = cubicMeters;
        unit = 'cubic meters';
        shortLabel = 'm³';
      }
      break;

    case UNIT_SYSTEMS.METRIC_MM:
      value = cubicMeters * 1000000000;
      unit = 'cubic millimeters';
      shortLabel = 'mm³';
      break;

    case UNIT_SYSTEMS.IMPERIAL:
      const cubicInches = cubicMeters * 61023.7441;
      const cubicFeet = cubicInches / 1728;

      if (cubicFeet >= 1) {
        value = cubicFeet;
        unit = 'cubic feet';
        shortLabel = 'cu ft';
      } else {
        value = cubicInches;
        unit = 'cubic inches';
        shortLabel = 'cu in';
      }
      break;

    default:
      value = cubicMeters;
      unit = 'cubic meters';
      shortLabel = 'm³';
  }

  const formatted = parseFloat(value.toFixed(precision));
  const displayUnit = shortUnit ? shortLabel : unit;

  return {
    value: includeUnit ? `${formatted} ${displayUnit}` : formatted,
    unit: displayUnit,
    shortUnit: shortLabel,
    numericValue: formatted,
    originalCubicMeters: cubicMeters
  };
}

/**
 * Format a measurement with dimensions (W × H)
 * @param {number} width - Width in meters
 * @param {number} height - Height in meters
 * @param {object} options - Formatting options
 * @returns {string} Formatted dimension string
 */
export function formatDimensions(width, height, options = {}) {
  const { precision = 1, system = getUnitSystem() } = options;

  const w = convertLength(width, { precision, system, includeUnit: false });
  const h = convertLength(height, { precision, system, includeUnit: false });

  return `${w.numericValue} × ${h.numericValue} ${w.shortUnit}`;
}

/**
 * Format area with appropriate precision
 * @param {number} width - Width in meters
 * @param {number} height - Height in meters
 * @param {object} options - Formatting options
 * @returns {string} Formatted area string
 */
export function formatArea(width, height, options = {}) {
  const { precision = 2, system = getUnitSystem() } = options;

  const squareMeters = width * height;
  const converted = convertArea(squareMeters, { precision, system, shortUnit: true });

  return converted.value;
}

/**
 * Parse a measurement string back to meters
 * @param {string} measurementStr - Measurement string (e.g., "5.2 ft", "120 cm")
 * @returns {number|null} Value in meters, or null if invalid
 */
export function parseToMeters(measurementStr) {
  if (!measurementStr || typeof measurementStr !== 'string') {
    return null;
  }

  // Extract number and unit
  const match = measurementStr.match(/^([\d.]+)\s*([a-zA-Z'"]+)$/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  // Convert to meters based on unit
  switch (unit) {
    case 'm':
    case 'meter':
    case 'meters':
      return value;

    case 'cm':
    case 'centimeter':
    case 'centimeters':
      return value / 100;

    case 'mm':
    case 'millimeter':
    case 'millimeters':
      return value / 1000;

    case 'ft':
    case "'":
    case 'foot':
    case 'feet':
      return value * 0.3048;

    case 'in':
    case '"':
    case 'inch':
    case 'inches':
      return value * 0.0254;

    default:
      return null;
  }
}

/**
 * Get all available unit systems with labels
 * @returns {array} Array of unit system options
 */
export function getAvailableUnitSystems() {
  return [
    {
      value: UNIT_SYSTEMS.METRIC,
      label: 'Metric (Auto)',
      description: 'Automatically selects m, cm, or mm'
    },
    {
      value: UNIT_SYSTEMS.METRIC_CM,
      label: 'Centimeters',
      description: 'Always show in cm'
    },
    {
      value: UNIT_SYSTEMS.METRIC_MM,
      label: 'Millimeters',
      description: 'Always show in mm'
    },
    {
      value: UNIT_SYSTEMS.IMPERIAL,
      label: 'Imperial (ft/in)',
      description: 'Feet and inches'
    }
  ];
}

/**
 * Validate measurement value
 * @param {number} meters - Value in meters
 * @param {object} constraints - Min/max constraints
 * @returns {object} Validation result
 */
export function validateMeasurement(meters, constraints = {}) {
  const { min = 0, max = 100, type = 'length' } = constraints;

  const errors = [];

  if (meters < min) {
    errors.push(`Measurement too small (min: ${convertLength(min).value})`);
  }

  if (meters > max) {
    errors.push(`Measurement too large (max: ${convertLength(max).value})`);
  }

  if (isNaN(meters) || !isFinite(meters)) {
    errors.push('Invalid measurement value');
  }

  return {
    valid: errors.length === 0,
    errors,
    value: meters
  };
}

// Log initialization
console.log('[Units] Unit conversion system loaded');
