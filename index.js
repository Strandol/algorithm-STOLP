let _ = require('lodash');
let fs = require('fs');

let standarts = [];
let teachSet = null;
let examSet = null;

teachSet = readTeachSet();
teachSet = sortByClasses(teachSet);
teachSet = calcPowers(teachSet);
standarts = findStandarts(teachSet);

let isHaveMistakes = true;

while (isHaveMistakes) {
  let mistake = findMaxByPowerMistakeObj(teachSet);

  if (!mistake) {
    isHaveMistakes = false;
  } else {
    standarts.push(mistake);
  }
}

examSet = readExamSet();

_.forEach(examSet, (obj) => {
  let etalon = _.minBy(standarts, (standart) => 
    calcMetric(standart.val, obj)
  )

  console.log('ETALON', etalon);
  console.log('OBJECT', obj);
  console.log('------------------');
})

function readTeachSet() {
  return fs.readFileSync('../lab1/src/testTeach.txt')
    .toString()
    .split('\n')
    .map(str => ({
      val: str.slice(0, -1),
      _class: str.slice(str.length - 1)
    }))
}

function readExamSet() {
  return fs.readFileSync('../lab1/src/withoutMarks.txt')
    .toString()
    .split('\n')
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

  console.log(mistakeObjects.map(obj => obj._class).join(' '));
  console.log('------------------');

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