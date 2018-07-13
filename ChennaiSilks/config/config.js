var config = {};
config.dbHost = process.env.DB_HOST;
config.dbName = process.env.DB_NAME;
config.port = process.env.PORT;
config.folderName = process.env.ZIP_FOLDER_NAME || 'bulk';
config.overDueDays = process.env.OVERDUE_DAYS || 5;
config.recentDays = process.env.RECENT_DAYS || 7;
config.authEmail = "chennaisilks@payodaweb.com";
config.password = "payoda@123";

module.exports = config;
