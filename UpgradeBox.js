import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import * as THREE from "three";

export class UpgradeBox {
    constructor(scene, assetLoader) {
        this.model = SkeletonUtils.clone(assetLoader.boxModel);
        this.hitbox = new THREE.Box3();

    }

    spawn(){


        this.hitbox.setFromObject(this.model);
    }

    animate(){

    }

}