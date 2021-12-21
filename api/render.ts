import { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { octokit } from "../clients";

const REPO = {
  owner: "micro-frontend-frameworks",
  repo: "nextjs-build-time-integration-mfes",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end("Method Not Allowed");

    return res;
  }

  const { target } = req.query;

  if (!target) {
    res.status(400).end("Bad Request");
    return res;
  }

  try {
    const deployments = await octokit.rest.repos.listDeployments({
      ...REPO,
    });

    // Look for a deployment page with this url
    // Return the first page that responds with data back

    let environments: string[] = [];

    for (const deployment of deployments.data) {
      const deploymentsStatuses =
        await octokit.rest.repos.listDeploymentStatuses({
          ...REPO,
          deployment_id: deployment.id,
        });

      environments = environments.concat(
        deploymentsStatuses.data
          .map((status) => status.environment_url)
          .filter(Boolean) as string[]
      );
    }

    environments = Array.from(new Set(environments));

    let html = "";

    for (const environment of environments) {
      try {
        const response = await axios.get(`${environment}/${req.url}`);

        if (response.data?.html) {
          html = response.data.html;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      html,
    });
  } catch (error) {
    throw error;
  }

  return res;
}
