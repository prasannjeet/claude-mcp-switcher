const fs = require("fs");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName !== "darwin") return;
  const frameworksPath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    "Contents/Frameworks"
  );
  for (const name of [
    "Squirrel.framework",
    "ReactiveObjC.framework",
    "Mantle.framework",
  ]) {
    const p = path.join(frameworksPath, name);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`afterPack: removed ${name}`);
    }
  }
};
