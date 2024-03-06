#!/bin/bash

EXITCODE=0
PTRN='console\.log'
FILES=$(git diff --cached --name-only | grep -E "^src")
for file in $FILES
do
    echo $file
    if [ $(git diff --cached $file | grep -E "$PTRN" | wc -l) != 0 ]
    then 
        cat $file | grep -n -E "$PTRN"
        EXITCODE=1
 
    fi
done
exit $EXITCODE
# CHECK