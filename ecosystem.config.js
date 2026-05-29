module.exports = {
  apps: [
    {
      name: 'indian-client',
      cwd: '/root/indian-pharmazee/client',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3004,
        NODE_ENV: 'production'
      },
      error_file: "/root/.pm2/logs/indian-pharmazee-client-error.log",
      out_file: "/root/.pm2/logs/indian-pharmazee-client-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
    {
      name: 'indian-admin',
      cwd: '/root/indian-pharmazee/front',
      script: 'npm',
      args: 'run preview',
      env: {
        PORT: 4175,
        NODE_ENV: 'production',
        HOST: '0.0.0.0'
      },
      error_file: "/root/.pm2/logs/indian-pharmazee-admin-error.log",
      out_file: "/root/.pm2/logs/indian-pharmazee-admin-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
    {
      name: 'indian-server',
      cwd: '/root/indian-pharmazee/server',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 4004,
        NODE_ENV: 'production'
      },
      error_file: "/root/.pm2/logs/indian-pharmazee-server-error.log",
      out_file: "/root/.pm2/logs/indian-pharmazee-server-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M"
    },
  ]
};