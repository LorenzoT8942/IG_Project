import * as THREE from 'three';
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";
import {GUI} from "three/examples/jsm/libs/lil-gui.module.min.js";
import {Sky} from "three/examples/jsm/objects/Sky.js";
import {Player} from "./Player.js";
import {Demon} from "./Demon.js";
import {ProjectileManager} from "./ProjectileManager.js";
import {AssetLoader} from "./AssetLoader.js";
import {LevelManager} from "./LevelManager.js";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import {DirectionalLight, PointLight} from "three";

let hpBar = document.getElementById('hp-bar');
let pauseOverlay = document.getElementById('pauseOverlay');
let defeatOverlay = document.getElementById('defeatOverlay');

const loader = new GLTFLoader();
const fbxLoader  = new FBXLoader();
let enemies = [];
const assetLoader = new AssetLoader(loader, fbxLoader, enemies);
assetLoader.load();

const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
const gui = new GUI();

const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new PointerLockControls(camera, renderer.domElement);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();

let boxes = [];
const pressed = new Set();
const pointer = new THREE.Vector2();
let groundMesh;
let prevPosition = new THREE.Vector3(0,0 ,0);
let headBone;
let projectileManager = new ProjectileManager(scene, enemies);
let paused = false;
let defeat = false;

let spawned = false;
let started = false;
let mapEdgeLength = 100;
let cameraLocked = true;
const unlockedCameraSpeed = 0.1;
let cameraW = false;
let cameraA = false;
let cameraS = false;
let cameraD = false;

//Renderer initialization
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);


loader.load('/public/models/pine/scene.gltf', (gltf) => {
    let pine = gltf.scene;
    pine.scale.set(0.003, 0.003, 0.003);
    pine.position.set(0, -1.5, -10);
    pine.traverse(function (pine){
        if (pine.isObject3D){
            pine.castShadow = true;
            pine.receiveShadow = true;
        }
    })

    for (let i = 0; i < 60; i++) {
        let x = Math.random() * mapEdgeLength - mapEdgeLength/2;
        let z = Math.random() * mapEdgeLength - mapEdgeLength/2;
        let treeClone = SkeletonUtils.clone(pine);
        treeClone.position.setX(x);
        treeClone.position.setZ(z);
        scene.add(treeClone);
    }
})

loader.load('/public/models/mushroomTree/scene.gltf', (gltf) => {
    let mushroomTree = gltf.scene;
    mushroomTree.scale.set(0.007, 0.007, 0.007);
    mushroomTree.position.set(0, -1.5, -10);
    mushroomTree.traverse(function (mushroomTree){
        if (mushroomTree.isObject3D){
            mushroomTree.castShadow = true;
            mushroomTree.receiveShadow = true;
        }
    })

    for (let i = 0; i < 35; i++) {
        let x = Math.random() * mapEdgeLength - mapEdgeLength/2;
        let z = Math.random() * mapEdgeLength - mapEdgeLength/2;
        const randomAngle = Math.random() * 2 * Math.PI;

        let mushroomClone = SkeletonUtils.clone(mushroomTree);
        mushroomClone.position.setX(x);
        mushroomClone.position.setZ(z);
        mushroomClone.rotateY(randomAngle);
        scene.add(mushroomClone);

        let mushLight = new PointLight("#a6dc65", 10, 10);
        mushLight.position.set(x, 1, z);
        scene.add(mushLight);
    }
})

let fire;
loader.load('/public/models/fire/scene.gltf', (gltf) => {
    fire = gltf.scene;
    const mixer = new THREE.AnimationMixer(fire);
    fire.position.set(0, -1.7, 0);
    let clips = gltf.animations;
    const clip = THREE.AnimationClip.findByName(clips, 'anim_stack');
    const action = mixer.clipAction(clip);
    action.play();
    //scene.add(fire);
})

// Create a perimeter (invisible walls)
const wallThickness = 3;
const wallHeight = 10;
const perimeterMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });

const walls = [
    new THREE.Mesh(new THREE.BoxGeometry(mapEdgeLength, wallHeight, wallThickness), perimeterMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(mapEdgeLength, wallHeight, wallThickness), perimeterMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapEdgeLength), perimeterMaterial),
    new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapEdgeLength), perimeterMaterial),
];

walls[0].position.set(0, (wallHeight / 2) - 1.4, -mapEdgeLength / 2); // Top wall
walls[1].position.set(0, (wallHeight / 2) - 1.4, mapEdgeLength / 2); // Bottom wall
walls[2].position.set(-mapEdgeLength / 2, (wallHeight / 2) - 1.4, 0); // Left wall
walls[3].position.set(mapEdgeLength / 2, (wallHeight / 2) - 1.4, 0); // Right wall

