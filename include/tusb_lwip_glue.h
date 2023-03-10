#ifndef _TUSB_LWIP_GLUE_H_
#define _TUSB_LWIP_GLUE_H_

#ifdef __cplusplus
 extern "C" {
#endif

#include "tusb.h"
#include "dhserver.h"
#include "dnserver.h"
#include "lwip/init.h"
#include "lwip/timeouts.h"
#include "lwip/apps/httpd.h"

void init_lwip(void);
void wait_for_netif_is_up(void);
void dhcpd_init(void);
void dns_init(void);
void service_traffic(void);

#ifdef __cplusplus
 }
#endif

#endif