const utils = require('ethereumjs-util')
const abiUtils = require('ethereumjs-abi')

const approveAbiMethod = {"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"type":"function"}
findCollision(approveAbiMethod)

function findCollision(method){
  // get target
  const targetMethodId = getMethodId(method)
  // prepare checker
  const inputTypes = method.inputs.map(input => input.type)
  const hasher = createSigHasher(inputTypes)
  // iterater over names
  let index = 1
  while (true) {
    if (index % 100000 === 0) {
      // 4 bytes => 256 ** 4 = 4294967296
      const percent = 100 * index / 4294967296
      console.log(`${index} attempts made (${percent.toFixed(2)}% average)`)
    }
    // generate next name
    // cant start with a number so we start with "$"
    const newName = '$' + index.toString(16)
    // skip actual name
    if (newName === method.name) continue
    const hash = hasher(newName)
    if (hash.equals(targetMethodId)) {
      console.log(`collision found: "${newName}"`)
      process.exit()
    }
    index++
  }
}

function getMethodId(method){
  return abiUtils.methodID(method.name, method.inputs.map(input => input.type))
}

function createSigHasher(types){
  const typesPart = '(' + types.map(elementaryName).join(',') + ')'
  return (name) => {
    const sigContent = name + typesPart
    return utils.sha3(new Buffer(sigContent)).slice(0, 4)
  }
}

function elementaryName (name) {
  if (name.startsWith('int[')) {
    return 'int256' + name.slice(3)
  } else if (name === 'int') {
    return 'int256'
  } else if (name.startsWith('uint[')) {
    return 'uint256' + name.slice(4)
  } else if (name === 'uint') {
    return 'uint256'
  } else if (name.startsWith('fixed[')) {
    return 'fixed128x128' + name.slice(5)
  } else if (name === 'fixed') {
    return 'fixed128x128'
  } else if (name.startsWith('ufixed[')) {
    return 'ufixed128x128' + name.slice(6)
  } else if (name === 'ufixed') {
    return 'ufixed128x128'
  }
  return name
}