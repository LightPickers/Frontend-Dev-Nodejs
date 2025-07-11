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

let logger;

module.exports = function getLogger(prefix, logLevel = "debug") {
  if (!logger) {
    logger = pino({
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
  }
  return logger;
};
