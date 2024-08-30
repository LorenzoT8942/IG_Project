import * as THREE from "three";
import {texture} from "three/examples/jsm/nodes/accessors/TextureNode.js";

export class ProjectileManager {

    constructor(scene, enemies, texture) {
        this.scene = scene;
        this.projectiles = [];
        this.projectileSpeed = 50;
        this.enemies = enemies;
        this.projTexture =  texture;
        //this.geometry = new THREE.SphereGeometry(0.1, 8, 4);
        //this.material = new THREE.MeshBasicMaterial({color: "aqua"});
        //this.sphereMesh = new THREE.Mesh(this.geometry, this.material);
        //this.pBox = new THREE.Box3().setFromObject(this.sphereMesh);
    }

    spawnProjectile(direction, spawnPos, dmg) {
        let geometry = new THREE.SphereGeometry(0.1, 8, 4);
        let material = new THREE.MeshBasicMaterial({
            //color: "aqua"
            map: this.projTexture

        });
        let sphereMesh = new THREE.Mesh(geometry, material);
        let pBox = new THREE.Box3().setFromObject(sphereMesh);
        let projectile = {
            mesh : sphereMesh,
            dir : direction.normalize(),
            bb: pBox,
            damage: dmg,
            ignore: false,
            bounces: 3
        };

        projectile.mesh.position.copy(spawnPos);
        projectile.mesh.position.y += 1;
        projectile.bb.setFromObject(projectile.mesh);
        //projectile.quaternion.copy(camera.quaternion);
        this.projectiles.push(projectile);
        this.scene.add(projectile.mesh);
    }

    updatePositions(delta, collisionTime) {

        this.projectiles.forEach(p => {
            if (!p.ignore){
                p.mesh.translateZ(this.projectileSpeed * delta* p.dir.y);
                p.mesh.translateX(this.projectileSpeed * delta* p.dir.x);
                p.bb.setFromObject(p.mesh);
                this.checkHit(p, collisionTime);
            }
        })
    }

    checkHit(p, collisionTime){
        this.enemies.forEach(e => {
            if (e.hitbox.intersectsBox(p.bb) && p.ignore === false) {
                if (!e.isDead && e.isHittable(collisionTime)){
                    e.applyDamage(p.damage);
                    //console.log(`enemy has ${e.hp} HP`);
                    if (p.bounces > 0){
                        const normal = this.computeHitboxNormal(p.mesh, e.model);
                        p.dir = this.reflectDirection(p.dir, normal);
                        p.bounces -= 1;
                    }else{
                        this.removeProjectile(p);
                    }
                }
            }
        })
    }

    removeProjectile(projectile) {
        this.scene.remove(projectile.mesh);
        this.scene.remove(projectile.bb);
        projectile.ignore = true;
    }

    rotateVector(dir, angle) {
        const radians = angle * (Math.PI / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const xNew = dir.x * cos - dir.y * sin;
        const yNew = dir.x * sin + dir.y * cos;

        return new THREE.Vector2(xNew, yNew);
    }

    computeHitboxNormal(proj, hitbox) {
        // Get the center of the hitbox
        /*
        const hitboxCenter = hitbox.getCenter(new THREE.Vector3());
        console.log("hitbox center ", hitboxCenter);

        // Get the size of the hitbox
        const hitboxSize = hitbox.getSize(new THREE.Vector3());
        console.log("hitbox size ", hitboxSize);

        // Compute the relative position of the projectile to the center of the hitbox
        const relativePosition = projPos.clone().sub(hitboxCenter);
        console.log("relative position ", relativePosition);

        // Compare the relative position to the half-size of the hitbox to determine which face was hit
        const halfSize = hitboxSize.clone().multiplyScalar(0.5);
        const normal = new THREE.Vector3();

        if (Math.abs(relativePosition.x) > halfSize.x) {
            normal.x = Math.sign(relativePosition.x);  // Right or Left face
        } else if (Math.abs(relativePosition.z) > halfSize.z) {
            normal.z = Math.sign(relativePosition.z);  // Front or Back face
        }

        return normal.normalize();

         */
        let normal;
        const projWP = new THREE.Vector3();
        const hitboxWP = new THREE.Vector3();

        proj.getWorldPosition(projWP);
        hitbox.getWorldPosition(hitboxWP);

        const hitboxToProj = new THREE.Vector3();
        hitboxToProj.subVectors(projWP, hitboxWP);

        const max = Math.max(Math.abs(hitboxToProj.x), Math.abs(hitboxToProj.z));

        if (max === Math.abs(hitboxToProj.x)){
            if (hitboxToProj.x > 0){
                normal = new THREE.Vector3(1, 0, 0);
            }else if (hitboxToProj.x < 0){
                normal = new THREE.Vector3(-1, 0, 0);
            }
        }else if (max === Math.abs(hitboxToProj.z)){
            if (hitboxToProj.z > 0){
                normal = new THREE.Vector3(0, 0, 1);
            }else if (hitboxToProj.z < 0){
                normal = new THREE.Vector3(0, 0, -1);
            }
        }

        return normal;
    }

    reflectDirection(dir, normal) {
        const dir3 = new THREE.Vector3(dir.x, 0, dir.y);
        const dot = dir3.dot(normal);
        const newDir = dir3.clone().sub(normal.multiplyScalar(2 * dot));
        return new THREE.Vector2(newDir.x, newDir.z).normalize();
    }
}