# Pico GameBoy printer

<p align="center">
   <img src="https://github.com/untoxa/pico-gb-printer/blob/main/screenshot.png?raw=true"/><img src="https://github.com/untoxa/pico-gb-printer/blob/main/usage.png?raw=true"/>
</p>

Based on the original webserver for the PI Pico repo: https://github.com/maxnet/pico-webserver

Webserver example that came with TinyUSB slightly modified to run on a Raspberry Pi Pico.
Lets the Pico pretend to be a USB Ethernet device. Runs the webinterface at http://192.168.7.1/

Special thanks to Raphael-Boichot, please check this repo: https://github.com/Raphael-Boichot/The-Arduino-SD-Game-Boy-Printer

## Schematics

You will need a Raspberry Pi, 1/2 of the game boy link cable and a four-channel 5v to 3.3v level shifter. Connect parts as shown:

<p align="center">
  <img src="https://github.com/untoxa/pico-gb-printer/blob/main/schematics.png?raw=true"/>
</p>

This is the example of the ready-to-use device:

<p align="center">
  <img src="https://github.com/untoxa/pico-gb-printer/blob/main/device.jpg?raw=true"/>
</p>

As finding which is SIN and SOUT is sometimes tricky as signals are crossed within the serial cable, you can also make your own PCB with a Pi Zero and a GBC/GBA serial socket [following the guide here](https://github.com/Raphael-Boichot/Collection-of-PCB-for-Game-Boy-Printer-Emulators)

<p align="center">
  <img src="https://github.com/untoxa/pico-gb-printer/blob/main/PCB.png?raw=true"/>
</p>

## Build dependencies

### On Debian:

```
sudo apt install git build-essential cmake gcc-arm-none-eabi
```

Your Linux distribution does need to provide a recent CMake (3.13+).
If not, compile [CMake from source](https://cmake.org/download/#latest) first.

### On Windows:

- Install ARM GCC compiler: https://developer.arm.com/downloads/-/gnu-rm
- Install MSYS
- Install CMake

Then use this command 
```
cmake .. -G "MSYS Makefiles"
```

instead of
```
cmake ..
```
in the build instructions below.

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
