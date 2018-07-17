const program = require('commander');
const colors = require('colors');
const fs = require("fs");

program
    .version('1.0.0')
    .option('-d, --directory [directory]', 'Directory to find JSON language files.', 'assets/i18n/')
    .option('-l, --language [language]', 'Language file name (without .json extension) for base language to use for comparison.', 'en')
    .parse(process.argv);

console.log(`Starting completion check with directory ${program.directory}`.green);
console.log(`Base language : ${program.language}`.green);

const baseTranslation = JSON.parse(fs.readFileSync(`${program.directory}/${program.language}.json`));

const otherTranslations = fs
    .readdirSync(`${program.directory}`)
    .map(filename => {
        return {
            language: filename.replace('.json', ''),
            content: fs.readFileSync(`${program.directory}/${filename}`)
        };
    });

console.log('Languages : ', otherTranslations.map(translation => translation.language.blue).join(', '));

const categories = [];

Object.keys(baseTranslation)
    .forEach(translationKey => {
        // If the key is uppercase, consider it as a category.
        if (baseTranslation[translationKey].toString() === baseTranslation[translationKey]) {
            addToCategory('UNCATEGORIZED', translationKey);
        } else {
            parseObject(baseTranslation[translationKey], translationKey);
        }
    });

function parseObject(obj, categoryName, baseName = '') {
    Object.keys(obj)
        .forEach(key => {
            // If this key contains a string, register it.
            if (obj[key].toString() === obj[key]) {
                addToCategory(categoryName, `${baseName}${key}`);
            } else {
                // Else, recursion !
                parseObject(obj[key], categoryName, `${key}.`);
            }
        })
}

function addToCategory(categoryName, key) {
    if (categories[categoryName] === undefined) {
        categories[categoryName] = [];
    }
    if (key !== undefined) {
        categories[categoryName].push(key);
    }
}

// At this point, categories is an array with everything we need to get started with completion stats.

