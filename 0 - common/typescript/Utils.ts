
/**
 * Returns a function which returns a Record-type object with all members conforming to type T.  
 * Useful for defining dictionary-like structures without breaking intellisense.
 * ```
 * const dict = confirmType<DataStruct>() ({ Label1: {...}, ...})
 * ``` */
const confirmType = <T>() => <R extends Record<string, T>>(obj: R) => obj;

/** 
 * A helper type for parseLine.  
 * Represents a tuple of types which are the return values for a tuple of `string => any` functions.
 **/
type ReturnTypes<T extends Record<number, ((s: string) => any)>> = {
  -readonly [K in keyof T]: T[K] extends (s: string) => infer R ? R : never;
}

/**
 * Given a tuple of functions, reads input from the input-stream and returns a tuple of corresponding values.
 * ```
 * const [ num, bool, str ] = parseLine(Number, Boolean, String);
 * ``` */
function parseLine<T extends readonly ((s: string) => any)[]>(...types: T ): ReturnTypes<T> {
  let inputs: string[] = readline().split(' ');
  return inputs.map( (s,i) => types[i](s) ) as any;
}
