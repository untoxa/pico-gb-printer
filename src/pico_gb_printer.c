#define USE_MULTICORE 1

#include "pico/stdlib.h"
#include "pico/bootrom.h"
#include "hardware/timer.h"
#include "hardware/gpio.h"
#include "hardware/irq.h"
#include "hardware/watchdog.h"
#include "hardware/structs/watchdog.h"

#include "lwip/apps/fs.h"

#include "tusb_lwip_glue.h"

#if (USE_MULTICORE==1)
    #include "pico/multicore.h"
#endif

#define ENABLE_DEBUG            false

#define LED_PIN                 25
#define LED_SET(A)              (gpio_put(LED_PIN, (A)))
#define LED_ON                  LED_SET(true)
#define LED_OFF                 LED_SET(false)
#define LED_TOGGLE              (gpio_put(LED_PIN, !gpio_get(LED_PIN)))

#define MKS(A)                  (A)
#define MS(A)                   ((A) * 1000)
#define SEC(A)                  ((A) * 1000 * 1000)

// PI Pico printer

#define PIN_SCK                 0
#define PIN_SIN                 1
#define PIN_SOUT                2

#define PRINTER_DEVICE_ID       0x81

#define PRN_COMMAND_INIT        0x01
#define PRN_COMMAND_PRINT       0x02
#define PRN_COMMAND_DATA        0x04
#define PRN_COMMAND_STATUS      0x0F

#define PRN_STATUS_LOWBAT       0x80
#define PRN_STATUS_ER2          0x40
#define PRN_STATUS_ER1          0x20
#define PRN_STATUS_ER0          0x10
#define PRN_STATUS_UNTRAN       0x08
#define PRN_STATUS_FULL         0x04
#define PRN_STATUS_BUSY         0x02
#define PRN_STATUS_SUM          0x01
#define PRN_STATUS_OK           0x00

#define TILE_SIZE               0x10
#define PRINTER_WIDTH           20
#define PRINTER_BUFFER_SIZE     (PRINTER_WIDTH * TILE_SIZE * 2)

#define PRINTER_RESET           (printer_state = PRN_STATE_WAIT_FOR_SYNC_1, synchronized = false)

// PXLR-Studio 2 transfer

#define CAM_COMMAND_TRANSFER    0x10

enum printer_state {
    PRN_STATE_WAIT_FOR_SYNC_1,
    PRN_STATE_WAIT_FOR_SYNC_2,
    PRN_STATE_COMMAND,
    PRN_STATE_COMPRESSION_INDICATOR,
    PRN_STATE_LEN_LOWER,
    PRN_STATE_LEN_HIGHER,
    PRN_STATE_DATA,
    PRN_STATE_CHECKSUM_1,
    PRN_STATE_CHECKSUM_2,
    PRN_STATE_DEVICE_ID,
    PRN_STATE_STATUS
};

bool debug_enable = ENABLE_DEBUG;
bool speed_240_KHz = false;

volatile uint64_t last_watchdog, last_print_moment;

volatile enum printer_state printer_state = PRN_STATE_WAIT_FOR_SYNC_1;
volatile uint8_t recv_data = 0;
volatile uint8_t send_data = 0;
uint8_t recv_bits = 0;
volatile bool synchronized = false;

uint8_t printer_status = PRN_STATUS_OK, next_printer_status = PRN_STATUS_OK;
uint8_t printer_command = 0;
uint16_t receive_byte_counter = 0;
uint16_t packet_data_length = 0, printer_checksum = 0;

volatile uint32_t receive_data_pointer = 0;
uint8_t receive_data[96 * 1024];    // buffer length is 96K

uint8_t status_buffer[1024] = {0};  // buffer for rendering of status json

inline void receive_data_write(uint8_t b) {
    if (receive_data_pointer < sizeof(receive_data))
         receive_data[receive_data_pointer++] = b;
}

