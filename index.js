let _ = require('lodash');
let fs = require('fs');
let path = require('path');
let readline = require('readline');

const WIDTH = 5;
const HEIGHT = 6;

const ENTRY_MSG = `
    Введите вариант действия:
    1. Обучить
    2. Классифицировать
    3. Вывести на экран классифицированные объекты в интерактивном представлении
    4. Вывести на экран классифицированные объекты в виде векторов
    5. Выйти
    Ответ: `;

const TEACH_PATH = path.join(__dirname, '../lab1/src/testTeach.txt');
const EXAM_PATH = path.join(__dirname, '../lab1/src/withoutMarks.txt');
const OUTPUT_PATH = path.join(__dirname, 'predict.txt');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let standarts = [];
let teachSet = readTeachSet();
let examSet = readExamSet();

teachSet = sortByClasses(teachSet);

showEntry();

function teach() {
  standarts = [];

  let teachSetWithPowers = calcPowers(teachSet);
  standarts = findStandarts(teachSetWithPowers);

  let isHaveMistakes = true;

  while (isHaveMistakes) {
    let mistake = findMaxByPowerMistakeObj(teachSetWithPowers);

    if (!mistake) {
      isHaveMistakes = false;
    } else {
      standarts.push(mistake);
    }
  }

  console.log(standarts);
}

function classify() {
  let output = [];

  if (!standarts.length) {
    console.log('С начала необходимо произвести обучение, а затем классификацию!')
    return;
  }

  _.forEach(examSet, (obj) => {
    let etalon = _.minBy(standarts, (standart) =>
      calcMetric(standart.val, obj)
    )

    output.push(`${obj} : ${etalon._class}`)
  })

  fs.writeFileSync(OUTPUT_PATH, output.join('\n'));
}

function showEntry() {
  rl.question(ENTRY_MSG, (answer) => {
    switch (answer) {
      case '1':
        teach();
        break;
      case '2':
        classify();
        break;
      case '3':
        showBeautyClassified();
        break;
      case '4':
        showClassified();
        break;
      case '5':
        process.exit();
        return;
      default:
        console.log('Введите вариант из предложенных выше!');
        showEntry();
    }

    showEntry();
  });
}

function readTeachSet() {
  return fs.readFileSync(TEACH_PATH)
    .toString()
    .split('\n')
    .map(str => ({
      val: str.slice(0, -1),
      _class: str.slice(str.length - 1)
    }))
}

function readExamSet() {
  return fs.readFileSync(EXAM_PATH)
    .toString()
    .split('\n')
}

function showBeautyClassified() {
  let objects = fs.readFileSync(OUTPUT_PATH).toString();

  if (!objects.length) {
    console.log('Классификация не была произведена!');
    return;
  }

  objects = objects.split('\n');

  _.forEach(objects, obj => {
    let predictedClass = obj.slice(-1);
    let vector = obj.match(/\d+/ig)[0];

    showImageRep(obj, predictedClass);
  })
}

function showClassified() {
  let objects = fs.readFileSync(OUTPUT_PATH).toString();

  if (!objects.length) {
    console.log('Классификация не была произведена!');
    return;  
  }

  console.log(objects);
}

function sortByClasses(teachSet) {
  let newSet = {};

  _.forEach(teachSet, obj => {
    let { _class } = obj;

    if (!newSet.hasOwnProperty(_class)) {
      newSet[_class] = [];
    }

    newSet[_class].push(obj);
  })

  return newSet;
}

function calcMetricIn(obj, set) {
  let objSet = set.slice(0);

  let index = _.findIndex(objSet, native => 
    obj.val === native.val
  )

  objSet.splice(index, 1);

  return _.min(_.map(objSet, (native) =>
    calcMetric(obj.val, native.val)
  ))
}

function calcMetricOut(obj, objSet) {
  objSet = _.filter(objSet, (set, _class) => 
    _class !== obj._class
  )


  return _.min(_.flattenDeep(objSet).map(anotherObj =>
    calcMetric(obj.val, anotherObj.val)
  ))
}

function calcPowers(set) {
  return _.map(set, (nativeSet, _class) => {
    let withPowers = _.map(nativeSet, obj => {
      let dIn = calcMetricIn(obj, nativeSet);
      let dOut = calcMetricOut(obj, set);

      return Object.assign({}, obj, {
        power: dIn / dOut
      })
    })

    return withPowers;
  })
}

function findStandarts(set) {
  return _.map(set, (objSubset, _class) =>
    _.maxBy(objSubset, ({ power }) => power)
  )
}

function findMaxByPowerMistakeObj(teachSet) {
  let mistakeObjects = _.flattenDeep(_.map(teachSet, (set, _class) => {
    return _.filter(set, obj => {
      let predictClass = _.minBy(standarts, (standart) =>
        calcMetric(standart.val, obj.val)
      )

      return predictClass._class !== obj._class
    })
  }))

  // console.log(mistakeObjects.map(obj => obj._class).join(' '));
  // console.log('------------------');

  return _.maxBy(mistakeObjects, 'power');
}

function calcMetric(x, y) {
  x = x.split('');
  y = y.split('');

  let i = -1;

  return _.sumBy(x, (xVal) => {
    i++;
    return Math.abs(xVal - y[i])
  })
}

function showImageRep(value, predictedClass) {
  let result = value
    .match(/\d{5}/g)
    .join('\n')
    .replace(/1/g, '*')
    .replace(/0/g, '-');
  console.log('Predicted class - ', predictedClass);
  console.log(`\n${result}\n`);
}