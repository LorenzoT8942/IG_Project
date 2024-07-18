import * as THREE from "three";

export class ProjectileManager {

    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.projectileSpeed = 20;
        this.geometry = new THREE.SphereGeometry(0.1, 8, 4);
        this.material = new THREE.MeshBasicMaterial({color: "aqua"});
        this.sphereMesh = new THREE.Mesh(this.geometry, this.material);
    }

    spawnProjectile(direction, spawnPos) {
        let projectile = {
            mesh : this.sphereMesh,
            dir : direction.normalize()
        };

        projectile.mesh.position.copy(spawnPos);
        projectile.mesh.position.y += 1;
        //projectile.quaternion.copy(camera.quaternion);
        this.scene.add(projectile.mesh);
        this.projectiles.push(projectile);
    }

    updatePositions(delta) {
        this.projectiles.forEach(p => {
            p.mesh.translateZ(this.projectileSpeed * delta* p.dir.y);
            p.mesh.translateX(this.projectileSpeed * delta* p.dir.x);
        })
    }
}