// Updated GenuisPay API calls

import axios from 'axios';

const GENUISPAY_URL = process.env.GENUISPAY_URL;

export const createPayment = async (req, res) => {
    try {
        const requestId = `request-${Date.now()}`;
        console.log(`[${requestId}] Starting payment creation`);

        // Extract necessary data from request body
        const { amount, metadata, webhook_url } = req.body;
        console.log(`[${requestId}] Received request data:`, req.body);

        // Make an API call to GeniusPay
        const response = await axios.post(GENUISPAY_URL, {
            amount,
            metadata,
            webhook_url,
        }, {
            headers: {
                'X-API-Key': process.env.GENIUS_API_KEY,
                'X-API-Secret': process.env.GENIUS_API_SECRET,
            }
        });
        console.log(`[${requestId}] Received response:`, response.data);

        return res.status(200).json(response.data);
    } catch (error) {
        console.error(`[${requestId}] Error during payment creation:`, error);
        return res.status(500).json({ error: 'Payment creation failed' });
    }
};
