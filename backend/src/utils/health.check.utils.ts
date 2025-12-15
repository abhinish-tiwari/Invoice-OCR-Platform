import { env } from "../config/env";

const healthCheck = async (_req, res) => {
	res.status(200).json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		service: 'invoice-ocr-api',
		environment: env.NODE_ENV,
	});
}

export default healthCheck;
