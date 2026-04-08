import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findImports(importPath) {
    if (importPath.startsWith('@openzeppelin/')) {
        const fullPath = path.resolve(__dirname, '../../node_modules', importPath);
        return { contents: fs.readFileSync(fullPath, 'utf8') };
    }
    return { error: 'File not found' };
}

const contractPath = path.resolve(__dirname, '../contracts/ProductRegistry.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'ProductRegistry.sol': {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
};

console.log('Compiling contract...');
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
    output.errors.forEach((err) => {
        console.error(err.formattedMessage);
    });
    if (output.errors.some((err) => err.severity === 'error')) {
        process.exit(1);
    }
}

const contract = output.contracts['ProductRegistry.sol']['ProductRegistry'];

const artifactsDir = path.resolve(__dirname, '../artifacts_lite');
if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir);
}

fs.writeFileSync(
    path.resolve(artifactsDir, 'ProductRegistry.json'),
    JSON.stringify({
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
    }, null, 2)
);

console.log('Compilation successful. Metadata saved to artifacts_lite/ProductRegistry.json');
