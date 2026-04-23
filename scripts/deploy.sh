#!/bin/bash

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 IPTV SaaS - Deploy Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROJECT_DIR="/var/www/iptv-saas"
WEB_DIR="/var/www"

read -p "Ingresá el dominio (ej: tudominio.com): " DOMAIN
read -p "Ruta de instalacion (default: /var/www/iptv-saas): " PROJECT_DIR
PROJECT_DIR=${PROJECT_DIR:-/var/www/iptv-saas}

echo ""
echo "1️⃣ Actualizando codigo..."
cd $PROJECT_DIR
git pull

echo ""
echo "2️⃣ Build backend..."
cd $PROJECT_DIR/backend
npm install
npx prisma migrate deploy
npm run build

echo ""
echo "3️⃣ Build frontend admin..."
cd $PROJECT_DIR/frontend-admin
npm install
npm run build
rm -rf $WEB_DIR/iptv-admin
cp -r dist $WEB_DIR/iptv-admin

echo ""
echo "4️⃣ Copiando frontend TV..."
rm -rf $WEB_DIR/iptv-tv
cp -r $PROJECT_DIR/frontend-tv $WEB_DIR/iptv-tv

echo ""
echo "5️⃣ Reiniciando backend con PM2..."
cd $PROJECT_DIR
pm2 restart iptv-backend || pm2 start ecosystem.config.js

echo ""
echo "6️⃣ Copiando configuracion Nginx..."
sudo cp $PROJECT_DIR/scripts/nginx.conf /etc/nginx/sites-available/iptv
sudo ln -sf /etc/nginx/sites-available/iptv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy completado!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "TV Client: http://$DOMAIN"
echo "Admin:     http://$DOMAIN/admin"
echo "API:       http://$DOMAIN/api"