walls.forEach(wall => scene.add(wall));
walls.forEach(wall => wall.geometry.computeBoundingBox());



const animationsFolder = gui.addFolder('Animations');
animationsFolder.open();

const character = new Player(scene, fbxLoader);
character.load();
let levelManager = new LevelManager(scene, enemies, boxes, character, assetLoader, mapEdgeLength);
const characterLight = new PointLight('#e8a84a', 10, 10);
characterLight.position.setY(1.2);
scene.add(characterLight);
//Sky
//const sky = new Sky()
addSky();

//Light initialization
/*const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
ambientLight.intensity = 5;
scene.add( ambientLight );

 */

/*
const pointLight = new THREE.PointLight('#404040', 3000, 100); // White light, full intensity, distance 100
pointLight.position.set(10, 10, 10); // Set light position
pointLight.castShadow = true;
pointLight.shadow.mapSize.height = window.innerHeight;
pointLight.shadow.mapSize.width = window.innerWidth;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 1000;
pointLight.shadow.bias = 0.0003;
//scene.add(pointLight);

// Add a directional light to simulate sunlight
const sunlight = new THREE.DirectionalLight(0xffd27f, 1); // White light with full intensity
sunlight.position.set(50, 100, 50); // Position the light like the sun
sunlight.castShadow = true;  // Enable shadows from the light
scene.add(sunlight);

// Optional: Configure the shadow properties for better performance/quality
sunlight.shadow.mapSize.width = 2048;  // Shadow map resolution
sunlight.shadow.mapSize.height = 2048;
sunlight.shadow.camera.near = 0.5;
sunlight.shadow.camera.far = 500;
sunlight.shadow.camera.left = -50;
sunlight.shadow.camera.right = 50;
sunlight.shadow.camera.top = 50;
sunlight.shadow.camera.bottom = -50;

// Add a bit of ambient light to simulate global illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);  // Low intensity ambient light
scene.add(ambientLight);


 */

const ambientLight = new THREE.AmbientLight('#9796f1', 0.3); // Low intensity, soft bluish color
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight('#b5b5f3', 0.3); // Soft bluish light
moonLight.position.set(50, 100, 50); // Position the light high above the scene
moonLight.castShadow = true; // Optional, if you want shadows from the moonlight
moonLight.shadow.mapSize.width = 2048;  // Shadow map resolution
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 500;
moonLight.shadow.camera.left = -50;
moonLight.shadow.camera.right = 50;
moonLight.shadow.camera.top = 50;
moonLight.shadow.camera.bottom = -50;
scene.add(moonLight);


//Fog
//scene.fog = new THREE.FogExp2('#4a5a49', 0.03);
//scene.fog = new THREE.Fog(0x101020, 1, 100);
//gui.add(scene.fog, 'density', 0, 1, 0.001).name('Fog Density');


//Cube initialization
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial( {color: 0x00ff00} );
const cube = new THREE.Mesh(geometry, material);
cube.position.set(7, 1, 1);
cube.castShadow = true;
//scene.add(cube);


//Terrain initialization
createTerrain();

//Init movement
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let dampingFactor = 75.0;
let running = false;

//Events managers
document.addEventListener('keydown', function(event) {
    // Check if Shift key is pressed
    if (event.shiftKey) {
        if (!running){
            running = true;
            dampingFactor = 50.0;
        }else{
            dampingFactor = 75.0;
            running = false;
        }
        //console.log(dampingFactor);
    }
});

