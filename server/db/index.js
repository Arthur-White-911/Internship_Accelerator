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
  interviewHistory: new Datastore({ filename: path.join(dbDir, 'interview.db'), autoload: true }),
  enrollments: new Datastore({ filename: path.join(dbDir, 'enrollments.db'), autoload: true }),
  trainingSessions: new Datastore({ filename: path.join(dbDir, 'training_sessions.db'), autoload: true }),
  jobs: new Datastore({ filename: path.join(dbDir, 'jobs.db'), autoload: true }),
};

// 建立索引
db.users.ensureIndex({ fieldName: 'account', unique: true });
db.notifications.ensureIndex({ fieldName: 'userId' });
db.assessments.ensureIndex({ fieldName: 'userId' });
db.chatHistory.ensureIndex({ fieldName: 'userId' });
db.trainingRecords.ensureIndex({ fieldName: 'userId' });
db.interviewHistory.ensureIndex({ fieldName: 'userId' });
db.enrollments.ensureIndex({ fieldName: 'userId' });
db.trainingSessions.ensureIndex({ fieldName: 'userId' });
db.jobs.ensureIndex({ fieldName: 'publish_date' });
db.jobs.ensureIndex({ fieldName: 'district' });
db.jobs.ensureIndex({ fieldName: 'category' });
db.jobs.ensureIndex({ fieldName: 'source_platform' });

// Promise 封装工具
const promisify = (fn) => (...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, result) => (err ? reject(err) : resolve(result)))
  );

const makeUpdateAsync = (store) => (query, update, opts = {}) =>
  new Promise((resolve, reject) =>
    store.update(query, update, opts, (err, n) => (err ? reject(err) : resolve(n)))
  );

const makeRemoveAsync = (store) => (query, opts = {}) =>
  new Promise((resolve, reject) =>
    store.remove(query, opts, (err, n) => (err ? reject(err) : resolve(n)))
  );

// users
db.users.findOneAsync = promisify(db.users.findOne.bind(db.users));
db.users.findAsync = promisify(db.users.find.bind(db.users));
db.users.insertAsync = promisify(db.users.insert.bind(db.users));
db.users.updateAsync = makeUpdateAsync(db.users);

// notifications
db.notifications.findAsync = promisify(db.notifications.find.bind(db.notifications));
db.notifications.findOneAsync = promisify(db.notifications.findOne.bind(db.notifications));
db.notifications.insertAsync = promisify(db.notifications.insert.bind(db.notifications));
db.notifications.updateAsync = makeUpdateAsync(db.notifications);
db.notifications.removeAsync = makeRemoveAsync(db.notifications);
db.notifications.countAsync = promisify(db.notifications.count.bind(db.notifications));

// assessments
db.assessments.findAsync = promisify(db.assessments.find.bind(db.assessments));
db.assessments.findOneAsync = promisify(db.assessments.findOne.bind(db.assessments));
db.assessments.insertAsync = promisify(db.assessments.insert.bind(db.assessments));

// chatHistory
db.chatHistory.findAsync = promisify(db.chatHistory.find.bind(db.chatHistory));
db.chatHistory.insertAsync = promisify(db.chatHistory.insert.bind(db.chatHistory));
db.chatHistory.removeAsync = makeRemoveAsync(db.chatHistory);

// trainingRecords
db.trainingRecords.findAsync = promisify(db.trainingRecords.find.bind(db.trainingRecords));
db.trainingRecords.insertAsync = promisify(db.trainingRecords.insert.bind(db.trainingRecords));

// interviewHistory
db.interviewHistory.findAsync = promisify(db.interviewHistory.find.bind(db.interviewHistory));
db.interviewHistory.insertAsync = promisify(db.interviewHistory.insert.bind(db.interviewHistory));

// enrollments
db.enrollments.findAsync = promisify(db.enrollments.find.bind(db.enrollments));
db.enrollments.findOneAsync = promisify(db.enrollments.findOne.bind(db.enrollments));
db.enrollments.insertAsync = promisify(db.enrollments.insert.bind(db.enrollments));
db.enrollments.updateAsync = makeUpdateAsync(db.enrollments);

// trainingSessions
db.trainingSessions.findAsync = promisify(db.trainingSessions.find.bind(db.trainingSessions));
db.trainingSessions.insertAsync = promisify(db.trainingSessions.insert.bind(db.trainingSessions));

// jobs
db.jobs.findAsync = promisify(db.jobs.find.bind(db.jobs));
db.jobs.findOneAsync = promisify(db.jobs.findOne.bind(db.jobs));
db.jobs.insertAsync = promisify(db.jobs.insert.bind(db.jobs));
db.jobs.countAsync = promisify(db.jobs.count.bind(db.jobs));
db.jobs.updateAsync = makeUpdateAsync(db.jobs);
db.jobs.removeAsync = makeRemoveAsync(db.jobs);

module.exports = db;
