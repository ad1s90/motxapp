const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const gradeSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expedity: {
      type: Number,
      required: true,
    },
    expertise: {
      type: Number,
      required: true,
    },
    willingness: {
      type: Number,
      required: true,
    },
    helpfulness: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;
