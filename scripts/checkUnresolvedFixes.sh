#!/bin/bash

EXITCODE=0
PTRN='//FIX_NOW'
FILES=$(git diff --cached --name-only | grep -E "^src")
for file in $FILES
do
    if [ $(cat $file | grep -E "$PTRN" | wc -l) != 0 ]
    then 
        if [ $(cat $file | grep -E "$IGNR" | wc -l) -eq 0 ]
        then
            echo $file
            cat $file | grep -n -E "$PTRN"
            EXITCODE=1
        fi
    fi
done
exit $EXITCODE
# CHECK