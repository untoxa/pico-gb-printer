#!/bin/sh

if [ ! -f makefsdata ]; then
    # Doing this outside cmake as we don't want it cross-compiled but for host
    echo Compiling makefsdata
    gcc -o build/makefsdata -Ilwip/src/include -I. lwip/src/apps/http/makefsdata/makefsdata.c
fi

echo Regenerating fsdata.c
./build/makefsdata 
echo Done
