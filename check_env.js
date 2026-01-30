try {
    require('dotenv').config();
    console.log('DOTENV LOADED SUCCESS');
    console.log('AZURE_TENANT_ID:', '|' + process.env.AZURE_TENANT_ID + '|');
} catch (e) {
    console.error('ERROR LOADING DOTENV:', e.message);
}
