/** Copies only the allowed keys that are actually present on the source object. */
export default function pick(source = {}, keys) {
  return Object.fromEntries(
    keys.filter((key) => Object.hasOwn(source, key)).map((key) => [key, source[key]])
  );
}
