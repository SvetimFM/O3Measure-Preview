/**
 * Menu Registry Module
 * 
 * Central registry for all menu modules in the application
 * Allows menu components to register themselves and be discovered by the menu manager
 */

// Menu registry singleton
const MenuRegistry = {
  // Menu definitions keyed by menu ID
  menus: {},
  
  // Register a menu definition
  register: function(menuId, menuDefinition) {
    if (this.menus[menuId]) {
      console.warn(`Menu Registry: Menu '${menuId}' already registered, overwriting`);
    }
    
    this.menus[menuId] = menuDefinition;
    console.log(`Menu Registry: Registered menu '${menuId}'`);
  },
  
  // Get a specific menu by ID
  getMenu: function(menuId) {
    return this.menus[menuId] || null;
  },
  
  // Get all registered menu IDs
  getMenuIds: function() {
    return Object.keys(this.menus);
  },
  
  // Check if a menu ID is registered
  hasMenu: function(menuId) {
    return !!this.menus[menuId];
  }
};

// Export the registry singleton
export default MenuRegistry;