import * as THREE from 'three';
import {Demon} from "./Demon.js";

export class AssetLoader {
    constructor(gltfLoader, fbxLoader, enemies) {
        this.gltfLoader = gltfLoader;
        this.fbxLoader = fbxLoader;
        this.mutantModel = null;
        this.mutantRunAnim = null;
        this.mutantAttackAnim = null;
        this.mutantDeathAnim = null;
        this.mutantLoaded = false;

        this.boxModel = null;
        this.boxModelLoaded = false;

        this.enemies = enemies;
    }

    loadMutant(){
        this.fbxLoader.load("/models/mutant/mutant.fbx", (fbx) => {
            this.mutantModel = fbx;
            //console.log("model", this.model);
            this.mutantModel.scale.set(0.01, 0.01, 0.01);
            //this.model.scale.set(0.5, 0.5, 0.5);
            this.mutantModel.position.set(0.0, -1.4, 0.0);

            this.mutantModel.traverse((charModel) => {
                if (charModel.isObject3D )  charModel.castShadow = true;
            })

            this.fbxLoader.load('/models/mutant/anim/mutant_run.fbx', (run_fbx) => {
                this.mutantRunAnim = run_fbx.animations[0];

                this.fbxLoader.load('/models/mutant/anim/mutant_punch.fbx', (attack_fbx) => {
                    this.mutantAttackAnim = attack_fbx.animations[0];

                    this.fbxLoader.load('/models/mutant/anim/mutant_dying.fbx', (death_fbx) => {
                        this.mutantDeathAnim = death_fbx.animations[0];
                        this.mutantLoaded = true;
                    })
                })
            })
        })


    }

    loadUpgradeBox(){
        this.gltfLoader.load('/public/models/upgrade_box/scene.gltf', (gltf) => {
            this.boxModel = gltf.scene;
            this.boxModel.scale.set(0.03, 0.03, 0.03);

            this.boxModel.traverse(function (box) {
                if (box.isObject3D) {
                    box.castShadow = true;
                }
            })

            this.boxModelLoaded = true;
        })
    }

    load(){
        this.loadMutant();
        this.loadUpgradeBox();
    }
}