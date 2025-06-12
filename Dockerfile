# ビルド用イメージ
FROM node:18 AS typescript-builder
WORKDIR /app
COPY static/ts ./static/ts
COPY tsconfig.json ./
RUN npm install -g typescript
# 本番用に一度だけコンパイル
RUN tsc --outDir /app/js --rootDir /app/static/ts

FROM golang:1.24 AS builder
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
COPY --from=typescript-builder /app/js ./static/js
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app
RUN chmod +x app

# 実行用の軽量イメージ
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=builder /app/app .
COPY --from=builder /app/data ./data
COPY --from=builder /app/static ./static
ENV DEV_MODE=0
ENV PORT=8080
EXPOSE 8080
CMD ["/app/app"]
