import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter a name'],
    minLength: [3, 'Name must be at least 3 characters'],
    maxLength: [100, 'Name must be less than 100 characters'],
  },
  groupChat: { type: Boolean, default: false },
  aiEnabled: { type: Boolean, default: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
