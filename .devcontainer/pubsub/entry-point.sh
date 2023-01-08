#!/bin/bash

exec gcloud beta emulators pubsub start \
    --project="${PUBSUB_PROJECT_ID}" \
    --host-port="0.0.0.0:${PUBSUB_EMULATOR_HOST#*:}"