const mongoose = require('mongoose');
const { Schema } = mongoose;

const matchSchema = new Schema({
    players: [{
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }],
    problem: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'ongoing', 'finished', 'abandoned'],
        default: 'ongoing'
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    timeLimitSeconds: {
        type: Number,
        default: 1800 // 30 minutes
    }
}, {
    timestamps: true
});

const Match = mongoose.model('match', matchSchema);

module.exports = Match;
