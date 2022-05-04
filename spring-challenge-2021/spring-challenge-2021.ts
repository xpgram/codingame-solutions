
/**
 * Returns a function which returns a Record-type object with all members conforming to type T.  
 * Useful for defining dictionary-like structures without breaking intellisense.
 * ```
 * const dict = confirmRecord<DataStruct>() ({ Label1: {...}, ...})
 * ``` */
const confirmType = <T>() => <R extends Record<string, T>>(obj: R) => obj;

/**
 * Defines a function which interprets a string as some other type.
 * Intended for input stream interpretation.
 */
type ReadFunc<T> = (s: string) => T;

/**
 * Defines a [key, (key) => value] tuple which is used by readData() to link input stream data
 * to type-inferred record types.
 */
type PropertyTuple = readonly [string, ReadFunc<any>];

/** 
 * A helper type for parseLine.  
 * Represents a tuple of types which are the return values for a tuple of `string => any` functions.
 **/
type ReturnTypes<T extends Record<number, ReadFunc<any>>> = {
  -readonly [K in keyof T]: T[K] extends ReadFunc<infer R> ? R : never;
}
 
/**
 * Given a tuple of functions, reads input from the input-stream and returns a tuple of corresponding values.
 * 
 * Warning: input is split by whitespace. String can only accept a single line token. Use readline() to get all tokens in the line.
 * ```
 * const [ num, bool, str ] = parseLine(Number, Boolean, String);
 * ``` */
function parseLine<T extends readonly ReadFunc<any>[]>(...types: T ): ReturnTypes<T> {
  let inputs: string[] = readline().split(' ');
  return inputs.map( (s,i) => types[i](s) ) as any;
}

/** A type which infers an object type from a list of PropertyTuples. */
type ObjectFrom<T extends readonly PropertyTuple[]> = {
  -readonly [P in T[number] as P[0]]: Extract<P, PropertyTuple>[1] extends ReadFunc<infer R> ? R: never;
}

/** Given a list of PropertyTuples, reads from the input stream and returns an object literal
 * composed of the keys and return value types defined by the tuples. */
function parseStruct<T extends readonly PropertyTuple[]>(properties: T) : ObjectFrom<T>
{
  const keys = properties.map( f => f[0] );
  const funcs = properties.map( f => f[1] );
  const values = parseLine(...funcs);
  const record = {};
  for (let i = 0; i < values.length; i++)
    record[keys[i]] = values[i];
  return record as any;
}


module structs {

  export const boardCell = <const>[
    ['index', Number],
    ['richness', Number],
    ['neigh0', Number],
    ['neigh1', Number],
    ['neigh2', Number],
    ['neigh3', Number],
    ['neigh4', Number],
    ['neigh5', Number],
  ];

  export const tree = <const>[
    ['index', Number],
    ['size', Number],
    ['isMine', Boolean],
    ['isDormant', Boolean],
  ];

  export const player = <const>[
    ['sun', Number],
    ['score', Number],
  ];

  export const opponent = <const>[
    ...player,
    ['isWaiting', Boolean],
  ];

}


// game setup
const cells = [] as ObjectFrom<typeof structs.boardCell>[];

let [ numberOfCells ] = parseLine(Number);
while (numberOfCells--) {
  cells.push( parseStruct(structs.boardCell) );
}
 
// game loop
while (true) {
  // Frame setup
  const day = parseLine(Number);        // the game lasts 24 days: 0-23
  const nutrients = parseLine(Number);  // the base score you gain from the next COMPLETE action
  const playerData = parseStruct(structs.player);
  const opponentData = parseStruct(structs.opponent);

  const celldata = [] as ObjectFrom<typeof structs.tree>[];

  let [ numberOfTrees ] = parseLine(Number);
  while (numberOfTrees--)
    celldata.push( parseStruct(structs.tree) );

  const actions = [] as string[];

  let [ possibleActions ] = parseLine(Number);
  while (possibleActions--)
    actions.push(readline());

  // Assemble data


  // Turn Logic


  // Final
  console.log(actions.shift());
 }



// Alt Below — Is this better?

let input: string[] = readline().split(' ');

function readToken<T>(f: (s: string) => T): T {
  const r = f(input.shift());
  if (input.length === 0)
    input = readline().split(' ');
  return r;
}

function readNum() { return readToken(Number); }
function readBool() { return readToken(Boolean); }

// game setup
const setup = {
  board: [
    ...new Array(readNum()).fill(undefined).map(n => {
      return {
        index: readNum(),
        richness: readNum(),
        n0: readNum(),
        n1: readNum(),
        n2: readNum(),
        n3: readNum(),
        n4: readNum(),
        n5: readNum(),
      }
    })
  ]
}

// game loop
while (true) {
  const frame = {
    day: readNum(),
    nutrients: readNum(),
    playerData: {
      sun: readNum(),
      score: readNum(),
    },
    oppData: {
      sun: readNum(),
      score: readNum(),
      isWaiting: readBool(),
    },
    cells: [
      ...new Array(readNum()).fill(undefined).map(n => {
        return {
          index: readNum(),
          size: readNum(),
          isMine: readBool(),
          isDormant: readBool(),
        }
      })
    ],
    actions: [
      ...new Array(readNum()).fill(undefined).map(n => readline()),
    ]
  }

  // Assemble data


  // Turn logic


  // Final
  console.log(frame.actions.shift());
}