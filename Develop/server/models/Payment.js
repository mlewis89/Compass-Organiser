const mongoose = require('mongoose');

const{Schema} = mongoose;
const Family = require('./Family');

const paymentSchema = new Schema({
    reckonId: {
        type: String,
    },
    familyId: 
        {
          type: Schema.Types.ObjectId,
          ref: 'Family'
        }
      ,
    items: [],
    total: {
        type: Number,
    },
    status: {
        type: String,
    }


})

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;