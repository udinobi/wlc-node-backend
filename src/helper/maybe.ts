/**
 * Cloned from https://github.com/bcherny/tsoption
 *
 * Added filter(), get(), ifDefined(), ifOrElse(), ifUndefined()
 */

/** @see https://github.com/fantasyland/fantasy-land#functor */
export interface FunctorNothing<T> {
    "fantasy-land/map"<U = T>(f: (value: T) => U): Nothing<U>;
}

/** @see https://github.com/fantasyland/fantasy-land#functor */
export interface FunctorJust<T> {
    "fantasy-land/map"<U = T>(f: (value: T) => U): Just<U>;
}

/** @see https://github.com/fantasyland/fantasy-land#chain */
export interface ChainNothing<T> {
    /* alias for flatMap */
    "fantasy-land/chain"<U = T>(f: (value: T) => Just<U>): Nothing<T>;
    "fantasy-land/chain"<U = T>(f: (value: T) => Nothing<U>): Nothing<T>;
}

/** @see https://github.com/fantasyland/fantasy-land#chain */
export interface ChainJust<T> {
    /* alias for flatMap */
    "fantasy-land/chain"<U = T>(f: (value: T) => Just<U>): Just<U>;
    "fantasy-land/chain"<U = T>(f: (value: T) => Nothing<U>): Nothing<T>;
}

/** @see https://github.com/fantasyland/fantasy-land#apply */
/** @see https://github.com/fantasyland/fantasy-land#applicative */
export interface ApplicativeNothing<T> {
    "fantasy-land/ap"(a: Just<(v: T) => T>): Nothing<T>;
    constructor: {
        "fantasy-land/of": typeof Nothing
    };
}

/** @see https://github.com/fantasyland/fantasy-land#apply */
/** @see https://github.com/fantasyland/fantasy-land#applicative */
export interface ApplicativeJust<T> {
    "fantasy-land/ap"(a: Just<(v: T) => T>): Just<T>;
    constructor: {
        "fantasy-land/of": typeof Just;
    };
}

/** @see https://github.com/fantasyland/fantasy-land#applicative */
export interface ApplicativeStatic {
    "fantasy-land/of": typeof Just;
}

/** @see https://github.com/fantasyland/fantasy-land#monad */
export interface MonadNothing<T> extends ApplicativeNothing<T>, FunctorNothing<T>, ChainNothing<T> {}

/** @see https://github.com/fantasyland/fantasy-land#monad */
export interface MonadJust<T> extends ApplicativeJust<T>, FunctorJust<T>, ChainJust<T> {}

export interface Nothing<T> extends MonadNothing<T> {
    filter(f: (value: T) => boolean): Nothing<T>;
    flatMap<U = T>(f: (value: T) => Just<U>): Nothing<T>;
    flatMap<U = T>(f: (value: T) => Nothing<U>): Nothing<T>;
    get(): T;
    getOrElse<U extends T>(def: U): U;
    ifDefined(f: (value: T) => void): void;
    ifOrElse(ifDef: (value: T) => void, ifUndef: () => void): void;
    ifUndefined(f: () => void): void;
    isEmpty(): this is Nothing<T> & true;
    map<U = T>(f: (value: T) => U): Nothing<U>;
    nonEmpty(): this is Just<T> & false;
    orElse<U extends T>(alternative: Nothing<U>): Nothing<T>;
    orElse<U extends T>(alternative: Just<U>): Just<U>;
    toString(): string;
}

export interface Just<T> extends MonadJust<T> {
    filter(f: (value: T) => boolean): Just<T>;
    flatMap<U = T>(f: (value: T) => Just<U>): Just<U>;
    flatMap<U = T>(f: (value: T) => Nothing<U>): Nothing<T>;
    get(): T;
    getOrElse<U extends T>(def: U): T;
    ifDefined(f: (value: T) => void): void;
    ifOrElse(ifDef: (value: T) => void, ifUndef: () => void): void;
    ifUndefined(f: () => void): void;
    isEmpty(): this is Nothing<T> & false;
    map<U = T>(f: (value: T) => U): Just<U>;
    nonEmpty(): this is Just<T> & true;
    orElse<U extends T>(alternative: Nothing<U>): Just<T>;
    orElse<U extends T>(alternative: Just<U>): Just<U>;
    toString(): string;
}

export type Maybe<T> = Just<T> | Nothing<T>;

export function Nothing<T>(): Nothing<T> {

    const filter = (f: (value: T) => boolean): any => nothing;
    const flatMap = <U>(f: (value: T) => Maybe<U>): Nothing<U> => Nothing<U>();

    /* tslint:disable:no-empty */
    const ifDefined = (f: (value: T) => void): void => {};

    const ifOrElse = (ifDef: (value: T) => void, ifUndef: () => void): void => ifUndef();
    const ifUndefined = (f: () => void): void => f();
    const map = <U>(f: (value: T) => U): any => nothing;

    const nothing: Nothing<T> = {
        filter,
        flatMap,
        get: () => { throw new ReferenceError("element is undefined"); },
        getOrElse: <U extends T>(def: U) => def,
        ifDefined,
        ifOrElse,
        ifUndefined,
        isEmpty: () => true,
        map,
        nonEmpty: () => false,
        orElse: <U extends T>(alternative: Maybe<U>): any => alternative,
        toString: () => "Nothing",

        // fantasyland
        constructor: {
            "fantasy-land/of": Nothing
        },
        "fantasy-land/ap": (_a: Just<(v: T) => T>): any => nothing,
        "fantasy-land/chain": flatMap,
        "fantasy-land/map": map
    };

    return nothing;
}

export function Just<T>(value: T): Just<T> {

    const filter = (f: (value: T) => boolean): any => Just(value);
    const flatMap = <U>(f: (value: T) => Maybe<U>): any => f(value);
    const ifDefined = (f: (value: T) => void): void => f(value);
    const ifOrElse = (ifDef: (value: T) => void, ifUndef: () => void): void => ifDef(value);

    /* tslint:disable:no-empty */
    const ifUndefined = (f: () => void): void => {};

    const map = <U>(f: (value: T) => U): any => Just(f(value));

    const just: Just<T> = {
        filter,
        flatMap,
        get: () => value,
        getOrElse: <U extends T>(def: U): T | U  => value || def,
        ifDefined,
        ifOrElse,
        ifUndefined,
        isEmpty: () => false,
        map,
        nonEmpty: () => true,
        orElse: <U extends T>(_alternative: Maybe<U>): any => Just(value),
        toString: () => `Just(${value})`,

        // fantasyland
        constructor: {
            "fantasy-land/of": Just
        },
        "fantasy-land/ap": (a: Just<(v: T) => T>): any => Just(a.get()(value)),
        "fantasy-land/chain": flatMap,
        "fantasy-land/map": map
    };

    return just;
}

export interface MaybeStatic {
    "fantasy-land/empty"<T>(): Nothing<T>;
    "fantasy-land/of": typeof Just;
    "fantasy-land/zero"<T>(): Nothing<T>;
    from<T = {}>(value: null | undefined): Nothing<T>;
    from<T>(value: T): Just<T>;
}

export const Maybe: MaybeStatic = {
    "fantasy-land/empty": <T>() => Nothing<T>(),
    "fantasy-land/of": Just,
    "fantasy-land/zero": <T>() => Nothing<T>(),
    from: <T>(value: T | null | undefined): any => value == null || value === undefined
        ? Nothing<T>()
        : Just<T>(value)
};
