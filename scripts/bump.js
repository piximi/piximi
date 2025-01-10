const fs = require("fs");
const semver = require("semver");

const packageJsonPath = "./package.json";
const bumpType = process.argv[2]; // 'patch', 'minor', 'major'

if (!["patch", "minor", "major"].includes(bumpType)) {
  console.error('Invalid bump type. Use "patch", "minor", or "major".');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const currentVersion = packageJson.version;

if (!semver.valid(currentVersion)) {
  console.error("Invalid version in package.json:", currentVersion);
  process.exit(1);
}

const newVersion = semver.inc(currentVersion, bumpType);

console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

packageJson.version = newVersion;

fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2) + "\n",
  "utf-8"
);

console.log("Updated package.json with new version:", newVersion);
