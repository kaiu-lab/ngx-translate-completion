#!/usr/bin/env node
const Report = require('./report').Report;
const tools = require('./tools');
const colors = require('colors');
const program = require('commander');
const fs = require('fs');
const Table = require('cli-table');

program
    .version('1.0.0')
    .option('-d, --directory [directory]', 'Directory to find JSON language files.', 'assets/i18n/')
    .option('-l, --language [language]', 'Language file name (without .json extension) for base language to use for comparison.', 'en')
    .option('-o --output [output]', 'Specifies output file', './TRANSLATION_COMPLETION.md')
    .parse(process.argv);

console.log(`Starting completion check with directory ${program.directory}`.green);
console.log(`Base language : ${program.language}`.green);

const baseTranslation = JSON.parse(fs.readFileSync(`${program.directory}/${program.language}.json`, 'utf8'));

const allTranslations = fs
    .readdirSync(`${program.directory}`)
    .map(filename => {
        return {
            language: filename.replace('.json', ''),
            content: JSON.parse(fs.readFileSync(`${program.directory}/${filename}`, 'utf8'))
        };
    });

console.log('Languages : ', allTranslations.map(translation => translation.language.blue).join(', '));

const categories = [];

Object.keys(baseTranslation)
    .forEach(translationKey => {
        // If the key is uppercase, consider it as a category.
        if (baseTranslation[translationKey].toString() === baseTranslation[translationKey]) {
            tools.addToCategory(categories, 'UNCATEGORIZED', translationKey);
        } else {
            tools.parseObject(categories, baseTranslation[translationKey], translationKey);
        }
    });

// At this point, categories is an array with everything we need to get started with completion stats.

// Initialize report object.
const report = new Report();

let otherTranslations = allTranslations
    .filter(translation => translation.language !== program.language);

const defaultTranslationContent = allTranslations.find(translation => translation.language === program.language).content;

let markdown = '# Translation completion report\n\n';

Object.keys(categories)
    .forEach(categoryName => {
        categories[categoryName].forEach(categoryKey => {
            otherTranslations
                .forEach(translation => {
                    const translationKey = categoryName === 'UNCATEGORIZED' ? categoryKey : `${categoryName}.${categoryKey}`;
                    const hasKey = tools.hasTranslation(translation.content, translationKey);
                    report.addKey(translation.language, categoryName, categoryKey, hasKey);
                });
        })
    });


console.log('Completion stats : '.green);
console.log('Global'.blue, ':', `${Math.round(report.getGlobalCompletion())}%`);
markdown += `**Global completion** : ${Math.round(report.getGlobalCompletion())}%\n\n`;
let mdTableHeader = '';
let mdSeparationRow = '';
let mdCompletionRow = '';
otherTranslations.forEach(translation => {
    const completion = Math.round(report.getLanguageCompletion(translation.language));
    console.log(translation.language.blue, ':', `${completion}%`);
    mdTableHeader += `${translation.language} | `;
    mdSeparationRow += ' :---: |';
    mdCompletionRow += `${completion}% | `;
});

markdown += `${mdTableHeader}\n`;
markdown += `${mdSeparationRow}\n`;
markdown += `${mdCompletionRow}\n`;

const table = new Table({head: [''].concat(otherTranslations.map(t => t.language))});
console.log('\n\nCategories details : '.bold.green);
markdown += '\n## Categories details : ';

let mdCategoriesTableHeader = ['**Category**'].concat(otherTranslations.map(t => t.language)).join(' | ');
let mdCategoriesSeparationRow = [' :--- '].concat(otherTranslations.map(() => ' :---: ')).join('|');
let mdCategoriesCompletionRow = '';


// Prepare array for completion display per category.
Object.keys(categories).forEach(category => {
    const tableRow = {};
    tableRow[category] = [];
    mdCategoriesCompletionRow += `${category} | `;
    otherTranslations.forEach(translation => {
        const completion = Math.round(report.getLanguageCategoryCompletion(translation.language, category));
        tableRow[category].push(`${completion}%`);
        mdCategoriesCompletionRow += `${completion}% | `;
    });
    table.push(tableRow);
    mdCategoriesCompletionRow += '\n';
});

markdown += '\n\n';
markdown += `${mdCategoriesTableHeader}\n`;
markdown += `${mdCategoriesSeparationRow}\n`;
markdown += `${mdCategoriesCompletionRow}\n`;


// Prepare the list of missing keys (markdown only)
markdown += '## Detailed report\n';
otherTranslations.forEach(translation => {
    markdown += `### ${translation.language} : \n\n`;
    const missingTranslations = report.getMissingKeys(translation.language, defaultTranslationContent);
    missingTranslations.forEach(missingTranslation => {
        markdown += ` * \`${missingTranslation.key}\` : \`${missingTranslation.value}\`\n`;
    });
    markdown += '\n\n';
});


console.log(table.toString());

fs.writeFileSync(program.output, markdown);