const onKeyDown = function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (!character.isDead && cameraLocked){
                moveForward = true;
                pressed.add(event.code);
                character.animations.run();
            }
            cameraW = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (!character.isDead && cameraLocked){
                moveLeft = true;
                pressed.add(event.code);
                character.animations.run();
            }
            cameraA = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (!character.isDead && cameraLocked){
                moveBackward = true;
                pressed.add(event.code);
                character.animations.run();
            }
            cameraS = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (!character.isDead && cameraLocked){
                moveRight = true;
                pressed.add(event.code);
                character.animations.run();
            }
            cameraD = true;
            break;

        case 'Escape':
            if (!character.isDead && levelManager.victoryState === false){
                paused = paused === false;
                pauseOverlay.style.visibility = paused ? 'visible' : 'hidden';
            }
            break;

        case 'Space':
            //start();
            levelManager.start();
            if (character.isDead){
                levelManager.restart();
            }
            break;

        case 'KeyL':
            if (cameraLocked){
                cameraLocked = false;
                controls.lock();
            }else{
                cameraLocked = true;
                controls.unlock();
            }

    }
};
const onKeyUp = function(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            pressed.delete(event.code);
            if(!pressed.size && !character.isDead){
                character.animations.idle();
            }
            cameraW = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            pressed.delete(event.code);
            if(!pressed.size && !character.isDead){
                character.animations.idle();
            }
            cameraA = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            pressed.delete(event.code);
            if(!pressed.size && !character.isDead){
                character.animations.idle();
            }
            cameraS = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            pressed.delete(event.code);
            if(!pressed.size && !character.isDead){
                character.animations.idle();
            }
            cameraD = false;
            break;
    }
};
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event){

    if (!paused){
        pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        pointer.y = -( event.clientY / window.innerHeight ) * 2 + 1;

        //console.log("pointer", pointer);
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(groundMesh);
        let dir;

        if (intersects.length > 0){
            //dir = new THREE.Vector2(intersects[0].point.x, intersects[0].point.z);
            dir = new THREE.Vector2(pointer.x, -pointer.y);
            //console.log(dir.x, dir.y);
        }

        projectileManager.spawnProjectile(dir, character.model.position, character.attackDamage);
        if (character.tripleShot){
            const angle = 10;
            projectileManager.spawnProjectile(projectileManager.rotateVector(dir, angle), character.model.position, character.attackDamage);
            projectileManager.spawnProjectile(projectileManager.rotateVector(dir, -angle), character.model.position, character.attackDamage);
        }
    }
}

document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);
window.addEventListener('resize', onWindowResize, false);
document.addEventListener('mousedown', onMouseDown, false);



function createTerrain() {
    const width = mapEdgeLength;
    const height = mapEdgeLength;
    const geometry = new THREE.PlaneGeometry(width, height, 100, 100);
    geometry.rotateX(-Math.PI / 2);

    const repeatFactor = width/5;
    const groundTexture = textureLoader.load('public/textures/forestGround/forrest_ground_01_diff_1k.png');
    const groundDisplacementTexture = textureLoader.load('public/textures/forestGround/forrest_ground_01_disp_1k.png');
    const groundNormalTexture = textureLoader.load('public/textures/forestGround/forrest_ground_01_nor_gl_1k.png');
    const groundARMTexture = textureLoader.load('public/textures/forestGround/forrest_ground_01_arm_1k.png');
    groundTexture.repeat.set(repeatFactor, repeatFactor);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.colorSpace = THREE.SRGBColorSpace;
    groundDisplacementTexture.repeat.set(repeatFactor, repeatFactor);
    groundDisplacementTexture.wrapS = THREE.RepeatWrapping;
    groundDisplacementTexture.wrapT = THREE.RepeatWrapping;

    groundNormalTexture.repeat.set(repeatFactor, repeatFactor);
    groundNormalTexture.wrapS = THREE.RepeatWrapping;
    groundNormalTexture.wrapT = THREE.RepeatWrapping;

    groundARMTexture.repeat.set(repeatFactor, repeatFactor);
    groundARMTexture.wrapS = THREE.RepeatWrapping;
    groundARMTexture.wrapT = THREE.RepeatWrapping;

    let material = new THREE.MeshStandardMaterial({
        map: groundTexture,
        displacementMap: groundDisplacementTexture,
        displacementScale: 0.3,
        displacementBias: -1.56,
        aoMap: groundARMTexture,
        roughnessMap: groundARMTexture,
        metalnessMap: groundARMTexture,
        normalMap: groundNormalTexture
    });
    const ground = new THREE.Mesh(geometry, material);
    groundMesh = ground;
    ground.receiveShadow = true;

    scene.add(ground);

    gui.add(ground.material, 'displacementScale', 0, 1, 0.001);
    gui.add(ground.material, 'displacementBias', -2, 1, 0.001);

}

const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(camera.position, 'x', -10, 10).name('X Position');
cameraFolder.add(camera.position, 'y', -10, 10).name('Y Position');
cameraFolder.add(camera.position, 'z', -10, 10).name('Z Position');
cameraFolder.open();

