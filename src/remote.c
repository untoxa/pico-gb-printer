#include <stdint.h>
#include <stdbool.h>

#include "pico/time.h"
#include "hardware/gpio.h"
#include "hardware/pio.h"

#include "globals.h"
#include "linkcable.h"
#include "linkcable.pio.h"

#define KEYBUFFER_SIZE (1u << 5)
#define KEYBUFFER_MASK (KEYBUFFER_SIZE - 1)

static uint8_t keybuffer[KEYBUFFER_SIZE];
static volatile uint8_t head = 0, tail = 0;

bool keys_push(uint8_t keys) {
    uint8_t h;
    if ((h = ((head + 1) & KEYBUFFER_MASK)) == tail) return false;
    keybuffer[head = h] = keys;
    return true;
}

bool keys_click(uint8_t keys) {
    if (((head + 1) & KEYBUFFER_MASK) == tail) return false;
    if (((head + 2) & KEYBUFFER_MASK) == tail) return false;
    keybuffer[head = ((head + 1) & KEYBUFFER_MASK)] = keys;
    keybuffer[head = ((head + 1) & KEYBUFFER_MASK)] = 0x00;
    return true;
}

bool keys_pop(uint8_t *keys) {
    if (head == tail) return false;
    tail = (tail + 1) & KEYBUFFER_MASK;
    *keys = keybuffer[tail];
    return true;
}

// 0bS0IPXXXX
//     S - stop, I - identifier, P - parity, XXXX - 4 Button or D-Pad bits
//     Stop bit is always 1.
//     Identifier is 1 for upper (buttons) and 0 for lower (D-Pad)
//     Parity bit is 1 when the count of 1's in XXXX bits is odd, 0 when even.

#define STOP   0b10000000
#define ID_KEY 0b00100000
#define ID_PAD 0b00000000

void transmit_data(uint8_t data) {
    linkcable_master_send(data);
    linkcable_master_receive(); // discard result
}

static uint8_t old_keys = 0;

void remote_send(uint8_t keys) {
    uint8_t data;

    if (keys == old_keys) return;
    linkcable_slave_suspend(true);
    if ((keys ^ old_keys) & 0x0f) {
        data = STOP | ID_PAD | (keys & 0x0f);
        data |= (((keys >> 0) ^ (keys >> 1) ^ (keys >> 2) ^ (keys >> 3)) & 0x01) << 4;
        transmit_data(data);
    }
    if ((keys ^ old_keys) & 0xf0) {
        data = STOP | ID_KEY | ((keys >> 4) & 0x0f);
        data |= (((keys >> 4) ^ (keys >> 5) ^ (keys >> 6) ^ (keys >> 7)) & 0x01) << 4;
        transmit_data(data);
    }
    linkcable_slave_suspend(false);
    old_keys = keys;
}