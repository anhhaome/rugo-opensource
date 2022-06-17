# platform submodule get
git submodule init
git submodule update

# core submodule get
cd repos/core
git submodule init
git submodule update
git checkout master

cd packages/admin/lib
git checkout master
cd ../../view/lib
git checkout master

# platform install
cd ../../../../../
ln -s ./sample-storage ./storage
ln -s ./.env.sample .env
cp .env repos/core/packages/admin
npm i

# admin
cd repos/core/packages/admin
npm i
npm run build