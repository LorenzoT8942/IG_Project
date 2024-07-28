import * as THREE from "three";
import {Box3Helper} from "three";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

export class Demon {

    constructor(scene, fbxLoader, assetLoader) {
        this.hp = 30;
        this.moveSpeed = 2;
        this.attackRange = 4;
        this.isDead = false;

        this.assetLoader = assetLoader;

        this.animationActions = [];
        this.scene = scene;
        this.model = SkeletonUtils.clone(this.assetLoader.mutantModel);
        this.mixer = new THREE.AnimationMixer(this.model);
        //console.log(assetLoader.mutantRunAnim);
        //console.log(assetLoader.mutantAttackAnim);
        //console.log(assetLoader.mutantDeathAnim);
        this.actions = {
            //idle: null,
            attack: this.mixer.clipAction(assetLoader.mutantAttackAnim),
            die: this.mixer.clipAction(assetLoader.mutantDeathAnim),
            run: this.mixer.clipAction(assetLoader.mutantRunAnim)
        }

        this.activeAction = null;
        this.lastAction = null;

        const hitboxGeometry = new THREE.BoxGeometry(1, 2);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            visible: false
        })
        this.supportBox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.hitbox = new THREE.Box3();
        this.boundingBoxHelper = null;

        this.modelReady = false;
        this.fbxLoader = fbxLoader;

        this.animations = {
            run: () => {
                this.setAction(this.animationActions[0]);
            },

            attack: () => {
                this.setAction(this.animationActions[1]);
            },

            die: () => {
                this.setAction(this.animationActions[2]);
            }
        }

        this.spawn();
    }

    load (){
        this.fbxLoader.load("/models/mutant/mutant.fbx", (fbx) => {
            this.model = fbx;
            //console.log("model", this.model);
            this.model.scale.set(0.01, 0.01, 0.01);
            //this.model.scale.set(0.5, 0.5, 0.5);
            this.model.position.set(0.0, -1.4, 0.0);
            this.scene.add(this.model);

            this.model.traverse((charModel) => {
                if ( charModel.isObject3D )  charModel.castShadow = true;
            })

            this.mixer = new THREE.AnimationMixer(this.model);

            this.fbxLoader.load('/public/models/mutant/anim/mutant_run.fbx', (run_fbx) => {
                console.log(run_fbx.animations[0]);
                this.actions.run = this.mixer.clipAction(run_fbx.animations[0]);
                this.actions.run.play();
                this.activeAction = this.actions.run;
                this.animationActions.push(this.actions.run);


                this.fbxLoader.load('/public/models/mutant/anim/mutant_punch.fbx', (attack_fbx) => {
                    this.actions.attack = this.mixer.clipAction(attack_fbx.animations[0]);
                    this.animationActions.push(this.actions.attack);

                    this.fbxLoader.load('/public/models/mutant/anim/mutant_dying.fbx', (death_fbx) => {
                        this.actions.die = this.mixer.clipAction(death_fbx.animations[0]);
                        this.animationActions.push(this.actions.die);
                        this.modelReady = true;
                        //console.log(this.mutantRunAnim);
                        //console.log(this.mutantDeathAnim);
                        //console.log(this.mutantAttackAnim);
                    })
                })
            })

            this.supportBox.position.copy(this.model.position);
            this.supportBox.position.y += 1.5;
            this.hitbox.setFromObject(this.supportBox);

            this.scene.add(this.supportBox);

            this.boundingBoxHelper = new Box3Helper(this.hitbox, 0xffff00);
            this.scene.add(this.boundingBoxHelper);
        })



        /*
        //loads all needed animations in the action structure
        this.mixer = new THREE.AnimationMixer(this.model);

        //setup idle animation
        this.actions.idle = this.mixer.clipAction(fbx.animations[0]);
        this.animationActions.push(this.actions.idle);

        //setup attack animations
        this.actions.attack = this.mixer.clipAction(fbx.animations[6]);
        this.animationActions.push(this.actions.attack);

        //setup die animations
        this.actions.die = this.mixer.clipAction(fbx.animations[1]);
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


        //console.log("hitbox", this.hitbox);

         */

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
        const radius = 15;
        const angle = Math.random()* 360;
        const spawnX = radius * Math.cos(angle);
        const spawnZ = radius * Math.sin(angle);
        //this.model.position.x += x;
        //this.model.position.z += z;
        //this.scene.add(this.model);

        //clone model from the loaded one
        this.model.position.set(this.model.position.x + spawnX, this.model.position.y, this.model.position.z + spawnZ);

        //Create hitbox for the cloned model
        const hitboxGeometry = new THREE.BoxGeometry(1, 2);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            visible: false
        })
        const supportBox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        supportBox.position.copy(this.model.position);
        supportBox.position.y += 1.5;
        const hitbox = new THREE.Box3();
        hitbox.setFromObject(supportBox);

        //Create animation mixer for the cloned model (each model must have its own animation mixer)
        this.actions.run = this.mixer.clipAction(this.assetLoader.mutantRunAnim);
        this.actions.attack = this.mixer.clipAction(this.assetLoader.mutantAttackAnim);
        this.actions.die = this.mixer.clipAction(this.assetLoader.mutantDeathAnim);

        this.animationActions.push(this.actions.run);
        this.animationActions.push(this.actions.attack);
        this.animationActions.push(this.actions.die);

        this.activeAction = this.actions.run;
        this.actions.run.play();

        this.scene.add(this.supportBox);
        this.scene.add(this.model);

        this.boundingBoxHelper = new Box3Helper(this.hitbox, 0xffff00);
        this.scene.add(this.boundingBoxHelper);
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
                this.animations.run();
            }
            else{
                this.animations.attack();
            }

            this.updateHitbox();
        }
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