function addSky() {
    /*sky.scale.setScalar(450000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 0.0;  // Lower turbidity for a clearer, darker sky
    skyUniforms['rayleigh'].value = 0.0;   // Remove rayleigh scattering for darkness
    skyUniforms['mieCoefficient'].value = 0.0001;  // Very low mie scattering for reduced haze
    skyUniforms['mieDirectionalG'].value = 0.2;    // Slight directional scattering for soft light


    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(90);  // Position the sun below the horizon
    const theta = THREE.MathUtils.degToRad(180);

    sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(sun);

     */

    // Create a sphere to represent the night sky
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/skybox/night.jpg'),
        side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Create stars using a particle system
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starVertices = [];

    for (let i = 0; i < starCount; i++) {
        const x = THREE.MathUtils.randFloatSpread(1000);
        const y = THREE.MathUtils.randFloatSpread(1000);
        const z = THREE.MathUtils.randFloatSpread(1000);

        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starVertices, 3)
    );

    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

}

//Axes initialization
const axesHelper = new THREE.AxesHelper( 2 );
axesHelper.setColors(new THREE.Color( 1, 0, 0 ), new THREE.Color( 0, 1, 0 ), new THREE.Color( 0, 0, 1 ))
//scene.add(axesHelper);

const cameraDistance = 6;
const direction = new THREE.Vector3( 0, 0, 0);
const rotationMatrix = new THREE.Matrix4();

let enemiesLoaded = false;

function animate() {

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * dampingFactor * delta;
    velocity.z -= velocity.z * dampingFactor * delta;

    //Velocity multiplied by the time passed between one frame and the next
    if (moveForward) {
        if (!character.isDead){
            velocity.z -= 400.0 * delta;
            direction.z -= 1;
        }
    }
    if (moveBackward){
        if (!character.isDead) {
            velocity.z += 400.0 * delta;
            direction.z += 1;
        }
    }
    if (moveLeft){
        if (!character.isDead) {
            velocity.x -= 400.0 * delta;
            direction.x -= 1;
        }
    }
    if (moveRight){
        if (!character.isDead) {
            velocity.x += 400.0 * delta;
            direction.x += 1;
        }
    }

    if (character.isDead){
        velocity.x = 0;
        velocity.z = 0;
    }

    prevTime = time;

    if (!paused || !cameraLocked){
        if (character.modelReady) {
            prevPosition = character.model.position;
            character.mixer.update(clock.getDelta());
            character.hitbox.setFromObject(character.model);
            if (cameraLocked){
                camera.position.set(character.model.position.x, character.model.position.y + cameraDistance , character.model.position.z + cameraDistance);
                camera.lookAt(character.model.position);
            }else{
                moveCamera();
            }
            character.model.position.x = character.model.position.x + velocity.x *delta;
            character.model.position.z = character.model.position.z + velocity.z *delta;
            characterLight.position.x = character.model.position.x;
            characterLight.position.z = character.model.position.z;

            for (const wall of walls) {
                const wallBox = new THREE.Box3().setFromObject(wall);
                if (character.hitbox.intersectsBox(wallBox)) {
                    // Undo movement
                    character.model.position.x = character.model.position.x - velocity.x *delta;
                    character.model.position.z = character.model.position.z - velocity.z *delta;
                }
            }


            //TODO: vedere quaternion
            if (direction.length() > 0){
                direction.normalize();
                const targetQuaternion = new THREE.Quaternion();
                rotationMatrix.lookAt(direction, new THREE.Vector3(0,0,0), new THREE.Vector3(0,1,0));
                targetQuaternion.setFromRotationMatrix(rotationMatrix);
                character.model.quaternion.rotateTowards(targetQuaternion, delta * 10);
            }

            if (assetLoader.mutantLoaded){
                if (!enemiesLoaded){
                    for (let i = 0; i < 50; i++) {
                        enemies.push(new Demon(scene, assetLoader, character, false));
                    }
                    enemiesLoaded = true;
                }else{
                    if (cameraLocked){
                        enemies.forEach(enemy => {
                            enemy.moveTowards(character.model, delta, performance.now());
                            enemy.mixer.update(delta);
                        })
                    }
                }

                levelManager.checkKillCount();
            }
            if (cameraLocked) projectileManager.updatePositions(delta);

            if (assetLoader.boxModelLoaded){
                boxes.forEach(box => {
                    box.checkHit();
                    box.animate();
                })
            }
        }
    }

    if (character.isDead){
        levelManager.showDeadView();
    }
    renderer.render(scene, camera);
}

function moveCamera() {
    if (cameraW) {
        controls.moveForward(unlockedCameraSpeed);
    }
    if (cameraS) {
        controls.moveForward(-unlockedCameraSpeed);
    }
    if (cameraA) {
        controls.moveRight(-unlockedCameraSpeed);
    }
    if (cameraD) {
        controls.moveRight(unlockedCameraSpeed);
    }
}

function simulateKeyPress(key) {
    let event = new KeyboardEvent('keydown', { key: key });
    document.dispatchEvent(event);
}