void gpio_callback(uint gpio, uint32_t events) {
    // check gpio
    if (gpio != PIN_SCK) return;
    // on the falling edge set sending bit
    if (events & GPIO_IRQ_EDGE_FALL) {
        gpio_put(PIN_SOUT, send_data & 0x80), send_data <<= 1;
        return;
    }
    // on the rising edge read received bit
    recv_data = (recv_data << 1) | (gpio_get(PIN_SIN) & 0x01);

    uint64_t now = time_us_64();
    if ((now - last_watchdog) > SEC(15)) {
        LED_OFF;
        PRINTER_RESET;
        last_watchdog = now;
    }

    if (synchronized) {
        if (++recv_bits != 8) return;
    } else {
        if (recv_data == 0x88) {
            printer_state = PRN_STATE_WAIT_FOR_SYNC_1, receive_data_pointer = 0, send_data = 0;
            synchronized = true;
        } else return;
    }
    recv_bits = 0;

    // packet state machine
    switch (printer_state) {
        case PRN_STATE_WAIT_FOR_SYNC_1:
            if (recv_data == 0x88) printer_state = PRN_STATE_WAIT_FOR_SYNC_2; else PRINTER_RESET;
            break;
        case PRN_STATE_WAIT_FOR_SYNC_2:
            if (recv_data == 0x33) printer_state = PRN_STATE_COMMAND; else PRINTER_RESET;
            break;
        case PRN_STATE_COMMAND:
            printer_command = recv_data;
            printer_state = PRN_STATE_COMPRESSION_INDICATOR;
            printer_status = next_printer_status;
            switch(printer_command) {
                case PRN_COMMAND_INIT:
//                    receive_data_pointer = 0;
                    printer_status = next_printer_status = PRN_STATUS_OK;
                    receive_data_write(printer_command);
                    break;
                case PRN_COMMAND_PRINT:
                    last_print_moment = now;
                    if (printer_status & PRN_STATUS_FULL) next_printer_status |= PRN_STATUS_BUSY;
                case CAM_COMMAND_TRANSFER:
                case PRN_COMMAND_DATA:
                    receive_data_write(printer_command);
                    break;
                case PRN_COMMAND_STATUS:
                    if (printer_status & PRN_STATUS_BUSY) {
                        if ((now - last_print_moment) > MS(100)) next_printer_status &= ~PRN_STATUS_BUSY;
                    }
                    break;
                default:
                    PRINTER_RESET;
                    break;
            }
            break;
        case PRN_STATE_COMPRESSION_INDICATOR:
            if (printer_command == PRN_COMMAND_DATA) receive_data_write(recv_data);
            printer_state = PRN_STATE_LEN_LOWER;
            break;
        case PRN_STATE_LEN_LOWER:
            packet_data_length = recv_data;
            printer_state = PRN_STATE_LEN_HIGHER;
            break;
        case PRN_STATE_LEN_HIGHER:
            packet_data_length |= ((uint16_t)recv_data << 8);
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
            if (!(receive_byte_counter & 0x3F)) LED_TOGGLE;
            if(++receive_byte_counter == packet_data_length)
                printer_state = PRN_STATE_CHECKSUM_1;
            receive_data_write(recv_data);
            break;
        case PRN_STATE_CHECKSUM_1:
            printer_checksum = recv_data, printer_state = PRN_STATE_CHECKSUM_2;
            LED_OFF;
            break;
        case PRN_STATE_CHECKSUM_2:
            printer_checksum |= ((uint16_t)recv_data << 8);
            printer_state = PRN_STATE_DEVICE_ID;
            send_data = PRINTER_DEVICE_ID;
            break;
        case PRN_STATE_DEVICE_ID:
            printer_state = PRN_STATE_STATUS;
            send_data = printer_status;
            break;
        case PRN_STATE_STATUS:
            last_watchdog = now;
            printer_state = PRN_STATE_WAIT_FOR_SYNC_1;
            send_data = 0;
            break;
        default:
            PRINTER_RESET;
            break;
    }
}

// let our webserver do some dynamic handling
#define ROOT_PAGE   "/index.shtml"
#define IMAGE_FILE  "/image.bin"
#define STATUS_FILE "/status.json"

static u16_t ssi_handler(int iIndex, char *pcInsert, int iInsertLen) {
    size_t printed = 0;
    switch (iIndex) {
        case 0:
            if (debug_enable) printed = snprintf(pcInsert, iInsertLen, "<a href=\"/reset_usb_boot\">Reset</a>");
            break;
        case 1:
            if (debug_enable) printed = snprintf(pcInsert, iInsertLen, "<a href=\"/image.bin\">Raw data</a>");
            break;
        default:
            break;
    }
    return (u16_t)printed;
}

