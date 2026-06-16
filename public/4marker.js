A_X = 0;
A_Y = 0;
A_Z = 0;
R_A = 0;
R_B = 0;
R_G = 0;

AFRAME.registerComponent('hybrid-coordinator', {
    init: function () {
        // Target all 4 physical corner markers
        this.m1 = document.querySelector('#m1'); // Top-Left
        this.m2 = document.querySelector('#m2'); // Top-Right
        this.m3 = document.querySelector('#m3'); // Bottom-Left
        this.m4 = document.querySelector('#m4'); // Bottom-Right
        this.cam = document.querySelector('#camera');
        this.world = document.querySelector('#ar-world');
    },
    tick: function (time, timeDelta) {
        let activeMarker = null;

        // Check which corner the camera sees and set the mathematical offset
        let scale = 8;
        let offsetX = scale - 0.5;
        let offsetZ = scale/2 - 0.5;

        if (this.m1.object3D.visible) { 
            activeMarker = this.m1; 
            offsetX = -1 * (offsetX); 
            offsetZ = -1 * (offsetZ); 
        }
        else if (this.m2.object3D.visible) {
            activeMarker = this.m2; 
            offsetZ = -1 *(offsetZ); 
        }
        else if (this.m3.object3D.visible) {
            activeMarker = this.m3; 
            offsetX = -1 * (offsetX); 
        }
        else if (this.m4.object3D.visible) { 
            activeMarker = this.m4;
        }
        try {
            // If any corner is seen, recalculate the center of the world
            if (activeMarker) {
                this.world.setAttribute('visible', 'true');
                let r = activeMarker.object3D.rotation;
                let p = activeMarker.object3D.position;

                let cr = this.cam.object3D.rotation;
                let cp = this.cam.object3D.position;
                this.world.object3D.rotation.copy(r);
                this.world.object3D.position.copy(p);

                document.getElementById("rotation").innerText = `x:${r.x.toFixed(2)} y:${r.y.toFixed(2)} z:${r.z.toFixed(2)}`;
                document.getElementById("position").innerText = `x:${p.x.toFixed(2)} y:${p.y.toFixed(2)} z:${p.z.toFixed(2)}`;
                document.getElementById("c-rot").innerText = `x:${cr.x.toFixed(2)} y:${cr.y.toFixed(2)} z:${cr.z.toFixed(2)}`;
                document.getElementById("c-pos").innerText = `x:${cp.x.toFixed(2)} y:${cp.y.toFixed(2)} z:${cp.z.toFixed(2)}`;

                this.world.object3D.translateX(-offsetX);
                this.world.object3D.translateZ(-offsetZ);
                document.getElementById("tracked").innerText = "Tracking";
            }
            else {
                const posMoved = new THREE.Vector3(A_X * timeDelta, A_Y * timeDelta, A_Z * timeDelta);
                const rotate = new THREE.Vector3(R_A * timeDelta, R_B * timeDelta, R_G * timeDelta);
                this.cam.object3D.rotation.add(rotate);
                this.cam.object3D.position.add(posMoved);
                document.getElementById("tracked").innerText = "Not Tracking";
            }
        }
        catch (e){
            // alert(e);
            console.log(e);
        }
    }
});

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

    A_X = x;
    A_Y = y;
    A_Z = z;

    const alpha = rotationRate.alpha;
    const beta = rotationRate.beta;
    const gamma = rotationRate.gamma;

    R_A = alpha;
    R_B = beta;
    R_G = gamma;

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
