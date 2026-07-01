import * as THREE from 'three';
let A_X = 0;
let A_Y = 0;
let A_Z = 0;
let R_A = 0;
let R_B = 0;
let R_G = 0;

const NODE_GPS_COORDINATES = []; //add your GPS coordinates here, e.g., {lat: 37.7749, lon: -122.4194 }
const WORLD_CORNERS = { //add your GPS coordinates for the 4 corners of the world here, e.g., { lat: 37.7749, lon: -122.4194 }
    topLeft: { lat: 0, lon: 0 },
    topRight: { lat: 0, lon: 0 },
    bottomLeft: { lat: 0, lon: 0 },
    bottomRight: { lat: 0, lon: 0 }
};
const BUS_CONFIGS = [ //add your bus configurations here, e.g., { id: 'bus-1', apiUrl: 'https://api.example.com/bus-1', color: '#ff3b30' }
    { id: 'bus-1', apiUrl: '', color: '#ff3b30' }
];
const WORLD_DIMENSIONS = { width: 16, depth: 8 };
const nodeEntities = [];
const busEntities = [];

function getWorldBounds() {
    const latValues = [
        WORLD_CORNERS.topLeft.lat,
        WORLD_CORNERS.topRight.lat,
        WORLD_CORNERS.bottomLeft.lat,
        WORLD_CORNERS.bottomRight.lat
    ].filter(Number.isFinite);

    const lonValues = [
        WORLD_CORNERS.topLeft.lon,
        WORLD_CORNERS.topRight.lon,
        WORLD_CORNERS.bottomLeft.lon,
        WORLD_CORNERS.bottomRight.lon
    ].filter(Number.isFinite);

    if (!latValues.length || !lonValues.length) {
        return null;
    }

    return {
        minLat: Math.min(...latValues),
        maxLat: Math.max(...latValues),
        minLon: Math.min(...lonValues),
        maxLon: Math.max(...lonValues)
    };
}

function buildNodes() {
    const world = document.querySelector('#ar-world');
    if (!world) {
        return;
    }

    nodeEntities.length = 0;
    busEntities.length = 0;
    world.innerHTML = '';

    const bounds = getWorldBounds();
    const validNodes = NODE_GPS_COORDINATES.filter((node) => Number.isFinite(node.lat) && Number.isFinite(node.lon));

    if (!bounds || !validNodes.length) {
        console.warn('Add GPS node coordinates and corner values to generate node markers.');
        createBusEntities();
        return;
    }

    validNodes.forEach((node, index) => {
        const normalizedX = (node.lon - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1);
        const normalizedZ = (bounds.maxLat - node.lat) / (bounds.maxLat - bounds.minLat || 1);
        const worldX = (normalizedX * WORLD_DIMENSIONS.width) - (WORLD_DIMENSIONS.width / 2);
        const worldZ = (normalizedZ * WORLD_DIMENSIONS.depth) - (WORLD_DIMENSIONS.depth / 2);

        const entity = document.createElement('a-entity');
        const nodeId = node.id || `node-${index + 1}`;
        entity.setAttribute('class', 'bus-node');
        entity.setAttribute('data-node-id', nodeId);
        entity.setAttribute('position', `${worldX.toFixed(2)} 0 ${worldZ.toFixed(2)}`);
        entity.setAttribute('geometry', {
            primitive: 'box',
            width: 0.35,
            height: 0.15,
            depth: 0.35
        });
        entity.setAttribute('material', {
            color: '#1e88e5',
            opacity: 0.85
        });

        world.appendChild(entity);

        nodeEntities.push({
            id: nodeId,
            lat: node.lat,
            lon: node.lon,
            x: worldX,
            z: worldZ,
            element: entity
        });
    });

    createBusEntities();
}

function createBusEntities() {
    const world = document.querySelector('#ar-world');
    if (!world) {
        return;
    }

    BUS_CONFIGS.forEach((busConfig, index) => {
        const bus = document.createElement('a-entity');
        const busId = busConfig.id || `bus-${index + 1}`;
        bus.setAttribute('id', busId);
        bus.setAttribute('class', 'bus');
        bus.setAttribute('geometry', {
            primitive: 'box',
            width: 0.6,
            height: 0.4,
            depth: 0.3
        });
        bus.setAttribute('material', {
            color: busConfig.color || '#ff5722',
            opacity: 0.9
        });
        bus.setAttribute('position', '0 0.2 0');

        world.appendChild(bus);

        busEntities.push({
            id: busId,
            apiUrl: busConfig.apiUrl,
            color: busConfig.color || '#ff5722',
            element: bus,
            currentNodeId: null
        });
    });

    initializeBusPositions();
}

function initializeBusPositions() {
    if (!nodeEntities.length) {
        busEntities.forEach((bus) => {
            bus.element.setAttribute('position', '0 0.2 0');
        });
        return;
    }

    const firstNode = nodeEntities[0];
    busEntities.forEach((bus) => {
        bus.element.setAttribute('position', `${firstNode.x.toFixed(2)} 0.2 ${firstNode.z.toFixed(2)}`);
        bus.currentNodeId = firstNode.id;
    });
}

