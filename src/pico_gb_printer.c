#include "pico/stdlib.h"
#include "pico/bootrom.h"
#include "pico/multicore.h"
#include "hardware/timer.h"
#include "hardware/gpio.h"
#include "hardware/irq.h"
#include "hardware/spi.h"
#include "hardware/resets.h"

#include "globals.h"

#include "lwip/apps/fs.h"
#include "tusb_lwip_glue.h"
#include "gb_printer.h"

bool debug_enable = ENABLE_DEBUG;
bool speed_240_MHz = false;

// storage implementation
volatile uint32_t receive_data_pointer = 0;
uint8_t receive_data[BUFFER_SIZE_KB * 1024];    // buffer length is 96K

uint8_t status_buffer[1024] = {0};              // buffer for rendering of status json
uint8_t list_buffer[512] = {0};                 // buffer for rendering of 2bit web app list json

void receive_data_reset() {
    receive_data_pointer = 0;
}

void receive_data_write(uint8_t b) {
    if (receive_data_pointer < sizeof(receive_data))
         receive_data[receive_data_pointer++] = b;
}

void receive_data_commit() {
}

// key button
#if (PIN_KEY!=0)
static void key_callback(uint gpio, uint32_t events) {
    receive_data_reset();
    protocol_reset();
    LED_OFF;
}
#endif

// SPI polling loop and routines
static inline void spi_disable(spi_inst_t *spi) {
    hw_clear_bits(&spi_get_hw(spi)->cr1, SPI_SSPCR1_SSE_BITS);
}
static inline void spi_enable(spi_inst_t *spi) {
    hw_set_bits(&spi_get_hw(spi)->cr1, SPI_SSPCR1_SSE_BITS);
}
static inline bool spi_busy(spi_inst_t *spi) {
    return (spi_get_hw(spi)->sr & SPI_SSPSR_BSY_BITS);
}
static inline bool spi_fifo_empty(spi_inst_t *spi) {
    return (spi_get_hw(spi)->sr & SPI_SSPSR_TFE_BITS);
}

void spi_slave_reinit(spi_inst_t *spi, uint32_t baudrate, uint8_t initial_value) {
    reset_block(spi == spi0 ? RESETS_RESET_SPI0_BITS : RESETS_RESET_SPI1_BITS);
    unreset_block_wait(spi == spi0 ? RESETS_RESET_SPI0_BITS : RESETS_RESET_SPI1_BITS);

    spi_set_baudrate(spi, baudrate);
    spi_set_format(spi, 8, SPI_CPOL_1, SPI_CPHA_1, SPI_MSB_FIRST);
    hw_set_bits(&spi_get_hw(spi)->dmacr, SPI_SSPDMACR_TXDMAE_BITS | SPI_SSPDMACR_RXDMAE_BITS);
    spi_set_slave(spi, true);

    spi_get_hw(spi)->dr = initial_value;

    hw_set_bits(&spi_get_hw(spi)->cr1, SPI_SSPCR1_SSE_BITS);
}

void core1_context() {
    irq_set_mask_enabled(0xffffffff, false);

    // init SPI
    gpio_set_function(PIN_SPI_SCK, GPIO_FUNC_SPI), gpio_pull_up(PIN_SPI_SCK);
//    gpio_set_function(PIN_SPI_CS, GPIO_FUNC_SPI), gpio_pull_down(PIN_SPI_CS);
    gpio_set_function(PIN_SPI_SIN, GPIO_FUNC_SPI);
    gpio_set_function(PIN_SPI_SOUT, GPIO_FUNC_SPI);

    spi_slave_reinit(SPI_PORT, SPI_BAUDRATE, protocol_data_init());

    uint64_t last_readable = time_us_64();
    while (true) {
        uint64_t time_us_now = time_us_64();
        if (spi_is_readable(SPI_PORT)) {
            spi_get_hw(SPI_PORT)->dr = protocol_data_process(spi_get_hw(SPI_PORT)->dr);
            last_readable = time_us_now;
        } else if ((time_us_now - last_readable) > MS(300)) {
            spi_slave_reinit(SPI_PORT, SPI_BAUDRATE, protocol_data_init());
            last_readable = time_us_now;
        }
    }
}

// Webserver dynamic handling
#define ROOT_PAGE   "/index.shtml"
#define IMAGE_FILE  "/image.bin"
#define STATUS_FILE "/status.json"
#define LIST_FILE   "/list.json"

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

static const char *cgi_list(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    return LIST_FILE;
}

static const char *cgi_reset(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    receive_data_reset();
    protocol_reset();
    return STATUS_FILE;
}

static const char *cgi_reset_usb_boot(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    if (debug_enable) reset_usb_boot(0, 0);
    return ROOT_PAGE;
}

static const tCGI cgi_handlers[] = {
    { "/options",           cgi_options },
    { "/download",          cgi_download },
    { "/dumps/list",        cgi_list },
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
                               "{\"result\":\"ok\"," \
                               "\"options\":{\"debug\":\"%s\"}," \
                               "\"status\":{\"received:\":%d},"\
                               "\"system\":{\"fast\":%s,\"buffer_size\":%d}}",
                               on_off[debug_enable],
                               receive_data_pointer,
                               true_false[speed_240_MHz], sizeof(receive_data));
        file->index = file->len;
        file->flags = FS_FILE_FLAGS_CUSTOM;
        return 1;
    } else if (!strcmp(name, LIST_FILE)) {
        memset(file, 0, sizeof(struct fs_file));
        file->data  = list_buffer;
        file->len   = snprintf(list_buffer, sizeof(list_buffer),
                               "{\"dumps\": [%s]}",
                               ((receive_data_pointer != 0) ? "\"/image.bin\"" : ""));
        file->index = file->len;
        file->flags = FS_FILE_FLAGS_CUSTOM;
        return 1;
    }
    return 0;
}

void fs_close_custom(struct fs_file *file) {
    LWIP_UNUSED_ARG(file);
}

// main loop
int main() {
    speed_240_MHz = set_sys_clock_khz(240000, false);

    // For toggle_led
#if (LED_PIN!=0)
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
#endif
    LED_ON;

#if (PIN_KEY!=0)
    // set up key
    gpio_init(PIN_KEY);
    gpio_set_dir(PIN_KEY, GPIO_IN);
    gpio_set_irq_enabled_with_callback(PIN_KEY, GPIO_IRQ_EDGE_RISE, true, &key_callback);
#endif

    // Initialize tinyusb, lwip, dhcpd and httpd
    init_lwip();
    wait_for_netif_is_up();
    dhcpd_init();
    httpd_init();
    http_set_cgi_handlers(cgi_handlers, LWIP_ARRAYSIZE(cgi_handlers));
    http_set_ssi_handler(ssi_handler, ssi_tags, LWIP_ARRAYSIZE(ssi_tags));

    multicore_launch_core1(core1_context);

    LED_OFF;

    while (true) {
        // process USB
        tud_task();
        // process WEB
        service_traffic();
    }

    return 0;
}
