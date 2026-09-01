import { z } from "zod";

/** Accept missing/null FormData values and normalize to trimmed string. */
export function optionalText() {
  return z.preprocess((value) => (value == null ? "" : value), z.string().trim());
}

export function requiredText(message: string) {
  return z.preprocess(
    (value) => (value == null ? "" : value),
    z.string().trim().min(1, message),
  );
}
