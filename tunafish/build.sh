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
docker build -t johnunderwood197/tunafish:latest -t johnunderwood197/tunafish:${abbrvhash} --platform=linux/amd64 .

EXITCODE=$?

if [ $EXITCODE -eq 0 ]
    then

    echo 
    echo "Starting container"
    echo
    docker stop tunafish
    docker rm tunafish
    docker run -t -i -d -p 5050:3000 --name tunafish --restart unless-stopped johnunderwood197/tunafish:latest

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