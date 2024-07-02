import * as THREE from "three";

export class Golem {

    constructor(scene, gltfLoader) {
        this.scene = scene;
        this.model = null;
        this.modelReady = false;
        this.gltfLoader = gltfLoader;
        this.animationActions = [];
    }

    load (){
        this.gltfLoader.load("/models/fire_elemental/scene.glft", (gltf) => {
            this.model = gltf;
            this.model.scale.set(0.01, 0.01, 0.01);
            this.model.position.set(0.0, -1.4, 0.0);

            this.model.traverse((charModel) => {
                if ( charModel.isObject3D )  charModel.castShadow = true;
            })
            console.log("animations", gltf.animations);
        })


    }
}