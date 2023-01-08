#!/bin/bash
set -e

curl -X GET "http://${PUBSUB_EMULATOR_HOST}/v1/projects/${PUBSUB_PROJECT_ID}/topics"