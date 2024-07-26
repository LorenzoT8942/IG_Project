import * as THREE from "three";

export class ProjectileManager {

    constructor(scene, enemies) {
        this.scene = scene;
        this.projectiles = [];
        this.projectileDamage = 10;
        this.projectileSpeed = 50;
        this.enemies = enemies;
        //this.geometry = new THREE.SphereGeometry(0.1, 8, 4);
        //this.material = new THREE.MeshBasicMaterial({color: "aqua"});
        //this.sphereMesh = new THREE.Mesh(this.geometry, this.material);
        //this.pBox = new THREE.Box3().setFromObject(this.sphereMesh);
    }

    spawnProjectile(direction, spawnPos) {
        console.log("ao");
        let geometry = new THREE.SphereGeometry(0.1, 8, 4);
        let material = new THREE.MeshBasicMaterial({color: "aqua"});
        let sphereMesh = new THREE.Mesh(geometry, material);
        let pBox = new THREE.Box3().setFromObject(sphereMesh);
        let projectile = {
            mesh : sphereMesh,
            dir : direction.normalize(),
            bb: pBox
        };

        projectile.mesh.position.copy(spawnPos);
        projectile.mesh.position.y += 1;
        projectile.bb.setFromObject(projectile.mesh);
        //projectile.quaternion.copy(camera.quaternion);
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
    }

    updatePositions(delta) {
        this.projectiles.forEach(p => {
            p.mesh.translateZ(this.projectileSpeed * delta* p.dir.y);
            p.mesh.translateX(this.projectileSpeed * delta* p.dir.x);
            p.bb.setFromObject(p.mesh);
            this.checkHit(p);
        })
    }

    checkHit(p){
        this.enemies.forEach(e => {
            if (e.hitbox.intersectsBox(p.bb)) {
                if (!e.isDead){
                    e.applyDamage(this.projectileDamage);
                    if (e.isDead){
                        this.removeProjectile(p);
                    }
                }

            }
        })
    }

    removeProjectile(projectile) {
        this.scene.remove(projectile.mesh);
        //TODO: also remove projectile from list of projectiles

    }
}