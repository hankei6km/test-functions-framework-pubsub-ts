#!/bin/bash

set -e

TOPIC_NAME=""
if test -n "${1}" ; then
  TOPIC_NAME="${1}"
elif test -n "${TOPID}" ; then
  TOPIC_NAME="${TOPID}"
fi

if test -z "${TOPIC_NAME}" ; then
  echo "A topic name is requiered"
  exit 1
fi

DATA="$(echo -n 'test message' | base64)"
curl --request POST \
  "http://${PUBSUB_EMULATOR_HOST}/v1/projects/${PUBSUB_PROJECT_ID}/topics/${TOPIC_NAME}:publish"  \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
   --data '{"messages":[{"data":"'"${DATA}"'","attributes":{"reqid":"abcabc"}}]}' \
  --compressed
