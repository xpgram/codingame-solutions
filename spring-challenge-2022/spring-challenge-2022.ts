

/** An unmodifiable point in 2-dimensional space. */
export type ImmutablePointPrimitive = {
    readonly x: number,
    readonly y: number
}

/** Returns true if the given object is interpretable as a point primitive.
* The object's properties are assumed to be immutable to force style. */
export function isPointPrimitive(o: any): o is ImmutablePointPrimitive {
    return (typeof o.x === 'number' && typeof o.y === 'number');
}

/** Returns true if p is of the ImmutablePointPrimitive type. */
function isImmutablePointPrimitive(p: undefined | number | ImmutablePointPrimitive): p is ImmutablePointPrimitive {
    return (typeof p == 'object');  // ImmutablePointPrimitive is confirmed implicitly
}

/** Converts a point primitive or coords set to a Point object. */
function convertArgsToPoint(x: number | ImmutablePointPrimitive, y?: number) {
    return new Point(x, y);     // Relies on method defined in constructor.
}

/** A point in 2-dimensional space. */
export class Point {
    x: number = 0;
    y: number = 0;

    constructor(x?: number | ImmutablePointPrimitive, y?: number) {
        if (isImmutablePointPrimitive(x)) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x || 0;
            this.y = (typeof y == 'number') ? y : this.x;   // allows y = 0
        }
    }

    /** Given a point primitive or a set of coords, copies the described point by value.
     * y is assumed equal to x unless given. Returns self. */
    set(x: number | ImmutablePointPrimitive, y?: number) {
        const p = convertArgsToPoint(x, y);
        this.x = p.x;
        this.y = p.y;
        return this;
    }

    /** Returns a new vector: a value copy of this vector. */
    clone(): Point {
        return new Point().set(this);
    }

    /** Returns true if this point and the given point primitive or coords set are equal by value. */
    equal(x: number | ImmutablePointPrimitive, y?: number): boolean {
        const p = convertArgsToPoint(x, y);
        return (this.x === p.x && this.y === p.y);
    }

    /** Returns true if this point and the given point primitive or coords set are not equal by value. */
    notEqual(x: number | ImmutablePointPrimitive, y?: number): boolean {
        const p = convertArgsToPoint(x, y);
        return (this.x !== p.x || this.y !== p.y);
    }

    /** Returns a new vector: the sum of this and the given vector or vector coords.
     * y is assumed equal to x unless given. */
    add(x: number | ImmutablePointPrimitive, y?: number): Point {
        const p = convertArgsToPoint(x, y);
        return p.set(p.x + this.x, p.y + this.y);
    }

    /** Sums all points given with this one and returns the final vector as a point. */
    addAll(points: Point[]): Point {
        const list = [this, ...points];
        return list.reduce((sum, vector) => sum.add(vector));
    }

    /** Returns a new vector: the difference between this and the given vector or vector coords.
     * y is assumed equal to x unless given. */
    subtract(x: number | ImmutablePointPrimitive, y?: number): Point {
        const p = convertArgsToPoint(x, y);
        return this.add(p.negative());
    }

    /** Returns a new vector: the result of the given function applied to each vector component. */
    apply(f: (x: number) => number) {
        return this.clone().set(f(this.x), f(this.y));
    }

    /** Returns a new vector: the result of the given function applied to each pair of vector components.
     * `new Point(f(x1,x2), f(y1,y2))` */
    merge(f: (a: number, b: number) => number, x: number | ImmutablePointPrimitive, y?: number): Point {
        const p = new Point(x, y);
        return new Point(f(this.x, p.x), f(this.y, p.y));
    }

    /** Returns a new vector: this vector's additive inverse. */
    negative(): Point { return this.apply(x => -x); }

    /** Returns a new vector: this vector's absolute coordinates. */
    abs(): Point { return this.apply(Math.abs); }

    /** Returns a new vector: this vector's up-rounded coordinates. */
    ceil(): Point { return this.apply(Math.ceil); }

    /** Returns a new vector: this vector's down-rounded coordinates. */
    floor(): Point { return this.apply(Math.floor); }

    /** Returns a new vector: this vector's rounded coordinates. */
    round(): Point { return this.apply(Math.round); }

    /** Returns a new vector: this vector's truncated coordinates. */
    trunc(): Point { return this.apply(Math.trunc); }

    /** Returns a new vector: this vector's coordinates confined to
     * the dimensions described by the given point properties. */
    clamp(x: number | ImmutablePointPrimitive, y?: number): Point {
        const { min, max } = Math;
        const clamp = (x: number, lim: number) => min(max(x, 0), lim);
        return this.merge(clamp, new Point(x, y));
    }

    /** Returns this point's coordinates as a sum. */
    sumCoords() {
        return this.x + this.y;
    }

    /** Returns a new vector: the scalar product of this vector and some scalar coefficient. */
    multiply(scalar: number | ImmutablePointPrimitive, yscalar?: number) {
        const p = convertArgsToPoint(scalar, yscalar);
        return new Point(
            this.x * p.x,
            this.y * p.y,
        );
    }

    /** Returns a new vector: the inverse of this vector's coordinates via the function 1/x  
     * Either of this vector's coordinates which are 0 remain 0 after the operation.  
     * Use with .multiply() for scalar division. */
    inverse() {
        return this.apply(n => (n === 0) ? 0 : 1 / n);
    }

    /** Returns the dot product between this and the given vector. */
    dot(b: ImmutablePointPrimitive) {
        const a = this;
        return a.x * b.x + a.y * b.y;
    }

    /** Returns the z-coordinate of the cross product between this and the given vector. */
    crossZ(b: ImmutablePointPrimitive) {
        const a = this;
        return a.x * b.y - a.y * b.x;
    }

    /** Gets the integer grid-distance between this point and a given point primitive or coords set.
     * y is assumed equal to x unless given. */
    manhattanDistance(x: number | ImmutablePointPrimitive, y?: number): number {
        const v = convertArgsToPoint(x, y).subtract(this);
        return v.manhattanMagnitude();
    }

    /** Gets the real distance between this point and a given point primitive or coords set.
     * y is assumed equal to x unless given. */
    distance(x: number | ImmutablePointPrimitive, y?: number): number {
        const v = convertArgsToPoint(x, y).subtract(this);
        return v.magnitude();
    }

    /** Returns the length of this vector. */
    magnitude(): number {
        const { x, y } = this;
        return Math.sqrt(x * x + y * y);
    }

    /** Returns this vector's manhattan distance from the origin. */
    manhattanMagnitude() {
        return this.abs().sumCoords();
    }

    /** Returns an identity vector in the same direction as this.
     * If this vector has no length, the returned vector will be the origin <0,0>. */
    unit(): Point {
        const mag = this.magnitude();
        return (mag !== 0) ? this.multiply(1 / mag) : Point.Origin;
    }

    /** Returns this vector's counter-clockwise angle from the positive x-axis in radians.
     * Ranges between -pi and pi. At pi radians, only returns +pi. */
    angle() {
        const sign = Math.sign(this.crossZ(Point.Right));
        let angle = Math.acos(this.x / this.magnitude()) * sign;
        if (angle === 0) angle = ((this.x < 0) ? Math.PI : 0);
        return angle;
    }

    /** Returns this vector's counter-clockwise angle from the positive x-axis in radians.
     * Ranges between 0 and 2*pi */
    polarAngle() {
        const tau = 2 * Math.PI;
        return (tau - this.angle()) % tau;
    }

    /** Returns the absolute angle difference from this to the given vector. */
    angleDifference(b: Point) {
        const a = this;
        return Math.acos(a.dot(b) / (a.magnitude() * b.magnitude()));
    }

    /** Returns the angle rotation of vector a to b. */
    angleTo(b: Point) {
        const sign = Math.sign(this.crossZ(b));
        return this.angleDifference(b) * sign;
    }

    /** Returns an integer between -1 and 1 indicating the clockwise spin of the shortest
     * rotational difference between this vector and the given one. 1 is clockwise. */
    clockDirectionTo(b: Point) {
        return -Math.sign(this.crossZ(b));
    }

    /** Returns a Point object equivalent to this rotated by the angle of the given vector. */
    rotateByVector(x: number | ImmutablePointPrimitive, y?: number) {
        const v = convertArgsToPoint(x, y).unit();
        return new Point(
            this.x * v.x - this.y * v.y,
            this.x * v.y + this.y * v.x
        )
    }

    /** Returns this point as a string of the form `x y`. */
    toString(): string {
        return `${this.x} ${this.y}`;
    }

    /** Returns this point as a string of the form `(x/100 y/100)` */
    toLog(): string {
        const p = this.multiply(.01).round();
        return `${p.x},${p.y}`;
    }

    // Common Vectors

    /** Additive identity vector with all components set to zero. */
    static get Origin(): Point { return new Point(0, 0); }
    /** Alias for Point.Origin: the additive identity vector. */
    static get Zero(): Point { return Point.Origin; }
    /** Identity vector pointing conventionally up. */
    static get Up(): Point { return new Point(0, -1); }
    /** Identity vector pointing conventionally down. */
    static get Down(): Point { return new Point(0, 1); }
    /** Identity vector pointing conventionally left. */
    static get Left(): Point { return new Point(-1, 0); }
    /** Identity vector pointing conventionally right. */
    static get Right(): Point { return new Point(1, 0); }

    /** All point vectors describing an axis direction. */
    static get Cardinals(): Point[] {
        return [Point.Up, Point.Right, Point.Down, Point.Left];
    }
}










