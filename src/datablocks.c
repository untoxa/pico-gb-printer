#include "datablocks.h"
#include <hardware/sync.h>

datablock_t image_blocks[MAX_BLOCK_COUNT];
datablock_t * free_image_blocks = NULL;

datafile_t images[MAX_IMAGE_COUNT];
datafile_t * free_image_files = NULL;
datafile_t * image_files = NULL;

void reset_data_blocks(void) {
    free_image_blocks = NULL;
    free_image_files = NULL;
    image_files = NULL;

    // free data blocks
    datablock_t * block = image_blocks;
    for (uint32_t i = 1; i < MAX_BLOCK_COUNT; i++) {
        block->next = block + 1;
        block++;
    }
    block->next = NULL;
    free_image_blocks = image_blocks;

    // free image "files"
    datafile_t * image = images;
    for (uint32_t i = 1; i < MAX_IMAGE_COUNT; i++) {
        image->next = image + 1;
        image++;
    }
    image->next = NULL;
    free_image_files = images;

    // reset files
    image_files = NULL;
}

datablock_t * allocate_block(void) {
    uint32_t status = save_and_disable_interrupts();
    datablock_t * block = free_image_blocks;
    if (block) {
        free_image_blocks = block->next;
        block->next = NULL;
        block->size = 0;
    }
    restore_interrupts(status);
    return block;
}

datablock_t * free_block(datablock_t * block) {
    if (!block) return NULL;
    uint32_t status = save_and_disable_interrupts();
    datablock_t * res = block->next;
    block->next = free_image_blocks;
    free_image_blocks = block;
    restore_interrupts(status);
    return res;
}

datafile_t * allocate_file(void) {
    uint32_t status = save_and_disable_interrupts();
    datafile_t * file = free_image_files;
    if (file) {
        free_image_files = file->next;
        file->next = NULL;
        file->size = 0;
        file->first = file->last = NULL;
    }
    restore_interrupts(status);
    return file;
}

void free_file(datafile_t * file) {
    if (!file) return;
    uint32_t status = save_and_disable_interrupts();
    datablock_t * block = file->first;
    while (block = free_block(block));
    file->next = free_image_files;
    free_image_files = file;
    restore_interrupts(status);
}

bool push_file(datafile_t * file) {
    if (!file) return false;
    if (file->first) {
        uint32_t status = save_and_disable_interrupts();
        file->next = image_files;
        image_files = file;
        restore_interrupts(status);
        return true;
    }
    free_file(file);
    return false;
}

datafile_t * pop_file(void) {
    uint32_t status = save_and_disable_interrupts();
    datafile_t * file = image_files;
    if (file) image_files = file->next;
    restore_interrupts(status);
    return file;
}

datafile_t * pop_last_file(void) {
    uint32_t status = save_and_disable_interrupts();
    datafile_t * file = image_files, * previous = NULL;
    while (file) {
        if (file->next) {
            previous = file;
            file = file->next;
            continue;
        }
        break;
    }
    if (previous) previous->next = NULL; else image_files = NULL;
    restore_interrupts(status);
    return file;
}
