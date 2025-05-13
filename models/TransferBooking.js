const mongoose = require('mongoose');

const transferBookingSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    transferId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transfer',
        required: [true, 'Transfer ID is required']
    },
    transferDate: {
        type: Date,
        required: [true, 'Transfer date is required']
    },
    passengerCount: {
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
    language: {
        type: String,
        default: 'English'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    phone: {
        type: String,
        trim: true
    },
    specialRequests: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
transferBookingSchema.index({ transferId: 1, email: 1, transferDate: 1 });

const TransferBooking = mongoose.model('TransferBooking', transferBookingSchema);

module.exports = TransferBooking; 