enum EntityType {
    Monster = 0,
    Hero = 1,
    Opponent = 2,
}

enum PlayerTarget {
    Neutral = 0,
    Allied = 1,
    Opponent = 2,
}

enum AiMode {
    Defender,
    Attacker,
}

module Constants {
    let inputs: string[] = readline().split(' ');

    export const basePos = new Point(parseInt(inputs[0]), parseInt(inputs[1]));
    export const heroesPerPlayer = parseInt(readline());

    export module board {
        export const width = 17630;
        export const height = 9000;
        export const dimensions = new Point(width, height);
        export const center = new Point(width / 2, height / 2);
    }

    export module playerBase {
        export const sightRadius = 6000;
        export const detectionRadius = 5000;
        export const vulnerableRadius = 300;
        export const dangerRadius = Math.floor(detectionRadius * 0.5);
    };

    export const hero = {
        sightRadius: 2200,
        attackRadius: 800,
        speed: 800,
        atkPower: 2,
        manaGainPerAttack: 1,
        manaCostPerSpell: 10,
    };

    export const monster = {
        speed: 400,
    };

    export module spell {
        export const wind = {
            effectRadius: 1280,
            pushDistance: 2200,
        };
        export const shield = {
            effectiveDistance: 2200,
            tickLength: 12,
        };
        export const control = {
            effectiveDistance: 2200,
        };
    }
}










