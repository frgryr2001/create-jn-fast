import fs from 'node:fs';
import path from 'node:path';
import { copyFolder } from './utils';

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
      const mainCssFiles = ['index.css', 'App.css'];
      for (const cssFile of mainCssFiles) {
        const filePath = path.join(distFolder, 'src', cssFile);
        if (fs.existsSync(filePath)) {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          // Only add if not already present
          if (!content.includes('@import \'tailwindcss\'')) {
            await fs.promises.writeFile(
              filePath,
              `@import 'tailwindcss';\n\n${content}`,
            );
          }
          break;
        }
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
      const libSrc = path.join(from, 'lib');
      const libDest = path.join(distFolder, 'src', 'lib');
      if (fs.existsSync(libSrc)) {
        fs.cpSync(libSrc, libDest, { recursive: true });
      }

      // Copy global.css to src/styles/global.css
      const globalCssSrc = path.join(from, 'global.css');
      const globalCssDest = path.join(distFolder, 'src', 'styles', 'global.css');
      if (fs.existsSync(globalCssSrc)) {
        fs.mkdirSync(path.dirname(globalCssDest), { recursive: true });
        fs.copyFileSync(globalCssSrc, globalCssDest);
      }

      // Copy component.json to root
      const componentJsonSrc = path.join(from, 'component.json');
      const componentJsonDest = path.join(distFolder, 'component.json');
      if (fs.existsSync(componentJsonSrc)) {
        fs.copyFileSync(componentJsonSrc, componentJsonDest);
      }

      // Overwrite tsconfig.json
      const tsconfigSrc = path.join(from, 'tsconfig.json');
      const tsconfigDest = path.join(distFolder, 'tsconfig.json');
      if (fs.existsSync(tsconfigSrc)) {
        fs.copyFileSync(tsconfigSrc, tsconfigDest);
      }

      // Merge package.json using utility function
      mergePackageJson(
        path.join(from, 'package.json'),
        path.join(distFolder, 'package.json'),
      );
    },
  }
];
