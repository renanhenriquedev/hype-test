const apps = [];

const FieldValue = {
  serverTimestamp: jest.fn(() => ({ __type: 'serverTimestamp' })),
  delete: jest.fn(() => ({ __type: 'delete' })),
};

const credential = {
  cert: jest.fn((x) => x),
};

const initializeApp = jest.fn((options) => {
  const created = { options };
  apps.push(created);
  return created;
});

const app = jest.fn(() => apps[0]);

const auth = jest.fn(() => ({
  verifyIdToken: jest.fn(),
}));

const firestore = Object.assign(
  jest.fn(() => ({
    collection: jest.fn(),
    runTransaction: jest.fn(),
  })),
  { FieldValue }
);

const storage = jest.fn(() => ({
  bucket: jest.fn(),
}));

const admin = {
  apps,
  initializeApp,
  app,
  credential,
  auth,
  firestore,
  storage,
};

module.exports = admin;
module.exports.default = admin;
module.exports.__esModule = true;
