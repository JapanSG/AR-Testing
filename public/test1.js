function handleOrientation(event) {
    const absolute = event.absolute;
    const alpha = Math.round(event.alpha);
    const beta = Math.round(event.beta);
    const gamma = Math.round(event.gamma);

    const pairs = [
        ["absolute", absolute],
        ["alpha", alpha],
        ["beta", beta],
        ["gamma", gamma]
    ]

    pairs.forEach(([id, val]) => {
        document.getElementById(id).innerText = val;
    })
}

function handleMotion(event) {
    const rotationRate = event.rotationRate;
    const interval = event.interval;


    const x = event.acceleration.x;
    const y = event.acceleration.y;
    const z = event.acceleration.z;

    const alpha = rotationRate.alpha;
    const beta = rotationRate.beta;
    const gamma = rotationRate.gamma;

    document.getElementById("acceleration").innerText = `x:${x.toFixed(2)}, y:${y.toFixed(2)}, z:${z.toFixed(2)}`;
    document.getElementById("rotation-rate").innerText = `alpha:${alpha.toFixed(2)}, beta:${beta.toFixed(2)}, gamma:${gamma.toFixed(2)}`;
    document.getElementById("interval").innerText = interval;
    

}

function handleClick() {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
        // The API requires permission — request it
        Promise.all([
            DeviceMotionEvent.requestPermission(),
            DeviceOrientationEvent.requestPermission(),
        ]).then(([motionPermission, orientationPermission]) => {
            if (
                motionPermission === "granted" &&
                orientationPermission === "granted"
            ) {
                window.addEventListener("devicemotion", handleMotion);
                window.addEventListener("deviceorientation", handleOrientation);
            }
        });
    } else {
        // No permission needed, add event listeners directly
        window.addEventListener("devicemotion", handleMotion);
        window.addEventListener("deviceorientation", handleOrientation);
    }
}

function init() {
    document.getElementById("request-permissions").addEventListener("click", handleClick);
    document.getElementById("hide-overlay").addEventListener("click", () => {
        document.getElementById("vals").hidden = !document.getElementById("vals").hidden;
    });
}

init();
