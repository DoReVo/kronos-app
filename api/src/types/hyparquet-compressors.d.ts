declare module "hyparquet-compressors/src/brotli.js" {
  export function decompressBrotli(input: Uint8Array, length: number): Uint8Array;
}
