# https://github.com/GoogleCloudPlatform/cloud-sdk-docker#components-installed-in-each-tag
FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ADD entry-point.sh /entry-point.sh
RUN chmod a+x /entry-point.sh

ENTRYPOINT ["/entry-point.sh"]