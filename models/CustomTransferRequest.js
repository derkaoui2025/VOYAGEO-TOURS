const mongoose = require('mongoose');

const customTransferRequestSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    startCity: {
        type: String,
        required: [true, 'Start city is required'],
        trim: true
    },
    endCity: {
        type: String,
        required: [true, 'End city is required'],
        trim: true
    },
    departureDate: {
        type: Date,
        required: [true, 'Departure date is required']
    },
    departureTime: {
        type: String,
        required: [true, 'Departure time is required'],
        trim: true
    },
    passengerCount: {
        type: Number,
        required: [true, 'Passenger count is required'],
        min: [1, 'At least one passenger is required']
    },
    additionalInfo: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'confirmed', 'completed', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
customTransferRequestSchema.index({ email: 1, createdAt: -1 });

const CustomTransferRequest = mongoose.model('CustomTransferRequest', customTransferRequestSchema);

module.exports = CustomTransferRequest; 