const mongoose = require('mongoose');

const customTourSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 day']
    },
    groupSize: {
        type: Number,
        required: [true, 'Group size is required'],
        min: [1, 'Group size must be at least 1 person']
    },
    requestDetails: {
        type: String,
        required: [true, 'Request details are required'],
        minlength: [10, 'Please provide more details about your request']
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'contacted', 'completed', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CustomTour = mongoose.model('CustomTour', customTourSchema);

module.exports = CustomTour; 