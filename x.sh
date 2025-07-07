npm run esbuild

rm -rf code.zip

zip code.zip build/index.js

aws lambda update-function-code \
    --function-name velogBackup \
    --zip-file fileb://code.zip \
    --region ap-northeast-2
