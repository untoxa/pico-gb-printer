#include "pico/stdlib.h"
#include "hardware/flash.h"
#include <string.h>

extern uint8_t __flash_binary_end;

static inline size_t get_sector_offset(uint32_t sector) {
    return (((size_t)(&__flash_binary_end - (uint8_t *)XIP_BASE) / FLASH_SECTOR_SIZE) + sector + 1) * FLASH_SECTOR_SIZE;
}

uint8_t * flash_address(uint32_t sector) {
    return (uint8_t *)XIP_BASE + get_sector_offset(sector);
}

uint8_t * flash_read(uint8_t * dest, uint32_t sector, uint32_t len) {
    return memcpy(dest, (uint8_t *)XIP_BASE + get_sector_offset(sector), len);
}

void flash_write(uint32_t sector, uint8_t * sour, uint32_t len) {
    uint8_t buffer[FLASH_PAGE_SIZE];
    size_t offset = get_sector_offset(sector);
    flash_range_erase(offset, (len / FLASH_SECTOR_SIZE + 1) * FLASH_SECTOR_SIZE);
    while (len) {
        uint32_t sz = (len < FLASH_PAGE_SIZE) ? len : FLASH_PAGE_SIZE;
        memcpy(buffer, sour, sz);
        sour += sz;
        flash_range_program(offset, buffer, sz);
        offset += FLASH_PAGE_SIZE;
        len -= sz;
    }
}