interface EntityData {
    id: number;
    type: EntityType;
    position: Point;
    speed: Point;
    hp: number;
    shieldLife: number;
    isControlled: boolean;
    nearBase: boolean;
    threatFor: PlayerTarget;
}

function readEntityData(): EntityData {
    let inputs: string[] = readline().split(' ');

    let idx = -1;   // This should be a generator. I'm not writing a generator.
    // TODO Write a generator.
    function nextToken<T>(f: (s: string) => T) {
        idx++;
        return f(inputs[idx]);
    }

    return {
        id: nextToken(parseInt),
        type: nextToken(parseInt) as EntityType,
        position: new Point(nextToken(parseInt), nextToken(parseInt)),
        shieldLife: nextToken(parseInt),
        isControlled: nextToken(Boolean),
        hp: nextToken(parseInt),
        speed: new Point(nextToken(parseInt), nextToken(parseInt)),
        nearBase: nextToken(Boolean),
        threatFor: nextToken(parseInt) as PlayerTarget,
    }
}










interface GameObjectPackage {
    allyBase: Base;
    oppBase: Base;
    monsters: Monster[];
    heroes: Hero[];
    oppHeroes: OppHero[];
}

abstract class Entity {
    readonly game: GameObjectPackage;
    data: EntityData;

    constructor(game: GameObjectPackage) {
        this.game = game;
    }

    fill(data: EntityData): void {
        this.data = data;
    }

