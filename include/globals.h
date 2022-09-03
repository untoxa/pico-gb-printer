#ifndef _GLOBALS_H_INCLUDE_
#define _GLOBALS_H_INCLUDE_

#define ENABLE_DEBUG            false
#define BUFFER_SIZE_KB          176

// LED pin, define to 0 to disable
#define LED_PIN                 25
#if (LED_PIN != 0)
    #define LED_SET(A)          (gpio_put(LED_PIN, (A)))
    #define LED_ON              LED_SET(true)
    #define LED_OFF             LED_SET(false)
    #define LED_TOGGLE          (gpio_put(LED_PIN, !gpio_get(LED_PIN)))
#else
    #define LED_ON
    #define LED_OFF
    #define LED_TOGGLE
#endif

// SPI
#define SPI_PORT                spi0
#define SPI_BAUDRATE            64 * 1024 * 8

#define PIN_SPI_SIN             0
#define PIN_SPI_CS              1
#define PIN_SPI_SCK             2
#define PIN_SPI_SOUT            3

// "Tear" button pin, define to 0 to disable
#define PIN_KEY                 23

// time intervals
#define MKS(A)                  (A)
#define MS(A)                   ((A) * 1000)
#define SEC(A)                  ((A) * 1000 * 1000)

#endif