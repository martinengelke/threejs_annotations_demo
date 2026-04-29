// Number

const canvas = document.getElementById("number");
if (!canvas) {
    throw new Error('Missing required canvas element: "#number"');
}
const ctx = canvas.getContext("2d");
const x = 32;
const y = 32;
const radius = 30;
const startAngle = 0;
const endAngle = Math.PI * 2;

ctx.fillStyle = "rgb(0, 0, 0)";
ctx.beginPath();
ctx.arc(x, y, radius, startAngle, endAngle);
ctx.fill();

ctx.strokeStyle = "rgb(255, 255, 255)";
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(x, y, radius, startAngle, endAngle);
ctx.stroke();

ctx.fillStyle = "rgb(255, 255, 255)";
ctx.font = "32px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("1", x, y);

// three.js

let camera;
let controls;
let scene;
let renderer;
let sprite;
let mesh;
let spriteBehindObject;
const annotation = document.querySelector(".annotation");
if (!annotation) {
    throw new Error('Missing required annotation element: ".annotation"');
}
const raycaster = new THREE.Raycaster();
const cameraToSprite = new THREE.Vector3();
const cameraWorldPosition = new THREE.Vector3();
const spriteWorldPosition = new THREE.Vector3();

init();
animate();

function init() {

    // Camera

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 2, 2000);
    camera.position.x = 750;
    camera.position.y = 500;
    camera.position.z = 1250;

    // Scene

    scene = new THREE.Scene();

    // Lights

    const lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 2000, 0);
    lights[1].position.set(1000, 2000, 1000);
    lights[2].position.set(-1000, -2000, -1000);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    // Mesh

    const cubeGeometry = new THREE.BoxGeometry(500, 500, 500);

    mesh = new THREE.Mesh(
        cubeGeometry,
        new THREE.MeshPhongMaterial({
            color: 0x156289,
            emissive: 0x072534,
            side: THREE.DoubleSide,
            flatShading: true
        })
    );

    const line = new THREE.LineSegments(
        new THREE.WireframeGeometry(cubeGeometry),
        new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1,
            opacity: 0.25,
            transparent: true
        })
    );

    scene.add(mesh);
    scene.add(line);

    // Sprite

    const numberTexture = new THREE.CanvasTexture(
        document.querySelector("#number")
    );

    const spriteMaterial = new THREE.SpriteMaterial({
        map: numberTexture,
        alphaTest: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });

    sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(250, 250, 250);
    sprite.scale.set(60, 60, 1);

    scene.add(sprite);

    // Renderer

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x333333, 1);
    document.body.appendChild(renderer.domElement);

    // Controls

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;

    window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
    updateAnnotationOpacity();
    updateScreenPosition();
}

function updateAnnotationOpacity() {
    camera.getWorldPosition(cameraWorldPosition);
    sprite.getWorldPosition(spriteWorldPosition);
    cameraToSprite.subVectors(spriteWorldPosition, cameraWorldPosition);

    const spriteDistance = cameraToSprite.length();
    raycaster.set(cameraWorldPosition, cameraToSprite.normalize());
    const intersections = raycaster.intersectObject(mesh, false);
    const firstIntersection = Array.isArray(intersections) ? intersections[0] : null;
    spriteBehindObject = Boolean(
        firstIntersection && typeof firstIntersection.distance === "number" && firstIntersection.distance < spriteDistance
    );
    sprite.material.opacity = spriteBehindObject ? 0.25 : 1;
}

function updateScreenPosition() {
    const vector = new THREE.Vector3(250, 250, 250);
    const canvas = renderer.domElement;

    vector.project(camera);

    vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
    vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));

    annotation.style.top = `${vector.y}px`;
    annotation.style.left = `${vector.x}px`;
    annotation.style.opacity = spriteBehindObject ? 0.25 : 1;
}
