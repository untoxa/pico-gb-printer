
export const decode = (
  is_compressed: boolean,
  source: Uint8Array,
  source_size: number,
  source_data_len: number,
  source_ptr: number,
  dest: Uint8Array,
  dest_ptr: number,
) => {
  if (source_ptr + source_data_len <= source_size) {
    if (is_compressed) {
      const stop = source_ptr + source_data_len;
      while (source_ptr < stop) {
        const tag = source[source_ptr++];
        if (tag & 0x80) {
          const data = source[source_ptr++];
          for (let i = 0; i < ((tag & 0x7f) + 2); i++) {
            dest[dest_ptr++] = data;
          }
        } else {
          for (let i = 0; i < (tag + 1); i++) {
            dest[dest_ptr++] = source[source_ptr++];
          }
        }
      }
      return dest_ptr;
    } else {
      for (let i = 0; i < source_data_len; i++) {
        dest[dest_ptr++] = source[source_ptr++];
      }
      return dest_ptr;
    }
  }
  return dest_ptr;
}
