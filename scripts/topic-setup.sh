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

(curl -s -X GET "http://${PUBSUB_EMULATOR_HOST}/v1/projects/${PUBSUB_PROJECT_ID}/topics" \
  | jq ".topics[].name" 2> /dev/null \
  | grep "/${TOPIC_NAME}"
  ) > /dev/null \
  || curl -s -X PUT "http://${PUBSUB_EMULATOR_HOST}/v1/projects/${PUBSUB_PROJECT_ID}/topics/${TOPIC_NAME}"