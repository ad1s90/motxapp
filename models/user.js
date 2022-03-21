const mongoose = require('mongoose');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    role: {
      type: mongoose.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    jmbg: {
      type: String,
      required: true,
      unique: true,
    },
    businessUnit: {
      type: mongoose.Types.ObjectId,
      ref: 'BusinessUnit',
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoose_fuzzy_searching, {
  fields: [
    { name: 'firstName', prefixOnly: false, weight: 10 },
    { name: 'lastName', prefixOnly: false, weight: 5 },
  ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
