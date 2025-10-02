import winston from "winston";
import path from "path";

/**
 * Creates Winston logger instances for a specific runner
 * Separate loggers for console and network events
 * @param runnerId - Unique identifier for the runner
 * @returns Object with console and network loggers
 */
export function createRunnerLogger(runnerId: number) {
  const logDir = path.join(process.cwd(), "logs");
  const consoleLogFile = path.join(logDir, `runner-${runnerId}-console.log`);
  const networkLogFile = path.join(logDir, `runner-${runnerId}-network.log`);

  // Custom format with runner ID
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [Runner ${runnerId}] [${level.toUpperCase()}] ${message}`;
    })
  );

  // Main logger for console and general logs
  const consoleLogger = winston.createLogger({
    format: logFormat,
    transports: [
      // Console output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        ),
      }),
      // Console file output
      new winston.transports.File({
        filename: consoleLogFile,
        format: logFormat,
      }),
    ],
  });

  // Network logger for network traffic
  const networkLogger = winston.createLogger({
    format: logFormat,
    transports: [
      // Console output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        ),
      }),
      // Network file output
      new winston.transports.File({
        filename: networkLogFile,
        format: logFormat,
      }),
    ],
  });

  return { consoleLogger, networkLogger };
}
