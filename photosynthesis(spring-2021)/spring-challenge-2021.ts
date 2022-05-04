
/** Conforms record-type members to an extension of type T. */
const confirmType = <T>() => <R extends Record<string, T>>(obj: R) => obj;

/** A console-read module for codingame input. */
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

    export const cell = {
      index: 0,
      richness: 0,
      neigh0: 0,
      neigh1: 0,
      neigh2: 0,
      neigh3: 0,
      neigh4: 0,
      neigh5: 0,
    }

  }

  export module frame {

    export const general = {
      day: 0,
      nutrients: 0,
    }

    export const tree = {
      index: 0,
      size: 0,
      isMine: false,
      isDormant: false,
    }

    export const player = {
      sun: 0,
      score: 0,
    }

    export const opponent = {
      isWaiting: false,
      ...player,
    }

  }

}


// game setup

const cells = [] as typeof structs.init.cell[];

for (let i=input.token(Number); i--;)
  cells.push( input.struct(structs.init.cell) );


// game loop

while (true) {
  // frame data
  const data = {
    general: input.struct(structs.frame.general),
    player: input.struct(structs.frame.player),
    opponent: input.struct(structs.frame.opponent),
    trees: [] as typeof structs.frame.tree[],
    actions: [] as string[],
  }

  for (let i=input.token(Number); i--;)
    data.trees.push( input.struct(structs.frame.tree) );
  
  for (let i=input.token(Number); i--;)
    data.actions.push( input.line() );

  // assemble data


  // turn logic


  // final
  console.log(data.actions[0]);
}