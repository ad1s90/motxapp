const mongoose = require('mongoose');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

const Schema = mongoose.Schema;

const businessUnitSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  number: {
    type: Number,
    required: true,
    unique: true,
  },
});

businessUnitSchema.plugin(mongoose_fuzzy_searching, {
  fields: [{ name: 'name', prefixOnly: false, weight: 10 }],
});

const BusinessUnit = mongoose.model('BusinessUnit', businessUnitSchema);

module.exports = BusinessUnit;
