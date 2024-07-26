import * as THREE from "three";
import {Box3Helper} from "three";

export class Demon {

    constructor(scene, gltfLoader) {
        this.hp = 30;
        this.isDead = false;
        this.target = {
            model: null,
            direction: null
        }
        this.activeAction = null;
        this.lastAction = null;
        this.actions = {
            idle: null,
            attack: null,
            die: null
        }
        const hitboxGeometry = new THREE.BoxGeometry(1, 2);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            visible: false
        })
        this.supportBox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.hitbox = new THREE.Box3();
        this.boundingBoxHelper = null;
        this.moveSpeed = 2;
        this.attackRange = 4;
        this.scene = scene;
        this.model = null;
        this.modelReady = false;
        this.gltfLoader = gltfLoader;
        this.animationActions = [];
        this.mixer = null;

        this.animations = {
            idle: () => {
                this.setAction(this.animationActions[0]);
            },

            attack: () => {
                this.setAction(this.animationActions[1]);
            },

            die: () => {
                this.setAction(this.animationActions[2]);
            }
        }
    }

    load (){
        this.gltfLoader.load("/models/death_fire.glb", (gltf) => {
            this.model = gltf.scene;
            console.log("model", this.model);
            //this.model.scale.set(0.01, 0.01, 0.01);
            this.model.scale.set(0.5, 0.5, 0.5);
            this.model.position.set(0.0, -1.6, 0.0);

            this.model.traverse((charModel) => {
                if ( charModel.isObject3D )  charModel.castShadow = true;
            })

            //loads all needed animations in the action structure
            console.log("animations", gltf.animations);
            this.mixer = new THREE.AnimationMixer(this.model);

            //setup idle animation
            this.actions.idle = this.mixer.clipAction(gltf.animations[0]);
            this.animationActions.push(this.actions.idle);

            //setup attack animations
            this.actions.attack = this.mixer.clipAction(gltf.animations[6]);
            this.animationActions.push(this.actions.attack);

            //setup die animations
            this.actions.die = this.mixer.clipAction(gltf.animations[1]);
            this.animationActions.push(this.actions.die);
            this.actions.die.loop = THREE.LoopOnce;
            this.actions.die.clampWhenFinished = true; //makes sure that when the animation loop ends, the model stays still on the last frame of the animation

            //Start idle animation
            this.activeAction = this.actions.idle;
            this.actions.idle.play();

            //this.scene.add(this.model);
            this.spawn();
            this.supportBox.position.copy(this.model.position);
            this.supportBox.position.y += 1.5;
            this.hitbox.setFromObject(this.supportBox);

            this.scene.add(this.supportBox);

            this.boundingBoxHelper = new Box3Helper(this.hitbox, 0xffff00);
            this.scene.add(this.boundingBoxHelper);
            this.modelReady = true;

            console.log("hitbox", this.hitbox);
        })

    }

    setAction = (toAction) => {
        this.lastAction = this.activeAction;
        this.activeAction = toAction;

        if (this.lastAction !== this.activeAction) {
            this.lastAction.fadeOut(0.2);
            this.activeAction.reset().fadeIn(0.2).play();
        }
    };

    spawn () {
        const x = 10;
        const  z = -10;
        const spawnX = Math.random();
        this.model.position.x += x;
        this.model.position.z += z;
        this.scene.add(this.model);
    }

    moveTowards(object, delta){
        if (!this.isDead){
            const direction = new THREE.Vector3();
            direction.subVectors(object.position, this.model.position);
            //TODO
            this.model.rotation.y = Math.atan2(direction.x, direction.z);
            if (direction.length() > 2){
                direction.normalize();
                this.model.position.add(direction.multiplyScalar(this.moveSpeed * delta));
            }
        }
    }

    setTarget (target){
        this.target = target;
    }
    /*
    isHit(p){

        if (this.hitbox.intersectsBox(p.bb)){
            console.log("hitbox", this.hitbox);
            if (!this.isDead){
                this.hp -= 10;
                if (this.hp <= 0){
                    this.isDead = true;
                }
            }
            return true;
        }

        return false;
    }

     */

    applyDamage(damage){
        this.hp -= damage;
        if (this.hp <= 0){
            this.isDead = true;
            this.animations.die();
        }
    }

    updateHitbox(){
        this.supportBox.position.copy(this.model.position);
        this.supportBox.position.y += 1.5;
        //this.supportBox.rotation.copy(this.model.rotation);
        this.hitbox.setFromObject(this.supportBox);
    }

}