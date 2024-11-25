/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./utils/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    // Option 1: Use a connection URL
    url: "postgresql://aisaas_owner:jnYZKI4lxy1g@ep-calm-unit-a56zby6i.us-east-2.aws.neon.tech/aisaas?sslmode=require",
    
    // Option 2: Use individual connection details (comment out one option)
    // host: "ep-calm-unit-a56zby6i.us-east-2.aws.neon.tech",
    // database: "aisaas",
    // user: "aisaas_owner",
    // password: "jnYZKI4lxy1g",
    // ssl: true,
  },
};
