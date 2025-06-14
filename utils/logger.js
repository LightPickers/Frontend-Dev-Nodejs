const pino = require("pino");
// const pretty = require("pino-pretty");

// module.exports = function getLogger(prefix, logLevel = "debug") {
//   return pino(
//     pretty({
//       level: logLevel,
//       messageFormat: `[${prefix}]: {msg}`,
//       colorize: true,
//       sync: true,
//     })
//   );
// };

module.exports = function getLogger(prefix, logLevel = "debug") {
  return pino({
    level: logLevel,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        messageFormat: `[${prefix}]: {msg}`,
        translateTime: "yyyy-mm-dd HH:MM:ss",
      },
    },
  });
};
