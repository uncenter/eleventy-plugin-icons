import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const FIXTURES_DIR = join(__dirname, 'fixtures/');