function findNearestNode(lat, lon) {
    if (!nodeEntities.length) {
        return null;
    }

    const nearest = nodeEntities.reduce((currentBest, node) => {
        const distance = Math.hypot(node.lat - lat, node.lon - lon);
        if (!currentBest || distance < currentBest.distance) {
            return { node, distance };
        }
        return currentBest;
    }, null);

    return nearest ? nearest.node : null;
}

function moveBusToNode(bus, targetNode) {
    if (!bus || !targetNode || bus.currentNodeId === targetNode.id) {
        return;
    }

    bus.element.setAttribute('animation', {
        property: 'position',
        to: `${targetNode.x.toFixed(2)} 0.2 ${targetNode.z.toFixed(2)}`,
        dur: 900,
        easing: 'linear'
    });

    bus.currentNodeId = targetNode.id;
}

function updateBusFromPayload(bus, payload) {
    if (!payload) {
        return;
    }

    const lat = Number(payload.lat ?? payload.latitude);
    const lon = Number(payload.lon ?? payload.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        console.warn(`Invalid bus payload for ${bus.id}`, payload);
        return;
    }

    const closestNode = findNearestNode(lat, lon);
    if (closestNode) {
        moveBusToNode(bus, closestNode);
    }
}

function fetchBusPositions() {
    busEntities.forEach((bus) => {
        if (!bus.apiUrl) {
            return;
        }

        fetch(bus.apiUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then((payload) => updateBusFromPayload(bus, payload))
            .catch((error) => {
                console.warn(`Unable to fetch bus from ${bus.apiUrl}`, error);
            });
    });
}

AFRAME.registerComponent('hybrid-coordinator', {
    init: function () {
        // Target all 4 physical corner markers
        this.m1 = document.querySelector('#m1'); // Top-Left
        this.m2 = document.querySelector('#m2'); // Top-Right
        this.m3 = document.querySelector('#m3'); // Bottom-Left
        this.m4 = document.querySelector('#m4'); // Bottom-Right
        this.cam = document.querySelector('#camera');
        this.world = document.querySelector('#ar-world');
        buildNodes();
    },
    tick: function (time, timeDelta) {
        let activeMarker = null;

        // Check which corner the camera sees and set the mathematical offset
        let scale = 8;
        let offsetX = scale - 0.5;
        let offsetZ = scale / 2 - 0.5;

        if (this.m1.object3D.visible) {
            activeMarker = this.m1;
            offsetX = -1 * (offsetX);
            offsetZ = -1 * (offsetZ);
        }
        else if (this.m2.object3D.visible) {
            activeMarker = this.m2;
            offsetZ = -1 * (offsetZ);
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
                let r = activeMarker.object3D.rotation;
                let p = activeMarker.object3D.position;

                this.world.object3D.rotation.copy(r);
                this.world.object3D.position.copy(p);

                document.getElementById("rotation").innerText = `x:${r.x.toFixed(2)} y:${r.y.toFixed(2)} z:${r.z.toFixed(2)}`;
                document.getElementById("position").innerText = `x:${p.x.toFixed(2)} y:${p.y.toFixed(2)} z:${p.z.toFixed(2)}`;

                // this.world.object3D.translateX(-offsetX);
                this.world.object3D.translateZ(-offsetZ);
                this.world.object3D.rotateX(THREE.MathUtils.degToRad(document.getElementById("rotate-x").value));
                this.world.object3D.rotateY(THREE.MathUtils.degToRad(document.getElementById("rotate-y").value));
                this.world.object3D.rotateZ(THREE.MathUtils.degToRad(document.getElementById("rotate-z").value));
                document.getElementById("tracked").innerText = "Tracking";
                this.world.setAttribute('visible', 'true');
            }
        }
        catch (e) {
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
    ];

    pairs.forEach(([id, val]) => {
        document.getElementById(id).innerText = val;
    });
}

function handleMotion(event) {
    const acceleration = event.acceleration || { x: 0, y: 0, z: 0 };
    const rotationRate = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
    const interval = event.interval;

    const x = acceleration.x;
    const y = acceleration.y;
    const z = acceleration.z;

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

function updateRotationValues() {
    const rotateX = document.getElementById("rotate-x").value;
    const rotateY = document.getElementById("rotate-y").value;
    const rotateZ = document.getElementById("rotate-z").value;

    document.getElementById("rotate-x-val").innerText = rotateX;
    document.getElementById("rotate-y-val").innerText = rotateY;
    document.getElementById("rotate-z-val").innerText = rotateZ;
}

function init() {
    document.getElementById("request-permissions").addEventListener("click", handleClick);
    document.getElementById("hide-overlay").addEventListener("click", () => {
        document.getElementById("vals").hidden = !document.getElementById("vals").hidden;
    });

    document.getElementById("rotate-x").addEventListener("input", updateRotationValues);
    document.getElementById("rotate-y").addEventListener("input", updateRotationValues);
    document.getElementById("rotate-z").addEventListener("input", updateRotationValues);

    buildNodes();
    setInterval(fetchBusPositions, 5000);
}

init();
