
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Wallet
 * 
 */
export type Wallet = $Result.DefaultSelection<Prisma.$WalletPayload>
/**
 * Model Transaction
 * 
 */
export type Transaction = $Result.DefaultSelection<Prisma.$TransactionPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model RefreshToken
 * 
 */
export type RefreshToken = $Result.DefaultSelection<Prisma.$RefreshTokenPayload>
/**
 * Model Notification
 * 
 */
export type Notification = $Result.DefaultSelection<Prisma.$NotificationPayload>
/**
 * Model Ride
 * 
 */
export type Ride = $Result.DefaultSelection<Prisma.$RidePayload>
/**
 * Model Booking
 * 
 */
export type Booking = $Result.DefaultSelection<Prisma.$BookingPayload>
/**
 * Model Review
 * 
 */
export type Review = $Result.DefaultSelection<Prisma.$ReviewPayload>
/**
 * Model DriverVerification
 * 
 */
export type DriverVerification = $Result.DefaultSelection<Prisma.$DriverVerificationPayload>
/**
 * Model ProvinceMapping
 * 
 */
export type ProvinceMapping = $Result.DefaultSelection<Prisma.$ProvinceMappingPayload>
/**
 * Model Location
 * 
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

export type Role = (typeof Role)[keyof typeof Role]


export const TransactionType: {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  PAYMENT: 'PAYMENT',
  RECEIVE_PAYMENT: 'RECEIVE_PAYMENT',
  REFUND: 'REFUND'
};

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]


export const TransactionStatus: {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
};

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus]


export const RideStatus: {
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export type RideStatus = (typeof RideStatus)[keyof typeof RideStatus]


export const BookingStatus: {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
};

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]


export const PaymentStatus: {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED'
};

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]


export const ReviewType: {
  DRIVER: 'DRIVER',
  PASSENGER: 'PASSENGER'
};

export type ReviewType = (typeof ReviewType)[keyof typeof ReviewType]


export const VerificationStatus: {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type TransactionType = $Enums.TransactionType

export const TransactionType: typeof $Enums.TransactionType

export type TransactionStatus = $Enums.TransactionStatus

export const TransactionStatus: typeof $Enums.TransactionStatus

export type RideStatus = $Enums.RideStatus

export const RideStatus: typeof $Enums.RideStatus

export type BookingStatus = $Enums.BookingStatus

export const BookingStatus: typeof $Enums.BookingStatus

export type PaymentStatus = $Enums.PaymentStatus

export const PaymentStatus: typeof $Enums.PaymentStatus

export type ReviewType = $Enums.ReviewType

export const ReviewType: typeof $Enums.ReviewType

export type VerificationStatus = $Enums.VerificationStatus

export const VerificationStatus: typeof $Enums.VerificationStatus

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.wallet`: Exposes CRUD operations for the **Wallet** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Wallets
    * const wallets = await prisma.wallet.findMany()
    * ```
    */
  get wallet(): Prisma.WalletDelegate<ExtArgs>;

  /**
   * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Transactions
    * const transactions = await prisma.transaction.findMany()
    * ```
    */
  get transaction(): Prisma.TransactionDelegate<ExtArgs>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs>;

  /**
   * `prisma.refreshToken`: Exposes CRUD operations for the **RefreshToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RefreshTokens
    * const refreshTokens = await prisma.refreshToken.findMany()
    * ```
    */
  get refreshToken(): Prisma.RefreshTokenDelegate<ExtArgs>;

  /**
   * `prisma.notification`: Exposes CRUD operations for the **Notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.NotificationDelegate<ExtArgs>;

  /**
   * `prisma.ride`: Exposes CRUD operations for the **Ride** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Rides
    * const rides = await prisma.ride.findMany()
    * ```
    */
  get ride(): Prisma.RideDelegate<ExtArgs>;

  /**
   * `prisma.booking`: Exposes CRUD operations for the **Booking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bookings
    * const bookings = await prisma.booking.findMany()
    * ```
    */
  get booking(): Prisma.BookingDelegate<ExtArgs>;

  /**
   * `prisma.review`: Exposes CRUD operations for the **Review** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Reviews
    * const reviews = await prisma.review.findMany()
    * ```
    */
  get review(): Prisma.ReviewDelegate<ExtArgs>;

  /**
   * `prisma.driverVerification`: Exposes CRUD operations for the **DriverVerification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DriverVerifications
    * const driverVerifications = await prisma.driverVerification.findMany()
    * ```
    */
  get driverVerification(): Prisma.DriverVerificationDelegate<ExtArgs>;

  /**
   * `prisma.provinceMapping`: Exposes CRUD operations for the **ProvinceMapping** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProvinceMappings
    * const provinceMappings = await prisma.provinceMapping.findMany()
    * ```
    */
  get provinceMapping(): Prisma.ProvinceMappingDelegate<ExtArgs>;

  /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locations
    * const locations = await prisma.location.findMany()
    * ```
    */
  get location(): Prisma.LocationDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Wallet: 'Wallet',
    Transaction: 'Transaction',
    Message: 'Message',
    RefreshToken: 'RefreshToken',
    Notification: 'Notification',
    Ride: 'Ride',
    Booking: 'Booking',
    Review: 'Review',
    DriverVerification: 'DriverVerification',
    ProvinceMapping: 'ProvinceMapping',
    Location: 'Location'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "user" | "wallet" | "transaction" | "message" | "refreshToken" | "notification" | "ride" | "booking" | "review" | "driverVerification" | "provinceMapping" | "location"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Wallet: {
        payload: Prisma.$WalletPayload<ExtArgs>
        fields: Prisma.WalletFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WalletFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WalletFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findFirst: {
            args: Prisma.WalletFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WalletFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          findMany: {
            args: Prisma.WalletFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          create: {
            args: Prisma.WalletCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          createMany: {
            args: Prisma.WalletCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WalletCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>[]
          }
          delete: {
            args: Prisma.WalletDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          update: {
            args: Prisma.WalletUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          deleteMany: {
            args: Prisma.WalletDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WalletUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.WalletUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WalletPayload>
          }
          aggregate: {
            args: Prisma.WalletAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWallet>
          }
          groupBy: {
            args: Prisma.WalletGroupByArgs<ExtArgs>
            result: $Utils.Optional<WalletGroupByOutputType>[]
          }
          count: {
            args: Prisma.WalletCountArgs<ExtArgs>
            result: $Utils.Optional<WalletCountAggregateOutputType> | number
          }
        }
      }
      Transaction: {
        payload: Prisma.$TransactionPayload<ExtArgs>
        fields: Prisma.TransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findFirst: {
            args: Prisma.TransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findMany: {
            args: Prisma.TransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          create: {
            args: Prisma.TransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          createMany: {
            args: Prisma.TransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          delete: {
            args: Prisma.TransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          update: {
            args: Prisma.TransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          deleteMany: {
            args: Prisma.TransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.TransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          aggregate: {
            args: Prisma.TransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTransaction>
          }
          groupBy: {
            args: Prisma.TransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TransactionCountArgs<ExtArgs>
            result: $Utils.Optional<TransactionCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      RefreshToken: {
        payload: Prisma.$RefreshTokenPayload<ExtArgs>
        fields: Prisma.RefreshTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RefreshTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RefreshTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          findFirst: {
            args: Prisma.RefreshTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RefreshTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          findMany: {
            args: Prisma.RefreshTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>[]
          }
          create: {
            args: Prisma.RefreshTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          createMany: {
            args: Prisma.RefreshTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RefreshTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>[]
          }
          delete: {
            args: Prisma.RefreshTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          update: {
            args: Prisma.RefreshTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          deleteMany: {
            args: Prisma.RefreshTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RefreshTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RefreshTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          aggregate: {
            args: Prisma.RefreshTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRefreshToken>
          }
          groupBy: {
            args: Prisma.RefreshTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<RefreshTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.RefreshTokenCountArgs<ExtArgs>
            result: $Utils.Optional<RefreshTokenCountAggregateOutputType> | number
          }
        }
      }
      Notification: {
        payload: Prisma.$NotificationPayload<ExtArgs>
        fields: Prisma.NotificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findFirst: {
            args: Prisma.NotificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findMany: {
            args: Prisma.NotificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          create: {
            args: Prisma.NotificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          createMany: {
            args: Prisma.NotificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NotificationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          delete: {
            args: Prisma.NotificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          update: {
            args: Prisma.NotificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.NotificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.NotificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
          }
        }
      }
      Ride: {
        payload: Prisma.$RidePayload<ExtArgs>
        fields: Prisma.RideFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RideFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RideFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>
          }
          findFirst: {
            args: Prisma.RideFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RideFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>
          }
          findMany: {
            args: Prisma.RideFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>[]
          }
          create: {
            args: Prisma.RideCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>
          }
          createMany: {
            args: Prisma.RideCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RideCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>[]
          }
          delete: {
            args: Prisma.RideDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>
          }
          update: {
            args: Prisma.RideUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>
          }
          deleteMany: {
            args: Prisma.RideDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RideUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RideUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RidePayload>
          }
          aggregate: {
            args: Prisma.RideAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRide>
          }
          groupBy: {
            args: Prisma.RideGroupByArgs<ExtArgs>
            result: $Utils.Optional<RideGroupByOutputType>[]
          }
          count: {
            args: Prisma.RideCountArgs<ExtArgs>
            result: $Utils.Optional<RideCountAggregateOutputType> | number
          }
        }
      }
      Booking: {
        payload: Prisma.$BookingPayload<ExtArgs>
        fields: Prisma.BookingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BookingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BookingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findFirst: {
            args: Prisma.BookingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BookingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findMany: {
            args: Prisma.BookingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          create: {
            args: Prisma.BookingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          createMany: {
            args: Prisma.BookingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BookingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          delete: {
            args: Prisma.BookingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          update: {
            args: Prisma.BookingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          deleteMany: {
            args: Prisma.BookingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BookingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BookingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          aggregate: {
            args: Prisma.BookingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBooking>
          }
          groupBy: {
            args: Prisma.BookingGroupByArgs<ExtArgs>
            result: $Utils.Optional<BookingGroupByOutputType>[]
          }
          count: {
            args: Prisma.BookingCountArgs<ExtArgs>
            result: $Utils.Optional<BookingCountAggregateOutputType> | number
          }
        }
      }
      Review: {
        payload: Prisma.$ReviewPayload<ExtArgs>
        fields: Prisma.ReviewFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReviewFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReviewFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          findFirst: {
            args: Prisma.ReviewFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReviewFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          findMany: {
            args: Prisma.ReviewFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          create: {
            args: Prisma.ReviewCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          createMany: {
            args: Prisma.ReviewCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReviewCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          delete: {
            args: Prisma.ReviewDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          update: {
            args: Prisma.ReviewUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          deleteMany: {
            args: Prisma.ReviewDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReviewUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ReviewUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          aggregate: {
            args: Prisma.ReviewAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReview>
          }
          groupBy: {
            args: Prisma.ReviewGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReviewGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReviewCountArgs<ExtArgs>
            result: $Utils.Optional<ReviewCountAggregateOutputType> | number
          }
        }
      }
      DriverVerification: {
        payload: Prisma.$DriverVerificationPayload<ExtArgs>
        fields: Prisma.DriverVerificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DriverVerificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DriverVerificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>
          }
          findFirst: {
            args: Prisma.DriverVerificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DriverVerificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>
          }
          findMany: {
            args: Prisma.DriverVerificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>[]
          }
          create: {
            args: Prisma.DriverVerificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>
          }
          createMany: {
            args: Prisma.DriverVerificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DriverVerificationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>[]
          }
          delete: {
            args: Prisma.DriverVerificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>
          }
          update: {
            args: Prisma.DriverVerificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>
          }
          deleteMany: {
            args: Prisma.DriverVerificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DriverVerificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.DriverVerificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DriverVerificationPayload>
          }
          aggregate: {
            args: Prisma.DriverVerificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDriverVerification>
          }
          groupBy: {
            args: Prisma.DriverVerificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<DriverVerificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.DriverVerificationCountArgs<ExtArgs>
            result: $Utils.Optional<DriverVerificationCountAggregateOutputType> | number
          }
        }
      }
      ProvinceMapping: {
        payload: Prisma.$ProvinceMappingPayload<ExtArgs>
        fields: Prisma.ProvinceMappingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProvinceMappingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProvinceMappingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>
          }
          findFirst: {
            args: Prisma.ProvinceMappingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProvinceMappingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>
          }
          findMany: {
            args: Prisma.ProvinceMappingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>[]
          }
          create: {
            args: Prisma.ProvinceMappingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>
          }
          createMany: {
            args: Prisma.ProvinceMappingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProvinceMappingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>[]
          }
          delete: {
            args: Prisma.ProvinceMappingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>
          }
          update: {
            args: Prisma.ProvinceMappingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>
          }
          deleteMany: {
            args: Prisma.ProvinceMappingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProvinceMappingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ProvinceMappingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProvinceMappingPayload>
          }
          aggregate: {
            args: Prisma.ProvinceMappingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProvinceMapping>
          }
          groupBy: {
            args: Prisma.ProvinceMappingGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProvinceMappingGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProvinceMappingCountArgs<ExtArgs>
            result: $Utils.Optional<ProvinceMappingCountAggregateOutputType> | number
          }
        }
      }
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>
        fields: Prisma.LocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocation>
          }
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>
            result: $Utils.Optional<LocationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    ridesAsDriver: number
    bookings: number
    reviewsSent: number
    reviewsReceived: number
    refreshTokens: number
    notifications: number
    sentMessages: number
    receivedMessages: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ridesAsDriver?: boolean | UserCountOutputTypeCountRidesAsDriverArgs
    bookings?: boolean | UserCountOutputTypeCountBookingsArgs
    reviewsSent?: boolean | UserCountOutputTypeCountReviewsSentArgs
    reviewsReceived?: boolean | UserCountOutputTypeCountReviewsReceivedArgs
    refreshTokens?: boolean | UserCountOutputTypeCountRefreshTokensArgs
    notifications?: boolean | UserCountOutputTypeCountNotificationsArgs
    sentMessages?: boolean | UserCountOutputTypeCountSentMessagesArgs
    receivedMessages?: boolean | UserCountOutputTypeCountReceivedMessagesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRidesAsDriverArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RideWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReviewsSentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReviewsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRefreshTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RefreshTokenWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSentMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReceivedMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }


  /**
   * Count Type WalletCountOutputType
   */

  export type WalletCountOutputType = {
    transactions: number
  }

  export type WalletCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | WalletCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * WalletCountOutputType without action
   */
  export type WalletCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WalletCountOutputType
     */
    select?: WalletCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WalletCountOutputType without action
   */
  export type WalletCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }


  /**
   * Count Type RideCountOutputType
   */

  export type RideCountOutputType = {
    bookings: number
    reviews: number
    messages: number
  }

  export type RideCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    bookings?: boolean | RideCountOutputTypeCountBookingsArgs
    reviews?: boolean | RideCountOutputTypeCountReviewsArgs
    messages?: boolean | RideCountOutputTypeCountMessagesArgs
  }

  // Custom InputTypes
  /**
   * RideCountOutputType without action
   */
  export type RideCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RideCountOutputType
     */
    select?: RideCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RideCountOutputType without action
   */
  export type RideCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }

  /**
   * RideCountOutputType without action
   */
  export type RideCountOutputTypeCountReviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
  }

  /**
   * RideCountOutputType without action
   */
  export type RideCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }


  /**
   * Count Type BookingCountOutputType
   */

  export type BookingCountOutputType = {
    transactions: number
  }

  export type BookingCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | BookingCountOutputTypeCountTransactionsArgs
  }

  // Custom InputTypes
  /**
   * BookingCountOutputType without action
   */
  export type BookingCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BookingCountOutputType
     */
    select?: BookingCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BookingCountOutputType without action
   */
  export type BookingCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    driverRating: number | null
    driverRatingCount: number | null
    passengerRating: number | null
    passengerRatingCount: number | null
  }

  export type UserSumAggregateOutputType = {
    driverRating: number | null
    driverRatingCount: number | null
    passengerRating: number | null
    passengerRatingCount: number | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
    avatarUrl: string | null
    bio: string | null
    role: $Enums.Role | null
    driverRating: number | null
    driverRatingCount: number | null
    passengerRating: number | null
    passengerRatingCount: number | null
    isDriverVerified: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    firstName: string | null
    lastName: string | null
    phone: string | null
    avatarUrl: string | null
    bio: string | null
    role: $Enums.Role | null
    driverRating: number | null
    driverRatingCount: number | null
    passengerRating: number | null
    passengerRatingCount: number | null
    isDriverVerified: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    password: number
    firstName: number
    lastName: number
    phone: number
    avatarUrl: number
    bio: number
    role: number
    driverRating: number
    driverRatingCount: number
    passengerRating: number
    passengerRatingCount: number
    isDriverVerified: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    driverRating?: true
    driverRatingCount?: true
    passengerRating?: true
    passengerRatingCount?: true
  }

  export type UserSumAggregateInputType = {
    driverRating?: true
    driverRatingCount?: true
    passengerRating?: true
    passengerRatingCount?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    password?: true
    firstName?: true
    lastName?: true
    phone?: true
    avatarUrl?: true
    bio?: true
    role?: true
    driverRating?: true
    driverRatingCount?: true
    passengerRating?: true
    passengerRatingCount?: true
    isDriverVerified?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    password?: true
    firstName?: true
    lastName?: true
    phone?: true
    avatarUrl?: true
    bio?: true
    role?: true
    driverRating?: true
    driverRatingCount?: true
    passengerRating?: true
    passengerRatingCount?: true
    isDriverVerified?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    password?: true
    firstName?: true
    lastName?: true
    phone?: true
    avatarUrl?: true
    bio?: true
    role?: true
    driverRating?: true
    driverRatingCount?: true
    passengerRating?: true
    passengerRatingCount?: true
    isDriverVerified?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    password: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    avatarUrl: string | null
    bio: string | null
    role: $Enums.Role
    driverRating: number
    driverRatingCount: number
    passengerRating: number
    passengerRatingCount: number
    isDriverVerified: boolean
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    firstName?: boolean
    lastName?: boolean
    phone?: boolean
    avatarUrl?: boolean
    bio?: boolean
    role?: boolean
    driverRating?: boolean
    driverRatingCount?: boolean
    passengerRating?: boolean
    passengerRatingCount?: boolean
    isDriverVerified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ridesAsDriver?: boolean | User$ridesAsDriverArgs<ExtArgs>
    bookings?: boolean | User$bookingsArgs<ExtArgs>
    reviewsSent?: boolean | User$reviewsSentArgs<ExtArgs>
    reviewsReceived?: boolean | User$reviewsReceivedArgs<ExtArgs>
    refreshTokens?: boolean | User$refreshTokensArgs<ExtArgs>
    notifications?: boolean | User$notificationsArgs<ExtArgs>
    sentMessages?: boolean | User$sentMessagesArgs<ExtArgs>
    receivedMessages?: boolean | User$receivedMessagesArgs<ExtArgs>
    wallet?: boolean | User$walletArgs<ExtArgs>
    driverVerification?: boolean | User$driverVerificationArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    firstName?: boolean
    lastName?: boolean
    phone?: boolean
    avatarUrl?: boolean
    bio?: boolean
    role?: boolean
    driverRating?: boolean
    driverRatingCount?: boolean
    passengerRating?: boolean
    passengerRatingCount?: boolean
    isDriverVerified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    password?: boolean
    firstName?: boolean
    lastName?: boolean
    phone?: boolean
    avatarUrl?: boolean
    bio?: boolean
    role?: boolean
    driverRating?: boolean
    driverRatingCount?: boolean
    passengerRating?: boolean
    passengerRatingCount?: boolean
    isDriverVerified?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ridesAsDriver?: boolean | User$ridesAsDriverArgs<ExtArgs>
    bookings?: boolean | User$bookingsArgs<ExtArgs>
    reviewsSent?: boolean | User$reviewsSentArgs<ExtArgs>
    reviewsReceived?: boolean | User$reviewsReceivedArgs<ExtArgs>
    refreshTokens?: boolean | User$refreshTokensArgs<ExtArgs>
    notifications?: boolean | User$notificationsArgs<ExtArgs>
    sentMessages?: boolean | User$sentMessagesArgs<ExtArgs>
    receivedMessages?: boolean | User$receivedMessagesArgs<ExtArgs>
    wallet?: boolean | User$walletArgs<ExtArgs>
    driverVerification?: boolean | User$driverVerificationArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      ridesAsDriver: Prisma.$RidePayload<ExtArgs>[]
      bookings: Prisma.$BookingPayload<ExtArgs>[]
      reviewsSent: Prisma.$ReviewPayload<ExtArgs>[]
      reviewsReceived: Prisma.$ReviewPayload<ExtArgs>[]
      refreshTokens: Prisma.$RefreshTokenPayload<ExtArgs>[]
      notifications: Prisma.$NotificationPayload<ExtArgs>[]
      sentMessages: Prisma.$MessagePayload<ExtArgs>[]
      receivedMessages: Prisma.$MessagePayload<ExtArgs>[]
      wallet: Prisma.$WalletPayload<ExtArgs> | null
      driverVerification: Prisma.$DriverVerificationPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      password: string
      firstName: string | null
      lastName: string | null
      phone: string | null
      avatarUrl: string | null
      bio: string | null
      role: $Enums.Role
      driverRating: number
      driverRatingCount: number
      passengerRating: number
      passengerRatingCount: number
      isDriverVerified: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ridesAsDriver<T extends User$ridesAsDriverArgs<ExtArgs> = {}>(args?: Subset<T, User$ridesAsDriverArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findMany"> | Null>
    bookings<T extends User$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, User$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany"> | Null>
    reviewsSent<T extends User$reviewsSentArgs<ExtArgs> = {}>(args?: Subset<T, User$reviewsSentArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany"> | Null>
    reviewsReceived<T extends User$reviewsReceivedArgs<ExtArgs> = {}>(args?: Subset<T, User$reviewsReceivedArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany"> | Null>
    refreshTokens<T extends User$refreshTokensArgs<ExtArgs> = {}>(args?: Subset<T, User$refreshTokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findMany"> | Null>
    notifications<T extends User$notificationsArgs<ExtArgs> = {}>(args?: Subset<T, User$notificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany"> | Null>
    sentMessages<T extends User$sentMessagesArgs<ExtArgs> = {}>(args?: Subset<T, User$sentMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany"> | Null>
    receivedMessages<T extends User$receivedMessagesArgs<ExtArgs> = {}>(args?: Subset<T, User$receivedMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany"> | Null>
    wallet<T extends User$walletArgs<ExtArgs> = {}>(args?: Subset<T, User$walletArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    driverVerification<T extends User$driverVerificationArgs<ExtArgs> = {}>(args?: Subset<T, User$driverVerificationArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly firstName: FieldRef<"User", 'String'>
    readonly lastName: FieldRef<"User", 'String'>
    readonly phone: FieldRef<"User", 'String'>
    readonly avatarUrl: FieldRef<"User", 'String'>
    readonly bio: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly driverRating: FieldRef<"User", 'Float'>
    readonly driverRatingCount: FieldRef<"User", 'Int'>
    readonly passengerRating: FieldRef<"User", 'Float'>
    readonly passengerRatingCount: FieldRef<"User", 'Int'>
    readonly isDriverVerified: FieldRef<"User", 'Boolean'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.ridesAsDriver
   */
  export type User$ridesAsDriverArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    where?: RideWhereInput
    orderBy?: RideOrderByWithRelationInput | RideOrderByWithRelationInput[]
    cursor?: RideWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RideScalarFieldEnum | RideScalarFieldEnum[]
  }

  /**
   * User.bookings
   */
  export type User$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * User.reviewsSent
   */
  export type User$reviewsSentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    cursor?: ReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * User.reviewsReceived
   */
  export type User$reviewsReceivedArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    cursor?: ReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * User.refreshTokens
   */
  export type User$refreshTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    where?: RefreshTokenWhereInput
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    cursor?: RefreshTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * User.notifications
   */
  export type User$notificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * User.sentMessages
   */
  export type User$sentMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * User.receivedMessages
   */
  export type User$receivedMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * User.wallet
   */
  export type User$walletArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    where?: WalletWhereInput
  }

  /**
   * User.driverVerification
   */
  export type User$driverVerificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    where?: DriverVerificationWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Wallet
   */

  export type AggregateWallet = {
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  export type WalletAvgAggregateOutputType = {
    rideBalance: number | null
    driverEarnings: number | null
  }

  export type WalletSumAggregateOutputType = {
    rideBalance: number | null
    driverEarnings: number | null
  }

  export type WalletMinAggregateOutputType = {
    id: string | null
    userId: string | null
    rideBalance: number | null
    driverEarnings: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WalletMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    rideBalance: number | null
    driverEarnings: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WalletCountAggregateOutputType = {
    id: number
    userId: number
    rideBalance: number
    driverEarnings: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WalletAvgAggregateInputType = {
    rideBalance?: true
    driverEarnings?: true
  }

  export type WalletSumAggregateInputType = {
    rideBalance?: true
    driverEarnings?: true
  }

  export type WalletMinAggregateInputType = {
    id?: true
    userId?: true
    rideBalance?: true
    driverEarnings?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WalletMaxAggregateInputType = {
    id?: true
    userId?: true
    rideBalance?: true
    driverEarnings?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WalletCountAggregateInputType = {
    id?: true
    userId?: true
    rideBalance?: true
    driverEarnings?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WalletAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallet to aggregate.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Wallets
    **/
    _count?: true | WalletCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WalletAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WalletSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WalletMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WalletMaxAggregateInputType
  }

  export type GetWalletAggregateType<T extends WalletAggregateArgs> = {
        [P in keyof T & keyof AggregateWallet]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWallet[P]>
      : GetScalarType<T[P], AggregateWallet[P]>
  }




  export type WalletGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WalletWhereInput
    orderBy?: WalletOrderByWithAggregationInput | WalletOrderByWithAggregationInput[]
    by: WalletScalarFieldEnum[] | WalletScalarFieldEnum
    having?: WalletScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WalletCountAggregateInputType | true
    _avg?: WalletAvgAggregateInputType
    _sum?: WalletSumAggregateInputType
    _min?: WalletMinAggregateInputType
    _max?: WalletMaxAggregateInputType
  }

  export type WalletGroupByOutputType = {
    id: string
    userId: string
    rideBalance: number
    driverEarnings: number
    createdAt: Date
    updatedAt: Date
    _count: WalletCountAggregateOutputType | null
    _avg: WalletAvgAggregateOutputType | null
    _sum: WalletSumAggregateOutputType | null
    _min: WalletMinAggregateOutputType | null
    _max: WalletMaxAggregateOutputType | null
  }

  type GetWalletGroupByPayload<T extends WalletGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WalletGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WalletGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WalletGroupByOutputType[P]>
            : GetScalarType<T[P], WalletGroupByOutputType[P]>
        }
      >
    >


  export type WalletSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    rideBalance?: boolean
    driverEarnings?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    transactions?: boolean | Wallet$transactionsArgs<ExtArgs>
    _count?: boolean | WalletCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    rideBalance?: boolean
    driverEarnings?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["wallet"]>

  export type WalletSelectScalar = {
    id?: boolean
    userId?: boolean
    rideBalance?: boolean
    driverEarnings?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WalletInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    transactions?: boolean | Wallet$transactionsArgs<ExtArgs>
    _count?: boolean | WalletCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WalletIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $WalletPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Wallet"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      rideBalance: number
      driverEarnings: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["wallet"]>
    composites: {}
  }

  type WalletGetPayload<S extends boolean | null | undefined | WalletDefaultArgs> = $Result.GetResult<Prisma.$WalletPayload, S>

  type WalletCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<WalletFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: WalletCountAggregateInputType | true
    }

  export interface WalletDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Wallet'], meta: { name: 'Wallet' } }
    /**
     * Find zero or one Wallet that matches the filter.
     * @param {WalletFindUniqueArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WalletFindUniqueArgs>(args: SelectSubset<T, WalletFindUniqueArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Wallet that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {WalletFindUniqueOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WalletFindUniqueOrThrowArgs>(args: SelectSubset<T, WalletFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Wallet that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WalletFindFirstArgs>(args?: SelectSubset<T, WalletFindFirstArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Wallet that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindFirstOrThrowArgs} args - Arguments to find a Wallet
     * @example
     * // Get one Wallet
     * const wallet = await prisma.wallet.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WalletFindFirstOrThrowArgs>(args?: SelectSubset<T, WalletFindFirstOrThrowArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Wallets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Wallets
     * const wallets = await prisma.wallet.findMany()
     * 
     * // Get first 10 Wallets
     * const wallets = await prisma.wallet.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const walletWithIdOnly = await prisma.wallet.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WalletFindManyArgs>(args?: SelectSubset<T, WalletFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Wallet.
     * @param {WalletCreateArgs} args - Arguments to create a Wallet.
     * @example
     * // Create one Wallet
     * const Wallet = await prisma.wallet.create({
     *   data: {
     *     // ... data to create a Wallet
     *   }
     * })
     * 
     */
    create<T extends WalletCreateArgs>(args: SelectSubset<T, WalletCreateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Wallets.
     * @param {WalletCreateManyArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WalletCreateManyArgs>(args?: SelectSubset<T, WalletCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Wallets and returns the data saved in the database.
     * @param {WalletCreateManyAndReturnArgs} args - Arguments to create many Wallets.
     * @example
     * // Create many Wallets
     * const wallet = await prisma.wallet.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Wallets and only return the `id`
     * const walletWithIdOnly = await prisma.wallet.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WalletCreateManyAndReturnArgs>(args?: SelectSubset<T, WalletCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Wallet.
     * @param {WalletDeleteArgs} args - Arguments to delete one Wallet.
     * @example
     * // Delete one Wallet
     * const Wallet = await prisma.wallet.delete({
     *   where: {
     *     // ... filter to delete one Wallet
     *   }
     * })
     * 
     */
    delete<T extends WalletDeleteArgs>(args: SelectSubset<T, WalletDeleteArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Wallet.
     * @param {WalletUpdateArgs} args - Arguments to update one Wallet.
     * @example
     * // Update one Wallet
     * const wallet = await prisma.wallet.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WalletUpdateArgs>(args: SelectSubset<T, WalletUpdateArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Wallets.
     * @param {WalletDeleteManyArgs} args - Arguments to filter Wallets to delete.
     * @example
     * // Delete a few Wallets
     * const { count } = await prisma.wallet.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WalletDeleteManyArgs>(args?: SelectSubset<T, WalletDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Wallets
     * const wallet = await prisma.wallet.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WalletUpdateManyArgs>(args: SelectSubset<T, WalletUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Wallet.
     * @param {WalletUpsertArgs} args - Arguments to update or create a Wallet.
     * @example
     * // Update or create a Wallet
     * const wallet = await prisma.wallet.upsert({
     *   create: {
     *     // ... data to create a Wallet
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Wallet we want to update
     *   }
     * })
     */
    upsert<T extends WalletUpsertArgs>(args: SelectSubset<T, WalletUpsertArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Wallets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletCountArgs} args - Arguments to filter Wallets to count.
     * @example
     * // Count the number of Wallets
     * const count = await prisma.wallet.count({
     *   where: {
     *     // ... the filter for the Wallets we want to count
     *   }
     * })
    **/
    count<T extends WalletCountArgs>(
      args?: Subset<T, WalletCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WalletCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WalletAggregateArgs>(args: Subset<T, WalletAggregateArgs>): Prisma.PrismaPromise<GetWalletAggregateType<T>>

    /**
     * Group by Wallet.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WalletGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WalletGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WalletGroupByArgs['orderBy'] }
        : { orderBy?: WalletGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WalletGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWalletGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Wallet model
   */
  readonly fields: WalletFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Wallet.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WalletClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    transactions<T extends Wallet$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Wallet$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Wallet model
   */ 
  interface WalletFieldRefs {
    readonly id: FieldRef<"Wallet", 'String'>
    readonly userId: FieldRef<"Wallet", 'String'>
    readonly rideBalance: FieldRef<"Wallet", 'Float'>
    readonly driverEarnings: FieldRef<"Wallet", 'Float'>
    readonly createdAt: FieldRef<"Wallet", 'DateTime'>
    readonly updatedAt: FieldRef<"Wallet", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Wallet findUnique
   */
  export type WalletFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findUniqueOrThrow
   */
  export type WalletFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet findFirst
   */
  export type WalletFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findFirstOrThrow
   */
  export type WalletFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallet to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Wallets.
     */
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet findMany
   */
  export type WalletFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter, which Wallets to fetch.
     */
    where?: WalletWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Wallets to fetch.
     */
    orderBy?: WalletOrderByWithRelationInput | WalletOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Wallets.
     */
    cursor?: WalletWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Wallets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Wallets.
     */
    skip?: number
    distinct?: WalletScalarFieldEnum | WalletScalarFieldEnum[]
  }

  /**
   * Wallet create
   */
  export type WalletCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The data needed to create a Wallet.
     */
    data: XOR<WalletCreateInput, WalletUncheckedCreateInput>
  }

  /**
   * Wallet createMany
   */
  export type WalletCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Wallet createManyAndReturn
   */
  export type WalletCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Wallets.
     */
    data: WalletCreateManyInput | WalletCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Wallet update
   */
  export type WalletUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The data needed to update a Wallet.
     */
    data: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
    /**
     * Choose, which Wallet to update.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet updateMany
   */
  export type WalletUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Wallets.
     */
    data: XOR<WalletUpdateManyMutationInput, WalletUncheckedUpdateManyInput>
    /**
     * Filter which Wallets to update
     */
    where?: WalletWhereInput
  }

  /**
   * Wallet upsert
   */
  export type WalletUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * The filter to search for the Wallet to update in case it exists.
     */
    where: WalletWhereUniqueInput
    /**
     * In case the Wallet found by the `where` argument doesn't exist, create a new Wallet with this data.
     */
    create: XOR<WalletCreateInput, WalletUncheckedCreateInput>
    /**
     * In case the Wallet was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WalletUpdateInput, WalletUncheckedUpdateInput>
  }

  /**
   * Wallet delete
   */
  export type WalletDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
    /**
     * Filter which Wallet to delete.
     */
    where: WalletWhereUniqueInput
  }

  /**
   * Wallet deleteMany
   */
  export type WalletDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Wallets to delete
     */
    where?: WalletWhereInput
  }

  /**
   * Wallet.transactions
   */
  export type Wallet$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Wallet without action
   */
  export type WalletDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Wallet
     */
    select?: WalletSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WalletInclude<ExtArgs> | null
  }


  /**
   * Model Transaction
   */

  export type AggregateTransaction = {
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  export type TransactionAvgAggregateOutputType = {
    amount: number | null
  }

  export type TransactionSumAggregateOutputType = {
    amount: number | null
  }

  export type TransactionMinAggregateOutputType = {
    id: string | null
    walletId: string | null
    amount: number | null
    type: $Enums.TransactionType | null
    status: $Enums.TransactionStatus | null
    description: string | null
    externalId: string | null
    bookingId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TransactionMaxAggregateOutputType = {
    id: string | null
    walletId: string | null
    amount: number | null
    type: $Enums.TransactionType | null
    status: $Enums.TransactionStatus | null
    description: string | null
    externalId: string | null
    bookingId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TransactionCountAggregateOutputType = {
    id: number
    walletId: number
    amount: number
    type: number
    status: number
    description: number
    externalId: number
    bookingId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TransactionAvgAggregateInputType = {
    amount?: true
  }

  export type TransactionSumAggregateInputType = {
    amount?: true
  }

  export type TransactionMinAggregateInputType = {
    id?: true
    walletId?: true
    amount?: true
    type?: true
    status?: true
    description?: true
    externalId?: true
    bookingId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TransactionMaxAggregateInputType = {
    id?: true
    walletId?: true
    amount?: true
    type?: true
    status?: true
    description?: true
    externalId?: true
    bookingId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TransactionCountAggregateInputType = {
    id?: true
    walletId?: true
    amount?: true
    type?: true
    status?: true
    description?: true
    externalId?: true
    bookingId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transaction to aggregate.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Transactions
    **/
    _count?: true | TransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TransactionMaxAggregateInputType
  }

  export type GetTransactionAggregateType<T extends TransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTransaction[P]>
      : GetScalarType<T[P], AggregateTransaction[P]>
  }




  export type TransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithAggregationInput | TransactionOrderByWithAggregationInput[]
    by: TransactionScalarFieldEnum[] | TransactionScalarFieldEnum
    having?: TransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TransactionCountAggregateInputType | true
    _avg?: TransactionAvgAggregateInputType
    _sum?: TransactionSumAggregateInputType
    _min?: TransactionMinAggregateInputType
    _max?: TransactionMaxAggregateInputType
  }

  export type TransactionGroupByOutputType = {
    id: string
    walletId: string
    amount: number
    type: $Enums.TransactionType
    status: $Enums.TransactionStatus
    description: string | null
    externalId: string | null
    bookingId: string | null
    createdAt: Date
    updatedAt: Date
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  type GetTransactionGroupByPayload<T extends TransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TransactionGroupByOutputType[P]>
            : GetScalarType<T[P], TransactionGroupByOutputType[P]>
        }
      >
    >


  export type TransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletId?: boolean
    amount?: boolean
    type?: boolean
    status?: boolean
    description?: boolean
    externalId?: boolean
    bookingId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    wallet?: boolean | WalletDefaultArgs<ExtArgs>
    booking?: boolean | Transaction$bookingArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletId?: boolean
    amount?: boolean
    type?: boolean
    status?: boolean
    description?: boolean
    externalId?: boolean
    bookingId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    wallet?: boolean | WalletDefaultArgs<ExtArgs>
    booking?: boolean | Transaction$bookingArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectScalar = {
    id?: boolean
    walletId?: boolean
    amount?: boolean
    type?: boolean
    status?: boolean
    description?: boolean
    externalId?: boolean
    bookingId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    wallet?: boolean | WalletDefaultArgs<ExtArgs>
    booking?: boolean | Transaction$bookingArgs<ExtArgs>
  }
  export type TransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    wallet?: boolean | WalletDefaultArgs<ExtArgs>
    booking?: boolean | Transaction$bookingArgs<ExtArgs>
  }

  export type $TransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Transaction"
    objects: {
      wallet: Prisma.$WalletPayload<ExtArgs>
      booking: Prisma.$BookingPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletId: string
      amount: number
      type: $Enums.TransactionType
      status: $Enums.TransactionStatus
      description: string | null
      externalId: string | null
      bookingId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["transaction"]>
    composites: {}
  }

  type TransactionGetPayload<S extends boolean | null | undefined | TransactionDefaultArgs> = $Result.GetResult<Prisma.$TransactionPayload, S>

  type TransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<TransactionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: TransactionCountAggregateInputType | true
    }

  export interface TransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Transaction'], meta: { name: 'Transaction' } }
    /**
     * Find zero or one Transaction that matches the filter.
     * @param {TransactionFindUniqueArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TransactionFindUniqueArgs>(args: SelectSubset<T, TransactionFindUniqueArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Transaction that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {TransactionFindUniqueOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, TransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Transaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TransactionFindFirstArgs>(args?: SelectSubset<T, TransactionFindFirstArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Transaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, TransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Transactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Transactions
     * const transactions = await prisma.transaction.findMany()
     * 
     * // Get first 10 Transactions
     * const transactions = await prisma.transaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const transactionWithIdOnly = await prisma.transaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TransactionFindManyArgs>(args?: SelectSubset<T, TransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Transaction.
     * @param {TransactionCreateArgs} args - Arguments to create a Transaction.
     * @example
     * // Create one Transaction
     * const Transaction = await prisma.transaction.create({
     *   data: {
     *     // ... data to create a Transaction
     *   }
     * })
     * 
     */
    create<T extends TransactionCreateArgs>(args: SelectSubset<T, TransactionCreateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Transactions.
     * @param {TransactionCreateManyArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TransactionCreateManyArgs>(args?: SelectSubset<T, TransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Transactions and returns the data saved in the database.
     * @param {TransactionCreateManyAndReturnArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, TransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Transaction.
     * @param {TransactionDeleteArgs} args - Arguments to delete one Transaction.
     * @example
     * // Delete one Transaction
     * const Transaction = await prisma.transaction.delete({
     *   where: {
     *     // ... filter to delete one Transaction
     *   }
     * })
     * 
     */
    delete<T extends TransactionDeleteArgs>(args: SelectSubset<T, TransactionDeleteArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Transaction.
     * @param {TransactionUpdateArgs} args - Arguments to update one Transaction.
     * @example
     * // Update one Transaction
     * const transaction = await prisma.transaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TransactionUpdateArgs>(args: SelectSubset<T, TransactionUpdateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Transactions.
     * @param {TransactionDeleteManyArgs} args - Arguments to filter Transactions to delete.
     * @example
     * // Delete a few Transactions
     * const { count } = await prisma.transaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TransactionDeleteManyArgs>(args?: SelectSubset<T, TransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TransactionUpdateManyArgs>(args: SelectSubset<T, TransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Transaction.
     * @param {TransactionUpsertArgs} args - Arguments to update or create a Transaction.
     * @example
     * // Update or create a Transaction
     * const transaction = await prisma.transaction.upsert({
     *   create: {
     *     // ... data to create a Transaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Transaction we want to update
     *   }
     * })
     */
    upsert<T extends TransactionUpsertArgs>(args: SelectSubset<T, TransactionUpsertArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionCountArgs} args - Arguments to filter Transactions to count.
     * @example
     * // Count the number of Transactions
     * const count = await prisma.transaction.count({
     *   where: {
     *     // ... the filter for the Transactions we want to count
     *   }
     * })
    **/
    count<T extends TransactionCountArgs>(
      args?: Subset<T, TransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TransactionAggregateArgs>(args: Subset<T, TransactionAggregateArgs>): Prisma.PrismaPromise<GetTransactionAggregateType<T>>

    /**
     * Group by Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TransactionGroupByArgs['orderBy'] }
        : { orderBy?: TransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Transaction model
   */
  readonly fields: TransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Transaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    wallet<T extends WalletDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WalletDefaultArgs<ExtArgs>>): Prisma__WalletClient<$Result.GetResult<Prisma.$WalletPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    booking<T extends Transaction$bookingArgs<ExtArgs> = {}>(args?: Subset<T, Transaction$bookingArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Transaction model
   */ 
  interface TransactionFieldRefs {
    readonly id: FieldRef<"Transaction", 'String'>
    readonly walletId: FieldRef<"Transaction", 'String'>
    readonly amount: FieldRef<"Transaction", 'Float'>
    readonly type: FieldRef<"Transaction", 'TransactionType'>
    readonly status: FieldRef<"Transaction", 'TransactionStatus'>
    readonly description: FieldRef<"Transaction", 'String'>
    readonly externalId: FieldRef<"Transaction", 'String'>
    readonly bookingId: FieldRef<"Transaction", 'String'>
    readonly createdAt: FieldRef<"Transaction", 'DateTime'>
    readonly updatedAt: FieldRef<"Transaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Transaction findUnique
   */
  export type TransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findUniqueOrThrow
   */
  export type TransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction findFirst
   */
  export type TransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findFirstOrThrow
   */
  export type TransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction findMany
   */
  export type TransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transactions to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Transaction create
   */
  export type TransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a Transaction.
     */
    data: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
  }

  /**
   * Transaction createMany
   */
  export type TransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Transaction createManyAndReturn
   */
  export type TransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction update
   */
  export type TransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a Transaction.
     */
    data: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
    /**
     * Choose, which Transaction to update.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction updateMany
   */
  export type TransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
  }

  /**
   * Transaction upsert
   */
  export type TransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the Transaction to update in case it exists.
     */
    where: TransactionWhereUniqueInput
    /**
     * In case the Transaction found by the `where` argument doesn't exist, create a new Transaction with this data.
     */
    create: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
    /**
     * In case the Transaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
  }

  /**
   * Transaction delete
   */
  export type TransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter which Transaction to delete.
     */
    where: TransactionWhereUniqueInput
  }

  /**
   * Transaction deleteMany
   */
  export type TransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transactions to delete
     */
    where?: TransactionWhereInput
  }

  /**
   * Transaction.booking
   */
  export type Transaction$bookingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
  }

  /**
   * Transaction without action
   */
  export type TransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageMinAggregateOutputType = {
    id: string | null
    rideId: string | null
    senderId: string | null
    receiverId: string | null
    content: string | null
    isRead: boolean | null
    createdAt: Date | null
  }

  export type MessageMaxAggregateOutputType = {
    id: string | null
    rideId: string | null
    senderId: string | null
    receiverId: string | null
    content: string | null
    isRead: boolean | null
    createdAt: Date | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    rideId: number
    senderId: number
    receiverId: number
    content: number
    isRead: number
    createdAt: number
    _all: number
  }


  export type MessageMinAggregateInputType = {
    id?: true
    rideId?: true
    senderId?: true
    receiverId?: true
    content?: true
    isRead?: true
    createdAt?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    rideId?: true
    senderId?: true
    receiverId?: true
    content?: true
    isRead?: true
    createdAt?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    rideId?: true
    senderId?: true
    receiverId?: true
    content?: true
    isRead?: true
    createdAt?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: string
    rideId: string
    senderId: string
    receiverId: string
    content: string
    isRead: boolean
    createdAt: Date
    _count: MessageCountAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rideId?: boolean
    senderId?: boolean
    receiverId?: boolean
    content?: boolean
    isRead?: boolean
    createdAt?: boolean
    ride?: boolean | RideDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rideId?: boolean
    senderId?: boolean
    receiverId?: boolean
    content?: boolean
    isRead?: boolean
    createdAt?: boolean
    ride?: boolean | RideDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    rideId?: boolean
    senderId?: boolean
    receiverId?: boolean
    content?: boolean
    isRead?: boolean
    createdAt?: boolean
  }

  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ride?: boolean | RideDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ride?: boolean | RideDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      ride: Prisma.$RidePayload<ExtArgs>
      sender: Prisma.$UserPayload<ExtArgs>
      receiver: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      rideId: string
      senderId: string
      receiverId: string
      content: string
      isRead: boolean
      createdAt: Date
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ride<T extends RideDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RideDefaultArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    sender<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    receiver<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */ 
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'String'>
    readonly rideId: FieldRef<"Message", 'String'>
    readonly senderId: FieldRef<"Message", 'String'>
    readonly receiverId: FieldRef<"Message", 'String'>
    readonly content: FieldRef<"Message", 'String'>
    readonly isRead: FieldRef<"Message", 'Boolean'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model RefreshToken
   */

  export type AggregateRefreshToken = {
    _count: RefreshTokenCountAggregateOutputType | null
    _min: RefreshTokenMinAggregateOutputType | null
    _max: RefreshTokenMaxAggregateOutputType | null
  }

  export type RefreshTokenMinAggregateOutputType = {
    id: string | null
    token: string | null
    userId: string | null
    revoked: boolean | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type RefreshTokenMaxAggregateOutputType = {
    id: string | null
    token: string | null
    userId: string | null
    revoked: boolean | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type RefreshTokenCountAggregateOutputType = {
    id: number
    token: number
    userId: number
    revoked: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type RefreshTokenMinAggregateInputType = {
    id?: true
    token?: true
    userId?: true
    revoked?: true
    expiresAt?: true
    createdAt?: true
  }

  export type RefreshTokenMaxAggregateInputType = {
    id?: true
    token?: true
    userId?: true
    revoked?: true
    expiresAt?: true
    createdAt?: true
  }

  export type RefreshTokenCountAggregateInputType = {
    id?: true
    token?: true
    userId?: true
    revoked?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type RefreshTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RefreshToken to aggregate.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RefreshTokens
    **/
    _count?: true | RefreshTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RefreshTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RefreshTokenMaxAggregateInputType
  }

  export type GetRefreshTokenAggregateType<T extends RefreshTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateRefreshToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRefreshToken[P]>
      : GetScalarType<T[P], AggregateRefreshToken[P]>
  }




  export type RefreshTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RefreshTokenWhereInput
    orderBy?: RefreshTokenOrderByWithAggregationInput | RefreshTokenOrderByWithAggregationInput[]
    by: RefreshTokenScalarFieldEnum[] | RefreshTokenScalarFieldEnum
    having?: RefreshTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RefreshTokenCountAggregateInputType | true
    _min?: RefreshTokenMinAggregateInputType
    _max?: RefreshTokenMaxAggregateInputType
  }

  export type RefreshTokenGroupByOutputType = {
    id: string
    token: string
    userId: string
    revoked: boolean
    expiresAt: Date
    createdAt: Date
    _count: RefreshTokenCountAggregateOutputType | null
    _min: RefreshTokenMinAggregateOutputType | null
    _max: RefreshTokenMaxAggregateOutputType | null
  }

  type GetRefreshTokenGroupByPayload<T extends RefreshTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RefreshTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RefreshTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RefreshTokenGroupByOutputType[P]>
            : GetScalarType<T[P], RefreshTokenGroupByOutputType[P]>
        }
      >
    >


  export type RefreshTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    userId?: boolean
    revoked?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["refreshToken"]>

  export type RefreshTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    userId?: boolean
    revoked?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["refreshToken"]>

  export type RefreshTokenSelectScalar = {
    id?: boolean
    token?: boolean
    userId?: boolean
    revoked?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type RefreshTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RefreshTokenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RefreshTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RefreshToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      token: string
      userId: string
      revoked: boolean
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["refreshToken"]>
    composites: {}
  }

  type RefreshTokenGetPayload<S extends boolean | null | undefined | RefreshTokenDefaultArgs> = $Result.GetResult<Prisma.$RefreshTokenPayload, S>

  type RefreshTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RefreshTokenFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RefreshTokenCountAggregateInputType | true
    }

  export interface RefreshTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RefreshToken'], meta: { name: 'RefreshToken' } }
    /**
     * Find zero or one RefreshToken that matches the filter.
     * @param {RefreshTokenFindUniqueArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RefreshTokenFindUniqueArgs>(args: SelectSubset<T, RefreshTokenFindUniqueArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one RefreshToken that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RefreshTokenFindUniqueOrThrowArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RefreshTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, RefreshTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first RefreshToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenFindFirstArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RefreshTokenFindFirstArgs>(args?: SelectSubset<T, RefreshTokenFindFirstArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first RefreshToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenFindFirstOrThrowArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RefreshTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, RefreshTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more RefreshTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RefreshTokens
     * const refreshTokens = await prisma.refreshToken.findMany()
     * 
     * // Get first 10 RefreshTokens
     * const refreshTokens = await prisma.refreshToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const refreshTokenWithIdOnly = await prisma.refreshToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RefreshTokenFindManyArgs>(args?: SelectSubset<T, RefreshTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a RefreshToken.
     * @param {RefreshTokenCreateArgs} args - Arguments to create a RefreshToken.
     * @example
     * // Create one RefreshToken
     * const RefreshToken = await prisma.refreshToken.create({
     *   data: {
     *     // ... data to create a RefreshToken
     *   }
     * })
     * 
     */
    create<T extends RefreshTokenCreateArgs>(args: SelectSubset<T, RefreshTokenCreateArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many RefreshTokens.
     * @param {RefreshTokenCreateManyArgs} args - Arguments to create many RefreshTokens.
     * @example
     * // Create many RefreshTokens
     * const refreshToken = await prisma.refreshToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RefreshTokenCreateManyArgs>(args?: SelectSubset<T, RefreshTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RefreshTokens and returns the data saved in the database.
     * @param {RefreshTokenCreateManyAndReturnArgs} args - Arguments to create many RefreshTokens.
     * @example
     * // Create many RefreshTokens
     * const refreshToken = await prisma.refreshToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RefreshTokens and only return the `id`
     * const refreshTokenWithIdOnly = await prisma.refreshToken.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RefreshTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, RefreshTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a RefreshToken.
     * @param {RefreshTokenDeleteArgs} args - Arguments to delete one RefreshToken.
     * @example
     * // Delete one RefreshToken
     * const RefreshToken = await prisma.refreshToken.delete({
     *   where: {
     *     // ... filter to delete one RefreshToken
     *   }
     * })
     * 
     */
    delete<T extends RefreshTokenDeleteArgs>(args: SelectSubset<T, RefreshTokenDeleteArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one RefreshToken.
     * @param {RefreshTokenUpdateArgs} args - Arguments to update one RefreshToken.
     * @example
     * // Update one RefreshToken
     * const refreshToken = await prisma.refreshToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RefreshTokenUpdateArgs>(args: SelectSubset<T, RefreshTokenUpdateArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more RefreshTokens.
     * @param {RefreshTokenDeleteManyArgs} args - Arguments to filter RefreshTokens to delete.
     * @example
     * // Delete a few RefreshTokens
     * const { count } = await prisma.refreshToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RefreshTokenDeleteManyArgs>(args?: SelectSubset<T, RefreshTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RefreshTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RefreshTokens
     * const refreshToken = await prisma.refreshToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RefreshTokenUpdateManyArgs>(args: SelectSubset<T, RefreshTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one RefreshToken.
     * @param {RefreshTokenUpsertArgs} args - Arguments to update or create a RefreshToken.
     * @example
     * // Update or create a RefreshToken
     * const refreshToken = await prisma.refreshToken.upsert({
     *   create: {
     *     // ... data to create a RefreshToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RefreshToken we want to update
     *   }
     * })
     */
    upsert<T extends RefreshTokenUpsertArgs>(args: SelectSubset<T, RefreshTokenUpsertArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of RefreshTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenCountArgs} args - Arguments to filter RefreshTokens to count.
     * @example
     * // Count the number of RefreshTokens
     * const count = await prisma.refreshToken.count({
     *   where: {
     *     // ... the filter for the RefreshTokens we want to count
     *   }
     * })
    **/
    count<T extends RefreshTokenCountArgs>(
      args?: Subset<T, RefreshTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RefreshTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RefreshToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RefreshTokenAggregateArgs>(args: Subset<T, RefreshTokenAggregateArgs>): Prisma.PrismaPromise<GetRefreshTokenAggregateType<T>>

    /**
     * Group by RefreshToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RefreshTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RefreshTokenGroupByArgs['orderBy'] }
        : { orderBy?: RefreshTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RefreshTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRefreshTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RefreshToken model
   */
  readonly fields: RefreshTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RefreshToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RefreshTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RefreshToken model
   */ 
  interface RefreshTokenFieldRefs {
    readonly id: FieldRef<"RefreshToken", 'String'>
    readonly token: FieldRef<"RefreshToken", 'String'>
    readonly userId: FieldRef<"RefreshToken", 'String'>
    readonly revoked: FieldRef<"RefreshToken", 'Boolean'>
    readonly expiresAt: FieldRef<"RefreshToken", 'DateTime'>
    readonly createdAt: FieldRef<"RefreshToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RefreshToken findUnique
   */
  export type RefreshTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken findUniqueOrThrow
   */
  export type RefreshTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken findFirst
   */
  export type RefreshTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RefreshTokens.
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RefreshTokens.
     */
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * RefreshToken findFirstOrThrow
   */
  export type RefreshTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RefreshTokens.
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RefreshTokens.
     */
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * RefreshToken findMany
   */
  export type RefreshTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshTokens to fetch.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RefreshTokens.
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * RefreshToken create
   */
  export type RefreshTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a RefreshToken.
     */
    data: XOR<RefreshTokenCreateInput, RefreshTokenUncheckedCreateInput>
  }

  /**
   * RefreshToken createMany
   */
  export type RefreshTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RefreshTokens.
     */
    data: RefreshTokenCreateManyInput | RefreshTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RefreshToken createManyAndReturn
   */
  export type RefreshTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many RefreshTokens.
     */
    data: RefreshTokenCreateManyInput | RefreshTokenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RefreshToken update
   */
  export type RefreshTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a RefreshToken.
     */
    data: XOR<RefreshTokenUpdateInput, RefreshTokenUncheckedUpdateInput>
    /**
     * Choose, which RefreshToken to update.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken updateMany
   */
  export type RefreshTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RefreshTokens.
     */
    data: XOR<RefreshTokenUpdateManyMutationInput, RefreshTokenUncheckedUpdateManyInput>
    /**
     * Filter which RefreshTokens to update
     */
    where?: RefreshTokenWhereInput
  }

  /**
   * RefreshToken upsert
   */
  export type RefreshTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the RefreshToken to update in case it exists.
     */
    where: RefreshTokenWhereUniqueInput
    /**
     * In case the RefreshToken found by the `where` argument doesn't exist, create a new RefreshToken with this data.
     */
    create: XOR<RefreshTokenCreateInput, RefreshTokenUncheckedCreateInput>
    /**
     * In case the RefreshToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RefreshTokenUpdateInput, RefreshTokenUncheckedUpdateInput>
  }

  /**
   * RefreshToken delete
   */
  export type RefreshTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter which RefreshToken to delete.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken deleteMany
   */
  export type RefreshTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RefreshTokens to delete
     */
    where?: RefreshTokenWhereInput
  }

  /**
   * RefreshToken without action
   */
  export type RefreshTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
  }


  /**
   * Model Notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationMinAggregateOutputType = {
    id: string | null
    userId: string | null
    title: string | null
    content: string | null
    type: string | null
    isRead: boolean | null
    createdAt: Date | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    title: string | null
    content: string | null
    type: string | null
    isRead: boolean | null
    createdAt: Date | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    userId: number
    title: number
    content: number
    type: number
    isRead: number
    createdAt: number
    _all: number
  }


  export type NotificationMinAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    content?: true
    type?: true
    isRead?: true
    createdAt?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    content?: true
    type?: true
    isRead?: true
    createdAt?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    content?: true
    type?: true
    isRead?: true
    createdAt?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notification to aggregate.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type NotificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithAggregationInput | NotificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: NotificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: string
    userId: string
    title: string
    content: string
    type: string
    isRead: boolean
    createdAt: Date
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends NotificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    title?: boolean
    content?: boolean
    type?: boolean
    isRead?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    title?: boolean
    content?: boolean
    type?: boolean
    isRead?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectScalar = {
    id?: boolean
    userId?: boolean
    title?: boolean
    content?: boolean
    type?: boolean
    isRead?: boolean
    createdAt?: boolean
  }

  export type NotificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type NotificationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $NotificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Notification"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      title: string
      content: string
      type: string
      isRead: boolean
      createdAt: Date
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }

  type NotificationGetPayload<S extends boolean | null | undefined | NotificationDefaultArgs> = $Result.GetResult<Prisma.$NotificationPayload, S>

  type NotificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<NotificationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface NotificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Notification'], meta: { name: 'Notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {NotificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationFindUniqueArgs>(args: SelectSubset<T, NotificationFindUniqueArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Notification that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {NotificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationFindFirstArgs>(args?: SelectSubset<T, NotificationFindFirstArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationFindManyArgs>(args?: SelectSubset<T, NotificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Notification.
     * @param {NotificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
     */
    create<T extends NotificationCreateArgs>(args: SelectSubset<T, NotificationCreateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Notifications.
     * @param {NotificationCreateManyArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationCreateManyArgs>(args?: SelectSubset<T, NotificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Notifications and returns the data saved in the database.
     * @param {NotificationCreateManyAndReturnArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NotificationCreateManyAndReturnArgs>(args?: SelectSubset<T, NotificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Notification.
     * @param {NotificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
     */
    delete<T extends NotificationDeleteArgs>(args: SelectSubset<T, NotificationDeleteArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Notification.
     * @param {NotificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationUpdateArgs>(args: SelectSubset<T, NotificationUpdateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Notifications.
     * @param {NotificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationDeleteManyArgs>(args?: SelectSubset<T, NotificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationUpdateManyArgs>(args: SelectSubset<T, NotificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Notification.
     * @param {NotificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
     */
    upsert<T extends NotificationUpsertArgs>(args: SelectSubset<T, NotificationUpsertArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends NotificationCountArgs>(
      args?: Subset<T, NotificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NotificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationGroupByArgs['orderBy'] }
        : { orderBy?: NotificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NotificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Notification model
   */
  readonly fields: NotificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Notification model
   */ 
  interface NotificationFieldRefs {
    readonly id: FieldRef<"Notification", 'String'>
    readonly userId: FieldRef<"Notification", 'String'>
    readonly title: FieldRef<"Notification", 'String'>
    readonly content: FieldRef<"Notification", 'String'>
    readonly type: FieldRef<"Notification", 'String'>
    readonly isRead: FieldRef<"Notification", 'Boolean'>
    readonly createdAt: FieldRef<"Notification", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Notification findUnique
   */
  export type NotificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findUniqueOrThrow
   */
  export type NotificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findFirst
   */
  export type NotificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findFirstOrThrow
   */
  export type NotificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findMany
   */
  export type NotificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notifications to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification create
   */
  export type NotificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to create a Notification.
     */
    data: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
  }

  /**
   * Notification createMany
   */
  export type NotificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Notification createManyAndReturn
   */
  export type NotificationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Notification update
   */
  export type NotificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to update a Notification.
     */
    data: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
    /**
     * Choose, which Notification to update.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification updateMany
   */
  export type NotificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
  }

  /**
   * Notification upsert
   */
  export type NotificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The filter to search for the Notification to update in case it exists.
     */
    where: NotificationWhereUniqueInput
    /**
     * In case the Notification found by the `where` argument doesn't exist, create a new Notification with this data.
     */
    create: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
    /**
     * In case the Notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
  }

  /**
   * Notification delete
   */
  export type NotificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter which Notification to delete.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification deleteMany
   */
  export type NotificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notifications to delete
     */
    where?: NotificationWhereInput
  }

  /**
   * Notification without action
   */
  export type NotificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
  }


  /**
   * Model Ride
   */

  export type AggregateRide = {
    _count: RideCountAggregateOutputType | null
    _avg: RideAvgAggregateOutputType | null
    _sum: RideSumAggregateOutputType | null
    _min: RideMinAggregateOutputType | null
    _max: RideMaxAggregateOutputType | null
  }

  export type RideAvgAggregateOutputType = {
    originLat: number | null
    originLng: number | null
    destinationLat: number | null
    destinationLng: number | null
    distance: number | null
    duration: number | null
    availableSeats: number | null
    pricePerSeat: number | null
  }

  export type RideSumAggregateOutputType = {
    originLat: number | null
    originLng: number | null
    destinationLat: number | null
    destinationLng: number | null
    distance: number | null
    duration: number | null
    availableSeats: number | null
    pricePerSeat: number | null
  }

  export type RideMinAggregateOutputType = {
    id: string | null
    driverId: string | null
    origin: string | null
    originLat: number | null
    originLng: number | null
    destination: string | null
    destinationLat: number | null
    destinationLng: number | null
    distance: number | null
    duration: number | null
    departureTime: Date | null
    availableSeats: number | null
    pricePerSeat: number | null
    status: $Enums.RideStatus | null
    description: string | null
    createdAt: Date | null
    updatedAt: Date | null
    originHouseNumber: string | null
    originStreet: string | null
    originWard: string | null
    originDistrict: string | null
    originProvince: string | null
    originAddressType: string | null
    destHouseNumber: string | null
    destStreet: string | null
    destWard: string | null
    destDistrict: string | null
    destProvince: string | null
    destAddressType: string | null
    addressDetailLevel: string | null
  }

  export type RideMaxAggregateOutputType = {
    id: string | null
    driverId: string | null
    origin: string | null
    originLat: number | null
    originLng: number | null
    destination: string | null
    destinationLat: number | null
    destinationLng: number | null
    distance: number | null
    duration: number | null
    departureTime: Date | null
    availableSeats: number | null
    pricePerSeat: number | null
    status: $Enums.RideStatus | null
    description: string | null
    createdAt: Date | null
    updatedAt: Date | null
    originHouseNumber: string | null
    originStreet: string | null
    originWard: string | null
    originDistrict: string | null
    originProvince: string | null
    originAddressType: string | null
    destHouseNumber: string | null
    destStreet: string | null
    destWard: string | null
    destDistrict: string | null
    destProvince: string | null
    destAddressType: string | null
    addressDetailLevel: string | null
  }

  export type RideCountAggregateOutputType = {
    id: number
    driverId: number
    origin: number
    originLat: number
    originLng: number
    destination: number
    destinationLat: number
    destinationLng: number
    distance: number
    duration: number
    departureTime: number
    availableSeats: number
    pricePerSeat: number
    status: number
    description: number
    createdAt: number
    updatedAt: number
    originHouseNumber: number
    originStreet: number
    originWard: number
    originDistrict: number
    originProvince: number
    originAddressType: number
    destHouseNumber: number
    destStreet: number
    destWard: number
    destDistrict: number
    destProvince: number
    destAddressType: number
    addressDetailLevel: number
    _all: number
  }


  export type RideAvgAggregateInputType = {
    originLat?: true
    originLng?: true
    destinationLat?: true
    destinationLng?: true
    distance?: true
    duration?: true
    availableSeats?: true
    pricePerSeat?: true
  }

  export type RideSumAggregateInputType = {
    originLat?: true
    originLng?: true
    destinationLat?: true
    destinationLng?: true
    distance?: true
    duration?: true
    availableSeats?: true
    pricePerSeat?: true
  }

  export type RideMinAggregateInputType = {
    id?: true
    driverId?: true
    origin?: true
    originLat?: true
    originLng?: true
    destination?: true
    destinationLat?: true
    destinationLng?: true
    distance?: true
    duration?: true
    departureTime?: true
    availableSeats?: true
    pricePerSeat?: true
    status?: true
    description?: true
    createdAt?: true
    updatedAt?: true
    originHouseNumber?: true
    originStreet?: true
    originWard?: true
    originDistrict?: true
    originProvince?: true
    originAddressType?: true
    destHouseNumber?: true
    destStreet?: true
    destWard?: true
    destDistrict?: true
    destProvince?: true
    destAddressType?: true
    addressDetailLevel?: true
  }

  export type RideMaxAggregateInputType = {
    id?: true
    driverId?: true
    origin?: true
    originLat?: true
    originLng?: true
    destination?: true
    destinationLat?: true
    destinationLng?: true
    distance?: true
    duration?: true
    departureTime?: true
    availableSeats?: true
    pricePerSeat?: true
    status?: true
    description?: true
    createdAt?: true
    updatedAt?: true
    originHouseNumber?: true
    originStreet?: true
    originWard?: true
    originDistrict?: true
    originProvince?: true
    originAddressType?: true
    destHouseNumber?: true
    destStreet?: true
    destWard?: true
    destDistrict?: true
    destProvince?: true
    destAddressType?: true
    addressDetailLevel?: true
  }

  export type RideCountAggregateInputType = {
    id?: true
    driverId?: true
    origin?: true
    originLat?: true
    originLng?: true
    destination?: true
    destinationLat?: true
    destinationLng?: true
    distance?: true
    duration?: true
    departureTime?: true
    availableSeats?: true
    pricePerSeat?: true
    status?: true
    description?: true
    createdAt?: true
    updatedAt?: true
    originHouseNumber?: true
    originStreet?: true
    originWard?: true
    originDistrict?: true
    originProvince?: true
    originAddressType?: true
    destHouseNumber?: true
    destStreet?: true
    destWard?: true
    destDistrict?: true
    destProvince?: true
    destAddressType?: true
    addressDetailLevel?: true
    _all?: true
  }

  export type RideAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Ride to aggregate.
     */
    where?: RideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rides to fetch.
     */
    orderBy?: RideOrderByWithRelationInput | RideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Rides
    **/
    _count?: true | RideCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RideAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RideSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RideMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RideMaxAggregateInputType
  }

  export type GetRideAggregateType<T extends RideAggregateArgs> = {
        [P in keyof T & keyof AggregateRide]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRide[P]>
      : GetScalarType<T[P], AggregateRide[P]>
  }




  export type RideGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RideWhereInput
    orderBy?: RideOrderByWithAggregationInput | RideOrderByWithAggregationInput[]
    by: RideScalarFieldEnum[] | RideScalarFieldEnum
    having?: RideScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RideCountAggregateInputType | true
    _avg?: RideAvgAggregateInputType
    _sum?: RideSumAggregateInputType
    _min?: RideMinAggregateInputType
    _max?: RideMaxAggregateInputType
  }

  export type RideGroupByOutputType = {
    id: string
    driverId: string
    origin: string
    originLat: number | null
    originLng: number | null
    destination: string
    destinationLat: number | null
    destinationLng: number | null
    distance: number | null
    duration: number | null
    departureTime: Date
    availableSeats: number
    pricePerSeat: number
    status: $Enums.RideStatus
    description: string | null
    createdAt: Date
    updatedAt: Date
    originHouseNumber: string | null
    originStreet: string | null
    originWard: string | null
    originDistrict: string | null
    originProvince: string | null
    originAddressType: string | null
    destHouseNumber: string | null
    destStreet: string | null
    destWard: string | null
    destDistrict: string | null
    destProvince: string | null
    destAddressType: string | null
    addressDetailLevel: string | null
    _count: RideCountAggregateOutputType | null
    _avg: RideAvgAggregateOutputType | null
    _sum: RideSumAggregateOutputType | null
    _min: RideMinAggregateOutputType | null
    _max: RideMaxAggregateOutputType | null
  }

  type GetRideGroupByPayload<T extends RideGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RideGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RideGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RideGroupByOutputType[P]>
            : GetScalarType<T[P], RideGroupByOutputType[P]>
        }
      >
    >


  export type RideSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    driverId?: boolean
    origin?: boolean
    originLat?: boolean
    originLng?: boolean
    destination?: boolean
    destinationLat?: boolean
    destinationLng?: boolean
    distance?: boolean
    duration?: boolean
    departureTime?: boolean
    availableSeats?: boolean
    pricePerSeat?: boolean
    status?: boolean
    description?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    originHouseNumber?: boolean
    originStreet?: boolean
    originWard?: boolean
    originDistrict?: boolean
    originProvince?: boolean
    originAddressType?: boolean
    destHouseNumber?: boolean
    destStreet?: boolean
    destWard?: boolean
    destDistrict?: boolean
    destProvince?: boolean
    destAddressType?: boolean
    addressDetailLevel?: boolean
    driver?: boolean | UserDefaultArgs<ExtArgs>
    bookings?: boolean | Ride$bookingsArgs<ExtArgs>
    reviews?: boolean | Ride$reviewsArgs<ExtArgs>
    messages?: boolean | Ride$messagesArgs<ExtArgs>
    _count?: boolean | RideCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ride"]>

  export type RideSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    driverId?: boolean
    origin?: boolean
    originLat?: boolean
    originLng?: boolean
    destination?: boolean
    destinationLat?: boolean
    destinationLng?: boolean
    distance?: boolean
    duration?: boolean
    departureTime?: boolean
    availableSeats?: boolean
    pricePerSeat?: boolean
    status?: boolean
    description?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    originHouseNumber?: boolean
    originStreet?: boolean
    originWard?: boolean
    originDistrict?: boolean
    originProvince?: boolean
    originAddressType?: boolean
    destHouseNumber?: boolean
    destStreet?: boolean
    destWard?: boolean
    destDistrict?: boolean
    destProvince?: boolean
    destAddressType?: boolean
    addressDetailLevel?: boolean
    driver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ride"]>

  export type RideSelectScalar = {
    id?: boolean
    driverId?: boolean
    origin?: boolean
    originLat?: boolean
    originLng?: boolean
    destination?: boolean
    destinationLat?: boolean
    destinationLng?: boolean
    distance?: boolean
    duration?: boolean
    departureTime?: boolean
    availableSeats?: boolean
    pricePerSeat?: boolean
    status?: boolean
    description?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    originHouseNumber?: boolean
    originStreet?: boolean
    originWard?: boolean
    originDistrict?: boolean
    originProvince?: boolean
    originAddressType?: boolean
    destHouseNumber?: boolean
    destStreet?: boolean
    destWard?: boolean
    destDistrict?: boolean
    destProvince?: boolean
    destAddressType?: boolean
    addressDetailLevel?: boolean
  }

  export type RideInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    driver?: boolean | UserDefaultArgs<ExtArgs>
    bookings?: boolean | Ride$bookingsArgs<ExtArgs>
    reviews?: boolean | Ride$reviewsArgs<ExtArgs>
    messages?: boolean | Ride$messagesArgs<ExtArgs>
    _count?: boolean | RideCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RideIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    driver?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RidePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Ride"
    objects: {
      driver: Prisma.$UserPayload<ExtArgs>
      bookings: Prisma.$BookingPayload<ExtArgs>[]
      reviews: Prisma.$ReviewPayload<ExtArgs>[]
      messages: Prisma.$MessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      driverId: string
      origin: string
      originLat: number | null
      originLng: number | null
      destination: string
      destinationLat: number | null
      destinationLng: number | null
      distance: number | null
      duration: number | null
      departureTime: Date
      availableSeats: number
      pricePerSeat: number
      status: $Enums.RideStatus
      description: string | null
      createdAt: Date
      updatedAt: Date
      originHouseNumber: string | null
      originStreet: string | null
      originWard: string | null
      originDistrict: string | null
      originProvince: string | null
      originAddressType: string | null
      destHouseNumber: string | null
      destStreet: string | null
      destWard: string | null
      destDistrict: string | null
      destProvince: string | null
      destAddressType: string | null
      addressDetailLevel: string | null
    }, ExtArgs["result"]["ride"]>
    composites: {}
  }

  type RideGetPayload<S extends boolean | null | undefined | RideDefaultArgs> = $Result.GetResult<Prisma.$RidePayload, S>

  type RideCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<RideFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: RideCountAggregateInputType | true
    }

  export interface RideDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Ride'], meta: { name: 'Ride' } }
    /**
     * Find zero or one Ride that matches the filter.
     * @param {RideFindUniqueArgs} args - Arguments to find a Ride
     * @example
     * // Get one Ride
     * const ride = await prisma.ride.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RideFindUniqueArgs>(args: SelectSubset<T, RideFindUniqueArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Ride that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {RideFindUniqueOrThrowArgs} args - Arguments to find a Ride
     * @example
     * // Get one Ride
     * const ride = await prisma.ride.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RideFindUniqueOrThrowArgs>(args: SelectSubset<T, RideFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Ride that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RideFindFirstArgs} args - Arguments to find a Ride
     * @example
     * // Get one Ride
     * const ride = await prisma.ride.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RideFindFirstArgs>(args?: SelectSubset<T, RideFindFirstArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Ride that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RideFindFirstOrThrowArgs} args - Arguments to find a Ride
     * @example
     * // Get one Ride
     * const ride = await prisma.ride.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RideFindFirstOrThrowArgs>(args?: SelectSubset<T, RideFindFirstOrThrowArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Rides that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RideFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Rides
     * const rides = await prisma.ride.findMany()
     * 
     * // Get first 10 Rides
     * const rides = await prisma.ride.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const rideWithIdOnly = await prisma.ride.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RideFindManyArgs>(args?: SelectSubset<T, RideFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Ride.
     * @param {RideCreateArgs} args - Arguments to create a Ride.
     * @example
     * // Create one Ride
     * const Ride = await prisma.ride.create({
     *   data: {
     *     // ... data to create a Ride
     *   }
     * })
     * 
     */
    create<T extends RideCreateArgs>(args: SelectSubset<T, RideCreateArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Rides.
     * @param {RideCreateManyArgs} args - Arguments to create many Rides.
     * @example
     * // Create many Rides
     * const ride = await prisma.ride.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RideCreateManyArgs>(args?: SelectSubset<T, RideCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Rides and returns the data saved in the database.
     * @param {RideCreateManyAndReturnArgs} args - Arguments to create many Rides.
     * @example
     * // Create many Rides
     * const ride = await prisma.ride.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Rides and only return the `id`
     * const rideWithIdOnly = await prisma.ride.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RideCreateManyAndReturnArgs>(args?: SelectSubset<T, RideCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Ride.
     * @param {RideDeleteArgs} args - Arguments to delete one Ride.
     * @example
     * // Delete one Ride
     * const Ride = await prisma.ride.delete({
     *   where: {
     *     // ... filter to delete one Ride
     *   }
     * })
     * 
     */
    delete<T extends RideDeleteArgs>(args: SelectSubset<T, RideDeleteArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Ride.
     * @param {RideUpdateArgs} args - Arguments to update one Ride.
     * @example
     * // Update one Ride
     * const ride = await prisma.ride.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RideUpdateArgs>(args: SelectSubset<T, RideUpdateArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Rides.
     * @param {RideDeleteManyArgs} args - Arguments to filter Rides to delete.
     * @example
     * // Delete a few Rides
     * const { count } = await prisma.ride.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RideDeleteManyArgs>(args?: SelectSubset<T, RideDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Rides.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RideUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Rides
     * const ride = await prisma.ride.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RideUpdateManyArgs>(args: SelectSubset<T, RideUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Ride.
     * @param {RideUpsertArgs} args - Arguments to update or create a Ride.
     * @example
     * // Update or create a Ride
     * const ride = await prisma.ride.upsert({
     *   create: {
     *     // ... data to create a Ride
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Ride we want to update
     *   }
     * })
     */
    upsert<T extends RideUpsertArgs>(args: SelectSubset<T, RideUpsertArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Rides.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RideCountArgs} args - Arguments to filter Rides to count.
     * @example
     * // Count the number of Rides
     * const count = await prisma.ride.count({
     *   where: {
     *     // ... the filter for the Rides we want to count
     *   }
     * })
    **/
    count<T extends RideCountArgs>(
      args?: Subset<T, RideCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RideCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Ride.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RideAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RideAggregateArgs>(args: Subset<T, RideAggregateArgs>): Prisma.PrismaPromise<GetRideAggregateType<T>>

    /**
     * Group by Ride.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RideGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RideGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RideGroupByArgs['orderBy'] }
        : { orderBy?: RideGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RideGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRideGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Ride model
   */
  readonly fields: RideFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Ride.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RideClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    driver<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    bookings<T extends Ride$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, Ride$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany"> | Null>
    reviews<T extends Ride$reviewsArgs<ExtArgs> = {}>(args?: Subset<T, Ride$reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany"> | Null>
    messages<T extends Ride$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Ride$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Ride model
   */ 
  interface RideFieldRefs {
    readonly id: FieldRef<"Ride", 'String'>
    readonly driverId: FieldRef<"Ride", 'String'>
    readonly origin: FieldRef<"Ride", 'String'>
    readonly originLat: FieldRef<"Ride", 'Float'>
    readonly originLng: FieldRef<"Ride", 'Float'>
    readonly destination: FieldRef<"Ride", 'String'>
    readonly destinationLat: FieldRef<"Ride", 'Float'>
    readonly destinationLng: FieldRef<"Ride", 'Float'>
    readonly distance: FieldRef<"Ride", 'Float'>
    readonly duration: FieldRef<"Ride", 'Float'>
    readonly departureTime: FieldRef<"Ride", 'DateTime'>
    readonly availableSeats: FieldRef<"Ride", 'Int'>
    readonly pricePerSeat: FieldRef<"Ride", 'Float'>
    readonly status: FieldRef<"Ride", 'RideStatus'>
    readonly description: FieldRef<"Ride", 'String'>
    readonly createdAt: FieldRef<"Ride", 'DateTime'>
    readonly updatedAt: FieldRef<"Ride", 'DateTime'>
    readonly originHouseNumber: FieldRef<"Ride", 'String'>
    readonly originStreet: FieldRef<"Ride", 'String'>
    readonly originWard: FieldRef<"Ride", 'String'>
    readonly originDistrict: FieldRef<"Ride", 'String'>
    readonly originProvince: FieldRef<"Ride", 'String'>
    readonly originAddressType: FieldRef<"Ride", 'String'>
    readonly destHouseNumber: FieldRef<"Ride", 'String'>
    readonly destStreet: FieldRef<"Ride", 'String'>
    readonly destWard: FieldRef<"Ride", 'String'>
    readonly destDistrict: FieldRef<"Ride", 'String'>
    readonly destProvince: FieldRef<"Ride", 'String'>
    readonly destAddressType: FieldRef<"Ride", 'String'>
    readonly addressDetailLevel: FieldRef<"Ride", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Ride findUnique
   */
  export type RideFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * Filter, which Ride to fetch.
     */
    where: RideWhereUniqueInput
  }

  /**
   * Ride findUniqueOrThrow
   */
  export type RideFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * Filter, which Ride to fetch.
     */
    where: RideWhereUniqueInput
  }

  /**
   * Ride findFirst
   */
  export type RideFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * Filter, which Ride to fetch.
     */
    where?: RideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rides to fetch.
     */
    orderBy?: RideOrderByWithRelationInput | RideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rides.
     */
    cursor?: RideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rides.
     */
    distinct?: RideScalarFieldEnum | RideScalarFieldEnum[]
  }

  /**
   * Ride findFirstOrThrow
   */
  export type RideFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * Filter, which Ride to fetch.
     */
    where?: RideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rides to fetch.
     */
    orderBy?: RideOrderByWithRelationInput | RideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rides.
     */
    cursor?: RideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rides.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rides.
     */
    distinct?: RideScalarFieldEnum | RideScalarFieldEnum[]
  }

  /**
   * Ride findMany
   */
  export type RideFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * Filter, which Rides to fetch.
     */
    where?: RideWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rides to fetch.
     */
    orderBy?: RideOrderByWithRelationInput | RideOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Rides.
     */
    cursor?: RideWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rides from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rides.
     */
    skip?: number
    distinct?: RideScalarFieldEnum | RideScalarFieldEnum[]
  }

  /**
   * Ride create
   */
  export type RideCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * The data needed to create a Ride.
     */
    data: XOR<RideCreateInput, RideUncheckedCreateInput>
  }

  /**
   * Ride createMany
   */
  export type RideCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Rides.
     */
    data: RideCreateManyInput | RideCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Ride createManyAndReturn
   */
  export type RideCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Rides.
     */
    data: RideCreateManyInput | RideCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Ride update
   */
  export type RideUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * The data needed to update a Ride.
     */
    data: XOR<RideUpdateInput, RideUncheckedUpdateInput>
    /**
     * Choose, which Ride to update.
     */
    where: RideWhereUniqueInput
  }

  /**
   * Ride updateMany
   */
  export type RideUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Rides.
     */
    data: XOR<RideUpdateManyMutationInput, RideUncheckedUpdateManyInput>
    /**
     * Filter which Rides to update
     */
    where?: RideWhereInput
  }

  /**
   * Ride upsert
   */
  export type RideUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * The filter to search for the Ride to update in case it exists.
     */
    where: RideWhereUniqueInput
    /**
     * In case the Ride found by the `where` argument doesn't exist, create a new Ride with this data.
     */
    create: XOR<RideCreateInput, RideUncheckedCreateInput>
    /**
     * In case the Ride was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RideUpdateInput, RideUncheckedUpdateInput>
  }

  /**
   * Ride delete
   */
  export type RideDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
    /**
     * Filter which Ride to delete.
     */
    where: RideWhereUniqueInput
  }

  /**
   * Ride deleteMany
   */
  export type RideDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Rides to delete
     */
    where?: RideWhereInput
  }

  /**
   * Ride.bookings
   */
  export type Ride$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Ride.reviews
   */
  export type Ride$reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    cursor?: ReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Ride.messages
   */
  export type Ride$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Ride without action
   */
  export type RideDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Ride
     */
    select?: RideSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RideInclude<ExtArgs> | null
  }


  /**
   * Model Booking
   */

  export type AggregateBooking = {
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  export type BookingAvgAggregateOutputType = {
    seats: number | null
    totalPrice: number | null
  }

  export type BookingSumAggregateOutputType = {
    seats: number | null
    totalPrice: number | null
  }

  export type BookingMinAggregateOutputType = {
    id: string | null
    rideId: string | null
    passengerId: string | null
    seats: number | null
    totalPrice: number | null
    status: $Enums.BookingStatus | null
    paymentStatus: $Enums.PaymentStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BookingMaxAggregateOutputType = {
    id: string | null
    rideId: string | null
    passengerId: string | null
    seats: number | null
    totalPrice: number | null
    status: $Enums.BookingStatus | null
    paymentStatus: $Enums.PaymentStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BookingCountAggregateOutputType = {
    id: number
    rideId: number
    passengerId: number
    seats: number
    totalPrice: number
    status: number
    paymentStatus: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BookingAvgAggregateInputType = {
    seats?: true
    totalPrice?: true
  }

  export type BookingSumAggregateInputType = {
    seats?: true
    totalPrice?: true
  }

  export type BookingMinAggregateInputType = {
    id?: true
    rideId?: true
    passengerId?: true
    seats?: true
    totalPrice?: true
    status?: true
    paymentStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BookingMaxAggregateInputType = {
    id?: true
    rideId?: true
    passengerId?: true
    seats?: true
    totalPrice?: true
    status?: true
    paymentStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BookingCountAggregateInputType = {
    id?: true
    rideId?: true
    passengerId?: true
    seats?: true
    totalPrice?: true
    status?: true
    paymentStatus?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BookingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Booking to aggregate.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Bookings
    **/
    _count?: true | BookingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BookingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BookingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BookingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BookingMaxAggregateInputType
  }

  export type GetBookingAggregateType<T extends BookingAggregateArgs> = {
        [P in keyof T & keyof AggregateBooking]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBooking[P]>
      : GetScalarType<T[P], AggregateBooking[P]>
  }




  export type BookingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithAggregationInput | BookingOrderByWithAggregationInput[]
    by: BookingScalarFieldEnum[] | BookingScalarFieldEnum
    having?: BookingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BookingCountAggregateInputType | true
    _avg?: BookingAvgAggregateInputType
    _sum?: BookingSumAggregateInputType
    _min?: BookingMinAggregateInputType
    _max?: BookingMaxAggregateInputType
  }

  export type BookingGroupByOutputType = {
    id: string
    rideId: string
    passengerId: string
    seats: number
    totalPrice: number
    status: $Enums.BookingStatus
    paymentStatus: $Enums.PaymentStatus
    createdAt: Date
    updatedAt: Date
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  type GetBookingGroupByPayload<T extends BookingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BookingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BookingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BookingGroupByOutputType[P]>
            : GetScalarType<T[P], BookingGroupByOutputType[P]>
        }
      >
    >


  export type BookingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rideId?: boolean
    passengerId?: boolean
    seats?: boolean
    totalPrice?: boolean
    status?: boolean
    paymentStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ride?: boolean | RideDefaultArgs<ExtArgs>
    passenger?: boolean | UserDefaultArgs<ExtArgs>
    transactions?: boolean | Booking$transactionsArgs<ExtArgs>
    _count?: boolean | BookingCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rideId?: boolean
    passengerId?: boolean
    seats?: boolean
    totalPrice?: boolean
    status?: boolean
    paymentStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    ride?: boolean | RideDefaultArgs<ExtArgs>
    passenger?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectScalar = {
    id?: boolean
    rideId?: boolean
    passengerId?: boolean
    seats?: boolean
    totalPrice?: boolean
    status?: boolean
    paymentStatus?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BookingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ride?: boolean | RideDefaultArgs<ExtArgs>
    passenger?: boolean | UserDefaultArgs<ExtArgs>
    transactions?: boolean | Booking$transactionsArgs<ExtArgs>
    _count?: boolean | BookingCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BookingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ride?: boolean | RideDefaultArgs<ExtArgs>
    passenger?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $BookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Booking"
    objects: {
      ride: Prisma.$RidePayload<ExtArgs>
      passenger: Prisma.$UserPayload<ExtArgs>
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      rideId: string
      passengerId: string
      seats: number
      totalPrice: number
      status: $Enums.BookingStatus
      paymentStatus: $Enums.PaymentStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["booking"]>
    composites: {}
  }

  type BookingGetPayload<S extends boolean | null | undefined | BookingDefaultArgs> = $Result.GetResult<Prisma.$BookingPayload, S>

  type BookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BookingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BookingCountAggregateInputType | true
    }

  export interface BookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Booking'], meta: { name: 'Booking' } }
    /**
     * Find zero or one Booking that matches the filter.
     * @param {BookingFindUniqueArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BookingFindUniqueArgs>(args: SelectSubset<T, BookingFindUniqueArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Booking that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BookingFindUniqueOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BookingFindUniqueOrThrowArgs>(args: SelectSubset<T, BookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Booking that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BookingFindFirstArgs>(args?: SelectSubset<T, BookingFindFirstArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Booking that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BookingFindFirstOrThrowArgs>(args?: SelectSubset<T, BookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Bookings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Bookings
     * const bookings = await prisma.booking.findMany()
     * 
     * // Get first 10 Bookings
     * const bookings = await prisma.booking.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bookingWithIdOnly = await prisma.booking.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BookingFindManyArgs>(args?: SelectSubset<T, BookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Booking.
     * @param {BookingCreateArgs} args - Arguments to create a Booking.
     * @example
     * // Create one Booking
     * const Booking = await prisma.booking.create({
     *   data: {
     *     // ... data to create a Booking
     *   }
     * })
     * 
     */
    create<T extends BookingCreateArgs>(args: SelectSubset<T, BookingCreateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Bookings.
     * @param {BookingCreateManyArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BookingCreateManyArgs>(args?: SelectSubset<T, BookingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Bookings and returns the data saved in the database.
     * @param {BookingCreateManyAndReturnArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BookingCreateManyAndReturnArgs>(args?: SelectSubset<T, BookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Booking.
     * @param {BookingDeleteArgs} args - Arguments to delete one Booking.
     * @example
     * // Delete one Booking
     * const Booking = await prisma.booking.delete({
     *   where: {
     *     // ... filter to delete one Booking
     *   }
     * })
     * 
     */
    delete<T extends BookingDeleteArgs>(args: SelectSubset<T, BookingDeleteArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Booking.
     * @param {BookingUpdateArgs} args - Arguments to update one Booking.
     * @example
     * // Update one Booking
     * const booking = await prisma.booking.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BookingUpdateArgs>(args: SelectSubset<T, BookingUpdateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Bookings.
     * @param {BookingDeleteManyArgs} args - Arguments to filter Bookings to delete.
     * @example
     * // Delete a few Bookings
     * const { count } = await prisma.booking.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BookingDeleteManyArgs>(args?: SelectSubset<T, BookingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BookingUpdateManyArgs>(args: SelectSubset<T, BookingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Booking.
     * @param {BookingUpsertArgs} args - Arguments to update or create a Booking.
     * @example
     * // Update or create a Booking
     * const booking = await prisma.booking.upsert({
     *   create: {
     *     // ... data to create a Booking
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Booking we want to update
     *   }
     * })
     */
    upsert<T extends BookingUpsertArgs>(args: SelectSubset<T, BookingUpsertArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingCountArgs} args - Arguments to filter Bookings to count.
     * @example
     * // Count the number of Bookings
     * const count = await prisma.booking.count({
     *   where: {
     *     // ... the filter for the Bookings we want to count
     *   }
     * })
    **/
    count<T extends BookingCountArgs>(
      args?: Subset<T, BookingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BookingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BookingAggregateArgs>(args: Subset<T, BookingAggregateArgs>): Prisma.PrismaPromise<GetBookingAggregateType<T>>

    /**
     * Group by Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BookingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BookingGroupByArgs['orderBy'] }
        : { orderBy?: BookingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BookingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBookingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Booking model
   */
  readonly fields: BookingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Booking.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ride<T extends RideDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RideDefaultArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    passenger<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    transactions<T extends Booking$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Booking$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Booking model
   */ 
  interface BookingFieldRefs {
    readonly id: FieldRef<"Booking", 'String'>
    readonly rideId: FieldRef<"Booking", 'String'>
    readonly passengerId: FieldRef<"Booking", 'String'>
    readonly seats: FieldRef<"Booking", 'Int'>
    readonly totalPrice: FieldRef<"Booking", 'Float'>
    readonly status: FieldRef<"Booking", 'BookingStatus'>
    readonly paymentStatus: FieldRef<"Booking", 'PaymentStatus'>
    readonly createdAt: FieldRef<"Booking", 'DateTime'>
    readonly updatedAt: FieldRef<"Booking", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Booking findUnique
   */
  export type BookingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findUniqueOrThrow
   */
  export type BookingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findFirst
   */
  export type BookingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findFirstOrThrow
   */
  export type BookingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findMany
   */
  export type BookingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Bookings to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking create
   */
  export type BookingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to create a Booking.
     */
    data: XOR<BookingCreateInput, BookingUncheckedCreateInput>
  }

  /**
   * Booking createMany
   */
  export type BookingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Booking createManyAndReturn
   */
  export type BookingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Booking update
   */
  export type BookingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to update a Booking.
     */
    data: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
    /**
     * Choose, which Booking to update.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking updateMany
   */
  export type BookingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
  }

  /**
   * Booking upsert
   */
  export type BookingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The filter to search for the Booking to update in case it exists.
     */
    where: BookingWhereUniqueInput
    /**
     * In case the Booking found by the `where` argument doesn't exist, create a new Booking with this data.
     */
    create: XOR<BookingCreateInput, BookingUncheckedCreateInput>
    /**
     * In case the Booking was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
  }

  /**
   * Booking delete
   */
  export type BookingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter which Booking to delete.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking deleteMany
   */
  export type BookingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bookings to delete
     */
    where?: BookingWhereInput
  }

  /**
   * Booking.transactions
   */
  export type Booking$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Booking without action
   */
  export type BookingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
  }


  /**
   * Model Review
   */

  export type AggregateReview = {
    _count: ReviewCountAggregateOutputType | null
    _avg: ReviewAvgAggregateOutputType | null
    _sum: ReviewSumAggregateOutputType | null
    _min: ReviewMinAggregateOutputType | null
    _max: ReviewMaxAggregateOutputType | null
  }

  export type ReviewAvgAggregateOutputType = {
    rating: number | null
  }

  export type ReviewSumAggregateOutputType = {
    rating: number | null
  }

  export type ReviewMinAggregateOutputType = {
    id: string | null
    rideId: string | null
    reviewerId: string | null
    revieweeId: string | null
    rating: number | null
    comment: string | null
    type: $Enums.ReviewType | null
    createdAt: Date | null
  }

  export type ReviewMaxAggregateOutputType = {
    id: string | null
    rideId: string | null
    reviewerId: string | null
    revieweeId: string | null
    rating: number | null
    comment: string | null
    type: $Enums.ReviewType | null
    createdAt: Date | null
  }

  export type ReviewCountAggregateOutputType = {
    id: number
    rideId: number
    reviewerId: number
    revieweeId: number
    rating: number
    comment: number
    type: number
    createdAt: number
    _all: number
  }


  export type ReviewAvgAggregateInputType = {
    rating?: true
  }

  export type ReviewSumAggregateInputType = {
    rating?: true
  }

  export type ReviewMinAggregateInputType = {
    id?: true
    rideId?: true
    reviewerId?: true
    revieweeId?: true
    rating?: true
    comment?: true
    type?: true
    createdAt?: true
  }

  export type ReviewMaxAggregateInputType = {
    id?: true
    rideId?: true
    reviewerId?: true
    revieweeId?: true
    rating?: true
    comment?: true
    type?: true
    createdAt?: true
  }

  export type ReviewCountAggregateInputType = {
    id?: true
    rideId?: true
    reviewerId?: true
    revieweeId?: true
    rating?: true
    comment?: true
    type?: true
    createdAt?: true
    _all?: true
  }

  export type ReviewAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Review to aggregate.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Reviews
    **/
    _count?: true | ReviewCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReviewAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReviewSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReviewMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReviewMaxAggregateInputType
  }

  export type GetReviewAggregateType<T extends ReviewAggregateArgs> = {
        [P in keyof T & keyof AggregateReview]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReview[P]>
      : GetScalarType<T[P], AggregateReview[P]>
  }




  export type ReviewGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithAggregationInput | ReviewOrderByWithAggregationInput[]
    by: ReviewScalarFieldEnum[] | ReviewScalarFieldEnum
    having?: ReviewScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReviewCountAggregateInputType | true
    _avg?: ReviewAvgAggregateInputType
    _sum?: ReviewSumAggregateInputType
    _min?: ReviewMinAggregateInputType
    _max?: ReviewMaxAggregateInputType
  }

  export type ReviewGroupByOutputType = {
    id: string
    rideId: string
    reviewerId: string
    revieweeId: string
    rating: number
    comment: string | null
    type: $Enums.ReviewType
    createdAt: Date
    _count: ReviewCountAggregateOutputType | null
    _avg: ReviewAvgAggregateOutputType | null
    _sum: ReviewSumAggregateOutputType | null
    _min: ReviewMinAggregateOutputType | null
    _max: ReviewMaxAggregateOutputType | null
  }

  type GetReviewGroupByPayload<T extends ReviewGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReviewGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReviewGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReviewGroupByOutputType[P]>
            : GetScalarType<T[P], ReviewGroupByOutputType[P]>
        }
      >
    >


  export type ReviewSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rideId?: boolean
    reviewerId?: boolean
    revieweeId?: boolean
    rating?: boolean
    comment?: boolean
    type?: boolean
    createdAt?: boolean
    ride?: boolean | RideDefaultArgs<ExtArgs>
    reviewer?: boolean | UserDefaultArgs<ExtArgs>
    reviewee?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rideId?: boolean
    reviewerId?: boolean
    revieweeId?: boolean
    rating?: boolean
    comment?: boolean
    type?: boolean
    createdAt?: boolean
    ride?: boolean | RideDefaultArgs<ExtArgs>
    reviewer?: boolean | UserDefaultArgs<ExtArgs>
    reviewee?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectScalar = {
    id?: boolean
    rideId?: boolean
    reviewerId?: boolean
    revieweeId?: boolean
    rating?: boolean
    comment?: boolean
    type?: boolean
    createdAt?: boolean
  }

  export type ReviewInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ride?: boolean | RideDefaultArgs<ExtArgs>
    reviewer?: boolean | UserDefaultArgs<ExtArgs>
    reviewee?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ReviewIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ride?: boolean | RideDefaultArgs<ExtArgs>
    reviewer?: boolean | UserDefaultArgs<ExtArgs>
    reviewee?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ReviewPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Review"
    objects: {
      ride: Prisma.$RidePayload<ExtArgs>
      reviewer: Prisma.$UserPayload<ExtArgs>
      reviewee: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      rideId: string
      reviewerId: string
      revieweeId: string
      rating: number
      comment: string | null
      type: $Enums.ReviewType
      createdAt: Date
    }, ExtArgs["result"]["review"]>
    composites: {}
  }

  type ReviewGetPayload<S extends boolean | null | undefined | ReviewDefaultArgs> = $Result.GetResult<Prisma.$ReviewPayload, S>

  type ReviewCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ReviewFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ReviewCountAggregateInputType | true
    }

  export interface ReviewDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Review'], meta: { name: 'Review' } }
    /**
     * Find zero or one Review that matches the filter.
     * @param {ReviewFindUniqueArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReviewFindUniqueArgs>(args: SelectSubset<T, ReviewFindUniqueArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Review that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ReviewFindUniqueOrThrowArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReviewFindUniqueOrThrowArgs>(args: SelectSubset<T, ReviewFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Review that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindFirstArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReviewFindFirstArgs>(args?: SelectSubset<T, ReviewFindFirstArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Review that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindFirstOrThrowArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReviewFindFirstOrThrowArgs>(args?: SelectSubset<T, ReviewFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Reviews that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Reviews
     * const reviews = await prisma.review.findMany()
     * 
     * // Get first 10 Reviews
     * const reviews = await prisma.review.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const reviewWithIdOnly = await prisma.review.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReviewFindManyArgs>(args?: SelectSubset<T, ReviewFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Review.
     * @param {ReviewCreateArgs} args - Arguments to create a Review.
     * @example
     * // Create one Review
     * const Review = await prisma.review.create({
     *   data: {
     *     // ... data to create a Review
     *   }
     * })
     * 
     */
    create<T extends ReviewCreateArgs>(args: SelectSubset<T, ReviewCreateArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Reviews.
     * @param {ReviewCreateManyArgs} args - Arguments to create many Reviews.
     * @example
     * // Create many Reviews
     * const review = await prisma.review.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReviewCreateManyArgs>(args?: SelectSubset<T, ReviewCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Reviews and returns the data saved in the database.
     * @param {ReviewCreateManyAndReturnArgs} args - Arguments to create many Reviews.
     * @example
     * // Create many Reviews
     * const review = await prisma.review.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Reviews and only return the `id`
     * const reviewWithIdOnly = await prisma.review.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReviewCreateManyAndReturnArgs>(args?: SelectSubset<T, ReviewCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Review.
     * @param {ReviewDeleteArgs} args - Arguments to delete one Review.
     * @example
     * // Delete one Review
     * const Review = await prisma.review.delete({
     *   where: {
     *     // ... filter to delete one Review
     *   }
     * })
     * 
     */
    delete<T extends ReviewDeleteArgs>(args: SelectSubset<T, ReviewDeleteArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Review.
     * @param {ReviewUpdateArgs} args - Arguments to update one Review.
     * @example
     * // Update one Review
     * const review = await prisma.review.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReviewUpdateArgs>(args: SelectSubset<T, ReviewUpdateArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Reviews.
     * @param {ReviewDeleteManyArgs} args - Arguments to filter Reviews to delete.
     * @example
     * // Delete a few Reviews
     * const { count } = await prisma.review.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReviewDeleteManyArgs>(args?: SelectSubset<T, ReviewDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Reviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Reviews
     * const review = await prisma.review.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReviewUpdateManyArgs>(args: SelectSubset<T, ReviewUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Review.
     * @param {ReviewUpsertArgs} args - Arguments to update or create a Review.
     * @example
     * // Update or create a Review
     * const review = await prisma.review.upsert({
     *   create: {
     *     // ... data to create a Review
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Review we want to update
     *   }
     * })
     */
    upsert<T extends ReviewUpsertArgs>(args: SelectSubset<T, ReviewUpsertArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Reviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewCountArgs} args - Arguments to filter Reviews to count.
     * @example
     * // Count the number of Reviews
     * const count = await prisma.review.count({
     *   where: {
     *     // ... the filter for the Reviews we want to count
     *   }
     * })
    **/
    count<T extends ReviewCountArgs>(
      args?: Subset<T, ReviewCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReviewCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Review.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ReviewAggregateArgs>(args: Subset<T, ReviewAggregateArgs>): Prisma.PrismaPromise<GetReviewAggregateType<T>>

    /**
     * Group by Review.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ReviewGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReviewGroupByArgs['orderBy'] }
        : { orderBy?: ReviewGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ReviewGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReviewGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Review model
   */
  readonly fields: ReviewFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Review.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReviewClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ride<T extends RideDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RideDefaultArgs<ExtArgs>>): Prisma__RideClient<$Result.GetResult<Prisma.$RidePayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    reviewer<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    reviewee<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Review model
   */ 
  interface ReviewFieldRefs {
    readonly id: FieldRef<"Review", 'String'>
    readonly rideId: FieldRef<"Review", 'String'>
    readonly reviewerId: FieldRef<"Review", 'String'>
    readonly revieweeId: FieldRef<"Review", 'String'>
    readonly rating: FieldRef<"Review", 'Int'>
    readonly comment: FieldRef<"Review", 'String'>
    readonly type: FieldRef<"Review", 'ReviewType'>
    readonly createdAt: FieldRef<"Review", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Review findUnique
   */
  export type ReviewFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review findUniqueOrThrow
   */
  export type ReviewFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review findFirst
   */
  export type ReviewFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reviews.
     */
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review findFirstOrThrow
   */
  export type ReviewFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reviews.
     */
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review findMany
   */
  export type ReviewFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Reviews to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review create
   */
  export type ReviewCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * The data needed to create a Review.
     */
    data: XOR<ReviewCreateInput, ReviewUncheckedCreateInput>
  }

  /**
   * Review createMany
   */
  export type ReviewCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Reviews.
     */
    data: ReviewCreateManyInput | ReviewCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Review createManyAndReturn
   */
  export type ReviewCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Reviews.
     */
    data: ReviewCreateManyInput | ReviewCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Review update
   */
  export type ReviewUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * The data needed to update a Review.
     */
    data: XOR<ReviewUpdateInput, ReviewUncheckedUpdateInput>
    /**
     * Choose, which Review to update.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review updateMany
   */
  export type ReviewUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Reviews.
     */
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyInput>
    /**
     * Filter which Reviews to update
     */
    where?: ReviewWhereInput
  }

  /**
   * Review upsert
   */
  export type ReviewUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * The filter to search for the Review to update in case it exists.
     */
    where: ReviewWhereUniqueInput
    /**
     * In case the Review found by the `where` argument doesn't exist, create a new Review with this data.
     */
    create: XOR<ReviewCreateInput, ReviewUncheckedCreateInput>
    /**
     * In case the Review was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReviewUpdateInput, ReviewUncheckedUpdateInput>
  }

  /**
   * Review delete
   */
  export type ReviewDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter which Review to delete.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review deleteMany
   */
  export type ReviewDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Reviews to delete
     */
    where?: ReviewWhereInput
  }

  /**
   * Review without action
   */
  export type ReviewDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
  }


  /**
   * Model DriverVerification
   */

  export type AggregateDriverVerification = {
    _count: DriverVerificationCountAggregateOutputType | null
    _min: DriverVerificationMinAggregateOutputType | null
    _max: DriverVerificationMaxAggregateOutputType | null
  }

  export type DriverVerificationMinAggregateOutputType = {
    id: string | null
    userId: string | null
    licenseFrontImageUrl: string | null
    licenseBackImageUrl: string | null
    registrationFrontImageUrl: string | null
    registrationBackImageUrl: string | null
    vehiclePlate: string | null
    vehicleModel: string | null
    vehicleType: string | null
    status: $Enums.VerificationStatus | null
    rejectionReason: string | null
    reviewedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DriverVerificationMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    licenseFrontImageUrl: string | null
    licenseBackImageUrl: string | null
    registrationFrontImageUrl: string | null
    registrationBackImageUrl: string | null
    vehiclePlate: string | null
    vehicleModel: string | null
    vehicleType: string | null
    status: $Enums.VerificationStatus | null
    rejectionReason: string | null
    reviewedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DriverVerificationCountAggregateOutputType = {
    id: number
    userId: number
    licenseFrontImageUrl: number
    licenseBackImageUrl: number
    registrationFrontImageUrl: number
    registrationBackImageUrl: number
    vehiclePlate: number
    vehicleModel: number
    vehicleType: number
    status: number
    rejectionReason: number
    reviewedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DriverVerificationMinAggregateInputType = {
    id?: true
    userId?: true
    licenseFrontImageUrl?: true
    licenseBackImageUrl?: true
    registrationFrontImageUrl?: true
    registrationBackImageUrl?: true
    vehiclePlate?: true
    vehicleModel?: true
    vehicleType?: true
    status?: true
    rejectionReason?: true
    reviewedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DriverVerificationMaxAggregateInputType = {
    id?: true
    userId?: true
    licenseFrontImageUrl?: true
    licenseBackImageUrl?: true
    registrationFrontImageUrl?: true
    registrationBackImageUrl?: true
    vehiclePlate?: true
    vehicleModel?: true
    vehicleType?: true
    status?: true
    rejectionReason?: true
    reviewedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DriverVerificationCountAggregateInputType = {
    id?: true
    userId?: true
    licenseFrontImageUrl?: true
    licenseBackImageUrl?: true
    registrationFrontImageUrl?: true
    registrationBackImageUrl?: true
    vehiclePlate?: true
    vehicleModel?: true
    vehicleType?: true
    status?: true
    rejectionReason?: true
    reviewedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DriverVerificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DriverVerification to aggregate.
     */
    where?: DriverVerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DriverVerifications to fetch.
     */
    orderBy?: DriverVerificationOrderByWithRelationInput | DriverVerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DriverVerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DriverVerifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DriverVerifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DriverVerifications
    **/
    _count?: true | DriverVerificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DriverVerificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DriverVerificationMaxAggregateInputType
  }

  export type GetDriverVerificationAggregateType<T extends DriverVerificationAggregateArgs> = {
        [P in keyof T & keyof AggregateDriverVerification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDriverVerification[P]>
      : GetScalarType<T[P], AggregateDriverVerification[P]>
  }




  export type DriverVerificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DriverVerificationWhereInput
    orderBy?: DriverVerificationOrderByWithAggregationInput | DriverVerificationOrderByWithAggregationInput[]
    by: DriverVerificationScalarFieldEnum[] | DriverVerificationScalarFieldEnum
    having?: DriverVerificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DriverVerificationCountAggregateInputType | true
    _min?: DriverVerificationMinAggregateInputType
    _max?: DriverVerificationMaxAggregateInputType
  }

  export type DriverVerificationGroupByOutputType = {
    id: string
    userId: string
    licenseFrontImageUrl: string
    licenseBackImageUrl: string
    registrationFrontImageUrl: string
    registrationBackImageUrl: string
    vehiclePlate: string
    vehicleModel: string | null
    vehicleType: string
    status: $Enums.VerificationStatus
    rejectionReason: string | null
    reviewedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: DriverVerificationCountAggregateOutputType | null
    _min: DriverVerificationMinAggregateOutputType | null
    _max: DriverVerificationMaxAggregateOutputType | null
  }

  type GetDriverVerificationGroupByPayload<T extends DriverVerificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DriverVerificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DriverVerificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DriverVerificationGroupByOutputType[P]>
            : GetScalarType<T[P], DriverVerificationGroupByOutputType[P]>
        }
      >
    >


  export type DriverVerificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    licenseFrontImageUrl?: boolean
    licenseBackImageUrl?: boolean
    registrationFrontImageUrl?: boolean
    registrationBackImageUrl?: boolean
    vehiclePlate?: boolean
    vehicleModel?: boolean
    vehicleType?: boolean
    status?: boolean
    rejectionReason?: boolean
    reviewedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["driverVerification"]>

  export type DriverVerificationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    licenseFrontImageUrl?: boolean
    licenseBackImageUrl?: boolean
    registrationFrontImageUrl?: boolean
    registrationBackImageUrl?: boolean
    vehiclePlate?: boolean
    vehicleModel?: boolean
    vehicleType?: boolean
    status?: boolean
    rejectionReason?: boolean
    reviewedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["driverVerification"]>

  export type DriverVerificationSelectScalar = {
    id?: boolean
    userId?: boolean
    licenseFrontImageUrl?: boolean
    licenseBackImageUrl?: boolean
    registrationFrontImageUrl?: boolean
    registrationBackImageUrl?: boolean
    vehiclePlate?: boolean
    vehicleModel?: boolean
    vehicleType?: boolean
    status?: boolean
    rejectionReason?: boolean
    reviewedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DriverVerificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type DriverVerificationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $DriverVerificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DriverVerification"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      licenseFrontImageUrl: string
      licenseBackImageUrl: string
      registrationFrontImageUrl: string
      registrationBackImageUrl: string
      vehiclePlate: string
      vehicleModel: string | null
      vehicleType: string
      status: $Enums.VerificationStatus
      rejectionReason: string | null
      reviewedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["driverVerification"]>
    composites: {}
  }

  type DriverVerificationGetPayload<S extends boolean | null | undefined | DriverVerificationDefaultArgs> = $Result.GetResult<Prisma.$DriverVerificationPayload, S>

  type DriverVerificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<DriverVerificationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: DriverVerificationCountAggregateInputType | true
    }

  export interface DriverVerificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DriverVerification'], meta: { name: 'DriverVerification' } }
    /**
     * Find zero or one DriverVerification that matches the filter.
     * @param {DriverVerificationFindUniqueArgs} args - Arguments to find a DriverVerification
     * @example
     * // Get one DriverVerification
     * const driverVerification = await prisma.driverVerification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DriverVerificationFindUniqueArgs>(args: SelectSubset<T, DriverVerificationFindUniqueArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one DriverVerification that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {DriverVerificationFindUniqueOrThrowArgs} args - Arguments to find a DriverVerification
     * @example
     * // Get one DriverVerification
     * const driverVerification = await prisma.driverVerification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DriverVerificationFindUniqueOrThrowArgs>(args: SelectSubset<T, DriverVerificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first DriverVerification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DriverVerificationFindFirstArgs} args - Arguments to find a DriverVerification
     * @example
     * // Get one DriverVerification
     * const driverVerification = await prisma.driverVerification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DriverVerificationFindFirstArgs>(args?: SelectSubset<T, DriverVerificationFindFirstArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first DriverVerification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DriverVerificationFindFirstOrThrowArgs} args - Arguments to find a DriverVerification
     * @example
     * // Get one DriverVerification
     * const driverVerification = await prisma.driverVerification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DriverVerificationFindFirstOrThrowArgs>(args?: SelectSubset<T, DriverVerificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more DriverVerifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DriverVerificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DriverVerifications
     * const driverVerifications = await prisma.driverVerification.findMany()
     * 
     * // Get first 10 DriverVerifications
     * const driverVerifications = await prisma.driverVerification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const driverVerificationWithIdOnly = await prisma.driverVerification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DriverVerificationFindManyArgs>(args?: SelectSubset<T, DriverVerificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a DriverVerification.
     * @param {DriverVerificationCreateArgs} args - Arguments to create a DriverVerification.
     * @example
     * // Create one DriverVerification
     * const DriverVerification = await prisma.driverVerification.create({
     *   data: {
     *     // ... data to create a DriverVerification
     *   }
     * })
     * 
     */
    create<T extends DriverVerificationCreateArgs>(args: SelectSubset<T, DriverVerificationCreateArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many DriverVerifications.
     * @param {DriverVerificationCreateManyArgs} args - Arguments to create many DriverVerifications.
     * @example
     * // Create many DriverVerifications
     * const driverVerification = await prisma.driverVerification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DriverVerificationCreateManyArgs>(args?: SelectSubset<T, DriverVerificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DriverVerifications and returns the data saved in the database.
     * @param {DriverVerificationCreateManyAndReturnArgs} args - Arguments to create many DriverVerifications.
     * @example
     * // Create many DriverVerifications
     * const driverVerification = await prisma.driverVerification.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DriverVerifications and only return the `id`
     * const driverVerificationWithIdOnly = await prisma.driverVerification.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DriverVerificationCreateManyAndReturnArgs>(args?: SelectSubset<T, DriverVerificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a DriverVerification.
     * @param {DriverVerificationDeleteArgs} args - Arguments to delete one DriverVerification.
     * @example
     * // Delete one DriverVerification
     * const DriverVerification = await prisma.driverVerification.delete({
     *   where: {
     *     // ... filter to delete one DriverVerification
     *   }
     * })
     * 
     */
    delete<T extends DriverVerificationDeleteArgs>(args: SelectSubset<T, DriverVerificationDeleteArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one DriverVerification.
     * @param {DriverVerificationUpdateArgs} args - Arguments to update one DriverVerification.
     * @example
     * // Update one DriverVerification
     * const driverVerification = await prisma.driverVerification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DriverVerificationUpdateArgs>(args: SelectSubset<T, DriverVerificationUpdateArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more DriverVerifications.
     * @param {DriverVerificationDeleteManyArgs} args - Arguments to filter DriverVerifications to delete.
     * @example
     * // Delete a few DriverVerifications
     * const { count } = await prisma.driverVerification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DriverVerificationDeleteManyArgs>(args?: SelectSubset<T, DriverVerificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DriverVerifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DriverVerificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DriverVerifications
     * const driverVerification = await prisma.driverVerification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DriverVerificationUpdateManyArgs>(args: SelectSubset<T, DriverVerificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one DriverVerification.
     * @param {DriverVerificationUpsertArgs} args - Arguments to update or create a DriverVerification.
     * @example
     * // Update or create a DriverVerification
     * const driverVerification = await prisma.driverVerification.upsert({
     *   create: {
     *     // ... data to create a DriverVerification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DriverVerification we want to update
     *   }
     * })
     */
    upsert<T extends DriverVerificationUpsertArgs>(args: SelectSubset<T, DriverVerificationUpsertArgs<ExtArgs>>): Prisma__DriverVerificationClient<$Result.GetResult<Prisma.$DriverVerificationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of DriverVerifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DriverVerificationCountArgs} args - Arguments to filter DriverVerifications to count.
     * @example
     * // Count the number of DriverVerifications
     * const count = await prisma.driverVerification.count({
     *   where: {
     *     // ... the filter for the DriverVerifications we want to count
     *   }
     * })
    **/
    count<T extends DriverVerificationCountArgs>(
      args?: Subset<T, DriverVerificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DriverVerificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DriverVerification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DriverVerificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DriverVerificationAggregateArgs>(args: Subset<T, DriverVerificationAggregateArgs>): Prisma.PrismaPromise<GetDriverVerificationAggregateType<T>>

    /**
     * Group by DriverVerification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DriverVerificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DriverVerificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DriverVerificationGroupByArgs['orderBy'] }
        : { orderBy?: DriverVerificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DriverVerificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDriverVerificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DriverVerification model
   */
  readonly fields: DriverVerificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DriverVerification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DriverVerificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DriverVerification model
   */ 
  interface DriverVerificationFieldRefs {
    readonly id: FieldRef<"DriverVerification", 'String'>
    readonly userId: FieldRef<"DriverVerification", 'String'>
    readonly licenseFrontImageUrl: FieldRef<"DriverVerification", 'String'>
    readonly licenseBackImageUrl: FieldRef<"DriverVerification", 'String'>
    readonly registrationFrontImageUrl: FieldRef<"DriverVerification", 'String'>
    readonly registrationBackImageUrl: FieldRef<"DriverVerification", 'String'>
    readonly vehiclePlate: FieldRef<"DriverVerification", 'String'>
    readonly vehicleModel: FieldRef<"DriverVerification", 'String'>
    readonly vehicleType: FieldRef<"DriverVerification", 'String'>
    readonly status: FieldRef<"DriverVerification", 'VerificationStatus'>
    readonly rejectionReason: FieldRef<"DriverVerification", 'String'>
    readonly reviewedAt: FieldRef<"DriverVerification", 'DateTime'>
    readonly createdAt: FieldRef<"DriverVerification", 'DateTime'>
    readonly updatedAt: FieldRef<"DriverVerification", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DriverVerification findUnique
   */
  export type DriverVerificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * Filter, which DriverVerification to fetch.
     */
    where: DriverVerificationWhereUniqueInput
  }

  /**
   * DriverVerification findUniqueOrThrow
   */
  export type DriverVerificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * Filter, which DriverVerification to fetch.
     */
    where: DriverVerificationWhereUniqueInput
  }

  /**
   * DriverVerification findFirst
   */
  export type DriverVerificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * Filter, which DriverVerification to fetch.
     */
    where?: DriverVerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DriverVerifications to fetch.
     */
    orderBy?: DriverVerificationOrderByWithRelationInput | DriverVerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DriverVerifications.
     */
    cursor?: DriverVerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DriverVerifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DriverVerifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DriverVerifications.
     */
    distinct?: DriverVerificationScalarFieldEnum | DriverVerificationScalarFieldEnum[]
  }

  /**
   * DriverVerification findFirstOrThrow
   */
  export type DriverVerificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * Filter, which DriverVerification to fetch.
     */
    where?: DriverVerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DriverVerifications to fetch.
     */
    orderBy?: DriverVerificationOrderByWithRelationInput | DriverVerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DriverVerifications.
     */
    cursor?: DriverVerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DriverVerifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DriverVerifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DriverVerifications.
     */
    distinct?: DriverVerificationScalarFieldEnum | DriverVerificationScalarFieldEnum[]
  }

  /**
   * DriverVerification findMany
   */
  export type DriverVerificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * Filter, which DriverVerifications to fetch.
     */
    where?: DriverVerificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DriverVerifications to fetch.
     */
    orderBy?: DriverVerificationOrderByWithRelationInput | DriverVerificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DriverVerifications.
     */
    cursor?: DriverVerificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DriverVerifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DriverVerifications.
     */
    skip?: number
    distinct?: DriverVerificationScalarFieldEnum | DriverVerificationScalarFieldEnum[]
  }

  /**
   * DriverVerification create
   */
  export type DriverVerificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * The data needed to create a DriverVerification.
     */
    data: XOR<DriverVerificationCreateInput, DriverVerificationUncheckedCreateInput>
  }

  /**
   * DriverVerification createMany
   */
  export type DriverVerificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DriverVerifications.
     */
    data: DriverVerificationCreateManyInput | DriverVerificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DriverVerification createManyAndReturn
   */
  export type DriverVerificationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many DriverVerifications.
     */
    data: DriverVerificationCreateManyInput | DriverVerificationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * DriverVerification update
   */
  export type DriverVerificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * The data needed to update a DriverVerification.
     */
    data: XOR<DriverVerificationUpdateInput, DriverVerificationUncheckedUpdateInput>
    /**
     * Choose, which DriverVerification to update.
     */
    where: DriverVerificationWhereUniqueInput
  }

  /**
   * DriverVerification updateMany
   */
  export type DriverVerificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DriverVerifications.
     */
    data: XOR<DriverVerificationUpdateManyMutationInput, DriverVerificationUncheckedUpdateManyInput>
    /**
     * Filter which DriverVerifications to update
     */
    where?: DriverVerificationWhereInput
  }

  /**
   * DriverVerification upsert
   */
  export type DriverVerificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * The filter to search for the DriverVerification to update in case it exists.
     */
    where: DriverVerificationWhereUniqueInput
    /**
     * In case the DriverVerification found by the `where` argument doesn't exist, create a new DriverVerification with this data.
     */
    create: XOR<DriverVerificationCreateInput, DriverVerificationUncheckedCreateInput>
    /**
     * In case the DriverVerification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DriverVerificationUpdateInput, DriverVerificationUncheckedUpdateInput>
  }

  /**
   * DriverVerification delete
   */
  export type DriverVerificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
    /**
     * Filter which DriverVerification to delete.
     */
    where: DriverVerificationWhereUniqueInput
  }

  /**
   * DriverVerification deleteMany
   */
  export type DriverVerificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DriverVerifications to delete
     */
    where?: DriverVerificationWhereInput
  }

  /**
   * DriverVerification without action
   */
  export type DriverVerificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DriverVerification
     */
    select?: DriverVerificationSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DriverVerificationInclude<ExtArgs> | null
  }


  /**
   * Model ProvinceMapping
   */

  export type AggregateProvinceMapping = {
    _count: ProvinceMappingCountAggregateOutputType | null
    _min: ProvinceMappingMinAggregateOutputType | null
    _max: ProvinceMappingMaxAggregateOutputType | null
  }

  export type ProvinceMappingMinAggregateOutputType = {
    id: string | null
    oldProvince: string | null
    newProvince: string | null
    effectiveDate: Date | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProvinceMappingMaxAggregateOutputType = {
    id: string | null
    oldProvince: string | null
    newProvince: string | null
    effectiveDate: Date | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProvinceMappingCountAggregateOutputType = {
    id: number
    oldProvince: number
    newProvince: number
    effectiveDate: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProvinceMappingMinAggregateInputType = {
    id?: true
    oldProvince?: true
    newProvince?: true
    effectiveDate?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProvinceMappingMaxAggregateInputType = {
    id?: true
    oldProvince?: true
    newProvince?: true
    effectiveDate?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProvinceMappingCountAggregateInputType = {
    id?: true
    oldProvince?: true
    newProvince?: true
    effectiveDate?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProvinceMappingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProvinceMapping to aggregate.
     */
    where?: ProvinceMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProvinceMappings to fetch.
     */
    orderBy?: ProvinceMappingOrderByWithRelationInput | ProvinceMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProvinceMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProvinceMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProvinceMappings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProvinceMappings
    **/
    _count?: true | ProvinceMappingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProvinceMappingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProvinceMappingMaxAggregateInputType
  }

  export type GetProvinceMappingAggregateType<T extends ProvinceMappingAggregateArgs> = {
        [P in keyof T & keyof AggregateProvinceMapping]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProvinceMapping[P]>
      : GetScalarType<T[P], AggregateProvinceMapping[P]>
  }




  export type ProvinceMappingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProvinceMappingWhereInput
    orderBy?: ProvinceMappingOrderByWithAggregationInput | ProvinceMappingOrderByWithAggregationInput[]
    by: ProvinceMappingScalarFieldEnum[] | ProvinceMappingScalarFieldEnum
    having?: ProvinceMappingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProvinceMappingCountAggregateInputType | true
    _min?: ProvinceMappingMinAggregateInputType
    _max?: ProvinceMappingMaxAggregateInputType
  }

  export type ProvinceMappingGroupByOutputType = {
    id: string
    oldProvince: string
    newProvince: string
    effectiveDate: Date
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: ProvinceMappingCountAggregateOutputType | null
    _min: ProvinceMappingMinAggregateOutputType | null
    _max: ProvinceMappingMaxAggregateOutputType | null
  }

  type GetProvinceMappingGroupByPayload<T extends ProvinceMappingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProvinceMappingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProvinceMappingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProvinceMappingGroupByOutputType[P]>
            : GetScalarType<T[P], ProvinceMappingGroupByOutputType[P]>
        }
      >
    >


  export type ProvinceMappingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    oldProvince?: boolean
    newProvince?: boolean
    effectiveDate?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["provinceMapping"]>

  export type ProvinceMappingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    oldProvince?: boolean
    newProvince?: boolean
    effectiveDate?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["provinceMapping"]>

  export type ProvinceMappingSelectScalar = {
    id?: boolean
    oldProvince?: boolean
    newProvince?: boolean
    effectiveDate?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $ProvinceMappingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProvinceMapping"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      oldProvince: string
      newProvince: string
      effectiveDate: Date
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["provinceMapping"]>
    composites: {}
  }

  type ProvinceMappingGetPayload<S extends boolean | null | undefined | ProvinceMappingDefaultArgs> = $Result.GetResult<Prisma.$ProvinceMappingPayload, S>

  type ProvinceMappingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ProvinceMappingFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ProvinceMappingCountAggregateInputType | true
    }

  export interface ProvinceMappingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProvinceMapping'], meta: { name: 'ProvinceMapping' } }
    /**
     * Find zero or one ProvinceMapping that matches the filter.
     * @param {ProvinceMappingFindUniqueArgs} args - Arguments to find a ProvinceMapping
     * @example
     * // Get one ProvinceMapping
     * const provinceMapping = await prisma.provinceMapping.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProvinceMappingFindUniqueArgs>(args: SelectSubset<T, ProvinceMappingFindUniqueArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ProvinceMapping that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ProvinceMappingFindUniqueOrThrowArgs} args - Arguments to find a ProvinceMapping
     * @example
     * // Get one ProvinceMapping
     * const provinceMapping = await prisma.provinceMapping.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProvinceMappingFindUniqueOrThrowArgs>(args: SelectSubset<T, ProvinceMappingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ProvinceMapping that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProvinceMappingFindFirstArgs} args - Arguments to find a ProvinceMapping
     * @example
     * // Get one ProvinceMapping
     * const provinceMapping = await prisma.provinceMapping.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProvinceMappingFindFirstArgs>(args?: SelectSubset<T, ProvinceMappingFindFirstArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ProvinceMapping that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProvinceMappingFindFirstOrThrowArgs} args - Arguments to find a ProvinceMapping
     * @example
     * // Get one ProvinceMapping
     * const provinceMapping = await prisma.provinceMapping.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProvinceMappingFindFirstOrThrowArgs>(args?: SelectSubset<T, ProvinceMappingFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ProvinceMappings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProvinceMappingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProvinceMappings
     * const provinceMappings = await prisma.provinceMapping.findMany()
     * 
     * // Get first 10 ProvinceMappings
     * const provinceMappings = await prisma.provinceMapping.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const provinceMappingWithIdOnly = await prisma.provinceMapping.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProvinceMappingFindManyArgs>(args?: SelectSubset<T, ProvinceMappingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ProvinceMapping.
     * @param {ProvinceMappingCreateArgs} args - Arguments to create a ProvinceMapping.
     * @example
     * // Create one ProvinceMapping
     * const ProvinceMapping = await prisma.provinceMapping.create({
     *   data: {
     *     // ... data to create a ProvinceMapping
     *   }
     * })
     * 
     */
    create<T extends ProvinceMappingCreateArgs>(args: SelectSubset<T, ProvinceMappingCreateArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ProvinceMappings.
     * @param {ProvinceMappingCreateManyArgs} args - Arguments to create many ProvinceMappings.
     * @example
     * // Create many ProvinceMappings
     * const provinceMapping = await prisma.provinceMapping.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProvinceMappingCreateManyArgs>(args?: SelectSubset<T, ProvinceMappingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProvinceMappings and returns the data saved in the database.
     * @param {ProvinceMappingCreateManyAndReturnArgs} args - Arguments to create many ProvinceMappings.
     * @example
     * // Create many ProvinceMappings
     * const provinceMapping = await prisma.provinceMapping.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProvinceMappings and only return the `id`
     * const provinceMappingWithIdOnly = await prisma.provinceMapping.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProvinceMappingCreateManyAndReturnArgs>(args?: SelectSubset<T, ProvinceMappingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a ProvinceMapping.
     * @param {ProvinceMappingDeleteArgs} args - Arguments to delete one ProvinceMapping.
     * @example
     * // Delete one ProvinceMapping
     * const ProvinceMapping = await prisma.provinceMapping.delete({
     *   where: {
     *     // ... filter to delete one ProvinceMapping
     *   }
     * })
     * 
     */
    delete<T extends ProvinceMappingDeleteArgs>(args: SelectSubset<T, ProvinceMappingDeleteArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ProvinceMapping.
     * @param {ProvinceMappingUpdateArgs} args - Arguments to update one ProvinceMapping.
     * @example
     * // Update one ProvinceMapping
     * const provinceMapping = await prisma.provinceMapping.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProvinceMappingUpdateArgs>(args: SelectSubset<T, ProvinceMappingUpdateArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ProvinceMappings.
     * @param {ProvinceMappingDeleteManyArgs} args - Arguments to filter ProvinceMappings to delete.
     * @example
     * // Delete a few ProvinceMappings
     * const { count } = await prisma.provinceMapping.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProvinceMappingDeleteManyArgs>(args?: SelectSubset<T, ProvinceMappingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProvinceMappings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProvinceMappingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProvinceMappings
     * const provinceMapping = await prisma.provinceMapping.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProvinceMappingUpdateManyArgs>(args: SelectSubset<T, ProvinceMappingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ProvinceMapping.
     * @param {ProvinceMappingUpsertArgs} args - Arguments to update or create a ProvinceMapping.
     * @example
     * // Update or create a ProvinceMapping
     * const provinceMapping = await prisma.provinceMapping.upsert({
     *   create: {
     *     // ... data to create a ProvinceMapping
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProvinceMapping we want to update
     *   }
     * })
     */
    upsert<T extends ProvinceMappingUpsertArgs>(args: SelectSubset<T, ProvinceMappingUpsertArgs<ExtArgs>>): Prisma__ProvinceMappingClient<$Result.GetResult<Prisma.$ProvinceMappingPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ProvinceMappings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProvinceMappingCountArgs} args - Arguments to filter ProvinceMappings to count.
     * @example
     * // Count the number of ProvinceMappings
     * const count = await prisma.provinceMapping.count({
     *   where: {
     *     // ... the filter for the ProvinceMappings we want to count
     *   }
     * })
    **/
    count<T extends ProvinceMappingCountArgs>(
      args?: Subset<T, ProvinceMappingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProvinceMappingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProvinceMapping.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProvinceMappingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProvinceMappingAggregateArgs>(args: Subset<T, ProvinceMappingAggregateArgs>): Prisma.PrismaPromise<GetProvinceMappingAggregateType<T>>

    /**
     * Group by ProvinceMapping.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProvinceMappingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProvinceMappingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProvinceMappingGroupByArgs['orderBy'] }
        : { orderBy?: ProvinceMappingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProvinceMappingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProvinceMappingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProvinceMapping model
   */
  readonly fields: ProvinceMappingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProvinceMapping.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProvinceMappingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ProvinceMapping model
   */ 
  interface ProvinceMappingFieldRefs {
    readonly id: FieldRef<"ProvinceMapping", 'String'>
    readonly oldProvince: FieldRef<"ProvinceMapping", 'String'>
    readonly newProvince: FieldRef<"ProvinceMapping", 'String'>
    readonly effectiveDate: FieldRef<"ProvinceMapping", 'DateTime'>
    readonly isActive: FieldRef<"ProvinceMapping", 'Boolean'>
    readonly createdAt: FieldRef<"ProvinceMapping", 'DateTime'>
    readonly updatedAt: FieldRef<"ProvinceMapping", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ProvinceMapping findUnique
   */
  export type ProvinceMappingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * Filter, which ProvinceMapping to fetch.
     */
    where: ProvinceMappingWhereUniqueInput
  }

  /**
   * ProvinceMapping findUniqueOrThrow
   */
  export type ProvinceMappingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * Filter, which ProvinceMapping to fetch.
     */
    where: ProvinceMappingWhereUniqueInput
  }

  /**
   * ProvinceMapping findFirst
   */
  export type ProvinceMappingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * Filter, which ProvinceMapping to fetch.
     */
    where?: ProvinceMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProvinceMappings to fetch.
     */
    orderBy?: ProvinceMappingOrderByWithRelationInput | ProvinceMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProvinceMappings.
     */
    cursor?: ProvinceMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProvinceMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProvinceMappings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProvinceMappings.
     */
    distinct?: ProvinceMappingScalarFieldEnum | ProvinceMappingScalarFieldEnum[]
  }

  /**
   * ProvinceMapping findFirstOrThrow
   */
  export type ProvinceMappingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * Filter, which ProvinceMapping to fetch.
     */
    where?: ProvinceMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProvinceMappings to fetch.
     */
    orderBy?: ProvinceMappingOrderByWithRelationInput | ProvinceMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProvinceMappings.
     */
    cursor?: ProvinceMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProvinceMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProvinceMappings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProvinceMappings.
     */
    distinct?: ProvinceMappingScalarFieldEnum | ProvinceMappingScalarFieldEnum[]
  }

  /**
   * ProvinceMapping findMany
   */
  export type ProvinceMappingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * Filter, which ProvinceMappings to fetch.
     */
    where?: ProvinceMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProvinceMappings to fetch.
     */
    orderBy?: ProvinceMappingOrderByWithRelationInput | ProvinceMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProvinceMappings.
     */
    cursor?: ProvinceMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProvinceMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProvinceMappings.
     */
    skip?: number
    distinct?: ProvinceMappingScalarFieldEnum | ProvinceMappingScalarFieldEnum[]
  }

  /**
   * ProvinceMapping create
   */
  export type ProvinceMappingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * The data needed to create a ProvinceMapping.
     */
    data: XOR<ProvinceMappingCreateInput, ProvinceMappingUncheckedCreateInput>
  }

  /**
   * ProvinceMapping createMany
   */
  export type ProvinceMappingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProvinceMappings.
     */
    data: ProvinceMappingCreateManyInput | ProvinceMappingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProvinceMapping createManyAndReturn
   */
  export type ProvinceMappingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many ProvinceMappings.
     */
    data: ProvinceMappingCreateManyInput | ProvinceMappingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProvinceMapping update
   */
  export type ProvinceMappingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * The data needed to update a ProvinceMapping.
     */
    data: XOR<ProvinceMappingUpdateInput, ProvinceMappingUncheckedUpdateInput>
    /**
     * Choose, which ProvinceMapping to update.
     */
    where: ProvinceMappingWhereUniqueInput
  }

  /**
   * ProvinceMapping updateMany
   */
  export type ProvinceMappingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProvinceMappings.
     */
    data: XOR<ProvinceMappingUpdateManyMutationInput, ProvinceMappingUncheckedUpdateManyInput>
    /**
     * Filter which ProvinceMappings to update
     */
    where?: ProvinceMappingWhereInput
  }

  /**
   * ProvinceMapping upsert
   */
  export type ProvinceMappingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * The filter to search for the ProvinceMapping to update in case it exists.
     */
    where: ProvinceMappingWhereUniqueInput
    /**
     * In case the ProvinceMapping found by the `where` argument doesn't exist, create a new ProvinceMapping with this data.
     */
    create: XOR<ProvinceMappingCreateInput, ProvinceMappingUncheckedCreateInput>
    /**
     * In case the ProvinceMapping was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProvinceMappingUpdateInput, ProvinceMappingUncheckedUpdateInput>
  }

  /**
   * ProvinceMapping delete
   */
  export type ProvinceMappingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
    /**
     * Filter which ProvinceMapping to delete.
     */
    where: ProvinceMappingWhereUniqueInput
  }

  /**
   * ProvinceMapping deleteMany
   */
  export type ProvinceMappingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProvinceMappings to delete
     */
    where?: ProvinceMappingWhereInput
  }

  /**
   * ProvinceMapping without action
   */
  export type ProvinceMappingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProvinceMapping
     */
    select?: ProvinceMappingSelect<ExtArgs> | null
  }


  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  export type LocationAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type LocationSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type LocationMinAggregateOutputType = {
    id: string | null
    placeId: string | null
    name: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationMaxAggregateOutputType = {
    id: string | null
    placeId: string | null
    name: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationCountAggregateOutputType = {
    id: number
    placeId: number
    name: number
    address: number
    latitude: number
    longitude: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LocationAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type LocationSumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type LocationMinAggregateInputType = {
    id?: true
    placeId?: true
    name?: true
    address?: true
    latitude?: true
    longitude?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationMaxAggregateInputType = {
    id?: true
    placeId?: true
    name?: true
    address?: true
    latitude?: true
    longitude?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationCountAggregateInputType = {
    id?: true
    placeId?: true
    name?: true
    address?: true
    latitude?: true
    longitude?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locations
    **/
    _count?: true | LocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LocationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LocationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocationMaxAggregateInputType
  }

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
        [P in keyof T & keyof AggregateLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>
  }




  export type LocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithAggregationInput | LocationOrderByWithAggregationInput[]
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum
    having?: LocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocationCountAggregateInputType | true
    _avg?: LocationAvgAggregateInputType
    _sum?: LocationSumAggregateInputType
    _min?: LocationMinAggregateInputType
    _max?: LocationMaxAggregateInputType
  }

  export type LocationGroupByOutputType = {
    id: string
    placeId: string
    name: string
    address: string
    latitude: number
    longitude: number
    createdAt: Date
    updatedAt: Date
    _count: LocationCountAggregateOutputType | null
    _avg: LocationAvgAggregateOutputType | null
    _sum: LocationSumAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>
        }
      >
    >


  export type LocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    placeId?: boolean
    name?: boolean
    address?: boolean
    latitude?: boolean
    longitude?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    placeId?: boolean
    name?: boolean
    address?: boolean
    latitude?: boolean
    longitude?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectScalar = {
    id?: boolean
    placeId?: boolean
    name?: boolean
    address?: boolean
    latitude?: boolean
    longitude?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }


  export type $LocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Location"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      placeId: string
      name: string
      address: string
      latitude: number
      longitude: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["location"]>
    composites: {}
  }

  type LocationGetPayload<S extends boolean | null | undefined | LocationDefaultArgs> = $Result.GetResult<Prisma.$LocationPayload, S>

  type LocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<LocationFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: LocationCountAggregateInputType | true
    }

  export interface LocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Location'], meta: { name: 'Location' } }
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     * 
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const locationWithIdOnly = await prisma.location.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocationFindManyArgs>(args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     * 
     */
    create<T extends LocationCreateArgs>(args: SelectSubset<T, LocationCreateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocationCreateManyArgs>(args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     * 
     */
    delete<T extends LocationDeleteArgs>(args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocationUpdateArgs>(args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocationDeleteManyArgs>(args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocationUpdateManyArgs>(args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
    **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LocationAggregateArgs>(args: Subset<T, LocationAggregateArgs>): Prisma.PrismaPromise<GetLocationAggregateType<T>>

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs['orderBy'] }
        : { orderBy?: LocationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Location model
   */
  readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Location model
   */ 
  interface LocationFieldRefs {
    readonly id: FieldRef<"Location", 'String'>
    readonly placeId: FieldRef<"Location", 'String'>
    readonly name: FieldRef<"Location", 'String'>
    readonly address: FieldRef<"Location", 'String'>
    readonly latitude: FieldRef<"Location", 'Float'>
    readonly longitude: FieldRef<"Location", 'Float'>
    readonly createdAt: FieldRef<"Location", 'DateTime'>
    readonly updatedAt: FieldRef<"Location", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location create
   */
  export type LocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>
  }

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location update
   */
  export type LocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
  }

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
  }

  /**
   * Location delete
   */
  export type LocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput
  }

  /**
   * Location without action
   */
  export type LocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    phone: 'phone',
    avatarUrl: 'avatarUrl',
    bio: 'bio',
    role: 'role',
    driverRating: 'driverRating',
    driverRatingCount: 'driverRatingCount',
    passengerRating: 'passengerRating',
    passengerRatingCount: 'passengerRatingCount',
    isDriverVerified: 'isDriverVerified',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const WalletScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    rideBalance: 'rideBalance',
    driverEarnings: 'driverEarnings',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WalletScalarFieldEnum = (typeof WalletScalarFieldEnum)[keyof typeof WalletScalarFieldEnum]


  export const TransactionScalarFieldEnum: {
    id: 'id',
    walletId: 'walletId',
    amount: 'amount',
    type: 'type',
    status: 'status',
    description: 'description',
    externalId: 'externalId',
    bookingId: 'bookingId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    rideId: 'rideId',
    senderId: 'senderId',
    receiverId: 'receiverId',
    content: 'content',
    isRead: 'isRead',
    createdAt: 'createdAt'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const RefreshTokenScalarFieldEnum: {
    id: 'id',
    token: 'token',
    userId: 'userId',
    revoked: 'revoked',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type RefreshTokenScalarFieldEnum = (typeof RefreshTokenScalarFieldEnum)[keyof typeof RefreshTokenScalarFieldEnum]


  export const NotificationScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    content: 'content',
    type: 'type',
    isRead: 'isRead',
    createdAt: 'createdAt'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const RideScalarFieldEnum: {
    id: 'id',
    driverId: 'driverId',
    origin: 'origin',
    originLat: 'originLat',
    originLng: 'originLng',
    destination: 'destination',
    destinationLat: 'destinationLat',
    destinationLng: 'destinationLng',
    distance: 'distance',
    duration: 'duration',
    departureTime: 'departureTime',
    availableSeats: 'availableSeats',
    pricePerSeat: 'pricePerSeat',
    status: 'status',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    originHouseNumber: 'originHouseNumber',
    originStreet: 'originStreet',
    originWard: 'originWard',
    originDistrict: 'originDistrict',
    originProvince: 'originProvince',
    originAddressType: 'originAddressType',
    destHouseNumber: 'destHouseNumber',
    destStreet: 'destStreet',
    destWard: 'destWard',
    destDistrict: 'destDistrict',
    destProvince: 'destProvince',
    destAddressType: 'destAddressType',
    addressDetailLevel: 'addressDetailLevel'
  };

  export type RideScalarFieldEnum = (typeof RideScalarFieldEnum)[keyof typeof RideScalarFieldEnum]


  export const BookingScalarFieldEnum: {
    id: 'id',
    rideId: 'rideId',
    passengerId: 'passengerId',
    seats: 'seats',
    totalPrice: 'totalPrice',
    status: 'status',
    paymentStatus: 'paymentStatus',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BookingScalarFieldEnum = (typeof BookingScalarFieldEnum)[keyof typeof BookingScalarFieldEnum]


  export const ReviewScalarFieldEnum: {
    id: 'id',
    rideId: 'rideId',
    reviewerId: 'reviewerId',
    revieweeId: 'revieweeId',
    rating: 'rating',
    comment: 'comment',
    type: 'type',
    createdAt: 'createdAt'
  };

  export type ReviewScalarFieldEnum = (typeof ReviewScalarFieldEnum)[keyof typeof ReviewScalarFieldEnum]


  export const DriverVerificationScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    licenseFrontImageUrl: 'licenseFrontImageUrl',
    licenseBackImageUrl: 'licenseBackImageUrl',
    registrationFrontImageUrl: 'registrationFrontImageUrl',
    registrationBackImageUrl: 'registrationBackImageUrl',
    vehiclePlate: 'vehiclePlate',
    vehicleModel: 'vehicleModel',
    vehicleType: 'vehicleType',
    status: 'status',
    rejectionReason: 'rejectionReason',
    reviewedAt: 'reviewedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DriverVerificationScalarFieldEnum = (typeof DriverVerificationScalarFieldEnum)[keyof typeof DriverVerificationScalarFieldEnum]


  export const ProvinceMappingScalarFieldEnum: {
    id: 'id',
    oldProvince: 'oldProvince',
    newProvince: 'newProvince',
    effectiveDate: 'effectiveDate',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ProvinceMappingScalarFieldEnum = (typeof ProvinceMappingScalarFieldEnum)[keyof typeof ProvinceMappingScalarFieldEnum]


  export const LocationScalarFieldEnum: {
    id: 'id',
    placeId: 'placeId',
    name: 'name',
    address: 'address',
    latitude: 'latitude',
    longitude: 'longitude',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LocationScalarFieldEnum = (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'TransactionType'
   */
  export type EnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType'>
    


  /**
   * Reference to a field of type 'TransactionType[]'
   */
  export type ListEnumTransactionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionType[]'>
    


  /**
   * Reference to a field of type 'TransactionStatus'
   */
  export type EnumTransactionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionStatus'>
    


  /**
   * Reference to a field of type 'TransactionStatus[]'
   */
  export type ListEnumTransactionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TransactionStatus[]'>
    


  /**
   * Reference to a field of type 'RideStatus'
   */
  export type EnumRideStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RideStatus'>
    


  /**
   * Reference to a field of type 'RideStatus[]'
   */
  export type ListEnumRideStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RideStatus[]'>
    


  /**
   * Reference to a field of type 'BookingStatus'
   */
  export type EnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus'>
    


  /**
   * Reference to a field of type 'BookingStatus[]'
   */
  export type ListEnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus[]'>
    


  /**
   * Reference to a field of type 'PaymentStatus'
   */
  export type EnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus'>
    


  /**
   * Reference to a field of type 'PaymentStatus[]'
   */
  export type ListEnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus[]'>
    


  /**
   * Reference to a field of type 'ReviewType'
   */
  export type EnumReviewTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ReviewType'>
    


  /**
   * Reference to a field of type 'ReviewType[]'
   */
  export type ListEnumReviewTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ReviewType[]'>
    


  /**
   * Reference to a field of type 'VerificationStatus'
   */
  export type EnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus'>
    


  /**
   * Reference to a field of type 'VerificationStatus[]'
   */
  export type ListEnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    phone?: StringNullableFilter<"User"> | string | null
    avatarUrl?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    role?: EnumRoleFilter<"User"> | $Enums.Role
    driverRating?: FloatFilter<"User"> | number
    driverRatingCount?: IntFilter<"User"> | number
    passengerRating?: FloatFilter<"User"> | number
    passengerRatingCount?: IntFilter<"User"> | number
    isDriverVerified?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    ridesAsDriver?: RideListRelationFilter
    bookings?: BookingListRelationFilter
    reviewsSent?: ReviewListRelationFilter
    reviewsReceived?: ReviewListRelationFilter
    refreshTokens?: RefreshTokenListRelationFilter
    notifications?: NotificationListRelationFilter
    sentMessages?: MessageListRelationFilter
    receivedMessages?: MessageListRelationFilter
    wallet?: XOR<WalletNullableRelationFilter, WalletWhereInput> | null
    driverVerification?: XOR<DriverVerificationNullableRelationFilter, DriverVerificationWhereInput> | null
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    role?: SortOrder
    driverRating?: SortOrder
    driverRatingCount?: SortOrder
    passengerRating?: SortOrder
    passengerRatingCount?: SortOrder
    isDriverVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ridesAsDriver?: RideOrderByRelationAggregateInput
    bookings?: BookingOrderByRelationAggregateInput
    reviewsSent?: ReviewOrderByRelationAggregateInput
    reviewsReceived?: ReviewOrderByRelationAggregateInput
    refreshTokens?: RefreshTokenOrderByRelationAggregateInput
    notifications?: NotificationOrderByRelationAggregateInput
    sentMessages?: MessageOrderByRelationAggregateInput
    receivedMessages?: MessageOrderByRelationAggregateInput
    wallet?: WalletOrderByWithRelationInput
    driverVerification?: DriverVerificationOrderByWithRelationInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringFilter<"User"> | string
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    phone?: StringNullableFilter<"User"> | string | null
    avatarUrl?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    role?: EnumRoleFilter<"User"> | $Enums.Role
    driverRating?: FloatFilter<"User"> | number
    driverRatingCount?: IntFilter<"User"> | number
    passengerRating?: FloatFilter<"User"> | number
    passengerRatingCount?: IntFilter<"User"> | number
    isDriverVerified?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    ridesAsDriver?: RideListRelationFilter
    bookings?: BookingListRelationFilter
    reviewsSent?: ReviewListRelationFilter
    reviewsReceived?: ReviewListRelationFilter
    refreshTokens?: RefreshTokenListRelationFilter
    notifications?: NotificationListRelationFilter
    sentMessages?: MessageListRelationFilter
    receivedMessages?: MessageListRelationFilter
    wallet?: XOR<WalletNullableRelationFilter, WalletWhereInput> | null
    driverVerification?: XOR<DriverVerificationNullableRelationFilter, DriverVerificationWhereInput> | null
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    role?: SortOrder
    driverRating?: SortOrder
    driverRatingCount?: SortOrder
    passengerRating?: SortOrder
    passengerRatingCount?: SortOrder
    isDriverVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    firstName?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastName?: StringNullableWithAggregatesFilter<"User"> | string | null
    phone?: StringNullableWithAggregatesFilter<"User"> | string | null
    avatarUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    bio?: StringNullableWithAggregatesFilter<"User"> | string | null
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    driverRating?: FloatWithAggregatesFilter<"User"> | number
    driverRatingCount?: IntWithAggregatesFilter<"User"> | number
    passengerRating?: FloatWithAggregatesFilter<"User"> | number
    passengerRatingCount?: IntWithAggregatesFilter<"User"> | number
    isDriverVerified?: BoolWithAggregatesFilter<"User"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type WalletWhereInput = {
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    id?: StringFilter<"Wallet"> | string
    userId?: StringFilter<"Wallet"> | string
    rideBalance?: FloatFilter<"Wallet"> | number
    driverEarnings?: FloatFilter<"Wallet"> | number
    createdAt?: DateTimeFilter<"Wallet"> | Date | string
    updatedAt?: DateTimeFilter<"Wallet"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    transactions?: TransactionListRelationFilter
  }

  export type WalletOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    rideBalance?: SortOrder
    driverEarnings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    transactions?: TransactionOrderByRelationAggregateInput
  }

  export type WalletWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: WalletWhereInput | WalletWhereInput[]
    OR?: WalletWhereInput[]
    NOT?: WalletWhereInput | WalletWhereInput[]
    rideBalance?: FloatFilter<"Wallet"> | number
    driverEarnings?: FloatFilter<"Wallet"> | number
    createdAt?: DateTimeFilter<"Wallet"> | Date | string
    updatedAt?: DateTimeFilter<"Wallet"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    transactions?: TransactionListRelationFilter
  }, "id" | "userId">

  export type WalletOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    rideBalance?: SortOrder
    driverEarnings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WalletCountOrderByAggregateInput
    _avg?: WalletAvgOrderByAggregateInput
    _max?: WalletMaxOrderByAggregateInput
    _min?: WalletMinOrderByAggregateInput
    _sum?: WalletSumOrderByAggregateInput
  }

  export type WalletScalarWhereWithAggregatesInput = {
    AND?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    OR?: WalletScalarWhereWithAggregatesInput[]
    NOT?: WalletScalarWhereWithAggregatesInput | WalletScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Wallet"> | string
    userId?: StringWithAggregatesFilter<"Wallet"> | string
    rideBalance?: FloatWithAggregatesFilter<"Wallet"> | number
    driverEarnings?: FloatWithAggregatesFilter<"Wallet"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Wallet"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Wallet"> | Date | string
  }

  export type TransactionWhereInput = {
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    id?: StringFilter<"Transaction"> | string
    walletId?: StringFilter<"Transaction"> | string
    amount?: FloatFilter<"Transaction"> | number
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    status?: EnumTransactionStatusFilter<"Transaction"> | $Enums.TransactionStatus
    description?: StringNullableFilter<"Transaction"> | string | null
    externalId?: StringNullableFilter<"Transaction"> | string | null
    bookingId?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeFilter<"Transaction"> | Date | string
    wallet?: XOR<WalletRelationFilter, WalletWhereInput>
    booking?: XOR<BookingNullableRelationFilter, BookingWhereInput> | null
  }

  export type TransactionOrderByWithRelationInput = {
    id?: SortOrder
    walletId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    description?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    bookingId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    wallet?: WalletOrderByWithRelationInput
    booking?: BookingOrderByWithRelationInput
  }

  export type TransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    externalId?: string
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    walletId?: StringFilter<"Transaction"> | string
    amount?: FloatFilter<"Transaction"> | number
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    status?: EnumTransactionStatusFilter<"Transaction"> | $Enums.TransactionStatus
    description?: StringNullableFilter<"Transaction"> | string | null
    bookingId?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeFilter<"Transaction"> | Date | string
    wallet?: XOR<WalletRelationFilter, WalletWhereInput>
    booking?: XOR<BookingNullableRelationFilter, BookingWhereInput> | null
  }, "id" | "externalId">

  export type TransactionOrderByWithAggregationInput = {
    id?: SortOrder
    walletId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    description?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    bookingId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TransactionCountOrderByAggregateInput
    _avg?: TransactionAvgOrderByAggregateInput
    _max?: TransactionMaxOrderByAggregateInput
    _min?: TransactionMinOrderByAggregateInput
    _sum?: TransactionSumOrderByAggregateInput
  }

  export type TransactionScalarWhereWithAggregatesInput = {
    AND?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    OR?: TransactionScalarWhereWithAggregatesInput[]
    NOT?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Transaction"> | string
    walletId?: StringWithAggregatesFilter<"Transaction"> | string
    amount?: FloatWithAggregatesFilter<"Transaction"> | number
    type?: EnumTransactionTypeWithAggregatesFilter<"Transaction"> | $Enums.TransactionType
    status?: EnumTransactionStatusWithAggregatesFilter<"Transaction"> | $Enums.TransactionStatus
    description?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    externalId?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    bookingId?: StringNullableWithAggregatesFilter<"Transaction"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: StringFilter<"Message"> | string
    rideId?: StringFilter<"Message"> | string
    senderId?: StringFilter<"Message"> | string
    receiverId?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    isRead?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    ride?: XOR<RideRelationFilter, RideWhereInput>
    sender?: XOR<UserRelationFilter, UserWhereInput>
    receiver?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    rideId?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    ride?: RideOrderByWithRelationInput
    sender?: UserOrderByWithRelationInput
    receiver?: UserOrderByWithRelationInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    rideId?: StringFilter<"Message"> | string
    senderId?: StringFilter<"Message"> | string
    receiverId?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    isRead?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    ride?: XOR<RideRelationFilter, RideWhereInput>
    sender?: XOR<UserRelationFilter, UserWhereInput>
    receiver?: XOR<UserRelationFilter, UserWhereInput>
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    rideId?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    _count?: MessageCountOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Message"> | string
    rideId?: StringWithAggregatesFilter<"Message"> | string
    senderId?: StringWithAggregatesFilter<"Message"> | string
    receiverId?: StringWithAggregatesFilter<"Message"> | string
    content?: StringWithAggregatesFilter<"Message"> | string
    isRead?: BoolWithAggregatesFilter<"Message"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
  }

  export type RefreshTokenWhereInput = {
    AND?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    OR?: RefreshTokenWhereInput[]
    NOT?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    id?: StringFilter<"RefreshToken"> | string
    token?: StringFilter<"RefreshToken"> | string
    userId?: StringFilter<"RefreshToken"> | string
    revoked?: BoolFilter<"RefreshToken"> | boolean
    expiresAt?: DateTimeFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeFilter<"RefreshToken"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type RefreshTokenOrderByWithRelationInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    revoked?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type RefreshTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    OR?: RefreshTokenWhereInput[]
    NOT?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    userId?: StringFilter<"RefreshToken"> | string
    revoked?: BoolFilter<"RefreshToken"> | boolean
    expiresAt?: DateTimeFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeFilter<"RefreshToken"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type RefreshTokenOrderByWithAggregationInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    revoked?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: RefreshTokenCountOrderByAggregateInput
    _max?: RefreshTokenMaxOrderByAggregateInput
    _min?: RefreshTokenMinOrderByAggregateInput
  }

  export type RefreshTokenScalarWhereWithAggregatesInput = {
    AND?: RefreshTokenScalarWhereWithAggregatesInput | RefreshTokenScalarWhereWithAggregatesInput[]
    OR?: RefreshTokenScalarWhereWithAggregatesInput[]
    NOT?: RefreshTokenScalarWhereWithAggregatesInput | RefreshTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RefreshToken"> | string
    token?: StringWithAggregatesFilter<"RefreshToken"> | string
    userId?: StringWithAggregatesFilter<"RefreshToken"> | string
    revoked?: BoolWithAggregatesFilter<"RefreshToken"> | boolean
    expiresAt?: DateTimeWithAggregatesFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"RefreshToken"> | Date | string
  }

  export type NotificationWhereInput = {
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    id?: StringFilter<"Notification"> | string
    userId?: StringFilter<"Notification"> | string
    title?: StringFilter<"Notification"> | string
    content?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    isRead?: BoolFilter<"Notification"> | boolean
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type NotificationOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    content?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type NotificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    userId?: StringFilter<"Notification"> | string
    title?: StringFilter<"Notification"> | string
    content?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    isRead?: BoolFilter<"Notification"> | boolean
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id">

  export type NotificationOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    content?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    _count?: NotificationCountOrderByAggregateInput
    _max?: NotificationMaxOrderByAggregateInput
    _min?: NotificationMinOrderByAggregateInput
  }

  export type NotificationScalarWhereWithAggregatesInput = {
    AND?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    OR?: NotificationScalarWhereWithAggregatesInput[]
    NOT?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Notification"> | string
    userId?: StringWithAggregatesFilter<"Notification"> | string
    title?: StringWithAggregatesFilter<"Notification"> | string
    content?: StringWithAggregatesFilter<"Notification"> | string
    type?: StringWithAggregatesFilter<"Notification"> | string
    isRead?: BoolWithAggregatesFilter<"Notification"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
  }

  export type RideWhereInput = {
    AND?: RideWhereInput | RideWhereInput[]
    OR?: RideWhereInput[]
    NOT?: RideWhereInput | RideWhereInput[]
    id?: StringFilter<"Ride"> | string
    driverId?: StringFilter<"Ride"> | string
    origin?: StringFilter<"Ride"> | string
    originLat?: FloatNullableFilter<"Ride"> | number | null
    originLng?: FloatNullableFilter<"Ride"> | number | null
    destination?: StringFilter<"Ride"> | string
    destinationLat?: FloatNullableFilter<"Ride"> | number | null
    destinationLng?: FloatNullableFilter<"Ride"> | number | null
    distance?: FloatNullableFilter<"Ride"> | number | null
    duration?: FloatNullableFilter<"Ride"> | number | null
    departureTime?: DateTimeFilter<"Ride"> | Date | string
    availableSeats?: IntFilter<"Ride"> | number
    pricePerSeat?: FloatFilter<"Ride"> | number
    status?: EnumRideStatusFilter<"Ride"> | $Enums.RideStatus
    description?: StringNullableFilter<"Ride"> | string | null
    createdAt?: DateTimeFilter<"Ride"> | Date | string
    updatedAt?: DateTimeFilter<"Ride"> | Date | string
    originHouseNumber?: StringNullableFilter<"Ride"> | string | null
    originStreet?: StringNullableFilter<"Ride"> | string | null
    originWard?: StringNullableFilter<"Ride"> | string | null
    originDistrict?: StringNullableFilter<"Ride"> | string | null
    originProvince?: StringNullableFilter<"Ride"> | string | null
    originAddressType?: StringNullableFilter<"Ride"> | string | null
    destHouseNumber?: StringNullableFilter<"Ride"> | string | null
    destStreet?: StringNullableFilter<"Ride"> | string | null
    destWard?: StringNullableFilter<"Ride"> | string | null
    destDistrict?: StringNullableFilter<"Ride"> | string | null
    destProvince?: StringNullableFilter<"Ride"> | string | null
    destAddressType?: StringNullableFilter<"Ride"> | string | null
    addressDetailLevel?: StringNullableFilter<"Ride"> | string | null
    driver?: XOR<UserRelationFilter, UserWhereInput>
    bookings?: BookingListRelationFilter
    reviews?: ReviewListRelationFilter
    messages?: MessageListRelationFilter
  }

  export type RideOrderByWithRelationInput = {
    id?: SortOrder
    driverId?: SortOrder
    origin?: SortOrder
    originLat?: SortOrderInput | SortOrder
    originLng?: SortOrderInput | SortOrder
    destination?: SortOrder
    destinationLat?: SortOrderInput | SortOrder
    destinationLng?: SortOrderInput | SortOrder
    distance?: SortOrderInput | SortOrder
    duration?: SortOrderInput | SortOrder
    departureTime?: SortOrder
    availableSeats?: SortOrder
    pricePerSeat?: SortOrder
    status?: SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    originHouseNumber?: SortOrderInput | SortOrder
    originStreet?: SortOrderInput | SortOrder
    originWard?: SortOrderInput | SortOrder
    originDistrict?: SortOrderInput | SortOrder
    originProvince?: SortOrderInput | SortOrder
    originAddressType?: SortOrderInput | SortOrder
    destHouseNumber?: SortOrderInput | SortOrder
    destStreet?: SortOrderInput | SortOrder
    destWard?: SortOrderInput | SortOrder
    destDistrict?: SortOrderInput | SortOrder
    destProvince?: SortOrderInput | SortOrder
    destAddressType?: SortOrderInput | SortOrder
    addressDetailLevel?: SortOrderInput | SortOrder
    driver?: UserOrderByWithRelationInput
    bookings?: BookingOrderByRelationAggregateInput
    reviews?: ReviewOrderByRelationAggregateInput
    messages?: MessageOrderByRelationAggregateInput
  }

  export type RideWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RideWhereInput | RideWhereInput[]
    OR?: RideWhereInput[]
    NOT?: RideWhereInput | RideWhereInput[]
    driverId?: StringFilter<"Ride"> | string
    origin?: StringFilter<"Ride"> | string
    originLat?: FloatNullableFilter<"Ride"> | number | null
    originLng?: FloatNullableFilter<"Ride"> | number | null
    destination?: StringFilter<"Ride"> | string
    destinationLat?: FloatNullableFilter<"Ride"> | number | null
    destinationLng?: FloatNullableFilter<"Ride"> | number | null
    distance?: FloatNullableFilter<"Ride"> | number | null
    duration?: FloatNullableFilter<"Ride"> | number | null
    departureTime?: DateTimeFilter<"Ride"> | Date | string
    availableSeats?: IntFilter<"Ride"> | number
    pricePerSeat?: FloatFilter<"Ride"> | number
    status?: EnumRideStatusFilter<"Ride"> | $Enums.RideStatus
    description?: StringNullableFilter<"Ride"> | string | null
    createdAt?: DateTimeFilter<"Ride"> | Date | string
    updatedAt?: DateTimeFilter<"Ride"> | Date | string
    originHouseNumber?: StringNullableFilter<"Ride"> | string | null
    originStreet?: StringNullableFilter<"Ride"> | string | null
    originWard?: StringNullableFilter<"Ride"> | string | null
    originDistrict?: StringNullableFilter<"Ride"> | string | null
    originProvince?: StringNullableFilter<"Ride"> | string | null
    originAddressType?: StringNullableFilter<"Ride"> | string | null
    destHouseNumber?: StringNullableFilter<"Ride"> | string | null
    destStreet?: StringNullableFilter<"Ride"> | string | null
    destWard?: StringNullableFilter<"Ride"> | string | null
    destDistrict?: StringNullableFilter<"Ride"> | string | null
    destProvince?: StringNullableFilter<"Ride"> | string | null
    destAddressType?: StringNullableFilter<"Ride"> | string | null
    addressDetailLevel?: StringNullableFilter<"Ride"> | string | null
    driver?: XOR<UserRelationFilter, UserWhereInput>
    bookings?: BookingListRelationFilter
    reviews?: ReviewListRelationFilter
    messages?: MessageListRelationFilter
  }, "id">

  export type RideOrderByWithAggregationInput = {
    id?: SortOrder
    driverId?: SortOrder
    origin?: SortOrder
    originLat?: SortOrderInput | SortOrder
    originLng?: SortOrderInput | SortOrder
    destination?: SortOrder
    destinationLat?: SortOrderInput | SortOrder
    destinationLng?: SortOrderInput | SortOrder
    distance?: SortOrderInput | SortOrder
    duration?: SortOrderInput | SortOrder
    departureTime?: SortOrder
    availableSeats?: SortOrder
    pricePerSeat?: SortOrder
    status?: SortOrder
    description?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    originHouseNumber?: SortOrderInput | SortOrder
    originStreet?: SortOrderInput | SortOrder
    originWard?: SortOrderInput | SortOrder
    originDistrict?: SortOrderInput | SortOrder
    originProvince?: SortOrderInput | SortOrder
    originAddressType?: SortOrderInput | SortOrder
    destHouseNumber?: SortOrderInput | SortOrder
    destStreet?: SortOrderInput | SortOrder
    destWard?: SortOrderInput | SortOrder
    destDistrict?: SortOrderInput | SortOrder
    destProvince?: SortOrderInput | SortOrder
    destAddressType?: SortOrderInput | SortOrder
    addressDetailLevel?: SortOrderInput | SortOrder
    _count?: RideCountOrderByAggregateInput
    _avg?: RideAvgOrderByAggregateInput
    _max?: RideMaxOrderByAggregateInput
    _min?: RideMinOrderByAggregateInput
    _sum?: RideSumOrderByAggregateInput
  }

  export type RideScalarWhereWithAggregatesInput = {
    AND?: RideScalarWhereWithAggregatesInput | RideScalarWhereWithAggregatesInput[]
    OR?: RideScalarWhereWithAggregatesInput[]
    NOT?: RideScalarWhereWithAggregatesInput | RideScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Ride"> | string
    driverId?: StringWithAggregatesFilter<"Ride"> | string
    origin?: StringWithAggregatesFilter<"Ride"> | string
    originLat?: FloatNullableWithAggregatesFilter<"Ride"> | number | null
    originLng?: FloatNullableWithAggregatesFilter<"Ride"> | number | null
    destination?: StringWithAggregatesFilter<"Ride"> | string
    destinationLat?: FloatNullableWithAggregatesFilter<"Ride"> | number | null
    destinationLng?: FloatNullableWithAggregatesFilter<"Ride"> | number | null
    distance?: FloatNullableWithAggregatesFilter<"Ride"> | number | null
    duration?: FloatNullableWithAggregatesFilter<"Ride"> | number | null
    departureTime?: DateTimeWithAggregatesFilter<"Ride"> | Date | string
    availableSeats?: IntWithAggregatesFilter<"Ride"> | number
    pricePerSeat?: FloatWithAggregatesFilter<"Ride"> | number
    status?: EnumRideStatusWithAggregatesFilter<"Ride"> | $Enums.RideStatus
    description?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Ride"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Ride"> | Date | string
    originHouseNumber?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    originStreet?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    originWard?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    originDistrict?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    originProvince?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    originAddressType?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    destHouseNumber?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    destStreet?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    destWard?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    destDistrict?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    destProvince?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    destAddressType?: StringNullableWithAggregatesFilter<"Ride"> | string | null
    addressDetailLevel?: StringNullableWithAggregatesFilter<"Ride"> | string | null
  }

  export type BookingWhereInput = {
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    id?: StringFilter<"Booking"> | string
    rideId?: StringFilter<"Booking"> | string
    passengerId?: StringFilter<"Booking"> | string
    seats?: IntFilter<"Booking"> | number
    totalPrice?: FloatFilter<"Booking"> | number
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFilter<"Booking"> | $Enums.PaymentStatus
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    ride?: XOR<RideRelationFilter, RideWhereInput>
    passenger?: XOR<UserRelationFilter, UserWhereInput>
    transactions?: TransactionListRelationFilter
  }

  export type BookingOrderByWithRelationInput = {
    id?: SortOrder
    rideId?: SortOrder
    passengerId?: SortOrder
    seats?: SortOrder
    totalPrice?: SortOrder
    status?: SortOrder
    paymentStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    ride?: RideOrderByWithRelationInput
    passenger?: UserOrderByWithRelationInput
    transactions?: TransactionOrderByRelationAggregateInput
  }

  export type BookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    rideId?: StringFilter<"Booking"> | string
    passengerId?: StringFilter<"Booking"> | string
    seats?: IntFilter<"Booking"> | number
    totalPrice?: FloatFilter<"Booking"> | number
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFilter<"Booking"> | $Enums.PaymentStatus
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    ride?: XOR<RideRelationFilter, RideWhereInput>
    passenger?: XOR<UserRelationFilter, UserWhereInput>
    transactions?: TransactionListRelationFilter
  }, "id">

  export type BookingOrderByWithAggregationInput = {
    id?: SortOrder
    rideId?: SortOrder
    passengerId?: SortOrder
    seats?: SortOrder
    totalPrice?: SortOrder
    status?: SortOrder
    paymentStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BookingCountOrderByAggregateInput
    _avg?: BookingAvgOrderByAggregateInput
    _max?: BookingMaxOrderByAggregateInput
    _min?: BookingMinOrderByAggregateInput
    _sum?: BookingSumOrderByAggregateInput
  }

  export type BookingScalarWhereWithAggregatesInput = {
    AND?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    OR?: BookingScalarWhereWithAggregatesInput[]
    NOT?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Booking"> | string
    rideId?: StringWithAggregatesFilter<"Booking"> | string
    passengerId?: StringWithAggregatesFilter<"Booking"> | string
    seats?: IntWithAggregatesFilter<"Booking"> | number
    totalPrice?: FloatWithAggregatesFilter<"Booking"> | number
    status?: EnumBookingStatusWithAggregatesFilter<"Booking"> | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusWithAggregatesFilter<"Booking"> | $Enums.PaymentStatus
    createdAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
  }

  export type ReviewWhereInput = {
    AND?: ReviewWhereInput | ReviewWhereInput[]
    OR?: ReviewWhereInput[]
    NOT?: ReviewWhereInput | ReviewWhereInput[]
    id?: StringFilter<"Review"> | string
    rideId?: StringFilter<"Review"> | string
    reviewerId?: StringFilter<"Review"> | string
    revieweeId?: StringFilter<"Review"> | string
    rating?: IntFilter<"Review"> | number
    comment?: StringNullableFilter<"Review"> | string | null
    type?: EnumReviewTypeFilter<"Review"> | $Enums.ReviewType
    createdAt?: DateTimeFilter<"Review"> | Date | string
    ride?: XOR<RideRelationFilter, RideWhereInput>
    reviewer?: XOR<UserRelationFilter, UserWhereInput>
    reviewee?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type ReviewOrderByWithRelationInput = {
    id?: SortOrder
    rideId?: SortOrder
    reviewerId?: SortOrder
    revieweeId?: SortOrder
    rating?: SortOrder
    comment?: SortOrderInput | SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    ride?: RideOrderByWithRelationInput
    reviewer?: UserOrderByWithRelationInput
    reviewee?: UserOrderByWithRelationInput
  }

  export type ReviewWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ReviewWhereInput | ReviewWhereInput[]
    OR?: ReviewWhereInput[]
    NOT?: ReviewWhereInput | ReviewWhereInput[]
    rideId?: StringFilter<"Review"> | string
    reviewerId?: StringFilter<"Review"> | string
    revieweeId?: StringFilter<"Review"> | string
    rating?: IntFilter<"Review"> | number
    comment?: StringNullableFilter<"Review"> | string | null
    type?: EnumReviewTypeFilter<"Review"> | $Enums.ReviewType
    createdAt?: DateTimeFilter<"Review"> | Date | string
    ride?: XOR<RideRelationFilter, RideWhereInput>
    reviewer?: XOR<UserRelationFilter, UserWhereInput>
    reviewee?: XOR<UserRelationFilter, UserWhereInput>
  }, "id">

  export type ReviewOrderByWithAggregationInput = {
    id?: SortOrder
    rideId?: SortOrder
    reviewerId?: SortOrder
    revieweeId?: SortOrder
    rating?: SortOrder
    comment?: SortOrderInput | SortOrder
    type?: SortOrder
    createdAt?: SortOrder
    _count?: ReviewCountOrderByAggregateInput
    _avg?: ReviewAvgOrderByAggregateInput
    _max?: ReviewMaxOrderByAggregateInput
    _min?: ReviewMinOrderByAggregateInput
    _sum?: ReviewSumOrderByAggregateInput
  }

  export type ReviewScalarWhereWithAggregatesInput = {
    AND?: ReviewScalarWhereWithAggregatesInput | ReviewScalarWhereWithAggregatesInput[]
    OR?: ReviewScalarWhereWithAggregatesInput[]
    NOT?: ReviewScalarWhereWithAggregatesInput | ReviewScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Review"> | string
    rideId?: StringWithAggregatesFilter<"Review"> | string
    reviewerId?: StringWithAggregatesFilter<"Review"> | string
    revieweeId?: StringWithAggregatesFilter<"Review"> | string
    rating?: IntWithAggregatesFilter<"Review"> | number
    comment?: StringNullableWithAggregatesFilter<"Review"> | string | null
    type?: EnumReviewTypeWithAggregatesFilter<"Review"> | $Enums.ReviewType
    createdAt?: DateTimeWithAggregatesFilter<"Review"> | Date | string
  }

  export type DriverVerificationWhereInput = {
    AND?: DriverVerificationWhereInput | DriverVerificationWhereInput[]
    OR?: DriverVerificationWhereInput[]
    NOT?: DriverVerificationWhereInput | DriverVerificationWhereInput[]
    id?: StringFilter<"DriverVerification"> | string
    userId?: StringFilter<"DriverVerification"> | string
    licenseFrontImageUrl?: StringFilter<"DriverVerification"> | string
    licenseBackImageUrl?: StringFilter<"DriverVerification"> | string
    registrationFrontImageUrl?: StringFilter<"DriverVerification"> | string
    registrationBackImageUrl?: StringFilter<"DriverVerification"> | string
    vehiclePlate?: StringFilter<"DriverVerification"> | string
    vehicleModel?: StringNullableFilter<"DriverVerification"> | string | null
    vehicleType?: StringFilter<"DriverVerification"> | string
    status?: EnumVerificationStatusFilter<"DriverVerification"> | $Enums.VerificationStatus
    rejectionReason?: StringNullableFilter<"DriverVerification"> | string | null
    reviewedAt?: DateTimeNullableFilter<"DriverVerification"> | Date | string | null
    createdAt?: DateTimeFilter<"DriverVerification"> | Date | string
    updatedAt?: DateTimeFilter<"DriverVerification"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type DriverVerificationOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    licenseFrontImageUrl?: SortOrder
    licenseBackImageUrl?: SortOrder
    registrationFrontImageUrl?: SortOrder
    registrationBackImageUrl?: SortOrder
    vehiclePlate?: SortOrder
    vehicleModel?: SortOrderInput | SortOrder
    vehicleType?: SortOrder
    status?: SortOrder
    rejectionReason?: SortOrderInput | SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type DriverVerificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: DriverVerificationWhereInput | DriverVerificationWhereInput[]
    OR?: DriverVerificationWhereInput[]
    NOT?: DriverVerificationWhereInput | DriverVerificationWhereInput[]
    licenseFrontImageUrl?: StringFilter<"DriverVerification"> | string
    licenseBackImageUrl?: StringFilter<"DriverVerification"> | string
    registrationFrontImageUrl?: StringFilter<"DriverVerification"> | string
    registrationBackImageUrl?: StringFilter<"DriverVerification"> | string
    vehiclePlate?: StringFilter<"DriverVerification"> | string
    vehicleModel?: StringNullableFilter<"DriverVerification"> | string | null
    vehicleType?: StringFilter<"DriverVerification"> | string
    status?: EnumVerificationStatusFilter<"DriverVerification"> | $Enums.VerificationStatus
    rejectionReason?: StringNullableFilter<"DriverVerification"> | string | null
    reviewedAt?: DateTimeNullableFilter<"DriverVerification"> | Date | string | null
    createdAt?: DateTimeFilter<"DriverVerification"> | Date | string
    updatedAt?: DateTimeFilter<"DriverVerification"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type DriverVerificationOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    licenseFrontImageUrl?: SortOrder
    licenseBackImageUrl?: SortOrder
    registrationFrontImageUrl?: SortOrder
    registrationBackImageUrl?: SortOrder
    vehiclePlate?: SortOrder
    vehicleModel?: SortOrderInput | SortOrder
    vehicleType?: SortOrder
    status?: SortOrder
    rejectionReason?: SortOrderInput | SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DriverVerificationCountOrderByAggregateInput
    _max?: DriverVerificationMaxOrderByAggregateInput
    _min?: DriverVerificationMinOrderByAggregateInput
  }

  export type DriverVerificationScalarWhereWithAggregatesInput = {
    AND?: DriverVerificationScalarWhereWithAggregatesInput | DriverVerificationScalarWhereWithAggregatesInput[]
    OR?: DriverVerificationScalarWhereWithAggregatesInput[]
    NOT?: DriverVerificationScalarWhereWithAggregatesInput | DriverVerificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DriverVerification"> | string
    userId?: StringWithAggregatesFilter<"DriverVerification"> | string
    licenseFrontImageUrl?: StringWithAggregatesFilter<"DriverVerification"> | string
    licenseBackImageUrl?: StringWithAggregatesFilter<"DriverVerification"> | string
    registrationFrontImageUrl?: StringWithAggregatesFilter<"DriverVerification"> | string
    registrationBackImageUrl?: StringWithAggregatesFilter<"DriverVerification"> | string
    vehiclePlate?: StringWithAggregatesFilter<"DriverVerification"> | string
    vehicleModel?: StringNullableWithAggregatesFilter<"DriverVerification"> | string | null
    vehicleType?: StringWithAggregatesFilter<"DriverVerification"> | string
    status?: EnumVerificationStatusWithAggregatesFilter<"DriverVerification"> | $Enums.VerificationStatus
    rejectionReason?: StringNullableWithAggregatesFilter<"DriverVerification"> | string | null
    reviewedAt?: DateTimeNullableWithAggregatesFilter<"DriverVerification"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"DriverVerification"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"DriverVerification"> | Date | string
  }

  export type ProvinceMappingWhereInput = {
    AND?: ProvinceMappingWhereInput | ProvinceMappingWhereInput[]
    OR?: ProvinceMappingWhereInput[]
    NOT?: ProvinceMappingWhereInput | ProvinceMappingWhereInput[]
    id?: StringFilter<"ProvinceMapping"> | string
    oldProvince?: StringFilter<"ProvinceMapping"> | string
    newProvince?: StringFilter<"ProvinceMapping"> | string
    effectiveDate?: DateTimeFilter<"ProvinceMapping"> | Date | string
    isActive?: BoolFilter<"ProvinceMapping"> | boolean
    createdAt?: DateTimeFilter<"ProvinceMapping"> | Date | string
    updatedAt?: DateTimeFilter<"ProvinceMapping"> | Date | string
  }

  export type ProvinceMappingOrderByWithRelationInput = {
    id?: SortOrder
    oldProvince?: SortOrder
    newProvince?: SortOrder
    effectiveDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProvinceMappingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    oldProvince_effectiveDate?: ProvinceMappingOldProvinceEffectiveDateCompoundUniqueInput
    AND?: ProvinceMappingWhereInput | ProvinceMappingWhereInput[]
    OR?: ProvinceMappingWhereInput[]
    NOT?: ProvinceMappingWhereInput | ProvinceMappingWhereInput[]
    oldProvince?: StringFilter<"ProvinceMapping"> | string
    newProvince?: StringFilter<"ProvinceMapping"> | string
    effectiveDate?: DateTimeFilter<"ProvinceMapping"> | Date | string
    isActive?: BoolFilter<"ProvinceMapping"> | boolean
    createdAt?: DateTimeFilter<"ProvinceMapping"> | Date | string
    updatedAt?: DateTimeFilter<"ProvinceMapping"> | Date | string
  }, "id" | "oldProvince_effectiveDate">

  export type ProvinceMappingOrderByWithAggregationInput = {
    id?: SortOrder
    oldProvince?: SortOrder
    newProvince?: SortOrder
    effectiveDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProvinceMappingCountOrderByAggregateInput
    _max?: ProvinceMappingMaxOrderByAggregateInput
    _min?: ProvinceMappingMinOrderByAggregateInput
  }

  export type ProvinceMappingScalarWhereWithAggregatesInput = {
    AND?: ProvinceMappingScalarWhereWithAggregatesInput | ProvinceMappingScalarWhereWithAggregatesInput[]
    OR?: ProvinceMappingScalarWhereWithAggregatesInput[]
    NOT?: ProvinceMappingScalarWhereWithAggregatesInput | ProvinceMappingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProvinceMapping"> | string
    oldProvince?: StringWithAggregatesFilter<"ProvinceMapping"> | string
    newProvince?: StringWithAggregatesFilter<"ProvinceMapping"> | string
    effectiveDate?: DateTimeWithAggregatesFilter<"ProvinceMapping"> | Date | string
    isActive?: BoolWithAggregatesFilter<"ProvinceMapping"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"ProvinceMapping"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ProvinceMapping"> | Date | string
  }

  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    id?: StringFilter<"Location"> | string
    placeId?: StringFilter<"Location"> | string
    name?: StringFilter<"Location"> | string
    address?: StringFilter<"Location"> | string
    latitude?: FloatFilter<"Location"> | number
    longitude?: FloatFilter<"Location"> | number
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
  }

  export type LocationOrderByWithRelationInput = {
    id?: SortOrder
    placeId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    placeId?: string
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    name?: StringFilter<"Location"> | string
    address?: StringFilter<"Location"> | string
    latitude?: FloatFilter<"Location"> | number
    longitude?: FloatFilter<"Location"> | number
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
  }, "id" | "placeId">

  export type LocationOrderByWithAggregationInput = {
    id?: SortOrder
    placeId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LocationCountOrderByAggregateInput
    _avg?: LocationAvgOrderByAggregateInput
    _max?: LocationMaxOrderByAggregateInput
    _min?: LocationMinOrderByAggregateInput
    _sum?: LocationSumOrderByAggregateInput
  }

  export type LocationScalarWhereWithAggregatesInput = {
    AND?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    OR?: LocationScalarWhereWithAggregatesInput[]
    NOT?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Location"> | string
    placeId?: StringWithAggregatesFilter<"Location"> | string
    name?: StringWithAggregatesFilter<"Location"> | string
    address?: StringWithAggregatesFilter<"Location"> | string
    latitude?: FloatWithAggregatesFilter<"Location"> | number
    longitude?: FloatWithAggregatesFilter<"Location"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletCreateInput = {
    id?: string
    rideBalance?: number
    driverEarnings?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutWalletInput
    transactions?: TransactionCreateNestedManyWithoutWalletInput
  }

  export type WalletUncheckedCreateInput = {
    id?: string
    userId: string
    rideBalance?: number
    driverEarnings?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutWalletInput
  }

  export type WalletUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWalletNestedInput
    transactions?: TransactionUpdateManyWithoutWalletNestedInput
  }

  export type WalletUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutWalletNestedInput
  }

  export type WalletCreateManyInput = {
    id?: string
    userId: string
    rideBalance?: number
    driverEarnings?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WalletUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WalletUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateInput = {
    id?: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    wallet: WalletCreateNestedOneWithoutTransactionsInput
    booking?: BookingCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateInput = {
    id?: string
    walletId: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    bookingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    wallet?: WalletUpdateOneRequiredWithoutTransactionsNestedInput
    booking?: BookingUpdateOneWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyInput = {
    id?: string
    walletId: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    bookingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateInput = {
    id?: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
    ride: RideCreateNestedOneWithoutMessagesInput
    sender: UserCreateNestedOneWithoutSentMessagesInput
    receiver: UserCreateNestedOneWithoutReceivedMessagesInput
  }

  export type MessageUncheckedCreateInput = {
    id?: string
    rideId: string
    senderId: string
    receiverId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type MessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutMessagesNestedInput
    sender?: UserUpdateOneRequiredWithoutSentMessagesNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedMessagesNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageCreateManyInput = {
    id?: string
    rideId: string
    senderId: string
    receiverId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type MessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenCreateInput = {
    id?: string
    token: string
    revoked?: boolean
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutRefreshTokensInput
  }

  export type RefreshTokenUncheckedCreateInput = {
    id?: string
    token: string
    userId: string
    revoked?: boolean
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    revoked?: BoolFieldUpdateOperationsInput | boolean
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRefreshTokensNestedInput
  }

  export type RefreshTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    revoked?: BoolFieldUpdateOperationsInput | boolean
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenCreateManyInput = {
    id?: string
    token: string
    userId: string
    revoked?: boolean
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    revoked?: BoolFieldUpdateOperationsInput | boolean
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    revoked?: BoolFieldUpdateOperationsInput | boolean
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationCreateInput = {
    id?: string
    title: string
    content: string
    type: string
    isRead?: boolean
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutNotificationsInput
  }

  export type NotificationUncheckedCreateInput = {
    id?: string
    userId: string
    title: string
    content: string
    type: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type NotificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutNotificationsNestedInput
  }

  export type NotificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationCreateManyInput = {
    id?: string
    userId: string
    title: string
    content: string
    type: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type NotificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RideCreateInput = {
    id?: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    driver: UserCreateNestedOneWithoutRidesAsDriverInput
    bookings?: BookingCreateNestedManyWithoutRideInput
    reviews?: ReviewCreateNestedManyWithoutRideInput
    messages?: MessageCreateNestedManyWithoutRideInput
  }

  export type RideUncheckedCreateInput = {
    id?: string
    driverId: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    bookings?: BookingUncheckedCreateNestedManyWithoutRideInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutRideInput
    messages?: MessageUncheckedCreateNestedManyWithoutRideInput
  }

  export type RideUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    driver?: UserUpdateOneRequiredWithoutRidesAsDriverNestedInput
    bookings?: BookingUpdateManyWithoutRideNestedInput
    reviews?: ReviewUpdateManyWithoutRideNestedInput
    messages?: MessageUpdateManyWithoutRideNestedInput
  }

  export type RideUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    driverId?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    bookings?: BookingUncheckedUpdateManyWithoutRideNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutRideNestedInput
    messages?: MessageUncheckedUpdateManyWithoutRideNestedInput
  }

  export type RideCreateManyInput = {
    id?: string
    driverId: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
  }

  export type RideUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RideUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    driverId?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BookingCreateInput = {
    id?: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    ride: RideCreateNestedOneWithoutBookingsInput
    passenger: UserCreateNestedOneWithoutBookingsInput
    transactions?: TransactionCreateNestedManyWithoutBookingInput
  }

  export type BookingUncheckedCreateInput = {
    id?: string
    rideId: string
    passengerId: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutBookingInput
  }

  export type BookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutBookingsNestedInput
    passenger?: UserUpdateOneRequiredWithoutBookingsNestedInput
    transactions?: TransactionUpdateManyWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    passengerId?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutBookingNestedInput
  }

  export type BookingCreateManyInput = {
    id?: string
    rideId: string
    passengerId: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    passengerId?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewCreateInput = {
    id?: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
    ride: RideCreateNestedOneWithoutReviewsInput
    reviewer: UserCreateNestedOneWithoutReviewsSentInput
    reviewee: UserCreateNestedOneWithoutReviewsReceivedInput
  }

  export type ReviewUncheckedCreateInput = {
    id?: string
    rideId: string
    reviewerId: string
    revieweeId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type ReviewUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutReviewsNestedInput
    reviewer?: UserUpdateOneRequiredWithoutReviewsSentNestedInput
    reviewee?: UserUpdateOneRequiredWithoutReviewsReceivedNestedInput
  }

  export type ReviewUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    reviewerId?: StringFieldUpdateOperationsInput | string
    revieweeId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewCreateManyInput = {
    id?: string
    rideId: string
    reviewerId: string
    revieweeId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type ReviewUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    reviewerId?: StringFieldUpdateOperationsInput | string
    revieweeId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DriverVerificationCreateInput = {
    id?: string
    licenseFrontImageUrl: string
    licenseBackImageUrl: string
    registrationFrontImageUrl: string
    registrationBackImageUrl: string
    vehiclePlate: string
    vehicleModel?: string | null
    vehicleType?: string
    status?: $Enums.VerificationStatus
    rejectionReason?: string | null
    reviewedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutDriverVerificationInput
  }

  export type DriverVerificationUncheckedCreateInput = {
    id?: string
    userId: string
    licenseFrontImageUrl: string
    licenseBackImageUrl: string
    registrationFrontImageUrl: string
    registrationBackImageUrl: string
    vehiclePlate: string
    vehicleModel?: string | null
    vehicleType?: string
    status?: $Enums.VerificationStatus
    rejectionReason?: string | null
    reviewedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DriverVerificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    licenseFrontImageUrl?: StringFieldUpdateOperationsInput | string
    licenseBackImageUrl?: StringFieldUpdateOperationsInput | string
    registrationFrontImageUrl?: StringFieldUpdateOperationsInput | string
    registrationBackImageUrl?: StringFieldUpdateOperationsInput | string
    vehiclePlate?: StringFieldUpdateOperationsInput | string
    vehicleModel?: NullableStringFieldUpdateOperationsInput | string | null
    vehicleType?: StringFieldUpdateOperationsInput | string
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutDriverVerificationNestedInput
  }

  export type DriverVerificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    licenseFrontImageUrl?: StringFieldUpdateOperationsInput | string
    licenseBackImageUrl?: StringFieldUpdateOperationsInput | string
    registrationFrontImageUrl?: StringFieldUpdateOperationsInput | string
    registrationBackImageUrl?: StringFieldUpdateOperationsInput | string
    vehiclePlate?: StringFieldUpdateOperationsInput | string
    vehicleModel?: NullableStringFieldUpdateOperationsInput | string | null
    vehicleType?: StringFieldUpdateOperationsInput | string
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DriverVerificationCreateManyInput = {
    id?: string
    userId: string
    licenseFrontImageUrl: string
    licenseBackImageUrl: string
    registrationFrontImageUrl: string
    registrationBackImageUrl: string
    vehiclePlate: string
    vehicleModel?: string | null
    vehicleType?: string
    status?: $Enums.VerificationStatus
    rejectionReason?: string | null
    reviewedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DriverVerificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    licenseFrontImageUrl?: StringFieldUpdateOperationsInput | string
    licenseBackImageUrl?: StringFieldUpdateOperationsInput | string
    registrationFrontImageUrl?: StringFieldUpdateOperationsInput | string
    registrationBackImageUrl?: StringFieldUpdateOperationsInput | string
    vehiclePlate?: StringFieldUpdateOperationsInput | string
    vehicleModel?: NullableStringFieldUpdateOperationsInput | string | null
    vehicleType?: StringFieldUpdateOperationsInput | string
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DriverVerificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    licenseFrontImageUrl?: StringFieldUpdateOperationsInput | string
    licenseBackImageUrl?: StringFieldUpdateOperationsInput | string
    registrationFrontImageUrl?: StringFieldUpdateOperationsInput | string
    registrationBackImageUrl?: StringFieldUpdateOperationsInput | string
    vehiclePlate?: StringFieldUpdateOperationsInput | string
    vehicleModel?: NullableStringFieldUpdateOperationsInput | string | null
    vehicleType?: StringFieldUpdateOperationsInput | string
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProvinceMappingCreateInput = {
    id?: string
    oldProvince: string
    newProvince: string
    effectiveDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProvinceMappingUncheckedCreateInput = {
    id?: string
    oldProvince: string
    newProvince: string
    effectiveDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProvinceMappingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldProvince?: StringFieldUpdateOperationsInput | string
    newProvince?: StringFieldUpdateOperationsInput | string
    effectiveDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProvinceMappingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldProvince?: StringFieldUpdateOperationsInput | string
    newProvince?: StringFieldUpdateOperationsInput | string
    effectiveDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProvinceMappingCreateManyInput = {
    id?: string
    oldProvince: string
    newProvince: string
    effectiveDate: Date | string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProvinceMappingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldProvince?: StringFieldUpdateOperationsInput | string
    newProvince?: StringFieldUpdateOperationsInput | string
    effectiveDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProvinceMappingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    oldProvince?: StringFieldUpdateOperationsInput | string
    newProvince?: StringFieldUpdateOperationsInput | string
    effectiveDate?: DateTimeFieldUpdateOperationsInput | Date | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationCreateInput = {
    id?: string
    placeId: string
    name: string
    address: string
    latitude: number
    longitude: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocationUncheckedCreateInput = {
    id?: string
    placeId: string
    name: string
    address: string
    latitude: number
    longitude: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    placeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    placeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationCreateManyInput = {
    id?: string
    placeId: string
    name: string
    address: string
    latitude: number
    longitude: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    placeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    placeId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    address?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type RideListRelationFilter = {
    every?: RideWhereInput
    some?: RideWhereInput
    none?: RideWhereInput
  }

  export type BookingListRelationFilter = {
    every?: BookingWhereInput
    some?: BookingWhereInput
    none?: BookingWhereInput
  }

  export type ReviewListRelationFilter = {
    every?: ReviewWhereInput
    some?: ReviewWhereInput
    none?: ReviewWhereInput
  }

  export type RefreshTokenListRelationFilter = {
    every?: RefreshTokenWhereInput
    some?: RefreshTokenWhereInput
    none?: RefreshTokenWhereInput
  }

  export type NotificationListRelationFilter = {
    every?: NotificationWhereInput
    some?: NotificationWhereInput
    none?: NotificationWhereInput
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type WalletNullableRelationFilter = {
    is?: WalletWhereInput | null
    isNot?: WalletWhereInput | null
  }

  export type DriverVerificationNullableRelationFilter = {
    is?: DriverVerificationWhereInput | null
    isNot?: DriverVerificationWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type RideOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BookingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ReviewOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RefreshTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NotificationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    phone?: SortOrder
    avatarUrl?: SortOrder
    bio?: SortOrder
    role?: SortOrder
    driverRating?: SortOrder
    driverRatingCount?: SortOrder
    passengerRating?: SortOrder
    passengerRatingCount?: SortOrder
    isDriverVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    driverRating?: SortOrder
    driverRatingCount?: SortOrder
    passengerRating?: SortOrder
    passengerRatingCount?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    phone?: SortOrder
    avatarUrl?: SortOrder
    bio?: SortOrder
    role?: SortOrder
    driverRating?: SortOrder
    driverRatingCount?: SortOrder
    passengerRating?: SortOrder
    passengerRatingCount?: SortOrder
    isDriverVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    phone?: SortOrder
    avatarUrl?: SortOrder
    bio?: SortOrder
    role?: SortOrder
    driverRating?: SortOrder
    driverRatingCount?: SortOrder
    passengerRating?: SortOrder
    passengerRatingCount?: SortOrder
    isDriverVerified?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    driverRating?: SortOrder
    driverRatingCount?: SortOrder
    passengerRating?: SortOrder
    passengerRatingCount?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type TransactionListRelationFilter = {
    every?: TransactionWhereInput
    some?: TransactionWhereInput
    none?: TransactionWhereInput
  }

  export type TransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WalletCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    rideBalance?: SortOrder
    driverEarnings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletAvgOrderByAggregateInput = {
    rideBalance?: SortOrder
    driverEarnings?: SortOrder
  }

  export type WalletMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    rideBalance?: SortOrder
    driverEarnings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    rideBalance?: SortOrder
    driverEarnings?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WalletSumOrderByAggregateInput = {
    rideBalance?: SortOrder
    driverEarnings?: SortOrder
  }

  export type EnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type EnumTransactionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionStatus | EnumTransactionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionStatusFilter<$PrismaModel> | $Enums.TransactionStatus
  }

  export type WalletRelationFilter = {
    is?: WalletWhereInput
    isNot?: WalletWhereInput
  }

  export type BookingNullableRelationFilter = {
    is?: BookingWhereInput | null
    isNot?: BookingWhereInput | null
  }

  export type TransactionCountOrderByAggregateInput = {
    id?: SortOrder
    walletId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    description?: SortOrder
    externalId?: SortOrder
    bookingId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TransactionAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type TransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    walletId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    description?: SortOrder
    externalId?: SortOrder
    bookingId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TransactionMinOrderByAggregateInput = {
    id?: SortOrder
    walletId?: SortOrder
    amount?: SortOrder
    type?: SortOrder
    status?: SortOrder
    description?: SortOrder
    externalId?: SortOrder
    bookingId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TransactionSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type EnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type EnumTransactionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionStatus | EnumTransactionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionStatusWithAggregatesFilter<$PrismaModel> | $Enums.TransactionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionStatusFilter<$PrismaModel>
    _max?: NestedEnumTransactionStatusFilter<$PrismaModel>
  }

  export type RideRelationFilter = {
    is?: RideWhereInput
    isNot?: RideWhereInput
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
  }

  export type RefreshTokenCountOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    revoked?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RefreshTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    revoked?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RefreshTokenMinOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    revoked?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    content?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    content?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    content?: SortOrder
    type?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type EnumRideStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RideStatus | EnumRideStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRideStatusFilter<$PrismaModel> | $Enums.RideStatus
  }

  export type RideCountOrderByAggregateInput = {
    id?: SortOrder
    driverId?: SortOrder
    origin?: SortOrder
    originLat?: SortOrder
    originLng?: SortOrder
    destination?: SortOrder
    destinationLat?: SortOrder
    destinationLng?: SortOrder
    distance?: SortOrder
    duration?: SortOrder
    departureTime?: SortOrder
    availableSeats?: SortOrder
    pricePerSeat?: SortOrder
    status?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    originHouseNumber?: SortOrder
    originStreet?: SortOrder
    originWard?: SortOrder
    originDistrict?: SortOrder
    originProvince?: SortOrder
    originAddressType?: SortOrder
    destHouseNumber?: SortOrder
    destStreet?: SortOrder
    destWard?: SortOrder
    destDistrict?: SortOrder
    destProvince?: SortOrder
    destAddressType?: SortOrder
    addressDetailLevel?: SortOrder
  }

  export type RideAvgOrderByAggregateInput = {
    originLat?: SortOrder
    originLng?: SortOrder
    destinationLat?: SortOrder
    destinationLng?: SortOrder
    distance?: SortOrder
    duration?: SortOrder
    availableSeats?: SortOrder
    pricePerSeat?: SortOrder
  }

  export type RideMaxOrderByAggregateInput = {
    id?: SortOrder
    driverId?: SortOrder
    origin?: SortOrder
    originLat?: SortOrder
    originLng?: SortOrder
    destination?: SortOrder
    destinationLat?: SortOrder
    destinationLng?: SortOrder
    distance?: SortOrder
    duration?: SortOrder
    departureTime?: SortOrder
    availableSeats?: SortOrder
    pricePerSeat?: SortOrder
    status?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    originHouseNumber?: SortOrder
    originStreet?: SortOrder
    originWard?: SortOrder
    originDistrict?: SortOrder
    originProvince?: SortOrder
    originAddressType?: SortOrder
    destHouseNumber?: SortOrder
    destStreet?: SortOrder
    destWard?: SortOrder
    destDistrict?: SortOrder
    destProvince?: SortOrder
    destAddressType?: SortOrder
    addressDetailLevel?: SortOrder
  }

  export type RideMinOrderByAggregateInput = {
    id?: SortOrder
    driverId?: SortOrder
    origin?: SortOrder
    originLat?: SortOrder
    originLng?: SortOrder
    destination?: SortOrder
    destinationLat?: SortOrder
    destinationLng?: SortOrder
    distance?: SortOrder
    duration?: SortOrder
    departureTime?: SortOrder
    availableSeats?: SortOrder
    pricePerSeat?: SortOrder
    status?: SortOrder
    description?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    originHouseNumber?: SortOrder
    originStreet?: SortOrder
    originWard?: SortOrder
    originDistrict?: SortOrder
    originProvince?: SortOrder
    originAddressType?: SortOrder
    destHouseNumber?: SortOrder
    destStreet?: SortOrder
    destWard?: SortOrder
    destDistrict?: SortOrder
    destProvince?: SortOrder
    destAddressType?: SortOrder
    addressDetailLevel?: SortOrder
  }

  export type RideSumOrderByAggregateInput = {
    originLat?: SortOrder
    originLng?: SortOrder
    destinationLat?: SortOrder
    destinationLng?: SortOrder
    distance?: SortOrder
    duration?: SortOrder
    availableSeats?: SortOrder
    pricePerSeat?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type EnumRideStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RideStatus | EnumRideStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRideStatusWithAggregatesFilter<$PrismaModel> | $Enums.RideStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRideStatusFilter<$PrismaModel>
    _max?: NestedEnumRideStatusFilter<$PrismaModel>
  }

  export type EnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }

  export type EnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type BookingCountOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    passengerId?: SortOrder
    seats?: SortOrder
    totalPrice?: SortOrder
    status?: SortOrder
    paymentStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BookingAvgOrderByAggregateInput = {
    seats?: SortOrder
    totalPrice?: SortOrder
  }

  export type BookingMaxOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    passengerId?: SortOrder
    seats?: SortOrder
    totalPrice?: SortOrder
    status?: SortOrder
    paymentStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BookingMinOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    passengerId?: SortOrder
    seats?: SortOrder
    totalPrice?: SortOrder
    status?: SortOrder
    paymentStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BookingSumOrderByAggregateInput = {
    seats?: SortOrder
    totalPrice?: SortOrder
  }

  export type EnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }

  export type EnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type EnumReviewTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewType | EnumReviewTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewTypeFilter<$PrismaModel> | $Enums.ReviewType
  }

  export type ReviewCountOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    reviewerId?: SortOrder
    revieweeId?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
  }

  export type ReviewAvgOrderByAggregateInput = {
    rating?: SortOrder
  }

  export type ReviewMaxOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    reviewerId?: SortOrder
    revieweeId?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
  }

  export type ReviewMinOrderByAggregateInput = {
    id?: SortOrder
    rideId?: SortOrder
    reviewerId?: SortOrder
    revieweeId?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    type?: SortOrder
    createdAt?: SortOrder
  }

  export type ReviewSumOrderByAggregateInput = {
    rating?: SortOrder
  }

  export type EnumReviewTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewType | EnumReviewTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewTypeWithAggregatesFilter<$PrismaModel> | $Enums.ReviewType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumReviewTypeFilter<$PrismaModel>
    _max?: NestedEnumReviewTypeFilter<$PrismaModel>
  }

  export type EnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DriverVerificationCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    licenseFrontImageUrl?: SortOrder
    licenseBackImageUrl?: SortOrder
    registrationFrontImageUrl?: SortOrder
    registrationBackImageUrl?: SortOrder
    vehiclePlate?: SortOrder
    vehicleModel?: SortOrder
    vehicleType?: SortOrder
    status?: SortOrder
    rejectionReason?: SortOrder
    reviewedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DriverVerificationMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    licenseFrontImageUrl?: SortOrder
    licenseBackImageUrl?: SortOrder
    registrationFrontImageUrl?: SortOrder
    registrationBackImageUrl?: SortOrder
    vehiclePlate?: SortOrder
    vehicleModel?: SortOrder
    vehicleType?: SortOrder
    status?: SortOrder
    rejectionReason?: SortOrder
    reviewedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DriverVerificationMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    licenseFrontImageUrl?: SortOrder
    licenseBackImageUrl?: SortOrder
    registrationFrontImageUrl?: SortOrder
    registrationBackImageUrl?: SortOrder
    vehiclePlate?: SortOrder
    vehicleModel?: SortOrder
    vehicleType?: SortOrder
    status?: SortOrder
    rejectionReason?: SortOrder
    reviewedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type ProvinceMappingOldProvinceEffectiveDateCompoundUniqueInput = {
    oldProvince: string
    effectiveDate: Date | string
  }

  export type ProvinceMappingCountOrderByAggregateInput = {
    id?: SortOrder
    oldProvince?: SortOrder
    newProvince?: SortOrder
    effectiveDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProvinceMappingMaxOrderByAggregateInput = {
    id?: SortOrder
    oldProvince?: SortOrder
    newProvince?: SortOrder
    effectiveDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProvinceMappingMinOrderByAggregateInput = {
    id?: SortOrder
    oldProvince?: SortOrder
    newProvince?: SortOrder
    effectiveDate?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationCountOrderByAggregateInput = {
    id?: SortOrder
    placeId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type LocationMaxOrderByAggregateInput = {
    id?: SortOrder
    placeId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationMinOrderByAggregateInput = {
    id?: SortOrder
    placeId?: SortOrder
    name?: SortOrder
    address?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type RideCreateNestedManyWithoutDriverInput = {
    create?: XOR<RideCreateWithoutDriverInput, RideUncheckedCreateWithoutDriverInput> | RideCreateWithoutDriverInput[] | RideUncheckedCreateWithoutDriverInput[]
    connectOrCreate?: RideCreateOrConnectWithoutDriverInput | RideCreateOrConnectWithoutDriverInput[]
    createMany?: RideCreateManyDriverInputEnvelope
    connect?: RideWhereUniqueInput | RideWhereUniqueInput[]
  }

  export type BookingCreateNestedManyWithoutPassengerInput = {
    create?: XOR<BookingCreateWithoutPassengerInput, BookingUncheckedCreateWithoutPassengerInput> | BookingCreateWithoutPassengerInput[] | BookingUncheckedCreateWithoutPassengerInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPassengerInput | BookingCreateOrConnectWithoutPassengerInput[]
    createMany?: BookingCreateManyPassengerInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewCreateNestedManyWithoutReviewerInput = {
    create?: XOR<ReviewCreateWithoutReviewerInput, ReviewUncheckedCreateWithoutReviewerInput> | ReviewCreateWithoutReviewerInput[] | ReviewUncheckedCreateWithoutReviewerInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutReviewerInput | ReviewCreateOrConnectWithoutReviewerInput[]
    createMany?: ReviewCreateManyReviewerInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type ReviewCreateNestedManyWithoutRevieweeInput = {
    create?: XOR<ReviewCreateWithoutRevieweeInput, ReviewUncheckedCreateWithoutRevieweeInput> | ReviewCreateWithoutRevieweeInput[] | ReviewUncheckedCreateWithoutRevieweeInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRevieweeInput | ReviewCreateOrConnectWithoutRevieweeInput[]
    createMany?: ReviewCreateManyRevieweeInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type RefreshTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
  }

  export type NotificationCreateNestedManyWithoutUserInput = {
    create?: XOR<NotificationCreateWithoutUserInput, NotificationUncheckedCreateWithoutUserInput> | NotificationCreateWithoutUserInput[] | NotificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUserInput | NotificationCreateOrConnectWithoutUserInput[]
    createMany?: NotificationCreateManyUserInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type MessageCreateNestedManyWithoutSenderInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type MessageCreateNestedManyWithoutReceiverInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type WalletCreateNestedOneWithoutUserInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    connect?: WalletWhereUniqueInput
  }

  export type DriverVerificationCreateNestedOneWithoutUserInput = {
    create?: XOR<DriverVerificationCreateWithoutUserInput, DriverVerificationUncheckedCreateWithoutUserInput>
    connectOrCreate?: DriverVerificationCreateOrConnectWithoutUserInput
    connect?: DriverVerificationWhereUniqueInput
  }

  export type RideUncheckedCreateNestedManyWithoutDriverInput = {
    create?: XOR<RideCreateWithoutDriverInput, RideUncheckedCreateWithoutDriverInput> | RideCreateWithoutDriverInput[] | RideUncheckedCreateWithoutDriverInput[]
    connectOrCreate?: RideCreateOrConnectWithoutDriverInput | RideCreateOrConnectWithoutDriverInput[]
    createMany?: RideCreateManyDriverInputEnvelope
    connect?: RideWhereUniqueInput | RideWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutPassengerInput = {
    create?: XOR<BookingCreateWithoutPassengerInput, BookingUncheckedCreateWithoutPassengerInput> | BookingCreateWithoutPassengerInput[] | BookingUncheckedCreateWithoutPassengerInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPassengerInput | BookingCreateOrConnectWithoutPassengerInput[]
    createMany?: BookingCreateManyPassengerInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewUncheckedCreateNestedManyWithoutReviewerInput = {
    create?: XOR<ReviewCreateWithoutReviewerInput, ReviewUncheckedCreateWithoutReviewerInput> | ReviewCreateWithoutReviewerInput[] | ReviewUncheckedCreateWithoutReviewerInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutReviewerInput | ReviewCreateOrConnectWithoutReviewerInput[]
    createMany?: ReviewCreateManyReviewerInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type ReviewUncheckedCreateNestedManyWithoutRevieweeInput = {
    create?: XOR<ReviewCreateWithoutRevieweeInput, ReviewUncheckedCreateWithoutRevieweeInput> | ReviewCreateWithoutRevieweeInput[] | ReviewUncheckedCreateWithoutRevieweeInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRevieweeInput | ReviewCreateOrConnectWithoutRevieweeInput[]
    createMany?: ReviewCreateManyRevieweeInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type RefreshTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
  }

  export type NotificationUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<NotificationCreateWithoutUserInput, NotificationUncheckedCreateWithoutUserInput> | NotificationCreateWithoutUserInput[] | NotificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUserInput | NotificationCreateOrConnectWithoutUserInput[]
    createMany?: NotificationCreateManyUserInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutReceiverInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type WalletUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    connect?: WalletWhereUniqueInput
  }

  export type DriverVerificationUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<DriverVerificationCreateWithoutUserInput, DriverVerificationUncheckedCreateWithoutUserInput>
    connectOrCreate?: DriverVerificationCreateOrConnectWithoutUserInput
    connect?: DriverVerificationWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type RideUpdateManyWithoutDriverNestedInput = {
    create?: XOR<RideCreateWithoutDriverInput, RideUncheckedCreateWithoutDriverInput> | RideCreateWithoutDriverInput[] | RideUncheckedCreateWithoutDriverInput[]
    connectOrCreate?: RideCreateOrConnectWithoutDriverInput | RideCreateOrConnectWithoutDriverInput[]
    upsert?: RideUpsertWithWhereUniqueWithoutDriverInput | RideUpsertWithWhereUniqueWithoutDriverInput[]
    createMany?: RideCreateManyDriverInputEnvelope
    set?: RideWhereUniqueInput | RideWhereUniqueInput[]
    disconnect?: RideWhereUniqueInput | RideWhereUniqueInput[]
    delete?: RideWhereUniqueInput | RideWhereUniqueInput[]
    connect?: RideWhereUniqueInput | RideWhereUniqueInput[]
    update?: RideUpdateWithWhereUniqueWithoutDriverInput | RideUpdateWithWhereUniqueWithoutDriverInput[]
    updateMany?: RideUpdateManyWithWhereWithoutDriverInput | RideUpdateManyWithWhereWithoutDriverInput[]
    deleteMany?: RideScalarWhereInput | RideScalarWhereInput[]
  }

  export type BookingUpdateManyWithoutPassengerNestedInput = {
    create?: XOR<BookingCreateWithoutPassengerInput, BookingUncheckedCreateWithoutPassengerInput> | BookingCreateWithoutPassengerInput[] | BookingUncheckedCreateWithoutPassengerInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPassengerInput | BookingCreateOrConnectWithoutPassengerInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutPassengerInput | BookingUpsertWithWhereUniqueWithoutPassengerInput[]
    createMany?: BookingCreateManyPassengerInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutPassengerInput | BookingUpdateWithWhereUniqueWithoutPassengerInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutPassengerInput | BookingUpdateManyWithWhereWithoutPassengerInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUpdateManyWithoutReviewerNestedInput = {
    create?: XOR<ReviewCreateWithoutReviewerInput, ReviewUncheckedCreateWithoutReviewerInput> | ReviewCreateWithoutReviewerInput[] | ReviewUncheckedCreateWithoutReviewerInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutReviewerInput | ReviewCreateOrConnectWithoutReviewerInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutReviewerInput | ReviewUpsertWithWhereUniqueWithoutReviewerInput[]
    createMany?: ReviewCreateManyReviewerInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutReviewerInput | ReviewUpdateWithWhereUniqueWithoutReviewerInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutReviewerInput | ReviewUpdateManyWithWhereWithoutReviewerInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type ReviewUpdateManyWithoutRevieweeNestedInput = {
    create?: XOR<ReviewCreateWithoutRevieweeInput, ReviewUncheckedCreateWithoutRevieweeInput> | ReviewCreateWithoutRevieweeInput[] | ReviewUncheckedCreateWithoutRevieweeInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRevieweeInput | ReviewCreateOrConnectWithoutRevieweeInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutRevieweeInput | ReviewUpsertWithWhereUniqueWithoutRevieweeInput[]
    createMany?: ReviewCreateManyRevieweeInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutRevieweeInput | ReviewUpdateWithWhereUniqueWithoutRevieweeInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutRevieweeInput | ReviewUpdateManyWithWhereWithoutRevieweeInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type RefreshTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    upsert?: RefreshTokenUpsertWithWhereUniqueWithoutUserInput | RefreshTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    set?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    disconnect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    delete?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    update?: RefreshTokenUpdateWithWhereUniqueWithoutUserInput | RefreshTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RefreshTokenUpdateManyWithWhereWithoutUserInput | RefreshTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
  }

  export type NotificationUpdateManyWithoutUserNestedInput = {
    create?: XOR<NotificationCreateWithoutUserInput, NotificationUncheckedCreateWithoutUserInput> | NotificationCreateWithoutUserInput[] | NotificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUserInput | NotificationCreateOrConnectWithoutUserInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutUserInput | NotificationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: NotificationCreateManyUserInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutUserInput | NotificationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutUserInput | NotificationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type MessageUpdateManyWithoutSenderNestedInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutSenderInput | MessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutSenderInput | MessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutSenderInput | MessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type MessageUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutReceiverInput | MessageUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutReceiverInput | MessageUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutReceiverInput | MessageUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type WalletUpdateOneWithoutUserNestedInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    upsert?: WalletUpsertWithoutUserInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutUserInput, WalletUpdateWithoutUserInput>, WalletUncheckedUpdateWithoutUserInput>
  }

  export type DriverVerificationUpdateOneWithoutUserNestedInput = {
    create?: XOR<DriverVerificationCreateWithoutUserInput, DriverVerificationUncheckedCreateWithoutUserInput>
    connectOrCreate?: DriverVerificationCreateOrConnectWithoutUserInput
    upsert?: DriverVerificationUpsertWithoutUserInput
    disconnect?: DriverVerificationWhereInput | boolean
    delete?: DriverVerificationWhereInput | boolean
    connect?: DriverVerificationWhereUniqueInput
    update?: XOR<XOR<DriverVerificationUpdateToOneWithWhereWithoutUserInput, DriverVerificationUpdateWithoutUserInput>, DriverVerificationUncheckedUpdateWithoutUserInput>
  }

  export type RideUncheckedUpdateManyWithoutDriverNestedInput = {
    create?: XOR<RideCreateWithoutDriverInput, RideUncheckedCreateWithoutDriverInput> | RideCreateWithoutDriverInput[] | RideUncheckedCreateWithoutDriverInput[]
    connectOrCreate?: RideCreateOrConnectWithoutDriverInput | RideCreateOrConnectWithoutDriverInput[]
    upsert?: RideUpsertWithWhereUniqueWithoutDriverInput | RideUpsertWithWhereUniqueWithoutDriverInput[]
    createMany?: RideCreateManyDriverInputEnvelope
    set?: RideWhereUniqueInput | RideWhereUniqueInput[]
    disconnect?: RideWhereUniqueInput | RideWhereUniqueInput[]
    delete?: RideWhereUniqueInput | RideWhereUniqueInput[]
    connect?: RideWhereUniqueInput | RideWhereUniqueInput[]
    update?: RideUpdateWithWhereUniqueWithoutDriverInput | RideUpdateWithWhereUniqueWithoutDriverInput[]
    updateMany?: RideUpdateManyWithWhereWithoutDriverInput | RideUpdateManyWithWhereWithoutDriverInput[]
    deleteMany?: RideScalarWhereInput | RideScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutPassengerNestedInput = {
    create?: XOR<BookingCreateWithoutPassengerInput, BookingUncheckedCreateWithoutPassengerInput> | BookingCreateWithoutPassengerInput[] | BookingUncheckedCreateWithoutPassengerInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutPassengerInput | BookingCreateOrConnectWithoutPassengerInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutPassengerInput | BookingUpsertWithWhereUniqueWithoutPassengerInput[]
    createMany?: BookingCreateManyPassengerInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutPassengerInput | BookingUpdateWithWhereUniqueWithoutPassengerInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutPassengerInput | BookingUpdateManyWithWhereWithoutPassengerInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUncheckedUpdateManyWithoutReviewerNestedInput = {
    create?: XOR<ReviewCreateWithoutReviewerInput, ReviewUncheckedCreateWithoutReviewerInput> | ReviewCreateWithoutReviewerInput[] | ReviewUncheckedCreateWithoutReviewerInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutReviewerInput | ReviewCreateOrConnectWithoutReviewerInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutReviewerInput | ReviewUpsertWithWhereUniqueWithoutReviewerInput[]
    createMany?: ReviewCreateManyReviewerInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutReviewerInput | ReviewUpdateWithWhereUniqueWithoutReviewerInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutReviewerInput | ReviewUpdateManyWithWhereWithoutReviewerInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type ReviewUncheckedUpdateManyWithoutRevieweeNestedInput = {
    create?: XOR<ReviewCreateWithoutRevieweeInput, ReviewUncheckedCreateWithoutRevieweeInput> | ReviewCreateWithoutRevieweeInput[] | ReviewUncheckedCreateWithoutRevieweeInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRevieweeInput | ReviewCreateOrConnectWithoutRevieweeInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutRevieweeInput | ReviewUpsertWithWhereUniqueWithoutRevieweeInput[]
    createMany?: ReviewCreateManyRevieweeInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutRevieweeInput | ReviewUpdateWithWhereUniqueWithoutRevieweeInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutRevieweeInput | ReviewUpdateManyWithWhereWithoutRevieweeInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type RefreshTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    upsert?: RefreshTokenUpsertWithWhereUniqueWithoutUserInput | RefreshTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    set?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    disconnect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    delete?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    update?: RefreshTokenUpdateWithWhereUniqueWithoutUserInput | RefreshTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RefreshTokenUpdateManyWithWhereWithoutUserInput | RefreshTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
  }

  export type NotificationUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<NotificationCreateWithoutUserInput, NotificationUncheckedCreateWithoutUserInput> | NotificationCreateWithoutUserInput[] | NotificationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUserInput | NotificationCreateOrConnectWithoutUserInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutUserInput | NotificationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: NotificationCreateManyUserInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutUserInput | NotificationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutUserInput | NotificationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutSenderInput | MessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutSenderInput | MessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutSenderInput | MessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutReceiverInput | MessageUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutReceiverInput | MessageUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutReceiverInput | MessageUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type WalletUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    connectOrCreate?: WalletCreateOrConnectWithoutUserInput
    upsert?: WalletUpsertWithoutUserInput
    disconnect?: WalletWhereInput | boolean
    delete?: WalletWhereInput | boolean
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutUserInput, WalletUpdateWithoutUserInput>, WalletUncheckedUpdateWithoutUserInput>
  }

  export type DriverVerificationUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<DriverVerificationCreateWithoutUserInput, DriverVerificationUncheckedCreateWithoutUserInput>
    connectOrCreate?: DriverVerificationCreateOrConnectWithoutUserInput
    upsert?: DriverVerificationUpsertWithoutUserInput
    disconnect?: DriverVerificationWhereInput | boolean
    delete?: DriverVerificationWhereInput | boolean
    connect?: DriverVerificationWhereUniqueInput
    update?: XOR<XOR<DriverVerificationUpdateToOneWithWhereWithoutUserInput, DriverVerificationUpdateWithoutUserInput>, DriverVerificationUncheckedUpdateWithoutUserInput>
  }

  export type UserCreateNestedOneWithoutWalletInput = {
    create?: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
    connectOrCreate?: UserCreateOrConnectWithoutWalletInput
    connect?: UserWhereUniqueInput
  }

  export type TransactionCreateNestedManyWithoutWalletInput = {
    create?: XOR<TransactionCreateWithoutWalletInput, TransactionUncheckedCreateWithoutWalletInput> | TransactionCreateWithoutWalletInput[] | TransactionUncheckedCreateWithoutWalletInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutWalletInput | TransactionCreateOrConnectWithoutWalletInput[]
    createMany?: TransactionCreateManyWalletInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutWalletInput = {
    create?: XOR<TransactionCreateWithoutWalletInput, TransactionUncheckedCreateWithoutWalletInput> | TransactionCreateWithoutWalletInput[] | TransactionUncheckedCreateWithoutWalletInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutWalletInput | TransactionCreateOrConnectWithoutWalletInput[]
    createMany?: TransactionCreateManyWalletInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutWalletNestedInput = {
    create?: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
    connectOrCreate?: UserCreateOrConnectWithoutWalletInput
    upsert?: UserUpsertWithoutWalletInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutWalletInput, UserUpdateWithoutWalletInput>, UserUncheckedUpdateWithoutWalletInput>
  }

  export type TransactionUpdateManyWithoutWalletNestedInput = {
    create?: XOR<TransactionCreateWithoutWalletInput, TransactionUncheckedCreateWithoutWalletInput> | TransactionCreateWithoutWalletInput[] | TransactionUncheckedCreateWithoutWalletInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutWalletInput | TransactionCreateOrConnectWithoutWalletInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutWalletInput | TransactionUpsertWithWhereUniqueWithoutWalletInput[]
    createMany?: TransactionCreateManyWalletInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutWalletInput | TransactionUpdateWithWhereUniqueWithoutWalletInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutWalletInput | TransactionUpdateManyWithWhereWithoutWalletInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutWalletNestedInput = {
    create?: XOR<TransactionCreateWithoutWalletInput, TransactionUncheckedCreateWithoutWalletInput> | TransactionCreateWithoutWalletInput[] | TransactionUncheckedCreateWithoutWalletInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutWalletInput | TransactionCreateOrConnectWithoutWalletInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutWalletInput | TransactionUpsertWithWhereUniqueWithoutWalletInput[]
    createMany?: TransactionCreateManyWalletInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutWalletInput | TransactionUpdateWithWhereUniqueWithoutWalletInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutWalletInput | TransactionUpdateManyWithWhereWithoutWalletInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type WalletCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<WalletCreateWithoutTransactionsInput, WalletUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: WalletCreateOrConnectWithoutTransactionsInput
    connect?: WalletWhereUniqueInput
  }

  export type BookingCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<BookingCreateWithoutTransactionsInput, BookingUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: BookingCreateOrConnectWithoutTransactionsInput
    connect?: BookingWhereUniqueInput
  }

  export type EnumTransactionTypeFieldUpdateOperationsInput = {
    set?: $Enums.TransactionType
  }

  export type EnumTransactionStatusFieldUpdateOperationsInput = {
    set?: $Enums.TransactionStatus
  }

  export type WalletUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<WalletCreateWithoutTransactionsInput, WalletUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: WalletCreateOrConnectWithoutTransactionsInput
    upsert?: WalletUpsertWithoutTransactionsInput
    connect?: WalletWhereUniqueInput
    update?: XOR<XOR<WalletUpdateToOneWithWhereWithoutTransactionsInput, WalletUpdateWithoutTransactionsInput>, WalletUncheckedUpdateWithoutTransactionsInput>
  }

  export type BookingUpdateOneWithoutTransactionsNestedInput = {
    create?: XOR<BookingCreateWithoutTransactionsInput, BookingUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: BookingCreateOrConnectWithoutTransactionsInput
    upsert?: BookingUpsertWithoutTransactionsInput
    disconnect?: BookingWhereInput | boolean
    delete?: BookingWhereInput | boolean
    connect?: BookingWhereUniqueInput
    update?: XOR<XOR<BookingUpdateToOneWithWhereWithoutTransactionsInput, BookingUpdateWithoutTransactionsInput>, BookingUncheckedUpdateWithoutTransactionsInput>
  }

  export type RideCreateNestedOneWithoutMessagesInput = {
    create?: XOR<RideCreateWithoutMessagesInput, RideUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: RideCreateOrConnectWithoutMessagesInput
    connect?: RideWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutSentMessagesInput = {
    create?: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutReceivedMessagesInput = {
    create?: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type RideUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<RideCreateWithoutMessagesInput, RideUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: RideCreateOrConnectWithoutMessagesInput
    upsert?: RideUpsertWithoutMessagesInput
    connect?: RideWhereUniqueInput
    update?: XOR<XOR<RideUpdateToOneWithWhereWithoutMessagesInput, RideUpdateWithoutMessagesInput>, RideUncheckedUpdateWithoutMessagesInput>
  }

  export type UserUpdateOneRequiredWithoutSentMessagesNestedInput = {
    create?: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentMessagesInput
    upsert?: UserUpsertWithoutSentMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSentMessagesInput, UserUpdateWithoutSentMessagesInput>, UserUncheckedUpdateWithoutSentMessagesInput>
  }

  export type UserUpdateOneRequiredWithoutReceivedMessagesNestedInput = {
    create?: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedMessagesInput
    upsert?: UserUpsertWithoutReceivedMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReceivedMessagesInput, UserUpdateWithoutReceivedMessagesInput>, UserUncheckedUpdateWithoutReceivedMessagesInput>
  }

  export type UserCreateNestedOneWithoutRefreshTokensInput = {
    create?: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutRefreshTokensInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutRefreshTokensNestedInput = {
    create?: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutRefreshTokensInput
    upsert?: UserUpsertWithoutRefreshTokensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRefreshTokensInput, UserUpdateWithoutRefreshTokensInput>, UserUncheckedUpdateWithoutRefreshTokensInput>
  }

  export type UserCreateNestedOneWithoutNotificationsInput = {
    create?: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNotificationsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutNotificationsNestedInput = {
    create?: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNotificationsInput
    upsert?: UserUpsertWithoutNotificationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutNotificationsInput, UserUpdateWithoutNotificationsInput>, UserUncheckedUpdateWithoutNotificationsInput>
  }

  export type UserCreateNestedOneWithoutRidesAsDriverInput = {
    create?: XOR<UserCreateWithoutRidesAsDriverInput, UserUncheckedCreateWithoutRidesAsDriverInput>
    connectOrCreate?: UserCreateOrConnectWithoutRidesAsDriverInput
    connect?: UserWhereUniqueInput
  }

  export type BookingCreateNestedManyWithoutRideInput = {
    create?: XOR<BookingCreateWithoutRideInput, BookingUncheckedCreateWithoutRideInput> | BookingCreateWithoutRideInput[] | BookingUncheckedCreateWithoutRideInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutRideInput | BookingCreateOrConnectWithoutRideInput[]
    createMany?: BookingCreateManyRideInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewCreateNestedManyWithoutRideInput = {
    create?: XOR<ReviewCreateWithoutRideInput, ReviewUncheckedCreateWithoutRideInput> | ReviewCreateWithoutRideInput[] | ReviewUncheckedCreateWithoutRideInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRideInput | ReviewCreateOrConnectWithoutRideInput[]
    createMany?: ReviewCreateManyRideInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type MessageCreateNestedManyWithoutRideInput = {
    create?: XOR<MessageCreateWithoutRideInput, MessageUncheckedCreateWithoutRideInput> | MessageCreateWithoutRideInput[] | MessageUncheckedCreateWithoutRideInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutRideInput | MessageCreateOrConnectWithoutRideInput[]
    createMany?: MessageCreateManyRideInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutRideInput = {
    create?: XOR<BookingCreateWithoutRideInput, BookingUncheckedCreateWithoutRideInput> | BookingCreateWithoutRideInput[] | BookingUncheckedCreateWithoutRideInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutRideInput | BookingCreateOrConnectWithoutRideInput[]
    createMany?: BookingCreateManyRideInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewUncheckedCreateNestedManyWithoutRideInput = {
    create?: XOR<ReviewCreateWithoutRideInput, ReviewUncheckedCreateWithoutRideInput> | ReviewCreateWithoutRideInput[] | ReviewUncheckedCreateWithoutRideInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRideInput | ReviewCreateOrConnectWithoutRideInput[]
    createMany?: ReviewCreateManyRideInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutRideInput = {
    create?: XOR<MessageCreateWithoutRideInput, MessageUncheckedCreateWithoutRideInput> | MessageCreateWithoutRideInput[] | MessageUncheckedCreateWithoutRideInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutRideInput | MessageCreateOrConnectWithoutRideInput[]
    createMany?: MessageCreateManyRideInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumRideStatusFieldUpdateOperationsInput = {
    set?: $Enums.RideStatus
  }

  export type UserUpdateOneRequiredWithoutRidesAsDriverNestedInput = {
    create?: XOR<UserCreateWithoutRidesAsDriverInput, UserUncheckedCreateWithoutRidesAsDriverInput>
    connectOrCreate?: UserCreateOrConnectWithoutRidesAsDriverInput
    upsert?: UserUpsertWithoutRidesAsDriverInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRidesAsDriverInput, UserUpdateWithoutRidesAsDriverInput>, UserUncheckedUpdateWithoutRidesAsDriverInput>
  }

  export type BookingUpdateManyWithoutRideNestedInput = {
    create?: XOR<BookingCreateWithoutRideInput, BookingUncheckedCreateWithoutRideInput> | BookingCreateWithoutRideInput[] | BookingUncheckedCreateWithoutRideInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutRideInput | BookingCreateOrConnectWithoutRideInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutRideInput | BookingUpsertWithWhereUniqueWithoutRideInput[]
    createMany?: BookingCreateManyRideInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutRideInput | BookingUpdateWithWhereUniqueWithoutRideInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutRideInput | BookingUpdateManyWithWhereWithoutRideInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUpdateManyWithoutRideNestedInput = {
    create?: XOR<ReviewCreateWithoutRideInput, ReviewUncheckedCreateWithoutRideInput> | ReviewCreateWithoutRideInput[] | ReviewUncheckedCreateWithoutRideInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRideInput | ReviewCreateOrConnectWithoutRideInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutRideInput | ReviewUpsertWithWhereUniqueWithoutRideInput[]
    createMany?: ReviewCreateManyRideInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutRideInput | ReviewUpdateWithWhereUniqueWithoutRideInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutRideInput | ReviewUpdateManyWithWhereWithoutRideInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type MessageUpdateManyWithoutRideNestedInput = {
    create?: XOR<MessageCreateWithoutRideInput, MessageUncheckedCreateWithoutRideInput> | MessageCreateWithoutRideInput[] | MessageUncheckedCreateWithoutRideInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutRideInput | MessageCreateOrConnectWithoutRideInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutRideInput | MessageUpsertWithWhereUniqueWithoutRideInput[]
    createMany?: MessageCreateManyRideInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutRideInput | MessageUpdateWithWhereUniqueWithoutRideInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutRideInput | MessageUpdateManyWithWhereWithoutRideInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutRideNestedInput = {
    create?: XOR<BookingCreateWithoutRideInput, BookingUncheckedCreateWithoutRideInput> | BookingCreateWithoutRideInput[] | BookingUncheckedCreateWithoutRideInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutRideInput | BookingCreateOrConnectWithoutRideInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutRideInput | BookingUpsertWithWhereUniqueWithoutRideInput[]
    createMany?: BookingCreateManyRideInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutRideInput | BookingUpdateWithWhereUniqueWithoutRideInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutRideInput | BookingUpdateManyWithWhereWithoutRideInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUncheckedUpdateManyWithoutRideNestedInput = {
    create?: XOR<ReviewCreateWithoutRideInput, ReviewUncheckedCreateWithoutRideInput> | ReviewCreateWithoutRideInput[] | ReviewUncheckedCreateWithoutRideInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutRideInput | ReviewCreateOrConnectWithoutRideInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutRideInput | ReviewUpsertWithWhereUniqueWithoutRideInput[]
    createMany?: ReviewCreateManyRideInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutRideInput | ReviewUpdateWithWhereUniqueWithoutRideInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutRideInput | ReviewUpdateManyWithWhereWithoutRideInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutRideNestedInput = {
    create?: XOR<MessageCreateWithoutRideInput, MessageUncheckedCreateWithoutRideInput> | MessageCreateWithoutRideInput[] | MessageUncheckedCreateWithoutRideInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutRideInput | MessageCreateOrConnectWithoutRideInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutRideInput | MessageUpsertWithWhereUniqueWithoutRideInput[]
    createMany?: MessageCreateManyRideInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutRideInput | MessageUpdateWithWhereUniqueWithoutRideInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutRideInput | MessageUpdateManyWithWhereWithoutRideInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type RideCreateNestedOneWithoutBookingsInput = {
    create?: XOR<RideCreateWithoutBookingsInput, RideUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: RideCreateOrConnectWithoutBookingsInput
    connect?: RideWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutBookingsInput = {
    create?: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: UserCreateOrConnectWithoutBookingsInput
    connect?: UserWhereUniqueInput
  }

  export type TransactionCreateNestedManyWithoutBookingInput = {
    create?: XOR<TransactionCreateWithoutBookingInput, TransactionUncheckedCreateWithoutBookingInput> | TransactionCreateWithoutBookingInput[] | TransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutBookingInput | TransactionCreateOrConnectWithoutBookingInput[]
    createMany?: TransactionCreateManyBookingInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutBookingInput = {
    create?: XOR<TransactionCreateWithoutBookingInput, TransactionUncheckedCreateWithoutBookingInput> | TransactionCreateWithoutBookingInput[] | TransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutBookingInput | TransactionCreateOrConnectWithoutBookingInput[]
    createMany?: TransactionCreateManyBookingInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type EnumBookingStatusFieldUpdateOperationsInput = {
    set?: $Enums.BookingStatus
  }

  export type EnumPaymentStatusFieldUpdateOperationsInput = {
    set?: $Enums.PaymentStatus
  }

  export type RideUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: XOR<RideCreateWithoutBookingsInput, RideUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: RideCreateOrConnectWithoutBookingsInput
    upsert?: RideUpsertWithoutBookingsInput
    connect?: RideWhereUniqueInput
    update?: XOR<XOR<RideUpdateToOneWithWhereWithoutBookingsInput, RideUpdateWithoutBookingsInput>, RideUncheckedUpdateWithoutBookingsInput>
  }

  export type UserUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: UserCreateOrConnectWithoutBookingsInput
    upsert?: UserUpsertWithoutBookingsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutBookingsInput, UserUpdateWithoutBookingsInput>, UserUncheckedUpdateWithoutBookingsInput>
  }

  export type TransactionUpdateManyWithoutBookingNestedInput = {
    create?: XOR<TransactionCreateWithoutBookingInput, TransactionUncheckedCreateWithoutBookingInput> | TransactionCreateWithoutBookingInput[] | TransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutBookingInput | TransactionCreateOrConnectWithoutBookingInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutBookingInput | TransactionUpsertWithWhereUniqueWithoutBookingInput[]
    createMany?: TransactionCreateManyBookingInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutBookingInput | TransactionUpdateWithWhereUniqueWithoutBookingInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutBookingInput | TransactionUpdateManyWithWhereWithoutBookingInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutBookingNestedInput = {
    create?: XOR<TransactionCreateWithoutBookingInput, TransactionUncheckedCreateWithoutBookingInput> | TransactionCreateWithoutBookingInput[] | TransactionUncheckedCreateWithoutBookingInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutBookingInput | TransactionCreateOrConnectWithoutBookingInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutBookingInput | TransactionUpsertWithWhereUniqueWithoutBookingInput[]
    createMany?: TransactionCreateManyBookingInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutBookingInput | TransactionUpdateWithWhereUniqueWithoutBookingInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutBookingInput | TransactionUpdateManyWithWhereWithoutBookingInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type RideCreateNestedOneWithoutReviewsInput = {
    create?: XOR<RideCreateWithoutReviewsInput, RideUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: RideCreateOrConnectWithoutReviewsInput
    connect?: RideWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutReviewsSentInput = {
    create?: XOR<UserCreateWithoutReviewsSentInput, UserUncheckedCreateWithoutReviewsSentInput>
    connectOrCreate?: UserCreateOrConnectWithoutReviewsSentInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutReviewsReceivedInput = {
    create?: XOR<UserCreateWithoutReviewsReceivedInput, UserUncheckedCreateWithoutReviewsReceivedInput>
    connectOrCreate?: UserCreateOrConnectWithoutReviewsReceivedInput
    connect?: UserWhereUniqueInput
  }

  export type EnumReviewTypeFieldUpdateOperationsInput = {
    set?: $Enums.ReviewType
  }

  export type RideUpdateOneRequiredWithoutReviewsNestedInput = {
    create?: XOR<RideCreateWithoutReviewsInput, RideUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: RideCreateOrConnectWithoutReviewsInput
    upsert?: RideUpsertWithoutReviewsInput
    connect?: RideWhereUniqueInput
    update?: XOR<XOR<RideUpdateToOneWithWhereWithoutReviewsInput, RideUpdateWithoutReviewsInput>, RideUncheckedUpdateWithoutReviewsInput>
  }

  export type UserUpdateOneRequiredWithoutReviewsSentNestedInput = {
    create?: XOR<UserCreateWithoutReviewsSentInput, UserUncheckedCreateWithoutReviewsSentInput>
    connectOrCreate?: UserCreateOrConnectWithoutReviewsSentInput
    upsert?: UserUpsertWithoutReviewsSentInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReviewsSentInput, UserUpdateWithoutReviewsSentInput>, UserUncheckedUpdateWithoutReviewsSentInput>
  }

  export type UserUpdateOneRequiredWithoutReviewsReceivedNestedInput = {
    create?: XOR<UserCreateWithoutReviewsReceivedInput, UserUncheckedCreateWithoutReviewsReceivedInput>
    connectOrCreate?: UserCreateOrConnectWithoutReviewsReceivedInput
    upsert?: UserUpsertWithoutReviewsReceivedInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReviewsReceivedInput, UserUpdateWithoutReviewsReceivedInput>, UserUncheckedUpdateWithoutReviewsReceivedInput>
  }

  export type UserCreateNestedOneWithoutDriverVerificationInput = {
    create?: XOR<UserCreateWithoutDriverVerificationInput, UserUncheckedCreateWithoutDriverVerificationInput>
    connectOrCreate?: UserCreateOrConnectWithoutDriverVerificationInput
    connect?: UserWhereUniqueInput
  }

  export type EnumVerificationStatusFieldUpdateOperationsInput = {
    set?: $Enums.VerificationStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type UserUpdateOneRequiredWithoutDriverVerificationNestedInput = {
    create?: XOR<UserCreateWithoutDriverVerificationInput, UserUncheckedCreateWithoutDriverVerificationInput>
    connectOrCreate?: UserCreateOrConnectWithoutDriverVerificationInput
    upsert?: UserUpsertWithoutDriverVerificationInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutDriverVerificationInput, UserUpdateWithoutDriverVerificationInput>, UserUncheckedUpdateWithoutDriverVerificationInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumTransactionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeFilter<$PrismaModel> | $Enums.TransactionType
  }

  export type NestedEnumTransactionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionStatus | EnumTransactionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionStatusFilter<$PrismaModel> | $Enums.TransactionStatus
  }

  export type NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionType | EnumTransactionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionType[] | ListEnumTransactionTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionTypeWithAggregatesFilter<$PrismaModel> | $Enums.TransactionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionTypeFilter<$PrismaModel>
    _max?: NestedEnumTransactionTypeFilter<$PrismaModel>
  }

  export type NestedEnumTransactionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TransactionStatus | EnumTransactionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TransactionStatus[] | ListEnumTransactionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTransactionStatusWithAggregatesFilter<$PrismaModel> | $Enums.TransactionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTransactionStatusFilter<$PrismaModel>
    _max?: NestedEnumTransactionStatusFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumRideStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RideStatus | EnumRideStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRideStatusFilter<$PrismaModel> | $Enums.RideStatus
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedEnumRideStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RideStatus | EnumRideStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RideStatus[] | ListEnumRideStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRideStatusWithAggregatesFilter<$PrismaModel> | $Enums.RideStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRideStatusFilter<$PrismaModel>
    _max?: NestedEnumRideStatusFilter<$PrismaModel>
  }

  export type NestedEnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }

  export type NestedEnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }

  export type NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type NestedEnumReviewTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewType | EnumReviewTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewTypeFilter<$PrismaModel> | $Enums.ReviewType
  }

  export type NestedEnumReviewTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ReviewType | EnumReviewTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ReviewType[] | ListEnumReviewTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumReviewTypeWithAggregatesFilter<$PrismaModel> | $Enums.ReviewType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumReviewTypeFilter<$PrismaModel>
    _max?: NestedEnumReviewTypeFilter<$PrismaModel>
  }

  export type NestedEnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type RideCreateWithoutDriverInput = {
    id?: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    bookings?: BookingCreateNestedManyWithoutRideInput
    reviews?: ReviewCreateNestedManyWithoutRideInput
    messages?: MessageCreateNestedManyWithoutRideInput
  }

  export type RideUncheckedCreateWithoutDriverInput = {
    id?: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    bookings?: BookingUncheckedCreateNestedManyWithoutRideInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutRideInput
    messages?: MessageUncheckedCreateNestedManyWithoutRideInput
  }

  export type RideCreateOrConnectWithoutDriverInput = {
    where: RideWhereUniqueInput
    create: XOR<RideCreateWithoutDriverInput, RideUncheckedCreateWithoutDriverInput>
  }

  export type RideCreateManyDriverInputEnvelope = {
    data: RideCreateManyDriverInput | RideCreateManyDriverInput[]
    skipDuplicates?: boolean
  }

  export type BookingCreateWithoutPassengerInput = {
    id?: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    ride: RideCreateNestedOneWithoutBookingsInput
    transactions?: TransactionCreateNestedManyWithoutBookingInput
  }

  export type BookingUncheckedCreateWithoutPassengerInput = {
    id?: string
    rideId: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutBookingInput
  }

  export type BookingCreateOrConnectWithoutPassengerInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutPassengerInput, BookingUncheckedCreateWithoutPassengerInput>
  }

  export type BookingCreateManyPassengerInputEnvelope = {
    data: BookingCreateManyPassengerInput | BookingCreateManyPassengerInput[]
    skipDuplicates?: boolean
  }

  export type ReviewCreateWithoutReviewerInput = {
    id?: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
    ride: RideCreateNestedOneWithoutReviewsInput
    reviewee: UserCreateNestedOneWithoutReviewsReceivedInput
  }

  export type ReviewUncheckedCreateWithoutReviewerInput = {
    id?: string
    rideId: string
    revieweeId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type ReviewCreateOrConnectWithoutReviewerInput = {
    where: ReviewWhereUniqueInput
    create: XOR<ReviewCreateWithoutReviewerInput, ReviewUncheckedCreateWithoutReviewerInput>
  }

  export type ReviewCreateManyReviewerInputEnvelope = {
    data: ReviewCreateManyReviewerInput | ReviewCreateManyReviewerInput[]
    skipDuplicates?: boolean
  }

  export type ReviewCreateWithoutRevieweeInput = {
    id?: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
    ride: RideCreateNestedOneWithoutReviewsInput
    reviewer: UserCreateNestedOneWithoutReviewsSentInput
  }

  export type ReviewUncheckedCreateWithoutRevieweeInput = {
    id?: string
    rideId: string
    reviewerId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type ReviewCreateOrConnectWithoutRevieweeInput = {
    where: ReviewWhereUniqueInput
    create: XOR<ReviewCreateWithoutRevieweeInput, ReviewUncheckedCreateWithoutRevieweeInput>
  }

  export type ReviewCreateManyRevieweeInputEnvelope = {
    data: ReviewCreateManyRevieweeInput | ReviewCreateManyRevieweeInput[]
    skipDuplicates?: boolean
  }

  export type RefreshTokenCreateWithoutUserInput = {
    id?: string
    token: string
    revoked?: boolean
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenUncheckedCreateWithoutUserInput = {
    id?: string
    token: string
    revoked?: boolean
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenCreateOrConnectWithoutUserInput = {
    where: RefreshTokenWhereUniqueInput
    create: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput>
  }

  export type RefreshTokenCreateManyUserInputEnvelope = {
    data: RefreshTokenCreateManyUserInput | RefreshTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type NotificationCreateWithoutUserInput = {
    id?: string
    title: string
    content: string
    type: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type NotificationUncheckedCreateWithoutUserInput = {
    id?: string
    title: string
    content: string
    type: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type NotificationCreateOrConnectWithoutUserInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutUserInput, NotificationUncheckedCreateWithoutUserInput>
  }

  export type NotificationCreateManyUserInputEnvelope = {
    data: NotificationCreateManyUserInput | NotificationCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type MessageCreateWithoutSenderInput = {
    id?: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
    ride: RideCreateNestedOneWithoutMessagesInput
    receiver: UserCreateNestedOneWithoutReceivedMessagesInput
  }

  export type MessageUncheckedCreateWithoutSenderInput = {
    id?: string
    rideId: string
    receiverId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type MessageCreateOrConnectWithoutSenderInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput>
  }

  export type MessageCreateManySenderInputEnvelope = {
    data: MessageCreateManySenderInput | MessageCreateManySenderInput[]
    skipDuplicates?: boolean
  }

  export type MessageCreateWithoutReceiverInput = {
    id?: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
    ride: RideCreateNestedOneWithoutMessagesInput
    sender: UserCreateNestedOneWithoutSentMessagesInput
  }

  export type MessageUncheckedCreateWithoutReceiverInput = {
    id?: string
    rideId: string
    senderId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type MessageCreateOrConnectWithoutReceiverInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput>
  }

  export type MessageCreateManyReceiverInputEnvelope = {
    data: MessageCreateManyReceiverInput | MessageCreateManyReceiverInput[]
    skipDuplicates?: boolean
  }

  export type WalletCreateWithoutUserInput = {
    id?: string
    rideBalance?: number
    driverEarnings?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionCreateNestedManyWithoutWalletInput
  }

  export type WalletUncheckedCreateWithoutUserInput = {
    id?: string
    rideBalance?: number
    driverEarnings?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutWalletInput
  }

  export type WalletCreateOrConnectWithoutUserInput = {
    where: WalletWhereUniqueInput
    create: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
  }

  export type DriverVerificationCreateWithoutUserInput = {
    id?: string
    licenseFrontImageUrl: string
    licenseBackImageUrl: string
    registrationFrontImageUrl: string
    registrationBackImageUrl: string
    vehiclePlate: string
    vehicleModel?: string | null
    vehicleType?: string
    status?: $Enums.VerificationStatus
    rejectionReason?: string | null
    reviewedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DriverVerificationUncheckedCreateWithoutUserInput = {
    id?: string
    licenseFrontImageUrl: string
    licenseBackImageUrl: string
    registrationFrontImageUrl: string
    registrationBackImageUrl: string
    vehiclePlate: string
    vehicleModel?: string | null
    vehicleType?: string
    status?: $Enums.VerificationStatus
    rejectionReason?: string | null
    reviewedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DriverVerificationCreateOrConnectWithoutUserInput = {
    where: DriverVerificationWhereUniqueInput
    create: XOR<DriverVerificationCreateWithoutUserInput, DriverVerificationUncheckedCreateWithoutUserInput>
  }

  export type RideUpsertWithWhereUniqueWithoutDriverInput = {
    where: RideWhereUniqueInput
    update: XOR<RideUpdateWithoutDriverInput, RideUncheckedUpdateWithoutDriverInput>
    create: XOR<RideCreateWithoutDriverInput, RideUncheckedCreateWithoutDriverInput>
  }

  export type RideUpdateWithWhereUniqueWithoutDriverInput = {
    where: RideWhereUniqueInput
    data: XOR<RideUpdateWithoutDriverInput, RideUncheckedUpdateWithoutDriverInput>
  }

  export type RideUpdateManyWithWhereWithoutDriverInput = {
    where: RideScalarWhereInput
    data: XOR<RideUpdateManyMutationInput, RideUncheckedUpdateManyWithoutDriverInput>
  }

  export type RideScalarWhereInput = {
    AND?: RideScalarWhereInput | RideScalarWhereInput[]
    OR?: RideScalarWhereInput[]
    NOT?: RideScalarWhereInput | RideScalarWhereInput[]
    id?: StringFilter<"Ride"> | string
    driverId?: StringFilter<"Ride"> | string
    origin?: StringFilter<"Ride"> | string
    originLat?: FloatNullableFilter<"Ride"> | number | null
    originLng?: FloatNullableFilter<"Ride"> | number | null
    destination?: StringFilter<"Ride"> | string
    destinationLat?: FloatNullableFilter<"Ride"> | number | null
    destinationLng?: FloatNullableFilter<"Ride"> | number | null
    distance?: FloatNullableFilter<"Ride"> | number | null
    duration?: FloatNullableFilter<"Ride"> | number | null
    departureTime?: DateTimeFilter<"Ride"> | Date | string
    availableSeats?: IntFilter<"Ride"> | number
    pricePerSeat?: FloatFilter<"Ride"> | number
    status?: EnumRideStatusFilter<"Ride"> | $Enums.RideStatus
    description?: StringNullableFilter<"Ride"> | string | null
    createdAt?: DateTimeFilter<"Ride"> | Date | string
    updatedAt?: DateTimeFilter<"Ride"> | Date | string
    originHouseNumber?: StringNullableFilter<"Ride"> | string | null
    originStreet?: StringNullableFilter<"Ride"> | string | null
    originWard?: StringNullableFilter<"Ride"> | string | null
    originDistrict?: StringNullableFilter<"Ride"> | string | null
    originProvince?: StringNullableFilter<"Ride"> | string | null
    originAddressType?: StringNullableFilter<"Ride"> | string | null
    destHouseNumber?: StringNullableFilter<"Ride"> | string | null
    destStreet?: StringNullableFilter<"Ride"> | string | null
    destWard?: StringNullableFilter<"Ride"> | string | null
    destDistrict?: StringNullableFilter<"Ride"> | string | null
    destProvince?: StringNullableFilter<"Ride"> | string | null
    destAddressType?: StringNullableFilter<"Ride"> | string | null
    addressDetailLevel?: StringNullableFilter<"Ride"> | string | null
  }

  export type BookingUpsertWithWhereUniqueWithoutPassengerInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutPassengerInput, BookingUncheckedUpdateWithoutPassengerInput>
    create: XOR<BookingCreateWithoutPassengerInput, BookingUncheckedCreateWithoutPassengerInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutPassengerInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutPassengerInput, BookingUncheckedUpdateWithoutPassengerInput>
  }

  export type BookingUpdateManyWithWhereWithoutPassengerInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutPassengerInput>
  }

  export type BookingScalarWhereInput = {
    AND?: BookingScalarWhereInput | BookingScalarWhereInput[]
    OR?: BookingScalarWhereInput[]
    NOT?: BookingScalarWhereInput | BookingScalarWhereInput[]
    id?: StringFilter<"Booking"> | string
    rideId?: StringFilter<"Booking"> | string
    passengerId?: StringFilter<"Booking"> | string
    seats?: IntFilter<"Booking"> | number
    totalPrice?: FloatFilter<"Booking"> | number
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFilter<"Booking"> | $Enums.PaymentStatus
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
  }

  export type ReviewUpsertWithWhereUniqueWithoutReviewerInput = {
    where: ReviewWhereUniqueInput
    update: XOR<ReviewUpdateWithoutReviewerInput, ReviewUncheckedUpdateWithoutReviewerInput>
    create: XOR<ReviewCreateWithoutReviewerInput, ReviewUncheckedCreateWithoutReviewerInput>
  }

  export type ReviewUpdateWithWhereUniqueWithoutReviewerInput = {
    where: ReviewWhereUniqueInput
    data: XOR<ReviewUpdateWithoutReviewerInput, ReviewUncheckedUpdateWithoutReviewerInput>
  }

  export type ReviewUpdateManyWithWhereWithoutReviewerInput = {
    where: ReviewScalarWhereInput
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyWithoutReviewerInput>
  }

  export type ReviewScalarWhereInput = {
    AND?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
    OR?: ReviewScalarWhereInput[]
    NOT?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
    id?: StringFilter<"Review"> | string
    rideId?: StringFilter<"Review"> | string
    reviewerId?: StringFilter<"Review"> | string
    revieweeId?: StringFilter<"Review"> | string
    rating?: IntFilter<"Review"> | number
    comment?: StringNullableFilter<"Review"> | string | null
    type?: EnumReviewTypeFilter<"Review"> | $Enums.ReviewType
    createdAt?: DateTimeFilter<"Review"> | Date | string
  }

  export type ReviewUpsertWithWhereUniqueWithoutRevieweeInput = {
    where: ReviewWhereUniqueInput
    update: XOR<ReviewUpdateWithoutRevieweeInput, ReviewUncheckedUpdateWithoutRevieweeInput>
    create: XOR<ReviewCreateWithoutRevieweeInput, ReviewUncheckedCreateWithoutRevieweeInput>
  }

  export type ReviewUpdateWithWhereUniqueWithoutRevieweeInput = {
    where: ReviewWhereUniqueInput
    data: XOR<ReviewUpdateWithoutRevieweeInput, ReviewUncheckedUpdateWithoutRevieweeInput>
  }

  export type ReviewUpdateManyWithWhereWithoutRevieweeInput = {
    where: ReviewScalarWhereInput
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyWithoutRevieweeInput>
  }

  export type RefreshTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: RefreshTokenWhereUniqueInput
    update: XOR<RefreshTokenUpdateWithoutUserInput, RefreshTokenUncheckedUpdateWithoutUserInput>
    create: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput>
  }

  export type RefreshTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: RefreshTokenWhereUniqueInput
    data: XOR<RefreshTokenUpdateWithoutUserInput, RefreshTokenUncheckedUpdateWithoutUserInput>
  }

  export type RefreshTokenUpdateManyWithWhereWithoutUserInput = {
    where: RefreshTokenScalarWhereInput
    data: XOR<RefreshTokenUpdateManyMutationInput, RefreshTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type RefreshTokenScalarWhereInput = {
    AND?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
    OR?: RefreshTokenScalarWhereInput[]
    NOT?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
    id?: StringFilter<"RefreshToken"> | string
    token?: StringFilter<"RefreshToken"> | string
    userId?: StringFilter<"RefreshToken"> | string
    revoked?: BoolFilter<"RefreshToken"> | boolean
    expiresAt?: DateTimeFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeFilter<"RefreshToken"> | Date | string
  }

  export type NotificationUpsertWithWhereUniqueWithoutUserInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutUserInput, NotificationUncheckedUpdateWithoutUserInput>
    create: XOR<NotificationCreateWithoutUserInput, NotificationUncheckedCreateWithoutUserInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutUserInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutUserInput, NotificationUncheckedUpdateWithoutUserInput>
  }

  export type NotificationUpdateManyWithWhereWithoutUserInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutUserInput>
  }

  export type NotificationScalarWhereInput = {
    AND?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    OR?: NotificationScalarWhereInput[]
    NOT?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    id?: StringFilter<"Notification"> | string
    userId?: StringFilter<"Notification"> | string
    title?: StringFilter<"Notification"> | string
    content?: StringFilter<"Notification"> | string
    type?: StringFilter<"Notification"> | string
    isRead?: BoolFilter<"Notification"> | boolean
    createdAt?: DateTimeFilter<"Notification"> | Date | string
  }

  export type MessageUpsertWithWhereUniqueWithoutSenderInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutSenderInput, MessageUncheckedUpdateWithoutSenderInput>
    create: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutSenderInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutSenderInput, MessageUncheckedUpdateWithoutSenderInput>
  }

  export type MessageUpdateManyWithWhereWithoutSenderInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutSenderInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: StringFilter<"Message"> | string
    rideId?: StringFilter<"Message"> | string
    senderId?: StringFilter<"Message"> | string
    receiverId?: StringFilter<"Message"> | string
    content?: StringFilter<"Message"> | string
    isRead?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
  }

  export type MessageUpsertWithWhereUniqueWithoutReceiverInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutReceiverInput, MessageUncheckedUpdateWithoutReceiverInput>
    create: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutReceiverInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutReceiverInput, MessageUncheckedUpdateWithoutReceiverInput>
  }

  export type MessageUpdateManyWithWhereWithoutReceiverInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutReceiverInput>
  }

  export type WalletUpsertWithoutUserInput = {
    update: XOR<WalletUpdateWithoutUserInput, WalletUncheckedUpdateWithoutUserInput>
    create: XOR<WalletCreateWithoutUserInput, WalletUncheckedCreateWithoutUserInput>
    where?: WalletWhereInput
  }

  export type WalletUpdateToOneWithWhereWithoutUserInput = {
    where?: WalletWhereInput
    data: XOR<WalletUpdateWithoutUserInput, WalletUncheckedUpdateWithoutUserInput>
  }

  export type WalletUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUpdateManyWithoutWalletNestedInput
  }

  export type WalletUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutWalletNestedInput
  }

  export type DriverVerificationUpsertWithoutUserInput = {
    update: XOR<DriverVerificationUpdateWithoutUserInput, DriverVerificationUncheckedUpdateWithoutUserInput>
    create: XOR<DriverVerificationCreateWithoutUserInput, DriverVerificationUncheckedCreateWithoutUserInput>
    where?: DriverVerificationWhereInput
  }

  export type DriverVerificationUpdateToOneWithWhereWithoutUserInput = {
    where?: DriverVerificationWhereInput
    data: XOR<DriverVerificationUpdateWithoutUserInput, DriverVerificationUncheckedUpdateWithoutUserInput>
  }

  export type DriverVerificationUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    licenseFrontImageUrl?: StringFieldUpdateOperationsInput | string
    licenseBackImageUrl?: StringFieldUpdateOperationsInput | string
    registrationFrontImageUrl?: StringFieldUpdateOperationsInput | string
    registrationBackImageUrl?: StringFieldUpdateOperationsInput | string
    vehiclePlate?: StringFieldUpdateOperationsInput | string
    vehicleModel?: NullableStringFieldUpdateOperationsInput | string | null
    vehicleType?: StringFieldUpdateOperationsInput | string
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DriverVerificationUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    licenseFrontImageUrl?: StringFieldUpdateOperationsInput | string
    licenseBackImageUrl?: StringFieldUpdateOperationsInput | string
    registrationFrontImageUrl?: StringFieldUpdateOperationsInput | string
    registrationBackImageUrl?: StringFieldUpdateOperationsInput | string
    vehiclePlate?: StringFieldUpdateOperationsInput | string
    vehicleModel?: NullableStringFieldUpdateOperationsInput | string | null
    vehicleType?: StringFieldUpdateOperationsInput | string
    status?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutWalletInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutWalletInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutWalletInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
  }

  export type TransactionCreateWithoutWalletInput = {
    id?: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    booking?: BookingCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateWithoutWalletInput = {
    id?: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    bookingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutWalletInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutWalletInput, TransactionUncheckedCreateWithoutWalletInput>
  }

  export type TransactionCreateManyWalletInputEnvelope = {
    data: TransactionCreateManyWalletInput | TransactionCreateManyWalletInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutWalletInput = {
    update: XOR<UserUpdateWithoutWalletInput, UserUncheckedUpdateWithoutWalletInput>
    create: XOR<UserCreateWithoutWalletInput, UserUncheckedCreateWithoutWalletInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutWalletInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutWalletInput, UserUncheckedUpdateWithoutWalletInput>
  }

  export type UserUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type TransactionUpsertWithWhereUniqueWithoutWalletInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutWalletInput, TransactionUncheckedUpdateWithoutWalletInput>
    create: XOR<TransactionCreateWithoutWalletInput, TransactionUncheckedCreateWithoutWalletInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutWalletInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutWalletInput, TransactionUncheckedUpdateWithoutWalletInput>
  }

  export type TransactionUpdateManyWithWhereWithoutWalletInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutWalletInput>
  }

  export type TransactionScalarWhereInput = {
    AND?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    OR?: TransactionScalarWhereInput[]
    NOT?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    id?: StringFilter<"Transaction"> | string
    walletId?: StringFilter<"Transaction"> | string
    amount?: FloatFilter<"Transaction"> | number
    type?: EnumTransactionTypeFilter<"Transaction"> | $Enums.TransactionType
    status?: EnumTransactionStatusFilter<"Transaction"> | $Enums.TransactionStatus
    description?: StringNullableFilter<"Transaction"> | string | null
    externalId?: StringNullableFilter<"Transaction"> | string | null
    bookingId?: StringNullableFilter<"Transaction"> | string | null
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    updatedAt?: DateTimeFilter<"Transaction"> | Date | string
  }

  export type WalletCreateWithoutTransactionsInput = {
    id?: string
    rideBalance?: number
    driverEarnings?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutWalletInput
  }

  export type WalletUncheckedCreateWithoutTransactionsInput = {
    id?: string
    userId: string
    rideBalance?: number
    driverEarnings?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WalletCreateOrConnectWithoutTransactionsInput = {
    where: WalletWhereUniqueInput
    create: XOR<WalletCreateWithoutTransactionsInput, WalletUncheckedCreateWithoutTransactionsInput>
  }

  export type BookingCreateWithoutTransactionsInput = {
    id?: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    ride: RideCreateNestedOneWithoutBookingsInput
    passenger: UserCreateNestedOneWithoutBookingsInput
  }

  export type BookingUncheckedCreateWithoutTransactionsInput = {
    id?: string
    rideId: string
    passengerId: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BookingCreateOrConnectWithoutTransactionsInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutTransactionsInput, BookingUncheckedCreateWithoutTransactionsInput>
  }

  export type WalletUpsertWithoutTransactionsInput = {
    update: XOR<WalletUpdateWithoutTransactionsInput, WalletUncheckedUpdateWithoutTransactionsInput>
    create: XOR<WalletCreateWithoutTransactionsInput, WalletUncheckedCreateWithoutTransactionsInput>
    where?: WalletWhereInput
  }

  export type WalletUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: WalletWhereInput
    data: XOR<WalletUpdateWithoutTransactionsInput, WalletUncheckedUpdateWithoutTransactionsInput>
  }

  export type WalletUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWalletNestedInput
  }

  export type WalletUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    rideBalance?: FloatFieldUpdateOperationsInput | number
    driverEarnings?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingUpsertWithoutTransactionsInput = {
    update: XOR<BookingUpdateWithoutTransactionsInput, BookingUncheckedUpdateWithoutTransactionsInput>
    create: XOR<BookingCreateWithoutTransactionsInput, BookingUncheckedCreateWithoutTransactionsInput>
    where?: BookingWhereInput
  }

  export type BookingUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: BookingWhereInput
    data: XOR<BookingUpdateWithoutTransactionsInput, BookingUncheckedUpdateWithoutTransactionsInput>
  }

  export type BookingUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutBookingsNestedInput
    passenger?: UserUpdateOneRequiredWithoutBookingsNestedInput
  }

  export type BookingUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    passengerId?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RideCreateWithoutMessagesInput = {
    id?: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    driver: UserCreateNestedOneWithoutRidesAsDriverInput
    bookings?: BookingCreateNestedManyWithoutRideInput
    reviews?: ReviewCreateNestedManyWithoutRideInput
  }

  export type RideUncheckedCreateWithoutMessagesInput = {
    id?: string
    driverId: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    bookings?: BookingUncheckedCreateNestedManyWithoutRideInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutRideInput
  }

  export type RideCreateOrConnectWithoutMessagesInput = {
    where: RideWhereUniqueInput
    create: XOR<RideCreateWithoutMessagesInput, RideUncheckedCreateWithoutMessagesInput>
  }

  export type UserCreateWithoutSentMessagesInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSentMessagesInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSentMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
  }

  export type UserCreateWithoutReceivedMessagesInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutReceivedMessagesInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutReceivedMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
  }

  export type RideUpsertWithoutMessagesInput = {
    update: XOR<RideUpdateWithoutMessagesInput, RideUncheckedUpdateWithoutMessagesInput>
    create: XOR<RideCreateWithoutMessagesInput, RideUncheckedCreateWithoutMessagesInput>
    where?: RideWhereInput
  }

  export type RideUpdateToOneWithWhereWithoutMessagesInput = {
    where?: RideWhereInput
    data: XOR<RideUpdateWithoutMessagesInput, RideUncheckedUpdateWithoutMessagesInput>
  }

  export type RideUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    driver?: UserUpdateOneRequiredWithoutRidesAsDriverNestedInput
    bookings?: BookingUpdateManyWithoutRideNestedInput
    reviews?: ReviewUpdateManyWithoutRideNestedInput
  }

  export type RideUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    driverId?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    bookings?: BookingUncheckedUpdateManyWithoutRideNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutRideNestedInput
  }

  export type UserUpsertWithoutSentMessagesInput = {
    update: XOR<UserUpdateWithoutSentMessagesInput, UserUncheckedUpdateWithoutSentMessagesInput>
    create: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSentMessagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSentMessagesInput, UserUncheckedUpdateWithoutSentMessagesInput>
  }

  export type UserUpdateWithoutSentMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSentMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserUpsertWithoutReceivedMessagesInput = {
    update: XOR<UserUpdateWithoutReceivedMessagesInput, UserUncheckedUpdateWithoutReceivedMessagesInput>
    create: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReceivedMessagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReceivedMessagesInput, UserUncheckedUpdateWithoutReceivedMessagesInput>
  }

  export type UserUpdateWithoutReceivedMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutReceivedMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutRefreshTokensInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRefreshTokensInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRefreshTokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
  }

  export type UserUpsertWithoutRefreshTokensInput = {
    update: XOR<UserUpdateWithoutRefreshTokensInput, UserUncheckedUpdateWithoutRefreshTokensInput>
    create: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRefreshTokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRefreshTokensInput, UserUncheckedUpdateWithoutRefreshTokensInput>
  }

  export type UserUpdateWithoutRefreshTokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRefreshTokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutNotificationsInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutNotificationsInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutNotificationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
  }

  export type UserUpsertWithoutNotificationsInput = {
    update: XOR<UserUpdateWithoutNotificationsInput, UserUncheckedUpdateWithoutNotificationsInput>
    create: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutNotificationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutNotificationsInput, UserUncheckedUpdateWithoutNotificationsInput>
  }

  export type UserUpdateWithoutNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutNotificationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutRidesAsDriverInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRidesAsDriverInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRidesAsDriverInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRidesAsDriverInput, UserUncheckedCreateWithoutRidesAsDriverInput>
  }

  export type BookingCreateWithoutRideInput = {
    id?: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    passenger: UserCreateNestedOneWithoutBookingsInput
    transactions?: TransactionCreateNestedManyWithoutBookingInput
  }

  export type BookingUncheckedCreateWithoutRideInput = {
    id?: string
    passengerId: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutBookingInput
  }

  export type BookingCreateOrConnectWithoutRideInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutRideInput, BookingUncheckedCreateWithoutRideInput>
  }

  export type BookingCreateManyRideInputEnvelope = {
    data: BookingCreateManyRideInput | BookingCreateManyRideInput[]
    skipDuplicates?: boolean
  }

  export type ReviewCreateWithoutRideInput = {
    id?: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
    reviewer: UserCreateNestedOneWithoutReviewsSentInput
    reviewee: UserCreateNestedOneWithoutReviewsReceivedInput
  }

  export type ReviewUncheckedCreateWithoutRideInput = {
    id?: string
    reviewerId: string
    revieweeId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type ReviewCreateOrConnectWithoutRideInput = {
    where: ReviewWhereUniqueInput
    create: XOR<ReviewCreateWithoutRideInput, ReviewUncheckedCreateWithoutRideInput>
  }

  export type ReviewCreateManyRideInputEnvelope = {
    data: ReviewCreateManyRideInput | ReviewCreateManyRideInput[]
    skipDuplicates?: boolean
  }

  export type MessageCreateWithoutRideInput = {
    id?: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutSentMessagesInput
    receiver: UserCreateNestedOneWithoutReceivedMessagesInput
  }

  export type MessageUncheckedCreateWithoutRideInput = {
    id?: string
    senderId: string
    receiverId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type MessageCreateOrConnectWithoutRideInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutRideInput, MessageUncheckedCreateWithoutRideInput>
  }

  export type MessageCreateManyRideInputEnvelope = {
    data: MessageCreateManyRideInput | MessageCreateManyRideInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutRidesAsDriverInput = {
    update: XOR<UserUpdateWithoutRidesAsDriverInput, UserUncheckedUpdateWithoutRidesAsDriverInput>
    create: XOR<UserCreateWithoutRidesAsDriverInput, UserUncheckedCreateWithoutRidesAsDriverInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRidesAsDriverInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRidesAsDriverInput, UserUncheckedUpdateWithoutRidesAsDriverInput>
  }

  export type UserUpdateWithoutRidesAsDriverInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRidesAsDriverInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type BookingUpsertWithWhereUniqueWithoutRideInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutRideInput, BookingUncheckedUpdateWithoutRideInput>
    create: XOR<BookingCreateWithoutRideInput, BookingUncheckedCreateWithoutRideInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutRideInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutRideInput, BookingUncheckedUpdateWithoutRideInput>
  }

  export type BookingUpdateManyWithWhereWithoutRideInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutRideInput>
  }

  export type ReviewUpsertWithWhereUniqueWithoutRideInput = {
    where: ReviewWhereUniqueInput
    update: XOR<ReviewUpdateWithoutRideInput, ReviewUncheckedUpdateWithoutRideInput>
    create: XOR<ReviewCreateWithoutRideInput, ReviewUncheckedCreateWithoutRideInput>
  }

  export type ReviewUpdateWithWhereUniqueWithoutRideInput = {
    where: ReviewWhereUniqueInput
    data: XOR<ReviewUpdateWithoutRideInput, ReviewUncheckedUpdateWithoutRideInput>
  }

  export type ReviewUpdateManyWithWhereWithoutRideInput = {
    where: ReviewScalarWhereInput
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyWithoutRideInput>
  }

  export type MessageUpsertWithWhereUniqueWithoutRideInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutRideInput, MessageUncheckedUpdateWithoutRideInput>
    create: XOR<MessageCreateWithoutRideInput, MessageUncheckedCreateWithoutRideInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutRideInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutRideInput, MessageUncheckedUpdateWithoutRideInput>
  }

  export type MessageUpdateManyWithWhereWithoutRideInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutRideInput>
  }

  export type RideCreateWithoutBookingsInput = {
    id?: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    driver: UserCreateNestedOneWithoutRidesAsDriverInput
    reviews?: ReviewCreateNestedManyWithoutRideInput
    messages?: MessageCreateNestedManyWithoutRideInput
  }

  export type RideUncheckedCreateWithoutBookingsInput = {
    id?: string
    driverId: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    reviews?: ReviewUncheckedCreateNestedManyWithoutRideInput
    messages?: MessageUncheckedCreateNestedManyWithoutRideInput
  }

  export type RideCreateOrConnectWithoutBookingsInput = {
    where: RideWhereUniqueInput
    create: XOR<RideCreateWithoutBookingsInput, RideUncheckedCreateWithoutBookingsInput>
  }

  export type UserCreateWithoutBookingsInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutBookingsInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutBookingsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
  }

  export type TransactionCreateWithoutBookingInput = {
    id?: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    wallet: WalletCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateWithoutBookingInput = {
    id?: string
    walletId: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutBookingInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutBookingInput, TransactionUncheckedCreateWithoutBookingInput>
  }

  export type TransactionCreateManyBookingInputEnvelope = {
    data: TransactionCreateManyBookingInput | TransactionCreateManyBookingInput[]
    skipDuplicates?: boolean
  }

  export type RideUpsertWithoutBookingsInput = {
    update: XOR<RideUpdateWithoutBookingsInput, RideUncheckedUpdateWithoutBookingsInput>
    create: XOR<RideCreateWithoutBookingsInput, RideUncheckedCreateWithoutBookingsInput>
    where?: RideWhereInput
  }

  export type RideUpdateToOneWithWhereWithoutBookingsInput = {
    where?: RideWhereInput
    data: XOR<RideUpdateWithoutBookingsInput, RideUncheckedUpdateWithoutBookingsInput>
  }

  export type RideUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    driver?: UserUpdateOneRequiredWithoutRidesAsDriverNestedInput
    reviews?: ReviewUpdateManyWithoutRideNestedInput
    messages?: MessageUpdateManyWithoutRideNestedInput
  }

  export type RideUncheckedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    driverId?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    reviews?: ReviewUncheckedUpdateManyWithoutRideNestedInput
    messages?: MessageUncheckedUpdateManyWithoutRideNestedInput
  }

  export type UserUpsertWithoutBookingsInput = {
    update: XOR<UserUpdateWithoutBookingsInput, UserUncheckedUpdateWithoutBookingsInput>
    create: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutBookingsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutBookingsInput, UserUncheckedUpdateWithoutBookingsInput>
  }

  export type UserUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type TransactionUpsertWithWhereUniqueWithoutBookingInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutBookingInput, TransactionUncheckedUpdateWithoutBookingInput>
    create: XOR<TransactionCreateWithoutBookingInput, TransactionUncheckedCreateWithoutBookingInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutBookingInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutBookingInput, TransactionUncheckedUpdateWithoutBookingInput>
  }

  export type TransactionUpdateManyWithWhereWithoutBookingInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutBookingInput>
  }

  export type RideCreateWithoutReviewsInput = {
    id?: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    driver: UserCreateNestedOneWithoutRidesAsDriverInput
    bookings?: BookingCreateNestedManyWithoutRideInput
    messages?: MessageCreateNestedManyWithoutRideInput
  }

  export type RideUncheckedCreateWithoutReviewsInput = {
    id?: string
    driverId: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
    bookings?: BookingUncheckedCreateNestedManyWithoutRideInput
    messages?: MessageUncheckedCreateNestedManyWithoutRideInput
  }

  export type RideCreateOrConnectWithoutReviewsInput = {
    where: RideWhereUniqueInput
    create: XOR<RideCreateWithoutReviewsInput, RideUncheckedCreateWithoutReviewsInput>
  }

  export type UserCreateWithoutReviewsSentInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutReviewsSentInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutReviewsSentInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReviewsSentInput, UserUncheckedCreateWithoutReviewsSentInput>
  }

  export type UserCreateWithoutReviewsReceivedInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutReviewsReceivedInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
    driverVerification?: DriverVerificationUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutReviewsReceivedInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReviewsReceivedInput, UserUncheckedCreateWithoutReviewsReceivedInput>
  }

  export type RideUpsertWithoutReviewsInput = {
    update: XOR<RideUpdateWithoutReviewsInput, RideUncheckedUpdateWithoutReviewsInput>
    create: XOR<RideCreateWithoutReviewsInput, RideUncheckedCreateWithoutReviewsInput>
    where?: RideWhereInput
  }

  export type RideUpdateToOneWithWhereWithoutReviewsInput = {
    where?: RideWhereInput
    data: XOR<RideUpdateWithoutReviewsInput, RideUncheckedUpdateWithoutReviewsInput>
  }

  export type RideUpdateWithoutReviewsInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    driver?: UserUpdateOneRequiredWithoutRidesAsDriverNestedInput
    bookings?: BookingUpdateManyWithoutRideNestedInput
    messages?: MessageUpdateManyWithoutRideNestedInput
  }

  export type RideUncheckedUpdateWithoutReviewsInput = {
    id?: StringFieldUpdateOperationsInput | string
    driverId?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    bookings?: BookingUncheckedUpdateManyWithoutRideNestedInput
    messages?: MessageUncheckedUpdateManyWithoutRideNestedInput
  }

  export type UserUpsertWithoutReviewsSentInput = {
    update: XOR<UserUpdateWithoutReviewsSentInput, UserUncheckedUpdateWithoutReviewsSentInput>
    create: XOR<UserCreateWithoutReviewsSentInput, UserUncheckedCreateWithoutReviewsSentInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReviewsSentInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReviewsSentInput, UserUncheckedUpdateWithoutReviewsSentInput>
  }

  export type UserUpdateWithoutReviewsSentInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutReviewsSentInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserUpsertWithoutReviewsReceivedInput = {
    update: XOR<UserUpdateWithoutReviewsReceivedInput, UserUncheckedUpdateWithoutReviewsReceivedInput>
    create: XOR<UserCreateWithoutReviewsReceivedInput, UserUncheckedCreateWithoutReviewsReceivedInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReviewsReceivedInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReviewsReceivedInput, UserUncheckedUpdateWithoutReviewsReceivedInput>
  }

  export type UserUpdateWithoutReviewsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutReviewsReceivedInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
    driverVerification?: DriverVerificationUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutDriverVerificationInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideCreateNestedManyWithoutDriverInput
    bookings?: BookingCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    notifications?: NotificationCreateNestedManyWithoutUserInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    wallet?: WalletCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutDriverVerificationInput = {
    id?: string
    email: string
    password: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    avatarUrl?: string | null
    bio?: string | null
    role?: $Enums.Role
    driverRating?: number
    driverRatingCount?: number
    passengerRating?: number
    passengerRatingCount?: number
    isDriverVerified?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    ridesAsDriver?: RideUncheckedCreateNestedManyWithoutDriverInput
    bookings?: BookingUncheckedCreateNestedManyWithoutPassengerInput
    reviewsSent?: ReviewUncheckedCreateNestedManyWithoutReviewerInput
    reviewsReceived?: ReviewUncheckedCreateNestedManyWithoutRevieweeInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUserInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    wallet?: WalletUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutDriverVerificationInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutDriverVerificationInput, UserUncheckedCreateWithoutDriverVerificationInput>
  }

  export type UserUpsertWithoutDriverVerificationInput = {
    update: XOR<UserUpdateWithoutDriverVerificationInput, UserUncheckedUpdateWithoutDriverVerificationInput>
    create: XOR<UserCreateWithoutDriverVerificationInput, UserUncheckedCreateWithoutDriverVerificationInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutDriverVerificationInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutDriverVerificationInput, UserUncheckedUpdateWithoutDriverVerificationInput>
  }

  export type UserUpdateWithoutDriverVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUpdateManyWithoutDriverNestedInput
    bookings?: BookingUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    notifications?: NotificationUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutDriverVerificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    driverRating?: FloatFieldUpdateOperationsInput | number
    driverRatingCount?: IntFieldUpdateOperationsInput | number
    passengerRating?: FloatFieldUpdateOperationsInput | number
    passengerRatingCount?: IntFieldUpdateOperationsInput | number
    isDriverVerified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ridesAsDriver?: RideUncheckedUpdateManyWithoutDriverNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutPassengerNestedInput
    reviewsSent?: ReviewUncheckedUpdateManyWithoutReviewerNestedInput
    reviewsReceived?: ReviewUncheckedUpdateManyWithoutRevieweeNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUserNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    wallet?: WalletUncheckedUpdateOneWithoutUserNestedInput
  }

  export type RideCreateManyDriverInput = {
    id?: string
    origin: string
    originLat?: number | null
    originLng?: number | null
    destination: string
    destinationLat?: number | null
    destinationLng?: number | null
    distance?: number | null
    duration?: number | null
    departureTime: Date | string
    availableSeats: number
    pricePerSeat: number
    status?: $Enums.RideStatus
    description?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    originHouseNumber?: string | null
    originStreet?: string | null
    originWard?: string | null
    originDistrict?: string | null
    originProvince?: string | null
    originAddressType?: string | null
    destHouseNumber?: string | null
    destStreet?: string | null
    destWard?: string | null
    destDistrict?: string | null
    destProvince?: string | null
    destAddressType?: string | null
    addressDetailLevel?: string | null
  }

  export type BookingCreateManyPassengerInput = {
    id?: string
    rideId: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewCreateManyReviewerInput = {
    id?: string
    rideId: string
    revieweeId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type ReviewCreateManyRevieweeInput = {
    id?: string
    rideId: string
    reviewerId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type RefreshTokenCreateManyUserInput = {
    id?: string
    token: string
    revoked?: boolean
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type NotificationCreateManyUserInput = {
    id?: string
    title: string
    content: string
    type: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type MessageCreateManySenderInput = {
    id?: string
    rideId: string
    receiverId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type MessageCreateManyReceiverInput = {
    id?: string
    rideId: string
    senderId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type RideUpdateWithoutDriverInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    bookings?: BookingUpdateManyWithoutRideNestedInput
    reviews?: ReviewUpdateManyWithoutRideNestedInput
    messages?: MessageUpdateManyWithoutRideNestedInput
  }

  export type RideUncheckedUpdateWithoutDriverInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
    bookings?: BookingUncheckedUpdateManyWithoutRideNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutRideNestedInput
    messages?: MessageUncheckedUpdateManyWithoutRideNestedInput
  }

  export type RideUncheckedUpdateManyWithoutDriverInput = {
    id?: StringFieldUpdateOperationsInput | string
    origin?: StringFieldUpdateOperationsInput | string
    originLat?: NullableFloatFieldUpdateOperationsInput | number | null
    originLng?: NullableFloatFieldUpdateOperationsInput | number | null
    destination?: StringFieldUpdateOperationsInput | string
    destinationLat?: NullableFloatFieldUpdateOperationsInput | number | null
    destinationLng?: NullableFloatFieldUpdateOperationsInput | number | null
    distance?: NullableFloatFieldUpdateOperationsInput | number | null
    duration?: NullableFloatFieldUpdateOperationsInput | number | null
    departureTime?: DateTimeFieldUpdateOperationsInput | Date | string
    availableSeats?: IntFieldUpdateOperationsInput | number
    pricePerSeat?: FloatFieldUpdateOperationsInput | number
    status?: EnumRideStatusFieldUpdateOperationsInput | $Enums.RideStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    originHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    originStreet?: NullableStringFieldUpdateOperationsInput | string | null
    originWard?: NullableStringFieldUpdateOperationsInput | string | null
    originDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    originProvince?: NullableStringFieldUpdateOperationsInput | string | null
    originAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    destHouseNumber?: NullableStringFieldUpdateOperationsInput | string | null
    destStreet?: NullableStringFieldUpdateOperationsInput | string | null
    destWard?: NullableStringFieldUpdateOperationsInput | string | null
    destDistrict?: NullableStringFieldUpdateOperationsInput | string | null
    destProvince?: NullableStringFieldUpdateOperationsInput | string | null
    destAddressType?: NullableStringFieldUpdateOperationsInput | string | null
    addressDetailLevel?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BookingUpdateWithoutPassengerInput = {
    id?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutBookingsNestedInput
    transactions?: TransactionUpdateManyWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateWithoutPassengerInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateManyWithoutPassengerInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUpdateWithoutReviewerInput = {
    id?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutReviewsNestedInput
    reviewee?: UserUpdateOneRequiredWithoutReviewsReceivedNestedInput
  }

  export type ReviewUncheckedUpdateWithoutReviewerInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    revieweeId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyWithoutReviewerInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    revieweeId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUpdateWithoutRevieweeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutReviewsNestedInput
    reviewer?: UserUpdateOneRequiredWithoutReviewsSentNestedInput
  }

  export type ReviewUncheckedUpdateWithoutRevieweeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    reviewerId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyWithoutRevieweeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    reviewerId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    revoked?: BoolFieldUpdateOperationsInput | boolean
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    revoked?: BoolFieldUpdateOperationsInput | boolean
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    revoked?: BoolFieldUpdateOperationsInput | boolean
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutMessagesNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedMessagesNestedInput
  }

  export type MessageUncheckedUpdateWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyWithoutSenderInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUpdateWithoutReceiverInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    ride?: RideUpdateOneRequiredWithoutMessagesNestedInput
    sender?: UserUpdateOneRequiredWithoutSentMessagesNestedInput
  }

  export type MessageUncheckedUpdateWithoutReceiverInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyWithoutReceiverInput = {
    id?: StringFieldUpdateOperationsInput | string
    rideId?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyWalletInput = {
    id?: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    bookingId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    booking?: BookingUpdateOneWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutWalletInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    bookingId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BookingCreateManyRideInput = {
    id?: string
    passengerId: string
    seats: number
    totalPrice: number
    status?: $Enums.BookingStatus
    paymentStatus?: $Enums.PaymentStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewCreateManyRideInput = {
    id?: string
    reviewerId: string
    revieweeId: string
    rating: number
    comment?: string | null
    type: $Enums.ReviewType
    createdAt?: Date | string
  }

  export type MessageCreateManyRideInput = {
    id?: string
    senderId: string
    receiverId: string
    content: string
    isRead?: boolean
    createdAt?: Date | string
  }

  export type BookingUpdateWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    passenger?: UserUpdateOneRequiredWithoutBookingsNestedInput
    transactions?: TransactionUpdateManyWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    passengerId?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateManyWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    passengerId?: StringFieldUpdateOperationsInput | string
    seats?: IntFieldUpdateOperationsInput | number
    totalPrice?: FloatFieldUpdateOperationsInput | number
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    paymentStatus?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUpdateWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    reviewer?: UserUpdateOneRequiredWithoutReviewsSentNestedInput
    reviewee?: UserUpdateOneRequiredWithoutReviewsReceivedNestedInput
  }

  export type ReviewUncheckedUpdateWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    reviewerId?: StringFieldUpdateOperationsInput | string
    revieweeId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    reviewerId?: StringFieldUpdateOperationsInput | string
    revieweeId?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    type?: EnumReviewTypeFieldUpdateOperationsInput | $Enums.ReviewType
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUpdateWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentMessagesNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedMessagesNestedInput
  }

  export type MessageUncheckedUpdateWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyWithoutRideInput = {
    id?: StringFieldUpdateOperationsInput | string
    senderId?: StringFieldUpdateOperationsInput | string
    receiverId?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyBookingInput = {
    id?: string
    walletId: string
    amount: number
    type: $Enums.TransactionType
    status?: $Enums.TransactionStatus
    description?: string | null
    externalId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionUpdateWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    wallet?: WalletUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutBookingInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletId?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    type?: EnumTransactionTypeFieldUpdateOperationsInput | $Enums.TransactionType
    status?: EnumTransactionStatusFieldUpdateOperationsInput | $Enums.TransactionStatus
    description?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WalletCountOutputTypeDefaultArgs instead
     */
    export type WalletCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WalletCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RideCountOutputTypeDefaultArgs instead
     */
    export type RideCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RideCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BookingCountOutputTypeDefaultArgs instead
     */
    export type BookingCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BookingCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use WalletDefaultArgs instead
     */
    export type WalletArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = WalletDefaultArgs<ExtArgs>
    /**
     * @deprecated Use TransactionDefaultArgs instead
     */
    export type TransactionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = TransactionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use MessageDefaultArgs instead
     */
    export type MessageArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MessageDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RefreshTokenDefaultArgs instead
     */
    export type RefreshTokenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RefreshTokenDefaultArgs<ExtArgs>
    /**
     * @deprecated Use NotificationDefaultArgs instead
     */
    export type NotificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = NotificationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use RideDefaultArgs instead
     */
    export type RideArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = RideDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BookingDefaultArgs instead
     */
    export type BookingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BookingDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ReviewDefaultArgs instead
     */
    export type ReviewArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ReviewDefaultArgs<ExtArgs>
    /**
     * @deprecated Use DriverVerificationDefaultArgs instead
     */
    export type DriverVerificationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = DriverVerificationDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ProvinceMappingDefaultArgs instead
     */
    export type ProvinceMappingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ProvinceMappingDefaultArgs<ExtArgs>
    /**
     * @deprecated Use LocationDefaultArgs instead
     */
    export type LocationArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = LocationDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}