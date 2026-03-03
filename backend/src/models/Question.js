const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    topic: { type: String, required: true }, // e.g. 'Dynamic Programming'
    tags: [String],
    examples: [{
        input: String,
        output: String,
        explanation: String,
    }],
    constraints: [String],
    optimalComplexity: {
        time: String,  // e.g. 'O(n log n)'
        space: String, // e.g. 'O(n)'
    },
    hints: [String],
    companyMode: { type: String, enum: ['Google', 'Amazon', 'Meta', 'Startup', 'General'], default: 'General' },
    type: { type: String, enum: ['DSA', 'Behavioral', 'System Design'], default: 'DSA' },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
