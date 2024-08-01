import {Demon} from "./Demon.js";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import {UpgradeBox} from "./UpgradeBox.js";

export class LevelManager {

    constructor(scene, enemies, boxes, player, assetLoader, mapEdgeLength) {
        this.started = false;
        this.player = player;
        this.scene = scene;
        this.enemies = enemies;
        this.assetLoader = assetLoader;
        this.mapEdgeLength = mapEdgeLength;
        this.boxes = boxes;
    }

    start() {

        if (this.assetLoader.mutantLoaded && !this.started){
            this.started = true;

            this.spawnBox();

            setTimeout(() => {
                this.spawnEnemies(5);
            }, 2000)

            setTimeout(() => {
                this.spawnEnemies(5);
            }, 4000)

            setTimeout(() => {
                this.spawnEnemies(5);
            }, 8000)
        }
    }

    spawnEnemies(quantity){
        for(let i = 0; i < quantity; i++){
            this.enemies.push(new Demon(this.scene, this.assetLoader, this.player));
        }
    }

    spawnBox(){
        const box = new UpgradeBox(this.scene, this.assetLoader, this.player, this.mapEdgeLength );
        this.boxes.push(box);
        box.spawn();
    }







}