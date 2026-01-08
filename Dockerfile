# Multi-stage build for ME Hub (me-chaind)
# Stage 1: Build the binary
FROM golang:1.20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make gcc musl-dev linux-headers

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire source code
COPY . .

# Build the binary
RUN make build

# Stage 2: Create the runtime image
FROM alpine:latest
WORKDIR /root

# Add runtime dependencies
RUN apk add --update --no-cache libstdc++ ca-certificates curl jq
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && apk add --update --no-cache libstdc++ ca-certificates

# Copy the binary from builder stage
COPY --from=builder /app/build/me-chaind /usr/bin/me-chaind

EXPOSE 26656/tcp 26657/tcp 26660/tcp 9090/tcp 1317/tcp
VOLUME ["/root"]
ENTRYPOINT ["me-chaind"]
