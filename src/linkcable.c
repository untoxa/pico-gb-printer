#include <stdint.h>

#include "hardware/pio.h"
#include "hardware/irq.h"

#include "linkcable.h"

#ifdef STACKSMASHING
    #include "linkcable_sm.pio.h"
#else
    #include "linkcable.pio.h"
#endif

static irq_handler_t linkcable_irq_handler = NULL;

static void linkcable_isr(void) {
    if (linkcable_irq_handler) linkcable_irq_handler();
    if (pio_interrupt_get(LINKCABLE_PIO, 0)) pio_interrupt_clear(LINKCABLE_PIO, 0);
}

void linkcable_init(irq_handler_t onDataReceive) {
#ifdef STACKSMASHING
    linkcable_sm_program_init(LINKCABLE_PIO, LINKCABLE_SM, pio_add_program(LINKCABLE_PIO, &linkcable_sm_program));
#else
    linkcable_program_init(LINKCABLE_PIO, LINKCABLE_SM, pio_add_program(LINKCABLE_PIO, &linkcable_program), CABLE_PINS_START);
#endif
//    pio_sm_put_blocking(LINKCABLE_PIO, LINKCABLE_SM, LINKCABLE_BITS - 1);
    pio_enable_sm_mask_in_sync(LINKCABLE_PIO, (1u << LINKCABLE_SM));

    if (onDataReceive) {
        linkcable_irq_handler = onDataReceive;
        pio_set_irq0_source_enabled(LINKCABLE_PIO, pis_interrupt0, true);
        irq_set_exclusive_handler(PIO0_IRQ_0, linkcable_isr);
        irq_set_enabled(PIO0_IRQ_0, true);
    }
}