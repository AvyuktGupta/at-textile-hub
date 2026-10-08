module.exports = {
  apps: [
    {
      name: "cupcraft-api",
      script: "src/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
      time: true,
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
