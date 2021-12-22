import { VercelRequest, VercelResponse } from "@vercel/node";
import { octokit } from "../clients";
import { REPO } from "../utils/constants";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");

    return res;
  }

  const commits = await octokit.rest.repos.listCommits({
    ...REPO,
  });

  const lastCommit = commits.data[0].sha;

  const appsMetadata = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      ...REPO,
      tree_sha: lastCommit,
    }
  );

  const apps: { pages: { path: string; title: string }[] }[] = [];

  for await (const branch of appsMetadata.data.tree) {
    if (branch?.url) {
      const response = await octokit.request(`GET ${branch.url}`);

      if (response.data.tree) {
        for (const branch of response.data.tree) {
          if (branch.path === "mfe.config.json") {
            const response = await octokit.request(`GET ${branch.url}`);
            const content = Buffer.from(
              response.data.content,
              "base64"
            ).toString();
            apps.push(JSON.parse(content));
          }
        }
      }
    }
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(200).json({
    apps,
  });
}
