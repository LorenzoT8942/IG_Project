import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import * as THREE from "three";

export class UpgradeBox {
    constructor(scene, assetLoader, player, mapEdgeLength) {
        this.scene = scene;
        this.mapEdgeLength = mapEdgeLength;
        this.player = player;
        this.model = SkeletonUtils.clone(assetLoader.boxModel);
        this.hitbox = new THREE.Box3();
        this.ignore = false;
        this.boxLight = null;
    }

    spawn(){
        const spawnX = Math.random() * this.mapEdgeLength - this.mapEdgeLength/2;
        const spawnY = Math.random() * this.mapEdgeLength - this.mapEdgeLength/2;
        //this.model.position.set(spawnX, 0.5 , -spawnY);
        this.model.position.set(0, -1 , 0);
        this.hitbox.setFromObject(this.model);
        this.scene.add(this.model);


        this.boxLight = new THREE.PointLight('#cd3dd6', 10, 5); // White light, full intensity, distance 100
        this.boxLight.position.set(0, 1, 0 ); // Set light position
        //pointLight.castShadow = true;
        this.boxLight.shadow.mapSize.height = window.innerHeight;
        this.boxLight.shadow.mapSize.width = window.innerWidth;
        this.boxLight.shadow.camera.near = 0.5;
        this.boxLight.shadow.camera.far = 1000;
        //this.boxLight.shadow.bias = 0.0003;
        this.scene.add(this.boxLight);


    }

    animate(){
        this.model.rotation.y += 0.01;
    }

    checkHit(){
        if (this.player.hitbox.intersectsBox(this.hitbox) && this.ignore === false) {
            this.scene.remove(this.model);
            this.scene.remove(this.hitbox);
            this.scene.remove(this.boxLight);
            this.ignore = true;
            console.log("bonus ottenuto");
            this.player.applyUpgrade();
        }
    }
}