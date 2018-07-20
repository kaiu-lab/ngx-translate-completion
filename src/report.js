const tools = require("./tools");

function Report() {
    this.global = [];
    this.languages = {};

    this.addKey = function (language, category, key, done) {
        this.global.push(done);
        this.languages[language] = this.languages[language] || {};
        this.languages[language][category] = this.languages[language][category] || {};
        this.languages[language][category][key] = done;
    };

    this.getLanguageCompletion = function (language) {
        const categoryKeys = Object.keys(this.languages[language]);
        let keysDone = 0;
        let totalKeys = 0;

        categoryKeys.forEach(categoryKey => {
            const languageKeys = Object.keys(this.languages[language][categoryKey]);
            totalKeys += languageKeys.length;
            keysDone += languageKeys
                .map(key => this.languages[language][categoryKey][key])
                .reduce((amountDone, currentKeyDone) => {
                    return currentKeyDone ? ++amountDone : amountDone;
                }, 0);
        });
        return 100 * keysDone / totalKeys;
    };

    this.getGlobalCompletion = function () {
        return 100 * this.global.reduce((amountDone, currentKeyDone) => {
            return currentKeyDone ? ++amountDone : amountDone;
        }, 0) / this.global.length;
    };

    this.getLanguageCategoryCompletion = function (language, category) {
        const languageKeys = Object.keys(this.languages[language][category]);
        return 100 * languageKeys
            .map(key => this.languages[language][category][key])
            .reduce((amountDone, currentKeyDone) => {
                return currentKeyDone ? ++amountDone : amountDone;
            }, 0) / languageKeys.length;
    };

    this.getMissingKeys = function (language, defaultLanguageObject) {
        const missing = [];
        const categoryKeys = Object.keys(this.languages[language]);
        categoryKeys.forEach(categoryKey => {
            const languageKeys = Object.keys(this.languages[language][categoryKey]);
            languageKeys
                .filter(key => !this.languages[language][categoryKey][key])
                .forEach(key => {
                    const translationKey = categoryKey === 'UNCATEGORIZED' ? key : `${categoryKey}.${key}`;
                    missing.push({
                        key: translationKey,
                        value: tools.getTranslation(defaultLanguageObject, translationKey)
                    });
                })
        });
        return missing;
    }
}

module.exports.Report = Report;
