/**
 * Project Detection Helper
 *
 * Automatically detects or creates Forge project for current workspace.
 * Matches forge-executor.ts logic (getOrCreateGenieProject).
 */

import { execSync } from 'child_process';

/**
 * Get or create Forge project for current workspace
 *
 * Detection logic:
 * 1. Query all projects from Forge
 * 2. Find project where git_repo_path matches process.cwd()
 * 3. If no match, create new project with auto-detected name
 *
 * @param forgeClient - ForgeClient instance
 * @returns Project ID
 */
export async function getOrCreateGenieProject(forgeClient: any): Promise<string> {
  const currentRepoPath = process.cwd();
  const projects = await forgeClient.listProjects();

  // Find existing project by git repo path
  const existingProject = projects.find((p: any) => p.git_repo_path === currentRepoPath);

  if (existingProject) {
    return existingProject.id;
  }

  // Auto-detect project name from git repo or directory name
  let projectName = 'Genie Project';
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
      cwd: currentRepoPath,
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    const match = remoteUrl.match(/\/([^\/]+?)(\.git)?$/);
    if (match && match[1]) {
      projectName = match[1].replace(/\.git$/, '');
    }
  } catch {
    try {
      const dirName = execSync('basename "$(pwd)"', {
        encoding: 'utf8',
        cwd: currentRepoPath,
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
      if (dirName) {
        projectName = dirName;
      }
    } catch {
      // Keep default
    }
  }

  // Create new project
  const newProject = await forgeClient.createProject({
    name: projectName,
    git_repo_path: currentRepoPath,
    use_existing_repo: true
  });

  return newProject.id;
}
