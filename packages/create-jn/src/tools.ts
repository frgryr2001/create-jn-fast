import fs from 'node:fs';
import path from 'node:path';
import { copyFileIfExists, copyFolder, mergePackageJson } from './utils';

export type ToolContext = {
  templateName: string;
  distFolder: string;
  templatesDir: string;
};

export type Tool = {
  value: string;
  label: string;
  hint: string;
  action?: (context: ToolContext) => Promise<void> | void;
};

// Handle after
/**
 * Available extra tools with their actions
 */
export const extraTools: Tool[] = [
  {
    value: 'tailwindcss',
    label: 'Tailwind CSS',
    hint: 'Utility-first CSS framework',
    action: async ({ distFolder, templatesDir }) => {
      const from = path.join(templatesDir, 'template-tailwindcss');
      copyFolder({
        from,
        to: distFolder,
        isMergePackageJson: true,
      });

      // Insert tailwindcss import to main CSS file
      //   const mainCssFiles = ['index.css', 'App.css'];
      //   for (const cssFile of mainCssFiles) {
      //     const filePath = path.join(distFolder, 'src', cssFile);
      //     if (fs.existsSync(filePath)) {
      //       const content = await fs.promises.readFile(filePath, 'utf-8');
      //       // Only add if not already present
      //       if (!content.includes('@import \'tailwindcss\'')) {
      //         await fs.promises.writeFile(
      //           filePath,
      //           `@import 'tailwindcss';\n\n${content}`,
      //         );
      //       }
      //       break;
      //     }
      const filePath = path.join(distFolder, 'src', 'styles', 'global.css');
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        // Only add if not already present
        if (!content.includes("@import 'tailwindcss'")) {
          await fs.promises.writeFile(
            filePath,
            `@import 'tailwindcss';\n\n${content}`,
          );
        }
      } else {
        // Create the file with Tailwind import if it doesn't exist
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });
        await fs.promises.writeFile(filePath, "@import 'tailwindcss';\n");
      }
    },
  },
  {
    value: 'shadcn',
    label: 'Shadcn UI',
    hint: 'Component library built with Radix UI and Tailwind CSS',
    action: async ({ distFolder, templatesDir }) => {
      const from = path.join(templatesDir, 'template-shadcn');

      // Copy lib folder to src/lib
      const libSrc = path.join(from, 'src', 'lib');
      const libDest = path.join(distFolder, 'src', 'lib');
      if (fs.existsSync(libSrc)) {
        fs.cpSync(libSrc, libDest, { recursive: true });
      }

      // Copy files to destination
      copyFileIfExists(
        path.join(from, 'src', 'styles', 'global.css'),
        path.join(distFolder, 'src', 'styles', 'global.css'),
        { createDir: true },
      );

      copyFileIfExists(
        path.join(from, 'postcss.config.mjs'),
        path.join(distFolder, 'postcss.config.mjs'),
      );

      copyFileIfExists(
        path.join(from, 'component.json'),
        path.join(distFolder, 'component.json'),
      );

      copyFileIfExists(
        path.join(from, 'tsconfig.json'),
        path.join(distFolder, 'tsconfig.json'),
      );

      // Merge package.json using utility function
      mergePackageJson(
        path.join(from, 'package.json'),
        path.join(distFolder, 'package.json'),
      );
    },
  },
];
