exports.DATABASE_URL = process.env.MONGODB_URI ||
    global.DATABASE_URL || 'mongodb://localhost/tempNeighborFoodsDb';

exports.PORT = process.env.PORT || 8080;

exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
    global.DATABASE_URL || 'mongodb://localhost/test-tempNeighborFoodsDb';