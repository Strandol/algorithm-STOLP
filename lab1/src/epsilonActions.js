let _ = require('lodash')
let {rl, counts, showEntry, epsilon, setEpsilon, getEpsilon} = require('../index');

let epsMsgs = `
    Введите вариант действия:
    1. Вывести значение
    2. Установить значение
    3. Назад
    Ответ: `

function showEpsilonActions() {
    rl.question(epsMsgs, (answer) => {
        switch (answer) {
            case '1':
                console.log(`\n\t\u03B5 = ${getEpsilon()}`);
                showEpsilonActions();
                break;
            case '2':
                rl.question(`\nНовое значение: `, setNewValue);
                break;
            case '3':
                showEntry();
                break;
            default:
                console.log('Введите вариант из предложенных выше!');
                showEpsilonActions();
        }
    })
}

function setNewValue(value) {
    if (!_.inRange(value, 0, 1)) {
        console.log('Введите значение в границах (0,1)');
        showEpsilonActions();
        return;
    }

    setEpsilon(value);
    showEpsilonActions();
}

module.exports = showEpsilonActions;
