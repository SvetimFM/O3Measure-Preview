/**
 * Save/Load System
 * Comprehensive data persistence for measurements and objects
 * Supports localStorage, IndexedDB, and cloud sync (ready)
 */

/**
 * Storage Manager Component
 * Manages saving and loading of measurement data
 */
AFRAME.registerComponent('storage-manager', {
  schema: {
    autoSave: { type: 'boolean', default: true },
    autoSaveInterval: { type: 'number', default: 30000 }, // 30 seconds
    useIndexedDB: { type: 'boolean', default: true },
    cloudSync: { type: 'boolean', default: false }, // Future: cloud sync
    projectName: { type: 'string', default: 'O3Measure Project' }
  },

  init: function() {
    this.storage = new DataStorage(this.data.useIndexedDB);
    this.autoSaveTimer = null;
    this.isDirty = false; // Has unsaved changes

    // Get scene state system
    this.sceneState = this.el.sceneEl.systems['scene-state'];

    // Bind event handlers
    this.onObjectCreated = this.markDirty.bind(this);
    this.onObjectDeleted = this.markDirty.bind(this);
    this.onObjectModified = this.markDirty.bind(this);

    // Listen for data changes
    this.setupEventListeners();

    // Start auto-save if enabled
    if (this.data.autoSave) {
      this.startAutoSave();
    }

    // Load existing project on init
    this.loadProject();

    console.log('[Storage Manager] Initialized');
  },

  setupEventListeners: function() {
    // Listen for object changes
    this.el.sceneEl.addEventListener('object-created', this.onObjectCreated);
    this.el.sceneEl.addEventListener('object-deleted', this.onObjectDeleted);
    this.el.sceneEl.addEventListener('object-modified', this.onObjectModified);

    // Listen for manual save requests
    this.el.sceneEl.addEventListener('save-project', this.saveProject.bind(this));
    this.el.sceneEl.addEventListener('load-project', this.loadProject.bind(this));
    this.el.sceneEl.addEventListener('export-project', this.exportProject.bind(this));
  },

  markDirty: function() {
    this.isDirty = true;
  },

  startAutoSave: function() {
    this.autoSaveTimer = setInterval(() => {
      if (this.isDirty) {
        console.log('[Storage Manager] Auto-saving...');
        this.saveProject();
      }
    }, this.data.autoSaveInterval);

    console.log(`[Storage Manager] Auto-save enabled (${this.data.autoSaveInterval / 1000}s interval)`);
  },

  stopAutoSave: function() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  },

  /**
   * Save current project to storage
   */
  saveProject: async function() {
    try {
      // Gather all project data
      const projectData = this.gatherProjectData();

      // Save to storage
      await this.storage.saveProject(this.data.projectName, projectData);

      this.isDirty = false;

      console.log('[Storage Manager] ✓ Project saved');

      // Emit event
      this.el.emit('project-saved', { projectName: this.data.projectName });

      // Show notification
      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Project saved successfully', 'success');
      }

      return true;

    } catch (error) {
      console.error('[Storage Manager] Failed to save project:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Failed to save project', 'error');
      }

      return false;
    }
  },

  /**
   * Load project from storage
   */
  loadProject: async function(projectName = null) {
    try {
      const name = projectName || this.data.projectName;

      // Load from storage
      const projectData = await this.storage.loadProject(name);

      if (!projectData) {
        console.log('[Storage Manager] No saved project found');
        return null;
      }

      // Restore project data
      this.restoreProjectData(projectData);

      console.log('[Storage Manager] ✓ Project loaded');

      // Emit event
      this.el.emit('project-loaded', { projectName: name, data: projectData });

      // Show notification
      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Project loaded successfully', 'success');
      }

      return projectData;

    } catch (error) {
      console.error('[Storage Manager] Failed to load project:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Failed to load project', 'error');
      }

      return null;
    }
  },

  /**
   * Gather all project data for saving
   */
  gatherProjectData: function() {
    // Get objects from object-definition component
    const objectDefComponent = document.querySelector('[object-definition]');
    const objects = objectDefComponent ?
      objectDefComponent.components['object-definition'].objects : [];

    // Get current settings
    const settings = {
      unitSystem: localStorage.getItem('o3measure_unit_system') || 'metric',
      gridEnabled: false, // TODO: Get from grid component
      showDimensions: true
    };

    // Get anchor data
    const anchorManager = document.querySelector('[anchor-manager]');
    const anchoredObjects = anchorManager ?
      anchorManager.components['anchor-manager'].getAnchoredObjects() : [];

    return {
      version: '1.0.0',
      projectName: this.data.projectName,
      createdAt: localStorage.getItem('o3measure_project_created') || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      objects: objects,
      settings: settings,
      anchors: anchoredObjects,
      metadata: {
        objectCount: objects.length,
        anchorCount: anchoredObjects.length
      }
    };
  },

  /**
   * Restore project data after loading
   */
  restoreProjectData: function(projectData) {
    if (!projectData) return;

    // Restore settings
    if (projectData.settings) {
      if (projectData.settings.unitSystem) {
        localStorage.setItem('o3measure_unit_system', projectData.settings.unitSystem);
        window.dispatchEvent(new CustomEvent('unit-system-changed', {
          detail: { system: projectData.settings.unitSystem }
        }));
      }
    }

    // Restore objects
    if (projectData.objects && projectData.objects.length > 0) {
      const objectDefComponent = document.querySelector('[object-definition]');

      if (objectDefComponent) {
        const component = objectDefComponent.components['object-definition'];

        // Clear existing objects
        component.objects = [];

        // Restore each object
        projectData.objects.forEach(objectData => {
          this.restoreObject(objectData);
        });

        console.log(`[Storage Manager] ✓ Restored ${projectData.objects.length} objects`);
      }
    }

    // Store project creation date
    if (projectData.createdAt) {
      localStorage.setItem('o3measure_project_created', projectData.createdAt);
    }
  },

  /**
   * Restore a single object from saved data
   */
  restoreObject: function(objectData) {
    // TODO: This requires recreating the visual representation
    // For now, just log it - full implementation would recreate the geometry

    console.log('[Storage Manager] Restoring object:', objectData.id);

    // Emit event for object restoration
    this.el.sceneEl.emit('object-restore-requested', { object: objectData });
  },

  /**
   * Export project as JSON file
   */
  exportProject: async function(evt) {
    const format = evt.detail?.format || 'json';

    try {
      const projectData = this.gatherProjectData();

      let exportData, filename, mimeType;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(projectData, null, 2);
          filename = `${this.data.projectName}.json`;
          mimeType = 'application/json';
          break;

        case 'csv':
          exportData = this.convertToCSV(projectData);
          filename = `${this.data.projectName}.csv`;
          mimeType = 'text/csv';
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Create download
      this.downloadFile(exportData, filename, mimeType);

      console.log(`[Storage Manager] ✓ Exported project as ${format.toUpperCase()}`);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify(`Project exported as ${format.toUpperCase()}`, 'success');
      }

    } catch (error) {
      console.error('[Storage Manager] Export failed:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Export failed', 'error');
      }
    }
  },

  /**
   * Convert project data to CSV format
   */
  convertToCSV: function(projectData) {
    const headers = ['ID', 'Type', 'Width (m)', 'Height (m)', 'Area (m²)', 'Created At'];
    const rows = [headers];

    projectData.objects.forEach(obj => {
      rows.push([
        obj.id,
        obj.type,
        obj.width?.toFixed(3) || '',
        obj.height?.toFixed(3) || '',
        (obj.width && obj.height ? (obj.width * obj.height).toFixed(3) : ''),
        obj.createdAt
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  },

  /**
   * Download file to user's device
   */
  downloadFile: function(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },

  /**
   * List all saved projects
   */
  listProjects: async function() {
    return await this.storage.listProjects();
  },

  /**
   * Delete a project
   */
  deleteProject: async function(projectName) {
    try {
      await this.storage.deleteProject(projectName);

      console.log(`[Storage Manager] ✓ Deleted project: ${projectName}`);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Project deleted', 'success');
      }

      return true;

    } catch (error) {
      console.error('[Storage Manager] Failed to delete project:', error);
      return false;
    }
  },

  remove: function() {
    this.stopAutoSave();

    // Remove event listeners
    this.el.sceneEl.removeEventListener('object-created', this.onObjectCreated);
    this.el.sceneEl.removeEventListener('object-deleted', this.onObjectDeleted);
    this.el.sceneEl.removeEventListener('object-modified', this.onObjectModified);
  }
});

/**
 * Data Storage Class
 * Handles localStorage and IndexedDB operations
 */
class DataStorage {
  constructor(useIndexedDB = true) {
    this.useIndexedDB = useIndexedDB;
    this.dbName = 'O3MeasureDB';
    this.dbVersion = 1;
    this.db = null;

    if (this.useIndexedDB) {
      this.initIndexedDB();
    }
  }

  /**
   * Initialize IndexedDB
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[DataStorage] IndexedDB error:', request.error);
        this.useIndexedDB = false; // Fallback to localStorage
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[DataStorage] ✓ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for projects
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'projectName' });
        }

        console.log('[DataStorage] IndexedDB schema created');
      };
    });
  }

  /**
   * Save project to storage
   */
  async saveProject(projectName, projectData) {
    if (this.useIndexedDB && this.db) {
      return this.saveToIndexedDB(projectName, projectData);
    } else {
      return this.saveToLocalStorage(projectName, projectData);
    }
  }

  /**
   * Load project from storage
   */
  async loadProject(projectName) {
    if (this.useIndexedDB && this.db) {
      return this.loadFromIndexedDB(projectName);
    } else {
      return this.loadFromLocalStorage(projectName);
    }
  }

  /**
   * Save to IndexedDB
   */
  async saveToIndexedDB(projectName, projectData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');

      const data = { ...projectData, projectName: projectName };
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load from IndexedDB
   */
  async loadFromIndexedDB(projectName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(projectName);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save to localStorage
   */
  saveToLocalStorage(projectName, projectData) {
    const key = `o3measure_project_${projectName}`;
    localStorage.setItem(key, JSON.stringify(projectData));
    return Promise.resolve();
  }

  /**
   * Load from localStorage
   */
  loadFromLocalStorage(projectName) {
    const key = `o3measure_project_${projectName}`;
    const data = localStorage.getItem(key);
    return Promise.resolve(data ? JSON.parse(data) : null);
  }

  /**
   * List all projects
   */
  async listProjects() {
    if (this.useIndexedDB && this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const request = store.getAllKeys();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      // List from localStorage
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('o3measure_project_'))
        .map(key => key.replace('o3measure_project_', ''));

      return Promise.resolve(keys);
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectName) {
    if (this.useIndexedDB && this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        const request = store.delete(projectName);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } else {
      const key = `o3measure_project_${projectName}`;
      localStorage.removeItem(key);
      return Promise.resolve();
    }
  }
}

console.log('[Save/Load System] Comprehensive persistence system loaded');
