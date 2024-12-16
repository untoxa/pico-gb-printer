#include "hardware/gpio.h"
#include "hardware/timer.h"

#include "gb_printer.h"
#include "globals.h"

volatile enum printer_state printer_state = PRN_STATE_WAIT_FOR_SYNC_1;

#define PRINTER_RESET           (printer_state = PRN_STATE_WAIT_FOR_SYNC_1)

extern void receive_data_init();
extern void receive_data_reset();
extern void receive_data_write(uint8_t b);
extern void receive_data_commit(uint8_t cmd);

// printer packet state machine
void protocol_reset() {
    PRINTER_RESET;
}

uint8_t protocol_data_init() {
    return 0x00;
}

uint8_t protocol_data_process(uint8_t data_in) {
    static uint8_t printer_status = PRN_STATUS_OK, next_printer_status = PRN_STATUS_OK;
    static uint8_t printer_command = 0;
    static uint16_t receive_byte_counter = 0;
    static uint16_t packet_data_length = 0, printer_checksum = 0;
    static bool data_commit = false;
    static uint64_t last_print_moment = 0;

    switch (printer_state) {
        case PRN_STATE_WAIT_FOR_SYNC_1:
            data_commit = false;
            if (data_in == 0x88) printer_state = PRN_STATE_WAIT_FOR_SYNC_2; else PRINTER_RESET;
            break;
        case PRN_STATE_WAIT_FOR_SYNC_2:
            if (data_in == 0x33) printer_state = PRN_STATE_COMMAND; else PRINTER_RESET;
            break;
        case PRN_STATE_COMMAND:
            printer_command = data_in;
            printer_state = PRN_STATE_COMPRESSION_INDICATOR;
            printer_status = next_printer_status;
            switch(printer_command) {
                case PRN_COMMAND_INIT:
                    printer_status = next_printer_status = PRN_STATUS_OK;
                    receive_data_init();
                    break;
                case PRN_COMMAND_PRINT:
                    last_print_moment = time_us_64();
                    if (printer_status & PRN_STATUS_FULL) next_printer_status |= PRN_STATUS_BUSY;
                case CAM_COMMAND_TRANSFER:
                case PRN_COMMAND_DATA:
                    receive_data_write(printer_command);
                    break;
                case PRN_COMMAND_BREAK:
                    receive_data_reset();
                    printer_status = next_printer_status = PRN_STATUS_OK;
                    break;
                case PRN_COMMAND_STATUS:
                    if (printer_status & PRN_STATUS_BUSY) {
                        if ((time_us_64() - last_print_moment) > MS(100)) next_printer_status &= ~PRN_STATUS_BUSY;
                    }
                    break;
                default:
                    PRINTER_RESET;
                    break;
            }
            break;
        case PRN_STATE_COMPRESSION_INDICATOR:
            if (printer_command == PRN_COMMAND_DATA) receive_data_write(data_in);
            printer_state = PRN_STATE_LEN_LOWER;
            break;
        case PRN_STATE_LEN_LOWER:
            packet_data_length = data_in;
            printer_state = PRN_STATE_LEN_HIGHER;
            break;
        case PRN_STATE_LEN_HIGHER:
            packet_data_length |= ((uint16_t)data_in << 8);
            printer_state = (packet_data_length == 0) ? PRN_STATE_CHECKSUM_1 : PRN_STATE_DATA;
            switch (printer_command) {
                case PRN_COMMAND_DATA:
                    if (packet_data_length == 0) next_printer_status |= PRN_STATUS_FULL;
                case CAM_COMMAND_TRANSFER:
                case PRN_COMMAND_PRINT:
                    receive_data_write(packet_data_length);
                    receive_data_write(packet_data_length >> 8);
                    break;
            }
            receive_byte_counter = 0;
            break;
        case PRN_STATE_DATA:
#ifdef PRINT_PROGRESS_LED
            if ((receive_byte_counter & 0x3F) == 0) LED_TOGGLE;
#endif
            if(++receive_byte_counter == packet_data_length) printer_state = PRN_STATE_CHECKSUM_1;
            receive_data_write(data_in);
            switch (printer_command) {
                case PRN_COMMAND_PRINT:
                    data_commit = ((receive_byte_counter == 2) && (data_in == 0x03));
                    break;
                case CAM_COMMAND_TRANSFER:
                    data_commit = true;
                    break;
                default:
                    data_commit = false;
                    break;
            }
            break;
        case PRN_STATE_CHECKSUM_1:
            printer_checksum = data_in, printer_state = PRN_STATE_CHECKSUM_2;
#ifdef PRINT_PROGRESS_LED
            LED_OFF;
#endif
            break;
        case PRN_STATE_CHECKSUM_2:
            printer_checksum |= ((uint16_t)data_in << 8);
            printer_state = PRN_STATE_DEVICE_ID;
            return PRINTER_DEVICE_ID;
        case PRN_STATE_DEVICE_ID:
            printer_state = PRN_STATE_STATUS;
            return printer_status;
        case PRN_STATE_STATUS:
            if (data_commit) receive_data_commit(printer_command), data_commit = false;
            printer_state = PRN_STATE_WAIT_FOR_SYNC_1;
            break;
        default:
            PRINTER_RESET;
            break;
    }
    return 0;
}
