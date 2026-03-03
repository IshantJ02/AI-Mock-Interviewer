const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Interview statistics
    stats: {
        totalInterviews: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        totalQuestionsAnswered: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastInterviewDate: { type: Date },
    },

    // Skill heatmap - tracks performance per topic (0-100)
    skillMap: {
        arrays: { type: Number, default: 0 },
        strings: { type: Number, default: 0 },
        linkedLists: { type: Number, default: 0 },
        trees: { type: Number, default: 0 },
        graphs: { type: Number, default: 0 },
        dynamicProgramming: { type: Number, default: 0 },
        recursion: { type: Number, default: 0 },
        slidingWindow: { type: Number, default: 0 },
        twoPointers: { type: Number, default: 0 },
        binarySearch: { type: Number, default: 0 },
        sorting: { type: Number, default: 0 },
        hashMaps: { type: Number, default: 0 },
        heaps: { type: Number, default: 0 },
        backtracking: { type: Number, default: 0 },
        greedy: { type: Number, default: 0 },
    },

    // Weak topics for targeted recommendation
    weakTopics: [{ type: String }],

    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Hash password before saving — Mongoose v9: async middleware must return promise, not call next()
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
