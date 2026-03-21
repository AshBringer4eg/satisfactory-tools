#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw);

if (typeof pkg.version !== "string") {
  throw new Error("package.json version is missing or not a string");
}

const parts = pkg.version.split(".").map((part) => Number.parseInt(part, 10));
if (parts.length !== 3 || parts.some((part) => Number.isNaN(part) || part < 0)) {
  throw new Error(`package.json version \"${pkg.version}\" is not a simple semver (x.y.z)`);
}

const [major, minor, patch] = parts;
pkg.version = `${major}.${minor}.${patch + 1}`;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`Bumped package.json version to ${pkg.version}`);
