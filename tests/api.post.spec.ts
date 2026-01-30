import { test } from '../fixtures/azure-api.fixture';
import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('POST API Automation Tests', () => {

    test('POST /api/v1/customers - should create customer with multipart data', async ({ api }) => {
        // Read payload from file
        const payloadPath = path.join(__dirname, '../tests/fixtures/customer_payload.json');
        console.log(payloadPath);
        const customerData = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));

        console.log(customerData);
        // Read image file
        const imagePath = path.join(__dirname, '../tests/fixtures/test_image.png');
        const imageBuffer = fs.readFileSync(imagePath);
        console.log(imagePath);
        console.log(imageBuffer);
        // Construct multipart data
        const multipartData = {
            ...customerData,
            photo: {
                name: 'test_image.png',
                mimeType: 'image/png',
                buffer: imageBuffer
            }
        };
        console.log(multipartData);
        const response = await api.postMultipart<any>('/api/v1/customers', multipartData);
        console.log("RESPONSE", response);
        expect(response.status).toBe('success');
        expect(response.data).toHaveProperty('customerId');
    });
});