const models = require("../models");
const db = require("../config/connection");

module.export = async (modelName, collectionName) => {
  try {
    let modelExists = await models[modelName].db.db
      .listCollections({ name: collectionName })
      .toArray();

    if (modelExists.length) {
      await db.dropCollection(collectionName);
    }
  } catch (error) {}
};
