// This file contains symbols for methods we don't want called
// outside the library code. These symbols are not exported
// from the library and therefore the user would need to do
// some pretty ugly stuff to call the methods, at which point
// it should be obvious they are doing something they're not
// supposed to.

export const INTERNAL_DRIVER_ENSURE_INIT = Symbol()
export const INTERNAL_DRIVER_ACQUIRE_CONNECTION = Symbol()
export const INTERNAL_DRIVER_RELEASE_CONNECTION = Symbol()
export const INTERNAL_DRIVER_ENSURE_DESTROY = Symbol()
