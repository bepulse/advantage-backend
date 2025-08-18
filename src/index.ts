import 'dotenv/config';
import container from "./container";

const httpServer = container.resolve("httpServer");

httpServer.listen(process.env.PORT);

console.log(`Server is running on port ${process.env.PORT}`);