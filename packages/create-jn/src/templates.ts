export type Template = {
  value: string; // Folder name (e.g., 'template-react')
  label: string; // Display name (e.g., 'React')
  hint: string; // Description
};

/**
 * Main project templates
 * These are base templates that users can choose from
 */
export const templates: Template[] = [
  {
    value: 'template-react',
    label: 'React',
    hint: 'React + Rsbuild + TypeScript',
  },
  // Add more templates here as needed
  // {
  //   value: 'template-cli',
  //   label: 'CLI',
  //   hint: 'Command line utility',
  // },
];
