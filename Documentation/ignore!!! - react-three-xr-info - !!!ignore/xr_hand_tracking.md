Custom Hands/Controllers/...
Customize interactions and style of inputs such as hands, controllers, and more

@react-three/xr provides a set of default hands, controllers, transient pointers, gazes, and screen input that can be configured and completely exchanged with your own implementation. The following example shows how to configure the ray color of the ray pointer in the users hand.

const store = createXRStore({ hand: { rayPointer: { rayModel: { color: 'red' } } } })

In some cases, the default hand/controller/... implementations are not enough. The following code sample shows how to provide your own custom hand implementation though the xr store options.

const store = createXRStore({ hand: CustomHand })

Custom Hand
Let's build our own hand implementation which renders the normal hand model but only has a touch interaction which works using the middle finger.

First we're getting the state of the hand, creating a reference to the position of the middle finger, and creating a touch pointer.

const state = useXRInputSourceStateContext('hand')
const middleFingerRef = useRef<Object3D>(null)
const pointer = useTouchPointer(middleFingerRef, state)

Next, we use the state to place an XRSpace for setting up the middleFingerRef and add an XRHandModel and PointerCursorModel to render the hand and a cursor visualization.

<XRSpace ref={middleFingerRef} space={state.inputSource.hand.get('middle-finger-tip')!}/>
<Suspense>
  <XRHandModel />
</Suspense>
<PointerCursorModel pointer={pointer} opacity={defaultTouchPointerOpacity} />

Full Code
This tutorial also applies to building custom controllers, transient pointers, gaze, and screen input implementations.