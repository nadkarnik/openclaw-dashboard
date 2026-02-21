#!/bin/bash

# OpenClaw Dashboard Data Update Script
# Called with data type and JSON payload

DATA_DIR="$HOME/.openclaw/workspace/dashboard/data"
mkdir -p "$DATA_DIR"

DATATYPE="$1"
shift
JSONDATA="$*"

if [ -z "$DATATYPE" ] || [ -z "$JSONDATA" ]; then
    echo "Usage: $0 <datatype> <json-data>"
    exit 1
fi

echo "$JSONDATA" > "$DATA_DIR/${DATATYPE}.json"
echo "Updated ${DATATYPE}.json"
