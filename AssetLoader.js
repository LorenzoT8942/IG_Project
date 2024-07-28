

export class AssetLoader {
    constructor(gltfLoader, fbxLoader) {
        this.gltfLoader = gltfLoader;
        this.fbxLoader = fbxLoader;
        this.mutantModel = null;
        this.mutantRunAnim = null;
        this.mutantAttackAnim = null;
        this.mutantDeathAnim = null;
        this.mutantLoaded = false;
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


            this.fbxLoader.load('/public/models/mutant/anim/mutant_run.fbx', (run_fbx) => {
                this.mutantRunAnim = run_fbx.animations[0];

                this.fbxLoader.load('/public/models/mutant/anim/mutant_punch.fbx', (attack_fbx) => {
                    this.mutantAttackAnim = attack_fbx.animations[0];

                    this.fbxLoader.load('/public/models/mutant/anim/mutant_dying.fbx', (death_fbx) => {
                        this.mutantDeathAnim = death_fbx.animations[0];
                        this.mutantLoaded = true;
                        //console.log(this.mutantRunAnim);
                        //console.log(this.mutantDeathAnim);
                        //console.log(this.mutantAttackAnim);
                    })
                })
            })
        })
    }

    load(){
        this.loadMutant();
    }


}