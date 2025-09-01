#include <stdint.h>

#include "hardware/pio.h"
#include "hardware/irq.h"

#include "linkcable.h"

#include "linkcable.pio.h"

bool speed_240_MHz = false;
bool linkcable_slave_enabled = true;

static irq_handler_t linkcable_irq_handler = NULL;
static uint32_t linkcable_pio_slave_pc = 0;
static uint32_t linkcable_pio_master_pc = 0;

static void linkcable_isr(void) {
    if (linkcable_irq_handler) linkcable_irq_handler();
    if (pio_interrupt_get(LINKCABLE_PIO, 0)) pio_interrupt_clear(LINKCABLE_PIO, 0);
}

void linkcable_reset(bool enable) {
    linkcable_slave_enabled = enable;
    pio_sm_set_enabled(LINKCABLE_PIO, LINKCABLE_SLAVE_SM, false);
    if (!enable) return;
    pio_sm_clear_fifos(LINKCABLE_PIO, LINKCABLE_SLAVE_SM);
    pio_sm_restart(LINKCABLE_PIO, LINKCABLE_SLAVE_SM);
    pio_sm_clkdiv_restart(LINKCABLE_PIO, LINKCABLE_SLAVE_SM);
    pio_sm_exec(LINKCABLE_PIO, LINKCABLE_SLAVE_SM, pio_encode_jmp(linkcable_pio_slave_pc));
    pio_sm_set_enabled(LINKCABLE_PIO, LINKCABLE_SLAVE_SM, true);
}

void linkcable_init(irq_handler_t onDataReceive) {
    linkcable_pins_init(LINKCABLE_PIO);
    linkcable_slave_program_init(LINKCABLE_PIO, LINKCABLE_SLAVE_SM, linkcable_pio_slave_pc = pio_add_program(LINKCABLE_PIO, &linkcable_slave_program));
    linkcable_master_program_init(LINKCABLE_PIO, LINKCABLE_MASTER_SM, linkcable_pio_master_pc = pio_add_program(LINKCABLE_PIO, &linkcable_master_program));

    if (onDataReceive) {
        linkcable_irq_handler = onDataReceive;
        pio_set_irq0_source_enabled(LINKCABLE_PIO, pis_interrupt0, true);
        irq_set_exclusive_handler(PIO0_IRQ_0, linkcable_isr);
        irq_set_enabled(PIO0_IRQ_0, true);
    }

    pio_enable_sm_mask_in_sync(LINKCABLE_PIO, (1u << LINKCABLE_SLAVE_SM) | (1u << LINKCABLE_MASTER_SM));
}