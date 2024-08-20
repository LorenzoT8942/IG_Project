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
import {FontLoader} from "three/examples/jsm/loaders/FontLoader.js";
import {TextGeometry} from "three/examples/jsm/geometries/TextGeometry.js";

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
//Renderer initialization
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

let staff;
loader.load('/public/models/staff/scene.gltf', (gltf) => {
    staff = gltf.scene;

    staff.position.set(0, 0, 0);
    staff.traverse(function (staff) {
        if (staff.isObject3D) {
            staff.castShadow = true;
            staff.receiveShadow = true;
        }
    })
    scene.add(staff);
})

loader.load('/public/models/pine/scene.gltf', (gltf) => {
    let pine = gltf.scene;
    pine.scale.set(0.05, 0.05, 0.05);
    pine.position.set(0, -1.5, -10);
    pine.traverse(function (pine){
        if (pine.isObject3D){
            pine.castShadow = true;
            pine.receiveShadow = true;
        }
    })
    scene.add(pine);
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
    scene.add(fire);
})

const animationsFolder = gui.addFolder('Animations');
animationsFolder.open();

const character = new Player(scene, fbxLoader);
character.load();
let levelManager = new LevelManager(scene, enemies, boxes, character, assetLoader, mapEdgeLength);

//Sky
const sky = new Sky()
addSky(sky);

//Light initialization
const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
ambientLight.intensity = 5;
scene.add( ambientLight );
const pointLight = new THREE.PointLight('#404040', 3000, 100); // White light, full intensity, distance 100
pointLight.position.set(10, 10, 10); // Set light position
pointLight.castShadow = true;
pointLight.shadow.mapSize.height = window.innerHeight;
pointLight.shadow.mapSize.width = window.innerWidth;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 1000;
pointLight.shadow.bias = 0.0003;
scene.add(pointLight);


//Fog
scene.fog = new THREE.FogExp2('#4a5a49', 0.03);
gui.add(scene.fog, 'density', 0, 1, 0.001).name('Fog Density');


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
            if (!character.isDead){
                moveForward = true;
                pressed.add(event.code);
                character.animations.run();
            }
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (!character.isDead){
                moveLeft = true;
                pressed.add(event.code);
                character.animations.run();
            }
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (!character.isDead){
                moveBackward = true;
                pressed.add(event.code);
                character.animations.run();
            }
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (!character.isDead){
                moveRight = true;
                pressed.add(event.code);
                character.animations.run();
            }
            break;

        case 'Escape':
            if (!character.isDead){
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
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            pressed.delete(event.code);
            if(!pressed.size && !character.isDead){
                character.animations.idle();
            }
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            pressed.delete(event.code);
            if(!pressed.size && !character.isDead){
                character.animations.idle();
            }
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            pressed.delete(event.code);
            if(!pressed.size && !character.isDead){
                character.animations.idle();
            }
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

function addSky(sky) {
    sky.scale.set(100, 100, 100);
    scene.add(sky);
//Modifies uniform values of the vertex shader
    sky.material.uniforms['turbidity'].value = 20;
    sky.material.uniforms['rayleigh'].value = 0.558;
    sky.material.uniforms['mieCoefficient'].value = 0.009;
    sky.material.uniforms['mieDirectionalG'].value = 0.999998;
    sky.material.uniforms['sunPosition'].value.set(1, 1, 1);
}

//Axes initialization
const axesHelper = new THREE.AxesHelper( 2 );
axesHelper.setColors(new THREE.Color( 1, 0, 0 ), new THREE.Color( 0, 1, 0 ), new THREE.Color( 0, 0, 1 ))
scene.add(axesHelper);

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

    if (!paused){
        if (character.modelReady) {
            prevPosition = character.model.position;
            character.mixer.update(clock.getDelta());
            character.hitbox.setFromObject(character.model);
            camera.lookAt(character.model.position);
            character.model.position.x = character.model.position.x + velocity.x *delta;
            character.model.position.z = character.model.position.z + velocity.z *delta;
            camera.position.set(character.model.position.x, character.model.position.y + cameraDistance , character.model.position.z + cameraDistance);

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
                    enemies.forEach(enemy => {
                        enemy.moveTowards(character.model, delta, performance.now());
                        enemy.mixer.update(delta);
                    })
                }

                levelManager.checkKillCount();
            }
            projectileManager.updatePositions(delta);

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

