function addValues(...values) {
  return values.reduce((acc, val) => acc + val);
}

module.exports = {
  addValues
};
