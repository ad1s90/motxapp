const mongoose = require('mongoose');

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

const BusinessUnit = mongoose.model('BusinessUnit', businessUnitSchema);

module.exports = BusinessUnit;
