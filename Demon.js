import * as THREE from "three";
import {Box3Helper, Clock} from "three";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

export class Demon {

    constructor(scene, assetLoader, target, elite) {
        this.hp = 30;
        this.attack = 10;
        this.moveSpeed = 2;
        this.attackRange = 4;
        this.target = target;
        this.isElite = elite;
        this.isDead = false;
        this.isAttacking = false;
        this.moving = true;
        this.lastAttack = 0;
        this.assetLoader = assetLoader;
        this.attackInterval = 1000;
        this.isSpawned = false;

        this.animationActions = [];
        this.scene = scene;
        this.model = SkeletonUtils.clone(this.assetLoader.mutantModel);
        if (elite){
            this.model.scale.set(0.02, 0.02, 0.02);
            this.hp = 1000;
            this.attack = 100;
            this.moveSpeed = 5;
        }
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

        this.mixer.addEventListener('finished', (event) => {
            console.log(event);
            if (event.action === this.actions.die){
                scene.remove(this.model);
            }
        });
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
        this.model.position.set(200, -1.4, 200);
        this.spawn();
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

        this.actions.die.loop = THREE.LoopOnce;
        this.actions.die.clampWhenFinished = true; //makes sure that when the animation loop ends, the model stays still on the last frame of the animation

        this.animationActions.push(this.actions.run);
        this.animationActions.push(this.actions.attack);
        this.animationActions.push(this.actions.die);

        this.activeAction = this.actions.run;
        this.actions.run.play();

        this.scene.add(this.supportBox);
        this.scene.add(this.model);

        this.boundingBoxHelper = new Box3Helper(this.hitbox, 0xffff00);
        //this.scene.add(this.boundingBoxHelper);
    }

    setOnScene(){
        const radius = 40;
        const angle = Math.random()* 360;
        const spawnX = radius * Math.cos(angle);
        const spawnZ = radius * Math.sin(angle);

        //clone model from the loaded one
        this.model.position.set(this.target.model.position.x + spawnX, this.model.position.y, this.target.model.position.z + spawnZ);
        this.isSpawned = true;
    }

    moveTowards(object, delta, time){

        if (!this.isDead && this.isSpawned){
            const direction = new THREE.Vector3();
            direction.subVectors(this.target.model.position, this.model.position);
            //TODO
            this.model.rotation.y = Math.atan2(direction.x, direction.z);
            if (direction.length() > 2){
                direction.normalize();
                this.model.position.add(direction.multiplyScalar(this.moveSpeed * delta));
                this.animations.run();
            }
            else{
                this.animations.attack();
                if ((time - this.lastAttack) > this.attackInterval) {
                    this.target.applyDamage(this.attack);
                    this.lastAttack = time;
                }
            }
            this.updateHitbox();
        }
    }

    applyDamage(damage){
        this.hp -= damage;
        if (this.hp <= 0){
            this.isDead = true;
            this.animations.die();
            this.scene.remove(this.boundingBoxHelper);
            this.scene.remove(this.hitbox);
            this.scene.remove(this.supportBox);
        }
    }

    updateHitbox(){

        this.supportBox.position.copy(this.model.position);
        this.supportBox.position.y += 1.0;
        //this.supportBox.rotation.copy(this.model.rotation);
        this.hitbox.setFromObject(this.supportBox);
    }
}