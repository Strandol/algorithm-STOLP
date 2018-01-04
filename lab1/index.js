let _ = require('lodash');
let fs = require('fs');
let readline = require('readline');
let templates = require('./src/templates');

const WIDTH = 5;
const HEIGHT = 6;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const NUMBERS = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9
}

let counts = {}, numbers = {}, instances = {};

_.forEach(templates, (value, key) => {
    counts[key] = 0;
    numbers[key] = NUMBERS[key];
    instances[key] = [];
})

let epsilon = 0;

module.exports = {rl, counts, showEntry, setEpsilon, getEpsilon, getCount, setCount};
let showEpsilonActions = require('./src/epsilonActions');
let showCountActions = require('./src/countActions');

let entryMsg = `
    Введите вариант действия:
    1. Вывести на экран зашумленные экземпляры
    2. Вывести на экран зашумленные экземпляры в интерактивном представлении
    3. Вывести на экран шаблоны в интерактивном представлении
    4. Вывести на экран шаблоны в виде векторов
    5. Создать зашумленные экземпляры
    6. Значение - \u03B5
    7. Количества экземпляров для записи - n
    8. Выйти
    Ответ: `;

showEntry();

function showEntry() {
    rl.question(entryMsg, (answer) => {
        switch (answer) {
            case '1':
                try {
                    let noiseObjects = fs.readFileSync('./src/testTeach.txt');
                    console.log(noiseObjects.toString());
                } catch (e) {
                    console.log('Вы не создали файл с шумными объектами!');
                }
                showEntry();
                break;
            case '2':
                try {
                    let noiseObjects = fs.readFileSync('./src/testTeach.txt').toString().split('\n');
                    noiseObjects = noiseObjects.map(obj => obj.replace(/\d$/,''))
                    rl.question('Количество экземпляров: ', (count) => {
                        _.forEach(noiseObjects.slice(0, Number(count)), showImageRep);
                        showEntry();
                    })
                } catch (e) {
                    console.log('Вы не создали файл с шумными объектами!');
                    showEntry();
                }
                break;
            case '3':
                _.forEach(templates, showImageRep);
                showEntry();
                break;
            case '4':
                _.forEach(templates, (value, key) => {
                    console.log(`${value} <----- ${key}\n`);
                })
                showEntry();
                break;
            case '5':
                let totalCount = _.reduce(counts, (result, value, key) => {
                    return result + Number(value);
                }, 0)

                if (!totalCount) {
                    console.log('Введите количества экземпляров!')
                    showEntry();
                    return;
                }

                _.forEach(counts, (value, key) => {
                    for (let i = 0; i < value; i++) {
                        let template = templates[key].split('');
                        template = template.map((symb) => {
                            let r = _.random(0, 1, true);
                            if (r < Number(epsilon)) {
                                return (symb === '0')
                                    ? '1'
                                    : '0'
                            }

                            return symb;
                        })
                        template.push(numbers[key]);
                        instances[key].push(template.join(''));
                    }
                })

                let content = _.reduce(instances, (result, value, key) => {
                    return result.concat(value);
                }, [])

                fs.writeFileSync('./src/testTeach.txt', _.shuffle(content).join('\n'), {flag: 'w'});
                fs.writeFileSync('./src/withoutMarks.txt', _.shuffle(content).map(elem => {
                    return elem.slice(0, elem.length - 1);
                }).join('\n'), { flag: 'w' });

                _.forEach(templates, (value, key) => {
                    instances[key] = [];
                })

                console.log('Зашумленные экземпляры успешно сгенерированы!');
                showEntry();
                break;
            case '6':
                showEpsilonActions();
                break;
            case '7':
                showCountActions();
                break;
            case '8':
                process.exit();
                return;
            default:
                console.log('Введите вариант из предложенных выше!');
                showEntry();
        }
    })
}

function setEpsilon(value) {
    epsilon = value;
}

function getEpsilon() {
    return epsilon;
}

function setCount(key, value) {
    counts[key] = value;
}

function getCount(key) {
    return counts[key];
}

function showImageRep(value) {
    let result = value
        .match(/\d{5}/g)
        .join('\n')
        .replace(/1/g, '*')
        .replace(/0/g, '-');
    console.log(`\n${result}\n`);
}
