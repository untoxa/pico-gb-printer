#ifndef _FLASHER_H_INCLUDE_
#define _FLASHER_H_INCLUDE_

uint8_t * flash_address(uint32_t sector);
uint8_t * flash_read(uint8_t * dest, uint32_t sector, uint32_t len);
void flash_write(uint32_t sector, uint8_t * sour, uint32_t len);

#endif
