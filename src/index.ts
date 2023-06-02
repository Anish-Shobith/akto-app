import { Octokit } from "@octokit/rest";
import { PrismaClient } from "@prisma/client";
import { CronJob } from "cron";
import winston from "winston";

// Testing GitHub repository
const REPO_OWNER = "Anish-Shobith";
const REPO_NAME = "public-testing";
const FILE_PATH = "pattern.json";

/**
 * Octokit is a library that makes it easy to work with the GitHub API.
 * It is used here to fetch the repo content.
 * https://octokit.github.io/rest.js/
 */
const octokit = new Octokit();

/**
 * Prisma is an ORM that makes it easy to work with databases.
 * It is used here to store the Github content in a database.
 * https://www.prisma.io/
 */
const prisma = new PrismaClient();

/**
 * The PiiData interface defines the shape of the data that is fetched from the repo.
 * The data is stored in the database using the Prisma ORM.
 * https://www.prisma.io/docs/concepts/components/prisma-client/crud
 */
interface PiiData {
  name: string;
  regexPattern: string;
  sensitive: boolean;
  onKey: boolean;
}

/**
 * Create a Winston logger with a console transport
 */
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss A" }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${level.toUpperCase()} ${timestamp}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

/**
 * This function fetches the file content from the repo and stores it in the database.
 * It is called every minute by the cron job.
 * https://www.npmjs.com/package/cron
 */
const fetchDataFromRepo = async () => {
  try {
    // Fetch the file content from the GitHub repository
    const response = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
    });
    const file = response.data;

    // Parse the file content as JSON
    const jsonData = JSON.parse(
      // @ts-expect-error Property 'content' does not exist on type 'text'.
      Buffer.from(file.content!, "base64").toString()
    ) as { types: PiiData[] };
    const piiPatterns = jsonData.types;

    // Get the existing patterns from the database
    const existingPatterns = await prisma.piiPattern.findMany();

    // Create a map of existing pattern names for efficient lookup
    const existingPatternNames = new Set(
      existingPatterns.map((pattern) => pattern.name)
    );

    // Filter out patterns that are no longer present in the repository file
    const deletedPatterns = existingPatterns.filter(
      (pattern) =>
        !piiPatterns.some((newPattern) => newPattern.name === pattern.name)
    );

    // Check if there are any new or deleted patterns
    const hasChanges =
      piiPatterns.length !== existingPatterns.length ||
      deletedPatterns.length > 0;

    if (hasChanges) {
      // Delete the patterns that are no longer present
      if (deletedPatterns.length > 0) {
        await prisma.piiPattern.deleteMany({
          where: {
            id: {
              in: deletedPatterns.map((pattern) => pattern.id),
            },
          },
        });
      }

      // Create or update the new patterns
      for (const newPattern of piiPatterns) {
        if (existingPatternNames.has(newPattern.name)) {
          // Update existing pattern
          await prisma.piiPattern.updateMany({
            where: {
              name: newPattern.name,
            },
            data: newPattern,
          });
        } else {
          // Insert new pattern
          await prisma.piiPattern.create({
            data: newPattern,
          });
        }
      }

      logger.info("Data fetched and stored successfully.");
    } else {
      logger.warn("No changes detected. Database not updated.");
    }
  } catch (error) {
    logger.error("Error fetching and storing data:", error);
  } finally {
    // Disconnect from the Prisma client
    await prisma.$disconnect();
  }
};

/**
 * This function fetches the repo content and stores it in the database.
 * This is an IIFE, and is made for testing purposes.
 */
// (async () => {
//   await fetchDataFromRepo();
// })();

// Create a cron job that runs every minute. It calls the fetchDataFromRepo function.
const cronJob = new CronJob("*/1 * * * *", fetchDataFromRepo);

// Start the cron job
cronJob.start();

if (cronJob.running) {
  logger.info("Cron job started successfully.");
}
