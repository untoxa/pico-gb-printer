# Pico GabeBoy printer

![screenshot](/screenshot.png)

Based on the original webserver for the PI Pico repo: https://github.com/maxnet/pico-webserver

Webserver example that came with TinyUSB slightly modified to run on a Raspberry Pi Pico.
Lets the Pico pretend to be a USB Ethernet device. Runs the webinterface at http://192.168.7.1/

I suggest to use this board: https://stacksmashing.gumroad.com/l/gb-link with PI Pico.

Special thanks to Raphael-Boichot, please check this repo: https://github.com/Raphael-Boichot/The-Arduino-SD-Game-Boy-Printer

## Build dependencies

### On Debian:

```
sudo apt install git build-essential cmake gcc-arm-none-eabi
```

Your Linux distribution does need to provide a recent CMake (3.13+).
If not, compile [CMake from source](https://cmake.org/download/#latest) first.

### On Windows:

Install ARM GCC compiler: https://developer.arm.com/downloads/-/gnu-rm
Install MSYS
Install CMake

use 
```
cmake .. -G "MSYS Makefiles"
```

instead of
```
cmake ..
```
in the build instruction below.

## Build instructions

```
git clone --depth 1 https://github.com/untoxa/pico-gb-printer
cd pico-gb-printer
git submodule update --init
mkdir -p build
cd build
cmake ..
make
```

Copy the resulting pico_gb_printer.uf2 file to the Pi Pico mass storage device manually.
Webserver will be available at http://192.168.7.1/

Content it is serving is in /fs
If you change any files there, run ./regen-fsdata.sh
