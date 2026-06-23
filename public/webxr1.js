let webxrPolyfill = null;

function getXR(usePolyfill) {
  let tempXR;

  switch (usePolyfill) {
    case "if-needed":
      tempXR = navigator.xr;
      if (!tempXR) {
        webxrPolyfill = new WebXRPolyfill();
        tempXR = webxrPolyfill;
      }
      break;
    case "yes":
      webxrPolyfill = new WebXRPolyfill();
      tempXR = webxrPolyfill;
      break;
    case "no":
    default:
      tempXR = navigator.xr;
      break;
  }

  return tempXR;
}

async function createImmersiveSession(xr) {
  session = await xr.requestSession("immersive-vr");
  return session;
}

async function runSession(session) {
  session.addEventListener("end", onSessionEnd);

  const canvas = document.querySelector("canvas");
  const gl = canvas.getContext("webgl", { xrCompatible: true });

  // Set up WebGL data and such

  const worldData = loadGLPrograms(session, "world-data.xml");
  if (!worldData) {
    return null;
  }

  // Finish configuring WebGL

  worldData.session.updateRenderState({
    baseLayer: new XRWebGLLayer(worldData.session, gl),
  });

  // Start rendering the scene

  referenceSpace = await worldData.session.requestReferenceSpace("unbounded");
  worldData.referenceSpace = referenceSpace.getOffsetReferenceSpace(
    new XRRigidTransform(
      worldData.playerSpawnPosition,
      worldData.playerSpawnOrientation,
    ),
  );
  worldData.animationFrameRequestID =
    worldData.session.requestAnimationFrame(onDrawFrame);

  return worldData;
}

async function init(){
    console.log("Webxr1.js script is working");
    const xr = getXR("if-needed");
    let a;
    if (webxrPolyfill) {
        a = "WebXR is supported with polyfill";
    }
    else if (xr) {
        a = "WebXR is supported natively";
    }
    else {
        a = "WebXR is not supported";
    }
    document.getElementById("status").textContent = a;
    console.log(a);

    const immersiveOK = await xr.isSessionSupported("immersive-ar");
    let session;
    if (immersiveOK) {
        a = "Immersive AR is supported";
        try {
            session = await createImmersiveSession(xr);
        }
        catch (e) {
            console.error("Error creating Immersive AR session:", e);
        }
        runSession(session);
        console.log("Immersive AR session created");
        document.getElementById("immersive-ar-session").textContent = "Immersive AR session created successfully";
    }
    else {
        a = "Immersive AR is not supported";
        document.getElementById("immersive-ar-session").textContent = "Immersive AR session is not supported";
    }
    document.getElementById("immersive-ar-status").textContent = a;
    console.log(a);
}

init();