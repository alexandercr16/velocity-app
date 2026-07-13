// @firebase/auth's package.json exports map lists the generic "types"
// condition before its "react-native" condition, so tsc (which always
// matches "types" first, regardless of our tsconfig customConditions)
// resolves the browser/generic type file and never sees the
// React-Native-only exports — even though Metro correctly picks the real
// React Native build at runtime via the "react-native" condition. This
// augments the generic types with the one RN-only export this app uses.
import type { Persistence } from "@firebase/auth";

declare module "@firebase/auth" {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
