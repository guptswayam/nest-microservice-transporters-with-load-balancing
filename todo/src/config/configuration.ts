export default () => ({
  app: {
    serviceName: process.env.SERVICE_NAME,
    port: process.env.HTTP_PORT,
    host: process.env.HTTP_HOST,
    url: `${process.env.HTTP_HOST}:${process.env.HTTP_PORT}`
  }
});