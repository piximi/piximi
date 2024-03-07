#!/bin/bash

EXITCODE=0
PTRN='console\.log'
FILES=$(git diff --cached --name-only | grep -E "^src")
for file in $FILES
do
    if [ $(cat $file | grep -E "$PTRN" | wc -l) != 0 ]
    then 
        echo $file
        cat $file | grep -n -E "$PTRN"
        EXITCODE=1
    fi
done
exit 0 #$EXITCODE
# CHECK