    nameId(): string {
        const ent_name: Record<EntityType, string> = {
            [EntityType.Monster]: "Mon",
            [EntityType.Hero]: "Hero",
            [EntityType.Opponent]: "Opp",
        }
        const { id, type } = this.data;
        return `${ent_name[type]} ${id}`;
    }

    distanceTo(other: Entity | Point): number {
        return this.data.position.distance( (isPointPrimitive(other) ? other : other.data.position ));
    }
}










class Monster extends Entity {

    get distanceFromDestination() { return this._distanceFromDestination; }
    private _distanceFromDestination: number = 0;

    targetedCount: number = 0;

    constructor(game: GameObjectPackage, data: EntityData) {
        super(game);
        this.fill(data);
        
        const travelTargets: Record<PlayerTarget, Point> = {
            [PlayerTarget.Neutral]: this.data.position,
            [PlayerTarget.Allied]: this.game.allyBase.position,
            [PlayerTarget.Opponent]: this.game.oppBase.position,
        };
        this._distanceFromDestination = travelTargets[this.data.threatFor].distance(this.data.position);
    }

    idealTargetCount(): number {
        if (this.data.threatFor === PlayerTarget.Neutral)
            return 0;

        const distance = this._distanceFromDestination - Constants.playerBase.vulnerableRadius;
        const stepsToBase = distance / Constants.monster.speed;
        const hitsToKill = this.data.hp / 2.0;
        const buffer = 0.25;
        return hitsToKill / stepsToBase + buffer;
    }

    remainingTargetCount(): number {
        return Math.max(0, this.idealTargetCount() - this.targetedCount);
    }

    pathIntersectsWithBase(base: Base): boolean {
        return false; // stub — I think actually threatFor already accounts for this.
    }

}










class OppHero extends Entity {
    // stub
    constructor(game: GameObjectPackage, data: EntityData) {
        super(game);
        this.fill(data);
    }
}










interface HeroMemory {
    heroId: number;
    role: AiMode;

    lastTarget?: Monster;
    target?: Monster;
    travelTarget?: Point;
    idle: boolean;

    wind: boolean;      // Convert to spell enum
    spellTargetId: number;

    noSwap: boolean;
}

class Hero extends Entity {

    mem: HeroMemory = {
        heroId: 0,
        role: AiMode.Defender,

        lastTarget: undefined,
        target: undefined,
        travelTarget: undefined,
        idle: true,

        wind: false,
        spellTargetId: 0,

        noSwap: false,
    }

    constructor(game: GameObjectPackage, data: EntityData) {
        super(game);
        this.fill(data);
        this.mem.heroId = data.id % Constants.heroesPerPlayer;
        console.assert(data.type === EntityType.Hero, `${this.nameId()} is not Hero: type=${data.type}`);
    }

    fill(data: EntityData) {
        super.fill(data);
        const mem = this.mem;
        mem.lastTarget = mem.target;
        mem.target = undefined;        // By default, none.
        mem.idle = true;
        mem.wind = false;
        mem.spellTargetId = 0;
        mem.noSwap = false;     // <- This is getting unwieldy.
        mem.role = (mem.heroId !== 1) ? AiMode.Defender : AiMode.Attacker;
    }


    protected getBaseRestingPose(): Point {
        const { position: basePos, sentryPoseVectors } = this.game.allyBase;
        const { mem } = this;

        const baseDistance = Constants.playerBase.sightRadius;
        const distFactor = (mem.role === AiMode.Defender) ? 1.0 : 1.25;
        const sliceVector = sentryPoseVectors[mem.heroId % sentryPoseVectors.length];
        return sliceVector.multiply(distFactor).multiply(baseDistance).add(basePos);
    }

    protected getAttackPose(target: Monster): Point {
        const { knownMonsters } = this.game.allyBase;

        const { attackRadius } = Constants.hero;
        const multiAttackRadius = attackRadius * 1.7;

        const nearbyAttackPoints = knownMonsters
            .filter(monster => monster.data.position.distance(target.data.position) < multiAttackRadius)
            .map(monster => monster.data.position);
        
        if (nearbyAttackPoints.length === 0)
            nearbyAttackPoints.push(target.data.position);
            // This should never happen, though.

        const averagePosition = nearbyAttackPoints
            .reduce((a, b) => a.add(b))
            .multiply(1 / nearbyAttackPoints.length);

        const distToTarget = target.data.position.distance(this.data.position);
        const distFactor = distToTarget / attackRadius;
        const projectedTravelVector = target.data.speed.multiply(distFactor);

        return averagePosition.add(projectedTravelVector);
    }

