let _ = require('lodash');

let {rl, counts, showEntry, getCount, setCount} = require('../index');

let countMsg = `
    Введите вариант действия:
    1. Вывести установленые количества экземпляров
    2. Установить количества экземпляров
    3. Назад
    Ответ: `;

function showCountActions() {
    rl.question(countMsg, (value) => {
        switch (value) {
            case '1':
                _.forEach(counts, (value, key) => {
                    console.log(`${key} n = ${getCount(key)}`);
                })
                showCountActions();
                break;
            case '2':
                let numbers = Object.keys(counts).join(' ');
                rl.question(`Введите количества экземпляров для: ${numbers}:(через пробел): \n`, setTemplateCounts)
                showCountActions();
                break;
            case '3':
                showEntry();
                break;
            default:
                console.log('Введите вариант из предложенных выше!');
                showCountActions();
        }
    })
}

function setTemplateCounts(answer) {
    let values = answer.trim().split(' ');
    if (values.length < counts.length) {
        console.log('Введите корректные значения!');
        showCountActions();
    }

    Object.keys(counts).forEach((key, i) => {
        setCount(key, values[i]);
    })
    showCountActions();
}

module.exports = showCountActions;
