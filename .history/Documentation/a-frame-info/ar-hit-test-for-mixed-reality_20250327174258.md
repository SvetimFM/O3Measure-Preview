This component uses the WebXR hit-test API to position virtual objects in the real world. Remember to request the hit-test optional feature to allow it work.

You add it to the scene element and then when the user is in Augmented Reality if they tap on the screen or select with a controller it will work out where the user is pointing to in the real world and place a reticle there and fire events.

If you have set a target property to be an element it will automatically make the reticle to be the same size as the footprint of the target and then when the user selects the object will be telepoted there. It will also set the visible state of the object to true so you can hide the object until the user has placed it for the first time. The hide-on-enter-ar component is useful for that.

You can toggle this component’s enabled state to not do any interactions until you are ready.

Example
<a-scene webxr="optionalFeatures:  hit-test;" ar-hit-test="target:#myobject;">
	<a-entity id="myobject"></a-entity>
Properties
Property	Description	Default Value
target	The object to move around.	null
enabled	Whether to do hit-testing or not	true
src	Image to use for the reticle	See: Assets
type	‘footprint’ or ‘map’ footprint is the shape of the model	“footprint”
footprintDepth	Amount of the model used for the footprint, 1 is full height	0.1
mapSize	If no target is set then this is the size of the map	0.5 0.5
Even