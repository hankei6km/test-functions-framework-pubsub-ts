# https://github.com/GoogleCloudPlatform/cloud-sdk-docker#components-installed-in-each-tag
FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG PUBSUB_EMULATOR_HOST=pubsub:8043
ARG PUBSUB_PROJECT_ID=abc

ENV PUBSUB_EMULATOR_HOST="${PUBSUB_EMULATOR_HOST}"
ENV PUBSUB_PROJECT_ID="${PUBSUB_PROJECT_ID}"

ADD entry-point.sh /entry-point.sh
ADD healthcheck.sh /healthcheck.sh
RUN chmod a+x /entry-point.sh \
  && chmod a+x healthcheck.sh

ENTRYPOINT ["/entry-point.sh"]