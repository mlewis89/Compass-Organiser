const mongoose =  require('mongoose');

mongoose.connect(process.env.MONGODB_ULI || 'mongodb://127.0.0.1/scout-compass');

module.exports = mongoose.connection;
