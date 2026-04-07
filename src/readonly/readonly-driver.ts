import type { AccessMode } from '../driver/driver.js'

/**
 * Similar to {@link AccessMode} but read-only.
 */
export type ReadonlyAccessMode = Extract<AccessMode, 'read only'>
