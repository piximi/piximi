// analyze-component-usage.js
const path = require("path");

const { Project } = require("ts-morph");

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const componentsRoot = path.resolve("src/components");
const views = ["ProjectViewer", "ImageViewer", "MeasurementViewer"];
const others = ["hooks", "components"];

const usage = new Map(); // component file -> Set<view>

const isInComponents = (fp) => fp.startsWith(componentsRoot + path.sep);

for (const other of others) {
  const sourceFiles = project.getSourceFiles(`src/${other}/**/*.{ts,tsx}`);

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
            (usage.get(fp) ?? usage.set(fp, new Set()).get(fp)).add(other);
          }
        }
      } else {
        const fp = importedFile.getFilePath();
        (usage.get(fp) ?? usage.set(fp, new Set()).get(fp)).add(other);
      }
    }
  }
}

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

const sharedViews = [],
  sharedViewsComp = [],
  sharedViewComp = [],
  singleView = [],
  singleComp = [],
  unused = [];

for (const sf of allComponents) {
  const fp = sf.getFilePath();
  const usedBy = usage.get(fp);
  if (!usedBy?.size) unused.push(fp);
  else if (usedBy.size === 1) {
    const src = [...usedBy][0];

    if (views.includes(src))
      singleView.push({ file: fp, view: [...usedBy][0] });
    else singleComp.push({ file: fp, view: [...usedBy][0] });
  } else if (usedBy.size === 2) {
    const srcs = [...usedBy];

    if (srcs.includes("components"))
      sharedViewComp.push({ file: fp, view: [...usedBy] });
    else sharedViews.push({ file: fp, view: [...usedBy] });
  } else {
    const srcs = [...usedBy];
    if (srcs.includes("components"))
      sharedViewsComp.push({ file: fp, view: [...usedBy] });
    else sharedViews.push({ file: fp, view: [...usedBy] });
  }
}

// --- LOGGING ---

// SHARED VIEWS ONLY
console.log(`\n=== SHARED BETWEEN VIEWS ONLY (${sharedViews.length}) ===`);
sharedViews.forEach((c) => {
  console.log(`${c.file} `);
  c.view.forEach((v) => console.log(` -- ${v}`));
});

// SHARED VIEWS AND COMPONENTS
console.log(
  `\n=== SHARED BETWEEN VIEWS AND COMPONENTS (${sharedViewsComp.length}) ===`,
);
sharedViewsComp.forEach((c) => {
  console.log(`${c.file} `);
  c.view.forEach((v) => console.log(` -- ${v}`));
});

// SINGLE VIEW AND COMPONENTS
console.log(`\n=== SINGLE VIEW AND COMPONENTS (${sharedViewComp.length}) ===`);
sharedViewComp.forEach((c) => {
  console.log(`${c.file} `);
  c.view.forEach((v) => console.log(` -- ${v}`));
});

// SINGLE-VIEW
console.log(`\n=== SINGLE-VIEW ONLY (${singleView.length}) ===`);
views.forEach((v) => {
  const inView = singleView.filter((c) => c.view === v);
  if (inView.length > 0) {
    console.log("-- ", v);
    inView.forEach((c) => console.log(`${c.file}  -> only ${c.view}`));
  }
});

// ONLY COMPONENTS
console.log(`\n=== COMPONENTS ONLY (${singleComp.length}) ===`);
singleComp.forEach((c) => console.log(`${c.file}  -> only ${c.view}`));

// // UNUSED
// console.log(`\n=== UNUSED BY ANY VIEW (${unused.length}) ===`);
// unused.forEach((c) => console.log(c));

// END
console.log(`\n=== END === \n`);
