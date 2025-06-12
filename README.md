# ポケモンスリープ計算機

## アプリをコンテナーへ再ビルドする方法

docker build -t <ACR名>.azurecr.io/pksl-app:latest .
docker push <ACR名>.azurecr.io/pksl-app:latest
az webapp restart --resource-group <リソースグループ名> --name <アプリ名>
