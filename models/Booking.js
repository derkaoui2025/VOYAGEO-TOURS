const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'Tour ID is required']
    },
    tourDate: {
        type: Date,
        required: [true, 'Tour date is required']
    },
    guestCount: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: [1, 'At least one guest is required'],
        max: [20, 'Maximum 20 guests allowed per booking']
    },
    specialRequests: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
bookingSchema.index({ tourId: 1, email: 1, tourDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 