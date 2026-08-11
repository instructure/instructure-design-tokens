import { readFileSync } from 'fs'
import { execFileSync } from 'child_process'

const baseSha = process.env.BASE_SHA
const files = process.argv.slice(2)

// Content on the base branch; missing means the PR added the file.
const readBase = (file) => {
  try {
    return execFileSync('git', ['show', `${baseSha}:${file}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
  } catch {
    return null
  }
}

// Content on this PR; missing means the PR deleted the file.
const readHead = (file) => {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

const getMissingTokens = (base, head) => {
  const missingTokens = [];

  const isLeaf = (obj) =>
    !!obj && typeof obj === "object" && "value" in obj && "type" in obj;
  const crawlObject = (base, head, path) => {
    const keys = Object.keys(base);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!isLeaf(base) && !!head[key]) {
        crawlObject(base[key], head[key], `${path ? path + "." : ""}${key}`);
      }
      if (!isLeaf(base) && !head[key]) {
        missingTokens.push(`${path ? path + "." : ""}${key}`);
      }
    }
  };

  crawlObject(base, head, "");
  return missingTokens;
};

for (const file of files) {
  const base = readBase(file);
  const head = readHead(file);
  const status =
    base === null ? "added" : head === null ? "deleted" : "modified";

  if (status === "deleted") {
    console.log(`File was deleted: ${file}`);
    process.exitCode = 1;
  }

  if (status === "modified") {
    const missingTokens = getMissingTokens(JSON.parse(base), JSON.parse(head));
    if (missingTokens.length > 0) {
      console.log(`missing token(s) from ${file}:`);
      missingTokens.forEach((token) => console.log(token));
      process.exitCode = 1;
    }
  }
}