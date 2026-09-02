// analyze-component-usage.js
const path = require("path");

const { Project } = require("ts-morph");

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const componentsRoot = path.resolve("src/components");
const views = ["ProjectViewer", "ImageViewer", "MeasurementViewer"];
const usage = new Map(); // component file -> Set<view>

const isInComponents = (fp) => fp.startsWith(componentsRoot + path.sep);

for (const view of views) {
  const sourceFiles = project.getSourceFiles(`src/views/${view}/**/*.{ts,tsx}`);
  for (const sf of sourceFiles) {
    for (const imp of sf.getImportDeclarations()) {
      const importedFile = imp.getModuleSpecifierSourceFile();
      if (!importedFile || !isInComponents(importedFile.getFilePath()))
        continue;

      const namedImports = imp.getNamedImports().map((ni) => ni.getName());
      const isBarrel = path
        .basename(importedFile.getFilePath())
        .startsWith("index.");

      if (isBarrel) {
        const exportMap = importedFile.getExportedDeclarations();
        const names = namedImports.length
          ? namedImports
          : [...exportMap.keys()];
        for (const name of names) {
          for (const decl of exportMap.get(name) ?? []) {
            const fp = decl.getSourceFile().getFilePath();
            (usage.get(fp) ?? usage.set(fp, new Set()).get(fp)).add(view);
          }
        }
      } else {
        const fp = importedFile.getFilePath();
        (usage.get(fp) ?? usage.set(fp, new Set()).get(fp)).add(view);
      }
    }
  }
}

const allComponents = project
  .getSourceFiles(`${componentsRoot}/**/*.{ts,tsx}`)
  .filter((sf) => !path.basename(sf.getFilePath()).startsWith("index."));

const shared = [],
  single = [],
  unused = [];
for (const sf of allComponents) {
  const fp = sf.getFilePath();
  const usedBy = usage.get(fp);
  if (!usedBy?.size) unused.push(fp);
  else if (usedBy.size === 1) single.push({ file: fp, view: [...usedBy][0] });
  else shared.push({ file: fp, views: [...usedBy] });
}

console.log(`\n=== TRULY SHARED (${shared.length}) ===`);
shared.forEach((c) => console.log(`${c.file}  [${c.views.join(", ")}]`));
console.log(`\n=== SINGLE-VIEW ONLY (${single.length}) ===`);
views.forEach((v) => {
  console.log("-- ", v);
  single.forEach(
    (c) => c.view === v && console.log(`${c.file}  -> only ${c.view}`),
  );
});
console.log(`\n=== UNUSED BY ANY VIEW (${unused.length}) ===`);
unused.forEach((c) => console.log(c));
