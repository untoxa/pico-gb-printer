#ifndef _REMOTE_H_INCLUDE_
#define _REMOTE_H_INCLUDE_

#include <stdint.h>
#include <stdbool.h>

#define J_NONE      0x00
#define	J_UP        0x04
#define	J_DOWN      0x08
#define	J_LEFT      0x02
#define	J_RIGHT     0x01
#define	J_A         0x10
#define	J_B         0x20
#define	J_SELECT    0x40
#define	J_START     0x80

void keys_push(uint8_t keys);
bool keys_pop(uint8_t *keys);

void remote_send(uint8_t keys);

#endif