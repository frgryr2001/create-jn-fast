import fs from 'node:fs';
import path from 'node:path';

export function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

// Folders to ignore when copying templates
const IGNORE_FOLDERS = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '.nuxt',
  '.output',
  '.vercel',
  '.turbo',
  'coverage',
  '.cache',
  '.vscode',
  '.idea',
]);

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    // Skip ignored folders
    if (IGNORE_FOLDERS.has(file)) {
      continue;
    }

    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

export function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

export function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  );
}

export function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
}

export function isEmptyDir(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

export function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) {
    return undefined;
  }

  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');

  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

export function rmdirPreserveGit(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }

    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

/**
 * Merge package.json files
 */
export function mergePackageJson(srcPath: string, destPath: string): void {
  if (!fs.existsSync(srcPath) || !fs.existsSync(destPath)) {
    return;
  }

  const srcPkg = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
  const destPkg = JSON.parse(fs.readFileSync(destPath, 'utf-8'));

  // Merge dependencies
  if (srcPkg.dependencies) {
    destPkg.dependencies = {
      ...destPkg.dependencies,
      ...srcPkg.dependencies,
    };
  }
  if (srcPkg.devDependencies) {
    destPkg.devDependencies = {
      ...destPkg.devDependencies,
      ...srcPkg.devDependencies,
    };
  }
  if (srcPkg.scripts) {
    destPkg.scripts = { ...destPkg.scripts, ...srcPkg.scripts };
  }

  fs.writeFileSync(destPath, JSON.stringify(destPkg, null, 2) + '\n');
}

/**
 * Copy folder with merge package.json option
 */
export function copyFolder(options: {
  from: string;
  to: string;
  isMergePackageJson?: boolean;
}): void {
  const { from, to, isMergePackageJson = false } = options;

  if (!fs.existsSync(from)) {
    return;
  }

  // Ensure destination exists
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  const files = fs.readdirSync(from);

  for (const file of files) {
    const srcPath = path.join(from, file);
    const destPath = path.join(to, file);

    // Handle package.json merging
    if (file === 'package.json' && isMergePackageJson) {
      if (fs.existsSync(destPath)) {
        mergePackageJson(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      continue;
    }

    // Copy normally
    copy(srcPath, destPath);
  }
}