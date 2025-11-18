/**
 * Export System
 * Comprehensive data export in multiple formats
 * Supports JSON, CSV, and PDF with professional formatting
 */

import jsPDF from 'jspdf';
import { convertLength, convertArea, getUnitSystem } from '../../utils/units.js';

/**
 * Export Manager Component
 * Handles exporting measurement data in various formats
 */
AFRAME.registerComponent('export-manager', {
  schema: {
    includeMetadata: { type: 'boolean', default: true },
    includeImages: { type: 'boolean', default: false }, // For PDF
    pdfOrientation: { type: 'string', default: 'portrait' }, // 'portrait' or 'landscape'
    pdfFormat: { type: 'string', default: 'a4' }
  },

  init: function() {
    console.log('[Export Manager] Initialized');

    // Listen for export requests
    this.setupEventListeners();
  },

  setupEventListeners: function() {
    // Listen for export events
    this.el.sceneEl.addEventListener('export-json', this.exportJSON.bind(this));
    this.el.sceneEl.addEventListener('export-csv', this.exportCSV.bind(this));
    this.el.sceneEl.addEventListener('export-pdf', this.exportPDF.bind(this));
    this.el.sceneEl.addEventListener('export-all', this.exportAll.bind(this));
  },

  /**
   * Get project data for export
   */
  getProjectData: function() {
    // Get storage manager
    const storageManager = document.querySelector('[storage-manager]');

    if (storageManager) {
      const component = storageManager.components['storage-manager'];
      return component.gatherProjectData();
    }

    // Fallback: gather data directly
    const objectDefComponent = document.querySelector('[object-definition]');
    const objects = objectDefComponent ?
      objectDefComponent.components['object-definition'].objects : [];

    return {
      version: '1.0.0',
      projectName: 'O3Measure Export',
      exportedAt: new Date().toISOString(),
      objects: objects,
      settings: {
        unitSystem: getUnitSystem()
      }
    };
  },

  /**
   * Export as JSON
   */
  exportJSON: function(evt) {
    try {
      const projectData = this.getProjectData();

      // Pretty print JSON
      const jsonString = JSON.stringify(projectData, null, 2);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${projectData.projectName}_${timestamp}.json`;

      // Download
      this.downloadFile(jsonString, filename, 'application/json');

      console.log('[Export Manager] ✓ Exported as JSON');

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Exported as JSON', 'success');
      }

      // Emit completion event
      this.el.emit('export-complete', { format: 'json', filename: filename });

    } catch (error) {
      console.error('[Export Manager] JSON export failed:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('JSON export failed', 'error');
      }
    }
  },

  /**
   * Export as CSV
   */
  exportCSV: function(evt) {
    try {
      const projectData = this.getProjectData();
      const unitSystem = projectData.settings.unitSystem;

      // CSV Headers
      const headers = [
        'Object ID',
        'Type',
        'Width',
        'Height',
        'Area',
        'Unit System',
        'Created At',
        'Position X',
        'Position Y',
        'Position Z'
      ];

      const rows = [headers];

      // Add data rows
      projectData.objects.forEach(obj => {
        // Convert measurements
        const width = obj.width ? convertLength(obj.width, { system: unitSystem }) : null;
        const height = obj.height ? convertLength(obj.height, { system: unitSystem }) : null;
        const area = (obj.width && obj.height) ?
          convertArea(obj.width * obj.height, { system: unitSystem }) : null;

        rows.push([
          obj.id || '',
          obj.type || '',
          width ? width.value : '',
          height ? height.value : '',
          area ? area.value : '',
          unitSystem,
          obj.createdAt || '',
          obj.center?.x?.toFixed(3) || '',
          obj.center?.y?.toFixed(3) || '',
          obj.center?.z?.toFixed(3) || ''
        ]);
      });

      // Convert to CSV string
      const csvString = rows.map(row =>
        row.map(cell => this.escapeCSVCell(cell)).join(',')
      ).join('\n');

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${projectData.projectName}_${timestamp}.csv`;

      // Download
      this.downloadFile(csvString, filename, 'text/csv');

      console.log('[Export Manager] ✓ Exported as CSV');

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Exported as CSV', 'success');
      }

      // Emit completion event
      this.el.emit('export-complete', { format: 'csv', filename: filename });

    } catch (error) {
      console.error('[Export Manager] CSV export failed:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('CSV export failed', 'error');
      }
    }
  },

  /**
   * Export as PDF
   */
  exportPDF: async function(evt) {
    try {
      const projectData = this.getProjectData();
      const unitSystem = projectData.settings.unitSystem;

      // Create PDF document
      const doc = new jsPDF({
        orientation: this.data.pdfOrientation,
        unit: 'mm',
        format: this.data.pdfFormat
      });

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('O3Measure Report', margin, yPosition);
      yPosition += 12;

      // Project info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${projectData.projectName}`, margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Unit System: ${unitSystem}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total Objects: ${projectData.objects.length}`, margin, yPosition);
      yPosition += 15;

      // Reset color
      doc.setTextColor(0);

      // Objects table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Measurements', margin, yPosition);
      yPosition += 10;

      // Table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const colWidths = [15, 25, 25, 30];
      const headers = ['#', 'Width', 'Height', 'Area'];

      let xPosition = margin;
      headers.forEach((header, i) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[i];
      });

      yPosition += 7;

      // Horizontal line
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Table rows
      doc.setFont('helvetica', 'normal');

      projectData.objects.forEach((obj, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }

        // Convert measurements
        const width = obj.width ? convertLength(obj.width, { system: unitSystem, shortUnit: true }) : null;
        const height = obj.height ? convertLength(obj.height, { system: unitSystem, shortUnit: true }) : null;
        const area = (obj.width && obj.height) ?
          convertArea(obj.width * obj.height, { system: unitSystem, shortUnit: true }) : null;

        const rowData = [
          (index + 1).toString(),
          width ? width.value : '-',
          height ? height.value : '-',
          area ? area.value : '-'
        ];

        xPosition = margin;
        rowData.forEach((cell, i) => {
          doc.text(cell, xPosition, yPosition);
          xPosition += colWidths[i];
        });

        yPosition += 7;
      });

      // Summary section
      yPosition += 10;

      if (yPosition > pageHeight - margin - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Summary', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Calculate totals
      const totalArea = projectData.objects.reduce((sum, obj) => {
        return sum + (obj.width && obj.height ? obj.width * obj.height : 0);
      }, 0);

      const convertedTotalArea = convertArea(totalArea, { system: unitSystem, shortUnit: true });

      doc.text(`Total Measured Area: ${convertedTotalArea.value}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Number of Objects: ${projectData.objects.length}`, margin, yPosition);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Generated by O3Measure - AR Measuring Tool', margin, pageHeight - 10);

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${projectData.projectName}_${timestamp}.pdf`;

      // Save PDF
      doc.save(filename);

      console.log('[Export Manager] ✓ Exported as PDF');

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('Exported as PDF', 'success');
      }

      // Emit completion event
      this.el.emit('export-complete', { format: 'pdf', filename: filename });

    } catch (error) {
      console.error('[Export Manager] PDF export failed:', error);

      if (window.uiEnhancement) {
        window.uiEnhancement.notify('PDF export failed', 'error');
      }
    }
  },

  /**
   * Export all formats
   */
  exportAll: function() {
    this.exportJSON();
    this.exportCSV();
    this.exportPDF();
  },

  /**
   * Escape CSV cell content
   */
  escapeCSVCell: function(cell) {
    if (cell == null) return '';

    const str = cell.toString();

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  },

  /**
   * Download file helper
   */
  downloadFile: function(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
});

/**
 * Export Button Component
 * UI component for triggering exports
 */
AFRAME.registerComponent('export-button', {
  schema: {
    format: { type: 'string', default: 'json' }, // 'json', 'csv', 'pdf', 'all'
    label: { type: 'string', default: 'Export' },
    position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } }
  },

  init: function() {
    this.createButton();
  },

  createButton: function() {
    // Create spatial button
    this.el.setAttribute('spatial-button', {
      label: this.data.label,
      width: 0.2,
      height: 0.05,
      fontSize: 0.03,
      color: '#F59E0B',
      hoverColor: '#FBBF24',
      haptics: true
    });

    this.el.setAttribute('position', this.data.position);

    // Handle click
    this.el.addEventListener('spatial-button-click', () => {
      this.handleExport();
    });
  },

  handleExport: function() {
    const format = this.data.format.toLowerCase();
    const eventName = format === 'all' ? 'export-all' : `export-${format}`;

    console.log(`[Export Button] Triggering ${format} export`);

    // Emit export event
    this.el.sceneEl.emit(eventName);

    // Haptic feedback
    if (window.haptics) {
      window.haptics.success('both');
    }
  }
});

console.log('[Export System] Multi-format export system loaded (JSON, CSV, PDF)');
