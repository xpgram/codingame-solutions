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


// Here

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
 * Warning: input is split by whitespace. String can only accept a single token from the line. Use readline() to get all tokens in the line.
 * ```
 * const [ num, bool, str ] = parseLine(Number, Boolean, String);
 * ``` */
function parseLine<T extends readonly ReadFunc<any>[]>(...types: T): ReturnTypes<T> {
  console.assert(types.length > 0, `At least 1 type-constructor is needed to specify output type.`);
  let inputs: string[] = readline().split(' ');
  return inputs.map((s, i) => types[i](s)) as any;
}

/** A type which infers an object type from a list of PropertyTuples. */
type ObjectFrom<T extends readonly PropertyTuple[]> = {
  -readonly [P in T[number]as P[0]]: Extract<P, PropertyTuple>[1] extends ReadFunc<infer R> ? R : never;
}

/** Given a list of PropertyTuples, reads from the input stream and returns an object literal
 * composed of the keys and return value types defined by the tuples. */
function parseStruct<T extends readonly PropertyTuple[]>(properties: T): ObjectFrom<T> {
  const keys = properties.map(f => f[0]);
  const funcs = properties.map(f => f[1]);
  const values = parseLine(...funcs);
  const record = {};
  for (let i = 0; i < values.length; i++)
    record[keys[i]] = values[i];
  return record as any;
}


module structs {

  export module init {
    export const data = <const>[
      ['index', Number],
    ]
  }

  export module frame {
    export const entity = <const>[
      ['hp', Number],
    ]
  }

}


// game setup
const cells = [] as ObjectFrom<typeof structs.init.data>[];

let [numberOfCells] = parseLine(Number);
while (numberOfCells--) {
  cells.push(parseStruct(structs.init.data));
}

// game loop
while (0) {
  // Frame setup
  const [day] = parseLine(Number);

  const entities = [] as ObjectFrom<typeof structs.frame.entity>[];
  for (let [i]=parseLine(Number); i--;)
    entities.push(parseStruct(structs.frame.entity));

  // Assemble data


  // Turn Logic


  // Final
  console.log('WAIT');
}