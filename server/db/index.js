const Datastore = require('nedb');
const path = require('path');

const dbDir = path.join(__dirname, '../data');
require('fs').mkdirSync(dbDir, { recursive: true });

const db = {
  users: new Datastore({ filename: path.join(dbDir, 'users.db'), autoload: true }),
  notifications: new Datastore({ filename: path.join(dbDir, 'notifications.db'), autoload: true }),
  assessments: new Datastore({ filename: path.join(dbDir, 'assessments.db'), autoload: true }),
  chatHistory: new Datastore({ filename: path.join(dbDir, 'chat.db'), autoload: true }),
  trainingRecords: new Datastore({ filename: path.join(dbDir, 'training.db'), autoload: true }),
};

// 建立索引
db.users.ensureIndex({ fieldName: 'account', unique: true });
db.notifications.ensureIndex({ fieldName: 'userId' });
db.assessments.ensureIndex({ fieldName: 'userId' });
db.chatHistory.ensureIndex({ fieldName: 'userId' });
db.trainingRecords.ensureIndex({ fieldName: 'userId' });

// Promise 封装
const promisify = (fn) => (...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, result) => (err ? reject(err) : resolve(result)))
  );

db.users.findOneAsync = promisify(db.users.findOne.bind(db.users));
db.users.findAsync = promisify(db.users.find.bind(db.users));
db.users.insertAsync = promisify(db.users.insert.bind(db.users));
db.users.updateAsync = (query, update, opts = {}) =>
  new Promise((resolve, reject) =>
    db.users.update(query, update, opts, (err, n) => (err ? reject(err) : resolve(n)))
  );

db.notifications.findAsync = promisify(db.notifications.find.bind(db.notifications));
db.notifications.findOneAsync = promisify(db.notifications.findOne.bind(db.notifications));
db.notifications.insertAsync = promisify(db.notifications.insert.bind(db.notifications));
db.notifications.updateAsync = (query, update, opts = {}) =>
  new Promise((resolve, reject) =>
    db.notifications.update(query, update, opts, (err, n) => (err ? reject(err) : resolve(n)))
  );
db.notifications.removeAsync = (query, opts = {}) =>
  new Promise((resolve, reject) =>
    db.notifications.remove(query, opts, (err, n) => (err ? reject(err) : resolve(n)))
  );
db.notifications.countAsync = promisify(db.notifications.count.bind(db.notifications));

db.assessments.findAsync = promisify(db.assessments.find.bind(db.assessments));
db.assessments.findOneAsync = promisify(db.assessments.findOne.bind(db.assessments));
db.assessments.insertAsync = promisify(db.assessments.insert.bind(db.assessments));

db.chatHistory.findAsync = promisify(db.chatHistory.find.bind(db.chatHistory));
db.chatHistory.insertAsync = promisify(db.chatHistory.insert.bind(db.chatHistory));
db.chatHistory.removeAsync = (query, opts = {}) =>
  new Promise((resolve, reject) =>
    db.chatHistory.remove(query, opts, (err, n) => (err ? reject(err) : resolve(n)))
  );

db.trainingRecords.findAsync = promisify(db.trainingRecords.find.bind(db.trainingRecords));
db.trainingRecords.insertAsync = promisify(db.trainingRecords.insert.bind(db.trainingRecords));

module.exports = db;
