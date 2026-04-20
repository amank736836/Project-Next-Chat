import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'rejected'],
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Request = mongoose.models.Request || mongoose.model('Request', requestSchema);

export default Request;
