#ifndef _DATABLOCKS_H_INCLUDE_
#define _DATABLOCKS_H_INCLUDE_

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#include "globals.h"

#define DATABLOCK_SIZE 512

#define MAX_BLOCK_COUNT ((BUFFER_SIZE_KB * 1024) / DATABLOCK_SIZE)
#define MAX_IMAGE_COUNT 30

typedef struct datablock_t {
    struct datablock_t * next;
    uint32_t size;
    uint8_t data[DATABLOCK_SIZE];
} datablock_t;

typedef struct datafile_t {
    struct datafile_t * next;
    uint32_t size;
    struct datablock_t * first;
    struct datablock_t * last;
} datafile_t;

extern datablock_t image_blocks[];
extern datablock_t * free_image_blocks;

extern datafile_t images[];
extern datafile_t * free_image_files;
extern datafile_t * image_files;

void reset_data_blocks(void);

datablock_t * allocate_block(void);
datablock_t * free_block(datablock_t * block);

datafile_t * allocate_file(void);
void free_file(datafile_t * file);

bool push_file(datafile_t * file);
datafile_t * pop_file(void);
datafile_t * pop_last_file(void);

inline bool files_allocated(void) {
    return (image_files != NULL);
}

#endif