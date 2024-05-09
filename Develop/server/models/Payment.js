const mongoose = require('mongoose');

const{Schema} = mongoose;
const Family = require('./Family');

const paymentSchema = new Schema({
    reckonId: {
        type: String,
    },
    FamilyId: 
        {
          type: Schema.Types.ObjectId,
          ref: 'Family'
        }
      ,
    Items: [],
    total: {
        type: Number,
    },
    Status: {
        type: String,
    }


})

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;