#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const raw = fs.readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(raw);

if (typeof pkg.version !== "string") {
  throw new Error("package.json version is missing or not a string");
}

const versionPattern = /^(\d+)\.(\d+)\.(-?\d+)$/;
const match = pkg.version.match(versionPattern);
if (!match) {
  throw new Error(`package.json version \"${pkg.version}\" is not a supported version format (x.y.z or x.y.-z)`);
}

const major = Number.parseInt(match[1], 10);
const minor = Number.parseInt(match[2], 10);
const patch = Number.parseInt(match[3], 10);

if ([major, minor, patch].some((part) => Number.isNaN(part))) {
  throw new Error(`package.json version \"${pkg.version}\" contains invalid numeric values`);
}

pkg.version = `${major}.${minor}.${patch + 1}`;

fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`Bumped package.json version to ${pkg.version}`);
