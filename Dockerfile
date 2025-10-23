FROM letdown2491/haven-relay:v1.2.7

# Install bash for the Start9 entrypoint and ensure timezone data is present
RUN apk add --no-cache bash tzdata coreutils

# Prepare the Start9 data directory that will be mounted at runtime
RUN mkdir -p /data

# Copy Start9-specific entrypoint that translates Start9 config into Haven's expected layout
COPY docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
RUN chmod +x /usr/local/bin/docker_entrypoint.sh

ENV APP_DATA_DIR=/data

WORKDIR /haven

EXPOSE 3355

ENTRYPOINT ["/usr/local/bin/docker_entrypoint.sh"]

CMD ["/haven/haven"]
