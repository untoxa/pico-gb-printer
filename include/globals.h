#ifndef _GLOBALS_H_INCLUDE_
#define _GLOBALS_H_INCLUDE_

#define ENABLE_DEBUG            false
#define BUFFER_SIZE_KB          128
#define FILE_BUFFER_SIZE        16384

// LED pin, undefine to disable
#define LED_PIN                 25
#define LED_PIN_ALT             8
#ifdef LED_PIN
    #define LED_INIT            (gpio_init(LED_PIN), gpio_set_dir(LED_PIN, GPIO_OUT), gpio_init(LED_PIN_ALT), gpio_set_dir(LED_PIN_ALT, GPIO_OUT))
    #define LED_SET(A)          (gpio_put(LED_PIN, (A)), gpio_put(LED_PIN_ALT, (A)))
    #define LED_ON              LED_SET(true)
    #define LED_OFF             LED_SET(false)
    #define LED_TOGGLE          (gpio_put(LED_PIN, !gpio_get(LED_PIN)), gpio_put(LED_PIN_ALT, !gpio_get(LED_PIN_ALT)))
#else
    #define LED_INIT
    #define LED_ON
    #define LED_OFF
    #define LED_TOGGLE
#endif

// "Tear" button pin, undefine to disable
#define PIN_A                   23
#define PIN_A_ALT               9
#define PIN_B                   10
#define PIN_START               11
#define PIN_SELECT              12
#define PIN_UP                  4
#define PIN_DOWN                5
#define PIN_LEFT                6
#define PIN_RIGHT               7

// time intervals
#define MKS(A)                  (A)
#define MS(A)                   ((A) * 1000)
#define SEC(A)                  ((A) * 1000 * 1000)

#define LENGTH(A)               (sizeof((A))/sizeof((A)[0]))

#endif
