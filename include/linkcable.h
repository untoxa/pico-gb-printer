#ifndef _LINKCABLE_H_INCLUDE_
#define _LINKCABLE_H_INCLUDE_

#include "hardware/pio.h"

#define LINKCABLE_PIO       pio0
#define LINKCABLE_SM        0

#define LINKCABLE_BITS      8

#define PIN_SIN             0
#define PIN_SCK             2
#define PIN_SOUT            3

static inline uint8_t linkcable_receive(void) {
    return pio_sm_get(LINKCABLE_PIO, LINKCABLE_SM);
}

static inline void linkcable_send(uint8_t data) {
    pio_sm_put(LINKCABLE_PIO, LINKCABLE_SM, data);
}

static inline void linkcable_reset(void) {
    pio_sm_restart(LINKCABLE_PIO, LINKCABLE_SM);
}

void linkcable_init(irq_handler_t onReceive);

#endif