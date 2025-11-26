require('dotenv').config();

const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT'
];

const optionalEnvVars = {
    'CLOUD_NAME': 'Cloudinary cloud name',
    'API_KEY': 'Cloudinary API key',
    'API_SECRET': 'Cloudinary API secret',
    'SENDGRID_API_KEY': 'SendGrid API key for emails',
    'SHOP_NAME': 'Shop name for emails',
    'FROM_EMAIL': 'Email sender address (bắt buộc nếu dùng OTP)',
    'EMAIL_PASSWORD': 'Email password (bắt buộc nếu dùng Gmail thay vì SendGrid)',
    'CLIENT_URL': 'Frontend URL',
    'GOOGLE_CLIENT_ID': 'Google OAuth Client ID (cho đăng nhập Google)',
    'GOOGLE_CLIENT_SECRET': 'Google OAuth Client Secret (cho đăng nhập Google)'
};

const validateEnv = () => {
    const missing = [];
    const warnings = [];

    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    // Check optional variables and warn
    Object.keys(optionalEnvVars).forEach(varName => {
        if (!process.env[varName]) {
            warnings.push({ varName, description: optionalEnvVars[varName] });
        }
    });

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\nPlease set these variables in your .env file.');
        process.exit(1);
    }

    if (warnings.length > 0) {
        console.warn('⚠️  Missing optional environment variables (some features may not work):');
        warnings.forEach(({ varName, description }) => {
            console.warn(`   - ${varName}: ${description}`);
        });
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security.');
    }

    console.log('✅ Environment variables validated successfully.');
};

module.exports = validateEnv;

