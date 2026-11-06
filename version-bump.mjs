import { readFileSync, writeFileSync } from 'fs';

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

console.log(`⬆️ Versão atualizada para ${targetVersion}`);