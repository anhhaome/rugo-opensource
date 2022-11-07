npm run admin:build
rm -rf sample-storage/public/admin
cp -r packages/admin/dist sample-storage/public/admin
node ./packages/service/src/start.js