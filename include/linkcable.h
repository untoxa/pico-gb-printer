#ifndef _LINKCABLE_H_INCLUDE_
#define _LINKCABLE_H_INCLUDE_

#include <stdint.h>
#include <stdbool.h>

#include "hardware/pio.h"

#define LINKCABLE_PIO       pio0
#define LINKCABLE_SLAVE_SM  0
#define LINKCABLE_MASTER_SM 1

extern bool speed_240_MHz;
extern volatile bool linkcable_slave_enabled;

void linkcable_init(irq_handler_t onReceive);
void linkcable_reset(bool enable);

static inline void linkcable_slave_suspend(bool suspend) {
    linkcable_reset(linkcable_slave_enabled = !suspend);
}

static inline uint8_t linkcable_slave_receive(void) {
    return pio_sm_get(LINKCABLE_PIO, LINKCABLE_SLAVE_SM);
}

static inline void linkcable_slave_send(uint8_t data) {
    pio_sm_put(LINKCABLE_PIO, LINKCABLE_SLAVE_SM, data);
}

static inline uint8_t linkcable_master_receive(void) {
    return pio_sm_get_blocking(LINKCABLE_PIO, LINKCABLE_MASTER_SM);
}

static inline void linkcable_master_send(uint8_t data) {
    pio_sm_put(LINKCABLE_PIO, LINKCABLE_MASTER_SM, data);
}

#endif