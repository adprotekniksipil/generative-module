// PM2 Ecosystem Config — untuk deploy VPS 1GB RAM
// Menggunakan `next start` (webpack build) agar module resolution benar
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "modul-teknik-sipil",
      script: "node_modules/.bin/next",
      args: "start -p 3000 -H 0.0.0.0",
      cwd: "/home/neocode/app/frontend",

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },

      // Memory management untuk VPS 1GB
      // Batasi Node.js heap ke 384MB, restart jika melebihi 512MB
      max_memory_restart: "512M",
      node_args: "--max-old-space-size=384",

      // Single instance (JANGAN pakai cluster di 1GB)
      instances: 1,
      exec_mode: "fork",

      // Auto-restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,

      // Logging (rotate otomatis)
      error_file: "/home/neocode/logs/app-error.log",
      out_file: "/home/neocode/logs/app-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
