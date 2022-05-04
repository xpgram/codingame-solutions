
/** Conforms record-type members to an extension of type T. */
const confirmType = <T>() => <R extends Record<string, T>>(obj: R) => obj;

module input {

  type InputConstructor<T> = (s: string) => T;

  let tokens = [] as string[];

  function getTokens() {
    if (tokens.length === 0)
      tokens = readline().split(' ');
  }

  export function token<T>(f: InputConstructor<T>): T {
    getTokens();
    return f(tokens.shift());
  }

  export function line() {
    getTokens();
    let s = tokens.join(' ');
    tokens = [];
    return s;
  }

  const types = confirmType<InputConstructor<any>>() ({
    'number': Number,
    'boolean': Boolean,
  })

  export function struct<T>(struct: T): T {
    let obj = {} as T;
    Object.entries(struct).forEach( ([key,val]) => {
      obj[key] = token(types[typeof val]);
    })
    return obj;
  }

}

module structs {

  export module init {

    export const data = {
      index: 0,
    }

  }

  export module frame {

    export const general = {
      day: 0,
      score: 0,
    }

    export const entity = {
      hp: 0,
    }

  }

}


// game setup

const cells = [] as typeof structs.init.data[];

for (let i=input.token(Number); i--;)
  cells.push( input.struct(structs.init.data) );

// game loop

while (true) {
  // frame data
  const data = {
    general: input.struct(structs.frame.general),
    trees: [] as typeof structs.frame.entity[],
  }

  for (let i=input.token(Number); i--;)
    data.trees.push( input.struct(structs.frame.entity) );

  // assemble data


  // turn logic


  // final
  console.log('WAIT');
}