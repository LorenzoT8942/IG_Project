import {Demon} from "./Demon.js";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';

export class LevelManager {

    constructor(scene, enemies, player, assetLoader) {
        this.started = false;
        this.player = player;
        this.scene = scene;
        this.enemies = enemies;
        this.assetLoader = assetLoader;
    }

    start() {

        if (!this.started){
            this.started = true;

            this.spawn(5);

            setTimeout(() => {
                this.spawn(5);
            }, 2000)

            setTimeout(() => {
                this.spawn(5);
            }, 4000)

            setTimeout(() => {
                this.spawn(5);
            }, 8000)
        }
    }

    spawn(quantity){
        for(let i = 0; i < quantity; i++){
            this.enemies.push(new Demon(this.scene, this.assetLoader, this.player));
        }
    }





}