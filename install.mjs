import { join } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { parseArgs, parseEnv } from 'node:util';

function readEnvFile(filePath) {
	if (!existsSync(filePath)) return {};
	return parseEnv(readFileSync(filePath, 'utf-8'));
}

const { values } = parseArgs({
	options: {
		prod: {
			type: 'boolean',
			default: false,
		}
	},
	allowPositionals: false
});

const localEnv = readEnvFile('.env');
const manifest = JSON.parse(
	readFileSync('./manifest.json', 'utf-8'),
);

const vaultRoot = values.prod ? localEnv.VAULT_PROD : localEnv.VAULT_DEV;

if (!vaultRoot) throw new Error(`Cofre ${values.prod ? 'principal' : 'de teste'} não informado no .env`);

const pluginFolder = join(vaultRoot, '.obsidian', 'plugins', manifest.id);

mkdirSync(pluginFolder, { recursive: true });

const filesToCopy = ['main.js', 'manifest.json', 'styles.css'];

for (const file of filesToCopy) {
	if (existsSync(file)) {
		copyFileSync(file, join(pluginFolder, file));
		console.log(`✅ [${file}] copied to the vault.`);
	} else {
		console.error(`❌ [${file}] not found.`);
	}
}
