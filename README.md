## APIs

API for my Website, my DiscordBot, and some various others will be added in misc over time.

Running on an ubuntu server managed through [Caddy](https://caddyserver.com/) and [PM2](https://pm2.keymetrics.io/)

// For my own purposes to reference when i inevitably forget :)

pm2 start "bun bot:serve" --name buffetBotApi
pm2 start "bun website:serve" --name personalWebsiteApi

/etc/caddy/Caddyfile
sudo nano

sudo nano /etc/caddy/Caddyfile
