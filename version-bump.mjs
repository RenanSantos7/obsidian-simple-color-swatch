import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const packageInfo = JSON.parse(readFileSync('package.json', 'utf-8'));
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { minAppVersion } = manifest;

const [major, minor, patch] = packageInfo.version.split('.');
const targetVersion = [major, minor, Number(patch) + 1].join('.');

packageInfo.version = targetVersion;
writeFileSync('package.json', JSON.stringify(packageInfo, null, '\t'));

manifest.version = targetVersion;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'));

const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
if (!(targetVersion in versions)) {
	versions[targetVersion] = minAppVersion;
	writeFileSync('versions.json', JSON.stringify(versions, null, '\t'));
}

execSync('git add package.json manifest.json versions.json', { stdio: 'inherit' });
execSync(`git commit -m "🔖 chore: release ${targetVersion}"`, { stdio: 'inherit' });
execSync(`git tag ${targetVersion}`, { stdio: 'inherit' });

console.log(`⬆️ Versão atualizada para ${targetVersion}`);
console.log(`Tag ${targetVersion} criada. Para publicar: git push origin HEAD ${targetVersion}`);
