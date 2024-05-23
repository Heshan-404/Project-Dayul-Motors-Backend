const pino = require("pino");

exports.handler = async (event) => {
  const logger = pino({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  });

  logger.info("Hello from a minimal Lambda with pino-pretty!");

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Check your logs!" }),
  };
};
