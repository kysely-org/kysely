import { DatabaseConnection } from '../../driver/database-connection.js'

/**
 * Config for the MySQL dialect.
 *
 * This interface is equal to `mysql2` library's pool config.
 *
 * https://github.com/sidorares/node-mysql2#using-connection-pools
 */
export interface MysqlDialectConfig {
  /**
   * The MySQL user to authenticate as
   */
  user?: string

  /**
   * The password of that MySQL user
   */
  password?: string

  /**
   * Name of the database to use for this connection
   */
  database?: string

  /**
   * The charset for the connection. This is called 'collation' in the SQL-level of MySQL (like utf8_general_ci).
   * If a SQL-level charset is specified (like utf8mb4) then the default collation for that charset is used.
   * (Default: 'UTF8_GENERAL_CI')
   */
  charset?: string

  /**
   * The hostname of the database you are connecting to. (Default: localhost)
   */
  host?: string

  /**
   * The port number to connect to. (Default: 3306)
   */
  port?: number

  /**
   * The source IP address to use for TCP connection
   */
  localAddress?: string

  /**
   * The path to a unix domain socket to connect to. When used host and port are ignored
   */
  socketPath?: string

  /**
   * The timezone used to store local dates. (Default: 'local')
   */
  timezone?: string | 'local'

  /**
   * The milliseconds before a timeout occurs during the initial connection to the MySQL server. (Default: 10 seconds)
   */
  connectTimeout?: number

  /**
   * Stringify objects instead of converting to values. (Default: 'false')
   */
  stringifyObjects?: boolean

  /**
   * Allow connecting to MySQL instances that ask for the old (insecure) authentication method. (Default: false)
   */
  insecureAuth?: boolean

  /**
   * Determines if column values should be converted to native JavaScript types. It is not recommended (and may go away / change in the future)
   * to disable type casting, but you can currently do so on either the connection or query level. (Default: true)
   *
   * You can also specify a function (field: any, next: () => void) => {} to do the type casting yourself.
   *
   * WARNING: YOU MUST INVOKE the parser using one of these three field functions in your custom typeCast callback. They can only be called once.
   *
   * field.string()
   * field.buffer()
   * field.geometry()
   *
   * are aliases for
   *
   * parser.parseLengthCodedString()
   * parser.parseLengthCodedBuffer()
   * parser.parseGeometryValue()
   *
   * You can find which field function you need to use by looking at: RowDataPacket.prototype._typeCast
   */
  typeCast?: boolean | ((field: any, next: () => void) => any)

  /**
   * A custom query format function
   */
  queryFormat?: (query: string, values: any) => void

  /**
   * When dealing with big numbers (BIGINT and DECIMAL columns) in the database, you should enable this option
   * (Default: false)
   */
  supportBigNumbers?: boolean

  /**
   * Enabling both supportBigNumbers and bigNumberStrings forces big numbers (BIGINT and DECIMAL columns) to be
   * always returned as JavaScript String objects (Default: false). Enabling supportBigNumbers but leaving
   * bigNumberStrings disabled will return big numbers as String objects only when they cannot be accurately
   * represented with [JavaScript Number objects] (http://ecma262-5.com/ELS5_HTML.htm#Section_8.5)
   * (which happens when they exceed the [-2^53, +2^53] range), otherwise they will be returned as Number objects.
   * This option is ignored if supportBigNumbers is disabled.
   */
  bigNumberStrings?: boolean

  /**
   * Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then inflated into JavaScript Date
   * objects. Can be true/false or an array of type names to keep as strings.
   *
   * (Default: false)
   */
  dateStrings?: boolean | Array<'TIMESTAMP' | 'DATETIME' | 'DATE'>

  /**
   * This will print all incoming and outgoing packets on stdout.
   * You can also restrict debugging to packet types by passing an array of types (strings) to debug;
   *
   * (Default: false)
   */
  debug?: any

  /**
   * Generates stack traces on Error to include call site of library entrance ('long stack traces'). Slight
   * performance penalty for most calls. (Default: true)
   */
  trace?: boolean

  /**
   * Allow multiple MySQL statements per query. Be careful with this, it exposes you to SQL injection attacks. (Default: false)
   */
  multipleStatements?: boolean

  /**
   * List of connection flags to use other than the default ones. It is also possible to blacklist default ones
   */
  flags?: Array<string>

  /**
   * object with ssl parameters or a string containing name of ssl profile
   */
  ssl?: string | MysqlSslOptions

  /**
   * Return each row as an array, not as an object.
   * This is useful when you have duplicate column names.
   * This can also be set in the `QueryOption` object to be applied per-query.
   */
  rowsAsArray?: boolean

  /**
   * The milliseconds before a timeout occurs during the connection acquisition. This is slightly different from connectTimeout,
   * because acquiring a pool connection does not always involve making a connection. (Default: 10 seconds)
   */
  acquireTimeout?: number

  /**
   * Determines the pool's action when no connections are available and the limit has been reached. If true, the pool will queue
   * the connection request and call it when one becomes available. If false, the pool will immediately call back with an error.
   * (Default: true)
   */
  waitForConnections?: boolean

  /**
   * The maximum number of connections to create at once. (Default: 10)
   */
  connectionLimit?: number

  /**
   * The maximum number of connection requests the pool will queue before returning an error from getConnection. If set to 0, there
   * is no limit to the number of queued connection requests. (Default: 0)
   */
  queueLimit?: number

  /**
   * Enable keep-alive on the socket.  It's disabled by default, but the
   * user can enable it and supply an initial delay.
   */
  enableKeepAlive?: true

  /**
   * If keep-alive is enabled users can supply an initial delay.
   */
  keepAliveInitialDelay?: number

  // The following are undocumented options taken from
  // https://github.com/sidorares/node-mysql2/blob/fce1a49b97b259b3926101fd1128835e0aa0bcc4/index.d.ts#L161

  charsetNumber?: number
  compress?: boolean
  authSwitchHandler?: (data: any, callback: () => void) => any
  connectAttributes?: { [param: string]: any }
  decimalNumbers?: boolean
  isServer?: boolean
  maxPreparedStatements?: number
  namedPlaceholders?: boolean
  nestTables?: boolean | string
  passwordSha1?: string
  pool?: any
  stream?: any
  uri?: string
  Promise?: any
  authPlugins?: {
    [key: string]: any
  }

  /**
   * Called once for each created connection.
   *
   * This is a Kysely specific feature and does not come from the `mysql2` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}

export interface MysqlSslOptions {
  /**
   * A string or buffer holding the PFX or PKCS12 encoded private key, certificate and CA certificates
   */
  pfx?: string

  /**
   * A string holding the PEM encoded private key
   */
  key?: string

  /**
   * A string of passphrase for the private key or pfx
   */
  passphrase?: string

  /**
   * A string holding the PEM encoded certificate
   */
  cert?: string

  /**
   * Either a string or list of strings of PEM encoded CA certificates to trust.
   */
  ca?: string | string[]

  /**
   * Either a string or list of strings of PEM encoded CRLs (Certificate Revocation List)
   */
  crl?: string | string[]

  /**
   * A string describing the ciphers to use or exclude
   */
  ciphers?: string

  /**
   * You can also connect to a MySQL server without properly providing the appropriate CA to trust. You should not do this.
   */
  rejectUnauthorized?: boolean
}
