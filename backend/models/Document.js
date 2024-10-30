const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const documentSchema = new mongoose.Schema({
    longtext: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

// Add auto-increment functionality for the `id`
documentSchema.plugin(AutoIncrement, { inc_field: 'id' });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
