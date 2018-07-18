function parseObject(categories, obj, categoryName, baseName = '') {
    Object.keys(obj)
        .forEach(key => {
            // If this key contains a string, register it.
            if (obj[key].toString() === obj[key]) {
                addToCategory(categories, categoryName, `${baseName}${key}`);
            } else {
                // Else, recursion !
                parseObject(categories, obj[key], categoryName, `${key}.`);
            }
        })
}

function addToCategory(categories, categoryName, key) {
    if (categories[categoryName] === undefined) {
        categories[categoryName] = [];
    }
    if (key !== undefined) {
        categories[categoryName].push(key);
    }
}

function hasTranslation(content, key) {
    // If the content is undefined, return false as we tried to check inside nan undefined object,
    // so the whole category doesn't exist
    if (content === undefined) {
        return false;
    }
    // If the flatten key exists, return true directly.
    if (content[key] !== undefined) {
        return true;
    }
    const firstDot = key.indexOf('.');
    const keyFragmentName = key.substr(0, firstDot);
    const keyPropertyName = key.substr(firstDot + 1);
    // If there's no more property name, then it means that the key doesn't exist at all.
    if (keyPropertyName === '') {
        return false;
    }
    return hasTranslation(content[keyFragmentName], keyPropertyName);
}

module.exports.parseObject = parseObject;
module.exports.addToCategory = addToCategory;
module.exports.hasTranslation = hasTranslation;