    protected setTarget(monster: Monster) {
        this.mem.target = monster;
        this.mem.target.targetedCount++;
        this.mem.idle = false;
    }

    protected setTravelLocation(location: Point) {
        if (location.equal(this.data.position))
            return;
        this.mem.travelTarget = location;
        this.mem.idle = false;
    }


    think(): void {
        const base = this.game.allyBase;

        const threatCount = base.threats.filter( m => m.targetedCount < m.idealTargetCount() ).length;
        const threatsHandled = (base.untargetedThreats() === false);
        console.error(`${this.nameId()} threats=${(threatsHandled) ? "OK" : threatCount}`);

        if (base.untargetedThreats()) {
            console.error(`c:Attack`);
            this.attack();
        }
        else {
            console.error(`c:Explore`);
            this.explore();
        }

        if (this.panicCheck()) {
            console.error(`c:Wind->GetOut`);
            this.mem.wind = true;
            this.mem.noSwap = true;
            // TODO This needs to be a phase after target designation, otherwise I can't
            // cull the candidates list by estimated kill time.
        }
    };

    protected panicCheck(): boolean {
        const { allyBase } = this.game;

        const candidates = allyBase.threats.filter( m => {
            const inRange = (m.distanceTo(this) <= Constants.spell.wind.effectRadius);
            const cantHandleInTime = (m.remainingTargetCount() > 0);
            const notShielded = (m.data.shieldLife === 0);
            return inRange && cantHandleInTime && notShielded;
        });

        return candidates.some( m => m.distanceFromDestination < Constants.playerBase.dangerRadius);
    }

    protected explore() {
        const { mem } = this;

        this.setTravelLocation(this.getBaseRestingPose());
        
        // TODO Wander mode: follow a randomly rotating lead, a carrot.

        const baseDistFactor = (mem.role === AiMode.Attacker) ? 2.25 : 1.5;
        const maxBaseDistance = Constants.playerBase.sightRadius * baseDistFactor;

        const { knownMonsters } = this.game.allyBase;
        const nearbyMonsters = knownMonsters
            .filter( monster => {
                const distFromBase = monster.data.position.distance(this.game.allyBase.position);
                const distFromSelf = monster.data.position.distance(this.data.position);
                const closeToSelf = (distFromSelf < Constants.hero.sightRadius);
                const farFromBase = (distFromBase > maxBaseDistance);
                const marked = (monster.targetedCount > 0);
                return closeToSelf && !farFromBase && !marked;
            });
        
        if (nearbyMonsters.length === 0)
            return;

        const closest = nearbyMonsters.reduce( (a,b) => {
            const a_dist = a.data.position.distance(this.data.position);
            const b_dist = b.data.position.distance(this.data.position);
            return (a_dist < b_dist) ? a : b;
        });

        this.setTarget(closest);
    }

    protected attack() {
        const { mem } = this;
        const base = this.game.allyBase;

        let potentialTargets = base.threats
            .filter( m => m.targetedCount < m.idealTargetCount() );
        
        if (potentialTargets.length === 0)
            potentialTargets = base.threats;
        
        const closest = potentialTargets.reduce( (a,b) => {
            const a_dist = a.data.position.distance(this.data.position);
            const b_dist = b.data.position.distance(this.data.position);
            return (a_dist < b_dist) ? a : b;
            // v Not ready for prime time.
            // return (a.remainingTargetCount() > b.remainingTargetCount()) ? a : b;
        });

        this.setTarget(closest);
    }

