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
        this.defeatOverlay = document.getElementById("defeatOverlay");
        this.victoryOverlay = document.getElementById("victoryOverlay");
        this.victoryState = false;
        this.lastSpawned = -1;
        this.eliteSpawned = false;

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
        this.lastSpawned += 1;
        const newLast = this.lastSpawned + quantity;
        /*
        for(let i = this.lastSpawned; i < this.lastSpawned + quantity; i++){
            this.enemies.push(new Demon(this.scene, this.assetLoader, this.player));
        }

         */
        while (this.lastSpawned < newLast){
            this.enemies[this.lastSpawned].setOnScene();
            //console.log(this.lastSpawned);
            //console.log(this.enemies[this.lastSpawned]);
            this.lastSpawned++;
        }
    }

    spawnBoss (){
        this.enemies.push(new Demon(this.scene,  this.assetLoader,  this.player, true));
        this.enemies[this.enemies.length-1].setOnScene();
    }

    spawnBox(){
        const box = new UpgradeBox(this.scene, this.assetLoader, this.player, this.mapEdgeLength );
        this.boxes.push(box);
        box.spawn();
    }

    showDeadView (){
        this.defeatOverlay.style.visibility = 'visible';
    }

    showVictoryView () {
        this.victoryOverlay.style.visibility = 'visible';
        this.victoryState = true;
    }

    restart(){
        location.reload();
    }

    checkKillCount(){
        let kfe = 15;
        let counter = 0;

        //if (!this.eliteSpawned){
            this.enemies.forEach(enemy => {
                if (enemy.isDead) counter++;
            })

            if (counter === kfe && !this.eliteSpawned){
                this.spawnBoss();
                this.eliteSpawned = true;
            }

            if (counter === kfe + 1){
                //console.log("victory!");
                this.showVictoryView();
            }


        //}
    }







}