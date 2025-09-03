#include "pico/stdlib.h"
#include "pico/time.h"
#include "pico/bootrom.h"
#include "hardware/timer.h"
#include "hardware/clocks.h"
#include "hardware/gpio.h"
#include "hardware/irq.h"
#include "hardware/resets.h"
#include "hardware/pio.h"

#include "globals.h"

#include "lwip/apps/fs.h"
#include "tusb_lwip_glue.h"
#include "gb_printer.h"
#include "linkcable.h"
#include "datablocks.h"
#include "remote.h"

bool debug_enable = ENABLE_DEBUG;

uint8_t file_buffer[FILE_BUFFER_SIZE];              // buffer for rendering of status json

datafile_t * allocated_file = NULL;
uint32_t last_file_len = 0;
uint32_t picture_count = 0;
bool is_printing = false;

void receive_data_reset(void) {
    is_printing = false;
    if (!allocated_file) return;
    last_file_len = allocated_file->size;
    if (push_file(allocated_file)) picture_count++;
    allocated_file = NULL;
}

bool double_init = false;
void receive_data_init(void) {
    if (double_init) receive_data_reset();
    double_init = true;
}

void receive_data_write(uint8_t b) {
    double_init = false;
    datablock_t * block;
    if (!allocated_file) {
        allocated_file = allocate_file();
        if (!allocated_file) return;
    }
    block = allocated_file->last;
    if (!block) {
        block = allocate_block();
        if (!block) return;
        allocated_file->first = allocated_file->last = block;
    }
    if (block->size >= DATABLOCK_SIZE) {
        block = allocate_block();
        if (!block) return;
        allocated_file->last->next = block;
        allocated_file->last = block;
    }
    block->data[block->size++] = b;
    allocated_file->size++;
}

void receive_data_commit(uint8_t cmd) {
    if (cmd == CAM_COMMAND_TRANSFER) receive_data_reset();
}

// link cable
bool next_reset = false;
bool link_cable_data_received = false;
void link_cable_ISR(void) {
    linkcable_slave_send(protocol_data_process(linkcable_slave_receive()));
    link_cable_data_received = true;
    is_printing = true;
}

int64_t link_cable_watchdog(alarm_id_t id, void *user_data) {
    next_reset = true;
    return MS(300);
}

bool next_key = false;
int64_t remote_control(alarm_id_t id, void *user_data) {
    next_key = true;
    return MS(17);
}

// remote control keyboard
uint8_t keyboard = 0;
const uint8_t keyboard_pins[32] = {
    [PIN_A]       = J_A,
    [PIN_B]       = J_B,
    [PIN_START]   = J_START,
    [PIN_SELECT]  = J_SELECT,
    [PIN_UP]      = J_UP,
    [PIN_DOWN]    = J_DOWN,
    [PIN_LEFT]    = J_LEFT,
    [PIN_RIGHT]   = J_RIGHT
};
static void keyboard_callback(uint gpio, uint32_t events) {
    if (events == GPIO_IRQ_EDGE_RISE) keyboard |= keyboard_pins[(gpio & 0x1fu)]; else keyboard &= ~keyboard_pins[(gpio & 0x1fu)];
    keys_push(keyboard);
}

// Webserver dynamic handling
#define ROOT_PAGE   "/index.html"
#define IMAGE_FILE  "/image.bin"
#define STATUS_FILE "/status.json"
#define LIST_FILE   "/list.json"

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

static const char *cgi_click(int iIndex, int iNumParams, char *pcParam[], char *pcValue[]) {
    for (uint32_t i = 0; i != iNumParams; ++i) {
        if (strcmp(pcParam[i], "btn") == 0) {
            keys_push(atoi(pcValue[i]));
            keys_push(J_NONE);
            break;
        }
    }
    return STATUS_FILE;
}

static const tCGI cgi_handlers[] = {
    { "/options",           cgi_options },
    { "/download",          cgi_download },
    { "/dumps/list",        cgi_list },
    { "/reset",             cgi_reset },
    { "/reset_usb_boot",    cgi_reset_usb_boot },
    { "/click",             cgi_click }
};

