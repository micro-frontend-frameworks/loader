import { Octokit } from "@octokit/rest";

/**
 * Act as a registry in this POC.
 */
const octokit = new Octokit({
  auth: process.env.OCTOKIT_TOKEN,
});

export { octokit };
