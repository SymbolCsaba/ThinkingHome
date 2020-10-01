const WebAccessTable = db.defineTable('WebAccess', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp().index(),
    User: db.ColTypes.int(11).index(),
    Uri: db.ColTypes.varchar(100).index(),
    Session: db.ColTypes.varchar(100),
    RemoteIp: db.ColTypes.varchar(64).index(),
    Browser: db.ColTypes.longtext(),
  },
  keys: [
    db.KeyTypes.foreignKey('User').references('User', 'Id').cascade(),
    db.KeyTypes.index('Session', 'User'),
  ],
});

const WebAccess = {

  Insert(user, uri, session, remoteip, browser) {
    return WebAccessTable.insert({ User: user, Uri: uri.substring(0, 100), Session: session, RemoteIp: remoteip, Browser: browser });
  },

};

module.exports = WebAccess;