const fs = require("fs");
const semver = require("semver");

const packageJsonPath = "./package.json";
let bumpType = process.argv[2]; // 'bump:patch', 'bump:minor', 'bump:major'

if (
  !["bump:none", "bump:patch", "bump:minor", "bump:major"].includes(bumpType)
) {
  console.error(
    'Invalid bump type. Use "bump:none", "bump:patch", "bump:minor", "bump:major".',
  );
  process.exit(1);
}

// remove the "bump:" portion
bumpType = bumpType.slice(bumpType.search(":") + 1);

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const currentVersion = packageJson.version;

if (!semver.valid(currentVersion)) {
  console.error("Invalid version in package.json:", currentVersion);
  process.exit(1);
}
if (bumpType === "none") {
  console.log("Skipping version bump");
} else {
  const newVersion = semver.inc(currentVersion, bumpType);

  console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

  packageJson.version = newVersion;

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8",
  );

  console.log("Updated package.json with new version:", newVersion);
}

process.exit(0);
