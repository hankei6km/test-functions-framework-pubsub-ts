#!/bin/bash

exec gcloud beta emulators pubsub start \
    --project=abc \
    --host-port='0.0.0.0:8043'