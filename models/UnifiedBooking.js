const mongoose = require('mongoose');

const unifiedBookingSchema = new mongoose.Schema({
    // Common fields for all booking types
    bookingType: {
        type: String,
        enum: ['tour', 'excursion', 'activity', 'transfer', 'custom'],
        required: [true, 'Booking type is required']
    },
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
    // Reference to the booked item (could be any type)
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Item ID is required'],
        refPath: 'itemModel'
    },
    itemModel: {
        type: String,
        required: true,
        enum: ['Tour', 'Excursion', 'Activity', 'Transfer']
    },
    itemName: {
        type: String,
        required: [true, 'Item name is required']
    },
    // Date and participants
    date: {
        type: Date,
        required: [true, 'Booking date is required']
    },
    numberOfPeople: {
        type: Number,
        required: [true, 'Number of people is required'],
        min: [1, 'At least one person is required']
    },
    // For transfers, additional passenger details (optional)
    passengers: {
        adults: {
            type: Number,
            default: 1,
            min: [0, 'Adults count cannot be negative']
        },
        children: {
            type: Number,
            default: 0,
            min: [0, 'Children count cannot be negative']
        },
        infants: {
            type: Number,
            default: 0,
            min: [0, 'Infants count cannot be negative']
        }
    },
    // Price details
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    // Additional details
    message: {
        type: String,
        trim: true
    },
    // Booking status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster queries
unifiedBookingSchema.index({ bookingType: 1, status: 1 });
unifiedBookingSchema.index({ itemId: 1, email: 1, date: 1 });
unifiedBookingSchema.index({ createdAt: -1 });

const UnifiedBooking = mongoose.model('UnifiedBooking', unifiedBookingSchema);

module.exports = UnifiedBooking; 