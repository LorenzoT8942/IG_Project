import * as THREE from "three";
import {SkeletonHelper} from "three";

export class Player {

    //Constructor
    constructor(scene, fbxLoader) {
        this.model = null;
        this.activeAction = null;
        this.lastAction = null;
        this.idleAction = null;
        this.runningAction = null;
        this.mixer = null;
        this.headBone = null;
        this.modelReady = false;
        this.scene = scene;
        this.animationActions = [];
        this.fbxLoader = fbxLoader;


        this.animations = {
            idle: () => {
                this.setAction(this.animationActions[0]);
                },

            run: () => {
                this.setAction(this.animationActions[1]);
            }
        }
    }

    setAction = (toAction) => {
        /*if (toAction !== activeAction) {
            lastAction = activeAction;
            activeAction = toAction;
            //lastAction.stop();
            lastAction.fadeOut(0.3);
            activeAction.reset();
            activeAction.fadeIn(0.3);
            activeAction.play();
            //lastAction.crossFadeTo(activeAction, 0.3, true).play();
        }
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
            this.model.position.set(0.01, -1.4, 0.01);

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

            const skelHelper = new SkeletonHelper(this.model);
            this.scene.add(skelHelper);
            console.log(skelHelper.bones);
            skelHelper.bones.forEach(bone => {
                console.log(bone.name);
            })
            const boneName = "mixamorigHead";
            this.headBone = this.model.getObjectByName(boneName);
            if (this.headBone) console.log("headBone ", this.headBone);
        })
    }
}

