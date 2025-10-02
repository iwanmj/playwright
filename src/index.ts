import { chromium } from "playwright";
import { Runner } from "./Runner";
import fs from "fs";
import path from "path";

const URL_SOURCE = "./url/jogja.staging.json";
const RUNNER_COUNT = 1;

(async () => {
  // Clean up logs and screenshots folders before starting
  const logsDir = path.join(process.cwd(), "logs");
  const screenshotsDir = path.join(process.cwd(), "screenshots");

  if (fs.existsSync(logsDir)) {
    fs.rmSync(logsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(logsDir, { recursive: true });

  if (fs.existsSync(screenshotsDir)) {
    fs.rmSync(screenshotsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const fileContent = await Bun.file(URL_SOURCE).text();
  const URLS: string[] = JSON.parse(fileContent)?.urls;
  console.log(URLS);

  // Launch single browser instance (shared for all runners)
  const browser = await chromium.launch({ headless: true });

  try {
    // Run all runners in parallel with separate contexts
    const runnerPromises = Array.from(
      { length: RUNNER_COUNT },
      async (_, i) => {
        const randomUrl = URLS[Math.floor(Math.random() * URLS.length)];
        if (!randomUrl) return;

        const runner = new Runner(randomUrl, browser, i);
        await runner.run();
      }
    );

    await Promise.all(runnerPromises);
  } finally {
    await browser.close();
  }
})();
