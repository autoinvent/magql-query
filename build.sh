#!/bin/bash
set -e
[ -d "lib" ] && rm -R lib
yarn run lib
#rm magql-query-*.tgz
yarn pack --quiet
