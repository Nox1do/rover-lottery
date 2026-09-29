const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const dir = __dirname;
const tests = fs.readdirSync(dir)
    .filter(name => /^test-.*\.js$/.test(name) && name !== 'test-all.js')
    .sort();

let failed = 0;
for (const test of tests) {
    const result = spawnSync(process.execPath, [path.join(dir, test)], {
        cwd: dir,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        failed++;
        console.error(`FAIL: ${test}`);
    }
}
if (failed) {
    console.error(`\n${failed} test(s) failed.`);
    process.exitCode = 1;
} else {
    console.log(`\nPASS: ${tests.length} test files.`);
}
