import * as THREE from "three";
import {SkeletonHelper} from "three";

export class Player {

    //Constructor
    constructor(scene, fbxLoader) {
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.attackDamage = 10;
        this.attackSpeed = 1;
        this. tripleShot = false;
        this.hpBar = document.getElementById("hp-bar");
        this.model = null;
        this.activeAction = null;
        this.lastAction = null;

        this.idleAction = null;
        this.runningAction = null;
        this.deathAction = null;

        this.mixer = null;
        this.headBone = null;
        this.modelReady = false;
        this.scene = scene;
        this.animationActions = [];
        this.fbxLoader = fbxLoader;
        this.hitbox = new THREE.Box3();


        this.animations = {
            idle: () => {
                this.setAction(this.animationActions[0]);
            },

            run: () => {
                this.setAction(this.animationActions[1]);
            },

            die: () => {
                this.setAction(this.animationActions[2]);
            }
        }
    }

    setAction = (toAction) => {
        /*if (toAction !== activeAction) {
            lastAction = activeAction;
            activeAction = toAction;
            //lastAction.stop();
            lastAction.fadeOut(0.3);a
            activeAction.reset();
            activeAction.fadeIn(0.3);
            activeAction.play();
            //lastAction.crossFadeTo(activeAction, 0.3, true).play();
        }s
        */
        this.lastAction = this.activeAction;
        this.activeAction = toAction;

        if (this.lastAction !== this.activeAction) {
            this.lastAction.fadeOut(0.2);
            this.activeAction.reset().fadeIn(0.2).play();
        }
    };


    load ()  {
        this.fbxLoader.load('/public/models/character/character.fbx', (fbx) => {
            this.model = fbx;
            this.model.scale.set(0.01, 0.01, 0.01);
            this.model.position.set(0, -1.4, 0);

            this.model.traverse(function (charModel) {
                if ( charModel.isObject3D)  charModel.castShadow = true;
            })

            this.scene.add(this.model);
            this.modelReady = true;
            this.mixer = new THREE.AnimationMixer(this.model);
            this.fbxLoader.load('/public/models/character/anim/idle.fbx', (idlefbx) => {
                this.idleAction = this.mixer.clipAction(idlefbx.animations[0]);
                this.animationActions.push(this.idleAction);
                this.activeAction = this.idleAction;
                this.idleAction.play();

            })
            this.fbxLoader.load('/public/models/character/anim/running.fbx', (runningfbx) => {
                this.runningAction = this.mixer.clipAction(runningfbx.animations[0]);
                this.animationActions.push(this.runningAction);
            })
            this.fbxLoader.load('/public/models/character/anim/player_death.fbx', (deathfbx) => {
                this.deathAction = this.mixer.clipAction(deathfbx.animations[0]);
                this.deathAction.loop = THREE.LoopOnce;
                this.deathAction.clampWhenFinished = true;
                this.animationActions.push(this.deathAction);
            })

            this.hitbox.setFromObject(this.model);
        })
    }

    applyDamage(damage){
        this.hp -= damage;
        const percentage = this.hp /this.maxHp * 100;
        this.hpBar.style.width = `${percentage}%`;
        if (this.hp <= 0){
            this.isDead = true;
            this.animations.die();

        }
    }

    applyUpgrade(){
        const random = Math.floor(Math.random()*3);
        switch (random) {
            case 0:
                this.attackDamage += 10;
                break;

            case 1:
                this.attackSpeed += 0.25;
                break;

            case 2:
                if (this.tripleShot === false){
                    this.tripleShot = true;
                }else{
                    this.applyUpgrade();
                }
                break;
        }
    }
}