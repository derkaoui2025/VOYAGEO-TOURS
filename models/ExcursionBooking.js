const mongoose = require('mongoose');

const excursionBookingSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    excursionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Excursion',
        required: [true, 'Excursion ID is required']
    },
    excursionDate: {
        type: Date,
        required: [true, 'Excursion date is required']
    },
    guestCount: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: [1, 'At least one guest is required'],
        max: [20, 'Maximum 20 guests allowed per booking']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: function() {
            // Only required if the excursion has a price
            return this.totalPrice !== undefined;
        }
    },
    phone: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
excursionBookingSchema.index({ excursionId: 1, email: 1, excursionDate: 1 });

const ExcursionBooking = mongoose.model('ExcursionBooking', excursionBookingSchema);

module.exports = ExcursionBooking; 