module.exports = {
  apps: [
    {
      name: 'iptv-backend',
      script: 'dist/app.js',
      cwd: 'backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
