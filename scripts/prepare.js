import https from "https";
import fs from "fs";

const projectPath = "src/data/exampleProjects";

const projectNames = [
  "BBBC013ExampleProject",
  "mnistExampleProject",
  "cElegansExampleProject",
  "HumanU2OSCellsExampleProject",
  "PLP1ExampleProject",
  "U2OSCellPaintingExampleProject",
];

// CloudFront distribution domain
const domain = "https://dw9hr7pc3ofrm.cloudfront.net";
// S3 bucket path
const rootPath = "exampleProjects";
const ext = "zip";

const download = function (url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, function (response) {
    response.pipe(file);
    file.on("finish", function () {
      file.close(cb);
    });
  });
};

const writeIfMissing = async function () {
  for (const name of projectNames) {
    const local = `${projectPath}/${name}.${ext}`;
    const remote = `${domain}/${rootPath}/${name}.${ext}`;
    if (!fs.existsSync(local)) {
      download(remote, local, () => console.log(`wrote ${local}`));
    } else {
      console.log(`${local} exists`);
    }
  }
};

writeIfMissing();
