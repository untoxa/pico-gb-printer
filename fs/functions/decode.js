export const decode = (is_compressed, source, source_size, source_data_len, source_ptr, dest, dest_ptr) => {
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
                }
                else {
                    for (let i = 0; i < (tag + 1); i++) {
                        dest[dest_ptr++] = source[source_ptr++];
                    }
                }
            }
            return dest_ptr;
        }
        else {
            for (let i = 0; i < source_data_len; i++) {
                dest[dest_ptr++] = source[source_ptr++];
            }
            return dest_ptr;
        }
    }
    return dest_ptr;
};