    swap(other: Hero) {
        const otherIsSelf = (this.data.id === other.data.id);
        const cantSwap = (this.mem.noSwap || other.mem.noSwap);
        if (otherIsSelf || cantSwap)
            return;

        const includeSelf = Number(!this.mem.idle);
        const includeOther= Number(!other.mem.idle);
        
        const pose = this.getMoveToPose();
        const otherPose = other.getMoveToPose();

        const curA = this.distanceTo(pose) * includeSelf;
        const curB = other.distanceTo(otherPose) * includeOther;

        const swapA = this.distanceTo(otherPose) * includeSelf;
        const swapB = other.distanceTo(pose) * includeOther;

        const distCur  = curA  + curB;
        const distSwap = swapA + swapB;

        // console.error(`swap? ${this.data.id}<->${other.data.id} cur=${distCur.toFixed(0)} swp=${distSwap.toFixed(0)}`);

        if (distSwap < distCur) {
            console.error(`${this.nameId()} <-> ${other.nameId()}`);
            // console.error(`: ${this.nameId()} idle=${1-includeSelf} cur=${curA.toFixed(0)} swp=${swapA.toFixed(0)}`);
            // console.error(`: ${other.nameId()} idle=${1-includeOther} cur=${curB.toFixed(0)} swp=${swapB.toFixed(0)}`);
            // console.error(`: totals        cur=${distCur.toFixed(0)} swp=${distSwap.toFixed(0)}`);
            const tmp = this.mem;
            this.mem = other.mem;
            other.mem = tmp;
        }
    }

    /** Called when Cmd -> "Move" */
    getMoveToPose(post?: boolean): Point {
        const { mem } = this;

        function log(msg: string) {
            if (post)
                console.error(msg);
        }

        if (mem.target) {
            log(`${this.nameId()} -> ${mem.target.nameId()}`);
            return this.getAttackPose(mem.target);
        }
        else if (mem.travelTarget) {
            log(`${this.nameId()} -> Resting Pose ${mem.travelTarget.trunc().toLog()}`);
            return mem.travelTarget;
        }
        else {
            log(`${this.nameId()} -> None`);
            return this.data.position;
        }
    }

    getCommand(): string {
        const canCast = this.game.allyBase.mana >= 10;

        if (canCast && this.data.shieldLife === 0 && this.game.oppHeroes.some( o => o.distanceTo(this) <= Constants.spell.control.effectiveDistance ))
            return `SPELL SHIELD ${this.data.id}`;

        if (canCast && this.mem.wind)
            return `SPELL WIND ${this.game.oppBase.position.toString()}`;

        const goal = this.getMoveToPose(true);
        return `MOVE ${goal.trunc().toString()}`;
    }

}










class Base {
    readonly id: PlayerTarget;
    readonly position: Point;
    readonly isPlayer1: boolean;

    hp: number;
    mana: number;

    readonly sentryPoseVectors: Point[] = [];

    get knownMonsters() { return this._knownMonsters; }
    private _knownMonsters: Monster[] = [];

    get threats() { return this._threats; }
    private _threats: Monster[] = [];

    constructor(playerId: PlayerTarget, position: Point) {
        this.id = playerId;
        this.position = position;
        this.isPlayer1 = position.equal(Point.Zero);

        // Build sentry poses
        const { sin, cos } = Math;
        const numPoints = Constants.heroesPerPlayer + 1;    // add angle=0
        const eta = Math.PI / 2.0;
        const angleSegment = eta / numPoints;

        const p2rotation = (this.isPlayer1) ? 0 : eta * 2;

        for (let i = 1; i < numPoints; i++) {               // i skips angle=0
            const angle = (angleSegment * i) + p2rotation;
            const p = new Point(cos(angle), sin(angle));
            this.sentryPoseVectors.push(p);
        }
    }

    readData() {
        let inputs: string[] = readline().split(' ');
        this.hp = parseInt(inputs[0]);
        this.mana = parseInt(inputs[1]);
    }

    updateEntities(monsters: Monster[]): void {
        this._knownMonsters = monsters;
        this._threats = this._knownMonsters
            .filter(monster => monster.data.threatFor === this.id)
            .sort((a, b) => a.idealTargetCount() - b.idealTargetCount());
    }

    untargetedThreats(): boolean {
        // console.error(`Threat Report:`);
        // for (let threat of this._threats) {
        //     console.error(threat.nameId(), `tc=${threat.targetedCount} /`, threat.idealTargetCount(), threat.distanceFromDestination)
        // }
        return (this._threats.some(threat => threat.targetedCount < threat.idealTargetCount()));
    }

