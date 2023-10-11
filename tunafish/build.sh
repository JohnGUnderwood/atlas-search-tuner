#!/bin/bash

echo
echo "+================================"
echo "| START: ATLAS SEARCH TUNER"
echo "+================================"
echo

datehash=`date | md5sum | cut -d" " -f1`
abbrvhash=${datehash: -8}

echo 
echo "Building container using tag ${abbrvhash}"
echo
docker build -t graboskyc/tunafish:latest -t graboskyc/tunafish:${abbrvhash} .

EXITCODE=$?

if [ $EXITCODE -eq 0 ]
    then

    echo 
    echo "Starting container"
    echo
    docker stop tunafish
    docker rm tunafish
    docker run -t -i -d -p 5050:3000 --name tunafish --restart unless-stopped graboskyc/tunafish:latest

    echo
    echo "+================================"
    echo "| END:  ATLAS SEARCH TUNER"
    echo "+================================"
    echo
else
    echo
    echo "+================================"
    echo "| ERROR: Build failed"
    echo "+================================"
    echo
fi