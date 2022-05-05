
/** Returns true if n is within the interval [min,max] */
function within(n: number, min: number, max: number) {
    return n >= min && n <= max;
}

/** Returns n confined to the interval [min,max] */
function clamp(n: number, nmin: number, nmax: number) {
    return Math.min(nmax, Math.max(0, nmin));
}

/** Validate Record types without losing inferred type.
 * 
 * Usage:
 * ```
 * const Dict = confirmType<Metadata>() ({ one: {...}, two: {...} })
 * ```
 */
const confirmType = <Req>() => <T extends Record<string, Req>>(obj: T) => obj;

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
        export const dangerRadius = Math.floor(detectionRadius * 0.8);
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
        isControlled: !nextToken(Boolean),  // ..?
        hp: nextToken(parseInt),
        speed: new Point(nextToken(parseInt), nextToken(parseInt)),
        nearBase: nextToken(Boolean),
        threatFor: nextToken(parseInt) as PlayerTarget,
    }
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

    sameEntity(other: Entity): boolean {
        return (this.data.id === other.data.id);
    }

    distanceTo(other: Entity | Base | Point): number {
        return this.data.position.distance(
            (isPointPrimitive(other)) && other ||
            (other instanceof Base)   && other.position ||
            (other as Entity).data.position
        );
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










module ActionFunction {

    export function getIntersectionPoint(hero: Hero, target: Monster, game: GameObjectPackage): Point {
        const { attackRadius } = Constants.hero;
        const multiAttackRadius = attackRadius * 1.7;

        const nearbyAttackPoints = game.monsters
            .filter(monster => !monster.sameEntity(target) && monster.distanceTo(target) < multiAttackRadius)
            .map(monster => monster.data.position);
        nearbyAttackPoints.push( target.data.position );    // Guarantee the list is never empty

        const averagePosition = nearbyAttackPoints
            .reduce((a, b) => a.add(b))
            .multiply(1 / nearbyAttackPoints.length);

        // Use the main target's speed vector to determine a good intersection point
        const distToTarget = hero.distanceTo(target);
        const distFactor = distToTarget / attackRadius;
        const projectedTravelVector = target.data.speed.multiply(distFactor);

        const intersectionPoint = averagePosition.add(projectedTravelVector);

        // console.error(`${hero.nameId()} -> ${target.nameId()} at ${target.data.position.toLog()} set to ${intersectionPoint.toLog()}`);

        return intersectionPoint;
    }

}










enum ActionType {
    Wait,
    Travel,
    Attack,
    Wind,
    Shield,
    Control,
}

enum SwapStyle {
    None,
    ExcludeDistance,
    Full,
}

interface Instruction {
    readonly action: ActionData;        // The Action to be conducted. This is for property references.
    readonly where?: Point;         // The point to be issued with the command; usually this will be where to move to.
    readonly entity?: Entity;       // The entity to target with the command. Besides reference, this is only used for its entId.
    readonly message?: string;      // Optional message to append
    readonly noOverride?: boolean;  // Set to true if this instruction cannot be overridden.
}

function instructionToCommand(ins: Instruction): string {
    return ins.action.cmd
        .replace('{where}', ins.where?.trunc().toString() ?? Point.Zero.toString())
        .replace('{id}', ins.entity?.data.id.toString() ?? '0');
}

interface ActionData {
    readonly label: string;
    readonly cmd: string;
    readonly type: ActionType;
    readonly swap: SwapStyle;
    trigger(hero: Hero, game: GameObjectPackage): boolean;
    execute(hero: Hero, game: GameObjectPackage): Instruction;
    swapReexecute(hero: Hero, ins: Instruction, game: GameObjectPackage);
}

const ActionData_Defaults = {
    swap: SwapStyle.Full,
    swapReexecute(hero, ins, game) { return ins; },
}

/** Actions which are focused on selecting and delegating responsibilities. */
const Action = confirmType<ActionData>() ({
    Defend: {
        ...ActionData_Defaults,
        label: "Defend",
        cmd: "MOVE {where} M{id}",
        type: ActionType.Attack,
        trigger(hero, game) {
            return game.allyBase.threats.some( m => m.remainingTargetCount() > 0 );
        },
        execute(hero, game) {
            const { threats } = game.allyBase;

            const isInDangerZone = (m: Monster) => (m.distanceTo(game.allyBase) < Constants.playerBase.detectionRadius);
            const isUnhandled = (m: Monster) => (m.remainingTargetCount() > 0);
            
            // Monsters targeting base
            const secondPotential = threats
                .filter(isUnhandled);

            // Monsters close to base
            const firstPotential = secondPotential
                .filter(isInDangerZone);
            
            // first > second > all(include already handled)
            const potentialTargets = (
                (firstPotential.length > 0) && firstPotential ||
                (secondPotential.length > 0) && secondPotential ||
                threats
            );

            function triageScore(monster: Monster): number {
                // TODO Current triage score over-prioritizes (exclusively) hero closeness, does not factor base closeness
                return monster.distanceTo(hero);
            }

            const closest = potentialTargets
                .map( monster => ({monster, score: triageScore(monster)}) )
                .reduce( (a,b) => (a.score < b.score) && a || b )
                .monster;

            return {
                action: this,
                where: ActionFunction.getIntersectionPoint(hero, closest, game),
                entity: closest,
            }
        },
        swapReexecute(hero, ins, game) {
            return {
                ...ins,
                where: ActionFunction.getIntersectionPoint(hero, ins.entity as Monster, game),
            }
        }
    },
    Hunt: <ActionData & {candidatesCache: Monster[]}>{
        candidatesCache: [],

        ...ActionData_Defaults,
        label: "Hunt",
        cmd: "MOVE {where} M{id}",
        type: ActionType.Attack,
        swap: SwapStyle.ExcludeDistance,
        trigger(hero, game) {
            const baseDistCoefficient = hero.memory.role.wanderingDistCoefficient;
            const maxBaseDistance = Constants.playerBase.sightRadius * baseDistCoefficient;

            const candidates = game.monsters.filter( monster => {
                const farFromBase = monster.distanceTo(game.allyBase) > maxBaseDistance;
                const closeToSelf = monster.distanceTo(hero) < Constants.hero.sightRadius;
                const marked      = monster.targetedCount > 0;
                const targOppBase = monster.data.threatFor === game.oppBase.id;
                return closeToSelf && !farFromBase && !marked && !targOppBase;
            })

            this.candidatesCache = candidates;
            return candidates.length > 0;
        },
        execute(hero, game) {
            const closest = this.candidatesCache
                .reduce( (a,b) => (a.distanceTo(hero) < b.distanceTo(hero)) && a || b );
            return {
                action: this,
                where: ActionFunction.getIntersectionPoint(hero, closest, game),
                entity: closest,
            }
        },
    },
    RestAtSentry: {
        ...ActionData_Defaults,
        label: "Sentry",
        cmd: "MOVE {where}",
        type: ActionType.Travel,
        swap: SwapStyle.ExcludeDistance,
        trigger() { return true; },
        execute(hero, game) {
            // TODO Wandering
            // We could follow a carrot-point which rotates ±15 degrees every frame.
            // We could have allyBase choose new resting poses (non-sentry) every 20 frames or so.

            const sliceVectors = game.allyBase.sentryPoseVectors;
            const restingDistCoefficient = hero.memory.role.restingDistCoefficient;
            const restingPose = sliceVectors[hero.memory.heroId % sliceVectors.length]
                .multiply(Constants.playerBase.sightRadius)
                .multiply(restingDistCoefficient)
                .add(game.allyBase.position);

            return {
                action: this,
                where: restingPose,
            }
        },
    },
    RestAtOppBase: {
        ...ActionData_Defaults,
        label: "Pressure",
        cmd: "MOVE {where}",
        type: ActionType.Travel,
        swap: SwapStyle.None,
        trigger() { return true; },
        execute(hero, game) {
            const sliceVectors = game.allyBase.sentryPoseVectors;
            const restingPose = sliceVectors[hero.memory.heroId % sliceVectors.length]
                .negative()
                .multiply(Constants.playerBase.sightRadius * .65)
                .add(game.oppBase.position);

            return {
                action: this,
                where: restingPose,
            }
        },
    },
    DoNothing: {
        ...ActionData_Defaults,
        label: "Wait",
        cmd: "WAIT",
        type: ActionType.Wait,
        swap: SwapStyle.ExcludeDistance,
        trigger() { return true; },
        execute() { return { action: this } },
    },
});

/** Special actions which are intended to circumstantially override regular ones. */
const SAction = confirmType<ActionData>() ({
    ProtectSelf: {
        ...ActionData_Defaults,
        label: "Protect->Self",
        cmd: "SPELL SHIELD {id}",
        type: ActionType.Shield,
        swap: SwapStyle.None,
        trigger(hero, game) {
            const timeCheck = game.time > 90;
            const notShielded = hero.data.shieldLife === 0;
            const nearbyOpp = game.oppHeroes.some( opp => opp.distanceTo(hero) < Constants.spell.control.effectiveDistance );
            return timeCheck && notShielded && nearbyOpp;
        },
        execute(hero, game) {
            return {
                action: this,
                entity: hero,
            }
        },
    },
    RepelFromBase: {
        ...ActionData_Defaults,
        label: "Repel",
        cmd: "SPELL WIND {where}",
        type: ActionType.Wind,
        swap: SwapStyle.None,
        trigger(hero, game) {
            return game.allyBase.threats.some( monster => {
                const inRange = (monster.distanceTo(hero) <= Constants.spell.wind.effectRadius);
                const cantHandleInTime = (monster.remainingTargetCount() > 0);
                const notShielded = (monster.data.shieldLife === 0);

                const dangerClose = (monster.distanceFromDestination < Constants.playerBase.dangerRadius);
                const baseEdge = within(
                    monster.distanceFromDestination,
                    Constants.playerBase.detectionRadius - Constants.spell.wind.pushDistance * .65,
                    Constants.playerBase.detectionRadius
                );

                const withinDistInterval = dangerClose || baseEdge;

                const alreadyPushed = game.heroes.some( hero => {
                    const inRange = hero.distanceTo(monster) < Constants.spell.wind.effectRadius;
                    const castingWind = hero.memory.instruction?.action.label === 'Repel';  // TODO I need a better check for this.
                    return inRange && castingWind;
                });

                return inRange && cantHandleInTime && notShielded && !alreadyPushed && withinDistInterval;
            })
        },
        execute(hero, game) {
            return {
                action: this,
                where: game.oppBase.position,
            }
        },
    },
    SweepToOpp: {
        ...ActionData_Defaults,
        label: "Push->Opp",
        cmd: "SPELL WIND {where}",
        type: ActionType.Wind,
        swap: SwapStyle.None,
        trigger(hero, game) {
            const timeCheck = game.time > 80;
            const nearby = game.monsters
                .filter( monster => {
                    const inRange = monster.distanceTo(hero) < Constants.spell.wind.effectRadius;
                    const pushable = monster.data.shieldLife === 0;
                    return inRange && pushable;
                });
            return timeCheck && nearby.length >= 3;
        },
        execute(hero, game) {
            return {
                action: this,
                where: game.oppBase.position,
            }
        }
    },
    DistractEnemy: {
        ...ActionData_Defaults,
        label: "OccupyOpponent",
        cmd: "SPELL CONTROL {id} {where}",
        type: ActionType.Control,
        swap: SwapStyle.None,
        trigger(hero, game) {
            const enoughMp = game.allyBase.mana > 120;
            const oppNearby = game.oppHeroes.some( opp => {
                const alreadyTargeted = game.heroes.some( h => h.getActionType(opp) === ActionType.Control );
                const nearby = opp.distanceTo(hero) < Constants.spell.control.effectiveDistance;
                const closeToBase = opp.distanceTo(game.allyBase) < Constants.playerBase.sightRadius * 1.5;
                const isControlled = opp.data.isControlled;
                return !alreadyTargeted && nearby && closeToBase && !isControlled;
            });
            return enoughMp && oppNearby;
        },
        execute(hero, game) {
            const closest = game.oppHeroes.reduce( (a,b) => a.distanceTo(hero) < b.distanceTo(hero) ? a : b );
            return {
                action: this,
                entity: closest,
                where: Constants.board.center,
            }
        }
    },
    ProtectOppThreats: <ActionData & {candidateCache: Monster[]}>{
        ...ActionData_Defaults,
        label: "Protect->Mon",
        cmd: "SPELL SHIELD {id}",
        type: ActionType.Shield,
        swap: SwapStyle.None,
        candidateCache: [],
        trigger(hero, game) {
            const manaLimit = (game.time < 120) ? 200 : 80;
            const enoughMp = game.allyBase.mana > manaLimit;

            const candidates = game.monsters.filter( monster => {
                const alreadyTargeted = game.heroes.some( h => h.getActionType(monster) === ActionType.Shield );
                const inRange = monster.distanceTo(hero) < Constants.spell.shield.effectiveDistance;
                const notShielded = monster.data.shieldLife === 0;
                const threatForOpp = monster.data.threatFor === game.oppBase.id;
                return !alreadyTargeted && inRange && notShielded && threatForOpp;
            });

            this.candidateCache = candidates;
            return enoughMp && candidates.length > 0;
        },
        execute(hero, game) {
            return {
                action: this,
                entity: this.candidateCache.shift(),
                where: game.oppBase.position,
            }
        },
    },
    SendToOpp: {
        ...ActionData_Defaults,
        label: "Send->Opp",
        cmd: "SPELL CONTROL {id} {where}",
        type: ActionType.Control,
        swap: SwapStyle.None,
        trigger(hero, game) {
            const manaLimit = (game.time < 120) ? 200 : 80;
            const enoughMp = game.allyBase.mana > manaLimit;
            const inWildlands = hero.distanceTo(game.allyBase) > Constants.playerBase.detectionRadius;
            const someCandidate = game.monsters.some( monster => {
                const alreadyTargeted = game.heroes.some( h => h.getActionType(monster) === ActionType.Control );
                const inRange = monster.distanceTo(hero) < Constants.spell.control.effectiveDistance;
                const inWildlands = monster.distanceTo(game.allyBase) > Constants.playerBase.detectionRadius;
                const isControlled = monster.data.isControlled;
                const threatForOpp = monster.data.threatFor === game.oppBase.id;
                return !alreadyTargeted && inRange && inWildlands && !isControlled && !threatForOpp;
            });
            return enoughMp && inWildlands && someCandidate;
        },
        execute(hero, game) {
            const inRange = game.monsters
                .filter( m => m.distanceTo(hero) < Constants.spell.control.effectiveDistance )
                .sort( (a,b) => b.distanceTo(hero) - a.distanceTo(hero) );
            return {
                action: this,
                entity: inRange.shift(),
                where: game.oppBase.position,
            }
        },
    },
});










interface JobConfig {
    restingDistCoefficient: number;
    wanderingDistCoefficient: number;
    jobs: {
        firstOrder: ActionData[],
        secondOrder: ActionData[],
    }
}

const Jobs_Default = {
    firstOrder: [
        Action.Defend,
        Action.Hunt,
        Action.RestAtSentry,
        Action.DoNothing,
    ],
    secondOrder: [
        SAction.ProtectSelf,
        SAction.RepelFromBase,
        SAction.DistractEnemy,
        SAction.SweepToOpp,
        SAction.ProtectOppThreats,
        SAction.SendToOpp,
    ],
}

const Job = confirmType<JobConfig>() ({
    Sentinel: {
        restingDistCoefficient: 0.7,
        wanderingDistCoefficient: 1.1,
        jobs: {
            firstOrder: [
                Action.Defend,
                Action.Hunt,
                Action.RestAtSentry,
                Action.DoNothing,
            ],
            secondOrder: [
                // .?
            ],
        }
    },
    Defender: {
        restingDistCoefficient: 1.1,
        wanderingDistCoefficient: 1.5,
        jobs: Jobs_Default,
    },
    Attacker: {
        restingDistCoefficient: 1.7,
        wanderingDistCoefficient: 2.25,
        jobs: Jobs_Default,
    },
    Pressurer: {
        restingDistCoefficient: 3.0,
        wanderingDistCoefficient: 5.0,
        jobs: {
            firstOrder: [
                // Action.Hunt,
                Action.RestAtOppBase,
                Action.DoNothing,
            ],
            secondOrder: [
                SAction.ProtectSelf,
                SAction.DistractEnemy,
                SAction.SweepToOpp,
                SAction.ProtectOppThreats,
                SAction.SendToOpp,
            ],
        }
    },
});










interface HeroMemory {
    heroId: number;
    role: JobConfig;
    instruction?: Instruction;
}

class Hero extends Entity {

    memory: HeroMemory = {
        heroId: 0,
        role: Job.Defender,
        instruction: undefined,
    }

    constructor(game: GameObjectPackage, data: EntityData) {
        super(game);
        this.memory.heroId = data.id % Constants.heroesPerPlayer;
        this.fill(data);
    }

    fill(data: EntityData) {
        super.fill(data);
        const mem = this.memory;
        mem.instruction = Action.DoNothing.execute();

        if (game.time < 50)
            mem.role = (mem.heroId !== 1) ? Job.Attacker : Job.Attacker;
        else if (game.time < 90)
            mem.role = (mem.heroId !== 1) ? Job.Attacker : Job.Pressurer;
        // else if (game.time < 130)
        //     mem.role = (mem.heroId !== 1) ? Job.Defender : Job.Attacker;
        else
            mem.role = (mem.heroId !== 1) ? Job.Defender : Job.Pressurer;
    }

    getActionType(entity: Entity): ActionType | undefined {
        const type = this.memory.instruction?.action.type;
        const targ = this.memory.instruction?.entity;
        if (type && targ && targ.sameEntity(entity))
            return type;
    }

    assignTarget(): void {
        // Reporting
        const base = this.game.allyBase;

        const threatCount = base.threats.filter(m => m.targetedCount < m.idealTargetCount()).length;
        const threatsHandled = (base.untargetedThreats() === false);
        console.error(`${this.nameId()} threats=${(threatsHandled) ? "OK" : threatCount}`);

        // Assignment
        const action = this.memory.role.jobs.firstOrder
            .find( action => action.trigger(this, this.game) );
        console.assert( Boolean(action), `${this.nameId()} couldn't pick a first order action.`);

        this.memory.instruction = action.execute(this, this.game);

        // Signal to other heroes that this monster is being targeted — when *should* this happen?
        const { entity } = this.memory.instruction;
        if (entity instanceof Monster)
            entity.targetedCount++;
    };

    considerSpecialAction(): void {
        if (this.memory.instruction.noOverride)
            return;

        const action = this.memory.role.jobs.secondOrder
            .find( action => action.trigger(this, this.game) );

        if (action)
            this.memory.instruction = action.execute(this, this.game);
    }

    swap(other: Hero) {
        const { instruction: insA } = this.memory;
        const { instruction: insB } = other.memory;

        const otherIsSelf = (this.data.id === other.data.id);
        const noSwapCheck = (ins: Instruction) => (ins.action.swap === SwapStyle.None);
        if (otherIsSelf || noSwapCheck(insA) || noSwapCheck(insB))
            return;

        console.assert(Boolean(insA.where) && Boolean(insB.where),
            `Swap check failed: one of ${this.nameId()} c:${insA.action.label} | ${other.nameId()} c:${insB.action.label} did not have a movement point. Was this on purpose?`);

        // If both instructions 'exclude distance', then neither do; they're the same priority-level action.
        const forceInclude = insA.action.swap === SwapStyle.ExcludeDistance && insA.action.swap === insB.action.swap;

        const includeDistCheck = (ins: Instruction) => (ins.action.swap === SwapStyle.Full || forceInclude);
        const includeDistA = Number(includeDistCheck(insA));
        const includeDistB = Number(includeDistCheck(insB));

        // Calc scenario distances to compare
        const poseA = insA.entity?.data.position || insA.where;
        const poseB = insB.entity?.data.position || insB.where;

        const curA = this.distanceTo(poseA) * includeDistA;
        const curB = other.distanceTo(poseB) * includeDistB;
        const distCur = curA + curB;

        const swapA = this.distanceTo(poseB) * includeDistA;
        const swapB = other.distanceTo(poseA) * includeDistB;
        const distSwap = swapA + swapB;

        if (distSwap < distCur) {
            console.error(`${this.nameId()} <-> ${other.nameId()} : ${distCur.toFixed(0)} > ${distSwap.toFixed(0)}`);
            // console.error(`: ${this.nameId()} idle=${1-includeDistA} cur=${curA.toFixed(0)} swp=${swapA.toFixed(0)}`);
            // console.error(`: ${other.nameId()} idle=${1-includeDistB} cur=${curB.toFixed(0)} swp=${swapB.toFixed(0)}`);
            // console.error(`: totals        cur=${distCur.toFixed(0)} swp=${distSwap.toFixed(0)}`);

            [ this.memory, other.memory ] = [ other.memory, this.memory ];
            this.memory.instruction = this.memory.instruction.action.swapReexecute(this, this.memory.instruction, this.game);
            other.memory.instruction = other.memory.instruction.action.swapReexecute(other, other.memory.instruction, other.game);
        }
    }

    getCommand(): string {
        const { entity, message } = this.memory.instruction

        const targetStr = entity && ` -> ${entity.nameId()}` || '';
        console.error(`${this.nameId()} c:${this.memory.instruction.action.label}${targetStr}`);

        return `${instructionToCommand(this.memory.instruction)} ${message ?? ''}`;
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

    get enemies() { return this._knownEnemies; }
    private _knownEnemies: OppHero[] = [];

    constructor(playerId: PlayerTarget, position: Point) {
        this.id = playerId;
        this.position = position;
        this.isPlayer1 = position.equal(Point.Zero);

        // Build sentry pose slices
        const { sin, cos } = Math;
        const numPoints = Constants.heroesPerPlayer + 1 + 2;    // add angle=0 + a few others ig
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

    updateEntities(monsters: Monster[], enemies: OppHero[]): void {
        this._knownMonsters = monsters;
        this._threats = this._knownMonsters
            .filter(monster => monster.data.threatFor === this.id)
            .sort((a, b) => a.idealTargetCount() - b.idealTargetCount());
        this._knownEnemies = enemies;

        // Report
        console.error(this.toString());
    }

    updateJobs(): void {
        console.error(`Base.updateJobs() not yet implemented.`)
        // TODO This would be where Base, by royal decree, requests certain jobs (AiModes) be taken up by its heroes.
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
        return `${this.nameId()} ${this.position.toLog()} ${this.hp}hp ${this.mana}mp seen=${this._knownMonsters.length} threats=${this._threats.length} opps=${this._knownEnemies.length}`;
    }
}










interface GameObjectPackage {
    allyBase: Base;
    oppBase: Base;
    time: number;
    monsters: Monster[];
    heroes: Hero[];
    oppHeroes: OppHero[];
}

// game setup
const game: GameObjectPackage = {
    allyBase: new Base(PlayerTarget.Allied, Constants.basePos),
    oppBase: new Base(PlayerTarget.Opponent, Constants.basePos.subtract(Constants.board.dimensions).abs()),
    time: -1,

    monsters: [],
    heroes: [],
    oppHeroes: [],
}

let seen_monsters: Monster[] = [];
let seen_enemies: OppHero[] = [];
const known_heroes: Record<number, Hero> = {};

// game loop
while (true) {
    // Reset structures
    const entityData: EntityData[] = [];
    seen_monsters = [];
    seen_enemies = [];

    game.time++;

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

    game.allyBase.updateEntities(seen_monsters, seen_enemies);

    // Assign targets/jobs to each hero
    for (const hero of game.heroes)
        hero.assignTarget();

    // Minimize travel distance among assigned targets. 
    for (const heroA of Object.values(known_heroes))
        for (const heroB of Object.values(known_heroes))
            heroA.swap(heroB);

    // Allow heroes to override their action under special circumstances
    for (const hero of game.heroes)
        hero.considerSpecialAction();

    // Yield final hero commands
    for (let hero of Object.values(known_heroes))
        console.log(hero.getCommand());
}
