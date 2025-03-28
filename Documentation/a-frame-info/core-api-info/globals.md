A-Frame exposes its public interface through the window.AFRAME browser global. This same interface is also exposed when you import aframe (import AFRAME from 'aframe').

AFRAME Properties
Property	Description
AComponent	Component prototype.
AEntity	Entity prototype.
ANode	Base node prototype that A-Frame elements inherit from.
AScene	Scene prototype.
components	Object of registered components.
geometries	Object of registered geometries .
primitives.primitives	Object of registered primitives.
registerComponent	Function to register a component.
registerGeometry	Function to register a geometry.
registerPrimitive	Function to register a primitive like registering an A-Frame elements similar to <a-box>.
registerShader	Function to register a material or shader.
schema	Schema-related utilities.
shaders	Object of registered shaders.
systems	Object of registered systems.
THREE	Global three.js object.
utils	A-Frame utility modules.
version	Version of A-Frame build.
window Properties
Property	Description
AFRAME	The object described above.
Requiring AFRAME in a Node.js Environment
It is possible to run A-Frame in Node.js to get access to its globals. The only catch is we need to supply a browser window mock since Node.js lacks a window object. You can do that with jsdom-global, and you also need to mock customElements.

const cleanup = require('jsdom-global')();
global.customElements = { define: function () {} };
const aframe = require('aframe');
console.log(aframe.version);
cleanup();
You can’t use jsdom to run tests with aframe components because customElements api is missing. A-Frame is using karma to open a real browser to run the tests.