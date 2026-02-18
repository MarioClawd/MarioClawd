import { Object3D, Box3, Vector3, Mesh, SkinnedMesh, BufferGeometry, MeshStandardMaterial } from 'three';

type EntityType = 'character' | 'enemy' | 'collectible' | 'platform' | 'pipe' | 'decoration';

interface EntityConfig {
  type: EntityType;
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  behavior?: BehaviorConfig;
  collider?: ColliderConfig;
}

interface BehaviorConfig {
  pattern: 'walk' | 'hop' | 'clap' | 'static' | 'rotate';
  speed?: number;
  range?: number;
  phase?: number;
}

interface ColliderConfig {
  type: 'box' | 'sphere';
  size?: [number, number, number];
  radius?: number;
  offset?: [number, number, number];
}

interface Entity {
  id: string;
  config: EntityConfig;
  object: Object3D;
  bounds: Box3;
  active: boolean;
  userData: Record<string, any>;
}

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private spatialGrid: Map<string, Set<string>> = new Map();
  private cellSize: number;
  private nextId: number = 0;

  constructor(cellSize: number = 16) {
    this.cellSize = cellSize;
  }

  public register(config: EntityConfig, object: Object3D): string {
    const id = `entity_${this.nextId++}`;

    object.position.set(...config.position);
    if (config.scale) object.scale.set(...config.scale);
    if (config.rotation) object.rotation.set(...config.rotation);

    const bounds = new Box3().setFromObject(object);

    const entity: Entity = {
      id,
      config,
      object,
      bounds,
      active: true,
      userData: {},
    };

    this.entities.set(id, entity);
    this.updateSpatialIndex(entity);

    return id;
  }

  public remove(id: string): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    this.removeSpatialIndex(entity);
    entity.object.removeFromParent();
    this.entities.delete(id);
  }

  public update(deltaTime: number, scrollProgress: number): void {
    for (const entity of this.entities.values()) {
      if (!entity.active) continue;

      const behavior = entity.config.behavior;
      if (!behavior) continue;

      switch (behavior.pattern) {
        case 'walk':
          this.updateWalkBehavior(entity, deltaTime, behavior);
          break;
        case 'hop':
          this.updateHopBehavior(entity, deltaTime, behavior);
          break;
        case 'clap':
          this.updateClapBehavior(entity, deltaTime, behavior);
          break;
        case 'rotate':
          this.updateRotateBehavior(entity, deltaTime, behavior);
          break;
      }

      entity.bounds.setFromObject(entity.object);
      this.updateSpatialIndex(entity);
    }
  }

  private updateWalkBehavior(
    entity: Entity,
    dt: number,
    config: BehaviorConfig
  ): void {
    const speed = config.speed ?? 2;
    const range = config.range ?? 3;
    const phase = config.phase ?? 0;

    const time = performance.now() / 1000 + phase;
    const baseX = entity.config.position[0];
    const offset = Math.sin(time * speed * 0.5) * range;

    entity.object.position.x = baseX + offset;
    entity.object.rotation.y = offset > 0 ? 0 : Math.PI;

    const wobble = Math.sin(time * speed * 4) * 0.05;
    entity.object.rotation.z = wobble;
  }

  private updateHopBehavior(
    entity: Entity,
    dt: number,
    config: BehaviorConfig
  ): void {
    const speed = config.speed ?? 3;
    const phase = config.phase ?? 0;

    const time = performance.now() / 1000 + phase;
    const baseY = entity.config.position[1];
    const hop = Math.abs(Math.sin(time * speed)) * 0.8;

    entity.object.position.y = baseY + hop;

    const squash = 1 + hop * 0.15;
    const stretch = 1 / Math.sqrt(squash);
    entity.object.scale.set(stretch, squash, stretch);
  }

  private updateClapBehavior(
    entity: Entity,
    dt: number,
    config: BehaviorConfig
  ): void {
    const speed = config.speed ?? 4;
    const phase = config.phase ?? 0;

    const time = performance.now() / 1000 + phase;
    const pulse = 1 + Math.sin(time * speed) * 0.2;

    entity.object.scale.x = pulse;
    entity.object.rotation.z = Math.sin(time * speed * 0.7) * 0.1;
  }

  private updateRotateBehavior(
    entity: Entity,
    dt: number,
    config: BehaviorConfig
  ): void {
    const speed = config.speed ?? 1;
    entity.object.rotation.y += speed * dt;
  }

  public queryRadius(center: Vector3, radius: number): Entity[] {
    const results: Entity[] = [];
    const minCell = this.worldToCell(
      center.x - radius,
      center.z - radius
    );
    const maxCell = this.worldToCell(
      center.x + radius,
      center.z + radius
    );

    const checked = new Set<string>();

    for (let cx = minCell.x; cx <= maxCell.x; cx++) {
      for (let cz = minCell.y; cz <= maxCell.y; cz++) {
        const key = `${cx},${cz}`;
        const ids = this.spatialGrid.get(key);
        if (!ids) continue;

        for (const id of ids) {
          if (checked.has(id)) continue;
          checked.add(id);

          const entity = this.entities.get(id);
          if (!entity || !entity.active) continue;

          const dist = entity.object.position.distanceTo(center);
          if (dist <= radius) {
            results.push(entity);
          }
        }
      }
    }

    return results;
  }

  private worldToCell(x: number, z: number): { x: number; y: number } {
    return {
      x: Math.floor(x / this.cellSize),
      y: Math.floor(z / this.cellSize),
    };
  }

  private updateSpatialIndex(entity: Entity): void {
    this.removeSpatialIndex(entity);
    const pos = entity.object.position;
    const cell = this.worldToCell(pos.x, pos.z);
    const key = `${cell.x},${cell.y}`;

    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, new Set());
    }
    this.spatialGrid.get(key)!.add(entity.id);
  }

  private removeSpatialIndex(entity: Entity): void {
    for (const [key, ids] of this.spatialGrid) {
      ids.delete(entity.id);
      if (ids.size === 0) this.spatialGrid.delete(key);
    }
  }

  public static bakeSkinnedMesh(skinned: SkinnedMesh): Mesh {
    const geometry = new BufferGeometry();
    const source = skinned.geometry;

    const posAttr = source.getAttribute('position');
    const positions = new Float32Array(posAttr.count * 3);
    const tempVec = new Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      tempVec.fromBufferAttribute(posAttr, i);
      skinned.boneTransform(i, tempVec);
      positions[i * 3] = tempVec.x;
      positions[i * 3 + 1] = tempVec.y;
      positions[i * 3 + 2] = tempVec.z;
    }

    geometry.setAttribute(
      'position',
      new (posAttr.constructor as any)(positions, 3)
    );

    if (source.index) geometry.setIndex(source.index.clone());
    if (source.getAttribute('normal'))
      geometry.setAttribute('normal', source.getAttribute('normal').clone());
    if (source.getAttribute('uv'))
      geometry.setAttribute('uv', source.getAttribute('uv').clone());

    const material = (skinned.material as MeshStandardMaterial).clone();
    return new Mesh(geometry, material);
  }

  public getById(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getByType(type: EntityType): Entity[] {
    return Array.from(this.entities.values()).filter(
      (e) => e.config.type === type
    );
  }

  public dispose(): void {
    this.entities.clear();
    this.spatialGrid.clear();
  }
}

