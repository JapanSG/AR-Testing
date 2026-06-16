const ROTATION = [0, 0, 0];

function rotateCube(inc){
    const boxes = document.querySelectorAll(".rotating-box");
    // ROTATION[0] = (inc + ROTATION[0]) % 360;
    ROTATION[1] = (inc + ROTATION[1]) % 360;
    ROTATION[2] = (inc + ROTATION[2]) % 360;
    boxes.forEach(box => box.setAttribute("rotation", `${ROTATION[0]} ${ROTATION[1]} ${ROTATION[2]}`));
}

function init(){
    setInterval(() => {rotateCube(1)}, 10);
}

init()
