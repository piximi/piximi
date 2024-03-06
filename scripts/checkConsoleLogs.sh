#!/bin/bash

exitcode=0
consoleregexp='console\.log'
files=`git diff --cached --name-only | grep -E "^src"`
for file in $files
do
    echo $file
    if [ $(git diff --cached $file | grep -E "$consoleregexp" | wc -l) != 0 ]
    then 
        cat $file | grep -n -E "$consoleregexp"
        exitcode=1
 
    fi
done
exit $exitcode
# CHECK