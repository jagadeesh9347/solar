let scene, camera, renderer, raycaster, mouse;
let sun;
let planetData = {};
let isPaused = false;
let currentTheme = 'dark';
let hoveredPlanet = null;
let tooltip;
let orbitControls;

const planetConfigs = [
    { name: 'Mercury', color: 0xaaaaaa, size: 0.3, distance: 4, speed: 0.04 },
    { name: 'Venus', color: 0xffaa00, size: 0.6, distance: 6, speed: 0.015 },
    { name: 'Earth', color: 0x0000ff, size: 0.65, distance: 8, speed: 0.01 },
    { name: 'Mars', color: 0xff0000, size: 0.5, distance: 10, speed: 0.008 },
    { name: 'Jupiter', color: 0xffcc99, size: 1.2, distance: 13, speed: 0.006 },
    { name: 'Saturn', color: 0xffff99, size: 1.1, distance: 16, speed: 0.004 },
    { name: 'Uranus', color: 0x66ffff, size: 0.9, distance: 19, speed: 0.003 },
    { name: 'Neptune', color: 0x3366ff, size: 0.85, distance: 22, speed: 0.002 },
];

window.onload = function() {
    init();
    animate();
};

function init() {
    // Scene setup
    scene = new THREE.Scene();
    const containerElement = document.getElementById("container");
    containerElement.style.height = 'calc(100vh - 150px)';
    let renderHeight = containerElement.clientHeight;

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / renderHeight, 0.1, 1000);
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, renderHeight);
    containerElement.appendChild(renderer.domElement);

    // OrbitControls
    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.25;
    orbitControls.screenSpacePanning = false;
    orbitControls.maxDistance = 100;
    orbitControls.minDistance = 2;

    // Lighting
    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(0, 0, 0);
    scene.add(light);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Planets
    planetConfigs.forEach(config => {
        const geo = new THREE.SphereGeometry(config.size, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: config.color });
        const planet = new THREE.Mesh(geo, mat);
        planet.userData.name = config.name;
        scene.add(planet);

        planetData[config.name] = {
            mesh: planet,
            angle: Math.random() * Math.PI * 2,
            distance: config.distance,
            speed: config.speed,
            originalPosition: new THREE.Vector3(),
        };

        createSpeedSlider(config.name, config.speed);
    });

    // Stars
    createStars();

    // UI Controls
    document.getElementById('pauseResumeBtn').addEventListener('click', () => {
        isPaused = !isPaused;
        document.getElementById('pauseResumeBtn').innerText = isPaused ? 'Resume' : 'Pause';
    });

    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Tooltip
    tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    document.body.appendChild(tooltip);

    // Raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
}

function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
        for (const [name, planet] of Object.entries(planetData)) {
            planet.angle += planet.speed;
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
            if (planet.originalPosition.x === 0 && planet.originalPosition.y === 0 && planet.originalPosition.z === 0) {
                planet.originalPosition.copy(planet.mesh.position);
            }
        }
    }

    if (orbitControls) orbitControls.update();
    renderer.render(scene, camera);
}

function createSpeedSlider(name, defaultSpeed) {
    const container = document.getElementById("controls");
    const div = document.createElement("div");
    div.className = "control";

    const label = document.createElement("label");
    label.innerText = name;

    const input = document.createElement("input");
    input.type = "range";
    input.min = "0.001";
    input.max = "0.05";
    input.step = "0.001";
    input.value = defaultSpeed;
    input.oninput = (e) => {
        planetData[name].speed = parseFloat(e.target.value);
    };

    div.appendChild(label);
    div.appendChild(input);
    container.appendChild(div);
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function toggleTheme() {
    const body = document.body;
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    if (currentTheme === 'dark') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggleBtn.innerText = 'Dark Theme';
        document.getElementById('controls').style.backgroundColor = '#f0f0f0';
        currentTheme = 'light';
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggleBtn.innerText = 'Light Theme';
        document.getElementById('controls').style.backgroundColor = '#111';
        currentTheme = 'dark';
    }
}

function onWindowResize() {
    const containerElement = document.getElementById("container");
    let renderHeight = containerElement.clientHeight;

    camera.aspect = window.innerWidth / renderHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, renderHeight);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const interactiveObjects = Object.values(planetData).map(p => p.mesh).concat(sun);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
        const firstIntersectedObject = intersects[0].object;
        const foundPlanet = Object.values(planetData).find(planet => planet.mesh === firstIntersectedObject);

        if (foundPlanet) {
            if (hoveredPlanet !== foundPlanet.mesh) {
                hoveredPlanet = foundPlanet.mesh;
                showTooltip(hoveredPlanet.userData.name, event.clientX, event.clientY);
            }
        } else {
            hideTooltip();
            hoveredPlanet = null;
        }
    } else {
        hideTooltip();
        hoveredPlanet = null;
    }
}

function showTooltip(name, x, y) {
    tooltip.innerText = name;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.opacity = 1;
}

function hideTooltip() {
    tooltip.style.opacity = 0;
}

function onClick(event) {
    if (orbitControls && orbitControls.isDragging) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const interactiveObjects = Object.values(planetData).map(p => p.mesh).concat(sun);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const foundPlanet = Object.values(planetData).find(planet => planet.mesh === clickedObject);

        if (foundPlanet) {
            zoomToPlanet(foundPlanet.mesh);
        } else if (clickedObject === sun) {
            zoomToPlanet(sun);
        }
    } else {
        resetCamera();
    }
}

function zoomToPlanet(targetMesh) {
    const targetPosition = targetMesh.position.clone();
    const offsetDistance = targetMesh.geometry.parameters.radius * 5;
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion);
    const newCameraPosition = targetPosition.clone().add(direction.multiplyScalar(offsetDistance));

    const currentCameraPosition = camera.position.clone();
    const currentTarget = orbitControls.target.clone();

    const animateCamera = () => {
        currentCameraPosition.lerp(newCameraPosition, 0.05);
        currentTarget.lerp(targetPosition, 0.05);

        camera.position.copy(currentCameraPosition);
        orbitControls.target.copy(currentTarget);
        orbitControls.update();

        if (currentCameraPosition.distanceTo(newCameraPosition) > 0.1 || currentTarget.distanceTo(targetPosition) > 0.1) {
            requestAnimationFrame(animateCamera);
        }
    };
    animateCamera();
}

function resetCamera() {
    const initialCameraPosition = new THREE.Vector3(0, 10, 30);
    const initialTarget = new THREE.Vector3(0, 0, 0);

    const currentCameraPosition = camera.position.clone();
    const currentTarget = orbitControls.target.clone();

    const animateCameraReset = () => {
        currentCameraPosition.lerp(initialCameraPosition, 0.05);
        currentTarget.lerp(initialTarget, 0.05);

        camera.position.copy(currentCameraPosition);
        orbitControls.target.copy(currentTarget);
        orbitControls.update();

        if (currentCameraPosition.distanceTo(initialCameraPosition) > 0.1 || currentTarget.distanceTo(initialTarget) > 0.1) {
            requestAnimationFrame(animateCameraReset);
        }
    };
    animateCameraReset();
}
