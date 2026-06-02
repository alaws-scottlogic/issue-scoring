export const parseRepoUrl = (url: string) => {
  try {
    const cleanUrl = url.replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    if (parts.length < 2) return null;
    const repo = parts.pop();
    const owner = parts.pop();
    return { owner, repo };
  } catch (e) {
    return null;
  }
};

export const fetchIssues = async (repoUrl: string, ghToken: string) => {
  const repoData = parseRepoUrl(repoUrl);
  if (!repoData) {
    throw new Error(
      "Invalid GitHub URL. Please use format: https://github.com/owner/repo",
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (ghToken) headers["Authorization"] = `token ${ghToken}`;

  const query = `repo:${repoData.owner}/${repoData.repo} is:issue is:open -linked:pr`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=created&order=asc&per_page=100`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 403)
      throw new Error("GitHub API Rate Limit exceeded. Please provide a Token.");
    if (response.status === 404) throw new Error("Repository not found.");
    if (response.status === 422)
      throw new Error("Validation Failed. Please check the URL.");
    throw new Error(`GitHub API Error: ${response.status}`);
  }

  const data = await response.json();
  const pureIssues = data.items || [];

  if (pureIssues.length === 0) {
    throw new Error(
      "No open issues (without linked PRs) found in this repository.",
    );
  }

  return pureIssues;
};

export const checkForOpenPRs = async (issueUrl: string, ghToken: string) => {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (ghToken) headers["Authorization"] = `token ${ghToken}`;

    const response = await fetch(`${issueUrl}/timeline`, { headers });
    if (!response.ok) return false;

    const events = await response.json();

    return events.some(
      (event: any) =>
        event.event === "cross-referenced" &&
        event.source?.issue?.pull_request &&
        event.source?.issue?.state === "open",
    );
  } catch (e) {
    console.warn("Failed to check PR status", e);
    return false;
  }
};

export const fetchIssueComments = async (
  commentsUrl: string,
  ghToken: string,
) => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (ghToken) headers["Authorization"] = `token ${ghToken}`;

  const response = await fetch(commentsUrl, { headers });
  if (!response.ok) return [];
  return await response.json();
};