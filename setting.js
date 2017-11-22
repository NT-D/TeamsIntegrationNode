exports.documentDbOptions = {
    host: process.env.COSMOS_DB_URI, 
    masterKey: process.env.COSMOS_DB_KEY, 
    database: process.env.DB_NAME,   
    collection: process.env.COLLECTION_NAME
};