int fs_open_custom(struct fs_file *file, const char *name) {
    static const char *on_off[]     = {"off", "on"};
    static const char *true_false[] = {"false", "true"};
    if (!strcmp(name, IMAGE_FILE)) {
        datafile_t * datafile = pop_last_file();
        if (!datafile) return 0;
        picture_count--;
        datablock_t * data = datafile->first;
        if (!data) {
            free_file(datafile);
            return 0;
        }
        uint32_t ofs = 0, max_len = sizeof(file_buffer);
        for (uint32_t len; (data); data = data->next) {
            len = MIN(data->size, max_len);
            if (!len) break;
            memcpy(file_buffer + ofs, data->data, len);
            max_len -= len;
            ofs += len;
        }
        free_file(datafile);
        // initialize fs_file correctly
        memset(file, 0, sizeof(struct fs_file));
        file->data  = file_buffer;
        file->len   = ofs;
        file->index = ofs;
        return 1;
    } else if (!strcmp(name, STATUS_FILE)) {
        memset(file, 0, sizeof(struct fs_file));
        file->data  = file_buffer;
        file->len   = snprintf(file_buffer, sizeof(file_buffer),
                               "{\"result\":\"ok\"," \
                               "\"options\":{\"debug\":\"%s\"}," \
                               "\"status\":{\"last_size\":%d,\"total_files\":%d},"\
                               "\"system\":{\"fast\":%s}}",
                               on_off[debug_enable],
                               last_file_len, picture_count,
                               true_false[speed_240_MHz]);
        file->index = file->len;
        return 1;
    } else if (!strcmp(name, LIST_FILE)) {
        memset(file, 0, sizeof(struct fs_file));
        file->data  = file_buffer;
        file->len   = snprintf(file_buffer, sizeof(file_buffer),
                               "{\"dumps\": [%s]}",
                               ((picture_count) ? "\"/image.bin\"" : ""));
        file->index = file->len;
        return 1;
    }
    return 0;
}

void fs_close_custom(struct fs_file *file) {
    (void)(file);
}

// main loop
int main(void) {
    speed_240_MHz = set_sys_clock_khz(240000, false);

    // For toggle_led
#ifdef LED_PIN
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
    LED_ON;
#endif

    // reset file and block allocation
    reset_data_blocks();

    // set up keyboard
    for (uint8_t i = 0; i != LENGTH(keyboard_pins); ++i) {
        if (keyboard_pins[i]) {
            gpio_init(i);
            gpio_set_dir(i, GPIO_IN);
            gpio_set_irq_enabled_with_callback(i, GPIO_IRQ_EDGE_RISE | GPIO_IRQ_EDGE_FALL, true, &keyboard_callback);
        }
    }

    // Initialize tinyusb, lwip, dhcpd, dnsd and httpd
    init_lwip();

    wait_for_netif_is_up();
    dhcpd_init();
    dns_init();
    httpd_init();
    http_set_cgi_handlers(cgi_handlers, LWIP_ARRAYSIZE(cgi_handlers));

    linkcable_init(link_cable_ISR);

    add_alarm_in_us(MS(300), link_cable_watchdog, NULL, true);
    add_alarm_in_us(MS(17), remote_control, NULL, true);

#ifdef LED_PIN
    LED_OFF;
#endif

    while (true) {
#ifdef LED_PIN
        // print status
        if (is_printing) LED_ON; else LED_OFF;
#endif
        // process remote control
        static uint8_t keys;
        if (next_key) {
            if (!is_printing && keys_pop(&keys)) remote_send(keys);
            next_key = false;
        }
        // process linkcable reset watchdog
        if (next_reset) {
            if (!link_cable_data_received) {
                linkcable_reset(true);
                protocol_reset();
                receive_data_reset();
            } else link_cable_data_received = false;
            next_reset = false;
        }
        // process USB
        tud_task();
        // process WEB
        service_traffic();
    }

    return 0;
}
