window.addEventListener("DOMContentLoaded", async () => {
  const repoName = "webflow-cms-variants";
  const repoCommitsURL = `https://api.github.com/repos/jesusmpds/${repoName}/commits`;
  const responseData = await (await fetch(repoCommitsURL)).json();

  const lastCommitID = responseData[0].url.split("commits/")[1].substring(0, 7);
  const script = document.createElement("script");
  script.src = `https://cdn.jsdelivr.net/gh/jesusmpds/webflow-cms-variants@${lastCommitID}/webflow-cms-variants.js`;
  document.head.append(script);
});
