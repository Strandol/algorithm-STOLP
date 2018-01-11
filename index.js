let _ = require('lodash');
let fs = require('fs');
let path = require('path');
let readline = require('readline');

const WIDTH = 5;
const HEIGHT = 6;

const K = 10;

const FIRST_PART = 0.7;
const SECOND_PART = 0.3;

const ENTRY_MSG = `
    Введите вариант действия:
    1. Обучить
    2. Классифицировать
    3. Вывести на экран классифицированные объекты в интерактивном представлении
    4. Вывести на экран классифицированные объекты в виде векторов
    5. Оценить качество классификации
    6. Выйти
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

function teach(teachSet) {
  standarts = [];

  let pairs = [];

  _.forEach(teachSet, (primarySet, _primaryClass) => {
    _.forEach(teachSet, (secondarySet, _secondClass) => {
      let pair = _.find(pairs, (val) => {
        return ((val.from === _secondClass) && (val.with === _primaryClass))
          || ((val.from === _primaryClass) && (val.with === _secondClass))
      })

      if (pair || (_secondClass === _primaryClass)) return true;

      let minMetrics = [];
      _.forEach(primarySet, (primObj) => {
        let toArray = _.map(secondarySet, (val) => {
          return {
            ...val
          }
        })

        let minMetric = _.minBy(toArray,  (secObj) =>
          calcMetric(secObj.val, primObj.val)
        )

        minMetrics.push({
          ...minMetric,
          metric: calcMetric(minMetric.val, primObj.val)
        });
      })

      let min = _.minBy(minMetrics, 'metric');

      pairs.push({
        from: _primaryClass,
        with: min._class,
        metric: min.metric
      })
    })
  })

  pairs = _.sortBy(pairs, (obj) => obj.metric);

  _.forEach(pairs, (obj) => {
    let firstSet = teachSet[obj.from];
    let secondSet = teachSet[obj.with];

    let firstClassWithPowers = calcPowers(firstSet, secondSet);
    let secondClassWithPowers = calcPowers(secondSet, firstSet);
    standarts.push(findStandarts(firstClassWithPowers));
    standarts.push(findStandarts(secondClassWithPowers));

    standarts = _.uniqWith(standarts, _.isEqual);

    let isHaveMistakes = true;

    let teachWithPowers = calcPowersForTeach(teachSet);

    while (isHaveMistakes) {
      let mistake = findMaxByPowerMistakeObj(teachWithPowers);

      if (!mistake) {
        isHaveMistakes = false;
      } else {
        standarts.push(mistake);
      }
    }
  })

  function calcPowersForTeach(set) {
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
}

function classify(examSet) {
  let output = [];

  if (!standarts.length) {
    console.log('С начала необходимо произвести обучение, а затем классификацию!')
    return;
  }

  // _.forEach(examSet, (obj) => {     // ---- Блишайших соседей
  //   let etalon = _.minBy(standarts, (standart) =>
  //     calcMetric(standart.val, obj)
  //   )

  //   output.push(`${obj} : ${etalon._class}`)
  // })

  // -------------------------------------------------------------

  _.forEach(examSet, (obj) => { // ---- К - Ближайших соседей
    let neighbors = _.map(standarts, standart => {
      let weight = Math.pow(calcMetric(standart.val, obj), -2);
      return {
        ...standart,
        metric: calcMetric(standart.val, obj),
        weight
      }
    })

    neighbors = _.sortBy(neighbors, obj => obj.metric).slice(0, K);

    neighbors = sortByClasses(neighbors);

    neighbors = _.map(neighbors, (val, key) => {
      let weight = _.sumBy(val, obj => obj.weight);

      return {
        _class: key,
        weight
      }
    });

    let _class = _.maxBy(neighbors, (obj) => {
      return obj.weight
    })._class

    output.push(`${obj} : ${_class}`)
  })

  fs.writeFileSync(OUTPUT_PATH, output.join('\n'));
}

function showEntry() {
  rl.question(ENTRY_MSG, (answer) => {
    switch (answer) {
      case '1':
        teach(teachSet);
        break;
      case '2':
        classify(examSet);
        break;
      case '3':
        showBeautyClassified();
        break;
      case '4':
        showClassified();
        break;
      case '5':
        rl.question('Введите количество испытаний: ', count => {
          getQuality(count);
          showEntry();
        })
        break;
      case '6':
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

  if (objSet.length !== 1) {
    objSet.splice(index, 1);
  }

  let metrics = _.map(objSet, (native) =>
    calcMetric(obj.val, native.val)
  )

  return _.min(metrics);
}

function calcMetricOut(obj, objSet) {
  return _.min(objSet.map(anotherObj =>
    calcMetric(obj.val, anotherObj.val)
  ))
}

function calcPowers(firstClass, secondClass) {
  return _.map(firstClass, (obj) => {
    let withPower = null;
    let dIn = calcMetricIn(obj, firstClass);
    let dOut = calcMetricOut(obj, secondClass);

    return Object.assign({}, obj, {
      power: dIn / dOut
    })
  })
}

function findStandarts(set) {
  return _.maxBy(set, ({ power }) => power)
}

function findMaxByPowerMistakeObj(teachSet) {
  let mistakeObjects = _.map(teachSet, (set, key) => {
    return _.filter(set, obj => {
      let predictClass = _.minBy(standarts, (standart) =>
        calcMetric(standart.val, obj.val)
      )

      return predictClass._class !== obj._class
    })
  })

  return _.maxBy(_.flattenDeep(_.map(mistakeObjects, (set, _class) => set)), 'power');
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

function getQuality(n) {
  let percents = [];
  let loadedTeach = readTeachSet();

  while (n) {
    let teachSet = _.shuffle(loadedTeach);

    let endOfFirstPart = Math.round(teachSet.length * FIRST_PART);

    let firstPart = teachSet.slice(0, endOfFirstPart);
    let secondPart = teachSet.slice(endOfFirstPart).map(obj => obj.val);

    firstPart = sortByClasses(firstPart);

    teach(firstPart);
    classify(secondPart);

    //Проценты успешно классифицированных
    let classified = fs.readFileSync(OUTPUT_PATH).toString().split('\n');
    secondPart = teachSet.slice(endOfFirstPart);

    let mistakeObjects = _.filter(classified, (classifiedObj, i) => {
      let predictClass = classifiedObj.slice(-1);

      return secondPart[i]._class !== predictClass
    })

    let successPercent = ((classified.length - mistakeObjects.length) / classified.length) * 100;
    percents.push(_.round(successPercent, 2));
    n--;
  }

  standarts = [];

  console.log(percents.join('|'));
  console.log('Среднее значение ---', getAverage(percents));
  console.log('Медиана ---', getMedian(percents));
  console.log('Размах ---', getRange(percents));
  console.log('Среднее квадратичное отклонение ---', getDeviation(percents));
  console.log('-----------------');
}

function getAverage(percents) {
  return _.round(_.mean(percents), 2);
}

function getMedian(percents) {
  percents = _.sortBy(percents, val => val);

  let averageLength = Math.round(percents.length / 2);
  let median = (percents[averageLength - 1] + percents[averageLength]) / 2;

  return _.round(median, 2);
}

function getRange(percents) {
  let maxVal = _.max(percents);
  let minVal = _.min(percents);

  return _.round(maxVal - minVal, 2);
}

function getDeviation(percents) {
  let average = _.mean(percents);
  let values = _.map(percents, val => (val - average) * (val - average));
  let deviation = Math.sqrt(_.mean(values));

  return _.round(deviation, 2);
}