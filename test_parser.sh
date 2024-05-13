#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

npm run build

FILENAME=$1

node "${SCRIPT_DIR}/dist/index.js" "${SCRIPT_DIR}/tests/${FILENAME}" -t parser
