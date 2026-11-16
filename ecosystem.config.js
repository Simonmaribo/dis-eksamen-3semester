// PM2-konfiguration: to instanser af appen på hver sin port bag Nginx' load balancer.
// Start med: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'hittegods-3000',
      script: 'src/server.js',
      env: { PORT: 3000 },
    },
    {
      name: 'hittegods-3001',
      script: 'src/server.js',
      env: { PORT: 3001 },
    },
  ],
};
