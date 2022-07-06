/**
 * Utility type to force use of all properties of T.
 * 
 * Similar to Required<T> build-in type, but allows `undefined` values.
 */
type AllProps<T> = T & { [P in keyof T]-?: unknown; };

/**
 * Helper function to check listed properties according to given type. Check if all properties has been used when object is initialised.
 * 
 * Example use:
 * 
 * ```ts
 * type SomeType = { propA: string; propB?: number; }
 * 
 * // propB has to be mentioned even it is optional. It still should be initialized with undefined.
 * const a: SomeType = checkProps<SomeType>({ propA: "value A", propB: undefined });
 * 
 * // checked type is impicit for variable.
 * const b = checkProps<SomeType>({ propA: "value A", propB: undefined });
 * ```
 * 
 * Wrong use of this helper:
 * 
 * 1. Omit checked type - all checked properties will be expect as of type never
 * 
 * ```ts
 * const z: SomeType = checkProps({ propC: "no type will work" });
 * ```
 * 
 * 2. Apply to spreaded object - there is no way how to check in compile time if spreaded object contains all properties 
 * 
 * ```ts
 * const y: SomeType = { propA: "" }; // valid object according to SomeType declaration
 * const x = checkProps<SomeType>( { ... y } );
 * ```
 * 
 * @param obj object to check if all properties has been used
 * @returns untouched obj parameter is returned
 */
export function checkProps<CHECKED_TYPE = never, INFERRED_PARAM_TYPE extends CHECKED_TYPE = CHECKED_TYPE, INFERRED_RETURN_TYPE extends CHECKED_TYPE = CHECKED_TYPE>(obj: AllProps<INFERRED_PARAM_TYPE>) : INFERRED_RETURN_TYPE {
  return obj as unknown as INFERRED_RETURN_TYPE;
}