    nameId(): string {
        return `Base ${this.id}:`;
    }

    toString(): string {
        return `${this.nameId()} ${this.position.toLog()} ${this.hp}hp ${this.mana}mp seen=${this._knownMonsters.length} threats=${this._threats.length}`;
    }
}










// game setup
const game: GameObjectPackage = {
    allyBase: new Base(PlayerTarget.Allied, Constants.basePos),
    oppBase: new Base(PlayerTarget.Opponent, Constants.basePos.subtract(Constants.board.dimensions).abs()),

    monsters: [],
    heroes: [],
    oppHeroes: [],
}

let seen_monsters: Monster[] = [];
let seen_enemies: OppHero[] = [];
const known_heroes: Record<number, Hero> = { };

// game loop
while (true) {
    // Reset structures
    const entityData: EntityData[] = [];
    seen_monsters = [];
    seen_enemies = [];
    
    game.allyBase.readData();
    game.oppBase.readData();

    // Collect raw entity information
    const entityCount: number = parseInt(readline()); // Amount of heros and monsters you can see
    for (let i = 0; i < entityCount; i++)
        entityData.push(readEntityData());

    // Helper function for entity-data record mapping below
    function fillRecord<T extends Entity>(record: Record<number, T>, type: new (game: GameObjectPackage, data: EntityData) => T, data: EntityData) {
        if (record[data.id] === undefined)
            record[data.id] = new type(game, data);
        else
            record[data.id].fill(data);
    }

    // Split entity data into categories; update frame-persistent objects.
    for (const data of entityData) {
        if (data.type === EntityType.Monster)
            seen_monsters.push(new Monster(game, data));
        else if (data.type === EntityType.Hero)
            fillRecord(known_heroes, Hero, data);
        else if (data.type === EntityType.Opponent)
            seen_enemies.push(new OppHero(game, data));
    }

    // Update game entities.
    game.monsters = seen_monsters;
    game.heroes = Object.values(known_heroes);
    game.oppHeroes = seen_enemies;

    game.allyBase.updateEntities(seen_monsters);
    console.error(game.allyBase.toString());
    
    for (let hero of Object.values(known_heroes))
        hero.think();

    // TODO Travel distance minimizing — Heroes should trade objectives.
    for (let k = 0; k < 2; k++) {
        for (const heroA of Object.values(known_heroes)) {
            for (const heroB of Object.values(known_heroes)) {
                heroA.swap(heroB);
            }
        }
    }

    // Reporting
    for (let monster of seen_monsters) {
        // if (monster.targetedCount > 0)
        //     console.error(`${monster.nameId()} tc=${monster.targetedCount}`);
    }

    // Yield final hero commands
    for (let hero of Object.values(known_heroes))
        console.log( hero.getCommand() );
}


/*

Okay, I think I need more food.
I also need to work real quick.
I can focus on this after.

I need to, in the mean time, come up with a more formal strategy for handling
hero responsibilies.

I need to know if they will WAIT or FORAGE or DEFEND or GOALIE or any others I come up with.

GOALIE is the reason. Being able to send a guy into prime base position for shoving
all the boys out is important. As it is, they do try, but they're keyed in for being
on top of the threats they're worried about, so they can't reach with WIND the snakes
coming in from the other side.

I should also come up with a formal strategy for both DEFEND, EXPLORE and ATTACK roles.
Like, when in DEFEND, what takes priority? WIND? CONTROL? When? Why? Which if both?
This is actually an easy question, I guess. CONTROL isn't useful out of the base,
and WIND definitely takes priority over regular attacking.

Maybe Base can have a threat threshold of like 3 or something, and if threats goes
above that, one hero, the closest one, will be picked to be goalie.

I need then a way to describe an action.
{
    where: Point,
    get distance() { ... }  // IDLE/WANDER has an effective distance of 0
    why: Forage | Defend | PushAway | SendToOpponent,
    priority: number,
}
This can then be converted into a proper string later.
Priority is just for overiding purposes. A 2 can't assume the place of a 5, for instance.

[ ] Implement instruction datatype
[ ] Cull unnecessary fields (Hero); a lot of those (some of) are messages between functions.
[ ] If an OppHero is a known entity, I need to cast shield right away.

*/