static const char * ssi_tags[] = {"RESET", "RAWDATA" };

static const char *cgi_options(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    for (int i = 0; i < iNumParams; i++) {
        if (!strcmp(pcParam[i], "debug")) debug_enable = (!strcmp(pcValue[i], "on"));
    }
    return STATUS_FILE;
}

static const char *cgi_download(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    return IMAGE_FILE;
}

static const char *cgi_reset(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    receive_data_pointer = 0, PRINTER_RESET;
    return STATUS_FILE;
}

static const char *cgi_reset_usb_boot(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    if (debug_enable) reset_usb_boot(0, 0);
    return ROOT_PAGE;
}

static const tCGI cgi_handlers[] = {
    { "/options",           cgi_options },
    { "/download",          cgi_download },
    { "/reset",             cgi_reset },
    { "/reset_usb_boot",    cgi_reset_usb_boot }
};

int fs_open_custom(struct fs_file *file, const char *name) {
    static const char *on_off[]     = {"off", "on"};
    static const char *true_false[] = {"false", "true"};
    if (!strcmp(name, IMAGE_FILE)) {
        // initialize fs_file correctly
        memset(file, 0, sizeof(struct fs_file));
        file->data  = (const char *)receive_data;
        file->len   = receive_data_pointer;
        file->index = file->len;
        file->flags = FS_FILE_FLAGS_CUSTOM;
        return 1;
    } else if (!strcmp(name, STATUS_FILE)) {
        memset(file, 0, sizeof(struct fs_file));
        file->data  = status_buffer;
        file->len   = snprintf(status_buffer, sizeof(status_buffer),
                               "{\"result\":\"ok\",\"options\":{\"debug\":\"%s\"},\"status\":{\"synchronized\":%s,\"received:\":%d},\"system\":{\"fast\":%s}}",
                               on_off[debug_enable],
                               true_false[synchronized], receive_data_pointer,
                               true_false[speed_240_KHz]);
        file->index = file->len;
        file->flags = FS_FILE_FLAGS_CUSTOM;
        return 1;
    }
    return 0;
}

void fs_close_custom(struct fs_file *file) {
    LWIP_UNUSED_ARG(file);
}

#if (USE_MULTICORE==1)
void core1_context() {
    static const uint32_t events[] = {GPIO_IRQ_EDGE_FALL, GPIO_IRQ_EDGE_RISE};
    bool new, old = gpio_get(PIN_SCK);
    while (true) {
        if ((new = gpio_get(PIN_SCK)) != old) {
            gpio_callback(PIN_SCK, events[new]);
            old = new;
        }
    }
}
#endif

int main() {
    speed_240_KHz = set_sys_clock_khz(240000, false);

    // For toggle_led
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);

    LED_ON;

    // Initialize tinyusb, lwip, dhcpd and httpd
    init_lwip();
    wait_for_netif_is_up();
    dhcpd_init();
    httpd_init();
    http_set_cgi_handlers(cgi_handlers, LWIP_ARRAYSIZE(cgi_handlers));
    http_set_ssi_handler(ssi_handler, ssi_tags, LWIP_ARRAYSIZE(ssi_tags));

    // init SIO pins
    gpio_init(PIN_SCK);
    gpio_set_dir(PIN_SCK, GPIO_IN);

    gpio_init(PIN_SIN);
    gpio_set_dir(PIN_SIN, GPIO_IN);

    gpio_init(PIN_SOUT);
    gpio_set_dir(PIN_SOUT, GPIO_OUT);
    gpio_put(PIN_SOUT, 0);

#if (USE_MULTICORE==1)
    multicore_launch_core1(core1_context);
#else
    gpio_set_irq_enabled_with_callback(PIN_SCK, GPIO_IRQ_EDGE_FALL | GPIO_IRQ_EDGE_RISE, true, &gpio_callback);
    irq_set_priority(IO_IRQ_BANK0, 0);
#endif
    LED_OFF;

    while (true) {
        // process USB
        tud_task();
        // process WEB
        service_traffic();
    }

    return 0;
}
