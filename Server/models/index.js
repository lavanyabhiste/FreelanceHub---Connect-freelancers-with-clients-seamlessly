const User = require('./User');
const Project = require('./Project');
const Application = require('./Application');
const Chat = require('./Chat');
const Message = require('./Message');
const Review = require('./Review');
const Transaction = require('./Transaction');
const Notification = require('./Notification');

module.exports = {
  User,
  Project,
  Application,
  Proposal: Application, // Convenient alias
  Chat,
  Message,
  Review,
  Transaction,
  Notification,
};
